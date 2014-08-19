define([
  'backbone',
  'moment-timezone',
  'collection',
  'moment-locale-cs'
], function (Backbone, moment, collection) {

  "use strict";

  // Use CS locale in Moment.js
  moment.locale('cs');

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

