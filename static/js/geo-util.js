define([
  'gmaps',
  'config'
], function (gmaps, config) {

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
    }
    ;

  return {
    geoLocate: geoLocate,
    locationAddress: locationAddress
  };

});

