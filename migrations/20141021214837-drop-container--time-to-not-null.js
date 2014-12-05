exports.up = function(db, callback) {
  db.runSql("ALTER TABLE container ALTER COLUMN time_to DROP NOT NULL;", callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE container ALTER COLUMN time_to SET NOT NULL;", callback);
};
