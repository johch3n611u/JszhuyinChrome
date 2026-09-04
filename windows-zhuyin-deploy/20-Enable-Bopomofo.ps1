#requires -Version 5.1
<#
.SYNOPSIS
  20-Enable-Bopomofo.ps1 — 為「目前登入的使用者」啟用 zh-Hant-TW 語言與微軟注音輸入法。
.DESCRIPTION
  以「要用注音的那個使用者」登入後，在「一般 PowerShell 視窗」執行（不要用 SSH/自動化，
  Set-WinUserLanguageList 需要互動式環境）。步驟：
    1) 若使用者語言清單沒有 zh-Hant-TW → 加入（需語言功能已離線部署，即 10-Deploy 完成）
    2) 確保該語言帶「微軟注音」tip（0404:{B115690A-…}）
    3) 提示：登出→登入一次，Win+Space 切注音
  只有在「真的有改動」時才寫回使用者設定；不會刪除原有語言/輸入法。
.PARAMETER MakeFirst
  選配。把 zh-Hant-TW 移到語言清單最前面（影響 Win+Space 預設切換順序）。
.PARAMETER LogFile
  log（預設 enable-log.txt，寫在使用者可寫位置）。
.EXAMPLE
  .\20-Enable-Bopomofo.ps1
  .\20-Enable-Bopomofo.ps1 -MakeFirst
#>
[CmdletBinding()]
param(
    [switch]$MakeFirst,
    [string]$LogFile = 'enable-log.txt'
)

# 微軟注音（Microsoft Bopomofo）TIP：0404(zh-Hant) + profile {B115690A-…}
$BOPO_LANG = 'zh-Hant-TW'
$BOPO_TIP  = '0404:{B115690A-EA02-48D5-A231-E3578D2FDF80}{B2F9C502-1742-11D4-9790-0080C882687E}'
$BOPO_GUID = 'B115690A'

function T([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function OK($m)        { Write-Host "OK   $m" -ForegroundColor Green }
function WR($m)        { Write-Host "!!   $m" -ForegroundColor Yellow }
function ER($m)        { Write-Host "XX   $m" -ForegroundColor Red }

$ErrorActionPreference = 'Continue'
$LogFile = [System.IO.Path]::GetFullPath($LogFile)
try { Add-Content -Path $LogFile -Value ("== 執行者：{0}  {1}" -f [Security.Principal.WindowsIdentity]::GetCurrent().Name, (Get-Date).ToString('s')) -Encoding UTF8 -ErrorAction SilentlyContinue } catch { }

$changed = $false

T '讀取目前語言清單'
$list = Get-WinUserLanguageList
$zh = $list | Where-Object { $_.LanguageTag -eq $BOPO_LANG }

# 1) 沒有 zh-Hant-TW → 加進去
if (-not $zh) {
    WR "語言清單沒有 $BOPO_LANG，嘗試加入…"
    try {
        $new = New-WinUserLanguageList $BOPO_LANG
        $item = $new | Where-Object { $_.LanguageTag -eq $BOPO_LANG } | Select-Object -First 1
        if (-not $item) { throw 'New-WinUserLanguageList 沒有傳回 zh-Hant-TW' }
        $list.Add($item) | Out-Null
        $zh = $item; $changed = $true
    } catch {
        ER ("加入語言失敗：{0}" -f $_.Exception.Message)
        ER '可能原因：語言功能尚未離線安裝（先跑 10-Deploy-Language.ps1），或此機不能離線加入語言。'
        ER '替代做法：設定 → 時間與語言 → 語言與地區 → 新增「中文(繁體，台灣)」。'
        exit 1
    }
} else {
    OK "已存在 $BOPO_LANG"
}

# 2) 確保帶「微軟注音」tip
$tipsNow = @($zh.InputMethodTips) -join ';'
if ($tipsNow -match $BOPO_GUID) {
    OK '已含微軟注音 tip（可直接 Win+Space 切換）'
} else {
    WR '未見微軟注音 tip，嘗試加入…'
    try {
        $zh.InputMethodTips.Add($BOPO_TIP) | Out-Null
        OK "已加入 tip：$BOPO_TIP"
        $changed = $true
    } catch {
        ER ("加入 tip 失敗：{0}  → 請在 設定→語言→中文(台灣)→鍵盤 勾選「微軟注音」" -f $_.Exception.Message)
    }
}

# 3) 選用：移到最前
if ($MakeFirst -and ($list | Where-Object { $_.LanguageTag -ne $BOPO_LANG })) {
    $langs2 = @($list | Where-Object { $_.LanguageTag -eq $BOPO_LANG })
    $rest   = @($list | Where-Object { $_.LanguageTag -ne $BOPO_LANG })
    $newList = [System.Collections.Generic.List[object]]::new()
    $langs2 + $rest | ForEach-Object { $newList.Add($_) | Out-Null }
    $list = $newList; $changed = $true
    OK '已把 zh-Hant-TW 移到最前面（Win+Space 優先切到它）'
}

# 4) 真的有改動才寫回
if ($changed) {
    T '寫回語言清單'
    try {
        Set-WinUserLanguageList $list
        OK '已寫回。'
    } catch {
        ER ("寫回失敗：{0}" -f $_.Exception.Message)
        ER '注意：Set-WinUserLanguageList 需要在「一般 PowerShell 視窗」執行（非 SSH/自動化）。'
        ER '若仍失敗，請手動在 設定 → 時間與語言 → 語言與地區 加入 中文(繁體，台灣)，並在鍵盤勾選「微軟注音」。'
    }
} else {
    OK '無需改動（zh-Hant-TW + 微軟注音已在語言清單）。'
}

T '完成'
Write-Host '接下來（重要）：'
Write-Host '  1) 登出 → 再登入一次（讓語言/輸入法生效）'
Write-Host '  2) 按 Win+Space（或 Win 鍵 + 空白）切到「注音」'
Write-Host '  3) 開 Word / 記事本打「ji3」應出現注音組字窗'
Write-Host '  4) （建議）切到注音後：IME 設定 → 關閉「線上建議」，確保安靜離線運作'
