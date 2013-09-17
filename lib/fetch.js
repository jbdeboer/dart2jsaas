var q = require('q');

function importedFiles(content, subdir) {
  var lines = content.split('\n');
  var files = [];
  lines.forEach(function(l) {
    var m = l.match(/^\s*(import|part|export) ["'](.*?)['"]/);
    if (m) {
      var importName = m[2];
      if (importName.match(/^dart:/)) return;
      var packageMatch = importName.match(/^package:(.*)/);
      if (packageMatch) {
        files.push('packages/' + packageMatch[1]);
        return;
      }
      files.push((subdir || '') + importName);
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

      // Collapse /../s in the url
      do {
        var dotdotMatch = absUrl.match(/(.*?)([^\/]*\/\.\.\/)(.*)/);
        if (!dotdotMatch) break;
        absUrl = dotdotMatch[1] + dotdotMatch[3];
      } while(true);

      path = absUrl.replace(baseUrl, '');

      var packageMatch = path.match(/^packages\/(.*?)\/(.*)/);
      if (false && packageMatch) {
        var filesystemPath = 'packages/' + packageMatch[1] + '/lib/' + packageMatch[2];
      } else {
        filesystemPath = path;
      }

      //console.log('getting url: ' + path + ' :: ' + oPath);
      fetchedPaths[path] = true;

      return http.getUrl(absUrl).then(function(content) {
        files.push({
          path: filesystemPath,
          content: content
        });

        // Anything other imports?
        var waitingOn = [];
        var ourBaseUrl = absUrl.match(/.*\//)[0];
        var subDirectory = ourBaseUrl.replace(baseUrl, '');
        importedFiles(content, subDirectory).forEach(function(im) {
          if (fetchedPaths[im]) return;
          waitingOn.push(getOneUrl(im));
        });
        return q.allSettled(waitingOn);
      }, function(error) { console.log('error');});
    }

    getOneUrl(path).then(function() {
      d.resolve({
        files: files,
        mainDart: path
      });
    });

    return d.promise;
  }
}

module.exports = {
  dartFileFetcher: dartFileFetcher,
  importedFiles: importedFiles
};
