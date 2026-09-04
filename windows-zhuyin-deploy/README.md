# Windows 微軟注音 離線部署包（air-gap / 免雲端）

**目標**：在 air-gap（完全離線）的 Windows 機器上啟用「微軟注音（Microsoft Bopomofo）」，
讓 **Word / Outlook / Teams / 任何一般桌面程式** 都能像原生輸入法一樣打 ㄅㄆㄇ 注音。

> **核心結論：不需要自己寫輸入法引擎。**
> Windows 11 內建「微軟注音」是標準 TSF IME，本體隨系統出廠
> （`C:\Windows\System32\InputMethod\CHT`）。只要離線把「繁體中文(台灣)的
> Basic typing 語言功能（FOD）」裝上、並把語言加進使用者清單，就能全系統使用、完全免雲。
> 本包就是把「抓包 → 驗證 → 離線部署 → 啟用」串起來的工具。

---

## 流程一覽（誰在哪裡跑）

| 步驟 | 在哪跑 | 腳本 | 做什麼 |
|---|---|---|---|
| 1. 偵測 | 聯網預備機（或任何一台） | `01-Detect.ps1` | 印出 OS 組建/架構、是否已裝 zh-Hant、微軟注音 tip 現況、網路通道 |
| 2. 抓包 | 聯網預備機 | `02-Stage-FOD.ps1` | 從 FOD ISO / cab 資料夾「收割」需要的 cab 到 `staged\`，產生 `manifest.json` |
| — | 把**整個資料夾**複製到 air-gap（USB/內網） | | |
| 3. 離線部署 | 目標機（**管理員**） | `10-Deploy-Language.ps1` | 用 `staged\` 的 cab 離線 `Add-WindowsCapability` |
| 4. 啟用輸入法 | 目標機（**該使用者**） | `20-Enable-Bopomofo.ps1` | 把 zh-Hant-TW + 微軟注音加進使用者語言列 |

裝完後：**登出再登入一次** → `Win+Space` 切到「注音」→ 開 Word 打字即可。

---

## 標準操作

### A. 聯網預備機（能上網、最好與目標機同為 Windows 11 的公司標準版）

```powershell
# 1) 偵測：記下 OS 組建（例：25H2 / build 26200）與架構（amd64）
.\01-Detect.ps1

# 2) 拿到「與目標機相同 OS 版本」的 Features on Demand ISO 後掛載（例 E:），收割：
.\02-Stage-FOD.ps1 -SourcePath E:\ -Arch amd64
#   → 產出 staged\ 資料夾 + manifest.json（內含 sha256，供 air-gap 內核對）
```

**FOD ISO 從哪來（二選一）：**
- **大量授權（VLSC / MSDN）**：下載「Windows 11 … Features on Demand（x64）」ISO。企業 air-gap 最常見的正規管道。
- **線上機先裝當參考**：若只是要「證明可行」，在能上網+有管理員的機器
  `Add-WindowsCapability -Online -Name Language.Basic~~~zh-Hant-TW~0.0.1.0`
  即可（但**不會**生出可拷貝的 cab，大批部屬仍要靠 FOD ISO 或公司內部 WSUS/ConfigMgr 的「選用功能」）。

### B. 每台 air-gap 目標機

```powershell
# 3) 以「系統管理員」執行（或用 -AutoElevate 彈 UAC）
.\10-Deploy-Language.ps1 -StagedDir .\staged

# 4) 以「要使用注音的使用者」執行（免管理員）
.\20-Enable-Bopomofo.ps1
```

登出→登入 → `Win+Space` 切到 注音 → 完成。

---

## 關鍵注意事項（先讀）

1. **來源必須「與目標 OS 同版本」的 FOD。** 組建速查：24H2 = **26100**、25H2 = **26200**
   （25H2 核心仍是 26100 系，cab 內版本號常是 `10.0.26100.x`，屬正常）。來源不符時
   DISM 會直接報錯，請回去拿對應版本的 FOD ISO——腳本只做警告、不硬擋。
2. **每台目標機要一次「本機管理員」**做 Add-Capability。大量機器建議走 IT 派送
   （PDQ / SCCM / GPO Startup Script），或讓使用者自行雙擊跑 `10-Deploy`（會彈 UAC）。
3. **只需 Basic（注音 IME 在內）。** Handwriting / OCR / Speech / TextToSpeech 是選配
   （鍵盤觸控手寫、語音那些），只要打字不需要；`02-Stage` 加 `-IncludeExtras` 才收。
4. **微軟注音本體不碰雲**，本機模式即可；建議在 IME 設定關掉「線上建議/候選」確保安靜。
5. **「家庭版/中國版」也能離線裝**——語言功能是選配，方法相同；差別只在能不能取得
   對應版本的 FOD ISO（通常是版權/通路問題，不是技術問題）。
6. 若目標機其實可達**公司內部 WSUS/ConfigMgr** 且已同步語言 FOD：
   直接「設定 → 時間與語言 → 語言與地區 → 新增 中文(繁體，台灣)」即可，**可跳過本包**。

---

## 檔案

```
windows-zhuyin-deploy/
  README.md                  ← 本檔
  01-Detect.ps1              偵測：組建/架構/zh-Hant/注音 tip/網路
  02-Stage-FOD.ps1           抓包：FOD ISO → staged\ 的 cab + manifest.json
  10-Deploy-Language.ps1     air-gap 目標機(管理員)：離線 Add-Capability
  20-Enable-Bopomofo.ps1     air-gap 目標機(使用者)：啟用 zh-Hant-TW + 微軟注音
  staged/                    （02 產出，會被打包帶進 air-gap）
```

**驗證方法**：裝完登入後開 Word/記事本 → `Win+Space` 切 注音 → 打 `ji3` 應得到組字窗並能選出「注」。

---

### 相關備註（why this over your JS engine）
你原本的 Chrome / VS Code / Obsidian JS 注音擴充（`chrome/`、`vscode/`、`obsidian/`）仍然保留，
作為「無法加語言功能的機器」或「只想在瀏覽器/編輯器內用」的後備。但「全 Windows 軟體都能用」的
正解是內建微軟注音離線部署，也就是本包做的事——**語言層不需要再開發**。
