const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(common, {
  devtool: 'source-map',
  mode: 'production',
  // plugins: [
  //   new UglifyJsPlugin({
  //     sourceMap: true,
  //   }),
  // ],
});
