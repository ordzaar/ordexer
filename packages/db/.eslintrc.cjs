const path = require("path");

module.exports = {
  env: { es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "../../node_modules/@ordzaar/standard-linter",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: { project: [path.join(__dirname, "tsconfig.eslint.json")] },
  overrides: [
    {
      files: ["**/.eslintrc.cjs"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
  rules: {
    "import/no-extraneous-dependencies": "off",
    "import/prefer-default-export": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
