import { test, expect } from "@playwright/test";

test("should upload NWK file and display tree", async ({ page }) => {
  // Navigate to the application
  await page.goto("http://localhost:4173/");
  
  // Wait for the file input to be ready
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();
  
  // Upload the NWK file
  await fileInput.setInputFiles("./data/test.nwk");
  
  // Wait for the file to be processed
  await page.waitForTimeout(1000);
  
  // Look for and click the launch button
  const launchButton = page.locator('button:has-text("Launch"), button:has-text("Load"), button:has-text("Submit"), button:has-text("View"), button:has-text("Open")').first();
  
  // Click the launch button to load the tree
  await expect(launchButton).toBeVisible({ timeout: 5000 });
  await launchButton.click();
  
  // Wait for the tree to load
  await page.waitForTimeout(3000);
  
  // Verify the tree is displayed (canvas or svg)
  const treeVisualization = page.locator('canvas, svg[id*="tree"], svg[class*="tree"]').first();
  await expect(treeVisualization).toBeVisible({ timeout: 20000 });
  
  // Verify zoom controls are available
  const zoomInButton = page.locator('button:has-text("Zoom in"), button[aria-label*="Zoom in"], button[title*="Zoom in"]').first();
  await expect(zoomInButton).toBeVisible({ timeout: 5000 });
  
  // Test zoom functionality
  await zoomInButton.click();
  
  // Verify the tree is still visible after interaction
  await expect(treeVisualization).toBeVisible();
});