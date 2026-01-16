const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('path');

const TEST_FILE = path.resolve(__dirname, '../../taxonium_backend/tfci.jsonl');

test.describe('Taxonium Electron App', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Wait for the first window
    window = await electronApp.firstWindow();

    // Wait for the app to fully load
    await window.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('displays the file upload interface on startup', async () => {
    // Should show the Open File button
    const openFileButton = window.getByRole('button', { name: /open file/i });
    await expect(openFileButton).toBeVisible({ timeout: 10000 });

    // Should show drag and drop instructions
    await expect(window.getByText(/drag and drop/i)).toBeVisible();
  });

  test('loads tfci.jsonl and displays Taxonium', async () => {
    // Use ipcRenderer to invoke the open-file handler
    await window.evaluate(async (testFile) => {
      await window.electronAPI.openFile(testFile);
    }, TEST_FILE);

    // Wait for Taxonium to load (check for the taxonium container)
    const taxoniumContainer = window.locator('.taxonium-container');
    await expect(taxoniumContainer).toBeVisible();

    // Check that the Taxonium component rendered
    const taxoniumElement = window.locator('.taxonium');
    await expect(taxoniumElement).toBeVisible();
  });

  test('Taxonium component shows tree visualization', async () => {
    // Wait for the deck.gl canvas to be visible
    const canvas = window.locator('canvas#deckgl-overlay');
    await expect(canvas).toBeVisible();
  });
});
