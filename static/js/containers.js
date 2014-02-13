require.config({
  paths: {
    'async': 'lib/require/async',
    'jquery': '//code.jquery.com/jquery-1.10.2.min',
    'leaflet': '//cdn.leafletjs.com/leaflet-0.7.2/leaflet',
    'underscore': '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.2/underscore-min',
    'backbone': '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.0/backbone-min',
    'moment': '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.5.0/moment.min',
    'moment-lang-cs': '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.5.0/lang/cs',
    'moment-timezone': '//cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.0.3/moment-timezone',
    'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min'
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
    'backbone': {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    }
  },
  urlArgs: "bust=" + (new Date()).getTime()
});

require([
  'jquery',
  'view',
  'map',
  'app-state',
  'config',
  'google-analytics-amd',
  'bootstrap'],
  function($, view, map, appState, config, ga) {
  var

    loadData = function() {
      // init places view
      var unknownPlacesView = new view.UnknownPlaces({el: $('li.container-unknown-places'), model: appState.places});
      // init containers view
      var containersView = new view.Containers({model: appState.containers});
      // load data to collections
      appState.places.fetch({reset: true, success: function() {
        // load containers only after places are loaded
        appState.containers.fetch({reset: true});
      }});

    },

    init = function() {
      // Immediately add a pageview event to the queue.
      ga('create', 'UA-48042648-1', 'odpad-praha8.rhcloud.com');
      ga('send', 'pageview');

      // create view for day filtering
      var v = new view.ContainerFilter({el: $('ul.container-filter'), model: appState.filterDate}).render();

      map.whenReady(loadData);

      // append version info
      $('#version').append('Verze: ' + config.version);

      // add listener on show help
      $('#aboutModal').on('show.bs.modal', function() {
        // track it in Google Analytics
        ga('send', 'event', 'about', 'open');
      });
    }
  ;

  init();

});

// Placeholder hack for IE
if (navigator.appName == "Microsoft Internet Explorer") {
  $("input").each( function () {
    if ($(this).val() == "" && $(this).attr("placeholder") != "") {
      $(this).val($(this).attr("placeholder"));
      $(this).focus(function () {
        if ($(this).val() == $(this).attr("placeholder")) $(this).val("");
      });
      $(this).blur(function () {
        if ($(this).val() == "") $(this).val($(this).attr("placeholder"));
      });
    }
  });
}
