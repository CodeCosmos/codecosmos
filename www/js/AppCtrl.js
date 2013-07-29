(function () {
  'use strict';
  var root = this;
  var angular = root.angular;
  var _ = root._;
  var CodeDB = root.CodeDB;
  
  var LOCAL_DB_PREFIX = 'codecosmos-';
  var REMOTE_DB_PREFIX = 'userdb-';
  var SESSION_KEY = LOCAL_DB_PREFIX + '$session';
  // legacy URL
  var REMOTE_DB_URL = 'https://etrepum.iriscouch.com:6984/';
  if (window.location && window.location.port === "8080") {
    // local deployment hack
    REMOTE_DB_URL = 'http://' + window.location.hostname + ':5984/';
  } else if (window.location.protocol === 'https:') {
    // production deployment hack, db and static files on same hostname.
    REMOTE_DB_URL = window.location.protocol + window.location.host + '/';
  }
    
  function AppCtrl($scope, $http, $window) {
    // this is the current deferred for getting the db
    $scope.getDbHandle = null;
    $scope.session = null;
    $scope.username = null;
    $scope.password = null;
    $scope.docs = [];
    $scope.db = null;
    $scope.dbChanges = null;
    $scope.dbReplication = null;
    $scope.remoteDbUrl = REMOTE_DB_URL;
    $scope.session = null;
    $scope.containerVisible = false;
    $scope.bootstrapCode = null;
    var localStorage = $window.localStorage;
    function scoped(fn) {
      return function scoped$wrapper() {
        var self = this;
        var args = _.toArray(arguments);
        return $scope.$apply(function () {
          return fn.apply(self, args);
        });
      };
    }

    function fromStorage(serializedSession) {
      return serializedSession ? angular.fromJson(serializedSession) : null;
    }
    function updateStorage(sessionObject) {
      if (sessionObject) {
        localStorage.setItem(SESSION_KEY, angular.toJson(sessionObject));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    $scope.logout = function logout() {
      $scope.replaceSession(null);
    };

    $scope.replaceSession = function replaceSession(session, skipStorage) {
      if (skipStorage !== true) {
        updateStorage(session);
      }
      $scope.session = session;
    };
    $scope.setDb = function setDb(db) {
      if ($scope.db) {
        $scope.db.close();
        $scope.db = null;
      }
      if ($scope.dbReplication) {
        $scope.dbReplication.cancel();
        $scope.dbReplication = null;

      }
      if ($scope.dbChanges) {
        window.console.log(['would cancel dbChanges']);
        $scope.dbChanges.cancel();
        $scope.dbChanges = null;
      }
      if (db) {
        $scope.db = db;
        var changes = $scope.db.changes({
          continuous: true,
          conflicts: true,
          complete: function(err, res) {
            window.console.log(['changes_complete', db === $scope.db, err, res]);
          },
          onChange: function(change) {
            $scope.$apply(function () {
              if (db === $scope.db) {
                $scope.$broadcast('dbChanged', change);
              }
            });
          }});
        $scope.dbChanges = changes;
        $scope.dbReplication = db.startReplication({url: $scope.remoteDbUrl, user: $scope.session});
      }
    };
    $scope.$watch('session', function watchSession(newValue, oldValue) {
      // Changing the session will open or close the database 
      // and set username/password/docs.
      var fields = ['username', 'password'];
      var session = newValue || {};
      $scope.getDbHandle = null;
      if ($scope.username !== session.username) {
        $scope.docs.splice(0, $scope.docs.length);
        $scope.setDb(null);
        if (newValue) {
          var localDbUrl = LOCAL_DB_PREFIX + session.username;
          var getDbHandle = CodeDB.getCodeDB(localDbUrl).then(
            scoped(function gotLocalDb(db) {
              if (getDbHandle === $scope.getDbHandle) {
                $scope.setDb(db);
              }
            }),
            scoped(function failedToGetLocalDb(err) {
              // TODO: make an error happen here somehow
              window.console.log(['failedToGetLocalDb', err]);
              $scope.setDb(null);
              $scope.replaceSession(null);
            }));
          $scope.getDbHandle = getDbHandle;
        }
      }
      fields.forEach(function (field) {
        $scope[field] = session[field] || null;
      });
      /* All of the fades in and out */
      var loggedIn = !!newValue;
      angular.element('.front-bg,.login-container').show().fadeTo(400, (loggedIn ? 0 : 1)).toggle(!loggedIn);
      angular.element('#main-container,#container').show().fadeTo(400, (loggedIn ? 1 : 0), function () {
        $scope.$apply(function () {
          $scope.containerVisible = !!newValue;
        });
      }).toggle(loggedIn);
    });
    function onsessionstorage(newValue) {
      $scope.replaceSession(fromStorage(newValue), true);
    }
    $window.addEventListener('storage', function onstorage(event) {
      // Logging in or out in one window will log out everywhere
      if (event.key === SESSION_KEY) {
        $scope.$apply(_.partial(onsessionstorage, event.newValue));
      }
    });
    onsessionstorage(localStorage.getItem(SESSION_KEY));
    $http({method: 'GET', url: 'data/bootstrap.json'}).
      success(function bootstrapSuccess(data, status) {
        $scope.bootstrapCode = data;
        angular.element('#loading').hide();
        angular.element('.needs-loading').removeClass('needs-loading');
      }).
      error(function bootstrapError(data, status) {
        // TODO: This is not graceful at all! :(
        var errmsg = (window.location.protocol.indexOf('file') === 0) ?
              "CodeCosmos needs to be run from a webserver (even locally)" :
              "Connectivity problem, please try reloading :(";
        angular.element('#loading h1').text(errmsg);
      });
  }
  root.AppCtrl = AppCtrl;
}).call(this);