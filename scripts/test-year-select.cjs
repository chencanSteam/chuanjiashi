const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_has_seen_guide', '1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/#/archive/event/1968/edit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.event-edit-form select'));
    return {
      selectCount: selects.length,
      firstOptions: selects[0] ? Array.from(selects[0].querySelectorAll('option')).slice(0, 3).map((o) => o.textContent) : [],
      startValue: selects[0]?.value,
      endFirstOption: selects[1]?.querySelector('option')?.textContent,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'scripts/test-year-select.png' });
  await browser.close();
})();
