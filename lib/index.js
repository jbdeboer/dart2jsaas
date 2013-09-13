var q = require('q');
var fetchModule = require('./fetch.js');
var dartFsModule = require('./dartfs.js');
var dart2jsRunnerModule = require('./dart2js_runner.js');

// Util classes
var hr = require('./http_request.js');
var fileOps = require('./file_ops.js');

function setupSystem(opts) {
  opts.http = opts['http'] || hr;
  opts.fileOps = opts['fileOps'] || fileOps;

  var fetcher = fetchModule.dartFileFetcher(opts);
  var dartFs = dartFsModule.dartFs(opts);
  var dart2jsRunner = dart2jsRunnerModule.runner(opts);

  return function(path) {
    console.log('running for ' + path);
    return fetcher(path).then(dartFs).then(dart2jsRunner);
  }
}

module.exports = {
  setupSystem: setupSystem
}
