var config      = require('config'),
    pg          = require('pg-query');

var pg_config   = config.pg_config,
    schema_name = config.schema_name;
pg.connectionParameters = pg_config + '/' + schema_name;

var error_response = "Schema already exists - bypassing db initialization step\n";

function init_db(){
  pg('CREATE EXTENSION postgis;', create_db_schema);
}

function create_db_schema(err, rows, result) {
  if(err && err.code == "ECONNREFUSED"){
    console.error("DB connection unavailable, see README notes for setup assistance\n", err);
    return;
  }
  //drop_db_schema();
  create_place_table();
}

function drop_db_schema(err, rows, result) {
  // drop tables first
  // errors in this part are ignored - tables may and may not be present so DROP can fail
  console.info('Dropping table container');
  pg('DROP TABLE container;', function(err, rows, result){
    console.info('Dropping table place');
    pg('DROP TABLE place;', function(err, rows, result) {
      create_place_table();
    });
  });
}

function create_place_table(err, rows, result) {
  if(err) {
    console.error(error_response, err);
    return;
  }
  var table_name = 'place';
  var query = "CREATE TABLE "+table_name+" ( " +
    "id serial NOT NULL," +
    "place_name character varying(240), " +
    "the_geom geometry, " +
    "CONSTRAINT "+table_name+"_pkey PRIMARY KEY (id), " +
    "CONSTRAINT "+table_name+"_enforce_dims_geom CHECK (st_ndims(the_geom) = 2), " +
    "CONSTRAINT "+table_name+"_enforce_geotype_geom CHECK (geometrytype(the_geom) = 'POINT'::text OR the_geom IS NULL), " +
    "CONSTRAINT "+table_name+"_enforce_srid_geom CHECK (st_srid(the_geom) = 4326), " +
    "UNIQUE (place_name)" +
    ") WITH ( OIDS=FALSE );";
  console.info('Creating table '+table_name);
  error_response = 'Cannot create table ' + table_name + '!\n';
  pg(query, add_spatial_index);
}

function add_spatial_index(err, rows, result) {
  if(err) {
    console.error(error_response, err);
    return;
  }
  var table_name = 'place';
  console.info('Creating spatial index on table ' + table_name);
  error_response = 'Cannot create spatial index on table ' + table_name + '!\n';
  pg("CREATE INDEX "+table_name+"_geom_gist ON "+table_name+" USING gist (the_geom);", create_container_table);
}

function create_container_table(err, rows, result) {
  if(err) {
    console.error(error_response, err);
    return;
  }
  var table_name = 'container';
  var query = "CREATE TABLE "+table_name+" ( " +
    "id serial NOT NULL," +
    "time_from TIMESTAMP NOT NULL, " +
    "time_to TIMESTAMP NOT NULL, " +
    "place_id INTEGER REFERENCES place (id), " +
    "CONSTRAINT "+table_name+ "_pkey PRIMARY KEY (id), " +
    "UNIQUE (place_id, time_from, time_to)" +
    ") WITH ( OIDS=FALSE );";
  console.info('Creating table '+table_name);
  error_response = 'Cannot create table ' + table_name + '!\n';
  pg(query, function(err, rows, result) {
    if(err) {
      console.error(error_response, err);
      return;
    }
    console.info('Database initialized!');
  });
}

function import_containers(containers) {
  var stmt = null;
  var container = containers.shift();
  if (!container) {
    console.info('Import finished!');
    return;
  }
  console.info('Importing container ' + container.place_name + ' to DB');
  // check if place is in the database and get it's id
  stmt = 'INSERT INTO place (place_name) VALUES ($1::text);';
  pg(stmt, [container.place_name], function(err, rows, result) {
    if (err) {
      // place with the same name already exists
      console.info('Place with name "' + container.place_name + '" already exists?\n', err)
    }
    stmt = 'SELECT id FROM place WHERE place_name = $1::text;';
    pg(stmt, [container.place_name], function(err, rows, result) {
      if (err) {
        console.error('Cannot select place id!\n', err);
        return;
      }
      // insert container
      stmt = 'INSERT INTO container (place_id, time_from, time_to) VALUES ($1::integer, $2::timestamp, $3::timestamp);';
      pg(stmt, [rows[0].id, container.time_from, container.time_to], function(err, rows, result) {
        if(err) {
          return console.error('Cannot insert container to DB!\n', err);
        }
        import_containers(containers);
      });
    });
  });
}

function get_containers(req, res, next){
  console.info('Selecting all containers');
  pg('SELECT id, time_from, time_to, place_id FROM container WHERE time_to > NOW();', function(err, rows, result) {
    if(err) {
      console.error('Error running get_containers query\n', err);
      return next(err);
    }
    res.send(rows);
    return next();
  });
}

function get_places(req, res, next){
  console.info('Selecting places');
  pg('SELECT id, place_name, ST_X(the_geom) AS lng, ST_Y(the_geom) AS lat FROM place;', function(err, rows, result) {
    if(err) {
      console.error('Error running get_places query\n', err);
      return next(err);
    }
    res.send(rows);
    return next();
  });
}

function locate_place(id, lat, lng, callback) {
  console.info('Updating place in DB');
  var stmt = "UPDATE place SET the_geom = ST_SetSRID(ST_MakePoint($1::float, $2::float), 4326) WHERE id = $3::integer;";
  pg(stmt, [lng, lat, id], function(err, rows, result) {
    if(err) {
      console.error('Cannot update place in DB!\n', err);
      callback(err);
      return;
    }
    callback();
  });
}

module.exports = exports = {
  getContainers:     get_containers,
  initDB:            init_db,
  importContainers:  import_containers,
  getPlaces:         get_places,
  locatePlace:       locate_place
};
