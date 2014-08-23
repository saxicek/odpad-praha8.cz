require.config({
  paths: {
    'async': '../../bower_components/requirejs-plugins/src/async',
    'jquery': '../../bower_components/jquery/dist/jquery',
    'leaflet': '//cdn.leafletjs.com/leaflet-0.7.2/leaflet',
    'Leaflet.awesome-markers': '//cdnjs.cloudflare.com/ajax/libs/Leaflet.awesome-markers/2.0.0/leaflet.awesome-markers.min',
    'underscore': '../../bower_components/underscore/underscore',
    'backbone': '../../bower_components/backbone/backbone',
    'moment': '../../bower_components/moment/moment',
    'moment-locale-cs': '../../bower_components/moment/locale/cs',
    'moment-timezone': '../../bower_components/moment-timezone/moment-timezone',
    'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap',

    'view': 'containers/view',
    'geo-util': 'containers/geo-util',
    'gmaps': 'containers/gmaps',
    'config': 'containers/config',
    'map': 'containers/map',
    'map-layer': 'containers/map-layer',
    'leaflet-google': 'containers/leaflet-google',
    'collection': 'containers/collection',
    'model': 'containers/model',
    'app-state': 'containers/app-state',
    'google-analytics-amd': 'containers/google-analytics-amd',
    'moment-timezone-data': 'containers/moment-timezone-data'
  },
  shim: {
    'leaflet': {
      exports: 'L'
    },
    'bootstrap': {
      deps: ['jquery']
    },
    'underscore': {
      exports: '_'
    },
    'Leaflet.awesome-markers': {
      deps: ['leaflet']
    }
  }
});

require(['containers/main']);
