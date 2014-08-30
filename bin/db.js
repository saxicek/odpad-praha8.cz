var config      = require('config'),
    pg          = require('pg-query');

pg.connectionParameters = config.pg_config + '/' + config.schema_name;

var SCRAPE_STATUS = {
  RUNNING: 'RUN',
  SKIPPED: 'SKP',
  SUCCESS: 'SUC',
  ERROR: 'ERR'
};

function find_place(place_name, district_id, callback) {
  if (district_id) {
    return pg.first('SELECT id FROM place WHERE place_name = $1::text AND district_id = $2::integer;', [place_name, district_id], callback);
  } else {
    return pg.first('SELECT id FROM place WHERE place_name = $1::text AND district_id IS NULL;', place_name, callback);
  }
}

function insert_place(place_name, district_id, callback) {
  var stmt = 'INSERT INTO place (place_name, district_id) VALUES ($1::text, $2::integer);';
  pg(stmt, [place_name, district_id], callback);
}

function find_container(place_id, time_from, time_to, container_type, callback) {
  var stmt = "SELECT id FROM container WHERE place_id = $1::integer AND time_from = $2::timestamp AT TIME ZONE 'Europe/Prague' AND time_to = $3::timestamp AT TIME ZONE 'Europe/Prague' AND container_type = $4::text;";
  pg.first(stmt, [place_id, time_from, time_to, container_type], callback);
}

function insert_container(place_id, time_from, time_to, container_type, callback) {
  var stmt = "INSERT INTO container (place_id, time_from, time_to, container_type) VALUES ($1::integer, $2::timestamp AT TIME ZONE 'Europe/Prague', $3::timestamp AT TIME ZONE 'Europe/Prague', $4::text);";
  pg(stmt, [place_id, time_from, time_to, container_type], callback);
}

function get_containers(req, res, next){
  console.info('Selecting all containers');
  pg("SELECT id, time_from, time_to, place_id, container_type FROM container WHERE time_to > NOW();", function(err, rows, result) {
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

function add_scrape(scraper_name, callback) {
  var stmt = "INSERT INTO scrape_status (scraper_name, status) VALUES ($1::text, $2::text) RETURNING id;";
  pg(stmt, [scraper_name, SCRAPE_STATUS.RUNNING], callback);
}

function update_scrape_status(id, status, message, callback) {
  var stmt = "UPDATE scrape_status SET status = $1::text, message = $2::text, time_to = CURRENT_TIMESTAMP WHERE id = $3::integer;";
  pg(stmt, [status, message, id], callback);
}

function find_last_scrape(scraper_name, status, callback) {
  if (arguments.length == 2) {
    callback = status;
    status = SCRAPE_STATUS.SUCCESS;
  }
  var stmt = "SELECT MAX(time_from) AS time_from FROM scrape_status WHERE status = $1::text AND scraper_name = $2::text;";
  pg.first(stmt, [status, scraper_name], callback);
}

function scrape_success(id, message, callback) {
  update_scrape_status(id, SCRAPE_STATUS.SUCCESS, message, callback);
}

function scrape_error(id, message, callback) {
  update_scrape_status(id, SCRAPE_STATUS.ERROR, message, callback);
}

function scrape_skipped(id, message, callback) {
  update_scrape_status(id, SCRAPE_STATUS.SKIPPED, message, callback);
}

function get_scrape_status(callback) {
  var stmt =
    "with " +
      "last_scrape as (" +
      "        select scraper_name" +
      "              ,status" +
      "              ,max(time_from) as time_from" +
      "          from scrape_status" +
      "         group by scraper_name, status" +
      ")," +
      "last_scrape_full as (" +
      "        select s.*" +
      "          from scrape_status s" +
      "          join last_scrape l on l.scraper_name = s.scraper_name" +
      "                            and l.status = s.status" +
      "                            and l.time_from = s.time_from" +
      ")," +
      "scrapers as (" +
      "        select distinct scraper_name" +
      "          from scrape_status" +
      ")" +
      "select scraper_name" +
      "      ,(select time_from at time zone 'Europe/Prague' from last_scrape l where l.scraper_name = s.scraper_name and l.status = 'SUC') suc_time_from" +
      "      ,(select time_to at time zone 'Europe/Prague' from last_scrape_full l where l.scraper_name = s.scraper_name and l.status = 'SUC') suc_time_to" +
      "      ,(select message from last_scrape_full l where l.scraper_name = s.scraper_name and l.status = 'SUC') suc_message" +
      "      ,(select time_from at time zone 'Europe/Prague' from last_scrape l where l.scraper_name = s.scraper_name and l.status = 'ERR') err_time_from" +
      "      ,(select time_to at time zone 'Europe/Prague' from last_scrape_full l where l.scraper_name = s.scraper_name and l.status = 'ERR') err_time_to" +
      "      ,(select message from last_scrape_full l where l.scraper_name = s.scraper_name and l.status = 'ERR') err_message" +
      "      ,(select time_from at time zone 'Europe/Prague' from last_scrape l where l.scraper_name = s.scraper_name and l.status = 'SKP') skp_time_from" +
      "      ,(select time_to at time zone 'Europe/Prague' from last_scrape_full l where l.scraper_name = s.scraper_name and l.status = 'SKP') skp_time_to" +
      "      ,(select message from last_scrape_full l where l.scraper_name = s.scraper_name and l.status = 'SKP') skp_message" +
      "  from scrapers s";
  pg(stmt, null, callback);
}

function find_district(district_name, callback) {
  pg.first('SELECT id FROM district WHERE district_name = $1::text;', district_name, callback);
}

module.exports = exports = {
  pg:                pg,
  getContainers:     get_containers,
  findPlace:         find_place,
  insertPlace:       insert_place,
  findContainer:     find_container,
  insertContainer:   insert_container,
  getPlaces:         get_places,
  locatePlace:       locate_place,
  addScrape:         add_scrape,
  findLastScrape:    find_last_scrape,
  scrapeSuccess:     scrape_success,
  scrapeError:       scrape_error,
  scrapeSkipped:     scrape_skipped,
  getScrapeStatus:   get_scrape_status,
  findDistrict:      find_district,
  SCRAPE_STATUS_SUCCESS: SCRAPE_STATUS.SUCCESS,
  SCRAPE_STATUS_SKIPPED: SCRAPE_STATUS.SKIPPED,
  SCRAPE_STATUS_ERROR:   SCRAPE_STATUS.ERROR,
  SCRAPE_STATUS_RUNNING: SCRAPE_STATUS.RUNNING
};
