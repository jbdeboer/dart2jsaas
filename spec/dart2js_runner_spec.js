var runner = require('../lib/dart2js_runner.js');
var q = require('q');


describe('dart2js runner', function() {
  var opts;
  var dart2JsCalls;

  beforeEach(function() {
    dart2JsCalls = [];
    opts = {
      fileOps: {
        readFile: function(path) { return q('file contents');},
        execDart2JS: function(dir, mainDart) {
          dart2JsCalls.push(mainDart);
          return q('dart2js');
        }
      }
    }
  });

  it('should run dart2js', function(done) {
    runner.runner(opts)({
      changed: true,
      dir: 'baseDir/',
      mainDart: ['main.dart']
    }).then(function(js) {
      expect(js).toEqual('file contents');
      expect(dart2JsCalls).toEqual(['main.dart']);
    }).then(done);
  });


  it('should run dart2js for each element in the input', function(done) {
    runner.runner(opts)({
      changed: true,
      dir: 'baseDir/',
      mainDart: ['a.dart', 'b.dart']
    }).then(function(js) {
      expect(js).toEqual('file contents');
      expect(dart2JsCalls).toEqual(['a.dart', 'b.dart']);
    }).then(done);
  });
});
