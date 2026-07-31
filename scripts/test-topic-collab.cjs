const { chromium } = require('playwright-core');

const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
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
  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 给章化在其童年第一题造一条补充（章化的抽题 key 为 a1_c_1）
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
  await page.waitForTimeout(500);

  // 童年主题：应出现主题内协助者切换
  const sel = await page.evaluate(() => ({
    hasSelect: !!document.querySelector('.topic-collab-select'),
    options: Array.from(document.querySelectorAll('.topic-collab-select option')).map((o) => o.textContent),
  }));
  console.log('childhood topic:', JSON.stringify(sel));

  // 切到章化
  await page.selectOption('.topic-collab-select', 'c_1');
  await page.waitForTimeout(600);
  const viewing = await page.evaluate(() => ({
    answer: document.querySelector('.viewing-answer-text')?.textContent || null,
  }));
  console.log('viewing answer:', JSON.stringify(viewing));

  // 切到求学主题（章化没回答过）：下拉应消失或重置为本人
  await page.evaluate(() => {
    const topic = Array.from(document.querySelectorAll('.topic-item')).find((t) => t.textContent.includes('求学'));
    if (topic) topic.click();
  });
  await page.waitForTimeout(800);
  const school = await page.evaluate(() => ({
    hasSelect: !!document.querySelector('.topic-collab-select'),
    tip: document.querySelector('.collab-mode-tip')?.textContent || null,
  }));
  console.log('school topic:', JSON.stringify(school));

  await page.screenshot({ path: 'scripts/test-topic-collab.png' });
  await browser.close();
})();
