define([
  'leaflet',
  'config',
  'leaflet-google'
], function (L, config, LeafGoogle) {

  "use strict";

  var

    // Google Maps Layer
    googleRoad = new LeafGoogle('ROADMAP'),

    // Nokia Maps Layers
    nokiaNormalDay = L.tileLayer('http://{s}.maptile.lbs.ovi.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?token={devID}&app_id={appID}', {
      attribution:'Map &copy; <a href="http://developer.here.com">Nokia</a>, Data &copy; NAVTEQ 2014',
      subdomains:'1234',
      devID:'Jh1fw3YBiKJpi3z63De9mg',
      appID:'y03pI8hp5RCNmh0kc7Rl'
    }),
    nokiaSatelliteLabelsDay = L.tileLayer('http://{s}.maptile.lbs.ovi.com/maptiler/v2/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?token={devID}&app_id={appID}', {
      attribution:'Map &copy; <a href="http://developer.here.com">Nokia</a>, Data &copy; NAVTEQ 2014',
      subdomains:'1234',
      devID:'Jh1fw3YBiKJpi3z63De9mg',
      appID:'y03pI8hp5RCNmh0kc7Rl'
    }),

    baseLayers = {
      "Google": googleRoad,
      "Nokia": nokiaNormalDay,
      "Nokia satelitní": nokiaSatelliteLabelsDay
    },

    control = L.control.layers(baseLayers, null, {
      collapsed: !config.bigScreen
    })

  ;

  return {
    control: control,
    googleRoad: googleRoad,
    nokiaNormalDay: nokiaNormalDay,
    nokiaSatelliteLabelsDay: nokiaSatelliteLabelsDay
  };

});
