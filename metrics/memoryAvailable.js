var exec = require('child_process').exec;

module.exports = function () {
    // Promise API
    return new Promise(function (resolve, reject) {
        // Execute the 'free -m' command to get memory usage in megabytes
        exec('free -m', function (error, stdout, stderr) {
            // Error thrown?
            if (error) {
                return reject(new Error(`Error executing command: ${error.message}`));
            }

            // Error output?
            if (stderr) {
                return reject(new Error(`Error output: ${stderr}`));
            }

            // Parse the output to get specific memory details
            var lines = stdout.split('\n');
            var memLine = lines[1].split(/\s+/);

            // Available memory is the 6th element in the array
            var availableMemory = parseInt(memLine[6]);

            // Resolve promise with available memory
            resolve(availableMemory);
        });
    });
}