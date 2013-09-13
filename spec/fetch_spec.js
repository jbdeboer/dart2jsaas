var fetcher = require('../lib/fetch.js');
var q = require('q');



describe('dart fetcher', function() {
  var opts;

  beforeEach(function() {
    opts = {
      fetcherBaseUrl: 'http://localhost:9867/base/'
    };
  });

  it('should fetch a url with no imports', function(done) {
    opts.http = {
      getUrl: function(path) {
        expect(path).toEqual(opts.fetcherBaseUrl + 'noimports.dart');
        return q('no imports content');
      }
    };

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
    opts.http = {
      getUrl: function(path) {
        if (path == b + 'a.dart') {
          return q('import "b.dart";\na content');
        }
        if (path == b + 'b.dart') {
          return q('b content');
        }
        throw "Unexpected path:" + path;
      }
    };

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


