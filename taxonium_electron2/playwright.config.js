import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Taxonium Electron app E2E tests
 *
 * Tests run against the actual Electron app to test file loading
 * with real backend spawning.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,  // Electron tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // Run one test at a time for Electron
  reporter: 'html',
  timeout: 10000,  // Longer timeout for file loading

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Run Vite dev server for the Electron renderer */
  webServer: {
    command: 'npm run dev:vite',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
