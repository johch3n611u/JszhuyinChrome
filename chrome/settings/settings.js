'use strict';

/**
 * JSZhuyin Web IME — 設定頁邏輯
 */

const DEFAULTS = { enabled: false, toggleKey: 'Shift', toggleCount: 2 };

const $toggleKey = document.getElementById('toggleKey');
const $toggleCount = document.getElementById('toggleCount');
const $statusBadge = document.getElementById('statusBadge');
const $countLabel = document.getElementById('countLabel');

// Load current settings
chrome.storage.local.get(DEFAULTS, (result) => {
  $toggleKey.value = result.toggleKey || 'Shift';
  $toggleCount.value = result.toggleCount || 2;
  updateStatusBadge(result.enabled);
  updateCountLabel(result.toggleCount || 2);
});

// Listen for external changes (e.g. double-tap toggle)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  if (changes.toggleKey) {
    $toggleKey.value = changes.toggleKey.newValue || 'Shift';
  }
  if (changes.toggleCount) {
    const v = changes.toggleCount.newValue || 2;
    $toggleCount.value = v;
    updateCountLabel(v);
  }
  if (changes.enabled) {
    updateStatusBadge(changes.enabled.newValue);
  }
});

// Save on change
$toggleKey.addEventListener('change', () => {
  chrome.storage.local.set({ toggleKey: $toggleKey.value });
});

$toggleCount.addEventListener('input', () => {
  const v = Math.max(1, Math.min(5, parseInt($toggleCount.value, 10) || 2));
  $toggleCount.value = v;
  updateCountLabel(v);
  chrome.storage.local.set({ toggleCount: v });
});

function updateStatusBadge(enabled) {
  if (enabled) {
    $statusBadge.textContent = 'ON';
    $statusBadge.className = 'badge badge-on';
  } else {
    $statusBadge.textContent = 'OFF';
    $statusBadge.className = 'badge badge-off';
  }
}

function updateCountLabel(v) {
  $countLabel.textContent = String(v);
}
