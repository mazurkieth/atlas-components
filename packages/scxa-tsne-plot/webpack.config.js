const path = require(`path`)
const { CleanWebpackPlugin } = require(`clean-webpack-plugin`)

const commonPublicPath = `/dist/`
const vendorsBundleName = `vendors`

module.exports = {
  entry: {
    tSnePlotViewDemo: [`@babel/polyfill`, `./html/Demo.js`],
  },

  plugins: [
    new CleanWebpackPlugin()
  ],

  output: {
    library: `[name]`,
    filename: `[name].bundle.js`,
    publicPath: commonPublicPath,
    devtoolNamespace: `firefox`
  },

  resolve: {
    alias: {
      "react": path.resolve(`./node_modules/react`),
      "react-dom": path.resolve(`./node_modules/react-dom`),
      "styled-components": path.resolve(`./node_modules/styled-components`)
    },
  },

  optimization: {
    runtimeChunk: {
       name: vendorsBundleName
    },
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: vendorsBundleName,
          chunks: 'all'
        }
      }
    }
  },

  module: {
    rules: [
      {
        test: /\.js$/i,
        exclude: /node_modules\//,
        use: `babel-loader`
      },
      {
          test: /\.svg$/i,
          use: [
              {
                  loader: `file-loader`,
                  options: {
                      query: {
                          name: `[hash].[ext]`,
                          hash: `sha512`,
                          digest: `hex`
                      }
                  }
              }
          ]
      }
    ]
  },

  devServer: {
    port: 9000,
    contentBase: path.resolve(__dirname, `html`),
    publicPath: commonPublicPath
  }
}
