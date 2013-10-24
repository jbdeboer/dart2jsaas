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
        return q.reject("Unexpected url: " + path);
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


  it('should return the dart file as a mainDart', function(done) {
    opts.http = mockHttp({'b.dart': 'no imports content'});

    fetcher.dartFileFetcher(opts)('b.dart').then(function(r) {
      expect(r.mainDart).toEqual(['b.dart']);
    }).then(done);
  });


  it('should return the dart file with packages as a mainDart', function(done) {
    opts.http = mockHttp({
      'b/b.dart': 'import "package:x/yy.dart";',
      'packages/x/yy.dart': 'no imports'});

    fetcher.dartFileFetcher(opts)('b/b.dart').then(function(r) {
      expect(r.mainDart).toEqual(['b/b.dart']);
      expect(r.files.map(function(x) { return x.path; })).toEqual(['b/b.dart', 'packages/x/yy.dart']);
    }).then(done, done);
  });


  it('should return dart files included in html', function(done) {
    opts.http = mockHttp({'b.html':
        '<script src="b.dart"></script>' +
        '<script src="c.dart"></script>',
      'b.dart': 'no imports',
      'c.dart': 'no imports'});

    fetcher.dartFileFetcher(opts)('b.html').then(function(r) {
      expect(r.mainDart).toEqual(['b.dart', 'c.dart']);
      expect(r.files).toEqual([
          {
            path: 'b.html',
            content: '<script src="b.dart"></script><script src="c.dart"></script>'
          }, {
            path : 'b.dart',
            content : 'no imports'
          }, {
            path : 'c.dart',
            content : 'no imports'
          }]);
    }).then(done);
  });


  it('should return dart files with packages included in html', function(done) {
    opts.http = mockHttp({'c/b.html':
        '<script src="b/b.dart"></script>' +
            '<script src="c.dart"></script>',
      'c/b/b.dart': 'import "package:x/y.dart";',
      'c/c.dart': 'no imports',
      'c/packages/x/y.dart': 'no imports'});

    fetcher.dartFileFetcher(opts)('c/b.html').then(function(r) {
      expect(r.mainDart).toEqual(['b/b.dart', 'c.dart']);
      expect(r.files.map(function(x) { return x.path; })).toEqual(['c/b.html', 'c/b/b.dart', 'c/c.dart', 'c/packages/x/y.dart']);
    }).then(done, done);
  });



  it('should not return imported dart files as mainDart', function(done) {
    opts.http = mockHttp({
      'b.dart': 'import "c.dart',
      'c.dart': 'no imports'});

    fetcher.dartFileFetcher(opts)('b.dart').then(function(r) {
      expect(r.mainDart).toEqual(['b.dart']);
    }).then(done);
  });


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
        path: 'abs/base/dodo.dart',
        content: 'dodo content'
      }]);
    }).then(done);
  });


  it('should fetch a relative url with subdirectories', function(done) {
    opts.http = mockHttp({
      'http://localhost:9876/base/one/two.dart': 'two two two'
    });
    f('one/two.dart').then(function(r) {
      expect(r).toEqual([{
        path: 'one/two.dart',
        content: 'two two two'
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
      'x/a.dart': 'import "y/b.dart";\na content',
      'x/y/b.dart': 'b content'
    });

    f('x/a.dart').then(function(response) {
      expect(response).toEqual([{
        path: 'x/a.dart',
        content: 'import "y/b.dart";\na content'
      }, {
        path: 'x/y/b.dart',
        content: 'b content'
      }]);

    }).then(done);
  });


  it('should respect .. when importing', function(done) {
    opts.http = mockHttp({
      'main.dart': 'import "x/a.dart";\n',
      'x/a.dart': 'import "../b.dart";\na content',
      'b.dart': 'b content'
    });

    f('main.dart').then(function(response) {
      expect(response).toEqual([
        {
          path: 'main.dart',
          content: 'import "x/a.dart";\n'
        },
        {
          path: 'x/a.dart',
          content: 'import "../b.dart";\na content'
        }, {
          path: 'b.dart',
          content: 'b content'
        }
      ]);
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

  describe('dart imported files', function() {
    var imf = fetcher.importFor('some.dart');

    it('should find a simple import', function() {
      expect(imf('import "b.dart";').files).toEqual(['b.dart']);
    });


    it('should find an import with as', function() {
      expect(imf('import "base/test/_http.dart" as test_0;').files)
          .toEqual(['base/test/_http.dart']);
    });


    it('should ignore dart: imports', function() {
      expect(imf('import "dart:async";').files).toEqual([]);
    });


    it('should understand package imports', function() {
      expect(imf('import "package:foo/bar.dart";').files)
          .toEqual(['packages/foo/bar.dart']);
    });


    it('should understand parts', function() {
      expect(imf('part "foo.dart";').files).toEqual(['foo.dart']);
    });
  });


  describe('html imported files', function() {
    var imf = fetcher.importFor('some.html');

    it('should parse script tags', function() {
      var c = '<script src="hello.js"></script>';
      var r = imf(c);
      expect(r.files).toEqual(['hello.js']);
      expect(r.content).toEqual(c);
    });


    it('should parse link tags', function() {
      var c = '<link href="hello.css">';
      var r = imf(c);
      expect(r.files).toEqual(['hello.css']);
      expect(r.content).toEqual(c);
    });


    it('should parse absolute urls', function() {
      var c = '<script src="/hello.js"></script>';
      var r = imf(c);
      expect(r.files).toEqual(['/hello.js']);
      expect(r.content).toEqual('<script src="abs/hello.js"></script>');
    });


    it('should parse wildcard protocol urls', function () {
      var c = '<script src="//google.com/hello.js"></script>';
      var r = imf(c);
      expect(r.files).toEqual(['//google.com/hello.js']);
      expect(r.content).toEqual('<script src="global/google.com/hello.js"></script>');
    });


    it('should parse fully qualified urls', function() {

    });
  });
});


