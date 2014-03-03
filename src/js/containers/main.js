define([
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
