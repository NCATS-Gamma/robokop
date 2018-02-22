const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const NODE_ENV = 'development'; // 'production'

// Set plugins if in product mode
let plugins = [];
let useSourceMap = true;
if (NODE_ENV === 'production') {
  plugins = [
    new UglifyJsPlugin(),
    new webpack.DefinePlugin({'process.env': {NODE_ENV: '"production"'}}),
    // Note: This actually sets an environmental variable
    // Obviously we could remove this here and actually set NODE_ENV in the build script
  ];
  useSourceMap = false;
}

const config = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: ['babel-preset-env', 'babel-preset-react'].map(require.resolve),
            plugins: ['transform-decorators-legacy', 'transform-object-rest-spread', 'transform-export-extensions'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader',
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader',
      },
    ],
  },

  output: {
    path: path.resolve(__dirname, 'pack', '.'),
    publicPath: './pack/',
    filename: 'bundle.js',
    // https://github.com/webpack/webpack/issues/1114
    // libraryTarget: 'commonjs2',
    libraryTarget: 'umd',
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [
      path.join(__dirname, '.'),
      'node_modules',
    ],
  },

  entry: [
    './src/index.jsx',
  ],
  plugins,
};

// Generate source map if in development mode
if (useSourceMap) {
  config.devtool = 'cheap-module-eval-source-map';
}

module.exports = config;
