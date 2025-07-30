/* eslint-env node */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.jest.test.js',
    '**/*.test.ts', 
    '**/*.test.tsx'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.{ts,tsx,js}', 
    '!**/node_modules/**', 
    '!**/dist/**',
    '!**/run-all-tests.js',
    '!**/test-admin.js',
    '!**/*.test.js'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true
};
