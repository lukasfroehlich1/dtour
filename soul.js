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

//curently used
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

var legit_times = ["0700","0800","0900","1100","1200","1300","1800","1900","2000","2100"];

find_next_time = function(init_time) {
    console.log(legit_times[10]);
    var next_time_slot = init_time;
    var done = false;
    while (done == false) {
        for (i=0; i<legit_times.length; i++) {
            var ltime = Number(legit_times[i]);
            if (ltime == next_time_slot) {
                console.log(ltime);
                return i;
                done = true;
            }
            next_time_slot = (next_time_slot + 1) % 2400;
        }
    }
    return -1;
}

convert_hour2sec = function(time) {
    var hr = Number(time.substr(0,2));
    var min = Number(time.substr(2,4));
    return min*60 + hr*3600;
}

var legit_times_s = [];

for (i=0; i<legit_times.length; i++) {
    legit_times_s.push(convert_hour2sec(legit_times[i]));
}

time_coords = function(steps, time, target_time, date_num) {
    var duration = convert_hour2sec(time);
    for (i=0; i<steps.length; i++) {
        duration += steps[i]["duration"]["value"];
        if (duration > target_time) {
            duration -= steps[i]["duration"]["value"];
            var cur_step = steps[i];
            var length_step = cur_step["distance"]["value"];
            var time_step = cur_step["duration"]["value"];
            var rate = length_step/time_step;
            var remaining = target_time - duration;
            var remaining_dist = rate * remaining;
            var line_points = polyline.decode(cur_step['polyline']['points']);
            var step_dist = 0;
            for (j=0; j<line_points.length-1; j++) {
                var start = {latitude: line_points[j][0] ,longitude: line_points[j][1]};
                var end = {latitude: line_points[j+1][0],longitude: line_points[j+1][1]};
                step_dist += geolib.getDistance(start,end);
                if (step_dist > remaining_dist) {
                    return {"lat": line_points[j][0],
                            "lng": line_points[j][1]}
                }
            }
        }
    }
    return null;
}

var food_time = {"0700":"breakfast",
                 "0800":"breakfast",
                 "0900":"breakfast",
                 "1100":"lunch",
                 "1200":"lunch",
                 "1300":"lunch",
                 "1800":"dinner",
                 "1900":"dinner",
                 "2000":"dinner",
                 "2100":"dinner"};

calculate_time_stop = function(steps, time) {
    var next_inc = find_next_time(time);
    var target_time = legit_times_s[next_inc];
    var list_of_stops = [];
    var date_num = 0;
    console.log(steps.length);
    while (true) {
        var result = time_coords(steps, time, target_time, date_num);
        if (result == null) {
            break;
        }
        var time = legit_times[next_inc];
        result["time"] = time;
        result["type"] = food_time[time];
        //this needs to be fixed with day
        result["day_of_week"] = 1;
        list_of_stops.push(result);
        //each time this mods need to increase the day by one
        next_inc = (next_inc + 1) % legit_times.length;
        target_time += legit_times_s[next_inc] + 3600;
    }
    return list_of_stops;
}

module.exports = {
    trip: function(req, res) {
        var start = req.body.start_location;
        var end = req.body.end_location;
        //this time should be astring
        var time = req.body.start_time;
        var radius = 10000;
        var search_coords;
        var found_locations = [];
        async.waterfall([
            function get_directions(callbackOrder) {
                gmAPI.directions({origin: start, destination: end}, function(err, results){
                    console.log(err);
                    var steps = results["routes"][0]["legs"][0]["steps"];
                    start = steps[0]["start_location"];
                    end = steps[steps.length-1]["end_location"]; 
                    search_coords = calculate_time_stop(steps, time);
                    callbackOrder(null, search_coords);
                });
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

