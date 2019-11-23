const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: {
        index: path.join(__dirname, 'demo', 'index.js'),
        'CodeMirror-Vue': path.join(__dirname, 'demo', 'CodeMirror-Vue.js'),
        'CodeMirror-Knockout': path.join(
            __dirname,
            'demo',
            'CodeMirror-Knockout.js',
        ),
    },
    output: {
        filename: '[name].[contenthash].js',
        path: path.join(__dirname, 'docs'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [
                    path.join(__dirname, 'demo'),
                    path.join(__dirname, 'node_modules', '@syncot'),
                    path.join(__dirname, 'packages'),
                ],
                loader: 'babel-loader',
            },
            {
                test: /\.css$/,
                include: [
                    path.join(__dirname, 'demo'),
                    path.join(__dirname, 'node_modules', 'codemirror'),
                ],
                loader: 'style-loader!css-loader',
            },
            {
                test: /\.html$/,
                include: [path.join(__dirname, 'demo')],
                loader: 'html-loader',
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.join(__dirname, 'demo', 'index.html'),
            chunks: ['index'],
        }),
        new HtmlWebpackPlugin({
            filename: 'CodeMirror-Vue.html',
            template: path.join(__dirname, 'demo', 'CodeMirror-Vue.html'),
            chunks: ['CodeMirror-Vue'],
        }),
        new HtmlWebpackPlugin({
            filename: 'CodeMirror-Knockout.html',
            template: path.join(__dirname, 'demo', 'CodeMirror-Knockout.html'),
            chunks: ['CodeMirror-Knockout'],
        }),
        new HtmlWebpackPlugin({
            filename: '404.html',
            template: path.join(__dirname, 'demo', '404.html'),
            chunks: [],
        }),
    ],
    devServer: {
        host: '0.0.0.0',
        port: 8023,
    },
}
