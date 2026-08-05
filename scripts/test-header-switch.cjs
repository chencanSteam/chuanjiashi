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

  await page.goto('http://localhost:5173/#/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const interview = await page.evaluate(() => ({
    inHeader: !!document.querySelector('.interview-header-actions .header-switch'),
    inCard: !document.querySelector('.stat-person .archive-switch-row'),
  }));
  console.log('interview:', JSON.stringify(interview));
  await page.screenshot({ path: 'scripts/test-header-interview.png' });

  await page.goto('http://localhost:5173/#/biography', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const bio = await page.evaluate(() => ({
    inActions: !!document.querySelector('.page-actions .biography-archive-switch'),
  }));
  console.log('biography:', JSON.stringify(bio));
  await page.screenshot({ path: 'scripts/test-header-bio.png' });
  await browser.close();
})();
