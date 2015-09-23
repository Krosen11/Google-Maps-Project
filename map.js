var currPos = null;
var map = null;
var infoWindow = null;
var geocoder = null;
var currMarkers = [];
var range = 2000;
var current_search = null;
var places_active = false;

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
            clearMap();
            getPlaces(data[i]);
            break;
        }
    }
});

$("#search-options-btn").click(toggleOptions);

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 30.2500, lng: 97.7500},
        zoom: 14
    });
    infoWindow = new google.maps.InfoWindow({map: map});
    
    geocoder = new google.maps.Geocoder();

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
    switch (value) {
        case "Food":
            place_type = 'food';
            is_food = true;
            break;
        case "Bars":
            place_type = 'bar';
            break;
        case "Gas Stations":
            place_type = 'gas_station';
            break;
        case "Electronics":
            place_type = 'electronics_store';
            break;
        case "Restaurants":
            place_type = 'restaurant';
            break;
        case "ATMs":
            place_type = 'atm';
            break;
        case "Doctors":
            place_type = 'doctor';
            break;
        default:
            alert("Invalid search query. Please enter one of the valid places to search for. To see these options, please select the \"Possible Searches\" box.");
            return;
    }
    //Before we add our places to the map, we should remove anything currently on the map
    clearMap();
    places_active = true;
    current_search = value;
    if (is_food) {
        var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
            location: currPos,
            radius: range,
            types: [place_type, 'restaurant', 'cafe']
        }, addMarkersToMap);
    }
    else {
        var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
            location: currPos,
            radius: range,
            types: [place_type]
        }, addMarkersToMap);
    }
}

function addMarkersToMap(results, status, pagination) {
    var bounds = new google.maps.LatLngBounds();
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i], bounds);
        }
    }
    if (pagination.hasNextPage) {
        if (!$("#more-btn").length) {
            jQuery("<button/>", {
                id: 'more-btn',
                text: 'Display More Results'
            }).css("display", "none").appendTo("body");
        }

        $("#more-btn").disabled = false;
        
        $("#more-btn").click(function() {
            $("#more-btn").disabled = true;
            pagination.nextPage();
        });
        
        $("#more-btn").show("fast");
    }
    else {
        $("#more-btn").hide();
    }
    map.fitBounds(bounds); //This will fit all our places on the map at once
}

function createMarker(place, bounds) {
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
    
    bounds.extend(placeLoc);
}

function clearMap() {
    //This function will clear all of the markers from the map and then empty the currMarkers array
    for (var i = 0; i < currMarkers.length; i++) {
        currMarkers[i].setMap(null); //This will remove currMarkers[i] from the map
    }
    //Finally, let's set our currMarkers to a new, empty array
    currMarkers = [];
    places_active = false;
    if ($("#more-btn").length) $("#more-btn").hide(); //Hide this button if it existed
}

function toggleOptions(event) {
    if ($("#search-options").length === 0) {
        //This means that the element does not exist yet, so we will create it
        jQuery("<div/>", {
            id: 'search-options'
        }).css("display", "none").insertAfter("#search-options-btn");
        
        //NOTE: We are setting the display to none so that the text boxes do not show up just yet.
        jQuery("<div/>", {
            id: 'location-div',
            text: 'Location: '
        }).appendTo("#search-options");
        
        jQuery("<div/>", {
            id: 'range-div',
            text: 'Range (m): '
        }).appendTo("#search-options");
        
        jQuery("<input/>", {
            id: 'location',
            type: 'text',
            name: 'input2',
            focus: function() {
                $(this).data("hasfocus", true);
            },
            blur: function() {
                $(this).data("hasfocus", false);
            },
            keydown: function(event) { //This will get the value inside the text box once the user hits enter
                if (event.which === 13 && $(this).data("hasfocus")) changeParams(this, "location");
            } 
        }).appendTo("#location-div");
        
        jQuery("<input/>", {
            id: 'range',
            type: 'text',
            name: 'input3',
            focus: function() {
                $(this).data("hasfocus", true);
            },
            blur: function() {
                $(this).data("hasfocus", false);
            },
            keydown: function(event) {
                if (event.which === 13 && $(this).data("hasfocus")) changeParams(this, "range");
            }
        }).appendTo("#range-div");
    }
    
    //Now we know that this element exists, so we must do a toggle
    $("#search-options").toggle("slow");
}

function changeParams(element, type) {
    var text = $(element).val();
    if (type === "range") {
        //We first need to see if this is a valid number
        range = ~~Number(text); //The '~~' will truncate any fractional pieces
        if (String(range) !== text || range < 0) {
            //This means we either have a non-integer value or a negative value, so reset range and alert user
            range = 2000;
            alert("Invalid range entered. Please enter a number greater than 0.");
        }
        
        //Since there really is no visual to tell users that this has been updated, let's add it here.
        if (places_active) {
            getPlaces(current_search);
        }
    }
    else {
        geocodeAddress(text);
    }
}

function geocodeAddress(address) {
    geocoder.geocode({'address': address}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
            });
            
            currPos = marker.position; //Ensures that subsequent Places searches are based on this location
            infoWindow.setPosition(results[0].geometry.location);
            infoWindow.setContent('Specified Location');
            
            //Before we move, let's clear all the markers from the old location
            clearMap();
            currMarkers.push[marker]; //We want to remove this as soon as we do a places search
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}