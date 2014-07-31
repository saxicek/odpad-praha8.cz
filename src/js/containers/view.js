define([
  'jquery',
  'underscore',
  'backbone',
  'geo-util',
  'map',
  'collection',
  'app-state',
  'map-layer',
  'google-analytics-amd',
  'moment-timezone',
  'moment-timezone-data',
  'moment-lang-cs'
], function ($, _, Backbone, geoUtil, map, collection, appState, mapLayer, ga, moment) {

  "use strict";

  var
    // instantiate global event handler
    vent = _.extend({}, Backbone.Events),

    // view shows marker on the map and asks user to place it to correct location
    GeoLocatePlace = Backbone.View.extend({
      initialize:function () {
        _.bindAll(this, 'render', 'addMarker', 'afterMarkerDrag',
          'updateMarkerBindings', 'unknownPlaced', 'unknownNotPlaced',
          'saveLoc');

        //clear pins on the map
        vent.trigger('geoLocatePlace:placementStarted');
      },
      render: function() {
        if (!this.model.hasLocation()) {
          // try to geocode the location
          geoUtil.geoLocate(this.model.get('place_name'), this.addMarker);
        } else {
          this.addMarker([this.model.get('lat'), this.model.get('lng')]);
        }

        return this;
      },
      addMarker: function(loc) {
        // add pin and show info message
        this.marker = L.marker(loc, {draggable:true})
          .bindPopup('<p>Umístěte mne na místo ' + this.model.get('place_name') + '</p></div><button id="setPlaceOkButton" type="button" class="btn btn-primary btn-sm btn-block"">Hotovo</button><button id="setPlaceCancelButton" type="button" class="btn btn-link btn-sm btn-block"">Zrušit</button>', {closeButton:false})
          .on('dragstart', this.saveLoc)
          .on('dragend', this.afterMarkerDrag)
          .on('popupopen', this.updateMarkerBindings)
          .addTo(map)
          .openPopup();
        this.afterMarkerDrag();
      },
      // function opens marker popup and binds click actions on buttons
      afterMarkerDrag:function () {
        // check that marker is placed in Prague 8
        if (!geoUtil.isValidLocation(this.marker.getLatLng().lat, this.marker.getLatLng().lng)) {
          this.marker.setLatLng(this.previousLoc);
        }
        this.marker.openPopup();
      },
      updateMarkerBindings:function () {
        $('#setPlaceOkButton').click(this.unknownPlaced);
        $('#setPlaceCancelButton').click(this.unknownNotPlaced);
      },
      // function is called whenever user confirms placement of unknown place
      unknownPlaced:function (e) {
        this.model.save({
          lat:this.marker.getLatLng().lat,
          lng:this.marker.getLatLng().lng
        }, {wait:true});
        map.removeLayer(this.marker);

        ga('send', 'event', 'place', 'located');

        vent.trigger('geoLocatePlace:placementFinished');

        return e.preventDefault();
      },
      // function is called whenever user cancels placement of unknown place
      unknownNotPlaced:function (e) {
        map.removeLayer(this.marker);

        ga('send', 'event', 'place', 'not_located');

        vent.trigger('geoLocatePlace:placementCanceled');

        return e.preventDefault();
      },
      saveLoc: function() {
        this.previousLoc = this.marker.getLatLng();
      }
    }),

    // view shows marker to localize unknown place and submits it to server
    UnknownPlaces = Backbone.View.extend({
      initialize:function () {
        _.bindAll(this, 'render', 'setPlace', 'enableMenu', 'disableMenu', 'updateFilter');

        this.filteredModel = new collection.Places();
        this.filteredModel.on('reset', this.render);
        this.model.on({
          reset:this.updateFilter,
          change:this.updateFilter
        });
        vent.on('geoLocatePlace:placementStarted', this.disableMenu);
        vent.on('geoLocatePlace:placementFinished', this.enableMenu);
        vent.on('geoLocatePlace:placementCanceled', this.enableMenu);
      },
      render:function () {
        if (this.filteredModel.size() > 0) {
          this.menuItem = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">' +
            '<i class="fa fa-exclamation"></i>&nbsp;&nbsp;Neznámá místa&nbsp;' +
            '<span class="badge">' + this.filteredModel.size() + '</span>&nbsp;<b class="caret"></b></a>');
          // create items of dropdown menu
          var dropdown = $('<ul class="dropdown-menu"></ul>');

          var that = this;
          this.filteredModel.each(function (i) {
            var item = $('<li><a href="#">' + i.get('place_name') + '</a></li>');
            item.click(that.setPlace);
            dropdown.append(item);
          });
          this.$el.empty().append(this.menuItem).append(dropdown);
        } else {
          this.$el.empty();
        }
      },
      setPlace:function (evt) {
        // find related model
        var model = this.model.findWhere({place_name:$(evt.target).text()});
        // show the localization marker on the map
        var view = new GeoLocatePlace({model:model}).render();

        ga('send', 'event', 'unknown_place', 'locate');

        return evt.preventDefault();
      },
      enableMenu:function () {
        if (this.menuItem) {
          this.menuItem.removeClass('disabled');
        }
      },
      disableMenu:function () {
        if (this.menuItem) {
          this.menuItem.addClass('disabled');
        }
      },
      updateFilter:function (model) {
        this.filteredModel.reset(this.model.filter(function (m) {
          return !m.hasLocation();
        }));
      }
    }),

    // view shows containers on the map
    Containers = Backbone.View.extend({
      initialize:function () {
        _.bindAll(this, 'render', 'removeMarkers', 'updateFilter', 'updateMarkerBindings', 'movePlace');

        this.filteredModel = new collection.Containers();
        this.filteredModel.on('reset', this.render);
        this.model.on({
          reset:this.updateFilter,
          request:this.showLoading
        });
        vent.on('geoLocatePlace:placementStarted', this.removeMarkers);
        vent.on('geoLocatePlace:placementCanceled', this.render);
        appState.filterDate.on('change', this.updateFilter);
        appState.places.on('change', this.updateFilter);

        this.markerLayers = {};
      },
      render:function () {
        $("#loading").hide();

        this.removeMarkers();

        //add the new pins
        var updateMarkerBindings = this.updateMarkerBindings;
        var typeMap = {
          "BIO_WASTE": 'Bioodpad',
          "ELECTRO_WASTE": 'Elektroodpad',
          "HAZARDOUS_WASTE": 'Nebezpečný odpad',
          "TEXTILE": 'Textil',
          "BULK_WASTE": 'Velkoobjemový odpad',
          "WASTE_COLLECTION_YARD": 'Sběrný dvůr'
        };
        var markerLayers = this.markerLayers;
        // transform collection to list of layers for each container type;
        // it is the same structure which can be used to initialize new map
        // with overlays - http://leafletjs.com/reference.html#control-layers
        this.filteredModel.each(function(m) {
          var
            label = typeMap[m.get('container_type')] || m.get('container_type'),
            place = appState.places.get(m.get('place_id')),
            marker;
          if (!(label in markerLayers)) {
            // create new layer
            markerLayers[label] = L.layerGroup();
            // and add it to the map and layer control
            map.addLayer(markerLayers[label]);
            mapLayer.control.addOverlay(markerLayers[label], label);
          }
          marker = L.marker({lat:place.get('lat'), lng:place.get('lng')})
            .bindPopup('<div class="text-center containers-edit"><strong>' + place.get('place_name') + '</strong><br />' +
            '<span>' + moment(m.get('time_from')).tz('Europe/Prague').format('H:mm') + ' - ' + moment(m.get('time_to')).tz('Europe/Prague').format('H:mm') + '</span>' +
            '<a class="btn btn-link btn-xs movePlaceButton" href="#"><span class="glyphicon glyphicon-pencil"></span></a></div> ', {closeButton:false})
            .on('popupopen', updateMarkerBindings);
          markerLayers[label].addLayer(marker);
        });

        return this;
      },
      showLoading:function () {
        $('#loading').show();
      },
      removeMarkers:function () {
        _.each(this.markerLayers, function(layer) {
          layer.clearLayers();
        });
      },
      // updates collection of shown models by filtering date and location
      updateFilter:function () {
        this.filteredModel.reset(this.model.filter(function (m) {
          // return containers for current day
          return moment(m.get('time_from')).isSame(appState.filterDate.get('filter_date'), 'day') &&
            // which are not yet removed
            moment().isBefore(m.get('time_to')) &&
            // and with location specified
            appState.places.get(m.get('place_id')).hasLocation();
        }));
      },
      updateMarkerBindings:function () {
        $('.movePlaceButton').click(this.movePlace);
      },
      movePlace:function (evt) {
        // find related model
        var model = appState.places.findWhere({place_name:$(evt.target).parent().siblings().first().text()});
        // show the localization marker on the map
        var view = new GeoLocatePlace({model:model}).render();

        ga('send', 'event', 'place', 'change_location');

        return evt.preventDefault();
      }
    }),

    // view controls filtering of containers by day
    ContainerFilter = Backbone.View.extend({
      initialize:function () {
        _.bindAll(this, 'render', 'setPrev', 'setNext', 'enableFilter', 'disableFilter');

        this.model.on('change', this.render);
        this.disabled = false;

        // create menu items and register callbacks
        $('<li class="disabled inline container-filter-prev"><a href="#"><span class="glyphicon glyphicon-chevron-left"></span></a></li>')
          .click(this.setPrev)
          .appendTo(this.$el);
        this.$el.append('<li class="inline"><p class="navbar-text"></p></li>');
        $('<li class="inline last-inline container-filter-next"><a href="#"><span class="glyphicon glyphicon-chevron-right"></span></a></li>')
          .click(this.setNext)
          .appendTo(this.$el);

        // disable / enable filter on unknown place location
        vent.on('geoLocatePlace:placementStarted', this.disableFilter);
        vent.on('geoLocatePlace:placementCanceled', this.enableFilter);
        vent.on('geoLocatePlace:placementFinished', this.enableFilter);

        // customize moment.js to show days only (not time) in calendar()
        moment.lang('cs', {
          'calendar':{
            sameDay:"[dnes]",
            nextDay:'[zítra]',
            nextWeek:function () {
              switch (this.day()) {
                case 0:
                  return '[v neděli]';
                case 1:
                case 2:
                  return '[v] dddd';
                case 3:
                  return '[ve středu]';
                case 4:
                  return '[ve čtvrtek]';
                case 5:
                  return '[v pátek]';
                case 6:
                  return '[v sobotu]';
              }
            },
            lastDay:'[včera]',
            lastWeek:function () {
              switch (this.day()) {
                case 0:
                  return '[minulou neděli]';
                case 1:
                case 2:
                  return '[minulé] dddd';
                case 3:
                  return '[minulou středu]';
                case 4:
                case 5:
                  return '[minulý] dddd';
                case 6:
                  return '[minulou sobotu]';
              }
            },
            sameElse:"L"
          }
        });
      },
      render:function () {
        this.$('.navbar-text').text(this.model.get('filter_date').calendar());
        return this;
      },
      setPrev:function (e) {
        if (!this.disabled) {
          // update filter day
          if (moment().isBefore(this.model.get('filter_date'), 'day')) {
            // subtract one day from filter day
            this.model.set('filter_date', moment(this.model.get('filter_date')).subtract('days', 1));
          }

          // update button visibility
          if (!moment().isBefore(this.model.get('filter_date'), 'day')) {
            this.$('.container-filter-prev').addClass('disabled');
          }

          ga('send', 'event', 'day', 'previous');

        }

        return e.preventDefault();
      },
      setNext:function (e) {
        if (!this.disabled) {
          if (moment().isSame(this.model.get('filter_date'), 'day')) {
            // if filter day is today enable back button
            this.$('.container-filter-prev').removeClass('disabled');
          }
          this.model.set('filter_date', moment(this.model.get('filter_date')).add('days', 1));

          ga('send', 'event', 'day', 'next');

        }

        return e.preventDefault();
      },
      // function enables filter buttons
      enableFilter:function () {
        this.disabled = false;
        // check if Prev button can be enabled
        if (moment().isBefore(this.model.get('filter_date'), 'day')) {
          this.$('.container-filter-prev').removeClass('disabled');
        }
        // enable Next button
        this.$('.container-filter-next').removeClass('disabled');
      },
      // function disables filter buttons
      disableFilter:function () {
        this.disabled = true;
        this.$('.container-filter-prev').addClass('disabled');
        this.$('.container-filter-next').addClass('disabled');
      }
    })
  ;


  return {
    GeoLocatePlace: GeoLocatePlace,
    UnknownPlaces: UnknownPlaces,
    Containers: Containers,
    ContainerFilter: ContainerFilter
  };

});