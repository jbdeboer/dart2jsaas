var q = require('q');
var url = require('url');
var fetchModule = require('./fetch.js');
var dartFsModule = require('./dartfs.js');
var dart2jsRunnerModule = require('./dart2js_runner.js');
var zipfileModule = require('./zipfile.js');

// Util classes
var hr = require('./http_request.js');
var fileOps = require('./file_ops.js');

function endsWith(haystack, needle) {
  if (haystack.length < needle.length) return false;

  var index = haystack.indexOf(needle);
  return index == (haystack.length - needle.length);
}


function setupSystem(opts) {
  opts.http = opts['http'] || hr;
  opts.fileOps = opts['fileOps'] || fileOps;

  var fetcher = fetchModule.dartFileFetcher(opts);
  var dartFs = dartFsModule.dartFs(opts);
  var dart2jsRunner = dart2jsRunnerModule.runner(opts);
  var zipfile = zipfileModule.runner(opts);

  return function(path, headers, baseUrl) {
    var returnSnapshot = endsWith(path, ".html");

    console.log('running for ' + path);
    var startTime = new Date();
    var dartFsResult;
    var dartFsPromise = fetcher(path, headers, baseUrl)
        .then(dartFs);

    return dartFsPromise.then(dart2jsRunner)
        .then(function (dart2jsContent) {
          if (returnSnapshot) {
            return dartFsPromise.then(zipfile);
          }
          return dart2jsContent;
        }).then(function (c) {  // c will be either a tarball or a js file.
          console.log('finished dart2js for ' + path + ' in ' +
              (new Date() - startTime) + 'ms');
          return c;
        });
  }
}


// MIDDLEWARE
function endpoints(dart2jsaas_opts) {
var compiler = setupSystem(dart2jsaas_opts);

var dart2JsEndpoint = function(req, res, next) {
  var path = url.parse(req.url).pathname;
  if (!endsWith(path, '.dart.js')) {
    next();
    return;
  }
  console.log('dart.js url:'+ path);

  // Strip the leading /
  dartFile = /\/(.*\.dart)\.js/.exec(path)[1];


  var headers = {
    "cookie": req.headers.cookie
  };

  var baseUrl = dart2jsaas_opts.fetcherBaseUrl;
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
};

var snapshotEndpoint = function(req, res, next) {
  if (req.url.indexOf('/snapshot/') != 0) {
    next();
    return;
  }

  var parsedUrl = url.parse(req.url);
  var pathName = parsedUrl.pathname;

  if (!endsWith(pathName, '.snapshot.zip')) {
    parsedUrl.pathname = pathName + '.snapshot.zip';

    res.writeHead(301, {
      'Location': url.format(parsedUrl)
    });
    res.end();
    return;
  }

  var origUrl = /\/snapshot\/(.*)\.snapshot\.zip/.exec(pathName)[1];

  var headers = {
    "cookie": req.headers.cookie
  };

  // If the html file is in a subdirectory, we need to update
  // the fetcherBaseUrl.
  var baseUrl = dart2jsaas_opts.fetcherBaseUrl;
  if (origUrl.indexOf('/') != -1 && origUrl.indexOf('/') != 0) {
    var split = /(.*)\/(.*)/.exec(origUrl);
    baseUrl = baseUrl + split[1] + '/';
    origUrl = split[2];

  }

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
};

  return {
    'dart2js': dart2JsEndpoint,
    'snapshot': snapshotEndpoint
  }
}

module.exports = {
  setupSystem: setupSystem,
  endpoints: endpoints
};
