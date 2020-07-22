const path = require('path');
const Dotenv = require('dotenv-webpack');

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
      path: '../../shared/robokop.env',
      systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
    }),
  ],
};

module.exports = config;
