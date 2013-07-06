(function () {
  'use strict';
  var root = this;
  var angular = root.angular;
  var _ = root._;
  var CodeDB = root.CodeDB;
  var Font = root.Font;
  var CodeMirror = root.CodeMirror;
  var CODE_FONT = 'SourceCodePro';
  var EMPTY_HISTORY = {'done': [], 'undone': []};
  var lintTime = 500;

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

  function CodeCtrl($scope, $window) {
    var document = $window.document;
    var sandboxElem = document.getElementById('sandbox');
    var errorMarkers = [];
    var NO_STATE = {code: '', history: EMPTY_HISTORY, generation: 0};
    $scope.lastGeneration = NO_STATE;

    function forceRun(cm) {
      lintOptions.getAnnotations(cm || $scope.editor, _.identity, $scope.lintOptions);
    }
    $scope.forceRun = forceRun;

    function getEditorState() {
      var editor = $scope.editor;
      if (!editor) {
        return NO_STATE;
      } else {
        return {code: editor.getValue(),
                history: editor.getHistory(),
                generation: editor.changeGeneration()};
      }
    }
    $scope.getEditorState = getEditorState;
    
    function putEditorState(val) {
      var editor = $scope.editor;
      $scope.clearSandbox();
      editor.operation(function putEditorStateOp() {
        var code = val.code || '';
        var history = val.history || '';
        editor.setValue(val.code || '');
        editor.setHistory(val.history || EMPTY_HISTORY);
        $scope.lastGeneration = {code: code, history: history, generation: editor.changeGeneration()};
      });
    }
    $scope.putEditorState = putEditorState;

    function receiveMessage(event) {
      if (event.source !== sandboxElem.contentWindow) {
        window.console.log(['ignoring', event]);
        return;
      }
      var data = event.data;
      var msg = data.msg;
      var id = data.id;
      var lintOptions = $scope.lintOptions;
      var editor = $scope.editor;
      if (msg === 'sandboxLoaded') {
        lintOptions.getAnnotations.updateGlobals(function (g) {
          data.val.forEach(function (name) {
            g[name] = false;
          });
          return g;
        });
        lintOptions.callback = maybeUpdateSandbox;
        // force it to run once after we're connected
        $scope.forceRun(editor);
      } else if (msg === 'error') {
        var err = data.val;
        window._lastErr = err;
        window.console.log([msg, err, id]);
        editor.operation(function markSandboxErrors() {
          err.stackHints.forEach(function markSandboxError(hint, idx) {
            var line = hint.line - 2;
            var className = (idx > 0) ? 'sandbox-error' : 'sandbox-error-first';
            errorMarkers.push(
              editor.markText({line: line, col: $scope.getLineIndent(editor, line)},
                              {line: line + 1, col: 0},
                              {className: className}));
          });
        });
        // TODO: clean this up!
        angular.element('#errors').scope().$apply(function ($scope) {
          $scope.errors = (err.stackHints || []);
          $scope.name = err.name;
          $scope.message = err.message;
          $scope.explanation = explainError(err);
        });
        angular.element('#main-menu').scope().$apply(function ($scope) {
          $scope.faceState = 'frown';
          $scope.sandboxUpdateFail(id);
        });
      } else if (msg === 'success') {
        angular.element('#main-menu').scope().$apply(function ($scope) {
          $scope.faceState = 'smile';
          $scope.sandboxUpdateSuccess(id);
        });
      }
    }
    function maybeUpdateSandbox(cm, ctx, errors) {
      cm.operation(function () {
        while (errorMarkers.length) {
          errorMarkers.pop().clear();
        }
      });
      if (errors.length === 0) {
        angular.element('#errors').scope().$apply(function ($scope) {
          $scope.errors = [];
          $scope.lintErrors = [];
        });
        angular.element('#main-menu').scope().$apply(function ($scope) {
          $scope.faceState = 'meh';
          $scope.postSandboxUpdate(ctx);
        });
      } else {
        angular.element('#main-menu').scope().$apply(function ($scope) {
          $scope.faceState = 'meh';
        });
        angular.element('#errors').scope().$apply(function ($scope) {
          $scope.errors = [];
          // reduce the display a bit
          $scope.lintErrors = errors.reduce(function reduceErrors(res, err) {
            err.count = 1;
            if (res.length === 0 ||
                err.from.line !== res[res.length - 1].from.line) {
              res.push(err);
            } else {
              res[res.length - 1].count += 1;
            }
            return res;
          }, []);
        });
      }
    }
    function clearSandbox() {
      sandboxElem.contentWindow.postMessage({msg: 'exec', val: '', id: null}, '*');
    }
    $scope.clearSandbox = clearSandbox;

    CodeMirror.commands.autocomplete = function autocomplete(cm) {
      CodeMirror.showHint(
        cm,
        CodeMirror.javascriptHint,
        {completeSingle: false});
    };

    function getLineIndent(cm, line) {
      return (cm.getLine(line) || '').match(/^\s*/)[0].length;
    }
    $scope.getLineIndent = getLineIndent;

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


    // CodeMirror startup
    var lintOptions = {
      getAnnotations: CodeMirror.ccAsyncJavascriptValidator,
      getState: getEditorState,
      async: true,
      delay: lintTime,
      callback: null
    };
    $scope.lintOptions = lintOptions;

    angular.element('#code-js').text(
      ['// Type some code in below, or use the menu above to choose a recipe',
       '\n\n\n\n\n\n\n\n'].join('\n'));
    $scope.editor = CodeMirror.fromTextArea(document.getElementById("code-js"), {
      lineNumbers: true,
      mode: "javascript",
      gutters: ["CodeMirror-lint-markers"],
      extraKeys: {
        "Alt-Space": "autocomplete",
        "Ctrl-R": forceRun,
        "Ctrl-Enter": forceRun,
        "Tab": smartIndentAuto
      },
      matchBrackets: true,
      lineWrapping: true,
      lintWith: lintOptions
    });
    $scope.editor.setCursor(1, 0);

    // Make sure to set up the editor properly when we first see it
    $scope.$watch('session', function watchSession(newValue, oldValue) {
      $scope.putEditorState(NO_STATE);
    });
    $scope.$watch('containerVisible', function watchContainerVisible(newValue, oldValue) {
      var editor = $scope.editor;
      if (newValue) {
        editor.refresh();
        editor.focus();
        sandboxElem.src = 'sandbox.html';
      } else {
        // unhook a lot of stuff.
        sandboxElem.src = '';
      }
    });

    // Refresh the editor when the font loads
    var sourceFont = new Font();
    sourceFont.onload = function sourceFontLoaded() {
      $scope.editor.refresh();
    };
    sourceFont.fontFamily = CODE_FONT;
    sourceFont.src = sourceFont.fontFamily;

    angular.element('#errors ul.errors').on('click mouseover mouseout', 'li', function (e) {
      var err = angular.element(this).scope().err;
      var line;
      if (err.from) {
        line = err.from.line;
      } else {
        line = err.line - 1;
      }
      var editor = $scope.editor;
      editor.setCursor(line, $scope.getLineIndent(editor, line));
      editor.focus();
    });

    // bootstrap the sandbox
    $window.addEventListener('message', receiveMessage, false);
  }
  root.CodeCtrl = CodeCtrl;
}).call(this);