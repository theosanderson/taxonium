import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: "./vitest.setup.js",
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary", "html"],
        reportsDirectory: "./coverage",
        include: ["src/**/*.{js,jsx,ts,tsx}"],
        exclude: [
          "**/node_modules/**",
          "**/dist/**",
          "**/cypress/**",
          "**/.{idea,git,cache,output,temp}/**",
          "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,playwright,protractor}.config.*",
          "**/*.stories.*",
          "**/*.story.*",
          "vitest.setup.js",
          "src/setupTests.js",
          "src/**/*.d.ts",
          "src/**/vite-env.d.ts",
          "src/main.{js,jsx,ts,tsx}",
          "src/App.{js,jsx,ts,tsx}",
          "src/index.js",
        ],
        all: true,
      },
    },
  }),
);
