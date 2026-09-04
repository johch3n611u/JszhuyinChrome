'use strict';
(function() {

/**
 * JSZhuyin Web IME — Content Script（主整合層）
 *
 * 出處：基於 timdream/jszhuyin（MIT License）https://github.com/timdream/jszhuyin
 * 開發原因：解決 air-gap（氣隙隔離）公司環境中無法使用雲端注音輸入法的問題，
 *          提供完全離線、純前端執行的繁體中文注音輸入法 Chrome 擴充套件。
 *
 * 功能：
 *   1. keydown capture 階段攔截鍵盤，把注音鍵餵給 ImeClient（主線程 JSZhuyin）。
 *   2. 引擎組字更新 → 浮層顯示；候選更新 → 浮層顯示。
 *   3. 字串 commit（compositionend）→ 寫回 input/textarea/contenteditable。
 *   4. 監聽 chrome.storage 的 enabled 切換 on/off。
 *   5. 可自訂的 toggleKey + toggleCount 連擊切換開關。
 */

/* global JSZhuyinLayoutMapper, CaretTracker, ImeOverlay, ImeClient */

// ---- state ----
var enabled = false;
var toggleKey = 'Shift';       // "Shift" | "Control" | "Alt" | "Meta" (KeyboardEvent.key)
var toggleCount = 2;           // number of taps to trigger toggle (default double-tap)
var toggleTimeout = 500;       // max ms between taps
var lastToggleKeyTime = 0;     // timestamp of last tap
var toggleTapN = 0;            // current tap count

var client = null;
var overlay = null;
var caretTracker = null;
var currentInput = null;
var isContentEditable = false;
var unwatchCaret = null;

var EDITABLE_INPUT_TYPES = [
  'text', 'search', 'url', 'email', 'tel', 'number', 'password',
  'date', 'month', 'week', 'time', 'datetime-local'
];

// ---- init / destroy ----

function initIME() {
  if (client && client._initialized) return Promise.resolve();

  if (!overlay) {
    overlay = new ImeOverlay();
    overlay.oncandidateselect = onOverlaySelect;
  }
  if (!caretTracker) {
    caretTracker = new CaretTracker();
  }

  client = new ImeClient();

  return client.init({
    oncompositionupdate: onCompositionUpdate,
    oncandidateschange: onCandidatesChange,
    oncompositionend: onCompositionEnd
  }).then(function() {
    console.log('[JSZhuyin IME] Engine ready.');
    updateOverlayPosition();
  }).catch(function(err) {
    console.error('[JSZhuyin IME] Failed to init engine:', err);
    enabled = false;
    syncToStorage();
  });
}

function destroyIME() {
  if (client && client.compositionActive && client.candidates[0]) {
    commitText(client.candidates[0][0]);
  }
  if (client) {
    client.unload();
    client = null;
  }
  if (overlay) {
    overlay.setCandidates([]);
    overlay.setComposition('');
  }
  if (unwatchCaret) {
    unwatchCaret();
    unwatchCaret = null;
  }
}

// ---- toggle: N-tap toggleKey to enable/disable ----

function checkToggleKey(evt) {
  // Only react to the RIGHT modifier (e.g. RightShift), not the left one.
  // This avoids conflicts with normal typing (LeftShift+letter for uppercase).
  if (evt.location !== KeyboardEvent.DOM_KEY_LOCATION_RIGHT) return false;

  var keyMatches = false;
  switch (toggleKey) {
    case 'Shift':    keyMatches = (evt.key === 'Shift');    break;
    case 'Control':  keyMatches = (evt.key === 'Control');  break;
    case 'Alt':      keyMatches = (evt.key === 'Alt');      break;
    case 'Meta':     keyMatches = (evt.key === 'Meta');     break;
    default: return false;
  }
  if (!keyMatches) return false;

  var now = Date.now();

  if (lastToggleKeyTime && (now - lastToggleKeyTime) <= toggleTimeout) {
    // Within the timeout window — increment tap count
    toggleTapN++;
  } else {
    // Too slow or first tap — reset
    toggleTapN = 1;
  }
  lastToggleKeyTime = now;

  if (toggleTapN >= toggleCount) {
    // Threshold reached — toggle!
    toggleTapN = 0;
    lastToggleKeyTime = 0;
    evt.preventDefault();
    evt.stopPropagation();

    var nextState = !enabled;
    setEnabled(nextState);
    syncToStorage();
    return true;
  }

  // Not enough taps yet — don't block the event
  return false;
}

// ---- keyboard interception ----

function handleKeyDown(evt) {
  // Check N-tap toggle BEFORE any enabled check (works both on and off)
  if (checkToggleKey(evt)) return;

  if (!enabled) return;

  // Ignore modifier chords (Ctrl/Meta/Alt — but not the toggleKey itself)
  if (evt.ctrlKey || evt.metaKey || evt.altKey) return;

  // Ignore when native IME is composing
  if (evt.isComposing) return;

  var el = getEditableElement();
  if (!el) return;

  // Track focus changes
  if (el !== currentInput) {
    if (client && client.compositionActive && client.candidates[0] && currentInput) {
      commitText(client.candidates[0][0]);
    }
    currentInput = el;
    isContentEditable = !('value' in el);
  }

  var code = evt.code;
  var shiftKey = evt.shiftKey;

  // ---- candidate selection (Shift+Digit 1–9) ----
  if (shiftKey && JSZhuyinLayoutMapper.isSelectionKey(code)) {
    var selIdx = JSZhuyinLayoutMapper.getSelectionIndexFromDOM3Code(code);
    if (selIdx !== -1 && client && client.compositionActive && overlay) {
      var candidate = overlay.selectAt(selIdx);
      if (candidate) {
        evt.preventDefault();
        var idx = client.candidates.indexOf(candidate);
        if (idx !== -1) client.selectCandidate(idx);
        return;
      }
    }
  }

  // ---- page navigation (Shift+← →) ----
  if (shiftKey && code === 'ArrowRight') {
    evt.preventDefault();
    if (overlay) overlay.nextPage();
    return;
  }
  if (shiftKey && code === 'ArrowLeft') {
    evt.preventDefault();
    if (overlay) overlay.prevPage();
    return;
  }

  // ---- get Bopomofo symbol from keyboard layout ----
  var symbol = JSZhuyinLayoutMapper.getSymbolFromDOM3Code(code, shiftKey);

  // Check if this is a special key we handle
  var isSpecialKey = (code === 'Enter' || code === 'Backspace' ||
                      code === 'Escape' || code === 'Space');

  if (!symbol && !isSpecialKey) {
    // If we're in the middle of composing, eat unrelated keys
    if (client && client.compositionActive) {
      evt.preventDefault();
    }
    return;
  }

  // Ensure client is initialized
  if (!client || !client._initialized) {
    initIME().then(function() {
      // Initialization is async; skip this keystroke.
    });
    // For now, prevent default to avoid typing raw symbols
    if (symbol && JSZhuyinLayoutMapper.isBopomofoSymbol(symbol)) {
      evt.preventDefault();
    }
    return;
  }

  // Send key to engine
  var key = symbol || code;
  var handled = client.handleKey(key);

  if (handled) {
    evt.preventDefault();
    evt.stopPropagation();
  } else {
    // Engine didn't eat this key — clear candidates if we had any
    if (overlay) overlay.setCandidates([]);
  }
}

// ---- engine callbacks ----

function onCompositionUpdate(symbols) {
  if (!overlay) return;
  overlay.setComposition(symbols);
  updateOverlayPosition();
}

function onCandidatesChange(candidates) {
  if (!overlay) return;
  overlay.setCandidates(candidates);
  updateOverlayPosition();
}

function onCompositionEnd(text) {
  if (!text) return;
  commitText(text);
  if (overlay) {
    overlay.setCandidates([]);
    overlay.setComposition('');
  }
}

// ---- overlay click selection ----

function onOverlaySelect(candidate) {
  if (!client || !client._initialized) return;
  var idx = client.candidates.indexOf(candidate);
  if (idx !== -1) {
    client.selectCandidate(idx);
  }
}

// ---- commit text back to input ----

function commitText(text) {
  var el = currentInput;
  if (!el || !document.contains(el)) {
    el = document.activeElement;
    if (!el || !isElementEditable(el)) return;
    currentInput = el;
    isContentEditable = !('value' in el);
  }

  try {
    if (isContentEditable) {
      commitToContenteditable(text, el);
    } else {
      commitToInput(text, el);
    }
  } catch (e) {
    console.error('[JSZhuyin IME] commitText error:', e);
  }
}

function commitToInput(text, el) {
  var proto = (el.tagName === 'TEXTAREA') ?
    HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  var nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;

  var selStart = el.selectionStart;
  var selEnd = el.selectionEnd;

  nativeSetter.call(el, el.value.substring(0, selStart) + text + el.value.substring(selEnd));

  var newPos = selStart + text.length;
  el.selectionStart = el.selectionEnd = newPos;

  el.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text,
    isComposing: false
  }));
}

function commitToContenteditable(text, el) {
  if (document.activeElement !== el && !el.contains(document.activeElement)) {
    el.focus();
  }

  var success = document.execCommand('insertText', false, text);
  if (!success) {
    fallbackInsertText(text);
  }
}

function fallbackInsertText(text) {
  var sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  var range = sel.getRangeAt(0);

  if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
    var textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    var node = range.startContainer;
    var offset = range.startOffset;
    node.textContent = node.textContent.substring(0, offset) + text +
      node.textContent.substring(offset);
    range.setStart(node, offset + text.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// ---- helpers ----

function getEditableElement() {
  var el = document.activeElement;
  return (el && isElementEditable(el)) ? el : null;
}

function isElementEditable(el) {
  if (!el) return false;
  if (el.isContentEditable || el.contentEditable === 'true') return true;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT' && EDITABLE_INPUT_TYPES.indexOf(el.type) !== -1) return true;
  return false;
}

function updateOverlayPosition() {
  if (!overlay || !currentInput) return;
  var rect = caretTracker.getCaretRect(currentInput);
  if (!rect) {
    rect = currentInput.getBoundingClientRect();
  }
  overlay.positionAt(rect.x || rect.left, rect.y || rect.bottom);

  if (!unwatchCaret) {
    unwatchCaret = caretTracker.watch(updateOverlayPosition);
  }
}

// ---- focus handling ----

function onFocusChange() {
  var el = getEditableElement();
  if (el !== currentInput) {
    if (client && client.compositionActive && client.candidates[0] && currentInput) {
      commitText(client.candidates[0][0]);
      if (overlay) {
        overlay.setCandidates([]);
        overlay.setComposition('');
      }
    }
    currentInput = el;
    isContentEditable = el ? !('value' in el) : false;
  }
}

document.addEventListener('focus', function(evt) {
  if (!enabled) return;
  var el = evt.target;
  if (isElementEditable(el)) {
    currentInput = el;
    isContentEditable = !('value' in el);
  }
}, true);

document.addEventListener('blur', function(evt) {
  if (!enabled) return;
  if (evt.target === currentInput) {
    setTimeout(onFocusChange, 0);
  }
}, true);

// ---- enable/disable + storage sync ----

function setEnabled(val) {
  enabled = val;
  if (enabled) {
    initIME();
  } else {
    destroyIME();
  }
}

function syncToStorage() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.storage.local.set({ enabled: enabled });
    // Also notify background to update the badge icon synchronously
    chrome.runtime.sendMessage({ action: 'updateIcon', enabled: enabled })
      .catch(function() { /* background may be inactive — no-op */ });
  }
}

function loadStateFromStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(
      { enabled: false, toggleKey: 'Shift', toggleCount: 2 },
      function(result) {
        toggleKey = result.toggleKey || 'Shift';
        toggleCount = result.toggleCount || 2;
        setEnabled(result.enabled);
      }
    );
  } else {
    // Local test mode — enabled by default
    setEnabled(true);
  }
}

if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName !== 'local') return;
    if (changes.enabled) {
      setEnabled(changes.enabled.newValue);
    }
    if (changes.toggleKey) {
      toggleKey = changes.toggleKey.newValue || 'Shift';
    }
    if (changes.toggleCount) {
      toggleCount = changes.toggleCount.newValue || 2;
    }
  });
}

// ---- start ----

document.addEventListener('keydown', handleKeyDown, true);
loadStateFromStorage();

})();
