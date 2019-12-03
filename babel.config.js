module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                modules: false,
                targets: { browsers: '> 2%, ie 11, safari > 9' },
                useBuiltIns: 'entry',
                corejs: 3,
            },
        ],
    ],
    plugins: ['@babel/plugin-proposal-unicode-property-regex'],
}
