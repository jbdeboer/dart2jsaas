var runner = require('../lib/dart2js_runner.js');
var q = require('q');


describe('dart2js runner', function() {
  var opts;
  var dart2JsCalls, checkedModeCalls;

  beforeEach(function() {
    dart2JsCalls = [];
    checkedModeCalls = [];
    opts = {
      fileOps: {
        readFile: function(path) { return q('file contents');},
        execDart2JS: function(dir, mainDart, checkedMode) {
          dart2JsCalls.push(mainDart);
          checkedModeCalls.push(checkedMode);
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
      expect(checkedModeCalls).toEqual([true]); // checked by default
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


  it('should support dart2js options', function(done) {
    opts.dart2jsCheckedMode = false;
    runner.runner(opts)({
      changed: true,
      dir: 'baseDir/',
      mainDart: ['main2.dart']
    }).then(function(js) {
      expect(js).toEqual('file contents');
      expect(dart2JsCalls).toEqual(['main2.dart']);
      expect(checkedModeCalls).toEqual([false]);
    }).then(done);
  });
});
