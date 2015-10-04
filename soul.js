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
        var found_locations = [];
        async.waterfall([
            function get_directions(callbackOrder) {
                var time; 
                search_coords = [
                    {
                        lat: '32.7150',
                        lng: '-117.1625',
                        type: 'breakfast',
                        time: '0800',
                        day_of_week: 1,
                    },
                    {
                        lat: '34.0500',
                        lng: '-118.2500',
                        type: 'lunch',
                        time: '1200',
                        day_of_week: 1,
                    },
                    {
                        lat: '37.7833',
                        lng: '-122.4167',
                        type: 'dinner',
                        time: '1900',
                        day_of_week: 1,
                    }];
                callbackOrder(null, search_coords);
            },
            function search(coords, callbackOrder) {
                async.each(coords, function(coord, callbackCoord) {
                    var input = {term: "food", radius_filter: radius, ll: coord['lat'] + ',' + coord['lng']};
                    //console.log("Starting checks for time: %s", coord['time']);
                    async.waterfall([
                        function yelp_api(callbackSearch) {
                            yelp.search(input, function(error, data) {
                                if (error) {
                                    console.log(error);
                                }
                                //console.log("Number of business from list %d", data["businesses"].length);
                                callbackSearch(null, data["businesses"]);
                            });
                        },
                        function google_places(businesses, callbackSearch) {
                            async.detectSeries( businesses, function(business, done) {
                                async.waterfall([
                                    function places_search(callbackIsOpen) {
                                        var latlng = business['location']['coordinate']['latitude'] +","+
                                                     business['location']['coordinate']['longitude'];
                                        //console.log('Started running for business %s %s.', business['name'], latlng);
                                        var params = {
                                            location: latlng,
                                            name: business['name'],
                                            radius: 100,
                                        };
                                        gmAPI.placeSearch( params, function(err, results) {
                                            if (err) {
                                                console.log(err);
                                                callbackIsOpen(null);
                                                done(false);
                                            }
                                            else{
                                            callbackIsOpen(null, results);
                                            }
                                        });
                                    },
                                    function places_details(places, callbackIsOpen) {
                                        //console.log('Places %s', business['name']);
                                        if( 'results' in places ){
                                            //console.log(places['results'][0]['place_id']);
                                            var params = {
                                                placeid: places['results'][0]['place_id'],
                                            };
                                            gmAPI.placeDetails( params, function(err, results) {
                                                if(err) {
                                                    console.log(err);
                                                }
                                                //console.log(results);
                                                if ( 'opening_hours' in results['result'] ) {
                                                    var time_open = results['result']['opening_hours']['periods'][coord['day_of_week']];
                                                    callbackIsOpen(null, 
                                                                   time_open['close']['time'] > coord['time'] && time_open['open']['time'] < coord['time']);
                                                }
                                                else{
                                                    callbackIsOpen(null, false);
                                                }
                                            });
                                        }
                                    }
                                ], function(err, result){
                                    if (err) {
                                        console.log(err);
                                    }
                                    //console.log('Finished running for business %s.', business['name']);
                                    done(result);
                                });
                            },
                            function(result){
                                if (result) {
                                    console.log("Business for time slot %s is %s.", coord['time'], result['name']);
                                    callbackSearch(null, result);
                                }
                                else {
                                    console.log("Error did not find any valid result for time: %s", coord['time']);
                                    callbackSearch(null);
                                }
                            });
                        },
                    ], function (err, results) {
                        console.log("Finished calls for %s", coord['time']);
                        coord['business'] = results;
                        //console.log(coord);
                        found_locations.push(coord);
                        callbackCoord(null);
                    });
                }, function(err) {
                    if (err) {
                        console.log(err);
                    }
                    callbackOrder(null);
                });
            }
        ],function (err,results) {
            if (err) {
                console.log(err);
                res.send(err);
            }
            else 
                res.json({start: start, end: end, found_locations: found_locations});
        });
    }
};

