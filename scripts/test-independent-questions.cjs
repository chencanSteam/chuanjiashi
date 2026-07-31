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

  // 本人登录 → 打开采访页生成本人抽题
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const ownerDrawn = await page.evaluate(() => localStorage.getItem('cj_interview_drawn_a1'));
  console.log('owner drawn:', ownerDrawn);

  // 协助者登录 → 打开采访页生成其独立抽题
  await page.evaluate(() => {
    localStorage.setItem('cj_user', JSON.stringify({ phone: '13900001111', name: '章化', token: 't2', roles: ['user'] }));
    localStorage.setItem('cj_token', 't2');
    localStorage.setItem('cj_mock_current_user', JSON.stringify({ id: 'u_13900001111', phone: '13900001111', nickname: '章化', inviteCode: '' }));
  });
  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const collabDrawn = await page.evaluate(() => localStorage.getItem('cj_interview_drawn_a1_c_1'));
  console.log('collab drawn:', collabDrawn);
  console.log('independent:', ownerDrawn !== collabDrawn && !!collabDrawn);

  const collabView = await page.evaluate(() => ({
    identity: document.querySelector('.respondent-identity')?.textContent || null,
    question: document.querySelector('.question-text')?.textContent || null,
  }));
  console.log('collab view:', JSON.stringify(collabView, null, 2));

  // 协助者保存一个回答
  await page.evaluate(() => {
    const ta = document.querySelector('.answer-textarea');
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, '外婆总在灶台边给他留一块红薯。');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('保存本段'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);
  const saved = await page.evaluate(() => localStorage.getItem('cj_interview_supplement_a1'));
  console.log('saved supplement:', saved?.slice(0, 150));

  // 切回本人 → 查看协助人的独立问答
  await page.evaluate(() => {
    localStorage.setItem('cj_user', JSON.stringify({ phone: '13800138003', name: '张明远', token: 't1', roles: ['user'] }));
    localStorage.setItem('cj_token', 't1');
    localStorage.setItem('cj_mock_current_user', JSON.stringify({ id: 'u_13800138003', phone: '13800138003', nickname: '张明远', inviteCode: '' }));
  });
  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.selectOption('.topic-view-switch select', 'c_1');
  await page.waitForTimeout(800);
  const ownerView = await page.evaluate(() => ({
    question: document.querySelector('.question-text')?.textContent || null,
    answer: document.querySelector('.viewing-answer-text')?.textContent || null,
    tip: document.querySelector('.collab-mode-tip')?.textContent?.trim() || null,
  }));
  console.log('owner viewing collab:', JSON.stringify(ownerView, null, 2));
  await page.screenshot({ path: 'scripts/test-independent.png' });

  await browser.close();
})();
