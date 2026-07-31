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

  // 实名认证
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll('.profile-menu-item')).find((r) => r.textContent.includes('实名认证'));
    if (row) row.click();
  });
  await page.waitForTimeout(500);
  const inputs = page.locator('.profile-form input');
  await inputs.nth(0).fill('张明远');
  await inputs.nth(1).fill('320502195808123321');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('提交认证'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);

  // 绑定微信
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll('.profile-menu-item')).find((r) => r.textContent.includes('绑定微信'));
    if (row) row.click();
  });
  await page.waitForTimeout(800);

  const result = await page.evaluate(() => ({
    badge: document.querySelector('.profile-realname-badge')?.textContent?.trim(),
    statuses: Array.from(document.querySelectorAll('.profile-bind-status')).map((el) => el.textContent.trim()),
    realnameDesc: Array.from(document.querySelectorAll('.profile-menu-desc')).map((el) => el.textContent)[0],
  }));
  console.log(JSON.stringify(result, null, 2));
  await page.screenshot({ path: 'scripts/test-profile-security.png' });
  await browser.close();
})();
