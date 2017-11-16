const path = require('path');

module.exports = {
  entry: [
    './components/index.js',
  ],
  output: {
    path: path.resolve(__dirname, 'static', '.'),
    filename: 'js/bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          babelrc: false,
          presets: [
            'babel-preset-es2015',
            'babel-preset-react',
          ].map(require.resolve),
          plugins: ['transform-decorators-legacy', 'transform-object-rest-spread'],
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
  ],
};
