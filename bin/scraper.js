var
  config       = require('config'),
  request      = require('request'),
  fs           = require('fs'),
  path         = require('path'),
  util         = require('util'),
  async        = require('async'),
  moment       = require('moment'),
  _            = require('lodash'),
  EventEmitter = require('events').EventEmitter,
  db           = require('./db.js'),
  parserUtil   = require('./parser_util.js'),

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
  // districtName property should be overridden to set specific district name
  districtName: null,
  // minScrapeInterval property can be overridden to specify minimum interval between scrapes
  minScrapeInterval: null,
  // containerType property can be overridden to set same container type on all parsed values
  containerType: null,
  // removeExisting property can be overridden to forcibly delete existing containers parsed in previous runs
  // if set to true and parser returns permanent containers (i.e. containers with time_from and time_to
  // set to null) then all existing containers with given district and container type are deleted;
  // if set to true and parser returns non-permanent containers then only containers within parsed range
  // are deleted
  removeExisting: false,
  // this is internal property that is set from district name
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
      // populate district IDs if district name is set on data level instead of scraper level
      function(containers, callback) {
        if (containers && containers.length > 0) {
          var districtNameCache = {};
          async.eachLimit(containers, 2, function(container, callback) {
            if (container && 'district_name' in container) {
              if (container.district_name in districtNameCache) {
                container.district_id = districtNameCache[container.district_name];
                callback();
              } else {
                db.findDistrictId(container.district_name, function(err, res) {
                  if (err) return callback(err);
                  if (res) {
                    districtNameCache[container.district_name] = res.id;
                    container.district_id = res.id;
                    callback();
                  } else {
                    callback('District with name "'+container.district_name+'" not found!');
                  }
                });
              }
            } else {
              callback();
            }
          }, function (err) {
            callback(err, containers)
          })
        } else {
          callback(null, containers);
        }
      },
      // populate and normalize data
      function(containers, callback) {
        if (containers && containers.length > 0) {
          // add district id and container type to containers
          containers.forEach(function(container) {
            container.district_id = container.district_id || self.districtId;
            container.container_type = container.container_type || self.containerType;
            container.place_name = parserUtil.normalizePlace(container.place_name);
          });
        }
        callback(null, containers);
      },
      // remove previously parsed containers (if configured so using scraper parameter removeExisting)
      function(containers, callback) {
        var
          validContainerTimes,
          minMaxTimeFrom,
          timesAllNull;
        if (self.removeExisting) {
          if (!containers || containers.length === 0) {
            // if district and container type is specified, delete all existing data
            if (self.districtId && self.containerType) {
              self.info('Deleting all previously parsed containers');
              db.deleteContainersAll(self.containerType, self.districtId, function(err) {
                if (err) {
                  self.error('Cannot delete all containers of type '+self.containerType+' in district '+self.districtName+'!');
                  return callback(err);
                }
                callback(null, containers);
              });
            } else {
              // do not delete anything, just continue
              callback(null, containers);
            }
          } else {
            timesAllNull = containers[0].time_from === null;
            if (timesAllNull) {
              self.info('Deleting all previously parsed containers');
            } else {
              self.info('Deleting previously parsed containers from current period');
            }
            // Each container can have following time values coming from the parser:
            //
            // 1. both time_from and time_to have value set to specific date and time
            // 2. only time_from is set to specific date and time, time_to is null
            // 3. only time_to is set to specific date and time, time_from is null
            // 4. both time_from and time_to are null
            //
            // Variants 2 and 3 are not supported and raise error immediately when found.
            //
            // Also combination of variants 1 and 4 in the result set is not supported
            // and raises error.

            // check that containers have only supported variants of time_from and
            // time_to values (1 and 4 as described above)
            validContainerTimes = containers.every(function(container) {
              return ((container.time_from === null && container.time_to === null && timesAllNull) ||
                (container.time_from !== null && container.time_to !== null && !timesAllNull));
            });
            if (!validContainerTimes) {
              return callback(new Error('Combination of null and not null values is not allowed for container time_from and time_to attributes!'));
            }

            // if all times are null then delete all existing containers of given type
            if (timesAllNull) {
              async.eachSeries(_(containers).pluck('container_type').uniq().value(), function(containerType, callback) {
                db.deleteContainersAll(containerType, self.districtId, function(err) {
                  if (err) {
                    self.error('Cannot delete all containers of type '+containerType+' in district '+self.districtName+'!');
                    return callback(err);
                  }
                  callback();
                });
              }, function(err) {
                if (err) {
                  return callback(err);
                }
                callback(null, containers);
              });
            } else {
              // select min / max values for time_from field for each container type
              minMaxTimeFrom = _(containers)
                .groupBy('container_type')
                .mapValues(function(containers) {
                  return { minTimeFrom: _.min(containers, 'time_from').time_from, maxTimeFrom: _.max(containers, 'time_from').time_from};
                })
                .value();

              // delete existing containers for each container type within specific time range
              async.eachSeries(_.keys(minMaxTimeFrom), function(containerType, callback) {
                db.deleteContainersRange(containerType, self.districtId, minMaxTimeFrom[containerType].minTimeFrom,
                                         minMaxTimeFrom[containerType].maxTimeFrom, function(err) {
                  if (err) return callback(err);
                  callback();
                });
              }, function(err) {
                if (err) {
                  return callback(err);
                }
                callback(null, containers);
              });
            }
          }
        } else {
          return callback(null, containers);
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
              if (!memo.hasOwnProperty(value.district_id)) {
                memo[value.district_id] = {};
              }
              if (!memo[value.district_id].hasOwnProperty(value.container_type)) {
                memo[value.district_id][value.container_type] = [value.place_name];
              } else {
                if (memo[value.district_id][value.container_type].indexOf(value.place_name) === -1) {
                  // add unique only
                  memo[value.district_id][value.container_type].push(value.place_name);
                }
              }
              return memo;
            }, {});
            // ... and then extract unique (place name, container type, district_id)
            var places = [];

            function flatten(place_name) {
              places.push({ place_name: place_name, container_type: container_type, district_id: district_id });
            }

            for (var district_id in reducedContainers) {
              if (reducedContainers.hasOwnProperty(district_id)) {
                for (var container_type in reducedContainers[district_id]) {
                  if (reducedContainers[district_id].hasOwnProperty(container_type)) {
                    reducedContainers[district_id][container_type]
                      .forEach(flatten);
                  }
                }
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
