var App = {
  Models:{},
  Collections:{},
  Views:{},
  Config: {},
  TileLayers: {}
};

// Basemap Layers
App.TileLayers.mapQuestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1", "otile2", "otile3", "otile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});
// Google Maps Layer
App.TileLayers.googleRoad = new L.Google('ROADMAP');
// Nokia Maps Layers
App.TileLayers.nokiaNormalDay = L.tileLayer('http://{s}.maptile.lbs.ovi.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?token={devID}&app_id={appID}', {
  attribution: 'Map &copy; <a href="http://developer.here.com">Nokia</a>, Data &copy; NAVTEQ 2014',
  subdomains: '1234',
  devID: 'Jh1fw3YBiKJpi3z63De9mg',
  appID: 'y03pI8hp5RCNmh0kc7Rl'
});
App.TileLayers.nokiaSatelliteLabelsDay = L.tileLayer('http://{s}.maptile.lbs.ovi.com/maptiler/v2/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?token={devID}&app_id={appID}', {
  attribution: 'Map &copy; <a href="http://developer.here.com">Nokia</a>, Data &copy; NAVTEQ 2014',
  subdomains: '1234',
  devID: 'Jh1fw3YBiKJpi3z63De9mg',
  appID: 'y03pI8hp5RCNmh0kc7Rl'
});

App.Models.Place = Backbone.Model.extend({
  hasLocation: function() {
    return this.has('lat') && this.has('lng');
  }
});

App.Collections.Places = Backbone.Collection.extend({
  model: App.Models.Place,
  url: '/place'
});

App.Collections.Containers = Backbone.Collection.extend({
  url: '/container'
});

// view shows marker on the map and asks user to place it to correct location
App.Views.GeoLocatePlace = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'setGeocodedPlace', 'placeMarker',
      'afterMarkerDrag', 'updateMarkerBindings', 'unknownPlaced',
      'unknownNotPlaced');
  },
  render: function() {
    if (!this.model.hasLocation()) {
      // try to geocode the location
      App.geocoder.geocode({'address': this.model.get('place_name') + ', Praha 8'}, this.setGeocodedPlace);
    } else {
      this.placeMarker([this.model.get('lat'), this.model.get('lng')]);
    }

    //clear the current pins
    App.vent.trigger('geoLocatePlace:placementStarted');

    return this;
  },
  setGeocodedPlace: function(data, status) {
    var markerPos = App.Config.mapCenter;
    if (status == google.maps.GeocoderStatus.OK && data[0].geometry.location_type != google.maps.GeocoderLocationType.APPROXIMATE) {
      markerPos = [data[0].geometry.location.mb, data[0].geometry.location.nb];
    }
    this.placeMarker(markerPos);
  },
  placeMarker: function(markerPos) {
    // add pin and show info message
    this.marker = L.marker(markerPos, {draggable: true})
      .bindPopup('<p>Umístěte mne na místo ' + this.model.get('place_name') + '</p></div><button id="setPlaceOkButton" type="button" class="btn btn-primary btn-sm btn-block"">Hotovo</button><button id="setPlaceCancelButton" type="button" class="btn btn-link btn-sm btn-block"">Zrušit</button>', {closeButton: false})
      .on('dragend', this.afterMarkerDrag)
      .on('popupopen', this.updateMarkerBindings)
      .addTo(App.map)
      .openPopup();
    this.afterMarkerDrag();
  },
  // function opens marker popup and binds click actions on buttons
  afterMarkerDrag: function() {
    this.marker.openPopup();
  },
  updateMarkerBindings: function() {
    $('#setPlaceOkButton').click(this.unknownPlaced);
    $('#setPlaceCancelButton').click(this.unknownNotPlaced);
  },
  // function is called whenever user confirms placement of unknown place
  unknownPlaced: function(e) {
    this.model.save({
      lat: this.marker.getLatLng().lat,
      lng: this.marker.getLatLng().lng
    }, {wait: true});
    App.map.removeLayer(this.marker);
    App.vent.trigger('geoLocatePlace:placementFinished');

    return e.preventDefault();
  },
  // function is called whenever user cancels placement of unknown place
  unknownNotPlaced: function(e) {
    App.map.removeLayer(this.marker);
    App.vent.trigger('geoLocatePlace:placementCanceled');

    return e.preventDefault();
  }
});

// view shows marker to localize unknown place and submits it to server
App.Views.UnknownPlaces = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'setPlace', 'enableMenu', 'disableMenu', 'updateFilter');

    this.filteredModel = new App.Collections.Places();
    this.filteredModel.on('reset', this.render);
    this.model.on({
      reset: this.updateFilter,
      change: this.updateFilter
    });
    App.vent.on('geoLocatePlace:placementStarted', this.disableMenu);
    App.vent.on('geoLocatePlace:placementFinished', this.enableMenu);
    App.vent.on('geoLocatePlace:placementCanceled', this.enableMenu);
  },
  render: function() {
    if (this.filteredModel.size() > 0) {
      this.menuItem = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">' +
        '<i class="fa fa-exclamation"></i>&nbsp;&nbsp;Neznámá místa&nbsp;' +
        '<span class="badge">'+this.filteredModel.size()+'</span>&nbsp;<b class="caret"></b></a>');
      // create items of dropdown menu
      var dropdown = $('<ul class="dropdown-menu"></ul>');

      var that = this;
      this.filteredModel.each(function(i) {
        var item = $('<li><a href="#">' + i.get('place_name') + '</a></li>');
        item.click(that.setPlace);
        dropdown.append(item);
      });
      this.$el.empty().append(this.menuItem).append(dropdown);
    } else {
      this.$el.empty();
    }
  },
  setPlace: function(evt) {
    // find related model
    var model = this.model.findWhere({place_name: $(evt.target).text()});
    // show the localization marker on the map
    var view = new App.Views.GeoLocatePlace({model: model}).render();

    return evt.preventDefault();
  },
  enableMenu: function() {
    this.menuItem.removeClass('disabled');
  },
  disableMenu: function() {
    this.menuItem.addClass('disabled');
  },
  updateFilter: function(model)  {
    this.filteredModel.reset(this.model.filter(function(m) {
      return !m.hasLocation();
    }));
  }
});

// view shows containers on the map
App.Views.Containers = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'removeMarkers', 'updateFilter', 'updateMarkerBindings', 'movePlace');

    this.filteredModel = new App.Collections.Containers();
    this.filteredModel.on('reset', this.render);
    this.model.on({
      reset: this.updateFilter,
      request: this.showLoading
    });
    App.vent.on('geoLocatePlace:placementStarted', this.removeMarkers);
    App.vent.on('geoLocatePlace:placementCanceled', this.render);
    App.filterDate.on('change', this.updateFilter);
    App.places.on('change', this.updateFilter);

    this.markerLayerGroup = null;
  },
  render: function() {
    $("#loading").hide();

    this.removeMarkers();

    //add the new pins
    var updateMarkerBindings = this.updateMarkerBindings;
    var markerArray = this.filteredModel.map(function(m) {
      var place = App.places.get(m.get('place_id'));
      return L.marker({lat: place.get('lat'), lng: place.get('lng')})
        .bindPopup('<span>' + place.get('place_name') + '</span><br />' +
            '<span>' + moment(m.get('time_from')).format('H:mm') + ' - ' + moment(m.get('time_to')).format('H:mm') + '</span><br />' +
            '<a class="btn btn-link btn-xs" href="#" id="movePlaceButton">upravit</a> ', {closeButton: false})
        .on('popupopen', updateMarkerBindings);
    });
    this.markerLayerGroup = L.layerGroup(markerArray).addTo(App.map);

    return this;
  },
  showLoading: function() {
    $('#loading').show();
  },
  removeMarkers: function() {
    if (this.markerLayerGroup) {
      //clear the current pins
      App.map.removeLayer(this.markerLayerGroup);
      this.markerLayerGroup = null;
    }
  },
  // updates collection of shown models by filtering date and location
  updateFilter: function() {
    this.filteredModel.reset(this.model.filter(function(m) {
      // return containers for current day
      return moment(m.get('time_from')).isSame(App.filterDate.get('filter_date'), 'day') &&
        // which are not yet removed
        moment().isBefore(m.get('time_to')) &&
        // and with location specified
        App.places.get(m.get('place_id')).hasLocation();
    }));
  },
  updateMarkerBindings: function() {
    $('#movePlaceButton').click(this.movePlace);
  },
  movePlace: function(evt) {
    // find related model
    var model = App.places.findWhere({place_name: $(evt.target).siblings().first().text()});
    // show the localization marker on the map
    var view = new App.Views.GeoLocatePlace({model: model}).render();

    return evt.preventDefault();
  }
});

// view controls filtering of containers by day
App.Views.ContainerFilter = Backbone.View.extend({
  initialize: function() {
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
    App.vent.on('geoLocatePlace:placementStarted', this.disableFilter);
    App.vent.on('geoLocatePlace:placementCanceled', this.enableFilter);
    App.vent.on('geoLocatePlace:placementFinished', this.enableFilter);

    // customize moment.js to show days only (not time) in calendar()
    moment.lang('cs', {
      'calendar': {
        sameDay: "[dnes]",
        nextDay: '[zítra]',
        nextWeek: function () {
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
        lastDay: '[včera]',
        lastWeek: function () {
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
        sameElse: "L"
      }
    });
  },
  render: function() {
    this.$('.navbar-text').text(this.model.get('filter_date').calendar());
    return this;
  },
  setPrev: function(e) {
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
    }

    return e.preventDefault();
  },
  setNext: function(e) {
    if (!this.disabled) {
      if (moment().isSame(this.model.get('filter_date'), 'day')) {
        // if filter day is today enable back button
        this.$('.container-filter-prev').removeClass('disabled');
      }
      this.model.set('filter_date', moment(this.model.get('filter_date')).add('days', 1));
    }

    return e.preventDefault();
  },
  // function enables filter buttons
  enableFilter: function() {
    this.disabled = false;
    // check if Prev button can be enabled
    if (moment().isBefore(this.model.get('filter_date'), 'day')) {
      this.$('.container-filter-prev').removeClass('disabled');
    }
    // enable Next button
    this.$('.container-filter-next').removeClass('disabled');
  },
  // function disables filter buttons
  disableFilter: function() {
    this.disabled = true;
    this.$('.container-filter-prev').addClass('disabled');
    this.$('.container-filter-next').addClass('disabled');
  }
});

App.loadData = function() {
  // init places view
  var unknownPlacesView = new App.Views.UnknownPlaces({el: $('li.container-unknown-places'), model: App.places});
  // init containers view
  var containersView = new App.Views.Containers({model: App.containers});
  // load data to collections
  App.places.fetch({reset: true, success: function() {
    // load containers only after places are loaded
    App.containers.fetch({reset: true});
  }});

};

App.init = function() {
  // set map center
  App.Config.mapCenter = [50.11, 14.47];

  // get Google geocoder
  App.geocoder = new google.maps.Geocoder();

  // instantiate global event handler
  App.vent = _.extend({}, Backbone.Events);

  // create map
  App.map = L.map("map", {
    zoom: 13,
    center: App.Config.mapCenter,
    layers: [App.TileLayers.mapQuestOSM]
  });

  // Larger screens get scale control and expanded layer control
  var isCollapsed = true;
  if (document.body.clientWidth > 767) {
    isCollapsed = false;
    App.map.addControl(L.control.scale());
  }

  var baseLayers = {
    "Google": App.TileLayers.googleRoad,
    "MapQuest OSM": App.TileLayers.mapQuestOSM,
    "Nokia": App.TileLayers.nokiaNormalDay,
    "Nokia satelitní": App.TileLayers.nokiaSatelliteLabelsDay
  };

  L.control.layers(baseLayers, null, {
    collapsed: isCollapsed
  }).addTo(App.map);

  // create view for day filtering
  App.filterDate = new Backbone.Model();
  App.filterDate.set('filter_date', moment(0, 'HH'));
  var view = new App.Views.ContainerFilter({el: $('ul.container-filter'), model: App.filterDate}).render();

  // define application data collections
  App.places = new App.Collections.Places();
  App.containers = new App.Collections.Containers();

  App.map.whenReady(App.loadData);
};

$(document).ready(App.init);

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
