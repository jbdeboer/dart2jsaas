
var opts = {
  fetcherBaseUrl: 'http://localhost:9876/base/'
};

require('./lib/index.js').setupSystem(opts)('__adapter_dart_unittest.dart').then(console.log);
