import { test, expect } from "@playwright/test";

test("should upload and display TFCI JSONL tree", async ({ page }) => {
  // Navigate to the application
  await page.goto("http://localhost:4173/");
  
  // Wait for the file input to be ready
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();
  
  // Upload the TFCI JSONL file
  await fileInput.setInputFiles("./data/tfci.jsonl");
  
  // Wait for the "Displaying X sequences" text to appear, confirming the tree has loaded
  const displayingText = page.locator('text=/Displaying \\d+ (sequences|nodes|tips)/');
  await expect(displayingText).toBeVisible({ timeout: 30000 });
  
  // Get the actual text to verify it contains a number
  const displayText = await displayingText.textContent();
  expect(displayText).toMatch(/Displaying \d+/);
  console.log(`Tree loaded with: ${displayText}`);
  
  // Verify the tree is displayed via canvas element
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  
  // Verify the search panel is visible
  const searchPanel = page.locator('text="Search"').first();
  await expect(searchPanel).toBeVisible();
  
  // Test basic interaction - panning
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
  }
  
  // Verify the tree is still visible after interaction
  await expect(canvas).toBeVisible();
  
  // Verify the "Displaying" text is still present after interaction
  await expect(displayingText).toBeVisible();
  
  // Take a screenshot as evidence
  await page.screenshot({ path: 'tfci-tree-loaded.png', fullPage: true });
});