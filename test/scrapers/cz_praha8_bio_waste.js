var
  expect  = require('chai').expect,
  fs      = require('fs'),
  scraper = require('../../bin/scrapers/cz_praha8_bio_waste.js');

describe('cz_praha8_bio_waste', function() {

  describe('parse()', function() {
    var
      body_1,
      body_2;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      fs.readFile('test/data/bio_odpad_2014-10-03.html', 'utf8', function (err, data) {
        if (err) return console.log(err);
        body_1 = data;
        fs.readFile('test/data/bio_odpad_2014-10-17.htm', 'utf8', function (err, data) {
          if (err) return console.log(err);
          body_2 = data;
          done();
        });
      });
    });

    it('should expose a function', function () {
      expect(scraper.parse).to.be.a('function');
    });

    it('should parse all rows from first data set', function(done) {
      scraper.parse(body_1, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(13);
        done();
      });
    });

    it('should parse row from first data correctly', function(done) {
      scraper.parse(body_1, function(err, res){
        if (err) return done(err);
        expect(res[0].place_name).to.equal('Na Hájku x Nad Kotlaskou');
        expect(res[0].time_from).to.eql(new Date((new Date()).getFullYear(), 9, 1, 14, 0));
        expect(res[0].time_to).to.eql(new Date((new Date()).getFullYear(), 9, 1, 18, 0));
        expect(res[0].container_type || scraper.containerType).to.equal('BIO_WASTE');
        done();
      });
    });

    it('should parse all rows from second data set', function(done) {
      scraper.parse(body_2, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(15);
        done();
      });
    });

    it('should parse row from second data set correctly', function(done) {
      scraper.parse(body_2, function(err, res){
        if (err) return done(err);
        expect(res[13].place_name).to.equal('Javorová x Březová');
        expect(res[13].time_from).to.eql(new Date((new Date()).getFullYear(), 10, 4, 15, 0));
        expect(res[13].time_to).to.eql(new Date((new Date()).getFullYear(), 10, 4, 19, 0));
        expect(res[13].container_type || scraper.containerType).to.equal('BIO_WASTE');
        done();
      });
    });

  });

});

