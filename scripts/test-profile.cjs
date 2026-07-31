const { chromium } = require('playwright-core');

const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/#/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => ({
    name: document.querySelector('.profile-name')?.textContent?.trim(),
    menuItems: Array.from(document.querySelectorAll('.profile-menu-label')).map((el) => el.textContent),
    stats: Array.from(document.querySelectorAll('.profile-stat-value')).map((el) => el.textContent),
  }));
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'scripts/test-profile.png' });
  await browser.close();
})();
