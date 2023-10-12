// @ts-check
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {

  await page.goto('//localhost:4173');
  // wait a few seconds
  

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Taxonium/);
});


