module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    // Disable all ESLint rules that conflict with Prettier (does hide warnings)
    "prettier",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/ban-ts-comment": "off",
    "no-console": "warn",
    "prefer-const": "warn",
  },
};
