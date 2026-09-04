'use strict';
/**
 * View — StatusBarItem 顯示組字字串與候選字清單。
 */

const vscode = require('vscode');

let compBar = null;
let candBar = null;
let toggleBar = null;
let page = 0;
const PER_PAGE = 9;
let currentCandidates = [];

function init(context) {
  // 組字顯示（右側，注音符號 + 底線）
  compBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 999);
  compBar.name = 'JSZhuyin 組字';
  compBar.hide();

  // 候選字顯示（右側）
  candBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 998);
  candBar.name = 'JSZhuyin 候選';
  candBar.tooltip = 'Shift+數字選字 | Shift+←→翻頁 | Enter確認 | Esc取消';
  candBar.hide();

  // 開關按鈕（左側）
  toggleBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  toggleBar.name = 'JSZhuyin 開關';
  toggleBar.text = '$(circle-slash) 注音';
  toggleBar.tooltip = '點擊切換注音輸入法開關';
  toggleBar.command = 'jszhuyin.toggle';
  toggleBar.show();

  context.subscriptions.push(compBar, candBar, toggleBar);
}

function update(state) {
  if (!state) return;

  if (state.symbols) {
    compBar.text = '$(edit) ' + state.symbols + ' _';
    compBar.show();
  } else {
    compBar.hide();
  }

  if (state.candidates && state.candidates.length > 0) {
    currentCandidates = state.candidates;
    page = 0;
    _renderCandidates();
    candBar.show();
  } else {
    candBar.hide();
  }
}

function clear() {
  compBar.hide();
  candBar.hide();
  currentCandidates = [];
  page = 0;
}

function nextPage() {
  if ((page + 1) * PER_PAGE >= currentCandidates.length) return;
  page++;
  _renderCandidates();
}

function prevPage() {
  if (page === 0) return;
  page--;
  _renderCandidates();
}

function _renderCandidates() {
  const start = page * PER_PAGE;
  const slice = currentCandidates.slice(start, start + PER_PAGE);
  if (slice.length === 0) {
    candBar.hide();
    return;
  }

  const parts = slice.map(function(c, i) {
    return (i + 1) + '.' + c[0];
  });

  const hasPrev = page > 0;
  const hasNext = (page + 1) * PER_PAGE < currentCandidates.length;
  if (hasPrev) parts.push('◀');
  if (hasNext) parts.push('▶');

  candBar.text = parts.join('  ');
}

function updateStatusBar(enabled) {
  if (!toggleBar) return;
  toggleBar.text = enabled ? '$(check) 注音' : '$(circle-slash) 注音';
}

function dispose() {
  if (compBar) { compBar.dispose(); compBar = null; }
  if (candBar) { candBar.dispose(); candBar = null; }
  if (toggleBar) { toggleBar.dispose(); toggleBar = null; }
}

module.exports = { init, update, clear, nextPage, prevPage, updateStatusBar, dispose };
