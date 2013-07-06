(function () {
  'use strict';
  var root = this;
  var btoa = root.btoa;
  var BLOB_TYPE = 'text/plain;charset=utf-8';
  var BLOB_NAME = 'history-code-blob';
  var BLOB_ERROR = {error: 'INVALID_BLOB', status: 500};
  var Blob = root.Blob;
  var FileReader = root.FileReader;
  var Pouch = root.Pouch;
  var Deferred = root.jQuery.Deferred;
  var _ = root._;

  function serializeBlob(doc) {
    return new Blob(['1\n', JSON.stringify(doc.history), '\n', doc.code],
                    {type: BLOB_TYPE});
  }

  function deserializeBlob(blob) {
    var d = new Deferred();
    var reader = new FileReader();
    reader.onloadend = function (event) {
      var m = this.result.match(/^1\n([^\n]+)\n([^]*)$/);
      try {
        d.resolve({history: JSON.parse(m[1]), code: m[2]});
      } catch (_err) {
        d.reject(BLOB_ERROR);
      }
    };
    reader.readAsText(blob, 'utf-8');
    return d.promise();
  }

  // Deferred from node.js style callback to a jQuery Deferred
  function dm(ctx, fn/*, ...args*/) {
    var d = new Deferred();
    var args = _.drop(arguments, 2);
    args.push(function cbToDeferred(err, res) {
      if (err) {
        d.reject(err);
      } else {
        d.resolve(res);
      }
    });
    var f = (typeof fn === 'string') ? ctx[fn] : fn;
    f.apply(ctx, args);
    return d;
  }

  function getPouch(name, options) {
    var d = new Deferred();
    // ensure this is never resolved in the same call stack so the deferred
    // can be used as a handle to see if this is the current request.
    _.defer(function () {
      var _db = new Pouch(name, options, function dbCallback(err, success) {
        if (err) {
          d.reject(err);
        } else {
          d.resolve(success);
        }
      });
    });
    return d;
  }

  function CodeDB(db, name, opts) {
    this._db = db;
    this._remoteDb = null;
    this._replicateTo = null;
    this._replicateFrom = null;
  }
  CodeDB.prototype = _.extend(CodeDB.prototype, {
    getDoc: function CodeDB_getDoc(doc) {
      return dm(this._db, 'get', doc._id, {});
    },
    updateDoc: function CodeDB_updateDoc(doc) {
      var self = this;
      return dm(this._db, 'put', doc, {});
    },
    removeDoc: function CodeDB_removeDoc(doc) {
      return dm(this._db, 'remove', doc, {});
    },
    getCode: function CodeDB_getCode(doc) {
      return dm(this._db, 'getAttachment', doc._id, BLOB_NAME, {}).then(
        deserializeBlob);
    },
    updateCode: function CodeDB_updateCode(doc, codeAndHistory) {
      var blob = serializeBlob(codeAndHistory);
      var self = this;
      if (!doc._attachments) {
        doc._attachments = {};
      }
      return dm(this._db, 'putAttachment', doc._id, BLOB_NAME, doc._rev, blob, BLOB_TYPE).then(
        function passthroughDoc() {
          return doc;
        });
    },
    // Unwrapped API methods
    getDocList: function CodeDB_getDocList() {
      return dm(this._db, 'allDocs', {include_docs: true}).then(
        function dbAllDocs(res) {
          return _.pluck(res.rows, 'doc');
        });
    },
    createDoc: function CodeDB_createDoc(doc, codeAndHistory) {
      var self = this;
      return dm(this._db, 'post', doc, {}).
        then(function dbPost(response) {
          doc._id = response.id;
          doc._rev = response.rev;
          return self.updateCode(doc, codeAndHistory);
        });
    },
    changes: function CodeDB_changes(opts) {
      // pure passthrough
      return this._db.changes(opts);
    },
    close: function CodeDB_close() {
      return this._db.close();
    },
    startReplication: function startReplication(opts) {
      var self = this;
      var otherDbUrl = opts.url + this.constructor.remoteDbName(opts.user) + '/';
      var dbOpts = {auth: {username: opts.user.username,
                           password: opts.user.password},
                    xhrFields: {withCredentials: true}};
      var promise = {
        _canceled: false,
        _remoteDb: null,
        _replicateTo: null,
        _replicateFrom: null,
        cancel: function CodeDB_replication_promise_cancel() {
          if (promise._canceled) {
            return;
          }
          promise._canceled = true;
          if (promise._replicateFrom) {
            promise._replicateFrom.cancel();
            promise._replicateFrom = null;
          }
          if (promise._replicateTo) {
            promise._replicateTo.cancel();
            promise._replicateTo = null;
          }
          if (promise._remoteDb) {
            promise._remoteDb.close();
            promise._remoteDb = null;
          }
        }
      };
      var otherDb = new Pouch(otherDbUrl, dbOpts, function (err, remoteDb) {
        window.console.log(['otherDb', err, remoteDb]);
        if (err) {
          promise.cancel();
        } else if (promise._canceled) {
          remoteDb.close();
        } else {
          var replicationOpts = {continuous: true};
          promise._remoteDb = remoteDb;
          var toCallback = function toCallback(err, res) {
            window.console.log(['toCallback', err, res]);
          };
          var fromCallback = function fromCallback(err, res) {
            window.console.log(['fromCallback', err, res]);
          };
          promise._replicateTo = Pouch.replicate(self._db, remoteDb, replicationOpts, toCallback);
          promise._replicateFrom = Pouch.replicate(remoteDb, self._db, replicationOpts, fromCallback);
        }
      });
      return promise;
    }
  });
  CodeDB.hexEncode = function hexEncode(s) {
    var r = [];
    var lut = "0123456789abcdef";
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c <= 0x7f) {
        r.push(lut.charAt(c >> 4) + lut.charAt(c & 0xf));
      } else {
        r.push(encodeURIComponent(s.charAt(i)).replace(/%/g, '').toLowerCase());
      }
    }
    return r.join('');
  };
  CodeDB.authorizationHeaders = function (user) {
    return {Authorization: 'Basic ' + btoa([user.username, user.password].join(':'))};
  };
  CodeDB.remoteDbName = function remoteDbName(user) {
    return 'userdb-' + this.hexEncode(user.username);
  };
  CodeDB.getCodeDB = function getCodeDB(name, opts) {
    var options = _.defaults(opts || {}, {auto_compaction: true});
    var CodeDB = this;
    return getPouch(name, options).then(function (db) {
      return new CodeDB(db, name, options);
    });
  };
  root.CodeDB = CodeDB;
}).call(this);