module.exports = {
  "notify": true,
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.{js,jsx}"
  ],
  "coveragePathIgnorePatterns": ["__tests__", "jest.config.js", "/node_modules/", "/old/", "/coverage/", "gulpfile.js"],
  "testEnvironment": "node",
  "testMatch": ["**/__tests__/**/*.test.[jt]s?(x)"]
};
