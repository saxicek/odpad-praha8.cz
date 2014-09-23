exports.up = function(db, callback) {
  db.runSql("UPDATE place p SET container_type = (SELECT MAX(container_type) FROM container WHERE place_id = p.id);", callback);
};

exports.down = function(db, callback) {
  db.runSql("UPDATE place SET container_type = NULL;", callback);
};
