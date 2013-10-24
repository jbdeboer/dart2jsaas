var q = require('q');

function endsWith(haystack, needle) {
  var index = haystack.indexOf(needle);
  return index == haystack.length - needle.length;
}

function importFor(path) {
  if (endsWith(path, '.dart')) return dartImportedFiles;
  if (endsWith(path, '.html')) return htmlImportedFiles;
  return noopFiles;
}

var SRC_ATTR = /src="([^"]*)"/;
var LINK_HREF = /<link[^>]*\shref="([^"]*)"/;
function rewrite_link(url) {
  if (url[0] == '/') {
    if (url[1] == '/') {
      return 'global' + url.substr(1);
    }
    return 'abs' + url;
  }
  return url;
}

function noopFiles(content, subdir) {
  return {files:[]};
}

function htmlImportedFiles(content, subdir) {
  var files = [];
  var dartFiles = [];
  var loc;

  [SRC_ATTR, LINK_HREF].forEach(function(re) {
    var haystack = content;
    var rewrite = [];
    while ((loc = haystack.search(re)) != -1) {
      var re_result = re.exec(haystack);
      var ref = re_result[1];
      var update = re_result[0].replace(ref, rewrite_link(ref));
      content = content.replace(re_result[0], update);
      haystack = haystack.substr(loc + 1);
      if (endsWith(ref, ".dart")) {
        dartFiles.push(ref);
      }
      files.push((subdir || '') + ref);
    }
  });

  return {
    files: files,
    dartFiles: dartFiles,
    dartPackageRoot: (subdir || '') + 'packages/',
    content: content
  };
}

function dartImportedFiles(content, subdir, dartPackageRoot) {
  var packages = dartPackageRoot || 'packages/';
  var lines = content.split('\n');
  var files = [];

  lines.forEach(function(l) {
    var m = l.match(/^\s*(import|part|export) ["'](.*?)['"]/);
    if (m) {
      var importName = m[2];
      if (importName.match(/^dart:/)) return;
      var packageMatch = importName.match(/^package:(.*)/);
      if (packageMatch) {
        files.push(packages + packageMatch[1]);
        return;
      }
      if (importName[0] == '/') {
        console.log('Attempting to import an absolute Dart import: ' + importName);
      }
      files.push((subdir || '') + importName);
    }
  });
  return {files: files};
}

function dartFileFetcher(opts) {
  var http = opts.http;
  var baseUrl = opts.fetcherBaseUrl;
  // HACK: use a url splitting library
  var server = baseUrl.substr(0, 8) + baseUrl.substr(8).split('/')[0];

  return function(path, headers, rBaseUrl) {
    if (rBaseUrl) baseUrl = rBaseUrl;

    var d = q.defer();

    var fetchedPaths = {};
    var files = [];
    var mainDartFiles = []; // Any Dart files that will need to be compiled.

    if (endsWith(path, ".dart")) {
      mainDartFiles.push(path);
    }

    function getOneUrl(path, dartPackageRoot) {
      var oPath = path;
      var absUrl = path[0] == '/' ?
          (path[1] == '/' ? 'http:' + path : server + path) : baseUrl + path;

      // Collapse /../s in the url
      do {
        var dotdotMatch = absUrl.match(/(.*?)([^\/]*\/\.\.\/)(.*)/);
        if (!dotdotMatch) break;
        absUrl = dotdotMatch[1] + dotdotMatch[3];
      } while(true);

      path = absUrl.replace(baseUrl, '');

      var packageMatch = path.match(/^packages\/(.*?)\/(.*)/);
      if (oPath[0] == '/') {
        var filesystemPath = 'abs' + oPath;
        if (oPath[1] == '/') {
          filesystemPath = 'global' + oPath.substr(1);
        }
      } else {
        filesystemPath = path;
      }

      fetchedPaths[path] = true;

      return http.getUrl(absUrl, headers).then(function(content) {
        // Anything other imports?
        var waitingOn = [];
        var ourBaseUrl = absUrl.match(/.*\//)[0];
        var subDirectory = ourBaseUrl.replace(baseUrl, '');
        var importsAndContent = importFor(absUrl)(content, subDirectory, dartPackageRoot);

        importsAndContent.files.forEach(function(im) {
          if (fetchedPaths[im]) return;
          waitingOn.push(getOneUrl(im, importsAndContent.dartPackageRoot || dartPackageRoot));
        });

        if (importsAndContent.dartFiles) {
          mainDartFiles = mainDartFiles.concat(importsAndContent.dartFiles);
        }

        files.push({
          path: filesystemPath,
          content: importsAndContent.content || content
        });

        return q.allSettled(waitingOn);
      }, function(error) { console.log('error');});
    }

    getOneUrl(path).then(function() {
      d.resolve({
        files: files,
        mainDart: mainDartFiles
      });
    });

    return d.promise;
  }
}

module.exports = {
  dartFileFetcher: dartFileFetcher,
  importFor: importFor
};
