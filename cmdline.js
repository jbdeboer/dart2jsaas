
var opts = {
fetcherBaseUrl: 'http://localhost:3000/'
};

require('./lib/index.js').setupSystem(opts)('main.dart').then(console.log);
