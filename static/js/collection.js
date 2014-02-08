define([
  'backbone',
  'model'
  ], function (Backbone, model) {

  "use strict";

  var

    Places = Backbone.Collection.extend({
      model: model.Place,
      url: '/place'
    }),

    Containers = Backbone.Collection.extend({
      url: '/container'
    })
  ;

  return {
    Places: Places,
    Containers: Containers
  };

});
