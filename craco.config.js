module.exports = {
  style: {
    postcssOptions: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
  webpack: {
    configure: {
      resolve: {
        fallback: {
          crypto: require.resolve("crypto-browserify"),
          stream: require.resolve("stream-browserify"),
        },
      },
      module: {
        rules: [
          {
            type: "javascript/auto",
            test: /\.mjs$/,
            use: [],
          },
        ],
      },
    },
  },
};
