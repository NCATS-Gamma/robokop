const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// Refer: https://webpack.js.org/guides/production/

module.exports = merge(common, {
  devtool: 'source-map',
  plugins: [
    new UglifyJsPlugin({
      sourceMap: true,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    // Note: This actually sets an environmental variable that can be used by node
    // when packaging. Also note that process.env.NODE_ENV is not === 'production'
    // at this point in the script (happens after execution)
  ],
});
