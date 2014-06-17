(function () {
  'use strict';
  var root = this;
  var angular = root.angular;
  var _ = root._;
  var CodeDB = root.CodeDB;
  var BACKGROUND_IMAGES = [
    '280046main_CassAcomposite_bkg.jpg',
    'hs-2009-05-a-full_bkg.jpg',
    'hs-2010-13-a-full_bkg.jpg'];
  function LoginCtrl($scope, $http) {
    var defaults = {username: '', password: '', email: ''};
    $scope.user = _.extend({}, defaults);
    $scope.signInError = '';
    $scope.signUpError = '';
    $scope.signInDisabled = false;
    if (root.location.hash === '#no-login') {
      $scope.replaceSession($scope.user);
    }
    function rotateBackgroundImage() {
      // always pick a different one than what is currently displayed
      var images = _.without(BACKGROUND_IMAGES, $scope.backgroundImages);
      $scope.backgroundImage = images[Math.floor(Math.random() * images.length)];
    }
    rotateBackgroundImage();

    function focus(sel) {
      _.defer(function () { angular.element(sel).focus(); });
    }
    $scope.$watch('containerVisible', function (value) {
      if (value) {
        rotateBackgroundImage();
      }
    });
    function attemptSignUp(user) {
      var id = 'org.couchdb.user:' + user.username;
      var body = {_id: id,
                  name: user.username,
                  email: user.email,
                  password: user.password,
                  roles: [],
                  type: 'user'};
      var req = {method: 'PUT',
                 url: $scope.remoteDbUrl + '_users/' + id,
                 data: angular.toJson(body)};
      return $http(req).then(
        function signupSuccess(res) {
          if (res.status === 201) {
            return true;
          }
          throw res;
        });
    }
    function checkUserExists(user) {
      var auth = {headers: CodeDB.authorizationHeaders(user),
                  withCredentials: true};
      var req = {method: 'GET',
                 url: $scope.remoteDbUrl + CodeDB.remoteDbName($scope.user) + '/'};
      function dbExistsResponse(res) {
        window.console.log(['dbExistsResponse', res]);
        if (res.status === 404) {
          // User does not exist
          return null;
        } else if (res.status === 401 || res.status === 200) {
          // password was wrong
          return false;
        }
        throw res;
      }
      return $http(_.extend({}, req, auth)).then(
        function dbLoginSuccess(res) {
          window.console.log(['dbLoginSuccess', res]);
          // User exists and credentials are OK
          return res.status === 200;
        },
        function dbLoginFail(res) {
          window.console.log(['dbLoginFail', res]);
          // See if the user even exists
          return $http(req).then(dbExistsResponse, dbExistsResponse);
        });
    }
    $scope.signIn = function signIn(user) {
      $scope.signInDisabled = true;
      $scope.signInError = '';
      $scope.signUpError = '';
      function errFinish(msg) {
        $scope.signInDisabled = false;
        $scope.signInError = msg;
      }
      // null is user doesn't exist
      // true/false is credentials success
      if (user.username === '') {
        focus('.sign-in-form input[type=text]');
        errFinish('Username is required');
      } else if (user.password === '') {
        focus('.sign-in-form input[type=password]');
        errFinish('Password is required');
      } else {
        checkUserExists(user).then(
          function signInFinish(res) {
            $scope.signInDisabled = false;
            if (res) {
              $scope.replaceSession(user);
            } else if (res === false) {
              $scope.user.password = '';
              focus('.sign-in-form input[type=password]');
              errFinish('Incorrect password for ' + user.username);
            } else {
              errFinish("Username doesn't exist, have you signed up yet?");
            }
          },
          function signInError(res) {
            $scope.signInDisabled = false;
            window.console.log(['signInError', res]);
            errFinish('ERR: ' + angular.toJson(res));
          });
      }
    };
    $scope.signUp = function signUp(user) {
      $scope.signInDisabled = true;
      $scope.signInError = '';
      $scope.signUpError = '';
      function errFinish(msg) {
        $scope.signInDisabled = false;
        $scope.signUpError = msg;
      }
      if (user.username === '') {
        focus('.sign-up-form input[name=username]');
        errFinish('Username is required');
      } else if (user.password === '') {
        focus('.sign-up-form input[type=password]');
        errFinish('Password is required');
      } else {
        attemptSignUp(user).then(
          function signUpFinish(res) {
            $scope.signInDisabled = false;
            $scope.replaceSession(user);
          },
          function signUpError(res) {
            $scope.signInDisabled = false;
            if (res.status === 409) {
              errFinish('Username already exists');
            } else {
              window.console.log(['signUpError', res]);
              errFinish('ERR: ' + angular.toJson(res));
            }
          });
      }
    };
    $scope.$watch('session', function watchSession(newValue, oldValue) {
      // on any sort of login event, we want to clear these forms
      $scope.user = _.extend({}, defaults);
      $scope.signInDisabled = false;
      $scope.signInError = '';
      $scope.signUpError = '';
    });
  }
  root.LoginCtrl = LoginCtrl;
}).call(this);
