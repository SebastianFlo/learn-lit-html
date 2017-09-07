module.exports = {
  entry: './index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
    publicPath: '/dist'
  },
  module: {
    rules: [
      {
        include: __dirname + '/index.js',
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      }
      // {
      //   include: __dirname + '/index.ts',
      //   exclude: /(node_modules|bower_components)/,
      //   use: {
      //     loader: 'ts-loader'
      //   }
      // }
    ]
  },
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    }
  }
}