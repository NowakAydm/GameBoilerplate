// Jest setup for unit tests
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/../unit'],
  testMatch: [
    '**/unit/**/*.test.{js,ts,tsx}'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: '../coverage/unit',
  collectCoverageFrom: [
    '**/unit/**/*.{js,ts,tsx}',
    '!**/node_modules/**',
    '!**/*.test.{js,ts,tsx}'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }],
    '^.+\\.tsx$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }],
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@gameboilerplate/shared$': '<rootDir>/../../packages/shared/src/index.ts'
  },
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true
};
