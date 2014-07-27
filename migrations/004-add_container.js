var pg = require('../bin/db.js').pg;
var table_name = 'container';

exports.up = function(next){
  pg("CREATE TABLE "+table_name+" ( " +
    "id serial NOT NULL," +
    "time_from TIMESTAMP WITH TIME ZONE NOT NULL, " +
    "time_to TIMESTAMP WITH TIME ZONE NOT NULL, " +
    "place_id INTEGER REFERENCES place (id), " +
    "CONSTRAINT "+table_name+ "_pkey PRIMARY KEY (id), " +
    "UNIQUE (place_id, time_from, time_to)" +
    ") WITH ( OIDS=FALSE );", next);
};

exports.down = function(next){
  pg("DROP TABLE "+table_name+";", next);
};
