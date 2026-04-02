/** @type {import('jest').Config} */
const config = {
  testMatch: ['**/tests/js/**/*.test.ts', '**/tests/js/**/*.test.tsx'],
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
};

module.exports = config;
