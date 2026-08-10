'use strict';
(function(exports) {

/**
 * ImeOverlay — 在 shadow DOM 內渲染的浮層元件。
 *
 * 浮層內容：
 *   - 組字字串（composition）：注音符號，帶閃爍底線
 *   - 候選字列（candidates）：帶數字標號（1–9），可點擊/數字鍵選取
 *   - 翻頁指示（← →，Shift+方向鍵翻頁）
 *
 * 浮層掛在 document.documentElement 上，用 position: fixed 與
 * z-index: 2147483647 確保壓過所有頁面元素。
 * Shadow DOM 內部樣式完全隔離頁面 CSS。
 */

var ImeOverlay = function() {
  this._host = null;
  this._shadow = null;
  this._candidates = [];
  this._page = 0;
  this._CANDIDATES_PER_PAGE = 9;

  this._createHost();
};

ImeOverlay.prototype = {

  // ---- public API ----

  /**
   * 顯示 / 更新組字字串（注音符號）。
   * 傳入空字串或 falsy 會隱藏組字列。
   *
   * @param {string} symbols 注音符號字串，e.g. 'ㄊㄞˊㄅㄟˇ'
   */
  setComposition: function(symbols) {
    var compEl = this._get('.composition-text');
    var lineEl = this._get('.composition-line');
    if (!symbols) {
      compEl.textContent = '';
      lineEl.style.display = 'none';
    } else {
      compEl.textContent = symbols;
      lineEl.style.display = 'block';
    }
  },

  /**
   * 設定候選字清單。
   * 傳入空陣列或 falsy 會隱藏候選列。
   *
   * @param {Array<[string, number]>} candidates 引擎的候選陣列
   */
  setCandidates: function(candidates) {
    this._candidates = candidates || [];
    this._page = 0;
    this._renderCandidates();
    if (this._candidates.length === 0) {
      this._hide();
    } else {
      this._show();
    }
  },

  /**
   * 將浮層定位到指定的 viewport 座標。
   * 候選窗會放在 (x, y) 下方。
   *
   * @param {number} x caret 左緣（px）
   * @param {number} y caret 底緣（px）
   */
  positionAt: function(x, y) {
    var host = this._host;
    if (!host) return;

    // Clamp to viewport
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var hostRect = host.getBoundingClientRect();

    var left = x;
    var top = y + 4; // 4px below caret

    // If too far right, shift left
    if (left + hostRect.width > vw - 8) {
      left = vw - hostRect.width - 8;
    }
    if (left < 4) left = 4;

    // If too far down, place above caret
    if (top + hostRect.height > vh - 8) {
      top = y - hostRect.height - 8;
      if (top < 4) top = 4;
    }

    host.style.left = left + 'px';
    host.style.top = top + 'px';
  },

  /**
   * 翻下一頁候選。
   */
  nextPage: function() {
    if ((this._page + 1) * this._CANDIDATES_PER_PAGE >= this._candidates.length) return;
    this._page++;
    this._renderCandidates();
  },

  /**
   * 翻上一頁候選。
   */
  prevPage: function() {
    if (this._page === 0) return;
    this._page--;
    this._renderCandidates();
  },

  /**
   * 根據 0-based index 選取候選（來自 Shift+Digit 或點擊）。
   * @return {[string, number]|null} 被選中的候選，或 null
   */
  selectAt: function(index) {
    var globalIndex = this._page * this._CANDIDATES_PER_PAGE + index;
    if (!this._candidates[globalIndex]) return null;
    return this._candidates[globalIndex];
  },

  /**
   * 回呼：當使用者在浮層上點擊候選字。
   * 設定此屬性以接收選取事件。
   * @type {function([string, number])|null}
   */
  oncandidateselect: null,

  /**
   * 完全移除浮層 DOM。
   */
  destroy: function() {
    if (this._host && this._host.parentNode) {
      this._host.parentNode.removeChild(this._host);
    }
    this._host = null;
    this._shadow = null;
  },

  // ---- internals ----

  _createHost: function() {
    var host = document.createElement('div');
    host.id = '__jszhuyin_overlay';
    // all: initial resets inherited properties; we override what we need
    host.style.cssText =
      'all:initial;position:fixed;top:0;left:0;z-index:2147483647;' +
      'pointer-events:none;display:none;';

    // Attach shadow DOM for complete CSS isolation
    var shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = this._buildHTML() + '<style>' + this._buildCSS() + '</style>';

    // Append to document
    (document.documentElement || document.body).appendChild(host);

    this._host = host;
    this._shadow = shadow;

    // Delegate clicks on candidate items
    shadow.addEventListener('mousedown', this._handleClick.bind(this));
  },

  _buildHTML: function() {
    return '' +
      '<div class="jszhuyin-container">' +
        '<div class="composition-line">' +
          '<span class="composition-label">組字：</span>' +
          '<span class="composition-text"></span>' +
        '</div>' +
        '<div class="candidates-list"></div>' +
        '<div class="pagination">' +
          '<span class="page-left">←</span>' +
          '<span class="page-info"></span>' +
          '<span class="page-right">→</span>' +
        '</div>' +
      '</div>';
  },

  _buildCSS: function() {
    return '' +
      '.jszhuyin-container {' +
        'font-family: "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif;' +
        'font-size: 16px;' +
        'line-height: 1.6;' +
        'color: #1a1a1a;' +
        'background: #ffffff;' +
        'border: 1px solid #d4d4d8;' +
        'border-radius: 8px;' +
        'box-shadow: 0 4px 16px rgba(0,0,0,0.15);' +
        'padding: 8px 12px;' +
        'max-width: 540px;' +
        'pointer-events: auto;' +
        'user-select: none;' +
      '}' +
      '.composition-line {' +
        'display: flex;' +
        'align-items: center;' +
        'margin-bottom: 6px;' +
        'display: none;' +
      '}' +
      '.composition-label {' +
        'color: #9ca3af;' +
        'font-size: 13px;' +
        'margin-right: 6px;' +
        'white-space: nowrap;' +
      '}' +
      '.composition-text {' +
        'font-size: 20px;' +
        'font-weight: 500;' +
        'color: #3b82f6;' +
        'border-bottom: 2px solid #3b82f6;' +
        'padding-bottom: 2px;' +
      '}' +
      '.candidates-list {' +
        'display: flex;' +
        'flex-wrap: wrap;' +
        'gap: 4px;' +
      '}' +
      '.candidate-item {' +
        'display: inline-flex;' +
        'align-items: baseline;' +
        'gap: 2px;' +
        'padding: 3px 8px;' +
        'background: #f4f4f5;' +
        'border-radius: 4px;' +
        'cursor: pointer;' +
        'transition: background 0.1s;' +
      '}' +
      '.candidate-item:hover {' +
        'background: #e4e4e7;' +
      '}' +
      '.candidate-item.selected {' +
        'background: #3b82f6;' +
        'color: #ffffff;' +
      '}' +
      '.candidate-index {' +
        'font-size: 10px;' +
        'color: #a1a1aa;' +
        'margin-right: 1px;' +
      '}' +
      '.candidate-item.selected .candidate-index {' +
        'color: rgba(255,255,255,0.7);' +
      '}' +
      '.candidate-text {' +
        'font-size: 16px;' +
      '}' +
      '.pagination {' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'gap: 8px;' +
        'margin-top: 6px;' +
        'font-size: 12px;' +
        'color: #a1a1aa;' +
      '}' +
      '.page-left, .page-right {' +
        'cursor: pointer;' +
        'color: #3b82f6;' +
        'font-weight: bold;' +
      '}';
  },

  _renderCandidates: function() {
    var listEl = this._get('.candidates-list');
    var paginationEl = this._get('.pagination');
    if (!listEl) return;

    // Clear
    listEl.innerHTML = '';

    var CPP = this._CANDIDATES_PER_PAGE;
    var start = this._page * CPP;
    var pageCands = this._candidates.slice(start, start + CPP);

    pageCands.forEach((function(candidate, i) {
      var item = document.createElement('span');
      item.className = 'candidate-item';
      if (i === 0) item.classList.add('selected'); // first is default
      item.setAttribute('data-index', i);

      var idx = document.createElement('span');
      idx.className = 'candidate-index';
      idx.textContent = (i + 1);

      var txt = document.createElement('span');
      txt.className = 'candidate-text';
      txt.textContent = candidate[0];

      item.appendChild(idx);
      item.appendChild(txt);
      listEl.appendChild(item);
    }).bind(this));

    // Pagination info
    var totalPages = Math.ceil(this._candidates.length / CPP);
    this._get('.page-left').style.display = (this._page > 0) ? 'inline' : 'none';
    this._get('.page-right').style.display = (this._page < totalPages - 1) ? 'inline' : 'none';
    this._get('.page-info').textContent = (this._page + 1) + '/' + totalPages;
  },

  _show: function() {
    if (this._host) this._host.style.display = '';
  },

  _hide: function() {
    if (this._host) this._host.style.display = 'none';
  },

  _handleClick: function(evt) {
    var item = evt.target.closest('.candidate-item');
    if (!item) return;
    var index = parseInt(item.getAttribute('data-index'), 10);
    if (isNaN(index)) return;

    evt.preventDefault();
    evt.stopPropagation();

    var candidate = this.selectAt(index);
    if (candidate && typeof this.oncandidateselect === 'function') {
      this.oncandidateselect(candidate);
    }
  },

  _get: function(selector) {
    return this._shadow ? this._shadow.querySelector(selector) : null;
  }
};

exports.ImeOverlay = ImeOverlay;

})(typeof self !== 'undefined' ? self : window);
