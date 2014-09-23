define([
  'leaflet',
  'config',
  'leaflet-google'
], function (L, config, LeafGoogle) {

  "use strict";

  var

    // Map Quest OSM Layers
    mapQuestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
      maxZoom:19,
      subdomains:["otile1", "otile2", "otile3", "otile4"],
      attribution:'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
    }),

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
      "MapQuest OSM": mapQuestOSM,
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
    mapQuestOSM: mapQuestOSM,
    googleRoad: googleRoad,
    nokiaNormalDay: nokiaNormalDay,
    nokiaSatelliteLabelsDay: nokiaSatelliteLabelsDay
  };

});
