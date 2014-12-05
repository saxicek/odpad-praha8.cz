exports.up = function(db, callback) {
  db.runSql("ALTER TABLE container ALTER COLUMN time_from DROP NOT NULL;", callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE container ALTER COLUMN time_from SET NOT NULL;", callback);
};
