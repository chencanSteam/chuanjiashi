const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card.admin');
  await page.waitForTimeout(1500);
  await page.goto('http://localhost:5173/#/admin/ai-tasks', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.tab')).find((t) => t.textContent.trim() === 'Token 成本');
    if (tab) tab.click();
  });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card-title')).map((el) => el.textContent.trim());
    const rows = Array.from(document.querySelectorAll('.ai-token-table:last-of-type .ai-task-row:not(.ai-task-header-row) .ai-task-target')).map((el) => el.textContent);
    return { cards, userRows: rows };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'scripts/test-user-stats.png' });
  await browser.close();
})();
