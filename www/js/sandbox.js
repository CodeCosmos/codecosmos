// Don't obfuscate this file! We depend on the toString() of functions!
(function (window) {
  'use strict';
  var sketchProc = function () {};
  var esprima = window.esprima;
  var estraverse = window.estraverse;
  var escodegen = window.escodegen;
  var Processing = window.Processing;
  var timbre = window.timbre;
  var pi = new Processing('pjs', sketchProc);

  var receiveMessage = function (event) {
    if (event.source !== window.parent ||
        event.source === event.target ||
        event.data.msg !== 'exec') {
      return;
    }
    var lastCode = transformCode(event.data.val);
    window._lastCode = lastCode;
    /* jshint evil:true */
    sketchProc = new Function('processing', lastCode);
    /* jshint evil:false */
    pi.exit();
    pi = new Processing('pjs', sketchProc);
  };

  var processingWrapper = function (processing, $instrumentedCode) {
    if (!processing) {
      return;
    }
    // Mask a few globals that could cause problems
    var alert, confirm, print, prompt;
    var __ctr = 0;
    var __maxctr = 30000;
    var __cont = true;
    var __f = $instrumentedCode;
    var __resetCounter = function () {
      __ctr = 0;
      if (__cont) {
        window.requestAnimationFrame(__resetCounter);
      } else {
        processing.exit();
      }
    };
    var __setup = function () {
      processing.size(window.innerWidth, window.innerHeight);
    };
    var __once = function () {
      processing.noLoop();
      __clear();
      timbre.reset();
      timbre.pause();
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
    var __clear = function () {
      processing.background(255);
    };
    window.onresize = function () {
      if (processing && processing.setup) {
        processing.setup(); processing.redraw();
      }
    };
    window.onerror = function (message, url, lineNumber) {
      __cont = false;
      window.parent.postMessage(
        {msg: 'error',
         val: {url: url, message: message, line: lineNumber}},
        '*');
    };
    __setup();
    __once();
    __f();
    processing.setup = __wrap(__setup, processing.setup);
    if (processing.draw === undefined) {
      processing.draw = __wrap(__clear, __f);
    }
    window.requestAnimationFrame(__resetCounter);
  };
  
  var extractCode = function (fn) {
    var code = fn.toString();
    return code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
  };

  var transformCode = function (code) {
    var $f = 'function(){' + instrumentCode(code) + '}';
    return ("'use strict';" +
            extractCode(processingWrapper).replace('$instrumentedCode', $f));
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
      }
      node.body.body.unshift(injectStatement);
    }});
    return escodegen.generate(ast);
  };
  window.addEventListener('message', receiveMessage, false);
  window.parent.postMessage({msg: 'sandboxLoaded'}, '*');
})(window);