const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 4000, height: 3000 } });
  page.on('console', (msg) => console.log('[browser]', msg.text()));
  page.on('pageerror', (err) => console.error('[pageerror]', err));
  const htmlPath = path.resolve(__dirname, '..', '..', '传家世功能架构思维导图.html');
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({
    path: path.resolve(__dirname, '..', '..', '传家世功能架构思维导图.png'),
    fullPage: true,
  });
  await browser.close();
  console.log('done');
})();
