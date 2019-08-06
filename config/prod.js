module.exports = {
    env: {
        NODE_ENV: '"production"',
        BASE_URL: '"https://weapp.ckudz.cn"',
        WSS_URL: '"wss://ws.ckudz.com"'
    },
    defineConstants: {
    },
    weapp: {},
    h5: {
        /**
         * 如果h5端编译后体积过大，可以使用webpack-bundle-analyzer插件对打包体积进行分析。
         * 参考代码如下：
         * webpackChain (chain) {
         *   chain.plugin('analyzer')
         *     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
         * }
         */
    }
};
