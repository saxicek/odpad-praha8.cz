exports.up = function(db, callback) {
  db.runSql("ALTER TABLE place ADD container_type character varying(50);", callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE place DROP COLUMN container_type;", callback);
};
