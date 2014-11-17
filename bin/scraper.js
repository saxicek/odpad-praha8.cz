var
  config       = require('config'),
  request      = require('request'),
  fs           = require('fs'),
  path         = require('path'),
  util         = require('util'),
  async        = require('async'),
  moment       = require('moment'),
  EventEmitter = require('events').EventEmitter,
  db           = require('./db.js'),

  emitter      = new EventEmitter()
  ;

// Create a new object, that prototypally inherits from the Error constructor.
function ScrapeSkipError(message) {
  this.name = "ScrapeSkipError";
  this.message = message || "Scrape skipped!";
}
ScrapeSkipError.prototype = new Error();
ScrapeSkipError.prototype.constructor = ScrapeSkipError;

var scraperPrototype = {
  minScrapeInterval: null,
  districtName: null,
  districtId: null,
  scrape: function(callback) {
    var
      self = this,
      containers,
      scrapeId;

    callback = callback || function() {};
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
      // check that we don't scrape too often
      function(callback) {
        db.findLastScrape(self.name, function(err, res) {
          if (err) return callback(err);
          // check that we don't run too often
          if (res && self.minScrapeInterval && moment().isBefore(moment(res.time_from).add(moment.duration(self.minScrapeInterval)))) {
            // skip the scraping
            callback(new ScrapeSkipError());
          } else {
            // continue
            callback();
          }
        });
      },
      // get district id if scraper district name set
      function(callback) {
        if (self.districtName) {
          db.findDistrictId(self.districtName, function(err, res) {
            if (err) return callback(err);
            if (res) {
              self.districtId = res.id;
              callback();
            } else {
              callback('District with name "'+self.districtName+'" not found!');
            }
          });
        } else {
          self.info('Warning: District name for scraper '+self.name+' not set!');
          callback();
        }
      },
      self.fetchUrl.bind(self),
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
        try {
          self.parse(body, callback);
        }
        catch (err) {
          callback(err);
        }
      },
      // import data to DB
      function(containers, callback) {
        if (!containers || containers.length === 0) {
          self.info('No data to be inserted to DB');
          return callback(null, { parsed: 0, inserted: 0 });
        }
        self.info('Inserting data to DB');
        async.series({
          // add places
          places: function(callback) {
            self.info('Inserting places');
            // transform containers into places dictionary to prevent duplicate entries ...
            var reducedContainers = containers.reduce(function(memo, value){
              if (!memo.hasOwnProperty(value.container_type)) {
                memo[value.container_type] = [value.place_name];
              } else {
                if (memo[value.container_type].indexOf(value.place_name) === -1) {
                  // add unique only
                  memo[value.container_type].push(value.place_name);
                }
              }
              return memo;
            }, {});
            // ... and then extract unique (place name, container type) and add district_id
            var places = [];

            function flatten(place_name) {
              places.push({ place_name: place_name, container_type: container_type, district_id: self.districtId });
            }

            for (var container_type in reducedContainers) {
              if (reducedContainers.hasOwnProperty(container_type)) {
                reducedContainers[container_type]
                  .forEach(flatten);
              }
            }
            // add places
            async.mapLimit(places, config.db_inserts_parallel_limit, self.addPlace, function(err, results) {
              if (err) return callback(err);
              callback(null, results.reduce(self.reduceInsertResults));
            });
          },
          // add containers
          containers: function(callback) {
            self.info('Inserting containers');
            // add district id to containers
            containers.forEach(function(container) {
              container.district_id = self.districtId;
            });
            async.mapLimit(containers, config.db_inserts_parallel_limit, self.addContainer, function(err, results) {
              if (err) return callback(err);
              callback(null, results.reduce(self.reduceInsertResults));
            });
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
        // update scrape status in DB
        if (scrapeId) {
          if (err instanceof ScrapeSkipError) {
            db.scrapeSkipped(scrapeId, err.message, function(err) {
              if (err) self.error('Cannot update scraper status to skipped', err);
              self.info('Scrape skipped!');
              callback();
            });
          } else {
            db.scrapeError(scrapeId, err.message, function(e) {
              if (e) self.error('Cannot update scraper status to error', e);
              self.error('Scrape finished with error!', err);
              callback();
            });
          }
        } else {
          // log error to console
          self.error('Scrape finished with error!', err);
          callback();
        }
      } else {
        if (scrapeId) {
          db.scrapeSuccess(scrapeId, JSON.stringify(result), function(err) {
            if (err) self.error('Cannot update scraper status to success', err);
            self.info('Scrape finished successfully!');
            callback();
          });
        } else {
          self.error('Scrape finished successfully but no scrape id was set!', err);
          callback();
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
  addPlace: function(place, callback) {
    // search for a place with same name first
    db.findPlace(place.place_name, place.district_id, place.container_type, function(err, res) {
      if (err) return callback(err);
      if (res) {
        // place found
        return callback(null, { parsed: 1, inserted: 0 });
      } else {
        // place not found - insert it
        db.insertPlace(place.place_name, place.district_id, place.container_type, function(err) {
          callback(err, { parsed: 1, inserted: (err ? 0 : 1) });
        });
      }
    });
  },
  addContainer: function(container, callback) {
    var place_id;
    async.waterfall([
      // search for a place
      function(callback) {
        db.findPlace(container.place_name, container.district_id, container.container_type, callback);
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
          return callback(null, { parsed: 1, inserted: 0 });
        } else {
          // container not found - insert it
          db.insertContainer(place_id, container.time_from, container.time_to, container.container_type, function(err) {
            callback(err, { parsed: 1, inserted: (err ? 0 : 1) });
          });
        }
      }
    ], callback);
  },
  // fetch scraper URL
  fetchUrl: function(callback) {
    this.info('Fetching the page ' + this.url);
    request.get(this.url, callback);
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
