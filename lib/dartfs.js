var q = require('q');
var fs = require('fs');

var random = function() {
  return Math.round(Math.random() * 10000);
};

function dartFs(opts) {
  var ops = opts.fileOps;

  function updateFile(path, contents) {
    return ops.readFile(path).then(function(data) {
      if (data && data == contents) {
        return false;
      }
      return ops.writeFile(path, contents)
          .then(function() {
            return true;
          });
    });
  }

  var TEMP_DIR = process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';

  var dir = TEMP_DIR + "/dart2jsaas-" + random() + '/';

  return function(input) {
    console.log('Writing to ' + dir);
    var waitingOn = [];
    var changed = 0;
    input.files.forEach(function(f) {
      waitingOn.push(updateFile(dir + f.path, f.content)
          .then(function(c) { if (c) changed++; }));
    });
    return q.allResolved(waitingOn).then(function() {
      console.log('Finished writing. Changed files:' + changed);
      return {
        mainDart: input.mainDart,
        changed: changed > 0,
        dir: dir
      };
    });
  }
}

module.exports = {
  dartFs: dartFs
};
