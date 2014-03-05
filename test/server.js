var
  expect   = require('chai').expect,
  sinon    = require('sinon'),
  restify  = require('restify'),
  config   = require('config');

var client = restify.createJsonClient({
  url: 'http://' + config.ip + ':' + config.port,
  version: '*'
});

describe('server', function() {
  describe('/status', function() {
    it('should return a 200 response and status: ok', function (done) {
      client.get('/status', function(err, req, res, data) {
        expect(res.statusCode).to.equal(200);
        expect(data).to.be.eql({status: 'ok'});
        done();
      });
    });
  });
});
