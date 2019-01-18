/****************************************************************************
 ****************************************************************************
    
    Initialize
    
*****************************************************************************
*****************************************************************************/
// For Google Maps
let   map, infowindow, service;
var delayBetweenAPICalls = 1500;

// Philadelphia
var location_philadelphia = {"lat": 39.9525839, "lng": -75.1652215};
var searchRadius    = 20 * 1609.34;

var markerIcons = {
    "eat"  : "assets/images/eat.png",
    "play" : "assets/images/play.png",
    "drink": "assets/images/drink.png"
};



/****************************************************************************
 ****************************************************************************
    
    Create databases
    
*****************************************************************************
*****************************************************************************/
function createDatabases() {
    // Initialize the map (only allow zooms)
    map = new google.maps.Map(document.getElementById('map'), {
        "center"          : location_philadelphia,
        "disableDefaultUI": true,
        "zoomControl"     : true,
        "zoom"            : 11
    });

    infowindow = new google.maps.InfoWindow();
    service    = new google.maps.places.PlacesService(map);

    // Create the restaurants database
    service.nearbySearch({
        "keyword" : "bbq",
        "location": location_philadelphia,
        "radius"  : searchRadius,
        "type"    : ["restaurant"]

    }, function(results, status) {
        getPlaceIDs(results, status, {"type": "eat", "name": "bbq"});

    });

    // Create the trails database
    service.nearbySearch({
        "keyword" : "trail",
        "location": location_philadelphia,
        "radius"  : searchRadius,
        "type"    : ["park"]

    }, function(results, status) {
        getPlaceIDs(results, status, {"type": "play", "name": "hike"});

    });

    // Create the breweries database
    service.nearbySearch({
        "keyword" : "brewery",
        "location": location_philadelphia,
        "radius"  : searchRadius,
        "type"    : ["bar"]

    }, function(results, status) {
        getPlaceIDs(results, status, {"type": "drink", "name": "brewery"});

    });
}

function getPlaceIDs(results, status, event) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        let i = 0;

        // Delay calling getPlaceDetails to avoid OVER_QUERY_LIMIT status
        var intervalID = setInterval(function() {
            // Get the place ID from Google Maps API
            service.getDetails({
                "placeId": results[i].place_id
            
            // Use an anonymous function to pass an extra parameter
            }, function(place, status) {
                // Find the place details
                getPlaceDetails(place, status, event);

            });

            i++;

            if (i === results.length) {
                clearInterval(intervalID);
            }

        }, delayBetweenAPICalls);
    }
}

function getPlaceDetails(place, status, event) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        /********************************************************************
            
            Clean the data
            
        *********************************************************************/
        // Find the street name, city, state, and zip code
        var address = place.formatted_address;

        var temp     = address.split(",");
        var location = {
            "address": address,
            "street" : temp[0].trim(),
            "city"   : temp[1].trim(),
            "state"  : temp[2].trim().substring(0, 2),
            "zipcode": temp[2].trim().substring(3)
        };

        // Find the latitude and longitude
        var geometry = {
            "lat": place.geometry.location.lat(),
            "lng": place.geometry.location.lng()
        };

        // Provide null value if an information is missing
        // (Firebase does not allow undefined)
        var phone      = (typeof place.formatted_phone_number !== "undefined") ? place.formatted_phone_number : null;
        var websiteURL = (typeof place.website !== "undefined") ? place.website : null;
        var imageURL   = (typeof place.photos  !== "undefined") ? place.photos[0].getUrl({"maxWidth": 600, "maxHeight": 600}) : null;
        var rating     = (typeof place.rating  !== "undefined") ? place.rating : null;
        
        // Save the information that we want
        var placeData = {
            "name"    : place.name,
            "location": location,
            "geometry": geometry,
            "phone"   : phone,
            "website" : websiteURL,
            "image"   : imageURL,
            "rating"  : rating
        };

        // Place a marker on the map
        displayMarker(placeData, event.type);

        // Display to HTML
        var output = `<tr>
                            <td>${placeData.name}</td>
                            <td>${placeData.location.address}</td>
                            <td>${placeData.phone}</td>
                            <td><a href="${placeData.website}" target="_blank">Webpage</a></td>
                            <td><a href="${placeData.image}" target="_blank">Image</a></td>
                            <td>${placeData.rating}</td>
                        </tr>`;
        
        $(`#${event.name} thead`).append(output);

    } else {
        // Use this message to determine delayBetweenAPICalls
        console.error(`${event.type}, ${event.name}: Data read failed.`);

    }
}



/****************************************************************************
 ****************************************************************************
    
    Display map
    
*****************************************************************************
*****************************************************************************/
function displayMarker(placeData, eventType) {
    var marker = new google.maps.Marker({
        "map"     : map,
        "position": placeData.geometry,
        "icon"    : markerIcons[eventType]
    });

    google.maps.event.addListener(marker, "click", function() {
        var output = `<div><strong>${placeData.name}</strong><br>${placeData.location.address}</div>`;

        infowindow.setContent(output);
        infowindow.open(map, this);
    });
}