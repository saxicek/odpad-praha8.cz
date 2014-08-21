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
      function(body, callback) {
        self.info('Loading the page');
        self.parse(body, callback);
      },
      // import data to DB
      function(containers, callback) {
        self.info('Inserting data to DB');
        async.series({
          // add places
          places: function(callback) {
            // extract unique place names
            var places = containers
              .map(function(container) { return container.place_name; })
              .filter(function(value, index, self) { return self.indexOf(value) === index; });
            // add places
            async.mapLimit(places, config.db_inserts_parallel_limit, self.addPlace, function(err, results) {
              if (err) return callback(err);
              callback(null, results.reduce(self.reduceInsertResults));
            });
          },
          // add containers
          containers: function(callback) {
            async.mapLimit(containers, config.db_inserts_parallel_limit, self.addContainer, function(err, results) {
              if (err) return callback(err);
              callback(null, results.reduce(self.reduceInsertResults));
            })
          }
        },
        function(err, result) {
          if (err) {
            return callback(err);
          }
          self.info('Parsed '+result.places.parsed+' places, inserted '+result.places.inserted+'.');
          self.info('Parsed '+result.containers.parsed+' containers, inserted '+result.containers.inserted+'.');
          callback(null, result);
        });
      }
    ],
    function(err, result) {
      if (err) {
        // log error to console
        self.error('Scraper error!', err);
      }
      // update scrape status in DB
      if (scrapeId) {
        if (err) {
          db.scrapeError(scrapeId, err, function(err) {
            if (err) self.error('Cannot update scraper status to error', err);
            self.info('Scraping finished with error!');
          });
        } else {
          db.scrapeSuccess(scrapeId, JSON.stringify(result), function(err) {
            if (err) self.error('Cannot update scraper status to success', err);
            self.info('Scraping finished successfully!');
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
  },
  reduceInsertResults: function(prev, curr) {
    return {
      parsed: prev.parsed + curr.parsed,
      inserted: prev.inserted + curr.inserted
    };
  },
  addPlace: function(place_name, callback) {
    // search for a place with same name first
    db.findPlace(place_name, function(err, res) {
      if (err) return callback(err);
      if (res) {
        // place found
        return callback(null, { parsed: 1, inserted: 0 });
      } else {
        // place not found - insert it
        db.insertPlace(place_name, function(err) {
          callback(err, { parsed: 1, inserted: (err ? 0 : 1) });
        })
      }
    });
  },
  addContainer: function(container, callback) {
    var place_id;
    async.waterfall([
      // search for a place
      function(callback) {
        db.findPlace(container.place_name, callback);
      },
      // check if container exists
      function(res, callback) {
        if (!res) return callback('Place '+container.place_name+' not found!');
        place_id = res.id;
        db.findContainer(res.id, container.time_from, container.time_to, container.container_type, callback);
      },
      // insert container if not found
      function(res, callback) {
        if (res) {
          // container found
          return callback(null, { parsed: 1, inserted: 0 })
        } else {
          // container not found - insert it
          db.insertContainer(place_id, container.time_from, container.time_to, container.container_type, function(err) {
            callback(err, { parsed: 1, inserted: (err ? 0 : 1) });
          })
        }
      }
    ], callback);
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
