const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/#/archive', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.tab')).find((t) => t.textContent.trim() === '隐私与权限');
    if (tab) tab.click();
  });
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => ({
    roleOptions: Array.from(document.querySelectorAll('.privacy-role select option')).map((o) => o.textContent),
    rows: Array.from(document.querySelectorAll('.privacy-row > span')).map((el) => el.textContent),
    options: Array.from(document.querySelectorAll('.privacy-row:first-of-type .privacy-options button')).map((b) => b.textContent),
  }));
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'scripts/test-privacy.png' });
  await browser.close();
})();
