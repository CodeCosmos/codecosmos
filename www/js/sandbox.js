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

// Don't obfuscate this! We use toString() on it!
var processingWrapper = function (processing, $instrumentedCode) {
  'use strict';
  if (!processing) {
    return;
  }
  var __ctr = 0;
  var __maxctr = 30000;
  var __cont = true;
  var __f = $instrumentedCode;
  var __resetCounter = function () {
    __ctr = 0;
    if (__cont) {
      window.requestAnimationFrame(__resetCounter);
    }
  };
  var __setup = function () {
    processing.size(window.innerWidth, window.innerHeight);
    processing.background(255);
    processing.smooth();
    processing.noLoop();
  };
  var __wrap = function (a, b) {
    if (b && a !== b) {
      return function () {
        a.apply(this, arguments);
        return b.apply(this, arguments);
      };
    } else {
      return a;
    }
  };
  window.onresize = function () {
    if (processing && processing.setup) {
      processing.setup(); processing.redraw();
    }
  };
  try {
    __setup();
    __f();
    processing.setup = __wrap(__setup, processing.setup);
    if (processing.draw === undefined) {
      processing.draw = __f;
    }
    window.requestAnimationFrame(__resetCounter);
  } catch (err) {
    window.console.log(err);
  }
};
  
var extractCode = function (fn) {
  var code = fn.toString();
  return code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
};
var transformCode = function (code) {
  var $f = 'function(){' + instrumentCode(code) + '}';
  return extractCode(processingWrapper).replace('$instrumentedCode', $f);
};
var injectStatement = esprima.parse(extractCode(function (__ctr, __maxctr, __cont) {
  if (++__ctr >= __maxctr) {
    __cont = false;
    throw new Error("Script ran for too long"); }
})).body[0];
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
