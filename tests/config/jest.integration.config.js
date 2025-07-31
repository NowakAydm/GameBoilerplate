// Jest setup for integration tests
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/../integration'],
  testMatch: [
    '**/integration/**/*.test.{js,ts,tsx}',
    '**/integration/**/*.jest.test.js'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: '../coverage/integration',
  collectCoverageFrom: [
    '**/integration/**/*.{js,ts,tsx}',
    '!**/node_modules/**',
    '!**/*.test.{js,ts,tsx}'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@gameboilerplate/shared$': '<rootDir>/../../packages/shared/src/index.ts'
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true
};
