var hr = require('./lib/http_request.js');

var opts = {
  http: hr,
  fetcherBaseUrl: 'http://localhost:9876/base/'
};

require('./lib/dart2jsaas.js').setupSystem(opts)('__adapter_dart_unittest.dart').then(console.log);
