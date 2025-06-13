const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Log console messages with more detail
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
    for (const arg of msg.args()) {
      arg.jsonValue().then(value => {
        if (value && typeof value === 'object') {
          console.log('  Details:', JSON.stringify(value, null, 2));
        }
      }).catch(() => {});
    }
  });
  page.on('pageerror', error => console.error('Browser error:', error.message));
  page.on('requestfailed', request => {
    console.error('Request failed:', request.url(), request.failure().errorText);
  });
  
  try {
    await page.goto('http://localhost:8080');
    
    // Wait a bit for scripts to load
    await page.waitForTimeout(2000);
    
    // Check if React and Taxonium are loaded
    const status = await page.evaluate(() => {
      return {
        reactVersion: window.React ? window.React.version : null,
        reactDOMVersion: window.ReactDOM ? window.ReactDOM.version : null,
        taxoniumLoaded: !!window.Taxonium,
        taxoniumType: window.Taxonium ? typeof window.Taxonium : null,
        taxoniumKeys: window.Taxonium ? Object.keys(window.Taxonium) : null
      };
    });
    
    console.log('✅ Page loaded successfully');
    console.log(`✅ React version: ${status.reactVersion}`);
    console.log(`✅ ReactDOM version: ${status.reactDOMVersion}`);
    console.log(`✅ Taxonium loaded: ${status.taxoniumLoaded}`);
    console.log(`✅ Taxonium type: ${status.taxoniumType}`);
    console.log(`✅ Taxonium exports: ${JSON.stringify(status.taxoniumKeys)}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
    console.log('✅ Screenshot saved as screenshot.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();