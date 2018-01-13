#!/usr/bin/env node
var path = require('path');
var log = require('npmlog');
var program = require('commander');
var Scalemate = require('./lib/scalemate');

// Define CLI arguments and options
program
    .version('1.0.0')
    .option('-c, --config <path>', 'provide a custom path to the scalemate config file')
    .parse(process.argv);

// Determine absolute path to config file
var configPath = path.resolve(program.config || 'config.js');

// Log config file path
log.info('scalemate', 'Initializing using the following config file: ' + configPath);

// Attempt to load config file
var config = require(configPath);

// Start scalemate
new Scalemate(config).start();