var config      = require('config'),
    restify     = require('restify'),
    fs          = require('fs'),
    moment      = require('moment'),
    db          = require('./bin/db.js'),
    scraper     = require('./bin/scraper.js'),
    pjson       = require('./package.json'),
    doT         = require('dot');

// set Czech locale for Moment.js
moment.locale('cs');
// fix stupid time format
moment.locale('cs', {
  longDateFormat : {
    LT: "H:mm"
  }
});

var app         = restify.createServer();

app.use(restify.queryParser());
app.use(restify.bodyParser());
app.use(restify.CORS());
app.use(restify.fullResponse());

// evaluate templates
var
  index = doT.template(fs.readFileSync(__dirname + '/templates/index.html').toString())({version: pjson.version}),
  scrape_status = doT.template(fs.readFileSync(__dirname + '/templates/scrape_status.html').toString());

// Routes

///--- API calls

app.get('/container', db.getContainers);

app.get('/container/update', function (req, res, next) {
  // forcibly run scraper update
  scraper.scrape();
  res.send({status: 'ok'});
});

app.get('/place', db.getPlaces);

app.put('/place/:id', function (req, res, next) {
  db.checkPlaceInDistrict(req.params.id, req.params.lat, req.params.lng, function(err) {
    if (err) {
      if (err.name == 'PlaceNotFound') {
        return next(new restify.ResourceNotFoundError(err.message));
      } else if (err.name == 'InvalidPlacement') {
        return next(new restify.InvalidContentError(err.message));
      } else {
        return next(err);
      }
    }
      // place is located in the district (or district is not set)
    db.locatePlace(req.params.id, req.params.lat, req.params.lng, function(err) {
      next.ifError(err);
      res.send({id: req.params.id, lat: req.params.lat, lng: req.params.lng});
      return next();
    });
  });
});

app.get('/status', function (req, res, next)
{
  res.send({status: 'ok'});
});

app.get('/status/scrape', function (req, res, next) {
  db.getScrapeStatus(function(err, rows) {
    if (err) {
      console.error('Cannot get scrape status from DB!', err);
      return next(err);
    }
    // extract and format DB data
    rows.forEach(function(record) {
      var scrape_result;
      record.suc_time_from_str = (record.suc_time_from) ? moment(record.suc_time_from).calendar() : '';
      record.suc_duration_str = (record.suc_time_from && record.suc_time_to) ? moment(record.suc_time_to).from(record.suc_time_from, true) : '';
      record.err_time_from_str = (record.err_time_from) ? moment(record.err_time_from).calendar() : '';
      record.err_duration_str = (record.err_time_from && record.err_time_to) ? moment(record.err_time_to).from(record.err_time_from, true) : '';
      // parse success message
      if (record.suc_message) {
        try {
          scrape_result = JSON.parse(record.suc_message);
          record.places_parsed = scrape_result.places.parsed;
          record.places_inserted = scrape_result.places.inserted;
          record.containers_parsed = scrape_result.containers.parsed;
          record.containers_inserted = scrape_result.containers.inserted;
        }
          // ignore parse errors
        catch(err) {}
      }
    });
    res.status(200);
    res.header('Content-Type', 'text/html');
    res.end(scrape_status(rows));
  });
});

app.get('/district/:id', function (req, res, next) {
  db.findDistrict(req.params.id, function(err, district) {
    if (err) {
      return next(new Error(err.message));
    }

    if (!district) {
      res.send(404, new Error('District with id '+req.params.id+' not found!'));
      return next(false);
    }

    res.send(district.json);
    return next();
  });
});


///--- Static content

app.use(function(req, res, next) {
  res.etag = pjson.version;
  next();
});
app.use(restify.conditionalRequest());

app.get('/', function (req, res, next)
{
  res.status(200);
  res.header('Content-Type', 'text/html');
  res.end(index);
});

app.get(/\/(css|js|img|lib|test)\/?.*/, restify.serveStatic({directory: './static/'}));

app.listen(config.port, config.ip, function () {
  console.info( "Listening on " + config.ip + ", port " + config.port );
});


///--- Scrapers

scraper.init();
