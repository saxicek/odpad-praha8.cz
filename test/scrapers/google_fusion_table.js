var
    expect  = require('chai').expect,
    fs      = require('fs'),
    sinon   = require('sinon'),
    scraper = require('../../bin/scrapers/google_fusion_table.js');

describe('google_fusion_table', function() {

    describe('parse()', function() {
        var
            body_1;
        // parse date is sensitive to current date since it is
        // guessing year from current date and input parameters
        before(function(done) {
            fs.readFile('test/data/google_fusion_table.json', 'utf8', function (err, data) {
                if (err) return done(err);
                body_1 = data;
                done();
            });
        });

        after(function() {
        });

        it('should expose a function', function () {
            expect(scraper.parse).to.be.a('function');
        });

        it('should parse all rows from first data set', function(done) {
            scraper.parse(body_1, function(err, res){
                if (err) return done(err);
                expect(res).to.have.length(1);
                done();
            });
        });

        it('should parse data from the first row correctly', function(done) {
            scraper.parse(body_1, function(err, res){
                if (err) return done(err);
                expect(res[0].district_name).to.equal('Praha 14');
                expect(res[0].place_name).to.equal('Sadská x V Humenci');
                expect(res[0].time_from).to.eql(new Date(2017, 3, 22, 8, 0));
                expect(res[0].time_to).to.eql(new Date(2017, 3, 22, 8, 30));
                expect(res[0].container_type || scraper.containerType).to.equal('BIO_WASTE');
                done();
            });
        });

    });

});
