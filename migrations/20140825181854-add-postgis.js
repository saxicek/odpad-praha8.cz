exports.up = function(db, callback) {
  db.runSql('CREATE EXTENSION postgis;', callback);
};

exports.down = function(db, callback) {
  db.runSql('DROP EXTENSION postgis CASCADE;', callback);
};
