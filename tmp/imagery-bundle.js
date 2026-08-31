var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a3, b) => (typeof require !== "undefined" ? require : a3)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/mersenne-twister/src/mersenne-twister.js
var require_mersenne_twister = __commonJS({
  "node_modules/mersenne-twister/src/mersenne-twister.js"(exports, module) {
    var MersenneTwister2 = function(seed) {
      if (seed == void 0) {
        seed = (/* @__PURE__ */ new Date()).getTime();
      }
      this.N = 624;
      this.M = 397;
      this.MATRIX_A = 2567483615;
      this.UPPER_MASK = 2147483648;
      this.LOWER_MASK = 2147483647;
      this.mt = new Array(this.N);
      this.mti = this.N + 1;
      if (seed.constructor == Array) {
        this.init_by_array(seed, seed.length);
      } else {
        this.init_seed(seed);
      }
    };
    MersenneTwister2.prototype.init_seed = function(s) {
      this.mt[0] = s >>> 0;
      for (this.mti = 1; this.mti < this.N; this.mti++) {
        var s = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30;
        this.mt[this.mti] = (((s & 4294901760) >>> 16) * 1812433253 << 16) + (s & 65535) * 1812433253 + this.mti;
        this.mt[this.mti] >>>= 0;
      }
    };
    MersenneTwister2.prototype.init_by_array = function(init_key, key_length) {
      var i, j, k;
      this.init_seed(19650218);
      i = 1;
      j = 0;
      k = this.N > key_length ? this.N : key_length;
      for (; k; k--) {
        var s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;
        this.mt[i] = (this.mt[i] ^ (((s & 4294901760) >>> 16) * 1664525 << 16) + (s & 65535) * 1664525) + init_key[j] + j;
        this.mt[i] >>>= 0;
        i++;
        j++;
        if (i >= this.N) {
          this.mt[0] = this.mt[this.N - 1];
          i = 1;
        }
        if (j >= key_length) j = 0;
      }
      for (k = this.N - 1; k; k--) {
        var s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;
        this.mt[i] = (this.mt[i] ^ (((s & 4294901760) >>> 16) * 1566083941 << 16) + (s & 65535) * 1566083941) - i;
        this.mt[i] >>>= 0;
        i++;
        if (i >= this.N) {
          this.mt[0] = this.mt[this.N - 1];
          i = 1;
        }
      }
      this.mt[0] = 2147483648;
    };
    MersenneTwister2.prototype.random_int = function() {
      var y;
      var mag01 = new Array(0, this.MATRIX_A);
      if (this.mti >= this.N) {
        var kk;
        if (this.mti == this.N + 1)
          this.init_seed(5489);
        for (kk = 0; kk < this.N - this.M; kk++) {
          y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
          this.mt[kk] = this.mt[kk + this.M] ^ y >>> 1 ^ mag01[y & 1];
        }
        for (; kk < this.N - 1; kk++) {
          y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
          this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ mag01[y & 1];
        }
        y = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK;
        this.mt[this.N - 1] = this.mt[this.M - 1] ^ y >>> 1 ^ mag01[y & 1];
        this.mti = 0;
      }
      y = this.mt[this.mti++];
      y ^= y >>> 11;
      y ^= y << 7 & 2636928640;
      y ^= y << 15 & 4022730752;
      y ^= y >>> 18;
      return y >>> 0;
    };
    MersenneTwister2.prototype.random_int31 = function() {
      return this.random_int() >>> 1;
    };
    MersenneTwister2.prototype.random_incl = function() {
      return this.random_int() * (1 / 4294967295);
    };
    MersenneTwister2.prototype.random = function() {
      return this.random_int() * (1 / 4294967296);
    };
    MersenneTwister2.prototype.random_excl = function() {
      return (this.random_int() + 0.5) * (1 / 4294967296);
    };
    MersenneTwister2.prototype.random_long = function() {
      var a3 = this.random_int() >>> 5, b = this.random_int() >>> 6;
      return (a3 * 67108864 + b) * (1 / 9007199254740992);
    };
    module.exports = MersenneTwister2;
  }
});

// node_modules/urijs/src/punycode.js
var require_punycode = __commonJS({
  "node_modules/urijs/src/punycode.js"(exports, module) {
    (function(root) {
      var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
      var freeModule = typeof module == "object" && module && !module.nodeType && module;
      var freeGlobal = typeof global == "object" && global;
      if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal) {
        root = freeGlobal;
      }
      var punycode, maxInt = 2147483647, base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128, delimiter = "-", regexPunycode = /^xn--/, regexNonASCII = /[^\x20-\x7E]/, regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, errors = {
        "overflow": "Overflow: input needs wider integers to process",
        "not-basic": "Illegal input >= 0x80 (not a basic code point)",
        "invalid-input": "Invalid input"
      }, baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode, key;
      function error(type) {
        throw new RangeError(errors[type]);
      }
      function map(array, fn) {
        var length = array.length;
        var result = [];
        while (length--) {
          result[length] = fn(array[length]);
        }
        return result;
      }
      function mapDomain(string, fn) {
        var parts = string.split("@");
        var result = "";
        if (parts.length > 1) {
          result = parts[0] + "@";
          string = parts[1];
        }
        string = string.replace(regexSeparators, ".");
        var labels = string.split(".");
        var encoded = map(labels, fn).join(".");
        return result + encoded;
      }
      function ucs2decode(string) {
        var output = [], counter = 0, length = string.length, value, extra;
        while (counter < length) {
          value = string.charCodeAt(counter++);
          if (value >= 55296 && value <= 56319 && counter < length) {
            extra = string.charCodeAt(counter++);
            if ((extra & 64512) == 56320) {
              output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
            } else {
              output.push(value);
              counter--;
            }
          } else {
            output.push(value);
          }
        }
        return output;
      }
      function ucs2encode(array) {
        return map(array, function(value) {
          var output = "";
          if (value > 65535) {
            value -= 65536;
            output += stringFromCharCode(value >>> 10 & 1023 | 55296);
            value = 56320 | value & 1023;
          }
          output += stringFromCharCode(value);
          return output;
        }).join("");
      }
      function basicToDigit(codePoint) {
        if (codePoint - 48 < 10) {
          return codePoint - 22;
        }
        if (codePoint - 65 < 26) {
          return codePoint - 65;
        }
        if (codePoint - 97 < 26) {
          return codePoint - 97;
        }
        return base;
      }
      function digitToBasic(digit, flag) {
        return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
      }
      function adapt(delta, numPoints, firstTime) {
        var k = 0;
        delta = firstTime ? floor(delta / damp) : delta >> 1;
        delta += floor(delta / numPoints);
        for (; delta > baseMinusTMin * tMax >> 1; k += base) {
          delta = floor(delta / baseMinusTMin);
        }
        return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
      }
      function decode(input) {
        var output = [], inputLength = input.length, out, i = 0, n = initialN, bias = initialBias, basic, j, index, oldi, w, k, digit, t, baseMinusT;
        basic = input.lastIndexOf(delimiter);
        if (basic < 0) {
          basic = 0;
        }
        for (j = 0; j < basic; ++j) {
          if (input.charCodeAt(j) >= 128) {
            error("not-basic");
          }
          output.push(input.charCodeAt(j));
        }
        for (index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
          for (oldi = i, w = 1, k = base; ; k += base) {
            if (index >= inputLength) {
              error("invalid-input");
            }
            digit = basicToDigit(input.charCodeAt(index++));
            if (digit >= base || digit > floor((maxInt - i) / w)) {
              error("overflow");
            }
            i += digit * w;
            t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
            if (digit < t) {
              break;
            }
            baseMinusT = base - t;
            if (w > floor(maxInt / baseMinusT)) {
              error("overflow");
            }
            w *= baseMinusT;
          }
          out = output.length + 1;
          bias = adapt(i - oldi, out, oldi == 0);
          if (floor(i / out) > maxInt - n) {
            error("overflow");
          }
          n += floor(i / out);
          i %= out;
          output.splice(i++, 0, n);
        }
        return ucs2encode(output);
      }
      function encode(input) {
        var n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [], inputLength, handledCPCountPlusOne, baseMinusT, qMinusT;
        input = ucs2decode(input);
        inputLength = input.length;
        n = initialN;
        delta = 0;
        bias = initialBias;
        for (j = 0; j < inputLength; ++j) {
          currentValue = input[j];
          if (currentValue < 128) {
            output.push(stringFromCharCode(currentValue));
          }
        }
        handledCPCount = basicLength = output.length;
        if (basicLength) {
          output.push(delimiter);
        }
        while (handledCPCount < inputLength) {
          for (m = maxInt, j = 0; j < inputLength; ++j) {
            currentValue = input[j];
            if (currentValue >= n && currentValue < m) {
              m = currentValue;
            }
          }
          handledCPCountPlusOne = handledCPCount + 1;
          if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
            error("overflow");
          }
          delta += (m - n) * handledCPCountPlusOne;
          n = m;
          for (j = 0; j < inputLength; ++j) {
            currentValue = input[j];
            if (currentValue < n && ++delta > maxInt) {
              error("overflow");
            }
            if (currentValue == n) {
              for (q = delta, k = base; ; k += base) {
                t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                if (q < t) {
                  break;
                }
                qMinusT = q - t;
                baseMinusT = base - t;
                output.push(
                  stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
                );
                q = floor(qMinusT / baseMinusT);
              }
              output.push(stringFromCharCode(digitToBasic(q, 0)));
              bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
              delta = 0;
              ++handledCPCount;
            }
          }
          ++delta;
          ++n;
        }
        return output.join("");
      }
      function toUnicode(input) {
        return mapDomain(input, function(string) {
          return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
        });
      }
      function toASCII(input) {
        return mapDomain(input, function(string) {
          return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
        });
      }
      punycode = {
        /**
         * A string representing the current Punycode.js version number.
         * @memberOf punycode
         * @type String
         */
        "version": "1.3.2",
        /**
         * An object of methods to convert from JavaScript's internal character
         * representation (UCS-2) to Unicode code points, and back.
         * @see <https://mathiasbynens.be/notes/javascript-encoding>
         * @memberOf punycode
         * @type Object
         */
        "ucs2": {
          "decode": ucs2decode,
          "encode": ucs2encode
        },
        "decode": decode,
        "encode": encode,
        "toASCII": toASCII,
        "toUnicode": toUnicode
      };
      if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
        define("punycode", function() {
          return punycode;
        });
      } else if (freeExports && freeModule) {
        if (module.exports == freeExports) {
          freeModule.exports = punycode;
        } else {
          for (key in punycode) {
            punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
          }
        }
      } else {
        root.punycode = punycode;
      }
    })(exports);
  }
});

// node_modules/urijs/src/IPv6.js
var require_IPv6 = __commonJS({
  "node_modules/urijs/src/IPv6.js"(exports, module) {
    (function(root, factory) {
      "use strict";
      if (typeof module === "object" && module.exports) {
        module.exports = factory();
      } else if (typeof define === "function" && define.amd) {
        define(factory);
      } else {
        root.IPv6 = factory(root);
      }
    })(exports, function(root) {
      "use strict";
      var _IPv6 = root && root.IPv6;
      function bestPresentation(address) {
        var _address = address.toLowerCase();
        var segments = _address.split(":");
        var length = segments.length;
        var total = 8;
        if (segments[0] === "" && segments[1] === "" && segments[2] === "") {
          segments.shift();
          segments.shift();
        } else if (segments[0] === "" && segments[1] === "") {
          segments.shift();
        } else if (segments[length - 1] === "" && segments[length - 2] === "") {
          segments.pop();
        }
        length = segments.length;
        if (segments[length - 1].indexOf(".") !== -1) {
          total = 7;
        }
        var pos;
        for (pos = 0; pos < length; pos++) {
          if (segments[pos] === "") {
            break;
          }
        }
        if (pos < total) {
          segments.splice(pos, 1, "0000");
          while (segments.length < total) {
            segments.splice(pos, 0, "0000");
          }
        }
        var _segments;
        for (var i = 0; i < total; i++) {
          _segments = segments[i].split("");
          for (var j = 0; j < 3; j++) {
            if (_segments[0] === "0" && _segments.length > 1) {
              _segments.splice(0, 1);
            } else {
              break;
            }
          }
          segments[i] = _segments.join("");
        }
        var best = -1;
        var _best = 0;
        var _current = 0;
        var current = -1;
        var inzeroes = false;
        for (i = 0; i < total; i++) {
          if (inzeroes) {
            if (segments[i] === "0") {
              _current += 1;
            } else {
              inzeroes = false;
              if (_current > _best) {
                best = current;
                _best = _current;
              }
            }
          } else {
            if (segments[i] === "0") {
              inzeroes = true;
              current = i;
              _current = 1;
            }
          }
        }
        if (_current > _best) {
          best = current;
          _best = _current;
        }
        if (_best > 1) {
          segments.splice(best, _best, "");
        }
        length = segments.length;
        var result = "";
        if (segments[0] === "") {
          result = ":";
        }
        for (i = 0; i < length; i++) {
          result += segments[i];
          if (i === length - 1) {
            break;
          }
          result += ":";
        }
        if (segments[length - 1] === "") {
          result += ":";
        }
        return result;
      }
      function noConflict() {
        if (root.IPv6 === this) {
          root.IPv6 = _IPv6;
        }
        return this;
      }
      return {
        best: bestPresentation,
        noConflict
      };
    });
  }
});

// node_modules/urijs/src/SecondLevelDomains.js
var require_SecondLevelDomains = __commonJS({
  "node_modules/urijs/src/SecondLevelDomains.js"(exports, module) {
    (function(root, factory) {
      "use strict";
      if (typeof module === "object" && module.exports) {
        module.exports = factory();
      } else if (typeof define === "function" && define.amd) {
        define(factory);
      } else {
        root.SecondLevelDomains = factory(root);
      }
    })(exports, function(root) {
      "use strict";
      var _SecondLevelDomains = root && root.SecondLevelDomains;
      var SLD = {
        // list of known Second Level Domains
        // converted list of SLDs from https://github.com/gavingmiller/second-level-domains
        // ----
        // publicsuffix.org is more current and actually used by a couple of browsers internally.
        // downside is it also contains domains like "dyndns.org" - which is fine for the security
        // issues browser have to deal with (SOP for cookies, etc) - but is way overboard for URI.js
        // ----
        list: {
          "ac": " com gov mil net org ",
          "ae": " ac co gov mil name net org pro sch ",
          "af": " com edu gov net org ",
          "al": " com edu gov mil net org ",
          "ao": " co ed gv it og pb ",
          "ar": " com edu gob gov int mil net org tur ",
          "at": " ac co gv or ",
          "au": " asn com csiro edu gov id net org ",
          "ba": " co com edu gov mil net org rs unbi unmo unsa untz unze ",
          "bb": " biz co com edu gov info net org store tv ",
          "bh": " biz cc com edu gov info net org ",
          "bn": " com edu gov net org ",
          "bo": " com edu gob gov int mil net org tv ",
          "br": " adm adv agr am arq art ato b bio blog bmd cim cng cnt com coop ecn edu eng esp etc eti far flog fm fnd fot fst g12 ggf gov imb ind inf jor jus lel mat med mil mus net nom not ntr odo org ppg pro psc psi qsl rec slg srv tmp trd tur tv vet vlog wiki zlg ",
          "bs": " com edu gov net org ",
          "bz": " du et om ov rg ",
          "ca": " ab bc mb nb nf nl ns nt nu on pe qc sk yk ",
          "ck": " biz co edu gen gov info net org ",
          "cn": " ac ah bj com cq edu fj gd gov gs gx gz ha hb he hi hl hn jl js jx ln mil net nm nx org qh sc sd sh sn sx tj tw xj xz yn zj ",
          "co": " com edu gov mil net nom org ",
          "cr": " ac c co ed fi go or sa ",
          "cy": " ac biz com ekloges gov ltd name net org parliament press pro tm ",
          "do": " art com edu gob gov mil net org sld web ",
          "dz": " art asso com edu gov net org pol ",
          "ec": " com edu fin gov info med mil net org pro ",
          "eg": " com edu eun gov mil name net org sci ",
          "er": " com edu gov ind mil net org rochest w ",
          "es": " com edu gob nom org ",
          "et": " biz com edu gov info name net org ",
          "fj": " ac biz com info mil name net org pro ",
          "fk": " ac co gov net nom org ",
          "fr": " asso com f gouv nom prd presse tm ",
          "gg": " co net org ",
          "gh": " com edu gov mil org ",
          "gn": " ac com gov net org ",
          "gr": " com edu gov mil net org ",
          "gt": " com edu gob ind mil net org ",
          "gu": " com edu gov net org ",
          "hk": " com edu gov idv net org ",
          "hu": " 2000 agrar bolt casino city co erotica erotika film forum games hotel info ingatlan jogasz konyvelo lakas media news org priv reklam sex shop sport suli szex tm tozsde utazas video ",
          "id": " ac co go mil net or sch web ",
          "il": " ac co gov idf k12 muni net org ",
          "in": " ac co edu ernet firm gen gov i ind mil net nic org res ",
          "iq": " com edu gov i mil net org ",
          "ir": " ac co dnssec gov i id net org sch ",
          "it": " edu gov ",
          "je": " co net org ",
          "jo": " com edu gov mil name net org sch ",
          "jp": " ac ad co ed go gr lg ne or ",
          "ke": " ac co go info me mobi ne or sc ",
          "kh": " com edu gov mil net org per ",
          "ki": " biz com de edu gov info mob net org tel ",
          "km": " asso com coop edu gouv k medecin mil nom notaires pharmaciens presse tm veterinaire ",
          "kn": " edu gov net org ",
          "kr": " ac busan chungbuk chungnam co daegu daejeon es gangwon go gwangju gyeongbuk gyeonggi gyeongnam hs incheon jeju jeonbuk jeonnam k kg mil ms ne or pe re sc seoul ulsan ",
          "kw": " com edu gov net org ",
          "ky": " com edu gov net org ",
          "kz": " com edu gov mil net org ",
          "lb": " com edu gov net org ",
          "lk": " assn com edu gov grp hotel int ltd net ngo org sch soc web ",
          "lr": " com edu gov net org ",
          "lv": " asn com conf edu gov id mil net org ",
          "ly": " com edu gov id med net org plc sch ",
          "ma": " ac co gov m net org press ",
          "mc": " asso tm ",
          "me": " ac co edu gov its net org priv ",
          "mg": " com edu gov mil nom org prd tm ",
          "mk": " com edu gov inf name net org pro ",
          "ml": " com edu gov net org presse ",
          "mn": " edu gov org ",
          "mo": " com edu gov net org ",
          "mt": " com edu gov net org ",
          "mv": " aero biz com coop edu gov info int mil museum name net org pro ",
          "mw": " ac co com coop edu gov int museum net org ",
          "mx": " com edu gob net org ",
          "my": " com edu gov mil name net org sch ",
          "nf": " arts com firm info net other per rec store web ",
          "ng": " biz com edu gov mil mobi name net org sch ",
          "ni": " ac co com edu gob mil net nom org ",
          "np": " com edu gov mil net org ",
          "nr": " biz com edu gov info net org ",
          "om": " ac biz co com edu gov med mil museum net org pro sch ",
          "pe": " com edu gob mil net nom org sld ",
          "ph": " com edu gov i mil net ngo org ",
          "pk": " biz com edu fam gob gok gon gop gos gov net org web ",
          "pl": " art bialystok biz com edu gda gdansk gorzow gov info katowice krakow lodz lublin mil net ngo olsztyn org poznan pwr radom slupsk szczecin torun warszawa waw wroc wroclaw zgora ",
          "pr": " ac biz com edu est gov info isla name net org pro prof ",
          "ps": " com edu gov net org plo sec ",
          "pw": " belau co ed go ne or ",
          "ro": " arts com firm info nom nt org rec store tm www ",
          "rs": " ac co edu gov in org ",
          "sb": " com edu gov net org ",
          "sc": " com edu gov net org ",
          "sh": " co com edu gov net nom org ",
          "sl": " com edu gov net org ",
          "st": " co com consulado edu embaixada gov mil net org principe saotome store ",
          "sv": " com edu gob org red ",
          "sz": " ac co org ",
          "tr": " av bbs bel biz com dr edu gen gov info k12 name net org pol tel tsk tv web ",
          "tt": " aero biz cat co com coop edu gov info int jobs mil mobi museum name net org pro tel travel ",
          "tw": " club com ebiz edu game gov idv mil net org ",
          "mu": " ac co com gov net or org ",
          "mz": " ac co edu gov org ",
          "na": " co com ",
          "nz": " ac co cri geek gen govt health iwi maori mil net org parliament school ",
          "pa": " abo ac com edu gob ing med net nom org sld ",
          "pt": " com edu gov int net nome org publ ",
          "py": " com edu gov mil net org ",
          "qa": " com edu gov mil net org ",
          "re": " asso com nom ",
          "ru": " ac adygeya altai amur arkhangelsk astrakhan bashkiria belgorod bir bryansk buryatia cbg chel chelyabinsk chita chukotka chuvashia com dagestan e-burg edu gov grozny int irkutsk ivanovo izhevsk jar joshkar-ola kalmykia kaluga kamchatka karelia kazan kchr kemerovo khabarovsk khakassia khv kirov koenig komi kostroma kranoyarsk kuban kurgan kursk lipetsk magadan mari mari-el marine mil mordovia mosreg msk murmansk nalchik net nnov nov novosibirsk nsk omsk orenburg org oryol penza perm pp pskov ptz rnd ryazan sakhalin samara saratov simbirsk smolensk spb stavropol stv surgut tambov tatarstan tom tomsk tsaritsyn tsk tula tuva tver tyumen udm udmurtia ulan-ude vladikavkaz vladimir vladivostok volgograd vologda voronezh vrn vyatka yakutia yamal yekaterinburg yuzhno-sakhalinsk ",
          "rw": " ac co com edu gouv gov int mil net ",
          "sa": " com edu gov med net org pub sch ",
          "sd": " com edu gov info med net org tv ",
          "se": " a ac b bd c d e f g h i k l m n o org p parti pp press r s t tm u w x y z ",
          "sg": " com edu gov idn net org per ",
          "sn": " art com edu gouv org perso univ ",
          "sy": " com edu gov mil net news org ",
          "th": " ac co go in mi net or ",
          "tj": " ac biz co com edu go gov info int mil name net nic org test web ",
          "tn": " agrinet com defense edunet ens fin gov ind info intl mincom nat net org perso rnrt rns rnu tourism ",
          "tz": " ac co go ne or ",
          "ua": " biz cherkassy chernigov chernovtsy ck cn co com crimea cv dn dnepropetrovsk donetsk dp edu gov if in ivano-frankivsk kh kharkov kherson khmelnitskiy kiev kirovograd km kr ks kv lg lugansk lutsk lviv me mk net nikolaev od odessa org pl poltava pp rovno rv sebastopol sumy te ternopil uzhgorod vinnica vn zaporizhzhe zhitomir zp zt ",
          "ug": " ac co go ne or org sc ",
          "uk": " ac bl british-library co cym gov govt icnet jet lea ltd me mil mod national-library-scotland nel net nhs nic nls org orgn parliament plc police sch scot soc ",
          "us": " dni fed isa kids nsn ",
          "uy": " com edu gub mil net org ",
          "ve": " co com edu gob info mil net org web ",
          "vi": " co com k12 net org ",
          "vn": " ac biz com edu gov health info int name net org pro ",
          "ye": " co com gov ltd me net org plc ",
          "yu": " ac co edu gov org ",
          "za": " ac agric alt bourse city co cybernet db edu gov grondar iaccess imt inca landesign law mil net ngo nis nom olivetti org pix school tm web ",
          "zm": " ac co com edu gov net org sch ",
          // https://en.wikipedia.org/wiki/CentralNic#Second-level_domains
          "com": "ar br cn de eu gb gr hu jpn kr no qc ru sa se uk us uy za ",
          "net": "gb jp se uk ",
          "org": "ae",
          "de": "com "
        },
        // gorhill 2013-10-25: Using indexOf() instead Regexp(). Significant boost
        // in both performance and memory footprint. No initialization required.
        // http://jsperf.com/uri-js-sld-regex-vs-binary-search/4
        // Following methods use lastIndexOf() rather than array.split() in order
        // to avoid any memory allocations.
        has: function(domain) {
          var tldOffset = domain.lastIndexOf(".");
          if (tldOffset <= 0 || tldOffset >= domain.length - 1) {
            return false;
          }
          var sldOffset = domain.lastIndexOf(".", tldOffset - 1);
          if (sldOffset <= 0 || sldOffset >= tldOffset - 1) {
            return false;
          }
          var sldList = SLD.list[domain.slice(tldOffset + 1)];
          if (!sldList) {
            return false;
          }
          return sldList.indexOf(" " + domain.slice(sldOffset + 1, tldOffset) + " ") >= 0;
        },
        is: function(domain) {
          var tldOffset = domain.lastIndexOf(".");
          if (tldOffset <= 0 || tldOffset >= domain.length - 1) {
            return false;
          }
          var sldOffset = domain.lastIndexOf(".", tldOffset - 1);
          if (sldOffset >= 0) {
            return false;
          }
          var sldList = SLD.list[domain.slice(tldOffset + 1)];
          if (!sldList) {
            return false;
          }
          return sldList.indexOf(" " + domain.slice(0, tldOffset) + " ") >= 0;
        },
        get: function(domain) {
          var tldOffset = domain.lastIndexOf(".");
          if (tldOffset <= 0 || tldOffset >= domain.length - 1) {
            return null;
          }
          var sldOffset = domain.lastIndexOf(".", tldOffset - 1);
          if (sldOffset <= 0 || sldOffset >= tldOffset - 1) {
            return null;
          }
          var sldList = SLD.list[domain.slice(tldOffset + 1)];
          if (!sldList) {
            return null;
          }
          if (sldList.indexOf(" " + domain.slice(sldOffset + 1, tldOffset) + " ") < 0) {
            return null;
          }
          return domain.slice(sldOffset + 1);
        },
        noConflict: function() {
          if (root.SecondLevelDomains === this) {
            root.SecondLevelDomains = _SecondLevelDomains;
          }
          return this;
        }
      };
      return SLD;
    });
  }
});

// node_modules/urijs/src/URI.js
var require_URI = __commonJS({
  "node_modules/urijs/src/URI.js"(exports, module) {
    (function(root, factory) {
      "use strict";
      if (typeof module === "object" && module.exports) {
        module.exports = factory(require_punycode(), require_IPv6(), require_SecondLevelDomains());
      } else if (typeof define === "function" && define.amd) {
        define(["./punycode", "./IPv6", "./SecondLevelDomains"], factory);
      } else {
        root.URI = factory(root.punycode, root.IPv6, root.SecondLevelDomains, root);
      }
    })(exports, function(punycode, IPv6, SLD, root) {
      "use strict";
      var _URI = root && root.URI;
      function URI(url, base) {
        var _urlSupplied = arguments.length >= 1;
        var _baseSupplied = arguments.length >= 2;
        if (!(this instanceof URI)) {
          if (_urlSupplied) {
            if (_baseSupplied) {
              return new URI(url, base);
            }
            return new URI(url);
          }
          return new URI();
        }
        if (url === void 0) {
          if (_urlSupplied) {
            throw new TypeError("undefined is not a valid argument for URI");
          }
          if (typeof location !== "undefined") {
            url = location.href + "";
          } else {
            url = "";
          }
        }
        if (url === null) {
          if (_urlSupplied) {
            throw new TypeError("null is not a valid argument for URI");
          }
        }
        this.href(url);
        if (base !== void 0) {
          return this.absoluteTo(base);
        }
        return this;
      }
      function isInteger(value) {
        return /^[0-9]+$/.test(value);
      }
      URI.version = "1.19.11";
      var p = URI.prototype;
      var hasOwn = Object.prototype.hasOwnProperty;
      function escapeRegEx(string) {
        return string.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
      }
      function getType(value) {
        if (value === void 0) {
          return "Undefined";
        }
        return String(Object.prototype.toString.call(value)).slice(8, -1);
      }
      function isArray(obj) {
        return getType(obj) === "Array";
      }
      function filterArrayValues(data, value) {
        var lookup = {};
        var i, length;
        if (getType(value) === "RegExp") {
          lookup = null;
        } else if (isArray(value)) {
          for (i = 0, length = value.length; i < length; i++) {
            lookup[value[i]] = true;
          }
        } else {
          lookup[value] = true;
        }
        for (i = 0, length = data.length; i < length; i++) {
          var _match = lookup && lookup[data[i]] !== void 0 || !lookup && value.test(data[i]);
          if (_match) {
            data.splice(i, 1);
            length--;
            i--;
          }
        }
        return data;
      }
      function arrayContains(list, value) {
        var i, length;
        if (isArray(value)) {
          for (i = 0, length = value.length; i < length; i++) {
            if (!arrayContains(list, value[i])) {
              return false;
            }
          }
          return true;
        }
        var _type = getType(value);
        for (i = 0, length = list.length; i < length; i++) {
          if (_type === "RegExp") {
            if (typeof list[i] === "string" && list[i].match(value)) {
              return true;
            }
          } else if (list[i] === value) {
            return true;
          }
        }
        return false;
      }
      function arraysEqual(one, two) {
        if (!isArray(one) || !isArray(two)) {
          return false;
        }
        if (one.length !== two.length) {
          return false;
        }
        one.sort();
        two.sort();
        for (var i = 0, l = one.length; i < l; i++) {
          if (one[i] !== two[i]) {
            return false;
          }
        }
        return true;
      }
      function trimSlashes(text2) {
        var trim_expression = /^\/+|\/+$/g;
        return text2.replace(trim_expression, "");
      }
      URI._parts = function() {
        return {
          protocol: null,
          username: null,
          password: null,
          hostname: null,
          urn: null,
          port: null,
          path: null,
          query: null,
          fragment: null,
          // state
          preventInvalidHostname: URI.preventInvalidHostname,
          duplicateQueryParameters: URI.duplicateQueryParameters,
          escapeQuerySpace: URI.escapeQuerySpace
        };
      };
      URI.preventInvalidHostname = false;
      URI.duplicateQueryParameters = false;
      URI.escapeQuerySpace = true;
      URI.protocol_expression = /^[a-z][a-z0-9.+-]*$/i;
      URI.idn_expression = /[^a-z0-9\._-]/i;
      URI.punycode_expression = /(xn--)/i;
      URI.ip4_expression = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      URI.ip6_expression = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
      URI.find_uri_expression = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
      URI.findUri = {
        // valid "scheme://" or "www."
        start: /\b(?:([a-z][a-z0-9.+-]*:\/\/)|www\.)/gi,
        // everything up to the next whitespace
        end: /[\s\r\n]|$/,
        // trim trailing punctuation captured by end RegExp
        trim: /[`!()\[\]{};:'".,<>?«»“”„‘’]+$/,
        // balanced parens inclusion (), [], {}, <>
        parens: /(\([^\)]*\)|\[[^\]]*\]|\{[^}]*\}|<[^>]*>)/g
      };
      URI.leading_whitespace_expression = /^[\x00-\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
      URI.ascii_tab_whitespace = /[\u0009\u000A\u000D]+/g;
      URI.defaultPorts = {
        http: "80",
        https: "443",
        ftp: "21",
        gopher: "70",
        ws: "80",
        wss: "443"
      };
      URI.hostProtocols = [
        "http",
        "https"
      ];
      URI.invalid_hostname_characters = /[^a-zA-Z0-9\.\-:_]/;
      URI.domAttributes = {
        "a": "href",
        "blockquote": "cite",
        "link": "href",
        "base": "href",
        "script": "src",
        "form": "action",
        "img": "src",
        "area": "href",
        "iframe": "src",
        "embed": "src",
        "source": "src",
        "track": "src",
        "input": "src",
        // but only if type="image"
        "audio": "src",
        "video": "src"
      };
      URI.getDomAttribute = function(node) {
        if (!node || !node.nodeName) {
          return void 0;
        }
        var nodeName = node.nodeName.toLowerCase();
        if (nodeName === "input" && node.type !== "image") {
          return void 0;
        }
        return URI.domAttributes[nodeName];
      };
      function escapeForDumbFirefox36(value) {
        return escape(value);
      }
      function strictEncodeURIComponent(string) {
        return encodeURIComponent(string).replace(/[!'()*]/g, escapeForDumbFirefox36).replace(/\*/g, "%2A");
      }
      URI.encode = strictEncodeURIComponent;
      URI.decode = decodeURIComponent;
      URI.iso8859 = function() {
        URI.encode = escape;
        URI.decode = unescape;
      };
      URI.unicode = function() {
        URI.encode = strictEncodeURIComponent;
        URI.decode = decodeURIComponent;
      };
      URI.characters = {
        pathname: {
          encode: {
            // RFC3986 2.1: For consistency, URI producers and normalizers should
            // use uppercase hexadecimal digits for all percent-encodings.
            expression: /%(24|26|2B|2C|3B|3D|3A|40)/ig,
            map: {
              // -._~!'()*
              "%24": "$",
              "%26": "&",
              "%2B": "+",
              "%2C": ",",
              "%3B": ";",
              "%3D": "=",
              "%3A": ":",
              "%40": "@"
            }
          },
          decode: {
            expression: /[\/\?#]/g,
            map: {
              "/": "%2F",
              "?": "%3F",
              "#": "%23"
            }
          }
        },
        reserved: {
          encode: {
            // RFC3986 2.1: For consistency, URI producers and normalizers should
            // use uppercase hexadecimal digits for all percent-encodings.
            expression: /%(21|23|24|26|27|28|29|2A|2B|2C|2F|3A|3B|3D|3F|40|5B|5D)/ig,
            map: {
              // gen-delims
              "%3A": ":",
              "%2F": "/",
              "%3F": "?",
              "%23": "#",
              "%5B": "[",
              "%5D": "]",
              "%40": "@",
              // sub-delims
              "%21": "!",
              "%24": "$",
              "%26": "&",
              "%27": "'",
              "%28": "(",
              "%29": ")",
              "%2A": "*",
              "%2B": "+",
              "%2C": ",",
              "%3B": ";",
              "%3D": "="
            }
          }
        },
        urnpath: {
          // The characters under `encode` are the characters called out by RFC 2141 as being acceptable
          // for usage in a URN. RFC2141 also calls out "-", ".", and "_" as acceptable characters, but
          // these aren't encoded by encodeURIComponent, so we don't have to call them out here. Also
          // note that the colon character is not featured in the encoding map; this is because URI.js
          // gives the colons in URNs semantic meaning as the delimiters of path segements, and so it
          // should not appear unencoded in a segment itself.
          // See also the note above about RFC3986 and capitalalized hex digits.
          encode: {
            expression: /%(21|24|27|28|29|2A|2B|2C|3B|3D|40)/ig,
            map: {
              "%21": "!",
              "%24": "$",
              "%27": "'",
              "%28": "(",
              "%29": ")",
              "%2A": "*",
              "%2B": "+",
              "%2C": ",",
              "%3B": ";",
              "%3D": "=",
              "%40": "@"
            }
          },
          // These characters are the characters called out by RFC2141 as "reserved" characters that
          // should never appear in a URN, plus the colon character (see note above).
          decode: {
            expression: /[\/\?#:]/g,
            map: {
              "/": "%2F",
              "?": "%3F",
              "#": "%23",
              ":": "%3A"
            }
          }
        }
      };
      URI.encodeQuery = function(string, escapeQuerySpace) {
        var escaped = URI.encode(string + "");
        if (escapeQuerySpace === void 0) {
          escapeQuerySpace = URI.escapeQuerySpace;
        }
        return escapeQuerySpace ? escaped.replace(/%20/g, "+") : escaped;
      };
      URI.decodeQuery = function(string, escapeQuerySpace) {
        string += "";
        if (escapeQuerySpace === void 0) {
          escapeQuerySpace = URI.escapeQuerySpace;
        }
        try {
          return URI.decode(escapeQuerySpace ? string.replace(/\+/g, "%20") : string);
        } catch (e) {
          return string;
        }
      };
      var _parts = { "encode": "encode", "decode": "decode" };
      var _part;
      var generateAccessor = function(_group, _part2) {
        return function(string) {
          try {
            return URI[_part2](string + "").replace(URI.characters[_group][_part2].expression, function(c) {
              return URI.characters[_group][_part2].map[c];
            });
          } catch (e) {
            return string;
          }
        };
      };
      for (_part in _parts) {
        URI[_part + "PathSegment"] = generateAccessor("pathname", _parts[_part]);
        URI[_part + "UrnPathSegment"] = generateAccessor("urnpath", _parts[_part]);
      }
      var generateSegmentedPathFunction = function(_sep, _codingFuncName, _innerCodingFuncName) {
        return function(string) {
          var actualCodingFunc;
          if (!_innerCodingFuncName) {
            actualCodingFunc = URI[_codingFuncName];
          } else {
            actualCodingFunc = function(string2) {
              return URI[_codingFuncName](URI[_innerCodingFuncName](string2));
            };
          }
          var segments = (string + "").split(_sep);
          for (var i = 0, length = segments.length; i < length; i++) {
            segments[i] = actualCodingFunc(segments[i]);
          }
          return segments.join(_sep);
        };
      };
      URI.decodePath = generateSegmentedPathFunction("/", "decodePathSegment");
      URI.decodeUrnPath = generateSegmentedPathFunction(":", "decodeUrnPathSegment");
      URI.recodePath = generateSegmentedPathFunction("/", "encodePathSegment", "decode");
      URI.recodeUrnPath = generateSegmentedPathFunction(":", "encodeUrnPathSegment", "decode");
      URI.encodeReserved = generateAccessor("reserved", "encode");
      URI.parse = function(string, parts) {
        var pos;
        if (!parts) {
          parts = {
            preventInvalidHostname: URI.preventInvalidHostname
          };
        }
        string = string.replace(URI.leading_whitespace_expression, "");
        string = string.replace(URI.ascii_tab_whitespace, "");
        pos = string.indexOf("#");
        if (pos > -1) {
          parts.fragment = string.substring(pos + 1) || null;
          string = string.substring(0, pos);
        }
        pos = string.indexOf("?");
        if (pos > -1) {
          parts.query = string.substring(pos + 1) || null;
          string = string.substring(0, pos);
        }
        string = string.replace(/^(https?|ftp|wss?)?:+[/\\]*/i, "$1://");
        string = string.replace(/^[/\\]{2,}/i, "//");
        if (string.substring(0, 2) === "//") {
          parts.protocol = null;
          string = string.substring(2);
          string = URI.parseAuthority(string, parts);
        } else {
          pos = string.indexOf(":");
          if (pos > -1) {
            parts.protocol = string.substring(0, pos) || null;
            if (parts.protocol && !parts.protocol.match(URI.protocol_expression)) {
              parts.protocol = void 0;
            } else if (string.substring(pos + 1, pos + 3).replace(/\\/g, "/") === "//") {
              string = string.substring(pos + 3);
              string = URI.parseAuthority(string, parts);
            } else {
              string = string.substring(pos + 1);
              parts.urn = true;
            }
          }
        }
        parts.path = string;
        return parts;
      };
      URI.parseHost = function(string, parts) {
        if (!string) {
          string = "";
        }
        string = string.replace(/\\/g, "/");
        var pos = string.indexOf("/");
        var bracketPos;
        var t;
        if (pos === -1) {
          pos = string.length;
        }
        if (string.charAt(0) === "[") {
          bracketPos = string.indexOf("]");
          parts.hostname = string.substring(1, bracketPos) || null;
          parts.port = string.substring(bracketPos + 2, pos) || null;
          if (parts.port === "/") {
            parts.port = null;
          }
        } else {
          var firstColon = string.indexOf(":");
          var firstSlash = string.indexOf("/");
          var nextColon = string.indexOf(":", firstColon + 1);
          if (nextColon !== -1 && (firstSlash === -1 || nextColon < firstSlash)) {
            parts.hostname = string.substring(0, pos) || null;
            parts.port = null;
          } else {
            t = string.substring(0, pos).split(":");
            parts.hostname = t[0] || null;
            parts.port = t[1] || null;
          }
        }
        if (parts.hostname && string.substring(pos).charAt(0) !== "/") {
          pos++;
          string = "/" + string;
        }
        if (parts.preventInvalidHostname) {
          URI.ensureValidHostname(parts.hostname, parts.protocol);
        }
        if (parts.port) {
          URI.ensureValidPort(parts.port);
        }
        return string.substring(pos) || "/";
      };
      URI.parseAuthority = function(string, parts) {
        string = URI.parseUserinfo(string, parts);
        return URI.parseHost(string, parts);
      };
      URI.parseUserinfo = function(string, parts) {
        var _string = string;
        var firstBackSlash = string.indexOf("\\");
        if (firstBackSlash !== -1) {
          string = string.replace(/\\/g, "/");
        }
        var firstSlash = string.indexOf("/");
        var pos = string.lastIndexOf("@", firstSlash > -1 ? firstSlash : string.length - 1);
        var t;
        if (pos > -1 && (firstSlash === -1 || pos < firstSlash)) {
          t = string.substring(0, pos).split(":");
          parts.username = t[0] ? URI.decode(t[0]) : null;
          t.shift();
          parts.password = t[0] ? URI.decode(t.join(":")) : null;
          string = _string.substring(pos + 1);
        } else {
          parts.username = null;
          parts.password = null;
        }
        return string;
      };
      URI.parseQuery = function(string, escapeQuerySpace) {
        if (!string) {
          return {};
        }
        string = string.replace(/&+/g, "&").replace(/^\?*&*|&+$/g, "");
        if (!string) {
          return {};
        }
        var items = {};
        var splits = string.split("&");
        var length = splits.length;
        var v2, name, value;
        for (var i = 0; i < length; i++) {
          v2 = splits[i].split("=");
          name = URI.decodeQuery(v2.shift(), escapeQuerySpace);
          value = v2.length ? URI.decodeQuery(v2.join("="), escapeQuerySpace) : null;
          if (name === "__proto__") {
            continue;
          } else if (hasOwn.call(items, name)) {
            if (typeof items[name] === "string" || items[name] === null) {
              items[name] = [items[name]];
            }
            items[name].push(value);
          } else {
            items[name] = value;
          }
        }
        return items;
      };
      URI.build = function(parts) {
        var t = "";
        var requireAbsolutePath = false;
        if (parts.protocol) {
          t += parts.protocol + ":";
        }
        if (!parts.urn && (t || parts.hostname)) {
          t += "//";
          requireAbsolutePath = true;
        }
        t += URI.buildAuthority(parts) || "";
        if (typeof parts.path === "string") {
          if (parts.path.charAt(0) !== "/" && requireAbsolutePath) {
            t += "/";
          }
          t += parts.path;
        }
        if (typeof parts.query === "string" && parts.query) {
          t += "?" + parts.query;
        }
        if (typeof parts.fragment === "string" && parts.fragment) {
          t += "#" + parts.fragment;
        }
        return t;
      };
      URI.buildHost = function(parts) {
        var t = "";
        if (!parts.hostname) {
          return "";
        } else if (URI.ip6_expression.test(parts.hostname)) {
          t += "[" + parts.hostname + "]";
        } else {
          t += parts.hostname;
        }
        if (parts.port) {
          t += ":" + parts.port;
        }
        return t;
      };
      URI.buildAuthority = function(parts) {
        return URI.buildUserinfo(parts) + URI.buildHost(parts);
      };
      URI.buildUserinfo = function(parts) {
        var t = "";
        if (parts.username) {
          t += URI.encode(parts.username);
        }
        if (parts.password) {
          t += ":" + URI.encode(parts.password);
        }
        if (t) {
          t += "@";
        }
        return t;
      };
      URI.buildQuery = function(data, duplicateQueryParameters, escapeQuerySpace) {
        var t = "";
        var unique, key, i, length;
        for (key in data) {
          if (key === "__proto__") {
            continue;
          } else if (hasOwn.call(data, key)) {
            if (isArray(data[key])) {
              unique = {};
              for (i = 0, length = data[key].length; i < length; i++) {
                if (data[key][i] !== void 0 && unique[data[key][i] + ""] === void 0) {
                  t += "&" + URI.buildQueryParameter(key, data[key][i], escapeQuerySpace);
                  if (duplicateQueryParameters !== true) {
                    unique[data[key][i] + ""] = true;
                  }
                }
              }
            } else if (data[key] !== void 0) {
              t += "&" + URI.buildQueryParameter(key, data[key], escapeQuerySpace);
            }
          }
        }
        return t.substring(1);
      };
      URI.buildQueryParameter = function(name, value, escapeQuerySpace) {
        return URI.encodeQuery(name, escapeQuerySpace) + (value !== null ? "=" + URI.encodeQuery(value, escapeQuerySpace) : "");
      };
      URI.addQuery = function(data, name, value) {
        if (typeof name === "object") {
          for (var key in name) {
            if (hasOwn.call(name, key)) {
              URI.addQuery(data, key, name[key]);
            }
          }
        } else if (typeof name === "string") {
          if (data[name] === void 0) {
            data[name] = value;
            return;
          } else if (typeof data[name] === "string") {
            data[name] = [data[name]];
          }
          if (!isArray(value)) {
            value = [value];
          }
          data[name] = (data[name] || []).concat(value);
        } else {
          throw new TypeError("URI.addQuery() accepts an object, string as the name parameter");
        }
      };
      URI.setQuery = function(data, name, value) {
        if (typeof name === "object") {
          for (var key in name) {
            if (hasOwn.call(name, key)) {
              URI.setQuery(data, key, name[key]);
            }
          }
        } else if (typeof name === "string") {
          data[name] = value === void 0 ? null : value;
        } else {
          throw new TypeError("URI.setQuery() accepts an object, string as the name parameter");
        }
      };
      URI.removeQuery = function(data, name, value) {
        var i, length, key;
        if (isArray(name)) {
          for (i = 0, length = name.length; i < length; i++) {
            data[name[i]] = void 0;
          }
        } else if (getType(name) === "RegExp") {
          for (key in data) {
            if (name.test(key)) {
              data[key] = void 0;
            }
          }
        } else if (typeof name === "object") {
          for (key in name) {
            if (hasOwn.call(name, key)) {
              URI.removeQuery(data, key, name[key]);
            }
          }
        } else if (typeof name === "string") {
          if (value !== void 0) {
            if (getType(value) === "RegExp") {
              if (!isArray(data[name]) && value.test(data[name])) {
                data[name] = void 0;
              } else {
                data[name] = filterArrayValues(data[name], value);
              }
            } else if (data[name] === String(value) && (!isArray(value) || value.length === 1)) {
              data[name] = void 0;
            } else if (isArray(data[name])) {
              data[name] = filterArrayValues(data[name], value);
            }
          } else {
            data[name] = void 0;
          }
        } else {
          throw new TypeError("URI.removeQuery() accepts an object, string, RegExp as the first parameter");
        }
      };
      URI.hasQuery = function(data, name, value, withinArray) {
        switch (getType(name)) {
          case "String":
            break;
          case "RegExp":
            for (var key in data) {
              if (hasOwn.call(data, key)) {
                if (name.test(key) && (value === void 0 || URI.hasQuery(data, key, value))) {
                  return true;
                }
              }
            }
            return false;
          case "Object":
            for (var _key in name) {
              if (hasOwn.call(name, _key)) {
                if (!URI.hasQuery(data, _key, name[_key])) {
                  return false;
                }
              }
            }
            return true;
          default:
            throw new TypeError("URI.hasQuery() accepts a string, regular expression or object as the name parameter");
        }
        switch (getType(value)) {
          case "Undefined":
            return name in data;
          // data[name] !== undefined;
          case "Boolean":
            var _booly = Boolean(isArray(data[name]) ? data[name].length : data[name]);
            return value === _booly;
          case "Function":
            return !!value(data[name], name, data);
          case "Array":
            if (!isArray(data[name])) {
              return false;
            }
            var op = withinArray ? arrayContains : arraysEqual;
            return op(data[name], value);
          case "RegExp":
            if (!isArray(data[name])) {
              return Boolean(data[name] && data[name].match(value));
            }
            if (!withinArray) {
              return false;
            }
            return arrayContains(data[name], value);
          case "Number":
            value = String(value);
          /* falls through */
          case "String":
            if (!isArray(data[name])) {
              return data[name] === value;
            }
            if (!withinArray) {
              return false;
            }
            return arrayContains(data[name], value);
          default:
            throw new TypeError("URI.hasQuery() accepts undefined, boolean, string, number, RegExp, Function as the value parameter");
        }
      };
      URI.joinPaths = function() {
        var input = [];
        var segments = [];
        var nonEmptySegments = 0;
        for (var i = 0; i < arguments.length; i++) {
          var url = new URI(arguments[i]);
          input.push(url);
          var _segments = url.segment();
          for (var s = 0; s < _segments.length; s++) {
            if (typeof _segments[s] === "string") {
              segments.push(_segments[s]);
            }
            if (_segments[s]) {
              nonEmptySegments++;
            }
          }
        }
        if (!segments.length || !nonEmptySegments) {
          return new URI("");
        }
        var uri = new URI("").segment(segments);
        if (input[0].path() === "" || input[0].path().slice(0, 1) === "/") {
          uri.path("/" + uri.path());
        }
        return uri.normalize();
      };
      URI.commonPath = function(one, two) {
        var length = Math.min(one.length, two.length);
        var pos;
        for (pos = 0; pos < length; pos++) {
          if (one.charAt(pos) !== two.charAt(pos)) {
            pos--;
            break;
          }
        }
        if (pos < 1) {
          return one.charAt(0) === two.charAt(0) && one.charAt(0) === "/" ? "/" : "";
        }
        if (one.charAt(pos) !== "/" || two.charAt(pos) !== "/") {
          pos = one.substring(0, pos).lastIndexOf("/");
        }
        return one.substring(0, pos + 1);
      };
      URI.withinString = function(string, callback, options) {
        options || (options = {});
        var _start = options.start || URI.findUri.start;
        var _end = options.end || URI.findUri.end;
        var _trim = options.trim || URI.findUri.trim;
        var _parens = options.parens || URI.findUri.parens;
        var _attributeOpen = /[a-z0-9-]=["']?$/i;
        _start.lastIndex = 0;
        while (true) {
          var match = _start.exec(string);
          if (!match) {
            break;
          }
          var start = match.index;
          if (options.ignoreHtml) {
            var attributeOpen = string.slice(Math.max(start - 3, 0), start);
            if (attributeOpen && _attributeOpen.test(attributeOpen)) {
              continue;
            }
          }
          var end = start + string.slice(start).search(_end);
          var slice = string.slice(start, end);
          var parensEnd = -1;
          while (true) {
            var parensMatch = _parens.exec(slice);
            if (!parensMatch) {
              break;
            }
            var parensMatchEnd = parensMatch.index + parensMatch[0].length;
            parensEnd = Math.max(parensEnd, parensMatchEnd);
          }
          if (parensEnd > -1) {
            slice = slice.slice(0, parensEnd) + slice.slice(parensEnd).replace(_trim, "");
          } else {
            slice = slice.replace(_trim, "");
          }
          if (slice.length <= match[0].length) {
            continue;
          }
          if (options.ignore && options.ignore.test(slice)) {
            continue;
          }
          end = start + slice.length;
          var result = callback(slice, start, end, string);
          if (result === void 0) {
            _start.lastIndex = end;
            continue;
          }
          result = String(result);
          string = string.slice(0, start) + result + string.slice(end);
          _start.lastIndex = start + result.length;
        }
        _start.lastIndex = 0;
        return string;
      };
      URI.ensureValidHostname = function(v2, protocol) {
        var hasHostname = !!v2;
        var hasProtocol = !!protocol;
        var rejectEmptyHostname = false;
        if (hasProtocol) {
          rejectEmptyHostname = arrayContains(URI.hostProtocols, protocol);
        }
        if (rejectEmptyHostname && !hasHostname) {
          throw new TypeError("Hostname cannot be empty, if protocol is " + protocol);
        } else if (v2 && v2.match(URI.invalid_hostname_characters)) {
          if (!punycode) {
            throw new TypeError('Hostname "' + v2 + '" contains characters other than [A-Z0-9.-:_] and Punycode.js is not available');
          }
          if (punycode.toASCII(v2).match(URI.invalid_hostname_characters)) {
            throw new TypeError('Hostname "' + v2 + '" contains characters other than [A-Z0-9.-:_]');
          }
        }
      };
      URI.ensureValidPort = function(v2) {
        if (!v2) {
          return;
        }
        var port = Number(v2);
        if (isInteger(port) && port > 0 && port < 65536) {
          return;
        }
        throw new TypeError('Port "' + v2 + '" is not a valid port');
      };
      URI.noConflict = function(removeAll) {
        if (removeAll) {
          var unconflicted = {
            URI: this.noConflict()
          };
          if (root.URITemplate && typeof root.URITemplate.noConflict === "function") {
            unconflicted.URITemplate = root.URITemplate.noConflict();
          }
          if (root.IPv6 && typeof root.IPv6.noConflict === "function") {
            unconflicted.IPv6 = root.IPv6.noConflict();
          }
          if (root.SecondLevelDomains && typeof root.SecondLevelDomains.noConflict === "function") {
            unconflicted.SecondLevelDomains = root.SecondLevelDomains.noConflict();
          }
          return unconflicted;
        } else if (root.URI === this) {
          root.URI = _URI;
        }
        return this;
      };
      p.build = function(deferBuild) {
        if (deferBuild === true) {
          this._deferred_build = true;
        } else if (deferBuild === void 0 || this._deferred_build) {
          this._string = URI.build(this._parts);
          this._deferred_build = false;
        }
        return this;
      };
      p.clone = function() {
        return new URI(this);
      };
      p.valueOf = p.toString = function() {
        return this.build(false)._string;
      };
      function generateSimpleAccessor(_part2) {
        return function(v2, build) {
          if (v2 === void 0) {
            return this._parts[_part2] || "";
          } else {
            this._parts[_part2] = v2 || null;
            this.build(!build);
            return this;
          }
        };
      }
      function generatePrefixAccessor(_part2, _key) {
        return function(v2, build) {
          if (v2 === void 0) {
            return this._parts[_part2] || "";
          } else {
            if (v2 !== null) {
              v2 = v2 + "";
              if (v2.charAt(0) === _key) {
                v2 = v2.substring(1);
              }
            }
            this._parts[_part2] = v2;
            this.build(!build);
            return this;
          }
        };
      }
      p.protocol = generateSimpleAccessor("protocol");
      p.username = generateSimpleAccessor("username");
      p.password = generateSimpleAccessor("password");
      p.hostname = generateSimpleAccessor("hostname");
      p.port = generateSimpleAccessor("port");
      p.query = generatePrefixAccessor("query", "?");
      p.fragment = generatePrefixAccessor("fragment", "#");
      p.search = function(v2, build) {
        var t = this.query(v2, build);
        return typeof t === "string" && t.length ? "?" + t : t;
      };
      p.hash = function(v2, build) {
        var t = this.fragment(v2, build);
        return typeof t === "string" && t.length ? "#" + t : t;
      };
      p.pathname = function(v2, build) {
        if (v2 === void 0 || v2 === true) {
          var res = this._parts.path || (this._parts.hostname ? "/" : "");
          return v2 ? (this._parts.urn ? URI.decodeUrnPath : URI.decodePath)(res) : res;
        } else {
          if (this._parts.urn) {
            this._parts.path = v2 ? URI.recodeUrnPath(v2) : "";
          } else {
            this._parts.path = v2 ? URI.recodePath(v2) : "/";
          }
          this.build(!build);
          return this;
        }
      };
      p.path = p.pathname;
      p.href = function(href, build) {
        var key;
        if (href === void 0) {
          return this.toString();
        }
        this._string = "";
        this._parts = URI._parts();
        var _URI2 = href instanceof URI;
        var _object = typeof href === "object" && (href.hostname || href.path || href.pathname);
        if (href.nodeName) {
          var attribute = URI.getDomAttribute(href);
          href = href[attribute] || "";
          _object = false;
        }
        if (!_URI2 && _object && href.pathname !== void 0) {
          href = href.toString();
        }
        if (typeof href === "string" || href instanceof String) {
          this._parts = URI.parse(String(href), this._parts);
        } else if (_URI2 || _object) {
          var src = _URI2 ? href._parts : href;
          for (key in src) {
            if (key === "query") {
              continue;
            }
            if (hasOwn.call(this._parts, key)) {
              this._parts[key] = src[key];
            }
          }
          if (src.query) {
            this.query(src.query, false);
          }
        } else {
          throw new TypeError("invalid input");
        }
        this.build(!build);
        return this;
      };
      p.is = function(what) {
        var ip = false;
        var ip4 = false;
        var ip6 = false;
        var name = false;
        var sld = false;
        var idn = false;
        var punycode2 = false;
        var relative = !this._parts.urn;
        if (this._parts.hostname) {
          relative = false;
          ip4 = URI.ip4_expression.test(this._parts.hostname);
          ip6 = URI.ip6_expression.test(this._parts.hostname);
          ip = ip4 || ip6;
          name = !ip;
          sld = name && SLD && SLD.has(this._parts.hostname);
          idn = name && URI.idn_expression.test(this._parts.hostname);
          punycode2 = name && URI.punycode_expression.test(this._parts.hostname);
        }
        switch (what.toLowerCase()) {
          case "relative":
            return relative;
          case "absolute":
            return !relative;
          // hostname identification
          case "domain":
          case "name":
            return name;
          case "sld":
            return sld;
          case "ip":
            return ip;
          case "ip4":
          case "ipv4":
          case "inet4":
            return ip4;
          case "ip6":
          case "ipv6":
          case "inet6":
            return ip6;
          case "idn":
            return idn;
          case "url":
            return !this._parts.urn;
          case "urn":
            return !!this._parts.urn;
          case "punycode":
            return punycode2;
        }
        return null;
      };
      var _protocol = p.protocol;
      var _port = p.port;
      var _hostname = p.hostname;
      p.protocol = function(v2, build) {
        if (v2) {
          v2 = v2.replace(/:(\/\/)?$/, "");
          if (!v2.match(URI.protocol_expression)) {
            throw new TypeError('Protocol "' + v2 + `" contains characters other than [A-Z0-9.+-] or doesn't start with [A-Z]`);
          }
        }
        return _protocol.call(this, v2, build);
      };
      p.scheme = p.protocol;
      p.port = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 !== void 0) {
          if (v2 === 0) {
            v2 = null;
          }
          if (v2) {
            v2 += "";
            if (v2.charAt(0) === ":") {
              v2 = v2.substring(1);
            }
            URI.ensureValidPort(v2);
          }
        }
        return _port.call(this, v2, build);
      };
      p.hostname = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 !== void 0) {
          var x = { preventInvalidHostname: this._parts.preventInvalidHostname };
          var res = URI.parseHost(v2, x);
          if (res !== "/") {
            throw new TypeError('Hostname "' + v2 + '" contains characters other than [A-Z0-9.-]');
          }
          v2 = x.hostname;
          if (this._parts.preventInvalidHostname) {
            URI.ensureValidHostname(v2, this._parts.protocol);
          }
        }
        return _hostname.call(this, v2, build);
      };
      p.origin = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 === void 0) {
          var protocol = this.protocol();
          var authority = this.authority();
          if (!authority) {
            return "";
          }
          return (protocol ? protocol + "://" : "") + this.authority();
        } else {
          var origin = URI(v2);
          this.protocol(origin.protocol()).authority(origin.authority()).build(!build);
          return this;
        }
      };
      p.host = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 === void 0) {
          return this._parts.hostname ? URI.buildHost(this._parts) : "";
        } else {
          var res = URI.parseHost(v2, this._parts);
          if (res !== "/") {
            throw new TypeError('Hostname "' + v2 + '" contains characters other than [A-Z0-9.-]');
          }
          this.build(!build);
          return this;
        }
      };
      p.authority = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 === void 0) {
          return this._parts.hostname ? URI.buildAuthority(this._parts) : "";
        } else {
          var res = URI.parseAuthority(v2, this._parts);
          if (res !== "/") {
            throw new TypeError('Hostname "' + v2 + '" contains characters other than [A-Z0-9.-]');
          }
          this.build(!build);
          return this;
        }
      };
      p.userinfo = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 === void 0) {
          var t = URI.buildUserinfo(this._parts);
          return t ? t.substring(0, t.length - 1) : t;
        } else {
          if (v2[v2.length - 1] !== "@") {
            v2 += "@";
          }
          URI.parseUserinfo(v2, this._parts);
          this.build(!build);
          return this;
        }
      };
      p.resource = function(v2, build) {
        var parts;
        if (v2 === void 0) {
          return this.path() + this.search() + this.hash();
        }
        parts = URI.parse(v2);
        this._parts.path = parts.path;
        this._parts.query = parts.query;
        this._parts.fragment = parts.fragment;
        this.build(!build);
        return this;
      };
      p.subdomain = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 === void 0) {
          if (!this._parts.hostname || this.is("IP")) {
            return "";
          }
          var end = this._parts.hostname.length - this.domain().length - 1;
          return this._parts.hostname.substring(0, end) || "";
        } else {
          var e = this._parts.hostname.length - this.domain().length;
          var sub = this._parts.hostname.substring(0, e);
          var replace = new RegExp("^" + escapeRegEx(sub));
          if (v2 && v2.charAt(v2.length - 1) !== ".") {
            v2 += ".";
          }
          if (v2.indexOf(":") !== -1) {
            throw new TypeError("Domains cannot contain colons");
          }
          if (v2) {
            URI.ensureValidHostname(v2, this._parts.protocol);
          }
          this._parts.hostname = this._parts.hostname.replace(replace, v2);
          this.build(!build);
          return this;
        }
      };
      p.domain = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (typeof v2 === "boolean") {
          build = v2;
          v2 = void 0;
        }
        if (v2 === void 0) {
          if (!this._parts.hostname || this.is("IP")) {
            return "";
          }
          var t = this._parts.hostname.match(/\./g);
          if (t && t.length < 2) {
            return this._parts.hostname;
          }
          var end = this._parts.hostname.length - this.tld(build).length - 1;
          end = this._parts.hostname.lastIndexOf(".", end - 1) + 1;
          return this._parts.hostname.substring(end) || "";
        } else {
          if (!v2) {
            throw new TypeError("cannot set domain empty");
          }
          if (v2.indexOf(":") !== -1) {
            throw new TypeError("Domains cannot contain colons");
          }
          URI.ensureValidHostname(v2, this._parts.protocol);
          if (!this._parts.hostname || this.is("IP")) {
            this._parts.hostname = v2;
          } else {
            var replace = new RegExp(escapeRegEx(this.domain()) + "$");
            this._parts.hostname = this._parts.hostname.replace(replace, v2);
          }
          this.build(!build);
          return this;
        }
      };
      p.tld = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (typeof v2 === "boolean") {
          build = v2;
          v2 = void 0;
        }
        if (v2 === void 0) {
          if (!this._parts.hostname || this.is("IP")) {
            return "";
          }
          var pos = this._parts.hostname.lastIndexOf(".");
          var tld = this._parts.hostname.substring(pos + 1);
          if (build !== true && SLD && SLD.list[tld.toLowerCase()]) {
            return SLD.get(this._parts.hostname) || tld;
          }
          return tld;
        } else {
          var replace;
          if (!v2) {
            throw new TypeError("cannot set TLD empty");
          } else if (v2.match(/[^a-zA-Z0-9-]/)) {
            if (SLD && SLD.is(v2)) {
              replace = new RegExp(escapeRegEx(this.tld()) + "$");
              this._parts.hostname = this._parts.hostname.replace(replace, v2);
            } else {
              throw new TypeError('TLD "' + v2 + '" contains characters other than [A-Z0-9]');
            }
          } else if (!this._parts.hostname || this.is("IP")) {
            throw new ReferenceError("cannot set TLD on non-domain host");
          } else {
            replace = new RegExp(escapeRegEx(this.tld()) + "$");
            this._parts.hostname = this._parts.hostname.replace(replace, v2);
          }
          this.build(!build);
          return this;
        }
      };
      p.directory = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 === void 0 || v2 === true) {
          if (!this._parts.path && !this._parts.hostname) {
            return "";
          }
          if (this._parts.path === "/") {
            return "/";
          }
          var end = this._parts.path.length - this.filename().length - 1;
          var res = this._parts.path.substring(0, end) || (this._parts.hostname ? "/" : "");
          return v2 ? URI.decodePath(res) : res;
        } else {
          var e = this._parts.path.length - this.filename().length;
          var directory = this._parts.path.substring(0, e);
          var replace = new RegExp("^" + escapeRegEx(directory));
          if (!this.is("relative")) {
            if (!v2) {
              v2 = "/";
            }
            if (v2.charAt(0) !== "/") {
              v2 = "/" + v2;
            }
          }
          if (v2 && v2.charAt(v2.length - 1) !== "/") {
            v2 += "/";
          }
          v2 = URI.recodePath(v2);
          this._parts.path = this._parts.path.replace(replace, v2);
          this.build(!build);
          return this;
        }
      };
      p.filename = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (typeof v2 !== "string") {
          if (!this._parts.path || this._parts.path === "/") {
            return "";
          }
          var pos = this._parts.path.lastIndexOf("/");
          var res = this._parts.path.substring(pos + 1);
          return v2 ? URI.decodePathSegment(res) : res;
        } else {
          var mutatedDirectory = false;
          if (v2.charAt(0) === "/") {
            v2 = v2.substring(1);
          }
          if (v2.match(/\.?\//)) {
            mutatedDirectory = true;
          }
          var replace = new RegExp(escapeRegEx(this.filename()) + "$");
          v2 = URI.recodePath(v2);
          this._parts.path = this._parts.path.replace(replace, v2);
          if (mutatedDirectory) {
            this.normalizePath(build);
          } else {
            this.build(!build);
          }
          return this;
        }
      };
      p.suffix = function(v2, build) {
        if (this._parts.urn) {
          return v2 === void 0 ? "" : this;
        }
        if (v2 === void 0 || v2 === true) {
          if (!this._parts.path || this._parts.path === "/") {
            return "";
          }
          var filename = this.filename();
          var pos = filename.lastIndexOf(".");
          var s, res;
          if (pos === -1) {
            return "";
          }
          s = filename.substring(pos + 1);
          res = /^[a-z0-9%]+$/i.test(s) ? s : "";
          return v2 ? URI.decodePathSegment(res) : res;
        } else {
          if (v2.charAt(0) === ".") {
            v2 = v2.substring(1);
          }
          var suffix = this.suffix();
          var replace;
          if (!suffix) {
            if (!v2) {
              return this;
            }
            this._parts.path += "." + URI.recodePath(v2);
          } else if (!v2) {
            replace = new RegExp(escapeRegEx("." + suffix) + "$");
          } else {
            replace = new RegExp(escapeRegEx(suffix) + "$");
          }
          if (replace) {
            v2 = URI.recodePath(v2);
            this._parts.path = this._parts.path.replace(replace, v2);
          }
          this.build(!build);
          return this;
        }
      };
      p.segment = function(segment, v2, build) {
        var separator = this._parts.urn ? ":" : "/";
        var path = this.path();
        var absolute = path.substring(0, 1) === "/";
        var segments = path.split(separator);
        if (segment !== void 0 && typeof segment !== "number") {
          build = v2;
          v2 = segment;
          segment = void 0;
        }
        if (segment !== void 0 && typeof segment !== "number") {
          throw new Error('Bad segment "' + segment + '", must be 0-based integer');
        }
        if (absolute) {
          segments.shift();
        }
        if (segment < 0) {
          segment = Math.max(segments.length + segment, 0);
        }
        if (v2 === void 0) {
          return segment === void 0 ? segments : segments[segment];
        } else if (segment === null || segments[segment] === void 0) {
          if (isArray(v2)) {
            segments = [];
            for (var i = 0, l = v2.length; i < l; i++) {
              if (!v2[i].length && (!segments.length || !segments[segments.length - 1].length)) {
                continue;
              }
              if (segments.length && !segments[segments.length - 1].length) {
                segments.pop();
              }
              segments.push(trimSlashes(v2[i]));
            }
          } else if (v2 || typeof v2 === "string") {
            v2 = trimSlashes(v2);
            if (segments[segments.length - 1] === "") {
              segments[segments.length - 1] = v2;
            } else {
              segments.push(v2);
            }
          }
        } else {
          if (v2) {
            segments[segment] = trimSlashes(v2);
          } else {
            segments.splice(segment, 1);
          }
        }
        if (absolute) {
          segments.unshift("");
        }
        return this.path(segments.join(separator), build);
      };
      p.segmentCoded = function(segment, v2, build) {
        var segments, i, l;
        if (typeof segment !== "number") {
          build = v2;
          v2 = segment;
          segment = void 0;
        }
        if (v2 === void 0) {
          segments = this.segment(segment, v2, build);
          if (!isArray(segments)) {
            segments = segments !== void 0 ? URI.decode(segments) : void 0;
          } else {
            for (i = 0, l = segments.length; i < l; i++) {
              segments[i] = URI.decode(segments[i]);
            }
          }
          return segments;
        }
        if (!isArray(v2)) {
          v2 = typeof v2 === "string" || v2 instanceof String ? URI.encode(v2) : v2;
        } else {
          for (i = 0, l = v2.length; i < l; i++) {
            v2[i] = URI.encode(v2[i]);
          }
        }
        return this.segment(segment, v2, build);
      };
      var q = p.query;
      p.query = function(v2, build) {
        if (v2 === true) {
          return URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        } else if (typeof v2 === "function") {
          var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
          var result = v2.call(this, data);
          this._parts.query = URI.buildQuery(result || data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
          this.build(!build);
          return this;
        } else if (v2 !== void 0 && typeof v2 !== "string") {
          this._parts.query = URI.buildQuery(v2, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
          this.build(!build);
          return this;
        } else {
          return q.call(this, v2, build);
        }
      };
      p.setQuery = function(name, value, build) {
        var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        if (typeof name === "string" || name instanceof String) {
          data[name] = value !== void 0 ? value : null;
        } else if (typeof name === "object") {
          for (var key in name) {
            if (hasOwn.call(name, key)) {
              data[key] = name[key];
            }
          }
        } else {
          throw new TypeError("URI.addQuery() accepts an object, string as the name parameter");
        }
        this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
        if (typeof name !== "string") {
          build = value;
        }
        this.build(!build);
        return this;
      };
      p.addQuery = function(name, value, build) {
        var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        URI.addQuery(data, name, value === void 0 ? null : value);
        this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
        if (typeof name !== "string") {
          build = value;
        }
        this.build(!build);
        return this;
      };
      p.removeQuery = function(name, value, build) {
        var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        URI.removeQuery(data, name, value);
        this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
        if (typeof name !== "string") {
          build = value;
        }
        this.build(!build);
        return this;
      };
      p.hasQuery = function(name, value, withinArray) {
        var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        return URI.hasQuery(data, name, value, withinArray);
      };
      p.setSearch = p.setQuery;
      p.addSearch = p.addQuery;
      p.removeSearch = p.removeQuery;
      p.hasSearch = p.hasQuery;
      p.normalize = function() {
        if (this._parts.urn) {
          return this.normalizeProtocol(false).normalizePath(false).normalizeQuery(false).normalizeFragment(false).build();
        }
        return this.normalizeProtocol(false).normalizeHostname(false).normalizePort(false).normalizePath(false).normalizeQuery(false).normalizeFragment(false).build();
      };
      p.normalizeProtocol = function(build) {
        if (typeof this._parts.protocol === "string") {
          this._parts.protocol = this._parts.protocol.toLowerCase();
          this.build(!build);
        }
        return this;
      };
      p.normalizeHostname = function(build) {
        if (this._parts.hostname) {
          if (this.is("IDN") && punycode) {
            this._parts.hostname = punycode.toASCII(this._parts.hostname);
          } else if (this.is("IPv6") && IPv6) {
            this._parts.hostname = IPv6.best(this._parts.hostname);
          }
          this._parts.hostname = this._parts.hostname.toLowerCase();
          this.build(!build);
        }
        return this;
      };
      p.normalizePort = function(build) {
        if (typeof this._parts.protocol === "string" && this._parts.port === URI.defaultPorts[this._parts.protocol]) {
          this._parts.port = null;
          this.build(!build);
        }
        return this;
      };
      p.normalizePath = function(build) {
        var _path = this._parts.path;
        if (!_path) {
          return this;
        }
        if (this._parts.urn) {
          this._parts.path = URI.recodeUrnPath(this._parts.path);
          this.build(!build);
          return this;
        }
        if (this._parts.path === "/") {
          return this;
        }
        _path = URI.recodePath(_path);
        var _was_relative;
        var _leadingParents = "";
        var _parent, _pos;
        if (_path.charAt(0) !== "/") {
          _was_relative = true;
          _path = "/" + _path;
        }
        if (_path.slice(-3) === "/.." || _path.slice(-2) === "/.") {
          _path += "/";
        }
        _path = _path.replace(/(\/(\.\/)+)|(\/\.$)/g, "/").replace(/\/{2,}/g, "/");
        if (_was_relative) {
          _leadingParents = _path.substring(1).match(/^(\.\.\/)+/) || "";
          if (_leadingParents) {
            _leadingParents = _leadingParents[0];
          }
        }
        while (true) {
          _parent = _path.search(/\/\.\.(\/|$)/);
          if (_parent === -1) {
            break;
          } else if (_parent === 0) {
            _path = _path.substring(3);
            continue;
          }
          _pos = _path.substring(0, _parent).lastIndexOf("/");
          if (_pos === -1) {
            _pos = _parent;
          }
          _path = _path.substring(0, _pos) + _path.substring(_parent + 3);
        }
        if (_was_relative && this.is("relative")) {
          _path = _leadingParents + _path.substring(1);
        }
        this._parts.path = _path;
        this.build(!build);
        return this;
      };
      p.normalizePathname = p.normalizePath;
      p.normalizeQuery = function(build) {
        if (typeof this._parts.query === "string") {
          if (!this._parts.query.length) {
            this._parts.query = null;
          } else {
            this.query(URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace));
          }
          this.build(!build);
        }
        return this;
      };
      p.normalizeFragment = function(build) {
        if (!this._parts.fragment) {
          this._parts.fragment = null;
          this.build(!build);
        }
        return this;
      };
      p.normalizeSearch = p.normalizeQuery;
      p.normalizeHash = p.normalizeFragment;
      p.iso8859 = function() {
        var e = URI.encode;
        var d = URI.decode;
        URI.encode = escape;
        URI.decode = decodeURIComponent;
        try {
          this.normalize();
        } finally {
          URI.encode = e;
          URI.decode = d;
        }
        return this;
      };
      p.unicode = function() {
        var e = URI.encode;
        var d = URI.decode;
        URI.encode = strictEncodeURIComponent;
        URI.decode = unescape;
        try {
          this.normalize();
        } finally {
          URI.encode = e;
          URI.decode = d;
        }
        return this;
      };
      p.readable = function() {
        var uri = this.clone();
        uri.username("").password("").normalize();
        var t = "";
        if (uri._parts.protocol) {
          t += uri._parts.protocol + "://";
        }
        if (uri._parts.hostname) {
          if (uri.is("punycode") && punycode) {
            t += punycode.toUnicode(uri._parts.hostname);
            if (uri._parts.port) {
              t += ":" + uri._parts.port;
            }
          } else {
            t += uri.host();
          }
        }
        if (uri._parts.hostname && uri._parts.path && uri._parts.path.charAt(0) !== "/") {
          t += "/";
        }
        t += uri.path(true);
        if (uri._parts.query) {
          var q2 = "";
          for (var i = 0, qp = uri._parts.query.split("&"), l = qp.length; i < l; i++) {
            var kv = (qp[i] || "").split("=");
            q2 += "&" + URI.decodeQuery(kv[0], this._parts.escapeQuerySpace).replace(/&/g, "%26");
            if (kv[1] !== void 0) {
              q2 += "=" + URI.decodeQuery(kv[1], this._parts.escapeQuerySpace).replace(/&/g, "%26");
            }
          }
          t += "?" + q2.substring(1);
        }
        t += URI.decodeQuery(uri.hash(), true);
        return t;
      };
      p.absoluteTo = function(base) {
        var resolved = this.clone();
        var properties = ["protocol", "username", "password", "hostname", "port"];
        var basedir, i, p2;
        if (this._parts.urn) {
          throw new Error("URNs do not have any generally defined hierarchical components");
        }
        if (!(base instanceof URI)) {
          base = new URI(base);
        }
        if (resolved._parts.protocol) {
          return resolved;
        } else {
          resolved._parts.protocol = base._parts.protocol;
        }
        if (this._parts.hostname) {
          return resolved;
        }
        for (i = 0; p2 = properties[i]; i++) {
          resolved._parts[p2] = base._parts[p2];
        }
        if (!resolved._parts.path) {
          resolved._parts.path = base._parts.path;
          if (!resolved._parts.query) {
            resolved._parts.query = base._parts.query;
          }
        } else {
          if (resolved._parts.path.substring(-2) === "..") {
            resolved._parts.path += "/";
          }
          if (resolved.path().charAt(0) !== "/") {
            basedir = base.directory();
            basedir = basedir ? basedir : base.path().indexOf("/") === 0 ? "/" : "";
            resolved._parts.path = (basedir ? basedir + "/" : "") + resolved._parts.path;
            resolved.normalizePath();
          }
        }
        resolved.build();
        return resolved;
      };
      p.relativeTo = function(base) {
        var relative = this.clone().normalize();
        var relativeParts, baseParts, common, relativePath, basePath;
        if (relative._parts.urn) {
          throw new Error("URNs do not have any generally defined hierarchical components");
        }
        base = new URI(base).normalize();
        relativeParts = relative._parts;
        baseParts = base._parts;
        relativePath = relative.path();
        basePath = base.path();
        if (relativePath.charAt(0) !== "/") {
          throw new Error("URI is already relative");
        }
        if (basePath.charAt(0) !== "/") {
          throw new Error("Cannot calculate a URI relative to another relative URI");
        }
        if (relativeParts.protocol === baseParts.protocol) {
          relativeParts.protocol = null;
        }
        if (relativeParts.username !== baseParts.username || relativeParts.password !== baseParts.password) {
          return relative.build();
        }
        if (relativeParts.protocol !== null || relativeParts.username !== null || relativeParts.password !== null) {
          return relative.build();
        }
        if (relativeParts.hostname === baseParts.hostname && relativeParts.port === baseParts.port) {
          relativeParts.hostname = null;
          relativeParts.port = null;
        } else {
          return relative.build();
        }
        if (relativePath === basePath) {
          relativeParts.path = "";
          return relative.build();
        }
        common = URI.commonPath(relativePath, basePath);
        if (!common) {
          return relative.build();
        }
        var parents = baseParts.path.substring(common.length).replace(/[^\/]*$/, "").replace(/.*?\//g, "../");
        relativeParts.path = parents + relativeParts.path.substring(common.length) || "./";
        return relative.build();
      };
      p.equals = function(uri) {
        var one = this.clone();
        var two = new URI(uri);
        var one_map = {};
        var two_map = {};
        var checked = {};
        var one_query, two_query, key;
        one.normalize();
        two.normalize();
        if (one.toString() === two.toString()) {
          return true;
        }
        one_query = one.query();
        two_query = two.query();
        one.query("");
        two.query("");
        if (one.toString() !== two.toString()) {
          return false;
        }
        if (one_query.length !== two_query.length) {
          return false;
        }
        one_map = URI.parseQuery(one_query, this._parts.escapeQuerySpace);
        two_map = URI.parseQuery(two_query, this._parts.escapeQuerySpace);
        for (key in one_map) {
          if (hasOwn.call(one_map, key)) {
            if (!isArray(one_map[key])) {
              if (one_map[key] !== two_map[key]) {
                return false;
              }
            } else if (!arraysEqual(one_map[key], two_map[key])) {
              return false;
            }
            checked[key] = true;
          }
        }
        for (key in two_map) {
          if (hasOwn.call(two_map, key)) {
            if (!checked[key]) {
              return false;
            }
          }
        }
        return true;
      };
      p.preventInvalidHostname = function(v2) {
        this._parts.preventInvalidHostname = !!v2;
        return this;
      };
      p.duplicateQueryParameters = function(v2) {
        this._parts.duplicateQueryParameters = !!v2;
        return this;
      };
      p.escapeQuerySpace = function(v2) {
        this._parts.escapeQuerySpace = !!v2;
        return this;
      };
      return URI;
    });
  }
});

// node_modules/@cesium/engine/Source/Core/Frozen.js
var Frozen = {};
Frozen.EMPTY_OBJECT = Object.freeze({});
Frozen.EMPTY_ARRAY = Object.freeze([]);
var Frozen_default = Frozen;

// node_modules/@cesium/engine/Source/Core/defined.js
function defined(value) {
  return value !== void 0 && value !== null;
}
var defined_default = defined;

// node_modules/@cesium/engine/Source/Core/DeveloperError.js
function DeveloperError(message) {
  this.name = "DeveloperError";
  this.message = message;
  let stack;
  try {
    throw new Error();
  } catch (e) {
    stack = e.stack;
  }
  this.stack = stack;
}
if (defined_default(Object.create)) {
  DeveloperError.prototype = Object.create(Error.prototype);
  DeveloperError.prototype.constructor = DeveloperError;
}
DeveloperError.prototype.toString = function() {
  let str = `${this.name}: ${this.message}`;
  if (defined_default(this.stack)) {
    str += `
${this.stack.toString()}`;
  }
  return str;
};
DeveloperError.throwInstantiationError = function() {
  throw new DeveloperError(
    "This function defines an interface and should not be called directly."
  );
};
var DeveloperError_default = DeveloperError;

// node_modules/@cesium/engine/Source/Core/Check.js
var Check = {};
Check.typeOf = {};
function getUndefinedErrorMessage(name) {
  return `${name} is required, actual value was undefined`;
}
function getFailedTypeErrorMessage(actual, expected, name) {
  return `Expected ${name} to be typeof ${expected}, actual typeof was ${actual}`;
}
Check.defined = function(name, test) {
  if (!defined_default(test)) {
    throw new DeveloperError_default(getUndefinedErrorMessage(name));
  }
};
Check.typeOf.func = function(name, test) {
  if (typeof test !== "function") {
    throw new DeveloperError_default(
      getFailedTypeErrorMessage(typeof test, "function", name)
    );
  }
};
Check.typeOf.string = function(name, test) {
  if (typeof test !== "string") {
    throw new DeveloperError_default(
      getFailedTypeErrorMessage(typeof test, "string", name)
    );
  }
};
Check.typeOf.number = function(name, test) {
  if (typeof test !== "number") {
    throw new DeveloperError_default(
      getFailedTypeErrorMessage(typeof test, "number", name)
    );
  }
};
Check.typeOf.number.lessThan = function(name, test, limit) {
  Check.typeOf.number(name, test);
  if (test >= limit) {
    throw new DeveloperError_default(
      `Expected ${name} to be less than ${limit}, actual value was ${test}`
    );
  }
};
Check.typeOf.number.lessThanOrEquals = function(name, test, limit) {
  Check.typeOf.number(name, test);
  if (test > limit) {
    throw new DeveloperError_default(
      `Expected ${name} to be less than or equal to ${limit}, actual value was ${test}`
    );
  }
};
Check.typeOf.number.greaterThan = function(name, test, limit) {
  Check.typeOf.number(name, test);
  if (test <= limit) {
    throw new DeveloperError_default(
      `Expected ${name} to be greater than ${limit}, actual value was ${test}`
    );
  }
};
Check.typeOf.number.greaterThanOrEquals = function(name, test, limit) {
  Check.typeOf.number(name, test);
  if (test < limit) {
    throw new DeveloperError_default(
      `Expected ${name} to be greater than or equal to ${limit}, actual value was ${test}`
    );
  }
};
Check.typeOf.object = function(name, test) {
  if (typeof test !== "object") {
    throw new DeveloperError_default(
      getFailedTypeErrorMessage(typeof test, "object", name)
    );
  }
};
Check.typeOf.bool = function(name, test) {
  if (typeof test !== "boolean") {
    throw new DeveloperError_default(
      getFailedTypeErrorMessage(typeof test, "boolean", name)
    );
  }
};
Check.typeOf.bigint = function(name, test) {
  if (typeof test !== "bigint") {
    throw new DeveloperError_default(
      getFailedTypeErrorMessage(typeof test, "bigint", name)
    );
  }
};
Check.typeOf.number.equals = function(name1, name2, test1, test2) {
  Check.typeOf.number(name1, test1);
  Check.typeOf.number(name2, test2);
  if (test1 !== test2) {
    throw new DeveloperError_default(
      `${name1} must be equal to ${name2}, the actual values are ${test1} and ${test2}`
    );
  }
};
var Check_default = Check;

// node_modules/@cesium/engine/Source/Core/Event.js
function Event() {
  this._listeners = /* @__PURE__ */ new Map();
  this._toRemove = /* @__PURE__ */ new Map();
  this._toAdd = /* @__PURE__ */ new Map();
  this._invokingListeners = false;
  this._listenerCount = 0;
}
Object.defineProperties(Event.prototype, {
  /**
   * The number of listeners currently subscribed to the event.
   * @memberof Event.prototype
   * @type {number}
   * @readonly
   */
  numberOfListeners: {
    get: function() {
      return this._listenerCount;
    }
  }
});
Event.prototype.addEventListener = function(listener, scope) {
  Check_default.typeOf.func("listener", listener);
  const event = this;
  const listenerMap = event._invokingListeners ? event._toAdd : event._listeners;
  const added = addEventListener(this, listenerMap, listener, scope);
  if (added) {
    event._listenerCount++;
  }
  return function() {
    event.removeEventListener(listener, scope);
  };
};
function addEventListener(event, listenerMap, listener, scope) {
  if (!listenerMap.has(listener)) {
    listenerMap.set(listener, /* @__PURE__ */ new Set());
  }
  const scopes = listenerMap.get(listener);
  if (!scopes.has(scope)) {
    scopes.add(scope);
    return true;
  }
  return false;
}
Event.prototype.removeEventListener = function(listener, scope) {
  Check_default.typeOf.func("listener", listener);
  const removedFromListeners = removeEventListener(
    this,
    this._listeners,
    listener,
    scope
  );
  const removedFromToAdd = removeEventListener(
    this,
    this._toAdd,
    listener,
    scope
  );
  const removed = removedFromListeners || removedFromToAdd;
  if (removed) {
    this._listenerCount--;
  }
  return removed;
};
function removeEventListener(event, listenerMap, listener, scope) {
  const scopes = listenerMap.get(listener);
  if (!scopes || !scopes.has(scope)) {
    return false;
  }
  if (event._invokingListeners) {
    if (!addEventListener(event, event._toRemove, listener, scope)) {
      return false;
    }
  } else {
    scopes.delete(scope);
    if (scopes.size === 0) {
      listenerMap.delete(listener);
    }
  }
  return true;
}
Event.prototype.raiseEvent = function() {
  this._invokingListeners = true;
  for (const [listener, scopes] of this._listeners.entries()) {
    if (!defined_default(listener)) {
      continue;
    }
    for (const scope of scopes) {
      listener.apply(scope, arguments);
    }
  }
  this._invokingListeners = false;
  for (const [listener, scopes] of this._toAdd.entries()) {
    for (const scope of scopes) {
      addEventListener(this, this._listeners, listener, scope);
    }
  }
  this._toAdd.clear();
  for (const [listener, scopes] of this._toRemove.entries()) {
    for (const scope of scopes) {
      removeEventListener(this, this._listeners, listener, scope);
    }
  }
  this._toRemove.clear();
};
var Event_default = Event;

// node_modules/@cesium/engine/Source/Core/Math.js
var import_mersenne_twister = __toESM(require_mersenne_twister(), 1);
var CesiumMath = {};
CesiumMath.EPSILON1 = 0.1;
CesiumMath.EPSILON2 = 0.01;
CesiumMath.EPSILON3 = 1e-3;
CesiumMath.EPSILON4 = 1e-4;
CesiumMath.EPSILON5 = 1e-5;
CesiumMath.EPSILON6 = 1e-6;
CesiumMath.EPSILON7 = 1e-7;
CesiumMath.EPSILON8 = 1e-8;
CesiumMath.EPSILON9 = 1e-9;
CesiumMath.EPSILON10 = 1e-10;
CesiumMath.EPSILON11 = 1e-11;
CesiumMath.EPSILON12 = 1e-12;
CesiumMath.EPSILON13 = 1e-13;
CesiumMath.EPSILON14 = 1e-14;
CesiumMath.EPSILON15 = 1e-15;
CesiumMath.EPSILON16 = 1e-16;
CesiumMath.EPSILON17 = 1e-17;
CesiumMath.EPSILON18 = 1e-18;
CesiumMath.EPSILON19 = 1e-19;
CesiumMath.EPSILON20 = 1e-20;
CesiumMath.EPSILON21 = 1e-21;
CesiumMath.GRAVITATIONALPARAMETER = 3986004418e5;
CesiumMath.SOLAR_RADIUS = 6955e5;
CesiumMath.LUNAR_RADIUS = 1737400;
CesiumMath.SIXTY_FOUR_KILOBYTES = 64 * 1024;
CesiumMath.FOUR_GIGABYTES = 4 * 1024 * 1024 * 1024;
CesiumMath.sign = Math.sign ?? function sign(value) {
  value = +value;
  if (value === 0 || value !== value) {
    return value;
  }
  return value > 0 ? 1 : -1;
};
CesiumMath.signNotZero = function(value) {
  return value < 0 ? -1 : 1;
};
CesiumMath.toSNorm = function(value, rangeMaximum) {
  rangeMaximum = rangeMaximum ?? 255;
  return Math.round(
    (CesiumMath.clamp(value, -1, 1) * 0.5 + 0.5) * rangeMaximum
  );
};
CesiumMath.fromSNorm = function(value, rangeMaximum) {
  rangeMaximum = rangeMaximum ?? 255;
  return CesiumMath.clamp(value, 0, rangeMaximum) / rangeMaximum * 2 - 1;
};
CesiumMath.normalize = function(value, rangeMinimum, rangeMaximum) {
  rangeMaximum = Math.max(rangeMaximum - rangeMinimum, 0);
  return rangeMaximum === 0 ? 0 : CesiumMath.clamp((value - rangeMinimum) / rangeMaximum, 0, 1);
};
CesiumMath.sinh = Math.sinh ?? function sinh(value) {
  return (Math.exp(value) - Math.exp(-value)) / 2;
};
CesiumMath.cosh = Math.cosh ?? function cosh(value) {
  return (Math.exp(value) + Math.exp(-value)) / 2;
};
CesiumMath.lerp = function(p, q, time) {
  return (1 - time) * p + time * q;
};
CesiumMath.PI = Math.PI;
CesiumMath.ONE_OVER_PI = 1 / Math.PI;
CesiumMath.PI_OVER_TWO = Math.PI / 2;
CesiumMath.PI_OVER_THREE = Math.PI / 3;
CesiumMath.PI_OVER_FOUR = Math.PI / 4;
CesiumMath.PI_OVER_SIX = Math.PI / 6;
CesiumMath.THREE_PI_OVER_TWO = 3 * Math.PI / 2;
CesiumMath.TWO_PI = 2 * Math.PI;
CesiumMath.ONE_OVER_TWO_PI = 1 / (2 * Math.PI);
CesiumMath.RADIANS_PER_DEGREE = Math.PI / 180;
CesiumMath.DEGREES_PER_RADIAN = 180 / Math.PI;
CesiumMath.RADIANS_PER_ARCSECOND = CesiumMath.RADIANS_PER_DEGREE / 3600;
CesiumMath.toRadians = function(degrees) {
  if (!defined_default(degrees)) {
    throw new DeveloperError_default("degrees is required.");
  }
  return degrees * CesiumMath.RADIANS_PER_DEGREE;
};
CesiumMath.toDegrees = function(radians) {
  if (!defined_default(radians)) {
    throw new DeveloperError_default("radians is required.");
  }
  return radians * CesiumMath.DEGREES_PER_RADIAN;
};
CesiumMath.convertLongitudeRange = function(angle) {
  if (!defined_default(angle)) {
    throw new DeveloperError_default("angle is required.");
  }
  const twoPi = CesiumMath.TWO_PI;
  const simplified = angle - Math.floor(angle / twoPi) * twoPi;
  if (simplified < -Math.PI) {
    return simplified + twoPi;
  }
  if (simplified >= Math.PI) {
    return simplified - twoPi;
  }
  return simplified;
};
CesiumMath.clampToLatitudeRange = function(angle) {
  if (!defined_default(angle)) {
    throw new DeveloperError_default("angle is required.");
  }
  return CesiumMath.clamp(
    angle,
    -1 * CesiumMath.PI_OVER_TWO,
    CesiumMath.PI_OVER_TWO
  );
};
CesiumMath.negativePiToPi = function(angle) {
  if (!defined_default(angle)) {
    throw new DeveloperError_default("angle is required.");
  }
  if (angle >= -CesiumMath.PI && angle <= CesiumMath.PI) {
    return angle;
  }
  return CesiumMath.zeroToTwoPi(angle + CesiumMath.PI) - CesiumMath.PI;
};
CesiumMath.zeroToTwoPi = function(angle) {
  if (!defined_default(angle)) {
    throw new DeveloperError_default("angle is required.");
  }
  if (angle >= 0 && angle <= CesiumMath.TWO_PI) {
    return angle;
  }
  const mod = CesiumMath.mod(angle, CesiumMath.TWO_PI);
  if (Math.abs(mod) < CesiumMath.EPSILON14 && Math.abs(angle) > CesiumMath.EPSILON14) {
    return CesiumMath.TWO_PI;
  }
  return mod;
};
CesiumMath.mod = function(m, n) {
  if (!defined_default(m)) {
    throw new DeveloperError_default("m is required.");
  }
  if (!defined_default(n)) {
    throw new DeveloperError_default("n is required.");
  }
  if (n === 0) {
    throw new DeveloperError_default("divisor cannot be 0.");
  }
  if (CesiumMath.sign(m) === CesiumMath.sign(n) && Math.abs(m) < Math.abs(n)) {
    return m;
  }
  return (m % n + n) % n;
};
CesiumMath.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
  if (!defined_default(left)) {
    throw new DeveloperError_default("left is required.");
  }
  if (!defined_default(right)) {
    throw new DeveloperError_default("right is required.");
  }
  relativeEpsilon = relativeEpsilon ?? 0;
  absoluteEpsilon = absoluteEpsilon ?? relativeEpsilon;
  const absDiff = Math.abs(left - right);
  return absDiff <= absoluteEpsilon || absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right));
};
CesiumMath.lessThan = function(left, right, absoluteEpsilon) {
  if (!defined_default(left)) {
    throw new DeveloperError_default("first is required.");
  }
  if (!defined_default(right)) {
    throw new DeveloperError_default("second is required.");
  }
  if (!defined_default(absoluteEpsilon)) {
    throw new DeveloperError_default("absoluteEpsilon is required.");
  }
  return left - right < -absoluteEpsilon;
};
CesiumMath.lessThanOrEquals = function(left, right, absoluteEpsilon) {
  if (!defined_default(left)) {
    throw new DeveloperError_default("first is required.");
  }
  if (!defined_default(right)) {
    throw new DeveloperError_default("second is required.");
  }
  if (!defined_default(absoluteEpsilon)) {
    throw new DeveloperError_default("absoluteEpsilon is required.");
  }
  return left - right < absoluteEpsilon;
};
CesiumMath.greaterThan = function(left, right, absoluteEpsilon) {
  if (!defined_default(left)) {
    throw new DeveloperError_default("first is required.");
  }
  if (!defined_default(right)) {
    throw new DeveloperError_default("second is required.");
  }
  if (!defined_default(absoluteEpsilon)) {
    throw new DeveloperError_default("absoluteEpsilon is required.");
  }
  return left - right > absoluteEpsilon;
};
CesiumMath.greaterThanOrEquals = function(left, right, absoluteEpsilon) {
  if (!defined_default(left)) {
    throw new DeveloperError_default("first is required.");
  }
  if (!defined_default(right)) {
    throw new DeveloperError_default("second is required.");
  }
  if (!defined_default(absoluteEpsilon)) {
    throw new DeveloperError_default("absoluteEpsilon is required.");
  }
  return left - right > -absoluteEpsilon;
};
var factorials = [1];
CesiumMath.factorial = function(n) {
  if (typeof n !== "number" || n < 0) {
    throw new DeveloperError_default(
      "A number greater than or equal to 0 is required."
    );
  }
  const length = factorials.length;
  if (n >= length) {
    let sum = factorials[length - 1];
    for (let i = length; i <= n; i++) {
      const next = sum * i;
      factorials.push(next);
      sum = next;
    }
  }
  return factorials[n];
};
CesiumMath.incrementWrap = function(n, maximumValue, minimumValue) {
  minimumValue = minimumValue ?? 0;
  if (!defined_default(n)) {
    throw new DeveloperError_default("n is required.");
  }
  if (maximumValue <= minimumValue) {
    throw new DeveloperError_default("maximumValue must be greater than minimumValue.");
  }
  ++n;
  if (n > maximumValue) {
    n = minimumValue;
  }
  return n;
};
CesiumMath.isPowerOfTwo = function(n) {
  if (typeof n !== "number" || n < 0 || n > 4294967295) {
    throw new DeveloperError_default("A number between 0 and (2^32)-1 is required.");
  }
  return n !== 0 && (n & n - 1) === 0;
};
CesiumMath.nextPowerOfTwo = function(n) {
  if (typeof n !== "number" || n < 0 || n > 2147483648) {
    throw new DeveloperError_default("A number between 0 and 2^31 is required.");
  }
  --n;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  ++n;
  return n;
};
CesiumMath.previousPowerOfTwo = function(n) {
  if (typeof n !== "number" || n < 0 || n > 4294967295) {
    throw new DeveloperError_default("A number between 0 and (2^32)-1 is required.");
  }
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  n |= n >> 32;
  n = (n >>> 0) - (n >>> 1);
  return n;
};
CesiumMath.clamp = function(value, min, max) {
  Check_default.typeOf.number("value", value);
  Check_default.typeOf.number("min", min);
  Check_default.typeOf.number("max", max);
  return value < min ? min : value > max ? max : value;
};
var randomNumberGenerator = new import_mersenne_twister.default();
CesiumMath.setRandomNumberSeed = function(seed) {
  if (!defined_default(seed)) {
    throw new DeveloperError_default("seed is required.");
  }
  randomNumberGenerator = new import_mersenne_twister.default(seed);
};
CesiumMath.nextRandomNumber = function() {
  return randomNumberGenerator.random();
};
CesiumMath.randomBetween = function(min, max) {
  return CesiumMath.nextRandomNumber() * (max - min) + min;
};
CesiumMath.acosClamped = function(value) {
  if (!defined_default(value)) {
    throw new DeveloperError_default("value is required.");
  }
  return Math.acos(CesiumMath.clamp(value, -1, 1));
};
CesiumMath.asinClamped = function(value) {
  if (!defined_default(value)) {
    throw new DeveloperError_default("value is required.");
  }
  return Math.asin(CesiumMath.clamp(value, -1, 1));
};
CesiumMath.chordLength = function(angle, radius) {
  if (!defined_default(angle)) {
    throw new DeveloperError_default("angle is required.");
  }
  if (!defined_default(radius)) {
    throw new DeveloperError_default("radius is required.");
  }
  return 2 * radius * Math.sin(angle * 0.5);
};
CesiumMath.logBase = function(number, base) {
  if (!defined_default(number)) {
    throw new DeveloperError_default("number is required.");
  }
  if (!defined_default(base)) {
    throw new DeveloperError_default("base is required.");
  }
  return Math.log(number) / Math.log(base);
};
CesiumMath.cbrt = Math.cbrt ?? function cbrt(number) {
  const result = Math.pow(Math.abs(number), 1 / 3);
  return number < 0 ? -result : result;
};
CesiumMath.log2 = Math.log2 ?? function log2(number) {
  return Math.log(number) * Math.LOG2E;
};
CesiumMath.fog = function(distanceToCamera, density) {
  const scalar = distanceToCamera * density;
  return 1 - Math.exp(-(scalar * scalar));
};
CesiumMath.fastApproximateAtan = function(x) {
  Check_default.typeOf.number("x", x);
  return x * (-0.1784 * Math.abs(x) - 0.0663 * x * x + 1.0301);
};
CesiumMath.fastApproximateAtan2 = function(x, y) {
  Check_default.typeOf.number("x", x);
  Check_default.typeOf.number("y", y);
  let opposite;
  let t = Math.abs(x);
  opposite = Math.abs(y);
  const adjacent = Math.max(t, opposite);
  opposite = Math.min(t, opposite);
  const oppositeOverAdjacent = opposite / adjacent;
  if (isNaN(oppositeOverAdjacent)) {
    throw new DeveloperError_default("either x or y must be nonzero");
  }
  t = CesiumMath.fastApproximateAtan(oppositeOverAdjacent);
  t = Math.abs(y) > Math.abs(x) ? CesiumMath.PI_OVER_TWO - t : t;
  t = x < 0 ? CesiumMath.PI - t : t;
  t = y < 0 ? -t : t;
  return t;
};
var Math_default = CesiumMath;

// node_modules/@cesium/engine/Source/Core/Cartesian2.js
var Cartesian2 = class _Cartesian2 {
  /**
   * @param {number} [x=0.0] The X component.
   * @param {number} [y=0.0] The Y component.
   */
  constructor(x, y) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }
  /**
   * Creates a Cartesian2 instance from x and y coordinates.
   *
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {Cartesian2} [result] The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
   */
  static fromElements(x, y, result) {
    if (!defined_default(result)) {
      return new _Cartesian2(x, y);
    }
    result.x = x;
    result.y = y;
    return result;
  }
  /**
   * Duplicates a Cartesian2 instance.
   *
   * @param {Cartesian2} cartesian The Cartesian to duplicate.
   * @param {Cartesian2} [result] The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided. (Returns undefined if cartesian is undefined)
   */
  static clone(cartesian, result) {
    if (!defined_default(cartesian)) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Cartesian2(cartesian.x, cartesian.y);
    }
    result.x = cartesian.x;
    result.y = cartesian.y;
    return result;
  }
  /**
   * Stores the provided instance into the provided array.
   *
   * @param {Cartesian2} value The value to pack.
   * @param {number[]} array The array to pack into.
   * @param {number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {number[]} The array that was packed into
   */
  static pack(value, array, startingIndex) {
    Check_default.typeOf.object("value", value);
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    array[startingIndex++] = value.x;
    array[startingIndex] = value.y;
    return array;
  }
  /**
   * Retrieves an instance from a packed array.
   *
   * @param {number[]} array The packed array.
   * @param {number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {Cartesian2} [result] The object into which to store the result.
   * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
   */
  static unpack(array, startingIndex, result) {
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    if (!defined_default(result)) {
      result = new _Cartesian2();
    }
    result.x = array[startingIndex++];
    result.y = array[startingIndex];
    return result;
  }
  /**
   * Flattens an array of Cartesian2s into an array of components.
   *
   * @param {Cartesian2[]} array The array of cartesians to pack.
   * @param {number[]} [result] The array onto which to store the result. If this is a typed array, it must have array.length * 2 components, else a {@link DeveloperError} will be thrown. If it is a regular array, it will be resized to have (array.length * 2) elements.
   * @returns {number[]} The packed array.
   */
  static packArray(array, result) {
    Check_default.defined("array", array);
    const length = array.length;
    const resultLength = length * 2;
    if (!defined_default(result)) {
      result = new Array(resultLength);
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      throw new DeveloperError_default(
        "If result is a typed array, it must have exactly array.length * 2 elements"
      );
    } else if (result.length !== resultLength) {
      result.length = resultLength;
    }
    for (let i = 0; i < length; ++i) {
      _Cartesian2.pack(array[i], result, i * 2);
    }
    return result;
  }
  /**
   * Unpacks an array of cartesian components into an array of Cartesian2s.
   *
   * @param {number[]} array The array of components to unpack.
   * @param {Cartesian2[]} [result] The array onto which to store the result.
   * @returns {Cartesian2[]} The unpacked array.
   */
  static unpackArray(array, result) {
    Check_default.defined("array", array);
    Check_default.typeOf.number.greaterThanOrEquals("array.length", array.length, 2);
    if (array.length % 2 !== 0) {
      throw new DeveloperError_default("array length must be a multiple of 2.");
    }
    const length = array.length;
    if (!defined_default(result)) {
      result = new Array(length / 2);
    } else {
      result.length = length / 2;
    }
    for (let i = 0; i < length; i += 2) {
      const index = i / 2;
      result[index] = _Cartesian2.unpack(array, i, result[index]);
    }
    return result;
  }
  /**
   * Computes the value of the maximum component for the supplied Cartesian.
   *
   * @param {Cartesian2} cartesian The cartesian to use.
   * @returns {number} The value of the maximum component.
   */
  static maximumComponent(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return Math.max(cartesian.x, cartesian.y);
  }
  /**
   * Computes the value of the minimum component for the supplied Cartesian.
   *
   * @param {Cartesian2} cartesian The cartesian to use.
   * @returns {number} The value of the minimum component.
   */
  static minimumComponent(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return Math.min(cartesian.x, cartesian.y);
  }
  /**
   * Compares two Cartesians and computes a Cartesian which contains the minimum components of the supplied Cartesians.
   *
   * @param {Cartesian2} first A cartesian to compare.
   * @param {Cartesian2} second A cartesian to compare.
   * @param {Cartesian2} result The object into which to store the result.
   * @returns {Cartesian2} A cartesian with the minimum components.
   */
  static minimumByComponent(first, second, result) {
    Check_default.typeOf.object("first", first);
    Check_default.typeOf.object("second", second);
    Check_default.typeOf.object("result", result);
    result.x = Math.min(first.x, second.x);
    result.y = Math.min(first.y, second.y);
    return result;
  }
  /**
   * Compares two Cartesians and computes a Cartesian which contains the maximum components of the supplied Cartesians.
   *
   * @param {Cartesian2} first A cartesian to compare.
   * @param {Cartesian2} second A cartesian to compare.
   * @param {Cartesian2} result The object into which to store the result.
   * @returns {Cartesian2} A cartesian with the maximum components.
   */
  static maximumByComponent(first, second, result) {
    Check_default.typeOf.object("first", first);
    Check_default.typeOf.object("second", second);
    Check_default.typeOf.object("result", result);
    result.x = Math.max(first.x, second.x);
    result.y = Math.max(first.y, second.y);
    return result;
  }
  /**
   * Constrain a value to lie between two values.
   *
   * @param {Cartesian2} value The value to clamp.
   * @param {Cartesian2} min The minimum bound.
   * @param {Cartesian2} max The maximum bound.
   * @param {Cartesian2} result The object into which to store the result.
   * @returns {Cartesian2} The clamped value such that min <= result <= max.
   */
  static clamp(value, min, max, result) {
    Check_default.typeOf.object("value", value);
    Check_default.typeOf.object("min", min);
    Check_default.typeOf.object("max", max);
    Check_default.typeOf.object("result", result);
    const x = Math_default.clamp(value.x, min.x, max.x);
    const y = Math_default.clamp(value.y, min.y, max.y);
    result.x = x;
    result.y = y;
    return result;
  }
  /**
   * Computes the provided Cartesian's squared magnitude.
   *
   * @param {Cartesian2} cartesian The Cartesian instance whose squared magnitude is to be computed.
   * @returns {number} The squared magnitude.
   */
  static magnitudeSquared(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return cartesian.x * cartesian.x + cartesian.y * cartesian.y;
  }
  /**
   * Computes the Cartesian's magnitude (length).
   *
   * @param {Cartesian2} cartesian The Cartesian instance whose magnitude is to be computed.
   * @returns {number} The magnitude.
   */
  static magnitude(cartesian) {
    return Math.sqrt(_Cartesian2.magnitudeSquared(cartesian));
  }
  /**
   * Computes the distance between two points.
   *
   * @param {Cartesian2} left The first point to compute the distance from.
   * @param {Cartesian2} right The second point to compute the distance to.
   * @returns {number} The distance between two points.
   *
   * @example
   * // Returns 1.0
   * const d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(2.0, 0.0));
   */
  static distance(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    _Cartesian2.subtract(left, right, distanceScratch);
    return _Cartesian2.magnitude(distanceScratch);
  }
  /**
   * Computes the squared distance between two points.  Comparing squared distances
   * using this function is more efficient than comparing distances using {@link Cartesian2#distance}.
   *
   * @param {Cartesian2} left The first point to compute the distance from.
   * @param {Cartesian2} right The second point to compute the distance to.
   * @returns {number} The distance between two points.
   *
   * @example
   * // Returns 4.0, not 2.0
   * const d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(3.0, 0.0));
   */
  static distanceSquared(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    _Cartesian2.subtract(left, right, distanceScratch);
    return _Cartesian2.magnitudeSquared(distanceScratch);
  }
  /**
   * Computes the normalized form of the supplied Cartesian.
   *
   * @param {Cartesian2} cartesian The Cartesian to be normalized.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static normalize(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const magnitude = _Cartesian2.magnitude(cartesian);
    result.x = cartesian.x / magnitude;
    result.y = cartesian.y / magnitude;
    if (isNaN(result.x) || isNaN(result.y)) {
      throw new DeveloperError_default("normalized result is not a number");
    }
    return result;
  }
  /**
   * Computes the dot (scalar) product of two Cartesians.
   *
   * @param {Cartesian2} left The first Cartesian.
   * @param {Cartesian2} right The second Cartesian.
   * @returns {number} The dot product.
   */
  static dot(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    return left.x * right.x + left.y * right.y;
  }
  /**
   * Computes the magnitude of the cross product that would result from implicitly setting the Z coordinate of the input vectors to 0
   *
   * @param {Cartesian2} left The first Cartesian.
   * @param {Cartesian2} right The second Cartesian.
   * @returns {number} The cross product.
   */
  static cross(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    return left.x * right.y - left.y * right.x;
  }
  /**
   * Computes the componentwise product of two Cartesians.
   *
   * @param {Cartesian2} left The first Cartesian.
   * @param {Cartesian2} right The second Cartesian.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static multiplyComponents(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x * right.x;
    result.y = left.y * right.y;
    return result;
  }
  /**
   * Computes the componentwise quotient of two Cartesians.
   *
   * @param {Cartesian2} left The first Cartesian.
   * @param {Cartesian2} right The second Cartesian.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static divideComponents(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x / right.x;
    result.y = left.y / right.y;
    return result;
  }
  /**
   * Computes the componentwise sum of two Cartesians.
   *
   * @param {Cartesian2} left The first Cartesian.
   * @param {Cartesian2} right The second Cartesian.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static add(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x + right.x;
    result.y = left.y + right.y;
    return result;
  }
  /**
   * Computes the componentwise difference of two Cartesians.
   *
   * @param {Cartesian2} left The first Cartesian.
   * @param {Cartesian2} right The second Cartesian.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static subtract(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x - right.x;
    result.y = left.y - right.y;
    return result;
  }
  /**
   * Multiplies the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian2} cartesian The Cartesian to be scaled.
   * @param {number} scalar The scalar to multiply with.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static multiplyByScalar(cartesian, scalar, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.number("scalar", scalar);
    Check_default.typeOf.object("result", result);
    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    return result;
  }
  /**
   * Divides the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian2} cartesian The Cartesian to be divided.
   * @param {number} scalar The scalar to divide by.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static divideByScalar(cartesian, scalar, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.number("scalar", scalar);
    Check_default.typeOf.object("result", result);
    result.x = cartesian.x / scalar;
    result.y = cartesian.y / scalar;
    return result;
  }
  /**
   * Negates the provided Cartesian.
   *
   * @param {Cartesian2} cartesian The Cartesian to be negated.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static negate(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result.x = -cartesian.x;
    result.y = -cartesian.y;
    return result;
  }
  /**
   * Computes the absolute value of the provided Cartesian.
   *
   * @param {Cartesian2} cartesian The Cartesian whose absolute value is to be computed.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static abs(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result.x = Math.abs(cartesian.x);
    result.y = Math.abs(cartesian.y);
    return result;
  }
  /**
   * Computes the linear interpolation or extrapolation at t using the provided cartesians.
   *
   * @param {Cartesian2} start The value corresponding to t at 0.0.
   * @param {Cartesian2} end The value corresponding to t at 1.0.
   * @param {number} t The point along t at which to interpolate.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter.
   */
  static lerp(start, end, t, result) {
    Check_default.typeOf.object("start", start);
    Check_default.typeOf.object("end", end);
    Check_default.typeOf.number("t", t);
    Check_default.typeOf.object("result", result);
    _Cartesian2.multiplyByScalar(end, t, lerpScratch);
    result = _Cartesian2.multiplyByScalar(start, 1 - t, result);
    return _Cartesian2.add(lerpScratch, result, result);
  }
  /**
   * Returns the angle, in radians, between the provided Cartesians.
   *
   * @param {Cartesian2} left The first Cartesian.
   * @param {Cartesian2} right The second Cartesian.
   * @returns {number} The angle between the Cartesians.
   */
  static angleBetween(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    _Cartesian2.normalize(left, angleBetweenScratch);
    _Cartesian2.normalize(right, angleBetweenScratch2);
    return Math_default.acosClamped(
      _Cartesian2.dot(angleBetweenScratch, angleBetweenScratch2)
    );
  }
  /**
   * Returns the axis that is most orthogonal to the provided Cartesian.
   *
   * @param {Cartesian2} cartesian The Cartesian on which to find the most orthogonal axis.
   * @param {Cartesian2} result The object onto which to store the result.
   * @returns {Cartesian2} The most orthogonal axis.
   */
  static mostOrthogonalAxis(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const f = _Cartesian2.normalize(cartesian, mostOrthogonalAxisScratch);
    _Cartesian2.abs(f, f);
    if (f.x <= f.y) {
      result = _Cartesian2.clone(_Cartesian2.UNIT_X, result);
    } else {
      result = _Cartesian2.clone(_Cartesian2.UNIT_Y, result);
    }
    return result;
  }
  /**
   * Compares the provided Cartesians componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cartesian2} [left] The first Cartesian.
   * @param {Cartesian2} [right] The second Cartesian.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && left.x === right.x && left.y === right.y;
  }
  /**
   * @param {Cartesian2} cartesian
   * @param {number[]} array
   * @param {number} offset
   * @ignore
   */
  static equalsArray(cartesian, array, offset) {
    return cartesian.x === array[offset] && cartesian.y === array[offset + 1];
  }
  /**
   * Compares the provided Cartesians componentwise and returns
   * <code>true</code> if they pass an absolute or relative tolerance test,
   * <code>false</code> otherwise.
   *
   * @param {Cartesian2} [left] The first Cartesian.
   * @param {Cartesian2} [right] The second Cartesian.
   * @param {number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
   * @param {number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
   * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   */
  static equalsEpsilon(left, right, relativeEpsilon, absoluteEpsilon) {
    return left === right || defined_default(left) && defined_default(right) && Math_default.equalsEpsilon(
      left.x,
      right.x,
      relativeEpsilon,
      absoluteEpsilon
    ) && Math_default.equalsEpsilon(
      left.y,
      right.y,
      relativeEpsilon,
      absoluteEpsilon
    );
  }
  /**
   * Duplicates this Cartesian2 instance.
   *
   * @param {Cartesian2} [result] The object onto which to store the result.
   * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
   */
  clone(result) {
    return _Cartesian2.clone(this, result);
  }
  /**
   * Compares this Cartesian against the provided Cartesian componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cartesian2} [right] The right hand side Cartesian.
   * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
   */
  equals(right) {
    return _Cartesian2.equals(this, right);
  }
  /**
   * Compares this Cartesian against the provided Cartesian componentwise and returns
   * <code>true</code> if they pass an absolute or relative tolerance test,
   * <code>false</code> otherwise.
   *
   * @param {Cartesian2} [right] The right hand side Cartesian.
   * @param {number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
   * @param {number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
   * @returns {boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
   */
  equalsEpsilon(right, relativeEpsilon, absoluteEpsilon) {
    return _Cartesian2.equalsEpsilon(
      this,
      right,
      relativeEpsilon,
      absoluteEpsilon
    );
  }
  /**
   * Creates a string representing this Cartesian in the format '(x, y)'.
   *
   * @returns {string} A string representing the provided Cartesian in the format '(x, y)'.
   */
  toString() {
    return `(${this.x}, ${this.y})`;
  }
};
Cartesian2.fromCartesian3 = Cartesian2.clone;
Cartesian2.fromCartesian4 = Cartesian2.clone;
Cartesian2.packedLength = 2;
Cartesian2.fromArray = Cartesian2.unpack;
var distanceScratch = new Cartesian2();
var lerpScratch = new Cartesian2();
var angleBetweenScratch = new Cartesian2();
var angleBetweenScratch2 = new Cartesian2();
var mostOrthogonalAxisScratch = new Cartesian2();
Cartesian2.ZERO = Object.freeze(new Cartesian2(0, 0));
Cartesian2.ONE = Object.freeze(new Cartesian2(1, 1));
Cartesian2.UNIT_X = Object.freeze(new Cartesian2(1, 0));
Cartesian2.UNIT_Y = Object.freeze(new Cartesian2(0, 1));
var Cartesian2_default = Cartesian2;

// node_modules/@cesium/engine/Source/Core/Cartesian3.js
var Cartesian3 = class _Cartesian3 {
  /**
   * @param {number} [x=0.0] The X component.
   * @param {number} [y=0.0] The Y component.
   * @param {number} [z=0.0] The Z component.
   */
  constructor(x, y, z) {
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.z = z ?? 0;
  }
  /**
   * Converts the provided Spherical into Cartesian3 coordinates.
   *
   * @param {Spherical} spherical The Spherical to be converted to Cartesian3.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
   */
  static fromSpherical(spherical, result) {
    Check_default.typeOf.object("spherical", spherical);
    if (!defined_default(result)) {
      result = new _Cartesian3();
    }
    const clock = spherical.clock;
    const cone = spherical.cone;
    const magnitude = spherical.magnitude ?? 1;
    const radial = magnitude * Math.sin(cone);
    result.x = radial * Math.cos(clock);
    result.y = radial * Math.sin(clock);
    result.z = magnitude * Math.cos(cone);
    return result;
  }
  /**
   * Creates a Cartesian3 instance from x, y and z coordinates.
   *
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} z The z coordinate.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
   */
  static fromElements(x, y, z, result) {
    if (!defined_default(result)) {
      return new _Cartesian3(x, y, z);
    }
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Duplicates a Cartesian3 instance.
   *
   * @param {Cartesian3} cartesian The Cartesian to duplicate.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided. (Returns undefined if cartesian is undefined)
   */
  static clone(cartesian, result) {
    if (!defined_default(cartesian)) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Cartesian3(cartesian.x, cartesian.y, cartesian.z);
    }
    result.x = cartesian.x;
    result.y = cartesian.y;
    result.z = cartesian.z;
    return result;
  }
  /**
   * Stores the provided instance into the provided array.
   *
   * @param {Cartesian3} value The value to pack.
   * @param {number[]} array The array to pack into.
   * @param {number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {number[]} The array that was packed into
   */
  static pack(value, array, startingIndex) {
    Check_default.typeOf.object("value", value);
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    array[startingIndex++] = value.x;
    array[startingIndex++] = value.y;
    array[startingIndex] = value.z;
    return array;
  }
  /**
   * Retrieves an instance from a packed array.
   *
   * @param {number[]} array The packed array.
   * @param {number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {Cartesian3} [result] The object into which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
   */
  static unpack(array, startingIndex, result) {
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    if (!defined_default(result)) {
      result = new _Cartesian3();
    }
    result.x = array[startingIndex++];
    result.y = array[startingIndex++];
    result.z = array[startingIndex];
    return result;
  }
  /**
   * Flattens an array of Cartesian3s into an array of components.
   *
   * @param {Cartesian3[]} array The array of cartesians to pack.
   * @param {number[]} [result] The array onto which to store the result. If this is a typed array, it must have array.length * 3 components, else a {@link DeveloperError} will be thrown. If it is a regular array, it will be resized to have (array.length * 3) elements.
   * @returns {number[]} The packed array.
   */
  static packArray(array, result) {
    Check_default.defined("array", array);
    const length = array.length;
    const resultLength = length * 3;
    if (!defined_default(result)) {
      result = new Array(resultLength);
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      throw new DeveloperError_default(
        "If result is a typed array, it must have exactly array.length * 3 elements"
      );
    } else if (result.length !== resultLength) {
      result.length = resultLength;
    }
    for (let i = 0; i < length; ++i) {
      _Cartesian3.pack(array[i], result, i * 3);
    }
    return result;
  }
  /**
   * Unpacks an array of cartesian components into an array of Cartesian3s.
   *
   * @param {number[]} array The array of components to unpack.
   * @param {Cartesian3[]} [result] The array onto which to store the result.
   * @returns {Cartesian3[]} The unpacked array.
   */
  static unpackArray(array, result) {
    Check_default.defined("array", array);
    Check_default.typeOf.number.greaterThanOrEquals("array.length", array.length, 3);
    if (array.length % 3 !== 0) {
      throw new DeveloperError_default("array length must be a multiple of 3.");
    }
    const length = array.length;
    if (!defined_default(result)) {
      result = new Array(length / 3);
    } else {
      result.length = length / 3;
    }
    for (let i = 0; i < length; i += 3) {
      const index = i / 3;
      result[index] = _Cartesian3.unpack(array, i, result[index]);
    }
    return result;
  }
  /**
   * Computes the value of the maximum component for the supplied Cartesian.
   *
   * @param {Cartesian3} cartesian The cartesian to use.
   * @returns {number} The value of the maximum component.
   */
  static maximumComponent(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return Math.max(cartesian.x, cartesian.y, cartesian.z);
  }
  /**
   * Computes the value of the minimum component for the supplied Cartesian.
   *
   * @param {Cartesian3} cartesian The cartesian to use.
   * @returns {number} The value of the minimum component.
   */
  static minimumComponent(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return Math.min(cartesian.x, cartesian.y, cartesian.z);
  }
  /**
   * Compares two Cartesians and computes a Cartesian which contains the minimum components of the supplied Cartesians.
   *
   * @param {Cartesian3} first A cartesian to compare.
   * @param {Cartesian3} second A cartesian to compare.
   * @param {Cartesian3} result The object into which to store the result.
   * @returns {Cartesian3} A cartesian with the minimum components.
   */
  static minimumByComponent(first, second, result) {
    Check_default.typeOf.object("first", first);
    Check_default.typeOf.object("second", second);
    Check_default.typeOf.object("result", result);
    result.x = Math.min(first.x, second.x);
    result.y = Math.min(first.y, second.y);
    result.z = Math.min(first.z, second.z);
    return result;
  }
  /**
   * Compares two Cartesians and computes a Cartesian which contains the maximum components of the supplied Cartesians.
   *
   * @param {Cartesian3} first A cartesian to compare.
   * @param {Cartesian3} second A cartesian to compare.
   * @param {Cartesian3} result The object into which to store the result.
   * @returns {Cartesian3} A cartesian with the maximum components.
   */
  static maximumByComponent(first, second, result) {
    Check_default.typeOf.object("first", first);
    Check_default.typeOf.object("second", second);
    Check_default.typeOf.object("result", result);
    result.x = Math.max(first.x, second.x);
    result.y = Math.max(first.y, second.y);
    result.z = Math.max(first.z, second.z);
    return result;
  }
  /**
   * Constrain a value to lie between two values.
   *
   * @param {Cartesian3} value The value to clamp.
   * @param {Cartesian3} min The minimum bound.
   * @param {Cartesian3} max The maximum bound.
   * @param {Cartesian3} result The object into which to store the result.
   * @returns {Cartesian3} The clamped value such that min <= value <= max.
   */
  static clamp(value, min, max, result) {
    Check_default.typeOf.object("value", value);
    Check_default.typeOf.object("min", min);
    Check_default.typeOf.object("max", max);
    Check_default.typeOf.object("result", result);
    const x = Math_default.clamp(value.x, min.x, max.x);
    const y = Math_default.clamp(value.y, min.y, max.y);
    const z = Math_default.clamp(value.z, min.z, max.z);
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Computes the provided Cartesian's squared magnitude.
   *
   * @param {Cartesian3} cartesian The Cartesian instance whose squared magnitude is to be computed.
   * @returns {number} The squared magnitude.
   */
  static magnitudeSquared(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z;
  }
  /**
   * Computes the Cartesian's magnitude (length).
   *
   * @param {Cartesian3} cartesian The Cartesian instance whose magnitude is to be computed.
   * @returns {number} The magnitude.
   */
  static magnitude(cartesian) {
    return Math.sqrt(_Cartesian3.magnitudeSquared(cartesian));
  }
  /**
   * Computes the distance between two points.
   *
   * @param {Cartesian3} left The first point to compute the distance from.
   * @param {Cartesian3} right The second point to compute the distance to.
   * @returns {number} The distance between two points.
   *
   * @example
   * // Returns 1.0
   * const d = Cesium.Cartesian3.distance(new Cesium.Cartesian3(1.0, 0.0, 0.0), new Cesium.Cartesian3(2.0, 0.0, 0.0));
   */
  static distance(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    _Cartesian3.subtract(left, right, distanceScratch2);
    return _Cartesian3.magnitude(distanceScratch2);
  }
  /**
   * Computes the squared distance between two points.  Comparing squared distances
   * using this function is more efficient than comparing distances using {@link Cartesian3#distance}.
   *
   * @param {Cartesian3} left The first point to compute the distance from.
   * @param {Cartesian3} right The second point to compute the distance to.
   * @returns {number} The distance between two points.
   *
   * @example
   * // Returns 4.0, not 2.0
   * const d = Cesium.Cartesian3.distanceSquared(new Cesium.Cartesian3(1.0, 0.0, 0.0), new Cesium.Cartesian3(3.0, 0.0, 0.0));
   */
  static distanceSquared(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    _Cartesian3.subtract(left, right, distanceScratch2);
    return _Cartesian3.magnitudeSquared(distanceScratch2);
  }
  /**
   * Computes the normalized form of the supplied Cartesian.
   *
   * @param {Cartesian3} cartesian The Cartesian to be normalized.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static normalize(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const magnitude = _Cartesian3.magnitude(cartesian);
    result.x = cartesian.x / magnitude;
    result.y = cartesian.y / magnitude;
    result.z = cartesian.z / magnitude;
    if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z)) {
      throw new DeveloperError_default("normalized result is not a number");
    }
    return result;
  }
  /**
   * Computes the dot (scalar) product of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @returns {number} The dot product.
   */
  static dot(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    return left.x * right.x + left.y * right.y + left.z * right.z;
  }
  /**
   * Computes the componentwise product of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static multiplyComponents(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x * right.x;
    result.y = left.y * right.y;
    result.z = left.z * right.z;
    return result;
  }
  /**
   * Computes the componentwise quotient of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static divideComponents(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x / right.x;
    result.y = left.y / right.y;
    result.z = left.z / right.z;
    return result;
  }
  /**
   * Computes the componentwise sum of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static add(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x + right.x;
    result.y = left.y + right.y;
    result.z = left.z + right.z;
    return result;
  }
  /**
   * Computes the componentwise difference of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static subtract(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x - right.x;
    result.y = left.y - right.y;
    result.z = left.z - right.z;
    return result;
  }
  /**
   * Multiplies the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian3} cartesian The Cartesian to be scaled.
   * @param {number} scalar The scalar to multiply with.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static multiplyByScalar(cartesian, scalar, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.number("scalar", scalar);
    Check_default.typeOf.object("result", result);
    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    result.z = cartesian.z * scalar;
    return result;
  }
  /**
   * Divides the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian3} cartesian The Cartesian to be divided.
   * @param {number} scalar The scalar to divide by.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static divideByScalar(cartesian, scalar, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.number("scalar", scalar);
    Check_default.typeOf.object("result", result);
    result.x = cartesian.x / scalar;
    result.y = cartesian.y / scalar;
    result.z = cartesian.z / scalar;
    return result;
  }
  /**
   * Negates the provided Cartesian.
   *
   * @param {Cartesian3} cartesian The Cartesian to be negated.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static negate(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result.x = -cartesian.x;
    result.y = -cartesian.y;
    result.z = -cartesian.z;
    return result;
  }
  /**
   * Computes the absolute value of the provided Cartesian.
   *
   * @param {Cartesian3} cartesian The Cartesian whose absolute value is to be computed.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static abs(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result.x = Math.abs(cartesian.x);
    result.y = Math.abs(cartesian.y);
    result.z = Math.abs(cartesian.z);
    return result;
  }
  /**
   * Computes the linear interpolation or extrapolation at t using the provided cartesians.
   *
   * @param {Cartesian3} start The value corresponding to t at 0.0.
   * @param {Cartesian3} end The value corresponding to t at 1.0.
   * @param {number} t The point along t at which to interpolate.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static lerp(start, end, t, result) {
    Check_default.typeOf.object("start", start);
    Check_default.typeOf.object("end", end);
    Check_default.typeOf.number("t", t);
    Check_default.typeOf.object("result", result);
    _Cartesian3.multiplyByScalar(end, t, lerpScratch2);
    result = _Cartesian3.multiplyByScalar(start, 1 - t, result);
    return _Cartesian3.add(lerpScratch2, result, result);
  }
  /**
   * Returns the angle, in radians, between the provided Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @returns {number} The angle between the Cartesians.
   */
  static angleBetween(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    _Cartesian3.normalize(left, angleBetweenScratch3);
    _Cartesian3.normalize(right, angleBetweenScratch22);
    const cosine = _Cartesian3.dot(angleBetweenScratch3, angleBetweenScratch22);
    const sine = _Cartesian3.magnitude(
      _Cartesian3.cross(
        angleBetweenScratch3,
        angleBetweenScratch22,
        angleBetweenScratch3
      )
    );
    return Math.atan2(sine, cosine);
  }
  /**
   * Returns the axis that is most orthogonal to the provided Cartesian.
   *
   * @param {Cartesian3} cartesian The Cartesian on which to find the most orthogonal axis.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The most orthogonal axis.
   */
  static mostOrthogonalAxis(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const f = _Cartesian3.normalize(cartesian, mostOrthogonalAxisScratch2);
    _Cartesian3.abs(f, f);
    if (f.x <= f.y) {
      if (f.x <= f.z) {
        result = _Cartesian3.clone(_Cartesian3.UNIT_X, result);
      } else {
        result = _Cartesian3.clone(_Cartesian3.UNIT_Z, result);
      }
    } else if (f.y <= f.z) {
      result = _Cartesian3.clone(_Cartesian3.UNIT_Y, result);
    } else {
      result = _Cartesian3.clone(_Cartesian3.UNIT_Z, result);
    }
    return result;
  }
  /**
   * Projects vector a onto vector b
   * @param {Cartesian3} a The vector that needs projecting
   * @param {Cartesian3} b The vector to project onto
   * @param {Cartesian3} result The result cartesian
   * @returns {Cartesian3} The modified result parameter
   */
  static projectVector(a3, b, result) {
    Check_default.defined("a", a3);
    Check_default.defined("b", b);
    Check_default.defined("result", result);
    const scalar = _Cartesian3.dot(a3, b) / _Cartesian3.dot(b, b);
    return _Cartesian3.multiplyByScalar(b, scalar, result);
  }
  /**
   * Compares the provided Cartesians componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cartesian3} [left] The first Cartesian.
   * @param {Cartesian3} [right] The second Cartesian.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && left.x === right.x && left.y === right.y && left.z === right.z;
  }
  /**
   * @param {Cartesian3} cartesian
   * @param {number[]} array
   * @param {number} offset
   * @ignore
   */
  static equalsArray(cartesian, array, offset) {
    return cartesian.x === array[offset] && cartesian.y === array[offset + 1] && cartesian.z === array[offset + 2];
  }
  /**
   * Compares the provided Cartesians componentwise and returns
   * <code>true</code> if they pass an absolute or relative tolerance test,
   * <code>false</code> otherwise.
   *
   * @param {Cartesian3} [left] The first Cartesian.
   * @param {Cartesian3} [right] The second Cartesian.
   * @param {number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
   * @param {number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
   * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   */
  static equalsEpsilon(left, right, relativeEpsilon, absoluteEpsilon) {
    return left === right || defined_default(left) && defined_default(right) && Math_default.equalsEpsilon(
      left.x,
      right.x,
      relativeEpsilon,
      absoluteEpsilon
    ) && Math_default.equalsEpsilon(
      left.y,
      right.y,
      relativeEpsilon,
      absoluteEpsilon
    ) && Math_default.equalsEpsilon(
      left.z,
      right.z,
      relativeEpsilon,
      absoluteEpsilon
    );
  }
  /**
   * Computes the cross (outer) product of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The cross product.
   */
  static cross(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    const leftX = left.x;
    const leftY = left.y;
    const leftZ = left.z;
    const rightX = right.x;
    const rightY = right.y;
    const rightZ = right.z;
    const x = leftY * rightZ - leftZ * rightY;
    const y = leftZ * rightX - leftX * rightZ;
    const z = leftX * rightY - leftY * rightX;
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Computes the midpoint between the right and left Cartesian.
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The midpoint.
   */
  static midpoint(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = (left.x + right.x) * 0.5;
    result.y = (left.y + right.y) * 0.5;
    result.z = (left.z + right.z) * 0.5;
    return result;
  }
  /**
   * Returns a Cartesian3 position from longitude and latitude values given in degrees.
   *
   * @param {number} longitude The longitude, in degrees
   * @param {number} latitude The latitude, in degrees
   * @param {number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The position
   *
   * @example
   * const position = Cesium.Cartesian3.fromDegrees(-115.0, 37.0);
   */
  static fromDegrees(longitude, latitude, height, ellipsoid, result) {
    Check_default.typeOf.number("longitude", longitude);
    Check_default.typeOf.number("latitude", latitude);
    longitude = Math_default.toRadians(longitude);
    latitude = Math_default.toRadians(latitude);
    return _Cartesian3.fromRadians(
      longitude,
      latitude,
      height,
      ellipsoid,
      result
    );
  }
  /**
   * Returns a Cartesian3 position from longitude and latitude values given in radians.
   *
   * @param {number} longitude The longitude, in radians
   * @param {number} latitude The latitude, in radians
   * @param {number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The position
   *
   * @example
   * const position = Cesium.Cartesian3.fromRadians(-2.007, 0.645);
   */
  static fromRadians(longitude, latitude, height, ellipsoid, result) {
    Check_default.typeOf.number("longitude", longitude);
    Check_default.typeOf.number("latitude", latitude);
    height = height ?? 0;
    const radiiSquared = !defined_default(ellipsoid) ? _Cartesian3._ellipsoidRadiiSquared : ellipsoid.radiiSquared;
    const cosLatitude = Math.cos(latitude);
    scratchN.x = cosLatitude * Math.cos(longitude);
    scratchN.y = cosLatitude * Math.sin(longitude);
    scratchN.z = Math.sin(latitude);
    scratchN = _Cartesian3.normalize(scratchN, scratchN);
    _Cartesian3.multiplyComponents(radiiSquared, scratchN, scratchK);
    const gamma = Math.sqrt(_Cartesian3.dot(scratchN, scratchK));
    scratchK = _Cartesian3.divideByScalar(scratchK, gamma, scratchK);
    scratchN = _Cartesian3.multiplyByScalar(scratchN, height, scratchN);
    if (!defined_default(result)) {
      result = new _Cartesian3();
    }
    return _Cartesian3.add(scratchK, scratchN, result);
  }
  /**
   * Returns an array of Cartesian3 positions given an array of longitude and latitude values given in degrees.
   *
   * @param {number[]} coordinates A list of longitude and latitude values. Values alternate [longitude, latitude, longitude, latitude...].
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the coordinates lie.
   * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
   * @returns {Cartesian3[]} The array of positions.
   *
   * @example
   * const positions = Cesium.Cartesian3.fromDegreesArray([-115.0, 37.0, -107.0, 33.0]);
   */
  static fromDegreesArray(coordinates, ellipsoid, result) {
    Check_default.defined("coordinates", coordinates);
    if (coordinates.length < 2 || coordinates.length % 2 !== 0) {
      throw new DeveloperError_default(
        "the number of coordinates must be a multiple of 2 and at least 2"
      );
    }
    const length = coordinates.length;
    if (!defined_default(result)) {
      result = new Array(length / 2);
    } else {
      result.length = length / 2;
    }
    for (let i = 0; i < length; i += 2) {
      const longitude = coordinates[i];
      const latitude = coordinates[i + 1];
      const index = i / 2;
      result[index] = _Cartesian3.fromDegrees(
        longitude,
        latitude,
        0,
        ellipsoid,
        result[index]
      );
    }
    return result;
  }
  /**
   * Returns an array of Cartesian3 positions given an array of longitude and latitude values given in radians.
   *
   * @param {number[]} coordinates A list of longitude and latitude values. Values alternate [longitude, latitude, longitude, latitude...].
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the coordinates lie.
   * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
   * @returns {Cartesian3[]} The array of positions.
   *
   * @example
   * const positions = Cesium.Cartesian3.fromRadiansArray([-2.007, 0.645, -1.867, .575]);
   */
  static fromRadiansArray(coordinates, ellipsoid, result) {
    Check_default.defined("coordinates", coordinates);
    if (coordinates.length < 2 || coordinates.length % 2 !== 0) {
      throw new DeveloperError_default(
        "the number of coordinates must be a multiple of 2 and at least 2"
      );
    }
    const length = coordinates.length;
    if (!defined_default(result)) {
      result = new Array(length / 2);
    } else {
      result.length = length / 2;
    }
    for (let i = 0; i < length; i += 2) {
      const longitude = coordinates[i];
      const latitude = coordinates[i + 1];
      const index = i / 2;
      result[index] = _Cartesian3.fromRadians(
        longitude,
        latitude,
        0,
        ellipsoid,
        result[index]
      );
    }
    return result;
  }
  /**
   * Returns an array of Cartesian3 positions given an array of longitude, latitude and height values where longitude and latitude are given in degrees.
   *
   * @param {number[]} coordinates A list of longitude, latitude and height values. Values alternate [longitude, latitude, height, longitude, latitude, height...].
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
   * @returns {Cartesian3[]} The array of positions.
   *
   * @example
   * const positions = Cesium.Cartesian3.fromDegreesArrayHeights([-115.0, 37.0, 100000.0, -107.0, 33.0, 150000.0]);
   */
  static fromDegreesArrayHeights(coordinates, ellipsoid, result) {
    Check_default.defined("coordinates", coordinates);
    if (coordinates.length < 3 || coordinates.length % 3 !== 0) {
      throw new DeveloperError_default(
        "the number of coordinates must be a multiple of 3 and at least 3"
      );
    }
    const length = coordinates.length;
    if (!defined_default(result)) {
      result = new Array(length / 3);
    } else {
      result.length = length / 3;
    }
    for (let i = 0; i < length; i += 3) {
      const longitude = coordinates[i];
      const latitude = coordinates[i + 1];
      const height = coordinates[i + 2];
      const index = i / 3;
      result[index] = _Cartesian3.fromDegrees(
        longitude,
        latitude,
        height,
        ellipsoid,
        result[index]
      );
    }
    return result;
  }
  /**
   * Returns an array of Cartesian3 positions given an array of longitude, latitude and height values where longitude and latitude are given in radians.
   *
   * @param {number[]} coordinates A list of longitude, latitude and height values. Values alternate [longitude, latitude, height, longitude, latitude, height...].
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3[]} [result] An array of Cartesian3 objects to store the result.
   * @returns {Cartesian3[]} The array of positions.
   *
   * @example
   * const positions = Cesium.Cartesian3.fromRadiansArrayHeights([-2.007, 0.645, 100000.0, -1.867, .575, 150000.0]);
   */
  static fromRadiansArrayHeights(coordinates, ellipsoid, result) {
    Check_default.defined("coordinates", coordinates);
    if (coordinates.length < 3 || coordinates.length % 3 !== 0) {
      throw new DeveloperError_default(
        "the number of coordinates must be a multiple of 3 and at least 3"
      );
    }
    const length = coordinates.length;
    if (!defined_default(result)) {
      result = new Array(length / 3);
    } else {
      result.length = length / 3;
    }
    for (let i = 0; i < length; i += 3) {
      const longitude = coordinates[i];
      const latitude = coordinates[i + 1];
      const height = coordinates[i + 2];
      const index = i / 3;
      result[index] = _Cartesian3.fromRadians(
        longitude,
        latitude,
        height,
        ellipsoid,
        result[index]
      );
    }
    return result;
  }
  /**
   * Duplicates this Cartesian3 instance.
   *
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
   */
  clone(result) {
    return _Cartesian3.clone(this, result);
  }
  /**
   * Compares this Cartesian against the provided Cartesian componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cartesian3} [right] The right hand side Cartesian.
   * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
   */
  equals(right) {
    return _Cartesian3.equals(this, right);
  }
  /**
   * Compares this Cartesian against the provided Cartesian componentwise and returns
   * <code>true</code> if they pass an absolute or relative tolerance test,
   * <code>false</code> otherwise.
   *
   * @param {Cartesian3} [right] The right hand side Cartesian.
   * @param {number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
   * @param {number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
   * @returns {boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
   */
  equalsEpsilon(right, relativeEpsilon, absoluteEpsilon) {
    return _Cartesian3.equalsEpsilon(
      this,
      right,
      relativeEpsilon,
      absoluteEpsilon
    );
  }
  /**
   * Creates a string representing this Cartesian in the format '(x, y, z)'.
   *
   * @returns {string} A string representing this Cartesian in the format '(x, y, z)'.
   */
  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
};
Cartesian3.fromCartesian4 = Cartesian3.clone;
Cartesian3.packedLength = 3;
Cartesian3.fromArray = Cartesian3.unpack;
var distanceScratch2 = new Cartesian3();
var lerpScratch2 = new Cartesian3();
var angleBetweenScratch3 = new Cartesian3();
var angleBetweenScratch22 = new Cartesian3();
var mostOrthogonalAxisScratch2 = new Cartesian3();
var scratchN = new Cartesian3();
var scratchK = new Cartesian3();
Cartesian3._ellipsoidRadiiSquared = new Cartesian3(
  6378137 * 6378137,
  6378137 * 6378137,
  6356752314245179e-9 * 6356752314245179e-9
);
Cartesian3.ZERO = Object.freeze(new Cartesian3(0, 0, 0));
Cartesian3.ONE = Object.freeze(new Cartesian3(1, 1, 1));
Cartesian3.UNIT_X = Object.freeze(new Cartesian3(1, 0, 0));
Cartesian3.UNIT_Y = Object.freeze(new Cartesian3(0, 1, 0));
Cartesian3.UNIT_Z = Object.freeze(new Cartesian3(0, 0, 1));
var Cartesian3_default = Cartesian3;

// node_modules/@cesium/engine/Source/Core/scaleToGeodeticSurface.js
var scaleToGeodeticSurfaceIntersection = new Cartesian3_default();
var scaleToGeodeticSurfaceGradient = new Cartesian3_default();
function scaleToGeodeticSurface(cartesian, oneOverRadii, oneOverRadiiSquared, centerToleranceSquared, result) {
  if (!defined_default(cartesian)) {
    throw new DeveloperError_default("cartesian is required.");
  }
  if (!defined_default(oneOverRadii)) {
    throw new DeveloperError_default("oneOverRadii is required.");
  }
  if (!defined_default(oneOverRadiiSquared)) {
    throw new DeveloperError_default("oneOverRadiiSquared is required.");
  }
  if (!defined_default(centerToleranceSquared)) {
    throw new DeveloperError_default("centerToleranceSquared is required.");
  }
  const positionX = cartesian.x;
  const positionY = cartesian.y;
  const positionZ = cartesian.z;
  const oneOverRadiiX = oneOverRadii.x;
  const oneOverRadiiY = oneOverRadii.y;
  const oneOverRadiiZ = oneOverRadii.z;
  const x2 = positionX * positionX * oneOverRadiiX * oneOverRadiiX;
  const y2 = positionY * positionY * oneOverRadiiY * oneOverRadiiY;
  const z2 = positionZ * positionZ * oneOverRadiiZ * oneOverRadiiZ;
  const squaredNorm = x2 + y2 + z2;
  const ratio = Math.sqrt(1 / squaredNorm);
  const intersection = Cartesian3_default.multiplyByScalar(
    cartesian,
    ratio,
    scaleToGeodeticSurfaceIntersection
  );
  if (squaredNorm < centerToleranceSquared) {
    return !isFinite(ratio) ? void 0 : Cartesian3_default.clone(intersection, result);
  }
  const oneOverRadiiSquaredX = oneOverRadiiSquared.x;
  const oneOverRadiiSquaredY = oneOverRadiiSquared.y;
  const oneOverRadiiSquaredZ = oneOverRadiiSquared.z;
  const gradient = scaleToGeodeticSurfaceGradient;
  gradient.x = intersection.x * oneOverRadiiSquaredX * 2;
  gradient.y = intersection.y * oneOverRadiiSquaredY * 2;
  gradient.z = intersection.z * oneOverRadiiSquaredZ * 2;
  let lambda = (1 - ratio) * Cartesian3_default.magnitude(cartesian) / (0.5 * Cartesian3_default.magnitude(gradient));
  let correction = 0;
  let func;
  let denominator;
  let xMultiplier;
  let yMultiplier;
  let zMultiplier;
  let xMultiplier2;
  let yMultiplier2;
  let zMultiplier2;
  let xMultiplier3;
  let yMultiplier3;
  let zMultiplier3;
  do {
    lambda -= correction;
    xMultiplier = 1 / (1 + lambda * oneOverRadiiSquaredX);
    yMultiplier = 1 / (1 + lambda * oneOverRadiiSquaredY);
    zMultiplier = 1 / (1 + lambda * oneOverRadiiSquaredZ);
    xMultiplier2 = xMultiplier * xMultiplier;
    yMultiplier2 = yMultiplier * yMultiplier;
    zMultiplier2 = zMultiplier * zMultiplier;
    xMultiplier3 = xMultiplier2 * xMultiplier;
    yMultiplier3 = yMultiplier2 * yMultiplier;
    zMultiplier3 = zMultiplier2 * zMultiplier;
    func = x2 * xMultiplier2 + y2 * yMultiplier2 + z2 * zMultiplier2 - 1;
    denominator = x2 * xMultiplier3 * oneOverRadiiSquaredX + y2 * yMultiplier3 * oneOverRadiiSquaredY + z2 * zMultiplier3 * oneOverRadiiSquaredZ;
    const derivative = -2 * denominator;
    correction = func / derivative;
  } while (Math.abs(func) > Math_default.EPSILON12);
  if (!defined_default(result)) {
    return new Cartesian3_default(
      positionX * xMultiplier,
      positionY * yMultiplier,
      positionZ * zMultiplier
    );
  }
  result.x = positionX * xMultiplier;
  result.y = positionY * yMultiplier;
  result.z = positionZ * zMultiplier;
  return result;
}
var scaleToGeodeticSurface_default = scaleToGeodeticSurface;

// node_modules/@cesium/engine/Source/Core/Cartographic.js
var Cartographic = class _Cartographic {
  /**
   * @param {number} [longitude=0.0] The longitude, in radians.
   * @param {number} [latitude=0.0] The latitude, in radians.
   * @param {number} [height=0.0] The height, in meters, above the ellipsoid.
   */
  constructor(longitude, latitude, height) {
    this.longitude = longitude ?? 0;
    this.latitude = latitude ?? 0;
    this.height = height ?? 0;
  }
  /**
   * Creates a new Cartographic instance from longitude and latitude
   * specified in radians.
   *
   * @param {number} longitude The longitude, in radians.
   * @param {number} latitude The latitude, in radians.
   * @param {number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided.
   */
  static fromRadians(longitude, latitude, height, result) {
    Check_default.typeOf.number("longitude", longitude);
    Check_default.typeOf.number("latitude", latitude);
    height = height ?? 0;
    if (!defined_default(result)) {
      return new _Cartographic(longitude, latitude, height);
    }
    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
  }
  /**
   * Creates a new Cartographic instance from longitude and latitude
   * specified in degrees.  The values in the resulting object will
   * be in radians.
   *
   * @param {number} longitude The longitude, in degrees.
   * @param {number} latitude The latitude, in degrees.
   * @param {number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided.
   */
  static fromDegrees(longitude, latitude, height, result) {
    Check_default.typeOf.number("longitude", longitude);
    Check_default.typeOf.number("latitude", latitude);
    longitude = Math_default.toRadians(longitude);
    latitude = Math_default.toRadians(latitude);
    return _Cartographic.fromRadians(longitude, latitude, height, result);
  }
  /**
   * Creates a new Cartographic instance from a Cartesian position. The values in the
   * resulting object will be in radians.
   *
   * @param {Cartesian3} cartesian The Cartesian position to convert to cartographic representation.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.
   */
  static fromCartesian(cartesian, ellipsoid, result) {
    const oneOverRadii = defined_default(ellipsoid) ? ellipsoid.oneOverRadii : _Cartographic._ellipsoidOneOverRadii;
    const oneOverRadiiSquared = defined_default(ellipsoid) ? ellipsoid.oneOverRadiiSquared : _Cartographic._ellipsoidOneOverRadiiSquared;
    const centerToleranceSquared = defined_default(ellipsoid) ? ellipsoid._centerToleranceSquared : _Cartographic._ellipsoidCenterToleranceSquared;
    const p = scaleToGeodeticSurface_default(
      cartesian,
      oneOverRadii,
      oneOverRadiiSquared,
      centerToleranceSquared,
      cartesianToCartographicP
    );
    if (!defined_default(p)) {
      return void 0;
    }
    let n = Cartesian3_default.multiplyComponents(
      p,
      oneOverRadiiSquared,
      cartesianToCartographicN
    );
    n = Cartesian3_default.normalize(n, n);
    const h = Cartesian3_default.subtract(cartesian, p, cartesianToCartographicH);
    const longitude = Math.atan2(n.y, n.x);
    const latitude = Math.asin(n.z);
    const height = Math_default.sign(Cartesian3_default.dot(h, cartesian)) * Cartesian3_default.magnitude(h);
    if (!defined_default(result)) {
      return new _Cartographic(longitude, latitude, height);
    }
    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
  }
  /**
   * Creates a new Cartesian3 instance from a Cartographic input. The values in the inputted
   * object should be in radians.
   *
   * @param {Cartographic} cartographic Input to be converted into a Cartesian3 output.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid on which the position lies.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The position
   */
  static toCartesian(cartographic, ellipsoid, result) {
    Check_default.defined("cartographic", cartographic);
    return Cartesian3_default.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height,
      ellipsoid,
      result
    );
  }
  /**
   * Duplicates a Cartographic instance.
   *
   * @param {Cartographic} cartographic The cartographic to duplicate.
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided. (Returns undefined if cartographic is undefined)
   */
  static clone(cartographic, result) {
    if (!defined_default(cartographic)) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Cartographic(
        cartographic.longitude,
        cartographic.latitude,
        cartographic.height
      );
    }
    result.longitude = cartographic.longitude;
    result.latitude = cartographic.latitude;
    result.height = cartographic.height;
    return result;
  }
  /**
   * Compares the provided cartographics componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cartographic} [left] The first cartographic.
   * @param {Cartographic} [right] The second cartographic.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && left.longitude === right.longitude && left.latitude === right.latitude && left.height === right.height;
  }
  /**
   * Compares the provided cartographics componentwise and returns
   * <code>true</code> if they are within the provided epsilon,
   * <code>false</code> otherwise.
   *
   * @param {Cartographic} [left] The first cartographic.
   * @param {Cartographic} [right] The second cartographic.
   * @param {number} [epsilon=0] The epsilon to use for equality testing.
   * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   */
  static equalsEpsilon(left, right, epsilon) {
    epsilon = epsilon ?? 0;
    return left === right || defined_default(left) && defined_default(right) && Math.abs(left.longitude - right.longitude) <= epsilon && Math.abs(left.latitude - right.latitude) <= epsilon && Math.abs(left.height - right.height) <= epsilon;
  }
  /**
   * Duplicates this instance.
   *
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided.
   */
  clone(result) {
    return _Cartographic.clone(this, result);
  }
  /**
   * Compares the provided against this cartographic componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cartographic} [right] The second cartographic.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  equals(right) {
    return _Cartographic.equals(this, right);
  }
  /**
   * Compares the provided against this cartographic componentwise and returns
   * <code>true</code> if they are within the provided epsilon,
   * <code>false</code> otherwise.
   *
   * @param {Cartographic} [right] The second cartographic.
   * @param {number} [epsilon=0] The epsilon to use for equality testing.
   * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   */
  equalsEpsilon(right, epsilon) {
    return _Cartographic.equalsEpsilon(this, right, epsilon);
  }
  /**
   * Creates a string representing this cartographic in the format '(longitude, latitude, height)'.
   *
   * @returns {string} A string representing the provided cartographic in the format '(longitude, latitude, height)'.
   */
  toString() {
    return `(${this.longitude}, ${this.latitude}, ${this.height})`;
  }
  // To avoid circular dependencies, these are set by Ellipsoid when Ellipsoid.default is set.
  static _ellipsoidOneOverRadii = new Cartesian3_default(
    1 / 6378137,
    1 / 6378137,
    1 / 6356752314245179e-9
  );
  static _ellipsoidOneOverRadiiSquared = new Cartesian3_default(
    1 / (6378137 * 6378137),
    1 / (6378137 * 6378137),
    1 / (6356752314245179e-9 * 6356752314245179e-9)
  );
  static _ellipsoidCenterToleranceSquared = Math_default.EPSILON1;
};
Cartographic.ZERO = Object.freeze(new Cartographic(0, 0, 0));
var cartesianToCartographicN = new Cartesian3_default();
var cartesianToCartographicP = new Cartesian3_default();
var cartesianToCartographicH = new Cartesian3_default();
var Cartographic_default = Cartographic;

// node_modules/@cesium/engine/Source/Core/Ellipsoid.js
function initialize(ellipsoid, x, y, z) {
  x = x ?? 0;
  y = y ?? 0;
  z = z ?? 0;
  Check_default.typeOf.number.greaterThanOrEquals("x", x, 0);
  Check_default.typeOf.number.greaterThanOrEquals("y", y, 0);
  Check_default.typeOf.number.greaterThanOrEquals("z", z, 0);
  ellipsoid._radii = new Cartesian3_default(x, y, z);
  ellipsoid._radiiSquared = new Cartesian3_default(x * x, y * y, z * z);
  ellipsoid._radiiToTheFourth = new Cartesian3_default(
    x * x * x * x,
    y * y * y * y,
    z * z * z * z
  );
  ellipsoid._oneOverRadii = new Cartesian3_default(
    x === 0 ? 0 : 1 / x,
    y === 0 ? 0 : 1 / y,
    z === 0 ? 0 : 1 / z
  );
  ellipsoid._oneOverRadiiSquared = new Cartesian3_default(
    x === 0 ? 0 : 1 / (x * x),
    y === 0 ? 0 : 1 / (y * y),
    z === 0 ? 0 : 1 / (z * z)
  );
  ellipsoid._minimumRadius = Math.min(x, y, z);
  ellipsoid._maximumRadius = Math.max(x, y, z);
  ellipsoid._centerToleranceSquared = Math_default.EPSILON1;
  if (ellipsoid._radiiSquared.z !== 0) {
    ellipsoid._squaredXOverSquaredZ = ellipsoid._radiiSquared.x / ellipsoid._radiiSquared.z;
  }
}
var Ellipsoid = class _Ellipsoid {
  /**
   * @param {number} [x=0] The radius in the x direction.
   * @param {number} [y=0] The radius in the y direction.
   * @param {number} [z=0] The radius in the z direction.
   *
   * @exception {DeveloperError} All radii components must be greater than or equal to zero.
   */
  constructor(x, y, z) {
    this._radii = void 0;
    this._radiiSquared = void 0;
    this._radiiToTheFourth = void 0;
    this._oneOverRadii = void 0;
    this._oneOverRadiiSquared = void 0;
    this._minimumRadius = void 0;
    this._maximumRadius = void 0;
    this._centerToleranceSquared = void 0;
    this._squaredXOverSquaredZ = void 0;
    initialize(this, x, y, z);
  }
  /**
   * Gets the radii of the ellipsoid.
   * @type {Cartesian3}
   * @readonly
   */
  get radii() {
    return this._radii;
  }
  /**
   * Gets the squared radii of the ellipsoid.
   * @type {Cartesian3}
   * @readonly
   */
  get radiiSquared() {
    return this._radiiSquared;
  }
  /**
   * Gets the radii of the ellipsoid raise to the fourth power.
   * @type {Cartesian3}
   * @readonly
   */
  get radiiToTheFourth() {
    return this._radiiToTheFourth;
  }
  /**
   * Gets one over the radii of the ellipsoid.
   * @type {Cartesian3}
   * @readonly
   */
  get oneOverRadii() {
    return this._oneOverRadii;
  }
  /**
   * Gets one over the squared radii of the ellipsoid.
   * @type {Cartesian3}
   * @readonly
   */
  get oneOverRadiiSquared() {
    return this._oneOverRadiiSquared;
  }
  /**
   * Gets the minimum radius of the ellipsoid.
   * @type {number}
   * @readonly
   */
  get minimumRadius() {
    return this._minimumRadius;
  }
  /**
   * Gets the maximum radius of the ellipsoid.
   * @type {number}
   * @readonly
   */
  get maximumRadius() {
    return this._maximumRadius;
  }
  /**
   * Duplicates an Ellipsoid instance.
   *
   * @param {Ellipsoid} ellipsoid The ellipsoid to duplicate.
   * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
   *                    instance should be created.
   * @returns {Ellipsoid} The cloned Ellipsoid. (Returns undefined if ellipsoid is undefined)
   */
  static clone(ellipsoid, result) {
    if (!defined_default(ellipsoid)) {
      return void 0;
    }
    const radii = ellipsoid._radii;
    if (!defined_default(result)) {
      return new _Ellipsoid(radii.x, radii.y, radii.z);
    }
    Cartesian3_default.clone(radii, result._radii);
    Cartesian3_default.clone(ellipsoid._radiiSquared, result._radiiSquared);
    Cartesian3_default.clone(ellipsoid._radiiToTheFourth, result._radiiToTheFourth);
    Cartesian3_default.clone(ellipsoid._oneOverRadii, result._oneOverRadii);
    Cartesian3_default.clone(
      ellipsoid._oneOverRadiiSquared,
      result._oneOverRadiiSquared
    );
    result._minimumRadius = ellipsoid._minimumRadius;
    result._maximumRadius = ellipsoid._maximumRadius;
    result._centerToleranceSquared = ellipsoid._centerToleranceSquared;
    return result;
  }
  /**
   * Computes an Ellipsoid from a Cartesian specifying the radii in x, y, and z directions.
   *
   * @param {Cartesian3} [cartesian=Cartesian3.ZERO] The ellipsoid's radius in the x, y, and z directions.
   * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
   *                    instance should be created.
   * @returns {Ellipsoid} A new Ellipsoid instance.
   *
   * @exception {DeveloperError} All radii components must be greater than or equal to zero.
   *
   * @see Ellipsoid.WGS84
   * @see Ellipsoid.UNIT_SPHERE
   */
  static fromCartesian3(cartesian, result) {
    if (!defined_default(result)) {
      result = new _Ellipsoid();
    }
    if (!defined_default(cartesian)) {
      return result;
    }
    initialize(result, cartesian.x, cartesian.y, cartesian.z);
    return result;
  }
  /**
   * The default ellipsoid used when not otherwise specified.
   * @type {Ellipsoid}
   * @example
   * Cesium.Ellipsoid.default = Cesium.Ellipsoid.MOON;
   *
   * // Apollo 11 landing site
   * const position = Cesium.Cartesian3.fromRadians(
   *   0.67416,
   *   23.47315,
   * );
   */
  static get default() {
    return _Ellipsoid._default;
  }
  static set default(value) {
    Check_default.typeOf.object("value", value);
    _Ellipsoid._default = value;
    Cartesian3_default._ellipsoidRadiiSquared = value.radiiSquared;
    Cartographic_default._ellipsoidOneOverRadii = value.oneOverRadii;
    Cartographic_default._ellipsoidOneOverRadiiSquared = value.oneOverRadiiSquared;
    Cartographic_default._ellipsoidCenterToleranceSquared = value._centerToleranceSquared;
  }
  /**
   * Duplicates an Ellipsoid instance.
   *
   * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
   *                    instance should be created.
   * @returns {Ellipsoid} The cloned Ellipsoid.
   */
  clone(result) {
    return _Ellipsoid.clone(this, result);
  }
  /**
   * Stores the provided instance into the provided array.
   *
   * @param {Ellipsoid} value The value to pack.
   * @param {number[]} array The array to pack into.
   * @param {number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {number[]} The array that was packed into
   */
  static pack(value, array, startingIndex) {
    Check_default.typeOf.object("value", value);
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    Cartesian3_default.pack(value._radii, array, startingIndex);
    return array;
  }
  /**
   * Retrieves an instance from a packed array.
   *
   * @param {number[]} array The packed array.
   * @param {number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {Ellipsoid} [result] The object into which to store the result.
   * @returns {Ellipsoid} The modified result parameter or a new Ellipsoid instance if one was not provided.
   */
  static unpack(array, startingIndex, result) {
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    const radii = Cartesian3_default.unpack(array, startingIndex);
    return _Ellipsoid.fromCartesian3(radii, result);
  }
  /**
   * Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.
   *
   * @param {Cartographic} cartographic The cartographic position for which to to determine the geodetic normal.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
   */
  geodeticSurfaceNormalCartographic(cartographic, result) {
    Check_default.typeOf.object("cartographic", cartographic);
    const longitude = cartographic.longitude;
    const latitude = cartographic.latitude;
    const cosLatitude = Math.cos(latitude);
    const x = cosLatitude * Math.cos(longitude);
    const y = cosLatitude * Math.sin(longitude);
    const z = Math.sin(latitude);
    if (!defined_default(result)) {
      result = new Cartesian3_default();
    }
    result.x = x;
    result.y = y;
    result.z = z;
    return Cartesian3_default.normalize(result, result);
  }
  /**
   * Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.
   *
   * @param {Cartesian3} cartesian The Cartesian position for which to to determine the surface normal.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided, or undefined if a normal cannot be found.
   */
  geodeticSurfaceNormal(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    if (isNaN(cartesian.x) || isNaN(cartesian.y) || isNaN(cartesian.z)) {
      throw new DeveloperError_default("cartesian has a NaN component");
    }
    if (Cartesian3_default.equalsEpsilon(cartesian, Cartesian3_default.ZERO, Math_default.EPSILON14)) {
      return void 0;
    }
    if (!defined_default(result)) {
      result = new Cartesian3_default();
    }
    result = Cartesian3_default.multiplyComponents(
      cartesian,
      this._oneOverRadiiSquared,
      result
    );
    return Cartesian3_default.normalize(result, result);
  }
  /**
   * Converts the provided cartographic to Cartesian representation.
   *
   * @param {Cartographic} cartographic The cartographic position.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
   *
   * @example
   * //Create a Cartographic and determine it's Cartesian representation on a WGS84 ellipsoid.
   * const position = new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 5000);
   * const cartesianPosition = Cesium.Ellipsoid.WGS84.cartographicToCartesian(position);
   */
  cartographicToCartesian(cartographic, result) {
    const n = cartographicToCartesianNormal;
    const k = cartographicToCartesianK;
    this.geodeticSurfaceNormalCartographic(cartographic, n);
    Cartesian3_default.multiplyComponents(this._radiiSquared, n, k);
    const gamma = Math.sqrt(Cartesian3_default.dot(n, k));
    Cartesian3_default.divideByScalar(k, gamma, k);
    Cartesian3_default.multiplyByScalar(n, cartographic.height, n);
    if (!defined_default(result)) {
      result = new Cartesian3_default();
    }
    return Cartesian3_default.add(k, n, result);
  }
  /**
   * Converts the provided array of cartographics to an array of Cartesians.
   *
   * @param {Cartographic[]} cartographics An array of cartographic positions.
   * @param {Cartesian3[]} [result] The object onto which to store the result.
   * @returns {Cartesian3[]} The modified result parameter or a new Array instance if none was provided.
   *
   * @example
   * //Convert an array of Cartographics and determine their Cartesian representation on a WGS84 ellipsoid.
   * const positions = [new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 0),
   *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.321), Cesium.Math.toRadians(78.123), 100),
   *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.645), Cesium.Math.toRadians(78.456), 250)];
   * const cartesianPositions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(positions);
   */
  cartographicArrayToCartesianArray(cartographics, result) {
    Check_default.defined("cartographics", cartographics);
    const length = cartographics.length;
    if (!defined_default(result)) {
      result = new Array(length);
    } else {
      result.length = length;
    }
    for (let i = 0; i < length; i++) {
      result[i] = this.cartographicToCartesian(cartographics[i], result[i]);
    }
    return result;
  }
  /**
   * Converts the provided cartesian to cartographic representation.
   * The cartesian is undefined at the center of the ellipsoid.
   *
   * @param {Cartesian3} cartesian The Cartesian position to convert to cartographic representation.
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.
   *
   * @example
   * //Create a Cartesian and determine it's Cartographic representation on a WGS84 ellipsoid.
   * const position = new Cesium.Cartesian3(17832.12, 83234.52, 952313.73);
   * const cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
   */
  cartesianToCartographic(cartesian, result) {
    const p = this.scaleToGeodeticSurface(cartesian, cartesianToCartographicP2);
    if (!defined_default(p)) {
      return void 0;
    }
    const n = this.geodeticSurfaceNormal(p, cartesianToCartographicN2);
    const h = Cartesian3_default.subtract(cartesian, p, cartesianToCartographicH2);
    const longitude = Math.atan2(n.y, n.x);
    const latitude = Math.asin(n.z);
    const height = Math_default.sign(Cartesian3_default.dot(h, cartesian)) * Cartesian3_default.magnitude(h);
    if (!defined_default(result)) {
      return new Cartographic_default(longitude, latitude, height);
    }
    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
  }
  /**
   * Converts the provided array of cartesians to an array of cartographics.
   *
   * @param {Cartesian3[]} cartesians An array of Cartesian positions.
   * @param {Cartographic[]} [result] The object onto which to store the result.
   * @returns {Cartographic[]} The modified result parameter or a new Array instance if none was provided.
   *
   * @example
   * //Create an array of Cartesians and determine their Cartographic representation on a WGS84 ellipsoid.
   * const positions = [new Cesium.Cartesian3(17832.12, 83234.52, 952313.73),
   *                  new Cesium.Cartesian3(17832.13, 83234.53, 952313.73),
   *                  new Cesium.Cartesian3(17832.14, 83234.54, 952313.73)]
   * const cartographicPositions = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
   */
  cartesianArrayToCartographicArray(cartesians, result) {
    Check_default.defined("cartesians", cartesians);
    const length = cartesians.length;
    if (!defined_default(result)) {
      result = new Array(length);
    } else {
      result.length = length;
    }
    for (let i = 0; i < length; ++i) {
      result[i] = this.cartesianToCartographic(cartesians[i], result[i]);
    }
    return result;
  }
  /**
   * Scales the provided Cartesian position along the geodetic surface normal
   * so that it is on the surface of this ellipsoid.  If the position is
   * at the center of the ellipsoid, this function returns undefined.
   *
   * @param {Cartesian3} cartesian The Cartesian position to scale.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter, a new Cartesian3 instance if none was provided, or undefined if the position is at the center.
   */
  scaleToGeodeticSurface(cartesian, result) {
    return scaleToGeodeticSurface_default(
      cartesian,
      this._oneOverRadii,
      this._oneOverRadiiSquared,
      this._centerToleranceSquared,
      result
    );
  }
  /**
   * Scales the provided Cartesian position along the geocentric surface normal
   * so that it is on the surface of this ellipsoid.
   *
   * @param {Cartesian3} cartesian The Cartesian position to scale.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
   */
  scaleToGeocentricSurface(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    if (!defined_default(result)) {
      result = new Cartesian3_default();
    }
    const positionX = cartesian.x;
    const positionY = cartesian.y;
    const positionZ = cartesian.z;
    const oneOverRadiiSquared = this._oneOverRadiiSquared;
    const beta = 1 / Math.sqrt(
      positionX * positionX * oneOverRadiiSquared.x + positionY * positionY * oneOverRadiiSquared.y + positionZ * positionZ * oneOverRadiiSquared.z
    );
    return Cartesian3_default.multiplyByScalar(cartesian, beta, result);
  }
  /**
   * Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying
   * its components by the result of {@link Ellipsoid#oneOverRadii}.
   *
   * @param {Cartesian3} position The position to transform.
   * @param {Cartesian3} [result] The position to which to copy the result, or undefined to create and
   *        return a new instance.
   * @returns {Cartesian3} The position expressed in the scaled space.  The returned instance is the
   *          one passed as the result parameter if it is not undefined, or a new instance of it is.
   */
  transformPositionToScaledSpace(position, result) {
    if (!defined_default(result)) {
      result = new Cartesian3_default();
    }
    return Cartesian3_default.multiplyComponents(position, this._oneOverRadii, result);
  }
  /**
   * Transforms a Cartesian X, Y, Z position from the ellipsoid-scaled space by multiplying
   * its components by the result of {@link Ellipsoid#radii}.
   *
   * @param {Cartesian3} position The position to transform.
   * @param {Cartesian3} [result] The position to which to copy the result, or undefined to create and
   *        return a new instance.
   * @returns {Cartesian3} The position expressed in the unscaled space.  The returned instance is the
   *          one passed as the result parameter if it is not undefined, or a new instance of it is.
   */
  transformPositionFromScaledSpace(position, result) {
    if (!defined_default(result)) {
      result = new Cartesian3_default();
    }
    return Cartesian3_default.multiplyComponents(position, this._radii, result);
  }
  /**
   * Compares this Ellipsoid against the provided Ellipsoid componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Ellipsoid} [right] The other Ellipsoid.
   * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
   */
  equals(right) {
    return this === right || defined_default(right) && Cartesian3_default.equals(this._radii, right._radii);
  }
  /**
   * Creates a string representing this Ellipsoid in the format '(radii.x, radii.y, radii.z)'.
   *
   * @returns {string} A string representing this ellipsoid in the format '(radii.x, radii.y, radii.z)'.
   */
  toString() {
    return this._radii.toString();
  }
  /**
   * Computes a point which is the intersection of the surface normal with the z-axis.
   *
   * @param {Cartesian3} position the position. must be on the surface of the ellipsoid.
   * @param {number} [buffer = 0.0] A buffer to subtract from the ellipsoid size when checking if the point is inside the ellipsoid.
   *                                In earth case, with common earth datums, there is no need for this buffer since the intersection point is always (relatively) very close to the center.
   *                                In WGS84 datum, intersection point is at max z = +-42841.31151331382 (0.673% of z-axis).
   *                                Intersection point could be outside the ellipsoid if the ratio of MajorAxis / AxisOfRotation is bigger than the square root of 2
   * @param {Cartesian3} [result] The cartesian to which to copy the result, or undefined to create and
   *        return a new instance.
   * @returns {Cartesian3 | undefined} the intersection point if it's inside the ellipsoid, undefined otherwise
   *
   * @exception {DeveloperError} position is required.
   * @exception {DeveloperError} Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y).
   * @exception {DeveloperError} Ellipsoid.radii.z must be greater than 0.
   */
  getSurfaceNormalIntersectionWithZAxis(position, buffer, result) {
    Check_default.typeOf.object("position", position);
    if (!Math_default.equalsEpsilon(
      this._radii.x,
      this._radii.y,
      Math_default.EPSILON15
    )) {
      throw new DeveloperError_default(
        "Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)"
      );
    }
    Check_default.typeOf.number.greaterThan("Ellipsoid.radii.z", this._radii.z, 0);
    buffer = buffer ?? 0;
    const squaredXOverSquaredZ = this._squaredXOverSquaredZ;
    if (!defined_default(result)) {
      result = new Cartesian3_default();
    }
    result.x = 0;
    result.y = 0;
    result.z = position.z * (1 - squaredXOverSquaredZ);
    if (Math.abs(result.z) >= this._radii.z - buffer) {
      return void 0;
    }
    return result;
  }
  /**
   * Computes the ellipsoid curvatures at a given position on the surface.
   *
   * @param {Cartesian3} surfacePosition The position on the ellipsoid surface where curvatures will be calculated.
   * @param {Cartesian2} [result] The cartesian to which to copy the result, or undefined to create and return a new instance.
   * @returns {Cartesian2} The local curvature of the ellipsoid surface at the provided position, in east and north directions.
   *
   * @exception {DeveloperError} position is required.
   */
  getLocalCurvature(surfacePosition, result) {
    Check_default.typeOf.object("surfacePosition", surfacePosition);
    if (!defined_default(result)) {
      result = new Cartesian2_default();
    }
    const primeVerticalEndpoint = this.getSurfaceNormalIntersectionWithZAxis(
      surfacePosition,
      0,
      scratchEndpoint
    );
    const primeVerticalRadius = Cartesian3_default.distance(
      surfacePosition,
      primeVerticalEndpoint
    );
    const radiusRatio = this.minimumRadius * primeVerticalRadius / this.maximumRadius ** 2;
    const meridionalRadius = primeVerticalRadius * radiusRatio ** 2;
    return Cartesian2_default.fromElements(
      1 / primeVerticalRadius,
      1 / meridionalRadius,
      result
    );
  }
  /**
   * Computes an approximation of the surface area of a rectangle on the surface of an ellipsoid using
   * Gauss-Legendre 10th order quadrature.
   *
   * @param {Rectangle} rectangle The rectangle used for computing the surface area.
   * @returns {number} The approximate area of the rectangle on the surface of this ellipsoid.
   */
  surfaceArea(rectangle) {
    Check_default.typeOf.object("rectangle", rectangle);
    const minLongitude = rectangle.west;
    let maxLongitude = rectangle.east;
    const minLatitude = rectangle.south;
    const maxLatitude = rectangle.north;
    while (maxLongitude < minLongitude) {
      maxLongitude += Math_default.TWO_PI;
    }
    const radiiSquared = this._radiiSquared;
    const a22 = radiiSquared.x;
    const b2 = radiiSquared.y;
    const c2 = radiiSquared.z;
    const a2b2 = a22 * b2;
    return gaussLegendreQuadrature(minLatitude, maxLatitude, function(lat) {
      const sinPhi = Math.cos(lat);
      const cosPhi = Math.sin(lat);
      return Math.cos(lat) * gaussLegendreQuadrature(minLongitude, maxLongitude, function(lon) {
        const cosTheta = Math.cos(lon);
        const sinTheta = Math.sin(lon);
        return Math.sqrt(
          a2b2 * cosPhi * cosPhi + c2 * (b2 * cosTheta * cosTheta + a22 * sinTheta * sinTheta) * sinPhi * sinPhi
        );
      });
    });
  }
};
Ellipsoid.WGS84 = Object.freeze(
  new Ellipsoid(6378137, 6378137, 6356752314245179e-9)
);
Ellipsoid.UNIT_SPHERE = Object.freeze(new Ellipsoid(1, 1, 1));
Ellipsoid.MOON = Object.freeze(
  new Ellipsoid(
    Math_default.LUNAR_RADIUS,
    Math_default.LUNAR_RADIUS,
    Math_default.LUNAR_RADIUS
  )
);
Ellipsoid.MARS = Object.freeze(new Ellipsoid(3396190, 3396190, 3376200));
Ellipsoid._default = Ellipsoid.WGS84;
Ellipsoid.packedLength = Cartesian3_default.packedLength;
Ellipsoid.prototype.geocentricSurfaceNormal = Cartesian3_default.normalize;
var cartographicToCartesianNormal = new Cartesian3_default();
var cartographicToCartesianK = new Cartesian3_default();
var cartesianToCartographicN2 = new Cartesian3_default();
var cartesianToCartographicP2 = new Cartesian3_default();
var cartesianToCartographicH2 = new Cartesian3_default();
var scratchEndpoint = new Cartesian3_default();
var abscissas = [
  0.14887433898163,
  0.43339539412925,
  0.67940956829902,
  0.86506336668898,
  0.97390652851717,
  0
];
var weights = [
  0.29552422471475,
  0.26926671930999,
  0.21908636251598,
  0.14945134915058,
  0.066671344308684,
  0
];
function gaussLegendreQuadrature(a3, b, func) {
  Check_default.typeOf.number("a", a3);
  Check_default.typeOf.number("b", b);
  Check_default.typeOf.func("func", func);
  const xMean = 0.5 * (b + a3);
  const xRange = 0.5 * (b - a3);
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    const dx = xRange * abscissas[i];
    sum += weights[i] * (func(xMean + dx) + func(xMean - dx));
  }
  sum *= xRange;
  return sum;
}
var Ellipsoid_default = Ellipsoid;

// node_modules/@cesium/engine/Source/Core/GeographicProjection.js
var GeographicProjection = class {
  /**
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid.
   */
  constructor(ellipsoid) {
    this._ellipsoid = ellipsoid ?? Ellipsoid_default.default;
    this._semimajorAxis = this._ellipsoid.maximumRadius;
    this._oneOverSemimajorAxis = 1 / this._semimajorAxis;
  }
  /**
   * Gets the {@link Ellipsoid}.
   *
   * @type {Ellipsoid}
   * @readonly
   */
  get ellipsoid() {
    return this._ellipsoid;
  }
  /**
   * Projects a set of {@link Cartographic} coordinates, in radians, to map coordinates, in meters.
   * X and Y are the longitude and latitude, respectively, multiplied by the maximum radius of the
   * ellipsoid.  Z is the unmodified height.
   *
   * @param {Cartographic} cartographic The coordinates to project.
   * @param {Cartesian3} [result] An instance into which to copy the result.  If this parameter is
   *        undefined, a new instance is created and returned.
   * @returns {Cartesian3} The projected coordinates.  If the result parameter is not undefined, the
   *          coordinates are copied there and that instance is returned.  Otherwise, a new instance is
   *          created and returned.
   */
  project(cartographic, result) {
    const semimajorAxis = this._semimajorAxis;
    const x = cartographic.longitude * semimajorAxis;
    const y = cartographic.latitude * semimajorAxis;
    const z = cartographic.height;
    if (!defined_default(result)) {
      return new Cartesian3_default(x, y, z);
    }
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Unprojects a set of projected {@link Cartesian3} coordinates, in meters, to {@link Cartographic}
   * coordinates, in radians.  Longitude and Latitude are the X and Y coordinates, respectively,
   * divided by the maximum radius of the ellipsoid.  Height is the unmodified Z coordinate.
   *
   * @param {Cartesian3} cartesian The Cartesian position to unproject with height (z) in meters.
   * @param {Cartographic} [result] An instance into which to copy the result.  If this parameter is
   *        undefined, a new instance is created and returned.
   * @returns {Cartographic} The unprojected coordinates.  If the result parameter is not undefined, the
   *          coordinates are copied there and that instance is returned.  Otherwise, a new instance is
   *          created and returned.
   */
  unproject(cartesian, result) {
    if (!defined_default(cartesian)) {
      throw new DeveloperError_default("cartesian is required");
    }
    const oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
    const longitude = cartesian.x * oneOverEarthSemimajorAxis;
    const latitude = cartesian.y * oneOverEarthSemimajorAxis;
    const height = cartesian.z;
    if (!defined_default(result)) {
      return new Cartographic_default(longitude, latitude, height);
    }
    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
  }
};
var GeographicProjection_default = GeographicProjection;

// node_modules/@cesium/engine/Source/Core/Cartesian4.js
var Cartesian4 = class _Cartesian4 {
  /**
   * @param {number} [x=0.0] The X component.
   * @param {number} [y=0.0] The Y component.
   * @param {number} [z=0.0] The Z component.
   * @param {number} [w=0.0] The W component.
   */
  constructor(x, y, z, w) {
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.z = z ?? 0;
    this.w = w ?? 0;
  }
  /**
   * Creates a Cartesian4 instance from x, y, z and w coordinates.
   *
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} z The z coordinate.
   * @param {number} w The w coordinate.
   * @param {Cartesian4} [result] The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
   */
  static fromElements(x, y, z, w, result) {
    if (!defined_default(result)) {
      return new _Cartesian4(x, y, z, w);
    }
    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }
  /**
   * Creates a Cartesian4 instance from a {@link Color}. <code>red</code>, <code>green</code>, <code>blue</code>,
   * and <code>alpha</code> map to <code>x</code>, <code>y</code>, <code>z</code>, and <code>w</code>, respectively.
   *
   * @param {Color} color The source color.
   * @param {Cartesian4} [result] The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
   */
  static fromColor(color, result) {
    Check_default.typeOf.object("color", color);
    if (!defined_default(result)) {
      return new _Cartesian4(color.red, color.green, color.blue, color.alpha);
    }
    result.x = color.red;
    result.y = color.green;
    result.z = color.blue;
    result.w = color.alpha;
    return result;
  }
  /**
   * Duplicates a Cartesian4 instance.
   *
   * @param {Cartesian4} cartesian The Cartesian to duplicate.
   * @param {Cartesian4} [result] The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided. (Returns undefined if cartesian is undefined)
   */
  static clone(cartesian, result) {
    if (!defined_default(cartesian)) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Cartesian4(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
    }
    result.x = cartesian.x;
    result.y = cartesian.y;
    result.z = cartesian.z;
    result.w = cartesian.w;
    return result;
  }
  /**
   * Stores the provided instance into the provided array.
   *
   * @param {Cartesian4} value The value to pack.
   * @param {number[]} array The array to pack into.
   * @param {number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {number[]} The array that was packed into
   */
  static pack(value, array, startingIndex) {
    Check_default.typeOf.object("value", value);
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    array[startingIndex++] = value.x;
    array[startingIndex++] = value.y;
    array[startingIndex++] = value.z;
    array[startingIndex] = value.w;
    return array;
  }
  /**
   * Retrieves an instance from a packed array.
   *
   * @param {number[]} array The packed array.
   * @param {number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {Cartesian4} [result] The object into which to store the result.
   * @returns {Cartesian4}  The modified result parameter or a new Cartesian4 instance if one was not provided.
   */
  static unpack(array, startingIndex, result) {
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    if (!defined_default(result)) {
      result = new _Cartesian4();
    }
    result.x = array[startingIndex++];
    result.y = array[startingIndex++];
    result.z = array[startingIndex++];
    result.w = array[startingIndex];
    return result;
  }
  /**
   * Flattens an array of Cartesian4s into an array of components.
   *
   * @param {Cartesian4[]} array The array of cartesians to pack.
   * @param {number[]} [result] The array onto which to store the result. If this is a typed array, it must have array.length * 4 components, else a {@link DeveloperError} will be thrown. If it is a regular array, it will be resized to have (array.length * 4) elements.
   * @returns {number[]} The packed array.
   */
  static packArray(array, result) {
    Check_default.defined("array", array);
    const length = array.length;
    const resultLength = length * 4;
    if (!defined_default(result)) {
      result = new Array(resultLength);
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      throw new DeveloperError_default(
        "If result is a typed array, it must have exactly array.length * 4 elements"
      );
    } else if (result.length !== resultLength) {
      result.length = resultLength;
    }
    for (let i = 0; i < length; ++i) {
      _Cartesian4.pack(array[i], result, i * 4);
    }
    return result;
  }
  /**
   * Unpacks an array of cartesian components into an array of Cartesian4s.
   *
   * @param {number[]} array The array of components to unpack.
   * @param {Cartesian4[]} [result] The array onto which to store the result.
   * @returns {Cartesian4[]} The unpacked array.
   */
  static unpackArray(array, result) {
    Check_default.defined("array", array);
    Check_default.typeOf.number.greaterThanOrEquals("array.length", array.length, 4);
    if (array.length % 4 !== 0) {
      throw new DeveloperError_default("array length must be a multiple of 4.");
    }
    const length = array.length;
    if (!defined_default(result)) {
      result = new Array(length / 4);
    } else {
      result.length = length / 4;
    }
    for (let i = 0; i < length; i += 4) {
      const index = i / 4;
      result[index] = _Cartesian4.unpack(array, i, result[index]);
    }
    return result;
  }
  /**
   * Computes the value of the maximum component for the supplied Cartesian.
   *
   * @param {Cartesian4} cartesian The cartesian to use.
   * @returns {number} The value of the maximum component.
   */
  static maximumComponent(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return Math.max(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
  }
  /**
   * Computes the value of the minimum component for the supplied Cartesian.
   *
   * @param {Cartesian4} cartesian The cartesian to use.
   * @returns {number} The value of the minimum component.
   */
  static minimumComponent(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return Math.min(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
  }
  /**
   * Compares two Cartesians and computes a Cartesian which contains the minimum components of the supplied Cartesians.
   *
   * @param {Cartesian4} first A cartesian to compare.
   * @param {Cartesian4} second A cartesian to compare.
   * @param {Cartesian4} result The object into which to store the result.
   * @returns {Cartesian4} A cartesian with the minimum components.
   */
  static minimumByComponent(first, second, result) {
    Check_default.typeOf.object("first", first);
    Check_default.typeOf.object("second", second);
    Check_default.typeOf.object("result", result);
    result.x = Math.min(first.x, second.x);
    result.y = Math.min(first.y, second.y);
    result.z = Math.min(first.z, second.z);
    result.w = Math.min(first.w, second.w);
    return result;
  }
  /**
   * Compares two Cartesians and computes a Cartesian which contains the maximum components of the supplied Cartesians.
   *
   * @param {Cartesian4} first A cartesian to compare.
   * @param {Cartesian4} second A cartesian to compare.
   * @param {Cartesian4} result The object into which to store the result.
   * @returns {Cartesian4} A cartesian with the maximum components.
   */
  static maximumByComponent(first, second, result) {
    Check_default.typeOf.object("first", first);
    Check_default.typeOf.object("second", second);
    Check_default.typeOf.object("result", result);
    result.x = Math.max(first.x, second.x);
    result.y = Math.max(first.y, second.y);
    result.z = Math.max(first.z, second.z);
    result.w = Math.max(first.w, second.w);
    return result;
  }
  /**
   * Constrain a value to lie between two values.
   *
   * @param {Cartesian4} value The value to clamp.
   * @param {Cartesian4} min The minimum bound.
   * @param {Cartesian4} max The maximum bound.
   * @param {Cartesian4} result The object into which to store the result.
   * @returns {Cartesian4} The clamped value such that min <= result <= max.
   */
  static clamp(value, min, max, result) {
    Check_default.typeOf.object("value", value);
    Check_default.typeOf.object("min", min);
    Check_default.typeOf.object("max", max);
    Check_default.typeOf.object("result", result);
    const x = Math_default.clamp(value.x, min.x, max.x);
    const y = Math_default.clamp(value.y, min.y, max.y);
    const z = Math_default.clamp(value.z, min.z, max.z);
    const w = Math_default.clamp(value.w, min.w, max.w);
    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }
  /**
   * Computes the provided Cartesian's squared magnitude.
   *
   * @param {Cartesian4} cartesian The Cartesian instance whose squared magnitude is to be computed.
   * @returns {number} The squared magnitude.
   */
  static magnitudeSquared(cartesian) {
    Check_default.typeOf.object("cartesian", cartesian);
    return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z + cartesian.w * cartesian.w;
  }
  /**
   * Computes the Cartesian's magnitude (length).
   *
   * @param {Cartesian4} cartesian The Cartesian instance whose magnitude is to be computed.
   * @returns {number} The magnitude.
   */
  static magnitude(cartesian) {
    return Math.sqrt(_Cartesian4.magnitudeSquared(cartesian));
  }
  /**
   * Computes the 4-space distance between two points.
   *
   * @param {Cartesian4} left The first point to compute the distance from.
   * @param {Cartesian4} right The second point to compute the distance to.
   * @returns {number} The distance between two points.
   *
   * @example
   * // Returns 1.0
   * const d = Cesium.Cartesian4.distance(
   *   new Cesium.Cartesian4(1.0, 0.0, 0.0, 0.0),
   *   new Cesium.Cartesian4(2.0, 0.0, 0.0, 0.0));
   */
  static distance(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    _Cartesian4.subtract(left, right, distanceScratch3);
    return _Cartesian4.magnitude(distanceScratch3);
  }
  /**
   * Computes the squared distance between two points.  Comparing squared distances
   * using this function is more efficient than comparing distances using {@link Cartesian4#distance}.
   *
   * @param {Cartesian4} left The first point to compute the distance from.
   * @param {Cartesian4} right The second point to compute the distance to.
   * @returns {number} The distance between two points.
   *
   * @example
   * // Returns 4.0, not 2.0
   * const d = Cesium.Cartesian4.distance(
   *   new Cesium.Cartesian4(1.0, 0.0, 0.0, 0.0),
   *   new Cesium.Cartesian4(3.0, 0.0, 0.0, 0.0));
   */
  static distanceSquared(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    _Cartesian4.subtract(left, right, distanceScratch3);
    return _Cartesian4.magnitudeSquared(distanceScratch3);
  }
  /**
   * Computes the normalized form of the supplied Cartesian.
   *
   * @param {Cartesian4} cartesian The Cartesian to be normalized.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static normalize(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const magnitude = _Cartesian4.magnitude(cartesian);
    result.x = cartesian.x / magnitude;
    result.y = cartesian.y / magnitude;
    result.z = cartesian.z / magnitude;
    result.w = cartesian.w / magnitude;
    if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z) || isNaN(result.w)) {
      throw new DeveloperError_default("normalized result is not a number");
    }
    return result;
  }
  /**
   * Computes the dot (scalar) product of two Cartesians.
   *
   * @param {Cartesian4} left The first Cartesian.
   * @param {Cartesian4} right The second Cartesian.
   * @returns {number} The dot product.
   */
  static dot(left, right) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    return left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
  }
  /**
   * Computes the componentwise product of two Cartesians.
   *
   * @param {Cartesian4} left The first Cartesian.
   * @param {Cartesian4} right The second Cartesian.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static multiplyComponents(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x * right.x;
    result.y = left.y * right.y;
    result.z = left.z * right.z;
    result.w = left.w * right.w;
    return result;
  }
  /**
   * Computes the componentwise quotient of two Cartesians.
   *
   * @param {Cartesian4} left The first Cartesian.
   * @param {Cartesian4} right The second Cartesian.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static divideComponents(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x / right.x;
    result.y = left.y / right.y;
    result.z = left.z / right.z;
    result.w = left.w / right.w;
    return result;
  }
  /**
   * Computes the componentwise sum of two Cartesians.
   *
   * @param {Cartesian4} left The first Cartesian.
   * @param {Cartesian4} right The second Cartesian.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static add(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x + right.x;
    result.y = left.y + right.y;
    result.z = left.z + right.z;
    result.w = left.w + right.w;
    return result;
  }
  /**
   * Computes the componentwise difference of two Cartesians.
   *
   * @param {Cartesian4} left The first Cartesian.
   * @param {Cartesian4} right The second Cartesian.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static subtract(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result.x = left.x - right.x;
    result.y = left.y - right.y;
    result.z = left.z - right.z;
    result.w = left.w - right.w;
    return result;
  }
  /**
   * Multiplies the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian4} cartesian The Cartesian to be scaled.
   * @param {number} scalar The scalar to multiply with.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static multiplyByScalar(cartesian, scalar, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.number("scalar", scalar);
    Check_default.typeOf.object("result", result);
    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    result.z = cartesian.z * scalar;
    result.w = cartesian.w * scalar;
    return result;
  }
  /**
   * Divides the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian4} cartesian The Cartesian to be divided.
   * @param {number} scalar The scalar to divide by.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static divideByScalar(cartesian, scalar, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.number("scalar", scalar);
    Check_default.typeOf.object("result", result);
    result.x = cartesian.x / scalar;
    result.y = cartesian.y / scalar;
    result.z = cartesian.z / scalar;
    result.w = cartesian.w / scalar;
    return result;
  }
  /**
   * Negates the provided Cartesian.
   *
   * @param {Cartesian4} cartesian The Cartesian to be negated.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static negate(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result.x = -cartesian.x;
    result.y = -cartesian.y;
    result.z = -cartesian.z;
    result.w = -cartesian.w;
    return result;
  }
  /**
   * Computes the absolute value of the provided Cartesian.
   *
   * @param {Cartesian4} cartesian The Cartesian whose absolute value is to be computed.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static abs(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result.x = Math.abs(cartesian.x);
    result.y = Math.abs(cartesian.y);
    result.z = Math.abs(cartesian.z);
    result.w = Math.abs(cartesian.w);
    return result;
  }
  /**
   * Computes the linear interpolation or extrapolation at t using the provided cartesians.
   *
   * @param {Cartesian4} start The value corresponding to t at 0.0.
   * @param {Cartesian4}end The value corresponding to t at 1.0.
   * @param {number} t The point along t at which to interpolate.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static lerp(start, end, t, result) {
    Check_default.typeOf.object("start", start);
    Check_default.typeOf.object("end", end);
    Check_default.typeOf.number("t", t);
    Check_default.typeOf.object("result", result);
    _Cartesian4.multiplyByScalar(end, t, lerpScratch3);
    result = _Cartesian4.multiplyByScalar(start, 1 - t, result);
    return _Cartesian4.add(lerpScratch3, result, result);
  }
  /**
   * Returns the axis that is most orthogonal to the provided Cartesian.
   *
   * @param {Cartesian4} cartesian The Cartesian on which to find the most orthogonal axis.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The most orthogonal axis.
   */
  static mostOrthogonalAxis(cartesian, result) {
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const f = _Cartesian4.normalize(cartesian, mostOrthogonalAxisScratch3);
    _Cartesian4.abs(f, f);
    if (f.x <= f.y) {
      if (f.x <= f.z) {
        if (f.x <= f.w) {
          result = _Cartesian4.clone(_Cartesian4.UNIT_X, result);
        } else {
          result = _Cartesian4.clone(_Cartesian4.UNIT_W, result);
        }
      } else if (f.z <= f.w) {
        result = _Cartesian4.clone(_Cartesian4.UNIT_Z, result);
      } else {
        result = _Cartesian4.clone(_Cartesian4.UNIT_W, result);
      }
    } else if (f.y <= f.z) {
      if (f.y <= f.w) {
        result = _Cartesian4.clone(_Cartesian4.UNIT_Y, result);
      } else {
        result = _Cartesian4.clone(_Cartesian4.UNIT_W, result);
      }
    } else if (f.z <= f.w) {
      result = _Cartesian4.clone(_Cartesian4.UNIT_Z, result);
    } else {
      result = _Cartesian4.clone(_Cartesian4.UNIT_W, result);
    }
    return result;
  }
  /**
   * Compares the provided Cartesians componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cartesian4} [left] The first Cartesian.
   * @param {Cartesian4} [right] The second Cartesian.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && left.x === right.x && left.y === right.y && left.z === right.z && left.w === right.w;
  }
  /**
   * @param {Cartesian4} cartesian
   * @param {number[]} array
   * @param {number} offset
   * @ignore
   */
  static equalsArray(cartesian, array, offset) {
    return cartesian.x === array[offset] && cartesian.y === array[offset + 1] && cartesian.z === array[offset + 2] && cartesian.w === array[offset + 3];
  }
  /**
   * Compares the provided Cartesians componentwise and returns
   * <code>true</code> if they pass an absolute or relative tolerance test,
   * <code>false</code> otherwise.
   *
   * @param {Cartesian4} [left] The first Cartesian.
   * @param {Cartesian4} [right] The second Cartesian.
   * @param {number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
   * @param {number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
   * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   */
  static equalsEpsilon(left, right, relativeEpsilon, absoluteEpsilon) {
    return left === right || defined_default(left) && defined_default(right) && Math_default.equalsEpsilon(
      left.x,
      right.x,
      relativeEpsilon,
      absoluteEpsilon
    ) && Math_default.equalsEpsilon(
      left.y,
      right.y,
      relativeEpsilon,
      absoluteEpsilon
    ) && Math_default.equalsEpsilon(
      left.z,
      right.z,
      relativeEpsilon,
      absoluteEpsilon
    ) && Math_default.equalsEpsilon(
      left.w,
      right.w,
      relativeEpsilon,
      absoluteEpsilon
    );
  }
  /**
   * Duplicates this Cartesian4 instance.
   *
   * @param {Cartesian4} [result] The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
   */
  clone(result) {
    return _Cartesian4.clone(this, result);
  }
  /**
   * Compares this Cartesian against the provided Cartesian componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cartesian4} [right] The right hand side Cartesian.
   * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
   */
  equals(right) {
    return _Cartesian4.equals(this, right);
  }
  /**
   * Compares this Cartesian against the provided Cartesian componentwise and returns
   * <code>true</code> if they pass an absolute or relative tolerance test,
   * <code>false</code> otherwise.
   *
   * @param {Cartesian4} [right] The right hand side Cartesian.
   * @param {number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
   * @param {number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
   * @returns {boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
   */
  equalsEpsilon(right, relativeEpsilon, absoluteEpsilon) {
    return _Cartesian4.equalsEpsilon(
      this,
      right,
      relativeEpsilon,
      absoluteEpsilon
    );
  }
  /**
   * Creates a string representing this Cartesian in the format '(x, y, z, w)'.
   *
   * @returns {string} A string representing the provided Cartesian in the format '(x, y, z, w)'.
   */
  toString() {
    return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }
  /**
   * Packs an arbitrary floating point value to 4 values representable using uint8.
   *
   * @param {number} value A floating point number.
   * @param {Cartesian4} [result] The Cartesian4 that will contain the packed float.
   * @returns {Cartesian4} A Cartesian4 representing the float packed to values in x, y, z, and w.
   */
  static packFloat(value, result) {
    Check_default.typeOf.number("value", value);
    if (!defined_default(result)) {
      result = new _Cartesian4();
    }
    scratchF32Array[0] = value;
    if (littleEndian) {
      result.x = scratchU8Array[0];
      result.y = scratchU8Array[1];
      result.z = scratchU8Array[2];
      result.w = scratchU8Array[3];
    } else {
      result.x = scratchU8Array[3];
      result.y = scratchU8Array[2];
      result.z = scratchU8Array[1];
      result.w = scratchU8Array[0];
    }
    return result;
  }
  /**
   * Unpacks a float packed using Cartesian4.packFloat.
   *
   * @param {Cartesian4} packedFloat A Cartesian4 containing a float packed to 4 values representable using uint8.
   * @returns {number} The unpacked float.
   * @private
   */
  static unpackFloat(packedFloat) {
    Check_default.typeOf.object("packedFloat", packedFloat);
    if (littleEndian) {
      scratchU8Array[0] = packedFloat.x;
      scratchU8Array[1] = packedFloat.y;
      scratchU8Array[2] = packedFloat.z;
      scratchU8Array[3] = packedFloat.w;
    } else {
      scratchU8Array[0] = packedFloat.w;
      scratchU8Array[1] = packedFloat.z;
      scratchU8Array[2] = packedFloat.y;
      scratchU8Array[3] = packedFloat.x;
    }
    return scratchF32Array[0];
  }
};
Cartesian4.packedLength = 4;
Cartesian4.fromArray = Cartesian4.unpack;
var distanceScratch3 = new Cartesian4();
var lerpScratch3 = new Cartesian4();
var mostOrthogonalAxisScratch3 = new Cartesian4();
Cartesian4.ZERO = Object.freeze(new Cartesian4(0, 0, 0, 0));
Cartesian4.ONE = Object.freeze(new Cartesian4(1, 1, 1, 1));
Cartesian4.UNIT_X = Object.freeze(new Cartesian4(1, 0, 0, 0));
Cartesian4.UNIT_Y = Object.freeze(new Cartesian4(0, 1, 0, 0));
Cartesian4.UNIT_Z = Object.freeze(new Cartesian4(0, 0, 1, 0));
Cartesian4.UNIT_W = Object.freeze(new Cartesian4(0, 0, 0, 1));
var scratchF32Array = new Float32Array(1);
var scratchU8Array = new Uint8Array(scratchF32Array.buffer);
var testU32 = new Uint32Array([287454020]);
var testU8 = new Uint8Array(testU32.buffer);
var littleEndian = testU8[0] === 68;
var Cartesian4_default = Cartesian4;

// node_modules/@cesium/engine/Source/Core/binarySearch.js
function binarySearch(array, itemToFind, comparator) {
  Check_default.defined("array", array);
  Check_default.defined("itemToFind", itemToFind);
  Check_default.defined("comparator", comparator);
  let low = 0;
  let high = array.length - 1;
  let i;
  let comparison;
  while (low <= high) {
    i = ~~((low + high) / 2);
    comparison = comparator(array[i], itemToFind);
    if (comparison < 0) {
      low = i + 1;
      continue;
    }
    if (comparison > 0) {
      high = i - 1;
      continue;
    }
    return i;
  }
  return ~(high + 1);
}
var binarySearch_default = binarySearch;

// node_modules/@cesium/engine/Source/Core/EarthOrientationParametersSample.js
function EarthOrientationParametersSample(xPoleWander, yPoleWander, xPoleOffset, yPoleOffset, ut1MinusUtc) {
  this.xPoleWander = xPoleWander;
  this.yPoleWander = yPoleWander;
  this.xPoleOffset = xPoleOffset;
  this.yPoleOffset = yPoleOffset;
  this.ut1MinusUtc = ut1MinusUtc;
}
var EarthOrientationParametersSample_default = EarthOrientationParametersSample;

// node_modules/@cesium/engine/Source/Core/isLeapYear.js
function isLeapYear(year) {
  if (year === null || isNaN(year)) {
    throw new DeveloperError_default("year is required and must be a number.");
  }
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
var isLeapYear_default = isLeapYear;

// node_modules/@cesium/engine/Source/Core/GregorianDate.js
var daysInYear = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function GregorianDate(year, month, day, hour, minute, second, millisecond, isLeapSecond) {
  const minimumYear = 1;
  const minimumMonth = 1;
  const minimumDay = 1;
  const minimumHour = 0;
  const minimumMinute = 0;
  const minimumSecond = 0;
  const minimumMillisecond = 0;
  year = year ?? minimumYear;
  month = month ?? minimumMonth;
  day = day ?? minimumDay;
  hour = hour ?? minimumHour;
  minute = minute ?? minimumMinute;
  second = second ?? minimumSecond;
  millisecond = millisecond ?? minimumMillisecond;
  isLeapSecond = isLeapSecond ?? false;
  validateRange();
  validateDate();
  this.year = year;
  this.month = month;
  this.day = day;
  this.hour = hour;
  this.minute = minute;
  this.second = second;
  this.millisecond = millisecond;
  this.isLeapSecond = isLeapSecond;
  function validateRange() {
    const maximumYear = 9999;
    const maximumMonth = 12;
    const maximumDay = 31;
    const maximumHour = 23;
    const maximumMinute = 59;
    const maximumSecond = 59;
    const excludedMaximumMilisecond = 1e3;
    Check_default.typeOf.number.greaterThanOrEquals("Year", year, minimumYear);
    Check_default.typeOf.number.lessThanOrEquals("Year", year, maximumYear);
    Check_default.typeOf.number.greaterThanOrEquals("Month", month, minimumMonth);
    Check_default.typeOf.number.lessThanOrEquals("Month", month, maximumMonth);
    Check_default.typeOf.number.greaterThanOrEquals("Day", day, minimumDay);
    Check_default.typeOf.number.lessThanOrEquals("Day", day, maximumDay);
    Check_default.typeOf.number.greaterThanOrEquals("Hour", hour, minimumHour);
    Check_default.typeOf.number.lessThanOrEquals("Hour", hour, maximumHour);
    Check_default.typeOf.number.greaterThanOrEquals("Minute", minute, minimumMinute);
    Check_default.typeOf.number.lessThanOrEquals("Minute", minute, maximumMinute);
    Check_default.typeOf.bool("IsLeapSecond", isLeapSecond);
    Check_default.typeOf.number.greaterThanOrEquals("Second", second, minimumSecond);
    Check_default.typeOf.number.lessThanOrEquals(
      "Second",
      second,
      isLeapSecond ? maximumSecond + 1 : maximumSecond
    );
    Check_default.typeOf.number.greaterThanOrEquals(
      "Millisecond",
      millisecond,
      minimumMillisecond
    );
    Check_default.typeOf.number.lessThan(
      "Millisecond",
      millisecond,
      excludedMaximumMilisecond
    );
  }
  function validateDate() {
    const daysInMonth2 = month === 2 && isLeapYear_default(year) ? daysInYear[month - 1] + 1 : daysInYear[month - 1];
    if (day > daysInMonth2) {
      throw new DeveloperError_default("Month and Day represents invalid date");
    }
  }
}
var GregorianDate_default = GregorianDate;

// node_modules/@cesium/engine/Source/Core/LeapSecond.js
function LeapSecond(date, offset) {
  this.julianDate = date;
  this.offset = offset;
}
var LeapSecond_default = LeapSecond;

// node_modules/@cesium/engine/Source/Core/TimeConstants.js
var TimeConstants = {
  /**
   * The number of seconds in one millisecond: <code>0.001</code>
   * @type {number}
   * @constant
   */
  SECONDS_PER_MILLISECOND: 1e-3,
  /**
   * The number of seconds in one minute: <code>60</code>.
   * @type {number}
   * @constant
   */
  SECONDS_PER_MINUTE: 60,
  /**
   * The number of minutes in one hour: <code>60</code>.
   * @type {number}
   * @constant
   */
  MINUTES_PER_HOUR: 60,
  /**
   * The number of hours in one day: <code>24</code>.
   * @type {number}
   * @constant
   */
  HOURS_PER_DAY: 24,
  /**
   * The number of seconds in one hour: <code>3600</code>.
   * @type {number}
   * @constant
   */
  SECONDS_PER_HOUR: 3600,
  /**
   * The number of minutes in one day: <code>1440</code>.
   * @type {number}
   * @constant
   */
  MINUTES_PER_DAY: 1440,
  /**
   * The number of seconds in one day, ignoring leap seconds: <code>86400</code>.
   * @type {number}
   * @constant
   */
  SECONDS_PER_DAY: 86400,
  /**
   * The number of days in one Julian century: <code>36525</code>.
   * @type {number}
   * @constant
   */
  DAYS_PER_JULIAN_CENTURY: 36525,
  /**
   * One trillionth of a second.
   * @type {number}
   * @constant
   */
  PICOSECOND: 1e-9,
  /**
   * The number of days to subtract from a Julian date to determine the
   * modified Julian date, which gives the number of days since midnight
   * on November 17, 1858.
   * @type {number}
   * @constant
   */
  MODIFIED_JULIAN_DATE_DIFFERENCE: 24000005e-1
};
Object.freeze(TimeConstants);
var TimeConstants_default = TimeConstants;

// node_modules/@cesium/engine/Source/Core/TimeStandard.js
var TimeStandard = {
  /**
   * Represents the coordinated Universal Time (UTC) time standard.
   *
   * UTC is related to TAI according to the relationship
   * <code>UTC = TAI - deltaT</code> where <code>deltaT</code> is the number of leap
   * seconds which have been introduced as of the time in TAI.
   *
   * @type {number}
   * @constant
   */
  UTC: 0,
  /**
   * Represents the International Atomic Time (TAI) time standard.
   * TAI is the principal time standard to which the other time standards are related.
   *
   * @type {number}
   * @constant
   */
  TAI: 1
};
Object.freeze(TimeStandard);
var TimeStandard_default = TimeStandard;

// node_modules/@cesium/engine/Source/Core/JulianDate.js
var gregorianDateScratch = new GregorianDate_default();
var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var daysInLeapFebruary = 29;
function compareLeapSecondDates(leapSecond, dateToFind) {
  return JulianDate.compare(leapSecond.julianDate, dateToFind.julianDate);
}
var binarySearchScratchLeapSecond = new LeapSecond_default();
function convertUtcToTai(julianDate) {
  binarySearchScratchLeapSecond.julianDate = julianDate;
  const leapSeconds = JulianDate.leapSeconds;
  let index = binarySearch_default(
    leapSeconds,
    binarySearchScratchLeapSecond,
    compareLeapSecondDates
  );
  if (index < 0) {
    index = ~index;
  }
  if (index >= leapSeconds.length) {
    index = leapSeconds.length - 1;
  }
  let offset = leapSeconds[index].offset;
  if (index > 0) {
    const difference = JulianDate.secondsDifference(
      leapSeconds[index].julianDate,
      julianDate
    );
    if (difference > offset) {
      index--;
      offset = leapSeconds[index].offset;
    }
  }
  JulianDate.addSeconds(julianDate, offset, julianDate);
}
function convertTaiToUtc(julianDate, result) {
  binarySearchScratchLeapSecond.julianDate = julianDate;
  const leapSeconds = JulianDate.leapSeconds;
  let index = binarySearch_default(
    leapSeconds,
    binarySearchScratchLeapSecond,
    compareLeapSecondDates
  );
  if (index < 0) {
    index = ~index;
  }
  if (index === 0) {
    return JulianDate.addSeconds(julianDate, -leapSeconds[0].offset, result);
  }
  if (index >= leapSeconds.length) {
    return JulianDate.addSeconds(
      julianDate,
      -leapSeconds[index - 1].offset,
      result
    );
  }
  const difference = JulianDate.secondsDifference(
    leapSeconds[index].julianDate,
    julianDate
  );
  if (difference === 0) {
    return JulianDate.addSeconds(
      julianDate,
      -leapSeconds[index].offset,
      result
    );
  }
  if (difference <= 1) {
    return void 0;
  }
  return JulianDate.addSeconds(
    julianDate,
    -leapSeconds[--index].offset,
    result
  );
}
function setComponents(wholeDays, secondsOfDay, julianDate) {
  const extraDays = secondsOfDay / TimeConstants_default.SECONDS_PER_DAY | 0;
  wholeDays += extraDays;
  secondsOfDay -= TimeConstants_default.SECONDS_PER_DAY * extraDays;
  if (secondsOfDay < 0) {
    wholeDays--;
    secondsOfDay += TimeConstants_default.SECONDS_PER_DAY;
  }
  julianDate.dayNumber = wholeDays;
  julianDate.secondsOfDay = secondsOfDay;
  return julianDate;
}
function computeJulianDateComponents(year, month, day, hour, minute, second, millisecond) {
  const a3 = (month - 14) / 12 | 0;
  const b = year + 4800 + a3;
  let dayNumber = (1461 * b / 4 | 0) + (367 * (month - 2 - 12 * a3) / 12 | 0) - (3 * ((b + 100) / 100 | 0) / 4 | 0) + day - 32075;
  hour = hour - 12;
  if (hour < 0) {
    hour += 24;
  }
  const secondsOfDay = second + (hour * TimeConstants_default.SECONDS_PER_HOUR + minute * TimeConstants_default.SECONDS_PER_MINUTE + millisecond * TimeConstants_default.SECONDS_PER_MILLISECOND);
  if (secondsOfDay >= 43200) {
    dayNumber -= 1;
  }
  return [dayNumber, secondsOfDay];
}
var matchCalendarYear = /^(\d{4})$/;
var matchCalendarMonth = /^(\d{4})-(\d{2})$/;
var matchOrdinalDate = /^(\d{4})-?(\d{3})$/;
var matchWeekDate = /^(\d{4})-?W(\d{2})-?(\d{1})?$/;
var matchCalendarDate = /^(\d{4})-?(\d{2})-?(\d{2})$/;
var utcOffset = /([Z+\-])?(\d{2})?:?(\d{2})?$/;
var matchHours = /^(\d{2})(\.\d+)?/.source + utcOffset.source;
var matchHoursMinutes = /^(\d{2}):?(\d{2})(\.\d+)?/.source + utcOffset.source;
var matchHoursMinutesSeconds = /^(\d{2}):?(\d{2}):?(\d{2})(\.\d+)?/.source + utcOffset.source;
var iso8601ErrorMessage = "Invalid ISO 8601 date.";
var JulianDate = class _JulianDate {
  /**
   * @param {number} [julianDayNumber=0.0] The Julian Day Number representing the number of whole days.  Fractional days will also be handled correctly.
   * @param {number} [secondsOfDay=0.0] The number of seconds into the current Julian Day Number.  Fractional seconds, negative seconds and seconds greater than a day will be handled correctly.
   * @param {TimeStandard} [timeStandard=TimeStandard.UTC] The time standard in which the first two parameters are defined.
   */
  constructor(julianDayNumber, secondsOfDay, timeStandard) {
    this.dayNumber = void 0;
    this.secondsOfDay = void 0;
    julianDayNumber = julianDayNumber ?? 0;
    secondsOfDay = secondsOfDay ?? 0;
    timeStandard = timeStandard ?? TimeStandard_default.UTC;
    const wholeDays = julianDayNumber | 0;
    secondsOfDay = secondsOfDay + (julianDayNumber - wholeDays) * TimeConstants_default.SECONDS_PER_DAY;
    setComponents(wholeDays, secondsOfDay, this);
    if (timeStandard === TimeStandard_default.UTC) {
      convertUtcToTai(this);
    }
  }
  /**
   * Creates a new instance from a GregorianDate.
   *
   * @param {GregorianDate} date A GregorianDate.
   * @param {JulianDate} [result] An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter or a new instance if none was provided.
   *
   * @exception {DeveloperError} date must be a valid GregorianDate.
   */
  static fromGregorianDate(date, result) {
    if (!(date instanceof GregorianDate_default)) {
      throw new DeveloperError_default("date must be a valid GregorianDate.");
    }
    const components = computeJulianDateComponents(
      date.year,
      date.month,
      date.day,
      date.hour,
      date.minute,
      date.second,
      date.millisecond
    );
    if (!defined_default(result)) {
      return new _JulianDate(components[0], components[1], TimeStandard_default.UTC);
    }
    setComponents(components[0], components[1], result);
    convertUtcToTai(result);
    return result;
  }
  /**
   * Creates a new instance from a JavaScript Date.
   *
   * @param {Date} date A JavaScript Date.
   * @param {JulianDate} [result] An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter or a new instance if none was provided.
   *
   * @exception {DeveloperError} date must be a valid JavaScript Date.
   */
  static fromDate(date, result) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new DeveloperError_default("date must be a valid JavaScript Date.");
    }
    const components = computeJulianDateComponents(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    );
    if (!defined_default(result)) {
      return new _JulianDate(components[0], components[1], TimeStandard_default.UTC);
    }
    setComponents(components[0], components[1], result);
    convertUtcToTai(result);
    return result;
  }
  /**
   * Creates a new instance from a from an {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} date.
   * This method is superior to <code>Date.parse</code> because it will handle all valid formats defined by the ISO 8601
   * specification, including leap seconds and sub-millisecond times, which discarded by most JavaScript implementations.
   *
   * @param {string} iso8601String An ISO 8601 date.
   * @param {JulianDate} [result] An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter or a new instance if none was provided.
   *
   * @exception {DeveloperError} Invalid ISO 8601 date.
   */
  static fromIso8601(iso8601String, result) {
    if (typeof iso8601String !== "string") {
      throw new DeveloperError_default(iso8601ErrorMessage);
    }
    iso8601String = iso8601String.replace(",", ".");
    let tokens = iso8601String.split("T");
    let year;
    let month = 1;
    let day = 1;
    let hour = 0;
    let minute = 0;
    let second = 0;
    let millisecond = 0;
    const date = tokens[0];
    const time = tokens[1];
    let tmp;
    let inLeapYear;
    if (!defined_default(date)) {
      throw new DeveloperError_default(iso8601ErrorMessage);
    }
    let dashCount;
    tokens = date.match(matchCalendarDate);
    if (tokens !== null) {
      dashCount = date.split("-").length - 1;
      if (dashCount > 0 && dashCount !== 2) {
        throw new DeveloperError_default(iso8601ErrorMessage);
      }
      year = +tokens[1];
      month = +tokens[2];
      day = +tokens[3];
    } else {
      tokens = date.match(matchCalendarMonth);
      if (tokens !== null) {
        year = +tokens[1];
        month = +tokens[2];
      } else {
        tokens = date.match(matchCalendarYear);
        if (tokens !== null) {
          year = +tokens[1];
        } else {
          let dayOfYear;
          tokens = date.match(matchOrdinalDate);
          if (tokens !== null) {
            year = +tokens[1];
            dayOfYear = +tokens[2];
            inLeapYear = isLeapYear_default(year);
            if (dayOfYear < 1 || inLeapYear && dayOfYear > 366 || !inLeapYear && dayOfYear > 365) {
              throw new DeveloperError_default(iso8601ErrorMessage);
            }
          } else {
            tokens = date.match(matchWeekDate);
            if (tokens !== null) {
              year = +tokens[1];
              const weekNumber = +tokens[2];
              const dayOfWeek = +tokens[3] || 0;
              dashCount = date.split("-").length - 1;
              if (dashCount > 0 && (!defined_default(tokens[3]) && dashCount !== 1 || defined_default(tokens[3]) && dashCount !== 2)) {
                throw new DeveloperError_default(iso8601ErrorMessage);
              }
              const january4 = new Date(Date.UTC(year, 0, 4));
              dayOfYear = weekNumber * 7 + dayOfWeek - january4.getUTCDay() - 3;
            } else {
              throw new DeveloperError_default(iso8601ErrorMessage);
            }
          }
          tmp = new Date(Date.UTC(year, 0, 1));
          tmp.setUTCDate(dayOfYear);
          month = tmp.getUTCMonth() + 1;
          day = tmp.getUTCDate();
        }
      }
    }
    inLeapYear = isLeapYear_default(year);
    if (month < 1 || month > 12 || day < 1 || (month !== 2 || !inLeapYear) && day > daysInMonth[month - 1] || inLeapYear && month === 2 && day > daysInLeapFebruary) {
      throw new DeveloperError_default(iso8601ErrorMessage);
    }
    let offsetIndex;
    if (defined_default(time)) {
      tokens = time.match(matchHoursMinutesSeconds);
      if (tokens !== null) {
        dashCount = time.split(":").length - 1;
        if (dashCount > 0 && dashCount !== 2 && dashCount !== 3) {
          throw new DeveloperError_default(iso8601ErrorMessage);
        }
        hour = +tokens[1];
        minute = +tokens[2];
        second = +tokens[3];
        millisecond = +(tokens[4] || 0) * 1e3;
        offsetIndex = 5;
      } else {
        tokens = time.match(matchHoursMinutes);
        if (tokens !== null) {
          dashCount = time.split(":").length - 1;
          if (dashCount > 2) {
            throw new DeveloperError_default(iso8601ErrorMessage);
          }
          hour = +tokens[1];
          minute = +tokens[2];
          second = +(tokens[3] || 0) * 60;
          offsetIndex = 4;
        } else {
          tokens = time.match(matchHours);
          if (tokens !== null) {
            hour = +tokens[1];
            minute = +(tokens[2] || 0) * 60;
            offsetIndex = 3;
          } else {
            throw new DeveloperError_default(iso8601ErrorMessage);
          }
        }
      }
      if (minute >= 60 || second >= 61 || hour > 24 || hour === 24 && (minute > 0 || second > 0 || millisecond > 0)) {
        throw new DeveloperError_default(iso8601ErrorMessage);
      }
      const offset = tokens[offsetIndex];
      const offsetHours = +tokens[offsetIndex + 1];
      const offsetMinutes = +(tokens[offsetIndex + 2] || 0);
      switch (offset) {
        case "+":
          hour = hour - offsetHours;
          minute = minute - offsetMinutes;
          break;
        case "-":
          hour = hour + offsetHours;
          minute = minute + offsetMinutes;
          break;
        case "Z":
          break;
        default:
          minute = minute + new Date(
            Date.UTC(year, month - 1, day, hour, minute)
          ).getTimezoneOffset();
          break;
      }
    }
    const isLeapSecond = second === 60;
    if (isLeapSecond) {
      second--;
    }
    while (minute >= 60) {
      minute -= 60;
      hour++;
    }
    while (hour >= 24) {
      hour -= 24;
      day++;
    }
    tmp = inLeapYear && month === 2 ? daysInLeapFebruary : daysInMonth[month - 1];
    while (day > tmp) {
      day -= tmp;
      month++;
      if (month > 12) {
        month -= 12;
        year++;
      }
      tmp = inLeapYear && month === 2 ? daysInLeapFebruary : daysInMonth[month - 1];
    }
    while (minute < 0) {
      minute += 60;
      hour--;
    }
    while (hour < 0) {
      hour += 24;
      day--;
    }
    while (day < 1) {
      month--;
      if (month < 1) {
        month += 12;
        year--;
      }
      tmp = inLeapYear && month === 2 ? daysInLeapFebruary : daysInMonth[month - 1];
      day += tmp;
    }
    const components = computeJulianDateComponents(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond
    );
    if (!defined_default(result)) {
      result = new _JulianDate(components[0], components[1], TimeStandard_default.UTC);
    } else {
      setComponents(components[0], components[1], result);
      convertUtcToTai(result);
    }
    if (isLeapSecond) {
      _JulianDate.addSeconds(result, 1, result);
    }
    return result;
  }
  /**
   * Creates a new instance that represents the current system time.
   * This is equivalent to calling <code>JulianDate.fromDate(new Date());</code>.
   *
   * @param {JulianDate} [result] An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter or a new instance if none was provided.
   */
  static now(result) {
    return _JulianDate.fromDate(/* @__PURE__ */ new Date(), result);
  }
  /**
   * Creates a {@link GregorianDate} from the provided instance.
   *
   * @param {JulianDate} julianDate The date to be converted.
   * @param {GregorianDate} [result] An existing instance to use for the result.
   * @returns {GregorianDate} The modified result parameter or a new instance if none was provided.
   */
  static toGregorianDate(julianDate, result) {
    if (!defined_default(julianDate)) {
      throw new DeveloperError_default("julianDate is required.");
    }
    let isLeapSecond = false;
    let thisUtc = convertTaiToUtc(julianDate, toGregorianDateScratch);
    if (!defined_default(thisUtc)) {
      _JulianDate.addSeconds(julianDate, -1, toGregorianDateScratch);
      thisUtc = convertTaiToUtc(toGregorianDateScratch, toGregorianDateScratch);
      isLeapSecond = true;
    }
    let julianDayNumber = thisUtc.dayNumber;
    const secondsOfDay = thisUtc.secondsOfDay;
    if (secondsOfDay >= 43200) {
      julianDayNumber += 1;
    }
    let L = julianDayNumber + 68569 | 0;
    const N = 4 * L / 146097 | 0;
    L = L - ((146097 * N + 3) / 4 | 0) | 0;
    const I = 4e3 * (L + 1) / 1461001 | 0;
    L = L - (1461 * I / 4 | 0) + 31 | 0;
    const J = 80 * L / 2447 | 0;
    const day = L - (2447 * J / 80 | 0) | 0;
    L = J / 11 | 0;
    const month = J + 2 - 12 * L | 0;
    const year = 100 * (N - 49) + I + L | 0;
    let hour = secondsOfDay / TimeConstants_default.SECONDS_PER_HOUR | 0;
    let remainingSeconds = secondsOfDay - hour * TimeConstants_default.SECONDS_PER_HOUR;
    const minute = remainingSeconds / TimeConstants_default.SECONDS_PER_MINUTE | 0;
    remainingSeconds = remainingSeconds - minute * TimeConstants_default.SECONDS_PER_MINUTE;
    let second = remainingSeconds | 0;
    const millisecond = (remainingSeconds - second) / TimeConstants_default.SECONDS_PER_MILLISECOND;
    hour += 12;
    if (hour > 23) {
      hour -= 24;
    }
    if (isLeapSecond) {
      second += 1;
    }
    if (!defined_default(result)) {
      return new GregorianDate_default(
        year,
        month,
        day,
        hour,
        minute,
        second,
        millisecond,
        isLeapSecond
      );
    }
    result.year = year;
    result.month = month;
    result.day = day;
    result.hour = hour;
    result.minute = minute;
    result.second = second;
    result.millisecond = millisecond;
    result.isLeapSecond = isLeapSecond;
    return result;
  }
  /**
   * Creates a JavaScript Date from the provided instance.
   * Since JavaScript dates are only accurate to the nearest millisecond and
   * cannot represent a leap second, consider using {@link JulianDate.toGregorianDate} instead.
   * If the provided JulianDate is during a leap second, the previous second is used.
   *
   * @param {JulianDate} julianDate The date to be converted.
   * @returns {Date} A new instance representing the provided date.
   */
  static toDate(julianDate) {
    if (!defined_default(julianDate)) {
      throw new DeveloperError_default("julianDate is required.");
    }
    const gDate = _JulianDate.toGregorianDate(julianDate, gregorianDateScratch);
    let second = gDate.second;
    if (gDate.isLeapSecond) {
      second -= 1;
    }
    return new Date(
      Date.UTC(
        gDate.year,
        gDate.month - 1,
        gDate.day,
        gDate.hour,
        gDate.minute,
        second,
        gDate.millisecond
      )
    );
  }
  /**
   * Creates an ISO8601 representation of the provided date.
   *
   * @param {JulianDate} julianDate The date to be converted.
   * @param {number} [precision] The number of fractional digits used to represent the seconds component.  By default, the most precise representation is used.
   * @returns {string} The ISO8601 representation of the provided date.
   */
  static toIso8601(julianDate, precision) {
    if (!defined_default(julianDate)) {
      throw new DeveloperError_default("julianDate is required.");
    }
    const gDate = _JulianDate.toGregorianDate(julianDate, gregorianDateScratch);
    let year = gDate.year;
    let month = gDate.month;
    let day = gDate.day;
    let hour = gDate.hour;
    const minute = gDate.minute;
    const second = gDate.second;
    const millisecond = gDate.millisecond;
    if (year === 1e4 && month === 1 && day === 1 && hour === 0 && minute === 0 && second === 0 && millisecond === 0) {
      year = 9999;
      month = 12;
      day = 31;
      hour = 24;
    }
    let millisecondStr;
    if (!defined_default(precision) && millisecond !== 0) {
      const millisecondHundreds = millisecond * 0.01;
      millisecondStr = millisecondHundreds < 1e-6 ? millisecondHundreds.toFixed(20).replace(".", "").replace(/0+$/, "") : millisecondHundreds.toString().replace(".", "");
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}.${millisecondStr}Z`;
    }
    if (!defined_default(precision) || precision === 0) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}Z`;
    }
    millisecondStr = (millisecond * 0.01).toFixed(precision).replace(".", "").slice(0, precision);
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}.${millisecondStr}Z`;
  }
  /**
   * Duplicates a JulianDate instance.
   *
   * @param {JulianDate} julianDate The date to duplicate.
   * @param {JulianDate} [result] An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter or a new instance if none was provided. Returns undefined if julianDate is undefined.
   */
  static clone(julianDate, result) {
    if (!defined_default(julianDate)) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _JulianDate(
        julianDate.dayNumber,
        julianDate.secondsOfDay,
        TimeStandard_default.TAI
      );
    }
    result.dayNumber = julianDate.dayNumber;
    result.secondsOfDay = julianDate.secondsOfDay;
    return result;
  }
  /**
   * Compares two instances.
   *
   * @param {JulianDate} left The first instance.
   * @param {JulianDate} right The second instance.
   * @returns {number} A negative value if left is less than right, a positive value if left is greater than right, or zero if left and right are equal.
   */
  static compare(left, right) {
    if (!defined_default(left)) {
      throw new DeveloperError_default("left is required.");
    }
    if (!defined_default(right)) {
      throw new DeveloperError_default("right is required.");
    }
    const julianDayNumberDifference = left.dayNumber - right.dayNumber;
    if (julianDayNumberDifference !== 0) {
      return julianDayNumberDifference;
    }
    return left.secondsOfDay - right.secondsOfDay;
  }
  /**
   * Compares two instances and returns <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {JulianDate} [left] The first instance.
   * @param {JulianDate} [right] The second instance.
   * @returns {boolean} <code>true</code> if the dates are equal; otherwise, <code>false</code>.
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && left.dayNumber === right.dayNumber && left.secondsOfDay === right.secondsOfDay;
  }
  /**
   * Compares two instances and returns <code>true</code> if they are within <code>epsilon</code> seconds of
   * each other.  That is, in order for the dates to be considered equal (and for
   * this function to return <code>true</code>), the absolute value of the difference between them, in
   * seconds, must be less than <code>epsilon</code>.
   *
   * @param {JulianDate} [left] The first instance.
   * @param {JulianDate} [right] The second instance.
   * @param {number} [epsilon=0] The maximum number of seconds that should separate the two instances.
   * @returns {boolean} <code>true</code> if the two dates are within <code>epsilon</code> seconds of each other; otherwise <code>false</code>.
   */
  static equalsEpsilon(left, right, epsilon) {
    epsilon = epsilon ?? 0;
    return left === right || defined_default(left) && defined_default(right) && Math.abs(_JulianDate.secondsDifference(left, right)) <= epsilon;
  }
  /**
   * Computes the total number of whole and fractional days represented by the provided instance.
   *
   * @param {JulianDate} julianDate The date.
   * @returns {number} The Julian date as single floating point number.
   */
  static totalDays(julianDate) {
    if (!defined_default(julianDate)) {
      throw new DeveloperError_default("julianDate is required.");
    }
    return julianDate.dayNumber + julianDate.secondsOfDay / TimeConstants_default.SECONDS_PER_DAY;
  }
  /**
   * Computes the difference in seconds between the provided instance.
   *
   * @param {JulianDate} left The first instance.
   * @param {JulianDate} right The second instance.
   * @returns {number} The difference, in seconds, when subtracting <code>right</code> from <code>left</code>.
   */
  static secondsDifference(left, right) {
    if (!defined_default(left)) {
      throw new DeveloperError_default("left is required.");
    }
    if (!defined_default(right)) {
      throw new DeveloperError_default("right is required.");
    }
    const dayDifference = (left.dayNumber - right.dayNumber) * TimeConstants_default.SECONDS_PER_DAY;
    return dayDifference + (left.secondsOfDay - right.secondsOfDay);
  }
  /**
   * Computes the difference in days between the provided instance.
   *
   * @param {JulianDate} left The first instance.
   * @param {JulianDate} right The second instance.
   * @returns {number} The difference, in days, when subtracting <code>right</code> from <code>left</code>.
   */
  static daysDifference(left, right) {
    if (!defined_default(left)) {
      throw new DeveloperError_default("left is required.");
    }
    if (!defined_default(right)) {
      throw new DeveloperError_default("right is required.");
    }
    const dayDifference = left.dayNumber - right.dayNumber;
    const secondDifference = (left.secondsOfDay - right.secondsOfDay) / TimeConstants_default.SECONDS_PER_DAY;
    return dayDifference + secondDifference;
  }
  /**
   * Computes the number of seconds the provided instance is ahead of UTC.
   *
   * @param {JulianDate} julianDate The date.
   * @returns {number} The number of seconds the provided instance is ahead of UTC
   */
  static computeTaiMinusUtc(julianDate) {
    binarySearchScratchLeapSecond.julianDate = julianDate;
    const leapSeconds = _JulianDate.leapSeconds;
    let index = binarySearch_default(
      leapSeconds,
      binarySearchScratchLeapSecond,
      compareLeapSecondDates
    );
    if (index < 0) {
      index = ~index;
      --index;
      if (index < 0) {
        index = 0;
      }
    }
    return leapSeconds[index].offset;
  }
  /**
   * Adds the provided number of seconds to the provided date instance.
   *
   * @param {JulianDate} julianDate The date.
   * @param {number} seconds The number of seconds to add or subtract.
   * @param {JulianDate} result An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter.
   */
  static addSeconds(julianDate, seconds, result) {
    if (!defined_default(julianDate)) {
      throw new DeveloperError_default("julianDate is required.");
    }
    if (!defined_default(seconds)) {
      throw new DeveloperError_default("seconds is required.");
    }
    if (!defined_default(result)) {
      throw new DeveloperError_default("result is required.");
    }
    return setComponents(
      julianDate.dayNumber,
      julianDate.secondsOfDay + seconds,
      result
    );
  }
  /**
   * Adds the provided number of minutes to the provided date instance.
   *
   * @param {JulianDate} julianDate The date.
   * @param {number} minutes The number of minutes to add or subtract.
   * @param {JulianDate} result An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter.
   */
  static addMinutes(julianDate, minutes, result) {
    if (!defined_default(julianDate)) {
      throw new DeveloperError_default("julianDate is required.");
    }
    if (!defined_default(minutes)) {
      throw new DeveloperError_default("minutes is required.");
    }
    if (!defined_default(result)) {
      throw new DeveloperError_default("result is required.");
    }
    const newSecondsOfDay = julianDate.secondsOfDay + minutes * TimeConstants_default.SECONDS_PER_MINUTE;
    return setComponents(julianDate.dayNumber, newSecondsOfDay, result);
  }
  /**
   * Adds the provided number of hours to the provided date instance.
   *
   * @param {JulianDate} julianDate The date.
   * @param {number} hours The number of hours to add or subtract.
   * @param {JulianDate} result An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter.
   */
  static addHours(julianDate, hours, result) {
    if (!defined_default(julianDate)) {
      throw new DeveloperError_default("julianDate is required.");
    }
    if (!defined_default(hours)) {
      throw new DeveloperError_default("hours is required.");
    }
    if (!defined_default(result)) {
      throw new DeveloperError_default("result is required.");
    }
    const newSecondsOfDay = julianDate.secondsOfDay + hours * TimeConstants_default.SECONDS_PER_HOUR;
    return setComponents(julianDate.dayNumber, newSecondsOfDay, result);
  }
  /**
   * Adds the provided number of days to the provided date instance.
   *
   * @param {JulianDate} julianDate The date.
   * @param {number} days The number of days to add or subtract.
   * @param {JulianDate} result An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter.
   */
  static addDays(julianDate, days, result) {
    if (!defined_default(julianDate)) {
      throw new DeveloperError_default("julianDate is required.");
    }
    if (!defined_default(days)) {
      throw new DeveloperError_default("days is required.");
    }
    if (!defined_default(result)) {
      throw new DeveloperError_default("result is required.");
    }
    const newJulianDayNumber = julianDate.dayNumber + days;
    return setComponents(newJulianDayNumber, julianDate.secondsOfDay, result);
  }
  /**
   * Compares the provided instances and returns <code>true</code> if <code>left</code> is earlier than <code>right</code>, <code>false</code> otherwise.
   *
   * @param {JulianDate} left The first instance.
   * @param {JulianDate} right The second instance.
   * @returns {boolean} <code>true</code> if <code>left</code> is earlier than <code>right</code>, <code>false</code> otherwise.
   */
  static lessThan(left, right) {
    return _JulianDate.compare(left, right) < 0;
  }
  /**
   * Compares the provided instances and returns <code>true</code> if <code>left</code> is earlier than or equal to <code>right</code>, <code>false</code> otherwise.
   *
   * @param {JulianDate} left The first instance.
   * @param {JulianDate} right The second instance.
   * @returns {boolean} <code>true</code> if <code>left</code> is earlier than or equal to <code>right</code>, <code>false</code> otherwise.
   */
  static lessThanOrEquals(left, right) {
    return _JulianDate.compare(left, right) <= 0;
  }
  /**
   * Compares the provided instances and returns <code>true</code> if <code>left</code> is later than <code>right</code>, <code>false</code> otherwise.
   *
   * @param {JulianDate} left The first instance.
   * @param {JulianDate} right The second instance.
   * @returns {boolean} <code>true</code> if <code>left</code> is later than <code>right</code>, <code>false</code> otherwise.
   */
  static greaterThan(left, right) {
    return _JulianDate.compare(left, right) > 0;
  }
  /**
   * Compares the provided instances and returns <code>true</code> if <code>left</code> is later than or equal to <code>right</code>, <code>false</code> otherwise.
   *
   * @param {JulianDate} left The first instance.
   * @param {JulianDate} right The second instance.
   * @returns {boolean} <code>true</code> if <code>left</code> is later than or equal to <code>right</code>, <code>false</code> otherwise.
   */
  static greaterThanOrEquals(left, right) {
    return _JulianDate.compare(left, right) >= 0;
  }
  /**
   * Duplicates this instance.
   *
   * @param {JulianDate} [result] An existing instance to use for the result.
   * @returns {JulianDate} The modified result parameter or a new instance if none was provided.
   */
  clone(result) {
    return _JulianDate.clone(this, result);
  }
  /**
   * Compares this and the provided instance and returns <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {JulianDate} [right] The second instance.
   * @returns {boolean} <code>true</code> if the dates are equal; otherwise, <code>false</code>.
   */
  equals(right) {
    return _JulianDate.equals(this, right);
  }
  /**
   * Compares this and the provided instance and returns <code>true</code> if they are within <code>epsilon</code> seconds of
   * each other.  That is, in order for the dates to be considered equal (and for
   * this function to return <code>true</code>), the absolute value of the difference between them, in
   * seconds, must be less than <code>epsilon</code>.
   *
   * @param {JulianDate} [right] The second instance.
   * @param {number} [epsilon=0] The maximum number of seconds that should separate the two instances.
   * @returns {boolean} <code>true</code> if the two dates are within <code>epsilon</code> seconds of each other; otherwise <code>false</code>.
   */
  equalsEpsilon(right, epsilon) {
    return _JulianDate.equalsEpsilon(this, right, epsilon);
  }
  /**
   * Creates a string representing this date in ISO8601 format.
   *
   * @returns {string} A string representing this date in ISO8601 format.
   */
  toString() {
    return _JulianDate.toIso8601(this);
  }
};
var toGregorianDateScratch = new JulianDate(0, 0, TimeStandard_default.TAI);
JulianDate.leapSeconds = [
  new LeapSecond_default(new JulianDate(2441317, 43210, TimeStandard_default.TAI), 10),
  // January 1, 1972 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2441499, 43211, TimeStandard_default.TAI), 11),
  // July 1, 1972 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2441683, 43212, TimeStandard_default.TAI), 12),
  // January 1, 1973 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2442048, 43213, TimeStandard_default.TAI), 13),
  // January 1, 1974 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2442413, 43214, TimeStandard_default.TAI), 14),
  // January 1, 1975 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2442778, 43215, TimeStandard_default.TAI), 15),
  // January 1, 1976 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2443144, 43216, TimeStandard_default.TAI), 16),
  // January 1, 1977 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2443509, 43217, TimeStandard_default.TAI), 17),
  // January 1, 1978 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2443874, 43218, TimeStandard_default.TAI), 18),
  // January 1, 1979 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2444239, 43219, TimeStandard_default.TAI), 19),
  // January 1, 1980 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2444786, 43220, TimeStandard_default.TAI), 20),
  // July 1, 1981 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2445151, 43221, TimeStandard_default.TAI), 21),
  // July 1, 1982 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2445516, 43222, TimeStandard_default.TAI), 22),
  // July 1, 1983 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2446247, 43223, TimeStandard_default.TAI), 23),
  // July 1, 1985 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2447161, 43224, TimeStandard_default.TAI), 24),
  // January 1, 1988 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2447892, 43225, TimeStandard_default.TAI), 25),
  // January 1, 1990 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2448257, 43226, TimeStandard_default.TAI), 26),
  // January 1, 1991 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2448804, 43227, TimeStandard_default.TAI), 27),
  // July 1, 1992 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2449169, 43228, TimeStandard_default.TAI), 28),
  // July 1, 1993 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2449534, 43229, TimeStandard_default.TAI), 29),
  // July 1, 1994 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2450083, 43230, TimeStandard_default.TAI), 30),
  // January 1, 1996 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2450630, 43231, TimeStandard_default.TAI), 31),
  // July 1, 1997 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2451179, 43232, TimeStandard_default.TAI), 32),
  // January 1, 1999 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2453736, 43233, TimeStandard_default.TAI), 33),
  // January 1, 2006 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2454832, 43234, TimeStandard_default.TAI), 34),
  // January 1, 2009 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2456109, 43235, TimeStandard_default.TAI), 35),
  // July 1, 2012 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2457204, 43236, TimeStandard_default.TAI), 36),
  // July 1, 2015 00:00:00 UTC
  new LeapSecond_default(new JulianDate(2457754, 43237, TimeStandard_default.TAI), 37)
  // January 1, 2017 00:00:00 UTC
];
var JulianDate_default = JulianDate;

// node_modules/@cesium/engine/Source/Core/Resource.js
var import_urijs6 = __toESM(require_URI(), 1);

// node_modules/@cesium/engine/Source/Core/appendForwardSlash.js
function appendForwardSlash(url) {
  if (url.length === 0 || url[url.length - 1] !== "/") {
    url = `${url}/`;
  }
  return url;
}
var appendForwardSlash_default = appendForwardSlash;

// node_modules/@cesium/engine/Source/Core/clone.js
function clone(object, deep) {
  if (object === null || typeof object !== "object") {
    return object;
  }
  deep = deep ?? false;
  const result = new object.constructor();
  for (const propertyName in object) {
    if (object.hasOwnProperty(propertyName)) {
      let value = object[propertyName];
      if (deep) {
        value = clone(value, deep);
      }
      result[propertyName] = value;
    }
  }
  return result;
}
var clone_default = clone;

// node_modules/@cesium/engine/Source/Core/combine.js
function combine(object1, object2, deep) {
  deep = deep ?? false;
  const result = {};
  const object1Defined = defined_default(object1);
  const object2Defined = defined_default(object2);
  let property;
  let object1Value;
  let object2Value;
  if (object1Defined) {
    for (property in object1) {
      if (object1.hasOwnProperty(property)) {
        object1Value = object1[property];
        if (object2Defined && deep && typeof object1Value === "object" && object2.hasOwnProperty(property)) {
          object2Value = object2[property];
          if (typeof object2Value === "object") {
            result[property] = combine(object1Value, object2Value, deep);
          } else {
            result[property] = object1Value;
          }
        } else {
          result[property] = object1Value;
        }
      }
    }
  }
  if (object2Defined) {
    for (property in object2) {
      if (object2.hasOwnProperty(property) && !result.hasOwnProperty(property)) {
        object2Value = object2[property];
        result[property] = object2Value;
      }
    }
  }
  return result;
}
var combine_default = combine;

// node_modules/@cesium/engine/Source/Core/defer.js
function defer() {
  let resolve;
  let reject;
  const promise = new Promise(function(res, rej) {
    resolve = res;
    reject = rej;
  });
  return {
    resolve,
    reject,
    promise
  };
}
var defer_default = defer;

// node_modules/@cesium/engine/Source/Core/getAbsoluteUri.js
var import_urijs = __toESM(require_URI(), 1);
function getAbsoluteUri(relative, base) {
  let documentObject;
  if (typeof document !== "undefined") {
    documentObject = document;
  }
  return getAbsoluteUri._implementation(relative, base, documentObject);
}
getAbsoluteUri._implementation = function(relative, base, documentObject) {
  if (!defined_default(relative)) {
    throw new DeveloperError_default("relative uri is required.");
  }
  if (!defined_default(base)) {
    if (typeof documentObject === "undefined") {
      return relative;
    }
    base = documentObject.baseURI ?? documentObject.location.href;
  }
  const relativeUri = new import_urijs.default(relative);
  if (relativeUri.scheme() !== "") {
    return relativeUri.toString();
  }
  return relativeUri.absoluteTo(base).toString();
};
var getAbsoluteUri_default = getAbsoluteUri;

// node_modules/@cesium/engine/Source/Core/getBaseUri.js
var import_urijs2 = __toESM(require_URI(), 1);
function getBaseUri(uri, includeQuery) {
  if (!defined_default(uri)) {
    throw new DeveloperError_default("uri is required.");
  }
  let basePath = "";
  const i = uri.lastIndexOf("/");
  if (i !== -1) {
    basePath = uri.substring(0, i + 1);
  }
  if (!includeQuery) {
    return basePath;
  }
  uri = new import_urijs2.default(uri);
  if (uri.query().length !== 0) {
    basePath += `?${uri.query()}`;
  }
  if (uri.fragment().length !== 0) {
    basePath += `#${uri.fragment()}`;
  }
  return basePath;
}
var getBaseUri_default = getBaseUri;

// node_modules/@cesium/engine/Source/Core/getExtensionFromUri.js
var import_urijs3 = __toESM(require_URI(), 1);
function getExtensionFromUri(uri) {
  if (!defined_default(uri)) {
    throw new DeveloperError_default("uri is required.");
  }
  const uriObject = new import_urijs3.default(uri);
  uriObject.normalize();
  let path = uriObject.path();
  let index = path.lastIndexOf("/");
  if (index !== -1) {
    path = path.substr(index + 1);
  }
  index = path.lastIndexOf(".");
  if (index === -1) {
    path = "";
  } else {
    path = path.substr(index + 1);
  }
  return path;
}
var getExtensionFromUri_default = getExtensionFromUri;

// node_modules/@cesium/engine/Source/Core/getImagePixels.js
var context2DsByWidthAndHeight = {};
function getImagePixels(image, width, height) {
  if (!defined_default(width)) {
    width = image.width;
  }
  if (!defined_default(height)) {
    height = image.height;
  }
  let context2DsByHeight = context2DsByWidthAndHeight[width];
  if (!defined_default(context2DsByHeight)) {
    context2DsByHeight = {};
    context2DsByWidthAndHeight[width] = context2DsByHeight;
  }
  let context2d = context2DsByHeight[height];
  if (!defined_default(context2d)) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    context2d = canvas.getContext("2d", { willReadFrequently: true });
    context2d.globalCompositeOperation = "copy";
    context2DsByHeight[height] = context2d;
  }
  context2d.drawImage(image, 0, 0, width, height);
  return context2d.getImageData(0, 0, width, height).data;
}
var getImagePixels_default = getImagePixels;

// node_modules/@cesium/engine/Source/Core/isBlobUri.js
var blobUriRegex = /^blob:/i;
function isBlobUri(uri) {
  Check_default.typeOf.string("uri", uri);
  return blobUriRegex.test(uri);
}
var isBlobUri_default = isBlobUri;

// node_modules/@cesium/engine/Source/Core/isCrossOriginUrl.js
var a;
function isCrossOriginUrl(url) {
  if (!defined_default(a)) {
    a = document.createElement("a");
  }
  a.href = window.location.href;
  const host = a.host;
  const protocol = a.protocol;
  a.href = url;
  a.href = a.href;
  return protocol !== a.protocol || host !== a.host;
}
var isCrossOriginUrl_default = isCrossOriginUrl;

// node_modules/@cesium/engine/Source/Core/isDataUri.js
var dataUriRegex = /^data:/i;
function isDataUri(uri) {
  Check_default.typeOf.string("uri", uri);
  return dataUriRegex.test(uri);
}
var isDataUri_default = isDataUri;

// node_modules/@cesium/engine/Source/Core/loadAndExecuteScript.js
function loadAndExecuteScript(url) {
  const script = document.createElement("script");
  script.async = true;
  script.src = url;
  return new Promise((resolve, reject) => {
    if (window.crossOriginIsolated) {
      script.setAttribute("crossorigin", "anonymous");
    }
    const head = document.getElementsByTagName("head")[0];
    script.onload = function() {
      script.onload = void 0;
      head.removeChild(script);
      resolve();
    };
    script.onerror = function(e) {
      reject(e);
    };
    head.appendChild(script);
  });
}
var loadAndExecuteScript_default = loadAndExecuteScript;

// node_modules/@cesium/engine/Source/Core/objectToQuery.js
function objectToQuery(obj) {
  if (!defined_default(obj)) {
    throw new DeveloperError_default("obj is required.");
  }
  let result = "";
  for (const propName in obj) {
    if (obj.hasOwnProperty(propName)) {
      const value = obj[propName];
      const part = `${encodeURIComponent(propName)}=`;
      if (Array.isArray(value)) {
        for (let i = 0, len = value.length; i < len; ++i) {
          result += `${part + encodeURIComponent(value[i])}&`;
        }
      } else {
        result += `${part + encodeURIComponent(value)}&`;
      }
    }
  }
  result = result.slice(0, -1);
  return result;
}
var objectToQuery_default = objectToQuery;

// node_modules/@cesium/engine/Source/Core/queryToObject.js
function queryToObject(queryString) {
  if (!defined_default(queryString)) {
    throw new DeveloperError_default("queryString is required.");
  }
  const result = {};
  if (queryString === "") {
    return result;
  }
  const parts = queryString.replace(/\+/g, "%20").split(/[&;]/);
  for (let i = 0, len = parts.length; i < len; ++i) {
    const subparts = parts[i].split("=");
    const name = decodeURIComponent(subparts[0]);
    let value = subparts[1];
    if (defined_default(value)) {
      value = decodeURIComponent(value);
    } else {
      value = "";
    }
    const resultValue = result[name];
    if (typeof resultValue === "string") {
      result[name] = [resultValue, value];
    } else if (Array.isArray(resultValue)) {
      resultValue.push(value);
    } else {
      result[name] = value;
    }
  }
  return result;
}
var queryToObject_default = queryToObject;

// node_modules/@cesium/engine/Source/Core/RequestState.js
var RequestState = {
  /**
   * Initial unissued state.
   *
   * @type {number}
   * @constant
   */
  UNISSUED: 0,
  /**
   * Issued but not yet active. Will become active when open slots are available.
   *
   * @type {number}
   * @constant
   */
  ISSUED: 1,
  /**
   * Actual http request has been sent.
   *
   * @type {number}
   * @constant
   */
  ACTIVE: 2,
  /**
   * Request completed successfully.
   *
   * @type {number}
   * @constant
   */
  RECEIVED: 3,
  /**
   * Request was cancelled, either explicitly or automatically because of low priority.
   *
   * @type {number}
   * @constant
   */
  CANCELLED: 4,
  /**
   * Request failed.
   *
   * @type {number}
   * @constant
   */
  FAILED: 5
};
Object.freeze(RequestState);
var RequestState_default = RequestState;

// node_modules/@cesium/engine/Source/Core/RequestType.js
var RequestType = {
  /**
   * Terrain request.
   *
   * @type {number}
   * @constant
   */
  TERRAIN: 0,
  /**
   * Imagery request.
   *
   * @type {number}
   * @constant
   */
  IMAGERY: 1,
  /**
   * 3D Tiles request.
   *
   * @type {number}
   * @constant
   */
  TILES3D: 2,
  /**
   * Other request.
   *
   * @type {number}
   * @constant
   */
  OTHER: 3
};
Object.freeze(RequestType);
var RequestType_default = RequestType;

// node_modules/@cesium/engine/Source/Core/Request.js
function Request(options) {
  options = options ?? Frozen_default.EMPTY_OBJECT;
  const throttleByServer = options.throttleByServer ?? false;
  const throttle = options.throttle ?? false;
  this.url = options.url;
  this.requestFunction = options.requestFunction;
  this.cancelFunction = options.cancelFunction;
  this.priorityFunction = options.priorityFunction;
  this.priority = options.priority ?? 0;
  this.throttle = throttle;
  this.throttleByServer = throttleByServer;
  this.type = options.type ?? RequestType_default.OTHER;
  this.serverKey = options.serverKey;
  this.state = RequestState_default.UNISSUED;
  this.deferred = void 0;
  this.cancelled = false;
}
Request.prototype.cancel = function() {
  this.cancelled = true;
};
Request.prototype.clone = function(result) {
  if (!defined_default(result)) {
    return new Request(this);
  }
  result.url = this.url;
  result.requestFunction = this.requestFunction;
  result.cancelFunction = this.cancelFunction;
  result.priorityFunction = this.priorityFunction;
  result.priority = this.priority;
  result.throttle = this.throttle;
  result.throttleByServer = this.throttleByServer;
  result.type = this.type;
  result.serverKey = this.serverKey;
  result.state = RequestState_default.UNISSUED;
  result.deferred = void 0;
  result.cancelled = false;
  return result;
};
var Request_default = Request;

// node_modules/@cesium/engine/Source/Core/parseResponseHeaders.js
function parseResponseHeaders(headerString) {
  const headers = {};
  if (!headerString) {
    return headers;
  }
  const headerPairs = headerString.split("\r\n");
  for (let i = 0; i < headerPairs.length; ++i) {
    const headerPair = headerPairs[i];
    const index = headerPair.indexOf(": ");
    if (index > 0) {
      const key = headerPair.substring(0, index);
      const val = headerPair.substring(index + 2);
      headers[key] = val;
    }
  }
  return headers;
}
var parseResponseHeaders_default = parseResponseHeaders;

// node_modules/@cesium/engine/Source/Core/RequestErrorEvent.js
function RequestErrorEvent(statusCode, response, responseHeaders) {
  this.statusCode = statusCode;
  this.response = response;
  this.responseHeaders = responseHeaders;
  if (typeof this.responseHeaders === "string") {
    this.responseHeaders = parseResponseHeaders_default(this.responseHeaders);
  }
}
RequestErrorEvent.prototype.toString = function() {
  let str = "Request has failed.";
  if (defined_default(this.statusCode)) {
    str += ` Status Code: ${this.statusCode}`;
  }
  return str;
};
var RequestErrorEvent_default = RequestErrorEvent;

// node_modules/@cesium/engine/Source/Core/RequestScheduler.js
var import_urijs4 = __toESM(require_URI(), 1);

// node_modules/@cesium/engine/Source/Core/Heap.js
function Heap(options) {
  Check_default.typeOf.object("options", options);
  Check_default.defined("options.comparator", options.comparator);
  this._comparator = options.comparator;
  this._array = [];
  this._length = 0;
  this._maximumLength = void 0;
}
Object.defineProperties(Heap.prototype, {
  /**
   * Gets the length of the heap.
   *
   * @memberof Heap.prototype
   *
   * @type {number}
   * @readonly
   */
  length: {
    get: function() {
      return this._length;
    }
  },
  /**
   * Gets the internal array.
   *
   * @memberof Heap.prototype
   *
   * @type {Array}
   * @readonly
   */
  internalArray: {
    get: function() {
      return this._array;
    }
  },
  /**
   * Gets and sets the maximum length of the heap.
   *
   * @memberof Heap.prototype
   *
   * @type {number}
   */
  maximumLength: {
    get: function() {
      return this._maximumLength;
    },
    set: function(value) {
      Check_default.typeOf.number.greaterThanOrEquals("maximumLength", value, 0);
      const originalLength = this._length;
      if (value < originalLength) {
        const array = this._array;
        for (let i = value; i < originalLength; ++i) {
          array[i] = void 0;
        }
        this._length = value;
        array.length = value;
      }
      this._maximumLength = value;
    }
  },
  /**
   * The comparator to use for the heap. If comparator(a, b) is less than 0, sort a to a lower index than b, otherwise sort to a higher index.
   *
   * @memberof Heap.prototype
   *
   * @type {Heap.ComparatorCallback}
   */
  comparator: {
    get: function() {
      return this._comparator;
    }
  }
});
function swap(array, a3, b) {
  const temp = array[a3];
  array[a3] = array[b];
  array[b] = temp;
}
Heap.prototype.reserve = function(length) {
  length = length ?? this._length;
  this._array.length = length;
};
Heap.prototype.heapify = function(index) {
  index = index ?? 0;
  const length = this._length;
  const comparator = this._comparator;
  const array = this._array;
  let candidate = -1;
  let inserting = true;
  while (inserting) {
    const right = 2 * (index + 1);
    const left = right - 1;
    if (left < length && comparator(array[left], array[index]) < 0) {
      candidate = left;
    } else {
      candidate = index;
    }
    if (right < length && comparator(array[right], array[candidate]) < 0) {
      candidate = right;
    }
    if (candidate !== index) {
      swap(array, candidate, index);
      index = candidate;
    } else {
      inserting = false;
    }
  }
};
Heap.prototype.resort = function() {
  const length = this._length;
  for (let i = Math.ceil(length / 2); i >= 0; --i) {
    this.heapify(i);
  }
};
Heap.prototype.insert = function(element) {
  Check_default.defined("element", element);
  const array = this._array;
  const comparator = this._comparator;
  const maximumLength = this._maximumLength;
  let index = this._length++;
  if (index < array.length) {
    array[index] = element;
  } else {
    array.push(element);
  }
  while (index !== 0) {
    const parent = Math.floor((index - 1) / 2);
    if (comparator(array[index], array[parent]) < 0) {
      swap(array, index, parent);
      index = parent;
    } else {
      break;
    }
  }
  let removedElement;
  if (defined_default(maximumLength) && this._length > maximumLength) {
    removedElement = array[maximumLength];
    this._length = maximumLength;
  }
  return removedElement;
};
Heap.prototype.pop = function(index) {
  index = index ?? 0;
  if (this._length === 0) {
    return void 0;
  }
  Check_default.typeOf.number.lessThan("index", index, this._length);
  const array = this._array;
  const root = array[index];
  swap(array, index, --this._length);
  this.heapify(index);
  array[this._length] = void 0;
  return root;
};
var Heap_default = Heap;

// node_modules/@cesium/engine/Source/Core/RuntimeError.js
function RuntimeError(message) {
  this.name = "RuntimeError";
  this.message = message;
  let stack;
  try {
    throw new Error();
  } catch (e) {
    stack = e.stack;
  }
  this.stack = stack;
}
if (defined_default(Object.create)) {
  RuntimeError.prototype = Object.create(Error.prototype);
  RuntimeError.prototype.constructor = RuntimeError;
}
RuntimeError.prototype.toString = function() {
  let str = `${this.name}: ${this.message}`;
  if (defined_default(this.stack)) {
    str += `
${this.stack.toString()}`;
  }
  return str;
};
var RuntimeError_default = RuntimeError;

// node_modules/@cesium/engine/Source/Core/RequestScheduler.js
function sortRequests(a3, b) {
  return a3.priority - b.priority;
}
var statistics = {
  numberOfAttemptedRequests: 0,
  numberOfActiveRequests: 0,
  numberOfCancelledRequests: 0,
  numberOfCancelledActiveRequests: 0,
  numberOfFailedRequests: 0,
  numberOfActiveRequestsEver: 0,
  lastNumberOfActiveRequests: 0
};
var priorityHeapLength = 20;
var requestHeap = new Heap_default({
  comparator: sortRequests
});
requestHeap.maximumLength = priorityHeapLength;
requestHeap.reserve(priorityHeapLength);
var activeRequests = [];
var numberOfActiveRequestsByServer = {};
var pageUri = typeof document !== "undefined" ? new import_urijs4.default(document.location.href) : new import_urijs4.default();
var requestCompletedEvent = new Event_default();
function RequestScheduler() {
}
RequestScheduler.maximumRequests = 50;
RequestScheduler.maximumRequestsPerServer = 18;
RequestScheduler.requestsByServer = {};
RequestScheduler.throttleRequests = true;
RequestScheduler.debugShowStatistics = false;
RequestScheduler.requestCompletedEvent = requestCompletedEvent;
Object.defineProperties(RequestScheduler, {
  /**
   * Returns the statistics used by the request scheduler.
   *
   * @memberof RequestScheduler
   *
   * @type {object}
   * @readonly
   * @private
   */
  statistics: {
    get: function() {
      return statistics;
    }
  },
  /**
   * The maximum size of the priority heap. This limits the number of requests that are sorted by priority. Only applies to requests that are not yet active.
   *
   * @memberof RequestScheduler
   *
   * @type {number}
   * @default 20
   * @private
   */
  priorityHeapLength: {
    get: function() {
      return priorityHeapLength;
    },
    set: function(value) {
      if (value < priorityHeapLength) {
        while (requestHeap.length > value) {
          const request = requestHeap.pop();
          cancelRequest(request);
        }
      }
      priorityHeapLength = value;
      requestHeap.maximumLength = value;
      requestHeap.reserve(value);
    }
  }
});
function updatePriority(request) {
  if (defined_default(request.priorityFunction)) {
    request.priority = request.priorityFunction();
  }
}
RequestScheduler.serverHasOpenSlots = function(serverKey, desiredRequests) {
  desiredRequests = desiredRequests ?? 1;
  const maxRequests = RequestScheduler.requestsByServer[serverKey] ?? RequestScheduler.maximumRequestsPerServer;
  const hasOpenSlotsServer = numberOfActiveRequestsByServer[serverKey] + desiredRequests <= maxRequests;
  return hasOpenSlotsServer;
};
RequestScheduler.heapHasOpenSlots = function(desiredRequests) {
  const hasOpenSlotsHeap = requestHeap.length + desiredRequests <= priorityHeapLength;
  return hasOpenSlotsHeap;
};
function issueRequest(request) {
  if (request.state === RequestState_default.UNISSUED) {
    request.state = RequestState_default.ISSUED;
    request.deferred = defer_default();
  }
  return request.deferred.promise;
}
function getRequestReceivedFunction(request) {
  return function(results) {
    if (request.state === RequestState_default.CANCELLED) {
      return;
    }
    const deferred = request.deferred;
    --statistics.numberOfActiveRequests;
    --numberOfActiveRequestsByServer[request.serverKey];
    requestCompletedEvent.raiseEvent();
    request.state = RequestState_default.RECEIVED;
    request.deferred = void 0;
    deferred.resolve(results);
  };
}
function getRequestFailedFunction(request) {
  return function(error) {
    if (request.state === RequestState_default.CANCELLED) {
      return;
    }
    ++statistics.numberOfFailedRequests;
    --statistics.numberOfActiveRequests;
    --numberOfActiveRequestsByServer[request.serverKey];
    requestCompletedEvent.raiseEvent(error);
    request.state = RequestState_default.FAILED;
    request.deferred.reject(error);
  };
}
function startRequest(request) {
  const promise = issueRequest(request);
  request.state = RequestState_default.ACTIVE;
  activeRequests.push(request);
  ++statistics.numberOfActiveRequests;
  ++statistics.numberOfActiveRequestsEver;
  ++numberOfActiveRequestsByServer[request.serverKey];
  request.requestFunction().then(getRequestReceivedFunction(request)).catch(getRequestFailedFunction(request));
  return promise;
}
function cancelRequest(request) {
  const active = request.state === RequestState_default.ACTIVE;
  request.state = RequestState_default.CANCELLED;
  ++statistics.numberOfCancelledRequests;
  if (defined_default(request.deferred)) {
    const deferred = request.deferred;
    deferred.promise.catch(() => {
    });
    request.deferred = void 0;
    deferred.reject(new RuntimeError_default(`Request cancelled: "${request.url}"`));
  }
  if (active) {
    --statistics.numberOfActiveRequests;
    --numberOfActiveRequestsByServer[request.serverKey];
    ++statistics.numberOfCancelledActiveRequests;
  }
  if (defined_default(request.cancelFunction)) {
    request.cancelFunction();
  }
}
RequestScheduler.update = function() {
  let i;
  let request;
  let removeCount = 0;
  const activeLength = activeRequests.length;
  for (i = 0; i < activeLength; ++i) {
    request = activeRequests[i];
    if (request.cancelled) {
      cancelRequest(request);
    }
    if (request.state !== RequestState_default.ACTIVE) {
      ++removeCount;
      continue;
    }
    if (removeCount > 0) {
      activeRequests[i - removeCount] = request;
    }
  }
  activeRequests.length -= removeCount;
  const issuedRequests = requestHeap.internalArray;
  const issuedLength = requestHeap.length;
  for (i = 0; i < issuedLength; ++i) {
    updatePriority(issuedRequests[i]);
  }
  requestHeap.resort();
  const openSlots = Math.max(
    RequestScheduler.maximumRequests - activeRequests.length,
    0
  );
  let filledSlots = 0;
  while (filledSlots < openSlots && requestHeap.length > 0) {
    request = requestHeap.pop();
    if (request.cancelled) {
      cancelRequest(request);
      continue;
    }
    if (request.throttleByServer && !RequestScheduler.serverHasOpenSlots(request.serverKey)) {
      cancelRequest(request);
      continue;
    }
    startRequest(request);
    ++filledSlots;
  }
  updateStatistics();
};
RequestScheduler.getServerKey = function(url) {
  Check_default.typeOf.string("url", url);
  let uri = new import_urijs4.default(url);
  if (uri.scheme() === "") {
    uri = uri.absoluteTo(pageUri);
    uri.normalize();
  }
  let serverKey = uri.authority();
  if (!/:/.test(serverKey)) {
    serverKey = `${serverKey}:${uri.scheme() === "https" ? "443" : "80"}`;
  }
  const length = numberOfActiveRequestsByServer[serverKey];
  if (!defined_default(length)) {
    numberOfActiveRequestsByServer[serverKey] = 0;
  }
  return serverKey;
};
RequestScheduler.request = function(request) {
  Check_default.typeOf.object("request", request);
  Check_default.typeOf.string("request.url", request.url);
  Check_default.typeOf.func("request.requestFunction", request.requestFunction);
  if (isDataUri_default(request.url) || isBlobUri_default(request.url)) {
    requestCompletedEvent.raiseEvent();
    request.state = RequestState_default.RECEIVED;
    return request.requestFunction();
  }
  ++statistics.numberOfAttemptedRequests;
  if (!defined_default(request.serverKey)) {
    request.serverKey = RequestScheduler.getServerKey(request.url);
  }
  if (RequestScheduler.throttleRequests && request.throttleByServer && !RequestScheduler.serverHasOpenSlots(request.serverKey)) {
    return void 0;
  }
  if (!RequestScheduler.throttleRequests || !request.throttle) {
    return startRequest(request);
  }
  if (activeRequests.length >= RequestScheduler.maximumRequests) {
    return void 0;
  }
  updatePriority(request);
  const removedRequest = requestHeap.insert(request);
  if (defined_default(removedRequest)) {
    if (removedRequest === request) {
      return void 0;
    }
    cancelRequest(removedRequest);
  }
  return issueRequest(request);
};
function updateStatistics() {
  if (!RequestScheduler.debugShowStatistics) {
    return;
  }
  if (statistics.numberOfActiveRequests === 0 && statistics.lastNumberOfActiveRequests > 0) {
    if (statistics.numberOfAttemptedRequests > 0) {
      console.log(
        `Number of attempted requests: ${statistics.numberOfAttemptedRequests}`
      );
      statistics.numberOfAttemptedRequests = 0;
    }
    if (statistics.numberOfCancelledRequests > 0) {
      console.log(
        `Number of cancelled requests: ${statistics.numberOfCancelledRequests}`
      );
      statistics.numberOfCancelledRequests = 0;
    }
    if (statistics.numberOfCancelledActiveRequests > 0) {
      console.log(
        `Number of cancelled active requests: ${statistics.numberOfCancelledActiveRequests}`
      );
      statistics.numberOfCancelledActiveRequests = 0;
    }
    if (statistics.numberOfFailedRequests > 0) {
      console.log(
        `Number of failed requests: ${statistics.numberOfFailedRequests}`
      );
      statistics.numberOfFailedRequests = 0;
    }
  }
  statistics.lastNumberOfActiveRequests = statistics.numberOfActiveRequests;
}
RequestScheduler.clearForSpecs = function() {
  while (requestHeap.length > 0) {
    const request = requestHeap.pop();
    cancelRequest(request);
  }
  const length = activeRequests.length;
  for (let i = 0; i < length; ++i) {
    cancelRequest(activeRequests[i]);
  }
  activeRequests.length = 0;
  numberOfActiveRequestsByServer = {};
  statistics.numberOfAttemptedRequests = 0;
  statistics.numberOfActiveRequests = 0;
  statistics.numberOfCancelledRequests = 0;
  statistics.numberOfCancelledActiveRequests = 0;
  statistics.numberOfFailedRequests = 0;
  statistics.numberOfActiveRequestsEver = 0;
  statistics.lastNumberOfActiveRequests = 0;
};
RequestScheduler.numberOfActiveRequestsByServer = function(serverKey) {
  return numberOfActiveRequestsByServer[serverKey];
};
RequestScheduler.requestHeap = requestHeap;
var RequestScheduler_default = RequestScheduler;

// node_modules/@cesium/engine/Source/Core/TrustedServers.js
var import_urijs5 = __toESM(require_URI(), 1);
var TrustedServers = {};
var _servers = {};
TrustedServers.add = function(host, port) {
  if (!defined_default(host)) {
    throw new DeveloperError_default("host is required.");
  }
  if (!defined_default(port) || port <= 0) {
    throw new DeveloperError_default("port is required to be greater than 0.");
  }
  const authority = `${host.toLowerCase()}:${port}`;
  if (!defined_default(_servers[authority])) {
    _servers[authority] = true;
  }
};
TrustedServers.remove = function(host, port) {
  if (!defined_default(host)) {
    throw new DeveloperError_default("host is required.");
  }
  if (!defined_default(port) || port <= 0) {
    throw new DeveloperError_default("port is required to be greater than 0.");
  }
  const authority = `${host.toLowerCase()}:${port}`;
  if (defined_default(_servers[authority])) {
    delete _servers[authority];
  }
};
function getAuthority(url) {
  const uri = new import_urijs5.default(url);
  uri.normalize();
  let authority = uri.authority();
  if (authority.length === 0) {
    return void 0;
  }
  uri.authority(authority);
  if (authority.indexOf("@") !== -1) {
    const parts = authority.split("@");
    authority = parts[1];
  }
  if (authority.indexOf(":") === -1) {
    let scheme = uri.scheme();
    if (scheme.length === 0) {
      scheme = window.location.protocol;
      scheme = scheme.substring(0, scheme.length - 1);
    }
    if (scheme === "http") {
      authority += ":80";
    } else if (scheme === "https") {
      authority += ":443";
    } else {
      return void 0;
    }
  }
  return authority;
}
TrustedServers.contains = function(url) {
  if (!defined_default(url)) {
    throw new DeveloperError_default("url is required.");
  }
  const authority = getAuthority(url);
  if (defined_default(authority) && defined_default(_servers[authority])) {
    return true;
  }
  return false;
};
TrustedServers.clear = function() {
  _servers = {};
};
var TrustedServers_default = TrustedServers;

// node_modules/@cesium/engine/Source/Core/Resource.js
var xhrBlobSupported = (function() {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "#", true);
    xhr.responseType = "blob";
    return xhr.responseType === "blob";
  } catch (e) {
    return false;
  }
})();
function Resource(options) {
  options = options ?? Frozen_default.EMPTY_OBJECT;
  if (typeof options === "string") {
    options = {
      url: options
    };
  }
  Check_default.typeOf.string("options.url", options.url);
  this._url = void 0;
  this._templateValues = defaultClone(options.templateValues, {});
  this._queryParameters = defaultClone(options.queryParameters, {});
  this.headers = defaultClone(options.headers, {});
  this.request = options.request ?? new Request_default();
  this.proxy = options.proxy;
  this.retryCallback = options.retryCallback;
  this.retryAttempts = options.retryAttempts ?? 0;
  this._retryCount = 0;
  const parseUrl = options.parseUrl ?? true;
  if (parseUrl) {
    this.parseUrl(options.url, true, true);
  } else {
    this._url = options.url;
  }
  this._credits = options.credits;
}
function defaultClone(value, defaultValue) {
  return defined_default(value) ? clone_default(value) : defaultValue;
}
Resource.createIfNeeded = function(resource) {
  if (resource instanceof Resource) {
    return resource.getDerivedResource({
      request: resource.request
    });
  }
  if (typeof resource !== "string") {
    return resource;
  }
  return new Resource({
    url: resource
  });
};
var supportsImageBitmapOptionsPromise;
Resource.supportsImageBitmapOptions = function() {
  if (defined_default(supportsImageBitmapOptionsPromise)) {
    return supportsImageBitmapOptionsPromise;
  }
  if (typeof createImageBitmap !== "function") {
    supportsImageBitmapOptionsPromise = Promise.resolve(false);
    return supportsImageBitmapOptionsPromise;
  }
  const imageDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAABGdBTUEAAE4g3rEiDgAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAADElEQVQI12Ng6GAAAAEUAIngE3ZiAAAAAElFTkSuQmCC";
  supportsImageBitmapOptionsPromise = Resource.fetchBlob({
    url: imageDataUri
  }).then(function(blob) {
    const imageBitmapOptions = {
      // 'from-image' is deprecated, new option is 'none'. However, we still need to support older browsers,
      // and there's no good way to detect support for these options. For now, continue to use 'from-image'. See: https://github.com/CesiumGS/cesium/issues/12846
      imageOrientation: "flipY",
      // default is "from-image"
      premultiplyAlpha: "none",
      // default is "default"
      colorSpaceConversion: "none"
      // default is "default"
    };
    return Promise.all([
      createImageBitmap(blob, imageBitmapOptions),
      createImageBitmap(blob)
    ]);
  }).then(function(imageBitmaps) {
    const colorWithOptions = getImagePixels_default(imageBitmaps[0]);
    const colorWithDefaults = getImagePixels_default(imageBitmaps[1]);
    return colorWithOptions[1] !== colorWithDefaults[1];
  }).catch(function() {
    return false;
  });
  return supportsImageBitmapOptionsPromise;
};
Object.defineProperties(Resource, {
  /**
   * Returns true if blobs are supported.
   *
   * @memberof Resource
   * @type {boolean}
   *
   * @readonly
   */
  isBlobSupported: {
    get: function() {
      return xhrBlobSupported;
    }
  }
});
Object.defineProperties(Resource.prototype, {
  /**
   * Query parameters appended to the url.
   *
   * @memberof Resource.prototype
   * @type {object}
   *
   * @readonly
   */
  queryParameters: {
    get: function() {
      return this._queryParameters;
    }
  },
  /**
   * The key/value pairs used to replace template parameters in the url.
   *
   * @memberof Resource.prototype
   * @type {object}
   *
   * @readonly
   */
  templateValues: {
    get: function() {
      return this._templateValues;
    }
  },
  /**
   * The url to the resource with template values replaced, query string appended and encoded by proxy if one was set.
   *
   * @memberof Resource.prototype
   * @type {string}
   */
  url: {
    get: function() {
      return this.getUrlComponent(true, true);
    },
    set: function(value) {
      this.parseUrl(value, false, false);
    }
  },
  /**
   * The file extension of the resource.
   *
   * @memberof Resource.prototype
   * @type {string}
   *
   * @readonly
   */
  extension: {
    get: function() {
      return getExtensionFromUri_default(this._url);
    }
  },
  /**
   * True if the Resource refers to a data URI.
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isDataUri: {
    get: function() {
      return isDataUri_default(this._url);
    }
  },
  /**
   * True if the Resource refers to a blob URI.
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isBlobUri: {
    get: function() {
      return isBlobUri_default(this._url);
    }
  },
  /**
   * True if the Resource refers to a cross origin URL.
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isCrossOriginUrl: {
    get: function() {
      return isCrossOriginUrl_default(this._url);
    }
  },
  /**
   * True if the Resource has request headers. This is equivalent to checking if the headers property has any keys.
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  hasHeaders: {
    get: function() {
      return Object.keys(this.headers).length > 0;
    }
  },
  /**
   * Gets the credits required for attribution of an asset.
   * @private
   */
  credits: {
    get: function() {
      return this._credits;
    }
  }
});
Resource.prototype.toString = function() {
  return this.getUrlComponent(true, true);
};
Resource.prototype.parseUrl = function(url, merge, preserveQuery, baseUrl) {
  let uri = new import_urijs6.default(url);
  const query = parseQueryString(uri.query());
  this._queryParameters = merge ? combineQueryParameters(query, this.queryParameters, preserveQuery) : query;
  uri.search("");
  uri.fragment("");
  if (defined_default(baseUrl) && uri.scheme() === "") {
    uri = uri.absoluteTo(getAbsoluteUri_default(baseUrl));
  }
  this._url = uri.toString();
};
function parseQueryString(queryString) {
  if (queryString.length === 0) {
    return {};
  }
  if (queryString.indexOf("=") === -1) {
    return { [queryString]: void 0 };
  }
  return queryToObject_default(queryString);
}
function combineQueryParameters(q1, q2, preserveQueryParameters) {
  if (!preserveQueryParameters) {
    return combine_default(q1, q2);
  }
  const result = clone_default(q1, true);
  for (const param in q2) {
    if (q2.hasOwnProperty(param)) {
      let value = result[param];
      const q2Value = q2[param];
      if (defined_default(value)) {
        if (!Array.isArray(value)) {
          value = result[param] = [value];
        }
        result[param] = value.concat(q2Value);
      } else {
        result[param] = Array.isArray(q2Value) ? q2Value.slice() : q2Value;
      }
    }
  }
  return result;
}
Resource.prototype.getUrlComponent = function(query, proxy) {
  if (this.isDataUri) {
    return this._url;
  }
  let url = this._url;
  if (query) {
    url = `${url}${stringifyQuery(this.queryParameters)}`;
  }
  url = url.replace(/%7B/g, "{").replace(/%7D/g, "}");
  const templateValues = this._templateValues;
  if (Object.keys(templateValues).length > 0) {
    url = url.replace(/{(.*?)}/g, function(match, key) {
      const replacement = templateValues[key];
      if (defined_default(replacement)) {
        return encodeURIComponent(replacement);
      }
      return match;
    });
  }
  if (proxy && defined_default(this.proxy)) {
    url = this.proxy.getURL(url);
  }
  return url;
};
function stringifyQuery(queryObject) {
  const keys = Object.keys(queryObject);
  if (keys.length === 0) {
    return "";
  }
  if (keys.length === 1 && !defined_default(queryObject[keys[0]])) {
    return `?${keys[0]}`;
  }
  return `?${objectToQuery_default(queryObject)}`;
}
Resource.prototype.setQueryParameters = function(params, useAsDefault) {
  if (useAsDefault) {
    this._queryParameters = combineQueryParameters(
      this._queryParameters,
      params,
      false
    );
  } else {
    this._queryParameters = combineQueryParameters(
      params,
      this._queryParameters,
      false
    );
  }
};
Resource.prototype.appendQueryParameters = function(params) {
  this._queryParameters = combineQueryParameters(
    params,
    this._queryParameters,
    true
  );
};
Resource.prototype.setTemplateValues = function(template, useAsDefault) {
  if (useAsDefault) {
    this._templateValues = combine_default(this._templateValues, template);
  } else {
    this._templateValues = combine_default(template, this._templateValues);
  }
};
Resource.prototype.getDerivedResource = function(options) {
  const resource = this.clone();
  resource._retryCount = 0;
  if (defined_default(options.url)) {
    const preserveQuery = options.preserveQueryParameters ?? false;
    resource.parseUrl(options.url, true, preserveQuery, this._url);
  }
  if (defined_default(options.queryParameters)) {
    resource._queryParameters = combine_default(
      options.queryParameters,
      resource.queryParameters
    );
  }
  if (defined_default(options.templateValues)) {
    resource._templateValues = combine_default(
      options.templateValues,
      resource.templateValues
    );
  }
  if (defined_default(options.headers)) {
    resource.headers = combine_default(options.headers, resource.headers);
  }
  if (defined_default(options.proxy)) {
    resource.proxy = options.proxy;
  }
  if (defined_default(options.request)) {
    resource.request = options.request;
  }
  if (defined_default(options.retryCallback)) {
    resource.retryCallback = options.retryCallback;
  }
  if (defined_default(options.retryAttempts)) {
    resource.retryAttempts = options.retryAttempts;
  }
  return resource;
};
Resource.prototype.retryOnError = function(error) {
  const retryCallback = this.retryCallback;
  if (typeof retryCallback !== "function" || this._retryCount >= this.retryAttempts) {
    return Promise.resolve(false);
  }
  const that = this;
  return Promise.resolve(retryCallback(this, error)).then(function(result) {
    ++that._retryCount;
    return result;
  });
};
Resource.prototype.clone = function(result) {
  if (!defined_default(result)) {
    return new Resource({
      url: this._url,
      queryParameters: this.queryParameters,
      templateValues: this.templateValues,
      headers: this.headers,
      proxy: this.proxy,
      retryCallback: this.retryCallback,
      retryAttempts: this.retryAttempts,
      request: this.request.clone(),
      parseUrl: false,
      credits: defined_default(this.credits) ? this.credits.slice() : void 0
    });
  }
  result._url = this._url;
  result._queryParameters = clone_default(this._queryParameters);
  result._templateValues = clone_default(this._templateValues);
  result.headers = clone_default(this.headers);
  result.proxy = this.proxy;
  result.retryCallback = this.retryCallback;
  result.retryAttempts = this.retryAttempts;
  result._retryCount = 0;
  result.request = this.request.clone();
  return result;
};
Resource.prototype.getBaseUri = function(includeQuery) {
  return getBaseUri_default(this.getUrlComponent(includeQuery), includeQuery);
};
Resource.prototype.appendForwardSlash = function() {
  this._url = appendForwardSlash_default(this._url);
};
Resource.prototype.fetchArrayBuffer = function() {
  return this.fetch({
    responseType: "arraybuffer"
  });
};
Resource.fetchArrayBuffer = function(options) {
  const resource = new Resource(options);
  return resource.fetchArrayBuffer();
};
Resource.prototype.fetchBlob = function() {
  return this.fetch({
    responseType: "blob"
  });
};
Resource.fetchBlob = function(options) {
  const resource = new Resource(options);
  return resource.fetchBlob();
};
Resource.prototype.fetchImage = function(options) {
  options = options ?? Frozen_default.EMPTY_OBJECT;
  const preferImageBitmap = options.preferImageBitmap ?? false;
  const preferBlob = options.preferBlob ?? false;
  const flipY = options.flipY ?? false;
  const skipColorSpaceConversion = options.skipColorSpaceConversion ?? false;
  checkAndResetRequest(this.request);
  if (!xhrBlobSupported || this.isDataUri || this.isBlobUri || !this.hasHeaders && !preferBlob) {
    return this._fetchImage({
      resource: this,
      flipY,
      skipColorSpaceConversion,
      preferImageBitmap
    });
  }
  const blobPromise = this.fetchBlob();
  if (!defined_default(blobPromise)) {
    return;
  }
  let supportsImageBitmap;
  let useImageBitmap;
  let generatedBlobResource;
  let generatedBlob;
  return Resource.supportsImageBitmapOptions().then(function(result) {
    supportsImageBitmap = result;
    useImageBitmap = supportsImageBitmap && preferImageBitmap;
    return blobPromise;
  }).then(function(blob) {
    if (!defined_default(blob)) {
      return;
    }
    generatedBlob = blob;
    if (useImageBitmap) {
      return Resource.createImageBitmapFromBlob(blob, {
        flipY,
        premultiplyAlpha: false,
        skipColorSpaceConversion
      });
    }
    const blobUrl = window.URL.createObjectURL(blob);
    generatedBlobResource = new Resource({
      url: blobUrl
    });
    return generatedBlobResource._fetchImage({
      flipY,
      skipColorSpaceConversion,
      preferImageBitmap: false
    });
  }).then(function(image) {
    if (!defined_default(image)) {
      return;
    }
    image.blob = generatedBlob;
    if (useImageBitmap) {
      return image;
    }
    window.URL.revokeObjectURL(generatedBlobResource.url);
    return image;
  }).catch(function(error) {
    if (defined_default(generatedBlobResource)) {
      window.URL.revokeObjectURL(generatedBlobResource.url);
    }
    error.blob = generatedBlob;
    return Promise.reject(error);
  });
};
Resource.prototype._fetchImage = function(options) {
  const resource = this;
  const flipY = options.flipY;
  const skipColorSpaceConversion = options.skipColorSpaceConversion;
  const preferImageBitmap = options.preferImageBitmap;
  const request = resource.request;
  request.url = resource.url;
  request.requestFunction = function() {
    let crossOrigin = false;
    if (!resource.isDataUri && !resource.isBlobUri) {
      crossOrigin = resource.isCrossOriginUrl;
    }
    const deferred = defer_default();
    Resource._Implementations.createImage(
      request,
      crossOrigin,
      deferred,
      flipY,
      skipColorSpaceConversion,
      preferImageBitmap
    );
    return deferred.promise;
  };
  const promise = RequestScheduler_default.request(request);
  if (!defined_default(promise)) {
    return;
  }
  return promise.catch(function(e) {
    if (request.state !== RequestState_default.FAILED) {
      return Promise.reject(e);
    }
    return resource.retryOnError(e).then(function(retry) {
      if (retry) {
        request.state = RequestState_default.UNISSUED;
        request.deferred = void 0;
        return resource._fetchImage({
          flipY,
          skipColorSpaceConversion,
          preferImageBitmap
        });
      }
      return Promise.reject(e);
    });
  });
};
Resource.fetchImage = function(options) {
  const resource = new Resource(options);
  return resource.fetchImage({
    flipY: options.flipY,
    skipColorSpaceConversion: options.skipColorSpaceConversion,
    preferBlob: options.preferBlob,
    preferImageBitmap: options.preferImageBitmap
  });
};
Resource.prototype.fetchText = function() {
  return this.fetch({
    responseType: "text"
  });
};
Resource.fetchText = function(options) {
  const resource = new Resource(options);
  return resource.fetchText();
};
Resource.prototype.fetchJson = function() {
  const promise = this.fetch({
    responseType: "text",
    headers: {
      Accept: "application/json,*/*;q=0.01"
    }
  });
  if (!defined_default(promise)) {
    return void 0;
  }
  return promise.then(function(value) {
    if (!defined_default(value)) {
      return;
    }
    return JSON.parse(value);
  });
};
Resource.fetchJson = function(options) {
  const resource = new Resource(options);
  return resource.fetchJson();
};
Resource.prototype.fetchXML = function() {
  return this.fetch({
    responseType: "document",
    overrideMimeType: "text/xml"
  });
};
Resource.fetchXML = function(options) {
  const resource = new Resource(options);
  return resource.fetchXML();
};
Resource.prototype.fetchJsonp = function(callbackParameterName) {
  callbackParameterName = callbackParameterName ?? "callback";
  checkAndResetRequest(this.request);
  let functionName;
  do {
    functionName = `loadJsonp${Math_default.nextRandomNumber().toString().substring(2, 8)}`;
  } while (defined_default(window[functionName]));
  return fetchJsonp(this, callbackParameterName, functionName);
};
function fetchJsonp(resource, callbackParameterName, functionName) {
  const callbackQuery = {};
  callbackQuery[callbackParameterName] = functionName;
  resource.setQueryParameters(callbackQuery);
  const request = resource.request;
  const url = resource.url;
  request.url = url;
  request.requestFunction = function() {
    const deferred = defer_default();
    window[functionName] = function(data) {
      deferred.resolve(data);
      try {
        delete window[functionName];
      } catch (e) {
        window[functionName] = void 0;
      }
    };
    Resource._Implementations.loadAndExecuteScript(url, functionName, deferred);
    return deferred.promise;
  };
  const promise = RequestScheduler_default.request(request);
  if (!defined_default(promise)) {
    return;
  }
  return promise.catch(function(e) {
    if (request.state !== RequestState_default.FAILED) {
      return Promise.reject(e);
    }
    return resource.retryOnError(e).then(function(retry) {
      if (retry) {
        request.state = RequestState_default.UNISSUED;
        request.deferred = void 0;
        return fetchJsonp(resource, callbackParameterName, functionName);
      }
      return Promise.reject(e);
    });
  });
}
Resource.fetchJsonp = function(options) {
  const resource = new Resource(options);
  return resource.fetchJsonp(options.callbackParameterName);
};
Resource.prototype._makeRequest = function(options) {
  const resource = this;
  checkAndResetRequest(resource.request);
  const request = resource.request;
  const url = resource.url;
  request.url = url;
  request.requestFunction = function() {
    const responseType = options.responseType;
    const headers = combine_default(options.headers, resource.headers);
    const overrideMimeType = options.overrideMimeType;
    const method = options.method;
    const data = options.data;
    const deferred = defer_default();
    const xhr = Resource._Implementations.loadWithXhr(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    );
    if (defined_default(xhr) && defined_default(xhr.abort)) {
      request.cancelFunction = function() {
        xhr.abort();
      };
    }
    return deferred.promise;
  };
  const promise = RequestScheduler_default.request(request);
  if (!defined_default(promise)) {
    return;
  }
  return promise.then(function(data) {
    request.cancelFunction = void 0;
    return data;
  }).catch(function(e) {
    request.cancelFunction = void 0;
    if (request.state !== RequestState_default.FAILED) {
      return Promise.reject(e);
    }
    return resource.retryOnError(e).then(function(retry) {
      if (retry) {
        request.state = RequestState_default.UNISSUED;
        request.deferred = void 0;
        return resource.fetch(options);
      }
      return Promise.reject(e);
    });
  });
};
function checkAndResetRequest(request) {
  if (request.state === RequestState_default.ISSUED || request.state === RequestState_default.ACTIVE) {
    throw new RuntimeError_default("The Resource is already being fetched.");
  }
  request.state = RequestState_default.UNISSUED;
  request.deferred = void 0;
}
var dataUriRegex2 = /^data:(.*?)(;base64)?,(.*)$/;
function decodeDataUriText(isBase64, data) {
  const result = decodeURIComponent(data);
  if (isBase64) {
    return atob(result);
  }
  return result;
}
function decodeDataUriArrayBuffer(isBase64, data) {
  const byteString = decodeDataUriText(isBase64, data);
  const buffer = new ArrayBuffer(byteString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < byteString.length; i++) {
    view[i] = byteString.charCodeAt(i);
  }
  return buffer;
}
function decodeDataUri(dataUriRegexResult, responseType) {
  responseType = responseType ?? "";
  const mimeType = dataUriRegexResult[1];
  const isBase64 = !!dataUriRegexResult[2];
  const data = dataUriRegexResult[3];
  let buffer;
  let parser;
  switch (responseType) {
    case "":
    case "text":
      return decodeDataUriText(isBase64, data);
    case "arraybuffer":
      return decodeDataUriArrayBuffer(isBase64, data);
    case "blob":
      buffer = decodeDataUriArrayBuffer(isBase64, data);
      return new Blob([buffer], {
        type: mimeType
      });
    case "document":
      parser = new DOMParser();
      return parser.parseFromString(
        decodeDataUriText(isBase64, data),
        mimeType
      );
    case "json":
      return JSON.parse(decodeDataUriText(isBase64, data));
    default:
      throw new DeveloperError_default(`Unhandled responseType: ${responseType}`);
  }
}
Resource.prototype.fetch = function(options) {
  options = defaultClone(options, {});
  options.method = "GET";
  return this._makeRequest(options);
};
Resource.fetch = function(options) {
  const resource = new Resource(options);
  return resource.fetch({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType
  });
};
Resource.prototype.delete = function(options) {
  options = defaultClone(options, {});
  options.method = "DELETE";
  return this._makeRequest(options);
};
Resource.delete = function(options) {
  const resource = new Resource(options);
  return resource.delete({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
    data: options.data
  });
};
Resource.prototype.head = function(options) {
  options = defaultClone(options, {});
  options.method = "HEAD";
  return this._makeRequest(options);
};
Resource.head = function(options) {
  const resource = new Resource(options);
  return resource.head({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType
  });
};
Resource.prototype.options = function(options) {
  options = defaultClone(options, {});
  options.method = "OPTIONS";
  return this._makeRequest(options);
};
Resource.options = function(options) {
  const resource = new Resource(options);
  return resource.options({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType
  });
};
Resource.prototype.post = function(data, options) {
  Check_default.defined("data", data);
  options = defaultClone(options, {});
  options.method = "POST";
  options.data = data;
  return this._makeRequest(options);
};
Resource.post = function(options) {
  const resource = new Resource(options);
  return resource.post(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType
  });
};
Resource.prototype.put = function(data, options) {
  Check_default.defined("data", data);
  options = defaultClone(options, {});
  options.method = "PUT";
  options.data = data;
  return this._makeRequest(options);
};
Resource.put = function(options) {
  const resource = new Resource(options);
  return resource.put(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType
  });
};
Resource.prototype.patch = function(data, options) {
  Check_default.defined("data", data);
  options = defaultClone(options, {});
  options.method = "PATCH";
  options.data = data;
  return this._makeRequest(options);
};
Resource.patch = function(options) {
  const resource = new Resource(options);
  return resource.patch(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType
  });
};
Resource._Implementations = {};
Resource._Implementations.loadImageElement = function(url, crossOrigin, deferred) {
  const image = new Image();
  image.onload = function() {
    if (image.naturalWidth === 0 && image.naturalHeight === 0 && image.width === 0 && image.height === 0) {
      image.width = 300;
      image.height = 150;
    }
    deferred.resolve(image);
  };
  image.onerror = function(e) {
    deferred.reject(e);
  };
  if (crossOrigin) {
    if (TrustedServers_default.contains(url)) {
      image.crossOrigin = "use-credentials";
    } else {
      image.crossOrigin = "";
    }
  }
  image.src = url;
};
Resource._Implementations.createImage = function(request, crossOrigin, deferred, flipY, skipColorSpaceConversion, preferImageBitmap, headers) {
  const url = request.url;
  Resource.supportsImageBitmapOptions().then(function(supportsImageBitmap) {
    if (!(supportsImageBitmap && preferImageBitmap)) {
      Resource._Implementations.loadImageElement(url, crossOrigin, deferred);
      return;
    }
    const responseType = "blob";
    const method = "GET";
    const xhrDeferred = defer_default();
    const xhr = Resource._Implementations.loadWithXhr(
      url,
      responseType,
      method,
      void 0,
      headers,
      xhrDeferred,
      void 0,
      void 0,
      void 0
    );
    if (defined_default(xhr) && defined_default(xhr.abort)) {
      request.cancelFunction = function() {
        xhr.abort();
      };
    }
    return xhrDeferred.promise.then(function(blob) {
      if (!defined_default(blob)) {
        deferred.reject(
          new RuntimeError_default(
            `Successfully retrieved ${url} but it contained no content.`
          )
        );
        return;
      }
      return Resource.createImageBitmapFromBlob(blob, {
        flipY,
        premultiplyAlpha: false,
        skipColorSpaceConversion
      });
    }).then(function(image) {
      deferred.resolve(image);
    });
  }).catch(function(e) {
    deferred.reject(e);
  });
};
Resource.createImageBitmapFromBlob = function(blob, options) {
  Check_default.defined("options", options);
  Check_default.typeOf.bool("options.flipY", options.flipY);
  Check_default.typeOf.bool("options.premultiplyAlpha", options.premultiplyAlpha);
  Check_default.typeOf.bool(
    "options.skipColorSpaceConversion",
    options.skipColorSpaceConversion
  );
  return createImageBitmap(blob, {
    // 'from-image' is deprecated, new option is 'none'. However, we still need to support older browsers,
    // and there's no good way to detect support for these options. For now, continue to use 'from-image'. See: https://github.com/CesiumGS/cesium/issues/12846
    imageOrientation: options.flipY ? "flipY" : "none",
    premultiplyAlpha: options.premultiplyAlpha ? "premultiply" : "none",
    colorSpaceConversion: options.skipColorSpaceConversion ? "none" : "default"
  });
};
function loadWithHttpRequest(url, responseType, method, data, headers, deferred, overrideMimeType) {
  fetch(url, {
    method,
    headers
  }).then(async (response) => {
    if (!response.ok) {
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      deferred.reject(
        new RequestErrorEvent_default(response.status, response, responseHeaders)
      );
      return;
    }
    switch (responseType) {
      case "text":
        deferred.resolve(response.text());
        break;
      case "json":
        deferred.resolve(response.json());
        break;
      default:
        deferred.resolve(new Uint8Array(await response.arrayBuffer()).buffer);
        break;
    }
  }).catch(() => {
    deferred.reject(new RequestErrorEvent_default());
  });
}
var noXMLHttpRequest = typeof XMLHttpRequest === "undefined";
Resource._Implementations.loadWithXhr = function(url, responseType, method, data, headers, deferred, overrideMimeType) {
  const dataUriRegexResult = dataUriRegex2.exec(url);
  if (dataUriRegexResult !== null) {
    deferred.resolve(decodeDataUri(dataUriRegexResult, responseType));
    return;
  }
  if (noXMLHttpRequest) {
    loadWithHttpRequest(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType
    );
    return;
  }
  const xhr = new XMLHttpRequest();
  if (TrustedServers_default.contains(url)) {
    xhr.withCredentials = true;
  }
  xhr.open(method, url, true);
  if (defined_default(overrideMimeType) && defined_default(xhr.overrideMimeType)) {
    xhr.overrideMimeType(overrideMimeType);
  }
  if (defined_default(headers)) {
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }
  }
  if (defined_default(responseType)) {
    xhr.responseType = responseType;
  }
  let localFile = false;
  if (typeof url === "string") {
    localFile = url.indexOf("file://") === 0 || typeof window !== "undefined" && window.location.origin === "file://";
  }
  xhr.onload = function() {
    if ((xhr.status < 200 || xhr.status >= 300) && !(localFile && xhr.status === 0)) {
      deferred.reject(
        new RequestErrorEvent_default(
          xhr.status,
          xhr.response,
          xhr.getAllResponseHeaders()
        )
      );
      return;
    }
    const response = xhr.response;
    const browserResponseType = xhr.responseType;
    if (method === "HEAD" || method === "OPTIONS") {
      const responseHeaderString = xhr.getAllResponseHeaders();
      const splitHeaders = responseHeaderString.trim().split(/[\r\n]+/);
      const responseHeaders = {};
      splitHeaders.forEach(function(line) {
        const parts = line.split(": ");
        const header = parts.shift();
        responseHeaders[header] = parts.join(": ");
      });
      deferred.resolve(responseHeaders);
      return;
    }
    if (xhr.status === 204) {
      deferred.resolve(void 0);
    } else if (defined_default(response) && (!defined_default(responseType) || browserResponseType === responseType)) {
      deferred.resolve(response);
    } else if (responseType === "json" && typeof response === "string") {
      try {
        deferred.resolve(JSON.parse(response));
      } catch (e) {
        deferred.reject(e);
      }
    } else if ((browserResponseType === "" || browserResponseType === "document") && defined_default(xhr.responseXML) && xhr.responseXML.hasChildNodes()) {
      deferred.resolve(xhr.responseXML);
    } else if ((browserResponseType === "" || browserResponseType === "text") && defined_default(xhr.responseText)) {
      deferred.resolve(xhr.responseText);
    } else {
      deferred.reject(
        new RuntimeError_default("Invalid XMLHttpRequest response type.")
      );
    }
  };
  xhr.onerror = function(e) {
    deferred.reject(new RequestErrorEvent_default());
  };
  xhr.send(data);
  return xhr;
};
Resource._Implementations.loadAndExecuteScript = function(url, functionName, deferred) {
  return loadAndExecuteScript_default(url, functionName).catch(function(e) {
    deferred.reject(e);
  });
};
Resource._DefaultImplementations = {};
Resource._DefaultImplementations.createImage = Resource._Implementations.createImage;
Resource._DefaultImplementations.loadWithXhr = Resource._Implementations.loadWithXhr;
Resource._DefaultImplementations.loadAndExecuteScript = Resource._Implementations.loadAndExecuteScript;
Resource.DEFAULT = Object.freeze(
  new Resource({
    url: typeof document === "undefined" ? "" : document.location.href.split("?")[0]
  })
);
var Resource_default = Resource;

// node_modules/@cesium/engine/Source/Core/EarthOrientationParameters.js
function EarthOrientationParameters(options) {
  options = options ?? Frozen_default.EMPTY_OBJECT;
  this._dates = void 0;
  this._samples = void 0;
  this._dateColumn = -1;
  this._xPoleWanderRadiansColumn = -1;
  this._yPoleWanderRadiansColumn = -1;
  this._ut1MinusUtcSecondsColumn = -1;
  this._xCelestialPoleOffsetRadiansColumn = -1;
  this._yCelestialPoleOffsetRadiansColumn = -1;
  this._taiMinusUtcSecondsColumn = -1;
  this._columnCount = 0;
  this._lastIndex = -1;
  this._addNewLeapSeconds = options.addNewLeapSeconds ?? true;
  if (defined_default(options.data)) {
    onDataReady(this, options.data);
  } else {
    onDataReady(this, {
      columnNames: [
        "dateIso8601",
        "modifiedJulianDateUtc",
        "xPoleWanderRadians",
        "yPoleWanderRadians",
        "ut1MinusUtcSeconds",
        "lengthOfDayCorrectionSeconds",
        "xCelestialPoleOffsetRadians",
        "yCelestialPoleOffsetRadians",
        "taiMinusUtcSeconds"
      ],
      samples: []
    });
  }
}
EarthOrientationParameters.fromUrl = async function(url, options) {
  Check_default.defined("url", url);
  options = options ?? Frozen_default.EMPTY_OBJECT;
  const resource = Resource_default.createIfNeeded(url);
  let eopData;
  try {
    eopData = await resource.fetchJson();
  } catch (e) {
    throw new RuntimeError_default(
      `An error occurred while retrieving the EOP data from the URL ${resource.url}.`
    );
  }
  return new EarthOrientationParameters({
    addNewLeapSeconds: options.addNewLeapSeconds,
    data: eopData
  });
};
EarthOrientationParameters.NONE = Object.freeze({
  compute: function(date, result) {
    if (!defined_default(result)) {
      result = new EarthOrientationParametersSample_default(0, 0, 0, 0, 0);
    } else {
      result.xPoleWander = 0;
      result.yPoleWander = 0;
      result.xPoleOffset = 0;
      result.yPoleOffset = 0;
      result.ut1MinusUtc = 0;
    }
    return result;
  }
});
EarthOrientationParameters.prototype.compute = function(date, result) {
  if (!defined_default(this._samples)) {
    return void 0;
  }
  if (!defined_default(result)) {
    result = new EarthOrientationParametersSample_default(0, 0, 0, 0, 0);
  }
  if (this._samples.length === 0) {
    result.xPoleWander = 0;
    result.yPoleWander = 0;
    result.xPoleOffset = 0;
    result.yPoleOffset = 0;
    result.ut1MinusUtc = 0;
    return result;
  }
  const dates = this._dates;
  const lastIndex = this._lastIndex;
  let before = 0;
  let after = 0;
  if (defined_default(lastIndex)) {
    const previousIndexDate = dates[lastIndex];
    const nextIndexDate = dates[lastIndex + 1];
    const isAfterPrevious = JulianDate_default.lessThanOrEquals(
      previousIndexDate,
      date
    );
    const isAfterLastSample = !defined_default(nextIndexDate);
    const isBeforeNext = isAfterLastSample || JulianDate_default.greaterThanOrEquals(nextIndexDate, date);
    if (isAfterPrevious && isBeforeNext) {
      before = lastIndex;
      if (!isAfterLastSample && nextIndexDate.equals(date)) {
        ++before;
      }
      after = before + 1;
      interpolate(this, dates, this._samples, date, before, after, result);
      return result;
    }
  }
  let index = binarySearch_default(dates, date, JulianDate_default.compare, this._dateColumn);
  if (index >= 0) {
    if (index < dates.length - 1 && dates[index + 1].equals(date)) {
      ++index;
    }
    before = index;
    after = index;
  } else {
    after = ~index;
    before = after - 1;
    if (before < 0) {
      before = 0;
    }
  }
  this._lastIndex = before;
  interpolate(this, dates, this._samples, date, before, after, result);
  return result;
};
function compareLeapSecondDates2(leapSecond, dateToFind) {
  return JulianDate_default.compare(leapSecond.julianDate, dateToFind);
}
function onDataReady(eop, eopData) {
  if (!defined_default(eopData.columnNames)) {
    throw new RuntimeError_default(
      "Error in loaded EOP data: The columnNames property is required."
    );
  }
  if (!defined_default(eopData.samples)) {
    throw new RuntimeError_default(
      "Error in loaded EOP data: The samples property is required."
    );
  }
  const dateColumn = eopData.columnNames.indexOf("modifiedJulianDateUtc");
  const xPoleWanderRadiansColumn = eopData.columnNames.indexOf("xPoleWanderRadians");
  const yPoleWanderRadiansColumn = eopData.columnNames.indexOf("yPoleWanderRadians");
  const ut1MinusUtcSecondsColumn = eopData.columnNames.indexOf("ut1MinusUtcSeconds");
  const xCelestialPoleOffsetRadiansColumn = eopData.columnNames.indexOf(
    "xCelestialPoleOffsetRadians"
  );
  const yCelestialPoleOffsetRadiansColumn = eopData.columnNames.indexOf(
    "yCelestialPoleOffsetRadians"
  );
  const taiMinusUtcSecondsColumn = eopData.columnNames.indexOf("taiMinusUtcSeconds");
  if (dateColumn < 0 || xPoleWanderRadiansColumn < 0 || yPoleWanderRadiansColumn < 0 || ut1MinusUtcSecondsColumn < 0 || xCelestialPoleOffsetRadiansColumn < 0 || yCelestialPoleOffsetRadiansColumn < 0 || taiMinusUtcSecondsColumn < 0) {
    throw new RuntimeError_default(
      "Error in loaded EOP data: The columnNames property must include modifiedJulianDateUtc, xPoleWanderRadians, yPoleWanderRadians, ut1MinusUtcSeconds, xCelestialPoleOffsetRadians, yCelestialPoleOffsetRadians, and taiMinusUtcSeconds columns"
    );
  }
  const samples = eop._samples = eopData.samples;
  const dates = eop._dates = [];
  eop._dateColumn = dateColumn;
  eop._xPoleWanderRadiansColumn = xPoleWanderRadiansColumn;
  eop._yPoleWanderRadiansColumn = yPoleWanderRadiansColumn;
  eop._ut1MinusUtcSecondsColumn = ut1MinusUtcSecondsColumn;
  eop._xCelestialPoleOffsetRadiansColumn = xCelestialPoleOffsetRadiansColumn;
  eop._yCelestialPoleOffsetRadiansColumn = yCelestialPoleOffsetRadiansColumn;
  eop._taiMinusUtcSecondsColumn = taiMinusUtcSecondsColumn;
  eop._columnCount = eopData.columnNames.length;
  eop._lastIndex = void 0;
  let lastTaiMinusUtc;
  const addNewLeapSeconds = eop._addNewLeapSeconds;
  for (let i = 0, len = samples.length; i < len; i += eop._columnCount) {
    const mjd = samples[i + dateColumn];
    const taiMinusUtc = samples[i + taiMinusUtcSecondsColumn];
    const day = mjd + TimeConstants_default.MODIFIED_JULIAN_DATE_DIFFERENCE;
    const date = new JulianDate_default(day, taiMinusUtc, TimeStandard_default.TAI);
    dates.push(date);
    if (addNewLeapSeconds) {
      if (taiMinusUtc !== lastTaiMinusUtc && defined_default(lastTaiMinusUtc)) {
        const leapSeconds = JulianDate_default.leapSeconds;
        const leapSecondIndex = binarySearch_default(
          leapSeconds,
          date,
          compareLeapSecondDates2
        );
        if (leapSecondIndex < 0) {
          const leapSecond = new LeapSecond_default(date, taiMinusUtc);
          leapSeconds.splice(~leapSecondIndex, 0, leapSecond);
        }
      }
      lastTaiMinusUtc = taiMinusUtc;
    }
  }
}
function fillResultFromIndex(eop, samples, index, columnCount, result) {
  const start = index * columnCount;
  result.xPoleWander = samples[start + eop._xPoleWanderRadiansColumn];
  result.yPoleWander = samples[start + eop._yPoleWanderRadiansColumn];
  result.xPoleOffset = samples[start + eop._xCelestialPoleOffsetRadiansColumn];
  result.yPoleOffset = samples[start + eop._yCelestialPoleOffsetRadiansColumn];
  result.ut1MinusUtc = samples[start + eop._ut1MinusUtcSecondsColumn];
}
function linearInterp(dx, y1, y2) {
  return y1 + dx * (y2 - y1);
}
function interpolate(eop, dates, samples, date, before, after, result) {
  const columnCount = eop._columnCount;
  if (after > dates.length - 1) {
    result.xPoleWander = 0;
    result.yPoleWander = 0;
    result.xPoleOffset = 0;
    result.yPoleOffset = 0;
    result.ut1MinusUtc = 0;
    return result;
  }
  const beforeDate = dates[before];
  const afterDate = dates[after];
  if (beforeDate.equals(afterDate) || date.equals(beforeDate)) {
    fillResultFromIndex(eop, samples, before, columnCount, result);
    return result;
  } else if (date.equals(afterDate)) {
    fillResultFromIndex(eop, samples, after, columnCount, result);
    return result;
  }
  const factor = JulianDate_default.secondsDifference(date, beforeDate) / JulianDate_default.secondsDifference(afterDate, beforeDate);
  const startBefore = before * columnCount;
  const startAfter = after * columnCount;
  let beforeUt1MinusUtc = samples[startBefore + eop._ut1MinusUtcSecondsColumn];
  let afterUt1MinusUtc = samples[startAfter + eop._ut1MinusUtcSecondsColumn];
  const offsetDifference = afterUt1MinusUtc - beforeUt1MinusUtc;
  if (offsetDifference > 0.5 || offsetDifference < -0.5) {
    const beforeTaiMinusUtc = samples[startBefore + eop._taiMinusUtcSecondsColumn];
    const afterTaiMinusUtc = samples[startAfter + eop._taiMinusUtcSecondsColumn];
    if (beforeTaiMinusUtc !== afterTaiMinusUtc) {
      if (afterDate.equals(date)) {
        beforeUt1MinusUtc = afterUt1MinusUtc;
      } else {
        afterUt1MinusUtc -= afterTaiMinusUtc - beforeTaiMinusUtc;
      }
    }
  }
  result.xPoleWander = linearInterp(
    factor,
    samples[startBefore + eop._xPoleWanderRadiansColumn],
    samples[startAfter + eop._xPoleWanderRadiansColumn]
  );
  result.yPoleWander = linearInterp(
    factor,
    samples[startBefore + eop._yPoleWanderRadiansColumn],
    samples[startAfter + eop._yPoleWanderRadiansColumn]
  );
  result.xPoleOffset = linearInterp(
    factor,
    samples[startBefore + eop._xCelestialPoleOffsetRadiansColumn],
    samples[startAfter + eop._xCelestialPoleOffsetRadiansColumn]
  );
  result.yPoleOffset = linearInterp(
    factor,
    samples[startBefore + eop._yCelestialPoleOffsetRadiansColumn],
    samples[startAfter + eop._yCelestialPoleOffsetRadiansColumn]
  );
  result.ut1MinusUtc = linearInterp(
    factor,
    beforeUt1MinusUtc,
    afterUt1MinusUtc
  );
  return result;
}
var EarthOrientationParameters_default = EarthOrientationParameters;

// node_modules/@cesium/engine/Source/Core/HeadingPitchRoll.js
function HeadingPitchRoll(heading, pitch, roll) {
  this.heading = heading ?? 0;
  this.pitch = pitch ?? 0;
  this.roll = roll ?? 0;
}
HeadingPitchRoll.fromQuaternion = function(quaternion, result) {
  if (!defined_default(quaternion)) {
    throw new DeveloperError_default("quaternion is required");
  }
  if (!defined_default(result)) {
    result = new HeadingPitchRoll();
  }
  const test = 2 * (quaternion.w * quaternion.y - quaternion.z * quaternion.x);
  const denominatorRoll = 1 - 2 * (quaternion.x * quaternion.x + quaternion.y * quaternion.y);
  const numeratorRoll = 2 * (quaternion.w * quaternion.x + quaternion.y * quaternion.z);
  const denominatorHeading = 1 - 2 * (quaternion.y * quaternion.y + quaternion.z * quaternion.z);
  const numeratorHeading = 2 * (quaternion.w * quaternion.z + quaternion.x * quaternion.y);
  result.heading = -Math.atan2(numeratorHeading, denominatorHeading);
  result.roll = Math.atan2(numeratorRoll, denominatorRoll);
  result.pitch = -Math_default.asinClamped(test);
  return result;
};
HeadingPitchRoll.fromDegrees = function(heading, pitch, roll, result) {
  if (!defined_default(heading)) {
    throw new DeveloperError_default("heading is required");
  }
  if (!defined_default(pitch)) {
    throw new DeveloperError_default("pitch is required");
  }
  if (!defined_default(roll)) {
    throw new DeveloperError_default("roll is required");
  }
  if (!defined_default(result)) {
    result = new HeadingPitchRoll();
  }
  result.heading = heading * Math_default.RADIANS_PER_DEGREE;
  result.pitch = pitch * Math_default.RADIANS_PER_DEGREE;
  result.roll = roll * Math_default.RADIANS_PER_DEGREE;
  return result;
};
HeadingPitchRoll.clone = function(headingPitchRoll, result) {
  if (!defined_default(headingPitchRoll)) {
    return void 0;
  }
  if (!defined_default(result)) {
    return new HeadingPitchRoll(
      headingPitchRoll.heading,
      headingPitchRoll.pitch,
      headingPitchRoll.roll
    );
  }
  result.heading = headingPitchRoll.heading;
  result.pitch = headingPitchRoll.pitch;
  result.roll = headingPitchRoll.roll;
  return result;
};
HeadingPitchRoll.equals = function(left, right) {
  return left === right || defined_default(left) && defined_default(right) && left.heading === right.heading && left.pitch === right.pitch && left.roll === right.roll;
};
HeadingPitchRoll.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
  return left === right || defined_default(left) && defined_default(right) && Math_default.equalsEpsilon(
    left.heading,
    right.heading,
    relativeEpsilon,
    absoluteEpsilon
  ) && Math_default.equalsEpsilon(
    left.pitch,
    right.pitch,
    relativeEpsilon,
    absoluteEpsilon
  ) && Math_default.equalsEpsilon(
    left.roll,
    right.roll,
    relativeEpsilon,
    absoluteEpsilon
  );
};
HeadingPitchRoll.prototype.clone = function(result) {
  return HeadingPitchRoll.clone(this, result);
};
HeadingPitchRoll.prototype.equals = function(right) {
  return HeadingPitchRoll.equals(this, right);
};
HeadingPitchRoll.prototype.equalsEpsilon = function(right, relativeEpsilon, absoluteEpsilon) {
  return HeadingPitchRoll.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon
  );
};
HeadingPitchRoll.prototype.toString = function() {
  return `(${this.heading}, ${this.pitch}, ${this.roll})`;
};
var HeadingPitchRoll_default = HeadingPitchRoll;

// node_modules/@cesium/engine/Source/Core/buildModuleUrl.js
var cesiumScriptRegex = /((?:.*\/)|^)Cesium\.js(?:\?|\#|$)/;
function getBaseUrlFromCesiumScript() {
  const scripts = document.getElementsByTagName("script");
  for (let i = 0, len = scripts.length; i < len; ++i) {
    const src = scripts[i].getAttribute("src");
    const result = cesiumScriptRegex.exec(src);
    if (result !== null) {
      return result[1];
    }
  }
  return void 0;
}
var a2;
function tryMakeAbsolute(url) {
  if (typeof document === "undefined") {
    return url;
  }
  if (!defined_default(a2)) {
    a2 = document.createElement("a");
  }
  a2.href = url;
  return a2.href;
}
var baseResource;
function getCesiumBaseUrl() {
  if (defined_default(baseResource)) {
    return baseResource;
  }
  let baseUrlString;
  if (typeof CESIUM_BASE_URL !== "undefined") {
    baseUrlString = CESIUM_BASE_URL;
  } else if (defined_default(import.meta?.url)) {
    baseUrlString = getAbsoluteUri_default(".", import.meta.url);
  } else if (typeof define === "object" && defined_default(define.amd) && !define.amd.toUrlUndefined && defined_default(__require.toUrl)) {
    baseUrlString = getAbsoluteUri_default(
      "..",
      buildModuleUrl("Core/buildModuleUrl.js")
    );
  } else {
    baseUrlString = getBaseUrlFromCesiumScript();
  }
  if (!defined_default(baseUrlString)) {
    throw new DeveloperError_default(
      "Unable to determine Cesium base URL automatically, try defining a global variable called CESIUM_BASE_URL."
    );
  }
  baseResource = new Resource_default({
    url: tryMakeAbsolute(baseUrlString)
  });
  baseResource.appendForwardSlash();
  return baseResource;
}
function buildModuleUrlFromRequireToUrl(moduleID) {
  return tryMakeAbsolute(__require.toUrl(`../${moduleID}`));
}
function buildModuleUrlFromBaseUrl(moduleID) {
  const resource = getCesiumBaseUrl().getDerivedResource({
    url: moduleID
  });
  return resource.url;
}
var implementation;
function buildModuleUrl(relativeUrl) {
  if (!defined_default(implementation)) {
    if (typeof define === "object" && defined_default(define.amd) && !define.amd.toUrlUndefined && defined_default(__require.toUrl)) {
      implementation = buildModuleUrlFromRequireToUrl;
    } else {
      implementation = buildModuleUrlFromBaseUrl;
    }
  }
  const url = implementation(relativeUrl);
  return url;
}
buildModuleUrl._cesiumScriptRegex = cesiumScriptRegex;
buildModuleUrl._buildModuleUrlFromBaseUrl = buildModuleUrlFromBaseUrl;
buildModuleUrl._clearBaseResource = function() {
  baseResource = void 0;
};
buildModuleUrl.setBaseUrl = function(value) {
  baseResource = Resource_default.DEFAULT.getDerivedResource({
    url: value
  });
};
buildModuleUrl.getCesiumBaseUrl = getCesiumBaseUrl;
var buildModuleUrl_default = buildModuleUrl;

// node_modules/@cesium/engine/Source/Core/Iau2006XysSample.js
function Iau2006XysSample(x, y, s) {
  this.x = x;
  this.y = y;
  this.s = s;
}
var Iau2006XysSample_default = Iau2006XysSample;

// node_modules/@cesium/engine/Source/Core/Iau2006XysData.js
function Iau2006XysData(options) {
  options = options ?? Frozen_default.EMPTY_OBJECT;
  this._xysFileUrlTemplate = Resource_default.createIfNeeded(
    options.xysFileUrlTemplate
  );
  this._interpolationOrder = options.interpolationOrder ?? 9;
  this._sampleZeroJulianEphemerisDate = options.sampleZeroJulianEphemerisDate ?? 24423965e-1;
  this._sampleZeroDateTT = new JulianDate_default(
    this._sampleZeroJulianEphemerisDate,
    0,
    TimeStandard_default.TAI
  );
  this._stepSizeDays = options.stepSizeDays ?? 1;
  this._samplesPerXysFile = options.samplesPerXysFile ?? 1e3;
  this._totalSamples = options.totalSamples ?? 27426;
  this._samples = new Array(this._totalSamples * 3);
  this._chunkDownloadsInProgress = [];
  const order = this._interpolationOrder;
  const denom = this._denominators = new Array(order + 1);
  const xTable = this._xTable = new Array(order + 1);
  const stepN = Math.pow(this._stepSizeDays, order);
  for (let i = 0; i <= order; ++i) {
    denom[i] = stepN;
    xTable[i] = i * this._stepSizeDays;
    for (let j = 0; j <= order; ++j) {
      if (j !== i) {
        denom[i] *= i - j;
      }
    }
    denom[i] = 1 / denom[i];
  }
  this._work = new Array(order + 1);
  this._coef = new Array(order + 1);
}
var julianDateScratch = new JulianDate_default(0, 0, TimeStandard_default.TAI);
function getDaysSinceEpoch(xys, dayTT, secondTT) {
  const dateTT = julianDateScratch;
  dateTT.dayNumber = dayTT;
  dateTT.secondsOfDay = secondTT;
  return JulianDate_default.daysDifference(dateTT, xys._sampleZeroDateTT);
}
Iau2006XysData.prototype.preload = function(startDayTT, startSecondTT, stopDayTT, stopSecondTT) {
  const startDaysSinceEpoch = getDaysSinceEpoch(
    this,
    startDayTT,
    startSecondTT
  );
  const stopDaysSinceEpoch = getDaysSinceEpoch(this, stopDayTT, stopSecondTT);
  let startIndex = startDaysSinceEpoch / this._stepSizeDays - this._interpolationOrder / 2 | 0;
  if (startIndex < 0) {
    startIndex = 0;
  }
  let stopIndex = stopDaysSinceEpoch / this._stepSizeDays - this._interpolationOrder / 2 | 0 + this._interpolationOrder;
  if (stopIndex >= this._totalSamples) {
    stopIndex = this._totalSamples - 1;
  }
  const startChunk = startIndex / this._samplesPerXysFile | 0;
  const stopChunk = stopIndex / this._samplesPerXysFile | 0;
  const promises = [];
  for (let i = startChunk; i <= stopChunk; ++i) {
    promises.push(requestXysChunk(this, i));
  }
  return Promise.all(promises);
};
Iau2006XysData.prototype.computeXysRadians = function(dayTT, secondTT, result) {
  const daysSinceEpoch = getDaysSinceEpoch(this, dayTT, secondTT);
  if (daysSinceEpoch < 0) {
    return void 0;
  }
  const centerIndex = daysSinceEpoch / this._stepSizeDays | 0;
  if (centerIndex >= this._totalSamples) {
    return void 0;
  }
  const degree = this._interpolationOrder;
  let firstIndex = centerIndex - (degree / 2 | 0);
  if (firstIndex < 0) {
    firstIndex = 0;
  }
  let lastIndex = firstIndex + degree;
  if (lastIndex >= this._totalSamples) {
    lastIndex = this._totalSamples - 1;
    firstIndex = lastIndex - degree;
    if (firstIndex < 0) {
      firstIndex = 0;
    }
  }
  let isDataMissing = false;
  const samples = this._samples;
  if (!defined_default(samples[firstIndex * 3])) {
    requestXysChunk(this, firstIndex / this._samplesPerXysFile | 0);
    isDataMissing = true;
  }
  if (!defined_default(samples[lastIndex * 3])) {
    requestXysChunk(this, lastIndex / this._samplesPerXysFile | 0);
    isDataMissing = true;
  }
  if (isDataMissing) {
    return void 0;
  }
  if (!defined_default(result)) {
    result = new Iau2006XysSample_default(0, 0, 0);
  } else {
    result.x = 0;
    result.y = 0;
    result.s = 0;
  }
  const x = daysSinceEpoch - firstIndex * this._stepSizeDays;
  const work = this._work;
  const denom = this._denominators;
  const coef = this._coef;
  const xTable = this._xTable;
  let i, j;
  for (i = 0; i <= degree; ++i) {
    work[i] = x - xTable[i];
  }
  for (i = 0; i <= degree; ++i) {
    coef[i] = 1;
    for (j = 0; j <= degree; ++j) {
      if (j !== i) {
        coef[i] *= work[j];
      }
    }
    coef[i] *= denom[i];
    let sampleIndex = (firstIndex + i) * 3;
    result.x += coef[i] * samples[sampleIndex++];
    result.y += coef[i] * samples[sampleIndex++];
    result.s += coef[i] * samples[sampleIndex];
  }
  return result;
};
Iau2006XysData.prototype._updateChunkData = function(index, { samples }) {
  this._chunkDownloadsInProgress[index] = void 0;
  const samplesPerFile = this._samplesPerXysFile;
  const startIndex = index * samplesPerFile * 3;
  for (let i = 0; i < samples.length; ++i) {
    this._samples[startIndex + i] = samples[i];
  }
};
async function requestXysChunkJson(resource, index, xysData) {
  try {
    const chunk = await resource.fetchJson();
    xysData._updateChunkData(index, chunk);
  } catch (e) {
  }
}
function requestXysChunk(xysData, chunkIndex) {
  if (defined_default(xysData._chunkDownloadsInProgress[chunkIndex])) {
    return xysData._chunkDownloadsInProgress[chunkIndex];
  }
  let chunkUrl;
  const xysFileUrlTemplate = xysData._xysFileUrlTemplate;
  if (defined_default(xysFileUrlTemplate)) {
    chunkUrl = xysFileUrlTemplate.getDerivedResource({
      templateValues: {
        0: chunkIndex
      }
    });
  } else {
    chunkUrl = new Resource_default({
      url: buildModuleUrl_default(`Assets/IAU2006_XYS/IAU2006_XYS_${chunkIndex}.json`)
    });
  }
  const promise = requestXysChunkJson(chunkUrl, chunkIndex, xysData);
  xysData._chunkDownloadsInProgress[chunkIndex] = promise;
  return promise;
}
var Iau2006XysData_default = Iau2006XysData;

// node_modules/@cesium/engine/Source/Core/Matrix3.js
var Matrix3 = class _Matrix3 {
  /**
   * @param {number} [column0Row0=0.0] The value for column 0, row 0.
   * @param {number} [column1Row0=0.0] The value for column 1, row 0.
   * @param {number} [column2Row0=0.0] The value for column 2, row 0.
   * @param {number} [column0Row1=0.0] The value for column 0, row 1.
   * @param {number} [column1Row1=0.0] The value for column 1, row 1.
   * @param {number} [column2Row1=0.0] The value for column 2, row 1.
   * @param {number} [column0Row2=0.0] The value for column 0, row 2.
   * @param {number} [column1Row2=0.0] The value for column 1, row 2.
   * @param {number} [column2Row2=0.0] The value for column 2, row 2.
   */
  constructor(column0Row0, column1Row0, column2Row0, column0Row1, column1Row1, column2Row1, column0Row2, column1Row2, column2Row2) {
    this[0] = column0Row0 ?? 0;
    this[1] = column0Row1 ?? 0;
    this[2] = column0Row2 ?? 0;
    this[3] = column1Row0 ?? 0;
    this[4] = column1Row1 ?? 0;
    this[5] = column1Row2 ?? 0;
    this[6] = column2Row0 ?? 0;
    this[7] = column2Row1 ?? 0;
    this[8] = column2Row2 ?? 0;
  }
  /**
   * Stores the provided instance into the provided array.
   *
   * @param {Matrix3} value The value to pack.
   * @param {number[]} array The array to pack into.
   * @param {number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {number[]} The array that was packed into
   */
  static pack(value, array, startingIndex) {
    Check_default.typeOf.object("value", value);
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    array[startingIndex++] = value[0];
    array[startingIndex++] = value[1];
    array[startingIndex++] = value[2];
    array[startingIndex++] = value[3];
    array[startingIndex++] = value[4];
    array[startingIndex++] = value[5];
    array[startingIndex++] = value[6];
    array[startingIndex++] = value[7];
    array[startingIndex++] = value[8];
    return array;
  }
  /**
   * Retrieves an instance from a packed array.
   *
   * @param {number[]} array The packed array.
   * @param {number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {Matrix3} [result] The object into which to store the result.
   * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
   */
  static unpack(array, startingIndex, result) {
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    if (!defined_default(result)) {
      result = new _Matrix3();
    }
    result[0] = array[startingIndex++];
    result[1] = array[startingIndex++];
    result[2] = array[startingIndex++];
    result[3] = array[startingIndex++];
    result[4] = array[startingIndex++];
    result[5] = array[startingIndex++];
    result[6] = array[startingIndex++];
    result[7] = array[startingIndex++];
    result[8] = array[startingIndex++];
    return result;
  }
  /**
   * Flattens an array of Matrix3s into an array of components. The components
   * are stored in column-major order.
   *
   * @param {Matrix3[]} array The array of matrices to pack.
   * @param {number[]} [result] The array onto which to store the result. If this is a typed array, it must have array.length * 9 components, else a {@link DeveloperError} will be thrown. If it is a regular array, it will be resized to have (array.length * 9) elements.
   * @returns {number[]} The packed array.
   */
  static packArray(array, result) {
    Check_default.defined("array", array);
    const length = array.length;
    const resultLength = length * 9;
    if (!defined_default(result)) {
      result = new Array(resultLength);
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      throw new DeveloperError_default(
        "If result is a typed array, it must have exactly array.length * 9 elements"
      );
    } else if (result.length !== resultLength) {
      result.length = resultLength;
    }
    for (let i = 0; i < length; ++i) {
      _Matrix3.pack(array[i], result, i * 9);
    }
    return result;
  }
  /**
   * Unpacks an array of column-major matrix components into an array of Matrix3s.
   *
   * @param {number[]} array The array of components to unpack.
   * @param {Matrix3[]} [result] The array onto which to store the result.
   * @returns {Matrix3[]} The unpacked array.
   */
  static unpackArray(array, result) {
    Check_default.defined("array", array);
    Check_default.typeOf.number.greaterThanOrEquals("array.length", array.length, 9);
    if (array.length % 9 !== 0) {
      throw new DeveloperError_default("array length must be a multiple of 9.");
    }
    const length = array.length;
    if (!defined_default(result)) {
      result = new Array(length / 9);
    } else {
      result.length = length / 9;
    }
    for (let i = 0; i < length; i += 9) {
      const index = i / 9;
      result[index] = _Matrix3.unpack(array, i, result[index]);
    }
    return result;
  }
  /**
   * Duplicates a Matrix3 instance.
   *
   * @param {Matrix3} matrix The matrix to duplicate.
   * @param {Matrix3} [result] The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided. (Returns undefined if matrix is undefined)
   */
  static clone(matrix, result) {
    if (!defined_default(matrix)) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Matrix3(
        matrix[0],
        matrix[3],
        matrix[6],
        matrix[1],
        matrix[4],
        matrix[7],
        matrix[2],
        matrix[5],
        matrix[8]
      );
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    return result;
  }
  /**
   * Creates a Matrix3 instance from a column-major order array.
   *
   * @param {number[]} values The column-major order array.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
   */
  static fromColumnMajorArray(values, result) {
    Check_default.defined("values", values);
    return _Matrix3.clone(values, result);
  }
  /**
   * Creates a Matrix3 instance from a row-major order array.
   * The resulting matrix will be in column-major order.
   *
   * @param {number[]} values The row-major order array.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
   */
  static fromRowMajorArray(values, result) {
    Check_default.defined("values", values);
    if (!defined_default(result)) {
      return new _Matrix3(
        values[0],
        values[1],
        values[2],
        values[3],
        values[4],
        values[5],
        values[6],
        values[7],
        values[8]
      );
    }
    result[0] = values[0];
    result[1] = values[3];
    result[2] = values[6];
    result[3] = values[1];
    result[4] = values[4];
    result[5] = values[7];
    result[6] = values[2];
    result[7] = values[5];
    result[8] = values[8];
    return result;
  }
  /**
   * Computes a 3x3 rotation matrix from the provided quaternion.
   *
   * @param {Quaternion} quaternion the quaternion to use.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The 3x3 rotation matrix from this quaternion.
   */
  static fromQuaternion(quaternion, result) {
    Check_default.typeOf.object("quaternion", quaternion);
    const x2 = quaternion.x * quaternion.x;
    const xy = quaternion.x * quaternion.y;
    const xz = quaternion.x * quaternion.z;
    const xw = quaternion.x * quaternion.w;
    const y2 = quaternion.y * quaternion.y;
    const yz = quaternion.y * quaternion.z;
    const yw = quaternion.y * quaternion.w;
    const z2 = quaternion.z * quaternion.z;
    const zw = quaternion.z * quaternion.w;
    const w2 = quaternion.w * quaternion.w;
    const m00 = x2 - y2 - z2 + w2;
    const m01 = 2 * (xy - zw);
    const m02 = 2 * (xz + yw);
    const m10 = 2 * (xy + zw);
    const m11 = -x2 + y2 - z2 + w2;
    const m12 = 2 * (yz - xw);
    const m20 = 2 * (xz - yw);
    const m21 = 2 * (yz + xw);
    const m22 = -x2 - y2 + z2 + w2;
    if (!defined_default(result)) {
      return new _Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    }
    result[0] = m00;
    result[1] = m10;
    result[2] = m20;
    result[3] = m01;
    result[4] = m11;
    result[5] = m21;
    result[6] = m02;
    result[7] = m12;
    result[8] = m22;
    return result;
  }
  /**
   * Computes a 3x3 rotation matrix from the provided headingPitchRoll. (see http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles )
   *
   * @param {HeadingPitchRoll} headingPitchRoll the headingPitchRoll to use.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The 3x3 rotation matrix from this headingPitchRoll.
   */
  static fromHeadingPitchRoll(headingPitchRoll, result) {
    Check_default.typeOf.object("headingPitchRoll", headingPitchRoll);
    const cosTheta = Math.cos(-headingPitchRoll.pitch);
    const cosPsi = Math.cos(-headingPitchRoll.heading);
    const cosPhi = Math.cos(headingPitchRoll.roll);
    const sinTheta = Math.sin(-headingPitchRoll.pitch);
    const sinPsi = Math.sin(-headingPitchRoll.heading);
    const sinPhi = Math.sin(headingPitchRoll.roll);
    const m00 = cosTheta * cosPsi;
    const m01 = -cosPhi * sinPsi + sinPhi * sinTheta * cosPsi;
    const m02 = sinPhi * sinPsi + cosPhi * sinTheta * cosPsi;
    const m10 = cosTheta * sinPsi;
    const m11 = cosPhi * cosPsi + sinPhi * sinTheta * sinPsi;
    const m12 = -sinPhi * cosPsi + cosPhi * sinTheta * sinPsi;
    const m20 = -sinTheta;
    const m21 = sinPhi * cosTheta;
    const m22 = cosPhi * cosTheta;
    if (!defined_default(result)) {
      return new _Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    }
    result[0] = m00;
    result[1] = m10;
    result[2] = m20;
    result[3] = m01;
    result[4] = m11;
    result[5] = m21;
    result[6] = m02;
    result[7] = m12;
    result[8] = m22;
    return result;
  }
  /**
   * Computes a Matrix3 instance representing a non-uniform scale.
   *
   * @param {Cartesian3} scale The x, y, and z scale factors.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
   *
   * @example
   * // Creates
   * //   [7.0, 0.0, 0.0]
   * //   [0.0, 8.0, 0.0]
   * //   [0.0, 0.0, 9.0]
   * const m = Cesium.Matrix3.fromScale(new Cesium.Cartesian3(7.0, 8.0, 9.0));
   */
  static fromScale(scale, result) {
    Check_default.typeOf.object("scale", scale);
    if (!defined_default(result)) {
      return new _Matrix3(
        scale.x,
        0,
        0,
        0,
        scale.y,
        0,
        0,
        0,
        scale.z
      );
    }
    result[0] = scale.x;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = scale.y;
    result[5] = 0;
    result[6] = 0;
    result[7] = 0;
    result[8] = scale.z;
    return result;
  }
  /**
   * Computes a Matrix3 instance representing a uniform scale.
   *
   * @param {number} scale The uniform scale factor.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
   *
   * @example
   * // Creates
   * //   [2.0, 0.0, 0.0]
   * //   [0.0, 2.0, 0.0]
   * //   [0.0, 0.0, 2.0]
   * const m = Cesium.Matrix3.fromUniformScale(2.0);
   */
  static fromUniformScale(scale, result) {
    Check_default.typeOf.number("scale", scale);
    if (!defined_default(result)) {
      return new _Matrix3(scale, 0, 0, 0, scale, 0, 0, 0, scale);
    }
    result[0] = scale;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = scale;
    result[5] = 0;
    result[6] = 0;
    result[7] = 0;
    result[8] = scale;
    return result;
  }
  /**
   * Computes a Matrix3 instance representing the cross product equivalent matrix of a Cartesian3 vector.
   *
   * @param {Cartesian3} vector the vector on the left hand side of the cross product operation.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
   *
   * @example
   * // Creates
   * //   [0.0, -9.0,  8.0]
   * //   [9.0,  0.0, -7.0]
   * //   [-8.0, 7.0,  0.0]
   * const m = Cesium.Matrix3.fromCrossProduct(new Cesium.Cartesian3(7.0, 8.0, 9.0));
   */
  static fromCrossProduct(vector, result) {
    Check_default.typeOf.object("vector", vector);
    if (!defined_default(result)) {
      return new _Matrix3(
        0,
        -vector.z,
        vector.y,
        vector.z,
        0,
        -vector.x,
        -vector.y,
        vector.x,
        0
      );
    }
    result[0] = 0;
    result[1] = vector.z;
    result[2] = -vector.y;
    result[3] = -vector.z;
    result[4] = 0;
    result[5] = vector.x;
    result[6] = vector.y;
    result[7] = -vector.x;
    result[8] = 0;
    return result;
  }
  /**
   * Creates a rotation matrix around the x-axis.
   *
   * @param {number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
   *
   * @example
   * // Rotate a point 45 degrees counterclockwise around the x-axis.
   * const p = new Cesium.Cartesian3(5, 6, 7);
   * const m = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(45.0));
   * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
   */
  static fromRotationX(angle, result) {
    Check_default.typeOf.number("angle", angle);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    if (!defined_default(result)) {
      return new _Matrix3(
        1,
        0,
        0,
        0,
        cosAngle,
        -sinAngle,
        0,
        sinAngle,
        cosAngle
      );
    }
    result[0] = 1;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = cosAngle;
    result[5] = sinAngle;
    result[6] = 0;
    result[7] = -sinAngle;
    result[8] = cosAngle;
    return result;
  }
  /**
   * Creates a rotation matrix around the y-axis.
   *
   * @param {number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
   *
   * @example
   * // Rotate a point 45 degrees counterclockwise around the y-axis.
   * const p = new Cesium.Cartesian3(5, 6, 7);
   * const m = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(45.0));
   * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
   */
  static fromRotationY(angle, result) {
    Check_default.typeOf.number("angle", angle);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    if (!defined_default(result)) {
      return new _Matrix3(
        cosAngle,
        0,
        sinAngle,
        0,
        1,
        0,
        -sinAngle,
        0,
        cosAngle
      );
    }
    result[0] = cosAngle;
    result[1] = 0;
    result[2] = -sinAngle;
    result[3] = 0;
    result[4] = 1;
    result[5] = 0;
    result[6] = sinAngle;
    result[7] = 0;
    result[8] = cosAngle;
    return result;
  }
  /**
   * Creates a rotation matrix around the z-axis.
   *
   * @param {number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
   * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
   *
   * @example
   * // Rotate a point 45 degrees counterclockwise around the z-axis.
   * const p = new Cesium.Cartesian3(5, 6, 7);
   * const m = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(45.0));
   * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
   */
  static fromRotationZ(angle, result) {
    Check_default.typeOf.number("angle", angle);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    if (!defined_default(result)) {
      return new _Matrix3(
        cosAngle,
        -sinAngle,
        0,
        sinAngle,
        cosAngle,
        0,
        0,
        0,
        1
      );
    }
    result[0] = cosAngle;
    result[1] = sinAngle;
    result[2] = 0;
    result[3] = -sinAngle;
    result[4] = cosAngle;
    result[5] = 0;
    result[6] = 0;
    result[7] = 0;
    result[8] = 1;
    return result;
  }
  /**
   * Creates an Array from the provided Matrix3 instance.
   * The array will be in column-major order.
   *
   * @param {Matrix3} matrix The matrix to use..
   * @param {number[]} [result] The Array onto which to store the result.
   * @returns {number[]} The modified Array parameter or a new Array instance if one was not provided.
   */
  static toArray(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    if (!defined_default(result)) {
      return [
        matrix[0],
        matrix[1],
        matrix[2],
        matrix[3],
        matrix[4],
        matrix[5],
        matrix[6],
        matrix[7],
        matrix[8]
      ];
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    return result;
  }
  /**
   * Computes the array index of the element at the provided row and column.
   *
   * @param {number} column The zero-based index of the column.
   * @param {number} row The zero-based index of the row.
   * @returns {number} The index of the element at the provided row and column.
   *
   * @exception {DeveloperError} row must be 0, 1, or 2.
   * @exception {DeveloperError} column must be 0, 1, or 2.
   *
   * @example
   * const myMatrix = new Cesium.Matrix3();
   * const column1Row0Index = Cesium.Matrix3.getElementIndex(1, 0);
   * const column1Row0 = myMatrix[column1Row0Index]
   * myMatrix[column1Row0Index] = 10.0;
   */
  static getElementIndex(column, row) {
    Check_default.typeOf.number.greaterThanOrEquals("row", row, 0);
    Check_default.typeOf.number.lessThanOrEquals("row", row, 2);
    Check_default.typeOf.number.greaterThanOrEquals("column", column, 0);
    Check_default.typeOf.number.lessThanOrEquals("column", column, 2);
    return column * 3 + row;
  }
  /**
   * Retrieves a copy of the matrix column at the provided index as a Cartesian3 instance.
   *
   * @param {Matrix3} matrix The matrix to use.
   * @param {number} index The zero-based index of the column to retrieve.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, or 2.
   */
  static getColumn(matrix, index, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check_default.typeOf.number.lessThanOrEquals("index", index, 2);
    Check_default.typeOf.object("result", result);
    const startIndex = index * 3;
    const x = matrix[startIndex];
    const y = matrix[startIndex + 1];
    const z = matrix[startIndex + 2];
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Computes a new matrix that replaces the specified column in the provided matrix with the provided Cartesian3 instance.
   *
   * @param {Matrix3} matrix The matrix to use.
   * @param {number} index The zero-based index of the column to set.
   * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified column.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, or 2.
   */
  static setColumn(matrix, index, cartesian, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check_default.typeOf.number.lessThanOrEquals("index", index, 2);
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result = _Matrix3.clone(matrix, result);
    const startIndex = index * 3;
    result[startIndex] = cartesian.x;
    result[startIndex + 1] = cartesian.y;
    result[startIndex + 2] = cartesian.z;
    return result;
  }
  /**
   * Retrieves a copy of the matrix row at the provided index as a Cartesian3 instance.
   *
   * @param {Matrix3} matrix The matrix to use.
   * @param {number} index The zero-based index of the row to retrieve.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, or 2.
   */
  static getRow(matrix, index, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check_default.typeOf.number.lessThanOrEquals("index", index, 2);
    Check_default.typeOf.object("result", result);
    const x = matrix[index];
    const y = matrix[index + 3];
    const z = matrix[index + 6];
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Computes a new matrix that replaces the specified row in the provided matrix with the provided Cartesian3 instance.
   *
   * @param {Matrix3} matrix The matrix to use.
   * @param {number} index The zero-based index of the row to set.
   * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified row.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, or 2.
   */
  static setRow(matrix, index, cartesian, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check_default.typeOf.number.lessThanOrEquals("index", index, 2);
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result = _Matrix3.clone(matrix, result);
    result[index] = cartesian.x;
    result[index + 3] = cartesian.y;
    result[index + 6] = cartesian.z;
    return result;
  }
  /**
   * Computes a new matrix that replaces the scale with the provided scale.
   * This assumes the matrix is an affine transformation.
   *
   * @param {Matrix3} matrix The matrix to use.
   * @param {Cartesian3} scale The scale that replaces the scale of the provided matrix.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @see Matrix3.setUniformScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.multiplyByScale
   * @see Matrix3.multiplyByUniformScale
   * @see Matrix3.getScale
   */
  static setScale(matrix, scale, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("scale", scale);
    Check_default.typeOf.object("result", result);
    const existingScale = _Matrix3.getScale(matrix, scaleScratch1);
    const scaleRatioX = scale.x / existingScale.x;
    const scaleRatioY = scale.y / existingScale.y;
    const scaleRatioZ = scale.z / existingScale.z;
    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioX;
    result[3] = matrix[3] * scaleRatioY;
    result[4] = matrix[4] * scaleRatioY;
    result[5] = matrix[5] * scaleRatioY;
    result[6] = matrix[6] * scaleRatioZ;
    result[7] = matrix[7] * scaleRatioZ;
    result[8] = matrix[8] * scaleRatioZ;
    return result;
  }
  /**
   * Computes a new matrix that replaces the scale with the provided uniform scale.
   * This assumes the matrix is an affine transformation.
   *
   * @param {Matrix3} matrix The matrix to use.
   * @param {number} scale The uniform scale that replaces the scale of the provided matrix.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @see Matrix3.setScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.multiplyByScale
   * @see Matrix3.multiplyByUniformScale
   * @see Matrix3.getScale
   */
  static setUniformScale(matrix, scale, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number("scale", scale);
    Check_default.typeOf.object("result", result);
    const existingScale = _Matrix3.getScale(matrix, scaleScratch2);
    const scaleRatioX = scale / existingScale.x;
    const scaleRatioY = scale / existingScale.y;
    const scaleRatioZ = scale / existingScale.z;
    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioX;
    result[3] = matrix[3] * scaleRatioY;
    result[4] = matrix[4] * scaleRatioY;
    result[5] = matrix[5] * scaleRatioY;
    result[6] = matrix[6] * scaleRatioZ;
    result[7] = matrix[7] * scaleRatioZ;
    result[8] = matrix[8] * scaleRatioZ;
    return result;
  }
  /**
   * Extracts the non-uniform scale assuming the matrix is an affine transformation.
   *
   * @param {Matrix3} matrix The matrix.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   *
   * @see Matrix3.multiplyByScale
   * @see Matrix3.multiplyByUniformScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.setScale
   * @see Matrix3.setUniformScale
   */
  static getScale(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    result.x = Cartesian3_default.magnitude(
      Cartesian3_default.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn)
    );
    result.y = Cartesian3_default.magnitude(
      Cartesian3_default.fromElements(matrix[3], matrix[4], matrix[5], scratchColumn)
    );
    result.z = Cartesian3_default.magnitude(
      Cartesian3_default.fromElements(matrix[6], matrix[7], matrix[8], scratchColumn)
    );
    return result;
  }
  /**
   * Computes the maximum scale assuming the matrix is an affine transformation.
   * The maximum scale is the maximum length of the column vectors.
   *
   * @param {Matrix3} matrix The matrix.
   * @returns {number} The maximum scale.
   */
  static getMaximumScale(matrix) {
    _Matrix3.getScale(matrix, scaleScratch3);
    return Cartesian3_default.maximumComponent(scaleScratch3);
  }
  /**
   * Sets the rotation assuming the matrix is an affine transformation.
   *
   * @param {Matrix3} matrix The matrix.
   * @param {Matrix3} rotation The rotation matrix.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @see Matrix3.getRotation
   */
  static setRotation(matrix, rotation, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const scale = _Matrix3.getScale(matrix, scaleScratch4);
    result[0] = rotation[0] * scale.x;
    result[1] = rotation[1] * scale.x;
    result[2] = rotation[2] * scale.x;
    result[3] = rotation[3] * scale.y;
    result[4] = rotation[4] * scale.y;
    result[5] = rotation[5] * scale.y;
    result[6] = rotation[6] * scale.z;
    result[7] = rotation[7] * scale.z;
    result[8] = rotation[8] * scale.z;
    return result;
  }
  /**
   * Extracts the rotation matrix assuming the matrix is an affine transformation.
   *
   * @param {Matrix3} matrix The matrix.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @see Matrix3.setRotation
   */
  static getRotation(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const scale = _Matrix3.getScale(matrix, scaleScratch5);
    result[0] = matrix[0] / scale.x;
    result[1] = matrix[1] / scale.x;
    result[2] = matrix[2] / scale.x;
    result[3] = matrix[3] / scale.y;
    result[4] = matrix[4] / scale.y;
    result[5] = matrix[5] / scale.y;
    result[6] = matrix[6] / scale.z;
    result[7] = matrix[7] / scale.z;
    result[8] = matrix[8] / scale.z;
    return result;
  }
  /**
   * Computes the product of two matrices.
   *
   * @param {Matrix3} left The first matrix.
   * @param {Matrix3} right The second matrix.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static multiply(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    const column0Row0 = left[0] * right[0] + left[3] * right[1] + left[6] * right[2];
    const column0Row1 = left[1] * right[0] + left[4] * right[1] + left[7] * right[2];
    const column0Row2 = left[2] * right[0] + left[5] * right[1] + left[8] * right[2];
    const column1Row0 = left[0] * right[3] + left[3] * right[4] + left[6] * right[5];
    const column1Row1 = left[1] * right[3] + left[4] * right[4] + left[7] * right[5];
    const column1Row2 = left[2] * right[3] + left[5] * right[4] + left[8] * right[5];
    const column2Row0 = left[0] * right[6] + left[3] * right[7] + left[6] * right[8];
    const column2Row1 = left[1] * right[6] + left[4] * right[7] + left[7] * right[8];
    const column2Row2 = left[2] * right[6] + left[5] * right[7] + left[8] * right[8];
    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = column1Row0;
    result[4] = column1Row1;
    result[5] = column1Row2;
    result[6] = column2Row0;
    result[7] = column2Row1;
    result[8] = column2Row2;
    return result;
  }
  /**
   * Computes the sum of two matrices.
   *
   * @param {Matrix3} left The first matrix.
   * @param {Matrix3} right The second matrix.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static add(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result[0] = left[0] + right[0];
    result[1] = left[1] + right[1];
    result[2] = left[2] + right[2];
    result[3] = left[3] + right[3];
    result[4] = left[4] + right[4];
    result[5] = left[5] + right[5];
    result[6] = left[6] + right[6];
    result[7] = left[7] + right[7];
    result[8] = left[8] + right[8];
    return result;
  }
  /**
   * Computes the difference of two matrices.
   *
   * @param {Matrix3} left The first matrix.
   * @param {Matrix3} right The second matrix.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static subtract(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result[0] = left[0] - right[0];
    result[1] = left[1] - right[1];
    result[2] = left[2] - right[2];
    result[3] = left[3] - right[3];
    result[4] = left[4] - right[4];
    result[5] = left[5] - right[5];
    result[6] = left[6] - right[6];
    result[7] = left[7] - right[7];
    result[8] = left[8] - right[8];
    return result;
  }
  /**
   * Computes the product of a matrix and a column vector.
   *
   * @param {Matrix3} matrix The matrix.
   * @param {Cartesian3} cartesian The column.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static multiplyByVector(matrix, cartesian, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;
    const x = matrix[0] * vX + matrix[3] * vY + matrix[6] * vZ;
    const y = matrix[1] * vX + matrix[4] * vY + matrix[7] * vZ;
    const z = matrix[2] * vX + matrix[5] * vY + matrix[8] * vZ;
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Computes the product of a matrix and a scalar.
   *
   * @param {Matrix3} matrix The matrix.
   * @param {number} scalar The number to multiply by.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static multiplyByScalar(matrix, scalar, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number("scalar", scalar);
    Check_default.typeOf.object("result", result);
    result[0] = matrix[0] * scalar;
    result[1] = matrix[1] * scalar;
    result[2] = matrix[2] * scalar;
    result[3] = matrix[3] * scalar;
    result[4] = matrix[4] * scalar;
    result[5] = matrix[5] * scalar;
    result[6] = matrix[6] * scalar;
    result[7] = matrix[7] * scalar;
    result[8] = matrix[8] * scalar;
    return result;
  }
  /**
   * Computes the product of a matrix times a (non-uniform) scale, as if the scale were a scale matrix.
   *
   * @param {Matrix3} matrix The matrix on the left-hand side.
   * @param {Cartesian3} scale The non-uniform scale on the right-hand side.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   *
   * @example
   * // Instead of Cesium.Matrix3.multiply(m, Cesium.Matrix3.fromScale(scale), m);
   * Cesium.Matrix3.multiplyByScale(m, scale, m);
   *
   * @see Matrix3.multiplyByUniformScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.setScale
   * @see Matrix3.setUniformScale
   * @see Matrix3.getScale
   */
  static multiplyByScale(matrix, scale, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("scale", scale);
    Check_default.typeOf.object("result", result);
    result[0] = matrix[0] * scale.x;
    result[1] = matrix[1] * scale.x;
    result[2] = matrix[2] * scale.x;
    result[3] = matrix[3] * scale.y;
    result[4] = matrix[4] * scale.y;
    result[5] = matrix[5] * scale.y;
    result[6] = matrix[6] * scale.z;
    result[7] = matrix[7] * scale.z;
    result[8] = matrix[8] * scale.z;
    return result;
  }
  /**
   * Computes the product of a matrix times a uniform scale, as if the scale were a scale matrix.
   *
   * @param {Matrix3} matrix The matrix on the left-hand side.
   * @param {number} scale The uniform scale on the right-hand side.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @example
   * // Instead of Cesium.Matrix3.multiply(m, Cesium.Matrix3.fromUniformScale(scale), m);
   * Cesium.Matrix3.multiplyByUniformScale(m, scale, m);
   *
   * @see Matrix3.multiplyByScale
   * @see Matrix3.fromScale
   * @see Matrix3.fromUniformScale
   * @see Matrix3.setScale
   * @see Matrix3.setUniformScale
   * @see Matrix3.getScale
   */
  static multiplyByUniformScale(matrix, scale, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number("scale", scale);
    Check_default.typeOf.object("result", result);
    result[0] = matrix[0] * scale;
    result[1] = matrix[1] * scale;
    result[2] = matrix[2] * scale;
    result[3] = matrix[3] * scale;
    result[4] = matrix[4] * scale;
    result[5] = matrix[5] * scale;
    result[6] = matrix[6] * scale;
    result[7] = matrix[7] * scale;
    result[8] = matrix[8] * scale;
    return result;
  }
  /**
   * Creates a negated copy of the provided matrix.
   *
   * @param {Matrix3} matrix The matrix to negate.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static negate(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    result[0] = -matrix[0];
    result[1] = -matrix[1];
    result[2] = -matrix[2];
    result[3] = -matrix[3];
    result[4] = -matrix[4];
    result[5] = -matrix[5];
    result[6] = -matrix[6];
    result[7] = -matrix[7];
    result[8] = -matrix[8];
    return result;
  }
  /**
   * Computes the transpose of the provided matrix.
   *
   * @param {Matrix3} matrix The matrix to transpose.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static transpose(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const column0Row0 = matrix[0];
    const column0Row1 = matrix[3];
    const column0Row2 = matrix[6];
    const column1Row0 = matrix[1];
    const column1Row1 = matrix[4];
    const column1Row2 = matrix[7];
    const column2Row0 = matrix[2];
    const column2Row1 = matrix[5];
    const column2Row2 = matrix[8];
    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = column1Row0;
    result[4] = column1Row1;
    result[5] = column1Row2;
    result[6] = column2Row0;
    result[7] = column2Row1;
    result[8] = column2Row2;
    return result;
  }
  /**
   * Computes the eigenvectors and eigenvalues of a symmetric matrix.
   * <p>
   * Returns a diagonal matrix and unitary matrix such that:
   * <code>matrix = unitary matrix * diagonal matrix * transpose(unitary matrix)</code>
   * </p>
   * <p>
   * The values along the diagonal of the diagonal matrix are the eigenvalues. The columns
   * of the unitary matrix are the corresponding eigenvectors.
   * </p>
   *
   * @param {Matrix3} matrix The matrix to decompose into diagonal and unitary matrix. Expected to be symmetric.
   * @param {EigenDecompositionResult} [result] An object with unitary and diagonal properties which are matrices onto which to store the result.
   * @returns {EigenDecompositionResult} An object with unitary and diagonal properties which are the unitary and diagonal matrices, respectively.
   *
   * @example
   * const a = //... symetric matrix
   * const result = {
   *     unitary : new Cesium.Matrix3(),
   *     diagonal : new Cesium.Matrix3()
   * };
   * Cesium.Matrix3.computeEigenDecomposition(a, result);
   *
   * const unitaryTranspose = Cesium.Matrix3.transpose(result.unitary, new Cesium.Matrix3());
   * const b = Cesium.Matrix3.multiply(result.unitary, result.diagonal, new Cesium.Matrix3());
   * Cesium.Matrix3.multiply(b, unitaryTranspose, b); // b is now equal to a
   *
   * const lambda = Cesium.Matrix3.getColumn(result.diagonal, 0, new Cesium.Cartesian3()).x;  // first eigenvalue
   * const v = Cesium.Matrix3.getColumn(result.unitary, 0, new Cesium.Cartesian3());          // first eigenvector
   * const c = Cesium.Cartesian3.multiplyByScalar(v, lambda, new Cesium.Cartesian3());        // equal to Cesium.Matrix3.multiplyByVector(a, v)
   */
  static computeEigenDecomposition(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    const tolerance = Math_default.EPSILON20;
    const maxSweeps = 10;
    let count = 0;
    let sweep = 0;
    if (!defined_default(result)) {
      result = {};
    }
    const unitaryMatrix = result.unitary = _Matrix3.clone(
      _Matrix3.IDENTITY,
      result.unitary
    );
    const diagMatrix = result.diagonal = _Matrix3.clone(
      matrix,
      result.diagonal
    );
    const epsilon = tolerance * computeFrobeniusNorm(diagMatrix);
    while (sweep < maxSweeps && offDiagonalFrobeniusNorm(diagMatrix) > epsilon) {
      shurDecomposition(diagMatrix, jMatrix);
      _Matrix3.transpose(jMatrix, jMatrixTranspose);
      _Matrix3.multiply(diagMatrix, jMatrix, diagMatrix);
      _Matrix3.multiply(jMatrixTranspose, diagMatrix, diagMatrix);
      _Matrix3.multiply(unitaryMatrix, jMatrix, unitaryMatrix);
      if (++count > 2) {
        ++sweep;
        count = 0;
      }
    }
    return result;
  }
  /**
   * Computes a matrix, which contains the absolute (unsigned) values of the provided matrix's elements.
   *
   * @param {Matrix3} matrix The matrix with signed elements.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static abs(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    result[0] = Math.abs(matrix[0]);
    result[1] = Math.abs(matrix[1]);
    result[2] = Math.abs(matrix[2]);
    result[3] = Math.abs(matrix[3]);
    result[4] = Math.abs(matrix[4]);
    result[5] = Math.abs(matrix[5]);
    result[6] = Math.abs(matrix[6]);
    result[7] = Math.abs(matrix[7]);
    result[8] = Math.abs(matrix[8]);
    return result;
  }
  /**
   * Computes the determinant of the provided matrix.
   *
   * @param {Matrix3} matrix The matrix to use.
   * @returns {number} The value of the determinant of the matrix.
   */
  static determinant(matrix) {
    Check_default.typeOf.object("matrix", matrix);
    const m11 = matrix[0];
    const m21 = matrix[3];
    const m31 = matrix[6];
    const m12 = matrix[1];
    const m22 = matrix[4];
    const m32 = matrix[7];
    const m13 = matrix[2];
    const m23 = matrix[5];
    const m33 = matrix[8];
    return m11 * (m22 * m33 - m23 * m32) + m12 * (m23 * m31 - m21 * m33) + m13 * (m21 * m32 - m22 * m31);
  }
  /**
   * Computes the inverse of the provided matrix.
   *
   * @param {Matrix3} matrix The matrix to invert.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @exception {DeveloperError} matrix is not invertible.
   */
  static inverse(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const m11 = matrix[0];
    const m21 = matrix[1];
    const m31 = matrix[2];
    const m12 = matrix[3];
    const m22 = matrix[4];
    const m32 = matrix[5];
    const m13 = matrix[6];
    const m23 = matrix[7];
    const m33 = matrix[8];
    const determinant = _Matrix3.determinant(matrix);
    if (Math.abs(determinant) <= Math_default.EPSILON15) {
      throw new DeveloperError_default("matrix is not invertible");
    }
    result[0] = m22 * m33 - m23 * m32;
    result[1] = m23 * m31 - m21 * m33;
    result[2] = m21 * m32 - m22 * m31;
    result[3] = m13 * m32 - m12 * m33;
    result[4] = m11 * m33 - m13 * m31;
    result[5] = m12 * m31 - m11 * m32;
    result[6] = m12 * m23 - m13 * m22;
    result[7] = m13 * m21 - m11 * m23;
    result[8] = m11 * m22 - m12 * m21;
    const scale = 1 / determinant;
    return _Matrix3.multiplyByScalar(result, scale, result);
  }
  /**
   * Computes the inverse transpose of a matrix.
   *
   * @param {Matrix3} matrix The matrix to transpose and invert.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static inverseTranspose(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    return _Matrix3.inverse(
      _Matrix3.transpose(matrix, scratchTransposeMatrix),
      result
    );
  }
  /**
   * Compares the provided matrices componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Matrix3} [left] The first matrix.
   * @param {Matrix3} [right] The second matrix.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[3] === right[3] && left[4] === right[4] && left[5] === right[5] && left[6] === right[6] && left[7] === right[7] && left[8] === right[8];
  }
  /**
   * Compares the provided matrices componentwise and returns
   * <code>true</code> if they are within the provided epsilon,
   * <code>false</code> otherwise.
   *
   * @param {Matrix3} [left] The first matrix.
   * @param {Matrix3} [right] The second matrix.
   * @param {number} [epsilon=0] The epsilon to use for equality testing.
   * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   */
  static equalsEpsilon(left, right, epsilon) {
    epsilon = epsilon ?? 0;
    return left === right || defined_default(left) && defined_default(right) && Math.abs(left[0] - right[0]) <= epsilon && Math.abs(left[1] - right[1]) <= epsilon && Math.abs(left[2] - right[2]) <= epsilon && Math.abs(left[3] - right[3]) <= epsilon && Math.abs(left[4] - right[4]) <= epsilon && Math.abs(left[5] - right[5]) <= epsilon && Math.abs(left[6] - right[6]) <= epsilon && Math.abs(left[7] - right[7]) <= epsilon && Math.abs(left[8] - right[8]) <= epsilon;
  }
  /**
   * Gets the number of items in the collection.
   *
   * @type {number}
   */
  get length() {
    return _Matrix3.packedLength;
  }
  /**
   * Duplicates the provided Matrix3 instance.
   *
   * @param {Matrix3} [result] The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
   */
  clone(result) {
    return _Matrix3.clone(this, result);
  }
  /**
   * Compares this matrix to the provided matrix componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Matrix3} [right] The right hand side matrix.
   * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
   */
  equals(right) {
    return _Matrix3.equals(this, right);
  }
  /**
   * Compares provided matrix and array, starting from a given array offset.
   *
   * @param {Matrix3} matrix
   * @param {number[]} array
   * @param {number} offset
   * @ignore
   */
  static equalsArray(matrix, array, offset) {
    return matrix[0] === array[offset] && matrix[1] === array[offset + 1] && matrix[2] === array[offset + 2] && matrix[3] === array[offset + 3] && matrix[4] === array[offset + 4] && matrix[5] === array[offset + 5] && matrix[6] === array[offset + 6] && matrix[7] === array[offset + 7] && matrix[8] === array[offset + 8];
  }
  /**
   * Compares this matrix to the provided matrix componentwise and returns
   * <code>true</code> if they are within the provided epsilon,
   * <code>false</code> otherwise.
   *
   * @param {Matrix3} [right] The right hand side matrix.
   * @param {number} [epsilon=0] The epsilon to use for equality testing.
   * @returns {boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
   */
  equalsEpsilon(right, epsilon) {
    return _Matrix3.equalsEpsilon(this, right, epsilon);
  }
  /**
   * Creates a string representing this Matrix with each row being
   * on a separate line and in the format '(column0, column1, column2)'.
   *
   * @returns {string} A string representing the provided Matrix with each row being on a separate line and in the format '(column0, column1, column2)'.
   */
  toString() {
    return `(${this[0]}, ${this[3]}, ${this[6]})
(${this[1]}, ${this[4]}, ${this[7]})
(${this[2]}, ${this[5]}, ${this[8]})`;
  }
};
Matrix3.packedLength = 9;
Matrix3.fromArray = Matrix3.unpack;
Matrix3.IDENTITY = Object.freeze(
  new Matrix3(1, 0, 0, 0, 1, 0, 0, 0, 1)
);
Matrix3.ZERO = Object.freeze(
  new Matrix3(0, 0, 0, 0, 0, 0, 0, 0, 0)
);
Matrix3.COLUMN0ROW0 = 0;
Matrix3.COLUMN0ROW1 = 1;
Matrix3.COLUMN0ROW2 = 2;
Matrix3.COLUMN1ROW0 = 3;
Matrix3.COLUMN1ROW1 = 4;
Matrix3.COLUMN1ROW2 = 5;
Matrix3.COLUMN2ROW0 = 6;
Matrix3.COLUMN2ROW1 = 7;
Matrix3.COLUMN2ROW2 = 8;
var scaleScratch1 = new Cartesian3_default();
var scaleScratch2 = new Cartesian3_default();
var scratchColumn = new Cartesian3_default();
var scaleScratch3 = new Cartesian3_default();
var scaleScratch4 = new Cartesian3_default();
var scaleScratch5 = new Cartesian3_default();
var jMatrix = new Matrix3();
var jMatrixTranspose = new Matrix3();
var scratchTransposeMatrix = new Matrix3();
function computeFrobeniusNorm(matrix) {
  let norm = 0;
  for (let i = 0; i < 9; ++i) {
    const temp = matrix[i];
    norm += temp * temp;
  }
  return Math.sqrt(norm);
}
var rowVal = [1, 0, 0];
var colVal = [2, 2, 1];
function offDiagonalFrobeniusNorm(matrix) {
  let norm = 0;
  for (let i = 0; i < 3; ++i) {
    const temp = matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])];
    norm += 2 * temp * temp;
  }
  return Math.sqrt(norm);
}
function shurDecomposition(matrix, result) {
  const tolerance = Math_default.EPSILON15;
  let maxDiagonal = 0;
  let rotAxis = 1;
  for (let i = 0; i < 3; ++i) {
    const temp = Math.abs(
      // @ts-expect-error TODO(tsd-jsdoc): Requires index signature support.
      matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])]
    );
    if (temp > maxDiagonal) {
      rotAxis = i;
      maxDiagonal = temp;
    }
  }
  let c = 1;
  let s = 0;
  const p = rowVal[rotAxis];
  const q = colVal[rotAxis];
  if (Math.abs(matrix[Matrix3.getElementIndex(q, p)]) > tolerance) {
    const qq = matrix[Matrix3.getElementIndex(q, q)];
    const pp = matrix[Matrix3.getElementIndex(p, p)];
    const qp = matrix[Matrix3.getElementIndex(q, p)];
    const tau = (qq - pp) / 2 / qp;
    let t;
    if (tau < 0) {
      t = -1 / (-tau + Math.sqrt(1 + tau * tau));
    } else {
      t = 1 / (tau + Math.sqrt(1 + tau * tau));
    }
    c = 1 / Math.sqrt(1 + t * t);
    s = t * c;
  }
  result = Matrix3.clone(Matrix3.IDENTITY, result);
  result[Matrix3.getElementIndex(p, p)] = result[Matrix3.getElementIndex(q, q)] = c;
  result[Matrix3.getElementIndex(q, p)] = s;
  result[Matrix3.getElementIndex(p, q)] = -s;
  return result;
}
var Matrix3_default = Matrix3;

// node_modules/@cesium/engine/Source/Core/Matrix4.js
var Matrix4 = class _Matrix4 {
  /**
   * @param {number} [column0Row0=0.0] The value for column 0, row 0.
   * @param {number} [column1Row0=0.0] The value for column 1, row 0.
   * @param {number} [column2Row0=0.0] The value for column 2, row 0.
   * @param {number} [column3Row0=0.0] The value for column 3, row 0.
   * @param {number} [column0Row1=0.0] The value for column 0, row 1.
   * @param {number} [column1Row1=0.0] The value for column 1, row 1.
   * @param {number} [column2Row1=0.0] The value for column 2, row 1.
   * @param {number} [column3Row1=0.0] The value for column 3, row 1.
   * @param {number} [column0Row2=0.0] The value for column 0, row 2.
   * @param {number} [column1Row2=0.0] The value for column 1, row 2.
   * @param {number} [column2Row2=0.0] The value for column 2, row 2.
   * @param {number} [column3Row2=0.0] The value for column 3, row 2.
   * @param {number} [column0Row3=0.0] The value for column 0, row 3.
   * @param {number} [column1Row3=0.0] The value for column 1, row 3.
   * @param {number} [column2Row3=0.0] The value for column 2, row 3.
   * @param {number} [column3Row3=0.0] The value for column 3, row 3.
   */
  constructor(column0Row0, column1Row0, column2Row0, column3Row0, column0Row1, column1Row1, column2Row1, column3Row1, column0Row2, column1Row2, column2Row2, column3Row2, column0Row3, column1Row3, column2Row3, column3Row3) {
    this[0] = column0Row0 ?? 0;
    this[1] = column0Row1 ?? 0;
    this[2] = column0Row2 ?? 0;
    this[3] = column0Row3 ?? 0;
    this[4] = column1Row0 ?? 0;
    this[5] = column1Row1 ?? 0;
    this[6] = column1Row2 ?? 0;
    this[7] = column1Row3 ?? 0;
    this[8] = column2Row0 ?? 0;
    this[9] = column2Row1 ?? 0;
    this[10] = column2Row2 ?? 0;
    this[11] = column2Row3 ?? 0;
    this[12] = column3Row0 ?? 0;
    this[13] = column3Row1 ?? 0;
    this[14] = column3Row2 ?? 0;
    this[15] = column3Row3 ?? 0;
  }
  /**
   * Stores the provided instance into the provided array.
   *
   * @param {Matrix4} value The value to pack.
   * @param {number[]} array The array to pack into.
   * @param {number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {number[]} The array that was packed into
   */
  static pack(value, array, startingIndex) {
    Check_default.typeOf.object("value", value);
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    array[startingIndex++] = value[0];
    array[startingIndex++] = value[1];
    array[startingIndex++] = value[2];
    array[startingIndex++] = value[3];
    array[startingIndex++] = value[4];
    array[startingIndex++] = value[5];
    array[startingIndex++] = value[6];
    array[startingIndex++] = value[7];
    array[startingIndex++] = value[8];
    array[startingIndex++] = value[9];
    array[startingIndex++] = value[10];
    array[startingIndex++] = value[11];
    array[startingIndex++] = value[12];
    array[startingIndex++] = value[13];
    array[startingIndex++] = value[14];
    array[startingIndex] = value[15];
    return array;
  }
  /**
   * Retrieves an instance from a packed array.
   *
   * @param {number[]} array The packed array.
   * @param {number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {Matrix4} [result] The object into which to store the result.
   * @returns {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
   */
  static unpack(array, startingIndex, result) {
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    if (!defined_default(result)) {
      result = new _Matrix4();
    }
    result[0] = array[startingIndex++];
    result[1] = array[startingIndex++];
    result[2] = array[startingIndex++];
    result[3] = array[startingIndex++];
    result[4] = array[startingIndex++];
    result[5] = array[startingIndex++];
    result[6] = array[startingIndex++];
    result[7] = array[startingIndex++];
    result[8] = array[startingIndex++];
    result[9] = array[startingIndex++];
    result[10] = array[startingIndex++];
    result[11] = array[startingIndex++];
    result[12] = array[startingIndex++];
    result[13] = array[startingIndex++];
    result[14] = array[startingIndex++];
    result[15] = array[startingIndex];
    return result;
  }
  /**
   * Flattens an array of Matrix4s into an array of components. The components
   * are stored in column-major order.
   *
   * @param {Matrix4[]} array The array of matrices to pack.
   * @param {number[]} [result] The array onto which to store the result. If this is a typed array, it must have array.length * 16 components, else a {@link DeveloperError} will be thrown. If it is a regular array, it will be resized to have (array.length * 16) elements.
   * @returns {number[]} The packed array.
   */
  static packArray(array, result) {
    Check_default.defined("array", array);
    const length = array.length;
    const resultLength = length * 16;
    if (!defined_default(result)) {
      result = new Array(resultLength);
    } else if (!Array.isArray(result) && result.length !== resultLength) {
      throw new DeveloperError_default(
        "If result is a typed array, it must have exactly array.length * 16 elements"
      );
    } else if (result.length !== resultLength) {
      result.length = resultLength;
    }
    for (let i = 0; i < length; ++i) {
      _Matrix4.pack(array[i], result, i * 16);
    }
    return result;
  }
  /**
   * Unpacks an array of column-major matrix components into an array of Matrix4s.
   *
   * @param {number[]} array The array of components to unpack.
   * @param {Matrix4[]} [result] The array onto which to store the result.
   * @returns {Matrix4[]} The unpacked array.
   */
  static unpackArray(array, result) {
    Check_default.defined("array", array);
    Check_default.typeOf.number.greaterThanOrEquals("array.length", array.length, 16);
    if (array.length % 16 !== 0) {
      throw new DeveloperError_default("array length must be a multiple of 16.");
    }
    const length = array.length;
    if (!defined_default(result)) {
      result = new Array(length / 16);
    } else {
      result.length = length / 16;
    }
    for (let i = 0; i < length; i += 16) {
      const index = i / 16;
      result[index] = _Matrix4.unpack(array, i, result[index]);
    }
    return result;
  }
  /**
   * Duplicates a Matrix4 instance.
   *
   * @param {Matrix4} matrix The matrix to duplicate.
   * @param {Matrix4} [result] The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided. (Returns undefined if matrix is undefined)
   */
  static clone(matrix, result) {
    if (!defined_default(matrix)) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Matrix4(
        matrix[0],
        matrix[4],
        matrix[8],
        matrix[12],
        matrix[1],
        matrix[5],
        matrix[9],
        matrix[13],
        matrix[2],
        matrix[6],
        matrix[10],
        matrix[14],
        matrix[3],
        matrix[7],
        matrix[11],
        matrix[15]
      );
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
  /**
   * Computes a Matrix4 instance from a column-major order array.
   *
   * @param {number[]} values The column-major order array.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   */
  static fromColumnMajorArray(values, result) {
    Check_default.defined("values", values);
    return _Matrix4.clone(values, result);
  }
  /**
   * Computes a Matrix4 instance from a row-major order array.
   * The resulting matrix will be in column-major order.
   *
   * @param {number[]} values The row-major order array.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   */
  static fromRowMajorArray(values, result) {
    Check_default.defined("values", values);
    if (!defined_default(result)) {
      return new _Matrix4(
        values[0],
        values[1],
        values[2],
        values[3],
        values[4],
        values[5],
        values[6],
        values[7],
        values[8],
        values[9],
        values[10],
        values[11],
        values[12],
        values[13],
        values[14],
        values[15]
      );
    }
    result[0] = values[0];
    result[1] = values[4];
    result[2] = values[8];
    result[3] = values[12];
    result[4] = values[1];
    result[5] = values[5];
    result[6] = values[9];
    result[7] = values[13];
    result[8] = values[2];
    result[9] = values[6];
    result[10] = values[10];
    result[11] = values[14];
    result[12] = values[3];
    result[13] = values[7];
    result[14] = values[11];
    result[15] = values[15];
    return result;
  }
  /**
   * Computes a Matrix4 instance from a Matrix3 representing the rotation
   * and a Cartesian3 representing the translation.
   *
   * @param {Matrix3} rotation The upper left portion of the matrix representing the rotation.
   * @param {Cartesian3} [translation=Cartesian3.ZERO] The upper right portion of the matrix representing the translation.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   */
  static fromRotationTranslation(rotation, translation, result) {
    Check_default.typeOf.object("rotation", rotation);
    translation = translation ?? Cartesian3_default.ZERO;
    if (!defined_default(result)) {
      return new _Matrix4(
        rotation[0],
        rotation[3],
        rotation[6],
        translation.x,
        rotation[1],
        rotation[4],
        rotation[7],
        translation.y,
        rotation[2],
        rotation[5],
        rotation[8],
        translation.z,
        0,
        0,
        0,
        1
      );
    }
    result[0] = rotation[0];
    result[1] = rotation[1];
    result[2] = rotation[2];
    result[3] = 0;
    result[4] = rotation[3];
    result[5] = rotation[4];
    result[6] = rotation[5];
    result[7] = 0;
    result[8] = rotation[6];
    result[9] = rotation[7];
    result[10] = rotation[8];
    result[11] = 0;
    result[12] = translation.x;
    result[13] = translation.y;
    result[14] = translation.z;
    result[15] = 1;
    return result;
  }
  /**
   * Computes a Matrix4 instance from a translation, rotation, and scale (TRS)
   * representation with the rotation represented as a quaternion.
   *
   * @param {Cartesian3} translation The translation transformation.
   * @param {Quaternion} rotation The rotation transformation.
   * @param {Cartesian3} scale The non-uniform scale transformation.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   *
   * @example
   * const result = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
   *   new Cesium.Cartesian3(1.0, 2.0, 3.0), // translation
   *   Cesium.Quaternion.IDENTITY,           // rotation
   *   new Cesium.Cartesian3(7.0, 8.0, 9.0), // scale
   *   result);
   */
  static fromTranslationQuaternionRotationScale(translation, rotation, scale, result) {
    Check_default.typeOf.object("translation", translation);
    Check_default.typeOf.object("rotation", rotation);
    Check_default.typeOf.object("scale", scale);
    if (!defined_default(result)) {
      result = new _Matrix4();
    }
    const scaleX = scale.x;
    const scaleY = scale.y;
    const scaleZ = scale.z;
    const x2 = rotation.x * rotation.x;
    const xy = rotation.x * rotation.y;
    const xz = rotation.x * rotation.z;
    const xw = rotation.x * rotation.w;
    const y2 = rotation.y * rotation.y;
    const yz = rotation.y * rotation.z;
    const yw = rotation.y * rotation.w;
    const z2 = rotation.z * rotation.z;
    const zw = rotation.z * rotation.w;
    const w2 = rotation.w * rotation.w;
    const m00 = x2 - y2 - z2 + w2;
    const m01 = 2 * (xy - zw);
    const m02 = 2 * (xz + yw);
    const m10 = 2 * (xy + zw);
    const m11 = -x2 + y2 - z2 + w2;
    const m12 = 2 * (yz - xw);
    const m20 = 2 * (xz - yw);
    const m21 = 2 * (yz + xw);
    const m22 = -x2 - y2 + z2 + w2;
    result[0] = m00 * scaleX;
    result[1] = m10 * scaleX;
    result[2] = m20 * scaleX;
    result[3] = 0;
    result[4] = m01 * scaleY;
    result[5] = m11 * scaleY;
    result[6] = m21 * scaleY;
    result[7] = 0;
    result[8] = m02 * scaleZ;
    result[9] = m12 * scaleZ;
    result[10] = m22 * scaleZ;
    result[11] = 0;
    result[12] = translation.x;
    result[13] = translation.y;
    result[14] = translation.z;
    result[15] = 1;
    return result;
  }
  /**
   * Creates a Matrix4 instance from a {@link TranslationRotationScale} instance.
   *
   * @param {TranslationRotationScale} translationRotationScale The instance.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   */
  static fromTranslationRotationScale(translationRotationScale, result) {
    Check_default.typeOf.object("translationRotationScale", translationRotationScale);
    return _Matrix4.fromTranslationQuaternionRotationScale(
      translationRotationScale.translation,
      translationRotationScale.rotation,
      translationRotationScale.scale,
      result
    );
  }
  /**
   * Creates a Matrix4 instance from a Cartesian3 representing the translation.
   *
   * @param {Cartesian3} translation The upper right portion of the matrix representing the translation.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   *
   * @see Matrix4.multiplyByTranslation
   */
  static fromTranslation(translation, result) {
    Check_default.typeOf.object("translation", translation);
    return _Matrix4.fromRotationTranslation(
      Matrix3_default.IDENTITY,
      translation,
      result
    );
  }
  /**
   * Computes a Matrix4 instance representing a non-uniform scale.
   *
   * @param {Cartesian3} scale The x, y, and z scale factors.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   *
   * @example
   * // Creates
   * //   [7.0, 0.0, 0.0, 0.0]
   * //   [0.0, 8.0, 0.0, 0.0]
   * //   [0.0, 0.0, 9.0, 0.0]
   * //   [0.0, 0.0, 0.0, 1.0]
   * const m = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(7.0, 8.0, 9.0));
   */
  static fromScale(scale, result) {
    Check_default.typeOf.object("scale", scale);
    if (!defined_default(result)) {
      return new _Matrix4(
        scale.x,
        0,
        0,
        0,
        0,
        scale.y,
        0,
        0,
        0,
        0,
        scale.z,
        0,
        0,
        0,
        0,
        1
      );
    }
    result[0] = scale.x;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = scale.y;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = scale.z;
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
    return result;
  }
  /**
   * Computes a Matrix4 instance representing a uniform scale.
   *
   * @param {number} scale The uniform scale factor.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   *
   * @example
   * // Creates
   * //   [2.0, 0.0, 0.0, 0.0]
   * //   [0.0, 2.0, 0.0, 0.0]
   * //   [0.0, 0.0, 2.0, 0.0]
   * //   [0.0, 0.0, 0.0, 1.0]
   * const m = Cesium.Matrix4.fromUniformScale(2.0);
   */
  static fromUniformScale(scale, result) {
    Check_default.typeOf.number("scale", scale);
    if (!defined_default(result)) {
      return new _Matrix4(
        scale,
        0,
        0,
        0,
        0,
        scale,
        0,
        0,
        0,
        0,
        scale,
        0,
        0,
        0,
        0,
        1
      );
    }
    result[0] = scale;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = scale;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = scale;
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
    return result;
  }
  /**
   * Creates a rotation matrix.
   *
   * @param {Matrix3} rotation The rotation matrix.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   */
  static fromRotation(rotation, result) {
    Check_default.typeOf.object("rotation", rotation);
    if (!defined_default(result)) {
      result = new _Matrix4();
    }
    result[0] = rotation[0];
    result[1] = rotation[1];
    result[2] = rotation[2];
    result[3] = 0;
    result[4] = rotation[3];
    result[5] = rotation[4];
    result[6] = rotation[5];
    result[7] = 0;
    result[8] = rotation[6];
    result[9] = rotation[7];
    result[10] = rotation[8];
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
    return result;
  }
  /**
   * Computes a Matrix4 instance from a Camera.
   *
   * @param {Camera} camera The camera to use.
   * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
   * @returns {Matrix4} The modified result parameter, or a new Matrix4 instance if one was not provided.
   */
  static fromCamera(camera, result) {
    Check_default.typeOf.object("camera", camera);
    const position = camera.position;
    const direction = camera.direction;
    const up = camera.up;
    Check_default.typeOf.object("camera.position", position);
    Check_default.typeOf.object("camera.direction", direction);
    Check_default.typeOf.object("camera.up", up);
    Cartesian3_default.normalize(direction, fromCameraF);
    Cartesian3_default.normalize(
      Cartesian3_default.cross(fromCameraF, up, fromCameraR),
      fromCameraR
    );
    Cartesian3_default.normalize(
      Cartesian3_default.cross(fromCameraR, fromCameraF, fromCameraU),
      fromCameraU
    );
    const sX = fromCameraR.x;
    const sY = fromCameraR.y;
    const sZ = fromCameraR.z;
    const fX = fromCameraF.x;
    const fY = fromCameraF.y;
    const fZ = fromCameraF.z;
    const uX = fromCameraU.x;
    const uY = fromCameraU.y;
    const uZ = fromCameraU.z;
    const positionX = position.x;
    const positionY = position.y;
    const positionZ = position.z;
    const t0 = sX * -positionX + sY * -positionY + sZ * -positionZ;
    const t1 = uX * -positionX + uY * -positionY + uZ * -positionZ;
    const t2 = fX * positionX + fY * positionY + fZ * positionZ;
    if (!defined_default(result)) {
      return new _Matrix4(
        sX,
        sY,
        sZ,
        t0,
        uX,
        uY,
        uZ,
        t1,
        -fX,
        -fY,
        -fZ,
        t2,
        0,
        0,
        0,
        1
      );
    }
    result[0] = sX;
    result[1] = uX;
    result[2] = -fX;
    result[3] = 0;
    result[4] = sY;
    result[5] = uY;
    result[6] = -fY;
    result[7] = 0;
    result[8] = sZ;
    result[9] = uZ;
    result[10] = -fZ;
    result[11] = 0;
    result[12] = t0;
    result[13] = t1;
    result[14] = t2;
    result[15] = 1;
    return result;
  }
  /**
   * Computes a Matrix4 instance representing a perspective transformation matrix.
   *
   * @param {number} fovY The field of view along the Y axis in radians.
   * @param {number} aspectRatio The aspect ratio.
   * @param {number} near The distance to the near plane in meters.
   * @param {number} far The distance to the far plane in meters.
   * @param {Matrix4} result The object in which the result will be stored.
   * @returns {Matrix4} The modified result parameter.
   *
   * @exception {DeveloperError} fovY must be in (0, PI].
   * @exception {DeveloperError} aspectRatio must be greater than zero.
   * @exception {DeveloperError} near must be greater than zero.
   * @exception {DeveloperError} far must be greater than zero.
   */
  static computePerspectiveFieldOfView(fovY, aspectRatio, near, far, result) {
    Check_default.typeOf.number.greaterThan("fovY", fovY, 0);
    Check_default.typeOf.number.lessThan("fovY", fovY, Math.PI);
    Check_default.typeOf.number.greaterThan("near", near, 0);
    Check_default.typeOf.number.greaterThan("far", far, 0);
    Check_default.typeOf.object("result", result);
    const bottom = Math.tan(fovY * 0.5);
    const column1Row1 = 1 / bottom;
    const column0Row0 = column1Row1 / aspectRatio;
    const column2Row2 = (far + near) / (near - far);
    const column3Row2 = 2 * far * near / (near - far);
    result[0] = column0Row0;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = column1Row1;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = column2Row2;
    result[11] = -1;
    result[12] = 0;
    result[13] = 0;
    result[14] = column3Row2;
    result[15] = 0;
    return result;
  }
  /**
   * Computes a Matrix4 instance representing an orthographic transformation matrix.
   *
   * @param {number} left The number of meters to the left of the camera that will be in view.
   * @param {number} right The number of meters to the right of the camera that will be in view.
   * @param {number} bottom The number of meters below of the camera that will be in view.
   * @param {number} top The number of meters above of the camera that will be in view.
   * @param {number} near The distance to the near plane in meters.
   * @param {number} far The distance to the far plane in meters.
   * @param {Matrix4} result The object in which the result will be stored.
   * @returns {Matrix4} The modified result parameter.
   */
  static computeOrthographicOffCenter(left, right, bottom, top, near, far, result) {
    Check_default.typeOf.number("left", left);
    Check_default.typeOf.number("right", right);
    Check_default.typeOf.number("bottom", bottom);
    Check_default.typeOf.number("top", top);
    Check_default.typeOf.number("near", near);
    Check_default.typeOf.number("far", far);
    Check_default.typeOf.object("result", result);
    let a3 = 1 / (right - left);
    let b = 1 / (top - bottom);
    let c = 1 / (far - near);
    const tx = -(right + left) * a3;
    const ty = -(top + bottom) * b;
    const tz = -(far + near) * c;
    a3 *= 2;
    b *= 2;
    c *= -2;
    result[0] = a3;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = b;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = c;
    result[11] = 0;
    result[12] = tx;
    result[13] = ty;
    result[14] = tz;
    result[15] = 1;
    return result;
  }
  /**
   * Computes a Matrix4 instance representing an off center perspective transformation.
   *
   * @param {number} left The number of meters to the left of the camera that will be in view.
   * @param {number} right The number of meters to the right of the camera that will be in view.
   * @param {number} bottom The number of meters below the camera that will be in view.
   * @param {number} top The number of meters above the camera that will be in view.
   * @param {number} near The distance to the near plane in meters.
   * @param {number} far The distance to the far plane in meters.
   * @param {Matrix4} result The object in which the result will be stored.
   * @returns {Matrix4} The modified result parameter.
   */
  static computePerspectiveOffCenter(left, right, bottom, top, near, far, result) {
    Check_default.typeOf.number("left", left);
    Check_default.typeOf.number("right", right);
    Check_default.typeOf.number("bottom", bottom);
    Check_default.typeOf.number("top", top);
    Check_default.typeOf.number("near", near);
    Check_default.typeOf.number("far", far);
    Check_default.typeOf.object("result", result);
    const column0Row0 = 2 * near / (right - left);
    const column1Row1 = 2 * near / (top - bottom);
    const column2Row0 = (right + left) / (right - left);
    const column2Row1 = (top + bottom) / (top - bottom);
    const column2Row2 = -(far + near) / (far - near);
    const column2Row3 = -1;
    const column3Row2 = -2 * far * near / (far - near);
    result[0] = column0Row0;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = column1Row1;
    result[6] = 0;
    result[7] = 0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = column2Row3;
    result[12] = 0;
    result[13] = 0;
    result[14] = column3Row2;
    result[15] = 0;
    return result;
  }
  /**
   * Computes a Matrix4 instance representing an infinite off center perspective transformation.
   *
   * @param {number} left The number of meters to the left of the camera that will be in view.
   * @param {number} right The number of meters to the right of the camera that will be in view.
   * @param {number} bottom The number of meters below of the camera that will be in view.
   * @param {number} top The number of meters above of the camera that will be in view.
   * @param {number} near The distance to the near plane in meters.
   * @param {Matrix4} result The object in which the result will be stored.
   * @returns {Matrix4} The modified result parameter.
   */
  static computeInfinitePerspectiveOffCenter(left, right, bottom, top, near, result) {
    Check_default.typeOf.number("left", left);
    Check_default.typeOf.number("right", right);
    Check_default.typeOf.number("bottom", bottom);
    Check_default.typeOf.number("top", top);
    Check_default.typeOf.number("near", near);
    Check_default.typeOf.object("result", result);
    const column0Row0 = 2 * near / (right - left);
    const column1Row1 = 2 * near / (top - bottom);
    const column2Row0 = (right + left) / (right - left);
    const column2Row1 = (top + bottom) / (top - bottom);
    const column2Row2 = -1;
    const column2Row3 = -1;
    const column3Row2 = -2 * near;
    result[0] = column0Row0;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = column1Row1;
    result[6] = 0;
    result[7] = 0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = column2Row3;
    result[12] = 0;
    result[13] = 0;
    result[14] = column3Row2;
    result[15] = 0;
    return result;
  }
  /**
   * Computes a Matrix4 instance that transforms from normalized device coordinates to window coordinates.
   *
   * @param {Viewport} [viewport = { x : 0.0, y : 0.0, width : 0.0, height : 0.0 }] The viewport's corners as shown in Example 1.
   * @param {number} [nearDepthRange=0.0] The near plane distance in window coordinates.
   * @param {number} [farDepthRange=1.0] The far plane distance in window coordinates.
   * @param {Matrix4} [result] The object in which the result will be stored.
   * @returns {Matrix4} The modified result parameter.
   *
   * @example
   * // Create viewport transformation using an explicit viewport and depth range.
   * const m = Cesium.Matrix4.computeViewportTransformation({
   *     x : 0.0,
   *     y : 0.0,
   *     width : 1024.0,
   *     height : 768.0
   * }, 0.0, 1.0, new Cesium.Matrix4());
   */
  static computeViewportTransformation(viewport, nearDepthRange, farDepthRange, result) {
    if (!defined_default(result)) {
      result = new _Matrix4();
    }
    viewport = viewport ?? Frozen_default.EMPTY_OBJECT;
    const x = viewport.x ?? 0;
    const y = viewport.y ?? 0;
    const width = viewport.width ?? 0;
    const height = viewport.height ?? 0;
    nearDepthRange = nearDepthRange ?? 0;
    farDepthRange = farDepthRange ?? 1;
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    const halfDepth = (farDepthRange - nearDepthRange) * 0.5;
    const column0Row0 = halfWidth;
    const column1Row1 = halfHeight;
    const column2Row2 = halfDepth;
    const column3Row0 = x + halfWidth;
    const column3Row1 = y + halfHeight;
    const column3Row2 = nearDepthRange + halfDepth;
    const column3Row3 = 1;
    result[0] = column0Row0;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = column1Row1;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = column2Row2;
    result[11] = 0;
    result[12] = column3Row0;
    result[13] = column3Row1;
    result[14] = column3Row2;
    result[15] = column3Row3;
    return result;
  }
  /**
   * Computes a Matrix4 instance that transforms from world space to view space.
   *
   * @param {Cartesian3} position The position of the camera.
   * @param {Cartesian3} direction The forward direction.
   * @param {Cartesian3} up The up direction.
   * @param {Cartesian3} right The right direction.
   * @param {Matrix4} result The object in which the result will be stored.
   * @returns {Matrix4} The modified result parameter.
   */
  static computeView(position, direction, up, right, result) {
    Check_default.typeOf.object("position", position);
    Check_default.typeOf.object("direction", direction);
    Check_default.typeOf.object("up", up);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result[0] = right.x;
    result[1] = up.x;
    result[2] = -direction.x;
    result[3] = 0;
    result[4] = right.y;
    result[5] = up.y;
    result[6] = -direction.y;
    result[7] = 0;
    result[8] = right.z;
    result[9] = up.z;
    result[10] = -direction.z;
    result[11] = 0;
    result[12] = -Cartesian3_default.dot(right, position);
    result[13] = -Cartesian3_default.dot(up, position);
    result[14] = Cartesian3_default.dot(direction, position);
    result[15] = 1;
    return result;
  }
  /**
   * Computes an Array from the provided Matrix4 instance.
   * The array will be in column-major order.
   *
   * @param {Matrix4} matrix The matrix to use..
   * @param {number[]} [result] The Array onto which to store the result.
   * @returns {number[]} The modified Array parameter or a new Array instance if one was not provided.
   *
   * @example
   * //create an array from an instance of Matrix4
   * // m = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   * const a = Cesium.Matrix4.toArray(m);
   *
   * // m remains the same
   * //creates a = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0]
   */
  static toArray(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    if (!defined_default(result)) {
      return [
        matrix[0],
        matrix[1],
        matrix[2],
        matrix[3],
        matrix[4],
        matrix[5],
        matrix[6],
        matrix[7],
        matrix[8],
        matrix[9],
        matrix[10],
        matrix[11],
        matrix[12],
        matrix[13],
        matrix[14],
        matrix[15]
      ];
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
  /**
   * Computes the array index of the element at the provided row and column.
   *
   * @param {number} row The zero-based index of the row.
   * @param {number} column The zero-based index of the column.
   * @returns {number} The index of the element at the provided row and column.
   *
   * @exception {DeveloperError} row must be 0, 1, 2, or 3.
   * @exception {DeveloperError} column must be 0, 1, 2, or 3.
   *
   * @example
   * const myMatrix = new Cesium.Matrix4();
   * const column1Row0Index = Cesium.Matrix4.getElementIndex(1, 0);
   * const column1Row0 = myMatrix[column1Row0Index];
   * myMatrix[column1Row0Index] = 10.0;
   */
  static getElementIndex(column, row) {
    Check_default.typeOf.number.greaterThanOrEquals("row", row, 0);
    Check_default.typeOf.number.lessThanOrEquals("row", row, 3);
    Check_default.typeOf.number.greaterThanOrEquals("column", column, 0);
    Check_default.typeOf.number.lessThanOrEquals("column", column, 3);
    return column * 4 + row;
  }
  /**
   * Retrieves a copy of the matrix column at the provided index as a Cartesian4 instance.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {number} index The zero-based index of the column to retrieve.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, 2, or 3.
   *
   * @example
   * //returns a Cartesian4 instance with values from the specified column
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * //Example 1: Creates an instance of Cartesian
   * const a = Cesium.Matrix4.getColumn(m, 2, new Cesium.Cartesian4());
   *
   * @example
   * //Example 2: Sets values for Cartesian instance
   * const a = new Cesium.Cartesian4();
   * Cesium.Matrix4.getColumn(m, 2, a);
   *
   * // a.x = 12.0; a.y = 16.0; a.z = 20.0; a.w = 24.0;
   */
  static getColumn(matrix, index, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check_default.typeOf.number.lessThanOrEquals("index", index, 3);
    Check_default.typeOf.object("result", result);
    const startIndex = index * 4;
    const x = matrix[startIndex];
    const y = matrix[startIndex + 1];
    const z = matrix[startIndex + 2];
    const w = matrix[startIndex + 3];
    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }
  /**
   * Computes a new matrix that replaces the specified column in the provided matrix with the provided Cartesian4 instance.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {number} index The zero-based index of the column to set.
   * @param {Cartesian4} cartesian The Cartesian whose values will be assigned to the specified column.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, 2, or 3.
   *
   * @example
   * //creates a new Matrix4 instance with new column values from the Cartesian4 instance
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.setColumn(m, 2, new Cesium.Cartesian4(99.0, 98.0, 97.0, 96.0), new Cesium.Matrix4());
   *
   * // m remains the same
   * // a = [10.0, 11.0, 99.0, 13.0]
   * //     [14.0, 15.0, 98.0, 17.0]
   * //     [18.0, 19.0, 97.0, 21.0]
   * //     [22.0, 23.0, 96.0, 25.0]
   */
  static setColumn(matrix, index, cartesian, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check_default.typeOf.number.lessThanOrEquals("index", index, 3);
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result = _Matrix4.clone(matrix, result);
    const startIndex = index * 4;
    result[startIndex] = cartesian.x;
    result[startIndex + 1] = cartesian.y;
    result[startIndex + 2] = cartesian.z;
    result[startIndex + 3] = cartesian.w;
    return result;
  }
  /**
   * Retrieves a copy of the matrix row at the provided index as a Cartesian4 instance.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {number} index The zero-based index of the row to retrieve.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, 2, or 3.
   *
   * @example
   * //returns a Cartesian4 instance with values from the specified column
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * //Example 1: Returns an instance of Cartesian
   * const a = Cesium.Matrix4.getRow(m, 2, new Cesium.Cartesian4());
   *
   * @example
   * //Example 2: Sets values for a Cartesian instance
   * const a = new Cesium.Cartesian4();
   * Cesium.Matrix4.getRow(m, 2, a);
   *
   * // a.x = 18.0; a.y = 19.0; a.z = 20.0; a.w = 21.0;
   */
  static getRow(matrix, index, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check_default.typeOf.number.lessThanOrEquals("index", index, 3);
    Check_default.typeOf.object("result", result);
    const x = matrix[index];
    const y = matrix[index + 4];
    const z = matrix[index + 8];
    const w = matrix[index + 12];
    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }
  /**
   * Computes a new matrix that replaces the specified row in the provided matrix with the provided Cartesian4 instance.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {number} index The zero-based index of the row to set.
   * @param {Cartesian4} cartesian The Cartesian whose values will be assigned to the specified row.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, 2, or 3.
   *
   * @example
   * //create a new Matrix4 instance with new row values from the Cartesian4 instance
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.setRow(m, 2, new Cesium.Cartesian4(99.0, 98.0, 97.0, 96.0), new Cesium.Matrix4());
   *
   * // m remains the same
   * // a = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [99.0, 98.0, 97.0, 96.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   */
  static setRow(matrix, index, cartesian, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check_default.typeOf.number.lessThanOrEquals("index", index, 3);
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    result = _Matrix4.clone(matrix, result);
    result[index] = cartesian.x;
    result[index + 4] = cartesian.y;
    result[index + 8] = cartesian.z;
    result[index + 12] = cartesian.w;
    return result;
  }
  /**
   * Computes a new matrix that replaces the translation in the rightmost column of the provided
   * matrix with the provided translation. This assumes the matrix is an affine transformation.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {Cartesian3} translation The translation that replaces the translation of the provided matrix.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   */
  static setTranslation(matrix, translation, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("translation", translation);
    Check_default.typeOf.object("result", result);
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = translation.x;
    result[13] = translation.y;
    result[14] = translation.z;
    result[15] = matrix[15];
    return result;
  }
  /**
   * Computes a new matrix that replaces the scale with the provided scale.
   * This assumes the matrix is an affine transformation.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {Cartesian3} scale The scale that replaces the scale of the provided matrix.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @see Matrix4.setUniformScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.multiplyByScale
   * @see Matrix4.multiplyByUniformScale
   * @see Matrix4.getScale
   */
  static setScale(matrix, scale, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("scale", scale);
    Check_default.typeOf.object("result", result);
    const existingScale = _Matrix4.getScale(matrix, scaleScratch12);
    const scaleRatioX = scale.x / existingScale.x;
    const scaleRatioY = scale.y / existingScale.y;
    const scaleRatioZ = scale.z / existingScale.z;
    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioX;
    result[3] = matrix[3];
    result[4] = matrix[4] * scaleRatioY;
    result[5] = matrix[5] * scaleRatioY;
    result[6] = matrix[6] * scaleRatioY;
    result[7] = matrix[7];
    result[8] = matrix[8] * scaleRatioZ;
    result[9] = matrix[9] * scaleRatioZ;
    result[10] = matrix[10] * scaleRatioZ;
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
  /**
   * Computes a new matrix that replaces the scale with the provided uniform scale.
   * This assumes the matrix is an affine transformation.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {number} scale The uniform scale that replaces the scale of the provided matrix.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @see Matrix4.setScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.multiplyByScale
   * @see Matrix4.multiplyByUniformScale
   * @see Matrix4.getScale
   */
  static setUniformScale(matrix, scale, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number("scale", scale);
    Check_default.typeOf.object("result", result);
    const existingScale = _Matrix4.getScale(matrix, scaleScratch22);
    const scaleRatioX = scale / existingScale.x;
    const scaleRatioY = scale / existingScale.y;
    const scaleRatioZ = scale / existingScale.z;
    result[0] = matrix[0] * scaleRatioX;
    result[1] = matrix[1] * scaleRatioX;
    result[2] = matrix[2] * scaleRatioX;
    result[3] = matrix[3];
    result[4] = matrix[4] * scaleRatioY;
    result[5] = matrix[5] * scaleRatioY;
    result[6] = matrix[6] * scaleRatioY;
    result[7] = matrix[7];
    result[8] = matrix[8] * scaleRatioZ;
    result[9] = matrix[9] * scaleRatioZ;
    result[10] = matrix[10] * scaleRatioZ;
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
  /**
   * Extracts the non-uniform scale assuming the matrix is an affine transformation.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter
   *
   * @see Matrix4.multiplyByScale
   * @see Matrix4.multiplyByUniformScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.setScale
   * @see Matrix4.setUniformScale
   */
  static getScale(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    result.x = Cartesian3_default.magnitude(
      Cartesian3_default.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn2)
    );
    result.y = Cartesian3_default.magnitude(
      Cartesian3_default.fromElements(matrix[4], matrix[5], matrix[6], scratchColumn2)
    );
    result.z = Cartesian3_default.magnitude(
      Cartesian3_default.fromElements(matrix[8], matrix[9], matrix[10], scratchColumn2)
    );
    return result;
  }
  /**
   * Computes the maximum scale assuming the matrix is an affine transformation.
   * The maximum scale is the maximum length of the column vectors in the upper-left
   * 3x3 matrix.
   *
   * @param {Matrix4} matrix The matrix.
   * @returns {number} The maximum scale.
   */
  static getMaximumScale(matrix) {
    _Matrix4.getScale(matrix, scaleScratch32);
    return Cartesian3_default.maximumComponent(scaleScratch32);
  }
  /**
   * Sets the rotation assuming the matrix is an affine transformation.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {Matrix3} rotation The rotation matrix.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @see Matrix4.fromRotation
   * @see Matrix4.getRotation
   */
  static setRotation(matrix, rotation, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const scale = _Matrix4.getScale(matrix, scaleScratch42);
    result[0] = rotation[0] * scale.x;
    result[1] = rotation[1] * scale.x;
    result[2] = rotation[2] * scale.x;
    result[3] = matrix[3];
    result[4] = rotation[3] * scale.y;
    result[5] = rotation[4] * scale.y;
    result[6] = rotation[5] * scale.y;
    result[7] = matrix[7];
    result[8] = rotation[6] * scale.z;
    result[9] = rotation[7] * scale.z;
    result[10] = rotation[8] * scale.z;
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
  /**
   * Extracts the rotation matrix assuming the matrix is an affine transformation.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @see Matrix4.setRotation
   * @see Matrix4.fromRotation
   */
  static getRotation(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const scale = _Matrix4.getScale(matrix, scaleScratch52);
    result[0] = matrix[0] / scale.x;
    result[1] = matrix[1] / scale.x;
    result[2] = matrix[2] / scale.x;
    result[3] = matrix[4] / scale.y;
    result[4] = matrix[5] / scale.y;
    result[5] = matrix[6] / scale.y;
    result[6] = matrix[8] / scale.z;
    result[7] = matrix[9] / scale.z;
    result[8] = matrix[10] / scale.z;
    return result;
  }
  /**
   * Computes the product of two matrices.
   *
   * @param {Matrix4} left The first matrix.
   * @param {Matrix4} right The second matrix.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   */
  static multiply(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    const left0 = left[0];
    const left1 = left[1];
    const left2 = left[2];
    const left3 = left[3];
    const left4 = left[4];
    const left5 = left[5];
    const left6 = left[6];
    const left7 = left[7];
    const left8 = left[8];
    const left9 = left[9];
    const left10 = left[10];
    const left11 = left[11];
    const left12 = left[12];
    const left13 = left[13];
    const left14 = left[14];
    const left15 = left[15];
    const right0 = right[0];
    const right1 = right[1];
    const right2 = right[2];
    const right3 = right[3];
    const right4 = right[4];
    const right5 = right[5];
    const right6 = right[6];
    const right7 = right[7];
    const right8 = right[8];
    const right9 = right[9];
    const right10 = right[10];
    const right11 = right[11];
    const right12 = right[12];
    const right13 = right[13];
    const right14 = right[14];
    const right15 = right[15];
    const column0Row0 = left0 * right0 + left4 * right1 + left8 * right2 + left12 * right3;
    const column0Row1 = left1 * right0 + left5 * right1 + left9 * right2 + left13 * right3;
    const column0Row2 = left2 * right0 + left6 * right1 + left10 * right2 + left14 * right3;
    const column0Row3 = left3 * right0 + left7 * right1 + left11 * right2 + left15 * right3;
    const column1Row0 = left0 * right4 + left4 * right5 + left8 * right6 + left12 * right7;
    const column1Row1 = left1 * right4 + left5 * right5 + left9 * right6 + left13 * right7;
    const column1Row2 = left2 * right4 + left6 * right5 + left10 * right6 + left14 * right7;
    const column1Row3 = left3 * right4 + left7 * right5 + left11 * right6 + left15 * right7;
    const column2Row0 = left0 * right8 + left4 * right9 + left8 * right10 + left12 * right11;
    const column2Row1 = left1 * right8 + left5 * right9 + left9 * right10 + left13 * right11;
    const column2Row2 = left2 * right8 + left6 * right9 + left10 * right10 + left14 * right11;
    const column2Row3 = left3 * right8 + left7 * right9 + left11 * right10 + left15 * right11;
    const column3Row0 = left0 * right12 + left4 * right13 + left8 * right14 + left12 * right15;
    const column3Row1 = left1 * right12 + left5 * right13 + left9 * right14 + left13 * right15;
    const column3Row2 = left2 * right12 + left6 * right13 + left10 * right14 + left14 * right15;
    const column3Row3 = left3 * right12 + left7 * right13 + left11 * right14 + left15 * right15;
    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = column0Row3;
    result[4] = column1Row0;
    result[5] = column1Row1;
    result[6] = column1Row2;
    result[7] = column1Row3;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = column2Row3;
    result[12] = column3Row0;
    result[13] = column3Row1;
    result[14] = column3Row2;
    result[15] = column3Row3;
    return result;
  }
  /**
   * Computes the sum of two matrices.
   *
   * @param {Matrix4} left The first matrix.
   * @param {Matrix4} right The second matrix.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   */
  static add(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result[0] = left[0] + right[0];
    result[1] = left[1] + right[1];
    result[2] = left[2] + right[2];
    result[3] = left[3] + right[3];
    result[4] = left[4] + right[4];
    result[5] = left[5] + right[5];
    result[6] = left[6] + right[6];
    result[7] = left[7] + right[7];
    result[8] = left[8] + right[8];
    result[9] = left[9] + right[9];
    result[10] = left[10] + right[10];
    result[11] = left[11] + right[11];
    result[12] = left[12] + right[12];
    result[13] = left[13] + right[13];
    result[14] = left[14] + right[14];
    result[15] = left[15] + right[15];
    return result;
  }
  /**
   * Computes the difference of two matrices.
   *
   * @param {Matrix4} left The first matrix.
   * @param {Matrix4} right The second matrix.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   */
  static subtract(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    result[0] = left[0] - right[0];
    result[1] = left[1] - right[1];
    result[2] = left[2] - right[2];
    result[3] = left[3] - right[3];
    result[4] = left[4] - right[4];
    result[5] = left[5] - right[5];
    result[6] = left[6] - right[6];
    result[7] = left[7] - right[7];
    result[8] = left[8] - right[8];
    result[9] = left[9] - right[9];
    result[10] = left[10] - right[10];
    result[11] = left[11] - right[11];
    result[12] = left[12] - right[12];
    result[13] = left[13] - right[13];
    result[14] = left[14] - right[14];
    result[15] = left[15] - right[15];
    return result;
  }
  /**
   * Computes the product of two matrices assuming the matrices are affine transformation matrices,
   * where the upper left 3x3 elements are any matrix, and
   * the upper three elements in the fourth column are the translation.
   * The bottom row is assumed to be [0, 0, 0, 1].
   * The matrix is not verified to be in the proper form.
   * This method is faster than computing the product for general 4x4
   * matrices using {@link Matrix4.multiply}.
   *
   * @param {Matrix4} left The first matrix.
   * @param {Matrix4} right The second matrix.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @example
   * const m1 = new Cesium.Matrix4(1.0, 6.0, 7.0, 0.0, 2.0, 5.0, 8.0, 0.0, 3.0, 4.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0);
   * const m2 = Cesium.Transforms.eastNorthUpToFixedFrame(new Cesium.Cartesian3(1.0, 1.0, 1.0));
   * const m3 = Cesium.Matrix4.multiplyTransformation(m1, m2, new Cesium.Matrix4());
   */
  static multiplyTransformation(left, right, result) {
    Check_default.typeOf.object("left", left);
    Check_default.typeOf.object("right", right);
    Check_default.typeOf.object("result", result);
    const left0 = left[0];
    const left1 = left[1];
    const left2 = left[2];
    const left4 = left[4];
    const left5 = left[5];
    const left6 = left[6];
    const left8 = left[8];
    const left9 = left[9];
    const left10 = left[10];
    const left12 = left[12];
    const left13 = left[13];
    const left14 = left[14];
    const right0 = right[0];
    const right1 = right[1];
    const right2 = right[2];
    const right4 = right[4];
    const right5 = right[5];
    const right6 = right[6];
    const right8 = right[8];
    const right9 = right[9];
    const right10 = right[10];
    const right12 = right[12];
    const right13 = right[13];
    const right14 = right[14];
    const column0Row0 = left0 * right0 + left4 * right1 + left8 * right2;
    const column0Row1 = left1 * right0 + left5 * right1 + left9 * right2;
    const column0Row2 = left2 * right0 + left6 * right1 + left10 * right2;
    const column1Row0 = left0 * right4 + left4 * right5 + left8 * right6;
    const column1Row1 = left1 * right4 + left5 * right5 + left9 * right6;
    const column1Row2 = left2 * right4 + left6 * right5 + left10 * right6;
    const column2Row0 = left0 * right8 + left4 * right9 + left8 * right10;
    const column2Row1 = left1 * right8 + left5 * right9 + left9 * right10;
    const column2Row2 = left2 * right8 + left6 * right9 + left10 * right10;
    const column3Row0 = left0 * right12 + left4 * right13 + left8 * right14 + left12;
    const column3Row1 = left1 * right12 + left5 * right13 + left9 * right14 + left13;
    const column3Row2 = left2 * right12 + left6 * right13 + left10 * right14 + left14;
    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = 0;
    result[4] = column1Row0;
    result[5] = column1Row1;
    result[6] = column1Row2;
    result[7] = 0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = 0;
    result[12] = column3Row0;
    result[13] = column3Row1;
    result[14] = column3Row2;
    result[15] = 1;
    return result;
  }
  /**
   * Multiplies a transformation matrix (with a bottom row of <code>[0.0, 0.0, 0.0, 1.0]</code>)
   * by a 3x3 rotation matrix.  This is an optimization
   * for <code>Matrix4.multiply(m, Matrix4.fromRotationTranslation(rotation), m);</code> with less allocations and arithmetic operations.
   *
   * @param {Matrix4} matrix The matrix on the left-hand side.
   * @param {Matrix3} rotation The 3x3 rotation matrix on the right-hand side.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @example
   * // Instead of Cesium.Matrix4.multiply(m, Cesium.Matrix4.fromRotationTranslation(rotation), m);
   * Cesium.Matrix4.multiplyByMatrix3(m, rotation, m);
   */
  static multiplyByMatrix3(matrix, rotation, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("rotation", rotation);
    Check_default.typeOf.object("result", result);
    const left0 = matrix[0];
    const left1 = matrix[1];
    const left2 = matrix[2];
    const left4 = matrix[4];
    const left5 = matrix[5];
    const left6 = matrix[6];
    const left8 = matrix[8];
    const left9 = matrix[9];
    const left10 = matrix[10];
    const right0 = rotation[0];
    const right1 = rotation[1];
    const right2 = rotation[2];
    const right4 = rotation[3];
    const right5 = rotation[4];
    const right6 = rotation[5];
    const right8 = rotation[6];
    const right9 = rotation[7];
    const right10 = rotation[8];
    const column0Row0 = left0 * right0 + left4 * right1 + left8 * right2;
    const column0Row1 = left1 * right0 + left5 * right1 + left9 * right2;
    const column0Row2 = left2 * right0 + left6 * right1 + left10 * right2;
    const column1Row0 = left0 * right4 + left4 * right5 + left8 * right6;
    const column1Row1 = left1 * right4 + left5 * right5 + left9 * right6;
    const column1Row2 = left2 * right4 + left6 * right5 + left10 * right6;
    const column2Row0 = left0 * right8 + left4 * right9 + left8 * right10;
    const column2Row1 = left1 * right8 + left5 * right9 + left9 * right10;
    const column2Row2 = left2 * right8 + left6 * right9 + left10 * right10;
    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = 0;
    result[4] = column1Row0;
    result[5] = column1Row1;
    result[6] = column1Row2;
    result[7] = 0;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = 0;
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
  /**
   * Multiplies a transformation matrix (with a bottom row of <code>[0.0, 0.0, 0.0, 1.0]</code>)
   * by an implicit translation matrix defined by a {@link Cartesian3}.  This is an optimization
   * for <code>Matrix4.multiply(m, Matrix4.fromTranslation(position), m);</code> with less allocations and arithmetic operations.
   *
   * @param {Matrix4} matrix The matrix on the left-hand side.
   * @param {Cartesian3} translation The translation on the right-hand side.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @example
   * // Instead of Cesium.Matrix4.multiply(m, Cesium.Matrix4.fromTranslation(position), m);
   * Cesium.Matrix4.multiplyByTranslation(m, position, m);
   */
  static multiplyByTranslation(matrix, translation, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("translation", translation);
    Check_default.typeOf.object("result", result);
    const x = translation.x;
    const y = translation.y;
    const z = translation.z;
    const tx = x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12];
    const ty = x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13];
    const tz = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14];
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = tx;
    result[13] = ty;
    result[14] = tz;
    result[15] = matrix[15];
    return result;
  }
  /**
   * Multiplies an affine transformation matrix (with a bottom row of <code>[0.0, 0.0, 0.0, 1.0]</code>)
   * by an implicit non-uniform scale matrix. This is an optimization
   * for <code>Matrix4.multiply(m, Matrix4.fromUniformScale(scale), m);</code>, where
   * <code>m</code> must be an affine matrix.
   * This function performs fewer allocations and arithmetic operations.
   *
   * @param {Matrix4} matrix The affine matrix on the left-hand side.
   * @param {Cartesian3} scale The non-uniform scale on the right-hand side.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   *
   * @example
   * // Instead of Cesium.Matrix4.multiply(m, Cesium.Matrix4.fromScale(scale), m);
   * Cesium.Matrix4.multiplyByScale(m, scale, m);
   *
   * @see Matrix4.multiplyByUniformScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.setScale
   * @see Matrix4.setUniformScale
   * @see Matrix4.getScale
   */
  static multiplyByScale(matrix, scale, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("scale", scale);
    Check_default.typeOf.object("result", result);
    const scaleX = scale.x;
    const scaleY = scale.y;
    const scaleZ = scale.z;
    if (scaleX === 1 && scaleY === 1 && scaleZ === 1) {
      return _Matrix4.clone(matrix, result);
    }
    result[0] = scaleX * matrix[0];
    result[1] = scaleX * matrix[1];
    result[2] = scaleX * matrix[2];
    result[3] = matrix[3];
    result[4] = scaleY * matrix[4];
    result[5] = scaleY * matrix[5];
    result[6] = scaleY * matrix[6];
    result[7] = matrix[7];
    result[8] = scaleZ * matrix[8];
    result[9] = scaleZ * matrix[9];
    result[10] = scaleZ * matrix[10];
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
  /**
   * Computes the product of a matrix times a uniform scale, as if the scale were a scale matrix.
   *
   * @param {Matrix4} matrix The matrix on the left-hand side.
   * @param {number} scale The uniform scale on the right-hand side.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @example
   * // Instead of Cesium.Matrix4.multiply(m, Cesium.Matrix4.fromUniformScale(scale), m);
   * Cesium.Matrix4.multiplyByUniformScale(m, scale, m);
   *
   * @see Matrix4.multiplyByScale
   * @see Matrix4.fromScale
   * @see Matrix4.fromUniformScale
   * @see Matrix4.setScale
   * @see Matrix4.setUniformScale
   * @see Matrix4.getScale
   */
  static multiplyByUniformScale(matrix, scale, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number("scale", scale);
    Check_default.typeOf.object("result", result);
    result[0] = matrix[0] * scale;
    result[1] = matrix[1] * scale;
    result[2] = matrix[2] * scale;
    result[3] = matrix[3];
    result[4] = matrix[4] * scale;
    result[5] = matrix[5] * scale;
    result[6] = matrix[6] * scale;
    result[7] = matrix[7];
    result[8] = matrix[8] * scale;
    result[9] = matrix[9] * scale;
    result[10] = matrix[10] * scale;
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
  /**
   * Computes the product of a matrix and a column vector.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {Cartesian4} cartesian The vector.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static multiplyByVector(matrix, cartesian, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;
    const vW = cartesian.w;
    const x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12] * vW;
    const y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13] * vW;
    const z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14] * vW;
    const w = matrix[3] * vX + matrix[7] * vY + matrix[11] * vZ + matrix[15] * vW;
    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }
  /**
   * Computes the product of a matrix and a {@link Cartesian3}.  This is equivalent to calling {@link Matrix4.multiplyByVector}
   * with a {@link Cartesian4} with a <code>w</code> component of zero.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {Cartesian3} cartesian The point.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   *
   * @example
   * const p = new Cesium.Cartesian3(1.0, 2.0, 3.0);
   * const result = Cesium.Matrix4.multiplyByPointAsVector(matrix, p, new Cesium.Cartesian3());
   * // A shortcut for
   * //   Cartesian3 p = ...
   * //   Cesium.Matrix4.multiplyByVector(matrix, new Cesium.Cartesian4(p.x, p.y, p.z, 0.0), result);
   */
  static multiplyByPointAsVector(matrix, cartesian, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;
    const x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ;
    const y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ;
    const z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ;
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Computes the product of a matrix and a {@link Cartesian3}. This is equivalent to calling {@link Matrix4.multiplyByVector}
   * with a {@link Cartesian4} with a <code>w</code> component of 1, but returns a {@link Cartesian3} instead of a {@link Cartesian4}.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {Cartesian3} cartesian The point.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   *
   * @example
   * const p = new Cesium.Cartesian3(1.0, 2.0, 3.0);
   * const result = Cesium.Matrix4.multiplyByPoint(matrix, p, new Cesium.Cartesian3());
   */
  static multiplyByPoint(matrix, cartesian, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("cartesian", cartesian);
    Check_default.typeOf.object("result", result);
    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;
    const x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12];
    const y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13];
    const z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14];
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Computes the product of a matrix and a scalar.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {number} scalar The number to multiply by.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @example
   * //create a Matrix4 instance which is a scaled version of the supplied Matrix4
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.multiplyByScalar(m, -2, new Cesium.Matrix4());
   *
   * // m remains the same
   * // a = [-20.0, -22.0, -24.0, -26.0]
   * //     [-28.0, -30.0, -32.0, -34.0]
   * //     [-36.0, -38.0, -40.0, -42.0]
   * //     [-44.0, -46.0, -48.0, -50.0]
   */
  static multiplyByScalar(matrix, scalar, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.number("scalar", scalar);
    Check_default.typeOf.object("result", result);
    result[0] = matrix[0] * scalar;
    result[1] = matrix[1] * scalar;
    result[2] = matrix[2] * scalar;
    result[3] = matrix[3] * scalar;
    result[4] = matrix[4] * scalar;
    result[5] = matrix[5] * scalar;
    result[6] = matrix[6] * scalar;
    result[7] = matrix[7] * scalar;
    result[8] = matrix[8] * scalar;
    result[9] = matrix[9] * scalar;
    result[10] = matrix[10] * scalar;
    result[11] = matrix[11] * scalar;
    result[12] = matrix[12] * scalar;
    result[13] = matrix[13] * scalar;
    result[14] = matrix[14] * scalar;
    result[15] = matrix[15] * scalar;
    return result;
  }
  /**
   * Computes a negated copy of the provided matrix.
   *
   * @param {Matrix4} matrix The matrix to negate.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @example
   * //create a new Matrix4 instance which is a negation of a Matrix4
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.negate(m, new Cesium.Matrix4());
   *
   * // m remains the same
   * // a = [-10.0, -11.0, -12.0, -13.0]
   * //     [-14.0, -15.0, -16.0, -17.0]
   * //     [-18.0, -19.0, -20.0, -21.0]
   * //     [-22.0, -23.0, -24.0, -25.0]
   */
  static negate(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    result[0] = -matrix[0];
    result[1] = -matrix[1];
    result[2] = -matrix[2];
    result[3] = -matrix[3];
    result[4] = -matrix[4];
    result[5] = -matrix[5];
    result[6] = -matrix[6];
    result[7] = -matrix[7];
    result[8] = -matrix[8];
    result[9] = -matrix[9];
    result[10] = -matrix[10];
    result[11] = -matrix[11];
    result[12] = -matrix[12];
    result[13] = -matrix[13];
    result[14] = -matrix[14];
    result[15] = -matrix[15];
    return result;
  }
  /**
   * Computes the transpose of the provided matrix.
   *
   * @param {Matrix4} matrix The matrix to transpose.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @example
   * //returns transpose of a Matrix4
   * // m = [10.0, 11.0, 12.0, 13.0]
   * //     [14.0, 15.0, 16.0, 17.0]
   * //     [18.0, 19.0, 20.0, 21.0]
   * //     [22.0, 23.0, 24.0, 25.0]
   *
   * const a = Cesium.Matrix4.transpose(m, new Cesium.Matrix4());
   *
   * // m remains the same
   * // a = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   */
  static transpose(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const matrix1 = matrix[1];
    const matrix2 = matrix[2];
    const matrix3 = matrix[3];
    const matrix6 = matrix[6];
    const matrix7 = matrix[7];
    const matrix11 = matrix[11];
    result[0] = matrix[0];
    result[1] = matrix[4];
    result[2] = matrix[8];
    result[3] = matrix[12];
    result[4] = matrix1;
    result[5] = matrix[5];
    result[6] = matrix[9];
    result[7] = matrix[13];
    result[8] = matrix2;
    result[9] = matrix6;
    result[10] = matrix[10];
    result[11] = matrix[14];
    result[12] = matrix3;
    result[13] = matrix7;
    result[14] = matrix11;
    result[15] = matrix[15];
    return result;
  }
  /**
   * Computes a matrix, which contains the absolute (unsigned) values of the provided matrix's elements.
   *
   * @param {Matrix4} matrix The matrix with signed elements.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   */
  static abs(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    result[0] = Math.abs(matrix[0]);
    result[1] = Math.abs(matrix[1]);
    result[2] = Math.abs(matrix[2]);
    result[3] = Math.abs(matrix[3]);
    result[4] = Math.abs(matrix[4]);
    result[5] = Math.abs(matrix[5]);
    result[6] = Math.abs(matrix[6]);
    result[7] = Math.abs(matrix[7]);
    result[8] = Math.abs(matrix[8]);
    result[9] = Math.abs(matrix[9]);
    result[10] = Math.abs(matrix[10]);
    result[11] = Math.abs(matrix[11]);
    result[12] = Math.abs(matrix[12]);
    result[13] = Math.abs(matrix[13]);
    result[14] = Math.abs(matrix[14]);
    result[15] = Math.abs(matrix[15]);
    return result;
  }
  /**
   * Compares the provided matrices componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Matrix4} [left] The first matrix.
   * @param {Matrix4} [right] The second matrix.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   *
   * @example
   * //compares two Matrix4 instances
   *
   * // a = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   *
   * // b = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   *
   * if(Cesium.Matrix4.equals(a,b)) {
   *      console.log("Both matrices are equal");
   * } else {
   *      console.log("They are not equal");
   * }
   *
   * //Prints "Both matrices are equal" on the console
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && // Translation
    left[12] === right[12] && left[13] === right[13] && left[14] === right[14] && // Rotation/scale
    left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[4] === right[4] && left[5] === right[5] && left[6] === right[6] && left[8] === right[8] && left[9] === right[9] && left[10] === right[10] && // Bottom row
    left[3] === right[3] && left[7] === right[7] && left[11] === right[11] && left[15] === right[15];
  }
  /**
   * Compares the provided matrices componentwise and returns
   * <code>true</code> if they are within the provided epsilon,
   * <code>false</code> otherwise.
   *
   * @param {Matrix4} [left] The first matrix.
   * @param {Matrix4} [right] The second matrix.
   * @param {number} [epsilon=0] The epsilon to use for equality testing.
   * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   *
   * @example
   * //compares two Matrix4 instances
   *
   * // a = [10.5, 14.5, 18.5, 22.5]
   * //     [11.5, 15.5, 19.5, 23.5]
   * //     [12.5, 16.5, 20.5, 24.5]
   * //     [13.5, 17.5, 21.5, 25.5]
   *
   * // b = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   *
   * if(Cesium.Matrix4.equalsEpsilon(a,b,0.1)){
   *      console.log("Difference between both the matrices is less than 0.1");
   * } else {
   *      console.log("Difference between both the matrices is not less than 0.1");
   * }
   *
   * //Prints "Difference between both the matrices is not less than 0.1" on the console
   */
  static equalsEpsilon(left, right, epsilon) {
    epsilon = epsilon ?? 0;
    return left === right || defined_default(left) && defined_default(right) && Math.abs(left[0] - right[0]) <= epsilon && Math.abs(left[1] - right[1]) <= epsilon && Math.abs(left[2] - right[2]) <= epsilon && Math.abs(left[3] - right[3]) <= epsilon && Math.abs(left[4] - right[4]) <= epsilon && Math.abs(left[5] - right[5]) <= epsilon && Math.abs(left[6] - right[6]) <= epsilon && Math.abs(left[7] - right[7]) <= epsilon && Math.abs(left[8] - right[8]) <= epsilon && Math.abs(left[9] - right[9]) <= epsilon && Math.abs(left[10] - right[10]) <= epsilon && Math.abs(left[11] - right[11]) <= epsilon && Math.abs(left[12] - right[12]) <= epsilon && Math.abs(left[13] - right[13]) <= epsilon && Math.abs(left[14] - right[14]) <= epsilon && Math.abs(left[15] - right[15]) <= epsilon;
  }
  /**
   * Gets the translation portion of the provided matrix, assuming the matrix is an affine transformation matrix.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static getTranslation(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    result.x = matrix[12];
    result.y = matrix[13];
    result.z = matrix[14];
    return result;
  }
  /**
   * Gets the upper left 3x3 matrix of the provided matrix.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   *
   * @example
   * // returns a Matrix3 instance from a Matrix4 instance
   *
   * // m = [10.0, 14.0, 18.0, 22.0]
   * //     [11.0, 15.0, 19.0, 23.0]
   * //     [12.0, 16.0, 20.0, 24.0]
   * //     [13.0, 17.0, 21.0, 25.0]
   *
   * const b = new Cesium.Matrix3();
   * Cesium.Matrix4.getMatrix3(m,b);
   *
   * // b = [10.0, 14.0, 18.0]
   * //     [11.0, 15.0, 19.0]
   * //     [12.0, 16.0, 20.0]
   */
  static getMatrix3(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[4];
    result[4] = matrix[5];
    result[5] = matrix[6];
    result[6] = matrix[8];
    result[7] = matrix[9];
    result[8] = matrix[10];
    return result;
  }
  /**
   * Computes the inverse of the provided matrix using Cramers Rule.
   * If the determinant is zero, the matrix can not be inverted, and an exception is thrown.
   * If the matrix is a proper rigid transformation, it is more efficient
   * to invert it with {@link Matrix4.inverseTransformation}.
   *
   * @param {Matrix4} matrix The matrix to invert.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @exception {RuntimeError} matrix is not invertible because its determinate is zero.
   */
  static inverse(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const src0 = matrix[0];
    const src1 = matrix[4];
    const src2 = matrix[8];
    const src3 = matrix[12];
    const src4 = matrix[1];
    const src5 = matrix[5];
    const src6 = matrix[9];
    const src7 = matrix[13];
    const src8 = matrix[2];
    const src9 = matrix[6];
    const src10 = matrix[10];
    const src11 = matrix[14];
    const src12 = matrix[3];
    const src13 = matrix[7];
    const src14 = matrix[11];
    const src15 = matrix[15];
    let tmp0 = src10 * src15;
    let tmp1 = src11 * src14;
    let tmp2 = src9 * src15;
    let tmp3 = src11 * src13;
    let tmp4 = src9 * src14;
    let tmp5 = src10 * src13;
    let tmp6 = src8 * src15;
    let tmp7 = src11 * src12;
    let tmp8 = src8 * src14;
    let tmp9 = src10 * src12;
    let tmp10 = src8 * src13;
    let tmp11 = src9 * src12;
    const dst0 = tmp0 * src5 + tmp3 * src6 + tmp4 * src7 - (tmp1 * src5 + tmp2 * src6 + tmp5 * src7);
    const dst1 = tmp1 * src4 + tmp6 * src6 + tmp9 * src7 - (tmp0 * src4 + tmp7 * src6 + tmp8 * src7);
    const dst2 = tmp2 * src4 + tmp7 * src5 + tmp10 * src7 - (tmp3 * src4 + tmp6 * src5 + tmp11 * src7);
    const dst3 = tmp5 * src4 + tmp8 * src5 + tmp11 * src6 - (tmp4 * src4 + tmp9 * src5 + tmp10 * src6);
    const dst4 = tmp1 * src1 + tmp2 * src2 + tmp5 * src3 - (tmp0 * src1 + tmp3 * src2 + tmp4 * src3);
    const dst5 = tmp0 * src0 + tmp7 * src2 + tmp8 * src3 - (tmp1 * src0 + tmp6 * src2 + tmp9 * src3);
    const dst6 = tmp3 * src0 + tmp6 * src1 + tmp11 * src3 - (tmp2 * src0 + tmp7 * src1 + tmp10 * src3);
    const dst7 = tmp4 * src0 + tmp9 * src1 + tmp10 * src2 - (tmp5 * src0 + tmp8 * src1 + tmp11 * src2);
    tmp0 = src2 * src7;
    tmp1 = src3 * src6;
    tmp2 = src1 * src7;
    tmp3 = src3 * src5;
    tmp4 = src1 * src6;
    tmp5 = src2 * src5;
    tmp6 = src0 * src7;
    tmp7 = src3 * src4;
    tmp8 = src0 * src6;
    tmp9 = src2 * src4;
    tmp10 = src0 * src5;
    tmp11 = src1 * src4;
    const dst8 = tmp0 * src13 + tmp3 * src14 + tmp4 * src15 - (tmp1 * src13 + tmp2 * src14 + tmp5 * src15);
    const dst9 = tmp1 * src12 + tmp6 * src14 + tmp9 * src15 - (tmp0 * src12 + tmp7 * src14 + tmp8 * src15);
    const dst10 = tmp2 * src12 + tmp7 * src13 + tmp10 * src15 - (tmp3 * src12 + tmp6 * src13 + tmp11 * src15);
    const dst11 = tmp5 * src12 + tmp8 * src13 + tmp11 * src14 - (tmp4 * src12 + tmp9 * src13 + tmp10 * src14);
    const dst12 = tmp2 * src10 + tmp5 * src11 + tmp1 * src9 - (tmp4 * src11 + tmp0 * src9 + tmp3 * src10);
    const dst13 = tmp8 * src11 + tmp0 * src8 + tmp7 * src10 - (tmp6 * src10 + tmp9 * src11 + tmp1 * src8);
    const dst14 = tmp6 * src9 + tmp11 * src11 + tmp3 * src8 - (tmp10 * src11 + tmp2 * src8 + tmp7 * src9);
    const dst15 = tmp10 * src10 + tmp4 * src8 + tmp9 * src9 - (tmp8 * src9 + tmp11 * src10 + tmp5 * src8);
    let det = src0 * dst0 + src1 * dst1 + src2 * dst2 + src3 * dst3;
    if (Math.abs(det) < Math_default.EPSILON21) {
      if (Matrix3_default.equalsEpsilon(
        _Matrix4.getMatrix3(matrix, scratchInverseRotation),
        scratchMatrix3Zero,
        Math_default.EPSILON7
      ) && Cartesian4_default.equals(
        _Matrix4.getRow(matrix, 3, scratchBottomRow),
        scratchExpectedBottomRow
      )) {
        result[0] = 0;
        result[1] = 0;
        result[2] = 0;
        result[3] = 0;
        result[4] = 0;
        result[5] = 0;
        result[6] = 0;
        result[7] = 0;
        result[8] = 0;
        result[9] = 0;
        result[10] = 0;
        result[11] = 0;
        result[12] = -matrix[12];
        result[13] = -matrix[13];
        result[14] = -matrix[14];
        result[15] = 1;
        return result;
      }
      throw new RuntimeError_default(
        "matrix is not invertible because its determinate is zero."
      );
    }
    det = 1 / det;
    result[0] = dst0 * det;
    result[1] = dst1 * det;
    result[2] = dst2 * det;
    result[3] = dst3 * det;
    result[4] = dst4 * det;
    result[5] = dst5 * det;
    result[6] = dst6 * det;
    result[7] = dst7 * det;
    result[8] = dst8 * det;
    result[9] = dst9 * det;
    result[10] = dst10 * det;
    result[11] = dst11 * det;
    result[12] = dst12 * det;
    result[13] = dst13 * det;
    result[14] = dst14 * det;
    result[15] = dst15 * det;
    return result;
  }
  /**
   * Computes the inverse of the provided matrix assuming it is a proper rigid matrix,
   * where the upper left 3x3 elements are a rotation matrix,
   * and the upper three elements in the fourth column are the translation.
   * The bottom row is assumed to be [0, 0, 0, 1].
   * The matrix is not verified to be in the proper form.
   * This method is faster than computing the inverse for a general 4x4
   * matrix using {@link Matrix4.inverse}.
   *
   * @param {Matrix4} matrix The matrix to invert.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   */
  static inverseTransformation(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    const matrix0 = matrix[0];
    const matrix1 = matrix[1];
    const matrix2 = matrix[2];
    const matrix4 = matrix[4];
    const matrix5 = matrix[5];
    const matrix6 = matrix[6];
    const matrix8 = matrix[8];
    const matrix9 = matrix[9];
    const matrix10 = matrix[10];
    const vX = matrix[12];
    const vY = matrix[13];
    const vZ = matrix[14];
    const x = -matrix0 * vX - matrix1 * vY - matrix2 * vZ;
    const y = -matrix4 * vX - matrix5 * vY - matrix6 * vZ;
    const z = -matrix8 * vX - matrix9 * vY - matrix10 * vZ;
    result[0] = matrix0;
    result[1] = matrix4;
    result[2] = matrix8;
    result[3] = 0;
    result[4] = matrix1;
    result[5] = matrix5;
    result[6] = matrix9;
    result[7] = 0;
    result[8] = matrix2;
    result[9] = matrix6;
    result[10] = matrix10;
    result[11] = 0;
    result[12] = x;
    result[13] = y;
    result[14] = z;
    result[15] = 1;
    return result;
  }
  /**
   * Computes the inverse transpose of a matrix.
   *
   * @param {Matrix4} matrix The matrix to transpose and invert.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   */
  static inverseTranspose(matrix, result) {
    Check_default.typeOf.object("matrix", matrix);
    Check_default.typeOf.object("result", result);
    return _Matrix4.inverse(
      _Matrix4.transpose(matrix, scratchTransposeMatrix2),
      result
    );
  }
  /**
   * Gets the number of items in the collection.
   *
   * @type {number}
   */
  get length() {
    return _Matrix4.packedLength;
  }
  /**
   * Duplicates the provided Matrix4 instance.
   *
   * @param {Matrix4} [result] The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
   */
  clone(result) {
    return _Matrix4.clone(this, result);
  }
  /**
   * Compares this matrix to the provided matrix componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Matrix4} [right] The right hand side matrix.
   * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
   */
  equals(right) {
    return _Matrix4.equals(this, right);
  }
  /**
   * Compares provided matrix and array, starting from a given array offset.
   *
   * @param {Matrix4} matrix
   * @param {number[]} array
   * @param {number} offset
   * @ignore
   */
  static equalsArray(matrix, array, offset) {
    return matrix[0] === array[offset] && matrix[1] === array[offset + 1] && matrix[2] === array[offset + 2] && matrix[3] === array[offset + 3] && matrix[4] === array[offset + 4] && matrix[5] === array[offset + 5] && matrix[6] === array[offset + 6] && matrix[7] === array[offset + 7] && matrix[8] === array[offset + 8] && matrix[9] === array[offset + 9] && matrix[10] === array[offset + 10] && matrix[11] === array[offset + 11] && matrix[12] === array[offset + 12] && matrix[13] === array[offset + 13] && matrix[14] === array[offset + 14] && matrix[15] === array[offset + 15];
  }
  /**
   * Compares this matrix to the provided matrix componentwise and returns
   * <code>true</code> if they are within the provided epsilon,
   * <code>false</code> otherwise.
   *
   * @param {Matrix4} [right] The right hand side matrix.
   * @param {number} [epsilon=0] The epsilon to use for equality testing.
   * @returns {boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
   */
  equalsEpsilon(right, epsilon) {
    return _Matrix4.equalsEpsilon(this, right, epsilon);
  }
  /**
   * Computes a string representing this Matrix with each row being
   * on a separate line and in the format '(column0, column1, column2, column3)'.
   *
   * @returns {string} A string representing the provided Matrix with each row being on a separate line and in the format '(column0, column1, column2, column3)'.
   */
  toString() {
    return `(${this[0]}, ${this[4]}, ${this[8]}, ${this[12]})
(${this[1]}, ${this[5]}, ${this[9]}, ${this[13]})
(${this[2]}, ${this[6]}, ${this[10]}, ${this[14]})
(${this[3]}, ${this[7]}, ${this[11]}, ${this[15]})`;
  }
};
Matrix4.packedLength = 16;
Matrix4.fromArray = Matrix4.unpack;
Matrix4.IDENTITY = Object.freeze(
  new Matrix4(
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  )
);
Matrix4.ZERO = Object.freeze(
  new Matrix4(
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  )
);
Matrix4.COLUMN0ROW0 = 0;
Matrix4.COLUMN0ROW1 = 1;
Matrix4.COLUMN0ROW2 = 2;
Matrix4.COLUMN0ROW3 = 3;
Matrix4.COLUMN1ROW0 = 4;
Matrix4.COLUMN1ROW1 = 5;
Matrix4.COLUMN1ROW2 = 6;
Matrix4.COLUMN1ROW3 = 7;
Matrix4.COLUMN2ROW0 = 8;
Matrix4.COLUMN2ROW1 = 9;
Matrix4.COLUMN2ROW2 = 10;
Matrix4.COLUMN2ROW3 = 11;
Matrix4.COLUMN3ROW0 = 12;
Matrix4.COLUMN3ROW1 = 13;
Matrix4.COLUMN3ROW2 = 14;
Matrix4.COLUMN3ROW3 = 15;
var fromCameraF = new Cartesian3_default();
var fromCameraR = new Cartesian3_default();
var fromCameraU = new Cartesian3_default();
var scaleScratch12 = new Cartesian3_default();
var scaleScratch22 = new Cartesian3_default();
var scratchColumn2 = new Cartesian3_default();
var scaleScratch32 = new Cartesian3_default();
var scaleScratch42 = new Cartesian3_default();
var scaleScratch52 = new Cartesian3_default();
var scratchInverseRotation = new Matrix3_default();
var scratchMatrix3Zero = new Matrix3_default();
var scratchBottomRow = new Cartesian4_default();
var scratchExpectedBottomRow = new Cartesian4_default(0, 0, 0, 1);
var scratchTransposeMatrix2 = new Matrix4();
var Matrix4_default = Matrix4;

// node_modules/@cesium/engine/Source/Core/Fullscreen.js
var _supportsFullscreen;
var _names = {
  requestFullscreen: void 0,
  exitFullscreen: void 0,
  fullscreenEnabled: void 0,
  fullscreenElement: void 0,
  fullscreenchange: void 0,
  fullscreenerror: void 0
};
var Fullscreen = {};
Object.defineProperties(Fullscreen, {
  /**
   * The element that is currently fullscreen, if any.  To simply check if the
   * browser is in fullscreen mode or not, use {@link Fullscreen#fullscreen}.
   * @memberof Fullscreen
   * @type {object}
   * @readonly
   */
  element: {
    get: function() {
      if (!Fullscreen.supportsFullscreen()) {
        return void 0;
      }
      return document[_names.fullscreenElement];
    }
  },
  /**
   * The name of the event on the document that is fired when fullscreen is
   * entered or exited.  This event name is intended for use with addEventListener.
   * In your event handler, to determine if the browser is in fullscreen mode or not,
   * use {@link Fullscreen#fullscreen}.
   * @memberof Fullscreen
   * @type {string}
   * @readonly
   */
  changeEventName: {
    get: function() {
      if (!Fullscreen.supportsFullscreen()) {
        return void 0;
      }
      return _names.fullscreenchange;
    }
  },
  /**
   * The name of the event that is fired when a fullscreen error
   * occurs.  This event name is intended for use with addEventListener.
   * @memberof Fullscreen
   * @type {string}
   * @readonly
   */
  errorEventName: {
    get: function() {
      if (!Fullscreen.supportsFullscreen()) {
        return void 0;
      }
      return _names.fullscreenerror;
    }
  },
  /**
   * Determine whether the browser will allow an element to be made fullscreen, or not.
   * For example, by default, iframes cannot go fullscreen unless the containing page
   * adds an "allowfullscreen" attribute (or prefixed equivalent).
   * @memberof Fullscreen
   * @type {boolean}
   * @readonly
   */
  enabled: {
    get: function() {
      if (!Fullscreen.supportsFullscreen()) {
        return void 0;
      }
      return document[_names.fullscreenEnabled];
    }
  },
  /**
   * Determines if the browser is currently in fullscreen mode.
   * @memberof Fullscreen
   * @type {boolean}
   * @readonly
   */
  fullscreen: {
    get: function() {
      if (!Fullscreen.supportsFullscreen()) {
        return void 0;
      }
      return Fullscreen.element !== null;
    }
  }
});
Fullscreen.supportsFullscreen = function() {
  if (defined_default(_supportsFullscreen)) {
    return _supportsFullscreen;
  }
  _supportsFullscreen = false;
  const body = document.body;
  if (typeof body.requestFullscreen === "function") {
    _names.requestFullscreen = "requestFullscreen";
    _names.exitFullscreen = "exitFullscreen";
    _names.fullscreenEnabled = "fullscreenEnabled";
    _names.fullscreenElement = "fullscreenElement";
    _names.fullscreenchange = "fullscreenchange";
    _names.fullscreenerror = "fullscreenerror";
    _supportsFullscreen = true;
    return _supportsFullscreen;
  }
  const prefixes = ["webkit", "moz", "o", "ms", "khtml"];
  let name;
  for (let i = 0, len = prefixes.length; i < len; ++i) {
    const prefix = prefixes[i];
    name = `${prefix}RequestFullscreen`;
    if (typeof body[name] === "function") {
      _names.requestFullscreen = name;
      _supportsFullscreen = true;
    } else {
      name = `${prefix}RequestFullScreen`;
      if (typeof body[name] === "function") {
        _names.requestFullscreen = name;
        _supportsFullscreen = true;
      }
    }
    name = `${prefix}ExitFullscreen`;
    if (typeof document[name] === "function") {
      _names.exitFullscreen = name;
    } else {
      name = `${prefix}CancelFullScreen`;
      if (typeof document[name] === "function") {
        _names.exitFullscreen = name;
      }
    }
    name = `${prefix}FullscreenEnabled`;
    if (document[name] !== void 0) {
      _names.fullscreenEnabled = name;
    } else {
      name = `${prefix}FullScreenEnabled`;
      if (document[name] !== void 0) {
        _names.fullscreenEnabled = name;
      }
    }
    name = `${prefix}FullscreenElement`;
    if (document[name] !== void 0) {
      _names.fullscreenElement = name;
    } else {
      name = `${prefix}FullScreenElement`;
      if (document[name] !== void 0) {
        _names.fullscreenElement = name;
      }
    }
    name = `${prefix}fullscreenchange`;
    if (document[`on${name}`] !== void 0) {
      if (prefix === "ms") {
        name = "MSFullscreenChange";
      }
      _names.fullscreenchange = name;
    }
    name = `${prefix}fullscreenerror`;
    if (document[`on${name}`] !== void 0) {
      if (prefix === "ms") {
        name = "MSFullscreenError";
      }
      _names.fullscreenerror = name;
    }
  }
  return _supportsFullscreen;
};
Fullscreen.requestFullscreen = function(element, vrDevice) {
  if (!Fullscreen.supportsFullscreen()) {
    return;
  }
  element[_names.requestFullscreen]({ vrDisplay: vrDevice });
};
Fullscreen.exitFullscreen = function() {
  if (!Fullscreen.supportsFullscreen()) {
    return;
  }
  document[_names.exitFullscreen]();
};
Fullscreen._names = _names;
var Fullscreen_default = Fullscreen;

// node_modules/@cesium/engine/Source/Core/FeatureDetection.js
var theNavigator;
if (typeof navigator !== "undefined") {
  theNavigator = navigator;
} else {
  theNavigator = {};
}
function extractVersion(versionString) {
  const parts = versionString.split(".");
  for (let i = 0, len = parts.length; i < len; ++i) {
    parts[i] = parseInt(parts[i], 10);
  }
  return parts;
}
var isChromeResult;
var chromeVersionResult;
function isChrome() {
  if (!defined_default(isChromeResult)) {
    isChromeResult = false;
    if (!isEdge()) {
      const fields = / Chrome\/([\.0-9]+)/.exec(theNavigator.userAgent);
      if (fields !== null) {
        isChromeResult = true;
        chromeVersionResult = extractVersion(fields[1]);
      }
    }
  }
  return isChromeResult;
}
function chromeVersion() {
  return isChrome() && chromeVersionResult;
}
var isSafariResult;
var safariVersionResult;
function isSafari() {
  if (!defined_default(isSafariResult)) {
    isSafariResult = false;
    if (!isChrome() && !isEdge() && / Safari\/[\.0-9]+/.test(theNavigator.userAgent)) {
      const fields = / Version\/([\.0-9]+)/.exec(theNavigator.userAgent);
      if (fields !== null) {
        isSafariResult = true;
        safariVersionResult = extractVersion(fields[1]);
      }
    }
  }
  return isSafariResult;
}
function safariVersion() {
  return isSafari() && safariVersionResult;
}
var isWebkitResult;
var webkitVersionResult;
function isWebkit() {
  if (!defined_default(isWebkitResult)) {
    isWebkitResult = false;
    const fields = / AppleWebKit\/([\.0-9]+)(\+?)/.exec(theNavigator.userAgent);
    if (fields !== null) {
      isWebkitResult = true;
      webkitVersionResult = extractVersion(fields[1]);
      webkitVersionResult.isNightly = !!fields[2];
    }
  }
  return isWebkitResult;
}
function webkitVersion() {
  return isWebkit() && webkitVersionResult;
}
var isEdgeResult;
var edgeVersionResult;
function isEdge() {
  if (!defined_default(isEdgeResult)) {
    isEdgeResult = false;
    const fields = / Edg\/([\.0-9]+)/.exec(theNavigator.userAgent);
    if (fields !== null) {
      isEdgeResult = true;
      edgeVersionResult = extractVersion(fields[1]);
    }
  }
  return isEdgeResult;
}
function edgeVersion() {
  return isEdge() && edgeVersionResult;
}
var isFirefoxResult;
var firefoxVersionResult;
function isFirefox() {
  if (!defined_default(isFirefoxResult)) {
    isFirefoxResult = false;
    const fields = /Firefox\/([\.0-9]+)/.exec(theNavigator.userAgent);
    if (fields !== null) {
      isFirefoxResult = true;
      firefoxVersionResult = extractVersion(fields[1]);
    }
  }
  return isFirefoxResult;
}
var isWindowsResult;
function isWindows() {
  if (!defined_default(isWindowsResult)) {
    isWindowsResult = /Windows/i.test(theNavigator.appVersion);
  }
  return isWindowsResult;
}
var isIPadOrIOSResult;
function isIPadOrIOS() {
  if (!defined_default(isIPadOrIOSResult)) {
    isIPadOrIOSResult = navigator.platform === "iPhone" || navigator.platform === "iPod" || navigator.platform === "iPad";
  }
  return isIPadOrIOSResult;
}
function firefoxVersion() {
  return isFirefox() && firefoxVersionResult;
}
var hasPointerEvents;
function supportsPointerEvents() {
  if (!defined_default(hasPointerEvents)) {
    hasPointerEvents = !isFirefox() && typeof PointerEvent !== "undefined" && (!defined_default(theNavigator.pointerEnabled) || theNavigator.pointerEnabled);
  }
  return hasPointerEvents;
}
var imageRenderingValueResult;
var supportsImageRenderingPixelatedResult;
function supportsImageRenderingPixelated() {
  if (!defined_default(supportsImageRenderingPixelatedResult)) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute(
      "style",
      "image-rendering: -moz-crisp-edges;image-rendering: pixelated;"
    );
    const tmp = canvas.style.imageRendering;
    supportsImageRenderingPixelatedResult = defined_default(tmp) && tmp !== "";
    if (supportsImageRenderingPixelatedResult) {
      imageRenderingValueResult = tmp;
    }
  }
  return supportsImageRenderingPixelatedResult;
}
function imageRenderingValue() {
  return supportsImageRenderingPixelated() ? imageRenderingValueResult : void 0;
}
function supportsWebP() {
  if (!supportsWebP.initialized) {
    throw new DeveloperError_default(
      "You must call FeatureDetection.supportsWebP.initialize and wait for the promise to resolve before calling FeatureDetection.supportsWebP"
    );
  }
  return supportsWebP._result;
}
supportsWebP._promise = void 0;
supportsWebP._result = void 0;
supportsWebP.initialize = function() {
  if (defined_default(supportsWebP._promise)) {
    return supportsWebP._promise;
  }
  supportsWebP._promise = new Promise((resolve) => {
    const image = new Image();
    image.onload = function() {
      supportsWebP._result = image.width > 0 && image.height > 0;
      resolve(supportsWebP._result);
    };
    image.onerror = function() {
      supportsWebP._result = false;
      resolve(supportsWebP._result);
    };
    image.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
  });
  return supportsWebP._promise;
};
Object.defineProperties(supportsWebP, {
  initialized: {
    get: function() {
      return defined_default(supportsWebP._result);
    }
  }
});
var typedArrayTypes = [];
if (typeof ArrayBuffer !== "undefined") {
  typedArrayTypes.push(
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
  );
  if (typeof Uint8ClampedArray !== "undefined") {
    typedArrayTypes.push(Uint8ClampedArray);
  }
  if (typeof Uint8ClampedArray !== "undefined") {
    typedArrayTypes.push(Uint8ClampedArray);
  }
  if (typeof BigInt64Array !== "undefined") {
    typedArrayTypes.push(BigInt64Array);
  }
  if (typeof BigUint64Array !== "undefined") {
    typedArrayTypes.push(BigUint64Array);
  }
}
var FeatureDetection = {
  isChrome,
  chromeVersion,
  isSafari,
  safariVersion,
  isWebkit,
  webkitVersion,
  isEdge,
  edgeVersion,
  isFirefox,
  firefoxVersion,
  isWindows,
  isIPadOrIOS,
  hardwareConcurrency: theNavigator.hardwareConcurrency ?? 3,
  supportsPointerEvents,
  supportsImageRenderingPixelated,
  supportsWebP,
  imageRenderingValue,
  typedArrayTypes
};
FeatureDetection.supportsBasis = function(scene) {
  return FeatureDetection.supportsWebAssembly() && scene.context.supportsBasis;
};
FeatureDetection.supportsFullscreen = function() {
  return Fullscreen_default.supportsFullscreen();
};
FeatureDetection.supportsTypedArrays = function() {
  return typeof ArrayBuffer !== "undefined";
};
FeatureDetection.supportsBigInt64Array = function() {
  return typeof BigInt64Array !== "undefined";
};
FeatureDetection.supportsBigUint64Array = function() {
  return typeof BigUint64Array !== "undefined";
};
FeatureDetection.supportsBigInt = function() {
  return typeof BigInt !== "undefined";
};
FeatureDetection.supportsWebWorkers = function() {
  return typeof Worker !== "undefined";
};
FeatureDetection.supportsWebAssembly = function() {
  return typeof WebAssembly !== "undefined";
};
FeatureDetection.supportsWebgl2 = function(scene) {
  Check_default.defined("scene", scene);
  return scene.context.webgl2;
};
FeatureDetection.supportsEsmWebWorkers = function() {
  return !isFirefox() || parseInt(firefoxVersionResult) >= 114;
};
var FeatureDetection_default = FeatureDetection;

// node_modules/@cesium/engine/Source/Core/Quaternion.js
function Quaternion(x, y, z, w) {
  this.x = x ?? 0;
  this.y = y ?? 0;
  this.z = z ?? 0;
  this.w = w ?? 0;
}
var fromAxisAngleScratch = new Cartesian3_default();
Quaternion.fromAxisAngle = function(axis, angle, result) {
  Check_default.typeOf.object("axis", axis);
  Check_default.typeOf.number("angle", angle);
  const halfAngle = angle / 2;
  const s = Math.sin(halfAngle);
  fromAxisAngleScratch = Cartesian3_default.normalize(axis, fromAxisAngleScratch);
  const x = fromAxisAngleScratch.x * s;
  const y = fromAxisAngleScratch.y * s;
  const z = fromAxisAngleScratch.z * s;
  const w = Math.cos(halfAngle);
  if (!defined_default(result)) {
    return new Quaternion(x, y, z, w);
  }
  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};
var fromRotationMatrixNext = [1, 2, 0];
var fromRotationMatrixQuat = new Array(3);
Quaternion.fromRotationMatrix = function(matrix, result) {
  Check_default.typeOf.object("matrix", matrix);
  let root;
  let x;
  let y;
  let z;
  let w;
  const m00 = matrix[Matrix3_default.COLUMN0ROW0];
  const m11 = matrix[Matrix3_default.COLUMN1ROW1];
  const m22 = matrix[Matrix3_default.COLUMN2ROW2];
  const trace = m00 + m11 + m22;
  if (trace > 0) {
    root = Math.sqrt(trace + 1);
    w = 0.5 * root;
    root = 0.5 / root;
    x = (matrix[Matrix3_default.COLUMN1ROW2] - matrix[Matrix3_default.COLUMN2ROW1]) * root;
    y = (matrix[Matrix3_default.COLUMN2ROW0] - matrix[Matrix3_default.COLUMN0ROW2]) * root;
    z = (matrix[Matrix3_default.COLUMN0ROW1] - matrix[Matrix3_default.COLUMN1ROW0]) * root;
  } else {
    const next = fromRotationMatrixNext;
    let i = 0;
    if (m11 > m00) {
      i = 1;
    }
    if (m22 > m00 && m22 > m11) {
      i = 2;
    }
    const j = next[i];
    const k = next[j];
    root = Math.sqrt(
      matrix[Matrix3_default.getElementIndex(i, i)] - matrix[Matrix3_default.getElementIndex(j, j)] - matrix[Matrix3_default.getElementIndex(k, k)] + 1
    );
    const quat = fromRotationMatrixQuat;
    quat[i] = 0.5 * root;
    root = 0.5 / root;
    w = (matrix[Matrix3_default.getElementIndex(k, j)] - matrix[Matrix3_default.getElementIndex(j, k)]) * root;
    quat[j] = (matrix[Matrix3_default.getElementIndex(j, i)] + matrix[Matrix3_default.getElementIndex(i, j)]) * root;
    quat[k] = (matrix[Matrix3_default.getElementIndex(k, i)] + matrix[Matrix3_default.getElementIndex(i, k)]) * root;
    x = -quat[0];
    y = -quat[1];
    z = -quat[2];
  }
  if (!defined_default(result)) {
    return new Quaternion(x, y, z, w);
  }
  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};
var scratchHPRQuaternion = new Quaternion();
var scratchHeadingQuaternion = new Quaternion();
var scratchPitchQuaternion = new Quaternion();
var scratchRollQuaternion = new Quaternion();
Quaternion.fromHeadingPitchRoll = function(headingPitchRoll, result) {
  Check_default.typeOf.object("headingPitchRoll", headingPitchRoll);
  scratchRollQuaternion = Quaternion.fromAxisAngle(
    Cartesian3_default.UNIT_X,
    headingPitchRoll.roll,
    scratchHPRQuaternion
  );
  scratchPitchQuaternion = Quaternion.fromAxisAngle(
    Cartesian3_default.UNIT_Y,
    -headingPitchRoll.pitch,
    result
  );
  result = Quaternion.multiply(
    scratchPitchQuaternion,
    scratchRollQuaternion,
    scratchPitchQuaternion
  );
  scratchHeadingQuaternion = Quaternion.fromAxisAngle(
    Cartesian3_default.UNIT_Z,
    -headingPitchRoll.heading,
    scratchHPRQuaternion
  );
  return Quaternion.multiply(scratchHeadingQuaternion, result, result);
};
var sampledQuaternionAxis = new Cartesian3_default();
var sampledQuaternionRotation = new Cartesian3_default();
var sampledQuaternionTempQuaternion = new Quaternion();
var sampledQuaternionQuaternion0 = new Quaternion();
var sampledQuaternionQuaternion0Conjugate = new Quaternion();
Quaternion.packedLength = 4;
Quaternion.pack = function(value, array, startingIndex) {
  Check_default.typeOf.object("value", value);
  Check_default.defined("array", array);
  startingIndex = startingIndex ?? 0;
  array[startingIndex++] = value.x;
  array[startingIndex++] = value.y;
  array[startingIndex++] = value.z;
  array[startingIndex] = value.w;
  return array;
};
Quaternion.unpack = function(array, startingIndex, result) {
  Check_default.defined("array", array);
  startingIndex = startingIndex ?? 0;
  if (!defined_default(result)) {
    result = new Quaternion();
  }
  result.x = array[startingIndex];
  result.y = array[startingIndex + 1];
  result.z = array[startingIndex + 2];
  result.w = array[startingIndex + 3];
  return result;
};
Quaternion.packedInterpolationLength = 3;
Quaternion.convertPackedArrayForInterpolation = function(packedArray, startingIndex, lastIndex, result) {
  Quaternion.unpack(
    packedArray,
    lastIndex * 4,
    sampledQuaternionQuaternion0Conjugate
  );
  Quaternion.conjugate(
    sampledQuaternionQuaternion0Conjugate,
    sampledQuaternionQuaternion0Conjugate
  );
  for (let i = 0, len = lastIndex - startingIndex + 1; i < len; i++) {
    const offset = i * 3;
    Quaternion.unpack(
      packedArray,
      (startingIndex + i) * 4,
      sampledQuaternionTempQuaternion
    );
    Quaternion.multiply(
      sampledQuaternionTempQuaternion,
      sampledQuaternionQuaternion0Conjugate,
      sampledQuaternionTempQuaternion
    );
    if (sampledQuaternionTempQuaternion.w < 0) {
      Quaternion.negate(
        sampledQuaternionTempQuaternion,
        sampledQuaternionTempQuaternion
      );
    }
    Quaternion.computeAxis(
      sampledQuaternionTempQuaternion,
      sampledQuaternionAxis
    );
    const angle = Quaternion.computeAngle(sampledQuaternionTempQuaternion);
    if (!defined_default(result)) {
      result = [];
    }
    result[offset] = sampledQuaternionAxis.x * angle;
    result[offset + 1] = sampledQuaternionAxis.y * angle;
    result[offset + 2] = sampledQuaternionAxis.z * angle;
  }
};
Quaternion.unpackInterpolationResult = function(array, sourceArray, firstIndex, lastIndex, result) {
  if (!defined_default(result)) {
    result = new Quaternion();
  }
  Cartesian3_default.fromArray(array, 0, sampledQuaternionRotation);
  const magnitude = Cartesian3_default.magnitude(sampledQuaternionRotation);
  Quaternion.unpack(sourceArray, lastIndex * 4, sampledQuaternionQuaternion0);
  if (magnitude === 0) {
    Quaternion.clone(Quaternion.IDENTITY, sampledQuaternionTempQuaternion);
  } else {
    Quaternion.fromAxisAngle(
      sampledQuaternionRotation,
      magnitude,
      sampledQuaternionTempQuaternion
    );
  }
  return Quaternion.multiply(
    sampledQuaternionTempQuaternion,
    sampledQuaternionQuaternion0,
    result
  );
};
Quaternion.clone = function(quaternion, result) {
  if (!defined_default(quaternion)) {
    return void 0;
  }
  if (!defined_default(result)) {
    return new Quaternion(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
  }
  result.x = quaternion.x;
  result.y = quaternion.y;
  result.z = quaternion.z;
  result.w = quaternion.w;
  return result;
};
Quaternion.conjugate = function(quaternion, result) {
  Check_default.typeOf.object("quaternion", quaternion);
  Check_default.typeOf.object("result", result);
  result.x = -quaternion.x;
  result.y = -quaternion.y;
  result.z = -quaternion.z;
  result.w = quaternion.w;
  return result;
};
Quaternion.magnitudeSquared = function(quaternion) {
  Check_default.typeOf.object("quaternion", quaternion);
  return quaternion.x * quaternion.x + quaternion.y * quaternion.y + quaternion.z * quaternion.z + quaternion.w * quaternion.w;
};
Quaternion.magnitude = function(quaternion) {
  return Math.sqrt(Quaternion.magnitudeSquared(quaternion));
};
Quaternion.normalize = function(quaternion, result) {
  Check_default.typeOf.object("result", result);
  const inverseMagnitude = 1 / Quaternion.magnitude(quaternion);
  const x = quaternion.x * inverseMagnitude;
  const y = quaternion.y * inverseMagnitude;
  const z = quaternion.z * inverseMagnitude;
  const w = quaternion.w * inverseMagnitude;
  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};
Quaternion.inverse = function(quaternion, result) {
  Check_default.typeOf.object("result", result);
  const magnitudeSquared = Quaternion.magnitudeSquared(quaternion);
  result = Quaternion.conjugate(quaternion, result);
  return Quaternion.multiplyByScalar(result, 1 / magnitudeSquared, result);
};
Quaternion.add = function(left, right, result) {
  Check_default.typeOf.object("left", left);
  Check_default.typeOf.object("right", right);
  Check_default.typeOf.object("result", result);
  result.x = left.x + right.x;
  result.y = left.y + right.y;
  result.z = left.z + right.z;
  result.w = left.w + right.w;
  return result;
};
Quaternion.subtract = function(left, right, result) {
  Check_default.typeOf.object("left", left);
  Check_default.typeOf.object("right", right);
  Check_default.typeOf.object("result", result);
  result.x = left.x - right.x;
  result.y = left.y - right.y;
  result.z = left.z - right.z;
  result.w = left.w - right.w;
  return result;
};
Quaternion.negate = function(quaternion, result) {
  Check_default.typeOf.object("quaternion", quaternion);
  Check_default.typeOf.object("result", result);
  result.x = -quaternion.x;
  result.y = -quaternion.y;
  result.z = -quaternion.z;
  result.w = -quaternion.w;
  return result;
};
Quaternion.dot = function(left, right) {
  Check_default.typeOf.object("left", left);
  Check_default.typeOf.object("right", right);
  return left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
};
Quaternion.multiply = function(left, right, result) {
  Check_default.typeOf.object("left", left);
  Check_default.typeOf.object("right", right);
  Check_default.typeOf.object("result", result);
  const leftX = left.x;
  const leftY = left.y;
  const leftZ = left.z;
  const leftW = left.w;
  const rightX = right.x;
  const rightY = right.y;
  const rightZ = right.z;
  const rightW = right.w;
  const x = leftW * rightX + leftX * rightW + leftY * rightZ - leftZ * rightY;
  const y = leftW * rightY - leftX * rightZ + leftY * rightW + leftZ * rightX;
  const z = leftW * rightZ + leftX * rightY - leftY * rightX + leftZ * rightW;
  const w = leftW * rightW - leftX * rightX - leftY * rightY - leftZ * rightZ;
  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};
Quaternion.multiplyByScalar = function(quaternion, scalar, result) {
  Check_default.typeOf.object("quaternion", quaternion);
  Check_default.typeOf.number("scalar", scalar);
  Check_default.typeOf.object("result", result);
  result.x = quaternion.x * scalar;
  result.y = quaternion.y * scalar;
  result.z = quaternion.z * scalar;
  result.w = quaternion.w * scalar;
  return result;
};
Quaternion.divideByScalar = function(quaternion, scalar, result) {
  Check_default.typeOf.object("quaternion", quaternion);
  Check_default.typeOf.number("scalar", scalar);
  Check_default.typeOf.object("result", result);
  result.x = quaternion.x / scalar;
  result.y = quaternion.y / scalar;
  result.z = quaternion.z / scalar;
  result.w = quaternion.w / scalar;
  return result;
};
Quaternion.computeAxis = function(quaternion, result) {
  Check_default.typeOf.object("quaternion", quaternion);
  Check_default.typeOf.object("result", result);
  const w = quaternion.w;
  if (Math.abs(w - 1) < Math_default.EPSILON6 || Math.abs(w + 1) < Math_default.EPSILON6) {
    result.x = 1;
    result.y = result.z = 0;
    return result;
  }
  const scalar = 1 / Math.sqrt(1 - w * w);
  result.x = quaternion.x * scalar;
  result.y = quaternion.y * scalar;
  result.z = quaternion.z * scalar;
  return result;
};
Quaternion.computeAngle = function(quaternion) {
  Check_default.typeOf.object("quaternion", quaternion);
  if (Math.abs(quaternion.w - 1) < Math_default.EPSILON6) {
    return 0;
  }
  return 2 * Math.acos(quaternion.w);
};
var lerpScratch4 = new Quaternion();
Quaternion.lerp = function(start, end, t, result) {
  Check_default.typeOf.object("start", start);
  Check_default.typeOf.object("end", end);
  Check_default.typeOf.number("t", t);
  Check_default.typeOf.object("result", result);
  lerpScratch4 = Quaternion.multiplyByScalar(end, t, lerpScratch4);
  result = Quaternion.multiplyByScalar(start, 1 - t, result);
  return Quaternion.add(lerpScratch4, result, result);
};
var slerpEndNegated = new Quaternion();
var slerpScaledP = new Quaternion();
var slerpScaledR = new Quaternion();
Quaternion.slerp = function(start, end, t, result) {
  Check_default.typeOf.object("start", start);
  Check_default.typeOf.object("end", end);
  Check_default.typeOf.number("t", t);
  Check_default.typeOf.object("result", result);
  let dot = Quaternion.dot(start, end);
  let r = end;
  if (dot < 0) {
    dot = -dot;
    r = slerpEndNegated = Quaternion.negate(end, slerpEndNegated);
  }
  if (1 - dot < Math_default.EPSILON6) {
    return Quaternion.lerp(start, r, t, result);
  }
  const theta = Math.acos(dot);
  slerpScaledP = Quaternion.multiplyByScalar(
    start,
    Math.sin((1 - t) * theta),
    slerpScaledP
  );
  slerpScaledR = Quaternion.multiplyByScalar(
    r,
    Math.sin(t * theta),
    slerpScaledR
  );
  result = Quaternion.add(slerpScaledP, slerpScaledR, result);
  return Quaternion.multiplyByScalar(result, 1 / Math.sin(theta), result);
};
Quaternion.log = function(quaternion, result) {
  Check_default.typeOf.object("quaternion", quaternion);
  Check_default.typeOf.object("result", result);
  const theta = Math_default.acosClamped(quaternion.w);
  let thetaOverSinTheta = 0;
  if (theta !== 0) {
    thetaOverSinTheta = theta / Math.sin(theta);
  }
  return Cartesian3_default.multiplyByScalar(quaternion, thetaOverSinTheta, result);
};
Quaternion.exp = function(cartesian, result) {
  Check_default.typeOf.object("cartesian", cartesian);
  Check_default.typeOf.object("result", result);
  const theta = Cartesian3_default.magnitude(cartesian);
  let sinThetaOverTheta = 0;
  if (theta !== 0) {
    sinThetaOverTheta = Math.sin(theta) / theta;
  }
  result.x = cartesian.x * sinThetaOverTheta;
  result.y = cartesian.y * sinThetaOverTheta;
  result.z = cartesian.z * sinThetaOverTheta;
  result.w = Math.cos(theta);
  return result;
};
var squadScratchCartesian0 = new Cartesian3_default();
var squadScratchCartesian1 = new Cartesian3_default();
var squadScratchQuaternion0 = new Quaternion();
var squadScratchQuaternion1 = new Quaternion();
Quaternion.computeInnerQuadrangle = function(q0, q1, q2, result) {
  Check_default.typeOf.object("q0", q0);
  Check_default.typeOf.object("q1", q1);
  Check_default.typeOf.object("q2", q2);
  Check_default.typeOf.object("result", result);
  const qInv = Quaternion.conjugate(q1, squadScratchQuaternion0);
  Quaternion.multiply(qInv, q2, squadScratchQuaternion1);
  const cart0 = Quaternion.log(squadScratchQuaternion1, squadScratchCartesian0);
  Quaternion.multiply(qInv, q0, squadScratchQuaternion1);
  const cart1 = Quaternion.log(squadScratchQuaternion1, squadScratchCartesian1);
  Cartesian3_default.add(cart0, cart1, cart0);
  Cartesian3_default.multiplyByScalar(cart0, 0.25, cart0);
  Cartesian3_default.negate(cart0, cart0);
  Quaternion.exp(cart0, squadScratchQuaternion0);
  return Quaternion.multiply(q1, squadScratchQuaternion0, result);
};
Quaternion.squad = function(q0, q1, s0, s1, t, result) {
  Check_default.typeOf.object("q0", q0);
  Check_default.typeOf.object("q1", q1);
  Check_default.typeOf.object("s0", s0);
  Check_default.typeOf.object("s1", s1);
  Check_default.typeOf.number("t", t);
  Check_default.typeOf.object("result", result);
  const slerp0 = Quaternion.slerp(q0, q1, t, squadScratchQuaternion0);
  const slerp1 = Quaternion.slerp(s0, s1, t, squadScratchQuaternion1);
  return Quaternion.slerp(slerp0, slerp1, 2 * t * (1 - t), result);
};
var fastSlerpScratchQuaternion = new Quaternion();
var opmu = 1.9011074535173003;
var u = FeatureDetection_default.supportsTypedArrays() ? new Float32Array(8) : [];
var v = FeatureDetection_default.supportsTypedArrays() ? new Float32Array(8) : [];
var bT = FeatureDetection_default.supportsTypedArrays() ? new Float32Array(8) : [];
var bD = FeatureDetection_default.supportsTypedArrays() ? new Float32Array(8) : [];
for (let i = 0; i < 7; ++i) {
  const s = i + 1;
  const t = 2 * s + 1;
  u[i] = 1 / (s * t);
  v[i] = s / t;
}
u[7] = opmu / (8 * 17);
v[7] = opmu * 8 / 17;
Quaternion.fastSlerp = function(start, end, t, result) {
  Check_default.typeOf.object("start", start);
  Check_default.typeOf.object("end", end);
  Check_default.typeOf.number("t", t);
  Check_default.typeOf.object("result", result);
  let x = Quaternion.dot(start, end);
  let sign2;
  if (x >= 0) {
    sign2 = 1;
  } else {
    sign2 = -1;
    x = -x;
  }
  const xm1 = x - 1;
  const d = 1 - t;
  const sqrT = t * t;
  const sqrD = d * d;
  for (let i = 7; i >= 0; --i) {
    bT[i] = (u[i] * sqrT - v[i]) * xm1;
    bD[i] = (u[i] * sqrD - v[i]) * xm1;
  }
  const cT = sign2 * t * (1 + bT[0] * (1 + bT[1] * (1 + bT[2] * (1 + bT[3] * (1 + bT[4] * (1 + bT[5] * (1 + bT[6] * (1 + bT[7]))))))));
  const cD = d * (1 + bD[0] * (1 + bD[1] * (1 + bD[2] * (1 + bD[3] * (1 + bD[4] * (1 + bD[5] * (1 + bD[6] * (1 + bD[7]))))))));
  const temp = Quaternion.multiplyByScalar(
    start,
    cD,
    fastSlerpScratchQuaternion
  );
  Quaternion.multiplyByScalar(end, cT, result);
  return Quaternion.add(temp, result, result);
};
Quaternion.fastSquad = function(q0, q1, s0, s1, t, result) {
  Check_default.typeOf.object("q0", q0);
  Check_default.typeOf.object("q1", q1);
  Check_default.typeOf.object("s0", s0);
  Check_default.typeOf.object("s1", s1);
  Check_default.typeOf.number("t", t);
  Check_default.typeOf.object("result", result);
  const slerp0 = Quaternion.fastSlerp(q0, q1, t, squadScratchQuaternion0);
  const slerp1 = Quaternion.fastSlerp(s0, s1, t, squadScratchQuaternion1);
  return Quaternion.fastSlerp(slerp0, slerp1, 2 * t * (1 - t), result);
};
Quaternion.equals = function(left, right) {
  return left === right || defined_default(left) && defined_default(right) && left.x === right.x && left.y === right.y && left.z === right.z && left.w === right.w;
};
Quaternion.equalsEpsilon = function(left, right, epsilon) {
  epsilon = epsilon ?? 0;
  return left === right || defined_default(left) && defined_default(right) && Math.abs(left.x - right.x) <= epsilon && Math.abs(left.y - right.y) <= epsilon && Math.abs(left.z - right.z) <= epsilon && Math.abs(left.w - right.w) <= epsilon;
};
Quaternion.ZERO = Object.freeze(new Quaternion(0, 0, 0, 0));
Quaternion.IDENTITY = Object.freeze(new Quaternion(0, 0, 0, 1));
Quaternion.prototype.clone = function(result) {
  return Quaternion.clone(this, result);
};
Quaternion.prototype.equals = function(right) {
  return Quaternion.equals(this, right);
};
Quaternion.prototype.equalsEpsilon = function(right, epsilon) {
  return Quaternion.equalsEpsilon(this, right, epsilon);
};
Quaternion.prototype.toString = function() {
  return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
};
var Quaternion_default = Quaternion;

// node_modules/@cesium/engine/Source/Core/Transforms.js
var Transforms = {};
var vectorProductLocalFrame = {
  up: {
    south: "east",
    north: "west",
    west: "south",
    east: "north"
  },
  down: {
    south: "west",
    north: "east",
    west: "north",
    east: "south"
  },
  south: {
    up: "west",
    down: "east",
    west: "down",
    east: "up"
  },
  north: {
    up: "east",
    down: "west",
    west: "up",
    east: "down"
  },
  west: {
    up: "north",
    down: "south",
    north: "down",
    south: "up"
  },
  east: {
    up: "south",
    down: "north",
    north: "up",
    south: "down"
  }
};
var degeneratePositionLocalFrame = {
  north: [-1, 0, 0],
  east: [0, 1, 0],
  up: [0, 0, 1],
  south: [1, 0, 0],
  west: [0, -1, 0],
  down: [0, 0, -1]
};
var localFrameToFixedFrameCache = {};
var scratchCalculateCartesian = {
  east: new Cartesian3_default(),
  north: new Cartesian3_default(),
  up: new Cartesian3_default(),
  west: new Cartesian3_default(),
  south: new Cartesian3_default(),
  down: new Cartesian3_default()
};
var scratchFirstCartesian = new Cartesian3_default();
var scratchSecondCartesian = new Cartesian3_default();
var scratchThirdCartesian = new Cartesian3_default();
Transforms.localFrameToFixedFrameGenerator = function(firstAxis, secondAxis) {
  if (!vectorProductLocalFrame.hasOwnProperty(firstAxis) || !vectorProductLocalFrame[firstAxis].hasOwnProperty(secondAxis)) {
    throw new DeveloperError_default(
      "firstAxis and secondAxis must be east, north, up, west, south or down."
    );
  }
  const thirdAxis = vectorProductLocalFrame[firstAxis][secondAxis];
  let resultat;
  const hashAxis = firstAxis + secondAxis;
  if (defined_default(localFrameToFixedFrameCache[hashAxis])) {
    resultat = localFrameToFixedFrameCache[hashAxis];
  } else {
    resultat = function(origin, ellipsoid, result) {
      if (!defined_default(origin)) {
        throw new DeveloperError_default("origin is required.");
      }
      if (isNaN(origin.x) || isNaN(origin.y) || isNaN(origin.z)) {
        throw new DeveloperError_default("origin has a NaN component");
      }
      if (!defined_default(result)) {
        result = new Matrix4_default();
      }
      if (Cartesian3_default.equalsEpsilon(origin, Cartesian3_default.ZERO, Math_default.EPSILON14)) {
        Cartesian3_default.unpack(
          degeneratePositionLocalFrame[firstAxis],
          0,
          scratchFirstCartesian
        );
        Cartesian3_default.unpack(
          degeneratePositionLocalFrame[secondAxis],
          0,
          scratchSecondCartesian
        );
        Cartesian3_default.unpack(
          degeneratePositionLocalFrame[thirdAxis],
          0,
          scratchThirdCartesian
        );
      } else if (Math_default.equalsEpsilon(origin.x, 0, Math_default.EPSILON14) && Math_default.equalsEpsilon(origin.y, 0, Math_default.EPSILON14)) {
        const sign2 = Math_default.sign(origin.z);
        Cartesian3_default.unpack(
          degeneratePositionLocalFrame[firstAxis],
          0,
          scratchFirstCartesian
        );
        if (firstAxis !== "east" && firstAxis !== "west") {
          Cartesian3_default.multiplyByScalar(
            scratchFirstCartesian,
            sign2,
            scratchFirstCartesian
          );
        }
        Cartesian3_default.unpack(
          degeneratePositionLocalFrame[secondAxis],
          0,
          scratchSecondCartesian
        );
        if (secondAxis !== "east" && secondAxis !== "west") {
          Cartesian3_default.multiplyByScalar(
            scratchSecondCartesian,
            sign2,
            scratchSecondCartesian
          );
        }
        Cartesian3_default.unpack(
          degeneratePositionLocalFrame[thirdAxis],
          0,
          scratchThirdCartesian
        );
        if (thirdAxis !== "east" && thirdAxis !== "west") {
          Cartesian3_default.multiplyByScalar(
            scratchThirdCartesian,
            sign2,
            scratchThirdCartesian
          );
        }
      } else {
        ellipsoid = ellipsoid ?? Ellipsoid_default.default;
        ellipsoid.geodeticSurfaceNormal(origin, scratchCalculateCartesian.up);
        const up = scratchCalculateCartesian.up;
        const east = scratchCalculateCartesian.east;
        east.x = -origin.y;
        east.y = origin.x;
        east.z = 0;
        Cartesian3_default.normalize(east, scratchCalculateCartesian.east);
        Cartesian3_default.cross(up, east, scratchCalculateCartesian.north);
        Cartesian3_default.multiplyByScalar(
          scratchCalculateCartesian.up,
          -1,
          scratchCalculateCartesian.down
        );
        Cartesian3_default.multiplyByScalar(
          scratchCalculateCartesian.east,
          -1,
          scratchCalculateCartesian.west
        );
        Cartesian3_default.multiplyByScalar(
          scratchCalculateCartesian.north,
          -1,
          scratchCalculateCartesian.south
        );
        scratchFirstCartesian = scratchCalculateCartesian[firstAxis];
        scratchSecondCartesian = scratchCalculateCartesian[secondAxis];
        scratchThirdCartesian = scratchCalculateCartesian[thirdAxis];
      }
      result[0] = scratchFirstCartesian.x;
      result[1] = scratchFirstCartesian.y;
      result[2] = scratchFirstCartesian.z;
      result[3] = 0;
      result[4] = scratchSecondCartesian.x;
      result[5] = scratchSecondCartesian.y;
      result[6] = scratchSecondCartesian.z;
      result[7] = 0;
      result[8] = scratchThirdCartesian.x;
      result[9] = scratchThirdCartesian.y;
      result[10] = scratchThirdCartesian.z;
      result[11] = 0;
      result[12] = origin.x;
      result[13] = origin.y;
      result[14] = origin.z;
      result[15] = 1;
      return result;
    };
    localFrameToFixedFrameCache[hashAxis] = resultat;
  }
  return resultat;
};
Transforms.eastNorthUpToFixedFrame = Transforms.localFrameToFixedFrameGenerator(
  "east",
  "north"
);
Transforms.northEastDownToFixedFrame = Transforms.localFrameToFixedFrameGenerator("north", "east");
Transforms.northUpEastToFixedFrame = Transforms.localFrameToFixedFrameGenerator(
  "north",
  "up"
);
Transforms.northWestUpToFixedFrame = Transforms.localFrameToFixedFrameGenerator(
  "north",
  "west"
);
var scratchHPRQuaternion2 = new Quaternion_default();
var scratchScale = new Cartesian3_default(1, 1, 1);
var scratchHPRMatrix4 = new Matrix4_default();
Transforms.headingPitchRollToFixedFrame = function(origin, headingPitchRoll, ellipsoid, fixedFrameTransform, result) {
  Check_default.typeOf.object("HeadingPitchRoll", headingPitchRoll);
  fixedFrameTransform = fixedFrameTransform ?? Transforms.eastNorthUpToFixedFrame;
  const hprQuaternion = Quaternion_default.fromHeadingPitchRoll(
    headingPitchRoll,
    scratchHPRQuaternion2
  );
  const hprMatrix = Matrix4_default.fromTranslationQuaternionRotationScale(
    Cartesian3_default.ZERO,
    hprQuaternion,
    scratchScale,
    scratchHPRMatrix4
  );
  result = fixedFrameTransform(origin, ellipsoid, result);
  return Matrix4_default.multiply(result, hprMatrix, result);
};
var scratchENUMatrix4 = new Matrix4_default();
var scratchHPRMatrix3 = new Matrix3_default();
Transforms.headingPitchRollQuaternion = function(origin, headingPitchRoll, ellipsoid, fixedFrameTransform, result) {
  Check_default.typeOf.object("HeadingPitchRoll", headingPitchRoll);
  const transform = Transforms.headingPitchRollToFixedFrame(
    origin,
    headingPitchRoll,
    ellipsoid,
    fixedFrameTransform,
    scratchENUMatrix4
  );
  const rotation = Matrix4_default.getMatrix3(transform, scratchHPRMatrix3);
  return Quaternion_default.fromRotationMatrix(rotation, result);
};
var noScale = new Cartesian3_default(1, 1, 1);
var hprCenterScratch = new Cartesian3_default();
var ffScratch = new Matrix4_default();
var hprTransformScratch = new Matrix4_default();
var hprRotationScratch = new Matrix3_default();
var hprQuaternionScratch = new Quaternion_default();
Transforms.fixedFrameToHeadingPitchRoll = function(transform, ellipsoid, fixedFrameTransform, result) {
  Check_default.defined("transform", transform);
  ellipsoid = ellipsoid ?? Ellipsoid_default.default;
  fixedFrameTransform = fixedFrameTransform ?? Transforms.eastNorthUpToFixedFrame;
  if (!defined_default(result)) {
    result = new HeadingPitchRoll_default();
  }
  const center = Matrix4_default.getTranslation(transform, hprCenterScratch);
  if (Cartesian3_default.equals(center, Cartesian3_default.ZERO)) {
    result.heading = 0;
    result.pitch = 0;
    result.roll = 0;
    return result;
  }
  let toFixedFrame = Matrix4_default.inverseTransformation(
    fixedFrameTransform(center, ellipsoid, ffScratch),
    ffScratch
  );
  let transformCopy = Matrix4_default.setScale(transform, noScale, hprTransformScratch);
  transformCopy = Matrix4_default.setTranslation(
    transformCopy,
    Cartesian3_default.ZERO,
    transformCopy
  );
  toFixedFrame = Matrix4_default.multiply(toFixedFrame, transformCopy, toFixedFrame);
  let quaternionRotation = Quaternion_default.fromRotationMatrix(
    Matrix4_default.getMatrix3(toFixedFrame, hprRotationScratch),
    hprQuaternionScratch
  );
  quaternionRotation = Quaternion_default.normalize(
    quaternionRotation,
    quaternionRotation
  );
  return HeadingPitchRoll_default.fromQuaternion(quaternionRotation, result);
};
var gmstConstant0 = 6 * 3600 + 41 * 60 + 50.54841;
var gmstConstant1 = 8640184812866e-6;
var gmstConstant2 = 0.093104;
var gmstConstant3 = -62e-7;
var rateCoef = 11772758384668e-32;
var wgs84WRPrecessing = 72921158553e-15;
var twoPiOverSecondsInDay = Math_default.TWO_PI / 86400;
var dateInUtc = new JulianDate_default();
Transforms.computeIcrfToCentralBodyFixedMatrix = function(date, result) {
  let transformMatrix = Transforms.computeIcrfToFixedMatrix(date, result);
  if (!defined_default(transformMatrix)) {
    transformMatrix = Transforms.computeTemeToPseudoFixedMatrix(date, result);
  }
  return transformMatrix;
};
Transforms.computeTemeToPseudoFixedMatrix = function(date, result) {
  if (!defined_default(date)) {
    throw new DeveloperError_default("date is required.");
  }
  dateInUtc = JulianDate_default.addSeconds(
    date,
    -JulianDate_default.computeTaiMinusUtc(date),
    dateInUtc
  );
  const utcDayNumber = dateInUtc.dayNumber;
  const utcSecondsIntoDay = dateInUtc.secondsOfDay;
  let t;
  const diffDays = utcDayNumber - 2451545;
  if (utcSecondsIntoDay >= 43200) {
    t = (diffDays + 0.5) / TimeConstants_default.DAYS_PER_JULIAN_CENTURY;
  } else {
    t = (diffDays - 0.5) / TimeConstants_default.DAYS_PER_JULIAN_CENTURY;
  }
  const gmst0 = gmstConstant0 + t * (gmstConstant1 + t * (gmstConstant2 + t * gmstConstant3));
  const angle = gmst0 * twoPiOverSecondsInDay % Math_default.TWO_PI;
  const ratio = wgs84WRPrecessing + rateCoef * (utcDayNumber - 24515455e-1);
  const secondsSinceMidnight = (utcSecondsIntoDay + TimeConstants_default.SECONDS_PER_DAY * 0.5) % TimeConstants_default.SECONDS_PER_DAY;
  const gha = angle + ratio * secondsSinceMidnight;
  const cosGha = Math.cos(gha);
  const sinGha = Math.sin(gha);
  if (!defined_default(result)) {
    return new Matrix3_default(
      cosGha,
      sinGha,
      0,
      -sinGha,
      cosGha,
      0,
      0,
      0,
      1
    );
  }
  result[0] = cosGha;
  result[1] = -sinGha;
  result[2] = 0;
  result[3] = sinGha;
  result[4] = cosGha;
  result[5] = 0;
  result[6] = 0;
  result[7] = 0;
  result[8] = 1;
  return result;
};
Transforms.iau2006XysData = new Iau2006XysData_default();
Transforms.earthOrientationParameters = EarthOrientationParameters_default.NONE;
var ttMinusTai = 32.184;
var j2000ttDays = 2451545;
Transforms.preloadIcrfFixed = function(timeInterval) {
  const startDayTT = timeInterval.start.dayNumber;
  const startSecondTT = timeInterval.start.secondsOfDay + ttMinusTai;
  const stopDayTT = timeInterval.stop.dayNumber;
  const stopSecondTT = timeInterval.stop.secondsOfDay + ttMinusTai;
  return Transforms.iau2006XysData.preload(
    startDayTT,
    startSecondTT,
    stopDayTT,
    stopSecondTT
  );
};
Transforms.computeIcrfToFixedMatrix = function(date, result) {
  if (!defined_default(date)) {
    throw new DeveloperError_default("date is required.");
  }
  if (!defined_default(result)) {
    result = new Matrix3_default();
  }
  const fixedToIcrfMtx = Transforms.computeFixedToIcrfMatrix(date, result);
  if (!defined_default(fixedToIcrfMtx)) {
    return void 0;
  }
  return Matrix3_default.transpose(fixedToIcrfMtx, result);
};
var TdtMinusTai = 32.184;
var J2000d = 2451545;
var scratchHpr = new HeadingPitchRoll_default();
var scratchRotationMatrix = new Matrix3_default();
var dateScratch = new JulianDate_default();
Transforms.computeMoonFixedToIcrfMatrix = function(date, result) {
  if (!defined_default(date)) {
    throw new DeveloperError_default("date is required.");
  }
  if (!defined_default(result)) {
    result = new Matrix3_default();
  }
  const secondsTT = JulianDate_default.addSeconds(date, TdtMinusTai, dateScratch);
  const d = JulianDate_default.totalDays(secondsTT) - J2000d;
  const e1 = Math_default.toRadians(12.112) - Math_default.toRadians(0.052992) * d;
  const e2 = Math_default.toRadians(24.224) - Math_default.toRadians(0.105984) * d;
  const e3 = Math_default.toRadians(227.645) + Math_default.toRadians(13.012) * d;
  const e4 = Math_default.toRadians(261.105) + Math_default.toRadians(13.340716) * d;
  const e5 = Math_default.toRadians(358) + Math_default.toRadians(0.9856) * d;
  scratchHpr.pitch = Math_default.toRadians(270 - 90) - Math_default.toRadians(3.878) * Math.sin(e1) - Math_default.toRadians(0.12) * Math.sin(e2) + Math_default.toRadians(0.07) * Math.sin(e3) - Math_default.toRadians(0.017) * Math.sin(e4);
  scratchHpr.roll = Math_default.toRadians(66.53 - 90) + Math_default.toRadians(1.543) * Math.cos(e1) + Math_default.toRadians(0.24) * Math.cos(e2) - Math_default.toRadians(0.028) * Math.cos(e3) + Math_default.toRadians(7e-3) * Math.cos(e4);
  scratchHpr.heading = Math_default.toRadians(244.375 - 90) + Math_default.toRadians(13.17635831) * d + Math_default.toRadians(3.558) * Math.sin(e1) + Math_default.toRadians(0.121) * Math.sin(e2) - Math_default.toRadians(0.064) * Math.sin(e3) + Math_default.toRadians(0.016) * Math.sin(e4) + Math_default.toRadians(0.025) * Math.sin(e5);
  return Matrix3_default.fromHeadingPitchRoll(scratchHpr, scratchRotationMatrix);
};
Transforms.computeIcrfToMoonFixedMatrix = function(date, result) {
  if (!defined_default(date)) {
    throw new DeveloperError_default("date is required.");
  }
  if (!defined_default(result)) {
    result = new Matrix3_default();
  }
  const fixedToIcrfMtx = Transforms.computeMoonFixedToIcrfMatrix(date, result);
  if (!defined_default(fixedToIcrfMtx)) {
    return void 0;
  }
  return Matrix3_default.transpose(fixedToIcrfMtx, result);
};
var xysScratch = new Iau2006XysSample_default(0, 0, 0);
var eopScratch = new EarthOrientationParametersSample_default(
  0,
  0,
  0,
  0,
  0,
  0
);
var rotation1Scratch = new Matrix3_default();
var rotation2Scratch = new Matrix3_default();
Transforms.computeFixedToIcrfMatrix = function(date, result) {
  if (!defined_default(date)) {
    throw new DeveloperError_default("date is required.");
  }
  if (!defined_default(result)) {
    result = new Matrix3_default();
  }
  const eop = Transforms.earthOrientationParameters.compute(date, eopScratch);
  if (!defined_default(eop)) {
    return void 0;
  }
  const dayTT = date.dayNumber;
  const secondTT = date.secondsOfDay + ttMinusTai;
  const xys = Transforms.iau2006XysData.computeXysRadians(
    dayTT,
    secondTT,
    xysScratch
  );
  if (!defined_default(xys)) {
    return void 0;
  }
  const x = xys.x + eop.xPoleOffset;
  const y = xys.y + eop.yPoleOffset;
  const a3 = 1 / (1 + Math.sqrt(1 - x * x - y * y));
  const rotation1 = rotation1Scratch;
  rotation1[0] = 1 - a3 * x * x;
  rotation1[3] = -a3 * x * y;
  rotation1[6] = x;
  rotation1[1] = -a3 * x * y;
  rotation1[4] = 1 - a3 * y * y;
  rotation1[7] = y;
  rotation1[2] = -x;
  rotation1[5] = -y;
  rotation1[8] = 1 - a3 * (x * x + y * y);
  const rotation2 = Matrix3_default.fromRotationZ(-xys.s, rotation2Scratch);
  const matrixQ = Matrix3_default.multiply(rotation1, rotation2, rotation1Scratch);
  const dateUt1day = date.dayNumber;
  const dateUt1sec = date.secondsOfDay - JulianDate_default.computeTaiMinusUtc(date) + eop.ut1MinusUtc;
  const daysSinceJ2000 = dateUt1day - 2451545;
  const fractionOfDay = dateUt1sec / TimeConstants_default.SECONDS_PER_DAY;
  let era = 0.779057273264 + fractionOfDay + 0.00273781191135448 * (daysSinceJ2000 + fractionOfDay);
  era = era % 1 * Math_default.TWO_PI;
  const earthRotation = Matrix3_default.fromRotationZ(era, rotation2Scratch);
  const pfToIcrf = Matrix3_default.multiply(matrixQ, earthRotation, rotation1Scratch);
  const cosxp = Math.cos(eop.xPoleWander);
  const cosyp = Math.cos(eop.yPoleWander);
  const sinxp = Math.sin(eop.xPoleWander);
  const sinyp = Math.sin(eop.yPoleWander);
  let ttt = dayTT - j2000ttDays + secondTT / TimeConstants_default.SECONDS_PER_DAY;
  ttt /= 36525;
  const sp = -47e-6 * ttt * Math_default.RADIANS_PER_DEGREE / 3600;
  const cossp = Math.cos(sp);
  const sinsp = Math.sin(sp);
  const fToPfMtx = rotation2Scratch;
  fToPfMtx[0] = cosxp * cossp;
  fToPfMtx[1] = cosxp * sinsp;
  fToPfMtx[2] = sinxp;
  fToPfMtx[3] = -cosyp * sinsp + sinyp * sinxp * cossp;
  fToPfMtx[4] = cosyp * cossp + sinyp * sinxp * sinsp;
  fToPfMtx[5] = -sinyp * cosxp;
  fToPfMtx[6] = -sinyp * sinsp - cosyp * sinxp * cossp;
  fToPfMtx[7] = sinyp * cossp - cosyp * sinxp * sinsp;
  fToPfMtx[8] = cosyp * cosxp;
  return Matrix3_default.multiply(pfToIcrf, fToPfMtx, result);
};
var pointToWindowCoordinatesTemp = new Cartesian4_default();
Transforms.pointToWindowCoordinates = function(modelViewProjectionMatrix, viewportTransformation, point, result) {
  result = Transforms.pointToGLWindowCoordinates(
    modelViewProjectionMatrix,
    viewportTransformation,
    point,
    result
  );
  result.y = 2 * viewportTransformation[5] - result.y;
  return result;
};
Transforms.pointToGLWindowCoordinates = function(modelViewProjectionMatrix, viewportTransformation, point, result) {
  if (!defined_default(modelViewProjectionMatrix)) {
    throw new DeveloperError_default("modelViewProjectionMatrix is required.");
  }
  if (!defined_default(viewportTransformation)) {
    throw new DeveloperError_default("viewportTransformation is required.");
  }
  if (!defined_default(point)) {
    throw new DeveloperError_default("point is required.");
  }
  if (!defined_default(result)) {
    result = new Cartesian2_default();
  }
  const tmp = pointToWindowCoordinatesTemp;
  Matrix4_default.multiplyByVector(
    modelViewProjectionMatrix,
    Cartesian4_default.fromElements(point.x, point.y, point.z, 1, tmp),
    tmp
  );
  Cartesian4_default.multiplyByScalar(tmp, 1 / tmp.w, tmp);
  Matrix4_default.multiplyByVector(viewportTransformation, tmp, tmp);
  return Cartesian2_default.fromCartesian4(tmp, result);
};
var normalScratch = new Cartesian3_default();
var rightScratch = new Cartesian3_default();
var upScratch = new Cartesian3_default();
Transforms.rotationMatrixFromPositionVelocity = function(position, velocity, ellipsoid, result) {
  if (!defined_default(position)) {
    throw new DeveloperError_default("position is required.");
  }
  if (!defined_default(velocity)) {
    throw new DeveloperError_default("velocity is required.");
  }
  const normal = (ellipsoid ?? Ellipsoid_default.default).geodeticSurfaceNormal(
    position,
    normalScratch
  );
  let right = Cartesian3_default.cross(velocity, normal, rightScratch);
  if (Cartesian3_default.equalsEpsilon(right, Cartesian3_default.ZERO, Math_default.EPSILON6)) {
    right = Cartesian3_default.clone(Cartesian3_default.UNIT_X, right);
  }
  const up = Cartesian3_default.cross(right, velocity, upScratch);
  Cartesian3_default.normalize(up, up);
  Cartesian3_default.cross(velocity, up, right);
  Cartesian3_default.negate(right, right);
  Cartesian3_default.normalize(right, right);
  if (!defined_default(result)) {
    result = new Matrix3_default();
  }
  result[0] = velocity.x;
  result[1] = velocity.y;
  result[2] = velocity.z;
  result[3] = right.x;
  result[4] = right.y;
  result[5] = right.z;
  result[6] = up.x;
  result[7] = up.y;
  result[8] = up.z;
  return result;
};
Transforms.SWIZZLE_3D_TO_2D_MATRIX = Object.freeze(
  new Matrix4_default(
    0,
    0,
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1
  )
);
var scratchCartographic = new Cartographic_default();
var scratchCartesian3Projection = new Cartesian3_default();
var scratchCenter = new Cartesian3_default();
var scratchRotation = new Matrix3_default();
var scratchFromENU = new Matrix4_default();
var scratchToENU = new Matrix4_default();
Transforms.basisTo2D = function(projection, matrix, result) {
  if (!defined_default(projection)) {
    throw new DeveloperError_default("projection is required.");
  }
  if (!defined_default(matrix)) {
    throw new DeveloperError_default("matrix is required.");
  }
  if (!defined_default(result)) {
    throw new DeveloperError_default("result is required.");
  }
  const rtcCenter = Matrix4_default.getTranslation(matrix, scratchCenter);
  const ellipsoid = projection.ellipsoid;
  let projectedPosition;
  if (Cartesian3_default.equals(rtcCenter, Cartesian3_default.ZERO)) {
    projectedPosition = Cartesian3_default.clone(
      Cartesian3_default.ZERO,
      scratchCartesian3Projection
    );
  } else {
    const cartographic = ellipsoid.cartesianToCartographic(
      rtcCenter,
      scratchCartographic
    );
    projectedPosition = projection.project(
      cartographic,
      scratchCartesian3Projection
    );
    Cartesian3_default.fromElements(
      projectedPosition.z,
      projectedPosition.x,
      projectedPosition.y,
      projectedPosition
    );
  }
  const fromENU = Transforms.eastNorthUpToFixedFrame(
    rtcCenter,
    ellipsoid,
    scratchFromENU
  );
  const toENU = Matrix4_default.inverseTransformation(fromENU, scratchToENU);
  const rotation = Matrix4_default.getMatrix3(matrix, scratchRotation);
  const local = Matrix4_default.multiplyByMatrix3(toENU, rotation, result);
  Matrix4_default.multiply(Transforms.SWIZZLE_3D_TO_2D_MATRIX, local, result);
  Matrix4_default.setTranslation(result, projectedPosition, result);
  return result;
};
Transforms.ellipsoidTo2DModelMatrix = function(projection, center, result) {
  if (!defined_default(projection)) {
    throw new DeveloperError_default("projection is required.");
  }
  if (!defined_default(center)) {
    throw new DeveloperError_default("center is required.");
  }
  if (!defined_default(result)) {
    throw new DeveloperError_default("result is required.");
  }
  const ellipsoid = projection.ellipsoid;
  const fromENU = Transforms.eastNorthUpToFixedFrame(
    center,
    ellipsoid,
    scratchFromENU
  );
  const toENU = Matrix4_default.inverseTransformation(fromENU, scratchToENU);
  const cartographic = ellipsoid.cartesianToCartographic(
    center,
    scratchCartographic
  );
  const projectedPosition = projection.project(
    cartographic,
    scratchCartesian3Projection
  );
  Cartesian3_default.fromElements(
    projectedPosition.z,
    projectedPosition.x,
    projectedPosition.y,
    projectedPosition
  );
  const translation = Matrix4_default.fromTranslation(
    projectedPosition,
    scratchFromENU
  );
  Matrix4_default.multiply(Transforms.SWIZZLE_3D_TO_2D_MATRIX, toENU, result);
  Matrix4_default.multiply(translation, result, result);
  return result;
};
var Transforms_default = Transforms;

// node_modules/@cesium/engine/Source/Core/Rectangle.js
var Rectangle = class _Rectangle {
  /**
   * @param {number} [west=0.0] The westernmost longitude, in radians, in the range [-Pi, Pi].
   * @param {number} [south=0.0] The southernmost latitude, in radians, in the range [-Pi/2, Pi/2].
   * @param {number} [east=0.0] The easternmost longitude, in radians, in the range [-Pi, Pi].
   * @param {number} [north=0.0] The northernmost latitude, in radians, in the range [-Pi/2, Pi/2].
   */
  constructor(west, south, east, north) {
    this.west = west ?? 0;
    this.south = south ?? 0;
    this.east = east ?? 0;
    this.north = north ?? 0;
  }
  /**
   * Gets the width of the rectangle in radians.
   * @type {number}
   * @readonly
   */
  get width() {
    return _Rectangle.computeWidth(this);
  }
  /**
   * Gets the height of the rectangle in radians.
   * @type {number}
   * @readonly
   */
  get height() {
    return _Rectangle.computeHeight(this);
  }
  /**
   * Stores the provided instance into the provided array.
   *
   * @param {Rectangle} value The value to pack.
   * @param {number[]} array The array to pack into.
   * @param {number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {number[]} The array that was packed into
   */
  static pack(value, array, startingIndex) {
    Check_default.typeOf.object("value", value);
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    array[startingIndex++] = value.west;
    array[startingIndex++] = value.south;
    array[startingIndex++] = value.east;
    array[startingIndex] = value.north;
    return array;
  }
  /**
   * Retrieves an instance from a packed array.
   *
   * @param {number[]} array The packed array.
   * @param {number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {Rectangle} [result] The object into which to store the result.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if one was not provided.
   */
  static unpack(array, startingIndex, result) {
    Check_default.defined("array", array);
    startingIndex = startingIndex ?? 0;
    if (!defined_default(result)) {
      result = new _Rectangle();
    }
    result.west = array[startingIndex++];
    result.south = array[startingIndex++];
    result.east = array[startingIndex++];
    result.north = array[startingIndex];
    return result;
  }
  /**
   * Computes the width of a rectangle in radians.
   * @param {Rectangle} rectangle The rectangle to compute the width of.
   * @returns {number} The width.
   */
  static computeWidth(rectangle) {
    Check_default.typeOf.object("rectangle", rectangle);
    let east = rectangle.east;
    const west = rectangle.west;
    if (east < west) {
      east += Math_default.TWO_PI;
    }
    return east - west;
  }
  /**
   * Computes the height of a rectangle in radians.
   * @param {Rectangle} rectangle The rectangle to compute the height of.
   * @returns {number} The height.
   */
  static computeHeight(rectangle) {
    Check_default.typeOf.object("rectangle", rectangle);
    return rectangle.north - rectangle.south;
  }
  /**
   * Creates a rectangle given the boundary longitude and latitude in degrees.
   *
   * @param {number} [west=0.0] The westernmost longitude in degrees in the range [-180.0, 180.0].
   * @param {number} [south=0.0] The southernmost latitude in degrees in the range [-90.0, 90.0].
   * @param {number} [east=0.0] The easternmost longitude in degrees in the range [-180.0, 180.0].
   * @param {number} [north=0.0] The northernmost latitude in degrees in the range [-90.0, 90.0].
   * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
   *
   * @example
   * const rectangle = Cesium.Rectangle.fromDegrees(0.0, 20.0, 10.0, 30.0);
   */
  static fromDegrees(west, south, east, north, result) {
    west = Math_default.toRadians(west ?? 0);
    south = Math_default.toRadians(south ?? 0);
    east = Math_default.toRadians(east ?? 0);
    north = Math_default.toRadians(north ?? 0);
    if (!defined_default(result)) {
      return new _Rectangle(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }
  /**
   * Creates a rectangle given the boundary longitude and latitude in radians.
   *
   * @param {number} [west=0.0] The westernmost longitude in radians in the range [-Math.PI, Math.PI].
   * @param {number} [south=0.0] The southernmost latitude in radians in the range [-Math.PI/2, Math.PI/2].
   * @param {number} [east=0.0] The easternmost longitude in radians in the range [-Math.PI, Math.PI].
   * @param {number} [north=0.0] The northernmost latitude in radians in the range [-Math.PI/2, Math.PI/2].
   * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
   *
   * @example
   * const rectangle = Cesium.Rectangle.fromRadians(0.0, Math.PI/4, Math.PI/8, 3*Math.PI/4);
   */
  static fromRadians(west, south, east, north, result) {
    if (!defined_default(result)) {
      return new _Rectangle(west, south, east, north);
    }
    result.west = west ?? 0;
    result.south = south ?? 0;
    result.east = east ?? 0;
    result.north = north ?? 0;
    return result;
  }
  /**
   * Creates the smallest possible Rectangle that encloses all positions in the provided array.
   *
   * @param {Cartographic[]} cartographics The list of Cartographic instances.
   * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
   */
  static fromCartographicArray(cartographics, result) {
    Check_default.defined("cartographics", cartographics);
    let west = Number.MAX_VALUE;
    let east = -Number.MAX_VALUE;
    let westOverIDL = Number.MAX_VALUE;
    let eastOverIDL = -Number.MAX_VALUE;
    let south = Number.MAX_VALUE;
    let north = -Number.MAX_VALUE;
    for (let i = 0, len = cartographics.length; i < len; i++) {
      const position = cartographics[i];
      west = Math.min(west, position.longitude);
      east = Math.max(east, position.longitude);
      south = Math.min(south, position.latitude);
      north = Math.max(north, position.latitude);
      const lonAdjusted = position.longitude >= 0 ? position.longitude : position.longitude + Math_default.TWO_PI;
      westOverIDL = Math.min(westOverIDL, lonAdjusted);
      eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
    }
    if (east - west > eastOverIDL - westOverIDL) {
      west = westOverIDL;
      east = eastOverIDL;
      if (east > Math_default.PI) {
        east = east - Math_default.TWO_PI;
      }
      if (west > Math_default.PI) {
        west = west - Math_default.TWO_PI;
      }
    }
    if (!defined_default(result)) {
      return new _Rectangle(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }
  /**
   * Creates the smallest possible Rectangle that encloses all positions in the provided array.
   *
   * @param {Cartesian3[]} cartesians The list of Cartesian instances.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid the cartesians are on.
   * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
   */
  static fromCartesianArray(cartesians, ellipsoid, result) {
    Check_default.defined("cartesians", cartesians);
    ellipsoid = ellipsoid ?? Ellipsoid_default.default;
    let west = Number.MAX_VALUE;
    let east = -Number.MAX_VALUE;
    let westOverIDL = Number.MAX_VALUE;
    let eastOverIDL = -Number.MAX_VALUE;
    let south = Number.MAX_VALUE;
    let north = -Number.MAX_VALUE;
    for (let i = 0, len = cartesians.length; i < len; i++) {
      const position = ellipsoid.cartesianToCartographic(cartesians[i]);
      west = Math.min(west, position.longitude);
      east = Math.max(east, position.longitude);
      south = Math.min(south, position.latitude);
      north = Math.max(north, position.latitude);
      const lonAdjusted = position.longitude >= 0 ? position.longitude : position.longitude + Math_default.TWO_PI;
      westOverIDL = Math.min(westOverIDL, lonAdjusted);
      eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
    }
    if (east - west > eastOverIDL - westOverIDL) {
      west = westOverIDL;
      east = eastOverIDL;
      if (east > Math_default.PI) {
        east = east - Math_default.TWO_PI;
      }
      if (west > Math_default.PI) {
        west = west - Math_default.TWO_PI;
      }
    }
    if (!defined_default(result)) {
      return new _Rectangle(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }
  /**
   * Create a rectangle from a bounding sphere, ignoring height.
   *
   *
   * @param {BoundingSphere} boundingSphere The bounding sphere.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid.
   * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
   */
  static fromBoundingSphere(boundingSphere, ellipsoid, result) {
    Check_default.typeOf.object("boundingSphere", boundingSphere);
    const center = boundingSphere.center;
    const radius = boundingSphere.radius;
    if (!defined_default(ellipsoid)) {
      ellipsoid = Ellipsoid_default.default;
    }
    if (!defined_default(result)) {
      result = new _Rectangle();
    }
    if (Cartesian3_default.equals(center, Cartesian3_default.ZERO)) {
      _Rectangle.clone(_Rectangle.MAX_VALUE, result);
      return result;
    }
    const fromENU = Transforms_default.eastNorthUpToFixedFrame(
      center,
      ellipsoid,
      fromBoundingSphereMatrixScratch
    );
    const east = Matrix4_default.multiplyByPointAsVector(
      fromENU,
      Cartesian3_default.UNIT_X,
      fromBoundingSphereEastScratch
    );
    Cartesian3_default.normalize(east, east);
    const north = Matrix4_default.multiplyByPointAsVector(
      fromENU,
      Cartesian3_default.UNIT_Y,
      fromBoundingSphereNorthScratch
    );
    Cartesian3_default.normalize(north, north);
    Cartesian3_default.multiplyByScalar(north, radius, north);
    Cartesian3_default.multiplyByScalar(east, radius, east);
    const south = Cartesian3_default.negate(north, fromBoundingSphereSouthScratch);
    const west = Cartesian3_default.negate(east, fromBoundingSphereWestScratch);
    const positions = fromBoundingSpherePositionsScratch;
    let corner = positions[0];
    Cartesian3_default.add(center, north, corner);
    corner = positions[1];
    Cartesian3_default.add(center, west, corner);
    corner = positions[2];
    Cartesian3_default.add(center, south, corner);
    corner = positions[3];
    Cartesian3_default.add(center, east, corner);
    positions[4] = center;
    return _Rectangle.fromCartesianArray(positions, ellipsoid, result);
  }
  /**
   * Duplicates a Rectangle.
   *
   * @param {Rectangle} rectangle The rectangle to clone.
   * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided. (Returns undefined if rectangle is undefined)
   */
  static clone(rectangle, result) {
    if (!defined_default(rectangle)) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Rectangle(
        rectangle.west,
        rectangle.south,
        rectangle.east,
        rectangle.north
      );
    }
    result.west = rectangle.west;
    result.south = rectangle.south;
    result.east = rectangle.east;
    result.north = rectangle.north;
    return result;
  }
  /**
   * Compares the provided Rectangles componentwise and returns
   * <code>true</code> if they pass an absolute or relative tolerance test,
   * <code>false</code> otherwise.
   *
   * @param {Rectangle} [left] The first Rectangle.
   * @param {Rectangle} [right] The second Rectangle.
   * @param {number} [absoluteEpsilon=0] The absolute epsilon tolerance to use for equality testing.
   * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   */
  static equalsEpsilon(left, right, absoluteEpsilon) {
    absoluteEpsilon = absoluteEpsilon ?? 0;
    return left === right || defined_default(left) && defined_default(right) && Math.abs(left.west - right.west) <= absoluteEpsilon && Math.abs(left.south - right.south) <= absoluteEpsilon && Math.abs(left.east - right.east) <= absoluteEpsilon && Math.abs(left.north - right.north) <= absoluteEpsilon;
  }
  /**
   * Duplicates this Rectangle.
   *
   * @param {Rectangle} [result] The object onto which to store the result.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
   */
  clone(result) {
    return _Rectangle.clone(this, result);
  }
  /**
   * Compares the provided Rectangle with this Rectangle componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Rectangle} [other] The Rectangle to compare.
   * @returns {boolean} <code>true</code> if the Rectangles are equal, <code>false</code> otherwise.
   */
  equals(other) {
    return _Rectangle.equals(this, other);
  }
  /**
   * Compares the provided rectangles and returns <code>true</code> if they are equal,
   * <code>false</code> otherwise.
   *
   * @param {Rectangle} [left] The first Rectangle.
   * @param {Rectangle} [right] The second Rectangle.
   * @returns {boolean} <code>true</code> if left and right are equal; otherwise <code>false</code>.
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && left.west === right.west && left.south === right.south && left.east === right.east && left.north === right.north;
  }
  /**
   * Compares the provided Rectangle with this Rectangle componentwise and returns
   * <code>true</code> if they are within the provided epsilon,
   * <code>false</code> otherwise.
   *
   * @param {Rectangle} [other] The Rectangle to compare.
   * @param {number} [epsilon=0] The epsilon to use for equality testing.
   * @returns {boolean} <code>true</code> if the Rectangles are within the provided epsilon, <code>false</code> otherwise.
   */
  equalsEpsilon(other, epsilon) {
    return _Rectangle.equalsEpsilon(this, other, epsilon);
  }
  /**
   * Checks a Rectangle's properties and throws if they are not in valid ranges.
   *
   * @param {Rectangle} rectangle The rectangle to validate
   *
   * @exception {DeveloperError} <code>north</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
   * @exception {DeveloperError} <code>south</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
   * @exception {DeveloperError} <code>east</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
   * @exception {DeveloperError} <code>west</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
   * @private
   */
  static _validate(rectangle) {
    Check_default.typeOf.object("rectangle", rectangle);
    const north = rectangle.north;
    Check_default.typeOf.number.greaterThanOrEquals(
      "north",
      north,
      -Math_default.PI_OVER_TWO
    );
    Check_default.typeOf.number.lessThanOrEquals(
      "north",
      north,
      Math_default.PI_OVER_TWO
    );
    const south = rectangle.south;
    Check_default.typeOf.number.greaterThanOrEquals(
      "south",
      south,
      -Math_default.PI_OVER_TWO
    );
    Check_default.typeOf.number.lessThanOrEquals(
      "south",
      south,
      Math_default.PI_OVER_TWO
    );
    const west = rectangle.west;
    Check_default.typeOf.number.greaterThanOrEquals("west", west, -Math.PI);
    Check_default.typeOf.number.lessThanOrEquals("west", west, Math.PI);
    const east = rectangle.east;
    Check_default.typeOf.number.greaterThanOrEquals("east", east, -Math.PI);
    Check_default.typeOf.number.lessThanOrEquals("east", east, Math.PI);
  }
  /**
   * Computes the southwest corner of a rectangle.
   *
   * @param {Rectangle} rectangle The rectangle for which to find the corner
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
   */
  static southwest(rectangle, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    if (!defined_default(result)) {
      return new Cartographic_default(rectangle.west, rectangle.south);
    }
    result.longitude = rectangle.west;
    result.latitude = rectangle.south;
    result.height = 0;
    return result;
  }
  /**
   * Computes the northwest corner of a rectangle.
   *
   * @param {Rectangle} rectangle The rectangle for which to find the corner
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
   */
  static northwest(rectangle, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    if (!defined_default(result)) {
      return new Cartographic_default(rectangle.west, rectangle.north);
    }
    result.longitude = rectangle.west;
    result.latitude = rectangle.north;
    result.height = 0;
    return result;
  }
  /**
   * Computes the northeast corner of a rectangle.
   *
   * @param {Rectangle} rectangle The rectangle for which to find the corner
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
   */
  static northeast(rectangle, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    if (!defined_default(result)) {
      return new Cartographic_default(rectangle.east, rectangle.north);
    }
    result.longitude = rectangle.east;
    result.latitude = rectangle.north;
    result.height = 0;
    return result;
  }
  /**
   * Computes the southeast corner of a rectangle.
   *
   * @param {Rectangle} rectangle The rectangle for which to find the corner
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
   */
  static southeast(rectangle, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    if (!defined_default(result)) {
      return new Cartographic_default(rectangle.east, rectangle.south);
    }
    result.longitude = rectangle.east;
    result.latitude = rectangle.south;
    result.height = 0;
    return result;
  }
  /**
   * Computes the center of a rectangle.
   *
   * @param {Rectangle} rectangle The rectangle for which to find the center
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
   */
  static center(rectangle, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    let east = rectangle.east;
    const west = rectangle.west;
    if (east < west) {
      east += Math_default.TWO_PI;
    }
    const longitude = Math_default.negativePiToPi((west + east) * 0.5);
    const latitude = (rectangle.south + rectangle.north) * 0.5;
    if (!defined_default(result)) {
      return new Cartographic_default(longitude, latitude);
    }
    result.longitude = longitude;
    result.latitude = latitude;
    result.height = 0;
    return result;
  }
  /**
   * Computes the intersection of two rectangles.  This function assumes that the rectangle's coordinates are
   * latitude and longitude in radians and produces a correct intersection, taking into account the fact that
   * the same angle can be represented with multiple values as well as the wrapping of longitude at the
   * anti-meridian.  For a simple intersection that ignores these factors and can be used with projected
   * coordinates, see {@link Rectangle.simpleIntersection}.
   *
   * @param {Rectangle} rectangle On rectangle to find an intersection
   * @param {Rectangle} otherRectangle Another rectangle to find an intersection
   * @param {Rectangle} [result] The object onto which to store the result.
   * @returns {Rectangle|undefined} The modified result parameter, a new Rectangle instance if none was provided or undefined if there is no intersection.
   */
  static intersection(rectangle, otherRectangle, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    Check_default.typeOf.object("otherRectangle", otherRectangle);
    let rectangleEast = rectangle.east;
    let rectangleWest = rectangle.west;
    let otherRectangleEast = otherRectangle.east;
    let otherRectangleWest = otherRectangle.west;
    if (rectangleEast < rectangleWest && otherRectangleEast > 0) {
      rectangleEast += Math_default.TWO_PI;
    } else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0) {
      otherRectangleEast += Math_default.TWO_PI;
    }
    if (rectangleEast < rectangleWest && otherRectangleWest < 0) {
      otherRectangleWest += Math_default.TWO_PI;
    } else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0) {
      rectangleWest += Math_default.TWO_PI;
    }
    const west = Math_default.negativePiToPi(
      Math.max(rectangleWest, otherRectangleWest)
    );
    const east = Math_default.negativePiToPi(
      Math.min(rectangleEast, otherRectangleEast)
    );
    if ((rectangle.west < rectangle.east || otherRectangle.west < otherRectangle.east) && east <= west) {
      return void 0;
    }
    const south = Math.max(rectangle.south, otherRectangle.south);
    const north = Math.min(rectangle.north, otherRectangle.north);
    if (south >= north) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Rectangle(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }
  /**
   * Computes a simple intersection of two rectangles.  Unlike {@link Rectangle.intersection}, this function
   * does not attempt to put the angular coordinates into a consistent range or to account for crossing the
   * anti-meridian.  As such, it can be used for rectangles where the coordinates are not simply latitude
   * and longitude (i.e. projected coordinates).
   *
   * @param {Rectangle} rectangle On rectangle to find an intersection
   * @param {Rectangle} otherRectangle Another rectangle to find an intersection
   * @param {Rectangle} [result] The object onto which to store the result.
   * @returns {Rectangle|undefined} The modified result parameter, a new Rectangle instance if none was provided or undefined if there is no intersection.
   */
  static simpleIntersection(rectangle, otherRectangle, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    Check_default.typeOf.object("otherRectangle", otherRectangle);
    const west = Math.max(rectangle.west, otherRectangle.west);
    const south = Math.max(rectangle.south, otherRectangle.south);
    const east = Math.min(rectangle.east, otherRectangle.east);
    const north = Math.min(rectangle.north, otherRectangle.north);
    if (south >= north || west >= east) {
      return void 0;
    }
    if (!defined_default(result)) {
      return new _Rectangle(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }
  /**
   * Computes a rectangle that is the union of two rectangles.
   *
   * @param {Rectangle} rectangle A rectangle to enclose in rectangle.
   * @param {Rectangle} otherRectangle A rectangle to enclose in a rectangle.
   * @param {Rectangle} [result] The object onto which to store the result.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
   */
  static union(rectangle, otherRectangle, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    Check_default.typeOf.object("otherRectangle", otherRectangle);
    if (!defined_default(result)) {
      result = new _Rectangle();
    }
    let rectangleEast = rectangle.east;
    let rectangleWest = rectangle.west;
    let otherRectangleEast = otherRectangle.east;
    let otherRectangleWest = otherRectangle.west;
    if (rectangleEast < rectangleWest && otherRectangleEast > 0) {
      rectangleEast += Math_default.TWO_PI;
    } else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0) {
      otherRectangleEast += Math_default.TWO_PI;
    }
    if (rectangleEast < rectangleWest && otherRectangleWest < 0) {
      otherRectangleWest += Math_default.TWO_PI;
    } else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0) {
      rectangleWest += Math_default.TWO_PI;
    }
    const west = Math_default.negativePiToPi(
      Math.min(rectangleWest, otherRectangleWest)
    );
    const east = Math_default.negativePiToPi(
      Math.max(rectangleEast, otherRectangleEast)
    );
    result.west = west;
    result.south = Math.min(rectangle.south, otherRectangle.south);
    result.east = east;
    result.north = Math.max(rectangle.north, otherRectangle.north);
    return result;
  }
  /**
   * Computes a rectangle by enlarging the provided rectangle until it contains the provided cartographic.
   *
   * @param {Rectangle} rectangle A rectangle to expand.
   * @param {Cartographic} cartographic A cartographic to enclose in a rectangle.
   * @param {Rectangle} [result] The object onto which to store the result.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if one was not provided.
   */
  static expand(rectangle, cartographic, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    Check_default.typeOf.object("cartographic", cartographic);
    if (!defined_default(result)) {
      result = new _Rectangle();
    }
    result.west = Math.min(rectangle.west, cartographic.longitude);
    result.south = Math.min(rectangle.south, cartographic.latitude);
    result.east = Math.max(rectangle.east, cartographic.longitude);
    result.north = Math.max(rectangle.north, cartographic.latitude);
    return result;
  }
  /**
   * Returns true if the cartographic is on or inside the rectangle, false otherwise.
   *
   * @param {Rectangle} rectangle The rectangle
   * @param {Cartographic} cartographic The cartographic to test.
   * @returns {boolean} true if the provided cartographic is inside the rectangle, false otherwise.
   */
  static contains(rectangle, cartographic) {
    Check_default.typeOf.object("rectangle", rectangle);
    Check_default.typeOf.object("cartographic", cartographic);
    let longitude = cartographic.longitude;
    const latitude = cartographic.latitude;
    const west = rectangle.west;
    let east = rectangle.east;
    if (east < west) {
      east += Math_default.TWO_PI;
      if (longitude < 0) {
        longitude += Math_default.TWO_PI;
      }
    }
    return (longitude > west || Math_default.equalsEpsilon(longitude, west, Math_default.EPSILON14)) && (longitude < east || Math_default.equalsEpsilon(longitude, east, Math_default.EPSILON14)) && latitude >= rectangle.south && latitude <= rectangle.north;
  }
  /**
   * Samples a rectangle so that it includes a list of Cartesian points suitable for passing to
   * {@link BoundingSphere#fromPoints}.  Sampling is necessary to account
   * for rectangles that cover the poles or cross the equator.
   *
   * @param {Rectangle} rectangle The rectangle to subsample.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] The ellipsoid to use.
   * @param {number} [surfaceHeight=0.0] The height of the rectangle above the ellipsoid.
   * @param {Cartesian3[]} [result] The array of Cartesians onto which to store the result.
   * @returns {Cartesian3[]} The modified result parameter or a new Array of Cartesians instances if none was provided.
   */
  static subsample(rectangle, ellipsoid, surfaceHeight, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    ellipsoid = ellipsoid ?? Ellipsoid_default.default;
    surfaceHeight = surfaceHeight ?? 0;
    if (!defined_default(result)) {
      result = [];
    }
    let length = 0;
    const north = rectangle.north;
    const south = rectangle.south;
    const east = rectangle.east;
    const west = rectangle.west;
    const lla = subsampleLlaScratch;
    lla.height = surfaceHeight;
    lla.longitude = west;
    lla.latitude = north;
    result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
    length++;
    lla.longitude = east;
    result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
    length++;
    lla.latitude = south;
    result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
    length++;
    lla.longitude = west;
    result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
    length++;
    if (north < 0) {
      lla.latitude = north;
    } else if (south > 0) {
      lla.latitude = south;
    } else {
      lla.latitude = 0;
    }
    for (let i = 1; i < 8; ++i) {
      lla.longitude = -Math.PI + i * Math_default.PI_OVER_TWO;
      if (_Rectangle.contains(rectangle, lla)) {
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;
      }
    }
    if (lla.latitude === 0) {
      lla.longitude = west;
      result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
      length++;
      lla.longitude = east;
      result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
      length++;
    }
    result.length = length;
    return result;
  }
  /**
   * Computes a subsection of a rectangle from normalized coordinates in the range [0.0, 1.0].
   *
   * @param {Rectangle} rectangle The rectangle to subsection.
   * @param {number} westLerp The west interpolation factor in the range [0.0, 1.0]. Must be less than or equal to eastLerp.
   * @param {number} southLerp The south interpolation factor in the range [0.0, 1.0]. Must be less than or equal to northLerp.
   * @param {number} eastLerp The east interpolation factor in the range [0.0, 1.0]. Must be greater than or equal to westLerp.
   * @param {number} northLerp The north interpolation factor in the range [0.0, 1.0]. Must be greater than or equal to southLerp.
   * @param {Rectangle} [result] The object onto which to store the result.
   * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
   */
  static subsection(rectangle, westLerp, southLerp, eastLerp, northLerp, result) {
    Check_default.typeOf.object("rectangle", rectangle);
    Check_default.typeOf.number.greaterThanOrEquals("westLerp", westLerp, 0);
    Check_default.typeOf.number.lessThanOrEquals("westLerp", westLerp, 1);
    Check_default.typeOf.number.greaterThanOrEquals("southLerp", southLerp, 0);
    Check_default.typeOf.number.lessThanOrEquals("southLerp", southLerp, 1);
    Check_default.typeOf.number.greaterThanOrEquals("eastLerp", eastLerp, 0);
    Check_default.typeOf.number.lessThanOrEquals("eastLerp", eastLerp, 1);
    Check_default.typeOf.number.greaterThanOrEquals("northLerp", northLerp, 0);
    Check_default.typeOf.number.lessThanOrEquals("northLerp", northLerp, 1);
    Check_default.typeOf.number.lessThanOrEquals("westLerp", westLerp, eastLerp);
    Check_default.typeOf.number.lessThanOrEquals("southLerp", southLerp, northLerp);
    if (!defined_default(result)) {
      result = new _Rectangle();
    }
    if (rectangle.west <= rectangle.east) {
      const width = rectangle.east - rectangle.west;
      result.west = rectangle.west + westLerp * width;
      result.east = rectangle.west + eastLerp * width;
    } else {
      const width = Math_default.TWO_PI + rectangle.east - rectangle.west;
      result.west = Math_default.negativePiToPi(
        rectangle.west + westLerp * width
      );
      result.east = Math_default.negativePiToPi(
        rectangle.west + eastLerp * width
      );
    }
    const height = rectangle.north - rectangle.south;
    result.south = rectangle.south + southLerp * height;
    result.north = rectangle.south + northLerp * height;
    if (westLerp === 1) {
      result.west = rectangle.east;
    }
    if (eastLerp === 1) {
      result.east = rectangle.east;
    }
    if (southLerp === 1) {
      result.south = rectangle.north;
    }
    if (northLerp === 1) {
      result.north = rectangle.north;
    }
    return result;
  }
};
Rectangle.packedLength = 4;
var fromBoundingSphereMatrixScratch = new Matrix4_default();
var fromBoundingSphereEastScratch = new Cartesian3_default();
var fromBoundingSphereNorthScratch = new Cartesian3_default();
var fromBoundingSphereWestScratch = new Cartesian3_default();
var fromBoundingSphereSouthScratch = new Cartesian3_default();
var fromBoundingSpherePositionsScratch = new Array(5);
for (let n = 0; n < fromBoundingSpherePositionsScratch.length; ++n) {
  fromBoundingSpherePositionsScratch[n] = new Cartesian3_default();
}
var subsampleLlaScratch = new Cartographic_default();
Rectangle.MAX_VALUE = Object.freeze(
  new Rectangle(
    -Math.PI,
    -Math_default.PI_OVER_TWO,
    Math.PI,
    Math_default.PI_OVER_TWO
  )
);
var Rectangle_default = Rectangle;

// node_modules/@cesium/engine/Source/Core/destroyObject.js
function returnTrue() {
  return true;
}
function destroyObject(object, message) {
  message = message ?? "This object was destroyed, i.e., destroy() was called.";
  function throwOnDestroyed() {
    throw new DeveloperError_default(message);
  }
  for (const key in object) {
    if (typeof object[key] === "function") {
      object[key] = throwOnDestroyed;
    }
  }
  object.isDestroyed = returnTrue;
  return void 0;
}
var destroyObject_default = destroyObject;

// node_modules/@cesium/engine/Source/Core/CompressedTextureBuffer.js
function CompressedTextureBuffer(internalFormat, pixelDatatype, width, height, buffer) {
  this._format = internalFormat;
  this._datatype = pixelDatatype;
  this._width = width;
  this._height = height;
  this._buffer = buffer;
}
Object.defineProperties(CompressedTextureBuffer.prototype, {
  /**
   * The format of the compressed texture.
   * @type {PixelFormat}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  internalFormat: {
    get: function() {
      return this._format;
    }
  },
  /**
   * The datatype of the compressed texture.
   * @type {PixelDatatype}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  pixelDatatype: {
    get: function() {
      return this._datatype;
    }
  },
  /**
   * The width of the texture.
   * @type {number}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  width: {
    get: function() {
      return this._width;
    }
  },
  /**
   * The height of the texture.
   * @type {number}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  height: {
    get: function() {
      return this._height;
    }
  },
  /**
   * The compressed texture buffer.
   * @type {Uint8Array}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  bufferView: {
    get: function() {
      return this._buffer;
    }
  },
  /**
   * The compressed texture buffer. Alias for bufferView.
   * @type {Uint8Array}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  arrayBufferView: {
    get: function() {
      return this._buffer;
    }
  }
});
CompressedTextureBuffer.clone = function(object) {
  if (!defined_default(object)) {
    return void 0;
  }
  return new CompressedTextureBuffer(
    object._format,
    object._datatype,
    object._width,
    object._height,
    object._buffer
  );
};
CompressedTextureBuffer.prototype.clone = function() {
  return CompressedTextureBuffer.clone(this);
};
var CompressedTextureBuffer_default = CompressedTextureBuffer;

// node_modules/@cesium/engine/Source/Core/TaskProcessor.js
var import_urijs7 = __toESM(require_URI(), 1);
function canTransferArrayBuffer() {
  if (!defined_default(TaskProcessor._canTransferArrayBuffer)) {
    const worker = createWorker("transferTypedArrayTest");
    worker.postMessage = worker.webkitPostMessage ?? worker.postMessage;
    const value = 99;
    const array = new Int8Array([value]);
    try {
      worker.postMessage(
        {
          array
        },
        [array.buffer]
      );
    } catch (e) {
      TaskProcessor._canTransferArrayBuffer = false;
      return TaskProcessor._canTransferArrayBuffer;
    }
    TaskProcessor._canTransferArrayBuffer = new Promise((resolve) => {
      worker.onmessage = function(event) {
        const array2 = event.data.array;
        const result = defined_default(array2) && array2[0] === value;
        resolve(result);
        worker.terminate();
        TaskProcessor._canTransferArrayBuffer = result;
      };
    });
  }
  return TaskProcessor._canTransferArrayBuffer;
}
var taskCompletedEvent = new Event_default();
function urlFromScript(script) {
  let blob;
  try {
    blob = new Blob([script], {
      type: "application/javascript"
    });
  } catch (e) {
    const BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
    const blobBuilder = new BlobBuilder();
    blobBuilder.append(script);
    blob = blobBuilder.getBlob("application/javascript");
  }
  const URL = window.URL || window.webkitURL;
  return URL.createObjectURL(blob);
}
function createWorker(url) {
  const uri = new import_urijs7.default(url);
  const isUri = uri.scheme().length !== 0 && uri.fragment().length === 0;
  const moduleID = url.replace(/\.js$/, "");
  const options = {};
  let workerPath;
  let crossOriginUrl;
  if (isCrossOriginUrl_default(url)) {
    crossOriginUrl = url;
  } else if (!isUri) {
    const moduleAbsoluteUrl = buildModuleUrl_default(
      `${TaskProcessor._workerModulePrefix}/${moduleID}.js`
    );
    if (isCrossOriginUrl_default(moduleAbsoluteUrl)) {
      crossOriginUrl = moduleAbsoluteUrl;
    }
  }
  if (crossOriginUrl) {
    const script = `import "${crossOriginUrl}";`;
    workerPath = urlFromScript(script);
    options.type = "module";
    return new Worker(workerPath, options);
  }
  if (!isUri && typeof CESIUM_WORKERS !== "undefined") {
    const script = `
      importScripts("${urlFromScript(CESIUM_WORKERS)}");
      CesiumWorkers["${moduleID}"]();
    `;
    workerPath = urlFromScript(script);
    return new Worker(workerPath, options);
  }
  workerPath = url;
  if (!isUri) {
    workerPath = buildModuleUrl_default(
      `${TaskProcessor._workerModulePrefix + moduleID}.js`
    );
  }
  if (!FeatureDetection_default.supportsEsmWebWorkers()) {
    throw new RuntimeError_default(
      "This browser is not supported. Please update your browser to continue."
    );
  }
  options.type = "module";
  return new Worker(workerPath, options);
}
async function getWebAssemblyLoaderConfig(processor, wasmOptions) {
  const config = {
    modulePath: void 0,
    wasmBinaryFile: void 0,
    wasmBinary: void 0
  };
  if (!FeatureDetection_default.supportsWebAssembly()) {
    if (!defined_default(wasmOptions.fallbackModulePath)) {
      throw new RuntimeError_default(
        `This browser does not support Web Assembly, and no backup module was provided for ${processor._workerPath}`
      );
    }
    config.modulePath = buildModuleUrl_default(wasmOptions.fallbackModulePath);
    return config;
  }
  config.wasmBinaryFile = buildModuleUrl_default(wasmOptions.wasmBinaryFile);
  const arrayBuffer = await Resource_default.fetchArrayBuffer({
    url: config.wasmBinaryFile
  });
  config.wasmBinary = arrayBuffer;
  return config;
}
function TaskProcessor(workerPath, maximumActiveTasks) {
  this._workerPath = workerPath;
  this._maximumActiveTasks = maximumActiveTasks ?? Number.POSITIVE_INFINITY;
  this._activeTasks = 0;
  this._nextID = 0;
  this._webAssemblyPromise = void 0;
}
var createOnmessageHandler = (worker, id, resolve, reject) => {
  const listener = ({ data }) => {
    if (data.id !== id) {
      return;
    }
    if (defined_default(data.error)) {
      let error = data.error;
      if (error.name === "RuntimeError") {
        error = new RuntimeError_default(data.error.message);
        error.stack = data.error.stack;
      } else if (error.name === "DeveloperError") {
        error = new DeveloperError_default(data.error.message);
        error.stack = data.error.stack;
      } else if (error.name === "Error") {
        error = new Error(data.error.message);
        error.stack = data.error.stack;
      }
      taskCompletedEvent.raiseEvent(error);
      reject(error);
    } else {
      taskCompletedEvent.raiseEvent();
      resolve(data.result);
    }
    worker.removeEventListener("message", listener);
  };
  return listener;
};
var emptyTransferableObjectArray = [];
async function runTask(processor, parameters, transferableObjects) {
  const canTransfer = await Promise.resolve(canTransferArrayBuffer());
  if (!defined_default(transferableObjects)) {
    transferableObjects = emptyTransferableObjectArray;
  } else if (!canTransfer) {
    transferableObjects.length = 0;
  }
  const id = processor._nextID++;
  const promise = new Promise((resolve, reject) => {
    processor._worker.addEventListener(
      "message",
      createOnmessageHandler(processor._worker, id, resolve, reject)
    );
  });
  processor._worker.postMessage(
    {
      id,
      baseUrl: buildModuleUrl_default.getCesiumBaseUrl().url,
      parameters,
      canTransferArrayBuffer: canTransfer
    },
    transferableObjects
  );
  return promise;
}
async function scheduleTask(processor, parameters, transferableObjects) {
  ++processor._activeTasks;
  try {
    const result = await runTask(processor, parameters, transferableObjects);
    --processor._activeTasks;
    return result;
  } catch (error) {
    --processor._activeTasks;
    throw error;
  }
}
TaskProcessor.prototype.scheduleTask = function(parameters, transferableObjects) {
  if (!defined_default(this._worker)) {
    this._worker = createWorker(this._workerPath);
  }
  if (this._activeTasks >= this._maximumActiveTasks) {
    return void 0;
  }
  return scheduleTask(this, parameters, transferableObjects);
};
TaskProcessor.prototype.initWebAssemblyModule = async function(webAssemblyOptions) {
  if (defined_default(this._webAssemblyPromise)) {
    return this._webAssemblyPromise;
  }
  const init = async () => {
    const worker = this._worker = createWorker(this._workerPath);
    const wasmConfig = await getWebAssemblyLoaderConfig(
      this,
      webAssemblyOptions
    );
    const canTransfer = await Promise.resolve(canTransferArrayBuffer());
    let transferableObjects;
    const binary = wasmConfig.wasmBinary;
    if (defined_default(binary) && canTransfer) {
      transferableObjects = [binary];
    }
    const promise = new Promise((resolve, reject) => {
      worker.onmessage = function({ data }) {
        if (defined_default(data)) {
          resolve(data.result);
        } else {
          reject(new RuntimeError_default("Could not configure wasm module"));
        }
      };
    });
    worker.postMessage(
      {
        canTransferArrayBuffer: canTransfer,
        parameters: { webAssemblyConfig: wasmConfig }
      },
      transferableObjects
    );
    return promise;
  };
  this._webAssemblyPromise = init();
  return this._webAssemblyPromise;
};
TaskProcessor.prototype.isDestroyed = function() {
  return false;
};
TaskProcessor.prototype.destroy = function() {
  if (defined_default(this._worker)) {
    this._worker.terminate();
  }
  return destroyObject_default(this);
};
TaskProcessor.taskCompletedEvent = taskCompletedEvent;
TaskProcessor._defaultWorkerModulePrefix = "Workers/";
TaskProcessor._workerModulePrefix = TaskProcessor._defaultWorkerModulePrefix;
TaskProcessor._canTransferArrayBuffer = void 0;
var TaskProcessor_default = TaskProcessor;

// node_modules/@cesium/engine/Source/Core/KTX2Transcoder.js
function KTX2Transcoder() {
}
KTX2Transcoder._transcodeTaskProcessor = new TaskProcessor_default(
  "transcodeKTX2",
  Number.POSITIVE_INFINITY
  // KTX2 transcoding is used in place of Resource.fetchImage, so it can't reject as "just soooo busy right now"
);
KTX2Transcoder._readyPromise = void 0;
function makeReadyPromise() {
  const readyPromise = KTX2Transcoder._transcodeTaskProcessor.initWebAssemblyModule({
    wasmBinaryFile: "ThirdParty/basis_transcoder.wasm"
  }).then(function(result) {
    if (result) {
      return KTX2Transcoder._transcodeTaskProcessor;
    }
    throw new RuntimeError_default("KTX2 transcoder could not be initialized.");
  });
  KTX2Transcoder._readyPromise = readyPromise;
}
KTX2Transcoder.transcode = function(ktx2Buffer, supportedTargetFormats) {
  Check_default.defined("supportedTargetFormats", supportedTargetFormats);
  if (!defined_default(KTX2Transcoder._readyPromise)) {
    makeReadyPromise();
  }
  return KTX2Transcoder._readyPromise.then(function(taskProcessor) {
    let bufferView = ktx2Buffer;
    if (ktx2Buffer instanceof ArrayBuffer) {
      bufferView = new Uint8Array(ktx2Buffer);
    }
    const parameters = {
      supportedTargetFormats,
      ktx2Buffer: bufferView
    };
    return taskProcessor.scheduleTask(parameters, [bufferView.buffer]);
  }).then(function(result) {
    const levelsLength = result.length;
    const faceKeys = Object.keys(result[0]);
    for (let i = 0; i < levelsLength; i++) {
      const faces = result[i];
      for (let j = 0; j < faceKeys.length; j++) {
        const face = faces[faceKeys[j]];
        faces[faceKeys[j]] = new CompressedTextureBuffer_default(
          face.internalFormat,
          face.datatype,
          face.width,
          face.height,
          face.levelBuffer
        );
      }
    }
    if (faceKeys.length === 1) {
      for (let i = 0; i < levelsLength; ++i) {
        result[i] = result[i][faceKeys[0]];
      }
      if (levelsLength === 1) {
        result = result[0];
      }
    }
    return result;
  }).catch(function(error) {
    throw error;
  });
};
var KTX2Transcoder_default = KTX2Transcoder;

// node_modules/@cesium/engine/Source/Core/loadKTX2.js
var supportedTranscoderFormats;
loadKTX2.setKTX2SupportedFormats = function(s3tc, pvrtc, astc, etc, etc1, bc7) {
  supportedTranscoderFormats = {
    s3tc,
    pvrtc,
    astc,
    etc,
    etc1,
    bc7
  };
};
function loadKTX2(resourceOrUrlOrBuffer) {
  Check_default.defined("resourceOrUrlOrBuffer", resourceOrUrlOrBuffer);
  let loadPromise;
  if (resourceOrUrlOrBuffer instanceof ArrayBuffer || ArrayBuffer.isView(resourceOrUrlOrBuffer)) {
    loadPromise = Promise.resolve(resourceOrUrlOrBuffer);
  } else {
    const resource = Resource_default.createIfNeeded(resourceOrUrlOrBuffer);
    loadPromise = resource.fetchArrayBuffer();
  }
  return loadPromise.then(function(data) {
    return KTX2Transcoder_default.transcode(data, supportedTranscoderFormats);
  });
}
var loadKTX2_default = loadKTX2;

// node_modules/@cesium/engine/Source/Core/WebMercatorProjection.js
var WebMercatorProjection = class _WebMercatorProjection {
  /**
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid.
   */
  constructor(ellipsoid) {
    this._ellipsoid = ellipsoid ?? Ellipsoid_default.WGS84;
    this._semimajorAxis = this._ellipsoid.maximumRadius;
    this._oneOverSemimajorAxis = 1 / this._semimajorAxis;
  }
  /**
   * Gets the {@link Ellipsoid}.
   *
   * @type {Ellipsoid}
   * @readonly
   */
  get ellipsoid() {
    return this._ellipsoid;
  }
  /**
   * Converts a Mercator angle, in the range -PI to PI, to a geodetic latitude
   * in the range -PI/2 to PI/2.
   *
   * @param {number} mercatorAngle The angle to convert.
   * @returns {number} The geodetic latitude in radians.
   */
  static mercatorAngleToGeodeticLatitude(mercatorAngle) {
    return Math_default.PI_OVER_TWO - 2 * Math.atan(Math.exp(-mercatorAngle));
  }
  /**
   * Converts a geodetic latitude in radians, in the range -PI/2 to PI/2, to a Mercator
   * angle in the range -PI to PI.
   *
   * @param {number} latitude The geodetic latitude in radians.
   * @returns {number} The Mercator angle.
   */
  static geodeticLatitudeToMercatorAngle(latitude) {
    if (latitude > _WebMercatorProjection.MaximumLatitude) {
      latitude = _WebMercatorProjection.MaximumLatitude;
    } else if (latitude < -_WebMercatorProjection.MaximumLatitude) {
      latitude = -_WebMercatorProjection.MaximumLatitude;
    }
    const sinLatitude = Math.sin(latitude);
    return 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));
  }
  /**
   * Converts geodetic ellipsoid coordinates, in radians, to the equivalent Web Mercator
   * X, Y, Z coordinates expressed in meters and returned in a {@link Cartesian3}.  The height
   * is copied unmodified to the Z coordinate.
   *
   * @param {Cartographic} cartographic The cartographic coordinates in radians.
   * @param {Cartesian3} [result] The instance to which to copy the result, or undefined if a
   *        new instance should be created.
   * @returns {Cartesian3} The equivalent web mercator X, Y, Z coordinates, in meters.
   */
  project(cartographic, result) {
    const semimajorAxis = this._semimajorAxis;
    const x = cartographic.longitude * semimajorAxis;
    const y = _WebMercatorProjection.geodeticLatitudeToMercatorAngle(
      cartographic.latitude
    ) * semimajorAxis;
    const z = cartographic.height;
    if (!defined_default(result)) {
      return new Cartesian3_default(x, y, z);
    }
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }
  /**
   * Converts Web Mercator X, Y coordinates, expressed in meters, to a {@link Cartographic}
   * containing geodetic ellipsoid coordinates.  The Z coordinate is copied unmodified to the
   * height.
   *
   * @param {Cartesian3} cartesian The web mercator Cartesian position to unrproject with height (z) in meters.
   * @param {Cartographic} [result] The instance to which to copy the result, or undefined if a
   *        new instance should be created.
   * @returns {Cartographic} The equivalent cartographic coordinates.
   */
  unproject(cartesian, result) {
    if (!defined_default(cartesian)) {
      throw new DeveloperError_default("cartesian is required");
    }
    const oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
    const longitude = cartesian.x * oneOverEarthSemimajorAxis;
    const latitude = _WebMercatorProjection.mercatorAngleToGeodeticLatitude(
      cartesian.y * oneOverEarthSemimajorAxis
    );
    const height = cartesian.z;
    if (!defined_default(result)) {
      return new Cartographic_default(longitude, latitude, height);
    }
    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
  }
};
WebMercatorProjection.MaximumLatitude = WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI);
var WebMercatorProjection_default = WebMercatorProjection;

// node_modules/dompurify/dist/purify.es.mjs
function _arrayLikeToArray(r, a3) {
  (null == a3 || a3 > r.length) && (a3 = r.length);
  for (var e = 0, n = Array(a3); e < a3; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u2, a3 = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ;
      else for (; !(f = (e = i.call(t)).done) && (a3.push(e.value), a3.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t.return && (u2 = t.return(), Object(u2) !== u2)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a3;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a3) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a3);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a3) : void 0;
  }
}
var entries = Object.entries;
var setPrototypeOf = Object.setPrototypeOf;
var isFrozen = Object.isFrozen;
var getPrototypeOf = Object.getPrototypeOf;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var freeze = Object.freeze;
var seal = Object.seal;
var create = Object.create;
var _ref = typeof Reflect !== "undefined" && Reflect;
var apply = _ref.apply;
var construct = _ref.construct;
if (!freeze) {
  freeze = function freeze2(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal2(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply2(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct2(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
var arrayForEach = unapply(Array.prototype.forEach);
var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
var arrayPop = unapply(Array.prototype.pop);
var arrayPush = unapply(Array.prototype.push);
var arraySplice = unapply(Array.prototype.splice);
var arrayIsArray = Array.isArray;
var stringToLowerCase = unapply(String.prototype.toLowerCase);
var stringToString = unapply(String.prototype.toString);
var stringMatch = unapply(String.prototype.match);
var stringReplace = unapply(String.prototype.replace);
var stringIndexOf = unapply(String.prototype.indexOf);
var stringTrim = unapply(String.prototype.trim);
var numberToString = unapply(Number.prototype.toString);
var booleanToString = unapply(Boolean.prototype.toString);
var bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
var symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
var objectToString = unapply(Object.prototype.toString);
var regExpTest = unapply(RegExp.prototype.test);
var typeErrorCreate = unconstruct(TypeError);
function unapply(func) {
  return function(thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
function unconstruct(Func) {
  return function() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    setPrototypeOf(set, null);
  }
  if (!arrayIsArray(array)) {
    return set;
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === "string") {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
function clone2(object) {
  const newObject = create(null);
  for (const _ref2 of entries(object)) {
    var _ref3 = _slicedToArray(_ref2, 2);
    const property = _ref3[0];
    const value = _ref3[1];
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (arrayIsArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === "object" && value.constructor === Object) {
        newObject[property] = clone2(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
function stringifyValue(value) {
  switch (typeof value) {
    case "string": {
      return value;
    }
    case "number": {
      return numberToString(value);
    }
    case "boolean": {
      return booleanToString(value);
    }
    case "bigint": {
      return bigintToString ? bigintToString(value) : "0";
    }
    case "symbol": {
      return symbolToString ? symbolToString(value) : "Symbol()";
    }
    case "undefined": {
      return objectToString(value);
    }
    case "function":
    case "object": {
      if (value === null) {
        return objectToString(value);
      }
      const valueAsRecord = value;
      const valueToString = lookupGetter(valueAsRecord, "toString");
      if (typeof valueToString === "function") {
        const stringified = valueToString(valueAsRecord);
        return typeof stringified === "string" ? stringified : objectToString(stringified);
      }
      return objectToString(value);
    }
    default: {
      return objectToString(value);
    }
  }
}
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === "function") {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
function isRegex(value) {
  try {
    regExpTest(value, "");
    return true;
  } catch (_unused) {
    return false;
  }
}
var html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
var svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
var svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
var svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
var mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
var mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
var text = freeze(["#text"]);
var html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "command", "commandfor", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]);
var svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
var mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
var xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
var MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
var ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
var TMPLIT_EXPR = seal(/\${[\w\W]*/g);
var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
var IS_ALLOWED_URI = seal(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
);
var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
var ATTR_WHITESPACE = seal(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
);
var DOCTYPE_NAME = seal(/^html$/i);
var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
var COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
var FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
var SELF_CLOSING_TAG = seal(/\/>/i);
var NODE_TYPE = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  // Deprecated
  entityNode: 6,
  // Deprecated
  processingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12
  // Deprecated
};
var getGlobal = function getGlobal2() {
  return typeof window === "undefined" ? null : window;
};
var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
    return null;
  }
  let suffix = null;
  const ATTR_NAME = "data-tt-policy-suffix";
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = "dompurify" + (suffix ? "#" + suffix : "");
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html2) {
        return html2;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    console.warn("TrustedTypes policy " + policyName + " could not be created.");
    return null;
  }
};
var _createHooksMap = function _createHooksMap2() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
var _resolveSetOption = function _resolveSetOption2(cfg, key, fallback, options) {
  return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone2(options.base) : {}, cfg[key], options.transform) : fallback;
};
function createDOMPurify() {
  let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
  const DOMPurify = (root) => createDOMPurify(root);
  DOMPurify.version = "3.4.11";
  DOMPurify.removed = [];
  if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let document2 = window2.document;
  const originalDocument = document2;
  const currentScript = originalDocument.currentScript;
  window2.DocumentFragment;
  const HTMLTemplateElement = window2.HTMLTemplateElement, Node = window2.Node, Element = window2.Element, NodeFilter = window2.NodeFilter, _window$NamedNodeMap = window2.NamedNodeMap;
  _window$NamedNodeMap === void 0 ? window2.NamedNodeMap || window2.MozNamedAttrMap : _window$NamedNodeMap;
  window2.HTMLFormElement;
  const DOMParser2 = window2.DOMParser, trustedTypes = window2.trustedTypes;
  const ElementPrototype = Element.prototype;
  const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
  const remove = lookupGetter(ElementPrototype, "remove");
  const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
  const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
  const getParentNode = lookupGetter(ElementPrototype, "parentNode");
  const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
  const getAttributes = lookupGetter(ElementPrototype, "attributes");
  const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeType") : null;
  const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeName") : null;
  if (typeof HTMLTemplateElement === "function") {
    const template = document2.createElement("template");
    if (template.content && template.content.ownerDocument) {
      document2 = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = "";
  let defaultTrustedTypesPolicy;
  let defaultTrustedTypesPolicyResolved = false;
  let IN_TRUSTED_TYPES_POLICY = 0;
  const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy2() {
    if (IN_TRUSTED_TYPES_POLICY > 0) {
      throw typeErrorCreate('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.');
    }
  };
  const _createTrustedHTML = function _createTrustedHTML2(html2) {
    _assertNotInTrustedTypesPolicy();
    IN_TRUSTED_TYPES_POLICY++;
    try {
      return trustedTypesPolicy.createHTML(html2);
    } finally {
      IN_TRUSTED_TYPES_POLICY--;
    }
  };
  const _createTrustedScriptURL = function _createTrustedScriptURL2(scriptUrl) {
    _assertNotInTrustedTypesPolicy();
    IN_TRUSTED_TYPES_POLICY++;
    try {
      return trustedTypesPolicy.createScriptURL(scriptUrl);
    } finally {
      IN_TRUSTED_TYPES_POLICY--;
    }
  };
  const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy2() {
    if (!defaultTrustedTypesPolicyResolved) {
      defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      defaultTrustedTypesPolicyResolved = true;
    }
    return defaultTrustedTypesPolicy;
  };
  const _document = document2, implementation2 = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
  const importNode = originalDocument.importNode;
  let hooks = _createHooksMap();
  DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation2 && implementation2.createHTMLDocument !== void 0;
  const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
  let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  let FORBID_TAGS = null;
  let FORBID_ATTR = null;
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  let ALLOW_ARIA_ATTR = true;
  let ALLOW_DATA_ATTR = true;
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  let SAFE_FOR_TEMPLATES = false;
  let SAFE_FOR_XML = true;
  let WHOLE_DOCUMENT = false;
  let SET_CONFIG = false;
  let SET_CONFIG_ALLOWED_TAGS = null;
  let SET_CONFIG_ALLOWED_ATTR = null;
  let FORCE_BODY = false;
  let RETURN_DOM = false;
  let RETURN_DOM_FRAGMENT = false;
  let RETURN_TRUSTED_TYPE = false;
  let SANITIZE_DOM = true;
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
  let KEEP_CONTENT = true;
  let IN_PLACE = false;
  let USE_PROFILES = {};
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, [
    "annotation-xml",
    "audio",
    "colgroup",
    "desc",
    "foreignobject",
    "head",
    "iframe",
    "math",
    "mi",
    "mn",
    "mo",
    "ms",
    "mtext",
    "noembed",
    "noframes",
    "noscript",
    "plaintext",
    "script",
    // <selectedcontent> mirrors the selected <option>'s subtree, cloned by
    // the UA (customizable <select>) — including any on* handlers — and the
    // engine re-mirrors synchronously whenever a removal changes which
    // option/selectedcontent is current, even inside DOMPurify's inert
    // DOMParser document. Hoisting its children on removal re-inserts a fresh
    // mirror target ahead of the walk, which the engine refills, looping
    // forever (DoS) and amplifying output. Dropping its content on removal
    // (rather than hoisting) breaks that cascade; the content is a duplicate
    // of the option, which is sanitized on its own. See campaign-3 F1/F6.
    "selectedcontent",
    "style",
    "svg",
    "template",
    "thead",
    "title",
    "video",
    "xmp"
  ]);
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
  const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze(["mi", "mo", "mn", "ms", "mtext"]);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
  const DEFAULT_HTML_INTEGRATION_POINTS = freeze(["annotation-xml"]);
  let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
  const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
  let transformCaseFunc = null;
  let CONFIG = null;
  const formElement = document2.createElement("form");
  const isRegexOrFunction = function isRegexOrFunction2(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  const _parseConfig = function _parseConfig2() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    if (!cfg || typeof cfg !== "object") {
      cfg = {};
    }
    cfg = clone2(cfg);
    PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
    ALLOWED_TAGS = _resolveSetOption(cfg, "ALLOWED_TAGS", DEFAULT_ALLOWED_TAGS, {
      transform: transformCaseFunc
    });
    ALLOWED_ATTR = _resolveSetOption(cfg, "ALLOWED_ATTR", DEFAULT_ALLOWED_ATTR, {
      transform: transformCaseFunc
    });
    ALLOWED_NAMESPACES = _resolveSetOption(cfg, "ALLOWED_NAMESPACES", DEFAULT_ALLOWED_NAMESPACES, {
      transform: stringToString
    });
    URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", DEFAULT_URI_SAFE_ATTRIBUTES, {
      transform: transformCaseFunc,
      base: DEFAULT_URI_SAFE_ATTRIBUTES
    });
    DATA_URI_TAGS = _resolveSetOption(cfg, "ADD_DATA_URI_TAGS", DEFAULT_DATA_URI_TAGS, {
      transform: transformCaseFunc,
      base: DEFAULT_DATA_URI_TAGS
    });
    FORBID_CONTENTS = _resolveSetOption(cfg, "FORBID_CONTENTS", DEFAULT_FORBID_CONTENTS, {
      transform: transformCaseFunc
    });
    FORBID_TAGS = _resolveSetOption(cfg, "FORBID_TAGS", clone2({}), {
      transform: transformCaseFunc
    });
    FORBID_ATTR = _resolveSetOption(cfg, "FORBID_ATTR", clone2({}), {
      transform: transformCaseFunc
    });
    USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone2(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
    RETURN_DOM = cfg.RETURN_DOM || false;
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
    FORCE_BODY = cfg.FORCE_BODY || false;
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
    IN_PLACE = cfg.IN_PLACE || false;
    IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
    NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "MATHML_TEXT_INTEGRATION_POINTS") && cfg.MATHML_TEXT_INTEGRATION_POINTS && typeof cfg.MATHML_TEXT_INTEGRATION_POINTS === "object" ? clone2(cfg.MATHML_TEXT_INTEGRATION_POINTS) : addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
    HTML_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "HTML_INTEGRATION_POINTS") && cfg.HTML_INTEGRATION_POINTS && typeof cfg.HTML_INTEGRATION_POINTS === "object" ? clone2(cfg.HTML_INTEGRATION_POINTS) : addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
    const customElementHandling = objectHasOwnProperty(cfg, "CUSTOM_ELEMENT_HANDLING") && cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING === "object" ? clone2(cfg.CUSTOM_ELEMENT_HANDLING) : create(null);
    CUSTOM_ELEMENT_HANDLING = create(null);
    if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
    }
    if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
    }
    if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
    }
    seal(CUSTOM_ELEMENT_HANDLING);
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = create(null);
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    EXTRA_ELEMENT_HANDLING.tagCheck = null;
    EXTRA_ELEMENT_HANDLING.attributeCheck = null;
    if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
      if (typeof cfg.ADD_TAGS === "function") {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else if (arrayIsArray(cfg.ADD_TAGS)) {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone2(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
      if (typeof cfg.ADD_ATTR === "function") {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else if (arrayIsArray(cfg.ADD_ATTR)) {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone2(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") && arrayIsArray(cfg.ADD_URI_SAFE_ATTR)) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (objectHasOwnProperty(cfg, "FORBID_CONTENTS") && arrayIsArray(cfg.FORBID_CONTENTS)) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone2(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone2(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
    }
    if (KEEP_CONTENT) {
      ALLOWED_TAGS["#text"] = true;
    }
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
    }
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ["tbody"]);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      const previousTrustedTypesPolicy = trustedTypesPolicy;
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      try {
        emptyHTML = _createTrustedHTML("");
      } catch (error) {
        trustedTypesPolicy = previousTrustedTypesPolicy;
        throw error;
      }
    } else if (cfg.TRUSTED_TYPES_POLICY === null) {
      trustedTypesPolicy = void 0;
      emptyHTML = "";
    } else {
      if (trustedTypesPolicy === void 0) {
        trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
      }
      if (trustedTypesPolicy && typeof emptyHTML === "string") {
        emptyHTML = _createTrustedHTML("");
      }
    }
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  const _checkSvgNamespace = function _checkSvgNamespace2(tagName, parent, parentTagName) {
    if (parent.namespaceURI === HTML_NAMESPACE) {
      return tagName === "svg";
    }
    if (parent.namespaceURI === MATHML_NAMESPACE) {
      return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
    }
    return Boolean(ALL_SVG_TAGS[tagName]);
  };
  const _checkMathMlNamespace = function _checkMathMlNamespace2(tagName, parent, parentTagName) {
    if (parent.namespaceURI === HTML_NAMESPACE) {
      return tagName === "math";
    }
    if (parent.namespaceURI === SVG_NAMESPACE) {
      return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
    }
    return Boolean(ALL_MATHML_TAGS[tagName]);
  };
  const _checkHtmlNamespace = function _checkHtmlNamespace2(tagName, parent, parentTagName) {
    if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
      return false;
    }
    if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
      return false;
    }
    return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
  };
  const _checkValidNamespace = function _checkValidNamespace2(element) {
    let parent = getParentNode(element);
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: "template"
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      return _checkSvgNamespace(tagName, parent, parentTagName);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      return _checkMathMlNamespace(tagName, parent, parentTagName);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      return _checkHtmlNamespace(tagName, parent, parentTagName);
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    return false;
  };
  const _forceRemove = function _forceRemove2(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove(node);
      if (!getParentNode(node)) {
        throw typeErrorCreate("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
      }
    }
  };
  const _neutralizeRoot = function _neutralizeRoot2(root) {
    const childNodes = getChildNodes(root);
    if (childNodes) {
      const snapshot = [];
      arrayForEach(childNodes, (child) => {
        arrayPush(snapshot, child);
      });
      arrayForEach(snapshot, (child) => {
        try {
          remove(child);
        } catch (_) {
        }
      });
    }
    const attributes = getAttributes(root);
    if (attributes) {
      for (let i = attributes.length - 1; i >= 0; --i) {
        const attribute = attributes[i];
        const name = attribute && attribute.name;
        if (typeof name === "string") {
          try {
            root.removeAttribute(name);
          } catch (_) {
          }
        }
      }
    }
  };
  const _removeAttribute = function _removeAttribute2(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    if (name === "is") {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {
        }
      } else {
        try {
          element.setAttribute(name, "");
        } catch (_) {
        }
      }
    }
  };
  const _stripDisallowedAttributes = function _stripDisallowedAttributes2(element) {
    const attributes = getAttributes(element);
    if (!attributes) {
      return;
    }
    for (let i = attributes.length - 1; i >= 0; --i) {
      const attribute = attributes[i];
      const name = attribute && attribute.name;
      if (typeof name !== "string" || ALLOWED_ATTR[transformCaseFunc(name)]) {
        continue;
      }
      try {
        element.removeAttribute(name);
      } catch (_) {
      }
    }
  };
  const _neutralizeSubtree = function _neutralizeSubtree2(root) {
    const stack = [root];
    while (stack.length > 0) {
      const node = stack.pop();
      const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
      if (nodeType === NODE_TYPE.element) {
        _stripDisallowedAttributes(node);
      }
      const childNodes = getChildNodes(node);
      if (childNodes) {
        for (let i = childNodes.length - 1; i >= 0; --i) {
          stack.push(childNodes[i]);
        }
      }
    }
  };
  const _initDocument = function _initDocument2(dirty) {
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = "<remove></remove>" + dirty;
    } else {
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
    }
    const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser2().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {
      }
    }
    if (!doc || !doc.documentElement) {
      doc = implementation2.createDocument(NAMESPACE, "template", null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
      }
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  const _createNodeIterator = function _createNodeIterator2(root) {
    return createNodeIterator.call(
      root.ownerDocument || root,
      root,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
      null
    );
  };
  const _stripTemplateExpressions = function _stripTemplateExpressions2(value) {
    value = stringReplace(value, MUSTACHE_EXPR$1, " ");
    value = stringReplace(value, ERB_EXPR$1, " ");
    value = stringReplace(value, TMPLIT_EXPR$1, " ");
    return value;
  };
  const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
    var _node$querySelectorAl;
    node.normalize();
    const walker = createNodeIterator.call(
      node.ownerDocument || node,
      node,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION,
      null
    );
    let currentNode = walker.nextNode();
    while (currentNode) {
      currentNode.data = _stripTemplateExpressions(currentNode.data);
      currentNode = walker.nextNode();
    }
    const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, "template");
    if (templates) {
      arrayForEach(templates, (tmpl) => {
        if (_isDocumentFragment(tmpl.content)) {
          _scrubTemplateExpressions2(tmpl.content);
        }
      });
    }
  };
  const _isClobbered = function _isClobbered2(element) {
    const realTagName = getNodeName ? getNodeName(element) : null;
    if (typeof realTagName !== "string") {
      return false;
    }
    if (transformCaseFunc(realTagName) !== "form") {
      return false;
    }
    return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || // Realm-safe NamedNodeMap detection: equality against the cached
    // prototype getter. Clobbered .attributes (e.g. <input name="attributes">)
    // makes the direct read diverge from the cached read; a clean form
    // (same-realm OR foreign-realm) has both reads pointing at the same
    // canonical NamedNodeMap.
    element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || // NodeType clobbering probe. Cached Node.prototype.nodeType getter
    // returns the integer 1 for any Element regardless of realm; direct
    // read on a clobbered form (e.g. <input name="nodeType">) returns
    // the named child element. Cheap addition — nodeType is read from
    // an internal slot, no serialization cost — and removes a residual
    // clobbering surface used by several mXSS / PI / comment branches
    // in _sanitizeElements that compare currentNode.nodeType directly.
    element.nodeType !== getNodeType(element) || // HTMLFormElement has [LegacyOverrideBuiltIns]: a descendant named
    // "childNodes" shadows the prototype getter. Direct reads of
    // form.childNodes from a clobbered form return the named child
    // instead of the real NodeList, so any walk that reads it directly
    // skips the form's real children. Compare the direct read to the
    // cached Node.prototype getter — when the form's named-property
    // getter intercepts the read, the two values differ and we flag
    // the form. This catches every clobbering child type (input,
    // select, etc.) regardless of whether the named child happens to
    // carry a numeric .length, which a typeof-based probe would miss
    // (e.g. HTMLSelectElement.length is a defined unsigned-long).
    element.childNodes !== getChildNodes(element);
  };
  const _isDocumentFragment = function _isDocumentFragment2(value) {
    if (!getNodeType || typeof value !== "object" || value === null) {
      return false;
    }
    try {
      return getNodeType(value) === NODE_TYPE.documentFragment;
    } catch (_) {
      return false;
    }
  };
  const _isNode = function _isNode2(value) {
    if (!getNodeType || typeof value !== "object" || value === null) {
      return false;
    }
    try {
      return typeof getNodeType(value) === "number";
    } catch (_) {
      return false;
    }
  };
  function _executeHooks(hooks2, currentNode, data) {
    if (hooks2.length === 0) {
      return;
    }
    arrayForEach(hooks2, (hook) => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  const _isUnsafeNode = function _isUnsafeNode2(currentNode, tagName) {
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) {
      return true;
    }
    if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && tagName === "style" && _isNode(currentNode.firstElementChild)) {
      return true;
    }
    if (currentNode.nodeType === NODE_TYPE.processingInstruction) {
      return true;
    }
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) {
      return true;
    }
    return false;
  };
  const _sanitizeDisallowedNode = function _sanitizeDisallowedNode2(currentNode, tagName) {
    if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
      if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
        return false;
      }
      if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
        return false;
      }
    }
    if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
      const parentNode = getParentNode(currentNode);
      const childNodes = getChildNodes(currentNode);
      if (childNodes && parentNode) {
        const childCount = childNodes.length;
        for (let i = childCount - 1; i >= 0; --i) {
          const hoisted = IN_PLACE ? childNodes[i] : cloneNode(childNodes[i], true);
          parentNode.insertBefore(hoisted, getNextSibling(currentNode));
        }
      }
    }
    _forceRemove(currentNode);
    return true;
  };
  const _sanitizeElements = function _sanitizeElements2(currentNode) {
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    const tagName = transformCaseFunc(getNodeName ? getNodeName(currentNode) : currentNode.nodeName);
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    if (_isUnsafeNode(currentNode, tagName)) {
      _forceRemove(currentNode);
      return true;
    }
    if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
      return _sanitizeDisallowedNode(currentNode, tagName);
    }
    const nt = getNodeType ? getNodeType(currentNode) : currentNode.nodeType;
    if (nt === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      const content = _stripTemplateExpressions(currentNode.textContent);
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
    if (FORBID_ATTR[lcName]) {
      return false;
    }
    if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
      return false;
    }
    const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
    if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName)) ;
    else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) ;
    else if (!nameIsPermitted) {
      if (
        // First condition does a very basic check if a) it's basically a valid custom element tagname AND
        // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
        _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || // Alternative, second condition checks if it's an `is`-attribute, AND
        // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
      ) ;
      else {
        return false;
      }
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ;
    else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) ;
    else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) ;
    else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) ;
    else if (value) {
      return false;
    } else ;
    return true;
  };
  const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]);
  const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
    return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
  };
  const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute2(lcTag, lcName, namespaceURI, value) {
    if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function" && !namespaceURI) {
      switch (trustedTypes.getAttributeType(lcTag, lcName)) {
        case "TrustedHTML": {
          return _createTrustedHTML(value);
        }
        case "TrustedScriptURL": {
          return _createTrustedScriptURL(value);
        }
      }
    }
    return value;
  };
  const _setAttributeValue = function _setAttributeValue2(currentNode, name, namespaceURI, value) {
    try {
      if (namespaceURI) {
        currentNode.setAttributeNS(namespaceURI, name, value);
      } else {
        currentNode.setAttribute(name, value);
      }
      if (_isClobbered(currentNode)) {
        _forceRemove(currentNode);
      } else {
        arrayPop(DOMPurify.removed);
      }
    } catch (_) {
      _removeAttribute(name, currentNode);
    }
  };
  const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const attributes = currentNode.attributes;
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: "",
      attrValue: "",
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: void 0
    };
    let l = attributes.length;
    const lcTag = transformCaseFunc(currentNode.nodeName);
    while (l--) {
      const attr = attributes[l];
      const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === "value" ? initValue : stringTrim(initValue);
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = void 0;
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
        _removeAttribute(name, currentNode);
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (lcName === "attributename" && stringMatch(value, "href")) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (SAFE_FOR_TEMPLATES) {
        value = _stripTemplateExpressions(value);
      }
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
      if (value !== initValue) {
        _setAttributeValue(currentNode, name, namespaceURI, value);
      }
    }
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      _sanitizeElements(shadowNode);
      _sanitizeAttributes(shadowNode);
      if (_isDocumentFragment(shadowNode.content)) {
        _sanitizeShadowDOM2(shadowNode.content);
      }
      const shadowNodeType = getNodeType ? getNodeType(shadowNode) : shadowNode.nodeType;
      if (shadowNodeType === NODE_TYPE.element) {
        const innerSr = getShadowRoot(shadowNode);
        if (_isDocumentFragment(innerSr)) {
          _sanitizeAttachedShadowRoots(innerSr);
          _sanitizeShadowDOM2(innerSr);
        }
      }
    }
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots2(root) {
    const stack = [{
      node: root,
      shadow: null
    }];
    while (stack.length > 0) {
      const item = stack.pop();
      if (item.shadow) {
        _sanitizeShadowDOM2(item.shadow);
        continue;
      }
      const node = item.node;
      const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
      const isElement = nodeType === NODE_TYPE.element;
      const childNodes = getChildNodes(node);
      if (childNodes) {
        for (let i = childNodes.length - 1; i >= 0; --i) {
          stack.push({
            node: childNodes[i],
            shadow: null
          });
        }
      }
      if (isElement) {
        const rootName = getNodeName ? getNodeName(node) : null;
        if (typeof rootName === "string" && transformCaseFunc(rootName) === "template") {
          const content = node.content;
          if (_isDocumentFragment(content)) {
            stack.push({
              node: content,
              shadow: null
            });
          }
        }
      }
      if (isElement) {
        const sr = getShadowRoot(node);
        if (_isDocumentFragment(sr)) {
          stack.push({
            node: null,
            shadow: sr
          }, {
            node: sr,
            shadow: null
          });
        }
      }
    }
  };
  DOMPurify.sanitize = function(dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = "<!-->";
    }
    if (typeof dirty !== "string" && !_isNode(dirty)) {
      dirty = stringifyValue(dirty);
      if (typeof dirty !== "string") {
        throw typeErrorCreate("dirty is not a string, aborting");
      }
    }
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    if (SET_CONFIG) {
      ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
      ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
    } else {
      _parseConfig(cfg);
    }
    if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) {
      ALLOWED_TAGS = clone2(ALLOWED_TAGS);
    }
    if (hooks.uponSanitizeAttribute.length > 0) {
      ALLOWED_ATTR = clone2(ALLOWED_ATTR);
    }
    DOMPurify.removed = [];
    const inPlace = IN_PLACE && typeof dirty !== "string" && _isNode(dirty);
    if (inPlace) {
      const nn = getNodeName ? getNodeName(dirty) : dirty.nodeName;
      if (typeof nn === "string") {
        const tagName = transformCaseFunc(nn);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
        }
      }
      if (_isClobbered(dirty)) {
        throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
      }
      try {
        _sanitizeAttachedShadowRoots(dirty);
      } catch (error) {
        _neutralizeRoot(dirty);
        throw error;
      }
    } else if (_isNode(dirty)) {
      body = _initDocument("<!---->");
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
        body = importedNode;
      } else if (importedNode.nodeName === "HTML") {
        body = importedNode;
      } else {
        body.appendChild(importedNode);
      }
      _sanitizeAttachedShadowRoots(importedNode);
    } else {
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf("<") === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
      }
      body = _initDocument(dirty);
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
      }
    }
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    const nodeIterator = _createNodeIterator(inPlace ? dirty : body);
    try {
      while (currentNode = nodeIterator.nextNode()) {
        _sanitizeElements(currentNode);
        _sanitizeAttributes(currentNode);
        if (_isDocumentFragment(currentNode.content)) {
          _sanitizeShadowDOM2(currentNode.content);
        }
      }
    } catch (error) {
      if (inPlace) {
        _neutralizeRoot(dirty);
      }
      throw error;
    }
    if (inPlace) {
      arrayForEach(DOMPurify.removed, (entry) => {
        if (entry.element) {
          _neutralizeSubtree(entry.element);
        }
      });
      if (SAFE_FOR_TEMPLATES) {
        _scrubTemplateExpressions2(dirty);
      }
      return dirty;
    }
    if (RETURN_DOM) {
      if (SAFE_FOR_TEMPLATES) {
        _scrubTemplateExpressions2(body);
      }
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
    }
    if (SAFE_FOR_TEMPLATES) {
      serializedHTML = _stripTemplateExpressions(serializedHTML);
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
    SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
    SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
  };
  DOMPurify.clearConfig = function() {
    CONFIG = null;
    SET_CONFIG = false;
    SET_CONFIG_ALLOWED_TAGS = null;
    SET_CONFIG_ALLOWED_ATTR = null;
    trustedTypesPolicy = defaultTrustedTypesPolicy;
    emptyHTML = "";
  };
  DOMPurify.isValidAttribute = function(tag, attr, value) {
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function(entryPoint, hookFunction) {
    if (typeof hookFunction !== "function") {
      return;
    }
    if (!objectHasOwnProperty(hooks, entryPoint)) {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function(entryPoint, hookFunction) {
    if (!objectHasOwnProperty(hooks, entryPoint)) {
      return void 0;
    }
    if (hookFunction !== void 0) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function(entryPoint) {
    if (!objectHasOwnProperty(hooks, entryPoint)) {
      return;
    }
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function() {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();

// node_modules/@cesium/engine/Source/Core/Credit.js
var nextCreditId = 0;
var creditToId = {};
var Credit = class _Credit {
  /**
   * @param {string} html An string representing an html code snippet
   * @param {boolean} [showOnScreen=false] If true, the credit will be visible in the main credit container.  Otherwise, it will appear in a popover. All credits are displayed `inline`, if you have an image we recommend sizing it correctly to match the text or use css to `vertical-align` it.
   *
   * @exception {DeveloperError} html is required.
   */
  constructor(html2, showOnScreen) {
    Check_default.typeOf.string("html", html2);
    let id;
    const key = html2;
    if (defined_default(creditToId[key])) {
      id = creditToId[key];
    } else {
      id = nextCreditId++;
      creditToId[key] = id;
    }
    showOnScreen = showOnScreen ?? false;
    this._id = id;
    this._html = html2;
    this._showOnScreen = showOnScreen;
    this._element = void 0;
  }
  /**
   * The credit content
   * @type {string}
   * @readonly
   */
  get html() {
    return this._html;
  }
  /**
   * @type {number}
   * @readonly
   *
   * @private
   */
  get id() {
    return this._id;
  }
  /**
   * Whether the credit should be displayed on screen or in a lightbox
   * @type {boolean}
   */
  get showOnScreen() {
    return this._showOnScreen;
  }
  set showOnScreen(value) {
    this._showOnScreen = value;
  }
  /**
   * Gets the credit element
   * @type {HTMLElement}
   * @readonly
   */
  get element() {
    if (!defined_default(this._element)) {
      const html2 = purify.sanitize(this._html);
      const div = document.createElement("div");
      div.className = "cesium-credit-wrapper";
      div._creditId = this._id;
      div.style.display = "inline";
      div.innerHTML = html2;
      const links = div.querySelectorAll("a");
      for (let i = 0; i < links.length; i++) {
        links[i].setAttribute("target", "_blank");
      }
      this._element = div;
    }
    return this._element;
  }
  /**
   * Returns true if the credits are equal
   *
   * @param {Credit} [left] The first credit
   * @param {Credit} [right] The second credit
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  static equals(left, right) {
    return left === right || defined_default(left) && defined_default(right) && left._id === right._id && left._showOnScreen === right._showOnScreen;
  }
  /**
   * Returns true if the credits are equal
   *
   * @param {Credit} [credit] The credit to compare to.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  equals(credit) {
    return _Credit.equals(this, credit);
  }
  /**
   * @private
   */
  isIon() {
    return this.html.indexOf("ion-credit.png") !== -1;
  }
  /**
   * @private
   * @param attribution
   * @return {Credit}
   */
  // @ts-expect-error Define type for GeocoderService.attributions
  static getIonCredit(attribution) {
    const showOnScreen = defined_default(attribution.collapsible) && !attribution.collapsible;
    const credit = new _Credit(attribution.html, showOnScreen);
    return credit;
  }
  /**
   * Duplicates a Credit instance.
   *
   * @param {Credit} [credit] The Credit to duplicate.
   * @returns {Credit} A new Credit instance that is a duplicate of the one provided. (Returns undefined if the credit is undefined)
   */
  static clone(credit) {
    if (defined_default(credit)) {
      return new _Credit(credit.html, credit.showOnScreen);
    }
  }
};
var Credit_default = Credit;

// node_modules/@cesium/engine/Source/Core/WebMercatorTilingScheme.js
var southwestScratch = new Cartographic_default();
var northeastScratch = new Cartographic_default();
var southwestCartesianScratch = new Cartesian3_default();
var northeastCartesianScratch = new Cartesian3_default();
var WebMercatorTilingScheme = class {
  /**
   * @type {Cartesian2}
   * @private
   */
  _rectangleSouthwestInMeters;
  /**
   * @type {Cartesian2}
   * @private
   */
  _rectangleNortheastInMeters;
  /**
   * @param {object} [options] Object with the following properties:
   * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] The ellipsoid whose surface is being tiled. Defaults to
   * the default ellipsoid.
   * @param {number} [options.numberOfLevelZeroTilesX=1] The number of tiles in the X direction at level zero of
   *        the tile tree.
   * @param {number} [options.numberOfLevelZeroTilesY=1] The number of tiles in the Y direction at level zero of
   *        the tile tree.
   * @param {Cartesian2} [options.rectangleSouthwestInMeters] The southwest corner of the rectangle covered by the
   *        tiling scheme, in meters.  If this parameter or rectangleNortheastInMeters is not specified, the entire
   *        globe is covered in the longitude direction and an equal distance is covered in the latitude
   *        direction, resulting in a square projection.
   * @param {Cartesian2} [options.rectangleNortheastInMeters] The northeast corner of the rectangle covered by the
   *        tiling scheme, in meters.  If this parameter or rectangleSouthwestInMeters is not specified, the entire
   *        globe is covered in the longitude direction and an equal distance is covered in the latitude
   *        direction, resulting in a square projection.
   */
  constructor(options) {
    options = options ?? Frozen_default.EMPTY_OBJECT;
    this._ellipsoid = options.ellipsoid ?? Ellipsoid_default.default;
    this._numberOfLevelZeroTilesX = options.numberOfLevelZeroTilesX ?? 1;
    this._numberOfLevelZeroTilesY = options.numberOfLevelZeroTilesY ?? 1;
    this._projection = new WebMercatorProjection_default(this._ellipsoid);
    if (defined_default(options.rectangleSouthwestInMeters) && defined_default(options.rectangleNortheastInMeters)) {
      this._rectangleSouthwestInMeters = options.rectangleSouthwestInMeters;
      this._rectangleNortheastInMeters = options.rectangleNortheastInMeters;
    } else {
      const semimajorAxisTimesPi = this._ellipsoid.maximumRadius * Math.PI;
      this._rectangleSouthwestInMeters = new Cartesian2_default(
        -semimajorAxisTimesPi,
        -semimajorAxisTimesPi
      );
      this._rectangleNortheastInMeters = new Cartesian2_default(
        semimajorAxisTimesPi,
        semimajorAxisTimesPi
      );
    }
    let { x, y } = this._rectangleSouthwestInMeters;
    Cartesian3_default.fromElements(x, y, 0, southwestCartesianScratch);
    this._projection.unproject(southwestCartesianScratch, southwestScratch);
    ({ x, y } = this._rectangleNortheastInMeters);
    Cartesian3_default.fromElements(x, y, 0, northeastCartesianScratch);
    this._projection.unproject(northeastCartesianScratch, northeastScratch);
    this._rectangle = new Rectangle_default(
      southwestScratch.longitude,
      southwestScratch.latitude,
      northeastScratch.longitude,
      northeastScratch.latitude
    );
  }
  /**
   * Gets the ellipsoid that is tiled by this tiling scheme.
   * @type {Ellipsoid}
   */
  get ellipsoid() {
    return this._ellipsoid;
  }
  /**
   * Gets the rectangle, in radians, covered by this tiling scheme.
   * @type {Rectangle}
   */
  get rectangle() {
    return this._rectangle;
  }
  /**
   * Gets the map projection used by this tiling scheme.
   * @type {MapProjection}
   */
  get projection() {
    return this._projection;
  }
  /**
   * Gets the total number of tiles in the X direction at a specified level-of-detail.
   *
   * @param {number} level The level-of-detail.
   * @returns {number} The number of tiles in the X direction at the given level.
   */
  getNumberOfXTilesAtLevel(level) {
    return this._numberOfLevelZeroTilesX << level;
  }
  /**
   * Gets the total number of tiles in the Y direction at a specified level-of-detail.
   *
   * @param {number} level The level-of-detail.
   * @returns {number} The number of tiles in the Y direction at the given level.
   */
  getNumberOfYTilesAtLevel(level) {
    return this._numberOfLevelZeroTilesY << level;
  }
  /**
   * Transforms a rectangle specified in geodetic radians to the native coordinate system
   * of this tiling scheme.
   *
   * @param {Rectangle} rectangle The rectangle to transform.
   * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
   *        should be created.
   * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
   *          is undefined.
   */
  rectangleToNativeRectangle(rectangle, result) {
    const projection = this._projection;
    const southwest = projection.project(Rectangle_default.southwest(rectangle));
    const northeast = projection.project(Rectangle_default.northeast(rectangle));
    if (!defined_default(result)) {
      return new Rectangle_default(southwest.x, southwest.y, northeast.x, northeast.y);
    }
    result.west = southwest.x;
    result.south = southwest.y;
    result.east = northeast.x;
    result.north = northeast.y;
    return result;
  }
  /**
   * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
   * of the tiling scheme.
   *
   * @param {number} x The integer x coordinate of the tile.
   * @param {number} y The integer y coordinate of the tile.
   * @param {number} level The tile level-of-detail.  Zero is the least detailed.
   * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
   *        should be created.
   * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
   *          if 'result' is undefined.
   */
  tileXYToNativeRectangle(x, y, level, result) {
    const xTiles = this.getNumberOfXTilesAtLevel(level);
    const yTiles = this.getNumberOfYTilesAtLevel(level);
    const xTileWidth = (this._rectangleNortheastInMeters.x - this._rectangleSouthwestInMeters.x) / xTiles;
    const west = this._rectangleSouthwestInMeters.x + x * xTileWidth;
    const east = this._rectangleSouthwestInMeters.x + (x + 1) * xTileWidth;
    const yTileHeight = (this._rectangleNortheastInMeters.y - this._rectangleSouthwestInMeters.y) / yTiles;
    const north = this._rectangleNortheastInMeters.y - y * yTileHeight;
    const south = this._rectangleNortheastInMeters.y - (y + 1) * yTileHeight;
    if (!defined_default(result)) {
      return new Rectangle_default(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }
  /**
   * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
   *
   * @param {number} x The integer x coordinate of the tile.
   * @param {number} y The integer y coordinate of the tile.
   * @param {number} level The tile level-of-detail.  Zero is the least detailed.
   * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
   *        should be created.
   * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
   *          if 'result' is undefined.
   */
  tileXYToRectangle(x, y, level, result) {
    const nativeRectangle = this.tileXYToNativeRectangle(x, y, level, result);
    const projection = this._projection;
    const southwest = projection.unproject(
      new Cartesian3_default(nativeRectangle.west, nativeRectangle.south)
    );
    const northeast = projection.unproject(
      new Cartesian3_default(nativeRectangle.east, nativeRectangle.north)
    );
    nativeRectangle.west = southwest.longitude;
    nativeRectangle.south = southwest.latitude;
    nativeRectangle.east = northeast.longitude;
    nativeRectangle.north = northeast.latitude;
    return nativeRectangle;
  }
  /**
   * Calculates the tile x, y coordinates of the tile containing
   * a given cartographic position.
   *
   * @param {Cartographic} position The position.
   * @param {number} level The tile level-of-detail.  Zero is the least detailed.
   * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
   *        should be created.
   * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
   *          if 'result' is undefined.
   */
  positionToTileXY(position, level, result) {
    const rectangle = this._rectangle;
    if (!Rectangle_default.contains(rectangle, position)) {
      return void 0;
    }
    const xTiles = this.getNumberOfXTilesAtLevel(level);
    const yTiles = this.getNumberOfYTilesAtLevel(level);
    const overallWidth = this._rectangleNortheastInMeters.x - this._rectangleSouthwestInMeters.x;
    const xTileWidth = overallWidth / xTiles;
    const overallHeight = this._rectangleNortheastInMeters.y - this._rectangleSouthwestInMeters.y;
    const yTileHeight = overallHeight / yTiles;
    const projection = this._projection;
    const webMercatorPosition = projection.project(position);
    const distanceFromWest = webMercatorPosition.x - this._rectangleSouthwestInMeters.x;
    const distanceFromNorth = this._rectangleNortheastInMeters.y - webMercatorPosition.y;
    let xTileCoordinate = distanceFromWest / xTileWidth | 0;
    if (xTileCoordinate >= xTiles) {
      xTileCoordinate = xTiles - 1;
    }
    let yTileCoordinate = distanceFromNorth / yTileHeight | 0;
    if (yTileCoordinate >= yTiles) {
      yTileCoordinate = yTiles - 1;
    }
    if (!defined_default(result)) {
      return new Cartesian2_default(xTileCoordinate, yTileCoordinate);
    }
    result.x = xTileCoordinate;
    result.y = yTileCoordinate;
    return result;
  }
};
var WebMercatorTilingScheme_default = WebMercatorTilingScheme;

// node_modules/@cesium/engine/Source/Scene/ImageryProvider.js
function ImageryProvider() {
  DeveloperError_default.throwInstantiationError();
}
Object.defineProperties(ImageryProvider.prototype, {
  /**
   * Gets the rectangle, in radians, of the imagery provided by the instance.
   * @memberof ImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets the width of each tile, in pixels.
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets the height of each tile, in pixels.
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets the maximum level-of-detail that can be requested.
   * @memberof ImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets the minimum level-of-detail that can be requested.  Generally,
   * a minimum level should only be used when the rectangle of the imagery is small
   * enough that the number of tiles at the minimum level is small.  An imagery
   * provider with more than a few tiles at the minimum level will lead to
   * rendering problems.
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets the tiling scheme used by the provider.
   * @memberof ImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets the tile discard policy.  If not undefined, the discard policy is responsible
   * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
   * returns undefined, no tiles are filtered.
   * @memberof ImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
   * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
   * are passed an instance of {@link TileProviderError}.
   * @memberof ImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
   * the source of the imagery.
   * @memberof ImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets the proxy used by this provider.
   * @memberof ImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: DeveloperError_default.throwInstantiationError
  },
  /**
   * Gets a value indicating whether or not the images provided by this imagery provider
   * include an alpha channel.  If this property is false, an alpha channel, if present, will
   * be ignored.  If this property is true, any images without an alpha channel will be treated
   * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
   * and texture upload time are reduced.
   * @memberof ImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: DeveloperError_default.throwInstantiationError
  }
});
ImageryProvider.prototype.getTileCredits = function(x, y, level) {
  DeveloperError_default.throwInstantiationError();
};
ImageryProvider.prototype.requestImage = function(x, y, level, request) {
  DeveloperError_default.throwInstantiationError();
};
ImageryProvider.prototype.pickFeatures = function(x, y, level, longitude, latitude) {
  DeveloperError_default.throwInstantiationError();
};
var ktx2Regex = /\.ktx2$/i;
ImageryProvider.loadImage = function(imageryProvider, url) {
  Check_default.defined("url", url);
  const resource = Resource_default.createIfNeeded(url);
  if (ktx2Regex.test(resource.url)) {
    return loadKTX2_default(resource);
  } else if (defined_default(imageryProvider) && defined_default(imageryProvider.tileDiscardPolicy)) {
    return resource.fetchImage({
      preferBlob: true,
      preferImageBitmap: true,
      flipY: true
    });
  }
  return resource.fetchImage({
    preferImageBitmap: true,
    flipY: true
  });
};
var ImageryProvider_default = ImageryProvider;

// node_modules/@cesium/engine/Source/Scene/UrlTemplateImageryProvider.js
var templateRegex = /{[^}]+}/g;
var tags = {
  x: xTag,
  y: yTag,
  z: zTag,
  s: sTag,
  reverseX: reverseXTag,
  reverseY: reverseYTag,
  reverseZ: reverseZTag,
  westDegrees: westDegreesTag,
  southDegrees: southDegreesTag,
  eastDegrees: eastDegreesTag,
  northDegrees: northDegreesTag,
  westProjected: westProjectedTag,
  southProjected: southProjectedTag,
  eastProjected: eastProjectedTag,
  northProjected: northProjectedTag,
  width: widthTag,
  height: heightTag
};
var pickFeaturesTags = combine_default(tags, {
  i: iTag,
  j: jTag,
  reverseI: reverseITag,
  reverseJ: reverseJTag,
  longitudeDegrees: longitudeDegreesTag,
  latitudeDegrees: latitudeDegreesTag,
  longitudeProjected: longitudeProjectedTag,
  latitudeProjected: latitudeProjectedTag,
  format: formatTag
});
function UrlTemplateImageryProvider(options) {
  options = options ?? Frozen_default.EMPTY_OBJECT;
  this._errorEvent = new Event_default();
  Check_default.defined("options.url", options.url);
  const resource = Resource_default.createIfNeeded(options.url);
  const pickFeaturesResource = Resource_default.createIfNeeded(options.pickFeaturesUrl);
  this._resource = resource;
  this._urlSchemeZeroPadding = options.urlSchemeZeroPadding;
  this._getFeatureInfoFormats = options.getFeatureInfoFormats;
  this._pickFeaturesResource = pickFeaturesResource;
  let subdomains = options.subdomains;
  if (Array.isArray(subdomains)) {
    subdomains = subdomains.slice();
  } else if (defined_default(subdomains) && subdomains.length > 0) {
    subdomains = subdomains.split("");
  } else {
    subdomains = ["a", "b", "c"];
  }
  this._subdomains = subdomains;
  this._tileWidth = options.tileWidth ?? 256;
  this._tileHeight = options.tileHeight ?? 256;
  this._minimumLevel = options.minimumLevel ?? 0;
  this._maximumLevel = options.maximumLevel;
  this._tilingScheme = options.tilingScheme ?? new WebMercatorTilingScheme_default({ ellipsoid: options.ellipsoid });
  this._rectangle = options.rectangle ?? this._tilingScheme.rectangle;
  this._rectangle = Rectangle_default.intersection(
    this._rectangle,
    this._tilingScheme.rectangle
  );
  this._tileDiscardPolicy = options.tileDiscardPolicy;
  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit_default(credit);
  }
  this._credit = credit;
  this._hasAlphaChannel = options.hasAlphaChannel ?? true;
  const customTags = options.customTags;
  const allTags = combine_default(tags, customTags);
  const allPickFeaturesTags = combine_default(pickFeaturesTags, customTags);
  this._tags = allTags;
  this._pickFeaturesTags = allPickFeaturesTags;
  this._defaultAlpha = void 0;
  this._defaultNightAlpha = void 0;
  this._defaultDayAlpha = void 0;
  this._defaultBrightness = void 0;
  this._defaultContrast = void 0;
  this._defaultHue = void 0;
  this._defaultSaturation = void 0;
  this._defaultGamma = void 0;
  this._defaultMinificationFilter = void 0;
  this._defaultMagnificationFilter = void 0;
  this.enablePickFeatures = options.enablePickFeatures ?? true;
}
Object.defineProperties(UrlTemplateImageryProvider.prototype, {
  /**
   * Gets the URL template to use to request tiles.  It has the following keywords:
   * <ul>
   *  <li> <code>{z}</code>: The level of the tile in the tiling scheme.  Level zero is the root of the quadtree pyramid.</li>
   *  <li> <code>{x}</code>: The tile X coordinate in the tiling scheme, where 0 is the Westernmost tile.</li>
   *  <li> <code>{y}</code>: The tile Y coordinate in the tiling scheme, where 0 is the Northernmost tile.</li>
   *  <li> <code>{s}</code>: One of the available subdomains, used to overcome browser limits on the number of simultaneous requests per host.</li>
   *  <li> <code>{reverseX}</code>: The tile X coordinate in the tiling scheme, where 0 is the Easternmost tile.</li>
   *  <li> <code>{reverseY}</code>: The tile Y coordinate in the tiling scheme, where 0 is the Southernmost tile.</li>
   *  <li> <code>{reverseZ}</code>: The level of the tile in the tiling scheme, where level zero is the maximum level of the quadtree pyramid.  In order to use reverseZ, maximumLevel must be defined.</li>
   *  <li> <code>{westDegrees}</code>: The Western edge of the tile in geodetic degrees.</li>
   *  <li> <code>{southDegrees}</code>: The Southern edge of the tile in geodetic degrees.</li>
   *  <li> <code>{eastDegrees}</code>: The Eastern edge of the tile in geodetic degrees.</li>
   *  <li> <code>{northDegrees}</code>: The Northern edge of the tile in geodetic degrees.</li>
   *  <li> <code>{westProjected}</code>: The Western edge of the tile in projected coordinates of the tiling scheme.</li>
   *  <li> <code>{southProjected}</code>: The Southern edge of the tile in projected coordinates of the tiling scheme.</li>
   *  <li> <code>{eastProjected}</code>: The Eastern edge of the tile in projected coordinates of the tiling scheme.</li>
   *  <li> <code>{northProjected}</code>: The Northern edge of the tile in projected coordinates of the tiling scheme.</li>
   *  <li> <code>{width}</code>: The width of each tile in pixels.</li>
   *  <li> <code>{height}</code>: The height of each tile in pixels.</li>
   * </ul>
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function() {
      return this._resource.url;
    }
  },
  /**
   * Gets the URL scheme zero padding for each tile coordinate. The format is '000' where each coordinate will be padded on
   * the left with zeros to match the width of the passed string of zeros. e.g. Setting:
   * urlSchemeZeroPadding : { '{x}' : '0000'}
   * will cause an 'x' value of 12 to return the string '0012' for {x} in the generated URL.
   * It has the following keywords:
   * <ul>
   *  <li> <code>{z}</code>: The zero padding for the level of the tile in the tiling scheme.</li>
   *  <li> <code>{x}</code>: The zero padding for the tile X coordinate in the tiling scheme.</li>
   *  <li> <code>{y}</code>: The zero padding for the the tile Y coordinate in the tiling scheme.</li>
   *  <li> <code>{reverseX}</code>: The zero padding for the tile reverseX coordinate in the tiling scheme.</li>
   *  <li> <code>{reverseY}</code>: The zero padding for the tile reverseY coordinate in the tiling scheme.</li>
   *  <li> <code>{reverseZ}</code>: The zero padding for the reverseZ coordinate of the tile in the tiling scheme.</li>
   * </ul>
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {object}
   * @readonly
   */
  urlSchemeZeroPadding: {
    get: function() {
      return this._urlSchemeZeroPadding;
    }
  },
  /**
   * Gets the URL template to use to use to pick features.  If this property is not specified,
   * {@link UrlTemplateImageryProvider#pickFeatures} will immediately return undefined, indicating no
   * features picked.  The URL template supports all of the keywords supported by the
   * {@link UrlTemplateImageryProvider#url} property, plus the following:
   * <ul>
   *     <li><code>{i}</code>: The pixel column (horizontal coordinate) of the picked position, where the Westernmost pixel is 0.</li>
   *     <li><code>{j}</code>: The pixel row (vertical coordinate) of the picked position, where the Northernmost pixel is 0.</li>
   *     <li><code>{reverseI}</code>: The pixel column (horizontal coordinate) of the picked position, where the Easternmost pixel is 0.</li>
   *     <li><code>{reverseJ}</code>: The pixel row (vertical coordinate) of the picked position, where the Southernmost pixel is 0.</li>
   *     <li><code>{longitudeDegrees}</code>: The longitude of the picked position in degrees.</li>
   *     <li><code>{latitudeDegrees}</code>: The latitude of the picked position in degrees.</li>
   *     <li><code>{longitudeProjected}</code>: The longitude of the picked position in the projected coordinates of the tiling scheme.</li>
   *     <li><code>{latitudeProjected}</code>: The latitude of the picked position in the projected coordinates of the tiling scheme.</li>
   *     <li><code>{format}</code>: The format in which to get feature information, as specified in the {@link GetFeatureInfoFormat}.</li>
   * </ul>
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  pickFeaturesUrl: {
    get: function() {
      return this._pickFeaturesResource.url;
    }
  },
  /**
   * Gets the proxy used by this provider.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   * @default undefined
   */
  proxy: {
    get: function() {
      return this._resource.proxy;
    }
  },
  /**
   * Gets the width of each tile, in pixels.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {number}
   * @readonly
   * @default 256
   */
  tileWidth: {
    get: function() {
      return this._tileWidth;
    }
  },
  /**
   * Gets the height of each tile, in pixels.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {number}
   * @readonly
   * @default 256
   */
  tileHeight: {
    get: function() {
      return this._tileHeight;
    }
  },
  /**
   * Gets the maximum level-of-detail that can be requested, or undefined if there is no limit.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   * @default undefined
   */
  maximumLevel: {
    get: function() {
      return this._maximumLevel;
    }
  },
  /**
   * Gets the minimum level-of-detail that can be requested.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {number}
   * @readonly
   * @default 0
   */
  minimumLevel: {
    get: function() {
      return this._minimumLevel;
    }
  },
  /**
   * Gets the tiling scheme used by this provider.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   * @default new WebMercatorTilingScheme()
   */
  tilingScheme: {
    get: function() {
      return this._tilingScheme;
    }
  },
  /**
   * Gets the rectangle, in radians, of the imagery provided by this instance.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   * @default tilingScheme.rectangle
   */
  rectangle: {
    get: function() {
      return this._rectangle;
    }
  },
  /**
   * Gets the tile discard policy.  If not undefined, the discard policy is responsible
   * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
   * returns undefined, no tiles are filtered.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   * @default undefined
   */
  tileDiscardPolicy: {
    get: function() {
      return this._tileDiscardPolicy;
    }
  },
  /**
   * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
   * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
   * are passed an instance of {@link TileProviderError}.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function() {
      return this._errorEvent;
    }
  },
  /**
   * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
   * the source of the imagery.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {Credit}
   * @readonly
   * @default undefined
   */
  credit: {
    get: function() {
      return this._credit;
    }
  },
  /**
   * Gets a value indicating whether or not the images provided by this imagery provider
   * include an alpha channel.  If this property is false, an alpha channel, if present, will
   * be ignored.  If this property is true, any images without an alpha channel will be treated
   * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
   * and texture upload time are reduced.
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {boolean}
   * @readonly
   * @default true
   */
  hasAlphaChannel: {
    get: function() {
      return this._hasAlphaChannel;
    }
  }
});
UrlTemplateImageryProvider.prototype.getTileCredits = function(x, y, level) {
  return void 0;
};
UrlTemplateImageryProvider.prototype.requestImage = function(x, y, level, request) {
  return ImageryProvider_default.loadImage(
    this,
    buildImageResource(this, x, y, level, request)
  );
};
UrlTemplateImageryProvider.prototype.pickFeatures = function(x, y, level, longitude, latitude) {
  if (!this.enablePickFeatures || !defined_default(this._pickFeaturesResource) || this._getFeatureInfoFormats.length === 0) {
    return void 0;
  }
  let formatIndex = 0;
  const that = this;
  function handleResponse(format, data) {
    return format.callback(data);
  }
  function doRequest() {
    if (formatIndex >= that._getFeatureInfoFormats.length) {
      return Promise.resolve([]);
    }
    const format = that._getFeatureInfoFormats[formatIndex];
    const resource = buildPickFeaturesResource(
      that,
      x,
      y,
      level,
      longitude,
      latitude,
      format.format
    );
    ++formatIndex;
    if (format.type === "json") {
      return resource.fetchJson().then(format.callback).catch(doRequest);
    } else if (format.type === "xml") {
      return resource.fetchXML().then(format.callback).catch(doRequest);
    } else if (format.type === "text" || format.type === "html") {
      return resource.fetchText().then(format.callback).catch(doRequest);
    }
    return resource.fetch({
      responseType: format.format
    }).then(handleResponse.bind(void 0, format)).catch(doRequest);
  }
  return doRequest();
};
var degreesScratchComputed = false;
var degreesScratch = new Rectangle_default();
var projectedScratchComputed = false;
var projectedScratch = new Rectangle_default();
function buildImageResource(imageryProvider, x, y, level, request) {
  degreesScratchComputed = false;
  projectedScratchComputed = false;
  const resource = imageryProvider._resource;
  const url = resource.getUrlComponent(true);
  const allTags = imageryProvider._tags;
  const templateValues = {};
  const match = url.match(templateRegex);
  if (defined_default(match)) {
    match.forEach(function(tag) {
      const key = tag.substring(1, tag.length - 1);
      if (defined_default(allTags[key])) {
        templateValues[key] = allTags[key](imageryProvider, x, y, level);
      }
    });
  }
  return resource.getDerivedResource({
    request,
    templateValues
  });
}
var ijScratchComputed = false;
var ijScratch = new Cartesian2_default();
var longitudeLatitudeProjectedScratchComputed = false;
function buildPickFeaturesResource(imageryProvider, x, y, level, longitude, latitude, format) {
  degreesScratchComputed = false;
  projectedScratchComputed = false;
  ijScratchComputed = false;
  longitudeLatitudeProjectedScratchComputed = false;
  const resource = imageryProvider._pickFeaturesResource;
  const url = resource.getUrlComponent(true);
  const allTags = imageryProvider._pickFeaturesTags;
  const templateValues = {};
  const match = url.match(templateRegex);
  if (defined_default(match)) {
    match.forEach(function(tag) {
      const key = tag.substring(1, tag.length - 1);
      if (defined_default(allTags[key])) {
        templateValues[key] = allTags[key](
          imageryProvider,
          x,
          y,
          level,
          longitude,
          latitude,
          format
        );
      }
    });
  }
  return resource.getDerivedResource({
    templateValues
  });
}
function padWithZerosIfNecessary(imageryProvider, key, value) {
  if (imageryProvider && imageryProvider.urlSchemeZeroPadding && imageryProvider.urlSchemeZeroPadding.hasOwnProperty(key)) {
    const paddingTemplate = imageryProvider.urlSchemeZeroPadding[key];
    if (typeof paddingTemplate === "string") {
      const paddingTemplateWidth = paddingTemplate.length;
      if (paddingTemplateWidth > 1) {
        value = value.length >= paddingTemplateWidth ? value : new Array(
          paddingTemplateWidth - value.toString().length + 1
        ).join("0") + value;
      }
    }
  }
  return value;
}
function xTag(imageryProvider, x, y, level) {
  return padWithZerosIfNecessary(imageryProvider, "{x}", x);
}
function reverseXTag(imageryProvider, x, y, level) {
  const reverseX = imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(level) - x - 1;
  return padWithZerosIfNecessary(imageryProvider, "{reverseX}", reverseX);
}
function yTag(imageryProvider, x, y, level) {
  return padWithZerosIfNecessary(imageryProvider, "{y}", y);
}
function reverseYTag(imageryProvider, x, y, level) {
  const reverseY = imageryProvider.tilingScheme.getNumberOfYTilesAtLevel(level) - y - 1;
  return padWithZerosIfNecessary(imageryProvider, "{reverseY}", reverseY);
}
function reverseZTag(imageryProvider, x, y, level) {
  const maximumLevel = imageryProvider.maximumLevel;
  const reverseZ = defined_default(maximumLevel) && level < maximumLevel ? maximumLevel - level - 1 : level;
  return padWithZerosIfNecessary(imageryProvider, "{reverseZ}", reverseZ);
}
function zTag(imageryProvider, x, y, level) {
  return padWithZerosIfNecessary(imageryProvider, "{z}", level);
}
function sTag(imageryProvider, x, y, level) {
  const index = (x + y + level) % imageryProvider._subdomains.length;
  return imageryProvider._subdomains[index];
}
function computeDegrees(imageryProvider, x, y, level) {
  if (degreesScratchComputed) {
    return;
  }
  imageryProvider.tilingScheme.tileXYToRectangle(x, y, level, degreesScratch);
  degreesScratch.west = Math_default.toDegrees(degreesScratch.west);
  degreesScratch.south = Math_default.toDegrees(degreesScratch.south);
  degreesScratch.east = Math_default.toDegrees(degreesScratch.east);
  degreesScratch.north = Math_default.toDegrees(degreesScratch.north);
  degreesScratchComputed = true;
}
function westDegreesTag(imageryProvider, x, y, level) {
  computeDegrees(imageryProvider, x, y, level);
  return degreesScratch.west;
}
function southDegreesTag(imageryProvider, x, y, level) {
  computeDegrees(imageryProvider, x, y, level);
  return degreesScratch.south;
}
function eastDegreesTag(imageryProvider, x, y, level) {
  computeDegrees(imageryProvider, x, y, level);
  return degreesScratch.east;
}
function northDegreesTag(imageryProvider, x, y, level) {
  computeDegrees(imageryProvider, x, y, level);
  return degreesScratch.north;
}
function computeProjected(imageryProvider, x, y, level) {
  if (projectedScratchComputed) {
    return;
  }
  imageryProvider.tilingScheme.tileXYToNativeRectangle(
    x,
    y,
    level,
    projectedScratch
  );
  projectedScratchComputed = true;
}
function westProjectedTag(imageryProvider, x, y, level) {
  computeProjected(imageryProvider, x, y, level);
  return projectedScratch.west;
}
function southProjectedTag(imageryProvider, x, y, level) {
  computeProjected(imageryProvider, x, y, level);
  return projectedScratch.south;
}
function eastProjectedTag(imageryProvider, x, y, level) {
  computeProjected(imageryProvider, x, y, level);
  return projectedScratch.east;
}
function northProjectedTag(imageryProvider, x, y, level) {
  computeProjected(imageryProvider, x, y, level);
  return projectedScratch.north;
}
function widthTag(imageryProvider, x, y, level) {
  return imageryProvider.tileWidth;
}
function heightTag(imageryProvider, x, y, level) {
  return imageryProvider.tileHeight;
}
function iTag(imageryProvider, x, y, level, longitude, latitude, format) {
  computeIJ(imageryProvider, x, y, level, longitude, latitude);
  return ijScratch.x;
}
function jTag(imageryProvider, x, y, level, longitude, latitude, format) {
  computeIJ(imageryProvider, x, y, level, longitude, latitude);
  return ijScratch.y;
}
function reverseITag(imageryProvider, x, y, level, longitude, latitude, format) {
  computeIJ(imageryProvider, x, y, level, longitude, latitude);
  return imageryProvider.tileWidth - ijScratch.x - 1;
}
function reverseJTag(imageryProvider, x, y, level, longitude, latitude, format) {
  computeIJ(imageryProvider, x, y, level, longitude, latitude);
  return imageryProvider.tileHeight - ijScratch.y - 1;
}
var rectangleScratch = new Rectangle_default();
var longitudeLatitudeProjectedScratch = new Cartesian3_default();
function computeIJ(imageryProvider, x, y, level, longitude, latitude, format) {
  if (ijScratchComputed) {
    return;
  }
  computeLongitudeLatitudeProjected(
    imageryProvider,
    x,
    y,
    level,
    longitude,
    latitude
  );
  const projected = longitudeLatitudeProjectedScratch;
  const rectangle = imageryProvider.tilingScheme.tileXYToNativeRectangle(
    x,
    y,
    level,
    rectangleScratch
  );
  ijScratch.x = imageryProvider.tileWidth * (projected.x - rectangle.west) / rectangle.width | 0;
  ijScratch.y = imageryProvider.tileHeight * (rectangle.north - projected.y) / rectangle.height | 0;
  ijScratchComputed = true;
}
function longitudeDegreesTag(imageryProvider, x, y, level, longitude, latitude, format) {
  return Math_default.toDegrees(longitude);
}
function latitudeDegreesTag(imageryProvider, x, y, level, longitude, latitude, format) {
  return Math_default.toDegrees(latitude);
}
function longitudeProjectedTag(imageryProvider, x, y, level, longitude, latitude, format) {
  computeLongitudeLatitudeProjected(
    imageryProvider,
    x,
    y,
    level,
    longitude,
    latitude
  );
  return longitudeLatitudeProjectedScratch.x;
}
function latitudeProjectedTag(imageryProvider, x, y, level, longitude, latitude, format) {
  computeLongitudeLatitudeProjected(
    imageryProvider,
    x,
    y,
    level,
    longitude,
    latitude
  );
  return longitudeLatitudeProjectedScratch.y;
}
var cartographicScratch = new Cartographic_default();
function computeLongitudeLatitudeProjected(imageryProvider, x, y, level, longitude, latitude, format) {
  if (longitudeLatitudeProjectedScratchComputed) {
    return;
  }
  if (imageryProvider.tilingScheme.projection instanceof GeographicProjection_default) {
    longitudeLatitudeProjectedScratch.x = Math_default.toDegrees(longitude);
    longitudeLatitudeProjectedScratch.y = Math_default.toDegrees(latitude);
  } else {
    const cartographic = cartographicScratch;
    cartographic.longitude = longitude;
    cartographic.latitude = latitude;
    imageryProvider.tilingScheme.projection.project(
      cartographic,
      longitudeLatitudeProjectedScratch
    );
  }
  longitudeLatitudeProjectedScratchComputed = true;
}
function formatTag(imageryProvider, x, y, level, longitude, latitude, format) {
  return format;
}
var UrlTemplateImageryProvider_default = UrlTemplateImageryProvider;

// node_modules/@cesium/engine/index.js
globalThis.CESIUM_VERSION = "1.143.0";

// js/utils.js
var toastTimeout = null;
var toast = document.getElementById("toastMessage");
function showToast(text2, duration = 4e3) {
  toast.textContent = text2;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// js/imagery.js
function initCustomImagery(imageryProviders, viewer) {
  const ViewModelClass = imageryProviders[0].constructor;
  const QQ_KEY = "NUUBZ-CIQLL-63XPP-EFH5R-M65T2-WYBKN";
  const tencentProvider = new UrlTemplateImageryProvider_default({
    url: "https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&type=vector&styleid=1&key=" + QQ_KEY,
    subdomains: ["0", "1", "2", "3"],
    minimumLevel: 3,
    maximumLevel: 18
  });
  const tencentViewModel = new ViewModelClass({
    name: "\u817E\u8BAF\u5730\u56FE",
    iconUrl: "./icons/tencent.png",
    tooltip: "\u817E\u8BAF\u5730\u56FE",
    creationFunction: () => tencentProvider
  });
  imageryProviders.push(tencentViewModel);
  const TDT_KEY = "a2c1970433fcd0bd2e1125a77ff6e2ed";
  const tiandituProvider = new UrlTemplateImageryProvider_default({
    url: "https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=" + TDT_KEY,
    subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
    maximumLevel: 18
  });
  const tiandituLabelProvider = new UrlTemplateImageryProvider_default({
    url: "https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=" + TDT_KEY,
    subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
    maximumLevel: 18
  });
  const tiandituViewModel = new ViewModelClass({
    name: "\u5929\u5730\u56FE\u536B\u661F",
    iconUrl: "./icons/tianditu.png",
    tooltip: "\u5929\u5730\u56FE\u536B\u661F\u5F71\u50CF",
    creationFunction: () => tiandituProvider
  });
  imageryProviders.push(tiandituViewModel);
  let overlayLayer = null;
  let previousIsTDT = false;
  function notifyOverlayChange(message) {
    if (typeof showToast === "function") {
      showToast(message);
    }
    if (typeof window !== "undefined") {
      window.showToast = showToast;
    }
  }
  function updateOverlay() {
    const currentImagery = viewer.baseLayerPicker.viewModel.selectedImagery;
    let currentName = "";
    if (currentImagery && typeof currentImagery === "object") {
      currentName = currentImagery.name || currentImagery.peek?.().name || "";
    }
    const isTDT = currentName.includes("\u5929\u5730\u56FE");
    if (isTDT && !previousIsTDT) {
      localStorage.setItem("overlayEnabled", "true");
      notifyOverlayChange("\u{1F4CD} \u8DEF\u7F51\u53CA\u53E0\u52A0\u5C42\u5DF2\u5F00\u542F\uFF0C\u53EF\u5728\u8BBE\u7F6E\u9875\u5173\u95ED");
    } else if (!isTDT && previousIsTDT) {
      localStorage.setItem("overlayEnabled", "false");
      notifyOverlayChange("\u{1F4CD} \u79BB\u5F00\u5929\u5730\u56FE\uFF0C\u8DEF\u7F51\u53CA\u53E0\u52A0\u5C42\u5DF2\u5173\u95ED");
    }
    previousIsTDT = isTDT;
    const overlayEnabled = localStorage.getItem("overlayEnabled") === "true";
    if (overlayEnabled) {
      if (!overlayLayer) {
        overlayLayer = viewer.imageryLayers.addImageryProvider(tiandituLabelProvider, 0);
        viewer.imageryLayers.raiseToTop(overlayLayer);
      }
    } else {
      if (overlayLayer) {
        viewer.imageryLayers.remove(overlayLayer, true);
        overlayLayer = null;
      }
    }
  }
  if (viewer.baseLayerPicker && viewer.baseLayerPicker.viewModel) {
    const pickerViewModel = viewer.baseLayerPicker.viewModel;
    if (pickerViewModel.selectedImagery && typeof pickerViewModel.selectedImagery.subscribe === "function") {
      pickerViewModel.selectedImagery.subscribe(updateOverlay);
    } else if (pickerViewModel.selectedImagery && pickerViewModel.selectedImagery.changed && typeof pickerViewModel.selectedImagery.changed.addEventListener === "function") {
      pickerViewModel.selectedImagery.changed.addEventListener(updateOverlay);
    } else {
      let lastImageryName = "";
      setInterval(() => {
        const curr = pickerViewModel.selectedImagery;
        const newName = curr && (curr.name || curr.peek?.().name) || "";
        if (newName !== lastImageryName) {
          lastImageryName = newName;
          updateOverlay();
        }
      }, 300);
    }
  }
  window.addEventListener("storage", (e) => {
    if (e.key === "overlayEnabled") {
      updateOverlay();
    }
  });
  updateOverlay();
}
export {
  initCustomImagery
};
/*! Bundled license information:

urijs/src/punycode.js:
  (*! https://mths.be/punycode v1.4.0 by @mathias *)

urijs/src/IPv6.js:
  (*!
   * URI.js - Mutating URLs
   * IPv6 Support
   *
   * Version: 1.19.11
   *
   * Author: Rodney Rehm
   * Web: http://medialize.github.io/URI.js/
   *
   * Licensed under
   *   MIT License http://www.opensource.org/licenses/mit-license
   *
   *)

urijs/src/SecondLevelDomains.js:
  (*!
   * URI.js - Mutating URLs
   * Second Level Domain (SLD) Support
   *
   * Version: 1.19.11
   *
   * Author: Rodney Rehm
   * Web: http://medialize.github.io/URI.js/
   *
   * Licensed under
   *   MIT License http://www.opensource.org/licenses/mit-license
   *
   *)

urijs/src/URI.js:
  (*!
   * URI.js - Mutating URLs
   *
   * Version: 1.19.11
   *
   * Author: Rodney Rehm
   * Web: http://medialize.github.io/URI.js/
   *
   * Licensed under
   *   MIT License http://www.opensource.org/licenses/mit-license
   *
   *)

dompurify/dist/purify.es.mjs:
  (*! @license DOMPurify 3.4.11 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.11/LICENSE *)
*/
