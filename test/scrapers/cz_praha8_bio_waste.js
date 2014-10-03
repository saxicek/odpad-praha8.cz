var
  expect  = require('chai').expect,
  fs      = require('fs'),
  scraper = require('../../bin/scrapers/cz_praha8_bio_waste.js');

describe('cz_praha8_bio_waste', function() {

  describe('parse()', function() {
    var body;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      fs.readFile('test/data/bio_odpad_2014-10-03.html', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        body = data;
        done();
      });
    });

    it('should expose a function', function () {
      expect(scraper.parse).to.be.a('function');
    });

    it('should parse all rows', function(done) {
      scraper.parse(body, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(13);
        done();
      });
    });

    it('should parse row correctly', function(done) {
      scraper.parse(body, function(err, res){
        if (err) return done(err);
        expect(res[0].place_name).to.equal('Na Hájku x Nad Kotlaskou');
        expect(res[0].time_from).to.eql(new Date((new Date()).getFullYear(), 9, 1, 14, 0));
        expect(res[0].time_to).to.eql(new Date((new Date()).getFullYear(), 9, 1, 18, 0));
        expect(res[0].container_type).to.equal('BIO_WASTE');
        done();
      });
    });

  });

});

