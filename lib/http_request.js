// I'm sure this has already been done before...

var http = require('http');
var urlModule = require('url');
var q = require('q');

function getUrl(url, headers) {
  console.log('Getting url: ' + url);
  var data = [];
  var d = q.defer();
  var options = urlModule.parse(url);
  options.headers = headers;
  var request = http.get(options, function(response) {
    response.on('data', function(incoming) {
      data.push(incoming);
    });
    response.on('end', function() {
      if (response.statusCode == 302 || response.statusCode == 301) {
        getUrl(urlModule.resolve(url, response.headers['location']), headers)
            .then(function(x) { d.resolve(x); });
      } else {
        d.resolve(data.join(''));
      }
    });
  });

  request.on('error', function(e) {
    console.log(e + ' get url: ' + url);
    throw e;
  });
  return d.promise;
}

module.exports = {
  getUrl: getUrl
};
