module.exports = {
  style: {
    postcssOptions: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "https://platform.epicov.org",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
      "Access-Control-Allow-Credentials": "true"
    },
  }
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

