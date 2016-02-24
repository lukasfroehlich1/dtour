var express = require('express');
var soul = require('./soul');
var bodyParser = require('body-parser');
var cfenv = require('cfenv');
//var favicon = require('serve-favicon');

var app = express();
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
