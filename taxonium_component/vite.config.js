import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  worker: {
    format: "umd",
  },
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    nodePolyfills({
      exclude: ["fs"],
      protocolImports: true,
    }),

    //  commonjs({ include: 'node_modules/**', }),
  ],

  build: {
    //extry: 'src/index.js',

    lib: {
      entry: "src/index.js",
      name: "Taxonium", // give your library a name
      fileName: (format) => `taxonium-component.${format}.js`,
      //  formats: ['iife']
    },

    //entry: 'src/App.jsx',

    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["react", "react-dom"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  optimizeDeps: {
    include: [], //add 'prop-types' here
  },
});
