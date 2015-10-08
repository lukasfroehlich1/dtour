var infowindows = [];
var allMarkers = [];

// makes sure values have been inputted
function filled_in_values(start, end, time) {
    if (!start || !end || !time) {
        return false;
    }
    else{
        return true;
    }
}


// makes sure inputted time is military
function correct_time(string_time) {
    if (string_time.length != '4') {
        return false;
    }

    var int_time = parseInt(string_time);
    if ( isNaN(int_time) ){
        return false;
    }

    if ( int_time > 2400 || int_time < 0 ){
        return false;
    }

    return true;

}

function search_side() {
    $('#search-side-container').show();
    $('#pit-stop-container').hide();

    $('#stop-controller').prop('disabled', false);
    $('#search-controller').prop('disabled', true);
}

function stops_side() {
    $('#search-side-container').hide();
    $('#pit-stop-container').show();

    $('#stop-controller').prop('disabled', true);
    $('#search-controller').prop('disabled', false);
}

$('#submit-query2').click( function() {
    $('#map-displays').hide();
    $('#loading-container').show();
    directionsDisplay.setMap(null);
    $.each(allMarkers, function(index, value) {
        value.setMap(null);
    });
    infowindows = [];
    allMarkers = [];

    if ( !filled_in_values($('start_location2').val(), $('#end_location2').val()), $('#start_time2').val() )
    {
        alert("Not all fields were inputted");
        $('#loading-container').hide();
        $('#inputs').show();
        $('#footer-container').show();
        return;
    }

    if( !correct_time($('#start_time2').val()) ) {
        alert("Time was inputted wrong");
        $('#loading-container').hide();
        $('#inputs').show();
        $('#footer-container').show();
        return;
    }

    $.ajax({
        url: "/api",
        method: "POST",
        dataType: "json",
        data: {
            start_location: $('#start_location2').val(),
            start_time: $('#start_time2').val(),
            end_location: $('#end_location2').val(),
        },
        success: function(data) {
            var start = new google.maps.LatLng(data['start']['lat'],
                                               data['start']['lng']);
            var end = new google.maps.LatLng(data['end']['lat'],
                                             data['end']['lng']);

            displayRoute(start, end);
            $.each(data['found_locations'], function( index, value ) {
                if ( 'business' in value )
                {
                    var stop = new google.maps.LatLng(value['business']['location']['coordinate']['latitude'],
                                                      value['business']['location']['coordinate']['longitude']);
                    var marker = addMarker(stop, value['time']);
                    infowindows.push(custom_info_window(value['business'], value['time']));
                    var info_window = infowindows[infowindows.length-1];
                    marker.addListener('click', function() {
                        $.each(infowindows, function(index, value) {
                            value.close();
                        });
                        info_window.open(map, marker);
                    });
                }
            });
            $('#loading-container').hide();
            $('#map-displays').show();
            google.maps.event.trigger(map, 'resize');
        },
        failure: function() {
            alert('failure');
            $('#loading-container').hide();
            $('#inputs').show();
            $('#footer-container').show();
        },
        error: function() {
            alert("Sorry could not process result yet");
            $('#loading-container').hide();
            $('#inputs').show();
            $('#footer-container').show();
        },
    });
});

$('#submit-query').click( function() {
    $('#inputs').hide();
    $('#footer-container').hide();
    $('#loading-container').show();



    if ( !filled_in_values( $('#start_location').val(), $('#end_location').val(), $('#start_time').val() ) )
    {
        alert("Not all fields were inputted");
        $('#loading-container').hide();
        $('#inputs').show();
        $('#footer-container').show();
        return;
    }

    if( !correct_time($('#start_time').val()) ) {
        alert("Time was inputted wrong");
        $('#loading-container').hide();
        $('#inputs').show();
        $('#footer-container').show();
        return;
    }


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

            displayRoute(start, end);
            $.each(data['found_locations'], function( index, value ) {
                if ( 'business' in value )
                {
                    var stop = new google.maps.LatLng(value['business']['location']['coordinate']['latitude'],
                                                      value['business']['location']['coordinate']['longitude']);
                    allMarkers.push(addMarker(stop, value['time']));
                    var marker = allMarkers[allMarkers.length-1];
                    infowindows.push(custom_info_window(value['business'], value['time']));
                    var info_window = infowindows[infowindows.length-1];
                    marker.addListener('click', function() {
                        $.each(infowindows, function(index, value) {
                            value.close();
                        });
                        info_window.open(map, marker);
                    });
                }
            });
            $('#loading-container').hide();
            $('#map-displays').show();
            google.maps.event.trigger(map, 'resize');
        },
        failure: function() {
            alert('failure');
            $('#loading-container').hide();
            $('#inputs').show();
            $('#footer-container').show();
        },
        error: function() {
            alert("Sorry could not process result yet");
            $('#loading-container').hide();
            $('#inputs').show();
            $('#footer-container').show();
        },
    });
});

var directionsDisplay;

function displayRoute(start, end) {
    directionsDisplay = new google.maps.DirectionsRenderer();
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

function addMarker(stoplatlng, name) {
    return (new google.maps.Marker({
        position: stoplatlng,
        map: map,
        title: name
    }));
}
var image = 'http://icons.iconarchive.com/icons/thiago-silva/palm/16/Google-Maps-icon.png';
function addDumbMarker(stoplatlng, name) {
    return (new google.maps.Marker({
        position: stoplatlng,
        map: map,
        title: name,
        icon: image
    }));
}

function test(img, id, name, time_period) {
    var time_val = time_period.substr(0, 1)=='0'? time_period.substr(1, 1)+":"+time_period.substr(2,4)+'AM' :
                                                  (parseInt(time_period.substr(0, 2))-12).toString() +":"+ time_period.substr(2,4)+'PM';
    $('#location-queue').append("<li id="+id+" class='list-group-item'><img class='thumb' src='"+img+"'/><span>"+name+"   "+time_val+"</span></li>");
}

function custom_info_window(business, time_period) {
    var categories = '';
    var content_vals = '"'+business['image_url'] + '", "' + business['id']+ '", "' +
                           business['name'] + '", "' + time_period + '"';
    $.each(business['categories'], function(index, value) {
        if( index > 1 ){
            categories += '';
        }
        else {
            categories = categories + value[0] + ", ";
        }
    });
    var content_string = "<div id='content'>"+
                         "<div id='siteNotice'></div>"+
                         "<a href="+business['url']+">"+business['name']+"</a><br />"+
                         "<div id='bodyContent'>"+
                         "Rating: <img src='" + business['rating_img_url']+"'/><br />"+
                         "Type: "+ categories+ "..."+"<br />"+
                         "<button class='btn btn-primary' onclick='test("+content_vals+")'>Add</button>"+
                         "</div>";
    return (new google.maps.InfoWindow({
        content: content_string
    }));
}

var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 30, lng: 100},
        zoom: 8
    });
}
