/** @type {import('jest').Config} */
const config = {
  testMatch: ["**/tests/js/**/*.test.ts", "**/tests/js/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "jsdom",
  maxWorkers: "50%",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
};

module.exports = config;
