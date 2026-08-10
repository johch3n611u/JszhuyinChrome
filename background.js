'use strict';

/**
 * JSZhuyin Web IME — Background Service Worker
 *
 * 出處：基於 timdream/jszhuyin（MIT License）https://github.com/timdream/jszhuyin
 * 開發原因：解決 air-gap（氣隙隔離）公司環境中無法使用雲端注音輸入法的問題，
 *          提供完全離線、純前端執行的繁體中文注音輸入法 Chrome 擴充套件。
 *
 * 功能：
 *   - 管理 enabled/toggleKey/toggleCount 設定（存於 chrome.storage.local）
 *   - 工具列按鈕切換開關 + 圖示 badge 更新
 *   - 監聽 storage 與 content script 訊息，同步更新圖示
 */

const DEFAULTS = { enabled: false, toggleKey: 'Shift', toggleCount: 2 };

// === Storage change listener ===
// Content script toggles via chrome.storage.local.set(); always keep icon in sync.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes.enabled) {
    updateIcon(changes.enabled.newValue);
  }
});

// === Message listener ===
// Content script sends { action: 'updateIcon', enabled } on toggle.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === 'updateIcon') {
    updateIcon(msg.enabled);
  }
});

// === Install ===
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (result) => {
    chrome.storage.local.set({
      enabled: result.enabled,
      toggleKey: result.toggleKey || 'Shift',
      toggleCount: result.toggleCount || 2
    });
    updateIcon(result.enabled);
  });
});

// === Startup ===
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (result) => {
    updateIcon(result.enabled);
  });
});

// === Toolbar button click ===
chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (result) => {
    const next = !result.enabled;
    chrome.storage.local.set({ enabled: next });
    updateIcon(next);
  });
});

function updateIcon(enabled) {
  const badge = enabled ? 'ON' : '';
  const color = enabled ? '#22c55e' : '#9ca3af';
  chrome.action.setBadgeText({ text: badge });
  chrome.action.setBadgeBackgroundColor({ color: color });
}
