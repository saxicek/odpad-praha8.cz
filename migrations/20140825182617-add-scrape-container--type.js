exports.up = function(db, callback) {
  db.runSql("ALTER TABLE container ADD container_type character varying(50);", callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE container DROP COLUMN container_type;", callback);
};
