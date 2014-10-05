var
  expect  = require('chai').expect,
  fs      = require('fs'),
  scraper = require('../../bin/scrapers/cz_praha8_hazardous_waste.js');

describe('cz_praha8_hazardous_waste', function() {

  describe('parse()', function() {
    var body;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      fs.readFile('test/data/nebezpecny_odpad_2014-10-03.html', 'utf8', function (err, data) {
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
        expect(res).to.have.length(181);
        done();
      });
    });

    it('should parse row correctly', function(done) {
      scraper.parse(body, function(err, res){
        if (err) return done(err);
        expect(res[0].place_name).to.equal('křižovatka ul. Prosecká – Pod Labuťkou');
        expect(res[0].time_from).to.eql(new Date(2014, 2, 17, 15, 0));
        expect(res[0].time_to).to.eql(new Date(2014, 2, 17, 15, 20));
        expect(res[0].container_type).to.equal('HAZARDOUS_WASTE');
        done();
      });
    });

  });

});

