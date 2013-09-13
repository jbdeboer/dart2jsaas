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
  // HACK: use a url splitting library
  var server = baseUrl.substr(0, 8) + baseUrl.substr(8).split('/')[0];

  return function(path) {
    var d = q.defer();

    var fetchedPaths = {};
    var files = [];

    function getOneUrl(path) {
      var oPath = path;
      var absUrl = path[0] == '/' ? server + path : baseUrl + path;
      path = absUrl.replace(baseUrl, '');

      console.log('getting url: ' + path + ' :: ' + oPath);
      fetchedPaths[path] = true;

      return http.getUrl(absUrl).then(function(content) {
        files.push({
          path: path,
          content: content
        });

        // Anything other imports?
        var waitingOn = [];
        var ourBaseUrl = absUrl.match(/.*\//)[0];
        var subDirectory = ourBaseUrl.replace(baseUrl, '');
        importedFiles(content).forEach(function(c) {
          var relPath = subDirectory + c
          if (fetchedPaths[relPath]) return;
          waitingOn.push(getOneUrl(relPath));
        });
        return q.allResolved(waitingOn);
      }, function(error) { console.log('error');});
    }

    getOneUrl(path).then(function() {
      for (var f in files) { console.log(files[f].path, files[f].content.substr(0,10)); }
      d.resolve(files);
    });

    return d.promise;
  }
}

module.exports = {
  dartFileFetcher: dartFileFetcher,
  importedFiles: importedFiles
};
