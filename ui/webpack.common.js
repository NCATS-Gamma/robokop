const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  entry: ['./src/index.jsx'],
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        loader: 'file-loader?name=[name].[ext]',
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        use: 'url-loader?name=[name].[ext]',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'pack'),
    publicPath: '/',
    filename: 'bundle.js',
    // https://github.com/webpack/webpack/issues/1114
    // libraryTarget: 'commonjs2'
    libraryTarget: 'umd',
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json'],
    modules: [
      path.join(__dirname, '.'),
      'node_modules',
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
  ],
};

module.exports = config;
