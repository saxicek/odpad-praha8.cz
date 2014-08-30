exports.up = function(db, callback) {
  db.runSql("CREATE TABLE district ( " +
    "id serial NOT NULL," +
    "district_name character varying(240) NOT NULL, " +
    "description character varying(240), " +
    "the_geom geometry(MultiPolygon,4326) NOT NULL, " +
    "CONSTRAINT district_pkey PRIMARY KEY (id), " +
    "CONSTRAINT district_unq_key UNIQUE (district_name)" +
    ") WITH ( OIDS=FALSE );", callback);
};

exports.down = function(db, callback) {
  db.runSql("DROP TABLE district;", callback);
};
