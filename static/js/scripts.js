var infowindows = [];
$('#submit-query').click( function() {
    $('#inputs').hide();
    $('#loading-container').show();
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
                    var marker = addMarker(stop, value['time']);
                    infowindows.push(custom_info_window(value['business']));
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
        },
        error: function() {
            alert("Sorry could not process result yet");
            $('#loading-container').hide();
            $('#inputs').show();
        },
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

function test(pkt) {
    var json = JSON.parse(pkt);
    $('#location-queue').append("<li class='list-group-item'><img class='thumb' src='"+json['snippet_img_url']+"'/>Hello</li>");
}

function custom_info_window(business, marker) {
    var categories = '';
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
                         "<button class='btn btn-primary' onclick='test("+'"'+'hello'+'"'+")'>Test</button>"+
                         //"<button class='btn btn-primary' onclick=\'function(){$(\"#location-queue\").append(<li class=\"list-group-item\">"+
                         //"<img class=\"thumb\" src=\""+business['snippet_img_url']+
                         //"\" /> <span class=\"thumb_text\">"+business['name']+"</span></li>);alert(\"hello\");}\'>Add</button>"+
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
