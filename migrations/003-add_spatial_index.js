var pg = require('../bin/db.js').pg;
var table_name = 'place';

exports.up = function(next){
  pg("CREATE INDEX "+table_name+"_geom_gist ON "+table_name+" USING gist (the_geom);", next);
};

exports.down = function(next){
  pg("DROP INDEX "+table_name+"_geom_gist;", next);
};
