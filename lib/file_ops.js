var q = require('q');
var fs = require('fs');
var exec = require('child_process').exec


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
  mkdir(pathDir).then(function() {
    fs.writeFile(path, contents, function() {
      d.resolve();
    });
  });
  return d.promise;
}

function readFile(path) {
  var d = q.defer();
  fs.readFile(path, 'binary', function(error, data) {
    if (error) {
      //console.log('error reading dart2js file:' + error);
      d.resolve(null);
      return;
    }
    d.resolve(data);
  });
  return d.promise;
}

function execDart2JS(dir, mainDart) {
  var d = q.defer();
  exec(
      'cd ' + dir + ' && ' +
          'dart2js --checked ' + mainDart +
          ' -o ' + mainDart + '.js',
      function (err, stdout, stderr) {
        if (err) {
          console.log('error: ' + err);
        }
        console.log(stdout);
        console.log(stderr);
        d.resolve(dir + mainDart + '.js');
      });
  return d.promise;
}

function execZip(parentDir, dirName) {
  var d = q.defer();

  console.log('cd ' + parentDir + ' && zip -rq ' + dirName + '.zip ' + dirName);
  exec(
      'cd ' + parentDir + ' && zip -rq ' + dirName + '.zip ' + dirName,
      function (err, stdout, stderr) {
        if (err) {
          console.log('error: ' + err);
        }
        console.log(stdout);
        console.log(stderr);
        d.resolve(parentDir + dirName + '.zip');
      });
  return d.promise;
}

module.exports = {
  writeFile: writeFile,
  readFile: readFile,
  execDart2JS: execDart2JS,
  execZip: execZip
};
