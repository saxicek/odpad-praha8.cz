exports.up = function(db, callback) {
    db.runSql("ALTER TABLE place ADD CONSTRAINT place_unq_key UNIQUE (place_name, container_type, district_id);", callback);
};

exports.down = function(db, callback) {
    db.runSql("ALTER TABLE place DROP CONSTRAINT place_unq_key;", callback);
};
