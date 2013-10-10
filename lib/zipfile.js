var q = require('q');
var fs = require('fs');


var LAST_PATH = /(.*\/)([^\/]+)\/?/;

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

    var split = LAST_PATH.exec(input.dir);
    var parent = split[1];
    var dirName = split[2];
    console.log('running zip');
    try {
    return ops.execZip(parent, dirName)
        .then(ops.readFile)
        .then(cacheFile);
    } catch (e) {
      console.log('zip error: ' + e)
    }
  }
}

module.exports = {
  runner: runner
};
