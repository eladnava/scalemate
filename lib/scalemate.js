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

    // Initialize CloudWatch client
    this.cloudwatch = new AWS.CloudWatch();

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

                // Set storage resolution to 1 for per-second metrics, otherwise, 60 (default value)
                var storageResolution = that.config.interval < 60 ? 1 : 60;

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
                yield that.cloudwatch.putMetricData(awsMetric).promise();

                // Log successful metric publish
                log.info('scalemate', `${new Date()} ${metric.name}: ${value}`);
            }
        }
        catch (err) {
            // Log exception
            log.error('scalemate', err);
        }
    });
};

Scalemate.prototype.start = function () {
    // No metrics?
    if (this.metrics.length === 0) {
        // Log exception
        return log.error('scalemate', 'Please configure and enable at least one metric to use Scalemate.');
    }

    // Schedule repeated metric publish
    setInterval(this.publishMetrics.bind(this), this.config.interval * 1000);

    // Start publishing metrics
    this.publishMetrics();
};

// Expose the class
module.exports = Scalemate;