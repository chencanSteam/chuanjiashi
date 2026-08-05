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

  const check = async (tabName) => {
    if (tabName) {
      await page.evaluate((name) => {
        const tab = Array.from(document.querySelectorAll('.tab')).find((t) => t.textContent.trim() === name);
        if (tab) tab.click();
      }, tabName);
      await page.waitForTimeout(800);
    }
    return page.evaluate(() => ({
      hasProfile: !!document.querySelector('.archive-side .profile-card'),
      hasPlaceCard: !!document.querySelector('.place-card'),
      profileName: document.querySelector('.archive-side .profile-name')?.textContent?.trim() || null,
    }));
  };

  console.log('timeline:', JSON.stringify(await check(null)));
  console.log('media:', JSON.stringify(await check('多媒体档案库')));
  console.log('relations:', JSON.stringify(await check('人物关系图谱')));
  await page.screenshot({ path: 'scripts/test-archive-layout.png' });
  await browser.close();
})();
