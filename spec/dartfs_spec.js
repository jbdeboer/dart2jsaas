var dartfs = require('../lib/dartfs.js');


describe('dart filesystem', function() {
  it('should update the filesystem', function(done) {
    dartfs.dartFs({})([]).then(function(updated) {
      done();
    });
  })
});
