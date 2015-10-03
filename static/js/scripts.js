$('#submit-query').click( function() {
    $('#map').show();
    $('#inputs').hide();
    google.maps.event.trigger(map, 'resize');
    $.ajax({
        url: "/",
        method: "GET",
        data: {},
        success: function(data) {
            //move map and load pins
        },
        error: function() {
            alert("Sorry could not process result yet");
        }
    });
});

var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 30, lng: 100},
        zoom: 8
    });
}
