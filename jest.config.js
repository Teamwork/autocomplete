const fs = require('fs')

module.exports = {
    projects: [
        fs.readdirSync('./packages').map(name => {
            return {
                name,
                displayName: name,
                preset: 'ts-jest',
                setupFiles: ['<rootDir>/scripts/jestSetUp'],
                moduleNameMapper: {
                    '^@teamwork/autocomplete-([-\\w]+)$':
                        '<rootDir>/packages/$1/src',
                },
                testMatch: [`<rootDir>/packages/${name}/src/**/*.test.ts`],

                // This is necessary to transpile JS files containing ES modules.
                transformIgnorePatterns: ['<rootDir>/node_modules/(?!@syncot)'],
                transform: {
                    '\\.(ts|js)x?$': 'ts-jest',
                },
                globals: {
                    'ts-jest': {
                        tsConfig: {
                            ...require(`./packages/${name}/tsconfig.json`)
                                .compilerOptions,
                            allowJs: true,
                        },
                    },
                },
            }
        }),
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/packages/*/src/**/*.{ts,tsx,js,jsx}',
        '!<rootDir>/packages/*/src/**/*.test.{ts,tsx,js,jsx}',
        '!<rootDir>/**/*.d.{ts,tsx,js,jsx}',
        '!<rootDir>/node_modules/',
    ],
}
