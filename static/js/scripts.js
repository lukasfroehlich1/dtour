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
            alert(JSON.stringify(data));
        },
        failure: function() {
            alert('failure');
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
