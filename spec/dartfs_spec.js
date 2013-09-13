var dartfs = require('../lib/dartfs.js');


describe('dart filesystem', function() {
  it('should update the filesystem', function() {
    dartfs.dartFs({})([]).then(function(updated) {
      expect(updated).toEqual(true);
    });
  })
});
