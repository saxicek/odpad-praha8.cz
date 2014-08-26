var table_name = 'container';

exports.up = function(db, callback) {
  db.runSql("ALTER TABLE "+table_name+" ADD CONSTRAINT "+table_name+"_unq_key UNIQUE (place_id, time_from, time_to, container_type);", callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE "+table_name+" DROP CONSTRAINT "+table_name+"_unq_key;", callback);
};
