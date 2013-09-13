var q = require('q');

function runner(opts) {
  return function(updated) {
    return q('some js');
  }
}

module.exports = {
  runner: runner
};
