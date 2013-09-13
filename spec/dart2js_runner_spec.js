var runner = require('../lib/dart2js_runner.js');
var q = require('q');


describe('dart2js runner', function() {
  var opts;

  beforeEach(function() {
    opts = {
      fileOps: {
        readFile: function(path) { return q('file contents');},
        execDart2JS: function(dir, mainDart) { return q('dart2js'); }
      }
    }
  });

  it('should run dart2js', function(done) {
    runner.runner(opts)(true).then(function(js) {
      expect(js).toEqual('file contents');
      done();
    });
  })
});
