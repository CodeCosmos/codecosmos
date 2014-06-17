#!/usr/bin/env node
// -*- mode: javascript -*-
var http = require('http');
var static = require('node-static');

var file = new static.Server('./www');
var server = http.createServer(function (req, res) {
    req.addListener('end', file.serve.bind(file, req, res)).resume();
}).listen(0, function () {
    console.log(
        'Running CodeCosmos dev server at http://127.0.0.1:' +
         this.address().port +
         '/#no-login' +
         '\n' +
         'Press CTRL-C to abort.');
});
