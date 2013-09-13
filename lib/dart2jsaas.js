var q = require('q');
var fetchModule = require('./fetch.js');
var dartFsModule = require('./dartfs.js');
var dart2jsRunnerModule = require('./dart2js_runner.js');

function setupSystem(opts) {
  var fetcher = fetchModule.dartFileFetcher(opts);
  var dartFs = dartFsModule.dartFs(opts);
  var dart2jsRunner = dart2jsRunnerModule.runner(opts);

  return function(path) {
    return fetcher(path).then(dartFs).then(dart2jsRunner);
  }
}

module.exports = {
  setupSystem: setupSystem
}
