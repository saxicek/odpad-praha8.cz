exports.up = function(db, callback) {
  db.runSql("UPDATE container SET container_type = 'BULK_WASTE';", callback);
};

exports.down = function(db, callback) {
  db.runSql("UPDATE container SET container_type = NULL;", callback);
};
