// node_modules/mustache/mustache.mjs
var isFunction = function(object) {
  return typeof object === "function";
};
var typeStr = function(obj) {
  return isArray(obj) ? "array" : typeof obj;
};
var escapeRegExp = function(string) {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
};
var hasProperty = function(obj, propName) {
  return obj != null && typeof obj === "object" && propName in obj;
};
var primitiveHasOwnProperty = function(primitive, propName) {
  return primitive != null && typeof primitive !== "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName);
};
var testRegExp = function(re, string) {
  return regExpTest.call(re, string);
};
var isWhitespace = function(string) {
  return !testRegExp(nonSpaceRe, string);
};
var escapeHtml = function(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
    return entityMap[s];
  });
};
var parseTemplate = function(template, tags) {
  if (!template)
    return [];
  var lineHasNonSpace = false;
  var sections = [];
  var tokens = [];
  var spaces = [];
  var hasTag = false;
  var nonSpace = false;
  var indentation = "";
  var tagIndex = 0;
  function stripSpace() {
    if (hasTag && !nonSpace) {
      while (spaces.length)
        delete tokens[spaces.pop()];
    } else {
      spaces = [];
    }
    hasTag = false;
    nonSpace = false;
  }
  var openingTagRe, closingTagRe, closingCurlyRe;
  function compileTags(tagsToCompile) {
    if (typeof tagsToCompile === "string")
      tagsToCompile = tagsToCompile.split(spaceRe, 2);
    if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
      throw new Error("Invalid tags: " + tagsToCompile);
    openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*");
    closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1]));
    closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1]));
  }
  compileTags(tags || mustache.tags);
  var scanner = new Scanner(template);
  var start, type, value, chr, token, openSection;
  while (!scanner.eos()) {
    start = scanner.pos;
    value = scanner.scanUntil(openingTagRe);
    if (value) {
      for (var i = 0, valueLength = value.length;i < valueLength; ++i) {
        chr = value.charAt(i);
        if (isWhitespace(chr)) {
          spaces.push(tokens.length);
          indentation += chr;
        } else {
          nonSpace = true;
          lineHasNonSpace = true;
          indentation += " ";
        }
        tokens.push(["text", chr, start, start + 1]);
        start += 1;
        if (chr === "\n") {
          stripSpace();
          indentation = "";
          tagIndex = 0;
          lineHasNonSpace = false;
        }
      }
    }
    if (!scanner.scan(openingTagRe))
      break;
    hasTag = true;
    type = scanner.scan(tagRe) || "name";
    scanner.scan(whiteRe);
    if (type === "=") {
      value = scanner.scanUntil(equalsRe);
      scanner.scan(equalsRe);
      scanner.scanUntil(closingTagRe);
    } else if (type === "{") {
      value = scanner.scanUntil(closingCurlyRe);
      scanner.scan(curlyRe);
      scanner.scanUntil(closingTagRe);
      type = "&";
    } else {
      value = scanner.scanUntil(closingTagRe);
    }
    if (!scanner.scan(closingTagRe))
      throw new Error("Unclosed tag at " + scanner.pos);
    if (type == ">") {
      token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace];
    } else {
      token = [type, value, start, scanner.pos];
    }
    tagIndex++;
    tokens.push(token);
    if (type === "#" || type === "^") {
      sections.push(token);
    } else if (type === "/") {
      openSection = sections.pop();
      if (!openSection)
        throw new Error('Unopened section "' + value + '" at ' + start);
      if (openSection[1] !== value)
        throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
    } else if (type === "name" || type === "{" || type === "&") {
      nonSpace = true;
    } else if (type === "=") {
      compileTags(value);
    }
  }
  stripSpace();
  openSection = sections.pop();
  if (openSection)
    throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
  return nestTokens(squashTokens(tokens));
};
var squashTokens = function(tokens) {
  var squashedTokens = [];
  var token, lastToken;
  for (var i = 0, numTokens = tokens.length;i < numTokens; ++i) {
    token = tokens[i];
    if (token) {
      if (token[0] === "text" && lastToken && lastToken[0] === "text") {
        lastToken[1] += token[1];
        lastToken[3] = token[3];
      } else {
        squashedTokens.push(token);
        lastToken = token;
      }
    }
  }
  return squashedTokens;
};
var nestTokens = function(tokens) {
  var nestedTokens = [];
  var collector = nestedTokens;
  var sections = [];
  var token, section;
  for (var i = 0, numTokens = tokens.length;i < numTokens; ++i) {
    token = tokens[i];
    switch (token[0]) {
      case "#":
      case "^":
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case "/":
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
    }
  }
  return nestedTokens;
};
var Scanner = function(string) {
  this.string = string;
  this.tail = string;
  this.pos = 0;
};
var Context = function(view, parentContext) {
  this.view = view;
  this.cache = { ".": this.view };
  this.parent = parentContext;
};
var Writer = function() {
  this.templateCache = {
    _cache: {},
    set: function set(key, value) {
      this._cache[key] = value;
    },
    get: function get(key) {
      return this._cache[key];
    },
    clear: function clear() {
      this._cache = {};
    }
  };
};
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */
var objectToString = Object.prototype.toString;
var isArray = Array.isArray || function isArrayPolyfill(object) {
  return objectToString.call(object) === "[object Array]";
};
var regExpTest = RegExp.prototype.test;
var nonSpaceRe = /\S/;
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};
var whiteRe = /\s*/;
var spaceRe = /\s+/;
var equalsRe = /\s*=/;
var curlyRe = /\s*\}/;
var tagRe = /#|\^|\/|>|\{|&|=|!/;
Scanner.prototype.eos = function eos() {
  return this.tail === "";
};
Scanner.prototype.scan = function scan(re) {
  var match = this.tail.match(re);
  if (!match || match.index !== 0)
    return "";
  var string = match[0];
  this.tail = this.tail.substring(string.length);
  this.pos += string.length;
  return string;
};
Scanner.prototype.scanUntil = function scanUntil(re) {
  var index = this.tail.search(re), match;
  switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
  }
  this.pos += match.length;
  return match;
};
Context.prototype.push = function push(view) {
  return new Context(view, this);
};
Context.prototype.lookup = function lookup(name) {
  var cache = this.cache;
  var value;
  if (cache.hasOwnProperty(name)) {
    value = cache[name];
  } else {
    var context = this, intermediateValue, names, index, lookupHit = false;
    while (context) {
      if (name.indexOf(".") > 0) {
        intermediateValue = context.view;
        names = name.split(".");
        index = 0;
        while (intermediateValue != null && index < names.length) {
          if (index === names.length - 1)
            lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index]);
          intermediateValue = intermediateValue[names[index++]];
        }
      } else {
        intermediateValue = context.view[name];
        lookupHit = hasProperty(context.view, name);
      }
      if (lookupHit) {
        value = intermediateValue;
        break;
      }
      context = context.parent;
    }
    cache[name] = value;
  }
  if (isFunction(value))
    value = value.call(this.view);
  return value;
};
Writer.prototype.clearCache = function clearCache() {
  if (typeof this.templateCache !== "undefined") {
    this.templateCache.clear();
  }
};
Writer.prototype.parse = function parse(template, tags) {
  var cache = this.templateCache;
  var cacheKey = template + ":" + (tags || mustache.tags).join(":");
  var isCacheEnabled = typeof cache !== "undefined";
  var tokens = isCacheEnabled ? cache.get(cacheKey) : undefined;
  if (tokens == undefined) {
    tokens = parseTemplate(template, tags);
    isCacheEnabled && cache.set(cacheKey, tokens);
  }
  return tokens;
};
Writer.prototype.render = function render(template, view, partials, config) {
  var tags = this.getConfigTags(config);
  var tokens = this.parse(template, tags);
  var context = view instanceof Context ? view : new Context(view, undefined);
  return this.renderTokens(tokens, context, partials, template, config);
};
Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate, config) {
  var buffer = "";
  var token, symbol, value;
  for (var i = 0, numTokens = tokens.length;i < numTokens; ++i) {
    value = undefined;
    token = tokens[i];
    symbol = token[0];
    if (symbol === "#")
      value = this.renderSection(token, context, partials, originalTemplate, config);
    else if (symbol === "^")
      value = this.renderInverted(token, context, partials, originalTemplate, config);
    else if (symbol === ">")
      value = this.renderPartial(token, context, partials, config);
    else if (symbol === "&")
      value = this.unescapedValue(token, context);
    else if (symbol === "name")
      value = this.escapedValue(token, context, config);
    else if (symbol === "text")
      value = this.rawValue(token);
    if (value !== undefined)
      buffer += value;
  }
  return buffer;
};
Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate, config) {
  var self = this;
  var buffer = "";
  var value = context.lookup(token[1]);
  function subRender(template) {
    return self.render(template, context, partials, config);
  }
  if (!value)
    return;
  if (isArray(value)) {
    for (var j = 0, valueLength = value.length;j < valueLength; ++j) {
      buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config);
    }
  } else if (typeof value === "object" || typeof value === "string" || typeof value === "number") {
    buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config);
  } else if (isFunction(value)) {
    if (typeof originalTemplate !== "string")
      throw new Error("Cannot use higher-order sections without the original template");
    value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);
    if (value != null)
      buffer += value;
  } else {
    buffer += this.renderTokens(token[4], context, partials, originalTemplate, config);
  }
  return buffer;
};
Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate, config) {
  var value = context.lookup(token[1]);
  if (!value || isArray(value) && value.length === 0)
    return this.renderTokens(token[4], context, partials, originalTemplate, config);
};
Writer.prototype.indentPartial = function indentPartial(partial, indentation, lineHasNonSpace) {
  var filteredIndentation = indentation.replace(/[^ \t]/g, "");
  var partialByNl = partial.split("\n");
  for (var i = 0;i < partialByNl.length; i++) {
    if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
      partialByNl[i] = filteredIndentation + partialByNl[i];
    }
  }
  return partialByNl.join("\n");
};
Writer.prototype.renderPartial = function renderPartial(token, context, partials, config) {
  if (!partials)
    return;
  var tags = this.getConfigTags(config);
  var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
  if (value != null) {
    var lineHasNonSpace = token[6];
    var tagIndex = token[5];
    var indentation = token[4];
    var indentedValue = value;
    if (tagIndex == 0 && indentation) {
      indentedValue = this.indentPartial(value, indentation, lineHasNonSpace);
    }
    var tokens = this.parse(indentedValue, tags);
    return this.renderTokens(tokens, context, partials, indentedValue, config);
  }
};
Writer.prototype.unescapedValue = function unescapedValue(token, context) {
  var value = context.lookup(token[1]);
  if (value != null)
    return value;
};
Writer.prototype.escapedValue = function escapedValue(token, context, config) {
  var escape = this.getConfigEscape(config) || mustache.escape;
  var value = context.lookup(token[1]);
  if (value != null)
    return typeof value === "number" && escape === mustache.escape ? String(value) : escape(value);
};
Writer.prototype.rawValue = function rawValue(token) {
  return token[1];
};
Writer.prototype.getConfigTags = function getConfigTags(config) {
  if (isArray(config)) {
    return config;
  } else if (config && typeof config === "object") {
    return config.tags;
  } else {
    return;
  }
};
Writer.prototype.getConfigEscape = function getConfigEscape(config) {
  if (config && typeof config === "object" && !isArray(config)) {
    return config.escape;
  } else {
    return;
  }
};
var mustache = {
  name: "mustache.js",
  version: "4.2.0",
  tags: ["{{", "}}"],
  clearCache: undefined,
  escape: undefined,
  parse: undefined,
  render: undefined,
  Scanner: undefined,
  Context: undefined,
  Writer: undefined,
  set templateCache(cache) {
    defaultWriter.templateCache = cache;
  },
  get templateCache() {
    return defaultWriter.templateCache;
  }
};
var defaultWriter = new Writer;
mustache.clearCache = function clearCache2() {
  return defaultWriter.clearCache();
};
mustache.parse = function parse2(template, tags) {
  return defaultWriter.parse(template, tags);
};
mustache.render = function render2(template, view, partials, config) {
  if (typeof template !== "string") {
    throw new TypeError('Invalid template! Template should be a "string" but "' + typeStr(template) + '" was given as the first argument for mustache#render(template, view, partials)');
  }
  return defaultWriter.render(template, view, partials, config);
};
mustache.escape = escapeHtml;
mustache.Scanner = Scanner;
mustache.Context = Context;
mustache.Writer = Writer;
var mustache_default = mustache;

// index.ts
var { default: fs} = (()=>({}));

// node:path
var L = Object.create;
var b = Object.defineProperty;
var z = Object.getOwnPropertyDescriptor;
var D = Object.getOwnPropertyNames;
var T = Object.getPrototypeOf;
var R = Object.prototype.hasOwnProperty;
var _ = (f, e) => () => (e || f((e = { exports: {} }).exports, e), e.exports);
var E = (f, e) => {
  for (var r in e)
    b(f, r, { get: e[r], enumerable: true });
};
var C = (f, e, r, l) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let i of D(e))
      !R.call(f, i) && i !== r && b(f, i, { get: () => e[i], enumerable: !(l = z(e, i)) || l.enumerable });
  return f;
};
var A = (f, e, r) => (C(f, e, "default"), r && C(r, e, "default"));
var y = (f, e, r) => (r = f != null ? L(T(f)) : {}, C(e || !f || !f.__esModule ? b(r, "default", { value: f, enumerable: true }) : r, f));
var h = _((F, S) => {
  function c(f) {
    if (typeof f != "string")
      throw new TypeError("Path must be a string. Received " + JSON.stringify(f));
  }
  function w(f, e) {
    for (var r = "", l = 0, i = -1, s = 0, n, t = 0;t <= f.length; ++t) {
      if (t < f.length)
        n = f.charCodeAt(t);
      else {
        if (n === 47)
          break;
        n = 47;
      }
      if (n === 47) {
        if (!(i === t - 1 || s === 1))
          if (i !== t - 1 && s === 2) {
            if (r.length < 2 || l !== 2 || r.charCodeAt(r.length - 1) !== 46 || r.charCodeAt(r.length - 2) !== 46) {
              if (r.length > 2) {
                var a = r.lastIndexOf("/");
                if (a !== r.length - 1) {
                  a === -1 ? (r = "", l = 0) : (r = r.slice(0, a), l = r.length - 1 - r.lastIndexOf("/")), i = t, s = 0;
                  continue;
                }
              } else if (r.length === 2 || r.length === 1) {
                r = "", l = 0, i = t, s = 0;
                continue;
              }
            }
            e && (r.length > 0 ? r += "/.." : r = "..", l = 2);
          } else
            r.length > 0 ? r += "/" + f.slice(i + 1, t) : r = f.slice(i + 1, t), l = t - i - 1;
        i = t, s = 0;
      } else
        n === 46 && s !== -1 ? ++s : s = -1;
    }
    return r;
  }
  function J(f, e) {
    var r = e.dir || e.root, l = e.base || (e.name || "") + (e.ext || "");
    return r ? r === e.root ? r + l : r + f + l : l;
  }
  var g = { resolve: function() {
    for (var e = "", r = false, l, i = arguments.length - 1;i >= -1 && !r; i--) {
      var s;
      i >= 0 ? s = arguments[i] : (l === undefined && (l = process.cwd()), s = l), c(s), s.length !== 0 && (e = s + "/" + e, r = s.charCodeAt(0) === 47);
    }
    return e = w(e, !r), r ? e.length > 0 ? "/" + e : "/" : e.length > 0 ? e : ".";
  }, normalize: function(e) {
    if (c(e), e.length === 0)
      return ".";
    var r = e.charCodeAt(0) === 47, l = e.charCodeAt(e.length - 1) === 47;
    return e = w(e, !r), e.length === 0 && !r && (e = "."), e.length > 0 && l && (e += "/"), r ? "/" + e : e;
  }, isAbsolute: function(e) {
    return c(e), e.length > 0 && e.charCodeAt(0) === 47;
  }, join: function() {
    if (arguments.length === 0)
      return ".";
    for (var e, r = 0;r < arguments.length; ++r) {
      var l = arguments[r];
      c(l), l.length > 0 && (e === undefined ? e = l : e += "/" + l);
    }
    return e === undefined ? "." : g.normalize(e);
  }, relative: function(e, r) {
    if (c(e), c(r), e === r || (e = g.resolve(e), r = g.resolve(r), e === r))
      return "";
    for (var l = 1;l < e.length && e.charCodeAt(l) === 47; ++l)
      ;
    for (var i = e.length, s = i - l, n = 1;n < r.length && r.charCodeAt(n) === 47; ++n)
      ;
    for (var t = r.length, a = t - n, v = s < a ? s : a, u = -1, o = 0;o <= v; ++o) {
      if (o === v) {
        if (a > v) {
          if (r.charCodeAt(n + o) === 47)
            return r.slice(n + o + 1);
          if (o === 0)
            return r.slice(n + o);
        } else
          s > v && (e.charCodeAt(l + o) === 47 ? u = o : o === 0 && (u = 0));
        break;
      }
      var k = e.charCodeAt(l + o), P = r.charCodeAt(n + o);
      if (k !== P)
        break;
      k === 47 && (u = o);
    }
    var d = "";
    for (o = l + u + 1;o <= i; ++o)
      (o === i || e.charCodeAt(o) === 47) && (d.length === 0 ? d += ".." : d += "/..");
    return d.length > 0 ? d + r.slice(n + u) : (n += u, r.charCodeAt(n) === 47 && ++n, r.slice(n));
  }, _makeLong: function(e) {
    return e;
  }, dirname: function(e) {
    if (c(e), e.length === 0)
      return ".";
    for (var r = e.charCodeAt(0), l = r === 47, i = -1, s = true, n = e.length - 1;n >= 1; --n)
      if (r = e.charCodeAt(n), r === 47) {
        if (!s) {
          i = n;
          break;
        }
      } else
        s = false;
    return i === -1 ? l ? "/" : "." : l && i === 1 ? "//" : e.slice(0, i);
  }, basename: function(e, r) {
    if (r !== undefined && typeof r != "string")
      throw new TypeError('"ext" argument must be a string');
    c(e);
    var l = 0, i = -1, s = true, n;
    if (r !== undefined && r.length > 0 && r.length <= e.length) {
      if (r.length === e.length && r === e)
        return "";
      var t = r.length - 1, a = -1;
      for (n = e.length - 1;n >= 0; --n) {
        var v = e.charCodeAt(n);
        if (v === 47) {
          if (!s) {
            l = n + 1;
            break;
          }
        } else
          a === -1 && (s = false, a = n + 1), t >= 0 && (v === r.charCodeAt(t) ? --t === -1 && (i = n) : (t = -1, i = a));
      }
      return l === i ? i = a : i === -1 && (i = e.length), e.slice(l, i);
    } else {
      for (n = e.length - 1;n >= 0; --n)
        if (e.charCodeAt(n) === 47) {
          if (!s) {
            l = n + 1;
            break;
          }
        } else
          i === -1 && (s = false, i = n + 1);
      return i === -1 ? "" : e.slice(l, i);
    }
  }, extname: function(e) {
    c(e);
    for (var r = -1, l = 0, i = -1, s = true, n = 0, t = e.length - 1;t >= 0; --t) {
      var a = e.charCodeAt(t);
      if (a === 47) {
        if (!s) {
          l = t + 1;
          break;
        }
        continue;
      }
      i === -1 && (s = false, i = t + 1), a === 46 ? r === -1 ? r = t : n !== 1 && (n = 1) : r !== -1 && (n = -1);
    }
    return r === -1 || i === -1 || n === 0 || n === 1 && r === i - 1 && r === l + 1 ? "" : e.slice(r, i);
  }, format: function(e) {
    if (e === null || typeof e != "object")
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof e);
    return J("/", e);
  }, parse: function(e) {
    c(e);
    var r = { root: "", dir: "", base: "", ext: "", name: "" };
    if (e.length === 0)
      return r;
    var l = e.charCodeAt(0), i = l === 47, s;
    i ? (r.root = "/", s = 1) : s = 0;
    for (var n = -1, t = 0, a = -1, v = true, u = e.length - 1, o = 0;u >= s; --u) {
      if (l = e.charCodeAt(u), l === 47) {
        if (!v) {
          t = u + 1;
          break;
        }
        continue;
      }
      a === -1 && (v = false, a = u + 1), l === 46 ? n === -1 ? n = u : o !== 1 && (o = 1) : n !== -1 && (o = -1);
    }
    return n === -1 || a === -1 || o === 0 || o === 1 && n === a - 1 && n === t + 1 ? a !== -1 && (t === 0 && i ? r.base = r.name = e.slice(1, a) : r.base = r.name = e.slice(t, a)) : (t === 0 && i ? (r.name = e.slice(1, n), r.base = e.slice(1, a)) : (r.name = e.slice(t, n), r.base = e.slice(t, a)), r.ext = e.slice(n, a)), t > 0 ? r.dir = e.slice(0, t - 1) : i && (r.dir = "/"), r;
  }, sep: "/", delimiter: ":", win32: null, posix: null };
  g.posix = g;
  S.exports = g;
});
var m = {};
E(m, { default: () => q });
A(m, y(h()));
var q = y(h());

// index.ts
var scan2 = (filepath, only, scans = []) => {
  if (!fs.existsSync(filepath)) {
    console.warn(`${filepath} no exists, skip scan.`);
    return scans;
  } else if (fs.statSync(filepath).isDirectory()) {
    fs.readdirSync(filepath).forEach((sub) => {
      scan2(q.join(filepath, sub), only, scans);
    });
  } else {
    const catchYou = only ? match(filepath, only) : true;
    if (catchYou) {
      scans.push(filepath);
    }
  }
  return scans;
};
var match = (s, rule) => {
  if (typeof rule === "function") {
    return rule(s);
  } else if (Array.isArray(rule)) {
    return Boolean(rule.find((r) => match(s, r)));
  } else if (typeof rule === "string") {
    return s === rule;
  } else if (rule) {
    return rule?.test(s);
  } else {
    return false;
  }
};
var copy = (options) => {
  const { tplRoot: cwd, overRoot, outRoot, data } = options;
  const tplRoot = q.resolve(cwd, "tpls");
  const overTplRoot = overRoot ? q.resolve(overRoot, "tpls") : null;
  const partialRoot = q.resolve(cwd, "partials");
  const overPartialRoot = overRoot ? q.resolve(overRoot, "partials") : null;
  const tplFiles = scan2(tplRoot);
  const partialsFiles = partialRoot ? scan2(partialRoot) : [];
  const partials = partialsFiles.reduce((map, filepath) => {
    if (!/\.mustache$/.test(filepath)) {
      return map;
    }
    const key = filepath.replace(`${q.dirname(filepath)}/`, "").replace(".mustache", "");
    const partialFilePath = overPartialRoot && fs.existsSync(filepath.replace(partialRoot, overPartialRoot)) ? filepath.replace(partialRoot, overPartialRoot) : filepath;
    map[key] = fs.readFileSync(partialFilePath).toString();
    return map;
  }, {});
  tplFiles.forEach((filepath) => {
    const to = filepath.replace(tplRoot, outRoot).replace(/\.mustache$/, "");
    const canOverwrite = !fs.existsSync(to) || match(to, options.overwrite);
    if (!canOverwrite)
      return;
    const tplFilePath = overTplRoot && fs.existsSync(filepath.replace(tplRoot, overTplRoot)) ? filepath.replace(tplRoot, overTplRoot) : filepath;
    const content = fs.readFileSync(tplFilePath).toString();
    if (options.tags) {
      mustache_default.tags = options.tags;
    }
    try {
      const output = /!\.mustache$/.test(filepath) ? content : mustache_default.render(content, data, partials);
      const dir = q.dirname(to);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(to, output);
    } catch (error) {
      console.error(`Kakashi Copy Files Error on ${to}, case by`, error);
      throw error;
    }
  });
};
export {
  scan2 as scan,
  match,
  copy
};
