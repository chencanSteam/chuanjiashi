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

  // 用户端采访页：AI 按主题生成的问题
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/#/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const interview = await page.evaluate(() => ({
    pending: document.querySelector('.chat-msg.ai .chat-bubble')?.textContent || null,
    topics: Array.from(document.querySelectorAll('.topic-item .topic-name')).map((el) => el.textContent.trim()),
  }));
  console.log('interview:', JSON.stringify(interview, null, 2));
  await page.screenshot({ path: 'scripts/test-no-bank-interview.png' });

  // 后台：题库 tab 应消失
  await page.evaluate(() => {
    localStorage.removeItem('cj_user');
    localStorage.removeItem('cj_token');
    localStorage.removeItem('cj_mock_current_user');
  });
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('.portal-card.admin');
  await page.waitForTimeout(1500);
  await page.goto('http://localhost:5173/#/admin/ai-tasks', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const tabs = await page.evaluate(() => Array.from(document.querySelectorAll('.tab')).map((t) => t.textContent.trim()));
  console.log('admin tabs:', JSON.stringify(tabs));
  await browser.close();
})();
