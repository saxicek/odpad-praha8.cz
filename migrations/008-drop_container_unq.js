var pg = require('../bin/db.js').pg;
var table_name = 'container';

exports.up = function(next){
  pg("ALTER TABLE "+table_name+" DROP CONSTRAINT container_place_id_time_from_time_to_key;", next);
};

exports.down = function(next){
  pg("ALTER TABLE "+table_name+" ADD CONSTRAINT container_place_id_time_from_time_to_key UNIQUE (place_id, time_from, time_to);", next);
};
