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
  await page.goto('http://localhost:5173/#/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);

  // 初始：AI 提出第一个问题
  const initial = await page.evaluate(() => ({
    pending: document.querySelectorAll('.chat-msg.ai .chat-bubble')[0]?.textContent || null,
    hasInput: !!document.querySelector('.chat-input-bar input'),
  }));
  console.log('initial:', JSON.stringify(initial));

  // 发送主问题回答
  await page.locator('.chat-input-bar input').fill('我出生在苏州的老巷子，父亲是教师。');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('.chat-send-btn').click());
  await page.waitForTimeout(2000);

  const afterAnswer = await page.evaluate(() => ({
    userBubbles: Array.from(document.querySelectorAll('.chat-msg.user .chat-bubble')).map((el) => el.textContent.slice(0, 20)),
    aiBubbles: Array.from(document.querySelectorAll('.chat-msg.ai .chat-bubble')).map((el) => el.textContent.slice(0, 25)),
  }));
  console.log('after answer:', JSON.stringify(afterAnswer, null, 2));
  await page.screenshot({ path: 'scripts/test-chat.png' });

  // 回答延伸问题
  await page.locator('.chat-input-bar input').fill('父亲教我做人要正直。');
  await page.evaluate(() => document.querySelector('.chat-send-btn').click());
  await page.waitForTimeout(2500);
  const afterFollow = await page.evaluate(() => ({
    total: document.querySelectorAll('.chat-msg').length,
    lastAI: Array.from(document.querySelectorAll('.chat-msg.ai .chat-bubble')).pop()?.textContent?.slice(0, 30) || null,
  }));
  console.log('after follow-up:', JSON.stringify(afterFollow));
  await page.screenshot({ path: 'scripts/test-chat2.png' });
  await browser.close();
})();
