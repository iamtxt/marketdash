require('pmx').init();
// Set up an express server (not starting it yet)
var express = require('express');
var server = express();
// Add live reload
//server.use(livereload({port: livereloadport}));
// Use our 'dist' folder as rootfolder
server.use(express.static('./dist'));
// Because I like HTML5 pushstate .. this redirects everything back to our index.html
server.all('/*', function(req, res) {
  res.sendfile('index.html', { root: 'dist' });
});

server.listen(8000);
