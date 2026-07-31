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
    const tab = Array.from(document.querySelectorAll('*')).find((el) => el.children.length === 0 && el.textContent.trim() === '人物关系图谱');
    if (tab) tab.click();
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('维护关系'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  // 输入任意内容查找
  await page.locator('.relation-add-inline input').fill('随便输入abc');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.relation-add-inline button')).find((b) => b.textContent.trim() === '查找');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  const found = await page.evaluate(() => ({
    info: document.querySelector('.invite-found-info')?.textContent || null,
    hasRelationSelect: !!document.querySelector('.invite-found select'),
  }));
  console.log(JSON.stringify(found));
  await page.screenshot({ path: 'scripts/test-search-sample.png' });
  await browser.close();
})();
