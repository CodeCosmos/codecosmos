window.angular.element(document).ready(function () {
  'use strict';
  var CodeMirror = window.CodeMirror;
  var angular = window.angular;
  var $ = window.jQuery;
  var AppCtrl = window.AppCtrl;
  var LoginCtrl = window.LoginCtrl;
  var CodeCtrl = window.CodeCtrl;
  var MenuCtrl = window.MenuCtrl;

  function downloadUrlFactory() {
    return {
      link: function downloadUrlLink($scope, $element, $attrs) {
        $scope.$watch($attrs.downloadUrl, function (value) {
          $element.attr('href', value);
        });
      }
    };
  }

  // angular errors bootstrap
  function ErrorCtrl($scope) {
    function friendlyName(functionName) {
      if (functionName === '__userCode') {
        return 'your main code';
      } else if (functionName === '') {
        return '<anonymous function>';
      } else {
        return functionName.replace('__dot__', '.');
      }
    }
    $scope.type = '';
    $scope.message = '';
    $scope.explanation = '';
    $scope.errors = [];
    $scope.lintErrors = [];
    $scope.friendlyName = friendlyName;
    $scope.log = function (x) { window.console.log(x); };
  }

  angular.module('appModule', [])
    /* these are refactoring garbage */
    .directive('downloadUrl', downloadUrlFactory)
    .controller('AppCtrl', AppCtrl)
    .controller('LoginCtrl', LoginCtrl)
    .controller('ErrorCtrl', ErrorCtrl)
    .controller('MenuCtrl', MenuCtrl)
    .controller('CodeCtrl', CodeCtrl);
  angular.bootstrap('body', ['appModule']);

});