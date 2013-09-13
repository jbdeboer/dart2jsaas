var q = require('q');
var fs = require('fs');
var exec = require('child_process').exec




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
    console.log('running dart2js');
    return ops.execDart2JS(dir, mainDart).then(ops.readFile).then(cacheFile);
  }
}

module.exports = {
  runner: runner
};
