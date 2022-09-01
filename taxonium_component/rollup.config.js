import postcss from "rollup-plugin-postcss";
import babel from "@rollup/plugin-babel";
import nodeResolve from "@rollup/plugin-node-resolve";
import pluginJson from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import webWorkerLoader from "rollup-plugin-web-worker-loader";
import nodePolyfills from "rollup-plugin-polyfill-node";

export default {
  input: "./index.js",

  output: {
    format: "esm",
    dir: "dist",
  },
  plugins: [
    nodePolyfills(),

    nodeResolve({ preferBuiltins: true, browser: true }),
    pluginJson(),
    commonjs({ include: "node_modules/**" }),
    postcss({
      config: {
        path: "./postcss.config.js",
      },
      extensions: [".css"],
      minimize: true,
      inject: {
        insertAt: "top",
      },
    }),

    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
    webWorkerLoader({ targetPlatform: "browser", inline: true, external: [] }),
  ],
};
