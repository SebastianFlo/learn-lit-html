module.exports = {
    entry: __dirname + '/demo/clock.js',
    output: {
      path: __dirname + '/demo',
      filename: 'clock.js',
      publicPath: '/demo'
    },
    module: {
      rules: [
        {
          include: __dirname + '/clock.js',
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader'
          }
        }
      ]
    }
  }