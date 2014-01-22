var q = require('q');
var qfs = require('q-io/fs');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec


function mkdir(dir) {
  var d = q.defer();
  mkdirp(dir, function(err) {
    if (err) {
      d.reject(err);
    }
    d.resolve();
  });
  return d.promise;
}

function writeFile(path, contents) {
  var pathDir = path.match(/.*\//)[0];
  return mkdir(pathDir).then(function() {
    return qfs.write(path, contents);
  });
}

function readFile(path, encoding) {
  return qfs.exists(path).then(function(theFileExists) {
    if (theFileExists) {
      return qfs.read(path);
    } else {
      return q(null);
    }
  });
}

function execDart2JS(dir, mainDart, checkedMode) {
  var d = q.defer();
  var checked = checkedMode !== false ? '--checked ' : '';
  exec(
      'cd ' + dir + ' && ' +
          'dart2js ' + checked + mainDart +
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

function execDartVersion() {
  var d = q.defer();
  exec('dart --version', function (err, _, stderr) {
    console.log('Dart version:', stderr);
    if (err) {
      d.reject(err);
      return;
    }

    d.resolve(stderr);
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
  execZip: execZip,
  execDartVersion: execDartVersion
};
