var table_name = 'district';

exports.up = function(db, callback) {
  db.runSql("CREATE INDEX "+table_name+"_geom_gist ON "+table_name+" USING gist (the_geom);", callback);
};

exports.down = function(db, callback) {
  db.runSql("DROP INDEX "+table_name+"_geom_gist;", callback);
};
