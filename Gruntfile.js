module.exports = function (grunt) {
  'use strict';
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
          'unique-headings': false
        },
        src: ['www/css/*.css']
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['test', 'build']);
  grunt.registerTask('build', []);
  grunt.registerTask('test', ['jshint', 'csslint']);
};