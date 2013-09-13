var q = require('q');
var exec = require('child_process').exec


function runner(opts) {
  return function(updated) {
    var dir = updated.dir;
    var d = q.defer();
    exec('cd ' + dir + ' && dart2js __adapter_dart_unittest.dart', function(err, stdout, stderr) {
      if (err) {
        console.log('error');
      }
      console.log(stdout);
      console.log(stderr);
      d.resolve(!err);
    });
    return d.promise;
  }
}

module.exports = {
  runner: runner
};
