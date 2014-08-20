var
  config       = require('config'),
  request      = require('request'),
  fs           = require('fs'),
  path         = require('path'),
  util         = require('util'),
  async        = require('async'),
  EventEmitter = require('events').EventEmitter,
  db           = require('./db.js'),

  emitter      = new EventEmitter()
  ;

var scraperPrototype = {
  scrape: function() {
    var
      self = this,
      containers,
      scrapeId;

    async.waterfall([
      // add scrape_status record to DB
      function(callback) {
        db.addScrape(self.name, callback);
      },
      // get id of scrape_status record
      function(rows, result, callback) {
        scrapeId = rows[0].id;
        callback();
      },
      // fetch scraper URL
      function(callback) {
        self.info('Fetching the page ' + self.url);
        request.get(self.url, callback);
      },
      // check response status code
      function(response, body, callback) {
        if (response.statusCode != 200) {
          return callback(new Error('Invalid response code ('+response.statusCode+')'));
        }
        callback(null, body);
      },
      // parse data
      self.parse.bind(self),
      // import data to DB
      db.importContainers
    ],
    function(err, result) {
      if (err) {
        // log error to console
        self.error('Scraper error!', err);
      } else {
        self.info(result);
      }
      // update scrape status in DB
      if (scrapeId) {
        if (err) {
          db.scrapeError(scrapeId, err, function(err) {
            if (err) self.error('Cannot update scraper status to error', err);
          });
        } else {
          db.scrapeSuccess(scrapeId, function(err) {
            if (err) self.error('Cannot update scraper status to error', err);
          });
        }
      }
    });
  },
  info: function(message) {
    if (message) {
      console.log(this.name + ': ' + message);
    }
  },
  error: function(message, err) {
    if (message) {
      console.error(this.name + ': ' + message, err);
    }
  }
};

function createScraper(name) {
  var self = Object.create(scraperPrototype);
  self.name = name;
  emitter.on('scrape', function() {
    // bind scope to Scraper object
    self.scrape.apply(self);
  });
  self.info('Scraper enabled');
  return self;
}

function scrape() {
  emitter.emit('scrape');
}

function init() {
  // load scrapers
  fs.readdir(path.join(__dirname, 'scrapers'), function(err, files) {
    if (err) {
      return console.error('Cannot load scrapers: ' + err);
    }
    for (var i = 0; i < files.length; i++) {
      // this registers scraper to scrape event
      require('./scrapers/' + files[i]);
    }
  });
  // perform initial scrape
  setTimeout(scrape, 3000);
  // schedule future scrapes
  setInterval(scrape, config.scrape_interval);
}

module.exports = exports = {
  scrape: scrape,
  init: init,
  createScraper: createScraper
};
