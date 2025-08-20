import { test, expect } from "@playwright/test";

test("should upload and display TFCI JSONL tree", async ({ page }) => {
  // Navigate to the application
  await page.goto("http://localhost:4173/");
  
  // Wait for the file input to be ready
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();
  
  // Upload the TFCI JSONL file
  await fileInput.setInputFiles("./data/tfci.jsonl");
  
  // Wait for the tree to auto-load
  await page.waitForTimeout(5000);
  
  // Verify the tree is displayed via canvas element
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  
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
  
  // Take a screenshot as evidence
  await page.screenshot({ path: 'tfci-tree-loaded.png' });
});