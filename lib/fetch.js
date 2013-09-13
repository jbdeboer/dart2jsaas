var q = require('q');

function dartFileFetcher(opts) {
  return function(path) {
    return q([]);
  }
}

module.exports = {
  dartFileFetcher: dartFileFetcher
};
