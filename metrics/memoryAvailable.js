var os = require('os');

module.exports = function () {
    // Promise API
    return new Promise(function (resolve, reject) {
        // Get available system memory (in bytes) and convert to megabytes
        resolve(Math.round(os.freemem() / 1024 / 1024));
    });
}