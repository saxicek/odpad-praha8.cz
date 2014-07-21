var expect  = require('chai').expect,
    fs      = require('fs'),
    scraper = require('../bin/scraper.js');

describe('scraper', function() {

  describe('parseContainers()', function() {
    var body;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      fs.readFile('test/data/velkoobjemove_kontejnery_2014-04-30.html', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        body = data;
        done();
      });
    });

    it('should expose a function', function () {
      expect(scraper.parseContainers).to.be.a('function');
    });

    it('should parse all rows', function() {
      expect(scraper.parseContainers(body)).to.have.length(93);
    });

  });

});

