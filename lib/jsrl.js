function JsrlEval(str) {
var res = null;
eval(str);
return res;
};
var Jsrl = (function() {
var whitespace = /\s/;
var identBeginner = /[A-Za-z_]/;
var identChar = /\w/;
var digitChar = /[0-9]/;
var intReg = /^[0-9]+$/;
var floatReg = /^[0-9]*\.[0-9]*$/;
var strReg = /^\"[^\"\\]*\"$/;//"
function funcWrapper(func, arg) {
return func;
}
var ConstFunc = Q.constFunc;
var trueConstFunc = ConstFunc(true);
var falseConstFunc = ConstFunc(false);
var nullConstFunc = ConstFunc(null);
var emptyStrFunc = ConstFunc("");
var nullObj = {};
function setupDataObj(data, dataList) {
data.__args = [];
if (!dataList) return;
for (var i in dataList)
if (intReg.test(i))
data.__args[i] = dataList[i];
else
data[i] = dataList[i];
}
function Scanner(value) {
this.value = value;
this.pos = 0;
}
Scanner.prototype = {
end : function () {
return this.pos >= this.value.length;
},
current : function () { return this.value.charAt(this.pos); },
rest : function () { return this.value.substr(this.pos); },
nextTag : function () {
var str = [];
var strVal;
var value = this.value;
var len = value.length;
;
var type, generator;
var cont;
var npos;
do {
cont = false;
npos = value.indexOf("@", this.pos);
if (npos < 0) npos = len;
str.push(value.substring(this.pos, npos));
if (npos == len) {
this.pos = npos;
type = "$self_insert";
generator = new SelfInsertTag([Q.deindent(str.join(""))], this);
} else {
;
var ch = value.charAt(npos + 1);
switch (ch) {
case "@":
str.push("@");
this.pos = npos + 2;
cont = true;
break;
case "#":
npos = value.indexOf("\n", npos);
this.pos = (npos > 0 ? npos : len);
cont = true;
break;
case "*":
npos = value.indexOf("*@", npos);
;
this.pos = npos + 2;
cont = true;
break;
default:
strVal = Q.deindent(str.join(""));
if (strVal != "") {
this.pos = npos;
type = "$self_insert";
generator = new SelfInsertTag([strVal], this);
break;
}
if (ch == "!") {
this.pos = npos + 2;
skipBlank(this);
var exprList = nextExprList(this);
type = "$exec";
generator = new ExecTag(exprList, this);
break;
}
this.pos = npos + 1;
skipBlank(this);
;
str = [];
if (ch == '{') {
var exprList = nextExprList(this);
type = "$expr";
generator = new EvalTag(exprList, this);
} else {
tagName = nextIdentifier(this);
skipBlank(this);
var exprList = nextExprList(this);
var tagFunc = tags[tagName];
type = tagName;
if (tagFunc == undefined)
generator = new DummyTag(exprList);
else
generator = new tagFunc(exprList, this);
}
}
}
} while (cont);
return { "type" : type, "generator" : generator };
}
};
function skipBlank(scanner) {
var value = scanner.value;
while (!scanner.end() && whitespace.test(value.charAt(scanner.pos)))
scanner.pos++;
}
function nextIdentifier(scanner) {
var pos0 = scanner.pos;
var value = scanner.value;
if (pos0 < value.length && identBeginner.test(value.charAt(pos0))) {
scanner.pos++;
while (pos0 < value.length && identChar.test(value.charAt(scanner.pos)))
scanner.pos++;
return value.substring(pos0, scanner.pos);
}
;
}
function nextNumber(scanner) {
var pos0 = scanner.pos;
var value = scanner.value;
while (!scanner.end() && digitChar.test(value.charAt(scanner.pos)))
scanner.pos++;
;
return value.substring(pos0, scanner.pos);
}
function nextString(scanner) {
var value = scanner.value;
var pos0 = scanner.pos;
;
var quote = value.charAt(scanner.pos);
scanner.pos++;
while (scanner.pos < value.length) {
var ch = value.charAt(scanner.pos++);
if (ch == quote) break;
if (ch == "\\") scanner.pos++;
}
;
return value.substring(pos0, scanner.pos);
}
function nextExpr(scanner, endStr, varTkn) {
skipBlank(scanner);
var symbolStack = [];
var str = [];
var value = scanner.value;
while (scanner.pos < value.length) {
var ch = value.charAt(scanner.pos++);
var ti = (varTkn ? varTkn.indexOf(ch) : -1);
if (ti >= 0) {
str.push(arguments[3 + ti](scanner, value));
} else {
switch (ch) {
case "(":
str.push(ch);
symbolStack.push(")");
break;
case "[":
str.push(ch);
symbolStack.push("]");
break;
case "{":
str.push(ch);
symbolStack.push("}");
break;
case "\\":
str.push(ch);
if (scanner.pos < value.length)
str.push(value.charAt(scanner.pos++));
break;
case "\"":
case "\'":
scanner.pos--;
str.push(nextString(scanner));
break;
default:
if (symbolStack.length == 0) {
if (endStr && endStr.indexOf(ch) >= 0) {
return Q.trim(str.join(""));
}
} else if (ch == symbolStack[symbolStack.length - 1])
symbolStack.pop();
str.push(ch);
}
}
}
var result = Q.trim(str.join(""));
return result;
}
function dollarParseFunc(scanner, value) {
;
ch = value.charAt(scanner.pos);
if (ch == "$") {
scanner.pos++;
return "$";
} else if (digitChar.test(ch)) {
var num = nextNumber(scanner);
return "__data.__args[" + num + "]";
} else if (ch == "?") {
scanner.pos++;
return "__data.__args.length";
} else if (ch == "*") {
scanner.pos++;
return "__data.__args";
} else if (identBeginner.test(ch)) {
var ident = nextIdentifier(scanner);
return "__data['" + ident + "']";
} else {
return "$";
}
}
function atParseFunc(scanner, value) {
skipBlank(scanner);
;
ch = value.charAt(scanner.pos);
var expr = null;
if (ch == "\"") {
var p = nextString(scanner);
if (strReg.test(p))
return "\"" + Q.stringize(Q.toAbsPath(basePath, p.substr(1, p.length - 2))) + "\"";
else
expr = p;
} else if (ch == "(") {
scanner.pos++;
var e = nextExpr(scanner, ")", "$", dollarParseFunc);
expr = "(" + e + ")";
}
return (expr ? "Q.toAbsPath(" + basePathStr + "," + expr + ")" : "@");
}
function nextExprList(scanner) {
var value = scanner.value;
if (scanner.end() || value.charAt(scanner.pos) != "{") return [];
scanner.pos++;
var result = [];
while (!scanner.end() && value.charAt(scanner.pos - 1) != "}")
result.push(nextExpr(scanner, ",}", "$@", dollarParseFunc, atParseFunc));
;
return result;
}
var evalFuncList = [];
var lastEvaluated = 0;
function evalFunc(func) {
var index = evalFuncList.length;
evalFuncList.push({"txt":func});
var ff = null;
return function () {
if (!ff) {
var f = evalFuncList[index];
var i;
if (f.func)
ff = f.func;
else {
var evalFuncs = [];
evalFuncs.push("res = ([");
for (i = lastEvaluated; i < evalFuncList.length - 1; i++) {
evalFuncs.push(evalFuncList[i].txt);
evalFuncs.push(",");
}
evalFuncs.push(evalFuncList[i].txt);
evalFuncs.push("])");
var funcArr = JsrlEval(evalFuncs.join(""));
for (i = lastEvaluated; i < evalFuncList.length; i++) {
evalFuncList[i].txt = undefined;
evalFuncList[i].func = funcArr[i - lastEvaluated];
}
lastEvaluated = evalFuncList.length;
ff = evalFuncList[index].func;
}
}
return ff.apply(null, arguments);
};
}
function isEmptyArg(xarg) {
return Q.blank(xarg);
}
function evaluateFunc (xarg) {
if (xarg == null) return nullConstFunc;
var arg = xarg;
arg = Q.trim(arg);
if (intReg.test(arg))
return ConstFunc(parseInt(arg));
else if (floatReg.test(arg))
return ConstFunc(parseFloat(arg));
else if (strReg.test(arg))
return ConstFunc(arg.substr(1, arg.length - 2));
else if (arg == "true")
return trueConstFunc;
else if (arg == "false")
return falseConstFunc;
else if (arg == "")
return nullConstFunc;
else {
return evalFunc("function (__data) { return (" + arg + "); }");
}
}
function executeFunc(xarg) {
var arg = xarg;
return evalFunc("function (__data) { " + arg + "; }");
}
function parseAttribute(arg) {
var scanner = new Scanner(arg);
skipBlank(scanner);
var name = nextIdentifier(scanner);
var value = null, sep;
skipBlank(scanner);
if (!scanner.end()) {
sep = scanner.current();
;
scanner.pos++;
skipBlank(scanner);
value = scanner.rest();
}
return { "name" : name, "func" : sep == ':', "value" : value };
};
function Setter(xarg) {
var arg = xarg;
arg = (arg ? Q.trim(arg) : "");
this.anony = this.usePar = false;
if (arg == "") {
this.accessList = { anony : true, length : 0 };
return;
}
var scanner = new Scanner(xarg);
;
var accessList;
if (arg.charAt(0) == "#") {
accessList = [];
scanner.pos++;
this.usePar = true;
} else {
accessList = [ConstFunc(nextIdentifier(scanner))];
}
this.accessList = accessList;
while (!scanner.end()) {
;
if (arg.charAt(scanner.pos++) == "[") {
accessList.push(evaluateFunc(nextExpr(scanner, "]")));
;
} else {
accessList.push(ConstFunc(nextIdentifier(scanner)));
}
}
}
function SetterInstance(usePar, accessList, data, env) {
var pcind = env.parCtrlIndexes;
var pind = pcind.indexes;
this.anony = usePar && pcind.anony || accessList.anony;
if (this.anony) {
this.indexes = [env.generateName()];
} else {
var indexes = new Array((usePar ? pind.length : 0) + accessList.length);
var j = 0;
if (usePar)
for (var i = 0; i < pind.length; i++)
indexes[j++] = pind[i];
for (var i = 0; i < accessList.length; i++) indexes[j++] = accessList[i](data);
this.indexes = indexes;
}
}
SetterInstance.prototype = {
set : function (obj, value) {
var indexes = this.indexes;
if (indexes.length == 0) {
obj["__default"] = value;
return;
}
for (var i = 0; i < indexes.length - 1; i++) {
var id = indexes[i];
var next = obj[id];
if (next == null) obj[id] = next = (typeof(indexes[i + 1]) == "string" ? {} : []);
obj = next;
}
obj[indexes[indexes.length - 1]] = value;
},
get : function (obj) {
var indexes = this.indexes;
if (indexes.length == 0) return (obj ? obj["__default"] : null);
for (var i = 0; i < indexes.length; i++) {
if (obj == null) return null;
obj = obj[indexes[i]];
}
return obj;
}
};
Setter.prototype = {
set : function (data, env, obj, value) {
(new SetterInstance(this.usePar, this.accessList, data, env)).set(obj, value);
},
getSetterInstance : function (data, env) {
return new SetterInstance(this.usePar, this.accessList, data, env);
}
};
function SelfInsertTag(args, scanner) {
;
this.text = args[0];
}
SelfInsertTag.prototype = {
generate : function (data, env) {
env.push(this.text);
}
};
function EvalTag(args, scanner) {
;
this.evalFunc = evaluateFunc(args[0]);
}
EvalTag.prototype = {
generate : function (data, env) {
var result = this.evalFunc(data);
if (result == null)
result = data.undefined_text;
else
result = Q.escape(result);
env.push(result);
}
};
function ExecTag(args, scanner) {
;
this.exec = executeFunc(args[0]);
}
ExecTag.prototype = {
generate : function (data, env) {
this.exec(data);
}
};
function Block() {
this.tags = [];
}
Block.prototype = {
generate : function (data, env) {
var result = [];
var tags = this.tags;
for (var i = 0; i < tags.length; i++) {
var tag = tags[i];
tags[i].generate(data, env);
if (env.cStop) break;
}
return result.join("");
},
appendUntilDummy : function (scanner) {
var tag = scanner.nextTag();
while (!(tag.generator.__type == "DummyTag")) {
this.tags.push(tag.generator);
tag = scanner.nextTag();
}
return tag;
}
};
function DummyTag(args) { this.args = args; }
DummyTag.prototype = {
generate : function (data, env) {
;
},
"__type" : "DummyTag"
};
var postExecList = [];
function runPostExec() {
for (var i = 0; i < postExecList.length; i++) {
var elem = postExecList[i];
elem();
}
postExecList = [];
}
function postExec(func) {
postExecList.push(func);
if (postExecList.length == 1 && !isLoading()) setTimeout(runPostExec, 0);
}
function dispose() {
postExecList = [];
}
var evaluators = {};
var undefinedText = "";
function EnvManager(container, doc, wind) {
this.container = container;
this.cname = "__" + container.id;
this.id = 0;
this.nid = 0;
this.parCtrlIndexes = { anony: false, indexes: [] };
this.doc = doc;
this.wind = wind;
this.hasForm = false;
}
EnvManager.prototype = {
generateId : function () {
return this.cname + "_S_" + (this.id++);
},
generateName : function () {
return "__anony_" + (this.nid++);
},
pushScope : function (cname) {
var result = [this.cname, this.id, this.nid, this.hasForm];
this.cname = cname;
this.id = 0;
this.nid = 0;
return result;
},
popScope : function (arg) {
this.cname = arg[0];
this.id = arg[1];
this.nid = arg[2];
this.hasForm = arg[3];
},
addRenderHook : function (handler) {
this.form.onrenderHooks.push(handler);
},
prerender : function (form) {
this.form = form;
form.onrenderHooks = [];
},
callRenderHook : function () {
var hooks = this.form.onrenderHooks;
for (var i = 0; i < hooks.length; i++) {
hooks[i].onrender(this);
}
},
initRender : function () { this.htmlList = []; },
push : function (str) { if (str != null) this.htmlList.push(str); },
getHtml : function () { return this.htmlList.join(""); }
};
function Evaluator(tags, prop, lang) {
this.block = new Block();
this.block.tags = tags;
this.undefined_text = undefinedText;
this.prop = prop;
this.lang = lang;
}
Evaluator.prototype = {
evaluateData : function (data, dataList, env) {
setupDataObj(data, dataList);
data.ROOT = env.container;
data.TOP = env.form;
data.WIND = env.wind;
this.block.generate(data, env);
}
};
function finalFinalFunc() {
if (this.hidden)
return null;
else
return this.eval();
};
function __renderTemp(node, tmp, args, callback, path) {
var env = new EnvManager(node, node.ownerDocument, window);
var data;
if (node.form) {
var oldSt = node.form.status();
env.oldStatus = oldSt.ctrls;
data = oldSt.data;
node.form.dispose();
node.form = null;
} else {
data = {};
}
var form = new FormCtrl(null, false);
form.data = form.__data = data;
env.prerender(form);
env.initRender();
tmp.evaluateData(data, args, env);
node.innerHTML = env.getHtml();
node.form = env.form;
env.callRenderHook();
if (callback && (typeof(callback) == "function")) callback(node);
}
function renderTemp(node, tmp, args, callback, path) {
postExec(function() { __renderTemp(node, tmp, args, callback, path); });
}
function renderTextTemp(node, text, data, callback) {
if (node.id == "" || node.id == undefined) node.id = uniqueId();
var tmp = loadTemplate(text);
renderTemp(node, tmp, data, callback);
}
function renderData(obj, temp, data, callback) {
renderTemp(obj, temp, data, callback);
}
function render(node, data, callback) {
var elem = (typeof(node) == "string" ? document.getElementById(node): node);
if (!elem.jsrlTemplate) elem.jsrlTemplate = getTemplate(":" + node);
renderData(elem, elem.jsrlTemplate, data, callback);
}
function clear(node) {
node.form = undefined;
}
function rerender(name, data, callback) {
var elem = (typeof(node) == "string" ? document.getElementById(node): node);
clear(elem);
render(elem, data, callback);
}
function attachNode(node, tmp, data, callback) {
var trueName = parseFarTmpName(tmp);
postExec(function () {
clear(node);
if (typeof(node) == "string") node = document.getElementById(node);
if (node.id == "" || node.id == undefined) node.id = uniqueId();
node.jsrlTemplate = getTemplate(trueName);
renderData(node, node.jsrlTemplate, data, callback);
});
}
function renderNode(node, data, callback) {
if (node.id == "" || node.id == undefined) node.id = uniqueId();
if (!node.jsrlTemplate) node.jsrlTemplate = getTemplate(":" + node.id);
renderData(node, node.jsrlTemplate, data, callback);
}
var tags = {};
var basePath, basePathStr;
function registerTag(name, obj) {
;
tags[name] = obj;
}
function loadTemplate(template, prop, lang, path) {
if (!path) path = location.href;
basePath = path;
basePathStr = "\"" + Q.stringize(path) + "\"";
var scanner = new Scanner(template);
var count = 0;
var list = [];
while (!scanner.end()) {
var tag = scanner.nextTag();
;
list.push(tag.generator);
}
var result = new Evaluator(list, prop, lang);
basePath = basePathStr = null;
return result;
}
var loadedUrl = {};
var loading = 0;
var uniqueIdCount = 0;
function LazyTemplate(name, path, text, prop, lang) {
this.name = name;
this.path = path;
this.text = text;
this.prop = prop;
this.lang = lang;
}
LazyTemplate.prototype.__type = "LazyTemplate";
function isLoading() {
return loading > 0 || (parent != window && parent.Jsrl && parent.Jsrl.isLoading());
}
function uniqueId() {
return "__unique_" + (uniqueIdCount++);
}
function registerTemplate(name, text) {
;
var result = loadTemplate(text);
evaluators[name] = result;
return result;
}
function registerLazyTemplate(name, tmp) {
evaluators[name] = tmp;
}
function getJsrlTemplate(node) {
if (node.tagName == "DIV" || node.tagName == "SPAN") {
var elem = node.firstChild;
if (elem != null && elem.nodeType == 8 && node.childNodes.length == 1)
return elem.data;
}
return null;
}
function loadTemplateInPage(name) {
var node = document.getElementById(name);
;
var tempText = getJsrlTemplate(node);
;
var result = registerTemplate(":" + name, tempText);
return result;
}
function getTemplate(name) {
var result = evaluators[name];
if (result == null) {
if (name.charAt(0) == ":") {
result = loadTemplateInPage(name.substr(1));
;
} else if (name.charAt(0) == "!") {
result = loadTemplateInPage(name);
;
} else {
if (parent != window && parent.Jsrl)
result = parent.Jsrl.getTemplate(name, true);
;
}
} else if (result.__type == "LazyTemplate") {
evaluators[name] = result = loadTemplate(result.text, result.prop, result.lang, result.path);
}
return result;
}
function parseFarTmpName(farName) {
var pos = farName.indexOf(':');
if (pos > 0) {
loadLibrary(farName.substr(0, pos));
return farName.substr(pos + 1);
} else
return farName;
}
function findTemplate(name, callback) {
var trueName = parseFarTmpName(name);
postExec(function () {
var tmp = getTemplate(trueName);
if (callback) callback(tmp, trueName);
});
}
var propParsers = {};
function registerPropParser(name, parser) {
propParsers[name] = parser;
}
function loadXml(absPath, doc) {
var root = doc.documentElement;
;
var rootLang = root.getAttribute("lang");
var nodes = root.childNodes;
for (var i = 0; i < nodes.length; i++) {
var node = nodes[i];
if (node.nodeType == 1) {
if (node.nodeName == "require") {
loadLibrary(node.getAttribute("path"), absPath);
} else {
var lang = node.getAttribute("lang");
if (!lang) lang = rootLang;
if (!isCompatibleLang(language, lang)) continue;
var txt = null;
var j, name, isTmp;
;
if (node.nodeName == "template") {
isTmp = true;
name = node.getAttribute("name");
} else {
isTmp = false;
name = node.getAttribute("key");
}
for (j = 0; j < node.childNodes.length; j++) {
var subNode = node.childNodes[j];
;
if (subNode.nodeType == 4) {
txt = subNode.nodeValue;
break;
}
}
;
if (isTmp) {
var oldTmp = evaluators[name];
if (!oldTmp || needsOverrideLang(lang, oldTmp.lang))
{
var prop = {};
var props = node.getElementsByTagName("property");
for (var k = 0; k < props.length; k++) {
var pname = props[k].getAttribute("name");
var value = props[k].getAttribute("value");
;
var parser = propParsers[pname];
var parsedVal = (parser ? parser(value, pname) : value);
prop[pname] = parsedVal;
}
registerLazyTemplate(name, new LazyTemplate(name, absPath, txt, prop, lang));
}
} else if (node.nodeName == "dict") {
registerDictItem(lang, name, Q.evalJSON(txt));
}
}
}
}
}
function replaceVar(str, vars) {
var varExp = /{(\w+)}/g;
var result = [], lastIdx = 0;
var m;
while (m = varExp.exec(str)) {
;
result.push(str.substring(lastIdx, m.index));
result.push(vars[m[1]]);
lastIdx = m.index + m[0].length;
}
result.push(str.substr(lastIdx));
return result.join("");
}
function loadLibrary(url, ref) {
if (ref == null) ref = location.pathname;
url = replaceVar(url, metaVars);
var absPath = Q.toAbsPath(ref, url);
if (loadedUrl[absPath] == true) return true;
loadedUrl[absPath] = true;
loading++;
Q.ajax(absPath, function (req) {
;
loadXml(absPath, req.responseXML);
loading--;
if (loading == 0) setTimeout(runPostExec, 0);
});
return false;
}
function loadForTag(tagName) {
var nodes = document.getElementsByTagName(tagName);
for (var i = 0; i < nodes.length; i++)
if ((!nodes[i].id || nodes[i].id.charAt(0) != "!") && getJsrlTemplate(nodes[i]) != null) {
try {
renderNode(nodes[i]);
} catch (e) { }
}
}
function loadAll(callback) {
loadForTag("DIV");
loadForTag("SPAN");
if (callback) postExec(callback);
}
function SetTag(args, scanner) {
;
this.setter = new Setter(args[0]);
this.value = evaluateFunc(args[1]);
}
SetTag.prototype = {
generate : function (data, env) {
this.setter.set(data, env, data, this.value(data));
}
};
registerTag("set", SetTag);
function ForEachTag(args, scanner) {
;
this.setter = new Setter(args[0]);
this.listSrc = evaluateFunc(args[1]);
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
}
ForEachTag.prototype = {
generate : function (data, env) {
var list = this.listSrc(data);
var isArray = Q.isArray(list);
for (var i in list) {
if (typeof(list[i]) == "function") continue;
this.setter.set(data, env, data, isArray ? list[i] : i);
this.body.generate(data, env);
if (env.cContLoop) env.cStop = env.cContLoop = false;
if (env.cStop) break;
}
if (env.cContOutLoop) env.cStop = env.cContOutLoop = false;
}
};
registerTag("foreach", ForEachTag);
function ForTag(args, scanner) {
;
this.init = executeFunc(args[0]);
this.cond = evaluateFunc(args[1]);
this.incr = executeFunc(args[2]);
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
}
ForTag.prototype = {
generate : function (data, env) {
for (this.init(data); this.cond(data); this.incr(data)) {
this.body.generate(data, env);
if (env.cContLoop) env.cStop = env.cContLoop = false;
if (env.cStop) break;
}
if (env.cContOutLoop) env.cStop = env.cContOutLoop = false;
}
};
registerTag("for", ForTag);
function WhileTag(args, scanner) {
;
this.cond = evaluateFunc(args[0]);
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
}
WhileTag.prototype = {
generate : function (data, env) {
while (this.cond(data)) {
this.body.generate(data, env);
if (env.cContLoop) env.cStop = env.cContLoop = false;
if (env.cStop) break;
}
if (env.cContOutLoop) env.cStop = env.cContOutLoop = false;
}
};
registerTag("while", WhileTag);
function DoTag(args, scanner) {
;
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
this.cond = evaluateFunc(last.generator.args[0]);
}
DoTag.prototype = {
generate : function (data, env) {
do {
this.body.generate(data, env);
if (env.cContLoop) env.cStop = env.cContLoop = false;
if (env.cStop) break;
} while (this.cond(data));
if (env.cContOutLoop) env.cStop = env.cContOutLoop = false;
}
};
registerTag("do", DoTag);
function IfTag(args, scanner) {
;
this.cases = [];
this.cases.push({ "cond" : evaluateFunc(args[0]), "body" : new Block() });
var next = this.cases[0].body.appendUntilDummy(scanner);
this.elseBody = null;
while (next.type != "end_if" && next.type != "E") {
;
var body = new Block();
if (next.type == "elseif") {
;
;
this.cases.push({ "cond" : evaluateFunc(next.generator.args[0]), "body" : body });
} else if (next.type == "else") {
;
this.elseBody = body;
}
next = body.appendUntilDummy(scanner);
}
;
}
IfTag.prototype = {
generate : function (data, env) {
for (var i = 0; i < this.cases.length; i++)
if ((this.cases[i].cond)(data)) {
this.cases[i].body.generate(data, env);
return;
}
if (this.elseBody != null)
this.elseBody.generate(data, env);
}
};
registerTag("if", IfTag);
function GridTagLoopBody(preTags, postTags, oldLoop, colSize) {
this.preTags = preTags;
this.postTags = postTags;
this.oldLoop = oldLoop;
this.colSize = colSize;
this.iter = 0;
}
GridTagLoopBody.prototype = {
generate : function (data, env) {
if (this.iter % this.colSize == 0) this.preTags.generate(data, env);
this.oldLoop.body.generate(data, env);
this.iter++;
if (this.iter % this.colSize == 0) this.postTags.generate(data, env);
}
};
function GridTag(args, scanner) {
;
this.colSize = evaluateFunc(args[0]);
this.preTags = new Block();
var next = this.preTags.appendUntilDummy(scanner);
;
;
this.loop = scanner.nextTag().generator;
;
this.postTags = new Block();
next = this.postTags.appendUntilDummy(scanner);
if (next.type == "empty") {
;
this.emptyBody = new Block();
next = this.emptyBody.appendUntilDummy(scanner);
}
}
GridTag.prototype = {
generate : function (data, env) {
var loop = Q.clone(this.loop);
var colSize = this.colSize(data);
loop.body = new GridTagLoopBody(this.preTags, this.postTags, this.loop, colSize);
loop.generate(data, env);
var needOver = (loop.body.iter % colSize != 0);
if (this.emptyBody) {
for (var i = loop.body.iter; i % colSize != 0; i++)
this.emptyBody.generate(data, env);
}
if (needOver) this.postTags.generate(data, env);
}
};
registerTag("grid", GridTag);
function BreakTag(args, scanner) {
;
}
BreakTag.prototype = {
generate : function (data, env) {
env.cStop = true;
env.cContOutLoop = true;
}
};
registerTag("break", BreakTag);
function ContinueTag(args, scanner) {
;
}
ContinueTag.prototype = {
generate : function (data, env) {
env.cStop = true;
env.cContLoop = true;
}
};
registerTag("continue", ContinueTag);
function ReturnTag(args, scanner) {
;
}
ReturnTag.prototype = {
generate : function (data, env) {
env.cStop = true;
env.cContTemp = true;
}
};
registerTag("return", ReturnTag);
function ExitTag(args, scanner) {
;
}
ExitTag.prototype = {
generate : function (data, env) {
env.cStop = true;
}
};
registerTag("exit", ExitTag);
function HtmlizeTag(args, scanner) {
;
this.value = evaluateFunc(args[0]);
}
HtmlizeTag.prototype = {
generate : function (data, env) {
var result = this.value(data);
if (result == null) result = env.undefined_text;
env.push(Q.htmlize(result));
}
};
registerTag("_", HtmlizeTag);
function HtmlTag(args, scanner) {
;
this.value = evaluateFunc(args[0]);
}
HtmlTag.prototype = {
generate : function (data, env) {
var result = this.value(data);
if (result == null) result = env.undefined_text;
env.push(result);
}
};
registerTag("html", HtmlTag);
function parseAttributes(tag, parsers, args, index) {
tag.attributes = [];
for (var i = index; i < args.length; i++) {
var att = parseAttribute(args[i]);
var parser = parsers[att.name];
if (parser == null && att.func)
parser = new EventAttParser(att.name);
;
;
tag.attributes.push(parser.parse(att.value, tag));
}
}
function generateAttributes(tag, data, ctrl, env) {
var atts = tag.attributes;
for (var i = 0; i < atts.length; i++)
atts[i].generate(data, ctrl, tag, env);
}
function CtrlAttGenerator(name, value) {
this.name = name;
this.value = value;
}
CtrlAttGenerator.prototype = {
generate : function (data, ctrl, tag) {
ctrl[this.name] = this.value(data);
}
};
function CtrlAttParser(name) { this.name = name; }
CtrlAttParser.prototype = {
parse : function (value, tag) {
return new CtrlAttGenerator(this.name, evaluateFunc(value));
}
};
function SimpleAttGenerator(name, value) {
this.name = name;
this.value = value;
}
SimpleAttGenerator.prototype = {
generate : function (data, ctrl, tag, env) {
var value = this.value(data);
if (value != null)
env.push(" " + this.name + "=\"" + Q.escape(value + "") + "\" ");
}
};
function SimpleAttParser(name) { this.name = name; }
SimpleAttParser.prototype = {
parse : function (value, tag) {
return new SimpleAttGenerator(this.name, evaluateFunc(value));
}
};
function ValueAttGenerator(name, value) {
this.name = name;
this.value = value;
}
ValueAttGenerator.prototype = {
generate : function (data, ctrl, tag, env) {
ctrl[this.name] = this.value(data);
}
};
function ValueAttParser(name) { this.name = name; }
ValueAttParser.prototype = {
parse : function (value, tag) {
return new ValueAttGenerator(this.name, evaluateFunc(value));
}
};
function createEventHandler(handler, data, env, ctrl, ctrls, args, info) {
var dataClone = Q.clone(data);
var form = env.form;
return function (event) {
return handler(event, env.doc, dataClone, ctrl, form, ctrls, args);
};
}
function EventAttGenerator(type, handler) {
this.type = type;
this.handler = handler;
}
EventAttGenerator.prototype = {
getCtrlEventFunc : function (data, env) {
var handler = this.handler;
var dataClone = Q.clone(data);
var form = env.form;
return function (ctrl, event, args) {
return handler(event, env.doc, dataClone, ctrl, form, form.ctrls, args);
}
},
generate : function (data, ctrl, tag, env, args) {
if (ctrl.handlers == null) ctrl.handlers = {};
var ctrls = (ctrl.__type == "FormCtrl" ? ctrl.ctrls : env.form.ctrls);
ctrl.handlers[this.type] = createEventHandler(this.handler, data, env, ctrl, ctrls, args, this.info);
}
};
function sharpParseFunc(scanner, value) {
if (scanner.end())
return "self";
ch = value.charAt(scanner.pos);
if (ch == "#") {
scanner.pos++;
return "#";
} else if (identBeginner.test(ch)) {
return "ctrls.";
} else {
return "self";
}
}
function createEventFunc(value) {
var scanner = new Scanner(value);
var s = nextExpr(scanner, null, "#", sharpParseFunc);
var r;
r = evalFunc("function (event, document, __data, self, form, ctrls, args) { " + s + "; }");
return r;
}
function EventAttParser(type) { this.type = type; }
EventAttParser.prototype = {
isFuncAtt : true,
parse : function (value, tag) {
return new EventAttGenerator(this.type, createEventFunc(value));
}
};
var nullGenerator = { generate : function () { } };
var idAttParser = {
"id" : {
parse : function (value, tag) { tag.idFunc = evaluateFunc(value); return nullGenerator; }
}
};
var hiddenAttribute = { "hidden" : new CtrlAttParser("hidden") };
var valueCtrlAttParsers = hiddenAttribute;
function getId(tag, data, env) {
return (tag.idFunc ? tag.idFunc(data) : env.generateId());
}
function simpleAttParserMap() {
var result = {};
for (var i = 0; i < arguments.length; i++)
result[arguments[i]] = new SimpleAttParser(arguments[i]);
return result;
}
function valueAttParserMap() {
var result = {};
for (var i = 0; i < arguments.length; i++)
result[arguments[i]] = new ValueAttParser(arguments[i]);
return result;
}
var generalAttParsers = Q.union(idAttParser, simpleAttParserMap("class", "style"));
function tagByIdName(tagName, id, name) { return "<" + tagName + " id=\"" + id + "\" name=\"" + name + "\" "; }
function tagById(tagName, id) { return tagByIdName(tagName, id, id); }
function subId(id, index) { return id + "_" + index; }
function addEvent(node, type, ctrl, name) {
var h = ctrl.handlers[name];
if (h != null)
Q.attachEvent(node, type, h);
}
var handlerMap = {};
var commonEvents = [ "change", "click", "dbclick", "focus", "blur", "mouseover", "mouseout", "mouseup", "mousedown", "keyup", "keydown", "keypress" ];
for (var i = 0; i < commonEvents.length; i++)
handlerMap["on" + commonEvents[i]] = commonEvents[i];
function addCommonEvents(ctrl, node) {
if (!ctrl.handlers) ctrl.handlers = nullObj;
if (!node) node = ctrl.node;
var handlers = ctrl.handlers;
for (var i in handlers) {
var name = handlerMap[i];
if (name)
Q.attachEvent(node, name, handlers[i]);
}
}
function getSafeFunc(func, self) {
return function () {
func.apply(self);
return false;
};
}
var imgParserMap = Q.union(generalAttParsers, {"width":new CtrlAttParser("width"), "height":new CtrlAttParser("height")});
function ImgTag(args, scanner) {
this.url = evaluateFunc(args[0]);
parseAttributes(this, imgParserMap, args, 1);
}
function ImgTagOnRender(id, url, width, height) {
this.id = id;
this.url = url;
this.width = width;
this.height = height;
}
function imgOnload(img, timg, w, h, oldVis) {
if (!timg) return;
var width, height;
if (w < 0) {
if (h < 0) {
width = img.width;
height = img.height;
} else {
height = Math.min(h, img.height);
width = img.width * height / img.height;
}
} else {
if (h < 0) {
width = Math.min(w, img.width);
height = img.height * width / img.width;
} else {
if (img.width * h > img.height * w) {
width = Math.min(w, img.width);
height = img.height * width / img.width;
} else {
height = Math.min(h, img.height);
width = img.width * height / img.height;
}
}
}
timg.width = width;
timg.height = height;
timg.src = img.src;
timg.style.visibility = oldVis;
}
ImgTagOnRender.prototype = {
onrender : function (env) {
var img = new Image();
var timg = env.doc.getElementById(this.id);
var oldVis = timg.style.visibility;
timg.style.visibility = "hidden";
var w = this.width, h = this.height;
img.onload = function () { imgOnload(img, timg, w, h, oldVis); };
img.src = this.url;
}
};
ImgTag.prototype = {
generate : function (data, env) {
var name = getId(this, data, env);
env.push(tagById("img", name));
generateAttributes(this, data, this, env);
var width = (this.width == null ? -1 : this.width);
var height = (this.height == null ? -1 : this.height);
var url = this.url(data);
if (width >= 0) env.push("width=\"" + width + "\" ");
if (height >= 0) env.push("height=\"" + height + "\" ");
env.addRenderHook(new ImgTagOnRender(name, url, width, height));
env.push("/>");
}
};
registerTag("img", ImgTag);
var cmdClickParser = new EventAttParser("onclick");
function CmdCtrl(id, env) {
this.id = id;
this.parent = env.form;
}
CmdCtrl.prototype = {
onrender : function (env) {
var ctrl = env.doc.getElementById(this.id);
ctrl.onclick = getSafeFunc(this.handlers.onclick);
}
};
function CmdTag(args, scanner) {
;
this.text = evaluateFunc(args[0]);
parseAttributes(this, focusableAttParsers, args, 2);
this.attributes.push(cmdClickParser.parse(args[1], this));
}
CmdTag.prototype = {
generate : function (data, env) {
var id = getId(this, data, env);
env.push(tagById("a href=\"#\"", id));
var cmdCtrl = new CmdCtrl(id, env);
generateAttributes(this, data, cmdCtrl, env);
env.push(">" + Q.escape(this.text(data)) + "</a>");
env.addRenderHook(cmdCtrl);
}
};
registerTag("cmd", CmdTag);
function CmdxTag(args, scanner) {
;
parseAttributes(this, generalAttParsers, args, 1);
this.attributes.push(cmdClickParser.parse(args[0], this));
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
}
CmdxTag.prototype = {
generate : function (data, env) {
var id = getId(this, data, env);
env.push(tagById("a href=\"#\"", id));
var cmdCtrl = new CmdCtrl(id, env);
generateAttributes(this, data, cmdCtrl, env);
env.push(">");
this.body.generate(data, env);
env.push("</a>");
env.addRenderHook(cmdCtrl);
}
};
registerTag("cmdx", CmdxTag);
function FormCtrl(parent, isForm) {
this.reset();
this.parent = parent;
this.isForm = isForm;
this.onrenderHooks = [];
this.refreshListeners = [];
}
FormCtrl.prototype = {
reset : function () {
this.subForms = [];
this.ctrls = {};
},
status : function () { return { data: this.data, ctrls: Q.apply(this.ctrls, "status", []) }; },
get : function () { return Q.apply(this.ctrls, "get", []); },
eval : function () {
return (!this.handlers || !this.handlers.value) ? Q.apply(this.ctrls, "_eval", []) : this.handlers.value();
},
_eval : finalFinalFunc,
submit : function () {
var result = true;
for (var i = 0; i < this.subForms.length; i++)
result &= this.subForms[i].submit();
return result && (!this.handlers || !this.handlers.submit || this.handlers.submit());
},
onshow : function () {
for (var i = 0; i < this.subForms.length; i++)
this.subForms[i].onshow();
return (!this.handlers || !this.handlers.show || this.handlers.show());
},
onhide : function () {
for (var i = 0; i < this.subForms.length; i++)
this.subForms[i].onhide();
return (!this.handlers || !this.handlers.hide || this.handlers.hide());
},
onclose : function () {
var result = true;
for (var i = 0; i < this.subForms.length; i++)
result &= this.subForms[i].onclose();
return result && (!this.handlers || !this.handlers.close || this.handlers.close());
},
dispose : function () {
for (var i = 0; i < this.subForms.length; i++)
this.subForms[i].dispose();
this.subForms = undefined;
this.ctrls = undefined;
},
addRefreshListener : function (listener) { this.refreshListeners.push(listener); },
notifyRefresh : function () {
for (var i = 0; i < this.refreshListeners.length; i++)
(this.refreshListeners[i])();
},
_render : function (args) {
if (!this.ctrls) return;
if (this.env.doc.getElementById(this.node.id) != this.node) {
this.dispose();
return;
}
setupDataObj(this.data, args);
var env = Q.clone(this.env);
env.prerender(this);
env.oldStatus = this.status().ctrls;
this.dispose();
this.reset();
env.initRender();
this.body.generate(this.data, env);
this.node.innerHTML = env.getHtml();
env.callRenderHook();
var form = this;
do {
form.notifyRefresh();
form = form.parent;
} while (form);
},
render : function (args) {
if (!this.ctrls) return;
var obj = this;
postExec(function() { obj._render(args); });
},
rerender : function (args) { this.ctrls = {}; this.render(args); },
onrender : function (env) {
this.node = env.doc.getElementById(this.id);
var hooks = this.onrenderHooks;
for (var i = 0; i < hooks.length; i++) {
hooks[i].onrender(env);
}
if (this.isForm) this.node.onsubmit = getSafeFunc(this.submit, this);
if (this.handlers && this.handlers.onload) this.handlers.onload();
},
"__type" : "FormCtrl"
};
var formParserMap = Q.union(hiddenAttribute, generalAttParsers, {"value": new EventAttParser("value")});
var formEventNames = [ "submit", "show", "hide", "close" ];
for (var i = 0; i < formEventNames.length; i++) {
var name = formEventNames[i];
formParserMap["on" + name] = new EventAttParser(name);
}
function registerFormNsTag(name, useForm) {
var Tag = function (args, scanner) {
this.setter = new Setter(args[0]);
parseAttributes(this, formParserMap, args, 1);
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
};
Tag.prototype = {
generate : function (data, env) {
var oldForm = env.form;
var isForm = (!env.hasForm && useForm);
var tagName = (isForm ? "form" : "div");
var sinst = this.setter.getSetterInstance(data, env);
var oldOldStatus = env.oldStatus;
var formSt = sinst.get(oldOldStatus);
env.oldStatus = (formSt ? formSt.ctrls : null);
var newData;
if (formSt && formSt.data) {
newData = formSt.data;
for (var i in data)
newData[i] = data[i];
} else
newData = Q.clone(data);
var ctrl = new FormCtrl(oldForm, isForm);
ctrl.data = ctrl.__data = newData;
if (sinst.anony) ctrl.hidden = true;
ctrl.id = getId(this, newData, env);
env.push(tagById(tagName, ctrl.id));
generateAttributes(this, newData, ctrl, env);
env.push(">");
oldForm.subForms.push(ctrl);
env.addRenderHook(ctrl);
sinst.set(oldForm.ctrls, ctrl);
env.form = ctrl;
var oldScope = env.pushScope(ctrl.id);
env.hasForm |= isForm;
ctrl.env = Q.clone(env);
ctrl.body = this.body;
this.body.generate(newData, env);
env.push("</" + tagName + ">");
for (var i in data)
data[i] = newData[i];
ctrl.data.__outerData = Q.clone(newData.__outerData);
ctrl.data.__args = Q.clone(newData.__args);
env.popScope(oldScope);
env.form = oldForm;
env.oldStatus = oldOldStatus;
}
};
registerTag(name, Tag);
}
registerFormNsTag("form", true);
registerFormNsTag("ns", false);
function CtrlBase(args, scanner, extraArg, ctrlClass, parserMap, attIndex) {
;
this.setter = new Setter(args[0]);
this.initVal = (isEmptyArg(args[1]) ? null : evaluateFunc(args[1]));
this.ctrlInst = new ctrlClass(args, scanner, extraArg);
parseAttributes(this.ctrlInst, parserMap, args, attIndex);
}
function CtrlOnRender(ctrl, status) {
this.ctrl = ctrl;
this.status = status;
}
CtrlOnRender.prototype = {
onrender : function (env) {
var ctrl = this.ctrl;
ctrl.init(env);
if (this.status)
ctrl.restore(this.status);
else
ctrl.set(ctrl.initVal);
}
};
CtrlBase.prototype = {
generate : function (data, env) {
var sinst = this.setter.getSetterInstance(data, env);
var res = this.ctrlInst.generate(data, env, getId(this, data, env));
if (sinst.anony && res.hidden == null) res.hidden = true;
if (!res.eval) res.eval = res.get;
if (!res.status) res.status = res.get;
if (!res.restore) res.restore = res.set;
res._eval = finalFinalFunc;
res.parent = env.form;
sinst.set(env.form.ctrls, res);
var status = sinst.get(env.oldStatus);
res.initVal = (this.initVal == null ? this.defaultValue : this.initVal(data));
if (res.initVal == null) res.initVal = this.defaultValue;
env.addRenderHook(new CtrlOnRender(res, status));
}
};
function registerCtrl(tagName, ctrlClass, extraArg, defaultValue, parserMap, extraArgs) {
if (parserMap == null) parserMap = {};
if (extraArgs == null) extraArgs = 0;
var tagClass = function (args, scanner) {
CtrlBase.call(this, args, scanner, extraArg, ctrlClass, parserMap, extraArgs + 2);
};
Q.extend(tagClass, CtrlBase);
tagClass.prototype.defaultValue = defaultValue;
registerTag(tagName, tagClass);
}
var focusableAttParsers = Q.union(generalAttParsers, simpleAttParserMap("tabindex", "accesskey"));
var generalCtrlAttParsers = Q.union(focusableAttParsers, valueCtrlAttParsers);
function TextCtrl(id, needTrim) {
this.id = id;
this.needTrim = needTrim;
}
TextCtrl.prototype = {
init : function (env) {
this.node = env.doc.getElementById(this.id);
addCommonEvents(this);
},
set : function (value) {
this.node.value = value;
},
get : function () {
return this.node.value;
},
eval : function () {
return (this.needTrim ? Q.trim(this.node.value) : this.node.value);
},
focus : function () { this.node.focus(); }
};
function TextCtrlTag(args, scanner, extraArg) { this.typeName = extraArg; }
TextCtrlTag.prototype = {
generate : function (data, env, id) {
var ctrl = new TextCtrl(id, true);
env.push(tagById("input type=\"" + this.typeName + "\"", id));
generateAttributes(this, data, ctrl, env);
env.push("/>");
return ctrl;
}
};
var textParserMap = Q.union(generalCtrlAttParsers, simpleAttParserMap("length", "size"));
registerCtrl("text", TextCtrlTag, "text", "", textParserMap);
registerCtrl("password", TextCtrlTag, "password", "", textParserMap);
function TextAreaCtrlTag(args, scanner) { }
TextAreaCtrlTag.prototype = {
generate : function (data, env, id) {
var ctrl = new TextCtrl(id, false);
env.push(tagById("textarea", id));
generateAttributes(this, data, ctrl, env);
env.push("></textarea>");
return ctrl;
}
};
registerCtrl("textarea", TextAreaCtrlTag, null, "", Q.union(generalCtrlAttParsers, simpleAttParserMap("rows", "cols")));
function CheckboxCtrl(id) { this.id = id; }
CheckboxCtrl.prototype = {
init : function (env) {
this.node = env.doc.getElementById(this.id);
addCommonEvents(this);
},
set : function (value) { this.node.checked = value; },
get : function () { return this.node.checked; },
focus : function () { this.node.focus(); }
};
function CheckboxCtrlTag() {}
CheckboxCtrlTag.prototype = {
generate : function (data, env, id) {
var ctrl = new CheckboxCtrl(id);
env.push(tagById("input type=\"checkbox\"", id));
generateAttributes(this, data, ctrl, env);
env.push("/>");
return ctrl;
}
};
registerCtrl("checkbox", CheckboxCtrlTag, null, false, generalCtrlAttParsers);
function RadioGroupCtrl(id, ids, values) {
this.id = id;
this.ids = ids;
this.values = values;
}
RadioGroupCtrl.prototype = {
init : function (env) {
this.nodes = new Array(this.values.length);
if (!this.handlers) this.handlers = nullObj;
for (var i = 0; i < this.values.length; i++) {
this.nodes[i] = env.doc.getElementById(this.ids[i]);
addEvent(this.nodes[i], "click", this, "onchange");
}
},
set : function (value) {
for (var i = 0; i < this.nodes.length; i++)
this.nodes[i].checked = (value == this.values[i]);
},
get : function () {
for (var i = 0; i < this.nodes.length; i++)
if (this.nodes[i].checked) return this.values[i];
return null;
},
focus : function () {
for (var i = 0; i < this.nodes.length; i++)
if (this.nodes[i].checked) {
this.nodes[i].focus();
return;
}
}
};
function RadioGroupCtrlTag(args, scanner) {
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
}
RadioGroupCtrlTag.prototype = {
generate : function (data, env, id) {
this.values = [];
this.ids = [];
this.id = id;
env.currentRadioGroup = this;
var ctrl = new RadioGroupCtrl(this.id, this.ids, this.values);
generateAttributes(this, data, ctrl, env);
this.body.generate(data, env);
env.currentRadioGroup = undefined;
return ctrl;
}
};
registerCtrl("radio_group", RadioGroupCtrlTag, null, null, Q.union(valueCtrlAttParsers, idAttParser));
function RadioTag(args, scanner) {
this.value = evaluateFunc(args[0]);
parseAttributes(this, focusableAttParsers, args, 1);
}
RadioTag.prototype = {
generate : function (data, env) {
var group = env.currentRadioGroup;
;
var id = (this.idFunc ? this.idFunc(data) : subId(group.id, group.values.length));
group.values.push(this.value(data));
group.ids.push(id);
env.push(tagByIdName("input type=\"radio\"", id, group.id));
generateAttributes(this, data, null, env);
env.push("/>");
}
};
registerTag("radio", RadioTag);
function SelectCtrl(id, values) {
this.id = id;
this.values = values;
}
SelectCtrl.prototype = {
init : function (env) {
this.node = env.doc.getElementById(this.id);
addCommonEvents(this);
},
set : function (value) {
for (var i = 0; i < this.values.length; i++)
if (this.values[i] == value) {
this.node.selectedIndex = i;
return;
}
if (value != this.initVal)
this.set(this.initVal);
},
get : function () { return this.values[this.node.selectedIndex]; },
focus : function () { this.node.focus(); }
};
function SelectCtrlTag(args, scanner) {
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
}
SelectCtrlTag.prototype = {
generate : function (data, env, id) {
this.values = [];
var id = env.generateId();
env.currentSelect = this;
var ctrl = new SelectCtrl(id, this.values);
env.push(tagById("select", id));
generateAttributes(this, data, ctrl, env);
env.push(">");
this.body.generate(data, env)
env.push("</select>");
env.currentSelect = undefined;
return ctrl;
}
};
registerCtrl("select", SelectCtrlTag, null, null, generalCtrlAttParsers);
function OptionTag(args, scanner) {
this.value = evaluateFunc(args[0]);
this.text = evaluateFunc(args[1]);
parseAttributes(this, generalAttParsers, args, 2);
}
OptionTag.prototype = {
generate : function (data, env) {
var select = env.currentSelect;
;
select.values.push(this.value(data));
env.push("<option ");
generateAttributes(this, data, null, env);
env.push(">" + Q.escape(this.text(data)) + "</option>");
}
};
registerTag("option", OptionTag);
function OptionxTag(args, scanner) {
this.value = evaluateFunc(args[0]);
parseAttributes(this, generalAttParsers, args, 1);
this.body = new Block();
var last = this.body.appendUntilDummy(scanner);
}
OptionxTag.prototype = {
generate : function (data, env) {
var select = env.currentSelect;
;
select.values.push(this.value(data));
env.push("<option ");
generateAttributes(this, data, null, env);
env.push(">");
this.body.generate(data, env);
env.push("</option>");
}
};
registerTag("optionx", OptionxTag);
var buttonParserMap = Q.union(generalAttParsers);
function ButtonCtrl(id, env) {
this.parent = env.form;
this.id = id;
}
ButtonCtrl.prototype = {
onrender : function (env) {
this.node = env.doc.getElementById(this.id);
addCommonEvents(this);
}
};
function ButtonCtrlTag(args, scanner, type) {
this.type = type;
this.text = evaluateFunc(args[0]);
parseAttributes(this, buttonParserMap, args, 1);
}
ButtonCtrlTag.prototype = {
generate : function (data, env) {
var id = getId(this, data, env);
var text = this.text(data);
var ctrl = new ButtonCtrl(id, env);
var tagName = this.type;
var form = env.form;
if (tagName == "submit" && !form.isForm) tagName = "button";
env.push(tagById("input type=\"" + tagName + "\" value=\"" + Q.escape(text) + "\"", id));
generateAttributes(this, data, ctrl, env);
;
if (this.type == "submit" && !form.isForm)
ctrl.handlers = { onclick: function() { form.submit(); } };
env.addRenderHook(ctrl);
env.push("/>");
}
};
function registerButtonCtrl(name, type) {
var tagClass = function (args, scanner) {
ButtonCtrlTag.call(this, args, scanner, type);
};
Q.extend(tagClass, ButtonCtrlTag);
registerTag(name, tagClass);
}
registerButtonCtrl("submit", "submit");
registerButtonCtrl("button", "button");
function HiddenCtrl() {}
HiddenCtrl.prototype = {
init : function () {},
set : function (value) { this.value = value; },
get : function () { return this.value; }
};
function HiddenCtrlTag(args, scanner) {}
HiddenCtrlTag.prototype = {
generate : function (data, env) {
var ctrl = new HiddenCtrl();
generateAttributes(this, data, ctrl, env);
return ctrl;
}
};
registerCtrl("hidden", HiddenCtrlTag, null, null, hiddenAttribute);
function getCtrlAttList(args, begId) {
var events = [], atts = [];
for (var i = begId; i < args.length; i++) {
var att = parseAttribute(args[i]);
var parser;
if (att.func) {
var event = (new EventAttParser(att.name)).parse(att.value);
events.push({"name":att.name, "e":event})
} else {
var func = evaluateFunc(att.value);
atts.push({"name":att.name, "func":func});
}
}
return [ events, atts ];
}
function appendCtrlAtts(newData, data, env, obj) {
var events = obj[0];
for (var i = 0; i < events.length; i++)
newData[events[i].name] = events[i].e.getCtrlEventFunc(data, env);
var atts = obj[1];
for (var i = 0; i < atts.length; i++)
newData[atts[i].name] = atts[i].func(data);
}
function IdCtrl(id) { this.id = id; }
IdCtrl.prototype = {
onrender : function (env) {
this.node = env.doc.getElementById(this.id);
addCommonEvents(this);
},
get : Q.nullFunc,
eval : Q.nullFunc,
_eval : Q.nullFunc,
status : Q.nullFunc,
restore : Q.nullFunc
};
function IdCtrlTag(args) {
this.setter = new Setter(args[0]);
parseAttributes(this, generalCtrlAttParsers, args, 1);
}
IdCtrlTag.prototype = {
generate : function (data, env) {
var id = getId(this, data, env);
var sinst = this.setter.getSetterInstance(data, env);
var ctrl = new IdCtrl(id);
sinst.set(env.form.ctrls, ctrl);
env.addRenderHook(ctrl);
env.push("id=\"" + id + "\" name=\"" + id + "\" ");
generateAttributes(this, data, ctrl, env);
}
};
registerTag("id", IdCtrlTag);
function LoadTag(args, scanner) {
;
this.e = createEventFunc(args[0]);
};
LoadTag.prototype = {
generate : function (data, env) {
var h = createEventHandler(this.e, data, env, env.form, env.form.ctrls, null);
env.addRenderHook({ onrender: h });
}
};
registerTag("L", LoadTag);
function COrCxTag(hasBlk) {
var CTag = function (args, scanner) {
;
this.setter = new Setter(args[0]);
this.tempName = evaluateFunc(args[1]);
this.attList = getCtrlAttList(args, 2);
if (hasBlk) {
this.blocks = [];
var last;
do {
var body = new Block();
last = body.appendUntilDummy(scanner);
;
this.blocks.push(body);
} while (last.type != "end_Cx" && last.type != "E");
}
};
CTag.prototype = {
generate : function (data, env) {
var tempName = this.tempName(data);
;
var evaluator = getTemplate(tempName);
var setterInst = this.setter.getSetterInstance(data, env);
var oldInd = env.parCtrlIndexes;
env.parCtrlIndexes = setterInst;
var newData = {};
appendCtrlAtts(newData, data, env, this.attList);
if (hasBlk) {
var blks = new Array(this.blocks.length);
for (var i = 0; i < blks.length; i++)
blks[i] = this.blocks[i];
newData.__outerBlocks = blks;
newData.NUMBLOCKS = blks.length;
newData.__outerData = data;
}
evaluator.evaluateData(newData, [], env);
env.parCtrlIndexes = oldInd;
if (env.cContTemp) env.cStop = env.cContTemp = false;
}
};
return CTag;
}
registerTag("C", COrCxTag(false));
registerTag("Cx", COrCxTag(true));
function IOrIxTag(hasBlk) {
var ITag = function (args, scanner) {
;
this.tempName = evaluateFunc(args[0]);
this.args = new Array(args.length - 1);
this.evaluator = null;
for (var i = 1; i < args.length; i++)
this.args[i - 1] = evaluateFunc(args[i]);
if (hasBlk) {
this.blocks = [];
var last;
do {
var body = new Block();
last = body.appendUntilDummy(scanner);
;
this.blocks.push(body);
} while (last.type != "end_Ix" && last.type != "E");
}
};
ITag.prototype = {
generate : function (data, env) {
var tempName = this.tempName(data);
;
var evaluator = getTemplate(tempName);
var arr = new Array(this.args.length);
for (var i = 0; i < arr.length; i++)
arr[i] = (this.args[i])(data);
var newData = {};
if (hasBlk) {
var blks = new Array(this.blocks.length);
for (var i = 0; i < blks.length; i++)
blks[i] = this.blocks[i];
newData.__outerBlocks = blks;
newData.NUMBLOCKS = blks.length;
newData.__outerData = data;
}
evaluator.evaluateData(newData, arr, env);
if (env.cContTemp) env.cStop = env.cContTemp = false;
}
};
return ITag;
}
registerTag("I", IOrIxTag(false));
registerTag("Ix", IOrIxTag(true));
function BlockTag(args, scanner) {
;
this.argId = evaluateFunc(args[0]);
this.attList = getCtrlAttList(args, 1);
}
BlockTag.prototype = {
generate : function (data, env) {
var argId = this.argId(data);
;
var blk = data.__outerBlocks[argId];
var newData = data.__outerData;
appendCtrlAtts(newData, data, env, this.attList);
blk.generate(newData, env);
}
};
registerTag("block", BlockTag);
var metaVars = {};
var dict = {};
var language;
var majorLangs = {};
var langTrans = {};
function DictPattern(pattern) {
this.compile(pattern);
}
function registerLangTransformer(c, trans) {
langTrans[c] = trans;
}
DictPattern.prototype = {
compile : function (pattern) {
var li = 0, strs = [];
this.list = [];
for (var i = 0; i < pattern.length; i++) {
var c = pattern.charAt(i);
switch (c) {
case '{':
strs.push(pattern.substring(li, i));
if (i + 1 < pattern.length && pattern.charAt(i + 1) == '{') {
li = ++i;
} else {
this.appendStr(strs);
strs = [];
var j = pattern.indexOf("}", i + 1);
;
var keys = pattern.substring(i + 1, j).split(".");
for (var k = 0; k < keys.length; k++)
if (intReg.test(keys[k]))
keys[k] = parseInt(keys[k]);
else if (k == 0)
keys.fromDict = true;
this.list.push(keys);
i = j;
li = i + 1;
}
break;
case '}':
if (i + 1 < pattern.length && pattern.charAt(i + 1) == '}') {
strs.push(pattern.substring(li, i));
li = ++i;
}
break;
}
}
strs.push(pattern.substring(li));
this.appendStr(strs);
delete this.pattern;
},
apply : function (args) {
if (!this.list) this.compile();
var l = this.list;
var result = new Array(l.length);
for (var i = 0; i < l.length; i++) {
var v = l[i], s;
if (typeof(v) == "string")
s = v;
else {
s = (v.fromDict ? dict : args);
for (var j = 0; j < v.length; j++)
if (s) s = s[v[j]];
if (s == null)
s = undefinedText;
}
result[i] = s;
}
return result.join("");
},
appendStr : function (strs) {
var s = strs.join("");
if (s.length > 0) this.list.push(s);
}
};
function registerDictItem(lang, key, value) {
var fields = key.split(".");
var v = dict;
for (var i = 0; i < fields.length - 1; i++) {
var name = fields[i];
if (name in v)
v = v[name];
else {
var o = {};
v[name] = o;
v = o;
}
}
var n = fields.pop();
if (!(n in v) || needsOverrideLang(lang, v[n].__info.lang))
{
v[n] = value;
v[n].__info = { lang: lang };
}
}
function getDictText(key, args) {
var p = key.indexOf(":"), t = "";
if (p > 0) {
t = key.substr(0, p);
key = key.substr(p + 1);
}
var fields = key.split(".");
var v = dict, lv;
for (var i = 0; i < fields.length; i++) {
lv = v;
v = v[fields[i]];
;
}
;
if (typeof(v) == "string") {
v = new DictPattern(v);
lv[fields.pop()] = v;
}
var r = v.apply(args);
for (var i = 0; i < t.length; i++) {
var c = t.charAt(i);
if (c in langTrans)
r = langTrans[c](r);
}
return r;
}
function D(key) {
var n = arguments.length - 1;
var args = new Array(n);
for (var i = 0; i < n; i++)
args[i] = arguments[i + 1];
return getDictText(key, args);
}
function dtext(v) {
if (v && v.length > 2 && v.charAt(0) == "@") {
v = v.substr(1);
if (v.charAt(0) != "@") v = D(v);
}
return v;
}
function isCompatibleLang(lang, ref) {
return lang == ref || isSubLang(lang, ref);
}
function isSubLang(lang, ref) {
return (ref == null || ref.length == 0 || lang && Q.startsWith(lang, ref + "_"))
}
function needsOverrideLang(lang, ref)
{
if (isSubLang(ref, lang)) return false;
;
;
return true;
}
function addMajorLang() {
for (var i = 0; i < arguments.length; i++)
majorLangs[arguments[i]] = true;
}
function setLanguage(lang) {
language = lang;
metaVars.lang = lang;
var i;
while ((i = lang.indexOf("_")) > 0 && !(lang in majorLangs))
lang = lang.substr(0, i);
metaVars.majorlang = lang;
}
var DTag = function (args, scanner) {
;
this.keyName = evaluateFunc(args[0]);
this.args = new Array(args.length - 1);
for (var i = 1; i < args.length; i++)
this.args[i - 1] = evaluateFunc(args[i]);
};
DTag.prototype = {
generate : function (data, env) {
var key = this.keyName(data);
;
var rargs = new Array(this.args.length);
for (var i = 0; i < rargs.length; i++)
rargs[i] = this.args[i](data);
env.push(Q.escape(getDictText(key, rargs)));
}
};
registerTag("D", DTag);
return {
"evaluateFunc": evaluateFunc,
"executeFunc": executeFunc,
"Setter": Setter,
"Block": Block,
"DummyTag": DummyTag,
"registerTag" : registerTag,
"render" : render,
"renderTextTemp" : renderTextTemp,
"rerender" : rerender,
"renderData" : renderData,
"renderNode" : renderNode,
"attachNode" : attachNode,
"clear" : clear,
"loadLibrary" : loadLibrary,
"loadAll" : loadAll,
"loadTemplate" : loadTemplate,
"findTemplate" : findTemplate,
"isLoading" : isLoading,
"getJsrlTemplate" : getJsrlTemplate,
"getTemplate" : getTemplate,
"parseAttributes" : parseAttributes,
"generalAttParsers" : generalAttParsers,
"focusableAttParsers" : focusableAttParsers,
"generateAttributes" : generateAttributes,
"simpleAttParserMap" : simpleAttParserMap,
"valueAttParserMap" : valueAttParserMap,
"registerTemplate" : registerTemplate,
"parseFarTmpName" : parseFarTmpName,
"registerPropParser" : registerPropParser,
"getId" : getId,
"tagById" : tagById,
"uniqueId" : uniqueId,
"dispose" : dispose,
"setLanguage" : setLanguage,
"registerLangTransformer" : registerLangTransformer,
"addMajorLang" : addMajorLang,
"isSubLang" : isSubLang,
"D": D,
"dtext": dtext
};
})();
