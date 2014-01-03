var mapCenter = [50.11, 14.47];

// Basemap Layers
var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1", "otile2", "otile3", "otile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});
// Google Maps Layer
var googleRoad = new L.Google('ROADMAP');
// Nokia Maps Layers
var nokiaNormalDay = L.tileLayer('http://{s}.maptile.lbs.ovi.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?token={devID}&app_id={appID}', {
  attribution: 'Map &copy; <a href="http://developer.here.com">Nokia</a>, Data &copy; NAVTEQ 2014',
  subdomains: '1234',
  devID: 'Jh1fw3YBiKJpi3z63De9mg',
  appID: 'y03pI8hp5RCNmh0kc7Rl'
});
var nokiaSatelliteYesLabelsDay = L.tileLayer('http://{s}.maptile.lbs.ovi.com/maptiler/v2/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?token={devID}&app_id={appID}', {
  attribution: 'Map &copy; <a href="http://developer.here.com">Nokia</a>, Data &copy; NAVTEQ 2014',
  subdomains: '1234',
  devID: 'Jh1fw3YBiKJpi3z63De9mg',
  appID: 'y03pI8hp5RCNmh0kc7Rl'
});

var map = L.map("map", {
  zoom: 13,
  center: mapCenter,
  layers: [mapquestOSM]
});

var scaleControl = L.control.scale();

// Larger screens get scale control and expanded layer control
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
  map.addControl(scaleControl);
};

var baseLayers = {
  "Google": googleRoad,
  "MapQuest OSM": mapquestOSM,
  "Nokia": nokiaNormalDay,
  "Nokia satelitní": nokiaSatelliteYesLabelsDay
};

var layerControl = L.control.layers(baseLayers, null, {
  collapsed: isCollapsed
}).addTo(map);

var markerLayerGroup = L.layerGroup().addTo(map);

var PlaceModel = Backbone.Model.extend({
  url: '/place',
  idAttribute: 'place_name'
});

var UnknownPlacesCollection = Backbone.Collection.extend({
  model: PlaceModel,
  url: '/place/unknown'
});

var UnknownPlacesView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'setPlace', 'placementFinished', 'unknownPlaced', 'unknownNotPlaced', 'updateMarker');

    this.model = new UnknownPlacesCollection();
    this.model.fetch({reset: true});
    this.model.on('remove', this.render);
    this.model.on('reset', this.render);

    this.unknownPlaceModel = null;
  },
  render: function() {
    if (this.model.size() > 0) {
      menuItem = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-exclamation"></i>&nbsp;&nbsp;Neznámá místa&nbsp;<span class="badge">'+this.model.size()+'</span>&nbsp;<b class="caret"></b></a>');
      // create items of dropdown menu
      var dropdown = $('<ul class="dropdown-menu"></ul>');

      var that = this;
      this.model.each(function(i) {
        var item = $('<li><a href="#">' + i.get('place_name') + '</a></li>');
        item.click(that.setPlace);
        dropdown.append(item);
      });
      this.$el.empty().append(menuItem).append(dropdown);
    } else {
      this.$el.empty();
    }
  },
  setPlace: function(evt) {
    //clear the current pins
    map.removeLayer(markerLayerGroup);
    //disable menu
    menuItem.addClass('disabled');
    // find related model
    this.unknownPlaceModel = this.model.get($(evt.target).text())
    // add pin and show info message
    this.unknownPlaceMarker = L.marker(mapCenter, {draggable: true})
      .bindPopup('<p>Umístěte mne na místo ' + this.unknownPlaceModel.id + '</p></div><button id="setPlaceOkButton" type="button" class="btn btn-primary btn-sm btn-block"">Hotovo</button><button id="setPlaceCancelButton" type="button" class="btn btn-link btn-sm btn-block"">Zrušit</button>', {closeButton: false})
      .on('dragend', this.updateMarker)
      .addTo(map)
      .openPopup();
    this.updateMarker();
  },
  // function opens marker popup and binds click actions on buttons
  updateMarker: function() {
    this.unknownPlaceMarker.openPopup();
    $('#setPlaceOkButton').click(this.unknownPlaced);
    $('#setPlaceCancelButton').click(this.unknownNotPlaced);
  },
  // function performs cleanup after placement of unknown place - removes marker and enables menu item
  placementFinished: function() {
    map.removeLayer(this.unknownPlaceMarker);
    menuItem.removeClass('disabled');
  },
  // function is called whenever user confirms placement of unknown place
  unknownPlaced: function() {
    this.unknownPlaceModel.set('lat', this.unknownPlaceMarker.getLatLng().lat);
    this.unknownPlaceModel.set('lng', this.unknownPlaceMarker.getLatLng().lng);
    this.unknownPlaceModel.save();
    this.placementFinished();
  },
  // function is called whenever user cancels placement of unknown place
  unknownNotPlaced: function() {
    this.placementFinished();
  }
});

function loadData(e){
  // get containers with geo location
  $.get('container', pinTheMap, 'json');
  // get list of places where geo location is unknown
  var view = new UnknownPlacesView({el: $("li.container-unknown-places")});
}

function pinTheMap(data){
  $("#loading").hide();
  //clear the current pins
  map.removeLayer(markerLayerGroup);

  //add the new pins
  var markerArray = new Array(data.length)
  for (var i = 0; i < data.length; i++){
    container = data[i];
    markerArray[i] = L.marker([container.lat, container.lon]).bindPopup(container.place_name + ' ' + container.time_to);
  }

  markerLayerGroup = L.layerGroup(markerArray).addTo(map);
}

map.whenReady(loadData);

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
