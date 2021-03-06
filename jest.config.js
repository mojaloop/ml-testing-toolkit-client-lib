module.exports = {
  verbose: true,
  collectCoverageFrom: [
    '**/src/**/**/*.js'
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      functions: 90,
      branches: 80,
      lines: 90
    }
  },
  modulePathIgnorePatterns: ['spec_files'],
  testEnvironment: 'node'
}
