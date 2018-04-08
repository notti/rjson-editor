const webpack = require('webpack');
var path = require('path');

const MinifyPlugin = require("babel-minify-webpack-plugin");

module.exports = {
  mode: "production",
  entry: './src/Editor.js',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rjson-editor.js',
    libraryTarget: 'umd',
    library: 'RJSONEditor'
  },
  externals: [
    {
      react: {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react',
      },
      'react-dom': {
        root: 'ReactDOM',
        commonjs2: 'react-dom',
        commonjs: 'react-dom',
        amd: 'react-dom',
        umd: 'react-dom',
      },
      'react-dnd': {
        root: 'ReactDnD',
        commonjs2: 'react-dnd',
        commonjs: 'react-dnd',
        amd: 'react-dnd',
        umd: 'react-dnd',
      },
      'react-dnd-html5-backend': {
        root: 'ReactDnDHTML5Backend',
        commonjs2: 'react-dnd-html5-backend',
        commonjs: 'react-dnd-html5-backend',
        amd: 'react-dnd-html5-backend',
        umd: 'react-dnd-html5-backend',
      },
    },
    'brace',
    'react-feather'
  ],
  module: {
    strictExportPresence: true,
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
      },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: '[name].[ext]',
            },
          },
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
          },
          {
            test: /\.(js|jsx|mjs)$/,
            exclude: /node_modules/,
            loader: require.resolve('babel-loader'),
            options: {
              cacheDirectory: true,
            },
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
};
