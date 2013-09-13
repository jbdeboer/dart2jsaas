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

  function f(path) {
    return fetcher.dartFileFetcher(opts)(path).then(function(o) {
      return o.files;
    });
  }

  it('should fetch a url with no imports', function(done) {
    opts.http = mockHttp({'noimports.dart': 'no imports content'});

    f('noimports.dart')
        .then(function(response) {
      expect(response).toEqual([{
        path: 'noimports.dart',
        content: 'no imports content'
      }]);
    }).then(done);
  });


  it('should fetch an absolute url', function(done) {
    opts.http = mockHttp({
      'http://localhost:9876/base/dodo.dart': 'dodo content'
    });
    f('/base/dodo.dart').then(function(r) {
      expect(r).toEqual([{
        path: 'dodo.dart',
        content: 'dodo content'
      }]);
    }).then(done);
  });


  it('should fetch a url with imports', function(done) {
    opts.http = mockHttp({
      'a.dart': 'import "b.dart";\na content',
      'b.dart': 'b content'
    });

    f('a.dart').then(function(response) {
      expect(response).toEqual([{
        path: 'a.dart',
        content: 'import "b.dart";\na content'
      }, {
        path: 'b.dart',
        content: 'b content'
      }]);
    }).then(done);
  });


  it('should respect directories when importing', function(done) {
    opts.http = mockHttp({
      'x/a.dart': 'import "b.dart";\na content',
      'x/b.dart': 'b content'
    });

    f('x/a.dart').then(function(response) {
      expect(response).toEqual([{
        path: 'x/a.dart',
        content: 'import "b.dart";\na content'
      }, {
        path: 'x/b.dart',
        content: 'b content'
      }]);

    }).then(done);
  });


  it('should respect .. when importing', function(done) {
    opts.http = mockHttp({
      'x/a.dart': 'import "../b.dart";\na content',
      'b.dart': 'b content'
    });

    f('x/a.dart').then(function(response) {
      expect(response).toEqual([{
        path: 'x/a.dart',
        content: 'import "../b.dart";\na content'
      }, {
        path: 'b.dart',
        content: 'b content'
      }]);
    }).then(done);
  });


  it('should load files within packages', function(done) {
    opts.http = mockHttp({
      'x/a.dart': 'import "package:y/b.dart";\na content',
      'packages/y/b.dart': 'import "c.dart"',
      'packages/y/c.dart': 'c content'
    });

    f('x/a.dart').then(function(response) {
      expect(response).toEqual([{
        path: 'x/a.dart',
        content: 'import "package:y/b.dart";\na content'
      }, {
        path: 'packages/y/b.dart',
        content: 'import "c.dart"'
      }, {
        path: 'packages/y/c.dart',
        content: 'c content'
      }]);

    }).then(done);
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


    it('should ignore dart: imports', function() {
      expect(imf('import "dart:async";')).toEqual([]);
    });


    it('should understand package imports', function() {
      expect(imf('import "package:foo/bar.dart";'))
          .toEqual(['packages/foo/bar.dart']);
    });


    it('should understand parts', function() {
      expect(imf('part "foo.dart";')).toEqual(['foo.dart']);
    });
  });
});


