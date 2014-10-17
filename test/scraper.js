/* Disable Chai Expect jshint errors: https://github.com/chaijs/chai/issues/41 */
/* jshint -W024 */
/* jshint expr:true */
var expect  = require('chai').expect,
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
      scraper_name_err = 'test_scraper_parse_error',
      scraper_name_exc = 'test_scraper_parse_exception';
    before(function(done) {
      // delete previous scrape logs
      db.pg('DELETE FROM scrape_status WHERE scraper_name = $1::text;', [scraper_name_err], function(err) {
        if(err) return done(err);
        db.pg('DELETE FROM scrape_status WHERE scraper_name = $1::text;', [scraper_name_exc], function(err) {
          if(err) return done(err);
          done();
        });
      });
    });

    it('should expose a function', function () {
      expect(scraper.scrape).to.be.a('function');
    });

    it('should log parse errors', function (done) {
      var
        s = scraper.createScraper(scraper_name_err);
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns error
      s.parse = function(body, cb) { return cb(new Error('parse_error')); };
      s.scrape(function () {
        // check if scraping was skipped
        db.findLastScrape(scraper_name_err, db.SCRAPE_STATUS_ERROR, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should log parse exceptions', function (done) {
      var
        s = scraper.createScraper(scraper_name_exc);
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns error
      s.parse = function(body, cb) { throw new Error('parse_exception'); };
      s.scrape(function () {
        // check if scraping was skipped
        db.findLastScrape(scraper_name_exc, db.SCRAPE_STATUS_ERROR, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

  });

});

