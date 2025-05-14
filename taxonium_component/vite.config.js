import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";
import cssInjectedByJsPlugin from 
"vite-plugin-css-injected-by-js";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  worker: {
    format: "umd",
  },
  plugins: [

    nodePolyfills({
      exclude: ["fs"],
      protocolImports: true,
    }),
    react(), 
    cssInjectedByJsPlugin(),
    tailwindcss()
    //  commonjs({ include: 'node_modules/**', }),
  ],
  define: {
    "process.env": {"NODE_ENV": JSON.stringify("production") },
  },

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
      external: ["react", "react-dom","prop-types"],
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
  resolve: {
    alias: {
        'vite-plugin-node-polyfills/shims/buffer': path.resolve(
            __dirname,
            'node_modules',
            'vite-plugin-node-polyfills',
            'shims',
            'buffer',
            'dist',
            'index.cjs'
        ),
        'vite-plugin-node-polyfills/shims/global': path.resolve(
            __dirname,
            'node_modules',
            'vite-plugin-node-polyfills',
            'shims',
            'global',
            'dist',
            'index.cjs'
        ),
        'vite-plugin-node-polyfills/shims/process': path.resolve(
            __dirname,
            'node_modules',
            'vite-plugin-node-polyfills',
            'shims',
            'process',
            'dist',
            'index.cjs'
        )
    }
  },
});


