var table_name = 'container';

exports.up = function(db, callback) {
  db.runSql("CREATE TABLE "+table_name+" ( " +
    "id serial NOT NULL," +
    "time_from TIMESTAMP WITH TIME ZONE NOT NULL, " +
    "time_to TIMESTAMP WITH TIME ZONE NOT NULL, " +
    "place_id INTEGER REFERENCES place (id), " +
    "CONSTRAINT "+table_name+ "_pkey PRIMARY KEY (id), " +
    "UNIQUE (place_id, time_from, time_to)" +
    ") WITH ( OIDS=FALSE );", callback);
};

exports.down = function(db, callback) {
  db.runSql("DROP TABLE "+table_name+";", callback);
};
