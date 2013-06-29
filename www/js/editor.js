(function (window) {
  'use strict';
  var CodeMirror = window.CodeMirror;
  var lintTime = 500;
  var sandboxWindow = document.getElementById('sandbox').contentWindow;
  CodeMirror.commands.autocomplete = function(cm) {
    CodeMirror.showHint(
      cm,
      CodeMirror.javascriptHint,
      {completeSingle: false});
  };
  var maybeUpdateSandbox = function (cm, code, errors) {
    if (errors.length === 0) {
      sandboxWindow.postMessage({msg: 'exec', val: code}, '*');
    }
  };
  var smartIndentAuto = function (cm) {
    // this indents more like Emacs
    cm.indentSelection("smart");
    if (!cm.somethingSelected()) {
      var pos = cm.getCursor();
      var spaces = cm.getLine(pos.line).match(/\s*/)[0].length;
      if (pos.ch < spaces) {
        cm.setCursor(pos.line, spaces);
      }
    }
  };
  var lintOptions = {
    getAnnotations: CodeMirror.ccAsyncJavascriptValidator,
    async: true,
    delay: lintTime,
    callback: null};
  var editor = CodeMirror.fromTextArea(document.getElementById("code-js"), {
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
  var receiveMessage = function (event) {
    if (event.source !== sandboxWindow) {
      return;
    }
    var msg = event.data.msg;
    if (msg === 'sandboxLoaded') {
      lintOptions.callback = maybeUpdateSandbox;
      // force it to run once after we're connected
      lintOptions.getAnnotations(editor, function (cm, res) {}, lintOptions) ;
    } else if (msg === 'error') {
      window.console.log(event.data.val);
    }
  };
  window.addEventListener('message', receiveMessage, false);
  document.getElementById('sandbox').src = 'sandbox.html';
})(window);