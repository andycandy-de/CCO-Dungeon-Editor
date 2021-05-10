module.exports = {
  env: {
    browser: true,
    es6: true,
    mocha: true
  },
  plugins: ["mocha"],
  extends: "eslint:recommended",
  parserOptions: {
    sourceType: "module"
  },
  rules: {
    indent: ["error", 4],
    quotes: ["error", "single"],
    semi: ["error", "always"]
  },
  globals: {
    "PF": true
  }
};
