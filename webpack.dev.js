const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const fs = require('fs');

// Copy config.dev.json to config.json
fs.createReadStream('config.dev.json').pipe(fs.createWriteStream('config.json'));

module.exports = merge(common, {
  devtool: 'cheap-module-eval-source-map',
  mode: 'development',
});
