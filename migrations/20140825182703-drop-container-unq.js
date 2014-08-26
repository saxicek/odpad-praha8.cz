exports.up = function(db, callback) {
  db.runSql("ALTER TABLE container DROP CONSTRAINT container_place_id_time_from_time_to_key;", callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE container ADD CONSTRAINT container_place_id_time_from_time_to_key UNIQUE (place_id, time_from, time_to);", callback);
};
