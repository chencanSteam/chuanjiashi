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
  console.log('after login url:', page.url());

  await page.goto(`${BASE_URL}/#/admin/users`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('users page url:', page.url());

  const info = await page.evaluate(() => {
    const table = document.querySelector('.um-table');
    const rows = document.querySelectorAll('.um-row').length;
    const empty = document.querySelector('.um-empty')?.textContent || null;
    const tabs = document.querySelectorAll('.um-tab').length;
    let tableStyle = null;
    if (table) {
      const cs = getComputedStyle(table);
      const rect = table.getBoundingClientRect();
      tableStyle = { display: cs.display, width: rect.width, height: rect.height, color: cs.color };
    }
    return { hasTable: !!table, rows, empty, tabs, tableStyle, bodyText: document.body.textContent?.slice(0, 300) };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'scripts/test-admin-users.png', fullPage: true });
  await browser.close();
})();
