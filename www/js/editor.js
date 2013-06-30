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
    cm.operation(function () {
      while (errorMarkers.length) {
        errorMarkers.pop().clear();
      }
    });
    if (errors.length === 0) {
      var s = angular.element('#errors').scope().$apply(function (s) {
        s.errors = [];
      });
      sandboxWindow.postMessage({msg: 'exec', val: code}, '*');
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

  function receiveMessage(event) {
    if (event.source !== sandboxWindow) {
      return;
    }
    var msg = event.data.msg;
    if (msg === 'sandboxLoaded') {
      lintOptions.callback = maybeUpdateSandbox;
      // force it to run once after we're connected
      lintOptions.getAnnotations(editor, function (cm, res) {}, lintOptions) ;
    } else if (msg === 'error') {
      var err = event.data.val;
      window._lastErr = err;
      window.console.log(err);
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
    }
  }

  function explainError(err) {
    if (err.name === 'TypeError') {
      if (err.message.match(/has no method/)) {
        return 'Tried to call a method that doesn\'t exist, check the spelling!';
      } else if (err.message.match(/is not a function/)) {
        return 'Tried to call an object that isn\'t a function, try removing the (parentheses) if it\'s just a value.';
      } else if (err.message.match(/Cannot call method/)) {
        return 'Tried to call a method on undefined, maybe there\'s a misspelling?';
      }
    } else if (err.name === 'Error') {
      if (err.message === 'Script ran for too long') {
        return 'Check to make sure you don\'t have an infinite loop, your script is trying to freeze the browser!';
      }
    }
    return '(sorry, no friendly explanation for this one)';
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

  // bootstrap sandbox
  window.addEventListener('message', receiveMessage, false);
  sandboxElem.src = 'sandbox.html';

  // debugging variables
  window._editor = editor;
});