var fetcher = require('../lib/fetch.js');


describe('dart fetcher', function() {
  it('should fetch a url', function() {
    fetcher.dartFileFetcher({})('http://localhost:9867/base/main.dart').then(function(response) {
      expect(response).toEqual([]);
    });
  })
});
