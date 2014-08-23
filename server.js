var config      = require('config'),
    restify     = require('restify'),
    fs          = require('fs'),
    db          = require('./bin/db.js'),
    scraper     = require('./bin/scraper.js'),
    pjson       = require('./package.json'),
    doT         = require('dot');

var app         = restify.createServer();

app.use(restify.queryParser());
app.use(restify.bodyParser());
app.use(restify.CORS());
app.use(restify.fullResponse());

// evaluate index template
var index = doT.template(fs.readFileSync(__dirname + '/index.html').toString())({version: pjson.version});
// load all scrapers
scraper.init();

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
  db.locatePlace(req.params.id, req.params.lat, req.params.lng, function(err) {
    if (err) {
      return next(new Error(err.message));
    } else {
      res.send({id: req.params.id, lat: req.params.lat, lng: req.params.lng});
      return next();
    }
  });
});

app.get('/status', function (req, res, next)
{
  res.send({status: 'ok'});
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

app.get(/\/(css|js|img|test)\/?.*/, restify.serveStatic({directory: './static/'}));

app.listen(config.port, config.ip, function () {
  console.info( "Listening on " + config.ip + ", port " + config.port );
});
