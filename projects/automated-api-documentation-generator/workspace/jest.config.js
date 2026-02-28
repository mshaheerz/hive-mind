/**
 * Jest configuration file to support ESM modules and
 * to customize test paths if needed.
 */
export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js'],
};
