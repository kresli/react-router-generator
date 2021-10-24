var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/fs.realpath/old.js
var require_old = __commonJS({
  "node_modules/fs.realpath/old.js"(exports2) {
    var pathModule = require("path");
    var isWindows = process.platform === "win32";
    var fs2 = require("fs");
    var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);
    function rethrow() {
      var callback;
      if (DEBUG) {
        var backtrace = new Error();
        callback = debugCallback;
      } else
        callback = missingCallback;
      return callback;
      function debugCallback(err) {
        if (err) {
          backtrace.message = err.message;
          err = backtrace;
          missingCallback(err);
        }
      }
      function missingCallback(err) {
        if (err) {
          if (process.throwDeprecation)
            throw err;
          else if (!process.noDeprecation) {
            var msg = "fs: missing callback " + (err.stack || err.message);
            if (process.traceDeprecation)
              console.trace(msg);
            else
              console.error(msg);
          }
        }
      }
    }
    function maybeCallback(cb) {
      return typeof cb === "function" ? cb : rethrow();
    }
    var normalize = pathModule.normalize;
    if (isWindows) {
      nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
    } else {
      nextPartRe = /(.*?)(?:[\/]+|$)/g;
    }
    var nextPartRe;
    if (isWindows) {
      splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
    } else {
      splitRootRe = /^[\/]*/;
    }
    var splitRootRe;
    exports2.realpathSync = function realpathSync(p, cache) {
      p = pathModule.resolve(p);
      if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
        return cache[p];
      }
      var original = p, seenLinks = {}, knownHard = {};
      var pos;
      var current;
      var base;
      var previous;
      start();
      function start() {
        var m = splitRootRe.exec(p);
        pos = m[0].length;
        current = m[0];
        base = m[0];
        previous = "";
        if (isWindows && !knownHard[base]) {
          fs2.lstatSync(base);
          knownHard[base] = true;
        }
      }
      while (pos < p.length) {
        nextPartRe.lastIndex = pos;
        var result = nextPartRe.exec(p);
        previous = current;
        current += result[0];
        base = previous + result[1];
        pos = nextPartRe.lastIndex;
        if (knownHard[base] || cache && cache[base] === base) {
          continue;
        }
        var resolvedLink;
        if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
          resolvedLink = cache[base];
        } else {
          var stat = fs2.lstatSync(base);
          if (!stat.isSymbolicLink()) {
            knownHard[base] = true;
            if (cache)
              cache[base] = base;
            continue;
          }
          var linkTarget = null;
          if (!isWindows) {
            var id = stat.dev.toString(32) + ":" + stat.ino.toString(32);
            if (seenLinks.hasOwnProperty(id)) {
              linkTarget = seenLinks[id];
            }
          }
          if (linkTarget === null) {
            fs2.statSync(base);
            linkTarget = fs2.readlinkSync(base);
          }
          resolvedLink = pathModule.resolve(previous, linkTarget);
          if (cache)
            cache[base] = resolvedLink;
          if (!isWindows)
            seenLinks[id] = linkTarget;
        }
        p = pathModule.resolve(resolvedLink, p.slice(pos));
        start();
      }
      if (cache)
        cache[original] = p;
      return p;
    };
    exports2.realpath = function realpath(p, cache, cb) {
      if (typeof cb !== "function") {
        cb = maybeCallback(cache);
        cache = null;
      }
      p = pathModule.resolve(p);
      if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
        return process.nextTick(cb.bind(null, null, cache[p]));
      }
      var original = p, seenLinks = {}, knownHard = {};
      var pos;
      var current;
      var base;
      var previous;
      start();
      function start() {
        var m = splitRootRe.exec(p);
        pos = m[0].length;
        current = m[0];
        base = m[0];
        previous = "";
        if (isWindows && !knownHard[base]) {
          fs2.lstat(base, function(err) {
            if (err)
              return cb(err);
            knownHard[base] = true;
            LOOP();
          });
        } else {
          process.nextTick(LOOP);
        }
      }
      function LOOP() {
        if (pos >= p.length) {
          if (cache)
            cache[original] = p;
          return cb(null, p);
        }
        nextPartRe.lastIndex = pos;
        var result = nextPartRe.exec(p);
        previous = current;
        current += result[0];
        base = previous + result[1];
        pos = nextPartRe.lastIndex;
        if (knownHard[base] || cache && cache[base] === base) {
          return process.nextTick(LOOP);
        }
        if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
          return gotResolvedLink(cache[base]);
        }
        return fs2.lstat(base, gotStat);
      }
      function gotStat(err, stat) {
        if (err)
          return cb(err);
        if (!stat.isSymbolicLink()) {
          knownHard[base] = true;
          if (cache)
            cache[base] = base;
          return process.nextTick(LOOP);
        }
        if (!isWindows) {
          var id = stat.dev.toString(32) + ":" + stat.ino.toString(32);
          if (seenLinks.hasOwnProperty(id)) {
            return gotTarget(null, seenLinks[id], base);
          }
        }
        fs2.stat(base, function(err2) {
          if (err2)
            return cb(err2);
          fs2.readlink(base, function(err3, target) {
            if (!isWindows)
              seenLinks[id] = target;
            gotTarget(err3, target);
          });
        });
      }
      function gotTarget(err, target, base2) {
        if (err)
          return cb(err);
        var resolvedLink = pathModule.resolve(previous, target);
        if (cache)
          cache[base2] = resolvedLink;
        gotResolvedLink(resolvedLink);
      }
      function gotResolvedLink(resolvedLink) {
        p = pathModule.resolve(resolvedLink, p.slice(pos));
        start();
      }
    };
  }
});

// node_modules/fs.realpath/index.js
var require_fs = __commonJS({
  "node_modules/fs.realpath/index.js"(exports2, module2) {
    module2.exports = realpath;
    realpath.realpath = realpath;
    realpath.sync = realpathSync;
    realpath.realpathSync = realpathSync;
    realpath.monkeypatch = monkeypatch;
    realpath.unmonkeypatch = unmonkeypatch;
    var fs2 = require("fs");
    var origRealpath = fs2.realpath;
    var origRealpathSync = fs2.realpathSync;
    var version = process.version;
    var ok = /^v[0-5]\./.test(version);
    var old = require_old();
    function newError(er) {
      return er && er.syscall === "realpath" && (er.code === "ELOOP" || er.code === "ENOMEM" || er.code === "ENAMETOOLONG");
    }
    function realpath(p, cache, cb) {
      if (ok) {
        return origRealpath(p, cache, cb);
      }
      if (typeof cache === "function") {
        cb = cache;
        cache = null;
      }
      origRealpath(p, cache, function(er, result) {
        if (newError(er)) {
          old.realpath(p, cache, cb);
        } else {
          cb(er, result);
        }
      });
    }
    function realpathSync(p, cache) {
      if (ok) {
        return origRealpathSync(p, cache);
      }
      try {
        return origRealpathSync(p, cache);
      } catch (er) {
        if (newError(er)) {
          return old.realpathSync(p, cache);
        } else {
          throw er;
        }
      }
    }
    function monkeypatch() {
      fs2.realpath = realpath;
      fs2.realpathSync = realpathSync;
    }
    function unmonkeypatch() {
      fs2.realpath = origRealpath;
      fs2.realpathSync = origRealpathSync;
    }
  }
});

// node_modules/concat-map/index.js
var require_concat_map = __commonJS({
  "node_modules/concat-map/index.js"(exports2, module2) {
    module2.exports = function(xs, fn) {
      var res = [];
      for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x))
          res.push.apply(res, x);
        else
          res.push(x);
      }
      return res;
    };
    var isArray = Array.isArray || function(xs) {
      return Object.prototype.toString.call(xs) === "[object Array]";
    };
  }
});

// node_modules/balanced-match/index.js
var require_balanced_match = __commonJS({
  "node_modules/balanced-match/index.js"(exports2, module2) {
    "use strict";
    module2.exports = balanced;
    function balanced(a, b, str) {
      if (a instanceof RegExp)
        a = maybeMatch(a, str);
      if (b instanceof RegExp)
        b = maybeMatch(b, str);
      var r = range(a, b, str);
      return r && {
        start: r[0],
        end: r[1],
        pre: str.slice(0, r[0]),
        body: str.slice(r[0] + a.length, r[1]),
        post: str.slice(r[1] + b.length)
      };
    }
    function maybeMatch(reg, str) {
      var m = str.match(reg);
      return m ? m[0] : null;
    }
    balanced.range = range;
    function range(a, b, str) {
      var begs, beg, left, right, result;
      var ai = str.indexOf(a);
      var bi = str.indexOf(b, ai + 1);
      var i = ai;
      if (ai >= 0 && bi > 0) {
        if (a === b) {
          return [ai, bi];
        }
        begs = [];
        left = str.length;
        while (i >= 0 && !result) {
          if (i == ai) {
            begs.push(i);
            ai = str.indexOf(a, i + 1);
          } else if (begs.length == 1) {
            result = [begs.pop(), bi];
          } else {
            beg = begs.pop();
            if (beg < left) {
              left = beg;
              right = bi;
            }
            bi = str.indexOf(b, i + 1);
          }
          i = ai < bi && ai >= 0 ? ai : bi;
        }
        if (begs.length) {
          result = [left, right];
        }
      }
      return result;
    }
  }
});

// node_modules/brace-expansion/index.js
var require_brace_expansion = __commonJS({
  "node_modules/brace-expansion/index.js"(exports2, module2) {
    var concatMap = require_concat_map();
    var balanced = require_balanced_match();
    module2.exports = expandTop;
    var escSlash = "\0SLASH" + Math.random() + "\0";
    var escOpen = "\0OPEN" + Math.random() + "\0";
    var escClose = "\0CLOSE" + Math.random() + "\0";
    var escComma = "\0COMMA" + Math.random() + "\0";
    var escPeriod = "\0PERIOD" + Math.random() + "\0";
    function numeric(str) {
      return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
    }
    function escapeBraces(str) {
      return str.split("\\\\").join(escSlash).split("\\{").join(escOpen).split("\\}").join(escClose).split("\\,").join(escComma).split("\\.").join(escPeriod);
    }
    function unescapeBraces(str) {
      return str.split(escSlash).join("\\").split(escOpen).join("{").split(escClose).join("}").split(escComma).join(",").split(escPeriod).join(".");
    }
    function parseCommaParts(str) {
      if (!str)
        return [""];
      var parts = [];
      var m = balanced("{", "}", str);
      if (!m)
        return str.split(",");
      var pre = m.pre;
      var body = m.body;
      var post = m.post;
      var p = pre.split(",");
      p[p.length - 1] += "{" + body + "}";
      var postParts = parseCommaParts(post);
      if (post.length) {
        p[p.length - 1] += postParts.shift();
        p.push.apply(p, postParts);
      }
      parts.push.apply(parts, p);
      return parts;
    }
    function expandTop(str) {
      if (!str)
        return [];
      if (str.substr(0, 2) === "{}") {
        str = "\\{\\}" + str.substr(2);
      }
      return expand(escapeBraces(str), true).map(unescapeBraces);
    }
    function embrace(str) {
      return "{" + str + "}";
    }
    function isPadded(el) {
      return /^-?0\d/.test(el);
    }
    function lte(i, y) {
      return i <= y;
    }
    function gte(i, y) {
      return i >= y;
    }
    function expand(str, isTop) {
      var expansions = [];
      var m = balanced("{", "}", str);
      if (!m || /\$$/.test(m.pre))
        return [str];
      var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
      var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
      var isSequence = isNumericSequence || isAlphaSequence;
      var isOptions = m.body.indexOf(",") >= 0;
      if (!isSequence && !isOptions) {
        if (m.post.match(/,.*\}/)) {
          str = m.pre + "{" + m.body + escClose + m.post;
          return expand(str);
        }
        return [str];
      }
      var n;
      if (isSequence) {
        n = m.body.split(/\.\./);
      } else {
        n = parseCommaParts(m.body);
        if (n.length === 1) {
          n = expand(n[0], false).map(embrace);
          if (n.length === 1) {
            var post = m.post.length ? expand(m.post, false) : [""];
            return post.map(function(p) {
              return m.pre + n[0] + p;
            });
          }
        }
      }
      var pre = m.pre;
      var post = m.post.length ? expand(m.post, false) : [""];
      var N;
      if (isSequence) {
        var x = numeric(n[0]);
        var y = numeric(n[1]);
        var width = Math.max(n[0].length, n[1].length);
        var incr = n.length == 3 ? Math.abs(numeric(n[2])) : 1;
        var test = lte;
        var reverse = y < x;
        if (reverse) {
          incr *= -1;
          test = gte;
        }
        var pad = n.some(isPadded);
        N = [];
        for (var i = x; test(i, y); i += incr) {
          var c;
          if (isAlphaSequence) {
            c = String.fromCharCode(i);
            if (c === "\\")
              c = "";
          } else {
            c = String(i);
            if (pad) {
              var need = width - c.length;
              if (need > 0) {
                var z = new Array(need + 1).join("0");
                if (i < 0)
                  c = "-" + z + c.slice(1);
                else
                  c = z + c;
              }
            }
          }
          N.push(c);
        }
      } else {
        N = concatMap(n, function(el) {
          return expand(el, false);
        });
      }
      for (var j = 0; j < N.length; j++) {
        for (var k = 0; k < post.length; k++) {
          var expansion = pre + N[j] + post[k];
          if (!isTop || isSequence || expansion)
            expansions.push(expansion);
        }
      }
      return expansions;
    }
  }
});

// node_modules/minimatch/minimatch.js
var require_minimatch = __commonJS({
  "node_modules/minimatch/minimatch.js"(exports2, module2) {
    module2.exports = minimatch;
    minimatch.Minimatch = Minimatch;
    var path2 = { sep: "/" };
    try {
      path2 = require("path");
    } catch (er) {
    }
    var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {};
    var expand = require_brace_expansion();
    var plTypes = {
      "!": { open: "(?:(?!(?:", close: "))[^/]*?)" },
      "?": { open: "(?:", close: ")?" },
      "+": { open: "(?:", close: ")+" },
      "*": { open: "(?:", close: ")*" },
      "@": { open: "(?:", close: ")" }
    };
    var qmark = "[^/]";
    var star = qmark + "*?";
    var twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
    var twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
    var reSpecials = charSet("().*{}+?[]^$\\!");
    function charSet(s) {
      return s.split("").reduce(function(set, c) {
        set[c] = true;
        return set;
      }, {});
    }
    var slashSplit = /\/+/;
    minimatch.filter = filter;
    function filter(pattern, options) {
      options = options || {};
      return function(p, i, list) {
        return minimatch(p, pattern, options);
      };
    }
    function ext(a, b) {
      a = a || {};
      b = b || {};
      var t = {};
      Object.keys(b).forEach(function(k) {
        t[k] = b[k];
      });
      Object.keys(a).forEach(function(k) {
        t[k] = a[k];
      });
      return t;
    }
    minimatch.defaults = function(def) {
      if (!def || !Object.keys(def).length)
        return minimatch;
      var orig = minimatch;
      var m = function minimatch2(p, pattern, options) {
        return orig.minimatch(p, pattern, ext(def, options));
      };
      m.Minimatch = function Minimatch2(pattern, options) {
        return new orig.Minimatch(pattern, ext(def, options));
      };
      return m;
    };
    Minimatch.defaults = function(def) {
      if (!def || !Object.keys(def).length)
        return Minimatch;
      return minimatch.defaults(def).Minimatch;
    };
    function minimatch(p, pattern, options) {
      if (typeof pattern !== "string") {
        throw new TypeError("glob pattern string required");
      }
      if (!options)
        options = {};
      if (!options.nocomment && pattern.charAt(0) === "#") {
        return false;
      }
      if (pattern.trim() === "")
        return p === "";
      return new Minimatch(pattern, options).match(p);
    }
    function Minimatch(pattern, options) {
      if (!(this instanceof Minimatch)) {
        return new Minimatch(pattern, options);
      }
      if (typeof pattern !== "string") {
        throw new TypeError("glob pattern string required");
      }
      if (!options)
        options = {};
      pattern = pattern.trim();
      if (path2.sep !== "/") {
        pattern = pattern.split(path2.sep).join("/");
      }
      this.options = options;
      this.set = [];
      this.pattern = pattern;
      this.regexp = null;
      this.negate = false;
      this.comment = false;
      this.empty = false;
      this.make();
    }
    Minimatch.prototype.debug = function() {
    };
    Minimatch.prototype.make = make;
    function make() {
      if (this._made)
        return;
      var pattern = this.pattern;
      var options = this.options;
      if (!options.nocomment && pattern.charAt(0) === "#") {
        this.comment = true;
        return;
      }
      if (!pattern) {
        this.empty = true;
        return;
      }
      this.parseNegate();
      var set = this.globSet = this.braceExpand();
      if (options.debug)
        this.debug = console.error;
      this.debug(this.pattern, set);
      set = this.globParts = set.map(function(s) {
        return s.split(slashSplit);
      });
      this.debug(this.pattern, set);
      set = set.map(function(s, si, set2) {
        return s.map(this.parse, this);
      }, this);
      this.debug(this.pattern, set);
      set = set.filter(function(s) {
        return s.indexOf(false) === -1;
      });
      this.debug(this.pattern, set);
      this.set = set;
    }
    Minimatch.prototype.parseNegate = parseNegate;
    function parseNegate() {
      var pattern = this.pattern;
      var negate = false;
      var options = this.options;
      var negateOffset = 0;
      if (options.nonegate)
        return;
      for (var i = 0, l = pattern.length; i < l && pattern.charAt(i) === "!"; i++) {
        negate = !negate;
        negateOffset++;
      }
      if (negateOffset)
        this.pattern = pattern.substr(negateOffset);
      this.negate = negate;
    }
    minimatch.braceExpand = function(pattern, options) {
      return braceExpand(pattern, options);
    };
    Minimatch.prototype.braceExpand = braceExpand;
    function braceExpand(pattern, options) {
      if (!options) {
        if (this instanceof Minimatch) {
          options = this.options;
        } else {
          options = {};
        }
      }
      pattern = typeof pattern === "undefined" ? this.pattern : pattern;
      if (typeof pattern === "undefined") {
        throw new TypeError("undefined pattern");
      }
      if (options.nobrace || !pattern.match(/\{.*\}/)) {
        return [pattern];
      }
      return expand(pattern);
    }
    Minimatch.prototype.parse = parse;
    var SUBPARSE = {};
    function parse(pattern, isSub) {
      if (pattern.length > 1024 * 64) {
        throw new TypeError("pattern is too long");
      }
      var options = this.options;
      if (!options.noglobstar && pattern === "**")
        return GLOBSTAR;
      if (pattern === "")
        return "";
      var re = "";
      var hasMagic = !!options.nocase;
      var escaping = false;
      var patternListStack = [];
      var negativeLists = [];
      var stateChar;
      var inClass = false;
      var reClassStart = -1;
      var classStart = -1;
      var patternStart = pattern.charAt(0) === "." ? "" : options.dot ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)";
      var self = this;
      function clearStateChar() {
        if (stateChar) {
          switch (stateChar) {
            case "*":
              re += star;
              hasMagic = true;
              break;
            case "?":
              re += qmark;
              hasMagic = true;
              break;
            default:
              re += "\\" + stateChar;
              break;
          }
          self.debug("clearStateChar %j %j", stateChar, re);
          stateChar = false;
        }
      }
      for (var i = 0, len = pattern.length, c; i < len && (c = pattern.charAt(i)); i++) {
        this.debug("%s	%s %s %j", pattern, i, re, c);
        if (escaping && reSpecials[c]) {
          re += "\\" + c;
          escaping = false;
          continue;
        }
        switch (c) {
          case "/":
            return false;
          case "\\":
            clearStateChar();
            escaping = true;
            continue;
          case "?":
          case "*":
          case "+":
          case "@":
          case "!":
            this.debug("%s	%s %s %j <-- stateChar", pattern, i, re, c);
            if (inClass) {
              this.debug("  in class");
              if (c === "!" && i === classStart + 1)
                c = "^";
              re += c;
              continue;
            }
            self.debug("call clearStateChar %j", stateChar);
            clearStateChar();
            stateChar = c;
            if (options.noext)
              clearStateChar();
            continue;
          case "(":
            if (inClass) {
              re += "(";
              continue;
            }
            if (!stateChar) {
              re += "\\(";
              continue;
            }
            patternListStack.push({
              type: stateChar,
              start: i - 1,
              reStart: re.length,
              open: plTypes[stateChar].open,
              close: plTypes[stateChar].close
            });
            re += stateChar === "!" ? "(?:(?!(?:" : "(?:";
            this.debug("plType %j %j", stateChar, re);
            stateChar = false;
            continue;
          case ")":
            if (inClass || !patternListStack.length) {
              re += "\\)";
              continue;
            }
            clearStateChar();
            hasMagic = true;
            var pl = patternListStack.pop();
            re += pl.close;
            if (pl.type === "!") {
              negativeLists.push(pl);
            }
            pl.reEnd = re.length;
            continue;
          case "|":
            if (inClass || !patternListStack.length || escaping) {
              re += "\\|";
              escaping = false;
              continue;
            }
            clearStateChar();
            re += "|";
            continue;
          case "[":
            clearStateChar();
            if (inClass) {
              re += "\\" + c;
              continue;
            }
            inClass = true;
            classStart = i;
            reClassStart = re.length;
            re += c;
            continue;
          case "]":
            if (i === classStart + 1 || !inClass) {
              re += "\\" + c;
              escaping = false;
              continue;
            }
            if (inClass) {
              var cs = pattern.substring(classStart + 1, i);
              try {
                RegExp("[" + cs + "]");
              } catch (er) {
                var sp = this.parse(cs, SUBPARSE);
                re = re.substr(0, reClassStart) + "\\[" + sp[0] + "\\]";
                hasMagic = hasMagic || sp[1];
                inClass = false;
                continue;
              }
            }
            hasMagic = true;
            inClass = false;
            re += c;
            continue;
          default:
            clearStateChar();
            if (escaping) {
              escaping = false;
            } else if (reSpecials[c] && !(c === "^" && inClass)) {
              re += "\\";
            }
            re += c;
        }
      }
      if (inClass) {
        cs = pattern.substr(classStart + 1);
        sp = this.parse(cs, SUBPARSE);
        re = re.substr(0, reClassStart) + "\\[" + sp[0];
        hasMagic = hasMagic || sp[1];
      }
      for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
        var tail = re.slice(pl.reStart + pl.open.length);
        this.debug("setting tail", re, pl);
        tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function(_, $1, $2) {
          if (!$2) {
            $2 = "\\";
          }
          return $1 + $1 + $2 + "|";
        });
        this.debug("tail=%j\n   %s", tail, tail, pl, re);
        var t = pl.type === "*" ? star : pl.type === "?" ? qmark : "\\" + pl.type;
        hasMagic = true;
        re = re.slice(0, pl.reStart) + t + "\\(" + tail;
      }
      clearStateChar();
      if (escaping) {
        re += "\\\\";
      }
      var addPatternStart = false;
      switch (re.charAt(0)) {
        case ".":
        case "[":
        case "(":
          addPatternStart = true;
      }
      for (var n = negativeLists.length - 1; n > -1; n--) {
        var nl = negativeLists[n];
        var nlBefore = re.slice(0, nl.reStart);
        var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
        var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
        var nlAfter = re.slice(nl.reEnd);
        nlLast += nlAfter;
        var openParensBefore = nlBefore.split("(").length - 1;
        var cleanAfter = nlAfter;
        for (i = 0; i < openParensBefore; i++) {
          cleanAfter = cleanAfter.replace(/\)[+*?]?/, "");
        }
        nlAfter = cleanAfter;
        var dollar = "";
        if (nlAfter === "" && isSub !== SUBPARSE) {
          dollar = "$";
        }
        var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
        re = newRe;
      }
      if (re !== "" && hasMagic) {
        re = "(?=.)" + re;
      }
      if (addPatternStart) {
        re = patternStart + re;
      }
      if (isSub === SUBPARSE) {
        return [re, hasMagic];
      }
      if (!hasMagic) {
        return globUnescape(pattern);
      }
      var flags = options.nocase ? "i" : "";
      try {
        var regExp = new RegExp("^" + re + "$", flags);
      } catch (er) {
        return new RegExp("$.");
      }
      regExp._glob = pattern;
      regExp._src = re;
      return regExp;
    }
    minimatch.makeRe = function(pattern, options) {
      return new Minimatch(pattern, options || {}).makeRe();
    };
    Minimatch.prototype.makeRe = makeRe;
    function makeRe() {
      if (this.regexp || this.regexp === false)
        return this.regexp;
      var set = this.set;
      if (!set.length) {
        this.regexp = false;
        return this.regexp;
      }
      var options = this.options;
      var twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
      var flags = options.nocase ? "i" : "";
      var re = set.map(function(pattern) {
        return pattern.map(function(p) {
          return p === GLOBSTAR ? twoStar : typeof p === "string" ? regExpEscape(p) : p._src;
        }).join("\\/");
      }).join("|");
      re = "^(?:" + re + ")$";
      if (this.negate)
        re = "^(?!" + re + ").*$";
      try {
        this.regexp = new RegExp(re, flags);
      } catch (ex) {
        this.regexp = false;
      }
      return this.regexp;
    }
    minimatch.match = function(list, pattern, options) {
      options = options || {};
      var mm = new Minimatch(pattern, options);
      list = list.filter(function(f) {
        return mm.match(f);
      });
      if (mm.options.nonull && !list.length) {
        list.push(pattern);
      }
      return list;
    };
    Minimatch.prototype.match = match;
    function match(f, partial) {
      this.debug("match", f, this.pattern);
      if (this.comment)
        return false;
      if (this.empty)
        return f === "";
      if (f === "/" && partial)
        return true;
      var options = this.options;
      if (path2.sep !== "/") {
        f = f.split(path2.sep).join("/");
      }
      f = f.split(slashSplit);
      this.debug(this.pattern, "split", f);
      var set = this.set;
      this.debug(this.pattern, "set", set);
      var filename;
      var i;
      for (i = f.length - 1; i >= 0; i--) {
        filename = f[i];
        if (filename)
          break;
      }
      for (i = 0; i < set.length; i++) {
        var pattern = set[i];
        var file = f;
        if (options.matchBase && pattern.length === 1) {
          file = [filename];
        }
        var hit = this.matchOne(file, pattern, partial);
        if (hit) {
          if (options.flipNegate)
            return true;
          return !this.negate;
        }
      }
      if (options.flipNegate)
        return false;
      return this.negate;
    }
    Minimatch.prototype.matchOne = function(file, pattern, partial) {
      var options = this.options;
      this.debug("matchOne", { "this": this, file, pattern });
      this.debug("matchOne", file.length, pattern.length);
      for (var fi = 0, pi = 0, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
        this.debug("matchOne loop");
        var p = pattern[pi];
        var f = file[fi];
        this.debug(pattern, p, f);
        if (p === false)
          return false;
        if (p === GLOBSTAR) {
          this.debug("GLOBSTAR", [pattern, p, f]);
          var fr = fi;
          var pr = pi + 1;
          if (pr === pl) {
            this.debug("** at the end");
            for (; fi < fl; fi++) {
              if (file[fi] === "." || file[fi] === ".." || !options.dot && file[fi].charAt(0) === ".")
                return false;
            }
            return true;
          }
          while (fr < fl) {
            var swallowee = file[fr];
            this.debug("\nglobstar while", file, fr, pattern, pr, swallowee);
            if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
              this.debug("globstar found match!", fr, fl, swallowee);
              return true;
            } else {
              if (swallowee === "." || swallowee === ".." || !options.dot && swallowee.charAt(0) === ".") {
                this.debug("dot detected!", file, fr, pattern, pr);
                break;
              }
              this.debug("globstar swallow a segment, and continue");
              fr++;
            }
          }
          if (partial) {
            this.debug("\n>>> no match, partial?", file, fr, pattern, pr);
            if (fr === fl)
              return true;
          }
          return false;
        }
        var hit;
        if (typeof p === "string") {
          if (options.nocase) {
            hit = f.toLowerCase() === p.toLowerCase();
          } else {
            hit = f === p;
          }
          this.debug("string match", p, f, hit);
        } else {
          hit = f.match(p);
          this.debug("pattern match", p, f, hit);
        }
        if (!hit)
          return false;
      }
      if (fi === fl && pi === pl) {
        return true;
      } else if (fi === fl) {
        return partial;
      } else if (pi === pl) {
        var emptyFileEnd = fi === fl - 1 && file[fi] === "";
        return emptyFileEnd;
      }
      throw new Error("wtf?");
    };
    function globUnescape(s) {
      return s.replace(/\\(.)/g, "$1");
    }
    function regExpEscape(s) {
      return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }
  }
});

// node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "node_modules/inherits/inherits_browser.js"(exports2, module2) {
    if (typeof Object.create === "function") {
      module2.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module2.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "node_modules/inherits/inherits.js"(exports2, module2) {
    try {
      util = require("util");
      if (typeof util.inherits !== "function")
        throw "";
      module2.exports = util.inherits;
    } catch (e) {
      module2.exports = require_inherits_browser();
    }
    var util;
  }
});

// node_modules/path-is-absolute/index.js
var require_path_is_absolute = __commonJS({
  "node_modules/path-is-absolute/index.js"(exports2, module2) {
    "use strict";
    function posix(path2) {
      return path2.charAt(0) === "/";
    }
    function win32(path2) {
      var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
      var result = splitDeviceRe.exec(path2);
      var device = result[1] || "";
      var isUnc = Boolean(device && device.charAt(1) !== ":");
      return Boolean(result[2] || isUnc);
    }
    module2.exports = process.platform === "win32" ? win32 : posix;
    module2.exports.posix = posix;
    module2.exports.win32 = win32;
  }
});

// node_modules/glob/common.js
var require_common = __commonJS({
  "node_modules/glob/common.js"(exports2) {
    exports2.setopts = setopts;
    exports2.ownProp = ownProp;
    exports2.makeAbs = makeAbs;
    exports2.finish = finish;
    exports2.mark = mark;
    exports2.isIgnored = isIgnored;
    exports2.childrenIgnored = childrenIgnored;
    function ownProp(obj, field) {
      return Object.prototype.hasOwnProperty.call(obj, field);
    }
    var fs2 = require("fs");
    var path2 = require("path");
    var minimatch = require_minimatch();
    var isAbsolute = require_path_is_absolute();
    var Minimatch = minimatch.Minimatch;
    function alphasort(a, b) {
      return a.localeCompare(b, "en");
    }
    function setupIgnores(self, options) {
      self.ignore = options.ignore || [];
      if (!Array.isArray(self.ignore))
        self.ignore = [self.ignore];
      if (self.ignore.length) {
        self.ignore = self.ignore.map(ignoreMap);
      }
    }
    function ignoreMap(pattern) {
      var gmatcher = null;
      if (pattern.slice(-3) === "/**") {
        var gpattern = pattern.replace(/(\/\*\*)+$/, "");
        gmatcher = new Minimatch(gpattern, { dot: true });
      }
      return {
        matcher: new Minimatch(pattern, { dot: true }),
        gmatcher
      };
    }
    function setopts(self, pattern, options) {
      if (!options)
        options = {};
      if (options.matchBase && pattern.indexOf("/") === -1) {
        if (options.noglobstar) {
          throw new Error("base matching requires globstar");
        }
        pattern = "**/" + pattern;
      }
      self.silent = !!options.silent;
      self.pattern = pattern;
      self.strict = options.strict !== false;
      self.realpath = !!options.realpath;
      self.realpathCache = options.realpathCache || Object.create(null);
      self.follow = !!options.follow;
      self.dot = !!options.dot;
      self.mark = !!options.mark;
      self.nodir = !!options.nodir;
      if (self.nodir)
        self.mark = true;
      self.sync = !!options.sync;
      self.nounique = !!options.nounique;
      self.nonull = !!options.nonull;
      self.nosort = !!options.nosort;
      self.nocase = !!options.nocase;
      self.stat = !!options.stat;
      self.noprocess = !!options.noprocess;
      self.absolute = !!options.absolute;
      self.fs = options.fs || fs2;
      self.maxLength = options.maxLength || Infinity;
      self.cache = options.cache || Object.create(null);
      self.statCache = options.statCache || Object.create(null);
      self.symlinks = options.symlinks || Object.create(null);
      setupIgnores(self, options);
      self.changedCwd = false;
      var cwd = process.cwd();
      if (!ownProp(options, "cwd"))
        self.cwd = cwd;
      else {
        self.cwd = path2.resolve(options.cwd);
        self.changedCwd = self.cwd !== cwd;
      }
      self.root = options.root || path2.resolve(self.cwd, "/");
      self.root = path2.resolve(self.root);
      if (process.platform === "win32")
        self.root = self.root.replace(/\\/g, "/");
      self.cwdAbs = isAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd);
      if (process.platform === "win32")
        self.cwdAbs = self.cwdAbs.replace(/\\/g, "/");
      self.nomount = !!options.nomount;
      options.nonegate = true;
      options.nocomment = true;
      self.minimatch = new Minimatch(pattern, options);
      self.options = self.minimatch.options;
    }
    function finish(self) {
      var nou = self.nounique;
      var all = nou ? [] : Object.create(null);
      for (var i = 0, l = self.matches.length; i < l; i++) {
        var matches = self.matches[i];
        if (!matches || Object.keys(matches).length === 0) {
          if (self.nonull) {
            var literal = self.minimatch.globSet[i];
            if (nou)
              all.push(literal);
            else
              all[literal] = true;
          }
        } else {
          var m = Object.keys(matches);
          if (nou)
            all.push.apply(all, m);
          else
            m.forEach(function(m2) {
              all[m2] = true;
            });
        }
      }
      if (!nou)
        all = Object.keys(all);
      if (!self.nosort)
        all = all.sort(alphasort);
      if (self.mark) {
        for (var i = 0; i < all.length; i++) {
          all[i] = self._mark(all[i]);
        }
        if (self.nodir) {
          all = all.filter(function(e) {
            var notDir = !/\/$/.test(e);
            var c = self.cache[e] || self.cache[makeAbs(self, e)];
            if (notDir && c)
              notDir = c !== "DIR" && !Array.isArray(c);
            return notDir;
          });
        }
      }
      if (self.ignore.length)
        all = all.filter(function(m2) {
          return !isIgnored(self, m2);
        });
      self.found = all;
    }
    function mark(self, p) {
      var abs = makeAbs(self, p);
      var c = self.cache[abs];
      var m = p;
      if (c) {
        var isDir = c === "DIR" || Array.isArray(c);
        var slash = p.slice(-1) === "/";
        if (isDir && !slash)
          m += "/";
        else if (!isDir && slash)
          m = m.slice(0, -1);
        if (m !== p) {
          var mabs = makeAbs(self, m);
          self.statCache[mabs] = self.statCache[abs];
          self.cache[mabs] = self.cache[abs];
        }
      }
      return m;
    }
    function makeAbs(self, f) {
      var abs = f;
      if (f.charAt(0) === "/") {
        abs = path2.join(self.root, f);
      } else if (isAbsolute(f) || f === "") {
        abs = f;
      } else if (self.changedCwd) {
        abs = path2.resolve(self.cwd, f);
      } else {
        abs = path2.resolve(f);
      }
      if (process.platform === "win32")
        abs = abs.replace(/\\/g, "/");
      return abs;
    }
    function isIgnored(self, path3) {
      if (!self.ignore.length)
        return false;
      return self.ignore.some(function(item) {
        return item.matcher.match(path3) || !!(item.gmatcher && item.gmatcher.match(path3));
      });
    }
    function childrenIgnored(self, path3) {
      if (!self.ignore.length)
        return false;
      return self.ignore.some(function(item) {
        return !!(item.gmatcher && item.gmatcher.match(path3));
      });
    }
  }
});

// node_modules/glob/sync.js
var require_sync = __commonJS({
  "node_modules/glob/sync.js"(exports2, module2) {
    module2.exports = globSync;
    globSync.GlobSync = GlobSync;
    var rp = require_fs();
    var minimatch = require_minimatch();
    var Minimatch = minimatch.Minimatch;
    var Glob = require_glob().Glob;
    var util = require("util");
    var path2 = require("path");
    var assert = require("assert");
    var isAbsolute = require_path_is_absolute();
    var common = require_common();
    var setopts = common.setopts;
    var ownProp = common.ownProp;
    var childrenIgnored = common.childrenIgnored;
    var isIgnored = common.isIgnored;
    function globSync(pattern, options) {
      if (typeof options === "function" || arguments.length === 3)
        throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");
      return new GlobSync(pattern, options).found;
    }
    function GlobSync(pattern, options) {
      if (!pattern)
        throw new Error("must provide pattern");
      if (typeof options === "function" || arguments.length === 3)
        throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");
      if (!(this instanceof GlobSync))
        return new GlobSync(pattern, options);
      setopts(this, pattern, options);
      if (this.noprocess)
        return this;
      var n = this.minimatch.set.length;
      this.matches = new Array(n);
      for (var i = 0; i < n; i++) {
        this._process(this.minimatch.set[i], i, false);
      }
      this._finish();
    }
    GlobSync.prototype._finish = function() {
      assert(this instanceof GlobSync);
      if (this.realpath) {
        var self = this;
        this.matches.forEach(function(matchset, index) {
          var set = self.matches[index] = Object.create(null);
          for (var p in matchset) {
            try {
              p = self._makeAbs(p);
              var real = rp.realpathSync(p, self.realpathCache);
              set[real] = true;
            } catch (er) {
              if (er.syscall === "stat")
                set[self._makeAbs(p)] = true;
              else
                throw er;
            }
          }
        });
      }
      common.finish(this);
    };
    GlobSync.prototype._process = function(pattern, index, inGlobStar) {
      assert(this instanceof GlobSync);
      var n = 0;
      while (typeof pattern[n] === "string") {
        n++;
      }
      var prefix;
      switch (n) {
        case pattern.length:
          this._processSimple(pattern.join("/"), index);
          return;
        case 0:
          prefix = null;
          break;
        default:
          prefix = pattern.slice(0, n).join("/");
          break;
      }
      var remain = pattern.slice(n);
      var read;
      if (prefix === null)
        read = ".";
      else if (isAbsolute(prefix) || isAbsolute(pattern.join("/"))) {
        if (!prefix || !isAbsolute(prefix))
          prefix = "/" + prefix;
        read = prefix;
      } else
        read = prefix;
      var abs = this._makeAbs(read);
      if (childrenIgnored(this, read))
        return;
      var isGlobStar = remain[0] === minimatch.GLOBSTAR;
      if (isGlobStar)
        this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);
      else
        this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
    };
    GlobSync.prototype._processReaddir = function(prefix, read, abs, remain, index, inGlobStar) {
      var entries = this._readdir(abs, inGlobStar);
      if (!entries)
        return;
      var pn = remain[0];
      var negate = !!this.minimatch.negate;
      var rawGlob = pn._glob;
      var dotOk = this.dot || rawGlob.charAt(0) === ".";
      var matchedEntries = [];
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.charAt(0) !== "." || dotOk) {
          var m;
          if (negate && !prefix) {
            m = !e.match(pn);
          } else {
            m = e.match(pn);
          }
          if (m)
            matchedEntries.push(e);
        }
      }
      var len = matchedEntries.length;
      if (len === 0)
        return;
      if (remain.length === 1 && !this.mark && !this.stat) {
        if (!this.matches[index])
          this.matches[index] = Object.create(null);
        for (var i = 0; i < len; i++) {
          var e = matchedEntries[i];
          if (prefix) {
            if (prefix.slice(-1) !== "/")
              e = prefix + "/" + e;
            else
              e = prefix + e;
          }
          if (e.charAt(0) === "/" && !this.nomount) {
            e = path2.join(this.root, e);
          }
          this._emitMatch(index, e);
        }
        return;
      }
      remain.shift();
      for (var i = 0; i < len; i++) {
        var e = matchedEntries[i];
        var newPattern;
        if (prefix)
          newPattern = [prefix, e];
        else
          newPattern = [e];
        this._process(newPattern.concat(remain), index, inGlobStar);
      }
    };
    GlobSync.prototype._emitMatch = function(index, e) {
      if (isIgnored(this, e))
        return;
      var abs = this._makeAbs(e);
      if (this.mark)
        e = this._mark(e);
      if (this.absolute) {
        e = abs;
      }
      if (this.matches[index][e])
        return;
      if (this.nodir) {
        var c = this.cache[abs];
        if (c === "DIR" || Array.isArray(c))
          return;
      }
      this.matches[index][e] = true;
      if (this.stat)
        this._stat(e);
    };
    GlobSync.prototype._readdirInGlobStar = function(abs) {
      if (this.follow)
        return this._readdir(abs, false);
      var entries;
      var lstat;
      var stat;
      try {
        lstat = this.fs.lstatSync(abs);
      } catch (er) {
        if (er.code === "ENOENT") {
          return null;
        }
      }
      var isSym = lstat && lstat.isSymbolicLink();
      this.symlinks[abs] = isSym;
      if (!isSym && lstat && !lstat.isDirectory())
        this.cache[abs] = "FILE";
      else
        entries = this._readdir(abs, false);
      return entries;
    };
    GlobSync.prototype._readdir = function(abs, inGlobStar) {
      var entries;
      if (inGlobStar && !ownProp(this.symlinks, abs))
        return this._readdirInGlobStar(abs);
      if (ownProp(this.cache, abs)) {
        var c = this.cache[abs];
        if (!c || c === "FILE")
          return null;
        if (Array.isArray(c))
          return c;
      }
      try {
        return this._readdirEntries(abs, this.fs.readdirSync(abs));
      } catch (er) {
        this._readdirError(abs, er);
        return null;
      }
    };
    GlobSync.prototype._readdirEntries = function(abs, entries) {
      if (!this.mark && !this.stat) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (abs === "/")
            e = abs + e;
          else
            e = abs + "/" + e;
          this.cache[e] = true;
        }
      }
      this.cache[abs] = entries;
      return entries;
    };
    GlobSync.prototype._readdirError = function(f, er) {
      switch (er.code) {
        case "ENOTSUP":
        case "ENOTDIR":
          var abs = this._makeAbs(f);
          this.cache[abs] = "FILE";
          if (abs === this.cwdAbs) {
            var error = new Error(er.code + " invalid cwd " + this.cwd);
            error.path = this.cwd;
            error.code = er.code;
            throw error;
          }
          break;
        case "ENOENT":
        case "ELOOP":
        case "ENAMETOOLONG":
        case "UNKNOWN":
          this.cache[this._makeAbs(f)] = false;
          break;
        default:
          this.cache[this._makeAbs(f)] = false;
          if (this.strict)
            throw er;
          if (!this.silent)
            console.error("glob error", er);
          break;
      }
    };
    GlobSync.prototype._processGlobStar = function(prefix, read, abs, remain, index, inGlobStar) {
      var entries = this._readdir(abs, inGlobStar);
      if (!entries)
        return;
      var remainWithoutGlobStar = remain.slice(1);
      var gspref = prefix ? [prefix] : [];
      var noGlobStar = gspref.concat(remainWithoutGlobStar);
      this._process(noGlobStar, index, false);
      var len = entries.length;
      var isSym = this.symlinks[abs];
      if (isSym && inGlobStar)
        return;
      for (var i = 0; i < len; i++) {
        var e = entries[i];
        if (e.charAt(0) === "." && !this.dot)
          continue;
        var instead = gspref.concat(entries[i], remainWithoutGlobStar);
        this._process(instead, index, true);
        var below = gspref.concat(entries[i], remain);
        this._process(below, index, true);
      }
    };
    GlobSync.prototype._processSimple = function(prefix, index) {
      var exists = this._stat(prefix);
      if (!this.matches[index])
        this.matches[index] = Object.create(null);
      if (!exists)
        return;
      if (prefix && isAbsolute(prefix) && !this.nomount) {
        var trail = /[\/\\]$/.test(prefix);
        if (prefix.charAt(0) === "/") {
          prefix = path2.join(this.root, prefix);
        } else {
          prefix = path2.resolve(this.root, prefix);
          if (trail)
            prefix += "/";
        }
      }
      if (process.platform === "win32")
        prefix = prefix.replace(/\\/g, "/");
      this._emitMatch(index, prefix);
    };
    GlobSync.prototype._stat = function(f) {
      var abs = this._makeAbs(f);
      var needDir = f.slice(-1) === "/";
      if (f.length > this.maxLength)
        return false;
      if (!this.stat && ownProp(this.cache, abs)) {
        var c = this.cache[abs];
        if (Array.isArray(c))
          c = "DIR";
        if (!needDir || c === "DIR")
          return c;
        if (needDir && c === "FILE")
          return false;
      }
      var exists;
      var stat = this.statCache[abs];
      if (!stat) {
        var lstat;
        try {
          lstat = this.fs.lstatSync(abs);
        } catch (er) {
          if (er && (er.code === "ENOENT" || er.code === "ENOTDIR")) {
            this.statCache[abs] = false;
            return false;
          }
        }
        if (lstat && lstat.isSymbolicLink()) {
          try {
            stat = this.fs.statSync(abs);
          } catch (er) {
            stat = lstat;
          }
        } else {
          stat = lstat;
        }
      }
      this.statCache[abs] = stat;
      var c = true;
      if (stat)
        c = stat.isDirectory() ? "DIR" : "FILE";
      this.cache[abs] = this.cache[abs] || c;
      if (needDir && c === "FILE")
        return false;
      return c;
    };
    GlobSync.prototype._mark = function(p) {
      return common.mark(this, p);
    };
    GlobSync.prototype._makeAbs = function(f) {
      return common.makeAbs(this, f);
    };
  }
});

// node_modules/wrappy/wrappy.js
var require_wrappy = __commonJS({
  "node_modules/wrappy/wrappy.js"(exports2, module2) {
    module2.exports = wrappy;
    function wrappy(fn, cb) {
      if (fn && cb)
        return wrappy(fn)(cb);
      if (typeof fn !== "function")
        throw new TypeError("need wrapper function");
      Object.keys(fn).forEach(function(k) {
        wrapper[k] = fn[k];
      });
      return wrapper;
      function wrapper() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        var ret = fn.apply(this, args);
        var cb2 = args[args.length - 1];
        if (typeof ret === "function" && ret !== cb2) {
          Object.keys(cb2).forEach(function(k) {
            ret[k] = cb2[k];
          });
        }
        return ret;
      }
    }
  }
});

// node_modules/once/once.js
var require_once = __commonJS({
  "node_modules/once/once.js"(exports2, module2) {
    var wrappy = require_wrappy();
    module2.exports = wrappy(once);
    module2.exports.strict = wrappy(onceStrict);
    once.proto = once(function() {
      Object.defineProperty(Function.prototype, "once", {
        value: function() {
          return once(this);
        },
        configurable: true
      });
      Object.defineProperty(Function.prototype, "onceStrict", {
        value: function() {
          return onceStrict(this);
        },
        configurable: true
      });
    });
    function once(fn) {
      var f = function() {
        if (f.called)
          return f.value;
        f.called = true;
        return f.value = fn.apply(this, arguments);
      };
      f.called = false;
      return f;
    }
    function onceStrict(fn) {
      var f = function() {
        if (f.called)
          throw new Error(f.onceError);
        f.called = true;
        return f.value = fn.apply(this, arguments);
      };
      var name = fn.name || "Function wrapped with `once`";
      f.onceError = name + " shouldn't be called more than once";
      f.called = false;
      return f;
    }
  }
});

// node_modules/inflight/inflight.js
var require_inflight = __commonJS({
  "node_modules/inflight/inflight.js"(exports2, module2) {
    var wrappy = require_wrappy();
    var reqs = Object.create(null);
    var once = require_once();
    module2.exports = wrappy(inflight);
    function inflight(key, cb) {
      if (reqs[key]) {
        reqs[key].push(cb);
        return null;
      } else {
        reqs[key] = [cb];
        return makeres(key);
      }
    }
    function makeres(key) {
      return once(function RES() {
        var cbs = reqs[key];
        var len = cbs.length;
        var args = slice(arguments);
        try {
          for (var i = 0; i < len; i++) {
            cbs[i].apply(null, args);
          }
        } finally {
          if (cbs.length > len) {
            cbs.splice(0, len);
            process.nextTick(function() {
              RES.apply(null, args);
            });
          } else {
            delete reqs[key];
          }
        }
      });
    }
    function slice(args) {
      var length = args.length;
      var array = [];
      for (var i = 0; i < length; i++)
        array[i] = args[i];
      return array;
    }
  }
});

// node_modules/glob/glob.js
var require_glob = __commonJS({
  "node_modules/glob/glob.js"(exports2, module2) {
    module2.exports = glob2;
    var rp = require_fs();
    var minimatch = require_minimatch();
    var Minimatch = minimatch.Minimatch;
    var inherits = require_inherits();
    var EE = require("events").EventEmitter;
    var path2 = require("path");
    var assert = require("assert");
    var isAbsolute = require_path_is_absolute();
    var globSync = require_sync();
    var common = require_common();
    var setopts = common.setopts;
    var ownProp = common.ownProp;
    var inflight = require_inflight();
    var util = require("util");
    var childrenIgnored = common.childrenIgnored;
    var isIgnored = common.isIgnored;
    var once = require_once();
    function glob2(pattern, options, cb) {
      if (typeof options === "function")
        cb = options, options = {};
      if (!options)
        options = {};
      if (options.sync) {
        if (cb)
          throw new TypeError("callback provided to sync glob");
        return globSync(pattern, options);
      }
      return new Glob(pattern, options, cb);
    }
    glob2.sync = globSync;
    var GlobSync = glob2.GlobSync = globSync.GlobSync;
    glob2.glob = glob2;
    function extend(origin, add) {
      if (add === null || typeof add !== "object") {
        return origin;
      }
      var keys = Object.keys(add);
      var i = keys.length;
      while (i--) {
        origin[keys[i]] = add[keys[i]];
      }
      return origin;
    }
    glob2.hasMagic = function(pattern, options_) {
      var options = extend({}, options_);
      options.noprocess = true;
      var g = new Glob(pattern, options);
      var set = g.minimatch.set;
      if (!pattern)
        return false;
      if (set.length > 1)
        return true;
      for (var j = 0; j < set[0].length; j++) {
        if (typeof set[0][j] !== "string")
          return true;
      }
      return false;
    };
    glob2.Glob = Glob;
    inherits(Glob, EE);
    function Glob(pattern, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = null;
      }
      if (options && options.sync) {
        if (cb)
          throw new TypeError("callback provided to sync glob");
        return new GlobSync(pattern, options);
      }
      if (!(this instanceof Glob))
        return new Glob(pattern, options, cb);
      setopts(this, pattern, options);
      this._didRealPath = false;
      var n = this.minimatch.set.length;
      this.matches = new Array(n);
      if (typeof cb === "function") {
        cb = once(cb);
        this.on("error", cb);
        this.on("end", function(matches) {
          cb(null, matches);
        });
      }
      var self = this;
      this._processing = 0;
      this._emitQueue = [];
      this._processQueue = [];
      this.paused = false;
      if (this.noprocess)
        return this;
      if (n === 0)
        return done();
      var sync2 = true;
      for (var i = 0; i < n; i++) {
        this._process(this.minimatch.set[i], i, false, done);
      }
      sync2 = false;
      function done() {
        --self._processing;
        if (self._processing <= 0) {
          if (sync2) {
            process.nextTick(function() {
              self._finish();
            });
          } else {
            self._finish();
          }
        }
      }
    }
    Glob.prototype._finish = function() {
      assert(this instanceof Glob);
      if (this.aborted)
        return;
      if (this.realpath && !this._didRealpath)
        return this._realpath();
      common.finish(this);
      this.emit("end", this.found);
    };
    Glob.prototype._realpath = function() {
      if (this._didRealpath)
        return;
      this._didRealpath = true;
      var n = this.matches.length;
      if (n === 0)
        return this._finish();
      var self = this;
      for (var i = 0; i < this.matches.length; i++)
        this._realpathSet(i, next);
      function next() {
        if (--n === 0)
          self._finish();
      }
    };
    Glob.prototype._realpathSet = function(index, cb) {
      var matchset = this.matches[index];
      if (!matchset)
        return cb();
      var found = Object.keys(matchset);
      var self = this;
      var n = found.length;
      if (n === 0)
        return cb();
      var set = this.matches[index] = Object.create(null);
      found.forEach(function(p, i) {
        p = self._makeAbs(p);
        rp.realpath(p, self.realpathCache, function(er, real) {
          if (!er)
            set[real] = true;
          else if (er.syscall === "stat")
            set[p] = true;
          else
            self.emit("error", er);
          if (--n === 0) {
            self.matches[index] = set;
            cb();
          }
        });
      });
    };
    Glob.prototype._mark = function(p) {
      return common.mark(this, p);
    };
    Glob.prototype._makeAbs = function(f) {
      return common.makeAbs(this, f);
    };
    Glob.prototype.abort = function() {
      this.aborted = true;
      this.emit("abort");
    };
    Glob.prototype.pause = function() {
      if (!this.paused) {
        this.paused = true;
        this.emit("pause");
      }
    };
    Glob.prototype.resume = function() {
      if (this.paused) {
        this.emit("resume");
        this.paused = false;
        if (this._emitQueue.length) {
          var eq = this._emitQueue.slice(0);
          this._emitQueue.length = 0;
          for (var i = 0; i < eq.length; i++) {
            var e = eq[i];
            this._emitMatch(e[0], e[1]);
          }
        }
        if (this._processQueue.length) {
          var pq = this._processQueue.slice(0);
          this._processQueue.length = 0;
          for (var i = 0; i < pq.length; i++) {
            var p = pq[i];
            this._processing--;
            this._process(p[0], p[1], p[2], p[3]);
          }
        }
      }
    };
    Glob.prototype._process = function(pattern, index, inGlobStar, cb) {
      assert(this instanceof Glob);
      assert(typeof cb === "function");
      if (this.aborted)
        return;
      this._processing++;
      if (this.paused) {
        this._processQueue.push([pattern, index, inGlobStar, cb]);
        return;
      }
      var n = 0;
      while (typeof pattern[n] === "string") {
        n++;
      }
      var prefix;
      switch (n) {
        case pattern.length:
          this._processSimple(pattern.join("/"), index, cb);
          return;
        case 0:
          prefix = null;
          break;
        default:
          prefix = pattern.slice(0, n).join("/");
          break;
      }
      var remain = pattern.slice(n);
      var read;
      if (prefix === null)
        read = ".";
      else if (isAbsolute(prefix) || isAbsolute(pattern.join("/"))) {
        if (!prefix || !isAbsolute(prefix))
          prefix = "/" + prefix;
        read = prefix;
      } else
        read = prefix;
      var abs = this._makeAbs(read);
      if (childrenIgnored(this, read))
        return cb();
      var isGlobStar = remain[0] === minimatch.GLOBSTAR;
      if (isGlobStar)
        this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb);
      else
        this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb);
    };
    Glob.prototype._processReaddir = function(prefix, read, abs, remain, index, inGlobStar, cb) {
      var self = this;
      this._readdir(abs, inGlobStar, function(er, entries) {
        return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
      });
    };
    Glob.prototype._processReaddir2 = function(prefix, read, abs, remain, index, inGlobStar, entries, cb) {
      if (!entries)
        return cb();
      var pn = remain[0];
      var negate = !!this.minimatch.negate;
      var rawGlob = pn._glob;
      var dotOk = this.dot || rawGlob.charAt(0) === ".";
      var matchedEntries = [];
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.charAt(0) !== "." || dotOk) {
          var m;
          if (negate && !prefix) {
            m = !e.match(pn);
          } else {
            m = e.match(pn);
          }
          if (m)
            matchedEntries.push(e);
        }
      }
      var len = matchedEntries.length;
      if (len === 0)
        return cb();
      if (remain.length === 1 && !this.mark && !this.stat) {
        if (!this.matches[index])
          this.matches[index] = Object.create(null);
        for (var i = 0; i < len; i++) {
          var e = matchedEntries[i];
          if (prefix) {
            if (prefix !== "/")
              e = prefix + "/" + e;
            else
              e = prefix + e;
          }
          if (e.charAt(0) === "/" && !this.nomount) {
            e = path2.join(this.root, e);
          }
          this._emitMatch(index, e);
        }
        return cb();
      }
      remain.shift();
      for (var i = 0; i < len; i++) {
        var e = matchedEntries[i];
        var newPattern;
        if (prefix) {
          if (prefix !== "/")
            e = prefix + "/" + e;
          else
            e = prefix + e;
        }
        this._process([e].concat(remain), index, inGlobStar, cb);
      }
      cb();
    };
    Glob.prototype._emitMatch = function(index, e) {
      if (this.aborted)
        return;
      if (isIgnored(this, e))
        return;
      if (this.paused) {
        this._emitQueue.push([index, e]);
        return;
      }
      var abs = isAbsolute(e) ? e : this._makeAbs(e);
      if (this.mark)
        e = this._mark(e);
      if (this.absolute)
        e = abs;
      if (this.matches[index][e])
        return;
      if (this.nodir) {
        var c = this.cache[abs];
        if (c === "DIR" || Array.isArray(c))
          return;
      }
      this.matches[index][e] = true;
      var st = this.statCache[abs];
      if (st)
        this.emit("stat", e, st);
      this.emit("match", e);
    };
    Glob.prototype._readdirInGlobStar = function(abs, cb) {
      if (this.aborted)
        return;
      if (this.follow)
        return this._readdir(abs, false, cb);
      var lstatkey = "lstat\0" + abs;
      var self = this;
      var lstatcb = inflight(lstatkey, lstatcb_);
      if (lstatcb)
        self.fs.lstat(abs, lstatcb);
      function lstatcb_(er, lstat) {
        if (er && er.code === "ENOENT")
          return cb();
        var isSym = lstat && lstat.isSymbolicLink();
        self.symlinks[abs] = isSym;
        if (!isSym && lstat && !lstat.isDirectory()) {
          self.cache[abs] = "FILE";
          cb();
        } else
          self._readdir(abs, false, cb);
      }
    };
    Glob.prototype._readdir = function(abs, inGlobStar, cb) {
      if (this.aborted)
        return;
      cb = inflight("readdir\0" + abs + "\0" + inGlobStar, cb);
      if (!cb)
        return;
      if (inGlobStar && !ownProp(this.symlinks, abs))
        return this._readdirInGlobStar(abs, cb);
      if (ownProp(this.cache, abs)) {
        var c = this.cache[abs];
        if (!c || c === "FILE")
          return cb();
        if (Array.isArray(c))
          return cb(null, c);
      }
      var self = this;
      self.fs.readdir(abs, readdirCb(this, abs, cb));
    };
    function readdirCb(self, abs, cb) {
      return function(er, entries) {
        if (er)
          self._readdirError(abs, er, cb);
        else
          self._readdirEntries(abs, entries, cb);
      };
    }
    Glob.prototype._readdirEntries = function(abs, entries, cb) {
      if (this.aborted)
        return;
      if (!this.mark && !this.stat) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (abs === "/")
            e = abs + e;
          else
            e = abs + "/" + e;
          this.cache[e] = true;
        }
      }
      this.cache[abs] = entries;
      return cb(null, entries);
    };
    Glob.prototype._readdirError = function(f, er, cb) {
      if (this.aborted)
        return;
      switch (er.code) {
        case "ENOTSUP":
        case "ENOTDIR":
          var abs = this._makeAbs(f);
          this.cache[abs] = "FILE";
          if (abs === this.cwdAbs) {
            var error = new Error(er.code + " invalid cwd " + this.cwd);
            error.path = this.cwd;
            error.code = er.code;
            this.emit("error", error);
            this.abort();
          }
          break;
        case "ENOENT":
        case "ELOOP":
        case "ENAMETOOLONG":
        case "UNKNOWN":
          this.cache[this._makeAbs(f)] = false;
          break;
        default:
          this.cache[this._makeAbs(f)] = false;
          if (this.strict) {
            this.emit("error", er);
            this.abort();
          }
          if (!this.silent)
            console.error("glob error", er);
          break;
      }
      return cb();
    };
    Glob.prototype._processGlobStar = function(prefix, read, abs, remain, index, inGlobStar, cb) {
      var self = this;
      this._readdir(abs, inGlobStar, function(er, entries) {
        self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
      });
    };
    Glob.prototype._processGlobStar2 = function(prefix, read, abs, remain, index, inGlobStar, entries, cb) {
      if (!entries)
        return cb();
      var remainWithoutGlobStar = remain.slice(1);
      var gspref = prefix ? [prefix] : [];
      var noGlobStar = gspref.concat(remainWithoutGlobStar);
      this._process(noGlobStar, index, false, cb);
      var isSym = this.symlinks[abs];
      var len = entries.length;
      if (isSym && inGlobStar)
        return cb();
      for (var i = 0; i < len; i++) {
        var e = entries[i];
        if (e.charAt(0) === "." && !this.dot)
          continue;
        var instead = gspref.concat(entries[i], remainWithoutGlobStar);
        this._process(instead, index, true, cb);
        var below = gspref.concat(entries[i], remain);
        this._process(below, index, true, cb);
      }
      cb();
    };
    Glob.prototype._processSimple = function(prefix, index, cb) {
      var self = this;
      this._stat(prefix, function(er, exists) {
        self._processSimple2(prefix, index, er, exists, cb);
      });
    };
    Glob.prototype._processSimple2 = function(prefix, index, er, exists, cb) {
      if (!this.matches[index])
        this.matches[index] = Object.create(null);
      if (!exists)
        return cb();
      if (prefix && isAbsolute(prefix) && !this.nomount) {
        var trail = /[\/\\]$/.test(prefix);
        if (prefix.charAt(0) === "/") {
          prefix = path2.join(this.root, prefix);
        } else {
          prefix = path2.resolve(this.root, prefix);
          if (trail)
            prefix += "/";
        }
      }
      if (process.platform === "win32")
        prefix = prefix.replace(/\\/g, "/");
      this._emitMatch(index, prefix);
      cb();
    };
    Glob.prototype._stat = function(f, cb) {
      var abs = this._makeAbs(f);
      var needDir = f.slice(-1) === "/";
      if (f.length > this.maxLength)
        return cb();
      if (!this.stat && ownProp(this.cache, abs)) {
        var c = this.cache[abs];
        if (Array.isArray(c))
          c = "DIR";
        if (!needDir || c === "DIR")
          return cb(null, c);
        if (needDir && c === "FILE")
          return cb();
      }
      var exists;
      var stat = this.statCache[abs];
      if (stat !== void 0) {
        if (stat === false)
          return cb(null, stat);
        else {
          var type = stat.isDirectory() ? "DIR" : "FILE";
          if (needDir && type === "FILE")
            return cb();
          else
            return cb(null, type, stat);
        }
      }
      var self = this;
      var statcb = inflight("stat\0" + abs, lstatcb_);
      if (statcb)
        self.fs.lstat(abs, statcb);
      function lstatcb_(er, lstat) {
        if (lstat && lstat.isSymbolicLink()) {
          return self.fs.stat(abs, function(er2, stat2) {
            if (er2)
              self._stat2(f, abs, null, lstat, cb);
            else
              self._stat2(f, abs, er2, stat2, cb);
          });
        } else {
          self._stat2(f, abs, er, lstat, cb);
        }
      }
    };
    Glob.prototype._stat2 = function(f, abs, er, stat, cb) {
      if (er && (er.code === "ENOENT" || er.code === "ENOTDIR")) {
        this.statCache[abs] = false;
        return cb();
      }
      var needDir = f.slice(-1) === "/";
      this.statCache[abs] = stat;
      if (abs.slice(-1) === "/" && stat && !stat.isDirectory())
        return cb(null, false, stat);
      var c = true;
      if (stat)
        c = stat.isDirectory() ? "DIR" : "FILE";
      this.cache[abs] = this.cache[abs] || c;
      if (needDir && c === "FILE")
        return cb();
      return cb(null, c, stat);
    };
  }
});

// node_modules/y18n/build/index.cjs
var require_build = __commonJS({
  "node_modules/y18n/build/index.cjs"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var util = require("util");
    var path2 = require("path");
    var shim;
    var Y18N = class {
      constructor(opts) {
        opts = opts || {};
        this.directory = opts.directory || "./locales";
        this.updateFiles = typeof opts.updateFiles === "boolean" ? opts.updateFiles : true;
        this.locale = opts.locale || "en";
        this.fallbackToLanguage = typeof opts.fallbackToLanguage === "boolean" ? opts.fallbackToLanguage : true;
        this.cache = Object.create(null);
        this.writeQueue = [];
      }
      __(...args) {
        if (typeof arguments[0] !== "string") {
          return this._taggedLiteral(arguments[0], ...arguments);
        }
        const str = args.shift();
        let cb = function() {
        };
        if (typeof args[args.length - 1] === "function")
          cb = args.pop();
        cb = cb || function() {
        };
        if (!this.cache[this.locale])
          this._readLocaleFile();
        if (!this.cache[this.locale][str] && this.updateFiles) {
          this.cache[this.locale][str] = str;
          this._enqueueWrite({
            directory: this.directory,
            locale: this.locale,
            cb
          });
        } else {
          cb();
        }
        return shim.format.apply(shim.format, [this.cache[this.locale][str] || str].concat(args));
      }
      __n() {
        const args = Array.prototype.slice.call(arguments);
        const singular = args.shift();
        const plural = args.shift();
        const quantity = args.shift();
        let cb = function() {
        };
        if (typeof args[args.length - 1] === "function")
          cb = args.pop();
        if (!this.cache[this.locale])
          this._readLocaleFile();
        let str = quantity === 1 ? singular : plural;
        if (this.cache[this.locale][singular]) {
          const entry = this.cache[this.locale][singular];
          str = entry[quantity === 1 ? "one" : "other"];
        }
        if (!this.cache[this.locale][singular] && this.updateFiles) {
          this.cache[this.locale][singular] = {
            one: singular,
            other: plural
          };
          this._enqueueWrite({
            directory: this.directory,
            locale: this.locale,
            cb
          });
        } else {
          cb();
        }
        const values = [str];
        if (~str.indexOf("%d"))
          values.push(quantity);
        return shim.format.apply(shim.format, values.concat(args));
      }
      setLocale(locale) {
        this.locale = locale;
      }
      getLocale() {
        return this.locale;
      }
      updateLocale(obj) {
        if (!this.cache[this.locale])
          this._readLocaleFile();
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            this.cache[this.locale][key] = obj[key];
          }
        }
      }
      _taggedLiteral(parts, ...args) {
        let str = "";
        parts.forEach(function(part, i) {
          const arg = args[i + 1];
          str += part;
          if (typeof arg !== "undefined") {
            str += "%s";
          }
        });
        return this.__.apply(this, [str].concat([].slice.call(args, 1)));
      }
      _enqueueWrite(work) {
        this.writeQueue.push(work);
        if (this.writeQueue.length === 1)
          this._processWriteQueue();
      }
      _processWriteQueue() {
        const _this = this;
        const work = this.writeQueue[0];
        const directory = work.directory;
        const locale = work.locale;
        const cb = work.cb;
        const languageFile = this._resolveLocaleFile(directory, locale);
        const serializedLocale = JSON.stringify(this.cache[locale], null, 2);
        shim.fs.writeFile(languageFile, serializedLocale, "utf-8", function(err) {
          _this.writeQueue.shift();
          if (_this.writeQueue.length > 0)
            _this._processWriteQueue();
          cb(err);
        });
      }
      _readLocaleFile() {
        let localeLookup = {};
        const languageFile = this._resolveLocaleFile(this.directory, this.locale);
        try {
          if (shim.fs.readFileSync) {
            localeLookup = JSON.parse(shim.fs.readFileSync(languageFile, "utf-8"));
          }
        } catch (err) {
          if (err instanceof SyntaxError) {
            err.message = "syntax error in " + languageFile;
          }
          if (err.code === "ENOENT")
            localeLookup = {};
          else
            throw err;
        }
        this.cache[this.locale] = localeLookup;
      }
      _resolveLocaleFile(directory, locale) {
        let file = shim.resolve(directory, "./", locale + ".json");
        if (this.fallbackToLanguage && !this._fileExistsSync(file) && ~locale.lastIndexOf("_")) {
          const languageFile = shim.resolve(directory, "./", locale.split("_")[0] + ".json");
          if (this._fileExistsSync(languageFile))
            file = languageFile;
        }
        return file;
      }
      _fileExistsSync(file) {
        return shim.exists(file);
      }
    };
    function y18n$1(opts, _shim) {
      shim = _shim;
      const y18n2 = new Y18N(opts);
      return {
        __: y18n2.__.bind(y18n2),
        __n: y18n2.__n.bind(y18n2),
        setLocale: y18n2.setLocale.bind(y18n2),
        getLocale: y18n2.getLocale.bind(y18n2),
        updateLocale: y18n2.updateLocale.bind(y18n2),
        locale: y18n2.locale
      };
    }
    var nodePlatformShim = {
      fs: {
        readFileSync: fs2.readFileSync,
        writeFile: fs2.writeFile
      },
      format: util.format,
      resolve: path2.resolve,
      exists: (file) => {
        try {
          return fs2.statSync(file).isFile();
        } catch (err) {
          return false;
        }
      }
    };
    var y18n = (opts) => {
      return y18n$1(opts, nodePlatformShim);
    };
    module2.exports = y18n;
  }
});

// node_modules/yargs-parser/build/index.cjs
var require_build2 = __commonJS({
  "node_modules/yargs-parser/build/index.cjs"(exports2, module2) {
    "use strict";
    var util = require("util");
    var fs2 = require("fs");
    var path2 = require("path");
    function camelCase(str) {
      const isCamelCase = str !== str.toLowerCase() && str !== str.toUpperCase();
      if (!isCamelCase) {
        str = str.toLowerCase();
      }
      if (str.indexOf("-") === -1 && str.indexOf("_") === -1) {
        return str;
      } else {
        let camelcase = "";
        let nextChrUpper = false;
        const leadingHyphens = str.match(/^-+/);
        for (let i = leadingHyphens ? leadingHyphens[0].length : 0; i < str.length; i++) {
          let chr = str.charAt(i);
          if (nextChrUpper) {
            nextChrUpper = false;
            chr = chr.toUpperCase();
          }
          if (i !== 0 && (chr === "-" || chr === "_")) {
            nextChrUpper = true;
          } else if (chr !== "-" && chr !== "_") {
            camelcase += chr;
          }
        }
        return camelcase;
      }
    }
    function decamelize(str, joinString) {
      const lowercase = str.toLowerCase();
      joinString = joinString || "-";
      let notCamelcase = "";
      for (let i = 0; i < str.length; i++) {
        const chrLower = lowercase.charAt(i);
        const chrString = str.charAt(i);
        if (chrLower !== chrString && i > 0) {
          notCamelcase += `${joinString}${lowercase.charAt(i)}`;
        } else {
          notCamelcase += chrString;
        }
      }
      return notCamelcase;
    }
    function looksLikeNumber(x) {
      if (x === null || x === void 0)
        return false;
      if (typeof x === "number")
        return true;
      if (/^0x[0-9a-f]+$/i.test(x))
        return true;
      if (/^0[^.]/.test(x))
        return false;
      return /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
    }
    function tokenizeArgString(argString) {
      if (Array.isArray(argString)) {
        return argString.map((e) => typeof e !== "string" ? e + "" : e);
      }
      argString = argString.trim();
      let i = 0;
      let prevC = null;
      let c = null;
      let opening = null;
      const args = [];
      for (let ii = 0; ii < argString.length; ii++) {
        prevC = c;
        c = argString.charAt(ii);
        if (c === " " && !opening) {
          if (!(prevC === " ")) {
            i++;
          }
          continue;
        }
        if (c === opening) {
          opening = null;
        } else if ((c === "'" || c === '"') && !opening) {
          opening = c;
        }
        if (!args[i])
          args[i] = "";
        args[i] += c;
      }
      return args;
    }
    var DefaultValuesForTypeKey;
    (function(DefaultValuesForTypeKey2) {
      DefaultValuesForTypeKey2["BOOLEAN"] = "boolean";
      DefaultValuesForTypeKey2["STRING"] = "string";
      DefaultValuesForTypeKey2["NUMBER"] = "number";
      DefaultValuesForTypeKey2["ARRAY"] = "array";
    })(DefaultValuesForTypeKey || (DefaultValuesForTypeKey = {}));
    var mixin;
    var YargsParser = class {
      constructor(_mixin) {
        mixin = _mixin;
      }
      parse(argsInput, options) {
        const opts = Object.assign({
          alias: void 0,
          array: void 0,
          boolean: void 0,
          config: void 0,
          configObjects: void 0,
          configuration: void 0,
          coerce: void 0,
          count: void 0,
          default: void 0,
          envPrefix: void 0,
          narg: void 0,
          normalize: void 0,
          string: void 0,
          number: void 0,
          __: void 0,
          key: void 0
        }, options);
        const args = tokenizeArgString(argsInput);
        const aliases = combineAliases(Object.assign(Object.create(null), opts.alias));
        const configuration = Object.assign({
          "boolean-negation": true,
          "camel-case-expansion": true,
          "combine-arrays": false,
          "dot-notation": true,
          "duplicate-arguments-array": true,
          "flatten-duplicate-arrays": true,
          "greedy-arrays": true,
          "halt-at-non-option": false,
          "nargs-eats-options": false,
          "negation-prefix": "no-",
          "parse-numbers": true,
          "parse-positional-numbers": true,
          "populate--": false,
          "set-placeholder-key": false,
          "short-option-groups": true,
          "strip-aliased": false,
          "strip-dashed": false,
          "unknown-options-as-args": false
        }, opts.configuration);
        const defaults = Object.assign(Object.create(null), opts.default);
        const configObjects = opts.configObjects || [];
        const envPrefix = opts.envPrefix;
        const notFlagsOption = configuration["populate--"];
        const notFlagsArgv = notFlagsOption ? "--" : "_";
        const newAliases = Object.create(null);
        const defaulted = Object.create(null);
        const __ = opts.__ || mixin.format;
        const flags = {
          aliases: Object.create(null),
          arrays: Object.create(null),
          bools: Object.create(null),
          strings: Object.create(null),
          numbers: Object.create(null),
          counts: Object.create(null),
          normalize: Object.create(null),
          configs: Object.create(null),
          nargs: Object.create(null),
          coercions: Object.create(null),
          keys: []
        };
        const negative = /^-([0-9]+(\.[0-9]+)?|\.[0-9]+)$/;
        const negatedBoolean = new RegExp("^--" + configuration["negation-prefix"] + "(.+)");
        [].concat(opts.array || []).filter(Boolean).forEach(function(opt) {
          const key = typeof opt === "object" ? opt.key : opt;
          const assignment = Object.keys(opt).map(function(key2) {
            const arrayFlagKeys = {
              boolean: "bools",
              string: "strings",
              number: "numbers"
            };
            return arrayFlagKeys[key2];
          }).filter(Boolean).pop();
          if (assignment) {
            flags[assignment][key] = true;
          }
          flags.arrays[key] = true;
          flags.keys.push(key);
        });
        [].concat(opts.boolean || []).filter(Boolean).forEach(function(key) {
          flags.bools[key] = true;
          flags.keys.push(key);
        });
        [].concat(opts.string || []).filter(Boolean).forEach(function(key) {
          flags.strings[key] = true;
          flags.keys.push(key);
        });
        [].concat(opts.number || []).filter(Boolean).forEach(function(key) {
          flags.numbers[key] = true;
          flags.keys.push(key);
        });
        [].concat(opts.count || []).filter(Boolean).forEach(function(key) {
          flags.counts[key] = true;
          flags.keys.push(key);
        });
        [].concat(opts.normalize || []).filter(Boolean).forEach(function(key) {
          flags.normalize[key] = true;
          flags.keys.push(key);
        });
        if (typeof opts.narg === "object") {
          Object.entries(opts.narg).forEach(([key, value]) => {
            if (typeof value === "number") {
              flags.nargs[key] = value;
              flags.keys.push(key);
            }
          });
        }
        if (typeof opts.coerce === "object") {
          Object.entries(opts.coerce).forEach(([key, value]) => {
            if (typeof value === "function") {
              flags.coercions[key] = value;
              flags.keys.push(key);
            }
          });
        }
        if (typeof opts.config !== "undefined") {
          if (Array.isArray(opts.config) || typeof opts.config === "string") {
            [].concat(opts.config).filter(Boolean).forEach(function(key) {
              flags.configs[key] = true;
            });
          } else if (typeof opts.config === "object") {
            Object.entries(opts.config).forEach(([key, value]) => {
              if (typeof value === "boolean" || typeof value === "function") {
                flags.configs[key] = value;
              }
            });
          }
        }
        extendAliases(opts.key, aliases, opts.default, flags.arrays);
        Object.keys(defaults).forEach(function(key) {
          (flags.aliases[key] || []).forEach(function(alias) {
            defaults[alias] = defaults[key];
          });
        });
        let error = null;
        checkConfiguration();
        let notFlags = [];
        const argv2 = Object.assign(Object.create(null), { _: [] });
        const argvReturn = {};
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          const truncatedArg = arg.replace(/^-{3,}/, "---");
          let broken;
          let key;
          let letters;
          let m;
          let next;
          let value;
          if (arg !== "--" && isUnknownOptionAsArg(arg)) {
            pushPositional(arg);
          } else if (truncatedArg.match(/---+(=|$)/)) {
            pushPositional(arg);
            continue;
          } else if (arg.match(/^--.+=/) || !configuration["short-option-groups"] && arg.match(/^-.+=/)) {
            m = arg.match(/^--?([^=]+)=([\s\S]*)$/);
            if (m !== null && Array.isArray(m) && m.length >= 3) {
              if (checkAllAliases(m[1], flags.arrays)) {
                i = eatArray(i, m[1], args, m[2]);
              } else if (checkAllAliases(m[1], flags.nargs) !== false) {
                i = eatNargs(i, m[1], args, m[2]);
              } else {
                setArg(m[1], m[2]);
              }
            }
          } else if (arg.match(negatedBoolean) && configuration["boolean-negation"]) {
            m = arg.match(negatedBoolean);
            if (m !== null && Array.isArray(m) && m.length >= 2) {
              key = m[1];
              setArg(key, checkAllAliases(key, flags.arrays) ? [false] : false);
            }
          } else if (arg.match(/^--.+/) || !configuration["short-option-groups"] && arg.match(/^-[^-]+/)) {
            m = arg.match(/^--?(.+)/);
            if (m !== null && Array.isArray(m) && m.length >= 2) {
              key = m[1];
              if (checkAllAliases(key, flags.arrays)) {
                i = eatArray(i, key, args);
              } else if (checkAllAliases(key, flags.nargs) !== false) {
                i = eatNargs(i, key, args);
              } else {
                next = args[i + 1];
                if (next !== void 0 && (!next.match(/^-/) || next.match(negative)) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
                  setArg(key, next);
                  i++;
                } else if (/^(true|false)$/.test(next)) {
                  setArg(key, next);
                  i++;
                } else {
                  setArg(key, defaultValue(key));
                }
              }
            }
          } else if (arg.match(/^-.\..+=/)) {
            m = arg.match(/^-([^=]+)=([\s\S]*)$/);
            if (m !== null && Array.isArray(m) && m.length >= 3) {
              setArg(m[1], m[2]);
            }
          } else if (arg.match(/^-.\..+/) && !arg.match(negative)) {
            next = args[i + 1];
            m = arg.match(/^-(.\..+)/);
            if (m !== null && Array.isArray(m) && m.length >= 2) {
              key = m[1];
              if (next !== void 0 && !next.match(/^-/) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
                setArg(key, next);
                i++;
              } else {
                setArg(key, defaultValue(key));
              }
            }
          } else if (arg.match(/^-[^-]+/) && !arg.match(negative)) {
            letters = arg.slice(1, -1).split("");
            broken = false;
            for (let j = 0; j < letters.length; j++) {
              next = arg.slice(j + 2);
              if (letters[j + 1] && letters[j + 1] === "=") {
                value = arg.slice(j + 3);
                key = letters[j];
                if (checkAllAliases(key, flags.arrays)) {
                  i = eatArray(i, key, args, value);
                } else if (checkAllAliases(key, flags.nargs) !== false) {
                  i = eatNargs(i, key, args, value);
                } else {
                  setArg(key, value);
                }
                broken = true;
                break;
              }
              if (next === "-") {
                setArg(letters[j], next);
                continue;
              }
              if (/[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) && checkAllAliases(next, flags.bools) === false) {
                setArg(letters[j], next);
                broken = true;
                break;
              }
              if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                setArg(letters[j], next);
                broken = true;
                break;
              } else {
                setArg(letters[j], defaultValue(letters[j]));
              }
            }
            key = arg.slice(-1)[0];
            if (!broken && key !== "-") {
              if (checkAllAliases(key, flags.arrays)) {
                i = eatArray(i, key, args);
              } else if (checkAllAliases(key, flags.nargs) !== false) {
                i = eatNargs(i, key, args);
              } else {
                next = args[i + 1];
                if (next !== void 0 && (!/^(-|--)[^-]/.test(next) || next.match(negative)) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
                  setArg(key, next);
                  i++;
                } else if (/^(true|false)$/.test(next)) {
                  setArg(key, next);
                  i++;
                } else {
                  setArg(key, defaultValue(key));
                }
              }
            }
          } else if (arg.match(/^-[0-9]$/) && arg.match(negative) && checkAllAliases(arg.slice(1), flags.bools)) {
            key = arg.slice(1);
            setArg(key, defaultValue(key));
          } else if (arg === "--") {
            notFlags = args.slice(i + 1);
            break;
          } else if (configuration["halt-at-non-option"]) {
            notFlags = args.slice(i);
            break;
          } else {
            pushPositional(arg);
          }
        }
        applyEnvVars(argv2, true);
        applyEnvVars(argv2, false);
        setConfig(argv2);
        setConfigObjects();
        applyDefaultsAndAliases(argv2, flags.aliases, defaults, true);
        applyCoercions(argv2);
        if (configuration["set-placeholder-key"])
          setPlaceholderKeys(argv2);
        Object.keys(flags.counts).forEach(function(key) {
          if (!hasKey(argv2, key.split(".")))
            setArg(key, 0);
        });
        if (notFlagsOption && notFlags.length)
          argv2[notFlagsArgv] = [];
        notFlags.forEach(function(key) {
          argv2[notFlagsArgv].push(key);
        });
        if (configuration["camel-case-expansion"] && configuration["strip-dashed"]) {
          Object.keys(argv2).filter((key) => key !== "--" && key.includes("-")).forEach((key) => {
            delete argv2[key];
          });
        }
        if (configuration["strip-aliased"]) {
          [].concat(...Object.keys(aliases).map((k) => aliases[k])).forEach((alias) => {
            if (configuration["camel-case-expansion"] && alias.includes("-")) {
              delete argv2[alias.split(".").map((prop) => camelCase(prop)).join(".")];
            }
            delete argv2[alias];
          });
        }
        function pushPositional(arg) {
          const maybeCoercedNumber = maybeCoerceNumber("_", arg);
          if (typeof maybeCoercedNumber === "string" || typeof maybeCoercedNumber === "number") {
            argv2._.push(maybeCoercedNumber);
          }
        }
        function eatNargs(i, key, args2, argAfterEqualSign) {
          let ii;
          let toEat = checkAllAliases(key, flags.nargs);
          toEat = typeof toEat !== "number" || isNaN(toEat) ? 1 : toEat;
          if (toEat === 0) {
            if (!isUndefined(argAfterEqualSign)) {
              error = Error(__("Argument unexpected for: %s", key));
            }
            setArg(key, defaultValue(key));
            return i;
          }
          let available = isUndefined(argAfterEqualSign) ? 0 : 1;
          if (configuration["nargs-eats-options"]) {
            if (args2.length - (i + 1) + available < toEat) {
              error = Error(__("Not enough arguments following: %s", key));
            }
            available = toEat;
          } else {
            for (ii = i + 1; ii < args2.length; ii++) {
              if (!args2[ii].match(/^-[^0-9]/) || args2[ii].match(negative) || isUnknownOptionAsArg(args2[ii]))
                available++;
              else
                break;
            }
            if (available < toEat)
              error = Error(__("Not enough arguments following: %s", key));
          }
          let consumed = Math.min(available, toEat);
          if (!isUndefined(argAfterEqualSign) && consumed > 0) {
            setArg(key, argAfterEqualSign);
            consumed--;
          }
          for (ii = i + 1; ii < consumed + i + 1; ii++) {
            setArg(key, args2[ii]);
          }
          return i + consumed;
        }
        function eatArray(i, key, args2, argAfterEqualSign) {
          let argsToSet = [];
          let next = argAfterEqualSign || args2[i + 1];
          const nargsCount = checkAllAliases(key, flags.nargs);
          if (checkAllAliases(key, flags.bools) && !/^(true|false)$/.test(next)) {
            argsToSet.push(true);
          } else if (isUndefined(next) || isUndefined(argAfterEqualSign) && /^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next)) {
            if (defaults[key] !== void 0) {
              const defVal = defaults[key];
              argsToSet = Array.isArray(defVal) ? defVal : [defVal];
            }
          } else {
            if (!isUndefined(argAfterEqualSign)) {
              argsToSet.push(processValue(key, argAfterEqualSign));
            }
            for (let ii = i + 1; ii < args2.length; ii++) {
              if (!configuration["greedy-arrays"] && argsToSet.length > 0 || nargsCount && typeof nargsCount === "number" && argsToSet.length >= nargsCount)
                break;
              next = args2[ii];
              if (/^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next))
                break;
              i = ii;
              argsToSet.push(processValue(key, next));
            }
          }
          if (typeof nargsCount === "number" && (nargsCount && argsToSet.length < nargsCount || isNaN(nargsCount) && argsToSet.length === 0)) {
            error = Error(__("Not enough arguments following: %s", key));
          }
          setArg(key, argsToSet);
          return i;
        }
        function setArg(key, val) {
          if (/-/.test(key) && configuration["camel-case-expansion"]) {
            const alias = key.split(".").map(function(prop) {
              return camelCase(prop);
            }).join(".");
            addNewAlias(key, alias);
          }
          const value = processValue(key, val);
          const splitKey = key.split(".");
          setKey(argv2, splitKey, value);
          if (flags.aliases[key]) {
            flags.aliases[key].forEach(function(x) {
              const keyProperties = x.split(".");
              setKey(argv2, keyProperties, value);
            });
          }
          if (splitKey.length > 1 && configuration["dot-notation"]) {
            (flags.aliases[splitKey[0]] || []).forEach(function(x) {
              let keyProperties = x.split(".");
              const a = [].concat(splitKey);
              a.shift();
              keyProperties = keyProperties.concat(a);
              if (!(flags.aliases[key] || []).includes(keyProperties.join("."))) {
                setKey(argv2, keyProperties, value);
              }
            });
          }
          if (checkAllAliases(key, flags.normalize) && !checkAllAliases(key, flags.arrays)) {
            const keys = [key].concat(flags.aliases[key] || []);
            keys.forEach(function(key2) {
              Object.defineProperty(argvReturn, key2, {
                enumerable: true,
                get() {
                  return val;
                },
                set(value2) {
                  val = typeof value2 === "string" ? mixin.normalize(value2) : value2;
                }
              });
            });
          }
        }
        function addNewAlias(key, alias) {
          if (!(flags.aliases[key] && flags.aliases[key].length)) {
            flags.aliases[key] = [alias];
            newAliases[alias] = true;
          }
          if (!(flags.aliases[alias] && flags.aliases[alias].length)) {
            addNewAlias(alias, key);
          }
        }
        function processValue(key, val) {
          if (typeof val === "string" && (val[0] === "'" || val[0] === '"') && val[val.length - 1] === val[0]) {
            val = val.substring(1, val.length - 1);
          }
          if (checkAllAliases(key, flags.bools) || checkAllAliases(key, flags.counts)) {
            if (typeof val === "string")
              val = val === "true";
          }
          let value = Array.isArray(val) ? val.map(function(v) {
            return maybeCoerceNumber(key, v);
          }) : maybeCoerceNumber(key, val);
          if (checkAllAliases(key, flags.counts) && (isUndefined(value) || typeof value === "boolean")) {
            value = increment();
          }
          if (checkAllAliases(key, flags.normalize) && checkAllAliases(key, flags.arrays)) {
            if (Array.isArray(val))
              value = val.map((val2) => {
                return mixin.normalize(val2);
              });
            else
              value = mixin.normalize(val);
          }
          return value;
        }
        function maybeCoerceNumber(key, value) {
          if (!configuration["parse-positional-numbers"] && key === "_")
            return value;
          if (!checkAllAliases(key, flags.strings) && !checkAllAliases(key, flags.bools) && !Array.isArray(value)) {
            const shouldCoerceNumber = looksLikeNumber(value) && configuration["parse-numbers"] && Number.isSafeInteger(Math.floor(parseFloat(`${value}`)));
            if (shouldCoerceNumber || !isUndefined(value) && checkAllAliases(key, flags.numbers)) {
              value = Number(value);
            }
          }
          return value;
        }
        function setConfig(argv3) {
          const configLookup = Object.create(null);
          applyDefaultsAndAliases(configLookup, flags.aliases, defaults);
          Object.keys(flags.configs).forEach(function(configKey) {
            const configPath = argv3[configKey] || configLookup[configKey];
            if (configPath) {
              try {
                let config = null;
                const resolvedConfigPath = mixin.resolve(mixin.cwd(), configPath);
                const resolveConfig = flags.configs[configKey];
                if (typeof resolveConfig === "function") {
                  try {
                    config = resolveConfig(resolvedConfigPath);
                  } catch (e) {
                    config = e;
                  }
                  if (config instanceof Error) {
                    error = config;
                    return;
                  }
                } else {
                  config = mixin.require(resolvedConfigPath);
                }
                setConfigObject(config);
              } catch (ex) {
                if (ex.name === "PermissionDenied")
                  error = ex;
                else if (argv3[configKey])
                  error = Error(__("Invalid JSON config file: %s", configPath));
              }
            }
          });
        }
        function setConfigObject(config, prev) {
          Object.keys(config).forEach(function(key) {
            const value = config[key];
            const fullKey = prev ? prev + "." + key : key;
            if (typeof value === "object" && value !== null && !Array.isArray(value) && configuration["dot-notation"]) {
              setConfigObject(value, fullKey);
            } else {
              if (!hasKey(argv2, fullKey.split(".")) || checkAllAliases(fullKey, flags.arrays) && configuration["combine-arrays"]) {
                setArg(fullKey, value);
              }
            }
          });
        }
        function setConfigObjects() {
          if (typeof configObjects !== "undefined") {
            configObjects.forEach(function(configObject) {
              setConfigObject(configObject);
            });
          }
        }
        function applyEnvVars(argv3, configOnly) {
          if (typeof envPrefix === "undefined")
            return;
          const prefix = typeof envPrefix === "string" ? envPrefix : "";
          const env2 = mixin.env();
          Object.keys(env2).forEach(function(envVar) {
            if (prefix === "" || envVar.lastIndexOf(prefix, 0) === 0) {
              const keys = envVar.split("__").map(function(key, i) {
                if (i === 0) {
                  key = key.substring(prefix.length);
                }
                return camelCase(key);
              });
              if ((configOnly && flags.configs[keys.join(".")] || !configOnly) && !hasKey(argv3, keys)) {
                setArg(keys.join("."), env2[envVar]);
              }
            }
          });
        }
        function applyCoercions(argv3) {
          let coerce;
          const applied = new Set();
          Object.keys(argv3).forEach(function(key) {
            if (!applied.has(key)) {
              coerce = checkAllAliases(key, flags.coercions);
              if (typeof coerce === "function") {
                try {
                  const value = maybeCoerceNumber(key, coerce(argv3[key]));
                  [].concat(flags.aliases[key] || [], key).forEach((ali) => {
                    applied.add(ali);
                    argv3[ali] = value;
                  });
                } catch (err) {
                  error = err;
                }
              }
            }
          });
        }
        function setPlaceholderKeys(argv3) {
          flags.keys.forEach((key) => {
            if (~key.indexOf("."))
              return;
            if (typeof argv3[key] === "undefined")
              argv3[key] = void 0;
          });
          return argv3;
        }
        function applyDefaultsAndAliases(obj, aliases2, defaults2, canLog = false) {
          Object.keys(defaults2).forEach(function(key) {
            if (!hasKey(obj, key.split("."))) {
              setKey(obj, key.split("."), defaults2[key]);
              if (canLog)
                defaulted[key] = true;
              (aliases2[key] || []).forEach(function(x) {
                if (hasKey(obj, x.split(".")))
                  return;
                setKey(obj, x.split("."), defaults2[key]);
              });
            }
          });
        }
        function hasKey(obj, keys) {
          let o = obj;
          if (!configuration["dot-notation"])
            keys = [keys.join(".")];
          keys.slice(0, -1).forEach(function(key2) {
            o = o[key2] || {};
          });
          const key = keys[keys.length - 1];
          if (typeof o !== "object")
            return false;
          else
            return key in o;
        }
        function setKey(obj, keys, value) {
          let o = obj;
          if (!configuration["dot-notation"])
            keys = [keys.join(".")];
          keys.slice(0, -1).forEach(function(key2) {
            key2 = sanitizeKey(key2);
            if (typeof o === "object" && o[key2] === void 0) {
              o[key2] = {};
            }
            if (typeof o[key2] !== "object" || Array.isArray(o[key2])) {
              if (Array.isArray(o[key2])) {
                o[key2].push({});
              } else {
                o[key2] = [o[key2], {}];
              }
              o = o[key2][o[key2].length - 1];
            } else {
              o = o[key2];
            }
          });
          const key = sanitizeKey(keys[keys.length - 1]);
          const isTypeArray = checkAllAliases(keys.join("."), flags.arrays);
          const isValueArray = Array.isArray(value);
          let duplicate = configuration["duplicate-arguments-array"];
          if (!duplicate && checkAllAliases(key, flags.nargs)) {
            duplicate = true;
            if (!isUndefined(o[key]) && flags.nargs[key] === 1 || Array.isArray(o[key]) && o[key].length === flags.nargs[key]) {
              o[key] = void 0;
            }
          }
          if (value === increment()) {
            o[key] = increment(o[key]);
          } else if (Array.isArray(o[key])) {
            if (duplicate && isTypeArray && isValueArray) {
              o[key] = configuration["flatten-duplicate-arrays"] ? o[key].concat(value) : (Array.isArray(o[key][0]) ? o[key] : [o[key]]).concat([value]);
            } else if (!duplicate && Boolean(isTypeArray) === Boolean(isValueArray)) {
              o[key] = value;
            } else {
              o[key] = o[key].concat([value]);
            }
          } else if (o[key] === void 0 && isTypeArray) {
            o[key] = isValueArray ? value : [value];
          } else if (duplicate && !(o[key] === void 0 || checkAllAliases(key, flags.counts) || checkAllAliases(key, flags.bools))) {
            o[key] = [o[key], value];
          } else {
            o[key] = value;
          }
        }
        function extendAliases(...args2) {
          args2.forEach(function(obj) {
            Object.keys(obj || {}).forEach(function(key) {
              if (flags.aliases[key])
                return;
              flags.aliases[key] = [].concat(aliases[key] || []);
              flags.aliases[key].concat(key).forEach(function(x) {
                if (/-/.test(x) && configuration["camel-case-expansion"]) {
                  const c = camelCase(x);
                  if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                    flags.aliases[key].push(c);
                    newAliases[c] = true;
                  }
                }
              });
              flags.aliases[key].concat(key).forEach(function(x) {
                if (x.length > 1 && /[A-Z]/.test(x) && configuration["camel-case-expansion"]) {
                  const c = decamelize(x, "-");
                  if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                    flags.aliases[key].push(c);
                    newAliases[c] = true;
                  }
                }
              });
              flags.aliases[key].forEach(function(x) {
                flags.aliases[x] = [key].concat(flags.aliases[key].filter(function(y) {
                  return x !== y;
                }));
              });
            });
          });
        }
        function checkAllAliases(key, flag) {
          const toCheck = [].concat(flags.aliases[key] || [], key);
          const keys = Object.keys(flag);
          const setAlias = toCheck.find((key2) => keys.includes(key2));
          return setAlias ? flag[setAlias] : false;
        }
        function hasAnyFlag(key) {
          const flagsKeys = Object.keys(flags);
          const toCheck = [].concat(flagsKeys.map((k) => flags[k]));
          return toCheck.some(function(flag) {
            return Array.isArray(flag) ? flag.includes(key) : flag[key];
          });
        }
        function hasFlagsMatching(arg, ...patterns) {
          const toCheck = [].concat(...patterns);
          return toCheck.some(function(pattern) {
            const match = arg.match(pattern);
            return match && hasAnyFlag(match[1]);
          });
        }
        function hasAllShortFlags(arg) {
          if (arg.match(negative) || !arg.match(/^-[^-]+/)) {
            return false;
          }
          let hasAllFlags = true;
          let next;
          const letters = arg.slice(1).split("");
          for (let j = 0; j < letters.length; j++) {
            next = arg.slice(j + 2);
            if (!hasAnyFlag(letters[j])) {
              hasAllFlags = false;
              break;
            }
            if (letters[j + 1] && letters[j + 1] === "=" || next === "-" || /[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) || letters[j + 1] && letters[j + 1].match(/\W/)) {
              break;
            }
          }
          return hasAllFlags;
        }
        function isUnknownOptionAsArg(arg) {
          return configuration["unknown-options-as-args"] && isUnknownOption(arg);
        }
        function isUnknownOption(arg) {
          arg = arg.replace(/^-{3,}/, "--");
          if (arg.match(negative)) {
            return false;
          }
          if (hasAllShortFlags(arg)) {
            return false;
          }
          const flagWithEquals = /^-+([^=]+?)=[\s\S]*$/;
          const normalFlag = /^-+([^=]+?)$/;
          const flagEndingInHyphen = /^-+([^=]+?)-$/;
          const flagEndingInDigits = /^-+([^=]+?\d+)$/;
          const flagEndingInNonWordCharacters = /^-+([^=]+?)\W+.*$/;
          return !hasFlagsMatching(arg, flagWithEquals, negatedBoolean, normalFlag, flagEndingInHyphen, flagEndingInDigits, flagEndingInNonWordCharacters);
        }
        function defaultValue(key) {
          if (!checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts) && `${key}` in defaults) {
            return defaults[key];
          } else {
            return defaultForType(guessType(key));
          }
        }
        function defaultForType(type) {
          const def = {
            [DefaultValuesForTypeKey.BOOLEAN]: true,
            [DefaultValuesForTypeKey.STRING]: "",
            [DefaultValuesForTypeKey.NUMBER]: void 0,
            [DefaultValuesForTypeKey.ARRAY]: []
          };
          return def[type];
        }
        function guessType(key) {
          let type = DefaultValuesForTypeKey.BOOLEAN;
          if (checkAllAliases(key, flags.strings))
            type = DefaultValuesForTypeKey.STRING;
          else if (checkAllAliases(key, flags.numbers))
            type = DefaultValuesForTypeKey.NUMBER;
          else if (checkAllAliases(key, flags.bools))
            type = DefaultValuesForTypeKey.BOOLEAN;
          else if (checkAllAliases(key, flags.arrays))
            type = DefaultValuesForTypeKey.ARRAY;
          return type;
        }
        function isUndefined(num) {
          return num === void 0;
        }
        function checkConfiguration() {
          Object.keys(flags.counts).find((key) => {
            if (checkAllAliases(key, flags.arrays)) {
              error = Error(__("Invalid configuration: %s, opts.count excludes opts.array.", key));
              return true;
            } else if (checkAllAliases(key, flags.nargs)) {
              error = Error(__("Invalid configuration: %s, opts.count excludes opts.narg.", key));
              return true;
            }
            return false;
          });
        }
        return {
          aliases: Object.assign({}, flags.aliases),
          argv: Object.assign(argvReturn, argv2),
          configuration,
          defaulted: Object.assign({}, defaulted),
          error,
          newAliases: Object.assign({}, newAliases)
        };
      }
    };
    function combineAliases(aliases) {
      const aliasArrays = [];
      const combined = Object.create(null);
      let change = true;
      Object.keys(aliases).forEach(function(key) {
        aliasArrays.push([].concat(aliases[key], key));
      });
      while (change) {
        change = false;
        for (let i = 0; i < aliasArrays.length; i++) {
          for (let ii = i + 1; ii < aliasArrays.length; ii++) {
            const intersect = aliasArrays[i].filter(function(v) {
              return aliasArrays[ii].indexOf(v) !== -1;
            });
            if (intersect.length) {
              aliasArrays[i] = aliasArrays[i].concat(aliasArrays[ii]);
              aliasArrays.splice(ii, 1);
              change = true;
              break;
            }
          }
        }
      }
      aliasArrays.forEach(function(aliasArray) {
        aliasArray = aliasArray.filter(function(v, i, self) {
          return self.indexOf(v) === i;
        });
        const lastAlias = aliasArray.pop();
        if (lastAlias !== void 0 && typeof lastAlias === "string") {
          combined[lastAlias] = aliasArray;
        }
      });
      return combined;
    }
    function increment(orig) {
      return orig !== void 0 ? orig + 1 : 1;
    }
    function sanitizeKey(key) {
      if (key === "__proto__")
        return "___proto___";
      return key;
    }
    var minNodeVersion = process && process.env && process.env.YARGS_MIN_NODE_VERSION ? Number(process.env.YARGS_MIN_NODE_VERSION) : 10;
    if (process && process.version) {
      const major = Number(process.version.match(/v([^.]+)/)[1]);
      if (major < minNodeVersion) {
        throw Error(`yargs parser supports a minimum Node.js version of ${minNodeVersion}. Read our version support policy: https://github.com/yargs/yargs-parser#supported-nodejs-versions`);
      }
    }
    var env = process ? process.env : {};
    var parser = new YargsParser({
      cwd: process.cwd,
      env: () => {
        return env;
      },
      format: util.format,
      normalize: path2.normalize,
      resolve: path2.resolve,
      require: (path3) => {
        if (typeof require !== "undefined") {
          return require(path3);
        } else if (path3.match(/\.json$/)) {
          return fs2.readFileSync(path3, "utf8");
        } else {
          throw Error("only .json config files are supported in ESM");
        }
      }
    });
    var yargsParser = function Parser(args, opts) {
      const result = parser.parse(args.slice(), opts);
      return result.argv;
    };
    yargsParser.detailed = function(args, opts) {
      return parser.parse(args.slice(), opts);
    };
    yargsParser.camelCase = camelCase;
    yargsParser.decamelize = decamelize;
    yargsParser.looksLikeNumber = looksLikeNumber;
    module2.exports = yargsParser;
  }
});

// node_modules/ansi-regex/index.js
var require_ansi_regex = __commonJS({
  "node_modules/ansi-regex/index.js"(exports2, module2) {
    "use strict";
    module2.exports = ({ onlyFirst = false } = {}) => {
      const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
      ].join("|");
      return new RegExp(pattern, onlyFirst ? void 0 : "g");
    };
  }
});

// node_modules/strip-ansi/index.js
var require_strip_ansi = __commonJS({
  "node_modules/strip-ansi/index.js"(exports2, module2) {
    "use strict";
    var ansiRegex = require_ansi_regex();
    module2.exports = (string) => typeof string === "string" ? string.replace(ansiRegex(), "") : string;
  }
});

// node_modules/is-fullwidth-code-point/index.js
var require_is_fullwidth_code_point = __commonJS({
  "node_modules/is-fullwidth-code-point/index.js"(exports2, module2) {
    "use strict";
    var isFullwidthCodePoint = (codePoint) => {
      if (Number.isNaN(codePoint)) {
        return false;
      }
      if (codePoint >= 4352 && (codePoint <= 4447 || codePoint === 9001 || codePoint === 9002 || 11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || 12880 <= codePoint && codePoint <= 19903 || 19968 <= codePoint && codePoint <= 42182 || 43360 <= codePoint && codePoint <= 43388 || 44032 <= codePoint && codePoint <= 55203 || 63744 <= codePoint && codePoint <= 64255 || 65040 <= codePoint && codePoint <= 65049 || 65072 <= codePoint && codePoint <= 65131 || 65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || 110592 <= codePoint && codePoint <= 110593 || 127488 <= codePoint && codePoint <= 127569 || 131072 <= codePoint && codePoint <= 262141)) {
        return true;
      }
      return false;
    };
    module2.exports = isFullwidthCodePoint;
    module2.exports.default = isFullwidthCodePoint;
  }
});

// node_modules/emoji-regex/index.js
var require_emoji_regex = __commonJS({
  "node_modules/emoji-regex/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function() {
      return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
    };
  }
});

// node_modules/string-width/index.js
var require_string_width = __commonJS({
  "node_modules/string-width/index.js"(exports2, module2) {
    "use strict";
    var stripAnsi = require_strip_ansi();
    var isFullwidthCodePoint = require_is_fullwidth_code_point();
    var emojiRegex = require_emoji_regex();
    var stringWidth = (string) => {
      if (typeof string !== "string" || string.length === 0) {
        return 0;
      }
      string = stripAnsi(string);
      if (string.length === 0) {
        return 0;
      }
      string = string.replace(emojiRegex(), "  ");
      let width = 0;
      for (let i = 0; i < string.length; i++) {
        const code = string.codePointAt(i);
        if (code <= 31 || code >= 127 && code <= 159) {
          continue;
        }
        if (code >= 768 && code <= 879) {
          continue;
        }
        if (code > 65535) {
          i++;
        }
        width += isFullwidthCodePoint(code) ? 2 : 1;
      }
      return width;
    };
    module2.exports = stringWidth;
    module2.exports.default = stringWidth;
  }
});

// node_modules/color-name/index.js
var require_color_name = __commonJS({
  "node_modules/color-name/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      "aliceblue": [240, 248, 255],
      "antiquewhite": [250, 235, 215],
      "aqua": [0, 255, 255],
      "aquamarine": [127, 255, 212],
      "azure": [240, 255, 255],
      "beige": [245, 245, 220],
      "bisque": [255, 228, 196],
      "black": [0, 0, 0],
      "blanchedalmond": [255, 235, 205],
      "blue": [0, 0, 255],
      "blueviolet": [138, 43, 226],
      "brown": [165, 42, 42],
      "burlywood": [222, 184, 135],
      "cadetblue": [95, 158, 160],
      "chartreuse": [127, 255, 0],
      "chocolate": [210, 105, 30],
      "coral": [255, 127, 80],
      "cornflowerblue": [100, 149, 237],
      "cornsilk": [255, 248, 220],
      "crimson": [220, 20, 60],
      "cyan": [0, 255, 255],
      "darkblue": [0, 0, 139],
      "darkcyan": [0, 139, 139],
      "darkgoldenrod": [184, 134, 11],
      "darkgray": [169, 169, 169],
      "darkgreen": [0, 100, 0],
      "darkgrey": [169, 169, 169],
      "darkkhaki": [189, 183, 107],
      "darkmagenta": [139, 0, 139],
      "darkolivegreen": [85, 107, 47],
      "darkorange": [255, 140, 0],
      "darkorchid": [153, 50, 204],
      "darkred": [139, 0, 0],
      "darksalmon": [233, 150, 122],
      "darkseagreen": [143, 188, 143],
      "darkslateblue": [72, 61, 139],
      "darkslategray": [47, 79, 79],
      "darkslategrey": [47, 79, 79],
      "darkturquoise": [0, 206, 209],
      "darkviolet": [148, 0, 211],
      "deeppink": [255, 20, 147],
      "deepskyblue": [0, 191, 255],
      "dimgray": [105, 105, 105],
      "dimgrey": [105, 105, 105],
      "dodgerblue": [30, 144, 255],
      "firebrick": [178, 34, 34],
      "floralwhite": [255, 250, 240],
      "forestgreen": [34, 139, 34],
      "fuchsia": [255, 0, 255],
      "gainsboro": [220, 220, 220],
      "ghostwhite": [248, 248, 255],
      "gold": [255, 215, 0],
      "goldenrod": [218, 165, 32],
      "gray": [128, 128, 128],
      "green": [0, 128, 0],
      "greenyellow": [173, 255, 47],
      "grey": [128, 128, 128],
      "honeydew": [240, 255, 240],
      "hotpink": [255, 105, 180],
      "indianred": [205, 92, 92],
      "indigo": [75, 0, 130],
      "ivory": [255, 255, 240],
      "khaki": [240, 230, 140],
      "lavender": [230, 230, 250],
      "lavenderblush": [255, 240, 245],
      "lawngreen": [124, 252, 0],
      "lemonchiffon": [255, 250, 205],
      "lightblue": [173, 216, 230],
      "lightcoral": [240, 128, 128],
      "lightcyan": [224, 255, 255],
      "lightgoldenrodyellow": [250, 250, 210],
      "lightgray": [211, 211, 211],
      "lightgreen": [144, 238, 144],
      "lightgrey": [211, 211, 211],
      "lightpink": [255, 182, 193],
      "lightsalmon": [255, 160, 122],
      "lightseagreen": [32, 178, 170],
      "lightskyblue": [135, 206, 250],
      "lightslategray": [119, 136, 153],
      "lightslategrey": [119, 136, 153],
      "lightsteelblue": [176, 196, 222],
      "lightyellow": [255, 255, 224],
      "lime": [0, 255, 0],
      "limegreen": [50, 205, 50],
      "linen": [250, 240, 230],
      "magenta": [255, 0, 255],
      "maroon": [128, 0, 0],
      "mediumaquamarine": [102, 205, 170],
      "mediumblue": [0, 0, 205],
      "mediumorchid": [186, 85, 211],
      "mediumpurple": [147, 112, 219],
      "mediumseagreen": [60, 179, 113],
      "mediumslateblue": [123, 104, 238],
      "mediumspringgreen": [0, 250, 154],
      "mediumturquoise": [72, 209, 204],
      "mediumvioletred": [199, 21, 133],
      "midnightblue": [25, 25, 112],
      "mintcream": [245, 255, 250],
      "mistyrose": [255, 228, 225],
      "moccasin": [255, 228, 181],
      "navajowhite": [255, 222, 173],
      "navy": [0, 0, 128],
      "oldlace": [253, 245, 230],
      "olive": [128, 128, 0],
      "olivedrab": [107, 142, 35],
      "orange": [255, 165, 0],
      "orangered": [255, 69, 0],
      "orchid": [218, 112, 214],
      "palegoldenrod": [238, 232, 170],
      "palegreen": [152, 251, 152],
      "paleturquoise": [175, 238, 238],
      "palevioletred": [219, 112, 147],
      "papayawhip": [255, 239, 213],
      "peachpuff": [255, 218, 185],
      "peru": [205, 133, 63],
      "pink": [255, 192, 203],
      "plum": [221, 160, 221],
      "powderblue": [176, 224, 230],
      "purple": [128, 0, 128],
      "rebeccapurple": [102, 51, 153],
      "red": [255, 0, 0],
      "rosybrown": [188, 143, 143],
      "royalblue": [65, 105, 225],
      "saddlebrown": [139, 69, 19],
      "salmon": [250, 128, 114],
      "sandybrown": [244, 164, 96],
      "seagreen": [46, 139, 87],
      "seashell": [255, 245, 238],
      "sienna": [160, 82, 45],
      "silver": [192, 192, 192],
      "skyblue": [135, 206, 235],
      "slateblue": [106, 90, 205],
      "slategray": [112, 128, 144],
      "slategrey": [112, 128, 144],
      "snow": [255, 250, 250],
      "springgreen": [0, 255, 127],
      "steelblue": [70, 130, 180],
      "tan": [210, 180, 140],
      "teal": [0, 128, 128],
      "thistle": [216, 191, 216],
      "tomato": [255, 99, 71],
      "turquoise": [64, 224, 208],
      "violet": [238, 130, 238],
      "wheat": [245, 222, 179],
      "white": [255, 255, 255],
      "whitesmoke": [245, 245, 245],
      "yellow": [255, 255, 0],
      "yellowgreen": [154, 205, 50]
    };
  }
});

// node_modules/color-convert/conversions.js
var require_conversions = __commonJS({
  "node_modules/color-convert/conversions.js"(exports2, module2) {
    var cssKeywords = require_color_name();
    var reverseKeywords = {};
    for (const key of Object.keys(cssKeywords)) {
      reverseKeywords[cssKeywords[key]] = key;
    }
    var convert = {
      rgb: { channels: 3, labels: "rgb" },
      hsl: { channels: 3, labels: "hsl" },
      hsv: { channels: 3, labels: "hsv" },
      hwb: { channels: 3, labels: "hwb" },
      cmyk: { channels: 4, labels: "cmyk" },
      xyz: { channels: 3, labels: "xyz" },
      lab: { channels: 3, labels: "lab" },
      lch: { channels: 3, labels: "lch" },
      hex: { channels: 1, labels: ["hex"] },
      keyword: { channels: 1, labels: ["keyword"] },
      ansi16: { channels: 1, labels: ["ansi16"] },
      ansi256: { channels: 1, labels: ["ansi256"] },
      hcg: { channels: 3, labels: ["h", "c", "g"] },
      apple: { channels: 3, labels: ["r16", "g16", "b16"] },
      gray: { channels: 1, labels: ["gray"] }
    };
    module2.exports = convert;
    for (const model of Object.keys(convert)) {
      if (!("channels" in convert[model])) {
        throw new Error("missing channels property: " + model);
      }
      if (!("labels" in convert[model])) {
        throw new Error("missing channel labels property: " + model);
      }
      if (convert[model].labels.length !== convert[model].channels) {
        throw new Error("channel and label counts mismatch: " + model);
      }
      const { channels, labels } = convert[model];
      delete convert[model].channels;
      delete convert[model].labels;
      Object.defineProperty(convert[model], "channels", { value: channels });
      Object.defineProperty(convert[model], "labels", { value: labels });
    }
    convert.rgb.hsl = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const delta = max - min;
      let h;
      let s;
      if (max === min) {
        h = 0;
      } else if (r === max) {
        h = (g - b) / delta;
      } else if (g === max) {
        h = 2 + (b - r) / delta;
      } else if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h = Math.min(h * 60, 360);
      if (h < 0) {
        h += 360;
      }
      const l = (min + max) / 2;
      if (max === min) {
        s = 0;
      } else if (l <= 0.5) {
        s = delta / (max + min);
      } else {
        s = delta / (2 - max - min);
      }
      return [h, s * 100, l * 100];
    };
    convert.rgb.hsv = function(rgb) {
      let rdif;
      let gdif;
      let bdif;
      let h;
      let s;
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const v = Math.max(r, g, b);
      const diff = v - Math.min(r, g, b);
      const diffc = function(c) {
        return (v - c) / 6 / diff + 1 / 2;
      };
      if (diff === 0) {
        h = 0;
        s = 0;
      } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);
        if (r === v) {
          h = bdif - gdif;
        } else if (g === v) {
          h = 1 / 3 + rdif - bdif;
        } else if (b === v) {
          h = 2 / 3 + gdif - rdif;
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }
      return [
        h * 360,
        s * 100,
        v * 100
      ];
    };
    convert.rgb.hwb = function(rgb) {
      const r = rgb[0];
      const g = rgb[1];
      let b = rgb[2];
      const h = convert.rgb.hsl(rgb)[0];
      const w = 1 / 255 * Math.min(r, Math.min(g, b));
      b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
      return [h, w * 100, b * 100];
    };
    convert.rgb.cmyk = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const k = Math.min(1 - r, 1 - g, 1 - b);
      const c = (1 - r - k) / (1 - k) || 0;
      const m = (1 - g - k) / (1 - k) || 0;
      const y = (1 - b - k) / (1 - k) || 0;
      return [c * 100, m * 100, y * 100, k * 100];
    };
    function comparativeDistance(x, y) {
      return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
    }
    convert.rgb.keyword = function(rgb) {
      const reversed = reverseKeywords[rgb];
      if (reversed) {
        return reversed;
      }
      let currentClosestDistance = Infinity;
      let currentClosestKeyword;
      for (const keyword of Object.keys(cssKeywords)) {
        const value = cssKeywords[keyword];
        const distance = comparativeDistance(rgb, value);
        if (distance < currentClosestDistance) {
          currentClosestDistance = distance;
          currentClosestKeyword = keyword;
        }
      }
      return currentClosestKeyword;
    };
    convert.keyword.rgb = function(keyword) {
      return cssKeywords[keyword];
    };
    convert.rgb.xyz = function(rgb) {
      let r = rgb[0] / 255;
      let g = rgb[1] / 255;
      let b = rgb[2] / 255;
      r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
      g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
      b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
      const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
      const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
      return [x * 100, y * 100, z * 100];
    };
    convert.rgb.lab = function(rgb) {
      const xyz = convert.rgb.xyz(rgb);
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.hsl.rgb = function(hsl) {
      const h = hsl[0] / 360;
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      let t2;
      let t3;
      let val;
      if (s === 0) {
        val = l * 255;
        return [val, val, val];
      }
      if (l < 0.5) {
        t2 = l * (1 + s);
      } else {
        t2 = l + s - l * s;
      }
      const t1 = 2 * l - t2;
      const rgb = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
          t3++;
        }
        if (t3 > 1) {
          t3--;
        }
        if (6 * t3 < 1) {
          val = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          val = t2;
        } else if (3 * t3 < 2) {
          val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          val = t1;
        }
        rgb[i] = val * 255;
      }
      return rgb;
    };
    convert.hsl.hsv = function(hsl) {
      const h = hsl[0];
      let s = hsl[1] / 100;
      let l = hsl[2] / 100;
      let smin = s;
      const lmin = Math.max(l, 0.01);
      l *= 2;
      s *= l <= 1 ? l : 2 - l;
      smin *= lmin <= 1 ? lmin : 2 - lmin;
      const v = (l + s) / 2;
      const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
      return [h, sv * 100, v * 100];
    };
    convert.hsv.rgb = function(hsv) {
      const h = hsv[0] / 60;
      const s = hsv[1] / 100;
      let v = hsv[2] / 100;
      const hi = Math.floor(h) % 6;
      const f = h - Math.floor(h);
      const p = 255 * v * (1 - s);
      const q = 255 * v * (1 - s * f);
      const t = 255 * v * (1 - s * (1 - f));
      v *= 255;
      switch (hi) {
        case 0:
          return [v, t, p];
        case 1:
          return [q, v, p];
        case 2:
          return [p, v, t];
        case 3:
          return [p, q, v];
        case 4:
          return [t, p, v];
        case 5:
          return [v, p, q];
      }
    };
    convert.hsv.hsl = function(hsv) {
      const h = hsv[0];
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const vmin = Math.max(v, 0.01);
      let sl;
      let l;
      l = (2 - s) * v;
      const lmin = (2 - s) * vmin;
      sl = s * vmin;
      sl /= lmin <= 1 ? lmin : 2 - lmin;
      sl = sl || 0;
      l /= 2;
      return [h, sl * 100, l * 100];
    };
    convert.hwb.rgb = function(hwb) {
      const h = hwb[0] / 360;
      let wh = hwb[1] / 100;
      let bl = hwb[2] / 100;
      const ratio = wh + bl;
      let f;
      if (ratio > 1) {
        wh /= ratio;
        bl /= ratio;
      }
      const i = Math.floor(6 * h);
      const v = 1 - bl;
      f = 6 * h - i;
      if ((i & 1) !== 0) {
        f = 1 - f;
      }
      const n = wh + f * (v - wh);
      let r;
      let g;
      let b;
      switch (i) {
        default:
        case 6:
        case 0:
          r = v;
          g = n;
          b = wh;
          break;
        case 1:
          r = n;
          g = v;
          b = wh;
          break;
        case 2:
          r = wh;
          g = v;
          b = n;
          break;
        case 3:
          r = wh;
          g = n;
          b = v;
          break;
        case 4:
          r = n;
          g = wh;
          b = v;
          break;
        case 5:
          r = v;
          g = wh;
          b = n;
          break;
      }
      return [r * 255, g * 255, b * 255];
    };
    convert.cmyk.rgb = function(cmyk) {
      const c = cmyk[0] / 100;
      const m = cmyk[1] / 100;
      const y = cmyk[2] / 100;
      const k = cmyk[3] / 100;
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.rgb = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      let r;
      let g;
      let b;
      r = x * 3.2406 + y * -1.5372 + z * -0.4986;
      g = x * -0.9689 + y * 1.8758 + z * 0.0415;
      b = x * 0.0557 + y * -0.204 + z * 1.057;
      r = r > 31308e-7 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92;
      g = g > 31308e-7 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92;
      b = b > 31308e-7 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92;
      r = Math.min(Math.max(0, r), 1);
      g = Math.min(Math.max(0, g), 1);
      b = Math.min(Math.max(0, b), 1);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.lab = function(xyz) {
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.lab.xyz = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let x;
      let y;
      let z;
      y = (l + 16) / 116;
      x = a / 500 + y;
      z = y - b / 200;
      const y2 = y ** 3;
      const x2 = x ** 3;
      const z2 = z ** 3;
      y = y2 > 8856e-6 ? y2 : (y - 16 / 116) / 7.787;
      x = x2 > 8856e-6 ? x2 : (x - 16 / 116) / 7.787;
      z = z2 > 8856e-6 ? z2 : (z - 16 / 116) / 7.787;
      x *= 95.047;
      y *= 100;
      z *= 108.883;
      return [x, y, z];
    };
    convert.lab.lch = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let h;
      const hr = Math.atan2(b, a);
      h = hr * 360 / 2 / Math.PI;
      if (h < 0) {
        h += 360;
      }
      const c = Math.sqrt(a * a + b * b);
      return [l, c, h];
    };
    convert.lch.lab = function(lch) {
      const l = lch[0];
      const c = lch[1];
      const h = lch[2];
      const hr = h / 360 * 2 * Math.PI;
      const a = c * Math.cos(hr);
      const b = c * Math.sin(hr);
      return [l, a, b];
    };
    convert.rgb.ansi16 = function(args, saturation = null) {
      const [r, g, b] = args;
      let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
      value = Math.round(value / 50);
      if (value === 0) {
        return 30;
      }
      let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
      if (value === 2) {
        ansi += 60;
      }
      return ansi;
    };
    convert.hsv.ansi16 = function(args) {
      return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
    };
    convert.rgb.ansi256 = function(args) {
      const r = args[0];
      const g = args[1];
      const b = args[2];
      if (r === g && g === b) {
        if (r < 8) {
          return 16;
        }
        if (r > 248) {
          return 231;
        }
        return Math.round((r - 8) / 247 * 24) + 232;
      }
      const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
      return ansi;
    };
    convert.ansi16.rgb = function(args) {
      let color = args % 10;
      if (color === 0 || color === 7) {
        if (args > 50) {
          color += 3.5;
        }
        color = color / 10.5 * 255;
        return [color, color, color];
      }
      const mult = (~~(args > 50) + 1) * 0.5;
      const r = (color & 1) * mult * 255;
      const g = (color >> 1 & 1) * mult * 255;
      const b = (color >> 2 & 1) * mult * 255;
      return [r, g, b];
    };
    convert.ansi256.rgb = function(args) {
      if (args >= 232) {
        const c = (args - 232) * 10 + 8;
        return [c, c, c];
      }
      args -= 16;
      let rem;
      const r = Math.floor(args / 36) / 5 * 255;
      const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
      const b = rem % 6 / 5 * 255;
      return [r, g, b];
    };
    convert.rgb.hex = function(args) {
      const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
      const string = integer.toString(16).toUpperCase();
      return "000000".substring(string.length) + string;
    };
    convert.hex.rgb = function(args) {
      const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
      if (!match) {
        return [0, 0, 0];
      }
      let colorString = match[0];
      if (match[0].length === 3) {
        colorString = colorString.split("").map((char) => {
          return char + char;
        }).join("");
      }
      const integer = parseInt(colorString, 16);
      const r = integer >> 16 & 255;
      const g = integer >> 8 & 255;
      const b = integer & 255;
      return [r, g, b];
    };
    convert.rgb.hcg = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const max = Math.max(Math.max(r, g), b);
      const min = Math.min(Math.min(r, g), b);
      const chroma = max - min;
      let grayscale;
      let hue;
      if (chroma < 1) {
        grayscale = min / (1 - chroma);
      } else {
        grayscale = 0;
      }
      if (chroma <= 0) {
        hue = 0;
      } else if (max === r) {
        hue = (g - b) / chroma % 6;
      } else if (max === g) {
        hue = 2 + (b - r) / chroma;
      } else {
        hue = 4 + (r - g) / chroma;
      }
      hue /= 6;
      hue %= 1;
      return [hue * 360, chroma * 100, grayscale * 100];
    };
    convert.hsl.hcg = function(hsl) {
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
      let f = 0;
      if (c < 1) {
        f = (l - 0.5 * c) / (1 - c);
      }
      return [hsl[0], c * 100, f * 100];
    };
    convert.hsv.hcg = function(hsv) {
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const c = s * v;
      let f = 0;
      if (c < 1) {
        f = (v - c) / (1 - c);
      }
      return [hsv[0], c * 100, f * 100];
    };
    convert.hcg.rgb = function(hcg) {
      const h = hcg[0] / 360;
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      if (c === 0) {
        return [g * 255, g * 255, g * 255];
      }
      const pure = [0, 0, 0];
      const hi = h % 1 * 6;
      const v = hi % 1;
      const w = 1 - v;
      let mg = 0;
      switch (Math.floor(hi)) {
        case 0:
          pure[0] = 1;
          pure[1] = v;
          pure[2] = 0;
          break;
        case 1:
          pure[0] = w;
          pure[1] = 1;
          pure[2] = 0;
          break;
        case 2:
          pure[0] = 0;
          pure[1] = 1;
          pure[2] = v;
          break;
        case 3:
          pure[0] = 0;
          pure[1] = w;
          pure[2] = 1;
          break;
        case 4:
          pure[0] = v;
          pure[1] = 0;
          pure[2] = 1;
          break;
        default:
          pure[0] = 1;
          pure[1] = 0;
          pure[2] = w;
      }
      mg = (1 - c) * g;
      return [
        (c * pure[0] + mg) * 255,
        (c * pure[1] + mg) * 255,
        (c * pure[2] + mg) * 255
      ];
    };
    convert.hcg.hsv = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      let f = 0;
      if (v > 0) {
        f = c / v;
      }
      return [hcg[0], f * 100, v * 100];
    };
    convert.hcg.hsl = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const l = g * (1 - c) + 0.5 * c;
      let s = 0;
      if (l > 0 && l < 0.5) {
        s = c / (2 * l);
      } else if (l >= 0.5 && l < 1) {
        s = c / (2 * (1 - l));
      }
      return [hcg[0], s * 100, l * 100];
    };
    convert.hcg.hwb = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };
    convert.hwb.hcg = function(hwb) {
      const w = hwb[1] / 100;
      const b = hwb[2] / 100;
      const v = 1 - b;
      const c = v - w;
      let g = 0;
      if (c < 1) {
        g = (v - c) / (1 - c);
      }
      return [hwb[0], c * 100, g * 100];
    };
    convert.apple.rgb = function(apple) {
      return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
    };
    convert.rgb.apple = function(rgb) {
      return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
    };
    convert.gray.rgb = function(args) {
      return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };
    convert.gray.hsl = function(args) {
      return [0, 0, args[0]];
    };
    convert.gray.hsv = convert.gray.hsl;
    convert.gray.hwb = function(gray) {
      return [0, 100, gray[0]];
    };
    convert.gray.cmyk = function(gray) {
      return [0, 0, 0, gray[0]];
    };
    convert.gray.lab = function(gray) {
      return [gray[0], 0, 0];
    };
    convert.gray.hex = function(gray) {
      const val = Math.round(gray[0] / 100 * 255) & 255;
      const integer = (val << 16) + (val << 8) + val;
      const string = integer.toString(16).toUpperCase();
      return "000000".substring(string.length) + string;
    };
    convert.rgb.gray = function(rgb) {
      const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return [val / 255 * 100];
    };
  }
});

// node_modules/color-convert/route.js
var require_route = __commonJS({
  "node_modules/color-convert/route.js"(exports2, module2) {
    var conversions = require_conversions();
    function buildGraph() {
      const graph = {};
      const models = Object.keys(conversions);
      for (let len = models.length, i = 0; i < len; i++) {
        graph[models[i]] = {
          distance: -1,
          parent: null
        };
      }
      return graph;
    }
    function deriveBFS(fromModel) {
      const graph = buildGraph();
      const queue = [fromModel];
      graph[fromModel].distance = 0;
      while (queue.length) {
        const current = queue.pop();
        const adjacents = Object.keys(conversions[current]);
        for (let len = adjacents.length, i = 0; i < len; i++) {
          const adjacent = adjacents[i];
          const node = graph[adjacent];
          if (node.distance === -1) {
            node.distance = graph[current].distance + 1;
            node.parent = current;
            queue.unshift(adjacent);
          }
        }
      }
      return graph;
    }
    function link(from, to) {
      return function(args) {
        return to(from(args));
      };
    }
    function wrapConversion(toModel, graph) {
      const path2 = [graph[toModel].parent, toModel];
      let fn = conversions[graph[toModel].parent][toModel];
      let cur = graph[toModel].parent;
      while (graph[cur].parent) {
        path2.unshift(graph[cur].parent);
        fn = link(conversions[graph[cur].parent][cur], fn);
        cur = graph[cur].parent;
      }
      fn.conversion = path2;
      return fn;
    }
    module2.exports = function(fromModel) {
      const graph = deriveBFS(fromModel);
      const conversion = {};
      const models = Object.keys(graph);
      for (let len = models.length, i = 0; i < len; i++) {
        const toModel = models[i];
        const node = graph[toModel];
        if (node.parent === null) {
          continue;
        }
        conversion[toModel] = wrapConversion(toModel, graph);
      }
      return conversion;
    };
  }
});

// node_modules/color-convert/index.js
var require_color_convert = __commonJS({
  "node_modules/color-convert/index.js"(exports2, module2) {
    var conversions = require_conversions();
    var route = require_route();
    var convert = {};
    var models = Object.keys(conversions);
    function wrapRaw(fn) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        return fn(args);
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    function wrapRounded(fn) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        const result = fn(args);
        if (typeof result === "object") {
          for (let len = result.length, i = 0; i < len; i++) {
            result[i] = Math.round(result[i]);
          }
        }
        return result;
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    models.forEach((fromModel) => {
      convert[fromModel] = {};
      Object.defineProperty(convert[fromModel], "channels", { value: conversions[fromModel].channels });
      Object.defineProperty(convert[fromModel], "labels", { value: conversions[fromModel].labels });
      const routes = route(fromModel);
      const routeModels = Object.keys(routes);
      routeModels.forEach((toModel) => {
        const fn = routes[toModel];
        convert[fromModel][toModel] = wrapRounded(fn);
        convert[fromModel][toModel].raw = wrapRaw(fn);
      });
    });
    module2.exports = convert;
  }
});

// node_modules/ansi-styles/index.js
var require_ansi_styles = __commonJS({
  "node_modules/ansi-styles/index.js"(exports2, module2) {
    "use strict";
    var wrapAnsi16 = (fn, offset) => (...args) => {
      const code = fn(...args);
      return `[${code + offset}m`;
    };
    var wrapAnsi256 = (fn, offset) => (...args) => {
      const code = fn(...args);
      return `[${38 + offset};5;${code}m`;
    };
    var wrapAnsi16m = (fn, offset) => (...args) => {
      const rgb = fn(...args);
      return `[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
    };
    var ansi2ansi = (n) => n;
    var rgb2rgb = (r, g, b) => [r, g, b];
    var setLazyProperty = (object, property, get) => {
      Object.defineProperty(object, property, {
        get: () => {
          const value = get();
          Object.defineProperty(object, property, {
            value,
            enumerable: true,
            configurable: true
          });
          return value;
        },
        enumerable: true,
        configurable: true
      });
    };
    var colorConvert;
    var makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
      if (colorConvert === void 0) {
        colorConvert = require_color_convert();
      }
      const offset = isBackground ? 10 : 0;
      const styles = {};
      for (const [sourceSpace, suite] of Object.entries(colorConvert)) {
        const name = sourceSpace === "ansi16" ? "ansi" : sourceSpace;
        if (sourceSpace === targetSpace) {
          styles[name] = wrap(identity, offset);
        } else if (typeof suite === "object") {
          styles[name] = wrap(suite[targetSpace], offset);
        }
      }
      return styles;
    };
    function assembleStyles() {
      const codes = new Map();
      const styles = {
        modifier: {
          reset: [0, 0],
          bold: [1, 22],
          dim: [2, 22],
          italic: [3, 23],
          underline: [4, 24],
          inverse: [7, 27],
          hidden: [8, 28],
          strikethrough: [9, 29]
        },
        color: {
          black: [30, 39],
          red: [31, 39],
          green: [32, 39],
          yellow: [33, 39],
          blue: [34, 39],
          magenta: [35, 39],
          cyan: [36, 39],
          white: [37, 39],
          blackBright: [90, 39],
          redBright: [91, 39],
          greenBright: [92, 39],
          yellowBright: [93, 39],
          blueBright: [94, 39],
          magentaBright: [95, 39],
          cyanBright: [96, 39],
          whiteBright: [97, 39]
        },
        bgColor: {
          bgBlack: [40, 49],
          bgRed: [41, 49],
          bgGreen: [42, 49],
          bgYellow: [43, 49],
          bgBlue: [44, 49],
          bgMagenta: [45, 49],
          bgCyan: [46, 49],
          bgWhite: [47, 49],
          bgBlackBright: [100, 49],
          bgRedBright: [101, 49],
          bgGreenBright: [102, 49],
          bgYellowBright: [103, 49],
          bgBlueBright: [104, 49],
          bgMagentaBright: [105, 49],
          bgCyanBright: [106, 49],
          bgWhiteBright: [107, 49]
        }
      };
      styles.color.gray = styles.color.blackBright;
      styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
      styles.color.grey = styles.color.blackBright;
      styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;
      for (const [groupName, group] of Object.entries(styles)) {
        for (const [styleName, style] of Object.entries(group)) {
          styles[styleName] = {
            open: `[${style[0]}m`,
            close: `[${style[1]}m`
          };
          group[styleName] = styles[styleName];
          codes.set(style[0], style[1]);
        }
        Object.defineProperty(styles, groupName, {
          value: group,
          enumerable: false
        });
      }
      Object.defineProperty(styles, "codes", {
        value: codes,
        enumerable: false
      });
      styles.color.close = "[39m";
      styles.bgColor.close = "[49m";
      setLazyProperty(styles.color, "ansi", () => makeDynamicStyles(wrapAnsi16, "ansi16", ansi2ansi, false));
      setLazyProperty(styles.color, "ansi256", () => makeDynamicStyles(wrapAnsi256, "ansi256", ansi2ansi, false));
      setLazyProperty(styles.color, "ansi16m", () => makeDynamicStyles(wrapAnsi16m, "rgb", rgb2rgb, false));
      setLazyProperty(styles.bgColor, "ansi", () => makeDynamicStyles(wrapAnsi16, "ansi16", ansi2ansi, true));
      setLazyProperty(styles.bgColor, "ansi256", () => makeDynamicStyles(wrapAnsi256, "ansi256", ansi2ansi, true));
      setLazyProperty(styles.bgColor, "ansi16m", () => makeDynamicStyles(wrapAnsi16m, "rgb", rgb2rgb, true));
      return styles;
    }
    Object.defineProperty(module2, "exports", {
      enumerable: true,
      get: assembleStyles
    });
  }
});

// node_modules/wrap-ansi/index.js
var require_wrap_ansi = __commonJS({
  "node_modules/wrap-ansi/index.js"(exports2, module2) {
    "use strict";
    var stringWidth = require_string_width();
    var stripAnsi = require_strip_ansi();
    var ansiStyles = require_ansi_styles();
    var ESCAPES = new Set([
      "",
      "\x9B"
    ]);
    var END_CODE = 39;
    var ANSI_ESCAPE_BELL = "\x07";
    var ANSI_CSI = "[";
    var ANSI_OSC = "]";
    var ANSI_SGR_TERMINATOR = "m";
    var ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
    var wrapAnsi = (code) => `${ESCAPES.values().next().value}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
    var wrapAnsiHyperlink = (uri) => `${ESCAPES.values().next().value}${ANSI_ESCAPE_LINK}${uri}${ANSI_ESCAPE_BELL}`;
    var wordLengths = (string) => string.split(" ").map((character) => stringWidth(character));
    var wrapWord = (rows, word, columns) => {
      const characters = [...word];
      let isInsideEscape = false;
      let isInsideLinkEscape = false;
      let visible = stringWidth(stripAnsi(rows[rows.length - 1]));
      for (const [index, character] of characters.entries()) {
        const characterLength = stringWidth(character);
        if (visible + characterLength <= columns) {
          rows[rows.length - 1] += character;
        } else {
          rows.push(character);
          visible = 0;
        }
        if (ESCAPES.has(character)) {
          isInsideEscape = true;
          isInsideLinkEscape = characters.slice(index + 1).join("").startsWith(ANSI_ESCAPE_LINK);
        }
        if (isInsideEscape) {
          if (isInsideLinkEscape) {
            if (character === ANSI_ESCAPE_BELL) {
              isInsideEscape = false;
              isInsideLinkEscape = false;
            }
          } else if (character === ANSI_SGR_TERMINATOR) {
            isInsideEscape = false;
          }
          continue;
        }
        visible += characterLength;
        if (visible === columns && index < characters.length - 1) {
          rows.push("");
          visible = 0;
        }
      }
      if (!visible && rows[rows.length - 1].length > 0 && rows.length > 1) {
        rows[rows.length - 2] += rows.pop();
      }
    };
    var stringVisibleTrimSpacesRight = (string) => {
      const words = string.split(" ");
      let last = words.length;
      while (last > 0) {
        if (stringWidth(words[last - 1]) > 0) {
          break;
        }
        last--;
      }
      if (last === words.length) {
        return string;
      }
      return words.slice(0, last).join(" ") + words.slice(last).join("");
    };
    var exec = (string, columns, options = {}) => {
      if (options.trim !== false && string.trim() === "") {
        return "";
      }
      let returnValue = "";
      let escapeCode;
      let escapeUrl;
      const lengths = wordLengths(string);
      let rows = [""];
      for (const [index, word] of string.split(" ").entries()) {
        if (options.trim !== false) {
          rows[rows.length - 1] = rows[rows.length - 1].trimStart();
        }
        let rowLength = stringWidth(rows[rows.length - 1]);
        if (index !== 0) {
          if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
            rows.push("");
            rowLength = 0;
          }
          if (rowLength > 0 || options.trim === false) {
            rows[rows.length - 1] += " ";
            rowLength++;
          }
        }
        if (options.hard && lengths[index] > columns) {
          const remainingColumns = columns - rowLength;
          const breaksStartingThisLine = 1 + Math.floor((lengths[index] - remainingColumns - 1) / columns);
          const breaksStartingNextLine = Math.floor((lengths[index] - 1) / columns);
          if (breaksStartingNextLine < breaksStartingThisLine) {
            rows.push("");
          }
          wrapWord(rows, word, columns);
          continue;
        }
        if (rowLength + lengths[index] > columns && rowLength > 0 && lengths[index] > 0) {
          if (options.wordWrap === false && rowLength < columns) {
            wrapWord(rows, word, columns);
            continue;
          }
          rows.push("");
        }
        if (rowLength + lengths[index] > columns && options.wordWrap === false) {
          wrapWord(rows, word, columns);
          continue;
        }
        rows[rows.length - 1] += word;
      }
      if (options.trim !== false) {
        rows = rows.map(stringVisibleTrimSpacesRight);
      }
      const pre = [...rows.join("\n")];
      for (const [index, character] of pre.entries()) {
        returnValue += character;
        if (ESCAPES.has(character)) {
          const { groups } = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`).exec(pre.slice(index).join("")) || { groups: {} };
          if (groups.code !== void 0) {
            const code2 = Number.parseFloat(groups.code);
            escapeCode = code2 === END_CODE ? void 0 : code2;
          } else if (groups.uri !== void 0) {
            escapeUrl = groups.uri.length === 0 ? void 0 : groups.uri;
          }
        }
        const code = ansiStyles.codes.get(Number(escapeCode));
        if (pre[index + 1] === "\n") {
          if (escapeUrl) {
            returnValue += wrapAnsiHyperlink("");
          }
          if (escapeCode && code) {
            returnValue += wrapAnsi(code);
          }
        } else if (character === "\n") {
          if (escapeCode && code) {
            returnValue += wrapAnsi(escapeCode);
          }
          if (escapeUrl) {
            returnValue += wrapAnsiHyperlink(escapeUrl);
          }
        }
      }
      return returnValue;
    };
    module2.exports = (string, columns, options) => {
      return String(string).normalize().replace(/\r\n/g, "\n").split("\n").map((line) => exec(line, columns, options)).join("\n");
    };
  }
});

// node_modules/cliui/build/index.cjs
var require_build3 = __commonJS({
  "node_modules/cliui/build/index.cjs"(exports2, module2) {
    "use strict";
    var align = {
      right: alignRight,
      center: alignCenter
    };
    var top = 0;
    var right = 1;
    var bottom = 2;
    var left = 3;
    var UI = class {
      constructor(opts) {
        var _a;
        this.width = opts.width;
        this.wrap = (_a = opts.wrap) !== null && _a !== void 0 ? _a : true;
        this.rows = [];
      }
      span(...args) {
        const cols = this.div(...args);
        cols.span = true;
      }
      resetOutput() {
        this.rows = [];
      }
      div(...args) {
        if (args.length === 0) {
          this.div("");
        }
        if (this.wrap && this.shouldApplyLayoutDSL(...args) && typeof args[0] === "string") {
          return this.applyLayoutDSL(args[0]);
        }
        const cols = args.map((arg) => {
          if (typeof arg === "string") {
            return this.colFromString(arg);
          }
          return arg;
        });
        this.rows.push(cols);
        return cols;
      }
      shouldApplyLayoutDSL(...args) {
        return args.length === 1 && typeof args[0] === "string" && /[\t\n]/.test(args[0]);
      }
      applyLayoutDSL(str) {
        const rows = str.split("\n").map((row) => row.split("	"));
        let leftColumnWidth = 0;
        rows.forEach((columns) => {
          if (columns.length > 1 && mixin.stringWidth(columns[0]) > leftColumnWidth) {
            leftColumnWidth = Math.min(Math.floor(this.width * 0.5), mixin.stringWidth(columns[0]));
          }
        });
        rows.forEach((columns) => {
          this.div(...columns.map((r, i) => {
            return {
              text: r.trim(),
              padding: this.measurePadding(r),
              width: i === 0 && columns.length > 1 ? leftColumnWidth : void 0
            };
          }));
        });
        return this.rows[this.rows.length - 1];
      }
      colFromString(text) {
        return {
          text,
          padding: this.measurePadding(text)
        };
      }
      measurePadding(str) {
        const noAnsi = mixin.stripAnsi(str);
        return [0, noAnsi.match(/\s*$/)[0].length, 0, noAnsi.match(/^\s*/)[0].length];
      }
      toString() {
        const lines = [];
        this.rows.forEach((row) => {
          this.rowToString(row, lines);
        });
        return lines.filter((line) => !line.hidden).map((line) => line.text).join("\n");
      }
      rowToString(row, lines) {
        this.rasterize(row).forEach((rrow, r) => {
          let str = "";
          rrow.forEach((col, c) => {
            const { width } = row[c];
            const wrapWidth = this.negatePadding(row[c]);
            let ts = col;
            if (wrapWidth > mixin.stringWidth(col)) {
              ts += " ".repeat(wrapWidth - mixin.stringWidth(col));
            }
            if (row[c].align && row[c].align !== "left" && this.wrap) {
              const fn = align[row[c].align];
              ts = fn(ts, wrapWidth);
              if (mixin.stringWidth(ts) < wrapWidth) {
                ts += " ".repeat((width || 0) - mixin.stringWidth(ts) - 1);
              }
            }
            const padding = row[c].padding || [0, 0, 0, 0];
            if (padding[left]) {
              str += " ".repeat(padding[left]);
            }
            str += addBorder(row[c], ts, "| ");
            str += ts;
            str += addBorder(row[c], ts, " |");
            if (padding[right]) {
              str += " ".repeat(padding[right]);
            }
            if (r === 0 && lines.length > 0) {
              str = this.renderInline(str, lines[lines.length - 1]);
            }
          });
          lines.push({
            text: str.replace(/ +$/, ""),
            span: row.span
          });
        });
        return lines;
      }
      renderInline(source, previousLine) {
        const match = source.match(/^ */);
        const leadingWhitespace = match ? match[0].length : 0;
        const target = previousLine.text;
        const targetTextWidth = mixin.stringWidth(target.trimRight());
        if (!previousLine.span) {
          return source;
        }
        if (!this.wrap) {
          previousLine.hidden = true;
          return target + source;
        }
        if (leadingWhitespace < targetTextWidth) {
          return source;
        }
        previousLine.hidden = true;
        return target.trimRight() + " ".repeat(leadingWhitespace - targetTextWidth) + source.trimLeft();
      }
      rasterize(row) {
        const rrows = [];
        const widths = this.columnWidths(row);
        let wrapped;
        row.forEach((col, c) => {
          col.width = widths[c];
          if (this.wrap) {
            wrapped = mixin.wrap(col.text, this.negatePadding(col), { hard: true }).split("\n");
          } else {
            wrapped = col.text.split("\n");
          }
          if (col.border) {
            wrapped.unshift("." + "-".repeat(this.negatePadding(col) + 2) + ".");
            wrapped.push("'" + "-".repeat(this.negatePadding(col) + 2) + "'");
          }
          if (col.padding) {
            wrapped.unshift(...new Array(col.padding[top] || 0).fill(""));
            wrapped.push(...new Array(col.padding[bottom] || 0).fill(""));
          }
          wrapped.forEach((str, r) => {
            if (!rrows[r]) {
              rrows.push([]);
            }
            const rrow = rrows[r];
            for (let i = 0; i < c; i++) {
              if (rrow[i] === void 0) {
                rrow.push("");
              }
            }
            rrow.push(str);
          });
        });
        return rrows;
      }
      negatePadding(col) {
        let wrapWidth = col.width || 0;
        if (col.padding) {
          wrapWidth -= (col.padding[left] || 0) + (col.padding[right] || 0);
        }
        if (col.border) {
          wrapWidth -= 4;
        }
        return wrapWidth;
      }
      columnWidths(row) {
        if (!this.wrap) {
          return row.map((col) => {
            return col.width || mixin.stringWidth(col.text);
          });
        }
        let unset = row.length;
        let remainingWidth = this.width;
        const widths = row.map((col) => {
          if (col.width) {
            unset--;
            remainingWidth -= col.width;
            return col.width;
          }
          return void 0;
        });
        const unsetWidth = unset ? Math.floor(remainingWidth / unset) : 0;
        return widths.map((w, i) => {
          if (w === void 0) {
            return Math.max(unsetWidth, _minWidth(row[i]));
          }
          return w;
        });
      }
    };
    function addBorder(col, ts, style) {
      if (col.border) {
        if (/[.']-+[.']/.test(ts)) {
          return "";
        }
        if (ts.trim().length !== 0) {
          return style;
        }
        return "  ";
      }
      return "";
    }
    function _minWidth(col) {
      const padding = col.padding || [];
      const minWidth = 1 + (padding[left] || 0) + (padding[right] || 0);
      if (col.border) {
        return minWidth + 4;
      }
      return minWidth;
    }
    function getWindowWidth() {
      if (typeof process === "object" && process.stdout && process.stdout.columns) {
        return process.stdout.columns;
      }
      return 80;
    }
    function alignRight(str, width) {
      str = str.trim();
      const strWidth = mixin.stringWidth(str);
      if (strWidth < width) {
        return " ".repeat(width - strWidth) + str;
      }
      return str;
    }
    function alignCenter(str, width) {
      str = str.trim();
      const strWidth = mixin.stringWidth(str);
      if (strWidth >= width) {
        return str;
      }
      return " ".repeat(width - strWidth >> 1) + str;
    }
    var mixin;
    function cliui(opts, _mixin) {
      mixin = _mixin;
      return new UI({
        width: (opts === null || opts === void 0 ? void 0 : opts.width) || getWindowWidth(),
        wrap: opts === null || opts === void 0 ? void 0 : opts.wrap
      });
    }
    var stringWidth = require_string_width();
    var stripAnsi = require_strip_ansi();
    var wrap = require_wrap_ansi();
    function ui(opts) {
      return cliui(opts, {
        stringWidth,
        stripAnsi,
        wrap
      });
    }
    module2.exports = ui;
  }
});

// node_modules/escalade/sync/index.js
var require_sync2 = __commonJS({
  "node_modules/escalade/sync/index.js"(exports2, module2) {
    var { dirname: dirname2, resolve } = require("path");
    var { readdirSync, statSync } = require("fs");
    module2.exports = function(start, callback) {
      let dir = resolve(".", start);
      let tmp, stats = statSync(dir);
      if (!stats.isDirectory()) {
        dir = dirname2(dir);
      }
      while (true) {
        tmp = callback(dir, readdirSync(dir));
        if (tmp)
          return resolve(dir, tmp);
        dir = dirname2(tmp = dir);
        if (tmp === dir)
          break;
      }
    };
  }
});

// node_modules/get-caller-file/index.js
var require_get_caller_file = __commonJS({
  "node_modules/get-caller-file/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function getCallerFile(position) {
      if (position === void 0) {
        position = 2;
      }
      if (position >= Error.stackTraceLimit) {
        throw new TypeError("getCallerFile(position) requires position be less then Error.stackTraceLimit but position was: `" + position + "` and Error.stackTraceLimit was: `" + Error.stackTraceLimit + "`");
      }
      var oldPrepareStackTrace = Error.prepareStackTrace;
      Error.prepareStackTrace = function(_, stack2) {
        return stack2;
      };
      var stack = new Error().stack;
      Error.prepareStackTrace = oldPrepareStackTrace;
      if (stack !== null && typeof stack === "object") {
        return stack[position] ? stack[position].getFileName() : void 0;
      }
    };
  }
});

// node_modules/require-directory/index.js
var require_require_directory = __commonJS({
  "node_modules/require-directory/index.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var join = require("path").join;
    var resolve = require("path").resolve;
    var dirname2 = require("path").dirname;
    var defaultOptions = {
      extensions: ["js", "json", "coffee"],
      recurse: true,
      rename: function(name) {
        return name;
      },
      visit: function(obj) {
        return obj;
      }
    };
    function checkFileInclusion(path2, filename, options) {
      return new RegExp("\\.(" + options.extensions.join("|") + ")$", "i").test(filename) && !(options.include && options.include instanceof RegExp && !options.include.test(path2)) && !(options.include && typeof options.include === "function" && !options.include(path2, filename)) && !(options.exclude && options.exclude instanceof RegExp && options.exclude.test(path2)) && !(options.exclude && typeof options.exclude === "function" && options.exclude(path2, filename));
    }
    function requireDirectory(m, path2, options) {
      var retval = {};
      if (path2 && !options && typeof path2 !== "string") {
        options = path2;
        path2 = null;
      }
      options = options || {};
      for (var prop in defaultOptions) {
        if (typeof options[prop] === "undefined") {
          options[prop] = defaultOptions[prop];
        }
      }
      path2 = !path2 ? dirname2(m.filename) : resolve(dirname2(m.filename), path2);
      fs2.readdirSync(path2).forEach(function(filename) {
        var joined = join(path2, filename), files, key, obj;
        if (fs2.statSync(joined).isDirectory() && options.recurse) {
          files = requireDirectory(m, joined, options);
          if (Object.keys(files).length) {
            retval[options.rename(filename, joined, filename)] = files;
          }
        } else {
          if (joined !== m.filename && checkFileInclusion(joined, filename, options)) {
            key = filename.substring(0, filename.lastIndexOf("."));
            obj = m.require(joined);
            retval[options.rename(key, joined, filename)] = options.visit(obj, joined, filename) || obj;
          }
        }
      });
      return retval;
    }
    module2.exports = requireDirectory;
    module2.exports.defaults = defaultOptions;
  }
});

// node_modules/yargs/build/index.cjs
var require_build4 = __commonJS({
  "node_modules/yargs/build/index.cjs"(exports2, module2) {
    "use strict";
    var t = require("assert");
    var e = class extends Error {
      constructor(t2) {
        super(t2 || "yargs error"), this.name = "YError", Error.captureStackTrace(this, e);
      }
    };
    var s;
    var i = [];
    function n(t2, o2, a2, h2) {
      s = h2;
      let l2 = {};
      if (Object.prototype.hasOwnProperty.call(t2, "extends")) {
        if (typeof t2.extends != "string")
          return l2;
        const r2 = /\.json|\..*rc$/.test(t2.extends);
        let h3 = null;
        if (r2)
          h3 = function(t3, e2) {
            return s.path.resolve(t3, e2);
          }(o2, t2.extends);
        else
          try {
            h3 = require.resolve(t2.extends);
          } catch (e2) {
            return t2;
          }
        !function(t3) {
          if (i.indexOf(t3) > -1)
            throw new e(`Circular extended configurations: '${t3}'.`);
        }(h3), i.push(h3), l2 = r2 ? JSON.parse(s.readFileSync(h3, "utf8")) : require(t2.extends), delete t2.extends, l2 = n(l2, s.path.dirname(h3), a2, s);
      }
      return i = [], a2 ? r(l2, t2) : Object.assign({}, l2, t2);
    }
    function r(t2, e2) {
      const s2 = {};
      function i2(t3) {
        return t3 && typeof t3 == "object" && !Array.isArray(t3);
      }
      Object.assign(s2, t2);
      for (const n2 of Object.keys(e2))
        i2(e2[n2]) && i2(s2[n2]) ? s2[n2] = r(t2[n2], e2[n2]) : s2[n2] = e2[n2];
      return s2;
    }
    function o(t2) {
      const e2 = t2.replace(/\s{2,}/g, " ").split(/\s+(?![^[]*]|[^<]*>)/), s2 = /\.*[\][<>]/g, i2 = e2.shift();
      if (!i2)
        throw new Error(`No command found in: ${t2}`);
      const n2 = { cmd: i2.replace(s2, ""), demanded: [], optional: [] };
      return e2.forEach((t3, i3) => {
        let r2 = false;
        t3 = t3.replace(/\s/g, ""), /\.+[\]>]/.test(t3) && i3 === e2.length - 1 && (r2 = true), /^\[/.test(t3) ? n2.optional.push({ cmd: t3.replace(s2, "").split("|"), variadic: r2 }) : n2.demanded.push({ cmd: t3.replace(s2, "").split("|"), variadic: r2 });
      }), n2;
    }
    var a = ["first", "second", "third", "fourth", "fifth", "sixth"];
    function h(t2, s2, i2) {
      try {
        let n2 = 0;
        const [r2, a2, h2] = typeof t2 == "object" ? [{ demanded: [], optional: [] }, t2, s2] : [o(`cmd ${t2}`), s2, i2], f2 = [].slice.call(a2);
        for (; f2.length && f2[f2.length - 1] === void 0; )
          f2.pop();
        const d2 = h2 || f2.length;
        if (d2 < r2.demanded.length)
          throw new e(`Not enough arguments provided. Expected ${r2.demanded.length} but received ${f2.length}.`);
        const u2 = r2.demanded.length + r2.optional.length;
        if (d2 > u2)
          throw new e(`Too many arguments provided. Expected max ${u2} but received ${d2}.`);
        r2.demanded.forEach((t3) => {
          const e2 = l(f2.shift());
          t3.cmd.filter((t4) => t4 === e2 || t4 === "*").length === 0 && c(e2, t3.cmd, n2), n2 += 1;
        }), r2.optional.forEach((t3) => {
          if (f2.length === 0)
            return;
          const e2 = l(f2.shift());
          t3.cmd.filter((t4) => t4 === e2 || t4 === "*").length === 0 && c(e2, t3.cmd, n2), n2 += 1;
        });
      } catch (t3) {
        console.warn(t3.stack);
      }
    }
    function l(t2) {
      return Array.isArray(t2) ? "array" : t2 === null ? "null" : typeof t2;
    }
    function c(t2, s2, i2) {
      throw new e(`Invalid ${a[i2] || "manyith"} argument. Expected ${s2.join(" or ")} but received ${t2}.`);
    }
    function f(t2) {
      return !!t2 && !!t2.then && typeof t2.then == "function";
    }
    function d(t2, e2, s2, i2) {
      s2.assert.notStrictEqual(t2, e2, i2);
    }
    function u(t2, e2) {
      e2.assert.strictEqual(typeof t2, "string");
    }
    function p(t2) {
      return Object.keys(t2);
    }
    function g(t2 = {}, e2 = () => true) {
      const s2 = {};
      return p(t2).forEach((i2) => {
        e2(i2, t2[i2]) && (s2[i2] = t2[i2]);
      }), s2;
    }
    function m() {
      return process.versions.electron && !process.defaultApp ? 0 : 1;
    }
    function y() {
      return process.argv[m()];
    }
    var b = Object.freeze({ __proto__: null, hideBin: function(t2) {
      return t2.slice(m() + 1);
    }, getProcessArgvBin: y });
    function v(t2, e2, s2, i2) {
      if (s2 === "a" && !i2)
        throw new TypeError("Private accessor was defined without a getter");
      if (typeof e2 == "function" ? t2 !== e2 || !i2 : !e2.has(t2))
        throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return s2 === "m" ? i2 : s2 === "a" ? i2.call(t2) : i2 ? i2.value : e2.get(t2);
    }
    function O(t2, e2, s2, i2, n2) {
      if (i2 === "m")
        throw new TypeError("Private method is not writable");
      if (i2 === "a" && !n2)
        throw new TypeError("Private accessor was defined without a setter");
      if (typeof e2 == "function" ? t2 !== e2 || !n2 : !e2.has(t2))
        throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return i2 === "a" ? n2.call(t2, s2) : n2 ? n2.value = s2 : e2.set(t2, s2), s2;
    }
    var w = class {
      constructor(t2) {
        this.globalMiddleware = [], this.frozens = [], this.yargs = t2;
      }
      addMiddleware(t2, e2, s2 = true, i2 = false) {
        if (h("<array|function> [boolean] [boolean] [boolean]", [t2, e2, s2], arguments.length), Array.isArray(t2)) {
          for (let i3 = 0; i3 < t2.length; i3++) {
            if (typeof t2[i3] != "function")
              throw Error("middleware must be a function");
            const n2 = t2[i3];
            n2.applyBeforeValidation = e2, n2.global = s2;
          }
          Array.prototype.push.apply(this.globalMiddleware, t2);
        } else if (typeof t2 == "function") {
          const n2 = t2;
          n2.applyBeforeValidation = e2, n2.global = s2, n2.mutates = i2, this.globalMiddleware.push(t2);
        }
        return this.yargs;
      }
      addCoerceMiddleware(t2, e2) {
        const s2 = this.yargs.getAliases();
        return this.globalMiddleware = this.globalMiddleware.filter((t3) => {
          const i2 = [...s2[e2] || [], e2];
          return !t3.option || !i2.includes(t3.option);
        }), t2.option = e2, this.addMiddleware(t2, true, true, true);
      }
      getMiddleware() {
        return this.globalMiddleware;
      }
      freeze() {
        this.frozens.push([...this.globalMiddleware]);
      }
      unfreeze() {
        const t2 = this.frozens.pop();
        t2 !== void 0 && (this.globalMiddleware = t2);
      }
      reset() {
        this.globalMiddleware = this.globalMiddleware.filter((t2) => t2.global);
      }
    };
    function C(t2, e2, s2, i2) {
      return s2.reduce((t3, s3) => {
        if (s3.applyBeforeValidation !== i2)
          return t3;
        if (s3.mutates) {
          if (s3.applied)
            return t3;
          s3.applied = true;
        }
        if (f(t3))
          return t3.then((t4) => Promise.all([t4, s3(t4, e2)])).then(([t4, e3]) => Object.assign(t4, e3));
        {
          const i3 = s3(t3, e2);
          return f(i3) ? i3.then((e3) => Object.assign(t3, e3)) : Object.assign(t3, i3);
        }
      }, t2);
    }
    function j(t2, e2, s2 = (t3) => {
      throw t3;
    }) {
      try {
        const s3 = typeof t2 == "function" ? t2() : t2;
        return f(s3) ? s3.then((t3) => e2(t3)) : e2(s3);
      } catch (t3) {
        return s2(t3);
      }
    }
    var _ = /(^\*)|(^\$0)/;
    var M = class {
      constructor(t2, e2, s2, i2) {
        this.requireCache = new Set(), this.handlers = {}, this.aliasMap = {}, this.frozens = [], this.shim = i2, this.usage = t2, this.globalMiddleware = s2, this.validation = e2;
      }
      addDirectory(t2, e2, s2, i2) {
        typeof (i2 = i2 || {}).recurse != "boolean" && (i2.recurse = false), Array.isArray(i2.extensions) || (i2.extensions = ["js"]);
        const n2 = typeof i2.visit == "function" ? i2.visit : (t3) => t3;
        i2.visit = (t3, e3, s3) => {
          const i3 = n2(t3, e3, s3);
          if (i3) {
            if (this.requireCache.has(e3))
              return i3;
            this.requireCache.add(e3), this.addHandler(i3);
          }
          return i3;
        }, this.shim.requireDirectory({ require: e2, filename: s2 }, t2, i2);
      }
      addHandler(t2, e2, s2, i2, n2, r2) {
        let a2 = [];
        const h2 = function(t3) {
          return t3 ? t3.map((t4) => (t4.applyBeforeValidation = false, t4)) : [];
        }(n2);
        if (i2 = i2 || (() => {
        }), Array.isArray(t2))
          if (function(t3) {
            return t3.every((t4) => typeof t4 == "string");
          }(t2))
            [t2, ...a2] = t2;
          else
            for (const e3 of t2)
              this.addHandler(e3);
        else {
          if (function(t3) {
            return typeof t3 == "object" && !Array.isArray(t3);
          }(t2)) {
            let e3 = Array.isArray(t2.command) || typeof t2.command == "string" ? t2.command : this.moduleName(t2);
            return t2.aliases && (e3 = [].concat(e3).concat(t2.aliases)), void this.addHandler(e3, this.extractDesc(t2), t2.builder, t2.handler, t2.middlewares, t2.deprecated);
          }
          if (k(s2))
            return void this.addHandler([t2].concat(a2), e2, s2.builder, s2.handler, s2.middlewares, s2.deprecated);
        }
        if (typeof t2 == "string") {
          const n3 = o(t2);
          a2 = a2.map((t3) => o(t3).cmd);
          let l2 = false;
          const c2 = [n3.cmd].concat(a2).filter((t3) => !_.test(t3) || (l2 = true, false));
          c2.length === 0 && l2 && c2.push("$0"), l2 && (n3.cmd = c2[0], a2 = c2.slice(1), t2 = t2.replace(_, n3.cmd)), a2.forEach((t3) => {
            this.aliasMap[t3] = n3.cmd;
          }), e2 !== false && this.usage.command(t2, e2, l2, a2, r2), this.handlers[n3.cmd] = { original: t2, description: e2, handler: i2, builder: s2 || {}, middlewares: h2, deprecated: r2, demanded: n3.demanded, optional: n3.optional }, l2 && (this.defaultCommand = this.handlers[n3.cmd]);
        }
      }
      getCommandHandlers() {
        return this.handlers;
      }
      getCommands() {
        return Object.keys(this.handlers).concat(Object.keys(this.aliasMap));
      }
      hasDefaultCommand() {
        return !!this.defaultCommand;
      }
      runCommand(t2, e2, s2, i2, n2, r2) {
        const o2 = this.handlers[t2] || this.handlers[this.aliasMap[t2]] || this.defaultCommand, a2 = e2.getInternalMethods().getContext(), h2 = a2.commands.slice(), l2 = !t2;
        t2 && (a2.commands.push(t2), a2.fullCommands.push(o2.original));
        const c2 = this.applyBuilderUpdateUsageAndParse(l2, o2, e2, s2.aliases, h2, i2, n2, r2);
        return f(c2) ? c2.then((t3) => this.applyMiddlewareAndGetResult(l2, o2, t3.innerArgv, a2, n2, t3.aliases, e2)) : this.applyMiddlewareAndGetResult(l2, o2, c2.innerArgv, a2, n2, c2.aliases, e2);
      }
      applyBuilderUpdateUsageAndParse(t2, e2, s2, i2, n2, r2, o2, a2) {
        const h2 = e2.builder;
        let l2 = s2;
        if (E(h2)) {
          const c2 = h2(s2.getInternalMethods().reset(i2), a2);
          if (f(c2))
            return c2.then((i3) => {
              var a3;
              return l2 = (a3 = i3) && typeof a3.getInternalMethods == "function" ? i3 : s2, this.parseAndUpdateUsage(t2, e2, l2, n2, r2, o2);
            });
        } else
          (function(t3) {
            return typeof t3 == "object";
          })(h2) && (l2 = s2.getInternalMethods().reset(i2), Object.keys(e2.builder).forEach((t3) => {
            l2.option(t3, h2[t3]);
          }));
        return this.parseAndUpdateUsage(t2, e2, l2, n2, r2, o2);
      }
      parseAndUpdateUsage(t2, e2, s2, i2, n2, r2) {
        t2 && s2.getInternalMethods().getUsageInstance().unfreeze(), this.shouldUpdateUsage(s2) && s2.getInternalMethods().getUsageInstance().usage(this.usageFromParentCommandsCommandHandler(i2, e2), e2.description);
        const o2 = s2.getInternalMethods().runYargsParserAndExecuteCommands(null, void 0, true, n2, r2);
        return f(o2) ? o2.then((t3) => ({ aliases: s2.parsed.aliases, innerArgv: t3 })) : { aliases: s2.parsed.aliases, innerArgv: o2 };
      }
      shouldUpdateUsage(t2) {
        return !t2.getInternalMethods().getUsageInstance().getUsageDisabled() && t2.getInternalMethods().getUsageInstance().getUsage().length === 0;
      }
      usageFromParentCommandsCommandHandler(t2, e2) {
        const s2 = _.test(e2.original) ? e2.original.replace(_, "").trim() : e2.original, i2 = t2.filter((t3) => !_.test(t3));
        return i2.push(s2), `$0 ${i2.join(" ")}`;
      }
      applyMiddlewareAndGetResult(t2, e2, s2, i2, n2, r2, o2) {
        let a2 = {};
        if (n2)
          return s2;
        o2.getInternalMethods().getHasOutput() || (a2 = this.populatePositionals(e2, s2, i2, o2));
        const h2 = this.globalMiddleware.getMiddleware().slice(0).concat(e2.middlewares);
        if (s2 = C(s2, o2, h2, true), !o2.getInternalMethods().getHasOutput()) {
          const e3 = o2.getInternalMethods().runValidation(r2, a2, o2.parsed.error, t2);
          s2 = j(s2, (t3) => (e3(t3), t3));
        }
        if (e2.handler && !o2.getInternalMethods().getHasOutput()) {
          o2.getInternalMethods().setHasOutput();
          const i3 = !!o2.getOptions().configuration["populate--"];
          o2.getInternalMethods().postProcess(s2, i3, false, false), s2 = j(s2 = C(s2, o2, h2, false), (t3) => {
            const s3 = e2.handler(t3);
            return f(s3) ? s3.then(() => t3) : t3;
          }), t2 || o2.getInternalMethods().getUsageInstance().cacheHelpMessage(), f(s2) && !o2.getInternalMethods().hasParseCallback() && s2.catch((t3) => {
            try {
              o2.getInternalMethods().getUsageInstance().fail(null, t3);
            } catch (t4) {
            }
          });
        }
        return t2 || (i2.commands.pop(), i2.fullCommands.pop()), s2;
      }
      populatePositionals(t2, e2, s2, i2) {
        e2._ = e2._.slice(s2.commands.length);
        const n2 = t2.demanded.slice(0), r2 = t2.optional.slice(0), o2 = {};
        for (this.validation.positionalCount(n2.length, e2._.length); n2.length; ) {
          const t3 = n2.shift();
          this.populatePositional(t3, e2, o2);
        }
        for (; r2.length; ) {
          const t3 = r2.shift();
          this.populatePositional(t3, e2, o2);
        }
        return e2._ = s2.commands.concat(e2._.map((t3) => "" + t3)), this.postProcessPositionals(e2, o2, this.cmdToParseOptions(t2.original), i2), o2;
      }
      populatePositional(t2, e2, s2) {
        const i2 = t2.cmd[0];
        t2.variadic ? s2[i2] = e2._.splice(0).map(String) : e2._.length && (s2[i2] = [String(e2._.shift())]);
      }
      cmdToParseOptions(t2) {
        const e2 = { array: [], default: {}, alias: {}, demand: {} }, s2 = o(t2);
        return s2.demanded.forEach((t3) => {
          const [s3, ...i2] = t3.cmd;
          t3.variadic && (e2.array.push(s3), e2.default[s3] = []), e2.alias[s3] = i2, e2.demand[s3] = true;
        }), s2.optional.forEach((t3) => {
          const [s3, ...i2] = t3.cmd;
          t3.variadic && (e2.array.push(s3), e2.default[s3] = []), e2.alias[s3] = i2;
        }), e2;
      }
      postProcessPositionals(t2, e2, s2, i2) {
        const n2 = Object.assign({}, i2.getOptions());
        n2.default = Object.assign(s2.default, n2.default);
        for (const t3 of Object.keys(s2.alias))
          n2.alias[t3] = (n2.alias[t3] || []).concat(s2.alias[t3]);
        n2.array = n2.array.concat(s2.array), n2.config = {};
        const r2 = [];
        if (Object.keys(e2).forEach((t3) => {
          e2[t3].map((e3) => {
            n2.configuration["unknown-options-as-args"] && (n2.key[t3] = true), r2.push(`--${t3}`), r2.push(e3);
          });
        }), !r2.length)
          return;
        const o2 = Object.assign({}, n2.configuration, { "populate--": false }), a2 = this.shim.Parser.detailed(r2, Object.assign({}, n2, { configuration: o2 }));
        if (a2.error)
          i2.getInternalMethods().getUsageInstance().fail(a2.error.message, a2.error);
        else {
          const s3 = Object.keys(e2);
          Object.keys(e2).forEach((t3) => {
            s3.push(...a2.aliases[t3]);
          });
          const n3 = i2.getOptions().default;
          Object.keys(a2.argv).forEach((i3) => {
            s3.includes(i3) && (e2[i3] || (e2[i3] = a2.argv[i3]), !Object.prototype.hasOwnProperty.call(n3, i3) && Object.prototype.hasOwnProperty.call(t2, i3) && Object.prototype.hasOwnProperty.call(a2.argv, i3) && (Array.isArray(t2[i3]) || Array.isArray(a2.argv[i3])) ? t2[i3] = [].concat(t2[i3], a2.argv[i3]) : t2[i3] = a2.argv[i3]);
          });
        }
      }
      runDefaultBuilderOn(t2) {
        if (!this.defaultCommand)
          return;
        if (this.shouldUpdateUsage(t2)) {
          const e3 = _.test(this.defaultCommand.original) ? this.defaultCommand.original : this.defaultCommand.original.replace(/^[^[\]<>]*/, "$0 ");
          t2.getInternalMethods().getUsageInstance().usage(e3, this.defaultCommand.description);
        }
        const e2 = this.defaultCommand.builder;
        if (E(e2))
          return e2(t2, true);
        k(e2) || Object.keys(e2).forEach((s2) => {
          t2.option(s2, e2[s2]);
        });
      }
      moduleName(t2) {
        const e2 = function(t3) {
          if (typeof require == "undefined")
            return null;
          for (let e3, s2 = 0, i2 = Object.keys(require.cache); s2 < i2.length; s2++)
            if (e3 = require.cache[i2[s2]], e3.exports === t3)
              return e3;
          return null;
        }(t2);
        if (!e2)
          throw new Error(`No command name given for module: ${this.shim.inspect(t2)}`);
        return this.commandFromFilename(e2.filename);
      }
      commandFromFilename(t2) {
        return this.shim.path.basename(t2, this.shim.path.extname(t2));
      }
      extractDesc({ describe: t2, description: e2, desc: s2 }) {
        for (const i2 of [t2, e2, s2]) {
          if (typeof i2 == "string" || i2 === false)
            return i2;
          d(i2, true, this.shim);
        }
        return false;
      }
      freeze() {
        this.frozens.push({ handlers: this.handlers, aliasMap: this.aliasMap, defaultCommand: this.defaultCommand });
      }
      unfreeze() {
        const t2 = this.frozens.pop();
        d(t2, void 0, this.shim), { handlers: this.handlers, aliasMap: this.aliasMap, defaultCommand: this.defaultCommand } = t2;
      }
      reset() {
        return this.handlers = {}, this.aliasMap = {}, this.defaultCommand = void 0, this.requireCache = new Set(), this;
      }
    };
    function k(t2) {
      return typeof t2 == "object" && !!t2.builder && typeof t2.handler == "function";
    }
    function E(t2) {
      return typeof t2 == "function";
    }
    function x(t2) {
      typeof process != "undefined" && [process.stdout, process.stderr].forEach((e2) => {
        const s2 = e2;
        s2._handle && s2.isTTY && typeof s2._handle.setBlocking == "function" && s2._handle.setBlocking(t2);
      });
    }
    function A(t2) {
      return typeof t2 == "boolean";
    }
    function S(t2, s2) {
      const i2 = s2.y18n.__, n2 = {}, r2 = [];
      n2.failFn = function(t3) {
        r2.push(t3);
      };
      let o2 = null, a2 = true;
      n2.showHelpOnFail = function(t3 = true, e2) {
        const [s3, i3] = typeof t3 == "string" ? [true, t3] : [t3, e2];
        return o2 = i3, a2 = s3, n2;
      };
      let h2 = false;
      n2.fail = function(s3, i3) {
        const l3 = t2.getInternalMethods().getLoggerInstance();
        if (!r2.length) {
          if (t2.getExitProcess() && x(true), h2 || (h2 = true, a2 && (t2.showHelp("error"), l3.error()), (s3 || i3) && l3.error(s3 || i3), o2 && ((s3 || i3) && l3.error(""), l3.error(o2))), i3 = i3 || new e(s3), t2.getExitProcess())
            return t2.exit(1);
          if (t2.getInternalMethods().hasParseCallback())
            return t2.exit(1, i3);
          throw i3;
        }
        for (let t3 = r2.length - 1; t3 >= 0; --t3) {
          const e2 = r2[t3];
          if (A(e2)) {
            if (i3)
              throw i3;
            if (s3)
              throw Error(s3);
          } else
            e2(s3, i3, n2);
        }
      };
      let l2 = [], c2 = false;
      n2.usage = (t3, e2) => t3 === null ? (c2 = true, l2 = [], n2) : (c2 = false, l2.push([t3, e2 || ""]), n2), n2.getUsage = () => l2, n2.getUsageDisabled = () => c2, n2.getPositionalGroupName = () => i2("Positionals:");
      let f2 = [];
      n2.example = (t3, e2) => {
        f2.push([t3, e2 || ""]);
      };
      let d2 = [];
      n2.command = function(t3, e2, s3, i3, n3 = false) {
        s3 && (d2 = d2.map((t4) => (t4[2] = false, t4))), d2.push([t3, e2 || "", s3, i3, n3]);
      }, n2.getCommands = () => d2;
      let u2 = {};
      n2.describe = function(t3, e2) {
        Array.isArray(t3) ? t3.forEach((t4) => {
          n2.describe(t4, e2);
        }) : typeof t3 == "object" ? Object.keys(t3).forEach((e3) => {
          n2.describe(e3, t3[e3]);
        }) : u2[t3] = e2;
      }, n2.getDescriptions = () => u2;
      let p2 = [];
      n2.epilog = (t3) => {
        p2.push(t3);
      };
      let m2, y2 = false;
      function b2() {
        return y2 || (m2 = function() {
          const t3 = 80;
          return s2.process.stdColumns ? Math.min(t3, s2.process.stdColumns) : t3;
        }(), y2 = true), m2;
      }
      n2.wrap = (t3) => {
        y2 = true, m2 = t3;
      };
      const v2 = "__yargsString__:";
      function O2(t3, e2, i3) {
        let n3 = 0;
        return Array.isArray(t3) || (t3 = Object.values(t3).map((t4) => [t4])), t3.forEach((t4) => {
          n3 = Math.max(s2.stringWidth(i3 ? `${i3} ${I(t4[0])}` : I(t4[0])) + $(t4[0]), n3);
        }), e2 && (n3 = Math.min(n3, parseInt((0.5 * e2).toString(), 10))), n3;
      }
      let w2;
      function C2(e2) {
        return t2.getOptions().hiddenOptions.indexOf(e2) < 0 || t2.parsed.argv[t2.getOptions().showHiddenOpt];
      }
      function j2(t3, e2) {
        let s3 = `[${i2("default:")} `;
        if (t3 === void 0 && !e2)
          return null;
        if (e2)
          s3 += e2;
        else
          switch (typeof t3) {
            case "string":
              s3 += `"${t3}"`;
              break;
            case "object":
              s3 += JSON.stringify(t3);
              break;
            default:
              s3 += t3;
          }
        return `${s3}]`;
      }
      n2.deferY18nLookup = (t3) => v2 + t3, n2.help = function() {
        if (w2)
          return w2;
        !function() {
          const e3 = t2.getDemandedOptions(), s3 = t2.getOptions();
          (Object.keys(s3.alias) || []).forEach((i3) => {
            s3.alias[i3].forEach((r4) => {
              u2[r4] && n2.describe(i3, u2[r4]), r4 in e3 && t2.demandOption(i3, e3[r4]), s3.boolean.includes(r4) && t2.boolean(i3), s3.count.includes(r4) && t2.count(i3), s3.string.includes(r4) && t2.string(i3), s3.normalize.includes(r4) && t2.normalize(i3), s3.array.includes(r4) && t2.array(i3), s3.number.includes(r4) && t2.number(i3);
            });
          });
        }();
        const e2 = t2.customScriptName ? t2.$0 : s2.path.basename(t2.$0), r3 = t2.getDemandedOptions(), o3 = t2.getDemandedCommands(), a3 = t2.getDeprecatedOptions(), h3 = t2.getGroups(), g2 = t2.getOptions();
        let m3 = [];
        m3 = m3.concat(Object.keys(u2)), m3 = m3.concat(Object.keys(r3)), m3 = m3.concat(Object.keys(o3)), m3 = m3.concat(Object.keys(g2.default)), m3 = m3.filter(C2), m3 = Object.keys(m3.reduce((t3, e3) => (e3 !== "_" && (t3[e3] = true), t3), {}));
        const y3 = b2(), _3 = s2.cliui({ width: y3, wrap: !!y3 });
        if (!c2) {
          if (l2.length)
            l2.forEach((t3) => {
              _3.div({ text: `${t3[0].replace(/\$0/g, e2)}` }), t3[1] && _3.div({ text: `${t3[1]}`, padding: [1, 0, 0, 0] });
            }), _3.div();
          else if (d2.length) {
            let t3 = null;
            t3 = o3._ ? `${e2} <${i2("command")}>
` : `${e2} [${i2("command")}]
`, _3.div(`${t3}`);
          }
        }
        if (d2.length > 1 || d2.length === 1 && !d2[0][2]) {
          _3.div(i2("Commands:"));
          const s3 = t2.getInternalMethods().getContext(), n3 = s3.commands.length ? `${s3.commands.join(" ")} ` : "";
          t2.getInternalMethods().getParserConfiguration()["sort-commands"] === true && (d2 = d2.sort((t3, e3) => t3[0].localeCompare(e3[0])));
          const r4 = e2 ? `${e2} ` : "";
          d2.forEach((t3) => {
            const s4 = `${r4}${n3}${t3[0].replace(/^\$0 ?/, "")}`;
            _3.span({ text: s4, padding: [0, 2, 0, 2], width: O2(d2, y3, `${e2}${n3}`) + 4 }, { text: t3[1] });
            const o4 = [];
            t3[2] && o4.push(`[${i2("default")}]`), t3[3] && t3[3].length && o4.push(`[${i2("aliases:")} ${t3[3].join(", ")}]`), t3[4] && (typeof t3[4] == "string" ? o4.push(`[${i2("deprecated: %s", t3[4])}]`) : o4.push(`[${i2("deprecated")}]`)), o4.length ? _3.div({ text: o4.join(" "), padding: [0, 0, 0, 2], align: "right" }) : _3.div();
          }), _3.div();
        }
        const M3 = (Object.keys(g2.alias) || []).concat(Object.keys(t2.parsed.newAliases) || []);
        m3 = m3.filter((e3) => !t2.parsed.newAliases[e3] && M3.every((t3) => (g2.alias[t3] || []).indexOf(e3) === -1));
        const k2 = i2("Options:");
        h3[k2] || (h3[k2] = []), function(t3, e3, s3, i3) {
          let n3 = [], r4 = null;
          Object.keys(s3).forEach((t4) => {
            n3 = n3.concat(s3[t4]);
          }), t3.forEach((t4) => {
            r4 = [t4].concat(e3[t4]), r4.some((t5) => n3.indexOf(t5) !== -1) || s3[i3].push(t4);
          });
        }(m3, g2.alias, h3, k2);
        const E2 = (t3) => /^--/.test(I(t3)), x2 = Object.keys(h3).filter((t3) => h3[t3].length > 0).map((t3) => ({ groupName: t3, normalizedKeys: h3[t3].filter(C2).map((t4) => {
          if (M3.includes(t4))
            return t4;
          for (let e3, s3 = 0; (e3 = M3[s3]) !== void 0; s3++)
            if ((g2.alias[e3] || []).includes(t4))
              return e3;
          return t4;
        }) })).filter(({ normalizedKeys: t3 }) => t3.length > 0).map(({ groupName: t3, normalizedKeys: e3 }) => {
          const s3 = e3.reduce((e4, s4) => (e4[s4] = [s4].concat(g2.alias[s4] || []).map((e5) => t3 === n2.getPositionalGroupName() ? e5 : (/^[0-9]$/.test(e5) ? g2.boolean.includes(s4) ? "-" : "--" : e5.length > 1 ? "--" : "-") + e5).sort((t4, e5) => E2(t4) === E2(e5) ? 0 : E2(t4) ? 1 : -1).join(", "), e4), {});
          return { groupName: t3, normalizedKeys: e3, switches: s3 };
        });
        if (x2.filter(({ groupName: t3 }) => t3 !== n2.getPositionalGroupName()).some(({ normalizedKeys: t3, switches: e3 }) => !t3.every((t4) => E2(e3[t4]))) && x2.filter(({ groupName: t3 }) => t3 !== n2.getPositionalGroupName()).forEach(({ normalizedKeys: t3, switches: e3 }) => {
          t3.forEach((t4) => {
            var s3, i3;
            E2(e3[t4]) && (e3[t4] = (s3 = e3[t4], i3 = "-x, ".length, P(s3) ? { text: s3.text, indentation: s3.indentation + i3 } : { text: s3, indentation: i3 }));
          });
        }), x2.forEach(({ groupName: t3, normalizedKeys: e3, switches: s3 }) => {
          _3.div(t3), e3.forEach((t4) => {
            const e4 = s3[t4];
            let o4 = u2[t4] || "", h4 = null;
            o4.includes(v2) && (o4 = i2(o4.substring(v2.length))), g2.boolean.includes(t4) && (h4 = `[${i2("boolean")}]`), g2.count.includes(t4) && (h4 = `[${i2("count")}]`), g2.string.includes(t4) && (h4 = `[${i2("string")}]`), g2.normalize.includes(t4) && (h4 = `[${i2("string")}]`), g2.array.includes(t4) && (h4 = `[${i2("array")}]`), g2.number.includes(t4) && (h4 = `[${i2("number")}]`);
            const l3 = [t4 in a3 ? (c3 = a3[t4], typeof c3 == "string" ? `[${i2("deprecated: %s", c3)}]` : `[${i2("deprecated")}]`) : null, h4, t4 in r3 ? `[${i2("required")}]` : null, g2.choices && g2.choices[t4] ? `[${i2("choices:")} ${n2.stringifiedValues(g2.choices[t4])}]` : null, j2(g2.default[t4], g2.defaultDescription[t4])].filter(Boolean).join(" ");
            var c3;
            _3.span({ text: I(e4), padding: [0, 2, 0, 2 + $(e4)], width: O2(s3, y3) + 4 }, o4), l3 ? _3.div({ text: l3, padding: [0, 0, 0, 2], align: "right" }) : _3.div();
          }), _3.div();
        }), f2.length && (_3.div(i2("Examples:")), f2.forEach((t3) => {
          t3[0] = t3[0].replace(/\$0/g, e2);
        }), f2.forEach((t3) => {
          t3[1] === "" ? _3.div({ text: t3[0], padding: [0, 2, 0, 2] }) : _3.div({ text: t3[0], padding: [0, 2, 0, 2], width: O2(f2, y3) + 4 }, { text: t3[1] });
        }), _3.div()), p2.length > 0) {
          const t3 = p2.map((t4) => t4.replace(/\$0/g, e2)).join("\n");
          _3.div(`${t3}
`);
        }
        return _3.toString().replace(/\s*$/, "");
      }, n2.cacheHelpMessage = function() {
        w2 = this.help();
      }, n2.clearCachedHelpMessage = function() {
        w2 = void 0;
      }, n2.hasCachedHelpMessage = function() {
        return !!w2;
      }, n2.showHelp = (e2) => {
        const s3 = t2.getInternalMethods().getLoggerInstance();
        e2 || (e2 = "error");
        (typeof e2 == "function" ? e2 : s3[e2])(n2.help());
      }, n2.functionDescription = (t3) => ["(", t3.name ? s2.Parser.decamelize(t3.name, "-") : i2("generated-value"), ")"].join(""), n2.stringifiedValues = function(t3, e2) {
        let s3 = "";
        const i3 = e2 || ", ", n3 = [].concat(t3);
        return t3 && n3.length ? (n3.forEach((t4) => {
          s3.length && (s3 += i3), s3 += JSON.stringify(t4);
        }), s3) : s3;
      };
      let _2 = null;
      n2.version = (t3) => {
        _2 = t3;
      }, n2.showVersion = (e2) => {
        const s3 = t2.getInternalMethods().getLoggerInstance();
        e2 || (e2 = "error");
        (typeof e2 == "function" ? e2 : s3[e2])(_2);
      }, n2.reset = function(t3) {
        return o2 = null, h2 = false, l2 = [], c2 = false, p2 = [], f2 = [], d2 = [], u2 = g(u2, (e2) => !t3[e2]), n2;
      };
      const M2 = [];
      return n2.freeze = function() {
        M2.push({ failMessage: o2, failureOutput: h2, usages: l2, usageDisabled: c2, epilogs: p2, examples: f2, commands: d2, descriptions: u2 });
      }, n2.unfreeze = function() {
        const t3 = M2.pop();
        t3 && ({ failMessage: o2, failureOutput: h2, usages: l2, usageDisabled: c2, epilogs: p2, examples: f2, commands: d2, descriptions: u2 } = t3);
      }, n2;
    }
    function P(t2) {
      return typeof t2 == "object";
    }
    function $(t2) {
      return P(t2) ? t2.indentation : 0;
    }
    function I(t2) {
      return P(t2) ? t2.text : t2;
    }
    var D = class {
      constructor(t2, e2, s2, i2) {
        var n2, r2, o2;
        this.yargs = t2, this.usage = e2, this.command = s2, this.shim = i2, this.completionKey = "get-yargs-completions", this.aliases = null, this.customCompletionFunction = null, this.zshShell = (o2 = ((n2 = this.shim.getEnv("SHELL")) === null || n2 === void 0 ? void 0 : n2.includes("zsh")) || ((r2 = this.shim.getEnv("ZSH_NAME")) === null || r2 === void 0 ? void 0 : r2.includes("zsh"))) !== null && o2 !== void 0 && o2;
      }
      defaultCompletion(t2, e2, s2, i2) {
        const n2 = this.command.getCommandHandlers();
        for (let e3 = 0, s3 = t2.length; e3 < s3; ++e3)
          if (n2[t2[e3]] && n2[t2[e3]].builder) {
            const s4 = n2[t2[e3]].builder;
            if (E(s4)) {
              const t3 = this.yargs.getInternalMethods().reset();
              return s4(t3, true), t3.argv;
            }
          }
        const r2 = [];
        this.commandCompletions(r2, t2, s2), this.optionCompletions(r2, t2, e2, s2), this.choicesCompletions(r2, t2, e2, s2), i2(null, r2);
      }
      commandCompletions(t2, e2, s2) {
        const i2 = this.yargs.getInternalMethods().getContext().commands;
        s2.match(/^-/) || i2[i2.length - 1] === s2 || this.previousArgHasChoices(e2) || this.usage.getCommands().forEach((s3) => {
          const i3 = o(s3[0]).cmd;
          if (e2.indexOf(i3) === -1)
            if (this.zshShell) {
              const e3 = s3[1] || "";
              t2.push(i3.replace(/:/g, "\\:") + ":" + e3);
            } else
              t2.push(i3);
        });
      }
      optionCompletions(t2, e2, s2, i2) {
        if ((i2.match(/^-/) || i2 === "" && t2.length === 0) && !this.previousArgHasChoices(e2)) {
          const n2 = this.yargs.getOptions(), r2 = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
          Object.keys(n2.key).forEach((o2) => {
            const a2 = !!n2.configuration["boolean-negation"] && n2.boolean.includes(o2);
            r2.includes(o2) || this.argsContainKey(e2, s2, o2, a2) || (this.completeOptionKey(o2, t2, i2), a2 && n2.default[o2] && this.completeOptionKey(`no-${o2}`, t2, i2));
          });
        }
      }
      choicesCompletions(t2, e2, s2, i2) {
        if (this.previousArgHasChoices(e2)) {
          const s3 = this.getPreviousArgChoices(e2);
          s3 && s3.length > 0 && t2.push(...s3);
        }
      }
      getPreviousArgChoices(t2) {
        if (t2.length < 1)
          return;
        let e2 = t2[t2.length - 1], s2 = "";
        if (!e2.startsWith("--") && t2.length > 1 && (s2 = e2, e2 = t2[t2.length - 2]), !e2.startsWith("--"))
          return;
        const i2 = e2.replace(/-/g, ""), n2 = this.yargs.getOptions();
        return Object.keys(n2.key).some((t3) => t3 === i2) && Array.isArray(n2.choices[i2]) ? n2.choices[i2].filter((t3) => !s2 || t3.startsWith(s2)) : void 0;
      }
      previousArgHasChoices(t2) {
        const e2 = this.getPreviousArgChoices(t2);
        return e2 !== void 0 && e2.length > 0;
      }
      argsContainKey(t2, e2, s2, i2) {
        if (t2.indexOf(`--${s2}`) !== -1)
          return true;
        if (i2 && t2.indexOf(`--no-${s2}`) !== -1)
          return true;
        if (this.aliases) {
          for (const t3 of this.aliases[s2])
            if (e2[t3] !== void 0)
              return true;
        }
        return false;
      }
      completeOptionKey(t2, e2, s2) {
        const i2 = this.usage.getDescriptions(), n2 = !/^--/.test(s2) && ((t3) => /^[^0-9]$/.test(t3))(t2) ? "-" : "--";
        if (this.zshShell) {
          const s3 = i2[t2] || "";
          e2.push(n2 + `${t2.replace(/:/g, "\\:")}:${s3.replace("__yargsString__:", "")}`);
        } else
          e2.push(n2 + t2);
      }
      customCompletion(t2, e2, s2, i2) {
        if (d(this.customCompletionFunction, null, this.shim), this.customCompletionFunction.length < 3) {
          const t3 = this.customCompletionFunction(s2, e2);
          return f(t3) ? t3.then((t4) => {
            this.shim.process.nextTick(() => {
              i2(null, t4);
            });
          }).catch((t4) => {
            this.shim.process.nextTick(() => {
              i2(t4, void 0);
            });
          }) : i2(null, t3);
        }
        return function(t3) {
          return t3.length > 3;
        }(this.customCompletionFunction) ? this.customCompletionFunction(s2, e2, (n2 = i2) => this.defaultCompletion(t2, e2, s2, n2), (t3) => {
          i2(null, t3);
        }) : this.customCompletionFunction(s2, e2, (t3) => {
          i2(null, t3);
        });
      }
      getCompletion(t2, e2) {
        const s2 = t2.length ? t2[t2.length - 1] : "", i2 = this.yargs.parse(t2, true), n2 = this.customCompletionFunction ? (i3) => this.customCompletion(t2, i3, s2, e2) : (i3) => this.defaultCompletion(t2, i3, s2, e2);
        return f(i2) ? i2.then(n2) : n2(i2);
      }
      generateCompletionScript(t2, e2) {
        let s2 = this.zshShell ? `#compdef {{app_name}}
###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.zshrc
#    or {{app_path}} {{completion_command}} >> ~/.zsh_profile on OSX.
#
_{{app_name}}_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" {{app_path}} --get-yargs-completions "\${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
` : '###-begin-{{app_name}}-completions-###\n#\n# yargs command completion script\n#\n# Installation: {{app_path}} {{completion_command}} >> ~/.bashrc\n#    or {{app_path}} {{completion_command}} >> ~/.bash_profile on OSX.\n#\n_{{app_name}}_yargs_completions()\n{\n    local cur_word args type_list\n\n    cur_word="${COMP_WORDS[COMP_CWORD]}"\n    args=("${COMP_WORDS[@]}")\n\n    # ask yargs to generate completions.\n    type_list=$({{app_path}} --get-yargs-completions "${args[@]}")\n\n    COMPREPLY=( $(compgen -W "${type_list}" -- ${cur_word}) )\n\n    # if no match was found, fall back to filename completion\n    if [ ${#COMPREPLY[@]} -eq 0 ]; then\n      COMPREPLY=()\n    fi\n\n    return 0\n}\ncomplete -o default -F _{{app_name}}_yargs_completions {{app_name}}\n###-end-{{app_name}}-completions-###\n';
        const i2 = this.shim.path.basename(t2);
        return t2.match(/\.js$/) && (t2 = `./${t2}`), s2 = s2.replace(/{{app_name}}/g, i2), s2 = s2.replace(/{{completion_command}}/g, e2), s2.replace(/{{app_path}}/g, t2);
      }
      registerFunction(t2) {
        this.customCompletionFunction = t2;
      }
      setParsed(t2) {
        this.aliases = t2.aliases;
      }
    };
    function N(t2, e2) {
      if (t2.length === 0)
        return e2.length;
      if (e2.length === 0)
        return t2.length;
      const s2 = [];
      let i2, n2;
      for (i2 = 0; i2 <= e2.length; i2++)
        s2[i2] = [i2];
      for (n2 = 0; n2 <= t2.length; n2++)
        s2[0][n2] = n2;
      for (i2 = 1; i2 <= e2.length; i2++)
        for (n2 = 1; n2 <= t2.length; n2++)
          e2.charAt(i2 - 1) === t2.charAt(n2 - 1) ? s2[i2][n2] = s2[i2 - 1][n2 - 1] : i2 > 1 && n2 > 1 && e2.charAt(i2 - 2) === t2.charAt(n2 - 1) && e2.charAt(i2 - 1) === t2.charAt(n2 - 2) ? s2[i2][n2] = s2[i2 - 2][n2 - 2] + 1 : s2[i2][n2] = Math.min(s2[i2 - 1][n2 - 1] + 1, Math.min(s2[i2][n2 - 1] + 1, s2[i2 - 1][n2] + 1));
      return s2[e2.length][t2.length];
    }
    var H = ["$0", "--", "_"];
    var z;
    var q;
    var W;
    var U;
    var F;
    var L;
    var V;
    var T;
    var R;
    var G;
    var K;
    var B;
    var Y;
    var J;
    var Z;
    var X;
    var Q;
    var tt;
    var et;
    var st;
    var it;
    var nt;
    var rt;
    var ot;
    var at;
    var ht;
    var lt;
    var ct;
    var ft;
    var dt;
    var ut;
    var pt;
    var gt;
    var mt = Symbol("copyDoubleDash");
    var yt = Symbol("copyDoubleDash");
    var bt = Symbol("deleteFromParserHintObject");
    var vt = Symbol("emitWarning");
    var Ot = Symbol("freeze");
    var wt = Symbol("getDollarZero");
    var Ct = Symbol("getParserConfiguration");
    var jt = Symbol("guessLocale");
    var _t = Symbol("guessVersion");
    var Mt = Symbol("parsePositionalNumbers");
    var kt = Symbol("pkgUp");
    var Et = Symbol("populateParserHintArray");
    var xt = Symbol("populateParserHintSingleValueDictionary");
    var At = Symbol("populateParserHintArrayDictionary");
    var St = Symbol("populateParserHintDictionary");
    var Pt = Symbol("sanitizeKey");
    var $t = Symbol("setKey");
    var It = Symbol("unfreeze");
    var Dt = Symbol("validateAsync");
    var Nt = Symbol("getCommandInstance");
    var Ht = Symbol("getContext");
    var zt = Symbol("getHasOutput");
    var qt = Symbol("getLoggerInstance");
    var Wt = Symbol("getParseContext");
    var Ut = Symbol("getUsageInstance");
    var Ft = Symbol("getValidationInstance");
    var Lt = Symbol("hasParseCallback");
    var Vt = Symbol("postProcess");
    var Tt = Symbol("rebase");
    var Rt = Symbol("reset");
    var Gt = Symbol("runYargsParserAndExecuteCommands");
    var Kt = Symbol("runValidation");
    var Bt = Symbol("setHasOutput");
    var Yt = Symbol("kTrackManuallySetKeys");
    var Jt = class {
      constructor(t2 = [], e2, s2, i2) {
        this.customScriptName = false, this.parsed = false, z.set(this, void 0), q.set(this, void 0), W.set(this, { commands: [], fullCommands: [] }), U.set(this, null), F.set(this, null), L.set(this, "show-hidden"), V.set(this, null), T.set(this, true), R.set(this, {}), G.set(this, true), K.set(this, []), B.set(this, void 0), Y.set(this, {}), J.set(this, false), Z.set(this, null), X.set(this, void 0), Q.set(this, ""), tt.set(this, void 0), et.set(this, void 0), st.set(this, {}), it.set(this, null), nt.set(this, null), rt.set(this, {}), ot.set(this, {}), at.set(this, void 0), ht.set(this, false), lt.set(this, void 0), ct.set(this, false), ft.set(this, false), dt.set(this, false), ut.set(this, void 0), pt.set(this, null), gt.set(this, void 0), O(this, lt, i2, "f"), O(this, at, t2, "f"), O(this, q, e2, "f"), O(this, et, s2, "f"), O(this, B, new w(this), "f"), this.$0 = this[wt](), this[Rt](), O(this, z, v(this, z, "f"), "f"), O(this, ut, v(this, ut, "f"), "f"), O(this, gt, v(this, gt, "f"), "f"), O(this, tt, v(this, tt, "f"), "f"), v(this, tt, "f").showHiddenOpt = v(this, L, "f"), O(this, X, this[yt](), "f");
      }
      addHelpOpt(t2, e2) {
        return h("[string|boolean] [string]", [t2, e2], arguments.length), v(this, Z, "f") && (this[bt](v(this, Z, "f")), O(this, Z, null, "f")), t2 === false && e2 === void 0 || (O(this, Z, typeof t2 == "string" ? t2 : "help", "f"), this.boolean(v(this, Z, "f")), this.describe(v(this, Z, "f"), e2 || v(this, ut, "f").deferY18nLookup("Show help"))), this;
      }
      help(t2, e2) {
        return this.addHelpOpt(t2, e2);
      }
      addShowHiddenOpt(t2, e2) {
        if (h("[string|boolean] [string]", [t2, e2], arguments.length), t2 === false && e2 === void 0)
          return this;
        const s2 = typeof t2 == "string" ? t2 : v(this, L, "f");
        return this.boolean(s2), this.describe(s2, e2 || v(this, ut, "f").deferY18nLookup("Show hidden options")), v(this, tt, "f").showHiddenOpt = s2, this;
      }
      showHidden(t2, e2) {
        return this.addShowHiddenOpt(t2, e2);
      }
      alias(t2, e2) {
        return h("<object|string|array> [string|array]", [t2, e2], arguments.length), this[At](this.alias.bind(this), "alias", t2, e2), this;
      }
      array(t2) {
        return h("<array|string>", [t2], arguments.length), this[Et]("array", t2), this[Yt](t2), this;
      }
      boolean(t2) {
        return h("<array|string>", [t2], arguments.length), this[Et]("boolean", t2), this[Yt](t2), this;
      }
      check(t2, e2) {
        return h("<function> [boolean]", [t2, e2], arguments.length), this.middleware((e3, s2) => j(() => t2(e3), (s3) => (s3 ? (typeof s3 == "string" || s3 instanceof Error) && v(this, ut, "f").fail(s3.toString(), s3) : v(this, ut, "f").fail(v(this, lt, "f").y18n.__("Argument check failed: %s", t2.toString())), e3), (t3) => (v(this, ut, "f").fail(t3.message ? t3.message : t3.toString(), t3), e3)), false, e2), this;
      }
      choices(t2, e2) {
        return h("<object|string|array> [string|array]", [t2, e2], arguments.length), this[At](this.choices.bind(this), "choices", t2, e2), this;
      }
      coerce(t2, s2) {
        if (h("<object|string|array> [function]", [t2, s2], arguments.length), Array.isArray(t2)) {
          if (!s2)
            throw new e("coerce callback must be provided");
          for (const e2 of t2)
            this.coerce(e2, s2);
          return this;
        }
        if (typeof t2 == "object") {
          for (const e2 of Object.keys(t2))
            this.coerce(e2, t2[e2]);
          return this;
        }
        if (!s2)
          throw new e("coerce callback must be provided");
        return v(this, tt, "f").key[t2] = true, v(this, B, "f").addCoerceMiddleware((i2, n2) => {
          let r2;
          return j(() => (r2 = n2.getAliases(), s2(i2[t2])), (e2) => {
            if (i2[t2] = e2, r2[t2])
              for (const s3 of r2[t2])
                i2[s3] = e2;
            return i2;
          }, (t3) => {
            throw new e(t3.message);
          });
        }, t2), this;
      }
      conflicts(t2, e2) {
        return h("<string|object> [string|array]", [t2, e2], arguments.length), v(this, gt, "f").conflicts(t2, e2), this;
      }
      config(t2 = "config", e2, s2) {
        return h("[object|string] [string|function] [function]", [t2, e2, s2], arguments.length), typeof t2 != "object" || Array.isArray(t2) ? (typeof e2 == "function" && (s2 = e2, e2 = void 0), this.describe(t2, e2 || v(this, ut, "f").deferY18nLookup("Path to JSON config file")), (Array.isArray(t2) ? t2 : [t2]).forEach((t3) => {
          v(this, tt, "f").config[t3] = s2 || true;
        }), this) : (t2 = n(t2, v(this, q, "f"), this[Ct]()["deep-merge-config"] || false, v(this, lt, "f")), v(this, tt, "f").configObjects = (v(this, tt, "f").configObjects || []).concat(t2), this);
      }
      completion(t2, e2, s2) {
        return h("[string] [string|boolean|function] [function]", [t2, e2, s2], arguments.length), typeof e2 == "function" && (s2 = e2, e2 = void 0), O(this, F, t2 || v(this, F, "f") || "completion", "f"), e2 || e2 === false || (e2 = "generate completion script"), this.command(v(this, F, "f"), e2), s2 && v(this, U, "f").registerFunction(s2), this;
      }
      command(t2, e2, s2, i2, n2, r2) {
        return h("<string|array|object> [string|boolean] [function|object] [function] [array] [boolean|string]", [t2, e2, s2, i2, n2, r2], arguments.length), v(this, z, "f").addHandler(t2, e2, s2, i2, n2, r2), this;
      }
      commands(t2, e2, s2, i2, n2, r2) {
        return this.command(t2, e2, s2, i2, n2, r2);
      }
      commandDir(t2, e2) {
        h("<string> [object]", [t2, e2], arguments.length);
        const s2 = v(this, et, "f") || v(this, lt, "f").require;
        return v(this, z, "f").addDirectory(t2, s2, v(this, lt, "f").getCallerFile(), e2), this;
      }
      count(t2) {
        return h("<array|string>", [t2], arguments.length), this[Et]("count", t2), this[Yt](t2), this;
      }
      default(t2, e2, s2) {
        return h("<object|string|array> [*] [string]", [t2, e2, s2], arguments.length), s2 && (u(t2, v(this, lt, "f")), v(this, tt, "f").defaultDescription[t2] = s2), typeof e2 == "function" && (u(t2, v(this, lt, "f")), v(this, tt, "f").defaultDescription[t2] || (v(this, tt, "f").defaultDescription[t2] = v(this, ut, "f").functionDescription(e2)), e2 = e2.call()), this[xt](this.default.bind(this), "default", t2, e2), this;
      }
      defaults(t2, e2, s2) {
        return this.default(t2, e2, s2);
      }
      demandCommand(t2 = 1, e2, s2, i2) {
        return h("[number] [number|string] [string|null|undefined] [string|null|undefined]", [t2, e2, s2, i2], arguments.length), typeof e2 != "number" && (s2 = e2, e2 = 1 / 0), this.global("_", false), v(this, tt, "f").demandedCommands._ = { min: t2, max: e2, minMsg: s2, maxMsg: i2 }, this;
      }
      demand(t2, e2, s2) {
        return Array.isArray(e2) ? (e2.forEach((t3) => {
          d(s2, true, v(this, lt, "f")), this.demandOption(t3, s2);
        }), e2 = 1 / 0) : typeof e2 != "number" && (s2 = e2, e2 = 1 / 0), typeof t2 == "number" ? (d(s2, true, v(this, lt, "f")), this.demandCommand(t2, e2, s2, s2)) : Array.isArray(t2) ? t2.forEach((t3) => {
          d(s2, true, v(this, lt, "f")), this.demandOption(t3, s2);
        }) : typeof s2 == "string" ? this.demandOption(t2, s2) : s2 !== true && s2 !== void 0 || this.demandOption(t2), this;
      }
      demandOption(t2, e2) {
        return h("<object|string|array> [string]", [t2, e2], arguments.length), this[xt](this.demandOption.bind(this), "demandedOptions", t2, e2), this;
      }
      deprecateOption(t2, e2) {
        return h("<string> [string|boolean]", [t2, e2], arguments.length), v(this, tt, "f").deprecatedOptions[t2] = e2, this;
      }
      describe(t2, e2) {
        return h("<object|string|array> [string]", [t2, e2], arguments.length), this[$t](t2, true), v(this, ut, "f").describe(t2, e2), this;
      }
      detectLocale(t2) {
        return h("<boolean>", [t2], arguments.length), O(this, T, t2, "f"), this;
      }
      env(t2) {
        return h("[string|boolean]", [t2], arguments.length), t2 === false ? delete v(this, tt, "f").envPrefix : v(this, tt, "f").envPrefix = t2 || "", this;
      }
      epilogue(t2) {
        return h("<string>", [t2], arguments.length), v(this, ut, "f").epilog(t2), this;
      }
      epilog(t2) {
        return this.epilogue(t2);
      }
      example(t2, e2) {
        return h("<string|array> [string]", [t2, e2], arguments.length), Array.isArray(t2) ? t2.forEach((t3) => this.example(...t3)) : v(this, ut, "f").example(t2, e2), this;
      }
      exit(t2, e2) {
        O(this, J, true, "f"), O(this, V, e2, "f"), v(this, G, "f") && v(this, lt, "f").process.exit(t2);
      }
      exitProcess(t2 = true) {
        return h("[boolean]", [t2], arguments.length), O(this, G, t2, "f"), this;
      }
      fail(t2) {
        if (h("<function|boolean>", [t2], arguments.length), typeof t2 == "boolean" && t2 !== false)
          throw new e("Invalid first argument. Expected function or boolean 'false'");
        return v(this, ut, "f").failFn(t2), this;
      }
      getAliases() {
        return this.parsed ? this.parsed.aliases : {};
      }
      async getCompletion(t2, e2) {
        return h("<array> [function]", [t2, e2], arguments.length), e2 ? v(this, U, "f").getCompletion(t2, e2) : new Promise((e3, s2) => {
          v(this, U, "f").getCompletion(t2, (t3, i2) => {
            t3 ? s2(t3) : e3(i2);
          });
        });
      }
      getDemandedOptions() {
        return h([], 0), v(this, tt, "f").demandedOptions;
      }
      getDemandedCommands() {
        return h([], 0), v(this, tt, "f").demandedCommands;
      }
      getDeprecatedOptions() {
        return h([], 0), v(this, tt, "f").deprecatedOptions;
      }
      getDetectLocale() {
        return v(this, T, "f");
      }
      getExitProcess() {
        return v(this, G, "f");
      }
      getGroups() {
        return Object.assign({}, v(this, Y, "f"), v(this, ot, "f"));
      }
      getHelp() {
        if (O(this, J, true, "f"), !v(this, ut, "f").hasCachedHelpMessage()) {
          if (!this.parsed) {
            const t3 = this[Gt](v(this, at, "f"), void 0, void 0, 0, true);
            if (f(t3))
              return t3.then(() => v(this, ut, "f").help());
          }
          const t2 = v(this, z, "f").runDefaultBuilderOn(this);
          if (f(t2))
            return t2.then(() => v(this, ut, "f").help());
        }
        return Promise.resolve(v(this, ut, "f").help());
      }
      getOptions() {
        return v(this, tt, "f");
      }
      getStrict() {
        return v(this, ct, "f");
      }
      getStrictCommands() {
        return v(this, ft, "f");
      }
      getStrictOptions() {
        return v(this, dt, "f");
      }
      global(t2, e2) {
        return h("<string|array> [boolean]", [t2, e2], arguments.length), t2 = [].concat(t2), e2 !== false ? v(this, tt, "f").local = v(this, tt, "f").local.filter((e3) => t2.indexOf(e3) === -1) : t2.forEach((t3) => {
          v(this, tt, "f").local.includes(t3) || v(this, tt, "f").local.push(t3);
        }), this;
      }
      group(t2, e2) {
        h("<string|array> <string>", [t2, e2], arguments.length);
        const s2 = v(this, ot, "f")[e2] || v(this, Y, "f")[e2];
        v(this, ot, "f")[e2] && delete v(this, ot, "f")[e2];
        const i2 = {};
        return v(this, Y, "f")[e2] = (s2 || []).concat(t2).filter((t3) => !i2[t3] && (i2[t3] = true)), this;
      }
      hide(t2) {
        return h("<string>", [t2], arguments.length), v(this, tt, "f").hiddenOptions.push(t2), this;
      }
      implies(t2, e2) {
        return h("<string|object> [number|string|array]", [t2, e2], arguments.length), v(this, gt, "f").implies(t2, e2), this;
      }
      locale(t2) {
        return h("[string]", [t2], arguments.length), t2 ? (O(this, T, false, "f"), v(this, lt, "f").y18n.setLocale(t2), this) : (this[jt](), v(this, lt, "f").y18n.getLocale());
      }
      middleware(t2, e2, s2) {
        return v(this, B, "f").addMiddleware(t2, !!e2, s2);
      }
      nargs(t2, e2) {
        return h("<string|object|array> [number]", [t2, e2], arguments.length), this[xt](this.nargs.bind(this), "narg", t2, e2), this;
      }
      normalize(t2) {
        return h("<array|string>", [t2], arguments.length), this[Et]("normalize", t2), this;
      }
      number(t2) {
        return h("<array|string>", [t2], arguments.length), this[Et]("number", t2), this[Yt](t2), this;
      }
      option(t2, e2) {
        if (h("<string|object> [object]", [t2, e2], arguments.length), typeof t2 == "object")
          Object.keys(t2).forEach((e3) => {
            this.options(e3, t2[e3]);
          });
        else {
          typeof e2 != "object" && (e2 = {}), this[Yt](t2), !v(this, pt, "f") || t2 !== "version" && (e2 == null ? void 0 : e2.alias) !== "version" || this[vt](['"version" is a reserved word.', "Please do one of the following:", '- Disable version with `yargs.version(false)` if using "version" as an option', "- Use the built-in `yargs.version` method instead (if applicable)", "- Use a different option key", "https://yargs.js.org/docs/#api-reference-version"].join("\n"), void 0, "versionWarning"), v(this, tt, "f").key[t2] = true, e2.alias && this.alias(t2, e2.alias);
          const s2 = e2.deprecate || e2.deprecated;
          s2 && this.deprecateOption(t2, s2);
          const i2 = e2.demand || e2.required || e2.require;
          i2 && this.demand(t2, i2), e2.demandOption && this.demandOption(t2, typeof e2.demandOption == "string" ? e2.demandOption : void 0), e2.conflicts && this.conflicts(t2, e2.conflicts), "default" in e2 && this.default(t2, e2.default), e2.implies !== void 0 && this.implies(t2, e2.implies), e2.nargs !== void 0 && this.nargs(t2, e2.nargs), e2.config && this.config(t2, e2.configParser), e2.normalize && this.normalize(t2), e2.choices && this.choices(t2, e2.choices), e2.coerce && this.coerce(t2, e2.coerce), e2.group && this.group(t2, e2.group), (e2.boolean || e2.type === "boolean") && (this.boolean(t2), e2.alias && this.boolean(e2.alias)), (e2.array || e2.type === "array") && (this.array(t2), e2.alias && this.array(e2.alias)), (e2.number || e2.type === "number") && (this.number(t2), e2.alias && this.number(e2.alias)), (e2.string || e2.type === "string") && (this.string(t2), e2.alias && this.string(e2.alias)), (e2.count || e2.type === "count") && this.count(t2), typeof e2.global == "boolean" && this.global(t2, e2.global), e2.defaultDescription && (v(this, tt, "f").defaultDescription[t2] = e2.defaultDescription), e2.skipValidation && this.skipValidation(t2);
          const n2 = e2.describe || e2.description || e2.desc;
          this.describe(t2, n2), e2.hidden && this.hide(t2), e2.requiresArg && this.requiresArg(t2);
        }
        return this;
      }
      options(t2, e2) {
        return this.option(t2, e2);
      }
      parse(t2, e2, s2) {
        h("[string|array] [function|boolean|object] [function]", [t2, e2, s2], arguments.length), this[Ot](), t2 === void 0 && (t2 = v(this, at, "f")), typeof e2 == "object" && (O(this, nt, e2, "f"), e2 = s2), typeof e2 == "function" && (O(this, it, e2, "f"), e2 = false), e2 || O(this, at, t2, "f"), v(this, it, "f") && O(this, G, false, "f");
        const i2 = this[Gt](t2, !!e2), n2 = this.parsed;
        return v(this, U, "f").setParsed(this.parsed), f(i2) ? i2.then((t3) => (v(this, it, "f") && v(this, it, "f").call(this, v(this, V, "f"), t3, v(this, Q, "f")), t3)).catch((t3) => {
          throw v(this, it, "f") && v(this, it, "f")(t3, this.parsed.argv, v(this, Q, "f")), t3;
        }).finally(() => {
          this[It](), this.parsed = n2;
        }) : (v(this, it, "f") && v(this, it, "f").call(this, v(this, V, "f"), i2, v(this, Q, "f")), this[It](), this.parsed = n2, i2);
      }
      parseAsync(t2, e2, s2) {
        const i2 = this.parse(t2, e2, s2);
        return f(i2) ? i2 : Promise.resolve(i2);
      }
      parseSync(t2, s2, i2) {
        const n2 = this.parse(t2, s2, i2);
        if (f(n2))
          throw new e(".parseSync() must not be used with asynchronous builders, handlers, or middleware");
        return n2;
      }
      parserConfiguration(t2) {
        return h("<object>", [t2], arguments.length), O(this, st, t2, "f"), this;
      }
      pkgConf(t2, e2) {
        h("<string> [string]", [t2, e2], arguments.length);
        let s2 = null;
        const i2 = this[kt](e2 || v(this, q, "f"));
        return i2[t2] && typeof i2[t2] == "object" && (s2 = n(i2[t2], e2 || v(this, q, "f"), this[Ct]()["deep-merge-config"] || false, v(this, lt, "f")), v(this, tt, "f").configObjects = (v(this, tt, "f").configObjects || []).concat(s2)), this;
      }
      positional(t2, e2) {
        h("<string> <object>", [t2, e2], arguments.length);
        const s2 = ["default", "defaultDescription", "implies", "normalize", "choices", "conflicts", "coerce", "type", "describe", "desc", "description", "alias"];
        e2 = g(e2, (t3, e3) => !(t3 === "type" && !["string", "number", "boolean"].includes(e3)) && s2.includes(t3));
        const i2 = v(this, W, "f").fullCommands[v(this, W, "f").fullCommands.length - 1], n2 = i2 ? v(this, z, "f").cmdToParseOptions(i2) : { array: [], alias: {}, default: {}, demand: {} };
        return p(n2).forEach((s3) => {
          const i3 = n2[s3];
          Array.isArray(i3) ? i3.indexOf(t2) !== -1 && (e2[s3] = true) : i3[t2] && !(s3 in e2) && (e2[s3] = i3[t2]);
        }), this.group(t2, v(this, ut, "f").getPositionalGroupName()), this.option(t2, e2);
      }
      recommendCommands(t2 = true) {
        return h("[boolean]", [t2], arguments.length), O(this, ht, t2, "f"), this;
      }
      required(t2, e2, s2) {
        return this.demand(t2, e2, s2);
      }
      require(t2, e2, s2) {
        return this.demand(t2, e2, s2);
      }
      requiresArg(t2) {
        return h("<array|string|object> [number]", [t2], arguments.length), typeof t2 == "string" && v(this, tt, "f").narg[t2] || this[xt](this.requiresArg.bind(this), "narg", t2, NaN), this;
      }
      showCompletionScript(t2, e2) {
        return h("[string] [string]", [t2, e2], arguments.length), t2 = t2 || this.$0, v(this, X, "f").log(v(this, U, "f").generateCompletionScript(t2, e2 || v(this, F, "f") || "completion")), this;
      }
      showHelp(t2) {
        if (h("[string|function]", [t2], arguments.length), O(this, J, true, "f"), !v(this, ut, "f").hasCachedHelpMessage()) {
          if (!this.parsed) {
            const e3 = this[Gt](v(this, at, "f"), void 0, void 0, 0, true);
            if (f(e3))
              return e3.then(() => {
                v(this, ut, "f").showHelp(t2);
              }), this;
          }
          const e2 = v(this, z, "f").runDefaultBuilderOn(this);
          if (f(e2))
            return e2.then(() => {
              v(this, ut, "f").showHelp(t2);
            }), this;
        }
        return v(this, ut, "f").showHelp(t2), this;
      }
      scriptName(t2) {
        return this.customScriptName = true, this.$0 = t2, this;
      }
      showHelpOnFail(t2, e2) {
        return h("[boolean|string] [string]", [t2, e2], arguments.length), v(this, ut, "f").showHelpOnFail(t2, e2), this;
      }
      showVersion(t2) {
        return h("[string|function]", [t2], arguments.length), v(this, ut, "f").showVersion(t2), this;
      }
      skipValidation(t2) {
        return h("<array|string>", [t2], arguments.length), this[Et]("skipValidation", t2), this;
      }
      strict(t2) {
        return h("[boolean]", [t2], arguments.length), O(this, ct, t2 !== false, "f"), this;
      }
      strictCommands(t2) {
        return h("[boolean]", [t2], arguments.length), O(this, ft, t2 !== false, "f"), this;
      }
      strictOptions(t2) {
        return h("[boolean]", [t2], arguments.length), O(this, dt, t2 !== false, "f"), this;
      }
      string(t2) {
        return h("<array|string>", [t2], arguments.length), this[Et]("string", t2), this[Yt](t2), this;
      }
      terminalWidth() {
        return h([], 0), v(this, lt, "f").process.stdColumns;
      }
      updateLocale(t2) {
        return this.updateStrings(t2);
      }
      updateStrings(t2) {
        return h("<object>", [t2], arguments.length), O(this, T, false, "f"), v(this, lt, "f").y18n.updateLocale(t2), this;
      }
      usage(t2, s2, i2, n2) {
        if (h("<string|null|undefined> [string|boolean] [function|object] [function]", [t2, s2, i2, n2], arguments.length), s2 !== void 0) {
          if (d(t2, null, v(this, lt, "f")), (t2 || "").match(/^\$0( |$)/))
            return this.command(t2, s2, i2, n2);
          throw new e(".usage() description must start with $0 if being used as alias for .command()");
        }
        return v(this, ut, "f").usage(t2), this;
      }
      version(t2, e2, s2) {
        const i2 = "version";
        if (h("[boolean|string] [string] [string]", [t2, e2, s2], arguments.length), v(this, pt, "f") && (this[bt](v(this, pt, "f")), v(this, ut, "f").version(void 0), O(this, pt, null, "f")), arguments.length === 0)
          s2 = this[_t](), t2 = i2;
        else if (arguments.length === 1) {
          if (t2 === false)
            return this;
          s2 = t2, t2 = i2;
        } else
          arguments.length === 2 && (s2 = e2, e2 = void 0);
        return O(this, pt, typeof t2 == "string" ? t2 : i2, "f"), e2 = e2 || v(this, ut, "f").deferY18nLookup("Show version number"), v(this, ut, "f").version(s2 || void 0), this.boolean(v(this, pt, "f")), this.describe(v(this, pt, "f"), e2), this;
      }
      wrap(t2) {
        return h("<number|null|undefined>", [t2], arguments.length), v(this, ut, "f").wrap(t2), this;
      }
      [(z = new WeakMap(), q = new WeakMap(), W = new WeakMap(), U = new WeakMap(), F = new WeakMap(), L = new WeakMap(), V = new WeakMap(), T = new WeakMap(), R = new WeakMap(), G = new WeakMap(), K = new WeakMap(), B = new WeakMap(), Y = new WeakMap(), J = new WeakMap(), Z = new WeakMap(), X = new WeakMap(), Q = new WeakMap(), tt = new WeakMap(), et = new WeakMap(), st = new WeakMap(), it = new WeakMap(), nt = new WeakMap(), rt = new WeakMap(), ot = new WeakMap(), at = new WeakMap(), ht = new WeakMap(), lt = new WeakMap(), ct = new WeakMap(), ft = new WeakMap(), dt = new WeakMap(), ut = new WeakMap(), pt = new WeakMap(), gt = new WeakMap(), mt)](t2) {
        if (!t2._ || !t2["--"])
          return t2;
        t2._.push.apply(t2._, t2["--"]);
        try {
          delete t2["--"];
        } catch (t3) {
        }
        return t2;
      }
      [yt]() {
        return { log: (...t2) => {
          this[Lt]() || console.log(...t2), O(this, J, true, "f"), v(this, Q, "f").length && O(this, Q, v(this, Q, "f") + "\n", "f"), O(this, Q, v(this, Q, "f") + t2.join(" "), "f");
        }, error: (...t2) => {
          this[Lt]() || console.error(...t2), O(this, J, true, "f"), v(this, Q, "f").length && O(this, Q, v(this, Q, "f") + "\n", "f"), O(this, Q, v(this, Q, "f") + t2.join(" "), "f");
        } };
      }
      [bt](t2) {
        p(v(this, tt, "f")).forEach((e2) => {
          if (e2 === "configObjects")
            return;
          const s2 = v(this, tt, "f")[e2];
          Array.isArray(s2) ? s2.includes(t2) && s2.splice(s2.indexOf(t2), 1) : typeof s2 == "object" && delete s2[t2];
        }), delete v(this, ut, "f").getDescriptions()[t2];
      }
      [vt](t2, e2, s2) {
        v(this, R, "f")[s2] || (v(this, lt, "f").process.emitWarning(t2, e2), v(this, R, "f")[s2] = true);
      }
      [Ot]() {
        v(this, K, "f").push({ options: v(this, tt, "f"), configObjects: v(this, tt, "f").configObjects.slice(0), exitProcess: v(this, G, "f"), groups: v(this, Y, "f"), strict: v(this, ct, "f"), strictCommands: v(this, ft, "f"), strictOptions: v(this, dt, "f"), completionCommand: v(this, F, "f"), output: v(this, Q, "f"), exitError: v(this, V, "f"), hasOutput: v(this, J, "f"), parsed: this.parsed, parseFn: v(this, it, "f"), parseContext: v(this, nt, "f") }), v(this, ut, "f").freeze(), v(this, gt, "f").freeze(), v(this, z, "f").freeze(), v(this, B, "f").freeze();
      }
      [wt]() {
        let t2, e2 = "";
        return t2 = /\b(node|iojs|electron)(\.exe)?$/.test(v(this, lt, "f").process.argv()[0]) ? v(this, lt, "f").process.argv().slice(1, 2) : v(this, lt, "f").process.argv().slice(0, 1), e2 = t2.map((t3) => {
          const e3 = this[Tt](v(this, q, "f"), t3);
          return t3.match(/^(\/|([a-zA-Z]:)?\\)/) && e3.length < t3.length ? e3 : t3;
        }).join(" ").trim(), v(this, lt, "f").getEnv("_") && v(this, lt, "f").getProcessArgvBin() === v(this, lt, "f").getEnv("_") && (e2 = v(this, lt, "f").getEnv("_").replace(`${v(this, lt, "f").path.dirname(v(this, lt, "f").process.execPath())}/`, "")), e2;
      }
      [Ct]() {
        return v(this, st, "f");
      }
      [jt]() {
        if (!v(this, T, "f"))
          return;
        const t2 = v(this, lt, "f").getEnv("LC_ALL") || v(this, lt, "f").getEnv("LC_MESSAGES") || v(this, lt, "f").getEnv("LANG") || v(this, lt, "f").getEnv("LANGUAGE") || "en_US";
        this.locale(t2.replace(/[.:].*/, ""));
      }
      [_t]() {
        return this[kt]().version || "unknown";
      }
      [Mt](t2) {
        const e2 = t2["--"] ? t2["--"] : t2._;
        for (let t3, s2 = 0; (t3 = e2[s2]) !== void 0; s2++)
          v(this, lt, "f").Parser.looksLikeNumber(t3) && Number.isSafeInteger(Math.floor(parseFloat(`${t3}`))) && (e2[s2] = Number(t3));
        return t2;
      }
      [kt](t2) {
        const e2 = t2 || "*";
        if (v(this, rt, "f")[e2])
          return v(this, rt, "f")[e2];
        let s2 = {};
        try {
          let e3 = t2 || v(this, lt, "f").mainFilename;
          !t2 && v(this, lt, "f").path.extname(e3) && (e3 = v(this, lt, "f").path.dirname(e3));
          const i2 = v(this, lt, "f").findUp(e3, (t3, e4) => e4.includes("package.json") ? "package.json" : void 0);
          d(i2, void 0, v(this, lt, "f")), s2 = JSON.parse(v(this, lt, "f").readFileSync(i2, "utf8"));
        } catch (t3) {
        }
        return v(this, rt, "f")[e2] = s2 || {}, v(this, rt, "f")[e2];
      }
      [Et](t2, e2) {
        (e2 = [].concat(e2)).forEach((e3) => {
          e3 = this[Pt](e3), v(this, tt, "f")[t2].push(e3);
        });
      }
      [xt](t2, e2, s2, i2) {
        this[St](t2, e2, s2, i2, (t3, e3, s3) => {
          v(this, tt, "f")[t3][e3] = s3;
        });
      }
      [At](t2, e2, s2, i2) {
        this[St](t2, e2, s2, i2, (t3, e3, s3) => {
          v(this, tt, "f")[t3][e3] = (v(this, tt, "f")[t3][e3] || []).concat(s3);
        });
      }
      [St](t2, e2, s2, i2, n2) {
        if (Array.isArray(s2))
          s2.forEach((e3) => {
            t2(e3, i2);
          });
        else if (((t3) => typeof t3 == "object")(s2))
          for (const e3 of p(s2))
            t2(e3, s2[e3]);
        else
          n2(e2, this[Pt](s2), i2);
      }
      [Pt](t2) {
        return t2 === "__proto__" ? "___proto___" : t2;
      }
      [$t](t2, e2) {
        return this[xt](this[$t].bind(this), "key", t2, e2), this;
      }
      [It]() {
        var t2, e2, s2, i2, n2, r2, o2, a2, h2, l2, c2, f2;
        const u2 = v(this, K, "f").pop();
        let p2;
        d(u2, void 0, v(this, lt, "f")), t2 = this, e2 = this, s2 = this, i2 = this, n2 = this, r2 = this, o2 = this, a2 = this, h2 = this, l2 = this, c2 = this, f2 = this, { options: { set value(e3) {
          O(t2, tt, e3, "f");
        } }.value, configObjects: p2, exitProcess: { set value(t3) {
          O(e2, G, t3, "f");
        } }.value, groups: { set value(t3) {
          O(s2, Y, t3, "f");
        } }.value, output: { set value(t3) {
          O(i2, Q, t3, "f");
        } }.value, exitError: { set value(t3) {
          O(n2, V, t3, "f");
        } }.value, hasOutput: { set value(t3) {
          O(r2, J, t3, "f");
        } }.value, parsed: this.parsed, strict: { set value(t3) {
          O(o2, ct, t3, "f");
        } }.value, strictCommands: { set value(t3) {
          O(a2, ft, t3, "f");
        } }.value, strictOptions: { set value(t3) {
          O(h2, dt, t3, "f");
        } }.value, completionCommand: { set value(t3) {
          O(l2, F, t3, "f");
        } }.value, parseFn: { set value(t3) {
          O(c2, it, t3, "f");
        } }.value, parseContext: { set value(t3) {
          O(f2, nt, t3, "f");
        } }.value } = u2, v(this, tt, "f").configObjects = p2, v(this, ut, "f").unfreeze(), v(this, gt, "f").unfreeze(), v(this, z, "f").unfreeze(), v(this, B, "f").unfreeze();
      }
      [Dt](t2, e2) {
        return j(e2, (e3) => (t2(e3), e3));
      }
      getInternalMethods() {
        return { getCommandInstance: this[Nt].bind(this), getContext: this[Ht].bind(this), getHasOutput: this[zt].bind(this), getLoggerInstance: this[qt].bind(this), getParseContext: this[Wt].bind(this), getParserConfiguration: this[Ct].bind(this), getUsageInstance: this[Ut].bind(this), getValidationInstance: this[Ft].bind(this), hasParseCallback: this[Lt].bind(this), postProcess: this[Vt].bind(this), reset: this[Rt].bind(this), runValidation: this[Kt].bind(this), runYargsParserAndExecuteCommands: this[Gt].bind(this), setHasOutput: this[Bt].bind(this) };
      }
      [Nt]() {
        return v(this, z, "f");
      }
      [Ht]() {
        return v(this, W, "f");
      }
      [zt]() {
        return v(this, J, "f");
      }
      [qt]() {
        return v(this, X, "f");
      }
      [Wt]() {
        return v(this, nt, "f") || {};
      }
      [Ut]() {
        return v(this, ut, "f");
      }
      [Ft]() {
        return v(this, gt, "f");
      }
      [Lt]() {
        return !!v(this, it, "f");
      }
      [Vt](t2, e2, s2, i2) {
        if (s2)
          return t2;
        if (f(t2))
          return t2;
        e2 || (t2 = this[mt](t2));
        return (this[Ct]()["parse-positional-numbers"] || this[Ct]()["parse-positional-numbers"] === void 0) && (t2 = this[Mt](t2)), i2 && (t2 = C(t2, this, v(this, B, "f").getMiddleware(), false)), t2;
      }
      [Rt](t2 = {}) {
        O(this, tt, v(this, tt, "f") || {}, "f");
        const e2 = {};
        e2.local = v(this, tt, "f").local || [], e2.configObjects = v(this, tt, "f").configObjects || [];
        const s2 = {};
        e2.local.forEach((e3) => {
          s2[e3] = true, (t2[e3] || []).forEach((t3) => {
            s2[t3] = true;
          });
        }), Object.assign(v(this, ot, "f"), Object.keys(v(this, Y, "f")).reduce((t3, e3) => {
          const i2 = v(this, Y, "f")[e3].filter((t4) => !(t4 in s2));
          return i2.length > 0 && (t3[e3] = i2), t3;
        }, {})), O(this, Y, {}, "f");
        return ["array", "boolean", "string", "skipValidation", "count", "normalize", "number", "hiddenOptions"].forEach((t3) => {
          e2[t3] = (v(this, tt, "f")[t3] || []).filter((t4) => !s2[t4]);
        }), ["narg", "key", "alias", "default", "defaultDescription", "config", "choices", "demandedOptions", "demandedCommands", "deprecatedOptions"].forEach((t3) => {
          e2[t3] = g(v(this, tt, "f")[t3], (t4) => !s2[t4]);
        }), e2.envPrefix = v(this, tt, "f").envPrefix, O(this, tt, e2, "f"), O(this, ut, v(this, ut, "f") ? v(this, ut, "f").reset(s2) : S(this, v(this, lt, "f")), "f"), O(this, gt, v(this, gt, "f") ? v(this, gt, "f").reset(s2) : function(t3, e3, s3) {
          const i2 = s3.y18n.__, n2 = s3.y18n.__n, r2 = { nonOptionCount: function(s4) {
            const i3 = t3.getDemandedCommands(), r3 = s4._.length + (s4["--"] ? s4["--"].length : 0) - t3.getInternalMethods().getContext().commands.length;
            i3._ && (r3 < i3._.min || r3 > i3._.max) && (r3 < i3._.min ? i3._.minMsg !== void 0 ? e3.fail(i3._.minMsg ? i3._.minMsg.replace(/\$0/g, r3.toString()).replace(/\$1/, i3._.min.toString()) : null) : e3.fail(n2("Not enough non-option arguments: got %s, need at least %s", "Not enough non-option arguments: got %s, need at least %s", r3, r3.toString(), i3._.min.toString())) : r3 > i3._.max && (i3._.maxMsg !== void 0 ? e3.fail(i3._.maxMsg ? i3._.maxMsg.replace(/\$0/g, r3.toString()).replace(/\$1/, i3._.max.toString()) : null) : e3.fail(n2("Too many non-option arguments: got %s, maximum of %s", "Too many non-option arguments: got %s, maximum of %s", r3, r3.toString(), i3._.max.toString()))));
          }, positionalCount: function(t4, s4) {
            s4 < t4 && e3.fail(n2("Not enough non-option arguments: got %s, need at least %s", "Not enough non-option arguments: got %s, need at least %s", s4, s4 + "", t4 + ""));
          }, requiredArguments: function(t4, s4) {
            let i3 = null;
            for (const e4 of Object.keys(s4))
              Object.prototype.hasOwnProperty.call(t4, e4) && t4[e4] !== void 0 || (i3 = i3 || {}, i3[e4] = s4[e4]);
            if (i3) {
              const t5 = [];
              for (const e4 of Object.keys(i3)) {
                const s6 = i3[e4];
                s6 && t5.indexOf(s6) < 0 && t5.push(s6);
              }
              const s5 = t5.length ? `
${t5.join("\n")}` : "";
              e3.fail(n2("Missing required argument: %s", "Missing required arguments: %s", Object.keys(i3).length, Object.keys(i3).join(", ") + s5));
            }
          }, unknownArguments: function(s4, i3, o3, a3, h2 = true) {
            var l3;
            const c3 = t3.getInternalMethods().getCommandInstance().getCommands(), f2 = [], d2 = t3.getInternalMethods().getContext();
            if (Object.keys(s4).forEach((e4) => {
              H.includes(e4) || Object.prototype.hasOwnProperty.call(o3, e4) || Object.prototype.hasOwnProperty.call(t3.getInternalMethods().getParseContext(), e4) || r2.isValidAndSomeAliasIsNotNew(e4, i3) || f2.push(e4);
            }), h2 && (d2.commands.length > 0 || c3.length > 0 || a3) && s4._.slice(d2.commands.length).forEach((t4) => {
              c3.includes("" + t4) || f2.push("" + t4);
            }), h2) {
              const e4 = ((l3 = t3.getDemandedCommands()._) === null || l3 === void 0 ? void 0 : l3.max) || 0, i4 = d2.commands.length + e4;
              i4 < s4._.length && s4._.slice(i4).forEach((t4) => {
                t4 = String(t4), d2.commands.includes(t4) || f2.includes(t4) || f2.push(t4);
              });
            }
            f2.length && e3.fail(n2("Unknown argument: %s", "Unknown arguments: %s", f2.length, f2.join(", ")));
          }, unknownCommands: function(s4) {
            const i3 = t3.getInternalMethods().getCommandInstance().getCommands(), r3 = [], o3 = t3.getInternalMethods().getContext();
            return (o3.commands.length > 0 || i3.length > 0) && s4._.slice(o3.commands.length).forEach((t4) => {
              i3.includes("" + t4) || r3.push("" + t4);
            }), r3.length > 0 && (e3.fail(n2("Unknown command: %s", "Unknown commands: %s", r3.length, r3.join(", "))), true);
          }, isValidAndSomeAliasIsNotNew: function(e4, s4) {
            if (!Object.prototype.hasOwnProperty.call(s4, e4))
              return false;
            const i3 = t3.parsed.newAliases;
            return [e4, ...s4[e4]].some((t4) => !Object.prototype.hasOwnProperty.call(i3, t4) || !i3[e4]);
          }, limitedChoices: function(s4) {
            const n3 = t3.getOptions(), r3 = {};
            if (!Object.keys(n3.choices).length)
              return;
            Object.keys(s4).forEach((t4) => {
              H.indexOf(t4) === -1 && Object.prototype.hasOwnProperty.call(n3.choices, t4) && [].concat(s4[t4]).forEach((e4) => {
                n3.choices[t4].indexOf(e4) === -1 && e4 !== void 0 && (r3[t4] = (r3[t4] || []).concat(e4));
              });
            });
            const o3 = Object.keys(r3);
            if (!o3.length)
              return;
            let a3 = i2("Invalid values:");
            o3.forEach((t4) => {
              a3 += `
  ${i2("Argument: %s, Given: %s, Choices: %s", t4, e3.stringifiedValues(r3[t4]), e3.stringifiedValues(n3.choices[t4]))}`;
            }), e3.fail(a3);
          } };
          let o2 = {};
          function a2(t4, e4) {
            const s4 = Number(e4);
            return typeof (e4 = isNaN(s4) ? e4 : s4) == "number" ? e4 = t4._.length >= e4 : e4.match(/^--no-.+/) ? (e4 = e4.match(/^--no-(.+)/)[1], e4 = !Object.prototype.hasOwnProperty.call(t4, e4)) : e4 = Object.prototype.hasOwnProperty.call(t4, e4), e4;
          }
          r2.implies = function(e4, i3) {
            h("<string|object> [array|number|string]", [e4, i3], arguments.length), typeof e4 == "object" ? Object.keys(e4).forEach((t4) => {
              r2.implies(t4, e4[t4]);
            }) : (t3.global(e4), o2[e4] || (o2[e4] = []), Array.isArray(i3) ? i3.forEach((t4) => r2.implies(e4, t4)) : (d(i3, void 0, s3), o2[e4].push(i3)));
          }, r2.getImplied = function() {
            return o2;
          }, r2.implications = function(t4) {
            const s4 = [];
            if (Object.keys(o2).forEach((e4) => {
              const i3 = e4;
              (o2[e4] || []).forEach((e5) => {
                let n3 = i3;
                const r3 = e5;
                n3 = a2(t4, n3), e5 = a2(t4, e5), n3 && !e5 && s4.push(` ${i3} -> ${r3}`);
              });
            }), s4.length) {
              let t5 = `${i2("Implications failed:")}
`;
              s4.forEach((e4) => {
                t5 += e4;
              }), e3.fail(t5);
            }
          };
          let l2 = {};
          r2.conflicts = function(e4, s4) {
            h("<string|object> [array|string]", [e4, s4], arguments.length), typeof e4 == "object" ? Object.keys(e4).forEach((t4) => {
              r2.conflicts(t4, e4[t4]);
            }) : (t3.global(e4), l2[e4] || (l2[e4] = []), Array.isArray(s4) ? s4.forEach((t4) => r2.conflicts(e4, t4)) : l2[e4].push(s4));
          }, r2.getConflicting = () => l2, r2.conflicting = function(n3) {
            Object.keys(n3).forEach((t4) => {
              l2[t4] && l2[t4].forEach((s4) => {
                s4 && n3[t4] !== void 0 && n3[s4] !== void 0 && e3.fail(i2("Arguments %s and %s are mutually exclusive", t4, s4));
              });
            }), t3.getInternalMethods().getParserConfiguration()["strip-dashed"] && Object.keys(l2).forEach((t4) => {
              l2[t4].forEach((r3) => {
                r3 && n3[s3.Parser.camelCase(t4)] !== void 0 && n3[s3.Parser.camelCase(r3)] !== void 0 && e3.fail(i2("Arguments %s and %s are mutually exclusive", t4, r3));
              });
            });
          }, r2.recommendCommands = function(t4, s4) {
            s4 = s4.sort((t5, e4) => e4.length - t5.length);
            let n3 = null, r3 = 1 / 0;
            for (let e4, i3 = 0; (e4 = s4[i3]) !== void 0; i3++) {
              const s5 = N(t4, e4);
              s5 <= 3 && s5 < r3 && (r3 = s5, n3 = e4);
            }
            n3 && e3.fail(i2("Did you mean %s?", n3));
          }, r2.reset = function(t4) {
            return o2 = g(o2, (e4) => !t4[e4]), l2 = g(l2, (e4) => !t4[e4]), r2;
          };
          const c2 = [];
          return r2.freeze = function() {
            c2.push({ implied: o2, conflicting: l2 });
          }, r2.unfreeze = function() {
            const t4 = c2.pop();
            d(t4, void 0, s3), { implied: o2, conflicting: l2 } = t4;
          }, r2;
        }(this, v(this, ut, "f"), v(this, lt, "f")), "f"), O(this, z, v(this, z, "f") ? v(this, z, "f").reset() : function(t3, e3, s3, i2) {
          return new M(t3, e3, s3, i2);
        }(v(this, ut, "f"), v(this, gt, "f"), v(this, B, "f"), v(this, lt, "f")), "f"), v(this, U, "f") || O(this, U, function(t3, e3, s3, i2) {
          return new D(t3, e3, s3, i2);
        }(this, v(this, ut, "f"), v(this, z, "f"), v(this, lt, "f")), "f"), v(this, B, "f").reset(), O(this, F, null, "f"), O(this, Q, "", "f"), O(this, V, null, "f"), O(this, J, false, "f"), this.parsed = false, this;
      }
      [Tt](t2, e2) {
        return v(this, lt, "f").path.relative(t2, e2);
      }
      [Gt](t2, s2, i2, n2 = 0, r2 = false) {
        let o2 = !!i2 || r2;
        t2 = t2 || v(this, at, "f"), v(this, tt, "f").__ = v(this, lt, "f").y18n.__, v(this, tt, "f").configuration = this[Ct]();
        const a2 = !!v(this, tt, "f").configuration["populate--"], h2 = Object.assign({}, v(this, tt, "f").configuration, { "populate--": true }), l2 = v(this, lt, "f").Parser.detailed(t2, Object.assign({}, v(this, tt, "f"), { configuration: { "parse-positional-numbers": false, ...h2 } })), c2 = Object.assign(l2.argv, v(this, nt, "f"));
        let d2;
        const u2 = l2.aliases;
        let p2 = false, g2 = false;
        Object.keys(c2).forEach((t3) => {
          t3 === v(this, Z, "f") && c2[t3] ? p2 = true : t3 === v(this, pt, "f") && c2[t3] && (g2 = true);
        }), c2.$0 = this.$0, this.parsed = l2, n2 === 0 && v(this, ut, "f").clearCachedHelpMessage();
        try {
          if (this[jt](), s2)
            return this[Vt](c2, a2, !!i2, false);
          if (v(this, Z, "f")) {
            [v(this, Z, "f")].concat(u2[v(this, Z, "f")] || []).filter((t3) => t3.length > 1).includes("" + c2._[c2._.length - 1]) && (c2._.pop(), p2 = true);
          }
          const h3 = v(this, z, "f").getCommands(), m2 = v(this, U, "f").completionKey in c2, y2 = p2 || m2 || r2;
          if (c2._.length) {
            if (h3.length) {
              let t3;
              for (let e2, s3 = n2 || 0; c2._[s3] !== void 0; s3++) {
                if (e2 = String(c2._[s3]), h3.includes(e2) && e2 !== v(this, F, "f")) {
                  const t4 = v(this, z, "f").runCommand(e2, this, l2, s3 + 1, r2, p2 || g2 || r2);
                  return this[Vt](t4, a2, !!i2, false);
                }
                if (!t3 && e2 !== v(this, F, "f")) {
                  t3 = e2;
                  break;
                }
              }
              !v(this, z, "f").hasDefaultCommand() && v(this, ht, "f") && t3 && !y2 && v(this, gt, "f").recommendCommands(t3, h3);
            }
            v(this, F, "f") && c2._.includes(v(this, F, "f")) && !m2 && (v(this, G, "f") && x(true), this.showCompletionScript(), this.exit(0));
          }
          if (v(this, z, "f").hasDefaultCommand() && !y2) {
            const t3 = v(this, z, "f").runCommand(null, this, l2, 0, r2, p2 || g2 || r2);
            return this[Vt](t3, a2, !!i2, false);
          }
          if (m2) {
            v(this, G, "f") && x(true);
            const s3 = (t2 = [].concat(t2)).slice(t2.indexOf(`--${v(this, U, "f").completionKey}`) + 1);
            return v(this, U, "f").getCompletion(s3, (t3, s4) => {
              if (t3)
                throw new e(t3.message);
              (s4 || []).forEach((t4) => {
                v(this, X, "f").log(t4);
              }), this.exit(0);
            }), this[Vt](c2, !a2, !!i2, false);
          }
          if (v(this, J, "f") || (p2 ? (v(this, G, "f") && x(true), o2 = true, this.showHelp("log"), this.exit(0)) : g2 && (v(this, G, "f") && x(true), o2 = true, v(this, ut, "f").showVersion("log"), this.exit(0))), !o2 && v(this, tt, "f").skipValidation.length > 0 && (o2 = Object.keys(c2).some((t3) => v(this, tt, "f").skipValidation.indexOf(t3) >= 0 && c2[t3] === true)), !o2) {
            if (l2.error)
              throw new e(l2.error.message);
            if (!m2) {
              const t3 = this[Kt](u2, {}, l2.error);
              i2 || (d2 = C(c2, this, v(this, B, "f").getMiddleware(), true)), d2 = this[Dt](t3, d2 != null ? d2 : c2), f(d2) && !i2 && (d2 = d2.then(() => C(c2, this, v(this, B, "f").getMiddleware(), false)));
            }
          }
        } catch (t3) {
          if (!(t3 instanceof e))
            throw t3;
          v(this, ut, "f").fail(t3.message, t3);
        }
        return this[Vt](d2 != null ? d2 : c2, a2, !!i2, true);
      }
      [Kt](t2, s2, i2, n2) {
        const r2 = { ...this.getDemandedOptions() };
        return (o2) => {
          if (i2)
            throw new e(i2.message);
          v(this, gt, "f").nonOptionCount(o2), v(this, gt, "f").requiredArguments(o2, r2);
          let a2 = false;
          v(this, ft, "f") && (a2 = v(this, gt, "f").unknownCommands(o2)), v(this, ct, "f") && !a2 ? v(this, gt, "f").unknownArguments(o2, t2, s2, !!n2) : v(this, dt, "f") && v(this, gt, "f").unknownArguments(o2, t2, {}, false, false), v(this, gt, "f").limitedChoices(o2), v(this, gt, "f").implications(o2), v(this, gt, "f").conflicting(o2);
        };
      }
      [Bt]() {
        O(this, J, true, "f");
      }
      [Yt](t2) {
        if (typeof t2 == "string")
          v(this, tt, "f").key[t2] = true;
        else
          for (const e2 of t2)
            v(this, tt, "f").key[e2] = true;
      }
    };
    var Zt;
    var Xt;
    var { readFileSync: Qt } = require("fs");
    var { inspect: te } = require("util");
    var { resolve: ee } = require("path");
    var se = require_build();
    var ie = require_build2();
    var ne;
    var re = { assert: { notStrictEqual: t.notStrictEqual, strictEqual: t.strictEqual }, cliui: require_build3(), findUp: require_sync2(), getEnv: (t2) => process.env[t2], getCallerFile: require_get_caller_file(), getProcessArgvBin: y, inspect: te, mainFilename: (Xt = (Zt = require === null || require === void 0 ? void 0 : require.main) === null || Zt === void 0 ? void 0 : Zt.filename) !== null && Xt !== void 0 ? Xt : process.cwd(), Parser: ie, path: require("path"), process: { argv: () => process.argv, cwd: process.cwd, emitWarning: (t2, e2) => process.emitWarning(t2, e2), execPath: () => process.execPath, exit: (t2) => {
      process.exit(t2);
    }, nextTick: process.nextTick, stdColumns: process.stdout.columns !== void 0 ? process.stdout.columns : null }, readFileSync: Qt, require, requireDirectory: require_require_directory(), stringWidth: require_string_width(), y18n: se({ directory: ee(__dirname, "../locales"), updateFiles: false }) };
    var oe = ((ne = process === null || process === void 0 ? void 0 : process.env) === null || ne === void 0 ? void 0 : ne.YARGS_MIN_NODE_VERSION) ? Number(process.env.YARGS_MIN_NODE_VERSION) : 12;
    if (process && process.version) {
      if (Number(process.version.match(/v([^.]+)/)[1]) < oe)
        throw Error(`yargs supports a minimum Node.js version of ${oe}. Read our version support policy: https://github.com/yargs/yargs#supported-nodejs-versions`);
    }
    var ae = require_build2();
    var he;
    var le = { applyExtends: n, cjsPlatformShim: re, Yargs: (he = re, (t2 = [], e2 = he.process.cwd(), s2) => {
      const i2 = new Jt(t2, e2, s2, he);
      return Object.defineProperty(i2, "argv", { get: () => i2.parse(), enumerable: true }), i2.help(), i2.version(), i2;
    }), argsert: h, isPromise: f, objFilter: g, parseCommand: o, Parser: ae, processArgv: b, YError: e };
    module2.exports = le;
  }
});

// node_modules/yargs/index.cjs
var require_yargs = __commonJS({
  "node_modules/yargs/index.cjs"(exports2, module2) {
    "use strict";
    var { Yargs, processArgv } = require_build4();
    Argv(processArgv.hideBin(process.argv));
    module2.exports = Argv;
    function Argv(processArgs, cwd) {
      const argv2 = Yargs(processArgs, cwd, require);
      singletonify(argv2);
      return argv2;
    }
    function singletonify(inst) {
      [
        ...Object.keys(inst),
        ...Object.getOwnPropertyNames(inst.constructor.prototype)
      ].forEach((key) => {
        if (key === "argv") {
          Argv.__defineGetter__(key, inst.__lookupGetter__(key));
        } else if (typeof inst[key] === "function") {
          Argv[key] = inst[key].bind(inst);
        } else {
          Argv.__defineGetter__("$0", () => {
            return inst.$0;
          });
          Argv.__defineGetter__("parsed", () => {
            return inst.parsed;
          });
        }
      });
    }
  }
});

// src/buildRoute.ts
function getImportPath(path2, routerPath) {
  return path2.replace(routerPath, ".").replace(/\.[^.]*$/, "");
}
function getRoutePath(path2, routeBaseUrl) {
  return path2.replace(routeBaseUrl, "").replace(/\/[^\/]*\.*$/, "").replace("[", "").replace("]", "");
}
function buildRoute({
  path: path2,
  routerPath,
  id,
  routeBaseUrl
}) {
  const importName = `Route${id}`;
  const importPath = getImportPath(path2, routerPath);
  const routePath = getRoutePath(path2, routeBaseUrl);
  return {
    importName,
    importPath,
    routePath
  };
}

// src/buildRouter.ts
function buildRouter({ routes, template }) {
  const imports = routes.map(({ importName, importPath }) => `import ${importName} from "${importPath}";`).join("\n");
  const elements = routes.map(({ routePath, importName }) => `<Route exact path="${routePath}" component={${importName}}/>`).join("\n");
  return template.replace("<<IMPORTS>>", imports).replace("<<ROUTES>>", elements);
}

// src/watch.ts
var glob = __toModule(require_glob());
function isArraySame(a, b) {
  const mergedSize = new Set([...a, ...b]).size;
  return mergedSize === a.length && mergedSize === b.length;
}
function getPaths(globPattern) {
  return glob.sync(globPattern);
}
function watch(globPattern, callback, options) {
  const interval = options?.interval || 1e3;
  let cachedPaths = [];
  let runningGlob = false;
  const readDir = async () => {
    if (runningGlob)
      return;
    runningGlob = true;
    const paths = getPaths(globPattern);
    if (isArraySame(cachedPaths, paths))
      return;
    cachedPaths = paths;
    callback(paths);
    runningGlob = false;
  };
  readDir();
  const id = setInterval(readDir, interval);
  return () => clearInterval(id);
}

// src/writeFile.ts
var fs = __toModule(require("fs"));
var path = __toModule(require("path"));
function isExists(path2) {
  try {
    fs.accessSync(path2);
    return true;
  } catch {
    return false;
  }
}
function writeFile(filePath, data) {
  const dirname2 = path.dirname(filePath);
  const exist = isExists(dirname2);
  if (!exist) {
    fs.mkdirSync(dirname2, { recursive: true });
  }
  fs.writeFileSync(filePath, data, "utf8");
}

// src/router.template.txt
var router_template_default = 'import {Switch, Route} from "react-router-dom";\n<<IMPORTS>>\n\nexport default function() {\n  return (\n    <Switch>\n<<ROUTES>>\n    </Switch>\n  ) \n}\n\n';

// src/generator.ts
function writeRouterFile(paths, routerPath, routeBaseUrl, template) {
  const routes = paths.map((path2, id) => buildRoute({ path: path2, routerPath, id, routeBaseUrl }));
  const router = buildRouter({
    routes,
    template: template || router_template_default
  });
  writeFile(routerPath, router);
}
function generator({
  routeBaseUrl,
  routeName,
  routerPath,
  routerTemplate = router_template_default,
  watch: isWatch = false
}) {
  const globPattern = `${routeBaseUrl}/**/${routeName}`;
  if (!isWatch) {
    const paths = getPaths(globPattern);
    return writeRouterFile(paths, routerPath, routeBaseUrl, routerTemplate);
  }
  return watch(globPattern, (paths) => writeRouterFile(paths, routerPath, routeBaseUrl, routerTemplate));
}

// src/generator.cli.ts
var yargs = require_yargs();
var { argv } = yargs(process.argv.slice(2)).options({
  routeBaseUrl: { type: "string", required: true },
  routeName: { type: "string", required: true },
  routerPath: { type: "string", require: true },
  watch: { type: "boolean", default: false }
});
generator(argv);
