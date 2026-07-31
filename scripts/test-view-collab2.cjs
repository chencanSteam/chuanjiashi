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
  await page.waitForTimeout(2000);

  // 读取抽到的童年第一题，为该题补一条协助者回答
  await page.evaluate(() => {
    const drawn = JSON.parse(localStorage.getItem('cj_interview_drawn_a1') || '{}');
    const qid = (drawn.childhood || ['c1'])[0];
    localStorage.setItem('cj_interview_supplement_a1', JSON.stringify({
      [qid]: [{ respondentId: 'c_1', respondentName: '章化', relation: '配偶', text: '他小时候最黏他外婆，外婆总在灶台边给他留一块红薯。', answeredAt: new Date().toISOString() }],
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);

  await page.selectOption('.topic-view-switch select', 'c_1');
  await page.waitForTimeout(800);
  const view = await page.evaluate(() => ({
    tip: document.querySelector('.collab-mode-tip')?.textContent?.trim() || null,
    answer: document.querySelector('.viewing-answer-text')?.textContent || null,
    hasSaveBtn: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('保存本段')),
  }));
  console.log(JSON.stringify(view, null, 2));
  await page.screenshot({ path: 'scripts/test-view-collab.png' });
  await browser.close();
})();
