var q = require('q');
var fs = require('fs');
var exec = require('child_process').exec


function execDart2JS(dir, mainDart) {
  var d = q.defer();
  exec(
      'cd ' + dir + ' && ' +
          'dart2js ' + mainDart +
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

function readFile(path) {
  var d = q.defer();
  fs.readFile(path, function(error, data) {
    if (error) {
      console.log('error reading dart2js file:' + error);
    }
    d.resolve(data.toString());
  });
  return d.promise;
}

function runner(opts) {
  return function(input) {
    var dir = input.dir;
    var mainDart = input.mainDart;
    return execDart2JS(dir, mainDart).then(readFile);
  }
}

module.exports = {
  runner: runner
};
