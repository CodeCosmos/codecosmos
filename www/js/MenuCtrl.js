(function () {
  'use strict';
  var root = this;
  var angular = root.angular;
  var _ = root._;
  var jz = root.jz;
  var $ = root.jQuery;
  var Blob = root.Blob;
  var Uint8Array = root.Uint8Array;
  var URL = root.URL || root.webkitURL;
  var Deferred = $.Deferred;
  function reject(err) {
    var d = new Deferred();
    d.reject(err);
    return d;
  }

  var GITHUB_SCRIPT_URLS = [
    '//cdnjs.cloudflare.com/ajax/libs/processing.js/1.4.1/processing-api.min.js',
    'http://mohayonao.github.io/timbre.js/timbre.js'];

  function exportIndexHtml(title, scriptURLs, mainScript) {
    return [
      '<!doctype html><html><head>',
      '<title>' + _.escape(title) + '</title>',
      '<style type="text/css">',
      'html { overflow: hidden; }',
      'body { margin: 0; padding: 0; height: 100%; }',
      '</style>',
      scriptURLs.map(function (url) {
        return '<script src="' + _.escape(url) + '"></script>';
      }).join('\n'),
      '</head>',
      '<body>',
      '<canvas id="pjs"></canvas>',
      '<script src="' + _.escape(mainScript) + '"></script>',
      '</body>',
      '</html>'].join('\n');
  }

  function genericFail() {
    var info = _.toArray(arguments);
    return function genericFailWrapper(err) {
      window.console.log(['genericFail', info.concat(arguments)]);
      // return reject(err);
      throw err;
    };
  }

  // angular menu bootstrap
  function MenuCtrl($scope, $window, $q, $http, $cacheFactory) {
    var sandboxWindow = $window.document.getElementById('sandbox').contentWindow;

    var $httpCache = $cacheFactory.get('$http');
    $scope.FROWN = 'frown';
    $scope.MEH = 'meh';
    $scope.SMILE = 'smile';
    function initialize() {
      $scope.running = true;
      $scope.placeholder = 'Unsaved\u2026';
      $scope.toJson = angular.toJson;
      $scope.loading_sentinel = '';
      $scope.filename = '';
      $scope.loaded_file = $scope.loading_sentinel;
      $scope.docDict = {};
      $scope.myCode = {name: 'My Code',
                       files: []};
      $scope.currentDocId = null;
      $scope.shareUrl = '';
      $scope.displaySharePanel = false;
      $scope.displayBackupPanel = false;
      $scope.backupUrl = '';
      $scope.backupPercent = 0;
      if ($scope.bootstrapCode) {
        $scope.groups = [$scope.myCode, $scope.bootstrapCode];
      } else {
        $scope.groups = [];
      }
    }
    initialize();
    $scope.$watch('bootstrapCode', initialize);
    $scope.$watch('session', initialize);

    function getCurrentDoc() {
      return $scope.docDict[$scope.currentDocId] || null;
    }

    function isVisible(doc) {
      return doc.deleted !== true;
    }
    $scope.isVisible = isVisible;

    // Need some way to deal with writes that are going to conflict
    function scoped(fn) {
      return function scoped$wrapper() {
        var args = _.toArray(arguments);
        $scope.$apply(function scoped$apply() {
          return fn.apply(null, args);
        });
      };
    }
    function newestFirst(a, b) {
      return b.now - a.now;
    }
    function copyDoc() {
      $scope.currentDocId = null;
      $scope.filename = '';
    }
    function isFileCurrent(file) {
      return ($scope.currentDocId === file._id);
    }
    $scope.lastState = null;
    $scope.isFileCurrent = isFileCurrent;
    $scope.copyDoc = copyDoc;
    function focusName() {
      angular.element('#main-menu input[name=filename]').focus();
    }
    $scope.focusName = focusName;
    function trashDoc() {
      var doc = getCurrentDoc();
      if (doc) {
        $scope.db.removeDoc(doc).fail(genericFail('trashDoc', doc));
      }
      // this deletes it from the UI
      copyDoc();
    }
    $scope.trashDoc = trashDoc;
    function publishDoc() {
      var data = {
        description: $scope.filename,
        files: {
          'code.js': {content: sandboxWindow.wrapForExport($scope.lastGeneration.code)},
          'index.html': {content: exportIndexHtml($scope.filename, GITHUB_SCRIPT_URLS, 'code.js')}
        }
      };
      $http({method: 'POST', url: 'https://api.github.com/gists', data: data}).
        success(function loadSuccess(data, status, headers, config) {
          $scope.shareUrl = 'http://bl.ocks.org/' + data.id;
          $scope.displaySharePanel = true;
        }).
        error(function loadError(data, status, headers, config) {
          window.console.log(['POST error :(', data, status, headers, config]);
        });
    }
    $scope.publishDoc = publishDoc;

    function toggleRunning() {
      $scope.running = !$scope.running;
      // need to get out of the scope for now
      _.defer(function () {
        if ($scope.running) {
          $scope.forceRun();
        } else {
          $scope.clearSandbox();
        }
      });
    }
    $scope.toggleRunning = toggleRunning;

    function faceClick() {
      if ($('#temporary:visible').length) {
        $('#temporary').html('');
        $('#temporary').hide();
        return;
      }
      // little easter egg here.
      // Inappropriate :)
      //'2k6rdrojAIk', // Skier
      //'qzwqSaeqofg', // Porkchop Sandwiches
      //'kvgsZ01AJhI', // Israeli Jet Fighters
      //'sUlRnb8OfNE', // I Just Wanna Ride My Motorcycle
      //'fw28i991-f4', // Dockside Bars
      //'_G5Nro9VtvI', // Buzz Lightyear
      var urls = {
        smile: ['29MJySO7PGg', 'lkzQd_pEsvU', 'q7fCMMFPflc', 'cPQwmAy4RAE',
                '_YfjMZ6n8Bk', 'lMP8lPOKRGI', 'icQFpm_8sdI', 'mr3XB4ot3M4',
                'oSDjSZF3tmI'],
        meh: ['-x-r3T4LB4o', 'doDFHOTLMo4', 'YlcXposa2I8', '09jpNq_lg_Q',
              'I8lqSftB2bE'],
        frown: ['ysbbNHccY04', '4-yOqx-6G7Y', 'BLz_eKLTMv4', '7DJ6YvXyixw',
                '2PnqgmzDc0k']};
      function choose(lst) {
        return lst[Math.floor(Math.random() * lst.length)];
      }
      var src = choose(urls[$scope.faceState]);
      var $display = $('#display');
      $('#temporary').html(
        ['<iframe id="player" type="text/html" width="', $display.width(),
         '" height="', $display.height(),
         '" src="//www.youtube.com/embed/', src, '?enablejsapi=1&autoplay=1&origin=', window.location.origin,
         '" frameborder="0"></iframe>'].join('')).show();
    }
    $scope.faceClick = faceClick;

    function getSandboxScripts() {
      var sandboxScripts = $(sandboxWindow.document).find('script[data-export]');
      return $q.all(sandboxScripts.map(function (i, s) {
        var url = s.src;
        var fn = url.replace(/.*\//, '');
        window.console.log([url, fn]);
        return $http({method: 'GET', url: url, cache: true}).then(function (res) {
          return {name: fn, buffer: res.data};
        });
      }));
    }

    function wrapDeferred(other) {
      var d = new Deferred();
      other.then(function resolve() { d.resolve.apply(d, arguments); },
                 function reject() { d.reject.apply(d, arguments); });
      return d;
    }

    function backupIndex(docs) {
      return ['<!doctype html>',
              '<html><head><title>CodeCosmos Backup</title></head>',
              '<body>',
              '<h1>Your CodeCosmos:</h1>',
              '<ul>',
              docs.map(function (doc) {
                return ['<li><a href="docs/', _.escape(doc._id), '.html">',
                        _.escape(doc.name),
                        '</a></li>'].join('');
              }).join('\n'),
              '</ul>',
              '</body>',
              '</html>'].join('\n');
    }

    function downloadBackup() {
      $scope.displayBackupPanel = true;
      var files = $scope.myCode.files;
      var outdocs = [];
      var jsfiles = [];
      var outfiles = [{name: 'codecosmos-backup', dir: [
        {name: 'manifest.json', buffer: angular.toJson(files)},
        {name: 'index.html', buffer: backupIndex(files)},
        {name: 'js', dir: jsfiles},
        {name: 'docs', dir: outdocs}]}];
      var total = 1 + files.length;
      var current = 0;
      $scope.backupPercent = current / total;
      var startD = wrapDeferred(getSandboxScripts()).then(function gotJS(scripts) {
        jsfiles.push.apply(jsfiles, scripts);
      });
      var d = files.reduce(function (d, doc) {
        return d.then(function getCodeForExport() {
          return $scope.db.getCode(doc).then(function (codeAndHistory) {
            var scriptUrls = jsfiles.map(function (f) { return '../js/' + f.name; });
            outdocs.push(
              {name: doc._id + '.json', buffer: angular.toJson(codeAndHistory)},
              {name: doc._id + '.js', buffer: sandboxWindow.wrapForExport(codeAndHistory.code)},
              {name: doc._id + '.html', buffer: exportIndexHtml(doc.name, scriptUrls, doc._id + '.js')});
            $scope.$apply(function updatePercent() {
              current++;
              $scope.backupPercent = current / total;
            });
          });
        });
      }, startD);
      d.then(function packExportZip() {
        // can't just return this because it's not a jQuery deferred!
        return wrapDeferred(jz.zip.pack({files: outfiles, level: 9}));
      }).then(scoped(function (buffer) {
        var blob = new Blob([new Uint8Array(buffer)], {type: 'application/zip'});
        current = total;
        $scope.backupPercent = 1;
        $scope.backupUrl = URL.createObjectURL(blob);
      })).fail(genericFail('downloadBackup'));
      startD.resolve(null);
    }
    $scope.downloadBackup = downloadBackup;

    $scope.potentialCodeUpdates = {};
    function savePotentialUpdate(ctx) {
      $scope.potentialCodeUpdates[ctx.generation] = ctx;
    }
    function popPotentialUpdate(id) {
      var ctx = null;
      if (id !== null) {
        ctx = $scope.potentialCodeUpdates[id.generation] || null;
        if (ctx !== null) {
          delete $scope.potentialCodeUpdates[id.generation];
        }
      }
      return ctx;
    }

    function postSandboxUpdate(ctx) {
      // need a good way to track history here :(
      var id = $scope.currentDocId;
      if (id) {
        savePotentialUpdate(ctx);
      }
      $('#temporary').html('').hide();
      if ($scope.running) {
        sandboxWindow.postMessage(
          {msg: 'exec',
           val: ctx.code,
           id: {generation: ctx.generation, id: id}},
          '*');
      }
    }
    $scope.postSandboxUpdate = postSandboxUpdate;
    function sandboxUpdateSuccess(id) {
      // TODO: it's entirely possible that a fail could still
      // happen after frame 1, but let's not worry about that now.
      var ctx = popPotentialUpdate(id);
      if (ctx !== null && id.id !== null) {
        queueDocUpdate(id.id, {now: Date.now()}, ctx);
      }
    }
    $scope.sandboxUpdateSuccess = sandboxUpdateSuccess;
    function sandboxUpdateFail(id) {
      window.console.log(['sandboxUpdateFail', id]);
      popPotentialUpdate(id);
    }
    $scope.sandboxUpdateFail = sandboxUpdateFail;

    $scope.updates = [];
    $scope.updateInProgress = null;
    function pollUpdateQueue() {
      if ($scope.updateInProgress !== null || $scope.updates.length === 0) {
        return;
      }
      var acc = $scope.updates.reduce(function reduceDoc(acc, update) {
        var doc = acc.doc;
        if (update.id === doc._id) {
          if (update.code !== null && update.code !== undefined) {
            acc.code = update.code;
          }
          acc.doc = $.extend(doc, update.props);
        }
        return acc;
      }, {code: null, doc: angular.copy(getCurrentDoc() || {})});
      $scope.updates = [];
      var ls = $scope.lastState || {doc: {}, code: {}};
      if (ls.doc && ls.doc.name === acc.doc.name && ls.doc._id === acc.doc._id) {
        if (acc.code === null || ls.code.code === acc.code.code) {
          return;
        }
      }
      var db = $scope.db;
      var d = db.updateDoc(acc.doc);
      if (acc.code !== null) {
        d = d
          .then(function updatedDoc(res) {
            // re-fetch to be sure we don't conflict
            window.console.log(['updatedDoc', res]);
            return db.getDoc(acc.doc);
          }).then(function doCodeUpdate(doc) {
            return db.updateCode(doc, acc.code).done(function () {
              $scope.lastState = {doc: doc, code: acc.code};
            });
        });
      }
      var nextUpdate = scoped(function nextUpdate() {
        $scope.updateInProgress = null;
        debouncedPollUpdateQueue();
      });
      $scope.updateInProgress = d
        .done(function (doc) {
          window.console.log(['update happened', doc]);
        }).fail(genericFail('pollUpdateQueue', acc)).then(nextUpdate, nextUpdate);
    }
    var debouncedPollUpdateQueue = _.debounce(_.partial(_.defer, pollUpdateQueue), 250);
    function queueDocUpdate(id, props, codeAndHistory) {
      $scope.updates.push({id: id, props: props, code: codeAndHistory});
      debouncedPollUpdateQueue();
    }
    function watchFilenameChange(name, oldName) {
      // use angular.copy(doc) to prevent
      // $$hashKey from being serialized
      var doc = getCurrentDoc();
      if (name === oldName || name === '' || (doc && doc.name === name)) {
        return;
      }
      var updatedProps = {name: name, now: Date.now()};
      if (doc) {
        queueDocUpdate(doc._id, updatedProps, null);
      } else {
        $scope.db.createDoc(updatedProps, $scope.getEditorState())
          .done(scoped(function (doc) {
            $scope.currentDocId = doc._id;
          })).fail(genericFail('watchFilenameChange create', doc));
      }
    }
    $scope.$watch('filename', watchFilenameChange);
    $scope.loadFile = function loadFile() {
      if ($scope.loaded_file !== $scope.loading_sentinel) {
        var file = angular.fromJson($scope.loaded_file);
        if (file.url) {
          // recipes
          $http({method: 'GET', url: file.url, cache: $httpCache}).
            success(function loadSuccess(data, status) {
              // side-effect of creating a new unsaved doc
              copyDoc();
              $scope.putEditorState({code: data});
            }).
            error(function loadError(data, status) {
              window.console.log(['load error :(', data, status]);
            });
        } else if (file._id) {
          $scope.db.getCode(file).then(scoped(function (codeAndHistory) {
            $scope.filename = file.name;
            $scope.currentDocId = file._id;
            $scope.lastState = {doc: angular.copy(file), code: codeAndHistory};
            $scope.putEditorState(codeAndHistory);
          })).fail(genericFail('loadFile', file));
        }
        $scope.loaded_file = $scope.loading_sentinel;
      }
    };
    /*
    $scope.$watch('db', function watchDb(newValue, oldValue) {
      if (newValue) {
        $scope.db.getDocList().done(scoped(function docSuccess(docs) {
          docs.sort(newestFirst);
          $scope.myCode.files = docs;
        })).fail(genericFail);
      }
    });
    */
    function removeDocFromFiles(doc) {
      if ($scope.docDict.hasOwnProperty(doc._id)) {
        var files = $scope.myCode.files;
        for (var i = 0, ix = files.length; i < ix; i++) {
          if (files[i]._id === doc._id) {
            files.splice(i, 1);
            break;
          }
        }
        delete $scope.docDict[doc._id];
      }
    }
    function getDoc(doc) {
      var db = $scope.db;
      return db.getDoc(doc).then(scoped(function getDocSuccess(doc) {
        if (db !== $scope.db) {
          // db has changed, don't bother doing anything.
          return reject(new Error('db has changed'));
        }
        removeDocFromFiles(doc);
        $scope.docDict[doc._id] = doc;
        $scope.myCode.files.push(doc);
        $scope.myCode.files.sort(newestFirst);
        return doc;
      })).fail(genericFail('getDoc', doc));
    }
    $scope.getDoc = getDoc;
    function dbChanged(event, change) {
      var doc = $scope.docDict[change.id] || null;
      window.console.log(['dbChanged', arguments, doc]);
      if (change.deleted) {
        if (doc) {
          doc.deleted = true;
        }
      } else if (doc === null || doc._rev !== _.last(change.changes).rev) {
        $scope.getDoc({_id: change.id});
      }
    }
    $scope.$on('dbChanged', dbChanged);

  }
  window.MenuCtrl = MenuCtrl;
}).call(this);