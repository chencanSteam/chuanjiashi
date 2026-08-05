const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_has_seen_guide', '1');
    localStorage.setItem('cj_app_version', 'mvp');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/#/biography', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const mvp = await page.evaluate(() => ({
    hasExport: !!document.querySelector('.export-card'),
    hasDerived: !!document.querySelector('.derived-card'),
  }));
  console.log('MVP:', JSON.stringify(mvp));
  // 完整版对照
  await page.evaluate(() => localStorage.setItem('cj_app_version', 'full'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const full = await page.evaluate(() => ({
    hasExport: !!document.querySelector('.export-card'),
    hasDerived: !!document.querySelector('.derived-card'),
  }));
  console.log('FULL:', JSON.stringify(full));
  await browser.close();
})();
