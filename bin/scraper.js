var
  config       = require('config'),
  request      = require('request'),
  fs           = require('fs'),
  path         = require('path'),
  util         = require('util'),
  EventEmitter = require('events').EventEmitter,
  db           = require('./db.js'),

  emitter      = new EventEmitter()
  ;

var scraperPrototype = {
  scrape: function() {
    var
      self = this,
      containers;

    // fetch the html page
    this.info('Fetching the page '+this.url);
    request.get(this.url, function (err, response, body) {
      if (err) {
        return self.error("Error in fetching URL\n" + err);
      }
      if (response.statusCode != 200) {
        return self.error('Invalid response code ('+response.statusCode+')');
      }

      containers = self.parse(body);
      db.importContainers(containers);
    });
  },
  info: function(message) {
    console.log(this.name + ': ' + message);
  },
  error: function(message) {
    console.error(this.name + ': ' + message);
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
