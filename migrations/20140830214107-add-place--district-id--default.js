exports.up = function(db, callback) {
  db.runSql("UPDATE place SET district_id = (SELECT id FROM district WHERE district_name = 'Praha 8');", callback);
};

exports.down = function(db, callback) {
  db.runSql("UPDATE place SET district_id = NULL;", callback);
};
