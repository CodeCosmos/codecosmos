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

  function CodeDB(name, opts) {
    var defaults = {auto_compaction: true};
    this.db = new Pouch(name, _.defaults(opts || {}, defaults));
  }
  CodeDB.prototype = _.extend(CodeDB.prototype, {
    getDoc: function CodeDB_getDoc(doc) {
      return dm(this.db, 'get', doc._id, {});
    },
    updateDoc: function CodeDB_updateDoc(doc) {
      var self = this;
      return dm(this.db, 'put', doc, {}).then(function didPut() {
        return self.getDoc(doc);
      });
    },
    removeDoc: function CodeDB_removeDoc(doc) {
      return dm(this.db, 'remove', doc, {});
    },
    getCode: function CodeDB_getCode(doc) {
      return dm(this.db, 'getAttachment', doc._id, BLOB_NAME, {}).then(
        deserializeBlob);
    },
    updateCode: function CodeDB_updateCode(doc, codeAndHistory) {
      var blob = serializeBlob(codeAndHistory);
      var self = this;
      if (!doc._attachments) {
        doc._attachments = {};
      }
      return dm(this.db, 'putAttachment', doc._id, BLOB_NAME, doc._rev, blob, BLOB_TYPE).then(
        function getUpdatedDoc() {
          return self.getDoc(doc);
        });
    },
    // Unwrapped API methods
    getDocList: function CodeDB_getDocList() {
      return dm(this.db, 'allDocs', {include_docs: true}).then(
        function dbAllDocs(res) {
          return _.pluck(res.rows, 'doc');
        });
    },
    createDoc: function CodeDB_createDoc(doc, codeAndHistory) {
      var self = this;
      return dm(this.db, 'post', doc, {}).
        then(function dbPost(response) {
          doc._id = response.id;
          doc._rev = response.rev;
          return self.updateCode(doc, codeAndHistory);
        });
    },
    changes: function CodeDB_changes(opts) {
      // pure passthrough
      return this.db.changes(opts);
    },
    close: function CodeDB_close() {
      return this.db.close();
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
    return 'userdb-' + CodeDB.hexEncode(user.username);
  };
  root.CodeDB = CodeDB;
}).call(this);