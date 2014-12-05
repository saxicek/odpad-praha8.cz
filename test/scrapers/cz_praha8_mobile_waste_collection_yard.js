var
  expect  = require('chai').expect,
  fs      = require('fs'),
  scraper = require('../../bin/scrapers/cz_praha8_mobile_waste_collection_yard.js');

describe('cz_praha8_mobile_waste_collection_yard', function() {

  describe('parse()', function() {
    var body;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      fs.readFile('test/data/mobilni_sberny_dvur_2014-10-03.html', 'utf8', function (err, data) {
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
        expect(res).to.have.length(2);
        done();
      });
    });

    it('should parse a row correctly', function(done) {
      scraper.parse(body, function(err, res){
        if (err) return done(err);
        expect(res[0].place_name).to.equal('Zhořelecká x Radomská');
        expect(res[0].time_from).to.eql(new Date((new Date()).getFullYear(), 9, 4, 8, 0));
        expect(res[0].time_to).to.eql(new Date((new Date()).getFullYear(), 9, 4, 14, 0));
        expect(res[0].container_type || scraper.containerType).to.equal('MOBILE_WASTE_COLLECTION_YARD');
        done();
      });
    });

  });

});

