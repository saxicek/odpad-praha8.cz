var
  expect  = require('chai').expect,
  fs      = require('fs'),
  scraper = require('../../bin/scrapers/cz_praha8_bulk_waste.js');

describe('cz_praha8_bulk_waste', function() {

  describe('parse()', function() {
    var
      body_1,
      body_2;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      fs.readFile('test/data/velkoobjemove_kontejnery_2014-04-30.html', 'utf8', function (err, data) {
        if (err) return console.log(err);
        body_1 = data;
        fs.readFile('test/data/velkoobjemove_kontejnery_2014-10-17.htm', 'utf8', function (err, data) {
          if (err) return console.log(err);
          body_2 = data;
          done();
        });
      });
    });

    it('should expose a function', function () {
      expect(scraper.parse).to.be.a('function');
    });

    it('should parse all rows of first data set', function(done) {
      scraper.parse(body_1, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(93);
        done();
      });
    });

    it('should parse all rows of second data set', function(done) {
      scraper.parse(body_2, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(127);
        done();
      });
    });

  });

});

