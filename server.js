var polyline = require('polyline');
var geolib = require('geolib');
var GoogleMapsAPI = require('googlemaps');

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

var params = {
    origin: "22 fairmount st, 94131",
    destination: "572 boysen st, 93405",
    mode: "driving"
}
trip_suggestions = function() {

    gmAPI.directions(params, function(err, results){
        var steps = results["routes"][0]["legs"][0]["steps"];
        var dist = results["routes"][0]["legs"][0]["distance"]["value"];
        var coords = calculate_middle(steps, dist);

        var input = {term: "food",radius_filter: 10 , ll: coords[0] + ',' + coords[1]};

        yelp.search(input, function(error, data) {
            console.log(error);
            console.log(data["businesses"][0]);
        });
    });


}

gmAPI.directions(params, function(err, results){
    var steps = results["routes"][0]["legs"][0]["steps"];
    var dist = results["routes"][0]["legs"][0]["distance"]["value"];
    var coords = calculate_middle(steps, dist);

    var input = {term: "food",radius_filter: 10 , ll: coords[0] + ',' + coords[1]};

    yelp.search(input, function(error, data) {
        console.log(error);
        console.log(data["businesses"][0]);
    });
});

calculate_middle = function(steps, dist){
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
