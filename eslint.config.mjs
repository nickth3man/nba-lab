import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // Source files: enforce line limits
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-len": ["error", { code: 100, ignoreUrls: true, ignoreStrings: true }],
    },
  },

  // Test files: relax line limits
  {
    files: ["tests/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "max-lines": "off",
      "max-len": ["error", { code: 100, ignoreUrls: true, ignoreStrings: true }],
    },
  },
]);

export default eslintConfig;
