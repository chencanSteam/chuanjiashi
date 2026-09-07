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
  await page.goto('http://localhost:5173/#/archive', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const dims = await page.evaluate(() => {
    const tl = document.querySelector('.timeline-card')?.getBoundingClientRect();
    const detail = document.querySelector('.archive-grid > div:nth-child(2)')?.getBoundingClientRect();
    return { timelineH: Math.round(tl?.height || 0), detailH: Math.round(detail?.height || 0) };
  });
  console.log(JSON.stringify(dims));
  await page.screenshot({ path: 'scripts/test-archive-tidy.png' });
  await browser.close();
})();
