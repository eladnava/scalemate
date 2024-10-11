var exec = require('child_process').exec;

module.exports = function () {
    // Promise API
    return new Promise(function (resolve, reject) {
        // Execute the 'cat /proc/meminfo' command to get memory available in kB
        exec('cat /proc/meminfo | grep MemAvailable', function (error, stdout, stderr) {
            // Error thrown?
            if (error) {
                return reject(new Error(`Error executing command: ${error.message}`));
            }

            // Error output?
            if (stderr) {
                return reject(new Error(`Error output: ${stderr}`));
            }

            // Parse the output to get specific memory details
            var result = stdout.split(/\s+/);

            // Available memory is the 2nd element in the array
            var availableMemory = parseInt(result[1]);

            // Convert kB to MB
            availableMemory = Math.ceil(availableMemory / 1024);

            // Resolve promise with available memory
            resolve(availableMemory);
        });
    });
}