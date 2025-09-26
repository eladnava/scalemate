var co = require('co');
var log = require('npmlog');
var AWS = require('aws-sdk');

function Scalemate(config) {
    // Make sure config was passed in
    if (!config) {
        throw new Error('Please provide a valid config file to use Scalemate.');
    }

    // Save config for later
    this.config = config;

    // Configure AWS SDK with credentials
    AWS.config.update(config.credentials);

    // Initialize CloudWatch client with 60 retry attempts and longer base backoff (3s - 10s)
    this.cloudwatch = new AWS.CloudWatch({ maxRetries: 60, retryDelayOptions: { base: Math.floor(Math.random() * (10000 - 3000 + 1) + 3000) } });

    // Retry on throttling
    AWS.events.on('retry', function (resp) {
        if (resp.error && resp.error.code === 'Throttling') {
            resp.error.retryable = true;
        }
    });

    // Metrics array
    this.metrics = [];

    // Traverse metrics in config file
    for (var metricName in config.metrics) {
        // Get metric by key
        var metric = config.metrics[metricName];

        // Disabled?
        if (!metric.enabled) {
            continue;
        }

        // Load and cache metric value getter function
        metric.value = require('../metrics/' + metricName);

        // Save metric for later
        this.metrics.push(metric);
    }
}

Scalemate.prototype.publishMetrics = function () {
    // Make class instance available inside generator
    var that = this;

    // Magical ES6 generator wrapper
    co(function* () {
        try {
            // Traverse loaded metrics
            for (var metric of that.metrics) {
                // Run metric value getter function
                var value = yield metric.value();

                // Only once-per-minute storage resolution is supported for now (to account for drift)
                var storageResolution = 60;

                // Prepare CloudWatch metric
                var awsMetric = {
                    Namespace: 'Scalemate',
                    MetricData: [
                        {
                            Value: value,
                            Unit: metric.unit,
                            Timestamp: new Date(),
                            MetricName: metric.name,
                            StorageResolution: storageResolution,
                            Dimensions: [
                                {
                                    Name: that.config.namespace,
                                    Value: that.config.namespace
                                },
                            ]
                        }
                    ]
                };

                // Publish metric to CloudWatch
                yield putMetricData(that.cloudwatch, awsMetric);

                // Log successful metric publish
                log.info('scalemate', `${new Date().toISOString()} ${metric.name}: ${value}`);
            }
        }
        catch (err) {
            // Log exception
            log.error('scalemate', err);
        }
        finally {
            // Schedule again
            scheduleNextRun.bind(that)();
        }
    });
};

// Expose CloudWatch putMetricData and wrap in retry
function putMetricData (cloudwatch, metric) {
    return new Promise(function (resolve, reject) {
        // Recursive error handler
        var handleErr = function (err) {
            // Failed?
            if (err && err.code === 'Throttling') {
                // Retry in 3 - 10 seconds
                setTimeout(function () { cloudwatch.putMetricData(metric).promise().then(resolve).catch(handleErr) }, Math.floor(Math.random() * (10000 - 3000 + 1) + 3000));
            }
            else {
                // Failed for another reason
                reject(err);
            }
        };
        
        // Try to post metric to CloudWatch
        cloudwatch.putMetricData(metric).promise().then(resolve).catch(handleErr);
    });
}

function scheduleNextRun() {
    // Calculate next run time
    var nextRunTime = new Date();
    
    // Get the current time in milliseconds
    var currentMilliseconds = nextRunTime.getTime();

    // Run every 30th second of every minute (schedule for next minute)
    nextRunTime.setMinutes(nextRunTime.getMinutes() + 1);
    nextRunTime.setSeconds(30, 0);
  
    // Calculate difference in miliseconds between now and then
    var timeUntilNextRun = nextRunTime.getTime() - currentMilliseconds;
  
    // Use setTimeout instead of setInterval to account for drift
    setTimeout(Scalemate.prototype.publishMetrics.bind(this), timeUntilNextRun);
};

Scalemate.prototype.start = function () {
    // No metrics?
    if (this.metrics.length === 0) {
        // Log exception
        return log.error('scalemate', 'Please configure and enable at least one metric to use Scalemate.');
    }

    // Start publishing metrics
    this.publishMetrics();
};

// Expose the class
module.exports = Scalemate;