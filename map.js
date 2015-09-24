//Map variables
var currPos = null;
var map = null;
var infoWindow = null;
var geocoder = null;
var range_circle = null;
var currMarkers = [];
var range = 2000;

//Places variables
var current_search = null;
var places_active = false;

//Code to run upon initialization
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

//Set onclick listeners
$("#search-options-btn").click(toggleOptions);
$("#atm").click(getPlacesDropdown);
$("#bars").click(getPlacesDropdown);
$("#doctors").click(getPlacesDropdown);
$("#electronics").click(getPlacesDropdown);
$("#food").click(getPlacesDropdown);
$("#gas").click(getPlacesDropdown);
$("#restaurants").click(getPlacesDropdown);

//This function is the callback function from the asynch Maps API request. Initializes the map to the user's location, if possible
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 30.2500, lng: 97.7500},
        zoom: 14
    });
    infoWindow = new google.maps.InfoWindow({map: map});
    
    geocoder = new google.maps.Geocoder();

    // Attempt to get the user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            currPos = pos;

            //Set some of our variables
            infoWindow.setPosition(pos);
            infoWindow.setContent('Current Location');
            map.setCenter(pos);
            range_circle = new google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillOpacity: 0,
                map: map,
                center: pos,
                radius: range
            });
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } 
    else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

//This function handles errors in locating the user
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

//This function gets called whenever the user clicks one of the "Possible Searches" dropdowns
function getPlacesDropdown(event) {
    getPlaces($(this).text());
}

//This function initializes all the Place markers on the map based upon the entered value
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

//This function will add the markers we found in our Places search to our map
function addMarkersToMap(results, status, pagination) {
    var bounds = new google.maps.LatLngBounds();
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i], bounds);
        }
    }
    /*The map can only show 20 places at a time. If there are more results, we want to have a "Display More Results"
    button so that the user can see as many results as possible*/
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
    map.fitBounds(bounds); //This will fit all our places on the map at once; seems to cause an issue when centering map on new loc
}

//This function actually creates an individual marker and places it on the map.
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

//This function will clear all of the markers from the map and then empty the currMarkers array
function clearMap() {
    for (var i = 0; i < currMarkers.length; i++) {
        currMarkers[i].setMap(null); //This will remove currMarkers[i] from the map
    }
    //Finally, let's set our currMarkers to a new, empty array
    currMarkers = [];
    places_active = false;
    if ($("#more-btn").length) $("#more-btn").hide(); //Hide this button if it existed
}

//This function handles the "Search Options" dropdown, toggling the options when the user presses it.
function toggleOptions(event) {
    if ($("#search-options").length === 0) {
        //This means that the elements do not exist yet, so we will create them
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
            text: 'Range (km): '
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

//This function is called when the user enters something into one of the Search Options fields
function changeParams(element, type) {
    var text = $(element).val();
    if (type === "range") {
        //We first need to see if this is a valid number
        range = Number(text);
        if (String(range) !== text || range < 0) {
            //This means we either have a non-integer value or a negative value, so reset range and alert user
            range = 2000;
            alert("Invalid range entered. Please enter a number greater than 0.");
        }
        
        range = range * 1000; //Convert to meters
        //Since there really is no visual to tell users that this has been updated, let's add it here.
        range_circle.setRadius(range);
        if (places_active) {
            getPlaces(current_search);
        }
    }
    else {
        geocodeAddress(text);
    }
}

//This function brings the map to whatever location the user specified in the Location field
function geocodeAddress(address) {
    geocoder.geocode({'address': address}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            currPos = results[0].geometry.location; //Ensures that subsequent Places searches are based on this location
            
            infoWindow.setPosition(currPos);
            infoWindow.setContent('Specified Location');
            
            //Before we move, let's clear all the markers from the old location and set our circle here
            var old_active_val = places_active;
            clearMap();
            places_active = old_active_val; //Since clearMap sets places_active to false, this will restore old value in case it was true
            range_circle.setCenter(currPos);
            map.setCenter(currPos);
            if (places_active) {
                getPlaces(current_search);
            }
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}