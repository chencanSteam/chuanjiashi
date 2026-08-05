const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  page.on('dialog', (d) => d.accept());
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

  const before = await page.evaluate(() => Array.from(document.querySelectorAll('.topic-item .topic-name')).map((el) => el.textContent.trim()));
  console.log('before:', JSON.stringify(before));

  // 删除「创业」主题
  await page.evaluate(() => {
    const item = Array.from(document.querySelectorAll('.topic-item')).find((t) => t.textContent.includes('创业'));
    item.querySelector('.topic-delete').click();
  });
  await page.waitForTimeout(800);

  const after = await page.evaluate(() => Array.from(document.querySelectorAll('.topic-item .topic-name')).map((el) => el.textContent.trim()));
  console.log('after:', JSON.stringify(after));
  const stored = await page.evaluate(() => localStorage.getItem('cj_interview_removed_topics_default'));
  console.log('stored removed:', stored);

  // 刷新后仍隐藏
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const afterReload = await page.evaluate(() => Array.from(document.querySelectorAll('.topic-item .topic-name')).map((el) => el.textContent.trim()));
  console.log('after reload:', JSON.stringify(afterReload));
  await browser.close();
})();
