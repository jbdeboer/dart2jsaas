var fetcher = require('../lib/fetch.js');
var q = require('q');



describe('dart fetcher', function() {
  var opts;

  function mockHttp(urls) {
    return {
      getUrl: function(path) {
        for (var url in urls) {
          if (path == opts.fetcherBaseUrl + url) {
            return q(urls[url]);
          }
        }
        throw "Unexpected url: " + path;
      }
    };
  }

  beforeEach(function() {
    opts = {
      fetcherBaseUrl: 'http://localhost:9867/base/'
    };
  });

  it('should fetch a url with no imports', function(done) {
    opts.http = mockHttp({'noimports.dart': 'no imports content'});

    return fetcher.dartFileFetcher(opts)('noimports.dart')
        .then(function(response) {
      expect(response).toEqual([{
        path: 'noimports.dart',
        content: 'no imports content'
      }]);
      done();
    });
  });


  it('should fetch a url with imports', function(done) {
    var b = opts.fetcherBaseUrl;
    opts.http = mockHttp({
      'a.dart': 'import "b.dart";\na content',
      'b.dart': 'b content'
    });

    return fetcher.dartFileFetcher(opts)('a.dart')
        .then(function(response) {
      expect(response).toEqual([{
        path: 'a.dart',
        content: 'import "b.dart";\na content'
      }, {
        path: 'b.dart',
        content: 'b content'
      }]);
      done();
    });
  });

  describe('imported files', function() {
    var imf = fetcher.importedFiles;
    it('should find a simple import', function() {
      expect(imf('import "b.dart";')).toEqual(['b.dart']);
    });


    it('should find an import with as', function() {
      expect(imf('import "/base/test/_http.dart" as test_0;'))
          .toEqual(['/base/test/_http.dart']);
    });
  });
});


