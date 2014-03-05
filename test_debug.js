var Mocha = require('mocha'),
  path = require('path'),
  fs = require('fs');

var mocha = new Mocha({
  reporter: 'spec',
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

  mocha.run();

});

