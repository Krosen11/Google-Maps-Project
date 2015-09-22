var currPos = null;
var map = null;
var infoWindow = null;
var currMarkers = [];

var data = ["Gas Stations", "Food", "Restaurants", "Electronics", "Bars", "ATMs", "Doctors"];
$(".autocomplete").autocomplete({
    source: data,
    select: function(event, ui) {
        //This function handles the case where the user clicks a value from the drop down
        $(event.target).val(ui.item.value);
        getPlaces($(this).val());
        return false;
    }
});
$("#user-in").on('input', function() {
    //Will be handling the case where the user does not use autocomplete
    var currValue = $(this).val().toUpperCase();
    for (var i = 0; i < data.length; i++) {
        if (currValue === data[i].toUpperCase()) {
            console.log(currValue);
            clearMap();
            getPlaces(data[i]);
            break;
        }
    }
});

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 30.2500, lng: 97.7500},
        zoom: 14
    });
    infoWindow = new google.maps.InfoWindow({map: map});

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            currPos = pos;

            infoWindow.setPosition(pos);
            infoWindow.setContent('Current Location');
            map.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } 
    else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

function getPlaces(value) {
    var place_type = null;
    var is_food = false; //If this is true, we will look for 'food' tags and 'restaurant', 'cafe' tags
    console.log(value);
    if (value === "Food") {
        place_type = 'food';
        is_food = true;
    }
    else if (value === "Bars") place_type = 'bar';
    else if (value === "Gas Stations") place_type = 'gas_station';
    else if (value === "Electronics") place_type = 'electronics_store';
    else if (value === "Restaurants") place_type = 'restaurant';
    else if (value === "ATMs") place_type = 'atm';
    else if (value === "Doctors") place_type = 'doctor';
    //Before we add our places to the map, we should remove anything currently on the map
    clearMap();
    if (is_food) {
        var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
            location: currPos,
            radius: 2000, //2km search radius
            types: [place_type, 'restaurant', 'cafe']
        }, callback);
    }
    else {
        var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
            location: currPos,
            radius: 2000, //2km search radius
            types: [place_type]
        }, callback);
    }
}

function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    currMarkers.push(marker);
    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.setContent(place.name);
        infoWindow.open(map, this);
    });
}

function clearMap() {
    //This function will clear all of the markers from the map and then empty the currMarkers array
    for (var i = 0; i < currMarkers.length; i++) {
        currMarkers[i].setMap(null); //This will remove currMarkers[i] from the map
    }
    //Finally, let's set our currMarkers to a new, empty array
    currMarkers = [];
}