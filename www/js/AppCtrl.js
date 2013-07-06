(function () {
  'use strict';
  var root = this;
  var angular = root.angular;
  var _ = root._;
  var CodeDB = root.CodeDB;
  
  var LOCAL_DB_PREFIX = 'codecosmos-';
  var SESSION_KEY = LOCAL_DB_PREFIX + '$session';
  var REMOTE_DB_URL = 'https://etrepum.iriscouch.com:6984/';
  function AppCtrl($scope, $http, $window) {
    $scope.session = null;
    $scope.username = null;
    $scope.password = null;
    $scope.docs = [];
    $scope.db = null;
    $scope.dbChanges = null;
    $scope.remoteDb = null;
    $scope.remoteDbUrl = REMOTE_DB_URL;
    $scope.session = null;
    $scope.containerVisible = false;
    $scope.bootstrapCode = null;
    var localStorage = $window.localStorage;
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
    $scope.dbChanged = function dbChanged(change) {
      $window.console.log(['dbChanged', change]);
    };
    $scope.$watch('session', function watchSession(newValue, oldValue) {
      // Changing the session will open or close the database 
      // and set username/password/docs.
      var fields = ['username', 'password'];
      var session = newValue || {};
      if ($scope.username !== session.username) {
        $scope.docs.splice(0, $scope.docs.length);
        if ($scope.db) {
          $scope.db.close();
        }
        if ($scope.remoteDb) {
          $scope.remoteDb.close();
        }
        if ($scope.dbChanges) {
          $scope.dbChanges.cancel();
        }
        if (newValue) {
          var db = new CodeDB(LOCAL_DB_PREFIX + session.username);
          $scope.db = db;
          $scope.dbChanges = $scope.db.changes({
            continuous: true,
            conflicts: true,
            onChange: function(change) {
                $scope.$apply(function () {
                  if (db === $scope.db) {
                    $scope.dbChanged(change);
                  }
                });
            }});
        } else {
          $scope.db = null;
          $scope.remoteDb = null;
          $scope.dbChanges = null;
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