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
  const info = await page.evaluate(() => ({
    question: document.querySelector('.chat-question-text')?.textContent || null,
    aiName: document.querySelector('.chat-question-name')?.textContent || null,
    hasInput: !!document.querySelector('.chat-input-bar input'),
  }));
  console.log(JSON.stringify(info));
  await page.locator('.chat-input-bar input').fill('我出生在苏州的老巷子，父亲是教师。');
  await page.evaluate(() => document.querySelector('.chat-send-btn').click());
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => ({
    question: document.querySelector('.chat-question-text')?.textContent || null,
    transcriptCount: document.querySelectorAll('.transcript-line').length,
  }));
  console.log('after:', JSON.stringify(after));
  await page.screenshot({ path: 'scripts/test-stage.png' });
  await browser.close();
})();
