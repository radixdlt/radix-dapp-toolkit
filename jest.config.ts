/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  // A set of global variables that need to be available in all test environments
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: ['<rootDir>/setup-tests.js'],
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/', '/types'],
  moduleDirectories: ['node_modules'],
}
