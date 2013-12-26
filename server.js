var config      = require('config'),
    restify     = require('restify'),
    fs          = require('fs'),
    db          = require('./bin/db.js')
    scraper     = require('./bin/scraper.js')

var app         = restify.createServer()

app.use(restify.queryParser())
app.use(restify.CORS())
app.use(restify.fullResponse())

// Routes
app.get('/container/within', db.selectBox);
app.get('/container', db.selectAll);
app.get('/container/update', function (req, res, next) {
  // fetch page, parse it and store to DB
  scraper.scrapeContainers();
  res.send({status: 'ok'});
});
app.get('/place/unknown', db.unknownPlaces);
app.post('place', db.addPlace);

app.get('/', function (req, res, next)
{
  var data = fs.readFileSync(__dirname + '/index.html');
  res.status(200);
  res.header('Content-Type', 'text/html');
  res.end(data.toString().replace(/host:port/g, req.header('Host')));
});

app.get(/\/(css|js|img)\/?.*/, restify.serveStatic({directory: './static/'}));

app.get('/status', function (req, res, next)
{
  res.send("{status: 'ok'}");
});

app.listen(config.port, config.ip, function () {
  console.log( "Listening on " + config.ip + ", port " + config.port )
});
