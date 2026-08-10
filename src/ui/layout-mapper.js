'use strict';
(function(exports) {

/**
 * JSZhuyinLayoutMapper — 將 DOM Level 3 `code` 值對應到標準注音鍵盤符號。
 *
 * 標準注音鍵盤 layout（美式鍵盤上的注音位置）：
 *   鍵位:  `  1  2  3  4  5  6  7  8  9  0  -  =
 *          Q  W  E  R  T  Y  U  I  O  P  [  ]  \
 *          A  S  D  F  G  H  J  K  L  ;  '
 *          Z  X  C  V  B  N  M  ,  .  /
 *          Space
 *
 *   一般:  ⋯  ㄅ  ㄉ  ˇ  ˋ  ㄓ  ˊ  ˙  ㄚ  ㄞ  ㄢ  ㄦ  ＝
 *          ㄆ  ㄊ  ㄍ  ㄐ  ㄔ  ㄗ  ㄧ  ㄛ  ㄟ  ㄣ  「  」  ＼
 *          ㄇ  ㄋ  ㄎ  ㄑ  ㄕ  ㄘ  ㄨ  ㄜ  ㄠ  ㄤ  、
 *          ㄈ  ㄌ  ㄏ  ㄒ  ㄖ  ㄙ  ㄩ  ㄝ  ㄡ  ㄥ
 *          ˉ (Space→輕聲)
 *
 *   Shift: ～  ！  ＠  ＃  ＄  ％  ＾  ＆  ＊  （  ）  —  ＋
 *          q  w  e  r  t  y  u  i  o  p  『  』  |
 *          a  s  d  f  g  h  j  k  l  ：  ；
 *          z  x  c  v  b  n  m  ，  。  ？
 *          (Space)
 *
 * 移植自 lib/web.js 的 JSZhuyinLayoutMapper，保持完全相同的行為。
 */

var JSZhuyinLayoutMapper = {
  // DOM Level 3 Events code values on PC Keyboard
  codes: ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
          'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal',
          'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU',
          'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash',
          'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH',
          'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote',
          'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN',
          'KeyM', 'Comma', 'Period', 'Slash',
          'Space'],

  // Selection codes (Shift+Digit N to select candidate N)
  selectionCodes: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
    'Digit6', 'Digit7', 'Digit8', 'Digit9'],

  // Map to Bopomofo symbols (standard layout, no shift)
  map:  '⋯ㄅㄉˇˋㄓˊ˙ㄚㄞㄢㄦ＝' +
        'ㄆㄊㄍㄐㄔㄗㄧㄛㄟㄣ「」＼' +
        'ㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤ、' +
        'ㄈㄌㄏㄒㄖㄙㄩㄝㄡㄥ' +
        'ˉ',

  // Shift-key mapping (full-width symbols / latin fallback)
  shiftMap: '～！＠＃＄％＾＆＊（）―＋' +
            'qwertyuiop『』|' +
            'asdfghjkl：；' +
            'zxcvbnm，。？' +
            ' ',

  /**
   * Get the Bopomofo symbol (or Shift punctuation / Latin fallback)
   * from a DOM Level 3 `code` value.
   *
   * @param {string} dom3Code  e.g. 'Digit1', 'KeyA', 'Space', 'Comma'
   * @param {boolean} shiftKey Whether the Shift key is held.
   * @return {string|undefined} The mapped symbol, or undefined.
   */
  getSymbolFromDOM3Code: function(dom3Code, shiftKey) {
    var index = this.codes.indexOf(dom3Code);
    if (index === -1) {
      return undefined;
    }
    if (shiftKey) {
      return this.shiftMap.charAt(index);
    } else {
      return this.map.charAt(index);
    }
  },

  /**
   * Get the 0-based candidate selection index from a DOM3 code.
   * Only Digit1–Digit9 are valid selection keys.
   *
   * @param {string} dom3Code  e.g. 'Digit1', 'Digit2', ...
   * @return {number} 0-based index, or -1 if not a selection key.
   */
  getSelectionIndexFromDOM3Code: function(dom3Code) {
    return this.selectionCodes.indexOf(dom3Code);
  },

  /**
   * Check if key is a candidate selection key (Shift+Digit1–9).
   */
  isSelectionKey: function(dom3Code) {
    return this.selectionCodes.indexOf(dom3Code) !== -1;
  },

  /**
   * Check if a character is a Bopomofo symbol.
   * (Inline check — avoids dependency on full BopomofoEncoder.)
   */
  isBopomofoSymbol: function(chr) {
    if (typeof chr !== 'string' || chr.length === 0) return false;
    var code = chr.charCodeAt(0);
    return (code >= 0x3105 && code <= 0x3129) ||
           (code === 0x02C9 || code === 0x02CA || code === 0x02C7 ||
            code === 0x02CB || code === 0x02D9);
  }
};

exports.JSZhuyinLayoutMapper = JSZhuyinLayoutMapper;

})(typeof self !== 'undefined' ? self : window);
