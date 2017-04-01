define([
  'leaflet',
  'config',
  'leaflet-google',
  'map-layer'
  ], function (L, config, LeafGoogle, mapLayer) {

  "use strict";

  var

    isCollapsed = true,

    map = L.map("map", {
      zoom: 13,
      center: config.mapCenter,
      layers: [mapLayer.googleRoad]
    })
  ;

  // Larger screens get scale control and expanded layer control
  if (config.bigScreen) {
    map.addControl(L.control.scale());
  }

  map.addControl(mapLayer.control);

  // fix marker icon address
  L.Icon.Default.imagePath = 'lib/leaflet/images';

  return map;

});

