const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Critical: Metro ignores .tflite files by default
config.resolver.assetExts.push('tflite');

module.exports = config;
