var JSON;
if (!JSON) {
JSON = {};
}
(function () {
"use strict";
function f(n) {
return n < 10 ? '0' + n : n;
}
if (typeof Date.prototype.toJSON !== 'function') {
Date.prototype.toJSON = function (key) {
return isFinite(this.valueOf()) ?
this.getUTCFullYear() + '-' +
f(this.getUTCMonth() + 1) + '-' +
f(this.getUTCDate()) + 'T' +
f(this.getUTCHours()) + ':' +
f(this.getUTCMinutes()) + ':' +
f(this.getUTCSeconds()) + 'Z' : null;
};
String.prototype.toJSON =
Number.prototype.toJSON =
Boolean.prototype.toJSON = function (key) {
return this.valueOf();
};
}
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,//"
gap,
indent,
meta = {
'\b': '\\b',
'\t': '\\t',
'\n': '\\n',
'\f': '\\f',
'\r': '\\r',
'"' : '\\"',
'\\': '\\\\'
},
rep;
function quote(string) {
escapable.lastIndex = 0;
return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
var c = meta[a];
return typeof c === 'string' ? c :
'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
}) + '"' : '"' + string + '"';
}
function str(key, holder) {
var i,
k,
v,
length,
mind = gap,
partial,
value = holder[key];
if (value && typeof value === 'object' &&
typeof value.toJSON === 'function') {
value = value.toJSON(key);
}
if (typeof rep === 'function') {
value = rep.call(holder, key, value);
}
switch (typeof value) {
case 'string':
return quote(value);
case 'number':
return isFinite(value) ? String(value) : 'null';
case 'boolean':
case 'null':
return String(value);
case 'object':
if (!value) {
return 'null';
}
gap += indent;
partial = [];
if (Object.prototype.toString.apply(value) === '[object Array]') {
length = value.length;
for (i = 0; i < length; i += 1) {
partial[i] = str(i, value) || 'null';
}
v = partial.length === 0 ? '[]' : gap ?
'[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
'[' + partial.join(',') + ']';
gap = mind;
return v;
}
if (rep && typeof rep === 'object') {
length = rep.length;
for (i = 0; i < length; i += 1) {
if (typeof rep[i] === 'string') {
k = rep[i];
v = str(k, value);
if (v) {
partial.push(quote(k) + (gap ? ': ' : ':') + v);
}
}
}
} else {
for (k in value) {
if (Object.prototype.hasOwnProperty.call(value, k)) {
v = str(k, value);
if (v) {
partial.push(quote(k) + (gap ? ': ' : ':') + v);
}
}
}
}
v = partial.length === 0 ? '{}' : gap ?
'{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
'{' + partial.join(',') + '}';
gap = mind;
return v;
}
}
if (typeof JSON.stringify !== 'function') {
JSON.stringify = function (value, replacer, space) {
var i;
gap = '';
indent = '';
if (typeof space === 'number') {
for (i = 0; i < space; i += 1) {
indent += ' ';
}
} else if (typeof space === 'string') {
indent = space;
}
rep = replacer;
if (replacer && typeof replacer !== 'function' &&
(typeof replacer !== 'object' ||
typeof replacer.length !== 'number')) {
throw new Error('JSON.stringify');
}
return str('', {'': value});
};
}
if (typeof JSON.parse !== 'function') {
JSON.parse = function (text, reviver) {
var j;
function walk(holder, key) {
var k, v, value = holder[key];
if (value && typeof value === 'object') {
for (k in value) {
if (Object.prototype.hasOwnProperty.call(value, k)) {
v = walk(value, k);
if (v !== undefined) {
value[k] = v;
} else {
delete value[k];
}
}
}
}
return reviver.call(holder, key, value);
}
text = String(text);
cx.lastIndex = 0;
if (cx.test(text)) {
text = text.replace(cx, function (a) {
return '\\u' +
('0000' + a.charCodeAt(0).toString(16)).slice(-4);
});
}
if (/^[\],:{}\s]*$/
.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')//"
.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')//"
.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
j = eval('(' + text + ')');
return typeof reviver === 'function' ?
walk({'': j}, '') : j;
}
throw new SyntaxError('JSON.parse');
};
}
}());
var Q = (function () {
var Q = {};
var lastReg = /\/[^\/]*$/;
var upReg = new RegExp("\\.\\.\\/", "g");
Q.toAbsPath = function (ref, path) {
if (path.charAt(0) == '/') return path;
var p = ref.replace(lastReg, "");
var f = path.match(upReg);
if (f) {
path = path.substring(f.length * 3);
for (var i = 0; i < f.length; i++)
p = p.substring(0, p.lastIndexOf('/'));
}
return p + '/' + path;
};
Q.getBaseUrl = function (prefix) {
var path = window.location.pathname + "/";
var index = path.indexOf(prefix + "/");
if (index >= 0)
return path.substring(0, index + prefix.length + 1);
else
return "/";
};
Q.union = function () {
var result = {};
for (var i = 0; i < arguments.length; i++) {
var arg = arguments[i];
for (var j in arg)
if (!(j in result)) result[j] = arg[j];
}
return result;
};
Q.clone = function (obj) {
var result = {};
for (var i in obj) result[i] = obj[i];
return result;
};
var apply = Q.apply = function (obj, funcName, args) {
if (args == null) args = [];
var result = null;
if (typeof(obj) == "function") {
return null;
} else if (Q.isArray(obj)) {
result = new Array(obj.length);
for (var i = 0; i < obj.length; i++)
result[i] = apply(obj[i], funcName, args);
} else if (typeof(obj) == "object") {
var func = obj[funcName];
if (typeof(func) == "function") {
result = func.apply(obj, args);
} else {
result = {};
for (var i in obj) {
var val = apply(obj[i], funcName, args);
if (val != null) result[i] = val;
}
}
}
return result;
};
Q.extend = function (child, father) {
for (var i in father.prototype)
if (child.prototype[i] == null)
child.prototype[i] = father.prototype[i];
};
Q.evalJSON = function (obj) { return eval('(' + obj + ')'); };
Q.inRange = function (value, start, end, exclusive) {
if (value < start) return false;
if (exclusive) return value < end;
return value <= end;
};
Q.arrFind = function (arr, e) {
;
if (arr) {
for (var i = 0; i < arr.length; i++)
if (arr[i] == e) return i;
}
return -1;
};
Q.arrRemove = function (arr, i) {
;
;
var r = arr[i];
for (var j = i; j < arr.length - 1; j++)
arr[j] = arr[j + 1];
arr.pop();
return r;
};
Q.arrRemovev = function (arr, value) {
;
var i = Q.arrFind(arr, value);
if (i >= 0) {
Q.arrRemove(arr, i);
return true;
} else
return false;
};
Q.isArray = function (obj) { return typeof(obj) == "object" && typeof(obj.length) == "number" && (0 in obj) && ((obj.length - 1) in obj); }
Q.nullFunc = function () { return null; };
Q.constFunc = function (val) {
return function (data) { return val; };
};
Q.bind = function (fun, self) {
return function() {
fun.apply(self, arguments);
}
};
Q.seq = function () {
var args = arguments;
return function() {
for (var i = 0; i < args.length; i++)
args[i].apply(this, arguments);
}
};
Q.mayCall = function (func, a, b, c) {
if (func) {
if (arguments.length <= 4)
return func(a, b, c);
var arg = new Array(arguments.length - 1);
for (var i = 1; i < arguments.length; i++)
arg[i - 1] = arguments[i];
return func.apply(null, arg);
}
return undefined;
};
Q.fill0 = function (x, n) {
var s = x + "";
var r = s;
for (var i = s.length; i < n; i++)
r = "0" + r;
return r;
};
Q.escape = function (str) {
if (str == null) {
str = "";
} else {
str = str + "";
str = str.replace(/&/g, "&amp;");
str = str.replace(/</g, "&lt;");
str = str.replace(/>/g, "&gt;");
str = str.replace(/\"/g, "&quot;");//"
}
return str;
};
Q.purify = function (str) {
str = Q.escape(str);
str = str.replace(/(^\ )|(\ $)/g, "&nbsp;");
str = str.replace(/\ \ /g, " &nbsp;");
str = str.replace(/\t/g, " &nbsp; &nbsp;");
return str;
};
Q.htmlize = function (str) {
str = Q.purify(str);
str = str.replace(/\n/g, "<br />");
return str;
};
Q.trim = function (str) {
return str.replace(/^\s*(\S*)\s*$/, "$1");
};
Q.leadCapital = function (str) {
return str.charAt(0).toUpperCase() + str.substr(1);
};
Q.deindent = function (str) {
return str.replace(/^\r?\n[ \t]*/, "").replace(/\r?\n[ \t]*$/, "");
};
Q.include = function (str, pattern) { return str.indexOf(pattern) > -1; };
Q.startsWith = function (str, pattern) { return str.length >= pattern.length && str.substr(0, pattern.length) == pattern; };
Q.endsWith = function (str, pattern) {
var d = str.length - pattern.length;
return d >= 0 && str.lastIndexOf(pattern) == d;
};
Q.empty = function (str) { return str == null || str == ""; };
Q.blank = function (str) { return /^[\s\n\r\t]*$/.test(str); };
Q.stringize = function (str) {
if (str != null) {
str = str.replace(/\\/g, "\\\\");
str = str.replace(/'/g, "\\\'"); //');
str = str.replace(/"/g, "\\\"");
}
return str;
};
Q.shortenText = function (text, maxline, maxlen, points) {
var shortened = (text.length > maxlen);
var str = shortened ? text.substr(0, maxlen) : text;
var idx = ret.indexOf('\n');
var i = 0;
while (idx > 0 && (++i) < maxline)
idx = ret.indexOf('\n', idx + 1);
if (idx >= 0) {
str = str.substr(0, idx + 1);
shortened = true;
}
if (shortened && points)
str += points;
return str;
};
Q.isDomParent = function (node, parent) {
while (node && node != parent)
node = node.parentNode;
return (node == parent);
};
Q.$ = function (id) {
return document.getElementById(id);
};
Q.$N = function (name) {
return document.getElementsByName(name);
};
Q.$P = function (id) {
return parent.document.getElementById(id);
};
Q.$S = function (id) {
var node = (typeof(id) == "string" ? $(id) : id);
for (var i = 1; i < arguments.length; i += 2) {
var name = arguments[i];
var value = arguments[i + 1];
if (Q.Browser.IE) {
if (name == "opacity") {
name = "filter";
value = "alpha(opacity=" + parseFloat(value) * 100 + ")";
}
}
node.style[name] = value;
}
return node;
};
Q.$SPX = function (id, name, value) {
var node = (typeof(id) == "string" ? $(id) : id);
Q.$S(node, name, (value > 0 ? value : 0) + "px");
return node;
};
Q.$GS = function (id, name) {
var node = (typeof(id) == "string" ? $(id) : id);
if (Q.Browser.IE) {
if (name == "opacity") {
var v = node.style.filter;
var r = /alpha\(opacity=([^\)]*)\)/;
if (!v) {
var m = r.exec(v);
return (m ? (parseFloat(m[1]) / 100) : null);
}
}
}
return node.style[name];
};
Q.$T = function (id, enable) {
var node = (typeof(id) == "string" ? $(id) : id);
node.style.display = (enable ? "block" : "none");
return node;
};
Q.$V = function (id, visible) {
var node = (typeof(id) == "string" ? $(id) : id);
node.style.visibility = (visible ? "visible" : "hidden");
return node;
};
Q.$CE = function (eleName) {
return document.createElement(eleName);
};
Q.$A = function (id, attName, attValue) {
var node = (typeof(id) == "string" ? $(id) : id);
for (var i = 1; i < arguments.length; i += 2)
node.setAttribute(arguments[i], arguments[i + 1]);
return node;
};
Q.addClass = function (node, className) {
if (node.className) {
var classes = node.className.split(/\s+/);
if (Q.arrFind(classes, className) < 0) {
classes.push(className);
node.className = classes.join(" ");
}
} else
node.className = className;
};
Q.removeClass = function (node, className) {
if (node.className) {
var classes = node.className.split(/\s+/);
var i = Q.arrFind(classes, className);
if (i >= 0) {
Q.arrRemove(classes, i);
node.className = classes.join(" ");
}
}
};
Q.applyStyle = function (node, styles) {
for (var name in styles)
$S(node, name, styles[name]);
};
Q.setCookie = function (name, value, expires, path, domain, secure){
var str = name + "=" + encodeURIComponent(value);
if (expires) {
var date = new Date();
date.setTime(date.getTime() + expires * 86400000);
str += "; expires=" + date.toGMTString();
}
if (path) str += "; path=" + path;
if (domain) str += "; domain=" + domain;
if (secure) str += "; secure";
document.cookie = str;
if (cookies)
cookies[name] = value;
};
var cookies = null;
Q.getCookie = function (name) {
if (cookies == null) {
cookies = {};
var list = document.cookie.split(";");
for (var i = 0; i < list.length; i++) {
var str = Q.trim(list[i]);
if (str == "") continue;
var idx = str.indexOf("=");
if (idx >= 0) {
var key = Q.trim(str.substring(0, idx));
var value = decodeURIComponent(str.substring(idx + 1));
cookies[key] = value;
} else
cookies[Q.trim(str)] = true;
}
}
return cookies[name];
};
Q.deleteCookie = function (name) {
Q.setCookie(name, "", 0);
if (cookies)
delete cookies[name];
};
Q.Browser = {
IE: !!(window.attachEvent && !window.opera),
Opera: !!window.opera,
WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
Gecko: navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
};
function createEventHandler (type, handler, args) {
return function (e) {
var event = null;
if (Q.Browser.IE) {
event = window.event;
e = {};
e.time = (new Date()).getTime();
e.charCode = (type == "keypress") ? event.keyCode : 0;
e.eventPhase = 2;
e.isChar = (event.charCode > 0);
e.pageX = event.clientX + document.body.scrollLeft;
e.pageY = event.clientY + document.body.scrollTop;
if (event.button)
e.button = (event.button == 1 ? 0 : (event.button == 2 ? 2 : 1));
if (type == "mouseout") {
e.relatedTarget = event.toElement;
} else if (type == "mouseover") {
e.relatedTarget = event.fromElement;
}
e.target = event.srcElement;
}
if (type == "mousescroll") {
if (!event) event = e;
if (event.wheelDelta != null)
e.delta = -event.wheelDelta;
else
e.delta = e.detail * 40;
}
handler(e, args);
};
}
Q.attachEvent = function (target, type, handler, args) {
var h = createEventHandler(type, handler, args);
;
if (target.addEventListener)
target.addEventListener(type, h, false);
else if (target.attachEvent)
target.attachEvent("on" + type, h);
return h;
};
Q.detachEvent = function (target, type, handle) {
;
if (target.removeEventListener)
target.removeEventListener(type, handle, false);
else if (target.detachEvent)
target.detachEvent("on" + type, handle);
};
var _oldOnSelStart = null, _selBanned = false, _selUpBinded = false;
function bindRestoreSel() {
_selUpBinded = true;
Q.attachEvent(document, "mouseup", function () {
if (_selBanned) {
document.onselectstart = _oldOnSelStart;
_selBanned = false;
}
});
}
Q.forbidSelect = function (target) {
var detachFunc;
if (Q.Browser.IE) {
var h = Q.attachEvent(target, "mousedown", function () {
_oldOnSelStart = document.onselectstart;
_selBanned = true;
document.onselectstart = Q.constFunc(false);
});
if (!_selUpBinded) bindRestoreSel();
detachFunc = function () { Q.detachEvent(target, "mousedown", h); };
} else {
var old = target.onmousedown;
target.onmousedown = function (e) {
if (old) old.call(target, e);
return false;
}
detachFunc = function () { target.onmousedown = old; };
}
return { "detach": detachFunc };
};
Q.addDragHandler = function (target, mask, handler) {
var x0, y0;
var hmove, hup, hout;
var dragging = false;
if (!mask) mask = document;
var fh = Q.forbidSelect(target);
function onmousemove(e) {
if (dragging && handler.onDragMove)
handler.onDragMove(e.pageX - x0, e.pageY - y0, target, e);
}
function onmouseup(e) {
if (dragging) {
if (handler.onDragEnd)
handler.onDragEnd(e.pageX - x0, e.pageY - y0, target, e);
Q.detachEvent(mask, "mousemove", hmove);
Q.detachEvent(document, "mouseup", hup);
Q.detachEvent(document, "mouseout", hout);
dragging = false;
}
}
function onmouseout(e) {
if (!e.relatedTarget)
onmouseup(e);
}
var h = Q.attachEvent(target, "mousedown", function (e) {
if (e.button == 0) {
x0 = e.pageX; y0 = e.pageY;
if (handler.onDragStart) handler.onDragStart(target, e);
hmove = Q.attachEvent(mask, "mousemove", onmousemove);
hup = Q.attachEvent(document, "mouseup", onmouseup);
hout = Q.attachEvent(document, "mouseout", onmouseout);
dragging = true;
}
return false;
});
function detach() {
fh.detach();
Q.detachEvent(target, "mousedown", h);
if (dragging) {
Q.detachEvent(mask, "mousemove", hmove);
Q.detachEvent(document, "mouseup", hup);
Q.detachEvent(document, "mouseout", hout);
}
}
return { detach: detach };
};
var readyHandlers = [];
var jQueryisReady = false;
var jQueryready = function() {
if ( !jQueryisReady ) {
jQueryisReady = true;
for (var i = 0; i < readyHandlers.length; i++)
(readyHandlers[i])();
}
};
if ( document.addEventListener ) {
document.addEventListener( "DOMContentLoaded", function(){
document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
jQueryready();
}, false );
} else if ( document.attachEvent ) {
document.attachEvent("onreadystatechange", function(){
if ( document.readyState === "complete" ) {
document.detachEvent( "onreadystatechange", arguments.callee );
jQueryready();
}
});
if ( document.documentElement.doScroll && typeof window.frameElement === "undefined" ) (function(){
if ( jQueryisReady ) return;
try {
document.documentElement.doScroll("left");
} catch( error ) {
setTimeout( arguments.callee, 0 );
return;
}
jQueryready();
})();
}
Q.attachEvent(window, "load", jQueryready);
Q.onready = function (handler) {
if (jQueryisReady)
handler();
else
readyHandlers.push(handler);
};
var scrollHandlers = null;
function scrollHandlerFunc(e) {
for (var i = 0; i < scrollHandlers.length; i++) {
var h = scrollHandlers[i];
h.f(e, h.args);
}
}
Q.addScrollHandler = function (handler, args) {
if (!scrollHandlers) {
scrollHandlers = [];
var h = createEventHandler("mousescroll", scrollHandlerFunc, args);
if (document.addEventListener) {
document.addEventListener('DOMMouseScroll', h, false);
}
document.onmousewheel = h;
}
var r = {f:handler, args:args};
scrollHandlers.push(r);
return { detach: function () { Q.arrRemovev(scrollHandlers, r); } };
};
Q.ajax = function (url, arg2, arg3, arg4) {
var method = "GET", body = null, callback;
if (typeof(arg2) == "function")
callback = arg2;
else if (typeof(arg3) == "function") {
method = arg2;
callback = arg3;
} else {
;
method = arg2;
body = arg3;
callback = arg4;
}
var req;
if (window.XMLHttpRequest)
req = new XMLHttpRequest();
else {
;
try {
req = new ActiveXObject("Msxml2.XMLHTTP");
} catch (e) {
req = new ActiveXObject("Microsoft.XMLHTTP");
}
}
req.onreadystatechange = function () {
if (req.readyState == 4) {
var st = req.status;
callback(req);
}
};
req.open(method, url, true);
if (method == "POST")
req.setRequestHeader("Content-Type",
"application/x-www-form-urlencoded; charset=utf-8");
req.send(body);
}
Q.importName = function () {
for (var i = 0; i < arguments.length; i++) {
var name = arguments[i];
;
window[name] = Q[name];
}
};
Q.importShortcuts = function () {
Q.importName("$", "$N", "$P", "$S", "$SPX", "$GS", "$T", "$V", "$CE", "$A");
};
return Q;
})();
