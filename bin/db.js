var config      = require('config'),
    pg          = require('pg-query');

var pg_config   = config.pg_config,
    schema_name = config.schema_name;
pg.connectionParameters = pg_config + '/' + schema_name;

var error_response = "Schema already exists - bypassing db initialization step\n";

function create_db_schema(err, rows, result) {
  if(err && err.code == "ECONNREFUSED"){
    console.error("DB connection unavailable, see README notes for setup assistance\n", err);
    return;
  }
  // drop tables first
  // errors in this part are ignored - tables may and may not be present so DROP can fail
  console.info('Dropping table container');
  pg('DROP TABLE container;', function(err, rows, result){
    console.info('Dropping table place');
    pg('DROP TABLE place;', function(err, rows, result) {
      create_container_table(null, null, null);
    });
  });
}

function create_container_table(err, rows, result) {
  if(err) {
    console.error(error_response, err);
    return;
  }
  var table_name = 'container';
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
    console.error(error_response, err);
    return;
  }
  var table_name = 'container';
  console.info('Creating spatial index on table container');
  pg("CREATE INDEX "+table_name+"_geom_gist ON "+table_name+" USING gist (the_geom);", create_place_table);
}

function create_place_table(err, rows, result) {
  if(err) {
    console.error(error_response, err);
    return;
  }
  var table_name = 'place';
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
      console.error(error_response, err);
      return;
    }
    console.info('Database initialized!');
  });
}

function import_containers(containers) {
  console.info('Importing containers to DB');
  var stmt = 'INSERT INTO container (place_name, time_from, time_to) VALUES ($1::text, $2::timestamp, $3::timestamp);';
  for (var i = 0; i < containers.length; i++) {
    pg(stmt, containers[i], function(err, rows, result) {
      if(err) {
        return console.error('Cannot insert container to DB!', err);
      }
    });
  }
  // update geo location to containers
  console.info('Updating location of containers');
  stmt = 'UPDATE container SET the_geom = (SELECT the_geom FROM place p WHERE p.place_name = place_name);';
  pg (stmt, function(err, rows, result) {
    if (err) {
      return console.error('Cannot update container locations!', err);
    }

    // update list of places
    console.info('Updating list of places');
    stmt = 'INSERT INTO place (place_name) SELECT DISTINCT o.place_name AS place_name FROM container o WHERE o.the_geom IS NULL AND NOT EXISTS (SELECT kp.place_name FROM place kp WHERE kp.place_name = o.place_name);';
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
  console.info('Selecting all containers');
  pg('SELECT gid, place_name, ST_X(the_geom) AS lon, ST_Y(the_geom) AS lat, time_from, time_to FROM container WHERE time_to > NOW() AND the_geom IS NOT NULL;', function(err, rows, result) {
    if(err) {
      console.error('Error running select_all query', err);
      return next(err);
    }
    res.json(rows);
    return next();
  });
}

function unknown_places(req, res, next){
  console.info('Selecting unknown places');
  pg('SELECT place_name FROM place WHERE the_geom IS NULL;', function(err, rows, result) {
    if(err) {
      console.error('Error running unknown_places query', err);
      return next(err);
    }
    res.json(rows);
    return next();
  });
}

function add_place(place_name, lat, lng, callback) {
  console.info('Adding place to DB');
  var stmt = "UPDATE place SET the_geom = ST_SetSRID(ST_MakePoint($1::float, $2::float), 4326) WHERE place_name = $3::text;";
  pg(stmt, [lat, lng, place_name], function(err, rows, result) {
    if(err) {
      console.error('Cannot add place to DB!', err);
      callback(err);
      return;
    }
    // update location of related containers
    console.info('Updating related containers')
    stmt = 'UPDATE container SET the_geom = (SELECT the_geom FROM place WHERE place_name = $1::text) WHERE place_name = $2::text;';
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
