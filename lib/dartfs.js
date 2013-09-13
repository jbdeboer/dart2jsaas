var q = require('q');

function dartFs(opts) {
  return function(path) {
    return q(true);
  }
}

module.exports = {
  dartFs: dartFs
};
