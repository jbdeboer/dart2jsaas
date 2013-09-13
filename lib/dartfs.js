var q = require('q');

var random = function() {
  return Math.round(Math.random() * 10000);
};


function dartFs(opts) {
  var TEMP_DIR = process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';

  var dir = TEMP_DIR + "/dart2jsaas-" + random();

  return function(dartFiles) {
    for (var f in dartFiles) {
      console.log(dartFiles[f].path);
    }
    return q(true);
  }
}

module.exports = {
  dartFs: dartFs
};
