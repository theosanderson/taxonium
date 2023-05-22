const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
    FAIL:FAIL
  // ... other webpack configuration options ...
  plugins: [
    // ... other plugins ...
    new NodePolyfillPlugin({
      excludeAliases: ["console"],
    }),
  ],
};