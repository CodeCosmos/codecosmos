// Modified version of https://github.com/marijnh/CodeMirror/blob/master/addon/lint/javascript-lint.js
(function(window) {
  'use strict';
  var CodeMirror = window.CodeMirror;
  var Worker = window.Worker;
  var Deferred = window.jQuery.Deferred;

  var bogus = [ "Dangerous comment" ];

  var warnings = [ [ "Expected '{'",
                     "Statement body should be inside '{ }' braces." ] ];

  var errors = [ "Missing semicolon", "Extra comma", "Missing property name",
                 "Unmatched ", " and instead saw", " is not defined",
                 "Unclosed string", "Stopping, unable to continue" ];

  var options = {
    curly: true,
    bitwise: false,
    forin: false,
    latedef: true,
    noarg: true,
    undef: true,
    strict: false,
    funcscope: true,
    globalstrict: true,
    laxcomma: true,
    browser: true
  };
  var globals = {
    processing: false,
    console: false,
    timbre: false,
    T: false
  };

  var worker = null;
  var nextId = 1;
  function onmessage(event) {
    var data = event.data;
    var task = this.tasks[data.id];
    if (task) {
      delete this.tasks[data.id];
      task.resolve(data.result);
      this.numTasks--;
    }
  }
  function onerror(event) {
    worker = null;
    this.terminate();
    for (var id in this.tasks) {
      var task = this.tasks[id];
      task.reject(event);
    }
  }
  function validator(text, options, globals) {
    var id = nextId++;
    var task = new Deferred();
    if (worker && worker.numTasks !== 0) {
      worker.onerror(new Error('canceled'));
    }
    if (!worker) {
      worker = new Worker('js/javascript-lint-task.js');
      worker.tasks = {};
      worker.numTasks = 0;
      worker.onmessage = onmessage;
      worker.onerror = onerror;
    }
    worker.tasks[id] = task;
    worker.postMessage({id: id, text: text, options: options, globals: globals});
    return task.then(parseErrors);
  }

  function ccAsyncJavascriptValidator(cm, updateLinting, opts) {
    var ctx = opts.getState(cm);
    var code = ctx.code;
    validator(code, options, globals).done(function (errors) {
      updateLinting(cm, errors);
      if (opts.callback) {
        opts.callback(cm, ctx, errors);
      }
    });
  }
  ccAsyncJavascriptValidator.updateGlobals = function updateGlobals(f) {
    globals = f(globals);
  };
  CodeMirror.ccAsyncJavascriptValidator = ccAsyncJavascriptValidator;

  function cleanup(error) {
    // All problems are warnings by default
    fixWith(error, warnings, "warning", true);
    fixWith(error, errors, "error");

    return isBogus(error) ? null : error;
  }

  function fixWith(error, fixes, severity, force) {
    var description, fix, find, replace, found;

    description = error.description;

    for ( var i = 0; i < fixes.length; i++) {
      fix = fixes[i];
      find = (typeof fix === "string" ? fix : fix[0]);
      replace = (typeof fix === "string" ? null : fix[1]);
      found = description.indexOf(find) !== -1;

      if (force || found) {
        error.severity = severity;
      }
      if (found && replace) {
        error.description = replace;
      }
    }
  }

  function isBogus(error) {
    var description = error.description;
    for ( var i = 0; i < bogus.length; i++) {
      if (description.indexOf(bogus[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function parseErrors(errors) {
    var pushTabPositions = function (tabpositions, item, index) {
      if (item === '\t') {
        // First col is 1 (not 0) to match error
        // positions
        tabpositions.push(index + 1);
      }
      return tabpositions;
    };
    var updateTabPositions = function (pos, tabposition) {
      if (pos > tabposition) {
        return pos - 1;
      } else {
        return pos;
      }
    };
    var output = [];
    if (!errors) {
      return output;
    }
    for ( var i = 0; i < errors.length; i++) {
      var error = errors[i];
      if (error) {
        var linetabpositions, index;

        linetabpositions = [];

        // This next block is to fix a problem in jshint. Jshint
        // replaces
        // all tabs with spaces then performs some checks. The error
        // positions (character/space) are then reported incorrectly,
        // not taking the replacement step into account. Here we look
        // at the evidence line and try to adjust the character position
        // to the correct value.
        if (error.evidence) {
          // Tab positions are computed once per line and cached
          var tabpositions = linetabpositions[error.line];
          if (!tabpositions) {
            // ugggh phantomjs does not like this
            // forEachChar(evidence, function(item, index) {
            tabpositions = Array.prototype.reduce.call(
              error.evidence,
              pushTabPositions,
              []);
            linetabpositions[error.line] = tabpositions;
          }
          if (tabpositions.length > 0) {
            error.character = tabpositions.reduce(
              updateTabPositions,
              error.character);
          }
        }

        var start = error.character - 1, end = start + 1;
        if (error.evidence) {
          index = error.evidence.substring(start).search(/.\b/);
          if (index > -1) {
            end += index;
          }
        }

        // Convert to format expected by validation service
        error.description = error.reason;// + "(jshint)";
        error.start = error.character;
        error.end = end;
        error = cleanup(error);

        if (error)
          output.push({message: error.description,
                       severity: error.severity,
                       from: CodeMirror.Pos(error.line - 1, start),
                       to: CodeMirror.Pos(error.line - 1, end)});
      }
    }
    return output;
  }
})(window);
