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

  // 新建档案 + 选择标签
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('新建档案'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.locator('.new-archive-body input').first().fill('李桂芳');
  await page.evaluate(() => {
    const tags = Array.from(document.querySelectorAll('.new-archive-body .life-tag'));
    tags.find((t) => t.textContent === '参军入伍')?.click();
    tags.find((t) => t.textContent === '教书育人')?.click();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/test-new-archive-tags.png' });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.new-archive-body button')).find((b) => b.textContent.trim() === '创建');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1200);

  // 档案概览应展示标签
  const shown = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.profile-tag')).map((el) => el.textContent)
  );
  console.log('overview tags:', JSON.stringify(shown));
  const saved = await page.evaluate(() => {
    const archives = JSON.parse(localStorage.getItem('cj_archives') || '[]');
    return archives.find((a) => a.name === '李桂芳')?.tags;
  });
  console.log('saved tags:', JSON.stringify(saved));
  await page.screenshot({ path: 'scripts/test-archive-tags.png' });
  await browser.close();
})();
