/** @type {import('jest').Config} */
const nextJest = require('next/jest')

// Create Jest config with Next.js
const createJestConfig = nextJest({
  dir: './',
})

// Add custom Jest configuration
const customJestConfig = {
  // Test environment setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',

  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!next.config.js',
    '!postcss.config.js',
    '!tailwind.config.js',
  ],

  // Coverage thresholds for 100% coverage
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

  // Test file patterns
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Module extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  // Verbose output
  verbose: true,

  // Maximum worker threads
  maxWorkers: '50%',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,
}

// Create the final Jest config
module.exports = createJestConfig(customJestConfig)