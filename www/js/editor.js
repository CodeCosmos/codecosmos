// bootstrap webfont first
var fontactive = null;
window.WebFont.load({
  custom: {
    families: [
      'SourceCodeProRegular',
      'UbuntuRegular',
      'KontrapunktBold',
      'FontAwesome'
    ],
    urls: [
      "static/source-code-pro/stylesheet.css",
      "static/kontrapunkt/stylesheet.css",
      "static/ubuntu/stylesheet.css",
      "components/font-awesome/css/font-awesome.min.css"
    ]
  },
  fontactive: function fontactiveWrapper(familyName, fvd) {
    'use strict';
    if (fontactive) {
      fontactive(familyName, fvd);
    }
  }
});

window.angular.element(document).ready(function () {
  'use strict';
  var WebFont = window.WebFont;
  var CodeMirror = window.CodeMirror;
  var angular = window.angular;
  var lintTime = 500;
  var $ = window.jQuery;
  var sandboxElem = document.getElementById('sandbox');
  var sandboxWindow = sandboxElem.contentWindow;
  var errorMarkers = [];
  // initialized later
  var lintOptions, editor;

  CodeMirror.commands.autocomplete = function autocomplete(cm) {
    CodeMirror.showHint(
      cm,
      CodeMirror.javascriptHint,
      {completeSingle: false});
  };

  function maybeUpdateSandbox(cm, code, errors) {
    var id = cm.changeGeneration();
    cm.operation(function () {
      while (errorMarkers.length) {
        errorMarkers.pop().clear();
      }
    });
    if (errors.length === 0) {
      var s = angular.element('#errors').scope().$apply(function (s) {
        s.errors = [];
      });
      sandboxWindow.postMessage({msg: 'exec', val: code, id: id}, '*');
    }
  }

  function getLineIndent(cm, line) {
    return cm.getLine(line).match(/^\s*/)[0].length;
  }

  function smartIndentAuto(cm) {
    // this indents more like Emacs
    cm.indentSelection("smart");
    if (!cm.somethingSelected()) {
      var pos = cm.getCursor();
      var spaces = getLineIndent(cm, pos.line);
      if (pos.ch < spaces) {
        cm.setCursor(pos.line, spaces);
      }
    }
  }

  function forceRun(cm) {
    window.console.log('force run');
    lintOptions.getAnnotations(cm, function (cm, res) {}, lintOptions);
  }

  function receiveMessage(event) {
    if (event.source !== sandboxWindow) {
      window.console.log(['event.source', event.source]);
      return;
    }
    var data = event.data;
    var msg = data.msg;
    var id = data.id;
    if (msg === 'sandboxLoaded') {
      lintOptions.getAnnotations.updateGlobals(function (g) {
        data.val.forEach(function (name) {
          g[name] = false;
        });
        return g;
      });
      lintOptions.callback = maybeUpdateSandbox;
      // force it to run once after we're connected
      forceRun(editor);
    } else if (msg === 'error') {
      var err = data.val;
      window._lastErr = err;
      window.console.log([msg, err, id]);
      editor.operation(function markSandboxErrors() {
        err.stackHints.forEach(function markSandboxError(hint, idx) {
          var line = hint.line - 2;
          var className = (idx > 0) ? 'sandbox-error' : 'sandbox-error-first';
          errorMarkers.push(
            editor.markText({line: line, col: getLineIndent(editor, line)},
                            {line: line + 1, col: 0},
                            {className: className}));
        });
      });
      angular.element('#errors').scope().$apply(function (s) {
        s.errors = (err.stackHints || []);
        s.name = err.name;
        s.message = err.message;
        s.explanation = explainError(err);
      });
    } else if (msg === 'success') {
      window.console.log([msg, id]);
    }
  }

  function explainError(err) {
    if (err.name === 'TypeError') {
      if (err.message.match(/has no method/)) {
        return "Tried to call a method that doesn't exist, check the spelling!";
      } else if (err.message.match(/is not a function/)) {
        return "Tried to call an object that isn't a function, try removing the (parentheses) if it's just a value.";
      } else if (err.message.match(/Cannot call method/)) {
        return "Tried to call a method on undefined, maybe there's a misspelling?";
      } else if (err.message.match(/Cannot set property/)) {
        return "Make sure that you didn't end the previous line with a '.', and you don't have too many '.'s.";
      }
    } else if (err.name === 'Error') {
      if (err.message === 'Script ran for too long') {
        return "Check to make sure you don't have an infinite loop, your script is trying to freeze the browser!";
      }
    }
    return '(sorry, no friendlier explanation for this one)';
  }

  function friendlyName(functionName) {
    if (functionName === '__userCode') {
      return 'your main code';
    } else if (functionName === '') {
      return '<anonymous function>';
    } else {
      return functionName.replace('__dot__', '.');
    }
  }

  // angular menu bootstrap
  function MenuCtrl($scope, $http, $cacheFactory) {
    window.console.log('MenuCtrl');
    var $httpCache = $cacheFactory.get('$http');
    $scope.toJson = angular.toJson;
    $scope.loading_sentinel = '';
    $scope.loaded_file = $scope.loading_sentinel;
    $scope.groups = [
      {name: 'My Code',
       files: []}];
    $scope.loadFile = function loadFile() {
      if ($scope.loaded_file !== $scope.loading_sentinel) {
        var file = angular.fromJson($scope.loaded_file);
        $http({method: 'GET', url: file.url, cache: $httpCache}).
          success(function loadSuccess(data, status) {
            loadDocument({code: data});
          }).
          error(function loadError(data, status) {
            window.console.log(['load error :(', data, status]);
          });
        $scope.loaded_file = $scope.loading_sentinel;
      }
    };
    $http({method: 'GET', url: 'data/bootstrap.json', cache: $httpCache}).
      success(function bootstrapSuccess(data, status) {
        $scope.groups.push(data);
        finishedLoading();
      }).
      error(function bootstrapError(data, status) {
        // TODO: This is not graceful at all! :(
        $('#loading h1').text("Connectivity problem, please try reloading :(");
      });
  }
  angular.module('menuModule', [])
    .controller('MenuCtrl', MenuCtrl);
  angular.bootstrap('#main-menu', ['menuModule']);

  // angular errors bootstrap
  function ErrorCtrl($scope) {
    $scope.type = '';
    $scope.message = '';
    $scope.explanation = '';
    $scope.errors = [];
    $scope.friendlyName = friendlyName;
    $scope.log = function (x) { window.console.log(x); };
  }

  angular.module('errorModule', [])
    .controller('ErrorCtrl', ErrorCtrl);
  angular.bootstrap('#errors', ['errorModule']);
  $('#errors ul.errors').on('click mouseover mouseout', 'li', function (e) {
    var s = angular.element(this).scope();
    var line = s.err.line - 1;
    editor.setCursor(line, getLineIndent(editor, line));
    editor.focus();
  });

  // CodeMirror startup
  lintOptions = {
    getAnnotations: CodeMirror.ccAsyncJavascriptValidator,
    async: true,
    delay: lintTime,
    callback: null
  };

  editor = CodeMirror.fromTextArea(document.getElementById("code-js"), {
    lineNumbers: true,
    mode: "javascript",
    gutters: ["CodeMirror-lint-markers"],
    extraKeys: {
      "Alt-Space": "autocomplete",
      "Ctrl-R": forceRun,
      "Tab": smartIndentAuto
    },
    matchBrackets: true,
    lineWrapping: true,
    lintWith: lintOptions
  });
  // refresh after font loads
  fontactive = function fontactive(fontName, fvd) {
    if (fontName === 'SourceCodeProRegular') {
      editor.refresh();
    }
  };

  function finishedLoading() {
    $('#loading').addClass('hide');
    $('#container').addClass('show');
  }

  function loadDocument(val) {
    editor.operation(function loadDocumentOp() {
      editor.setValue(val.code || '');
      editor.setHistory(val.history || {'done': [], 'undone': []});
    });
  }

  // bootstrap sandbox
  window.addEventListener('message', receiveMessage, false);
  sandboxElem.src = 'sandbox.html';

  // debugging variables
  window._editor = editor;

  // The menu controller will take care of bootstrapping for now.
});