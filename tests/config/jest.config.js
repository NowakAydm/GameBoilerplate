/* eslint-env node */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/..'],
  testMatch: [
    '**/unit/**/*.test.{js,ts,tsx}',
    '**/integration/**/*.test.{js,ts,tsx}',
    '**/*.jest.test.js'
  ],
  testPathIgnorePatterns: [
    'e2e',  // E2E tests use Playwright
    'node_modules',
    'coverage',
    'dist',
    'build'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: '../coverage',
  collectCoverageFrom: [
    '**/unit/**/*.{js,ts,tsx}',
    '**/integration/**/*.{js,ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/utils/**',
    '!**/*.test.{js,ts,tsx}'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true
};
