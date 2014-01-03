var Mocha = require('mocha'),
  path = require('path'),
  fs = require('fs');

var mocha = new Mocha({
  reporter: 'dot',
  ui: 'bdd',
  timeout: 999999
});

var testDir = './test/';

fs.readdir(testDir, function (err, files) {
  if (err) {
    console.info(err);
    return;
  }
  files.forEach(function (file) {
    if (path.extname(file) === '.js') {
      console.info('adding test file: %s', file);
      mocha.addFile(testDir + file);
    }
  });

  var runner = mocha.run(function () {
    console.info('finished');
  });

  runner.on('pass', function (test) {
    console.info('... %s passed', test.title);
  });

  runner.on('fail', function (test) {
    console.info('... %s failed', test.title);
  });
});