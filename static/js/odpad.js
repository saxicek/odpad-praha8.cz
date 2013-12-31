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
  center: [50.11, 14.47],
  layers: [googleRoad]
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
  urlRoot: '/place',
  idAttribute: 'place_name'
});

var UnknownPlacesCollection = Backbone.Collection.extend({
  model: PlaceModel,
  url: 'place/unknown'
});

var UnknownPlacesView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render');

    this.model = new UnknownPlacesCollection();
    this.model.fetch({reset: true});
    this.model.on('remove', this.render);
    this.model.on('reset', this.render);
  },
  render: function(evt) {
    if (this.model.size() > 0) {
      var menuItem = $('<a href="#" data-toggle="collapse" data-target=".navbar-collapse.in"><i class="fa fa-exclamation" style="color: white"></i>&nbsp;&nbsp;Neznámá místa&nbsp;<span class="badge">'+this.model.size()+'</span></a>');
      this.$el.empty().append(menuItem);
    } else {
      this.$el.empty();
    }
  }
});

function loadData(e){
  // get containers with geo location
  $.get('container', pinTheMap, 'json');
  // get list of places where geo location is unknown
  var view = new UnknownPlacesView({el: $("li.odpad-unknown-places")});
}

function pinTheMap(data){
  $("#loading").hide();
  //clear the current pins
  map.removeLayer(markerLayerGroup);

  //add the new pins
  var markerArray = new Array(data.length)
  for (var i = 0; i < data.length; i++){
    container = data[i];
    markerArray[i] = L.marker([container.lat, container.lon]).bindPopup(container.name);
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
