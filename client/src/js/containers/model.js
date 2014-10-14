define([
  'backbone'
  ], function (Backbone) {

  "use strict";

  var

    Place = Backbone.Model.extend({
      hasLocation: function() {
        return this.has('lat') && this.has('lng');
      }
    }),

    District = Backbone.Model.extend({
      getCenter: function() {
        var center = this.get('properties').point_on_surface.coordinates;
        return { lat: center[1], lng: center[0] };
      }
    })
  ;

  return {
    Place: Place,
    District: District
  };

});

