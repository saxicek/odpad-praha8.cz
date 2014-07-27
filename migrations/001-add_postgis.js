var pg = require('../bin/db.js').pg;

exports.up = function(next){
  pg('CREATE EXTENSION postgis;', next);
};

exports.down = function(next){
  pg('DROP EXTENSION postgis;', next);
};
