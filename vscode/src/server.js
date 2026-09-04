'use strict';
/**
 * Server — JSZhuyin 引擎封裝（主線程 Node.js 模式）。
 */

const JSZhuyin = require('../lib/jszhuyin.js').JSZhuyin;

let engine = null;
let initialized = false;
let symbols = '';
let candidates = [];
let compositionActive = false;

// Callbacks
let onCompositionUpdateFn = null;
let onCandidatesChangeFn = null;
let onCompositionEndFn = null;

function init(dictPath) {
  if (initialized) return;
  const fs = require('fs');
  const buf = fs.readFileSync(dictPath);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  engine = new JSZhuyin();
  engine.DATA_ARRAY_BUFFER = ab;
  engine.load();

  engine.oncompositionupdate = function(s) {
    symbols = s;
    compositionActive = !!s;
    if (typeof onCompositionUpdateFn === 'function') onCompositionUpdateFn(s);
  };

  engine.oncandidateschange = function(c) {
    candidates = c || [];
    if (typeof onCandidatesChangeFn === 'function') onCandidatesChangeFn(candidates);
  };

  engine.oncompositionend = function(t) {
    compositionActive = false;
    symbols = '';
    if (typeof onCompositionEndFn === 'function') onCompositionEndFn(t);
  };

  engine.onactionhandled = function() {};
  engine.onerror = function(err) { console.error('[JSZhuyin]', err); };
  initialized = true;
}

function handleKey(key) {
  if (!initialized || !engine) return false;
  return engine.handleKey(key, 0);
}

function selectCandidate(index) {
  if (!initialized || !engine) return;
  const cand = candidates[index];
  if (!cand) return;
  engine.selectCandidate(cand, 0);
}

function confirmDefault() {
  if (!initialized || !engine || !candidates[0]) return false;
  engine.selectCandidate(candidates[0], 0);
  return true;
}

function getState() {
  return { symbols, candidates, compositionActive };
}

function dispose() {
  if (engine) { try { engine.unload(); } catch (e) {} engine = null; }
  initialized = false;
  symbols = '';
  candidates = [];
  compositionActive = false;
}

module.exports = {
  init, handleKey, selectCandidate, confirmDefault, getState, dispose,
  get onCompositionUpdate() { return onCompositionUpdateFn; },
  set onCompositionUpdate(fn) { onCompositionUpdateFn = fn; },
  get onCandidatesChange() { return onCandidatesChangeFn; },
  set onCandidatesChange(fn) { onCandidatesChangeFn = fn; },
  get onCompositionEnd() { return onCompositionEndFn; },
  set onCompositionEnd(fn) { onCompositionEndFn = fn; }
};
