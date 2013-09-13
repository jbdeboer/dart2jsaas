// I'm sure this has already been done before...

var http = require('http');
var q = require('q');

function getUrl(url) {
  var data = [];
  var d = q.defer();
  var request = http.get(url, function(response) {
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
