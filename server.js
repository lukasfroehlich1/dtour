var express = require('express');
var soul = require('./soul');
var bodyParser = require('body-parser');
var cfenv = require('cfenv');
var favicon = require('serve-favicon');

var http = require('http');
var path = require('path');
var express = require('express');
var hogan = require('hogan-express');
var mysql = require('mysql');
var fs = require('fs');

var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');

// check if application is being run in cloud environment
if (process.env.VCAP_SERVICES) {
  var services = JSON.parse(process.env.VCAP_SERVICES);

  // look for a service starting with 'mysql'
  for (var svcName in services) {
    if (svcName.match(/^mysql/)) {
      var mysqlCreds = services[svcName][0]['credentials'];
      var db = mysql.createConnection({
        host: mysqlCreds.host,
        port: mysqlCreds.port,
        user: mysqlCreds.user,
        password: mysqlCreds.password,
        database: mysqlCreds.name
      });

      createTable();
    }
  }
}

var app = express();
app.use(favicon(__dirname + '/static/images/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res) {
    res.render('home', { title: 'Hey', message: 'Hello there!'});
});

var router = express.Router();

router.get('/', function(req, res) {
    res.json({message: "horray! welcome to our api!" });
});

router.route('/').post(function(req, res) {
    soul.trip(req,res);
});

app.use('/api', router);

var appEnv = cfenv.getAppEnv();

var server = app.listen(appEnv.port, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('server starting on ' + appEnv.url);
    console.log('Example log listening at http://%s:%s', host, port);
});
