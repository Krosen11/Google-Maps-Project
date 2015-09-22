$("#food").click(getPlaces);
$("#bars").click(getPlaces);

var currPos = null;
var map = null;
var infoWindow = null;
var currMarkers = [];

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

function getPlaces(event) {
    if ($(this).attr("id") === "food") {
        //Before we add food to the map, we should remove anything currently on the map
        clearMap();
        var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
            location: currPos,
            radius: 2000, //2km search radius
            types: ['food']
        }, callback);
    }
    else if ($(this).attr("id") === "bars") {
        clearMap();
        var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
            location: currPos,
            radius: 2000, //2km search radius
            types: ['bar']
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