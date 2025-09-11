const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    port: 8088, // Replace 3000 with your desired port
  },
  configureWebpack: {
    plugins: [
      // Silence Vue bundler feature-flag warning and enable better tree-shaking
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      }),
    ],
  },
})
