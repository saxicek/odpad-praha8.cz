/* Disable Chai Expect jshint errors: https://github.com/chaijs/chai/issues/41 */
/* jshint -W024 */
/* jshint expr:true */
var expect  = require('chai').expect,
    async   = require('async'),
    _       = require('lodash'),
    scraper = require('../bin/scraper.js'),
    db      = require('../bin/db.js');

describe('scraper', function() {

  describe('init()', function() {
    it('should expose a function', function () {
      expect(scraper.init).to.be.a('function');
    });

  });

  describe('createScraper()', function() {
    var
      lastSuccess = null,
      scraper_name = 'test_scraper';

    before(function(done) {
      // create successful scrape
      var stmt = "INSERT INTO scrape_status (scraper_name, status, time_to) VALUES ($1::text, $2::text, CURRENT_TIMESTAMP) RETURNING time_from;";
      db.pg.first(stmt, [scraper_name, db.SCRAPE_STATUS_SUCCESS], function(err, res) {
        if (err) return done(err);
        lastSuccess = res.time_from;
        done();
      });
    });

    it('should expose a function', function () {
      expect(scraper.createScraper).to.be.a('function');
    });

    it('should return scraper instance', function () {
      expect(scraper.createScraper(scraper_name)).to.be.an('object');
    });

    it('should not scrape too often', function (done) {
      var s = scraper.createScraper(scraper_name);
      s.minScrapeInterval = '24:00:00';
      s.scrape(function () {
        // check if scraping was skipped
        db.findLastScrape(scraper_name, db.SCRAPE_STATUS_SKIPPED, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).to.be.greaterThan(lastSuccess);
          done();
        });
      });
    });

  });

  describe('scrape()', function() {
    var
      scraper_name = {
        parse_error: 'test_scraper_parse_error',
        parse_exception: 'test_scraper_parse_exception',
        empty_parse: 'test_scraper_empty_parse',
        force_update_empty_parse: 'test_scraper_force_update_empty_parse',
        force_update_empty_parse_with_container_type: 'test_scraper_force_update_empty_parse_with_container_type',
        force_update_time_check: 'test_scraper_force_update_time_check',
        force_update_permanent_mixed: 'test_scraper_force_update_permanent_mixed',
        force_update_permanent: 'test_scraper_force_update_permanent',
        force_update_range: 'force_update_range'
      },
      test_container_type = 'TEST_CONTAINER_TYPE',
      test_container_type_fu_perm = 'TEST_CONTAINER_TYPE_FU_PERM',
      test_container_type_range = 'TEST_CONTAINER_TYPE_RANGE',
      test_district = { name: 'TEST_SCRAPE_DISTRICT', desc: 'test', geom: 'MULTIPOLYGON(((0 0, 0 10, 10 10, 10 0, 0 0)))' },
      test_place = { name: 'TEST_SCRAPE_PLACE', district: test_district, container_type: test_container_type },
      test_place_fu_perm = { name: 'TEST_SCRAPE_PLACE_FU_PERM', district: test_district, container_type: test_container_type_fu_perm },
      test_place_3 = { name: 'TEST_SCRAPE_PLACE_3' },
      test_place_range_1 = { name: 'TEST_SCRAPE_PLACE_RANGE_1', district: test_district, container_type: test_container_type_range },
      test_place_range_2 = { name: 'TEST_SCRAPE_PLACE_RANGE_2', district: test_district, container_type: test_container_type_range },
      test_place_range_3 = { name: 'TEST_SCRAPE_PLACE_RANGE_3', district: test_district, container_type: test_container_type_range },
      test_place_range_4 = { name: 'TEST_SCRAPE_PLACE_RANGE_4', district: test_district, container_type: test_container_type_range },
      test_container_1 = { place: test_place, container_type: test_container_type, time_from: null, time_to: null },
      test_container_2 = { place: test_place_fu_perm, container_type: test_container_type_fu_perm, time_from: null, time_to: null },
      test_container_range_1 = { place: test_place_range_1, container_type: test_container_type_range, time_from: new Date(2014, 1, 1, 12), time_to: new Date(2014, 1, 2, 19) },
      test_container_range_2 = { place: test_place_range_2, container_type: test_container_type_range, time_from: new Date(2014, 1, 15, 12), time_to: new Date(2014, 1, 15, 13) },
      test_container_range_3 = { place: test_place_range_2, container_type: test_container_type_range, time_from: new Date(2014, 2, 1, 12), time_to: new Date(2014, 2, 2, 19) },
      test_container_range_4 = { place: test_place_range_2, container_type: test_container_type_range, time_from: new Date(2014, 2, 15, 12), time_to: new Date(2014, 2, 15, 19) },
      test_container_range_5 = { place: test_place_range_3, container_type: test_container_type_range, time_from: new Date(2014, 3, 1, 12), time_to: new Date(2014, 3, 2, 19) },

      // collection of places that will be inserted to DB
      insert_places = [
        test_place, test_place_fu_perm, test_place_range_1, test_place_range_2, test_place_range_3, test_place_range_4
      ],
      // collection of places that should be deleted from DB
      delete_places = _.union(insert_places, [test_place_3]),
      // collection of containers that will be inserted to DB
      insert_containers = [
        test_container_1, test_container_2, test_container_range_1, test_container_range_2, test_container_range_3,
        test_container_range_4, test_container_range_5
      ];

    before(function(done) {
      async.series([
        // delete previous scrape logs
        function(cb) {
          async.eachSeries(_.keys(scraper_name), function(name, callback) {
            db.pg('DELETE FROM scrape_status WHERE scraper_name = $1::text;', [name], callback);
          }, cb);
        },
        // delete test containers
        function(cb) {
          async.eachSeries(delete_places, function(place, cb) {
            db.pg('DELETE FROM container WHERE place_id IN (SELECT id FROM place WHERE place_name = $1::text);', [place.name], cb);
          }, cb);
        },
        // delete test place
        function(cb) {
          async.eachSeries(delete_places, function(place, cb) {
            db.pg('DELETE FROM place WHERE place_name = $1::text', [place.name], cb);
          }, cb);
        },
        // delete test district
        function(cb) {
          db.pg('DELETE FROM district WHERE district_name = $1::text;', [test_district.name], cb);
        },
        // create test district
        function(cb) {
          db.pg('INSERT INTO district (district_name, description, the_geom) VALUES ($1::text, $2::text, ST_GeomFromText($3::text, 4326)) RETURNING id;',
            [test_district.name, test_district.desc, test_district.geom], function(err, rows) {
              if (err) return cb(err);
              test_district.id = rows[0].id;
              cb();
            });
        },
        // create test places
        function(cb) {
          async.eachSeries(insert_places, function(place, cb) {
            db.pg('INSERT INTO place (place_name, district_id, container_type) VALUES ($1::text, $2::integer, $3::text) RETURNING id;',
              [place.name, place.district.id, place.container_type], function(err, rows) {
                if (err) return cb(err);
                place.id = rows[0].id;
                cb();
              });
          }, cb);
        },
        // create test containers
        function(cb) {
          async.eachSeries(insert_containers, function(container, cb) {
            db.insertContainer(container.place.id, container.time_from, container.time_to, container.container_type, function(err, rows) {
              if (err) return cb(err);
              container.id = rows[0].id;
              cb();
            });
          }, cb);
        }
      ],
      function(err) {
        done(err);
      });
    });

    it('should expose a function', function () {
      expect(scraper.scrape).to.be.a('function');
    });

    it('should log parse errors', function (done) {
      var
        s = scraper.createScraper(scraper_name.parse_error);
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns error
      s.parse = function(body, cb) { return cb(new Error('parse_error')); };
      s.scrape(function () {
        // check if scraping failed
        db.findLastScrape(scraper_name.parse_error, db.SCRAPE_STATUS_ERROR, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should log parse exceptions', function (done) {
      var
        s = scraper.createScraper(scraper_name.parse_exception);
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns error
      s.parse = function(body, cb) { throw new Error('parse_exception'); };
      s.scrape(function () {
        // check if scraping failed
        db.findLastScrape(scraper_name.parse_exception, db.SCRAPE_STATUS_ERROR, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should support empty parse result', function (done) {
      var
        s = scraper.createScraper(scraper_name.empty_parse);
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns empty result
      s.parse = function(body, cb) { return cb(null, []); };
      s.scrape(function () {
        // check if scraping was successful
        db.findLastScrape(scraper_name.empty_parse, db.SCRAPE_STATUS_SUCCESS, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should support empty parse result in force update', function (done) {
      var
        s = scraper.createScraper(scraper_name.force_update_empty_parse);
      s.removeExisting = true;
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns empty result
      s.parse = function(body, cb) { return cb(null, []); };
      s.scrape(function () {
        // check if scraping was successful
        db.findLastScrape(scraper_name.force_update_empty_parse, db.SCRAPE_STATUS_SUCCESS, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should support empty parse result in force update with container type set', function (done) {
      var
        s = scraper.createScraper(scraper_name.force_update_empty_parse_with_container_type);
      s.removeExisting = true;
      s.containerType = test_container_type;
      s.districtName = test_district.name;
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns empty result
      s.parse = function(body, cb) { return cb(null, []); };
      s.scrape(function () {
        // check if scraping was successful
        db.findLastScrape(scraper_name.force_update_empty_parse_with_container_type, db.SCRAPE_STATUS_SUCCESS, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          db.findContainer(test_place.id, null, null, test_container_type, function(err, res) {
            if (err) return done(err);
            expect(res).to.be.undefined;
            done();
          });
        });
      });
    });

    it('should fail if in parse result time_from is set and time_to not', function (done) {
      var
        s = scraper.createScraper(scraper_name.force_update_time_check);
      s.removeExisting = true;
      s.districtName = test_district.name;
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns invalid result
      s.parse = function(body, cb) { return cb(null, [
        { place_name: test_place.name, time_from: _.now(), time_to: null, container_type: test_container_type }
      ]); };
      s.scrape(function () {
        // check if scraping failed
        db.findLastScrape(scraper_name.force_update_time_check, db.SCRAPE_STATUS_ERROR, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should fail if parse result mixes permanent and non-permanent containers', function (done) {
      var
        s = scraper.createScraper(scraper_name.force_update_permanent_mixed);
      s.removeExisting = true;
      s.districtName = test_district.name;
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns invalid result
      s.parse = function(body, cb) { return cb(null, [
        { place_name: test_place.name, time_from: null, time_to: null, container_type: test_container_type },
        { place_name: test_place.name, time_from: _.now(), time_to:_.now(), container_type: test_container_type }
      ]); };
      s.scrape(function () {
        // check if scraping failed
        db.findLastScrape(scraper_name.force_update_permanent_mixed, db.SCRAPE_STATUS_ERROR, function(err, res) {
          if (err) return done(err);
          expect(res.time_from).not.to.be.null;
          done();
        });
      });
    });

    it('should replace all permanent containers', function (done) {
      var
        s = scraper.createScraper(scraper_name.force_update_permanent)
      ;
      s.removeExisting = true;
      s.districtName = test_district.name;
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns 1 record in result
      s.parse = function(body, cb) { return cb(null, [
        { place_name: test_place_3.name, time_from: null, time_to: null, container_type: test_container_type_fu_perm }
      ]); };
      s.scrape(function () {
        // check if scraping failed
        db.pg('SELECT place_name FROM container c JOIN place p on p.id = c.place_id WHERE c.container_type = $1::text;', [test_container_type_fu_perm], function(err, res) {
          if (err) return done(err);
          expect(res.length).to.equal(1);
          expect(res[0].place_name).to.equal(test_place_3.name);
          done();
        });
      });
    });

    it('should replace containers in given time range', function (done) {
      var
        s = scraper.createScraper(scraper_name.force_update_range)
        ;
      s.removeExisting = true;
      s.districtName = test_district.name;
      // disable url fetch
      s.fetchUrl = function(cb) { cb(null, { statusCode: 200 }, null); };
      // parse returns invalid result
      s.parse = function(body, cb) { return cb(null, [
        { place_name: test_place_range_4.name, time_from: new Date(2014, 1, 15, 12), time_to: new Date(2014, 1, 15, 15), container_type: test_container_type_range },
        { place_name: test_place_range_4.name, time_from: new Date(2014, 2, 15, 12), time_to: new Date(2014, 2, 15, 16), container_type: test_container_type_range }
      ]); };
      s.scrape(function () {
        // check if scraping failed
        db.pg("SELECT place_name, time_from FROM container c JOIN place p on p.id = c.place_id WHERE c.container_type = $1::text ORDER BY c.time_from;", [test_container_type_range], function(err, res) {
          if (err) return done(err);
          expect(res.length).to.equal(4);
          expect(res[0].place_name).to.equal(test_place_range_1.name);
          // consider difference between CET and UTC - 1 hour offset
          expect(res[0].time_from).to.eql(new Date(Date.UTC(2014, 1, 1, 11)));
          expect(res[1].place_name).to.equal(test_place_range_4.name);
          expect(res[1].time_from).to.eql(new Date(Date.UTC(2014, 1, 15, 11)));
          expect(res[2].place_name).to.equal(test_place_range_4.name);
          expect(res[2].time_from).to.eql(new Date(Date.UTC(2014, 2, 15, 11)));
          expect(res[3].place_name).to.equal(test_place_range_3.name);
          // consider difference between CEST and UTC - 2 hours offset
          expect(res[3].time_from).to.eql(new Date(Date.UTC(2014, 3, 1, 10)));
          done();
        });
      });
    });

  });

});

