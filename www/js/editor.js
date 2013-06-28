'use strict';
var CodeMirror = window.CodeMirror;
var batchTime = 200;
var nextBatch = null;
var sandboxWindow = document.getElementById('sandbox').contentWindow;
CodeMirror.commands.autocomplete = function(cm) {
  CodeMirror.showHint(
    cm,
    CodeMirror.javascriptHint,
    {completeSingle: false});
};
var editor = CodeMirror.fromTextArea(document.getElementById("code-js"), {
  lineNumbers: true,
  mode: "javascript",
  gutters: ["CodeMirror-lint-markers"],
  extraKeys: {"Alt-Space": "autocomplete"},
  matchBrackets: true,
  lineWrapping: true,
  lintWith: CodeMirror.javascriptValidatorWithOptions(null)
});
var receiveMessage = function (event) {
  if (event.source === sandboxWindow && event.data === 'sandboxLoaded') {
    updateSandbox(editor.getValue(), sandboxWindow);
    editor.on('change', onChange);
  }
};
var onChange = function (cm, change) {
  window.clearTimeout(nextBatch);
  nextBatch = window.setTimeout(updateSandbox, batchTime);
};
var updateSandbox = function () {
  var code = editor.getValue();
  if (editor.options.lintWith(code).length === 0) {
    sandboxWindow.postMessage(editor.getValue(), '*');
  }
};
window.addEventListener('message', receiveMessage, false);
document.getElementById('sandbox').src = 'sandbox.html';
