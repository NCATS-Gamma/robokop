const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const fs = require('fs');

// Copy config.dev.json to config.json
fs.createReadStream('config.prod.json').pipe(fs.createWriteStream('config.json'));

module.exports = merge(common, {
  devtool: 'source-map',
  mode: 'production',
  // plugins: [
  //   new UglifyJsPlugin({
  //     sourceMap: true,
  //   }),
  // ],
});
