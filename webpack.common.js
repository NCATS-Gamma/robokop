const path = require('path');
const Dotenv = require('dotenv-webpack');

const config = {
  entry: ['babel-polyfill', './src/index.jsx'],
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: ['babel-preset-env', 'babel-preset-react'].map(require.resolve),
            plugins: ['transform-decorators-legacy', 'transform-class-properties', 'transform-object-rest-spread', 'transform-export-extensions'],
          },
        },
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        loader: 'file-loader?name=[name].[ext]',
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'url-loader',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'pack', '.'),
    publicPath: './pack/',
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
    new Dotenv({
      path: '../shared/robokop.env',
      systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
    }),
  ],
};

module.exports = config;
