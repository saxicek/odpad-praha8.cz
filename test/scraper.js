var expect  = require('chai').expect,
    scraper = require('../bin/scraper.js');

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
    it('should expose a function', function () {
      expect(scraper.createScraper).to.be.a('function');
    });

  });

});

