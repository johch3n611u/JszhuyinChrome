#requires -Version 5.1
<#
.SYNOPSIS
  10-Deploy-Language.ps1 — 在 air-gap 目標機「離線」安裝 zh-Hant-TW 語言功能（需系統管理員）。
.DESCRIPTION
  使用 02-Stage-FOD.ps1 產生的 staged\（內含 cab + manifest.json），以 DISM 離線
  Add-WindowsCapability（-LimitAccess，不連網）。
     Language.Basic~~~zh-Hant-TW~0.0.1.0   ← 微軟注音在內（必裝）
  staged\ 若還放了 Handwriting/OCR/Speech/TextToSpeech 的 cab，也會一併嘗試安裝。

  安裝對象：單機（本機）。要整批派送可改由 PDQ/SCCM/GPO 呼叫本腳本。
.PARAMETER StagedDir
  指向 02 產出的 staged 資料夾（含 *.cab）。也可直接給單一 .cab 檔（走 Add-Package）。
.PARAMETER AutoElevate
  非管理員時自動以「系統管理員」重新啟動（會彈 UAC）。
.PARAMETER SkipBuildCheck
  跳過 build 提醒（僅警告，不硬擋；真不符 DISM 會直接報錯）。
.PARAMETER LogFile
  執行 log（預設本機 deploy-log.txt）。
.EXAMPLE
  .\10-Deploy-Language.ps1 -StagedDir .\staged
  .\10-Deploy-Language.ps1 -StagedDir D:\tools\windows-zhuyin-deploy\staged -AutoElevate
#>
[CmdletBinding()]
param(
    [string]$StagedDir = 'staged',
    [switch]$AutoElevate,
    [switch]$SkipBuildCheck,
    [string]$LogFile = 'deploy-log.txt'
)

function T([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function OK($m)        { Write-Host "OK   $m" -ForegroundColor Green }
function WR($m)        { Write-Host "!!   $m" -ForegroundColor Yellow }
function ER($m)        { Write-Host "XX   $m" -ForegroundColor Red }
function Log($m)       { Add-Content -Path $LogFile -Value ("{0}  {1}" -f (Get-Date).ToString('s'), $m) -Encoding UTF8 }

$ErrorActionPreference = 'Stop'
$LogFile = [System.IO.Path]::GetFullPath($LogFile)   # 讓 elevation 重啟後 log 仍寫同一檔
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# 解析 StagedDir：轉成絕對路徑（elevation 重啟後 cwd 可能不同）
$StagedFull = [System.IO.Path]::GetFullPath($StagedDir)

# 若給的是單一 cab 檔，改走 Add-Package
$singleCab = $false
if (Test-Path -Path $StagedFull -PathType Leaf -ErrorAction SilentlyContinue) {
    if ($StagedFull -like '*.cab') { $singleCab = $true; $cabs = @(Get-Item -Path $StagedFull) }
    else { ER "StagedDir 不是資料夾也不是 .cab：$StagedFull"; exit 1 }
} elseif (Test-Path -Path $StagedFull -PathType Container -ErrorAction SilentlyContinue) {
    $cabs = @(Get-ChildItem -Path $StagedFull -File -Filter '*.cab' -ErrorAction SilentlyContinue)
    if (-not $cabs) { ER "staged 資料夾內沒有 .cab：$StagedFull （先跑 02-Stage-FOD.ps1）"; exit 1 }
} else {
    ER "找不到 StagedDir：$StagedFull"; exit 1
}

# ---------- 自動提升 ----------
if (-not $isAdmin) {
    if ($AutoElevate) {
        $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -StagedDir `"$StagedFull`""
        if ($SkipBuildCheck) { $argList += ' -SkipBuildCheck' }
        $argList += " -LogFile `"$LogFile`""
        WR '非管理員，正在以管理員身分重新啟動（請同意 UAC）…'
        try {
            Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $argList -Wait
        } catch { ER ("無法提升權限：{0}" -f $_.Exception.Message); exit 1 }
        Write-Host '（子視窗完成）'; exit 0
    }
    ER '本步驟需「系統管理員」。請在管理員 PowerShell 執行，或加 -AutoElevate。'
    exit 1
}

# ---------- build 提醒 ----------
$os = Get-CimInstance Win32_OperatingSystem
if (-not $SkipBuildCheck) {
    WR ("目標 OS 組建：{0}（{1}）—— 請確認 staged cab 來自「同版本」的 FOD ISO(24H2≈26100/25H2≈26200)。不符時 DISM 會報錯。" -f $os.BuildNumber, $os.Caption)
}

T ('staged 內容：{0}' -f $StagedFull)
$cabs | ForEach-Object { OK ("  {0}  ({1:N2} MB)" -f $_.Name, ($_.Length / 1MB)) }
Log "== 開始部署：$StagedFull  (OS {0})" -f $os.BuildNumber

# ---------- 安裝 ----------
$capFromName = {
    param([string]$n)
    if ($n -match 'LanguageFeatures-Basic')        { return 'Language.Basic~~~zh-Hant-TW~0.0.1.0' }
    if ($n -match 'LanguageFeatures-Handwriting')  { return 'Language.Handwriting~~~zh-Hant-TW~0.0.1.0' }
    if ($n -match 'LanguageFeatures-Ocr')          { return 'Language.OCR~~~zh-Hant-TW~0.0.1.0' }
    if ($n -match 'LanguageFeatures-Speech')       { return 'Language.Speech~~~zh-Hant-TW~0.0.1.0' }
    if ($n -match 'LanguageFeatures-TextToSpeech') { return 'Language.TextToSpeech~~~zh-Hant-TW~0.0.1.0' }
    return $null
}

$fail = 0
foreach ($cab in $cabs) {
    $capName = & $capFromName $cab.Name
    if (-not $capName) { WR "  略過無法對應能力名稱的 cab：$($cab.Name)"; continue }

    # 已安裝則跳過
    try {
        $state = (Get-WindowsCapability -Online -Name $capName -ErrorAction SilentlyContinue).State
        if ($state -eq 'Installed') { OK "  已安裝，跳過：$capName"; Log "跳過(已裝) $capName"; continue }
    } catch { }

    T ("安裝：$capName")
    if ($singleCab) {
        # 單檔：走 Add-Package（cab 即套件），並檢查 DISM exit code
        try {
            $null = & DISM.EXE /Online /Add-Package "/PackagePath:$($cab.FullName)" /NoRestart
            if ($LASTEXITCODE -ne 0) { throw "DISM 傳回 exit code $LASTEXITCODE" }
        } catch {
            WR ("  DISM 失敗：{0}" -f $_.Exception.Message)
            Log "失敗 $capName : $($_.Exception.Message)"; $fail++
        }
    } else {
        try {
            $res = Add-WindowsCapability -Online -Name $capName -Source $StagedFull -LimitAccess
            $res | ForEach-Object { if ($_ -is [string]) { Write-Host "  $_" } }
        } catch {
            WR ("  失敗：{0}" -f $_.Exception.Message)
            Log "失敗 $capName : $($_.Exception.Message)"; $fail++
        }
    }
}

# ---------- 結果 ----------
T '結果'
if ($fail -eq 0) {
    OK '所有語言功能已離線安裝完成。'
    Log '== 部署完成（成功）'
} else {
    ER ("有 {0} 項失敗，請看上方訊息與 {1}" -f $fail, $LogFile)
    Log '== 部署完成（有失敗）'
}
Write-Host ''
Write-Host '下一步（以「要使用注音的使用者」登入後）：'
Write-Host '  20-Enable-Bopomofo.ps1     再加「登出→登入→ Win+Space 切注音」'
