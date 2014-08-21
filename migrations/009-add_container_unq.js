var pg = require('../bin/db.js').pg;
var table_name = 'container';

exports.up = function(next){
  pg("ALTER TABLE "+table_name+" ADD CONSTRAINT "+table_name+"_unq_key UNIQUE (place_id, time_from, time_to, container_type);", next);
};

exports.down = function(next){
  pg("ALTER TABLE "+table_name+" DROP CONSTRAINT "+table_name+"_unq_key;", next);
};
