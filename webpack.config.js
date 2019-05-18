const path = require('path');

module.exports = {
  entry: {
    central: './src/app-central.js',
    showcase: './src/app-showcase.js'
  },
  output: {
    path: path.resolve(__dirname, '.'),
    filename: 'bundle-[name].js'
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, '.'),
    watchContentBase: true,
    port: 800,
    overlay: {
      warnings: true,
      errors: true
    }
  }
};
