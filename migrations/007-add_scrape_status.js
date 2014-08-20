var pg = require('../bin/db.js').pg;
var table_name = 'scrape_status';

exports.up = function(next){
  pg("CREATE TABLE "+table_name+" ( " +
    "id serial NOT NULL," +
    "scraper_name character varying(100), " +
    "status character varying(3), " + // RUN - running, SKP - skipped, SUC - success, ERR - error
    "message character varying(500), " +
    "time_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
    "time_to TIMESTAMP WITH TIME ZONE," +
    "CONSTRAINT "+table_name+"_pkey PRIMARY KEY (id)" +
    ") WITH ( OIDS=FALSE );", next);
};

exports.down = function(next){
  pg("DROP TABLE "+table_name+";", next);
};
