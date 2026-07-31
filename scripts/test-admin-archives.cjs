const { chromium } = require('playwright-core');

const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  await page.click('.portal-card.admin');
  await page.waitForTimeout(1500);

  await page.goto(`${BASE_URL}/#/admin/archives`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('archives page url:', page.url());

  const info = await page.evaluate(() => ({
    bodyText: document.querySelector('.content')?.textContent?.slice(0, 400),
  }));
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'scripts/test-admin-archives.png', fullPage: true });
  await browser.close();
})();
