import { test, expect } from '@playwright/test';

test.describe('Minimap Zoom Consistency', () => {
  test.beforeEach(async ({ page }) => {
    // We'll need to navigate to a page with taxonium component
    // For now, let's assume there's a test page or storybook instance
    await page.goto('/');
    
    // Wait for the component to load
    await page.waitForTimeout(2000);
  });

  test('minimap initial zoom should match zoom after clicking on tree', async ({ page }) => {
    // Add console logging to capture zoom calculations
    page.on('console', msg => {
      if (msg.text().includes('MINIMAP_ZOOM')) {
        console.log('Browser log:', msg.text());
      }
    });

    // Wait for deck.gl to initialize
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Take a screenshot of initial state
    await page.screenshot({ path: 'initial-minimap.png', fullPage: true });
    
    // Get initial minimap bounds by evaluating in browser context
    const initialMinimapState = await page.evaluate(() => {
      // Access deck.gl instance if possible
      const deckCanvas = document.querySelector('canvas');
      if (!deckCanvas) return null;
      
      // Try to get deck instance from React fiber
      const deckContainer = deckCanvas.closest('[class*="deck"]');
      console.log('MINIMAP_ZOOM: Checking initial state', deckContainer);
      
      return {
        canvasWidth: deckCanvas.width,
        canvasHeight: deckCanvas.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      };
    });
    
    console.log('Initial state:', initialMinimapState);
    
    // Click on the main tree view (not minimap)
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(1000);
    
    // Take a screenshot after click
    await page.screenshot({ path: 'after-click-minimap.png', fullPage: true });
    
    // Get minimap state after click
    const afterClickMinimapState = await page.evaluate(() => {
      const deckCanvas = document.querySelector('canvas');
      if (!deckCanvas) return null;
      
      console.log('MINIMAP_ZOOM: Checking state after click');
      
      return {
        canvasWidth: deckCanvas.width,
        canvasHeight: deckCanvas.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      };
    });
    
    console.log('After click state:', afterClickMinimapState);
    
    // For now, we're just logging - we'll add actual assertions once we understand the issue
    expect(initialMinimapState).toBeTruthy();
    expect(afterClickMinimapState).toBeTruthy();
  });

  test('minimap zoom is consistent across different screen sizes', async ({ page, viewport }) => {
    console.log('Testing with viewport:', viewport);
    
    // Add console logging
    page.on('console', msg => {
      if (msg.text().includes('MINIMAP_ZOOM')) {
        console.log(`[${viewport?.width}x${viewport?.height}] Browser log:`, msg.text());
      }
    });

    await page.waitForSelector('canvas', { timeout: 10000 });
    
    const minimapState = await page.evaluate(() => {
      const viewportInfo = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      console.log('MINIMAP_ZOOM: Viewport info', viewportInfo);
      return viewportInfo;
    });
    
    console.log(`Viewport ${viewport?.width}x${viewport?.height} state:`, minimapState);
    
    // Take screenshot for this viewport
    await page.screenshot({ 
      path: `minimap-${viewport?.width}x${viewport?.height}.png`, 
      fullPage: true 
    });
  });
});