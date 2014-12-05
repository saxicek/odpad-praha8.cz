/* Disable Chai Expect jshint errors: https://github.com/chaijs/chai/issues/41 */
/* jshint -W024 */
/* jshint expr:true */
var
  expect  = require('chai').expect,
  fs      = require('fs'),
  scraper = require('../../bin/scrapers/cz_praha8_textile.js');

describe('cz_praha8_electro_waste', function() {

  describe('parse()', function() {
    var
      body_1;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      fs.readFile('test/data/textil_2014-12-05.html', 'utf8', function (err, data) {
        if (err) return console.log(err);
        body_1 = data;
        done();
      });
    });

    it('should expose a function', function () {
      expect(scraper.parse).to.be.a('function');
    });

    it('should parse all rows from first data set', function(done) {
      scraper.parse(body_1, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(17);
        done();
      });
    });

    it('should parse row from first data correctly', function(done) {
      scraper.parse(body_1, function(err, res){
        if (err) return done(err);
        expect(res[0].place_name).to.equal('NC Krakov, Lodžská ul.,\nzas. autobusu Krakov');
        expect(res[0].time_from).to.be.null;
        expect(res[0].time_to).to.be.null;
        expect(res[0].container_type || scraper.containerType).to.equal('TEXTILE');
        done();
      });
    });

  });

});

