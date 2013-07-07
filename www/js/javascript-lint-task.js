// Modified version of https://github.com/marijnh/CodeMirror/blob/master/addon/lint/javascript-lint.js
(function() {
  'use strict';
  var root = this;
  root.postMessage(['importing']);
  root.window = root;
  root.importScripts('../static/jshint/jshint-2.1.4.js');
  var JSHINT = root.JSHINT;
  root.onmessage = function onMessage(event) {
    var data = event.data;
    JSHINT(data.text, data.options, data.globals);
    root.postMessage({id: data.id, result: JSHINT.data().errors});
  };
}).call(this);