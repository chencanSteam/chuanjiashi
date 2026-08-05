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
  // 发两轮回答让记录有内容
  await page.locator('.chat-input-bar input').fill('我出生在苏州。');
  await page.evaluate(() => document.querySelector('.chat-send-btn').click());
  await page.waitForTimeout(1500);
  await page.locator('.chat-input-bar input').fill('父亲教我正直。');
  await page.evaluate(() => document.querySelector('.chat-send-btn').click());
  await page.waitForTimeout(2000);
  const dims = await page.evaluate(() => {
    const card = document.querySelector('.transcript-card')?.getBoundingClientRect();
    const body = document.querySelector('.transcript-body')?.getBoundingClientRect();
    return { cardH: Math.round(card?.height || 0), bodyH: Math.round(body?.height || 0), bodyMaxHeight: getComputedStyle(document.querySelector('.transcript-body')).maxHeight };
  });
  console.log(JSON.stringify(dims));
  await page.screenshot({ path: 'scripts/test-transcript-height.png' });
  await browser.close();
})();
