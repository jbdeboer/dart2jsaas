var runner = require('../lib/zipfile.js');
var q = require('q');


describe('zipfile runner', function() {
  var opts;
  var zipCalls;

  beforeEach(function() {
    zipCalls = [];
    opts = {
      fileOps: {
        readFile: function(path) { return q('file contents');},
        execZip: function(parent, dir) {
          zipCalls.push({parent: parent, dir: dir});
          return q('zipfile');
        }
      }
    }
  });

  it('should run zip', function(done) {
    runner.runner(opts)({
      changed: true,
      dir: '/tmp/baseDir/'
    }).then(function(zip) {
      expect(zip).toEqual('file contents');
      expect(zipCalls).toEqual([{parent: '/tmp/', dir: 'baseDir'}]);
    }).then(done);
  });

  it('should run zip without trailing slash', function(done) {
    runner.runner(opts)({
      changed: true,
      dir: '/tmp/baseDir'
    }).then(function(zip) {
          expect(zip).toEqual('file contents');
          expect(zipCalls).toEqual([{parent: '/tmp/', dir: 'baseDir'}]);
        }).then(done);
  });
});
