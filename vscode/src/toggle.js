'use strict';
/**
 * Toggle — 雙擊按鍵切換邏輯（移植自 jszhuyin-chrome content-script.js）。
 *
 * 搭配 VS Code 的 configuration 機制，可在設定中自訂：
 *   - toggleKey ("Shift" | "Ctrl" | "Alt" | "Meta")
 *   - toggleCount (1–5)
 *   - toggleTimeout (200–2000ms)
 */

const vscode = require('vscode');

let toggleKey = 'Shift';
let toggleCount = 2;
let toggleTimeout = 500;
let lastTapTime = 0;
let tapCount = 0;

let _onToggle = null;

function init(onToggle) {
  _onToggle = onToggle;
  loadConfig();
}

function loadConfig() {
  const config = vscode.workspace.getConfiguration('jszhuyin');
  toggleKey = config.get('toggleKey', 'Shift');
  toggleCount = config.get('toggleCount', 2);
  toggleTimeout = config.get('toggleTimeout', 500);
}

// 監聽設定變更
vscode.workspace.onDidChangeConfiguration(function(e) {
  if (e.affectsConfiguration('jszhuyin')) {
    loadConfig();
  }
});

function onKeyDown(evt) {
  return false;
}

function tap() {
  const now = Date.now();
  if (tapCount > 0 && now - lastTapTime > toggleTimeout) {
    tapCount = 0;
  }
  tapCount++;
  lastTapTime = now;

  if (tapCount >= toggleCount) {
    tapCount = 0;
    lastTapTime = 0;
    if (typeof _onToggle === 'function') {
      _onToggle();
    }
    return true;
  }
  return false;
}

function getKey() { return toggleKey; }
function getCount() { return toggleCount; }
function getTimeout() { return toggleTimeout; }

module.exports = { init, onKeyDown, tap, getKey, getCount, getTimeout };
