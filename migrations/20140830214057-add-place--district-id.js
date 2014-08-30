exports.up = function(db, callback) {
  db.runSql("ALTER TABLE place ADD district_id INTEGER REFERENCES district (id);", callback);
};

exports.down = function(db, callback) {
  db.runSql("ALTER TABLE place DROP COLUMN district_id;", callback);
};
