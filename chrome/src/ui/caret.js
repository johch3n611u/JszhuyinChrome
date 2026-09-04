'use strict';
(function(exports) {

/**
 * CaretTracker — 取得輸入框中文字游標（caret）的螢幕座標。
 *
 * 支援：
 *   - contenteditable 元素（用 Range.getBoundingClientRect）
 *   - input / textarea（用 mirror div 法模擬 caret 位置）
 *   - 捲動 / resize 監聽 → onMove 回呼
 */

var CaretTracker = function() {
  this._mirrorDiv = null;
  this._scrollTimeout = null;
};

CaretTracker.prototype = {
  /**
   * 取得游標的螢幕矩形（viewport-relative）。
   *
   * @param {HTMLElement} el 目前有焦點的可編輯元素。
   * @return {DOMRect|null} caret 的位置，或 null。
   */
  getCaretRect: function(el) {
    if (!el || !document.contains(el)) return null;

    // contenteditable
    if (el.isContentEditable || el.contentEditable === 'true') {
      return this._getContenteditableCaret(el);
    }

    // input / textarea
    if (typeof el.selectionStart === 'number') {
      return this._getInputCaret(el);
    }

    return null;
  },

  /**
   * contenteditable：透過 cloneRange 取得游標位置。
   */
  _getContenteditableCaret: function(el) {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;

    // 確認 selection 在 el 內
    var anchorNode = sel.anchorNode;
    if (!anchorNode || !el.contains(anchorNode)) return null;

    var range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);

    // 空 contenteditable — 用元素本身的 rect
    if (range.startContainer.nodeType === Node.ELEMENT_NODE &&
        range.startOffset === 0 &&
        (!el.textContent || el.textContent.length === 0)) {
      var r = el.getBoundingClientRect();
      // 取元素內第一行的起點
      return { left: r.left + 2, top: r.top + 2, bottom: r.bottom, width: 0, height: r.height,
               x: r.left + 2, y: r.top + 2,
               toJSON: function() { return this; } };
    }

    // 正常 caret — 取 range rect
    var rects = range.getClientRects();
    if (rects && rects.length > 0) {
      return rects[0];
    }
    // fallback：從 startContainer 建立一個 range 取 rect
    try {
      var r2 = document.createRange();
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        r2.setStart(range.startContainer, Math.max(0, range.startOffset - 1));
        r2.setEnd(range.startContainer, range.startOffset);
        var r2rects = r2.getClientRects();
        if (r2rects && r2rects.length > 0) {
          return r2rects[r2rects.length - 1];
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  },

  /**
   * input/textarea：mirror div 法。
   * 複製元素內容（到游標之前）到一個隱藏的 div，
   * 量測該 div 末尾字元的 rect。
   */
  _getInputCaret: function(el) {
    if (!this._mirrorDiv) {
      this._mirrorDiv = document.createElement('div');
      this._mirrorDiv.id = '__jszhuyin_mirror';
      this._mirrorDiv.style.cssText =
        'position:fixed;visibility:hidden;white-space:pre-wrap;word-break:break-all;' +
        'overflow:auto;pointer-events:none;top:0;left:0;z-index:-1;';
      document.body.appendChild(this._mirrorDiv);
    }

    var computed = window.getComputedStyle(el);
    var styles = [
      'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
      'letter-spacing', 'word-spacing', 'text-indent', 'text-transform',
      'line-height', 'padding', 'border', 'box-sizing',
      'white-space', 'word-break', 'overflow-wrap'
    ];
    var div = this._mirrorDiv;
    styles.forEach(function(p) {
      div.style[p] = computed.getPropertyValue(p);
    });

    // Match the input element's dimensions
    var rect = el.getBoundingClientRect();
    div.style.width = rect.width + 'px';
    div.style.height = 'auto';

    // Content before the caret
    var textBefore = el.value.substring(0, el.selectionStart);
    // Replace newlines so they render in the mirror div
    div.textContent = textBefore;

    // Add a marker span at the end to measure caret
    var marker = document.createElement('span');
    marker.textContent = el.value.charAt(el.selectionEnd) || '​'; // ZWSP
    div.appendChild(marker);

    var markerRect = marker.getBoundingClientRect();
    // Adjust for the div's own position (it's at top:0 left:0 fixed)
    return markerRect;
  },

  /**
   * 從元素的 bounding rect 推算若 caret 在元素內的大致位置。
   * 這只是 fallback；最好有實際 caret rect。
   */
  _estimateFromElement: function(el) {
    var r = el.getBoundingClientRect();
    return { left: r.left + 2, top: r.bottom + 2, bottom: r.bottom + 2,
             width: 0, height: 0,
             x: r.left + 2, y: r.bottom + 2,
             toJSON: function() { return this; } };
  },

  /**
   * 向 caret 回報「浮層已更新」，用來註冊捲動/resize 監聽。
   *
   * @param {function} cb onMove 回呼：當 caret 可能改變位置時呼叫。
   * @return {function} 取消監聽的函式。
   */
  watch: function(cb) {
    var self = this;
    var onScroll = function() {
      if (self._scrollTimeout) return;
      self._scrollTimeout = setTimeout(function() {
        self._scrollTimeout = null;
        cb();
      }, 50);
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', cb);

    return function unwatch() {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', cb);
    };
  },

  /**
   * 清除 mirror div（呼叫方自行決定何時清理）。
   */
  destroy: function() {
    if (this._mirrorDiv && this._mirrorDiv.parentNode) {
      this._mirrorDiv.parentNode.removeChild(this._mirrorDiv);
    }
    this._mirrorDiv = null;
  }
};

exports.CaretTracker = CaretTracker;

})(typeof self !== 'undefined' ? self : window);
