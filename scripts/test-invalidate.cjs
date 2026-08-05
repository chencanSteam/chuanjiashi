const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_archives', JSON.stringify([
      { id: 'a1', name: '张明远', gender: '男', birthYear: '1958', origin: '江苏苏州', occupation: '企业家' },
    ]));
    localStorage.setItem('cj_current_archive_id', 'a1');
    localStorage.setItem('cj_interview_collaborators_a1', JSON.stringify([
      { id: 'c_1', name: '章化', relation: '配偶', joinedAt: new Date().toISOString() },
    ]));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/#/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 给章化在其童年第一题造一条补充
  await page.evaluate(() => {
    const drawn = JSON.parse(localStorage.getItem('cj_interview_drawn_a1_c_1') || '{}');
    const qid = (drawn.childhood || ['c1'])[0];
    localStorage.setItem('cj_interview_supplement_a1', JSON.stringify({
      [qid]: [{ respondentId: 'c_1', respondentName: '章化', relation: '配偶', text: '外婆的红薯。', answeredAt: new Date().toISOString() }],
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);

  // 切到章化并作废
  await page.selectOption('.topic-collab-select', 'c_1');
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.viewing-answer-actions button')).find((b) => b.textContent.trim() === '作废');
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);
  const afterInvalid = await page.evaluate(() => ({
    hasInvalidTag: !!document.querySelector('.invalid-tag'),
    textStrikethrough: getComputedStyle(document.querySelector('.viewing-answer-text')).textDecoration.includes('line-through'),
    stored: JSON.parse(localStorage.getItem('cj_interview_supplement_a1')),
  }));
  console.log('after invalid:', JSON.stringify({ tag: afterInvalid.hasInvalidTag, strike: afterInvalid.textStrikethrough }));
  const qid = Object.keys(afterInvalid.stored)[0];
  console.log('stored invalid flag:', afterInvalid.stored[qid][0].invalid);
  await page.screenshot({ path: 'scripts/test-invalidate.png' });

  // 取消作废
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.viewing-answer-actions button')).find((b) => b.textContent.trim() === '取消作废');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  const restored = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('cj_interview_supplement_a1'));
    return stored[Object.keys(stored)[0]][0].invalid;
  });
  console.log('after restore, invalid =', restored);
  await browser.close();
})();
