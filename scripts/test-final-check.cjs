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

  // 采访页：录音态
  await page.goto('http://localhost:5173/#/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => document.querySelector('.chat-mic-btn').click());
  await page.waitForTimeout(1500);
  const rec = await page.evaluate(() => ({
    hasRecordingBar: !!document.querySelector('.chat-recording-bar'),
    noInput: !document.querySelector('.chat-input-bar'),
    time: document.querySelector('.chat-recording-time')?.textContent || null,
  }));
  console.log('recording:', JSON.stringify(rec));
  await page.screenshot({ path: 'scripts/test-recording.png' });
  await page.evaluate(() => document.querySelector('.chat-recording-stop')?.click());
  await page.waitForTimeout(600);

  // 档案页：时间轴无标签列、详情无添加标签
  await page.goto('http://localhost:5173/#/archive', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const archive = await page.evaluate(() => ({
    timelineTags: document.querySelectorAll('.timeline-event .event-tag').length,
    addTagBtn: !!Array.from(document.querySelectorAll('.event-tag')).find((el) => el.textContent.includes('添加标签')),
  }));
  console.log('archive:', JSON.stringify(archive));
  await page.screenshot({ path: 'scripts/test-archive-notags.png' });

  // 编辑页
  await page.goto('http://localhost:5173/#/archive/event/1968/edit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const edit = await page.evaluate(() => ({
    hasSubtitle: document.body.textContent.includes('副标题'),
    hasTagsSection: !!Array.from(document.querySelectorAll('label')).find((el) => el.textContent.trim() === '标签'),
  }));
  console.log('edit page:', JSON.stringify(edit));
  await browser.close();
})();
