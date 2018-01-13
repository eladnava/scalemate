module.exports = {
    // Metrics to publish
    metrics: {
        // Number of open socket connections
        socketsUsed: {
            // Whether to publish this metric
            enabled: true,
            // CloudWatch unit type
            unit: 'Count',
            // CloudWatch metric title
            name: 'Sockets Used'
        },
        // Number of megabytes of system memory currently available
        memoryAvailable: {
            // Whether to publish this metric
            enabled: true,
            // CloudWatch unit type
            unit: 'Count',
            // CloudWatch metric title
            name: 'Memory Available'
        }
    },
    // Metric interval (in seconds)
    interval: 60,
    // CloudWatch namespace to associate metrics with
    namespace: 'MyApp',
    // AWS IAM user with CloudWatch read/write access
    credentials: {
        region: 'us-east-1',
        accessKeyId: 'ABCDEFG',
        secretAccessKey: 'ABCDEFGHIJK/HIJKLMNOPQRS'
    }
};