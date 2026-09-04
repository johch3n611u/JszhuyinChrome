# JSZhuyin 注音輸入法 — VS Code 擴充套件

## 出處

- **注音引擎**：[timdream/jszhuyin](https://github.com/timdream/jszhuyin) v1.1.2（MIT License）
- **詞庫**：[McBopomofo](https://github.com/openvanilla/McBopomofo)（MIT License）
- **本專案**（JszhuyinVSCodeExtension）基於上述開源專案，封裝為 VS Code 擴充套件

## 開發原因

本專案為解決 **air-gap（氣隙隔離）公司環境** 中無法使用雲端注音輸入法的問題而開發。由於企業內網完全隔離外網，一般基於雲端服務的輸入法無法使用。JSZhuyin 是已知第一個完全使用前端 JavaScript 技術實作的自動選字注音輸入法，本專案將其包裝為 VS Code 擴充套件，達成：

- ✅ **完全離線**：字典檔（3.3MB）內嵌於擴充套件中，不需任何網路連線
- ✅ **純本機執行**：所有斷詞、選字邏輯在使用者本機 VS Code 內完成
- ✅ **不依賴 OS IME**：在編輯器中直接輸入繁體中文
- ✅ **零額外依賴**：引擎與詞庫完整內嵌

---

## 功能摘要

### 注音輸入
- **標準注音鍵盤**：`1`=ㄅ、`2`=ㄉ、`3`=ˇ、`4`=ˋ、`5`=ㄓ、`6`=ˊ、`7`=˙、`8`=ㄚ、`9`=ㄞ、`0`=ㄢ、`-`=ㄦ、`Q`=ㄆ、`W`=ㄊ…
- **自動選字**：基於 McBopomofo 詞庫的積分排序
- **詞組輸入**：支援最長 6 音節的詞組斷詞
- **組字顯示**：注音符號 + 底線顯示在狀態列
- **候選顯示**：狀態列顯示編號候選（每頁 9 個）
- **選字**：Shift+1–9 選取對應候選、Enter 確認第一候選
- **翻頁**：Shift+←/→ 翻頁
- **取消**：Escape 取消組字、Backspace 刪除最後一個注音符號
- **全形標點**：逗號 `,` → `，`、句號 `.` → `。` 等

### 引擎架構
- 引擎跑在 Node.js 主線程
- 字典檔 `data/database.data`（3.3MB）以 `fs.readFileSync` 載入
- 使用 `JSZhuyin` 類別（`DATA_ARRAY_BUFFER` 模式）

### 開關控制
- **狀態列按鈕**：點擊左側「注音」按鈕切換 on/off
- **鍵盤快捷鍵**：雙擊右 Shift（可在設定中自訂按鍵與次數）

### 設定
- 開啟 VS Code 設定 → Extensions → JSZhuyin 注音輸入法
- 可調整：
  | 設定項 | 預設值 | 說明 |
  |---|---|---|
  | `jszhuyin.toggleKey` | `"Shift"` | 切換鍵（Shift / Ctrl / Alt / Meta）|
  | `jszhuyin.toggleCount` | `2` | 連按次數（1–5）|
  | `jszhuyin.toggleTimeout` | `500` | 連按最大間隔（毫秒）|

---

## 注音鍵盤佈局對應表（標準 ETen 倚天鍵盤）

```
第一排: `=⋯  1=ㄅ  2=ㄉ  3=ˇ  4=ˋ  5=ㄓ  6=ˊ  7=˙  8=ㄚ  9=ㄞ  0=ㄢ  -=ㄦ  ==＝
第二排: Q=ㄆ  W=ㄊ  E=ㄍ  R=ㄐ  T=ㄔ  Y=ㄗ  U=ㄧ  I=ㄛ  O=ㄟ  P=ㄣ  [=「  ]=」  \=＼
第三排: A=ㄇ  S=ㄋ  D=ㄎ  F=ㄑ  G=ㄕ  H=ㄘ  J=ㄨ  K=ㄜ  L=ㄠ  ;=丶  '=、
第四排: Z=ㄈ  X=ㄌ  C=ㄏ  V=ㄒ  B=ㄖ  N=ㄙ  M=ㄩ  ,=，  .=。  /=？
Space=ˉ（輕聲）
```

### 打字範例

| 詞語 | 鍵盤輸入 | 對應注音 |
|---|---|---|
| 你好 | `su3cl3` | ㄋㄧˇㄏㄠˇ |
| 台北市 | `w961o3g4` | ㄊㄞˊㄅㄟˇㄕˋ |
| 今天 | `rupwu0` | ㄐㄧㄣㄊㄧㄢ |

---

## 專案結構

```
JszhuyinVSCodeExtension/
  package.json               # VS Code extension manifest
  .vscodeignore              # 打包排除
  .vscode/
    launch.json              # F5 啟動設定
  extension.js               # 主入口（activate / deactivate）
  src/
    server.js                # JSZhuyin 引擎封裝（Node.js 模式）
    view.js                  # StatusBarItem 組字/候選顯示
    toggle.js                # 雙擊切換邏輯
    editor.js                # 編輯器文字插入
  lib/                       # jszhuyin 引擎 v1.1.2（原封不動）
    jsZhuyin.js
    bopomofo_encoder.js
    storage.js
    jsZhuyin_data_pack.js
    data_loader.js
    client.js
    jsZhuyin_server.js
    worker.js
    layout-mapper.js         # 標準注音鍵盤對應（改為 CommonJS）
  data/
    database.data            # 字典檔（3.3MB，McBopomofo 詞庫）
```

---

## 安裝方式

### 開發模式（F5）
1. 用 VS Code 開啟此目錄
2. 按 `F5` → 選擇「Run Extension」→ 啟動 Extension Development Host
3. 新視窗中測試

### 從 VSIX 安裝
1. `npm install -g @vscode/vsce`
2. `vsce package`
3. VS Code → Extensions → `...` → Install from VSIX → 選取 `.vsix`

---

## 使用方式

1. 點擊狀態列左側「注音」按鈕 → 變為「✓ 注音」表示啟用
2. 在編輯器中輸入注音 → 狀態列顯示組字符號
3. 按 Enter 確認第一候選（文字寫入編輯器），或 Shift+1–9 選字
4. 再點擊按鈕關閉

---

## 授權

MIT License（繼承自 jszhuyin 與 McBopomofo）
