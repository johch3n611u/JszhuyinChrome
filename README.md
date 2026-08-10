# JSZhuyin Web IME — Chrome 擴充套件注音輸入法

## 出處

- **注音引擎**：[timdream/jszhuyin](https://github.com/timdream/jszhuyin) v1.1.2（MIT License）
- **詞庫**：[McBopomofo](https://github.com/openvanilla/McBopomofo)（MIT License）
- **本專案**（jszhuyin-chrome）基於上述開源專案，封裝為 Chrome Manifest V3 擴充套件

## 開發原因

本專案為解決 **air-gap（氣隙隔離）公司環境** 中無法使用雲端注音輸入法的問題而開發。由於企業內網完全隔離外網，一般基於雲端服務的輸入法無法使用。JSZhuyin 是已知第一個完全使用前端 JavaScript 技術實作的自動選字注音輸入法，本專案將其包裝為 Chrome 擴充套件，達成：

- ✅ **完全離線**：字典檔（3.3MB）內嵌於擴充套件中，不需任何網路連線
- ✅ **純前端執行**：所有斷詞、選字邏輯在使用者本機瀏覽器內完成
- ✅ **不依賴 OS IME**：在任意網頁的 `<input>` / `<textarea>` / `contenteditable` 中直接輸入
- ✅ **支援 React / Vue 受控元件**：使用原生 value setter + InputEvent 寫入

---

## 功能摘要

### 注音輸入
- **標準注音鍵盤**（倚天 layout 暫未實作）：`1`=ㄅ、`2`=ㄉ、`3`=ˇ、`4`=ˋ、`5`=ㄓ、`6`=ˊ、`7`=˙、`8`=ㄚ、`9`=ㄞ、`0`=ㄢ、`-`=ㄦ、`Q`=ㄆ、`W`=ㄊ…（完整對應見 `src/ui/layout-mapper.js`）
- **自動選字**：基於 McBopomofo 詞庫的積分排序
- **詞組輸入**：支援最長 6 音節的詞組斷詞
- **組字浮層**：注音符號 + 底線顯示在 caret 下方
- **候選窗**：每頁 9 個候選，帶數字標號
- **選字**：Shift+1–9 選取對應候選；滑鼠點擊候選
- **翻頁**：Shift+←/→ 翻頁
- **確認**：Enter 確認第一候選；Backspace 刪除最後一個注音符號；Escape 取消組字
- **全形標點**：逗號 `,` → `，`、句號 `.` → `。`、分號 `;` → `；`、`[` `]` → `『』` 等

### 引擎架構
- 引擎跑在 content script **主線程**（與頁面共用 isolated world），不經過 Worker
- 字典檔 `data/database.data`（3.3MB）以 `chrome.runtime.getURL` fetch 後透過 `ArrayBuffer` 載入
- 使用 `JSZhuyin` 類別（`DATA_ARRAY_BUFFER` 跳過非同步載入）

### 開關控制
- **工具列按鈕**：點擊 extension icon 切換 on/off，badge 顯示 `ON`
- **鍵盤快捷鍵**（可自訂）：右側修飾鍵連擊切換
  - 預設：**雙擊右 Shift**（快速按兩次，間隔 < 500ms）
  - 可在設定頁自訂按鍵（Shift / Ctrl / Alt / Meta）與連擊次數（1–5）

### 設定頁（Options）
- 右鍵 extension → **選項** 或在 `chrome://extensions` → 詳細資料 → 擴充功能選項
- 可調整項目：
  - **Toggle 鍵**：Shift / Ctrl / Alt / Meta（僅偵測鍵盤右側按鍵）
  - **連按次數**：1–5（需要多快內連續點擊才會觸發切換）

---

## 專案結構

```
jszhuyin-chrome/
  manifest.json              # Chrome MV3 manifest
  background.js              # Service worker（狀態管理 + badge 更新）
  settings/
    settings.html            # 設定頁 HTML
    settings.js              # 設定頁邏輯
  src/
    ui/
      layout-mapper.js       # 標準注音鍵盤對應（移植自 lib/web.js）
      caret.js               # caret 定位（Range rect / mirror div）
      overlay.js             # shadow DOM 浮層（組字 + 候選）
    ime-client.js            # JSZhuyin 引擎封裝（主線程模式）
    content-script.js        # 主整合：鍵盤攔截、toggle、commit
  lib/                       # jszhuyin 引擎（從 npm v1.1.2 複製）
    bopomofo_encoder.js
    jsZhuyin_data_pack.js
    storage.js
    data_loader.js
    client.js
    jsZhuyin.js
    jsZhuyin_server.js
    worker.js
  data/
    database.data            # 字典檔（3.3MB，McBopomofo 詞庫）
  page/
    test.html                # 本地冒煙測試頁
```

---

## 安裝方式

1. 開啟 `chrome://extensions`
2. 啟用「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選取 `F:\BLProjects\jszhuyin-chrome\` 目錄

## 使用方式

1. 點擊工具列圖示，badge 顯示 `ON` 表示啟用
2. 在任何網頁的輸入框（input / textarea / contenteditable）中直接輸入注音
3. 候選字出現後，用 Shift+數字選字，或按 Enter 確認第一候選
4. 雙擊右 Shift 可快速切換開關（可在設定頁自訂）

---

## 設定

1. 在擴充功能圖示上點右鍵 → **選項**
2. 設定 Toggle 鍵（預設 Shift）與連按次數（預設 2）
3. 設定即時儲存，所有分頁同步生效

---

## 已知限制

- 只支援標準注音鍵盤，尚未實作倚天 layout
- jszhuyin 原為手機輸入法設計，部分桌面 IME 行為（純數字選字、上下鍵、空白選第一候選）與主流桌面注音略有差異
- 字典需在可聯網環境下載（已內嵌於專案中）

## 授權

MIT License（繼承自 jszhuyin 與 McBopomofo）
