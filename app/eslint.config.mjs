// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextConfig from "eslint-config-next";
import tseslint from "@typescript-eslint/eslint-plugin";

const eslintConfig = [{
  ignores: [
    "**/node_modules/**",
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/storybook-static/**",
    "**/playwright-report/**",
    "**/test-results/**",
    "next-env.d.ts",
  ],
}, ...nextConfig, {
  plugins: {
    "@typescript-eslint": tseslint,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/immutability": "off",
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/purity": "off",
    "react-hooks/incompatible-library": "off",
    "react-hooks/preserve-manual-memoization": "off",
  },
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
