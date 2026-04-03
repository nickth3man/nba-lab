import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules for .tsx files
  {
    files: ["**/*.tsx"],
    rules: {
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  // Line length rule for all JS/TS files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "max-len": ["error", { code: 100, ignoreUrls: true, ignoreStrings: true }],
    },
  },
]);

export default eslintConfig;
