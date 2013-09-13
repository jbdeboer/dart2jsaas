var q = require('q');

function importedFiles(content) {
  var lines = content.split('\n');
  var files = [];
  lines.forEach(function(l) {
    var m = l.match(/^\s*import ["'](.*?)['"]/);
    if (m) {
      files.push(m[1]);
    }
  });
  return files;
}

function dartFileFetcher(opts) {
  var http = opts.http;
  var baseUrl = opts.fetcherBaseUrl;
  var server = baseUrl.split('/')[0];

  return function(path) {
    var d = q.defer();

    var fetchedPaths = {};
    var files = [];

    function getOneUrl(path) {

      console.log('getting url: ' + path);
      return http.getUrl(baseUrl + path).then(function(content) {
        files.push({
          path: path,
          content: content
        });
        fetchedPaths[path] = true;

        // Anything other imports?
        var waitingOn = [];
        importedFiles(content).forEach(function(c) {
          if (fetchedPaths[c]) return;
          waitingOn.push(getOneUrl(c));
        });
        return q.allResolved(waitingOn);
      }, function(error) { console.log('error');});
    }

    getOneUrl(path).then(function() {
      console.log(files);
      d.resolve(files);
    });

    return d.promise;
  }
}

module.exports = {
  dartFileFetcher: dartFileFetcher,
  importedFiles: importedFiles
};
