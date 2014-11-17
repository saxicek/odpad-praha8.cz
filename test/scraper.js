/* Disable Chai Expect jshint errors: https://github.com/chaijs/chai/issues/41 */
/* jshint -W024 */
/* jshint expr:true */
var expect  = require('chai').expect,
    async   = require('async'),
    scraper = require('../bin/scraper.js'),
    db      = require('../bin/db.js');

describe('scraper', function() {

  describe('init()', function() {
    it('should expose a function', function () {
      expect(scraper.init).to.be.a('function');
    });

  });

  describe('createScraper()', function() {
    var
      lastSuccess = null,
      scraper_name = 'test_scraper';

    before(function(done) {
      // create successful scrape
      var stmt = "INSERT INTO scrape_status (scraper_name, status, time_to) VALUES ($1::text, $2::text, CURRENT_TIMESTAMP) RETURNING time_from;";
      db.pg.first(stmt, [scraper_name, db.SCRAPE_STATUS_SUCCESS], function(err, res) {
        if (err) return done(err);
        lastSuccess = res.time_from;
        done();
      });
    });

    it('should expose a function', function () {
      expect(scraper.createScraper).to.be.a('function');
    });

    it('should return scraper instance', function () {
      expect(scraper.createScraper(scraper_name)).to.be.an('object');
    });

    it('should not scrape too often', function (done) {
      var s = scraper.createScraper(scraper_name);
      s.minScrapeInterval = '24:00:00';
      s.scrape(function () {
        // check if scraping was skipped
        db.findLastScrape(scraper_name, db.SCRAPE_STATUS_SKIPPED, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).to.be.greaterThan(lastSuccess);
          done();
        });
      });
    });

  });

  describe('scrape()', function() {
    var
      scraper_name = {
        parse_error: 'test_scraper_parse_error',
        parse_exception: 'test_scraper_parse_exception',
        empty_parse: 'test_scraper_empty_parse'
      };

    before(function(done) {
      // delete previous scrape logs
      var scraper_names_list = [];
      for(var name in scraper_name) {
        if (scraper_name.hasOwnProperty(name)) scraper_names_list.push(scraper_name[name]);
      }
      async.eachSeries(scraper_names_list, function(name, callback) {
        db.pg('DELETE FROM scrape_status WHERE scraper_name = $1::text;', [name], callback);
      }, done);
    });

    it('should expose a function', function () {
      expect(scraper.scrape).to.be.a('function');
    });

    it('should log parse errors', function (done) {
      var
        s = scraper.createScraper(scraper_name.parse_error);
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns error
      s.parse = function(body, cb) { return cb(new Error('parse_error')); };
      s.scrape(function () {
        // check if scraping was skipped
        db.findLastScrape(scraper_name.parse_error, db.SCRAPE_STATUS_ERROR, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should log parse exceptions', function (done) {
      var
        s = scraper.createScraper(scraper_name.parse_exception);
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns error
      s.parse = function(body, cb) { throw new Error('parse_exception'); };
      s.scrape(function () {
        // check if scraping was skipped
        db.findLastScrape(scraper_name.parse_exception, db.SCRAPE_STATUS_ERROR, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should support empty parse result', function (done) {
      var
        s = scraper.createScraper(scraper_name.empty_parse);
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns error
      s.parse = function(body, cb) { return cb(null, []); };
      s.scrape(function () {
        // check if scraping was successful
        db.findLastScrape(scraper_name.empty_parse, db.SCRAPE_STATUS_SUCCESS, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

  });

});

