// I'm sure this has already been done before...

var http = require('http');
var urlParse = require('url').parse;
var q = require('q');

function getUrl(url, headers) {
  var data = [];
  var d = q.defer();
  var options = urlParse(url);
  options.headers = headers;
  var request = http.get(options, function(response) {
    response.on('data', function(incoming) {
      data.push(incoming);
    });
    response.on('end', function() {
      d.resolve(data.join(''));
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
