var
  expect   = require('chai').expect,
  sinon    = require('sinon'),
  restify  = require('restify'),
  pjson    = require('../package.json'),
  config   = require('config');

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
  });
});
