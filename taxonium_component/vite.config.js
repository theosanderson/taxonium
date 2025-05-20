import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  worker: {
    format: "umd",
  },
  plugins: [
    nodePolyfills({
      exclude: ["fs"],
      protocolImports: true,
    }),
    react({
      // This ensures React is properly treated as external
      jsxRuntime: "automatic",
    }),
    cssInjectedByJsPlugin(),
    tailwindcss(),
  ],
  define: {},

  build: {
    lib: {
      entry: "src/index.js",
      name: "Taxonium",
      fileName: (format) => `taxonium-component.${format}.js`,
      formats: ["es", "umd"], // Be explicit about formats
    },
    minify: true,
    sourcemap: true,

    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime", // Important addition!
        "prop-types",
      ],

      output: {
        // Provide global variables to use in the UMD build
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "prop-types": "PropTypes",
        },
        // Ensure chunking is handled properly
        manualChunks: undefined,
      },
    },

    // Prevents code splitting that might include React
    cssCodeSplit: false,
    emptyOutDir: true,
  },

  optimizeDeps: {
    // exclude: ["react", "react-dom", "prop-types"],
  },

  resolve: {
    alias: {
      "process/": "process",
      "stream/web": "web-streams-polyfill/dist/ponyfill",
    },
  },
});
