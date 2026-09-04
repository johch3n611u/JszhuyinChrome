'use strict';

/**
 * ImeClient — 管理 JSZhuyin 注音引擎（主線程模式）。
 */

var ImeClient = function() {
  this._engine = null;
  this._initialized = false;
  this._reqId = 0;
  this.compositionActive = false;
  this.symbols = '';
  this.candidates = [];
  this.oncompositionupdate = null;
  this.oncandidateschange = null;
  this.oncompositionend = null;
  this.onactionhandled = null;
};

ImeClient.prototype = {

  init: function(callbacks) {
    if (this._initialized) return Promise.resolve();

    var self = this;
    if (callbacks) {
      this.oncompositionupdate = callbacks.oncompositionupdate || null;
      this.oncandidateschange = callbacks.oncandidateschange || null;
      this.oncompositionend = callbacks.oncompositionend || null;
      this.onactionhandled = callbacks.onactionhandled || null;
    }

    return this._loadEngine().then(function() {
      self._initialized = true;
    }).catch(function(err) {
      console.error('[JSZhuyin IME] Init failed:', err);
      throw err;
    });
  },

  handleKey: function(key) {
    if (!this._initialized || !this._engine) return false;
    this._reqId++;
    return this._engine.handleKey(key, this._reqId);
  },

  selectCandidate: function(index) {
    if (!this._initialized || !this._engine) return;
    var cand = this.candidates[index];
    if (!cand) return;
    this._reqId++;
    this._engine.selectCandidate(cand, this._reqId);
  },

  unload: function() {
    if (this._engine) {
      try { this._engine.unload(); } catch (e) {}
      this._engine = null;
    }
    this._initialized = false;
    this.symbols = '';
    this.candidates = [];
    this.compositionActive = false;
  },

  _loadEngine: function() {
    var self = this;

    return this._fetchDict().then(function(buf) {
      var engine = new JSZhuyin();
      engine.DATA_ARRAY_BUFFER = buf;
      engine.load();

      engine.oncompositionupdate = function(symbols, reqId) {
        self.symbols = symbols;
        self.compositionActive = !!symbols;
        self._reqId = reqId;
        if (typeof self.oncompositionupdate === 'function') {
          self.oncompositionupdate(symbols);
        }
      };

      engine.oncandidateschange = function(candidates, reqId) {
        self.candidates = candidates || [];
        self._reqId = reqId;
        if (typeof self.oncandidateschange === 'function') {
          self.oncandidateschange(self.candidates);
        }
      };

      engine.oncompositionend = function(text, reqId) {
        self.compositionActive = false;
        self.symbols = '';
        self._reqId = reqId;
        if (typeof self.oncompositionend === 'function') {
          self.oncompositionend(text);
        }
      };

      engine.onactionhandled = function(reqId) {
        self._reqId = reqId;
        if (typeof self.onactionhandled === 'function') {
          self.onactionhandled();
        }
      };

      engine.onerror = function(err) {
        console.error('[JSZhuyin IME] Engine error:', err);
      };

      self._engine = engine;
    });
  },

  _fetchDict: function() {
    var url;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      url = chrome.runtime.getURL('data/database.data');
    } else {
      url = '../data/database.data';
    }

    return fetch(url)
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to fetch dictionary: HTTP ' + res.status);
        return res.arrayBuffer();
      })
      .catch(function(err) {
        console.error('[JSZhuyin IME] Dictionary fetch error:', err);
        throw err;
      });
  }
};

// Global export — must be assigned before other scripts reference it.
self.ImeClient = ImeClient;
