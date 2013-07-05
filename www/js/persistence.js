(function () {
  'use strict';
  var BLOB_TYPE = 'text/plain;charset=utf-8';
  var BLOB_NAME = 'history-code-blob';
  var BLOB_ERROR = {error: 'INVALID_BLOB', status: 500};
  var Blob = window.Blob;
  var FileReader = window.FileReader;
  var Pouch = window.Pouch;
  var Deferred = window.jQuery.Deferred;
  var db = new Pouch('local-code', {auto_compaction: false});
  window._db = db;

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
    var args = Array.prototype.slice.call(arguments, 2);
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

  var CodeDB = {
    getDoc: function CodeDB_getDoc(doc) {
      return dm(db, 'get', doc._id, {});
    },
    updateDoc: function CodeDB_updateDoc(doc) {
      var self = this;
      return dm(db, 'put', doc, {}).then(function didPut() {
        return self.getDoc(doc);
      });
    },
    removeDoc: function CodeDB_removeDoc(doc) {
      return dm(db, 'remove', doc, {});
    },
    getCode: function CodeDB_getCode(doc) {
      return dm(db, 'getAttachment', doc._id, BLOB_NAME, {}).then(
        deserializeBlob);
    },
    updateCode: function CodeDB_updateCode(doc, codeAndHistory) {
      var blob = serializeBlob(codeAndHistory);
      var self = this;
      if (!doc._attachments) {
        doc._attachments = {};
      }
      return dm(db, 'putAttachment', doc._id, BLOB_NAME, doc._rev, blob, BLOB_TYPE).then(
        function getUpdatedDoc() {
          return self.getDoc(doc);
        });
    },
    // Unwrapped API methods
    getDocList: function CodeDB_getDocList() {
      return dm(db, 'allDocs', {include_docs: true}).then(
        function dbAllDocs(res) {
          return res.rows.map(function extractDoc(row) {
            return row.doc;
          });
        });
    },
    createDoc: function CodeDB_createDoc(doc, codeAndHistory) {
      var self = this;
      return dm(db, 'post', doc, {}).
        then(function dbPost(response) {
          doc._id = response.id;
          doc._rev = response.rev;
          return self.updateCode(doc, codeAndHistory);
        });
    }
  };
  window.CodeDB = CodeDB;
})();