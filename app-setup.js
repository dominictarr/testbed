var express = require('express') 
  , fs = require('fs')
  , app = express.createServer()
  , package = JSON.parse(fs.readFileSync(__dirname + '/package.json'))

module.exports = function (config){
  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', {
      testbedPackage: package, 
      status: 'success', //sets the tab icon
      basedir: config.basedir
      });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
  });

  return app
}