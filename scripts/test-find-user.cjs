const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('ERR:', m.text().slice(0, 200)); });
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/#/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('邀请补充'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.locator('.invite-search-row input').fill('684161684');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.invite-search-row button')).find((b) => b.textContent.trim() === '查找');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  const result = await page.evaluate(() => ({
    found: document.querySelector('.invite-found-info')?.textContent || null,
    hasInviteBtn: !!document.querySelector('.invite-found button'),
  }));
  console.log(JSON.stringify(result));
  await page.screenshot({ path: 'scripts/test-find-user.png' });
  await browser.close();
})();
