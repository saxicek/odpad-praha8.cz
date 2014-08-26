var table_name = 'place';

exports.up = function(db, callback) {
  db.runSql("CREATE TABLE "+table_name+" ( " +
    "id serial NOT NULL," +
    "place_name character varying(240), " +
    "the_geom geometry, " +
    "CONSTRAINT "+table_name+"_pkey PRIMARY KEY (id), " +
    "CONSTRAINT "+table_name+"_enforce_dims_geom CHECK (st_ndims(the_geom) = 2), " +
    "CONSTRAINT "+table_name+"_enforce_geotype_geom CHECK (geometrytype(the_geom) = 'POINT'::text OR the_geom IS NULL), " +
    "CONSTRAINT "+table_name+"_enforce_srid_geom CHECK (st_srid(the_geom) = 4326), " +
    "UNIQUE (place_name)" +
    ") WITH ( OIDS=FALSE );", callback);
};

exports.down = function(db, callback) {
  db.runSql("DROP TABLE "+table_name+";", callback);
};
