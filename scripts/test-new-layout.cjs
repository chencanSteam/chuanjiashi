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

  const check = await page.evaluate(() => ({
    noCompletion: !document.querySelector('.archive-completion'),
    noTopicProgress: !document.querySelector('.topic-progress'),
    hasTranscriptCard: !!document.querySelector('.transcript-card'),
    transcriptTitle: document.querySelector('.transcript-card .card-title')?.textContent?.trim() || null,
    hasInput: !!document.querySelector('.chat-input-bar input'),
  }));
  console.log(JSON.stringify(check));

  await page.locator('.chat-input-bar input').fill('我出生在苏州的老巷子。');
  await page.evaluate(() => document.querySelector('.chat-send-btn').click());
  await page.waitForTimeout(1500);
  const transcript = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.transcript-line')).map((el) => el.textContent.slice(0, 25))
  );
  console.log('transcript lines:', JSON.stringify(transcript));
  await page.screenshot({ path: 'scripts/test-new-layout.png' });
  await browser.close();
})();
