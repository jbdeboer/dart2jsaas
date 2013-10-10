var q = require('q');
var fetchModule = require('./fetch.js');
var dartFsModule = require('./dartfs.js');
var dart2jsRunnerModule = require('./dart2js_runner.js');
var zipfileModule = require('./zipfile.js');

// Util classes
var hr = require('./http_request.js');
var fileOps = require('./file_ops.js');

function endsWith(haystack, needle) {
  var index = haystack.indexOf(needle);
  return index == haystack.length - needle.length;
}

function setupSystem(opts) {
  opts.http = opts['http'] || hr;
  opts.fileOps = opts['fileOps'] || fileOps;

  var fetcher = fetchModule.dartFileFetcher(opts);
  var dartFs = dartFsModule.dartFs(opts);
  var dart2jsRunner = dart2jsRunnerModule.runner(opts);
  var zipfile = zipfileModule.runner(opts);

  var running = {};

  return function(path, headers, baseUrl) {
    if (running[path]) {
      console.log('attaching to current run for ' + path);
      return running[path];
    }

    var returnSnapshot = endsWith(path, ".html");

    console.log('running for ' + path);
    var startTime = new Date();
    var dartFsResult;
    var dartFsPromise = fetcher(path, headers, baseUrl)
        .then(dartFs);

    var promise = dartFsPromise.then(dart2jsRunner)
        .then(function(dart2jsContent) {
          try {
      if (returnSnapshot) {
        return dartFsPromise.then(zipfile);
      }
      return dart2jsContent;
          } catch (e) { console.log('returnsnap error:' + e); }
    }).then(function(c) {  // c will be either a tarball or a js file.
      running[path] = false;
      console.log('finished dart2js for ' + path + ' in ' +
          (new Date() - startTime) + 'ms');
      return c;
    });
    running[path] = promise;
    return promise;
  }
}

module.exports = {
  setupSystem: setupSystem
};
