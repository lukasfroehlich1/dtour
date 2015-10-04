var express = require('express');
var bodyParser = require('body-parser');
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
    console.log(req);
    var start_location = req.body.start_location;
    var end_location = req.body.end_location;
    var start_time = req.body.start_time;

    res.json({val1: start_location,
              val2: end_location,
              val3: start_time});
});

app.use('/api', router);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example log listening at http://%s:%s', host, port);
});
