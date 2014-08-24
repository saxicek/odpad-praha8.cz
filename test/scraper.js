var expect  = require('chai').expect,
    scraper = require('../bin/scraper.js'),
    db      = require('../bin/db.js');

describe('scraper', function() {

  describe('init()', function() {
    it('should expose a function', function () {
      expect(scraper.init).to.be.a('function');
    });

  });

  describe('scrape()', function() {
    it('should expose a function', function () {
      expect(scraper.scrape).to.be.a('function');
    });

  });

  describe('createScraper()', function() {
    var lastSuccess = null;

    before(function(done) {
      // create successful scrape
      db.addScrape('test_scraper', function(err, res) {
        if (err) return done(err);
        db.scrapeSuccess(res[0].id, 'Test', function(err) {
          lastSuccess = Date.now();
          done(err);
        });
      });
    });

    it('should expose a function', function () {
      expect(scraper.createScraper).to.be.a('function');
    });

    it('should return scraper instance', function () {
      expect(scraper.createScraper('test_scraper')).to.be.an('object');
    });

    it('should not scrape too often', function (done) {
      var s = scraper.createScraper('test_scraper');
      s.minScrapeInterval = '24:00:00';
      s.scrape(function () {
        // check if scraping was skipped
        db.findLastScrape('test_scraper', db.SCRAPE_STATUS_SKIPPED, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).to.be.greaterThan(lastSuccess);
          done();
        });
      });
    });

  });

});

