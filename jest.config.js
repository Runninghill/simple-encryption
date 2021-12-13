module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['./**/*.ts'],
    coverageReporters: ['json', 'html'],
    coverageThreshold: {
        global: {
            statements: 90,
            branches: 90,
            functions: 90,
            lines: 90,
        },
    },
    injectGlobals: false,
    modulePathIgnorePatterns: [
        'jest.config.js',
        'coverage',
        'lib',
        'index.ts'
    ]
}
