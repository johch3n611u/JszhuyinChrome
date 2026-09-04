#requires -Version 5.1
<#
.SYNOPSIS
  01-Detect.ps1 — 偵測本機環境，判斷「離線部署微軟注音」需要的資訊。
.DESCRIPTION
  在任一台 Windows 上執行（免管理員）。會印出：
    - OS 版本 / 組建（判斷要抓哪個版本的 FOD：24H2=26100, 25H2=26200）
    - 架構（amd64 / arm64）
    - 目前是否已有 zh-Hant-TW 語言與微軟注音 tip（B115690A-…）
    - 是否為管理員（決定能否在本機直接查 capability / 部署）
    - 聯網探測（判斷這台能不能當「抓包預備機」）
  可選 -OutProfile 把重點（build/arch）存成 JSON，供 02-Stage-FOD.ps1 對齊。
.PARAMETER OutProfile
  選用。把 組建/架構/是否已裝 zh-Hant 等存成 JSON（例如 -OutProfile machine.json）。
.EXAMPLE
  .\01-Detect.ps1
  .\01-Detect.ps1 -OutProfile machine.json
#>
[CmdletBinding()]
param(
    [string]$OutProfile = ''
)

function T([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function OK($m)        { Write-Host "OK   $m" -ForegroundColor Green }
function WR($m)        { Write-Host "!!   $m" -ForegroundColor Yellow }
function ER($m)        { Write-Host "XX   $m" -ForegroundColor Red }

$ErrorActionPreference = 'Continue'

# ---------- 基本環境 ----------
T '基本環境'
$os = Get-CimInstance Win32_OperatingSystem
$nv = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' -ErrorAction SilentlyContinue
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

OK ("系統    : {0}" -f $os.Caption)
OK ("組建    : {0}   (DisplayVersion: {1})" -f $os.BuildNumber, $nv.DisplayVersion)
OK ("架構    : {0}" -f $env:PROCESSOR_ARCHITECTURE)
OK ("管理員  : {0}" -f $isAdmin)

$buildNum = $os.BuildNumber
$archTag  = if ($env:PROCESSOR_ARCHITECTURE -eq 'AMD64') { 'amd64' } elseif ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x86' }
WR ('離線部署需要的 FOD ISO 必須與「目標機」同版本。組建速查：24H2≈26100，25H2≈26200。')

# ---------- 語言/微軟注音現況 ----------
T '微軟注音 / 語言現況'
$langs = $null
try { $langs = Get-WinUserLanguageList } catch { ER ("無法讀語言清單: {0}" -f $_.Exception.Message) }
if ($langs) {
    $zh = $langs | Where-Object { $_.LanguageTag -eq 'zh-Hant-TW' }
    if ($zh) {
        OK '已存在 zh-Hant-TW（繁體中文台灣）語言'
        $tips = @($zh.InputMethodTips) -join '; '
        OK ("InputMethodTips: {0}" -f $tips)
        if ($tips -match 'B115690A') { OK '已含「微軟注音」tip —— 這台已能直接打注音（可當參考機）' }
        else                         { WR '有 zh-Hant 但未見微軟注音 tip，跑 20-Enable-Bopomofo.ps1 補上' }
    } else {
        WR 'zh-Hant-TW 尚未加入此使用者語言清單（需先離線部署語言功能，再跑 20-Enable-Bopomofo.ps1）'
    }
    $other = foreach ($l in $langs) { if ($l.LanguageTag) { "{0}  =>  {1}" -f $l.LanguageTag, (@($l.InputMethodTips) -join ',') } }
    if ($other) { T '本機其他語言/輸入法'; $other }
}

# ---------- capability 狀態 ----------
T 'zh-Hant 語言功能（capability）狀態'
if ($isAdmin) {
    try {
        $caps = Get-WindowsCapability -Online | Where-Object { $_.Name -like 'Language*zh-Hant-TW*' } | Select-Object Name, State
        if ($caps) { $caps | Format-Table -AutoSize | Out-String | Write-Host } else { WR '尚未安裝任何 zh-Hant-TW 語言功能' }
    } catch { ER ("查 capability 失敗: {0}" -f $_.Exception.Message) }
} else {
    WR '非管理員，無法查 capability 狀態。離線部署要裝的名稱如下（10-Deploy 會自動對應）：'
    'Language.Basic~~~zh-Hant-TW~0.0.1.0        ← 必裝，微軟注音在內'
    'Language.Handwriting~~~zh-Hant-TW~0.0.1.0  ← 選配'
    'Language.OCR~~~zh-Hant-TW~0.0.1.0          ← 選配'
    'Language.Speech~~~zh-Hant-TW~0.0.1.0       ← 選配'
    'Language.TextToSpeech~~~zh-Hant-TW~0.0.1.0 ← 選配'
}

# ---------- 網路探測 ----------
T '網路探測（判斷能否當「抓包預備機」）'
foreach ($u in @('https://www.microsoft.com', 'https://download.microsoft.com')) {
    try { $null = Invoke-WebRequest -Uri $u -Method Head -TimeoutSec 8 -UseBasicParsing; OK "可達 $u" }
    catch { WR "無法 $u  （air-gap 內屬正常；抓包要在聯網機做）" }
}

# ---------- 輸出 profile ----------
if ($OutProfile) {
    try {
        $p = [ordered]@{
            Caption        = $os.Caption
            BuildNumber    = $buildNum
            DisplayVersion = $nv.DisplayVersion
            Arch           = $archTag
            IsAdmin        = $isAdmin
            HasZhHantTW    = [bool]($langs | Where-Object { $_.LanguageTag -eq 'zh-Hant-TW' })
            Generated      = (Get-Date).ToString('s')
        }
        $p | ConvertTo-Json | Set-Content -Path $OutProfile -Encoding UTF8
        OK "機器 profile 已存：$OutProfile"
    } catch { ER ("寫 profile 失敗: {0}" -f $_.Exception.Message) }
}

Write-Host ''
Write-Host '下一步：' -ForegroundColor Cyan
Write-Host '  1) 聯網機：取得「同版本」FOD ISO → 02-Stage-FOD.ps1 -SourcePath <掛載點> -Arch <arch>'
Write-Host '  2) air-gap 目標機(管理員)：10-Deploy-Language.ps1 → 20-Enable-Bopomofo.ps1'
