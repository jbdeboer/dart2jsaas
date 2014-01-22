var dartfs = require('../lib/dartfs.js');
var q = require('q');

describe('dart filesystem', function() {
  it('should update the filesystem', function(done) {
    dartfs.dartFs({
      fileOps: {
        execDartVersion: function() {
          return q("dev version");
        }
      }
    })({files: []}).then(function(updated) {
      done();
    }).done();
  })
});
