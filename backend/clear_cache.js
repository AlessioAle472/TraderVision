const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.new_context();
  const page = await context.new_page();
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.clear();
    console.log('LocalStorage cleared.');
  });
  await browser.close();
})();
