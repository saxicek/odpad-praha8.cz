var
  expect     = require('chai').expect,
  fs         = require('fs'),
  scraper    = require('../../bin/scrapers/cz_praha8_bulk_waste.js',
  parserUtil = require('../../bin/parser_util.js'));

describe('cz_praha8_bulk_waste', function() {

  describe('parse()', function() {
    var
      body_1,
      body_2,
      body_3;
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function(done) {
      fs.readFile('test/data/velkoobjemove_kontejnery_2014-04-30.html', 'utf8', function (err, data) {
        if (err) return console.log(err);
        body_1 = data;
        fs.readFile('test/data/velkoobjemove_kontejnery_2014-10-17.htm', 'utf8', function (err, data) {
          if (err) return console.log(err);
          body_2 = data;
          fs.readFile('test/data/velkoobjemove_kontejnery_2014-11-26.htm', 'utf8', function (err, data) {
            if (err) return console.log(err);
            body_3 = data;
            done();
          });
        });
      });
    });

    it('should expose a function', function () {
      expect(scraper.parse).to.be.a('function');
    });

    it('should parse all rows from first data set', function(done) {
      scraper.parse(body_1, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(93);
        done();
      });
    });

    it('should parse rows from first data set correctly', function(done) {
      scraper.parse(body_1, function(err, res){
        var date;
        if (err) return done(err);
        date = parserUtil.dateWithoutYear('29.4.');
        expect(res[0].place_name).to.equal('Kašparovo náměstí');
        expect(res[0].time_from).to.eql(new Date(date[0], date[1], date[2], 13, 0));
        expect(res[0].time_to).to.eql(new Date(date[0], date[1], date[2], 17, 0));
        expect(res[0].container_type || scraper.containerType).to.equal('BULK_WASTE');
        date = parserUtil.dateWithoutYear('31.5.');
        expect(res[92].place_name).to.equal('Pod Vodárenskou Věží x Nad Mazankou');
        expect(res[92].time_from).to.eql(new Date(date[0], date[1], date[2], 10, 0));
        expect(res[92].time_to).to.eql(new Date(date[0], date[1], date[2], 14, 0));
        expect(res[92].container_type || scraper.containerType).to.equal('BULK_WASTE');
        done();
      });
    });

    it('should parse all rows from second data set', function(done) {
      scraper.parse(body_2, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(127);
        done();
      });
    });

    it('should parse rows from second data set correctly', function(done) {
      scraper.parse(body_2, function(err, res){
        var date;
        if (err) return done(err);
        date = parserUtil.dateWithoutYear('15.10.');
        expect(res[0].place_name).to.equal('Korycanská x K Ládví');
        expect(res[0].time_from).to.eql(new Date(date[0], date[1], date[2], 13, 0));
        expect(res[0].time_to).to.eql(new Date(date[0], date[1], date[2], 17, 0));
        expect(res[0].container_type || scraper.containerType).to.equal('BULK_WASTE');
        date = parserUtil.dateWithoutYear('29.11.');
        expect(res[126].place_name).to.equal('Pod Vodárenskou Věží (východní konec)');
        expect(res[126].time_from).to.eql(new Date(date[0], date[1], date[2], 15, 0));
        expect(res[126].time_to).to.eql(new Date(date[0], date[1], date[2], 19, 0));
        expect(res[126].container_type || scraper.containerType).to.equal('BULK_WASTE');
        done();
      });
    });

    it('should parse all rows from third data set', function(done) {
      scraper.parse(body_3, function(err, res){
        if (err) return done(err);
        expect(res).to.have.length(178);
        done();
      });
    });

    it('should parse rows from third data set correctly', function(done) {
      scraper.parse(body_3, function(err, res){
        var date;
        if (err) return done(err);
        date = parserUtil.dateWithoutYear('20.11.');
        expect(res[0].place_name).to.equal('Modřínová x Javorová');
        expect(res[0].time_from).to.eql(new Date(date[0], date[1], date[2], 13, 0));
        expect(res[0].time_to).to.eql(new Date(date[0], date[1], date[2], 17, 0));
        expect(res[0].container_type || scraper.containerType).to.equal('BULK_WASTE');
        date = parserUtil.dateWithoutYear('01.12.');
        expect(res[33].place_name).to.equal('Hnězdenská x Olštýnská');
        expect(res[33].time_from).to.eql(new Date(date[0], date[1], date[2], 15, 0));
        expect(res[33].time_to).to.eql(new Date(date[0], date[1], date[2], 19, 0));
        expect(res[33].container_type || scraper.containerType).to.equal('BULK_WASTE');
        date = parserUtil.dateWithoutYear('31.01.');
        expect(res[177].place_name).to.equal('Lindavská');
        expect(res[177].time_from).to.eql(new Date(date[0], date[1], date[2], 10, 0));
        expect(res[177].time_to).to.eql(new Date(date[0], date[1], date[2], 14, 0));
        expect(res[177].container_type || scraper.containerType).to.equal('BULK_WASTE');
        done();
      });
    });

  });

});

