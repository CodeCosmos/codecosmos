'use strict';
var sketchProc = function () {};
var esprima = window.esprima;
var estraverse = window.estraverse;
var escodegen = window.escodegen;
var Processing = window.Processing;
var pi = new Processing('pjs', sketchProc);

var receiveMessage = function (event) {
  if (event.source !== window.parent || event.source === event.target) {
    return;
  }
  sketchProc = new Function('processing', transformCode(event.data));
  pi.exit();
  pi = new Processing('pjs', sketchProc);
};

var transformCode = function (code) {
  return ['"use strict";',
          'var __ctr = 0, __maxctr = 30000, __cont = true;',
          instrumentCode(code),
          '(function () {',
          'processing.exit = (function (exit) { return function () { __cont = false; return exit.apply(this, arguments); } })(processing.exit);',
          'var r = function () { __ctr = 0; if (__cont) { window.requestAnimationFrame(r); } };',
          'window.requestAnimationFrame(r);',
          '})();'].join('');
};
var injectStatement = esprima.parse('if (++__ctr >= __maxctr) { __cont = false; throw new Error("Script ran for too long"); }').body[0];
var instrumentCode = function (code) {
  var ast = esprima.parse(code);
  var edits = [];
  var Syntax = estraverse.Syntax;
  estraverse.traverse(ast, {leave: function (node) {
    switch (node.type) {
    case Syntax.DoWhileStatement: break;
    case Syntax.ForStatement: break;
    case Syntax.FunctionDeclaration: break;
    case Syntax.FunctionExpression: break;
    case Syntax.WhileStatement: break;
    default: return;
    };
    node.body.body.unshift(injectStatement);
  }});
  return escodegen.generate(ast);
};
window.addEventListener('message', receiveMessage, false);
window.parent.postMessage('sandboxLoaded', '*');
