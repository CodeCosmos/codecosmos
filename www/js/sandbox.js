// Don't obfuscate this file! We depend on the toString() of functions!
document.addEventListener('DOMContentLoaded', function sandboxLoaded() {
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

  var magicGlobals = [
    'processing',
    'p',
    'timbre',
    'T'
  ];

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

  function postSuccess(code, id) {
    postMessage({msg: 'success', val: code, id: id});
  }

  function postFail(id, ast, map, genCode, err) {
    postMessage(
      {
        msg: 'error',
        id: id,
        val: {
          name: err.name,
          message: err.message,
          stack: err.stack,
          stackHints: stackHints(err.stack, map),
          __ast: ast,
          __map: map,
          __genCode: genCode
        }
      });
  }

  // This implements the jankiest possible "source map", where we keep an array
  // of [generatedLine, knownSourceLine]. Seems to essentially work.
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
        if (node) {
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

  function processingExportWrapper($userCode, processing) {
    var __f = $userCode;
    // Ignore everything below here! :)
    var p = processing;
    function __setup() {
      processing.size(window.innerWidth, window.innerHeight);
    }
    function __once() {
      processing.textFont(processing.loadFont("serif"), 20);
      processing.noLoop();
      processing.frameRate(20);
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
    window.onresize = function onresize() {
      if (processing && processing.setup) {
        processing.setup(); processing.redraw();
      }
    };
    __setup();
    __once();
    __f();
    processing.setup = __wrap(__setup, processing.setup);
    if (processing.draw === undefined) {
      // Clear the log so it's not so obvious we're running this code twice.
      var tinyLogDiv = window.document.querySelector('html > div > div[title="Close Log"]');
      if (tinyLogDiv && tinyLogDiv.click) {
        tinyLogDiv.click();
      }
      processing.draw = __f;
    }
  }

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
    var p = processing;
    
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
      processing.textFont(processing.loadFont("serif"), 20);
      processing.noLoop();
      processing.frameRate(20);
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
      __postFail({name: 'UnhandledError',
                  message: message,
                  url: url,
                  line: lineNumber,
                  stack: ''});
      return false;
    };
    __setup();
    __once();
    __f();
    processing.setup = __wrap(__setup, processing.setup);
    if (processing.draw === undefined) {
      // Clear the log so it's not so obvious we're running this code twice.
      var tinyLogDiv = window.document.querySelector('html > div > div[title="Close Log"]');
      if (tinyLogDiv && tinyLogDiv.click) {
        tinyLogDiv.click();
      }
      processing.draw = __f;
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
  var processingExportTemplate = extractCode(processingExportWrapper);

  function wrapCode(code, template, functionName) {
    // avoid interpretation of the replacement string by using a fun.
    // otherwise mo' $ mo problems.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
    return ("'use strict';" + template.replace(/\$userCode/, function () {
      return 'function ' + functionName + '() {\n' + code + '\n}';
    }));
  }

  window.wrapForExport = function wrapForExport(code) {
    return ["var pi = new Processing('pjs', function (processing) { ",
            wrapCode(code, processingExportTemplate, 'myCodeCosmos'),
            "});"].join('');
  };

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

  function wrapId(node, defaultName) {
    if (node.loc) {
      var id = (node.id || {name: null, loc: null});
      var loc = id.loc || node.loc;
      var name = id.name || defaultName;
      return new Identifier(name + '$' + loc.start.line);
    } else {
      return node.id;
    }
  }

  function instrumentAST(ast) {
    var identifierStack = [];
    function pushIdentifier(s) {
      identifierStack[identifierStack.length - 1].push(s);
    }
    function popIdentifierStack() {
      identifierStack.pop();
    }
    function pushIdentifierStack() {
      identifierStack.push([]);
    }
    function peekLastIdentifier() {
      var lastStackIdx = identifierStack.length - 1;
      if (lastStackIdx >= 0) {
        var stack = identifierStack[lastStackIdx];
        if (stack.length) {
          return stack[stack.length - 1];
        }
      }
      return '';
    }
    pushIdentifierStack();
    return estraverse.replace(ast, {
      enter: function enterAST(node) {
        switch (node.type) {
        case Syntax.VariableDeclarator:
          if (node.id.type === Syntax.Identifier) {
            pushIdentifier(node.id.name);
          }
          break;
        case Syntax.MemberExpression:
          if (node.object.type === Syntax.Identifier) {
            var id = node.object.name;
            if (node.property.type === Syntax.Identifier) {
              id += '__dot__' + node.property.name;
            }
            pushIdentifier(id);
          } else if (node.property.type === Syntax.Identifier) {
            pushIdentifier(node.property.name);
          }
          break;
        case Syntax.FunctionDeclaration:
          pushIdentifierStack();
          break;
        case Syntax.FunctionExpression:
          pushIdentifierStack();
          break;
        default: break;
        }
        return node;
      },
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
          popIdentifierStack();
          // __catchErrors(node)
          node.id = wrapId(node, peekLastIdentifier());
          return new CallExpression(
            new Identifier("__catchErrors"),
            [node]);
        }
        if (node.type === Syntax.FunctionDeclaration) {
          popIdentifierStack();
          // modify the BlockStatement in-place to be
          // return __catchErrors(function id() { body });
          var funBody = node.body;
          node.body = new BlockStatement([
            new ReturnStatement(
              new CallExpression(
                new CallExpression(
                  new Identifier("__catchErrors"),
                  [new FunctionExpression(
                    wrapId(node, peekLastIdentifier()),
                    [],
                    funBody)]),
                []))]);
        }
        return node;
      }});
  }

  function receiveMessage(event) {
    if (event.source !== window.parent ||
        event.source === event.target ||
        event.data.msg !== 'exec') {
      return;
    }
    var id = event.data.id;
    var code = event.data.val;
    document.body.classList.toggle('not-running', code === '');
    var ast = instrumentAST(esprima.parse(code, {range: true, loc: true}));
    var genMap = escodegen.generate(ast, {sourceMap: true,
                                          sourceMapWithCode: true});
    var genCode = wrapCode(genMap.code, processingTemplate, '__userCode$1');
    var onFail = postFail.bind(null, id, ast, genMap.map, genCode);
    /* jshint evil:true */
    sketchProc = new Function(
      '__postFail',
      'timbre',
      'T',
      'processing',
      genCode);
    /* jshint evil:false */
    var tinyLogDiv = document.querySelector('html > div > div[title="Close Log"]');
    if (tinyLogDiv && tinyLogDiv.click) {
      tinyLogDiv.click();
    }
    pi.exit();
    pi = new Processing(
      'pjs',
      sketchProc.bind(null, onFail, timbre, T));
    // if we got here, it succeeded
    postSuccess(code, id);
  }

  window._getPi = function () {
    return pi;
  };
  function postMessage(msg) {
    window.parent.postMessage(msg, '*');
  }

  // This is used by escodegen
  window.sourceMap = {SourceNode: SourceNode};

  // start listening for orders and let the editor know we've started
  window.addEventListener('message', receiveMessage, false);
  postMessage({msg: 'sandboxLoaded', val: magicGlobals});
});