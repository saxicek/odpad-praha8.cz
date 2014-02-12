require.config({
  baseUrl: '../js/',
  paths: {
    'async': 'lib/require/async',
    'mocha': '//cdnjs.cloudflare.com/ajax/libs/mocha/1.13.0/mocha.min',
    'chai': '/test/lib/chai-1.9.0/chai'
  },
  shim: {
    'mocha': {
      exports: 'mocha'
    }
  },
  urlArgs: 'bust=' + (new Date()).getTime()
});

require(['require', 'chai', 'mocha'], function(require, chai, mocha){

  // Chai
  var should = chai.should();

  /*globals mocha */
  mocha.setup('bdd');

  require([
    'js/specs/geo-util-test.js'
  ], function() {
    mocha.run();
  });

});
