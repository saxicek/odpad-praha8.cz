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
  urlRoot: '/place'
});

App.Collections.UnknownPlaces = Backbone.Collection.extend({
  model: App.Models.Place,
  url: '/place/unknown'
});

App.Collections.Containers = Backbone.Collection.extend({
  url: '/container'
});

// view shows marker to localize unknown place and submits it to server
App.Views.UnknownPlaces = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'setPlace', 'setGeocodedPlace',
      'afterMarkerDrag', 'placementFinished', 'unknownPlaced',
      'unknownNotPlaced', 'removeLocatedPlace', 'updateMarkerBindings');

    this.model.on('remove', this.render);
    this.model.on('reset', this.render);

    this.unknownPlaceModel = null;
  },
  render: function() {
    if (this.model.size() > 0) {
      this.menuItem = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-exclamation"></i>&nbsp;&nbsp;Neznámá místa&nbsp;<span class="badge">'+this.model.size()+'</span>&nbsp;<b class="caret"></b></a>');
      // create items of dropdown menu
      var dropdown = $('<ul class="dropdown-menu"></ul>');

      var that = this;
      this.model.each(function(i) {
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
    //clear the current pins
    App.vent.trigger('unknownPlaces:placing');
    //disable menu
    this.menuItem.addClass('disabled');
    // find related model
    this.unknownPlaceModel = this.model.findWhere({place_name: $(evt.target).text()});
    // try to geocode the location
    App.geocoder.geocode({'address': this.unknownPlaceModel.get('place_name') + ', Praha'}, this.setGeocodedPlace);
  },
  setGeocodedPlace: function(data, status) {
    var markerPos = App.Config.mapCenter;
    if (status == google.maps.GeocoderStatus.OK && data[0].geometry.location_type != google.maps.GeocoderLocationType.APPROXIMATE) {
      markerPos = [data[0].geometry.location.mb, data[0].geometry.location.nb];
    }
    // add pin and show info message
    this.unknownPlaceMarker = L.marker(markerPos, {draggable: true})
      .bindPopup('<p>Umístěte mne na místo ' + this.unknownPlaceModel.get('place_name') + '</p></div><button id="setPlaceOkButton" type="button" class="btn btn-primary btn-sm btn-block"">Hotovo</button><button id="setPlaceCancelButton" type="button" class="btn btn-link btn-sm btn-block"">Zrušit</button>', {closeButton: false})
      .on('dragend', this.afterMarkerDrag)
      .on('popupopen', this.updateMarkerBindings)
      .addTo(App.map)
      .openPopup();
    this.afterMarkerDrag();
  },
  // function opens marker popup and binds click actions on buttons
  afterMarkerDrag: function() {
    this.unknownPlaceMarker.openPopup();
  },
  updateMarkerBindings: function() {
    $('#setPlaceOkButton').click(this.unknownPlaced);
    $('#setPlaceCancelButton').click(this.unknownNotPlaced);
  },
  // function performs cleanup after placement of unknown place - removes marker and enables menu item
  placementFinished: function() {
    App.map.removeLayer(this.unknownPlaceMarker);
    this.menuItem.removeClass('disabled');
    App.vent.trigger('unknownPlaces:placingFinished');
  },
  // function is called whenever user confirms placement of unknown place
  unknownPlaced: function() {
    this.unknownPlaceModel.set('lat', this.unknownPlaceMarker.getLatLng().lat);
    this.unknownPlaceModel.set('lng', this.unknownPlaceMarker.getLatLng().lng);
    this.unknownPlaceModel.on('sync', this.removeLocatedPlace);
    this.unknownPlaceModel.save();
    this.placementFinished();
  },
  // function is called whenever user cancels placement of unknown place
  unknownNotPlaced: function() {
    this.placementFinished();
  },
  // called after place has been located and successfully synced to the server
  // removes model from the list of unknown places
  removeLocatedPlace: function(model) {
    if (model === this.unknownPlaceModel) {
      this.unknownPlaceModel = null;
    }
    // remove model from collection of unknown places
    this.model.remove(model);
    // inform those interested
    App.vent.trigger('unknownPlaces:placed');
  }
});

// view shows containers on the map
App.Views.Containers = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'removeMarkers', 'update', 'filterByDate');

    this.filteredModel = new App.Collections.Containers();
    this.filteredModel.on('reset', this.render);
    this.model.on('reset', this.filterByDate);
    this.model.on('request', this.showLoading);
    App.vent.on('unknownPlaces:placing', this.removeMarkers);
    App.vent.on('unknownPlaces:placingFinished', this.render);
    App.vent.on('unknownPlaces:placed', this.update);
    App.filterDate.on('change', this.filterByDate);

    this.markerLayerGroup = null;
  },
  render: function() {
    $("#loading").hide();

    this.removeMarkers();

    //add the new pins
    var markerArray = this.filteredModel.map(function(m) {
      return L.marker([m.get('lon'), m.get('lat')])
        .bindPopup(m.get('place_name') + '<br />' + moment(m.get('time_from')).format('H:mm') + ' - ' + moment(m.get('time_to')).format('H:mm'), {closeButton: false});
    });
    this.markerLayerGroup = L.layerGroup(markerArray).addTo(App.map);
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
  // fetch complete list of containers from server
  update: function() {
    this.model.fetch({reset: true});
  },
  // updates collection of shown models by filtering date
  filterByDate: function(filterDate) {
    this.filteredModel.reset(this.model.filter(function(m) {
      var
        model = m.get('time_from'),
        filter = filterDate.get('filter_date');
      return moment(m.get('time_from')).isSame(filterDate.get('filter_date'), 'day');
    }));
  }
});

// view controls filtering of containers by day
App.Views.ContainerFilter = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'goBack', 'goForward');

    this.model.on('change', this.render);

    // create menu items and register callbacks
    $('<li class="disabled"><a href="#"><span class="glyphicon glyphicon-chevron-left"></span></a></li>')
      .click(this.goBack)
      .appendTo(this.$el);
    this.$el.append('<li><p class="navbar-text"></p></li>');
    $('<li><a href="#"><span class="glyphicon glyphicon-chevron-right"></span></a></li>')
      .click(this.goForward)
      .appendTo(this.$el);

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
  goBack: function(e) {
    if (moment().isSame(this.model.get('filter_date'), 'day')) {
      // if filter day is today do nothing

    } else if (moment().add('days', 1).isSame(this.model.get('filter_date'), 'day')) {
      // if filter day is tomorrow set it to today and disable link
      this.model.set('filter_date', moment(this.model.get('filter_date')).subtract('days', 1));
      this.$el.children(':first').addClass('disabled');
    } else {
      // subtract one day from filter day
      this.model.set('filter_date', moment(this.model.get('filter_date')).subtract('days', 1));
    }

    e.preventDefault();
  },
  goForward: function(e) {
    if (moment().isSame(this.model.get('filter_date'), 'day')) {
      // if filter day is today enable back button
      this.$el.children(':first').removeClass('disabled');
    }
    this.model.set('filter_date', moment(this.model.get('filter_date')).add('days', 1));

    e.preventDefault();
  }
});

App.loadData = function() {

  // get list of places where geo location is unknown
  var unknownPlaces = new App.Collections.UnknownPlaces();
  var unknownPlacesView = new App.Views.UnknownPlaces({el: $('li.container-unknown-places'), model: unknownPlaces});
  unknownPlaces.fetch({reset: true});

  // get containers with geo location
  var containers = new App.Collections.Containers();
  var containersView = new App.Views.Containers({model: containers});
  containers.fetch({reset: true});
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
