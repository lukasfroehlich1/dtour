var polyline = require('polyline');
var geolib = require('geolib');
var GoogleMapsAPI = require('googlemaps');
var async = require('async');

var yelp = require("yelp").createClient({
  consumer_key: "BRao3_-71k3UGVBQAOCHAg", 
  consumer_secret: "v57ivrvRCFpmjyoHrAVvyNMsBK8",
  token: "G77q0HeRY32ONNVC2pQPh8fMMSYdVrAd",
  token_secret: "klbPKxqjk1a_a3My-IoE7rkl_qE"
});

var publicConfig = {
  key: 'AIzaSyAl1AUh9oQiTgNrNfeLW1RIOLZyzbKXSjA',
  stagger_time:       1000, // for elevationPath
  encode_polylines:   false,
  secure:             true, // use https
};

var gmAPI = new GoogleMapsAPI(publicConfig);

calculate_middle = function(steps, dist, time){
    var cur_dist = 0;
    var middle = dist/2;
    for (i=0; i<steps.length; i++) {
        cur_dist += steps[i]["distance"]["value"];
        if (cur_dist > middle) {
            cur_dist -= steps[i]["distance"]["value"];
            var middle_step = steps[i]
            var line_points = polyline.decode(middle_step['polyline']['points']);
            for (j=0; j<line_points.length-1; j++) {
                var start = {latitude: line_points[j][0] ,longitude: line_points[j][1]};
                var end = {latitude: line_points[j+1][0],longitude: line_points[j+1][1]};
                cur_dist += geolib.getDistance(start,end);
                if (cur_dist > middle) {
                    return line_points[j];
                }
            }
        }
    }
    return -1;
}

module.exports = {
    trip: function(req, res) {
        var start = req.body.start_location;
        var end = req.body.end_location;
        var time = req.body.start_time;
        var radius = 10000;
        var search_coords;
        async.waterfall([
            function get_directions(callback) {
                var time 
                gmAPI.directions({origin: start, destination: end }, function(err, results){
                    console.log(err);
                    var steps = results["routes"][0]["legs"][0]["steps"];
                    start = steps[0]["start_location"];
                    end = steps[steps.length-1]["end_location"]; 
                    var dist = results["routes"][0]["legs"][0]["distance"]["value"];
                    search_coords = calculate_middle(steps, dist);
                    callback(null, search_coords);
                });
            },
            function yelp_search(coords, callback) {
                var input = {term: "food", radius_filter: radius, ll: coords[0] + ',' + coords[1]};
                yelp.search(input, function(error, data) {
                    console.log(data["businesses"]);
                    callback(null, data["businesses"][0]);
                });
            }
        ],function (err,results) {
            if (err) {
                console.log(err);
                res.send(err);
            }
            else 
            setTimeout(function() {
                res.json({start: start, end: end,search_coords: {"lat": search_coords[0], "lng": search_coords[1]}, locations: results});
            },0);
        });
    }
};

