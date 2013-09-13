var fetcher = require('../lib/fetch.js');
var q = require('q');

describe('dart fetcher', function() {
  var opts;

  function mockHttp(urls) {
    return {
      getUrl: function(path) {
        for (var url in urls) {
          if (path == opts.fetcherBaseUrl + url ||
              (url.substr(0,4) == "http" && path == url)) {
            return q(urls[url]);
          }
        }
        console.log('Unexpected url: ' + path);
        throw "Unexpected url: " + path;
      }
    };
  }

  beforeEach(function() {
    opts = {
      fetcherBaseUrl: 'http://localhost:9876/base/'
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


  it('should fetch an absolute url', function(done) {
    opts.http = mockHttp({
      'http://localhost:9876/base/dodo.dart': 'dodo content'
    });
    fetcher.dartFileFetcher(opts)('/base/dodo.dart').then(function(r) {
      expect(r).toEqual([{
        path: 'dodo.dart',
        content: 'dodo content'
      }]);
      done();
    });
  });


  it('should fetch a url with imports', function(done) {
    opts.http = mockHttp({
      'a.dart': 'import "b.dart";\na content',
      'b.dart': 'b content'
    });

    fetcher.dartFileFetcher(opts)('a.dart').then(function(response) {
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


  it('should respect directories when importing', function(done) {
    opts.http = mockHttp({
      'x/a.dart': 'import "b.dart";\na content',
      'x/b.dart': 'b content'
    });

    fetcher.dartFileFetcher(opts)('x/a.dart').then(function(response) {
      expect(response).toEqual([{
        path: 'x/a.dart',
        content: 'import "b.dart";\na content'
      }, {
        path: 'x/b.dart',
        content: 'b content'
      }]);

    }).then(done, console.log);
  });


  it('should respect .. when importing', function(done) {
    opts.http = mockHttp({
      'x/a.dart': 'import "../b.dart";\na content',
      'b.dart': 'b content'
    });

    fetcher.dartFileFetcher(opts)('x/a.dart').then(function(response) {
      expect(response).toEqual([{
        path: 'x/a.dart',
        content: 'import "../b.dart";\na content'
      }, {
        path: 'b.dart',
        content: 'b content'
      }]);

    }).then(done);
  });


  it('should load packages', function(done) {
    opts.http = mockHttp({
      'x/a.dart': 'import "package:y/b.dart";\na content',
      'packages/y/b.dart': 'b content'
    });

    fetcher.dartFileFetcher(opts)('x/a.dart').then(function(response) {
      expect(response).toEqual([{
        path: 'x/a.dart',
        content: 'import "package:y/b.dart";\na content'
      }, {
        path: 'packages/y/lib/b.dart',
        content: 'b content'
      }]);

    }).then(done);
  });

  describe('imported files', function() {
    var imf = function(p) {
      var paths = [];
      fetcher.importedFiles(p).forEach(function(pp) {
        paths.push(pp.serverPath);
      });
      return paths;
    };

    it('should find a simple import', function() {
      expect(imf('import "b.dart";')).toEqual(['b.dart']);
    });


    it('should find an import with as', function() {
      expect(imf('import "/base/test/_http.dart" as test_0;'))
          .toEqual(['/base/test/_http.dart']);
    });


    it('should ignore dart: imports', function() {
      expect(imf('import "dart:async";')).toEqual([]);
    });


    it('should understand package imports', function() {
      expect(fetcher.importedFiles('import "package:foo/bar.dart";'))
          .toEqual([{
            serverPath: 'packages/foo/bar.dart',
            filesystemPath: 'packages/foo/lib/bar.dart'
          }]);
    })
  });
});


