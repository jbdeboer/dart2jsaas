var connect = require('connect');
var http = require('http');
var dart2jsaas = require('./lib/index.js');
var http_request = require('./lib/http_request.js');

var playback = require('./lib/playback.js');

var opts = {
  fetcherBaseUrl: 'http://localhost:3000/'
};

var compiler = dart2jsaas.setupSystem(opts);

function endsWith(haystack, needle) {
  var index = haystack.indexOf(needle);
  return index == haystack.length - needle.length;
}

var play = playback.playback();

var app = connect()
    .use(function(req, res, next) {
      var url = /^([^\?]*)/.exec(req.url)[1];
      if (!endsWith(url, '.dart.js')) {
        next();
        return;
      }

      // Strip the leading /
      dartFile = /\/(.*\.dart)\.js/.exec(url)[1];


      var headers = {
        "cookie": req.headers.cookie
      };

      var baseUrl = opts.fetcherBaseUrl;
      if (dartFile.indexOf('/') != -1 && dartFile.indexOf('/') != 0) {
        var split = /(.*)\/(.*)/.exec(dartFile);
        baseUrl = baseUrl + split[1] + '/';
        dartFile = split[2];

      }

      console.log('dart2js for ' + dartFile + ' at base:' + baseUrl);


      var sent = false;

      setTimeout(function() {
        if (sent) return;
        sent = true;
        res.writeHead(302, "Still waiting on dart2js", {
          'Location': req.url.indexOf('?') == -1 ? req.url + "?Dot" : req.url + "Dot"
        });
        res.end();
        console.log('Sent a 302');
      }, 20000);

      compiler(dartFile, headers, baseUrl).then(function(output) {
        if (sent) return;
        sent = true;

        if (!output) {
          res.writeHead(500, "dart2js did not produce a file");
          res.end();
          return;
        }

        res.writeHead(200, {
          'Content-Length': output.length
        });
        res.end(output, 'binary');
        console.log('Sent ' + output.length + ' bytes');
      });
    })
    .use(function(req, res, next) {
      if (req.url.indexOf('/snapshot/') != 0) {
        next();
        return;
      }

      if (!endsWith(req.url, '.snapshot.zip')) {
        res.writeHead(301, {
          'Location': req.url + '.snapshot.zip'
        });
        res.end();
        return;
      }

      var origUrl = /\/snapshot\/(.*)\.snapshot\.zip/.exec(req.url)[1];

      var headers = {
        "cookie": req.headers.cookie
      };

      var baseUrl = opts.fetcherBaseUrl;
      if (origUrl.indexOf('/') != -1 && origUrl.indexOf('/') != 0) {
        var split = /(.*)\/(.*)/.exec(origUrl);
        baseUrl = baseUrl + split[1] + '/';
        origUrl = split[2];

      }

      console.log('snapshoting ' + origUrl);
      compiler(origUrl, headers, baseUrl)
          .then(function(output) {

            // Parse out all the
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Length': output.length
            });
            res.end(output, 'binary');
          }).then(function() {}, function(e) {
            console.log('error from compiler:' + e);
            console.log(e.stack);
          });
    })
    .use(function(req, res, next) {
      if (req.url.indexOf('/record') != 0) {
        next();
        return;
      }

      if (req.method == 'POST') {
        var body = '';
        req.on('data', function(data) {
          body += data;
        });
        req.on('end', function() {
          console.log('data:' + body);
          var parsedBody = JSON.parse(body);
          play.record(parsedBody.key, parsedBody.data);
          res.writeHead(200);
          res.end();
        });
      } else if (req.method == 'GET') {
        var data = play.playback();
        res.writeHead(200, {
          'Content-Type': 'application/dart',
          'Content-Length': data.length
        });
        res.end(data);
      }
    })
    .use(function(req, res, next) {
      if (req.url.indexOf('/todos') != 0) {
        next();
        return;
      }
      var data = JSON.stringify([
        {text: 'Done from server', done: true},
        {text: 'Not done from server', done: false}
      ]);

      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': data.length
      });
      res.end(data);
    })
    .use(connect.static('/home/deboer/github/angular-dart/'))
    .use(function(req, res, next) {
      console.log('Unknown: ' + req.url);
      res.writeHead(404);
      res.end();
    });

connect.createServer(app).listen(3000);

console.log('Listening on port 3000');
