#requires -Version 5.1
<#
.SYNOPSIS
  02-Stage-FOD.ps1 — 在「聯網預備機」把 FOD ISO / cab 資料夾裡需要的語言功能 cab「收割」到 staged\。
.DESCRIPTION
  輸入掛載的 FOD ISO 根目錄（或解壓後的資料夾），自動找到
    Microsoft-Windows-LanguageFeatures-Basic-zh-Hant-*.cab   ← 微軟注音在內（必裝）
  並視 -IncludeExtras 連 Handwriting / OCR / Speech / TextToSpeech 一起收。
  會挑「最高版本」的 cab、複製到 staged\、計算 sha256、寫 manifest.json。
  (cab 內版本 10.0.26100.x 對 25H2(26200)/24H2(26100) 皆屬正常，來源須與目標 OS 同版。)

  抓包來源：企業大量授權 VLSC / MSDN 的「Windows 11 … Features on Demand (x64)」ISO。
.PARAMETER SourcePath
  必填。FOD ISO 掛載點（如 E:\）或內含 *.cab 的資料夾。
.PARAMETER Arch
  目標架構。預設依執行機自動判斷（amd64 最常見）。
.PARAMETER IncludeExtras
  選配。連 Handwriting / OCR / Speech / TextToSpeech 一起收（只打注音不一定要）。
.PARAMETER OutDir
  輸出資料夾，預設本資料夾下的 staged。
.EXAMPLE
  .\02-Stage-FOD.ps1 -SourcePath E:\
  .\02-Stage-FOD.ps1 -SourcePath E:\ -Arch amd64 -IncludeExtras
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$SourcePath,
    [string]$Arch = '',
    [switch]$IncludeExtras,
    [string]$OutDir = 'staged'
)

function T([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function OK($m)        { Write-Host "OK   $m" -ForegroundColor Green }
function WR($m)        { Write-Host "!!   $m" -ForegroundColor Yellow }
function ER($m)        { Write-Host "XX   $m" -ForegroundColor Red; Write-Output "`n"; exit 1 }

$ErrorActionPreference = 'Stop'

# 決定架構
if (-not $Arch) {
    $Arch = switch ($env:PROCESSOR_ARCHITECTURE) {
        'AMD64' { 'amd64' }; 'ARM64' { 'arm64' }; 'x86' { 'x86' }; default { 'amd64' }
    }
}

# 解析來源資料夾
$src = $null
try { $src = (Resolve-Path -Path $SourcePath -ErrorAction Stop).Path } catch { ER "找不到 SourcePath：$SourcePath" }
if (-not (Test-Path -Path $src -PathType Container)) { ER 'SourcePath 需是資料夾（掛載的 FOD ISO 根目錄，或含 *.cab 的解壓資料夾）' }
T "來源資料夾：$src   架構：$Arch"

# 要收的種類（capability 對應的 cab 檔名樣式）
$kinds = [ordered]@{
    Basic        = '*LanguageFeatures-Basic-zh-Hant*'
    Handwriting  = '*LanguageFeatures-Handwriting-zh-Hant*'
    OCR          = '*LanguageFeatures-Ocr-zh-Hant*'
    Speech       = '*LanguageFeatures-Speech-zh-Hant*'
    TextToSpeech = '*LanguageFeatures-TextToSpeech-zh-Hant*'
}
$needed = @('Basic')
if ($IncludeExtras) { $needed += @('Handwriting','OCR','Speech','TextToSpeech') }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$OutDir = (Resolve-Path -Path $OutDir).Path

$cabs = Get-ChildItem -Path $src -Recurse -File -Filter '*.cab' -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "*~$Arch~~*" }

$manifest = @()
foreach ($k in $needed) {
    $matches = $cabs | Where-Object { $_.Name -like $kinds[$k] }
    if (-not $matches) {
        if ($k -eq 'Basic') { WR "未在來源找到 Basic-zh-Hant ($Arch) 的 cab —— 請確認掛載的是「同版本」FOD ISO 且 arch 正確" }
        else                { WR "未找到 $k-zh-Hant ($Arch)，略過（只打注音可接受）" }
        continue
    }
    # 挑版本號最高者（檔名內有 10.0.xxxx.yyyy）
    $best = $matches | Sort-Object { try { [version]([regex]::Match($_.Name, '\d+\.\d+\.\d+\.\d+').Value) } catch { [version]'0.0.0.0' } } -Descending | Select-Object -First 1
    $target = Join-Path $OutDir $best.Name
    Copy-Item -Path $best.FullName -Destination $target -Force
    $sha = (Get-FileHash -Path $target -Algorithm SHA256).Hash
    $sizeMB = [math]::Round($best.Length / 1MB, 2)
    OK ("{0,-13} <- {1}  ({2} MB)" -f $k, $best.Name, $sizeMB)
    $manifest += [pscustomobject]@{ Kind = $k; File = $best.Name; SizeMB = $sizeMB; SHA256 = $sha; Arch = $Arch; Caption = $null }
}

if (-not $manifest) { ER '沒有收到任何 cab。請確認 FOD ISO 正確（同目標 OS 版本）或改用 -IncludeExtras 看看。' }

# 寫 manifest
$mObj = [pscustomobject]@{
    Generated = (Get-Date).ToString('s')
    Arch      = $Arch
    Note      = '部署端請確認目標 OS 與此 FOD 同版本(24H2≈26100 / 25H2≈26200)。微軟注音只需 Basic。'
    Files     = $manifest
}
$mf = Join-Path $OutDir 'manifest.json'
$mObj | ConvertTo-Json -Depth 5 | Set-Content -Path $mf -Encoding UTF8
OK "manifest 已寫：$mf"

T '完成'
Write-Host ("staged 資料夾：{0}" -f $OutDir)
Write-Host '把「整個 windows-zhuyin-deploy 資料夾」複製進 air-gap，然後在每台目標機：'
Write-Host ('  10-Deploy-Language.ps1 -StagedDir "{0}"   （以管理員執行）' -f $OutDir)
Write-Host '  20-Enable-Bopomofo.ps1                      （以使用者執行）'
