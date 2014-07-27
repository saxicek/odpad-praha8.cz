var pg = require('../bin/db.js').pg;

exports.up = function(next){
  pg("ALTER TABLE container ADD container_type character varying(50);", next);
};

exports.down = function(next){
  pg("ALTER TABLE container DROP COLUMN container_type;", next);
};
