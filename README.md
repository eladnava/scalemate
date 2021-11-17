# scalemate
[![npm version](https://badge.fury.io/js/scalemate.svg)](https://www.npmjs.com/package/scalemate)

A Node.js package that scales your application servers by publishing custom CloudWatch metrics which are not available by default, such as:

* Memory Available - amount of system memory available
* Sockets Used - number of open client/server connections

Scalemate supports per-second metric resolution and defaults to per-minute.

## Usage

First, install the package using npm:

```shell
npm install -g scalemate
```

Then, create a file called `config.js` and paste the following inside it:

```js
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
```

Modify the configuration file according to your own needs, enabling or disabling metrics and configuring the following parameters:

* `namespace` - the name of your app or server cluster
* `credentials` - an AWS IAM user with read/write access to CloudWatch

---

Test the configuration by running:

```js
scalemate
```

Observe the terminal output for any initial errors and for successfully-published metrics. If no errors are emitted, you have successfully configured Scalemate. 

Visit the CloudWatch console and find the published metrics under the Scalemate namespace:
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#

You can now configure CloudWatch alarms to scale your EC2 instances up or down based on these metrics.

---

Leave the tool running on a remote server by executing the following command:

```bash
scalemate > ~/scalemate.log &
```

To start Scalemate automatically after system reboots, add the following to your user's `crontab`:

```
@reboot scalemate -c /path/to/config.js > ~/scalemate.log &
```

## License

Apache 2.0
