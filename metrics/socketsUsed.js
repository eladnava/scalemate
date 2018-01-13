var sockstat = require('sockstat');

module.exports = function () {
    // Promise API
    return new Promise(function (resolve, reject) {
        // Get current sockstat info
        sockstat.get()
            .then(function (stats) {
                // Resolve promise with sockets used count
                resolve(stats.sockets.used);
            })
            .catch(function (err) {
                // Reject promise with error
                reject(err);
            });
    });
}