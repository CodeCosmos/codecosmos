// Don't obfuscate this file! We depend on the toString() of functions!
(function (window) {
  'use strict';
  var sketchProc = function () {};
  var esprima = window.esprima;
  var estraverse = window.estraverse;
  var escodegen = window.escodegen;
  var Processing = window.Processing;
  var timbre = window.timbre;
  var T = window.T;
  var pi = new Processing('pjs', sketchProc);
  var Syntax = estraverse.Syntax;

  function searchMap(map, needle) {
    // binary search
    var lo = 0;
    var hi = map.length;
    var mid, here;
    while (true) {
      mid = lo + ((hi - lo) >> 1);
      here = map[mid];
      if (mid === lo || here[0] === needle) {
        return here[1];
      } else if (here[0] > needle) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
  }

  function stackHints(stack, map) {
    var lines = stack.match(/^\s+at.*\$\d+\s*.*<anonymous>:\d+:.*$/mg);
    return (lines || []).reduce(function (res, line) {
      var m = line.match(/(\S*)\$(\d+)\s*.*<anonymous>:(\d+)/);
      if (m) {
        res.push({name: m[1],
                  line: searchMap(map, 0|m[3]),
                  fn_line: 0|m[2],
                  gen_line: 0|m[3]});
      }
      return res;
    }, []);
  }

  function postFail(ast, map, genCode, err) {
    window.parent.postMessage(
      {
        msg: 'error',
        val: {
          name: err.name,
          message: err.message,
          stack: err.stack,
          stackHints: stackHints(err.stack, map),
          __ast: ast,
          __map: map,
          __genCode: genCode
        }
      },
      '*');
  }

  function SourceNode(line, col, _sourceMap, generated) {
    this.line = line;
    this.col = col;
    this.generated = generated;
  }
  SourceNode.prototype.toStringWithSourceMap = function toStringWithSourceMap() {
    var code = [];
    var mapLines = {};
    var map = [];
    // assumes that wrapCode adds two lines
    var line = 3;
    var lastMapLine = null;
    function walk(node) {
      if (typeof(node) === "string") {
        if (node.length > 0) {
          code.push(node);
          var matches = node.match(/\n/g);
          if (matches !== null) {
            line += matches.length;
          }
        }
      } else if (node instanceof SourceNode) {
        if (node.line !== null) {
          if (!mapLines[line]) {
            map.push([line, node.line]);
            mapLines[line] = node.line;
          }
        }
        walk(node.generated);
      } else {
        node.forEach(walk);
      }
    }
    walk(this);
    return {code: code.join(''), map: map};
  };
  SourceNode.prototype.toString = function toString() {
    return this.toStringWithSourceMap().code;
  };

  function processingWrapper($userCode, __postFail, processing) {
    if (!processing) {
      return;
    }
    // Mask a few globals that could cause problems
    var alert, confirm, print, prompt;
    var __ctr = 0;
    var __maxctr = 30000;
    var __cont = true;
    var __errorHandler = false;
    function __fail(err) {
      __cont = false;
      processing.exit();
      __postFail(err);
      var errWrapper = new Error('[__reported__] ' + err.message);
      errWrapper.error = err;
      throw errWrapper;
    }
    function __catchErrors(f) {
      return function __catchErrorsWrapper() {
        if (__errorHandler) {
          return f.apply(this, arguments);
        }
        __errorHandler = true;
        try {
          var res = f.apply(this, arguments);
          __errorHandler = false;
          return res;
        } catch (err) {
          __errorHandler = false;
          __fail(err);
          throw new Error("Unreachable");
        }
      };
    }
    function __resetCounter() {
      __ctr = 0;
      if (__cont) {
        window.requestAnimationFrame(__resetCounter);
      } else {
        processing.exit();
      }
    }
    function __setup() {
      processing.size(window.innerWidth, window.innerHeight);
    }
    function __once() {
      processing.noLoop();
      __clear();
      timbre.reset();
      timbre.pause();
    }
    function __wrap(a, b) {
      if (b && a !== b) {
        return function __wrap_two() {
          a.apply(this, arguments);
          return b.apply(this, arguments);
        };
      } else {
        return a;
      }
    }
    function __clear() {
      processing.background(255);
    }
    var __f = __catchErrors($userCode);
    window.onresize = function onresize() {
      if (processing && processing.setup) {
        processing.setup(); processing.redraw();
      }
    };
    window.onerror = function onerror(message, url, lineNumber) {
      if (message.search('[__reported__]') !== -1) {
        return true;
      }
      __cont = false;
      window.parent.postMessage(
        {msg: 'error',
         val: {url: url, message: message, line: lineNumber}},
        '*');
      return false;
    };
    __setup();
    __once();
    __f();
    processing.setup = __wrap(__setup, processing.setup);
    if (processing.draw === undefined) {
      processing.draw = __wrap(__clear, __f);
    }
    window.requestAnimationFrame(__resetCounter);
  }

  function extractCode(fn) {
    var code = fn.toString();
    return code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
  }

  function makeOneLine(code) {
    return code.replace(/(\/\/[^\n]+|\n\s*)/g, '');
  }

  var processingTemplate = makeOneLine(extractCode(processingWrapper));
  window.processingTemplate = processingTemplate;

  function wrapCode(code) {
    // avoid interpretation of the replacement string by using a fun.
    // otherwise mo' $ mo problems.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
    return ("'use strict';" + processingTemplate.replace(/\$userCode/, function () {
      return 'function __userCode$1() {\n' + code + '\n}';
    }));
  }

  var injectStatement = esprima.parse(extractCode(function (__ctr, __maxctr, __cont) {
    if (++__ctr >= __maxctr) {
      __cont = false;
      throw new Error("Script ran for too long"); }
  })).body[0];

  function CallExpression(callee, args) {
    this.callee = callee;
    this.arguments = args;
  }
  CallExpression.prototype.type = Syntax.CallExpression;

  function Identifier(name) {
    this.name = name;
  }
  Identifier.prototype.type = Syntax.Identifier;

  function BlockStatement(body) {
    this.body = body;
  }
  BlockStatement.prototype.type = Syntax.BlockStatement;

  function ReturnStatement(argument) {
    this.argument = argument;
  }
  ReturnStatement.prototype.type = Syntax.ReturnStatement;

  function FunctionExpression(id, params, body) {
    this.id = id;
    this.params = params;
    this.body = body;
    this.defaults = [];
    this.expression = false;
    this.generator = false;
    this.rest = null;
  }
  FunctionExpression.prototype.type = Syntax.FunctionExpression;

  function wrapId(node) {
    if (node.loc) {
      var id = (node.id || {name: '', loc: null});
      var loc = id.loc || node.loc;
      return new Identifier(id.name + '$' + (id.loc || node.loc).start.line);
    } else {
      return node.id;
    }
  }

  function instrumentAST(ast) {
    return estraverse.replace(ast, {
      leave: function leaveAST(node) {
        switch (node.type) {
        case Syntax.DoWhileStatement: break;
        case Syntax.ForStatement: break;
        case Syntax.FunctionDeclaration: break;
        case Syntax.FunctionExpression: break;
        case Syntax.WhileStatement: break;
        default: return estraverse.SKIP;
        }
        // modify the BlockStatement in-place to inject the instruction counter
        node.body.body.unshift(injectStatement);
        if (node.type === Syntax.FunctionExpression) {
          // __catchErrors(node)
          node.id = wrapId(node);
          return new CallExpression(
            new Identifier("__catchErrors"),
            [node]);
        } else if (node.type === Syntax.FunctionDeclaration) {
          // modify the BlockStatement in-place to be
          // return __catchErrors(function id() { body });
          var funBody = node.body;
          node.body = new BlockStatement([
            new ReturnStatement(
              new CallExpression(
                new CallExpression(
                  new Identifier("__catchErrors"),
                  [new FunctionExpression(wrapId(node), [], funBody)]),
                []))]);
          return node;
        } else {
          return node;
        }
      }});
  }

  function receiveMessage(event) {
    if (event.source !== window.parent ||
        event.source === event.target ||
        event.data.msg !== 'exec') {
      return;
    }
    var code = event.data.val;
    var ast = instrumentAST(esprima.parse(code, {range: true, loc: true}));

    window.__ast = ast;
    var genMap = escodegen.generate(ast, {sourceMap: true,
                                          sourceMapWithCode: true});
                                          
    window.__map = genMap.map;
    var genCode = wrapCode(genMap.code);
    var onFail = postFail.bind(null, ast, genMap.map, genCode);
    /* jshint evil:true */
    sketchProc = new Function(
      '__postFail',
      'timbre',
      'T',
      'processing',
      genCode);
    /* jshint evil:false */
    pi.exit();
    pi = new Processing(
      'pjs',
      sketchProc.bind(null, onFail, timbre, T));
  }

  window.sourceMap = {SourceNode: SourceNode};
  window.addEventListener('message', receiveMessage, false);
  window.parent.postMessage({msg: 'sandboxLoaded'}, '*');
})(window);