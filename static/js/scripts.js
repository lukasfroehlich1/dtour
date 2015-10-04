$('#submit-query').click( function() {
    $('#map').show();
    $('#inputs').hide();
    google.maps.event.trigger(map, 'resize');
    $.ajax({
        url: "/api",
        method: "POST",
        dataType: "json",
        data: {
            start_location: $('#start_location').val(),
            start_time: $('#start_time').val(),
            end_location: $('#end_location').val(),
        },
        success: function(data) {
            var start = new google.maps.LatLng(data['start']['lat'],
                                               data['start']['lng']);
            var end = new google.maps.LatLng(data['end']['lat'],
                                             data['end']['lng']);
            var stop = new google.maps.LatLng(data['locations']['location']['coordinate']['latitude'],
                                              data['locations']['location']['coordinate']['longitude']);
            var middle = new google.maps.LatLng(data['search_coords']['lat'],
                                                data['search_coords']['lng'])
            displayRoute(start, end);
            addMarker(stop, data['locations']['name']);
            addMarker(middle, 'Middle');
        },
        failure: function() {
            alert('failure');
        },
        error: function() {
            alert("Sorry could not process result yet");
        }
    });
});

function displayRoute(start, end) {
    var directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);

    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    };
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        }
    });
}

function addMarker(stopLatLng, name) {
    var marker = new google.maps.Marker({
        position: stopLatLng,
        map: map,
        title: name
    });
}

var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 30, lng: 100},
        zoom: 8
    });
}
