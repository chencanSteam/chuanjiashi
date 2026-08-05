const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_archives', JSON.stringify([
      { id: 'a1', name: '张明远', gender: '男', birthYear: '1958', origin: '江苏苏州', occupation: '企业家' },
      { id: 'a2', name: '李桂芳', gender: '女', birthYear: '1955', origin: '浙江杭州', occupation: '教师' },
    ]));
    localStorage.setItem('cj_current_archive_id', 'a1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/#/biography', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const before = await page.evaluate(() => ({
    options: Array.from(document.querySelectorAll('.biography-archive-switch option')).map((o) => o.textContent),
    selected: document.querySelector('.biography-archive-switch select')?.value,
  }));
  console.log('before:', JSON.stringify(before));
  await page.selectOption('.biography-archive-switch select', 'a2');
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({
    current: localStorage.getItem('cj_current_archive_id'),
    selected: document.querySelector('.biography-archive-switch select')?.value,
  }));
  console.log('after:', JSON.stringify(after));
  await browser.close();
})();
