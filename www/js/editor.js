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
  var BLOB_TYPE = 'text/plain;charset=utf-8';
  var BLOB_NAME = 'history-code-blob';
  var EMPTY_HISTORY = {'done': [], 'undone': []};
  var Blob = window.Blob;
  var FileReader = window.FileReader;
  var WebFont = window.WebFont;
  var CodeMirror = window.CodeMirror;
  var Pouch = window.Pouch;
  var angular = window.angular;
  var $ = window.jQuery;
  var lintTime = 500;
  var CodeDB = window.CodeDB;
  var sandboxElem = document.getElementById('sandbox');
  var sandboxWindow = sandboxElem.contentWindow;
  var errorMarkers = [];
  var lastGeneration = {code: '', history: EMPTY_HISTORY, generation: 0};
  // initialized later
  var lintOptions, editor;

  function genericFail(err) {
    window.console.log(["Don't know what to do with this error", err]);
    throw err;
  }

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
    lintOptions.getAnnotations(cm, function (cm, res) {}, lintOptions);
  }

  function receiveMessage(event) {
    if (event.source !== sandboxWindow) {
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
    var $httpCache = $cacheFactory.get('$http');
    $scope.running = true;
    $scope.placeholder = 'Unsaved\u2026';
    $scope.toJson = angular.toJson;
    $scope.loading_sentinel = '';
    $scope.filename = '';
    $scope.loaded_file = $scope.loading_sentinel;
    $scope.myCode = {name: 'My Code',
                     files: []};
    $scope.groups = [$scope.myCode];
    $scope.currentDoc = null;
    $scope.writeQueue = {
    };
    // Need some way to deal with writes that are going to conflight
    function scoped(fn) {
      return function scoped$wrapper() {
        var args = Array.prototype.slice.apply(arguments);
        $scope.$apply(function scoped$apply() {
          return fn.apply(null, args);
        });
      };
    }
    function newestFirst(a, b) {
      return b.now - a.now;
    }
    function updateDoc(doc) {
      window.console.log(['updateDoc', doc]);
      var oldDoc = $scope.currentDoc;
      // update the doc to the latest state
      if (oldDoc === null || oldDoc._id === doc._id) {
        $scope.currentDoc = doc;
      }
      updateDocMenu(doc);
    }
    function updateDocMenu(doc) {
      // update the menu, this has to happen in-place
      var files = $scope.myCode.files;
      var id = doc._id;
      // remove any existing doc
      for (var i = 0; i < files.length; i++) {
        if (files[i]._id === id) {
          files.splice(i, 1);
          break;
        }
      }
      // insert the new one and sort
      files.push(doc);
      files.sort(newestFirst);
    }
    function copyDoc() {
      $scope.currentDoc = null;
      $scope.filename = '';
    }
    function isFileCurrent(file) {
      var doc = $scope.currentDoc;
      return (doc && doc._id && doc._id === file._id);
    }
    $scope.isFileCurrent = isFileCurrent;
    $scope.copyDoc = copyDoc;
    function focusName() {
      angular.element('#main-menu input[name=filename]').focus();
    }
    $scope.focusName = focusName;
    function trashDoc() {
      var doc = angular.copy($scope.currentDoc || {});
      if (!doc._id) {
        return;
      }
      CodeDB.removeDoc(doc).done(scoped(function removeDocSuccess(response) {
        var files = $scope.myCode.files;
        for (var i = 0; i < files.length; i++) {
          if (files[i]._id === doc._id) {
            files.splice(i, 1);
            break;
          }
        }
        // this deletes it from the UI
        copyDoc();
      })).fail(genericFail);
    }
    $scope.trashDoc = trashDoc;
    $scope.updates = [];
    $scope.updateInProgress = null;
    function queueDocUpdate(id, props) {
      $scope.updates.push({id: id, props: props});
      pollUpdateQueue();
    }
    function pollUpdateQueue() {
      if ($scope.updateInProgress !== null || $scope.updates.length === 0) {
        return;
      }
      var doc = $scope.updates.reduce(function reduceDoc(doc, update) {
        if (update.id === doc._id) {
          return $.extend(doc, update.props);
        } else {
          return doc;
        }
      }, angular.copy($scope.currentDoc));
      $scope.updates = [];
      $scope.updateInProgress = CodeDB.updateDoc(doc)
        .done(scoped(updateDoc))
        .fail(genericFail)
        .always(scoped(function nextUpdate() {
          $scope.updateInProgress = null;
          pollUpdateQueue();
        }));
    }
    $scope.$watch('filename', function watchFilenameChange(name, oldName) {
      // use angular.copy(doc) to prevent
      // $$hashKey from being serialized
      var doc = angular.copy($scope.currentDoc || {});
      if (name === oldName || name === '' || doc.name === name) {
        return;
      }
      window.console.log(['filenameChanged', name, oldName, doc]);
      if (doc._id) {
        queueDocUpdate(doc._id, {name: name, now: Date.now()});
      } else {
        doc.name = name;
        doc.now = Date.now();
        CodeDB.createDoc(doc, getEditorState(editor))
          .done(scoped(updateDoc))
          .fail(genericFail);
      }
    });
    $scope.loadFile = function loadFile() {
      if ($scope.loaded_file !== $scope.loading_sentinel) {
        var file = angular.fromJson($scope.loaded_file);
        if (file.url) {
          // recipes
          $http({method: 'GET', url: file.url, cache: $httpCache}).
            success(function loadSuccess(data, status) {
              // side-effect of creating a new unsaved doc
              copyDoc();
              putEditorState(editor, {code: data});
            }).
            error(function loadError(data, status) {
              window.console.log(['load error :(', data, status]);
            });
        } else if (file._id) {
          var doc = angular.copy(file);
          CodeDB.getCode(doc).then(scoped(function (codeAndHistory) {
            $scope.filename = doc.name;
            $scope.currentDoc = doc;
            updateDocMenu(doc);
            putEditorState(editor, codeAndHistory);
          })).fail(genericFail);
        }
        $scope.loaded_file = $scope.loading_sentinel;
      }
    };
    CodeDB.getDocList().done(scoped(function docSuccess(docs) {
      docs.sort(newestFirst);
      $scope.myCode.files = docs;
    })).fail(genericFail);
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

  $('#code-js').text(
    ['// Type some code in below, or use the menu above to choose a recipe',
     '\n\n\n\n\n\n\n\n'].join('\n'));
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
  editor.setCursor(1, 0);
  // refresh after font loads
  fontactive = function fontactive(fontName, fvd) {
    if (fontName === 'SourceCodeProRegular') {
      editor.refresh();
    }
  };

  function finishedLoading() {
    $('#loading').addClass('hide');
    $('#container').addClass('show');
    editor.refresh();
    editor.focus();
  }

  function editorStateEq(a, b) {
    // TODO: use this
    var a_history = a.history;
    var b_history = b.history;
    return (a.code === b.code &&
            Array.isArray(a_history) &&
            Array.isArray(b_history) &&
            a_history.length === b_history.length &&
            a_history.every(function (x, i) { return x === b_history[i]; }));
  }

  function getEditorState(editor) {
    return {code: editor.getValue(), history: editor.getHistory()};
  }

  function putEditorState(editor, val) {
    sandboxWindow.postMessage({msg: 'exec', val: '', id: 'putEditorState'}, '*');
    editor.operation(function putEditorStateOp() {
      var code = val.code || '';
      var history = val.history || '';
      editor.setValue(val.code || '');
      editor.setHistory(val.history || EMPTY_HISTORY);
      lastGeneration = {code: code, history: history, generation: editor.changeGeneration()};
    });
  }

  // bootstrap sandbox
  window.addEventListener('message', receiveMessage, false);
  sandboxElem.src = 'sandbox.html';

  // debugging variables
  window._editor = editor;

  // The menu controller will take care of bootstrapping for now.
});