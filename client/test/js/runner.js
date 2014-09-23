require.config({
  paths: {
    'async': '../../../bower_components/requirejs-plugins/src/async',
    'jquery': '../../../bower_components/jquery/dist/jquery',
    'leaflet': '../../../bower_components/leaflet/dist/leaflet-src',
    'leaflet-pip': '../../../bower_components/leaflet-pip/leaflet-pip',
//    'Leaflet.awesome-markers': '../../../bower_components/Leaflet.awesome-markers/dist/leaflet.awesome-markers.min',
    'underscore': '../../../bower_components/underscore/underscore',
    'backbone': '../../../bower_components/backbone/backbone',
    'moment': '../../../bower_components/moment/moment',
    'moment-locale-cs': '../../../bower_components/moment/locale/cs',
    'moment-timezone': '../../../bower_components/moment-timezone/moment-timezone',
//    'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap',
    'mocha': '../../../node_modules/mocha/mocha',
    'chai': '../../../node_modules/chai/chai',

    'geo-util': '../../src/js/containers/geo-util',
    'geo-util-test': 'containers/geo-util-test',

//    'view': '../../src/js/containers/view',
    'gmaps': '../../src/js/containers/gmaps',
    'config': '../../src/js/containers/config',
//    'map': '../../src/js/containers/map',
//    'map-layer': '../../src/js/containers/map-layer',
//    'leaflet-google': '../../src/js/containers/leaflet-google',
    'collection': '../../src/js/containers/collection',
    'model': '../../src/js/containers/model',
    'app-state': '../../src/js/containers/app-state',
//    'google-analytics-amd': '../../src/js/containers/google-analytics-amd',
//    'moment-timezone-data': '../../src/js/containers/moment-timezone-data'

  },
  shim: {
    'mocha': {
      exports: 'mocha'
    }
  }
});

require(['require', 'chai', 'mocha'], function(require, chai, mocha){

  // Chai
  var should = chai.should();

  /*globals mocha */
  mocha.setup('bdd');

  require([
    'geo-util-test'
  ], function() {
    mocha.run();
  });

});
