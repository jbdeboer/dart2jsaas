var q = require('q');
var fs = require('fs');
var exec = require('child_process').exec

var random = function() {
  return Math.round(Math.random() * 10000);
};

function mkdir(dir) {
  var d = q.defer();
  exec('mkdir -p ' + dir, function() {
    d.resolve();
  });
  return d.promise;
}

function writeFile(path, contents) {
  var d = q.defer();

  var pathDir = path.match(/.*\//)[0];
  return mkdir(pathDir).then(function() {
    fs.writeFile(path, contents, function() {
      d.resolve();
    });
  });
}

function dartFs(opts) {
  var TEMP_DIR = process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';

  var dir = TEMP_DIR + "/dart2jsaas-" + random() + '/';

  return function(input) {
    console.log('Writing to ' + dir);
    var waitingOn = [];
    input.files.forEach(function(f) {
      waitingOn.push(writeFile(dir + f.path, f.content));
    });
    return q.allResolved(waitingOn).then(function() {
      return {
        mainDart: input.mainDart,
        changed: true,
        dir: dir
      };
    });
  }
}

module.exports = {
  dartFs: dartFs
};
