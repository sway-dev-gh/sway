/** @type {import('jest').Config} */
module.exports = {
  // Test environment for Node.js
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,ts}',
    '<rootDir>/**/*.(test|spec).{js,ts}',
  ],

  // Coverage configuration for 100% coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!jest.setup.js',
  ],

  // Coverage thresholds for world-class quality
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Maximum worker threads
  maxWorkers: '50%',

  // Module file extensions
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],

  // Transform configuration
  transform: {
    '^.+\\.(js|ts)$': 'babel-jest',
  },

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',

  // Test timeout (increased for integration tests)
  testTimeout: 30000,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles (for debugging)
  detectOpenHandles: true,

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],
}