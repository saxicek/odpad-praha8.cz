var
  expect  = require('chai').expect,
  fs      = require('fs'),
  sinon   = require('sinon'),
  scraper = require('../../bin/scrapers/cz_praha8_bio_waste.js');

describe('cz_praha8_bio_waste', function() {

  describe('parse()', function() {
    var
      body_1,
      body_2,
      body_3;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      this.clock = sinon.useFakeTimers((new Date(2016, 03, 17)).getTime(), 'Date');
      fs.readFile('test/data/bio_odpad_2016-04-11.html', 'utf8', function (err, data) {
        if (err) return done(err);
        body_1 = data;
        done();
      });
    });

    after(function() {
      this.clock.restore();
    });

    it('should expose a function', function () {
      expect(scraper.parse).to.be.a('function');
    });

    it('should parse all rows from first data set', function(done) {
      scraper.parse(body_1, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(46);
        done();
      });
    });

    it('should parse row from first data correctly', function(done) {
      scraper.parse(body_1, function(err, res){
        if (err) return done(err);
        expect(res[0].place_name).to.equal('Klecanská x Na Ládví');
        expect(res[0].time_from).to.eql(new Date((new Date()).getFullYear(), 3, 2, 9, 0));
        expect(res[0].time_to).to.eql(new Date((new Date()).getFullYear(), 3, 2, 12, 0));
        expect(res[0].container_type || scraper.containerType).to.equal('BIO_WASTE');
        done();
      });
    });

  });

});
