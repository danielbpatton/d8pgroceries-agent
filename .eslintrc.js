module.exports = {
  env: { node: true, es2020: true },
  parserOptions: { ecmaVersion: 2020 },
  rules: {
    "no-unused-vars": "error",
    "no-undef": "error",
    eqeqeq: "error"
  },
  overrides: [
    {
      files: ["tests/**/*.js"],
      env: { node: true, jest: true, es2022: true },
      parserOptions: { ecmaVersion: 2022 }
    }
  ]
};
