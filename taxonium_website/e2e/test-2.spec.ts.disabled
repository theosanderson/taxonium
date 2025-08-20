import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:4173/");
  await page.locator('input[type="file"]').click();
  await page
    .locator('input[type="file"]')
    .setInputFiles("./data/tfci-taxonium-chron.jsonl");
  await page.locator('input[name="treenomeEnabled"]').check();
  await page.locator('input[name="treenomeEnabled"]').uncheck();
  await page.getByLabel("Tree type:DistanceTime").selectOption("x_time");
  await page.getByLabel("Tree type:DistanceTime").selectOption("x_dist");
  await page.getByRole("textbox").click();
  await page.getByRole("textbox").fill("TFCI");
  await page.locator("#view-main").click();
  await page.locator("#view-main").click();
  await page.locator("#view-main").click();
  await page.getByRole("button", { name: "Zoom in vertically" }).click();
  await page.getByRole("button", { name: "Zoom in horizontally" }).click();
  await page.getByRole("button", { name: "Zoom out vertically" }).click();
  await page.getByRole("button", { name: "Zoom out horizontally" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Appearance" }).click();
  await page.getByRole("tab", { name: "Search" }).click();
  await page.getByRole("tab", { name: "Appearance" }).click();
});
