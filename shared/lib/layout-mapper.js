'use strict';
/**
 * Layout — 定義從 US ASCII 字元到注音符號的雙向對應。
 *
 * Chrome extension 版：透過 keydown 事件拿到 event.code，
 * 再用 layout-mapper 的 getSymbolFromDOM3Code(code, shiftKey) 取得注音符號。
 *
 * VS Code extension 版：type command 只提供字元（不提供物理鍵碼）。
 * 因此我們需要一個反向對應：給定一個 US ASCII 字元，判斷它對應到哪個注音符號。
 */

// 美式鍵盤的物理碼順序（與 jszhuyin lib/web.js JSZhuyinLayoutMapper 完全一致）
const CODES = [
  'Backquote','Digit1','Digit2','Digit3','Digit4','Digit5',
  'Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal',
  'KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU',
  'KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash',
  'KeyA','KeyS','KeyD','KeyF','KeyG','KeyH',
  'KeyJ','KeyK','KeyL','Semicolon','Quote',
  'KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN',
  'KeyM','Comma','Period','Slash',
  'Space'
];

// 一般鍵對應的注音符號
const BOPOMOFO_MAP =
  '⋯ㄅㄉˇˋㄓˊ˙ㄚㄞㄢㄦ＝' +
  'ㄆㄊㄍㄐㄔㄗㄧㄛㄟㄣ「」＼' +
  'ㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤ、' +
  'ㄈㄌㄏㄒㄖㄙㄩㄝㄡㄥ' +
  'ˉ';

// Shift 鍵對應的字元（全形標點與 ASCII fallback）
const SHIFT_MAP =
  '～！＠＃＄％︿＆＊（）—＋' +
  'qwertyuiop『』|' +
  'asdfghjkl：；' +
  'zxcvbnm，。？' +
  ' ';

// US-keyboard chars mapped to their equivalent digit (for Tone mapping in bopomofo)
// On a standard bopomofo keyboard:
//   Digit1 = ㄅ, Digit2 = ㄉ, Digit3 = ˇ, Digit4 = ˋ, Digit5 = ㄓ,
//   Digit6 = ˊ, Digit7 = ˙, Digit8 = ㄚ, Digit9 = ㄞ, Digit0 = ㄢ
// So when user types '3' (without shift), we should check CODES index:
//   'Digit3' at position 3 in CODES → BOPOMOFO_MAP[3] = 'ˇ'
// Same for other digits.

/**
 * 根據一個 ASCII 字元（來自 type command），反向找到它對應的注音符號。
 *
 * @param {string} asciiChar  來自 VS Code type command 的字元
 * @returns {string|null}     對應的注音符號，或 null（不是注音鍵）
 */
function asciiToBopomofo(asciiChar) {
  if (!asciiChar || asciiChar.length !== 1) return null;

  // 已經是注音符號（包含 tone symbols）
  if (/^[ㄅ-ㄩˉˊˇˋ˙]$/.test(asciiChar)) return asciiChar;

  // Step A: 在 shiftMap 中找（使用者按了 Shift+某鍵）
  //   e.g. 'q' is in shiftMap at position of KeyQ → BOPOMOFO_MAP[KeyQ] = ㄆ
  const shiftIdx = SHIFT_MAP.indexOf(asciiChar);
  if (shiftIdx !== -1) {
    return BOPOMOFO_MAP.charAt(shiftIdx);
  }

  // Step B: 數字鍵（1–0）→ 找對應的 DigitN 在 CODES 中的位置
  //   e.g. '3' → 'Digit3' at CODES index 3 → BOPOMOFO_MAP[3] = 'ˇ'
  if (/^[0-9]$/.test(asciiChar)) {
    const digitCode = 'Digit' + asciiChar;
    const digIdx = CODES.indexOf(digitCode);
    if (digIdx !== -1) {
      return BOPOMOFO_MAP.charAt(digIdx);
    }
  }

  // Step C: 特殊符號 `, -, =, [, ], \, ;, ', ,, ., /`
  //   這些在 bopomofo 佈局中位於對應的標點碼
  //   例如 '-' → CODES index 11 (Minus) → BOPOMOFO_MAP[11] = 'ㄦ'
  const specialMap = {
    '`': 'Backquote', '-': 'Minus', '=': 'Equal',
    '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash',
    ';': 'Semicolon', "'": 'Quote',
    ',': 'Comma', '.': 'Period', '/': 'Slash',
    ' ': 'Space'
  };
  const codeName = specialMap[asciiChar];
  if (codeName) {
    const codeIdx = CODES.indexOf(codeName);
    if (codeIdx !== -1) {
      return BOPOMOFO_MAP.charAt(codeIdx);
    }
  }

  return null;
}

module.exports = { asciiToBopomofo, CODES, BOPOMOFO_MAP, SHIFT_MAP };
