const { chromium } = require('playwright-core');

(async () => {
  try {
    // Connect to the local Chrome or Edge if available
    const browser = await chromium.launch({
      channel: 'msedge', // use msedge which is available on windows usually
      headless: true
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    
    // Login as a provider
    await page.fill('input[type="email"]', 'provider1@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    await browser.close();
  } catch (err) {
    console.error('SCRIPT ERROR:', err.message);
  }
})();
