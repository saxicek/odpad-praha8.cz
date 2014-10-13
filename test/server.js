var
  expect   = require('chai').expect,
  restify  = require('restify'),
  async    = require('async'),
  pjson    = require('../package.json'),
  config   = require('config'),
  db       = require('../bin/db.js');

var client = restify.createJsonClient({
  url: 'http://' + config.ip + ':' + config.port,
  version: '*'
});

describe('server', function() {
  describe('/status', function() {
    it('should return a 200 response and status: ok', function(done) {
      client.get('/status', function(err, req, res, obj) {
        expect(res.statusCode).to.equal(200);
        expect(obj).to.be.eql({status: 'ok'});
        done();
      });
    });
    it('should return 200 even for current ETag', function(done) {
      client.get({path: '/status', headers: {'If-None-Match': pjson.version}}, function(err, req, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });

  describe('/status/scrape', function() {
    it('should return a 200 response', function(done) {
      client.get('/status/scrape', function(err, req, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('should return 200 even for current ETag', function(done) {
      client.get({path: '/status/scrape', headers: {'If-None-Match': pjson.version}}, function(err, req, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });

  describe('/', function() {
    it('should return a 200 response', function(done) {
      client.get('/', function(err, req, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('should return "304 Not Modified" for current ETag', function(done) {
      client.get({path: '/', headers: {'If-None-Match': pjson.version}}, function(err, req, res) {
        expect(res.statusCode).to.equal(304);
        done();
      });
    });
    it('should support gzip', function(done) {
      client.get({path: '/', headers: {'accept-encoding': 'gzip'}}, function(err, req, res) {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-encoding']).to.equal('gzip');
        done();
      });
    });
    it('should use containers.min.js in normal mode', function(done) {
      client.get('/', function(err, req, res) {
        expect(res.body).to.contain('containers.min.js');
        done();
      });
    });
    it('should use containers.js in debug mode', function(done) {
      client.get('/?debug', function(err, req, res) {
        expect(res.body).to.contain('containers.js');
        done();
      });
    });
  });

  describe('/place/:id', function() {
    beforeEach(function(done){
      async.series([
        function(cb) { db.pg("DELETE FROM place WHERE place_name LIKE 'test%';", null, cb); },
        function(cb) { db.pg("DELETE FROM district WHERE district_name LIKE 'test%';", null, cb); },
        function(cb) { db.pg("INSERT INTO district (id, district_name, the_geom) VALUES ($1::integer, $2::text, ST_MPolyFromText($3::text, 4326));",
          [-1, 'test_district', 'MULTIPOLYGON (((0 1, 4 1, 4 2, 2 2, 2 4, 4 4, 4 5, 0 5, 0 1)))'], cb); },
        function(cb) { db.pg("INSERT INTO place (id, place_name) VALUES ($1::integer, $2::text);", [-1, 'test_place'], cb); },
        function(cb) { db.pg("INSERT INTO place (id, place_name, district_id) VALUES ($1::integer, $2::text, $3::integer);", [-2, 'test_place_2', -1], cb); }
      ], done);
    });

    it('should return a 200 response', function(done) {
      client.put('/place/-1', {lat: 2, lng: 1}, function(err, req, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
    });

    it('should allow to place into district', function(done) {
      client.put('/place/-2', {lat: 2, lng: 1}, function(err, req, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
    });

    it('should not set place outside of district', function(done) {
      client.put('/place/-2', {lat: 3, lng: 3}, function(err, req, res) {
        expect(res.statusCode).to.equal(400);
        done();
      });
    });
  });

  describe('/robots.txt', function() {
    it('should return a 200 response', function(done) {
      client.get('/robots.txt', function(err, req, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('should return correct content type', function(done) {
      client.get('/robots.txt', function(err, req, res) {
        expect(res.headers['content-type']).to.equal('text/plain');
        done();
      });
    });
  });

  describe('/sitemap.xml', function() {
    it('should return a 200 response', function(done) {
      client.get('/sitemap.xml', function(err, req, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('should return correct content type', function(done) {
      client.get('/sitemap.xml', function(err, req, res) {
        expect(res.headers['content-type']).to.equal('application/xml');
        done();
      });
    });
  });

  describe('/favicon.ico', function() {
    it('should return a 200 response', function(done) {
      client.get('/favicon.ico', function(err, req, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });

});
