const path = require('path');
const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
 
module.exports = {
    mode: 'production',
    output: {
        path: path.join(__dirname, 'dist/'),
        publicPath: '/',
        clean: true,
        assetModuleFilename: 'assets/[contenthash:8][ext][query]',
    },
    optimization: {
        minimize: false
    },
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    "css-loader",
                    "sass-loader"
                ],
            },
            {
                test: /\.html$/i,
                use: [
                    HtmlBundlerPlugin.loader
                ],
            }
        ],
    },
    plugins: [
        new HtmlBundlerPlugin({
            js: {
                filename: 'assets/script/[contenthash:8].js',
            },
            css: {
                filename: 'assets/style/[contenthash:8].css',
            },
            filename: (pathData) => {
                return pathData.chunk.name === 'main' ? 'index.html' : '[name].html';
            },
            entry: {
                index: {
                    import: './src/index.html',
                    data: {
                        title: 'Germvid',
                        heading: 'Germvid',
                        branding: 'Germvid',
                    },
                },
                watch: {
                    import: './src/watch.html',
                    data: {
                        title: 'Watch - Germvid',
                        heading: false,
                        branding: 'Germvid',
                    },
                },
            },
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'static' }
            ]
        })
    ],
};
