exports.up = function(db, callback) {
  db.runSql("ALTER TABLE place DROP CONSTRAINT place_place_name_key;", callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE place ADD CONSTRAINT place_place_name_key UNIQUE (place_name);", callback);
};
