define([
  'backbone',
  'moment-timezone',
  'collection'
], function (Backbone, moment, collection) {

  "use strict";

  var
    filterDate = new Backbone.Model({'filter_date': moment(0, 'HH')}),
    places = new collection.Places(),
    containers = new collection.Containers()
  ;

  return {
    filterDate: filterDate,
    places: places,
    containers: containers
  };

});

