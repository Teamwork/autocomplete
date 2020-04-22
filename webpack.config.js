const path = require('path')
const express = require('express')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const demoPages = [
    'CodeMirror-Vue',
    'CodeMirror-Knockout',
    'Contenteditable-Vue',
    'Textarea-Vue',
    'Textarea-Knockout',
    'Input-Vue',
    'Task',
]
const config = {
    entry: {
        index: path.join(__dirname, 'demo', 'index.js'),
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
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.join(__dirname, 'demo', 'index.html'),
            chunks: ['index'],
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
        before(app) {
            app.use('/api/', express.static('./docs/api'))
        },
    },
}

demoPages.forEach((demoPage) => {
    config.entry[demoPage] = path.join(__dirname, 'demo', `${demoPage}.js`)
    config.plugins.push(
        new HtmlWebpackPlugin({
            filename: `${demoPage}.html`,
            template: path.join(__dirname, 'demo', `${demoPage}.html`),
            chunks: [demoPage],
        }),
    )
})

module.exports = config
