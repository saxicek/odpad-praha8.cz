define([
  'gmaps',
  'config',
  'leaflet',
  'leaflet-pip',
  'app-state'
], function (gmaps, config, L, leafletPip, appState) {

  "use strict";

  var

    geocoder = new gmaps.Geocoder(),

    // simplifies place name for geocoder to get better results
    locationAddress = function(place_name) {
      return place_name
        .split('x ', 1)[0]
        .split('(', 1)[0]
        .trim() + ', Praha 8';
    },

    // geocodes location
    // place_name - string specifying location
    // cb - callback function which is called when location is determined;
    //      called with one parameter - array [lat, lng]
    geoLocate = function(place_name, cb) {
      geocoder.geocode({'address': locationAddress(place_name)}, function(data, status) {
        if (status == gmaps.GeocoderStatus.OK && data[0].geometry.location_type != gmaps.GeocoderLocationType.APPROXIMATE) {
          cb([data[0].geometry.location.lat(), data[0].geometry.location.lng()]);
        } else {
          // use map center
          cb(config.mapCenter);
        }
      });
    },

    // validates location - should be in related district;
    // if district is not defined then in Prague by default
    isValidLocation = function(latLng, place) {
      // by default check that marker is positioned in Prague
      var
        district,
        isValid = latLng.lat < config.borders.maxLat &&
                  latLng.lat > config.borders.minLat &&
                  latLng.lng < config.borders.maxLng &&
                  latLng.lng > config.borders.minLng
        ;

      if (place.get('district_id')) {
        district = appState.districts.get(place.get('district_id'));
        if (district) {
          // district model already in the collection
          if (district.has('geometry')) {
            // pointInLayer returns array of matched layers; empty array if nothing was matched
            isValid = (leafletPip.pointInLayer(latLng, L.geoJson(district.get('geometry')), true).length > 0);
          }
        } else {
          // if district is not yet fetched, add it to district collection and
          // return default value - there is also server side validation which
          // can catch misplaced places
          appState.districts.add([{id: place.get('district_id')}]);
          appState.districts.get(place.get('district_id')).fetch();
        }
      }

      return isValid;

    }
    ;

  return {
    geoLocate: geoLocate,
    locationAddress: locationAddress,
    isValidLocation: isValidLocation
  };

});

