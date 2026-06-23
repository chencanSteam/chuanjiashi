import { chromium } from 'playwright-core';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1491, height: 900 } });
  await page.goto('http://localhost:5173/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const before = await page.$$eval('.transcript-line', els => els.length);
  await page.locator('.followup-item').first().click();
  await page.waitForTimeout(1800);
  const after = await page.$$eval('.transcript-line', els => els.length);
  const lastText = await page.$eval('.transcript-line:last-child .tx-text', el => el.textContent?.trim());
  console.log('before', before, 'after', after, 'last', lastText);
  await browser.close();
})();
