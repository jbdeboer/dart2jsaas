var q = require('q');
var fs = require('fs');

function runner(opts) {
  var ops = opts.fileOps;

  var _cache;
  function cacheFile(content) {
    _cache = content;
    return content;
  }

  return function(input) {
    if (_cache && !input.changed) {
      return q(_cache);
    }

    var dir = input.dir;
    var mainDart = input.mainDart;
    if (mainDart.length == 0) {
      console.log('no dart applications found.');
      return q('');
    }
    console.log('running dart2js');
    var firstPromise;
    var promises = [];
    mainDart.forEach(function(m) {
      var promise = ops.execDart2JS(dir, m);
      promises.push(promise);
      if (!firstPromise) {
        firstPromise = promise;
      }
    });
    return q.allSettled(promises).then(function() {
      return firstPromise
          .then(ops.readFile)
          .then(cacheFile);
    });
  }
}

module.exports = {
  runner: runner
};
