"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/engine/lib/bopomofo_encoder.js
var require_bopomofo_encoder = __commonJS({
  "src/engine/lib/bopomofo_encoder.js"(exports, module2) {
    "use strict";
    (function(factory) {
      if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else if (typeof self === "object") {
        self.BopomofoEncoder = factory();
      }
    })(function() {
      var BopomofoEncoder = {
        // Unicode range of each of the Bopomofo symbol groups
        // See https://en.wikipedia.org/wiki/Bopomofo_(script)#Unicode
        BOPOMOFO_START_GROUP_1: 12549,
        BOPOMOFO_END_GROUP_1: 12569,
        BOPOMOFO_START_GROUP_2: 12583,
        BOPOMOFO_END_GROUP_2: 12585,
        BOPOMOFO_START_GROUP_3: 12570,
        BOPOMOFO_END_GROUP_3: 12582,
        // Tone symbols are placed in Spacing Modifier Letters Unicode block
        BOPOMOFO_TONE_1: 713,
        BOPOMOFO_TONE_2: 714,
        BOPOMOFO_TONE_3: 711,
        BOPOMOFO_TONE_4: 715,
        BOPOMOFO_TONE_5: 729,
        // Bitmask for each group
        BOPOMOFO_GROUP_1_BITMASK: 32256,
        BOPOMOFO_GROUP_2_BITMASK: 384,
        BOPOMOFO_GROUP_3_BITMASK: 120,
        BOPOMOFO_TONE_BITMASK: 7,
        /**
         * Encode a Bopomofo symbols string into encoded sounds.
         * into encoded string.
         * @param  {string} symbols      Symbols string.
         * @param  {object} options      Options.
         *                               - reorder: true for reorder.
         * @return {array(number)}       Encoded sounds array.
         * @this   BopomofoEncoder
         */
        encode: function be_encode(symbols, options) {
          options = options || {};
          var encodedSoundsArr = [];
          var currentEncodeSymbolsCode = 0;
          var filled1 = false;
          var filled2 = false;
          var filled3 = false;
          var filled4 = false;
          var reorder = options.reorder;
          var next = function next2() {
            encodedSoundsArr.push(currentEncodeSymbolsCode);
            currentEncodeSymbolsCode = 0;
            filled1 = filled2 = filled3 = filled4 = false;
          };
          for (var j = 0; j < symbols.length; j++) {
            var encodedSymbolCode = this.encodeOne(symbols[j]);
            if (encodedSymbolCode & this.BOPOMOFO_GROUP_1_BITMASK) {
              if (!reorder && (filled1 || filled2 || filled3 || filled4)) {
                next();
              }
              if (reorder && (filled1 || filled4)) {
                next();
              }
              filled1 = true;
              currentEncodeSymbolsCode |= encodedSymbolCode;
              continue;
            }
            if (encodedSymbolCode & this.BOPOMOFO_GROUP_2_BITMASK) {
              if (!reorder && (filled2 || filled3 || filled4)) {
                next();
              }
              if (reorder && (filled2 || filled4)) {
                next();
              }
              filled2 = true;
              currentEncodeSymbolsCode |= encodedSymbolCode;
              continue;
            }
            if (encodedSymbolCode & this.BOPOMOFO_GROUP_3_BITMASK) {
              if (filled3 || filled4) {
                next();
              }
              filled3 = true;
              currentEncodeSymbolsCode |= encodedSymbolCode;
              continue;
            }
            if (encodedSymbolCode & this.BOPOMOFO_TONE_BITMASK) {
              filled4 = true;
              currentEncodeSymbolsCode |= encodedSymbolCode;
              continue;
            }
            throw new Error("Should not reach here.");
          }
          next();
          return encodedSoundsArr;
        },
        /**
         * Encode exactly one Bopomofo symbol
         * @param  {string} symbol Bopomofo symbol
         * @return {number}        Encoded code representing the symbol.
         */
        encodeOne: function be_encodeOne(symbol) {
          var symbolCode = symbol.charCodeAt(0);
          if (symbolCode >= this.BOPOMOFO_START_GROUP_1 && symbolCode <= this.BOPOMOFO_END_GROUP_1) {
            return symbolCode - this.BOPOMOFO_START_GROUP_1 + 1 << 9;
          }
          if (symbolCode >= this.BOPOMOFO_START_GROUP_2 && symbolCode <= this.BOPOMOFO_END_GROUP_2) {
            return symbolCode - this.BOPOMOFO_START_GROUP_2 + 1 << 7;
          }
          if (symbolCode >= this.BOPOMOFO_START_GROUP_3 && symbolCode <= this.BOPOMOFO_END_GROUP_3) {
            return symbolCode - this.BOPOMOFO_START_GROUP_3 + 1 << 3;
          }
          if (symbolCode == this.BOPOMOFO_TONE_1) {
            return 1;
          }
          if (symbolCode == this.BOPOMOFO_TONE_2) {
            return 2;
          }
          if (symbolCode == this.BOPOMOFO_TONE_3) {
            return 3;
          }
          if (symbolCode == this.BOPOMOFO_TONE_4) {
            return 4;
          }
          if (symbolCode == this.BOPOMOFO_TONE_5) {
            return 5;
          }
          throw new Error("Unknown symbol: " + symbol);
        },
        /**
         * Decode an encoded sounds string into Bopomofo symbols.
         * @param  {array(number)} encodedArr Encoded sounds string or array.
         * @return {string}                   Symbols string.
         * @this   BopomofoEncoder
         */
        decode: function be_decode(encodedArr) {
          var symbols = "";
          for (var i = 0; i < encodedArr.length; i++) {
            var symbolsCode = encodedArr[i];
            var group1Code = (symbolsCode & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
            var group2Code = (symbolsCode & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
            var group3Code = (symbolsCode & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
            var toneCode = symbolsCode & this.BOPOMOFO_TONE_BITMASK;
            if (group1Code) {
              symbols += String.fromCharCode(this.BOPOMOFO_START_GROUP_1 - 1 + group1Code);
            }
            if (group2Code) {
              symbols += String.fromCharCode(this.BOPOMOFO_START_GROUP_2 - 1 + group2Code);
            }
            if (group3Code) {
              symbols += String.fromCharCode(this.BOPOMOFO_START_GROUP_3 - 1 + group3Code);
            }
            switch (toneCode) {
              case 1:
                symbols += String.fromCharCode(this.BOPOMOFO_TONE_1);
                break;
              case 2:
                symbols += String.fromCharCode(this.BOPOMOFO_TONE_2);
                break;
              case 3:
                symbols += String.fromCharCode(this.BOPOMOFO_TONE_3);
                break;
              case 4:
                symbols += String.fromCharCode(this.BOPOMOFO_TONE_4);
                break;
              case 5:
                symbols += String.fromCharCode(this.BOPOMOFO_TONE_5);
                break;
            }
          }
          return symbols;
        },
        /**
         * Return true if the character or charCode given represents
         * an accepted Bopomofo symbol.
         * @param  {string|number} chr String or a charCode.
         * @return {boolean}           Return true if the character or charCode given
         *                             represents an accepted Bopomofo symbol.
         * @this   BopomofoEncoder
         */
        isBopomofoSymbol: function be_isBopomofoSymbol(chr) {
          var code = typeof chr === "string" ? chr.charCodeAt(0) : chr;
          if (code >= this.BOPOMOFO_START_GROUP_1 && code <= this.BOPOMOFO_END_GROUP_1) {
            return true;
          }
          if (code >= this.BOPOMOFO_START_GROUP_2 && code <= this.BOPOMOFO_END_GROUP_2) {
            return true;
          }
          if (code >= this.BOPOMOFO_START_GROUP_3 && code <= this.BOPOMOFO_END_GROUP_3) {
            return true;
          }
          if (code === this.BOPOMOFO_TONE_1 || code === this.BOPOMOFO_TONE_2 || code === this.BOPOMOFO_TONE_3 || code === this.BOPOMOFO_TONE_4 || code === this.BOPOMOFO_TONE_5) {
            return true;
          }
          return false;
        },
        APPEND_MODE_NONE: 0,
        APPEND_MODE_REORDER: 1,
        appendToSymbols: function(symbols, symbolToAttach, mode) {
          mode = mode || this.APPEND_MODE_NONE;
          if (!this.isBopomofoSymbol(symbolToAttach)) {
            throw new Error("BopomofoEncoder: Symbol to attach is not a Bopomofo symbol.");
          }
          switch (mode) {
            case this.APPEND_MODE_NONE:
              return symbols + symbolToAttach;
            case this.APPEND_MODE_REORDER:
              return this.decode(this.encode(symbols + symbolToAttach, {
                reorder: true
              }));
          }
        },
        /**
         * Construct and encoded sounds array that have all non-completed sounds
         * expended as seperate symbols.
         * Useful for getSymbolsCompositions() and also to decide the minimal # of
         * composing elements of the symbols string.
         *
         * @param {string}           symbols   String of Bopomofo symbols.
         * @returns {array(number)}            Array consist of code of the
         *                                     encoded sounds.
         */
        encodeExpended: function(symbols) {
          var encodedSoundsReversedArr = [0];
          var i = symbols.length;
          var pos = 0;
          var placeIntoCurrentSound = false;
          var filled1, filled2, filled3;
          var encodedSymbolCode;
          while (i--) {
            encodedSymbolCode = this.encodeOne(symbols[i]);
            if (this.isCompleted(encodedSymbolCode)) {
              placeIntoCurrentSound = true;
              filled1 = filled2 = filled3 = false;
              encodedSoundsReversedArr.push(encodedSymbolCode);
              pos++;
            } else {
              if (placeIntoCurrentSound) {
                if (encodedSymbolCode & this.BOPOMOFO_GROUP_3_BITMASK && !filled3 && !filled2 && !filled1) {
                  filled3 = true;
                  encodedSoundsReversedArr[pos] |= encodedSymbolCode;
                } else if (encodedSymbolCode & this.BOPOMOFO_GROUP_2_BITMASK && !filled2 && !filled1) {
                  filled2 = true;
                  encodedSoundsReversedArr[pos] |= encodedSymbolCode;
                } else if (encodedSymbolCode & this.BOPOMOFO_GROUP_1_BITMASK && !filled1) {
                  filled1 = true;
                  encodedSoundsReversedArr[pos] |= encodedSymbolCode;
                } else {
                  placeIntoCurrentSound = false;
                  encodedSoundsReversedArr.push(encodedSymbolCode);
                  pos++;
                }
              } else {
                encodedSoundsReversedArr.push(encodedSymbolCode);
                pos++;
              }
            }
          }
          if (encodedSoundsReversedArr[0] === 0) {
            encodedSoundsReversedArr.shift();
          }
          return encodedSoundsReversedArr.reverse();
        },
        /**
         * Trim symbols to remove the part that will only match more words specify by
         * length.
         * @param  {string|array(number)} symbols Symbols
         * @param  {number} length                Length to trim.
         * @return {string}                       Trimmed symbols.
         */
        trimToLength: function(symbols, length) {
          symbols = typeof symbols === "string" ? symbols : this.decode(symbols);
          if (symbols.length <= length) {
            return symbols;
          }
          var encodedSounds;
          var i = symbols.length;
          do {
            encodedSounds = this.encode(symbols.substr(0, i));
            if (encodedSounds.length <= length) {
              break;
            }
          } while (i--);
          return this.decode(encodedSounds);
        },
        /**
         * Trim symbols (from the end) to remove the part that will only match more
         * words specify by length.
         * @param  {string|array(number)} symbols Symbols
         * @param  {number} length                Length to trim.
         * @return {string}                       Trimmed symbols.
         */
        trimToLengthFromEnd: function(symbols, length) {
          symbols = typeof symbols === "string" ? symbols : this.decode(symbols);
          var encodedSounds;
          var totalLength = this.encode(symbols).length;
          var i = 0;
          while (++i < symbols.length) {
            encodedSounds = this.encode(symbols.substr(0, i));
            if (encodedSounds.length + length > totalLength) {
              break;
            }
          }
          return symbols.substr(i - 1);
        },
        /**
         * Return all possible combinations of the given symbols string.
         * @param  {string|array(number)}     symbols       Symbol string or array
         *                                                  returned from
         *                                                  encodeExpended.
         * @param  {number}                   length        Maximum length.
         * @return {array(array(number))}                   All combinations of
         *                                                  the given symbols string.
         */
        getSymbolCombinations: function(symbols, length) {
          var expendedEncodedSounds = typeof symbols === "string" ? this.encodeExpended(symbols) : symbols;
          if (typeof length !== "number") {
            length = expendedEncodedSounds.length * 3;
          }
          if (expendedEncodedSounds.length > length * 3) {
            return [];
          }
          var combinations = expendedEncodedSounds.reduce(function(currentCombinations, code, i) {
            if (i === 0) {
              currentCombinations.push([code]);
              return currentCombinations;
            }
            return currentCombinations.reduce(
              function(currentCombinations2, combination) {
                if (combination === null) {
                  return currentCombinations2;
                }
                var k = combination.length - 1;
                if (this.isCompleted(combination[k]) || this.isCompleted(code)) {
                  if (combination.length === length) {
                    return currentCombinations2;
                  }
                  combination.push(code);
                  currentCombinations2.push(combination);
                  return currentCombinations2;
                }
                var filled2 = !!(combination[k] & this.BOPOMOFO_GROUP_2_BITMASK);
                var filled3 = !!(combination[k] & this.BOPOMOFO_GROUP_3_BITMASK);
                if (code & this.BOPOMOFO_GROUP_1_BITMASK || code & this.BOPOMOFO_GROUP_2_BITMASK && (filled2 || filled3) || code & this.BOPOMOFO_GROUP_3_BITMASK && filled3) {
                  if (combination.length === length) {
                    return currentCombinations2;
                  }
                  combination.push(code);
                  currentCombinations2.push(combination);
                  return currentCombinations2;
                }
                if (combination.length < length) {
                  var newCombination = [].concat(combination);
                  newCombination.push(code);
                  currentCombinations2.push(newCombination);
                }
                combination[k] |= code;
                currentCombinations2.push(combination);
                return currentCombinations2;
              }.bind(this),
              /* currentCombinations */
              []
            );
          }.bind(this), []);
          return combinations;
        },
        isIncompletionOf: function(code, codeToMatch) {
          return this.createCompletionComparisonFunction(code)(codeToMatch);
        },
        createCompletionComparisonFunction: function(code) {
          var group1Code = (code & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
          var group2Code = (code & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
          var group3Code = (code & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
          var toneCode = code & this.BOPOMOFO_TONE_BITMASK;
          return function createdIsIncompletionOf(codeToMatch) {
            var group1CodeToMatch = (codeToMatch & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
            var group2CodeToMatch = (codeToMatch & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
            var group3CodeToMatch = (codeToMatch & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
            var toneCodeToMatch = codeToMatch & this.BOPOMOFO_TONE_BITMASK;
            return !(group1CodeToMatch && !group1Code && (group2Code || group3Code || toneCode)) && !(group1Code && group1CodeToMatch !== group1Code) && !(group2CodeToMatch && !group2Code && (group3Code || toneCode)) && !(group2Code && group2CodeToMatch !== group2Code) && !(group3CodeToMatch && !group3Code && toneCode) && !(group3Code && group3CodeToMatch !== group3Code) && !(toneCode && toneCodeToMatch !== toneCode) && true;
          }.bind(this);
        },
        isCompleted: function(code) {
          return !!(code & this.BOPOMOFO_TONE_BITMASK);
        },
        replace: function(code, fromCode, toCode) {
          var match = false;
          if (fromCode & this.BOPOMOFO_GROUP_1_BITMASK) {
            match = (code & this.BOPOMOFO_GROUP_1_BITMASK) === (fromCode & this.BOPOMOFO_GROUP_1_BITMASK);
          }
          if (fromCode & this.BOPOMOFO_GROUP_2_BITMASK) {
            match = (code & this.BOPOMOFO_GROUP_2_BITMASK) === (fromCode & this.BOPOMOFO_GROUP_2_BITMASK);
          }
          if (fromCode & this.BOPOMOFO_GROUP_3_BITMASK) {
            match = (code & this.BOPOMOFO_GROUP_3_BITMASK) === (fromCode & this.BOPOMOFO_GROUP_3_BITMASK);
          }
          if (fromCode & this.BOPOMOFO_TONE_BITMASK) {
            match = (code & this.BOPOMOFO_TONE_BITMASK) === (fromCode & this.BOPOMOFO_TONE_BITMASK);
          }
          if (!match) {
            return code;
          }
          return code & ~fromCode | toCode;
        }
      };
      return BopomofoEncoder;
    });
  }
});

// src/engine/lib/jszhuyin_data_pack.js
var require_jszhuyin_data_pack = __commonJS({
  "src/engine/lib/jszhuyin_data_pack.js"(exports, module2) {
    "use strict";
    (function(factory) {
      if (typeof module2 === "object" && module2.exports) {
        factory(module2.exports, {});
      } else if (typeof self === "object") {
        factory(self, self);
      }
    })(function(exports2, required) {
      var Float32Encoder = exports2.Float32Encoder = {
        isSupported: typeof DataView !== "undefined",
        BUFFER_BYTE_LENGTH: 4,
        encode: function encodeFloat32Number(number, type) {
          type = type || "arraybuffer";
          switch (type) {
            case "arraybuffer":
              return this.encodeArrayBuffer(number);
            default:
              throw new Error("Unsupported encode to type.");
          }
        },
        encodeArrayBuffer: function Float32NumberToArrayBuffer(number) {
          if (typeof number !== "number") {
            throw new Error("Argument received is not a number.");
          }
          var buf = new ArrayBuffer(4);
          new DataView(buf).setFloat32(0, number, true);
          return buf;
        },
        decode: function decodeFloat32Number(data) {
          switch (data.constructor) {
            case ArrayBuffer:
              return this.decodeArrayBuffer(data);
            default:
              throw new Error("Unsupported data type.");
          }
        },
        decodeArrayBuffer: function ArrayBufferToFloat32Number(buffer, byteOffset) {
          return new DataView(buffer).getFloat32(byteOffset, true);
        }
      };
      var JSZhuyinDataPackCollection = exports2.JSZhuyinDataPackCollection = function(dataPacks) {
        this.dataPacks = dataPacks;
        if (!dataPacks.length) {
          throw new Error("JSZhuyinDataPackCollection: Expects an non-empty array.");
        }
        this.firstResultDataPack = null;
        this.results = [];
      };
      JSZhuyinDataPackCollection.prototype.getFirstResultScore = function() {
        if (this.results.length) {
          return this.results[0].score;
        }
        if (!this.firstResultDataPack) {
          this._getFirstResultDataPack();
        }
        return this.firstResultDataPack.getFirstResultScore();
      };
      JSZhuyinDataPackCollection.prototype.getFirstResult = function() {
        if (this.results.length) {
          return this.results[0];
        }
        if (!this.firstResultDataPack) {
          this._getFirstResultDataPack();
        }
        return this.firstResultDataPack.getFirstResult();
      };
      JSZhuyinDataPackCollection.prototype._getFirstResultDataPack = function() {
        if (this.dataPacks.length === 1) {
          this.firstResultDataPack = this.dataPacks[0];
          return;
        }
        var score = -Infinity;
        this.dataPacks.forEach(function(dataPack, i) {
          if (dataPack.getFirstResultScore() > score) {
            this.firstResultDataPack = dataPack;
            score = dataPack.getFirstResultScore();
          }
        }.bind(this));
      };
      JSZhuyinDataPackCollection.prototype.getResults = function() {
        if (this.results.length) {
          return this.results;
        }
        if (this.dataPacks.length === 1) {
          this.results = this.dataPacks[0].getResults();
          return this.results;
        }
        var results = [];
        this.dataPacks.forEach(function(dataPack, i) {
          var resArr = dataPack.getResults();
          resArr.forEach(function(res) {
            var found = results.some(function(currentRes) {
              return currentRes.str === res.str;
            });
            if (!found) {
              results.push(res);
            }
          });
        }.bind(this));
        results = results.sort(function(a, b) {
          return b.score - a.score;
        });
        this.results = results;
        return results;
      };
      var JSZhuyinDataPack = exports2.JSZhuyinDataPack = function(imeData, byteOffset, length, index) {
        if (imeData.constructor === ArrayBuffer) {
          this.packed = imeData;
          this.byteOffset = byteOffset || 0;
          this.length = length || imeData.byteLength >> 1;
          this.unpacked = void 0;
        } else if (Array.isArray(imeData)) {
          this.packed = void 0;
          this.unpacked = imeData;
        } else {
          this.packed = void 0;
          this.unpacked = void 0;
        }
        this.index = index;
      };
      JSZhuyinDataPack.prototype.getFirstResultScore = function() {
        if (this.unpacked) {
          return this.unpacked[0].score;
        }
        return Float32Encoder.decodeArrayBuffer(this.packed, this.byteOffset + 2);
      };
      JSZhuyinDataPack.prototype.getFirstResult = function() {
        if (this.unpacked) {
          return this.unpacked[0];
        }
        var view = new DataView(this.packed, this.byteOffset, this.length << 1);
        var controlByte = view.getUint16(0, true);
        var length = controlByte & 15;
        var result = {
          str: this._getStringFromDataView(view, 3 << 1, length),
          score: this.getFirstResultScore(),
          index: this.index
        };
        return result;
      };
      JSZhuyinDataPack.prototype.getResults = function() {
        this.unpack();
        return this.unpacked;
      };
      JSZhuyinDataPack.prototype.getResultsBeginsWith = function(str) {
        var filterFn = function(res) {
          return res.str.substr(0, str.length) === str;
        };
        if (this.unpacked) {
          return this.unpacked.filter(filterFn);
        }
        return this._getPackedResults(filterFn);
      };
      JSZhuyinDataPack.prototype.getPacked = function() {
        this.pack();
        return this.packed;
      };
      JSZhuyinDataPack.prototype.unpack = function() {
        if (this.unpacked) {
          return;
        }
        if (typeof this.packed === "undefined") {
          throw new Error("No packed IME data.");
        }
        this.unpacked = this._getPackedResults();
        this.packed = void 0;
      };
      JSZhuyinDataPack.prototype._getPackedResults = function(filterFn) {
        var results = [];
        var view = new DataView(this.packed, this.byteOffset, this.length << 1);
        var controlByte = view.getUint16(0, true);
        var length = controlByte & 15;
        var bytePos = 2;
        while (bytePos < view.byteLength) {
          if (bytePos + 4 + (length << 1) > view.byteLength) {
            break;
          }
          var result = {
            str: this._getStringFromDataView(view, bytePos + 4, length),
            score: Float32Encoder.decodeArrayBuffer(
              this.packed,
              this.byteOffset + bytePos
            ),
            index: this.index
          };
          bytePos += length + 2 << 1;
          if (typeof filterFn === "function" && !filterFn(result)) {
            continue;
          }
          results.push(result);
        }
        return results;
      };
      JSZhuyinDataPack.prototype.pack = function() {
        if (this.packed) {
          return;
        }
        if (typeof this.unpacked === "undefined") {
          throw new Error("No unpacked IME data.");
        }
        var length = 0;
        this.unpacked.forEach(function(result, i) {
          if (result.str.length > length) {
            length = result.str.length;
          }
        });
        if (length > 15) {
          throw new Error(
            "JSZhuyinDataPack: Longest string length is longer than expected."
          );
        }
        var arrayLength = 1 + (length + 2) * this.unpacked.length;
        var packedView = new DataView(new ArrayBuffer(arrayLength << 1));
        packedView.setUint16(0, 64 ^ length, true);
        var bytePos = 1 << 1;
        this.unpacked.forEach(function(result, i) {
          packedView.setFloat32(bytePos, result.score, true);
          bytePos += 2 << 1;
          this._setStringToDataView(packedView, bytePos, result.str);
          bytePos += length << 1;
        }, this);
        this.packed = packedView.buffer;
        this.byteOffset = 0;
        this.length = arrayLength;
      };
      JSZhuyinDataPack.prototype.toString = function() {
        if (this.unpacked) {
          return this.unpacked.toString();
        }
        if (this.packed) {
          return this.packed.toString();
        }
        return "[object JSZhuyinDataPack]";
      };
      JSZhuyinDataPack.prototype._getStringFromDataView = function(view, byteOffset, length) {
        var charCodes = [], charCode;
        for (var i = 0; i < length; i++) {
          charCode = view.getUint16(byteOffset + (i << 1), true);
          if (charCode) {
            charCodes.push(charCode);
          }
        }
        return String.fromCharCode.apply(String, charCodes);
      };
      JSZhuyinDataPack.prototype._setStringToDataView = function(view, byteOffset, str) {
        var i = 0;
        while (i < str.length) {
          view.setUint16(byteOffset + (i << 1), str.charCodeAt(i), true);
          i++;
        }
      };
    });
  }
});

// src/engine/lib/storage.js
var require_storage = __commonJS({
  "src/engine/lib/storage.js"(exports, module2) {
    "use strict";
    (function(factory) {
      if (typeof module2 === "object" && module2.exports) {
        factory(module2.exports, {
          JSZhuyinDataPack: require_jszhuyin_data_pack().JSZhuyinDataPack,
          JSZhuyinDataPackCollection: require_jszhuyin_data_pack().JSZhuyinDataPackCollection,
          BopomofoEncoder: require_bopomofo_encoder()
        });
      } else if (typeof self === "object") {
        if (typeof self.JSZhuyinDataPack === "undefined" || typeof self.JSZhuyinDataPackCollection === "undefined" || typeof self.BopomofoEncoder === "undefined") {
          throw new Error("Dependency not found.");
        }
        factory(self, self);
      }
    })(function(exports2, required) {
      var JSZhuyinDataPack = required.JSZhuyinDataPack;
      var JSZhuyinDataPackCollection = required.JSZhuyinDataPackCollection;
      var BopomofoEncoder = required.BopomofoEncoder;
      var CacheStore = exports2.CacheStore = function CacheStore2() {
        this.dataMap = /* @__PURE__ */ new Map();
      };
      CacheStore.prototype.add = function cs_add(codes, value) {
        this.dataMap.set(String.fromCharCode.apply(String, codes), value);
      };
      CacheStore.prototype.get = function cs_get(codes) {
        return this.dataMap.get(String.fromCharCode.apply(String, codes));
      };
      CacheStore.prototype.cleanup = function cs_cleanup(supersetCodes) {
        if (!supersetCodes) {
          this.dataMap.clear();
          return;
        }
        var supersetStr = String.fromCharCode.apply(String, supersetCodes);
        this.dataMap.forEach(function(v, key) {
          if (supersetStr.indexOf(key) === -1) {
            this.dataMap.delete(key);
          }
        }, this);
      };
      var BinStorage = exports2.BinStorage = function BinStorage2() {
        this.loaded = false;
        this._bin = void 0;
      };
      BinStorage.prototype.load = function bs_load(data) {
        if (this.loaded) {
          this.unload();
        }
        this.loaded = true;
        this._bin = data;
      };
      BinStorage.prototype.unload = function bs_unload() {
        this._bin = void 0;
        this.loaded = false;
      };
      BinStorage.prototype.get = function bs_get(codes) {
        if (!this.loaded) {
          throw new Error("BinStorage: not loaded.");
        }
        var code;
        var byteOffset = 0;
        while ((code = codes.shift()) !== void 0) {
          byteOffset = this.searchBlock(code, byteOffset);
          if (byteOffset === -1) {
            return void 0;
          }
        }
        return this._getBlockContent(byteOffset);
      };
      BinStorage.prototype.getRange = function bs_getRange(codes) {
        if (!this.loaded) {
          throw new Error("BinStorage: not loaded.");
        }
        var code;
        var byteOffset = 0;
        while ((code = codes.shift()) !== void 0) {
          byteOffset = this.searchBlock(code, byteOffset);
          if (byteOffset === -1) {
            return [];
          }
        }
        return this.getRangeFromContentIndex(byteOffset);
      };
      BinStorage.prototype.getRangeFromContentIndex = function(byteOffset) {
        var bin = this._bin;
        var result = [];
        var getBlockContents = function bs_getBlockContents(byteOffset2) {
          var view = new DataView(bin, byteOffset2);
          var length = view.getUint16(0, true);
          var contentLength = view.getUint16(2, true);
          if (length === 0) {
            return;
          }
          var addressBlockByteOffset = byteOffset2 + (2 + contentLength + length << 1);
          var addressBlockView = new DataView(bin, addressBlockByteOffset, length << 2);
          var i = length;
          while (i--) {
            var blockAddress = addressBlockView.getUint32(i << 2, true);
            var content = this._getBlockContent(blockAddress);
            if (content) {
              result.push(content);
            }
            getBlockContents(blockAddress);
          }
        }.bind(this);
        getBlockContents(byteOffset);
        return result;
      };
      BinStorage.prototype.searchBlock = function bs_searchBlock(code, byteOffset) {
        var bin = this._bin;
        var view = new DataView(bin, byteOffset);
        var length = view.getUint16(0, true);
        var contentLength = view.getUint16(2, true);
        var keyBlockByteOffset = byteOffset + (2 + contentLength << 1);
        var addressBlockByteOffset = byteOffset + (2 + contentLength + length << 1);
        var keyBlockView = new DataView(bin, keyBlockByteOffset, length << 1);
        var addressBlockView = new DataView(bin, addressBlockByteOffset, length << 2);
        var low = 0;
        var high = length - 1;
        var mid;
        var lowCode, highCode, midCode;
        while (low < length && (lowCode = keyBlockView.getUint16(low << 1, true)) <= code && (highCode = keyBlockView.getUint16(high << 1, true)) >= code) {
          mid = low + (code - lowCode) * (high - low) / (highCode - lowCode) | 0;
          midCode = keyBlockView.getUint16(mid << 1, true);
          if (midCode < code) {
            low = mid + 1;
          } else if (midCode > code) {
            high = mid - 1;
          } else {
            return addressBlockView.getUint32(mid << 2, true);
          }
        }
        if (lowCode === code) {
          return addressBlockView.getUint32(low << 2, true);
        } else {
          return -1;
        }
      };
      BinStorage.prototype._getBlockContent = function bs_getBlockContent(byteOffset) {
        var bin = this._bin;
        var view = new DataView(bin, byteOffset);
        var contentLength = view.getUint16(2, true);
        if (contentLength === 0) {
          return void 0;
        }
        return [bin, byteOffset + (2 << 1), contentLength, byteOffset];
      };
      var JSZhuyinDataPackStorage = exports2.JSZhuyinDataPackStorage = function() {
        this.incompleteMatchedCache = new CacheStore();
        this.getCache = new CacheStore();
        this._interchangeablePairs = "";
        this._interchangeablePairsArr = new Uint16Array(0);
      };
      JSZhuyinDataPackStorage.prototype = Object.create(BinStorage.prototype);
      JSZhuyinDataPackStorage.prototype.setInterchangeablePairs = function(str) {
        if (str === this._interchangeablePairs) {
          return;
        }
        this.incompleteMatchedCache.cleanup();
        var encodedSounds = BopomofoEncoder.encode(str);
        if (encodedSounds.length % 2) {
          throw new Error("JSZhuyinDataPackStorage: Expects string to store pairs.");
        }
        var arr = new Uint16Array(encodedSounds);
        this._interchangeablePairs = str;
        this._interchangeablePairsArr = arr;
      };
      JSZhuyinDataPackStorage.prototype.get = function(codes) {
        if (typeof this.getCache.get(codes) === "object") {
          return this.getCache.get(codes);
        }
        var result = BinStorage.prototype.get.call(this, codes);
        if (result) {
          var dataPack = Object.create(JSZhuyinDataPack.prototype);
          JSZhuyinDataPack.apply(dataPack, result);
          this.getCache.add(codes, dataPack);
          return dataPack;
        } else {
          this.getCache.add(codes, null);
          return null;
        }
      };
      JSZhuyinDataPackStorage.prototype.getRangeFromContentIndex = function() {
        return BinStorage.prototype.getRangeFromContentIndex.apply(this, arguments).map(function(result) {
          var dataPack = Object.create(JSZhuyinDataPack.prototype);
          JSZhuyinDataPack.apply(dataPack, result);
          return dataPack;
        });
      };
      JSZhuyinDataPackStorage.prototype.getIncompleteMatched = function(codes) {
        if (!this.loaded) {
          throw new Error("JSZhuyinDataPackStorage: not loaded.");
        }
        if (typeof this.incompleteMatchedCache.get(codes) === "object") {
          return this.incompleteMatchedCache.get(codes);
        }
        var addresses = codes.reduce(
          function(addresses2, code) {
            var codeIsCompleted = BopomofoEncoder.isCompleted(code);
            return addresses2.reduce(
              function(codeAddresses, address) {
                var a;
                if (!this._interchangeablePairs && codeIsCompleted) {
                  a = this.searchBlock(code, address);
                  if (a !== -1) {
                    return codeAddresses.concat(a);
                  }
                  return codeAddresses;
                }
                var results = this._getIncompleteMatchedSingleCodesInBlock(code, address);
                return codeAddresses.concat(results);
              }.bind(this),
              /* codeAddresses */
              []
            );
          }.bind(this),
          /* addresses */
          [0]
        );
        var dataPacks = addresses.map(function(address) {
          return this._getBlockContent(address);
        }, this).filter(function(result) {
          return !!result;
        }).map(function(result) {
          var dataPack = Object.create(JSZhuyinDataPack.prototype);
          JSZhuyinDataPack.apply(dataPack, result);
          return dataPack;
        });
        if (!dataPacks.length) {
          this.incompleteMatchedCache.add(codes, null);
          return null;
        }
        var dataPackCollection = new JSZhuyinDataPackCollection(dataPacks);
        this.incompleteMatchedCache.add(codes, dataPackCollection);
        return dataPackCollection;
      };
      JSZhuyinDataPackStorage.prototype._getIncompleteMatchedSingleCodesInBlock = function jdps__getIncompleteMatchedSingleCodesInBlock(code, byteOffset) {
        var bin = this._bin;
        var view = new DataView(bin, byteOffset);
        var length = view.getUint16(0, true);
        var contentLength = view.getUint16(2, true);
        var keyBlockByteOffset = byteOffset + (2 + contentLength << 1);
        var addressBlockByteOffset = byteOffset + (2 + contentLength + length << 1);
        var keyBlockView = new DataView(bin, keyBlockByteOffset, length << 1);
        var addressBlockView = new DataView(bin, addressBlockByteOffset, length << 2);
        code = this._replaceInterchangeableSymbols(code);
        var isIncompletionOfCode = BopomofoEncoder.createCompletionComparisonFunction(code);
        var addresses = [], c;
        for (var i = 0; i < length; i++) {
          c = this._replaceInterchangeableSymbols(
            keyBlockView.getUint16(i << 1, true)
          );
          if (isIncompletionOfCode(c)) {
            addresses.push(addressBlockView.getUint32(i << 2, true));
          }
        }
        return addresses;
      };
      JSZhuyinDataPackStorage.prototype.reverseGet = function(str, phraseMaxLength, group) {
        var res = [];
        var bin = this._bin;
        var i, j, dataPack;
        if (!phraseMaxLength) {
          phraseMaxLength = 1;
        }
        var dataPacks = [];
        var getDataPacks = function(byteOffset, keys2) {
          var view = new DataView(bin, byteOffset);
          var length = view.getUint16(0, true);
          var contentLength = view.getUint16(2, true);
          var keyBlockByteOffset = byteOffset + (2 + contentLength << 1);
          var addressBlockByteOffset = byteOffset + (2 + contentLength + length << 1);
          var keyBlockView = new DataView(bin, keyBlockByteOffset, length << 1);
          var addressBlockView = new DataView(bin, addressBlockByteOffset, length << 2);
          if (contentLength !== 0) {
            var result = this._getBlockContent(byteOffset);
            var dataPack2 = Object.create(JSZhuyinDataPack.prototype);
            JSZhuyinDataPack.apply(dataPack2, result);
            if (!dataPacks[keys2.length]) {
              dataPacks[keys2.length] = [];
            }
            dataPacks[keys2.length].push([dataPack2, keys2]);
          }
          if (keys2.length + 1 > phraseMaxLength) {
            return;
          }
          for (var i2 = 0; i2 < length; i2++) {
            getDataPacks(
              addressBlockView.getUint32(i2 << 2, true),
              [].concat(keys2, keyBlockView.getUint16(i2 << 1, true))
            );
          }
        }.bind(this);
        getDataPacks(0, []);
        i = 0;
        var k;
        while (i < str.length) {
          j = Math.min(phraseMaxLength, str.length - i);
          found: do {
            var s = str.substr(i, j);
            for (k = 0; k < dataPacks[j].length; k++) {
              dataPack = dataPacks[j][k][0];
              var keys = dataPacks[j][k][1];
              if (dataPack.getResultsBeginsWith(s).length) {
                if (group) {
                  res.push(keys);
                } else {
                  res = res.concat(keys);
                }
                i += j;
                break found;
              }
            }
            if (j === 1) {
              if (group) {
                res.push([0]);
              } else {
                res[i] = 0;
              }
              i++;
            }
          } while (--j);
        }
        return res;
      };
      JSZhuyinDataPackStorage.prototype.cleanupCache = function(supersetCodes) {
        this.incompleteMatchedCache.cleanup(supersetCodes);
      };
      JSZhuyinDataPackStorage.prototype._replaceInterchangeableSymbols = function(c) {
        if (!this._interchangeablePairs) {
          return c;
        }
        var arr = this._interchangeablePairsArr;
        var n = arr.length;
        for (var i = 0; i < n; i += 2) {
          c = BopomofoEncoder.replace(c, arr[i], arr[i + 1]);
        }
        return c;
      };
    });
  }
});

// src/engine/lib/jszhuyin.js
var require_jszhuyin = __commonJS({
  "src/engine/lib/jszhuyin.js"(exports, module2) {
    "use strict";
    (function(factory) {
      if (typeof module2 === "object" && module2.exports) {
        factory(module2.exports, {
          BopomofoEncoder: require_bopomofo_encoder(),
          JSZhuyinDataPackStorage: require_storage().JSZhuyinDataPackStorage,
          CacheStore: require_storage().CacheStore
        });
      } else if (typeof self === "object") {
        if (typeof self.BopomofoEncoder === "undefined" || typeof self.JSZhuyinDataPackStorage === "undefined" || typeof self.CacheStore === "undefined") {
          throw new Error("Dependency not found.");
        }
        factory(self, self);
      }
    })(function(exports2, required) {
      var BopomofoEncoder = required.BopomofoEncoder;
      var JSZhuyinDataPackStorage = required.JSZhuyinDataPackStorage;
      var CacheStore = required.CacheStore;
      var ActionQueue = exports2.ActionQueue = function ActionQueue2() {
        this.pendingActions = [];
        this.waiting = false;
      };
      ActionQueue.prototype.handle = null;
      ActionQueue.prototype.queue = function aq_queue(type, data, reqId) {
        if (this.waiting) {
          this.pendingActions.push([type, data, reqId]);
          return;
        }
        this.waiting = true;
        this.handle(type, data, reqId);
      };
      ActionQueue.prototype.done = function aq_done() {
        if (!this.waiting) {
          throw new Error("ActionQueue: Calling queue.done() when we are not waiting.");
        }
        var args = this.pendingActions.shift();
        if (!args) {
          this.waiting = false;
          return;
        }
        this.handle.apply(this, args);
      };
      var JSZhuyinCandidateMetadata = function() {
        this.dataMap = /* @__PURE__ */ new Map();
        this.nextId = 42;
        this.NULL_DATA = [0, 0];
      };
      JSZhuyinCandidateMetadata.prototype.NULL_ID = 0;
      JSZhuyinCandidateMetadata.prototype.saveData = function jcm_saveData(encodedSoundsLength, index) {
        this.dataMap.set(this.nextId, [encodedSoundsLength, index]);
        return this.nextId++;
      };
      JSZhuyinCandidateMetadata.prototype.getData = function(id) {
        if (id === this.NULL_ID) {
          return this.NULL_DATA;
        }
        var data = this.dataMap.get(id);
        if (!data) {
          throw new Error("JSZhuyinCandidateMetadata: Inexistent or outdated candidate.");
        }
        return data;
      };
      JSZhuyinCandidateMetadata.prototype.clear = function() {
        this.dataMap.clear();
      };
      var JSZhuyinComposedResultData = function(result, overflowData) {
        result = result || {};
        this.str = result.str || "";
        this.score = result.score || 0;
        this.index = result.index || 0;
        this.overflowData = overflowData;
      };
      JSZhuyinComposedResultData.prototype.copy = function() {
        return new JSZhuyinComposedResultData(this, this.overflowData);
      };
      var JSZhuyinQueryData = function(symbols, longestPhraseLength) {
        this.symbols = symbols;
        this.expendedEncodedSounds = BopomofoEncoder.encodeExpended(this.symbols);
        this.longestPhraseLength = longestPhraseLength;
        this._trimmedSymbols = void 0;
        this._trimmedFromEndSymbols = void 0;
        this._trimmedSymbolsCombinations = void 0;
        this._trimmedFromEndSymbolsCombinations = void 0;
      };
      JSZhuyinQueryData.prototype.getTrimmedSymbols = function() {
        if (this._trimmedSymbols) {
          return this._trimmedSymbols;
        }
        return this._trimmedSymbols = BopomofoEncoder.trimToLength(this.symbols, this.longestPhraseLength);
      };
      JSZhuyinQueryData.prototype.getTrimmedFromEndSymbols = function() {
        if (this._trimmedFromEndSymbols) {
          return this._trimmedFromEndSymbols;
        }
        return this._trimmedFromEndSymbols = BopomofoEncoder.trimToLengthFromEnd(
          this.symbols,
          this.longestPhraseLength
        );
      };
      JSZhuyinQueryData.prototype.getTrimmedSymbolsCombinations = function() {
        if (this._trimmedSymbolsCombinations) {
          return this._trimmedSymbolsCombinations;
        }
        return this._trimmedSymbolsCombinations = BopomofoEncoder.getSymbolCombinations(this.getTrimmedSymbols());
      };
      JSZhuyinQueryData.prototype.getTrimmedFromEndSymbolsCombinations = function() {
        if (this._trimmedFromEndSymbolsCombinations) {
          return this._trimmedFromEndSymbolsCombinations;
        }
        return this._trimmedFromEndSymbolsCombinations = BopomofoEncoder.getSymbolCombinations(this.getTrimmedFromEndSymbols());
      };
      var JSZhuyinComposedCandidatesBuilder = function JSZhuyinComposedCandidatesBuilder2() {
        this.cache = null;
      };
      JSZhuyinComposedCandidatesBuilder.prototype.LONGEST_PHRASE_LENGTH = void 0;
      JSZhuyinComposedCandidatesBuilder.prototype.load = function(storage) {
        this.storage = storage;
        this.cache = new CacheStore();
      };
      JSZhuyinComposedCandidatesBuilder.prototype.unload = function() {
        this.cache = null;
        this.storage = null;
      };
      JSZhuyinComposedCandidatesBuilder.prototype.addToCache = function(expendedEncodedSounds, data) {
        this.cache.add(expendedEncodedSounds, data);
        return data;
      };
      JSZhuyinComposedCandidatesBuilder.prototype.cleanupCache = function(supersetCodes) {
        this.cache.cleanup(supersetCodes);
      };
      JSZhuyinComposedCandidatesBuilder.prototype.getComposedCandidates = function(queryData) {
        var expendedEncodedSounds = queryData.expendedEncodedSounds;
        var previousFirstResults = [void 0];
        var lastComposedResultData;
        var i = 0;
        var n = expendedEncodedSounds.length;
        var slicedExpendedEncodedSounds;
        while (++i <= n) {
          slicedExpendedEncodedSounds = expendedEncodedSounds.slice(0, i);
          lastComposedResultData = this.cache.get(slicedExpendedEncodedSounds);
          if (lastComposedResultData === void 0) {
            lastComposedResultData = this._getFirstComposedResult(
              slicedExpendedEncodedSounds,
              previousFirstResults
            );
            this.addToCache(slicedExpendedEncodedSounds, lastComposedResultData);
          }
          previousFirstResults[i] = lastComposedResultData;
        }
        return lastComposedResultData;
      };
      JSZhuyinComposedCandidatesBuilder.prototype._getFirstComposedResult = function(expendedEncodedSounds, previousFirstResults) {
        var storage = this.storage;
        var composedResultDataArr = previousFirstResults.reduce(
          function(composedResultDataArr2, previousFirstResult, i) {
            if (i !== 0 && previousFirstResult === null) {
              return composedResultDataArr2;
            }
            var currentComposedResultDataArr = BopomofoEncoder.getSymbolCombinations(
              expendedEncodedSounds.slice(i),
              this.LONGEST_PHRASE_LENGTH
            ).map(function(symbolCodes) {
              return [storage.getIncompleteMatched(symbolCodes), symbolCodes];
            }).filter(function(symbolCodesResultData) {
              return !!symbolCodesResultData[0];
            }).map(function(symbolCodesResultData) {
              var symbolCodesFirstResult = symbolCodesResultData[0].getFirstResult();
              var composedResultData2;
              if (i !== 0) {
                composedResultData2 = previousFirstResult.copy();
                composedResultData2.str += symbolCodesFirstResult.str;
                composedResultData2.score += symbolCodesFirstResult.score;
                composedResultData2.index = symbolCodesFirstResult.index;
              } else {
                composedResultData2 = new JSZhuyinComposedResultData(
                  symbolCodesFirstResult,
                  [
                    symbolCodesFirstResult.str,
                    BopomofoEncoder.decode(symbolCodesResultData[1]).length
                  ]
                );
              }
              return composedResultData2;
            });
            if (currentComposedResultDataArr.length === 0) {
              var composedResultData;
              if (previousFirstResult) {
                composedResultData = previousFirstResult.copy();
              } else {
                var firstSymbols = BopomofoEncoder.decode(expendedEncodedSounds.slice(i, 1));
                composedResultData = new JSZhuyinComposedResultData(
                  null,
                  [firstSymbols, firstSymbols.length]
                );
              }
              composedResultData.str += BopomofoEncoder.decode(expendedEncodedSounds.slice(i));
              composedResultData.score = -Infinity;
              composedResultDataArr2.push(composedResultData);
              return composedResultDataArr2;
            } else {
              return composedResultDataArr2.concat(currentComposedResultDataArr);
            }
          }.bind(this),
          /* composedResultDataArr */
          []
        ).sort(function(a, b) {
          if (b.score > a.score) {
            return 1;
          }
          if (b.score < a.score) {
            return -1;
          }
          if (b.str > a.str) {
            return 1;
          }
          if (b.str < a.str) {
            return -1;
          }
          return 0;
        });
        return composedResultDataArr[0];
      };
      var JSZhuyinPartialMatchingCandidatesBuilder = function() {
      };
      JSZhuyinPartialMatchingCandidatesBuilder.prototype.load = function(storage) {
        this.storage = storage;
      };
      JSZhuyinPartialMatchingCandidatesBuilder.prototype.unload = function() {
        this.cache = null;
      };
      JSZhuyinPartialMatchingCandidatesBuilder.prototype.getCandidates = function(queryData) {
        var storage = this.storage;
        var insertFullyMatched = queryData.getTrimmedSymbols() !== queryData.symbols;
        var dataPackResultDataArr = queryData.getTrimmedSymbolsCombinations().map(function(symbolCodes) {
          var symbolCodeDataArr = [];
          var arr, symbolLength;
          var i = 0;
          var n = insertFullyMatched ? symbolCodes.length : symbolCodes.length - 1;
          while (i++ < n) {
            arr = symbolCodes.slice(0, i);
            symbolLength = BopomofoEncoder.decode(arr).length;
            symbolCodeDataArr.push([symbolLength, arr]);
          }
          return symbolCodeDataArr;
        }).reduce(
          function(orderedSymbolCodeArrs, symbolCodeDataArr) {
            symbolCodeDataArr.forEach(function(symbolCodeData) {
              if (!orderedSymbolCodeArrs[symbolCodeData[0]]) {
                orderedSymbolCodeArrs[symbolCodeData[0]] = [];
                orderedSymbolCodeArrs[symbolCodeData[0]].push(symbolCodeData[1]);
              } else {
                var isDuplication = orderedSymbolCodeArrs[symbolCodeData[0]].some(function(arr) {
                  return arr.length === symbolCodeData[1] && arr.some(function(code, i) {
                    return code === symbolCodeData[1][i];
                  });
                });
                if (!isDuplication) {
                  orderedSymbolCodeArrs[symbolCodeData[0]].push(symbolCodeData[1]);
                }
              }
            });
            return orderedSymbolCodeArrs;
          },
          /* orderedSymbolCodeArrs */
          []
        ).map(function(symbolCodeArrs, symbolLength) {
          var allDataPackResult = symbolCodeArrs.map(function(symbolCodes) {
            if (!storage.getIncompleteMatched(symbolCodes)) {
              return null;
            }
            return storage.getIncompleteMatched(symbolCodes).getResults();
          }).filter(function(dataPackResult) {
            return dataPackResult !== null;
          }).reduce(
            function(allDataPackResult2, dataPackResult) {
              return allDataPackResult2.concat(dataPackResult);
            },
            /* allDataPackResult */
            []
          ).sort(function(a, b) {
            if (b.score > a.score) {
              return 1;
            }
            if (b.score < a.score) {
              return -1;
            }
            if (b.str > a.str) {
              return 1;
            }
            if (b.str < a.str) {
              return -1;
            }
            return 0;
          });
          if (!allDataPackResult.length) {
            return;
          }
          return [symbolLength, allDataPackResult];
        }).filter(function(dataPackResultData) {
          return dataPackResultData;
        }).reverse();
        return dataPackResultDataArr;
      };
      var JSZhuyin = exports2.JSZhuyin = function JSZhuyin2() {
        this.storage = null;
        this.symbols = "";
        this.confirmedPartIndex = 0;
        this.confirmedCharacters = "";
        this.defaultCandidate = void 0;
        this.composedCandidatesBuilder = new JSZhuyinComposedCandidatesBuilder();
        this.partiallyMatchedCandidatesBuilder = new JSZhuyinPartialMatchingCandidatesBuilder();
        this.overflowCandidateString = "";
        this.overflowCandidateSymbolLength = 0;
        this.queue = null;
        this.candidateMetadata = null;
      };
      JSZhuyin.prototype.MAX_SOUNDS_LENGTH = 48;
      JSZhuyin.prototype.LONGEST_PHRASE_LENGTH = 6;
      JSZhuyin.prototype.SUGGEST_PHRASES = true;
      JSZhuyin.prototype.REORDER_SYMBOLS = false;
      JSZhuyin.prototype.INTERCHANGABLE_PAIRS = "";
      JSZhuyin.prototype.DATA_ARRAY_BUFFER = null;
      JSZhuyin.prototype.MUST_HANDLE_ALL_KEYS = false;
      JSZhuyin.prototype.dataURL = "";
      JSZhuyin.prototype.onloadend = null;
      JSZhuyin.prototype.onload = null;
      JSZhuyin.prototype.onunload = null;
      JSZhuyin.prototype.ondownloadprogress = null;
      JSZhuyin.prototype.onerror = null;
      JSZhuyin.prototype.onactionhandled = null;
      JSZhuyin.prototype.oncompositionupdate = null;
      JSZhuyin.prototype.oncompositionend = null;
      JSZhuyin.prototype.oncandidateschange = null;
      JSZhuyin.prototype.handleKey = function jz_handleKey(key, reqId) {
        if (!this.queue) {
          throw new Error("JSZhuyin: You need to load() first.");
        }
        if (typeof key !== "string") {
          throw new Error("JSZhuyin: key passed to handleKey must be a string.");
        }
        if (this.MUST_HANDLE_ALL_KEYS) {
          this.queue.queue("key", key, reqId);
          return true;
        }
        if (key.length === 1 && BopomofoEncoder.isBopomofoSymbol(key)) {
          this.queue.queue("key", key, reqId);
          return true;
        }
        if (key.length > 1) {
          var isAllBopomofoSymbols = key.split("").every(function(chr) {
            return BopomofoEncoder.isBopomofoSymbol(chr);
          });
          if (isAllBopomofoSymbols) {
            this.queue.queue("key", key, reqId);
            return true;
          }
        }
        if (this.defaultCandidate || this.symbols) {
          this.queue.queue("key", key, reqId);
          return true;
        }
        return false;
      };
      JSZhuyin.prototype.handleKeyEvent = function jz_handleKeyEvent(code, reqId) {
        var key;
        switch (code) {
          case 8:
            key = "Backspace";
            break;
          case 13:
            key = "Enter";
            break;
          case 27:
            key = "Escape";
            break;
          default:
            key = String.fromCharCode(code);
        }
        return this.handleKey(key, reqId);
      };
      JSZhuyin.prototype.selectCandidate = function jz_selCandi(candidate, reqId) {
        if (!Array.isArray(candidate) || typeof candidate[0] !== "string" || typeof candidate[1] !== "number") {
          throw new Error("JSZhuyin: malformed candidate object in selectCandidate call.");
        }
        this.queue.queue("candidateSelection", candidate, reqId);
      };
      JSZhuyin.prototype.load = function jz_load(data) {
        if (this.loaded) {
          throw new Error("Already loaded.");
        }
        this.loaded = true;
        this.symbols = "";
        this.defaultCandidate = void 0;
        this.queue = new ActionQueue();
        this.queue.handle = this.handle.bind(this);
        this.storage = new JSZhuyinDataPackStorage();
        this.candidateMetadata = new JSZhuyinCandidateMetadata();
        this.composedCandidatesBuilder.load(this.storage);
        this.partiallyMatchedCandidatesBuilder.load(this.storage);
        if (this.DATA_ARRAY_BUFFER && !data) {
          data = this.DATA_ARRAY_BUFFER;
        }
        if (data instanceof ArrayBuffer) {
          this.storage.load(data);
          if (typeof this.onload === "function") {
            this.onload();
          }
          if (typeof this.onloadend === "function") {
            this.onloadend();
          }
        } else {
          this.dataLoader = new DataLoader();
          if (this.dataURL) {
            this.dataLoader.DATA_URL = this.dataURL;
          }
          this.dataLoader.onerror = function(err) {
            if (typeof this.onerror === "function") {
              this.onerror(err);
            }
          }.bind(this);
          this.dataLoader.onload = function() {
            this.storage.load(this.dataLoader.data);
            if (typeof this.onload === "function") {
              this.onload();
            }
          }.bind(this);
          this.dataLoader.onloadend = function() {
            if (typeof this.onloadend === "function") {
              this.onloadend();
            }
          }.bind(this);
          this.dataLoader.onprogress = function(progress) {
            if (typeof this.ondownloadprogress === "function") {
              this.ondownloadprogress(progress);
            }
          }.bind(this);
          this.dataLoader.load();
        }
      };
      JSZhuyin.prototype.setConfig = function(config) {
        for (var key in config) {
          this[key] = config[key];
        }
      };
      JSZhuyin.prototype.unload = function jz_unload() {
        if (!this.loaded) {
          throw new Error("Already unloaded.");
        }
        this.queue.queue("unload");
      };
      JSZhuyin.prototype.unloadSync = function jz_unloadSync() {
        if (!this.loaded) {
          throw new Error("Already unloaded.");
        }
        this.loaded = false;
        if (this.storage) {
          this.storage.unload();
          this.storage = null;
        }
        if (this.dataLoader) {
          this.dataLoader = null;
        }
        if (this.composedCandidatesBuilder) {
          this.composedCandidatesBuilder.unload();
          this.composedCandidatesBuilder = null;
        }
        if (this.partiallyMatchedCandidatesBuilder) {
          this.partiallyMatchedCandidatesBuilder.unload();
          this.partiallyMatchedCandidatesBuilder = null;
        }
        this.symbols = "";
        this.storage = null;
        this.defaultCandidate = void 0;
        this.queue.handle = null;
        this.queue = null;
        if (typeof this.onunload === "function") {
          this.onunload();
        }
      };
      JSZhuyin.prototype.handle = function jz_handle(type, data, reqId) {
        switch (type) {
          case "key":
            switch (data) {
              case "Backspace":
                if (this.symbols.length === 0) {
                  this.sendActionHandled(reqId);
                  this.queue.done();
                  break;
                }
                this.symbols = this.symbols.substr(0, this.symbols.length - 1);
                this.query(reqId);
                break;
              case "Enter":
                if (!this.defaultCandidate) {
                  this.sendActionHandled(reqId);
                  this.queue.done();
                  break;
                }
                this.confirmCandidate(this.defaultCandidate, reqId);
                break;
              case "Escape":
                this.symbols = "";
                this.query(reqId);
                break;
              default:
                if (data.length === 1 && BopomofoEncoder.isBopomofoSymbol(data)) {
                  var mode = this.REORDER_SYMBOLS ? BopomofoEncoder.APPEND_MODE_REORDER : BopomofoEncoder.APPEND_MODE_NONE;
                  this.symbols = BopomofoEncoder.appendToSymbols(this.symbols, data, mode);
                  this.query(reqId);
                  break;
                }
                if (data.length > 1) {
                  var isAllBopomofoSymbols = data.split("").every(function(chr) {
                    return BopomofoEncoder.isBopomofoSymbol(chr);
                  });
                  if (isAllBopomofoSymbols) {
                    this.symbols += data;
                    this.query(reqId);
                    break;
                  }
                }
                if (!this.defaultCandidate) {
                  this.sendActionHandled(reqId);
                  this.queue.done();
                  break;
                }
                if (this.defaultCandidate) {
                  this.confirmCandidate(
                    [
                      this.defaultCandidate[0] + data,
                      this.defaultCandidate[1]
                    ],
                    reqId
                  );
                } else {
                  this.confirmCandidate([data, this.candidateMetadata.NULL_ID]);
                }
                break;
            }
            break;
          case "candidateSelection":
            this.confirmCandidate(data, reqId);
            break;
          case "unload":
            this.unloadSync();
            break;
          default:
            throw new Error("Unknown action type: " + type);
        }
      };
      JSZhuyin.prototype.query = function jz_query(reqId) {
        if (this.symbols.length === 0) {
          this.candidateMetadata.clear();
          this.updateComposition(reqId);
          this.updateCandidates([], reqId);
          this.sendActionHandled(reqId);
          this.queue.done();
          return;
        }
        var queryData = new JSZhuyinQueryData(
          this.symbols,
          this.LONGEST_PHRASE_LENGTH
        );
        if (queryData.expendedEncodedSounds.length > this.MAX_SOUNDS_LENGTH) {
          this.endComposition(this.overflowCandidateString, reqId);
          this.symbols = this.symbols.substr(this.overflowCandidateSymbolLength);
          queryData = new JSZhuyinQueryData(this.symbols, this.LONGEST_PHRASE_LENGTH);
        }
        this.updateComposition(reqId);
        this.storage.setInterchangeablePairs(this.INTERCHANGABLE_PAIRS);
        var results = [];
        var storage = this.storage;
        this.overflowCandidateString = "";
        this.overflowCandidateSymbolLength = 0;
        this.candidateMetadata.clear();
        results = this._insertFullyMatchingCandidates(results, queryData);
        results = this._insertFullyMatchingComposedCandidates(results, queryData);
        results = this._insertPartialMatchingCandidates(results, queryData);
        results = this._insertTypoHints(results, queryData.expendedEncodedSounds);
        this.updateCandidates(results, reqId);
        this.sendActionHandled(reqId);
        this.composedCandidatesBuilder.cleanupCache(queryData.expendedEncodedSounds);
        var supersetCodes = [].concat(
          queryData.getTrimmedSymbolsCombinations(),
          queryData.getTrimmedFromEndSymbolsCombinations()
        ).reduce(
          function(supersetCodes2, symbolCodes) {
            return supersetCodes2.concat(symbolCodes);
          },
          /* supersetCodes */
          []
        );
        storage.cleanupCache(supersetCodes);
        this.queue.done();
      };
      JSZhuyin.prototype._insertFullyMatchingCandidates = function(results, queryData) {
        if (queryData.getTrimmedSymbols() !== this.symbols) {
          return results;
        }
        var storage = this.storage;
        var expendedEncodedSounds = queryData.expendedEncodedSounds;
        var combinations = queryData.getTrimmedSymbolsCombinations();
        combinations.map(function(symbolCodes) {
          if (symbolCodes.length > this.LONGEST_PHRASE_LENGTH) {
            return null;
          }
          return storage.getIncompleteMatched(symbolCodes);
        }.bind(this)).reduce(
          function(resultsArr, dataPack) {
            if (!dataPack) {
              return resultsArr;
            }
            return resultsArr.concat(dataPack.getResults());
          },
          /* resultsArr */
          []
        ).sort(function(a, b) {
          if (b.score > a.score) {
            return 1;
          }
          if (b.score < a.score) {
            return -1;
          }
          if (b.str > a.str) {
            return 1;
          }
          if (b.str < a.str) {
            return -1;
          }
          return 0;
        }).forEach(function(result, i) {
          if (!this.overflowCandidateString) {
            this.overflowCandidateString = result.str;
            this.overflowCandidateSymbolLength = this.symbols.length;
          }
          if (i === 0) {
            this.composedCandidatesBuilder.addToCache(
              expendedEncodedSounds,
              new JSZhuyinComposedResultData(
                result,
                [result.str, this.symbols.length]
              )
            );
          }
          results.push([
            result.str,
            this.candidateMetadata.saveData(this.symbols.length, result.index)
          ]);
        }.bind(this));
        return results;
      };
      JSZhuyin.prototype._insertFullyMatchingComposedCandidates = function(results, queryData) {
        if (results.length) {
          return results;
        }
        this.composedCandidatesBuilder.LONGEST_PHRASE_LENGTH = this.LONGEST_PHRASE_LENGTH;
        var composedResultData = this.composedCandidatesBuilder.getComposedCandidates(queryData);
        if (!this.overflowCandidateString) {
          this.overflowCandidateString = composedResultData.overflowData[0];
          this.overflowCandidateSymbolLength = composedResultData.overflowData[1];
        }
        results.push([
          composedResultData.str,
          this.candidateMetadata.saveData(
            this.symbols.length,
            composedResultData.index
          )
        ]);
        return results;
      };
      JSZhuyin.prototype._insertPartialMatchingCandidates = function(results, queryData) {
        var dataPackResultDataArr = this.partiallyMatchedCandidatesBuilder.getCandidates(queryData);
        dataPackResultDataArr.forEach(function(dataPackResultData) {
          var symbolLength = dataPackResultData[0];
          dataPackResultData[1].forEach(function(result) {
            var isDuplication = [].concat(results).reverse().some(function(previousResult) {
              return previousResult[0] === result.str;
            });
            if (isDuplication) {
              return;
            }
            if (!this.overflowCandidateString) {
              this.overflowCandidateString = result.str;
              this.overflowCandidateSymbolLength = symbolLength;
            }
            var res = [
              result.str,
              this.candidateMetadata.saveData(symbolLength, result.index)
            ];
            results.push(res);
          }.bind(this));
        }.bind(this));
        return results;
      };
      JSZhuyin.prototype._insertTypoHints = function(results, expendedEncodedSounds) {
        if (results.length === 1 && expendedEncodedSounds.length !== 1) {
          var symbols = BopomofoEncoder.decode([expendedEncodedSounds[0]]);
          results.push([symbols, this.candidateMetadata.saveData(symbols.length, 0)]);
        }
        return results;
      };
      JSZhuyin.prototype.suggest = function jz_suggest(reqId) {
        this.candidateMetadata.clear();
        if (this.confirmedPartIndex === this.candidateMetadata.NULL_ID || !this.SUGGEST_PHRASES) {
          this.updateCandidates([], reqId);
          this.sendActionHandled(reqId);
          this.queue.done();
          return;
        }
        var suggests = [];
        var confirmedCharactersLength = this.confirmedCharacters.length;
        var results = this.storage.getRangeFromContentIndex(this.confirmedPartIndex);
        results.forEach(function each_suggest(dataPack) {
          var dataPackResults = dataPack.getResultsBeginsWith(this.confirmedCharacters);
          dataPackResults.forEach(function each_result(dataPackResult) {
            var found = suggests.some(function finddup(suggest) {
              return dataPackResult.str === suggest.str;
            });
            if (!found) {
              suggests.push(dataPackResult);
            }
          });
        }.bind(this));
        var candidates = [];
        suggests.sort(function sort_suggests(a, b) {
          if (b.score > a.score) {
            return 1;
          }
          if (b.score < a.score) {
            return -1;
          }
          if (b.str > a.str) {
            return 1;
          }
          if (b.str < a.str) {
            return -1;
          }
          return 0;
        }).forEach(function each_suggests(suggests2) {
          candidates.push([
            suggests2.str.substr(confirmedCharactersLength),
            this.candidateMetadata.NULL_ID
          ]);
        }, this);
        this.updateCandidates(candidates, reqId);
        this.sendActionHandled(reqId);
        this.queue.done();
      };
      JSZhuyin.prototype.updateComposition = function jz_updateComposition(reqId) {
        if (typeof this.oncompositionupdate === "function") {
          this.oncompositionupdate(this.symbols, reqId);
        }
      };
      JSZhuyin.prototype.endComposition = function jz_endComposition(str, reqId) {
        if (typeof this.oncompositionend === "function") {
          this.oncompositionend(str, reqId);
        }
      };
      JSZhuyin.prototype.updateCandidates = function jz_updateCandidates(results, reqId) {
        if (results[0] && results[0][1]) {
          this.defaultCandidate = results[0];
        } else {
          this.defaultCandidate = void 0;
        }
        if (typeof this.oncandidateschange === "function") {
          this.oncandidateschange(results, reqId);
        }
      };
      JSZhuyin.prototype.confirmCandidate = function jz_confirmCandidate(candidate, reqId) {
        this.endComposition(candidate[0], reqId);
        this.confirmedCharacters = candidate[0];
        var metadata = this.candidateMetadata.getData(candidate[1]);
        this.confirmedPartIndex = metadata[1];
        this.symbols = this.symbols.substr(metadata[0]);
        if (this.symbols.length !== 0) {
          this.query(reqId);
        } else {
          this.updateComposition(reqId);
          this.suggest(reqId);
        }
      };
      JSZhuyin.prototype.sendActionHandled = function jz_sendActionHandled(reqId) {
        if (typeof this.onactionhandled === "function") {
          this.onactionhandled(reqId);
        }
      };
    });
  }
});

// src/input/caret.ts
var caret_exports = {};
__export(caret_exports, {
  getCaretRect: () => getCaretRect,
  getCaretRectForElement: () => getCaretRectForElement
});
function getMirrorDiv() {
  if (!_mirrorDiv) {
    _mirrorDiv = document.createElement("div");
    _mirrorDiv.style.cssText = "position:fixed;visibility:hidden;white-space:pre-wrap;word-break:break-all;overflow:auto;pointer-events:none;top:0;left:0;z-index:-1;font-size:14px;";
    document.body.appendChild(_mirrorDiv);
  }
  return _mirrorDiv;
}
function getContenteditableCaret(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const anchorNode = sel.anchorNode;
  if (!anchorNode || !el.contains(anchorNode)) return null;
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);
  if (range.startContainer.nodeType === Node.ELEMENT_NODE && range.startOffset === 0 && (!el.textContent || el.textContent.length === 0)) {
    const r = el.getBoundingClientRect();
    return new DOMRect(r.left + 2, r.top + 2, 0, r.height);
  }
  const rects = range.getClientRects();
  if (rects && rects.length > 0) {
    return rects[0];
  }
  try {
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const r2 = document.createRange();
      r2.setStart(range.startContainer, Math.max(0, range.startOffset - 1));
      r2.setEnd(range.startContainer, range.startOffset);
      const r2rects = r2.getClientRects();
      if (r2rects && r2rects.length > 0) {
        return r2rects[r2rects.length - 1];
      }
    }
  } catch (_) {
  }
  return null;
}
function getInputCaret(el) {
  const div = getMirrorDiv();
  const computed = window.getComputedStyle(el);
  const styles = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "font-variant",
    "letter-spacing",
    "word-spacing",
    "text-indent",
    "text-transform",
    "line-height",
    "padding",
    "border",
    "box-sizing",
    "white-space",
    "word-break",
    "overflow-wrap"
  ];
  styles.forEach((p) => {
    div.style[p] = computed.getPropertyValue(p);
  });
  const rect = el.getBoundingClientRect();
  div.style.width = rect.width + "px";
  div.style.height = "auto";
  const textBefore = el.value.substring(0, el.selectionStart);
  div.textContent = textBefore;
  const marker = document.createElement("span");
  marker.textContent = el.value.charAt(el.selectionEnd) || "\u200B";
  div.appendChild(marker);
  return marker.getBoundingClientRect();
}
function getCaretRect(el) {
  if (!el || !document.contains(el)) return null;
  if (el.isContentEditable || el.contentEditable === "true") {
    return getContenteditableCaret(el);
  }
  if ("selectionStart" in el && typeof el.selectionStart === "number") {
    return getInputCaret(el);
  }
  return null;
}
function getCaretRectForElement(el) {
  return getCaretRect(el) || el.getBoundingClientRect();
}
var _mirrorDiv;
var init_caret = __esm({
  "src/input/caret.ts"() {
    "use strict";
    _mirrorDiv = null;
  }
});

// src/input/commit.ts
var commit_exports = {};
__export(commit_exports, {
  commitText: () => commitText,
  getEditableElement: () => getEditableElement,
  isElementEditable: () => isElementEditable
});
function isElementEditable(el) {
  if (!el) return false;
  const html = el;
  if (html.isContentEditable) return true;
  if (html.querySelector && html.querySelector(".cm-content")) return true;
  if (html.tagName === "TEXTAREA") return true;
  if (html.tagName === "INPUT" && EDITABLE_INPUT_TYPES.includes(el.type)) {
    return true;
  }
  return false;
}
function getEditableElement() {
  const el = document.activeElement;
  return el && isElementEditable(el) ? el : null;
}
function isInsideCodeMirrorEditor(el) {
  return !!el.closest(".cm-editor");
}
function commitText(text, app) {
  if (!text) return false;
  const el = getEditableElement();
  if (!el) return false;
  try {
    if (isInsideCodeMirrorEditor(el)) {
      const view = app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
      if (view && view.editor) {
        view.editor.replaceSelection(text);
        return true;
      }
    }
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT" && "value" in el) {
      commitToInput(text, el);
      return true;
    }
    if (el.isContentEditable) {
      commitToContenteditable(text, el);
      return true;
    }
    return false;
  } catch (e) {
    console.error("[JSZhuyin IME] commitText error:", e);
    return false;
  }
}
function commitToInput(text, el) {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (!nativeSetter) return;
  const selStart = el.selectionStart ?? 0;
  const selEnd = el.selectionEnd ?? 0;
  nativeSetter.call(
    el,
    el.value.substring(0, selStart) + text + el.value.substring(selEnd)
  );
  const newPos = selStart + text.length;
  el.selectionStart = newPos;
  el.selectionEnd = newPos;
  el.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
      isComposing: false
    })
  );
}
function commitToContenteditable(text, el) {
  if (document.activeElement !== el && !el.contains(document.activeElement)) {
    el.focus();
  }
  const success = document.execCommand("insertText", false, text);
  if (!success) {
    fallbackInsertText(text);
  }
}
function fallbackInsertText(text) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    const node = range.startContainer;
    const offset = range.startOffset;
    node.textContent = (node.textContent || "").substring(0, offset) + text + (node.textContent || "").substring(offset);
    range.setStart(node, offset + text.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
var import_obsidian, EDITABLE_INPUT_TYPES;
var init_commit = __esm({
  "src/input/commit.ts"() {
    "use strict";
    import_obsidian = require("obsidian");
    EDITABLE_INPUT_TYPES = [
      "text",
      "search",
      "url",
      "email",
      "tel",
      "number",
      "password",
      "date",
      "month",
      "week",
      "time",
      "datetime-local"
    ];
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => JsZhuyinPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/engine/ime-client.ts
var JSZhuyinLib = require_jszhuyin();
var ImeClient = class {
  constructor() {
    this._engine = null;
    this._initialized = false;
    this._reqId = 0;
    this.compositionActive = false;
    this.symbols = "";
    this.candidates = [];
    this.oncompositionupdate = null;
    this.oncandidateschange = null;
    this.oncompositionend = null;
  }
  async init(callbacks) {
    if (this._initialized) return;
    if (callbacks) {
      if (callbacks.oncompositionupdate) this.oncompositionupdate = callbacks.oncompositionupdate;
      if (callbacks.oncandidateschange) this.oncandidateschange = callbacks.oncandidateschange;
      if (callbacks.oncompositionend) this.oncompositionend = callbacks.oncompositionend;
    }
    this._initialized = true;
  }
  handleKey(key) {
    if (!this._initialized || !this._engine) return false;
    this._reqId++;
    return this._engine.handleKey(key, this._reqId);
  }
  selectCandidate(index) {
    if (!this._initialized || !this._engine) return;
    const cand = this.candidates[index];
    if (!cand) return;
    this._reqId++;
    this._engine.selectCandidate(cand, this._reqId);
  }
  unload() {
    if (this._engine) {
      try {
        this._engine.unload();
      } catch (_) {
      }
      this._engine = null;
    }
    this._initialized = false;
    this.symbols = "";
    this.candidates = [];
    this.compositionActive = false;
  }
  /** Load dictionary ArrayBuffer and start the JSZhuyin engine. */
  async loadDictionary(data) {
    const engine = new JSZhuyinLib.JSZhuyin();
    engine.DATA_ARRAY_BUFFER = data;
    engine.REORDER_SYMBOLS = true;
    engine.load();
    const self2 = this;
    engine.oncompositionupdate = function(symbols, _reqId) {
      self2.symbols = symbols;
      self2.compositionActive = !!symbols;
      if (self2.oncompositionupdate) {
        self2.oncompositionupdate(symbols);
      }
    };
    engine.oncandidateschange = function(candidates, _reqId) {
      self2.candidates = candidates || [];
      if (self2.oncandidateschange) {
        self2.oncandidateschange(self2.candidates);
      }
    };
    engine.oncompositionend = function(text, _reqId) {
      self2.compositionActive = false;
      self2.symbols = "";
      if (self2.oncompositionend) {
        self2.oncompositionend(text);
      }
    };
    engine.onerror = function(err) {
      console.error("[JSZhuyin IME] Engine error:", err);
    };
    this._engine = engine;
  }
  async _loadEngine() {
  }
};

// src/ui/overlay.ts
var ImeOverlay = class {
  constructor() {
    this._host = null;
    this._candidates = [];
    this._page = 0;
    this._CANDIDATES_PER_PAGE = 9;
    this.oncandidateselect = null;
    this._createHost();
  }
  setComposition(symbols) {
    const compEl = this._get(".composition-text");
    const lineEl = this._get(".composition-line");
    if (!compEl || !lineEl) return;
    if (!symbols) {
      compEl.textContent = "";
      lineEl.style.display = "none";
      if (this._candidates.length === 0) {
        this._hide();
      }
    } else {
      compEl.textContent = symbols;
      lineEl.style.display = "flex";
      this._show();
    }
  }
  setCandidates(candidates) {
    this._candidates = candidates || [];
    this._page = 0;
    this._renderCandidates();
    if (this._candidates.length === 0) {
      this._hide();
    } else {
      this._show();
    }
  }
  positionAt(x, y) {
    const host = this._host;
    if (!host) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    host.style.display = "flex";
    const hostRect = host.getBoundingClientRect();
    let left = x;
    let top = y + 4;
    if (left + hostRect.width > vw - 8) {
      left = vw - hostRect.width - 8;
    }
    if (left < 4) left = 4;
    if (top + hostRect.height > vh - 8) {
      top = y - hostRect.height - 8;
      if (top < 4) top = 4;
    }
    host.style.left = left + "px";
    host.style.top = top + "px";
  }
  nextPage() {
    if ((this._page + 1) * this._CANDIDATES_PER_PAGE >= this._candidates.length) return;
    this._page++;
    this._renderCandidates();
  }
  prevPage() {
    if (this._page === 0) return;
    this._page--;
    this._renderCandidates();
  }
  selectAt(index) {
    const globalIndex = this._page * this._CANDIDATES_PER_PAGE + index;
    return this._candidates[globalIndex] || null;
  }
  showLoading() {
    const el = this._get(".loading-text");
    if (el) {
      el.style.display = "block";
      el.textContent = "\u8F09\u5165\u8A5E\u5EAB\u4E2D\u2026";
    }
  }
  hideLoading() {
    const el = this._get(".loading-text");
    if (el) el.style.display = "none";
  }
  destroy() {
    if (this._host && this._host.parentNode) {
      this._host.parentNode.removeChild(this._host);
    }
    this._host = null;
  }
  // ---- internals ----
  _createHost() {
    const host = document.createElement("div");
    host.id = "jszhuyin-obsidian-overlay";
    host.className = "jszhuyin-overlay-host";
    host.innerHTML = this._buildHTML();
    document.body.appendChild(host);
    this._host = host;
    host.addEventListener("mousedown", (evt) => {
      const target = evt.target.closest(".jszhuyin-candidate-item");
      if (!target) return;
      const index = parseInt(target.getAttribute("data-index") || "-1", 10);
      if (isNaN(index) || index < 0) return;
      evt.preventDefault();
      evt.stopPropagation();
      const candidate = this.selectAt(index);
      if (candidate && this.oncandidateselect) {
        this.oncandidateselect(candidate);
      }
    });
  }
  _buildHTML() {
    return '<div class="jszhuyin-container"><div class="jszhuyin-loading loading-text" style="display:none">\u8F09\u5165\u8A5E\u5EAB\u4E2D\u2026</div><div class="composition-line" style="display:none"><span class="composition-text"></span></div><div class="candidates-list"></div><div class="pagination"><span class="page-left">\u2190</span><span class="page-info"></span><span class="page-right">\u2192</span></div></div>';
  }
  _renderCandidates() {
    const listEl = this._get(".candidates-list");
    const paginationEl = this._get(".pagination");
    if (!listEl) return;
    listEl.innerHTML = "";
    const CPP = this._CANDIDATES_PER_PAGE;
    const start = this._page * CPP;
    const pageCands = this._candidates.slice(start, start + CPP);
    pageCands.forEach((candidate, i) => {
      const item = document.createElement("div");
      item.className = "jszhuyin-candidate-item";
      if (i === 0) item.classList.add("selected");
      item.setAttribute("data-index", String(i));
      const idx = document.createElement("span");
      idx.className = "jszhuyin-candidate-index";
      idx.textContent = String(i + 1);
      const txt = document.createElement("span");
      txt.className = "jszhuyin-candidate-text";
      txt.textContent = candidate[0];
      item.appendChild(idx);
      item.appendChild(txt);
      listEl.appendChild(item);
    });
    const totalPages = Math.ceil(this._candidates.length / CPP);
    const pageLeft = this._get(".page-left");
    const pageRight = this._get(".page-right");
    const pageInfo = this._get(".page-info");
    if (pageLeft) pageLeft.style.display = this._page > 0 ? "inline" : "none";
    if (pageRight) pageRight.style.display = this._page < totalPages - 1 ? "inline" : "none";
    if (pageInfo) pageInfo.textContent = `${this._page + 1}/${totalPages}`;
  }
  _show() {
    if (this._host) this._host.style.display = "flex";
  }
  _hide() {
    if (this._host) this._host.style.display = "none";
  }
  _get(selector) {
    return this._host ? this._host.querySelector(selector) : null;
  }
};

// src/engine/layout-mapper.ts
var JSZhuyinLayoutMapper = {
  codes: [
    "Backquote",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Digit0",
    "Minus",
    "Equal",
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyU",
    "KeyI",
    "KeyO",
    "KeyP",
    "BracketLeft",
    "BracketRight",
    "Backslash",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
    "Quote",
    "KeyZ",
    "KeyX",
    "KeyC",
    "KeyV",
    "KeyB",
    "KeyN",
    "KeyM",
    "Comma",
    "Period",
    "Slash",
    "Space"
  ],
  map: "\u22EF\u3105\u3109\u02C7\u02CB\u3113\u02CA\u02D9\u311A\u311E\u3122\u3126\uFF1D\u3106\u310A\u310D\u3110\u3114\u3117\u3127\u311B\u311F\u3123\u300C\u300D\uFF3C\u3107\u310B\u310E\u3111\u3115\u3118\u3128\u311C\u3120\u3124\u3001\u3108\u310C\u310F\u3112\u3116\u3119\u3129\u311D\u3121\u3125\u02C9",
  shiftMap: "\uFF5E\uFF01\uFF20\uFF03\uFF04\uFF05\uFF3E\uFF06\uFF0A\uFF08\uFF09\u2015\uFF0Bqwertyuiop\u300E\u300F|asdfghjkl\uFF1A\uFF1Bzxcvbnm\uFF0C\u3002\uFF1F ",
  getSymbolFromDOM3Code(dom3Code, shiftKey) {
    const index = this.codes.indexOf(dom3Code);
    if (index === -1) return void 0;
    return shiftKey ? this.shiftMap.charAt(index) : this.map.charAt(index);
  },
  isBopomofoSymbol(chr) {
    if (!chr || chr.length === 0) return false;
    const code = chr.charCodeAt(0);
    return code >= 12549 && code <= 12585 || code === 713 || code === 714 || code === 711 || code === 715 || code === 729;
  }
};

// src/input/keyboard.ts
init_caret();
init_commit();
function createKeyboardHandler(deps) {
  function handleKeyDown(evt) {
    try {
      _inner(evt, deps);
    } catch (e) {
      console.error("[JSZhuyin IME] keydown error:", e);
    }
  }
  return handleKeyDown;
}
function _inner(evt, deps) {
  if (deps.hotkeyKey && deps.hotkeyModifiers.length > 0) {
    const keyMatch = evt.key === deps.hotkeyKey || evt.code === deps.hotkeyKey;
    const ctrlOk = deps.hotkeyModifiers.includes("Ctrl") === evt.ctrlKey;
    const shiftOk = deps.hotkeyModifiers.includes("Shift") ? evt.shiftKey && evt.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT : !evt.shiftKey;
    const altOk = deps.hotkeyModifiers.includes("Alt") === evt.altKey;
    const metaOk = deps.hotkeyModifiers.includes("Meta") === evt.metaKey;
    if (keyMatch && ctrlOk && shiftOk && altOk && metaOk) {
      evt.preventDefault();
      evt.stopPropagation();
      deps.onToggle(!deps.state.enabled);
      return;
    }
  }
  if (!deps.state.enabled) return;
  const client = deps.client;
  const overlay = deps.overlay;
  if (!client || !overlay) return;
  if (evt.ctrlKey || evt.metaKey || evt.altKey) return;
  if (evt.isComposing) return;
  const code = evt.code;
  const shiftKey = evt.shiftKey;
  if (client.compositionActive && code.startsWith("Digit") && shiftKey) {
    const selIdx = parseInt(code.charAt(5), 10) - 1;
    if (selIdx >= 0 && selIdx < 9) {
      const candidate = overlay.selectAt(selIdx);
      if (candidate) {
        evt.preventDefault();
        const idx = client.candidates.indexOf(candidate);
        if (idx !== -1) client.selectCandidate(idx);
        return;
      }
    }
  }
  if (client.compositionActive && shiftKey && code === "ArrowRight") {
    evt.preventDefault();
    overlay.nextPage();
    return;
  }
  if (client.compositionActive && shiftKey && code === "ArrowLeft") {
    evt.preventDefault();
    overlay.prevPage();
    return;
  }
  const symbol = JSZhuyinLayoutMapper.getSymbolFromDOM3Code(code, shiftKey);
  const isSpecial = code === "Enter" || code === "Backspace" || code === "Escape" || code === "Space";
  if (!symbol && !isSpecial) {
    if (client.compositionActive) evt.preventDefault();
    return;
  }
  const key = symbol || code;
  const handled = client.handleKey(key);
  if (handled) {
    evt.preventDefault();
    const el = getEditableElement();
    if (el) {
      const rect = getCaretRectForElement(el);
      overlay.positionAt(rect.left ?? rect.x ?? 100, rect.bottom ?? (rect.y ?? 100) + (rect.height ?? 0));
    } else {
      overlay.positionAt(100, 100);
    }
  } else {
    overlay.setCandidates([]);
  }
}

// src/main.ts
init_commit();

// src/settings.ts
var import_obsidian2 = require("obsidian");
var DEFAULT_SETTINGS = {
  enabled: false,
  hotkeyModifiers: ["Shift"],
  hotkeyKey: "Shift"
};
var JsZhuyinSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this._recordingHotkey = false;
    this._recordHandler = null;
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "JSZhuyin IME \u8A2D\u5B9A" });
    const modStr = this.plugin.settings.hotkeyModifiers.join(" + ");
    const keyStr = this.plugin.settings.hotkeyKey || "(\u672A\u8A2D\u5B9A)";
    const hotkeyDisplay = this.plugin.settings.hotkeyKey ? `${modStr} + ${keyStr}` : "(\u672A\u8A2D\u5B9A \u2014 \u9EDE\u300C\u8A2D\u5B9A\u300D\u5F8C\u6309\u4E0B\u5E36\u4FEE\u98FE\u9375\u7684\u7D44\u5408\uFF0C\u5982 Ctrl+Z)";
    new import_obsidian2.Setting(containerEl).setName("\u5207\u63DB\u5FEB\u6377\u9375").setDesc(`\u76EE\u524D\uFF1A${hotkeyDisplay}\uFF08\u53F3\u5074 Shift\uFF09`).addButton((btn) => {
      btn.setButtonText("\u8A2D\u5B9A").onClick(() => {
        if (this._recordingHotkey) return;
        this._recordingHotkey = true;
        btn.setButtonText("\u8ACB\u6309\u4E0B\u6309\u9375\u2026\uFF08\u9700\u542B Ctrl/Alt/Shift\uFF09");
        this._recordHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const modifiers = [];
          if (e.ctrlKey) modifiers.push("Ctrl");
          if (e.shiftKey) modifiers.push("Shift");
          if (e.altKey) modifiers.push("Alt");
          if (e.metaKey) modifiers.push("Meta");
          const key = e.key;
          if (["Control", "Shift", "Alt", "Meta"].includes(key)) return;
          if (modifiers.length === 0) return;
          this.plugin.settings.hotkeyModifiers = modifiers;
          this.plugin.settings.hotkeyKey = key;
          this.plugin.saveSettings();
          this.plugin.updateHotkeyDeps();
          this._recordingHotkey = false;
          window.removeEventListener("keydown", this._recordHandler, true);
          this._recordHandler = null;
          this.display();
        };
        requestAnimationFrame(() => {
          window.addEventListener("keydown", this._recordHandler, true);
        });
      });
    }).addButton((btn) => {
      btn.setButtonText("\u6E05\u9664").onClick(async () => {
        this.plugin.settings.hotkeyModifiers = [];
        this.plugin.settings.hotkeyKey = "";
        await this.plugin.saveSettings();
        this.plugin.updateHotkeyDeps();
        this.display();
      });
    });
  }
  hide() {
    if (this._recordHandler) {
      window.removeEventListener("keydown", this._recordHandler, true);
      this._recordHandler = null;
      this._recordingHotkey = false;
    }
  }
};

// src/main.ts
var JsZhuyinPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    this.client = null;
    this.overlay = null;
    this._keydownHandler = null;
    this._state = { enabled: false };
    this._deps = null;
    this._dictLoaded = false;
  }
  async onload() {
    await this.loadSettings();
    this._state.enabled = this.settings.enabled;
    this.addSettingTab(new JsZhuyinSettingTab(this.app, this));
    this._deps = {
      app: this.app,
      client: null,
      overlay: null,
      state: this._state,
      hotkeyModifiers: this.settings.hotkeyModifiers,
      hotkeyKey: this.settings.hotkeyKey,
      onToggle: (next) => this.applyEnabledState(next)
    };
    this._keydownHandler = createKeyboardHandler(this._deps);
    document.addEventListener("keydown", this._keydownHandler, true);
    this.applyEnabledState(this.settings.enabled);
  }
  onunload() {
    this._destroyAll();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  updateHotkeyDeps() {
    if (this._deps) {
      this._deps.hotkeyModifiers = this.settings.hotkeyModifiers;
      this._deps.hotkeyKey = this.settings.hotkeyKey;
    }
  }
  applyEnabledState(enabled) {
    this._state.enabled = enabled;
    if (enabled) {
      this._enable();
    } else {
      this._disable();
    }
  }
  async _enable() {
    if (!this.overlay) {
      this.overlay = new ImeOverlay();
      this.overlay.oncandidateselect = (candidate) => {
        if (this.client) {
          const idx = this.client.candidates.indexOf(candidate);
          if (idx !== -1) this.client.selectCandidate(idx);
        }
      };
      if (this._deps) this._deps.overlay = this.overlay;
    }
    if (!this.client) {
      this.client = new ImeClient();
      if (this._deps) this._deps.client = this.client;
      this.client.oncompositionupdate = (symbols) => {
        if (this.overlay) this.overlay.setComposition(symbols);
        this._updateOverlayPosition();
      };
      this.client.oncandidateschange = (candidates) => {
        if (this.overlay) this.overlay.setCandidates(candidates);
        this._updateOverlayPosition();
      };
      this.client.oncompositionend = (text) => {
        if (text) commitText(text, this.app);
        if (this.overlay) {
          this.overlay.setCandidates([]);
          this.overlay.setComposition("");
        }
      };
    }
    if (!this.client["_initialized"]) {
      try {
        this.overlay.showLoading();
        await this._loadDictionary();
        await this.client.init({});
        this._dictLoaded = true;
        this.overlay.hideLoading();
        new import_obsidian3.Notice("\u6CE8\u97F3\u8F38\u5165\u6CD5\u5DF2\u555F\u7528");
      } catch (err) {
        console.error("[JSZhuyin IME] Failed to load engine:", err);
        new import_obsidian3.Notice("\u6CE8\u97F3\u8A5E\u5EAB\u8F09\u5165\u5931\u6557");
        this._dictLoaded = false;
        return;
      }
    }
  }
  _disable() {
    if (this.client && this.client.compositionActive && this.client.candidates[0]) {
      commitText(this.client.candidates[0][0], this.app);
    }
    if (this.overlay) {
      this.overlay.setCandidates([]);
      this.overlay.setComposition("");
    }
  }
  _destroyAll() {
    if (this._keydownHandler) {
      document.removeEventListener("keydown", this._keydownHandler, true);
      this._keydownHandler = null;
    }
    if (this.client) {
      this.client.unload();
      this.client = null;
    }
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
  }
  async _loadDictionary() {
    const dataPath = (0, import_obsidian3.normalizePath)(`.obsidian/plugins/${this.manifest.id}/data/database.data`);
    const adapter = this.app.vault.adapter;
    const buf = await adapter.readBinary(dataPath);
    if (this.client) await this.client.loadDictionary(buf);
  }
  _updateOverlayPosition() {
    if (!this.overlay) return;
    const { getCaretRectForElement: getCaretRectForElement2 } = (init_caret(), __toCommonJS(caret_exports));
    const { getEditableElement: getEditableElement2 } = (init_commit(), __toCommonJS(commit_exports));
    const el = getEditableElement2();
    if (!el) {
      this.overlay.positionAt(100, 100);
      return;
    }
    const rect = getCaretRectForElement2(el);
    this.overlay.positionAt(
      rect.left ?? rect.x ?? 100,
      rect.bottom ?? (rect.y ?? 100) + (rect.height ?? 0)
    );
  }
};
