module.exports = function (grunt) {
  'use strict';
  var os = require('os');
  var fs = require('fs');
  var path = require('path');
      
  var generateAppCache = function generateAppCache() {
    var options = this.options({});
    var prefix = 'dist';
    var manifest = 'codecosmos.appcache';
    this.files.forEach(function (file) {
      file.src.forEach(function (src) {
        fs.writeFileSync(
          file.dest,
          fs.readFileSync(src, 'UTF-8').replace(
            '<html>',
            '<html manifest="' + manifest + '">'));
      });
    });
    var lines = [fs.readFileSync('www/' + manifest, 'UTF-8'),
                 '',
                 ['#', '[' + os.hostname() + ']', new Date()].join(' '),
                 'CACHE:'];
    function skip(fn) {
      return (/^(\..*|URL|CNAME|VERSION|COPYING|Makefile|(bower|component|composer)\.json|demo\.html|diff_match_patch_test\..*|.*\.(appcache|txt|map)|LICENSE.*|README.*)$/.test(fn));
    }
    function walk(outputPrefix, dirname) {
      fs.readdirSync(dirname).reduce(function (acc, fn) {
        if (!skip(fn)) {
          var inPath = path.join(dirname, fn);
          var outPath = path.join(outputPrefix, fn);
          var stats = fs.statSync(inPath);
          if (stats.isFile()) {
            lines.push(outPath);
          } else if (stats.isDirectory()) {
            // recurse later so all files come before directories
            acc.push([outPath, inPath]);
          }
        }
        return acc;
      }, []).forEach(function (args) { walk.apply(null, args); });
    }
    walk('', 'dist');
    lines.push('');
    fs.writeFileSync('dist/codecosmos.appcache', lines.join('\n'));
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'www/js/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    csslint: {
      lax: {
        options: {
          ids: false,
          'overqualified-elements': false,
          'compatible-vendor-prefixes': false,
          'fallback-colors': false,
          'box-sizing': false,
          'box-model': false,
          'qualified-headings': false,
          'unique-headings': false,
          'gradients': false
        },
        src: ['www/css/*.css']
      }
    },
    watch: {
      files: ['<%= jshint.files %>', '<%= csslint.lax.src %>'],
      tasks: ['jshint', 'csslint']
    },
    copy: {
      main: {
        files: [{expand: true, src: ['**'], cwd: 'www/', dest: 'dist/'}]
      }
    },
    appcache: {
      main: {
        files: [{expand: true, src: ['*.html'], cwd: 'www/', dest: 'dist/'}]
      }
    },
    bower: {
      install: {
        options: {
          copy: false
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.task.registerMultiTask('appcache', 'generates the codecosmos.appcache', generateAppCache);
  grunt.registerTask('default', ['test', 'build']);
  grunt.registerTask('build', ['copy', 'appcache']);
  grunt.registerTask('prepublish', ['bower:install', 'default']);
  grunt.registerTask('test', ['jshint', 'csslint']);
};
