define([
  'backbone'
  ], function (Backbone) {

  "use strict";

  var

    Place = Backbone.Model.extend({
      hasLocation: function() {
        return this.has('lat') && this.has('lng');
      }
    })
  ;

  return {
    Place: Place
  };

});

