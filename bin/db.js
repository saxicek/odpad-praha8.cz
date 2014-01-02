var config      = require('config'),
    pg          = require('pg-query')

var pg_config   = config.pg_config,
    schema_name = config.schema_name;
pg.connectionParameters = pg_config + '/' + schema_name;

var error_response = "Schema already exists - bypassing db initialization step\n";

function create_db_schema(err, rows, result) {
  if(err && err.code == "ECONNREFUSED"){
    return console.error("DB connection unavailable, see README notes for setup assistance\n", err);
  }
  // drop tables first
  // errors in this part are ignored - tables may and may not be present so DROP can fail
  console.info('Dropping table ODPAD');
  pg('DROP TABLE odpad;', function(err, rows, result){
    console.info('Dropping table KNOWN_PLACES');
    pg('DROP TABLE known_places;', create_odpad_table);
  });
}

function create_odpad_table(err, rows, result) {
  var table_name = 'odpad';
  var query = "CREATE TABLE "+table_name+" ( " +
    "gid serial NOT NULL," +
    "place_name character varying(240), " +
    "time_from TIMESTAMP NOT NULL, " +
    "time_to TIMESTAMP NOT NULL, " +
    "the_geom geometry, " +
    "CONSTRAINT "+table_name+ "_pkey PRIMARY KEY (gid), " +
    "CONSTRAINT "+table_name+"_enforce_dims_geom CHECK (st_ndims(the_geom) = 2), " +
    "CONSTRAINT "+table_name+"_enforce_geotype_geom CHECK (geometrytype(the_geom) = 'POINT'::text OR the_geom IS NULL), " +
    "CONSTRAINT "+table_name+"_enforce_srid_geom CHECK (st_srid(the_geom) = 4326), " +
    "UNIQUE (place_name, time_from, time_to)" +
    ") WITH ( OIDS=FALSE );";
  console.info('Creating table '+table_name);
  pg(query, add_spatial_index);
}

function add_spatial_index(err, rows, result) {
  if(err) {
    return console.error(error_response, err);
  }
  var table_name = 'odpad';
  console.info('Creating spatial index on table ODPAD');
  pg("CREATE INDEX "+table_name+"_geom_gist ON "+table_name+" USING gist (the_geom);", add_known_places);
}

function add_known_places(err, rows, result) {
  if(err) {
    return console.error(error_response, err);
  }
  var table_name = 'known_places';
  var query = "CREATE TABLE "+table_name+" ( " +
    "place_name character varying(240), " +
    "the_geom geometry, " +
    "CONSTRAINT "+table_name+"_pkey PRIMARY KEY (place_name), " +
    "CONSTRAINT "+table_name+"_enforce_dims_geom CHECK (st_ndims(the_geom) = 2), " +
    "CONSTRAINT "+table_name+"_enforce_geotype_geom CHECK (geometrytype(the_geom) = 'POINT'::text OR the_geom IS NULL), " +
    "CONSTRAINT "+table_name+"_enforce_srid_geom CHECK (st_srid(the_geom) = 4326) " +
    ") WITH ( OIDS=FALSE );";
  console.info('Creating table '+table_name);
  pg(query, function(err, rows, result) {
    if(err) {
      return console.error(error_response, err);
    }
    return 'Database initialized!';
  });
}

function import_containers(containers) {
  console.info('Importing containers to DB')
  var stmt = 'INSERT INTO odpad (place_name, time_from, time_to) VALUES ($1::text, $2::timestamp, $3::timestamp);';
  for (var i = 0; i < containers.length; i++) {
    pg(stmt, containers[i], function(err, rows, result) {
      if(err) {
        return console.error('Cannot insert container to DB!', err);
      }
    });
  }
  // update geo location to containers
  console.info('Updating location of containers')
  stmt = 'UPDATE odpad o SET o.the_geom = (SELECT the_geom FROM known_places p WHERE p.place_name = o.place_name);';
  pg (stmt, function(err, rows, result) {
    if (err) {
      return console.error('Cannot update container locations!', err);
    }

    // update list of places
    console.info('Updating list of places')
    stmt = 'INSERT INTO known_places (place_name) SELECT DISTINCT o.place_name AS place_name FROM odpad o WHERE o.the_geom IS NULL AND NOT EXISTS (SELECT kp.place_name FROM known_places kp WHERE kp.place_name = o.place_name);';
    pg (stmt, function(err, rows, result) {
      if (err) {
        return console.error('Cannot update list of places!', err);
      }
    });
  });
}

function init_db(){
  pg('CREATE EXTENSION postgis;', create_db_schema);
} 

function select_all(req, res, next){
  console.log('Selecting all containers');
  pg('SELECT gid, place_name, ST_X(the_geom) AS lon, ST_Y(the_geom) AS lat FROM odpad WHERE time_to > NOW() AND the_geom IS NOT NULL;', function(err, rows, result) {
    console.log(config);
    if(err) {
      res.json(500, {http_status:500,error_msg: err})
      return console.error('error running query', err);
    }
    res.json(rows);
    return next();
  });
}

function unknown_places(req, res, next){
  console.log('Selecting known places');
  pg('SELECT place_name FROM known_places WHERE the_geom IS NULL;', function(err, rows, result) {
    console.log(config);
    if(err) {
      res.json(500, {http_status:500,error_msg: err})
      return console.error('error running query', err);
    }
    res.json(rows);
    return next();
  });
}

function add_place(place_name, lat, lng, callback) {
  console.info('Adding place to DB');
  var stmt = "INSERT INTO known_places (place_name, the_geom) VALUES ($1::text, ST_GeomFromText('POINT($2::text, $3::text)', 4326));";
  pg(stmt, [place_name, lat, lng], function(err, rows, result) {
    if(err) {
      console.error('Cannot add place to DB!', err);
      callback(err);
      return;
    }
    // update location of related containers
    console.info('Updating related containers')
    stmt = 'UPDATE odpad SET the_geom = (SELECT the_geom FROM known_places WHERE place_name = $1::text) WHERE place_name = $2::text;';
    pg(stmt, [place_name, place_name], function(err, rows, result) {
      if (err) {
        console.error('Cannot update location of related containers!', err);
        callback(err);
      }
      callback();
    });
  });
}

module.exports = exports = {
  selectAll:         select_all,
  initDB:            init_db,
  importContainers:  import_containers,
  unknownPlaces:     unknown_places,
  addPlace:          add_place
};
