// vitest.config.js
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js"; // Your existing Vite configuration

export default mergeConfig(
  viteConfig, // Inherits plugins (React, TailwindCSS, etc.) and resolve.alias from your main Vite config
  defineConfig({
    test: {
      /**
       * Enable global APIs (describe, test, expect, etc.)
       * @see https://vitest.dev/config/#globals
       */
      globals: true,
      /**
       * JSDOM is a good default for testing React components that interact with the DOM.
       * @see https://vitest.dev/config/#environment
       */
      environment: "jsdom",
      /**
       * A setup file to run before each test file.
       * Ideal for configuring @testing-library/jest-dom or other global test utilities.
       * @see https://vitest.dev/config/#setupfiles
       */
      setupFiles: "./vitest.setup.js", // Or './src/setupTests.js' if you prefer
      /**
       * Include patterns for test files.
       * @see https://vitest.dev/config/#include
       */
      include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      /**
       * Exclude patterns for test files.
       * This prevents running tests on Storybook stories files themselves unless they are explicitly tests.
       * @see https://vitest.dev/config/#exclude
       */
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,playwright,protractor}.config.*",
        "**/*.stories.@(js|jsx|ts|tsx|mdx)", // Exclude story files if they are not tests
      ],
      /**
       * Coverage configuration.
       * @see https://vitest.dev/config/#coverage
       */
      coverage: {
        provider: "v8", // or 'istanbul'
        reporter: ["text", "json-summary", "html"],
        reportsDirectory: "./coverage",
        include: ["src/**/*.{js,jsx,ts,tsx}"], // Files to include in coverage
        exclude: [
          // Default Vitest exclusions
          "**/node_modules/**",
          "**/dist/**",
          "**/cypress/**",
          "**/.{idea,git,cache,output,temp}/**",
          "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,playwright,protractor}.config.*",
          // Storybook specific
          "**/*.stories.*",
          "**/*.story.*",
          // Test setup files
          "vitest.setup.js", // or your setup file path
          "src/setupTests.js",
          // Typings
          "src/**/*.d.ts",
          "src/**/vite-env.d.ts",
          // Entry points or config files not usually covered
          "src/main.{js,jsx,ts,tsx}", // Adjust if your entry point is different
          "src/App.{js,jsx,ts,tsx}", // Adjust if this is your root App component
          "src/index.js", // Your library entry point
          // Add any other files or patterns to exclude
        ],
        all: true, // Set to true to include all files in `include` in the report, even if not tested
      },
      // CSS processing is typically handled by Vite plugins (like tailwindcss, cssInjectedByJsPlugin)
      // which are inherited from your main vite.config.js.
      // If you encounter issues, you might need specific css configurations here.
      // css: true, // or an object for specific CSS processing options
    },
    // The `build` configuration from your `vite.config.js` is for your library build
    // and should generally not affect Vitest. `mergeConfig` should handle this,
    // but if you face issues, you can explicitly unset it for tests:
    // build: undefined,
  })
);
