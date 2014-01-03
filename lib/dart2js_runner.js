var q = require('q');
var fs = require('fs');

var dart2jsCache = {};

function runner(opts) {
  var ops = opts.fileOps;

  return function(input) {
    var dart2jsFilename = input.dir + input.mainDart + '.js';

    if (dart2jsCache[dart2jsFilename]) {
      console.log('attaching to a previous dart2js run');
      return dart2jsCache[dart2jsFilename];
    }

    if (!input.changed) {
      return ops.readFile(dart2jsFilename);
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
      var promise = ops.execDart2JS(dir, m, opts.dart2jsCheckedMode);
      promises.push(promise);
      if (!firstPromise) {
        firstPromise = promise;
      }
    });
    return dart2jsCache[dart2jsFilename] =
        q.allSettled(promises).then(function() {
      return firstPromise
          .then(ops.readFile)
    });
  }
}

module.exports = {
  runner: runner
};
