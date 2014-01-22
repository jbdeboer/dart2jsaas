var q = require('q');
var crypto = require('crypto');

var random = function() {
  return Math.round(Math.random() * 10000);
};

function dartFs(opts) {
  var ops = opts.fileOps;

  function updateFile(path, contents) {
    // Now that we hash the directory name, this should never
    // find a file which has changed.
    return ops.readFile(path, 'utf8').then(function(data) {
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

  return function(input) {
    var waitingOn = [];
    var changed = 0;

    input.files.sort(function(a, b) { return a.path.localeCompare(b.path); });

    var shasum = crypto.createHash('sha1');

    input.files.forEach(function(f) {
      shasum.update(f.path);
      shasum.update(f.content);
    });

    var dir = TEMP_DIR + "/dart2jsaas-" + shasum.digest('hex') + '/';
    console.log('Writing to ' + dir);


    input.files.forEach(function(f) {
      waitingOn.push(updateFile(dir + f.path, f.content)
          .then(function(c) { if (c) changed++; }));
    });
    return q.allSettled(waitingOn).then(function() {
      console.log('Finished writing. Changed files:' + changed + ' of ' + input.files.length);
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
