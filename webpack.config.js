const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.bundle.js'
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  devtool: 'source-map',
  module: {
    rules: [
      { test: /\.ts$/, loader: "ts-loader", exclude: /node_modules/ }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname),
    publicPath: '/dist',
    compress: true,
    port: 9000
  }
}