const { chromium } = require('playwright-core');

const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);

  // 1. 人生档案 → 人物关系图谱 → 维护关系
  await page.goto(`${BASE_URL}/#/archive`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('*')).find((el) => el.children.length === 0 && el.textContent.trim() === '人物关系图谱');
    if (tab) tab.click();
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('维护关系'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.locator('.relation-add-inline input').fill('13900001111');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.relation-add-inline button')).find((b) => b.textContent.trim() === '查找');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  const found = await page.evaluate(() => document.querySelector('.invite-found-info')?.textContent || null);
  console.log('found:', found);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('发送邀请'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);
  const pending = await page.evaluate(() => document.querySelector('.relation-row-inline')?.textContent?.replace(/\s+/g, ' '));
  console.log('pending row:', pending);
  await page.screenshot({ path: 'scripts/test-relation-modal.png' });

  // 2. 对方登录 → 首页同意
  await page.evaluate(() => {
    localStorage.setItem('cj_user', JSON.stringify({ phone: '13900001111', name: '章化', token: 't2', roles: ['user'] }));
    localStorage.setItem('cj_token', 't2');
    localStorage.setItem('cj_mock_current_user', JSON.stringify({ id: 'u_13900001111', phone: '13900001111', nickname: '章化', inviteCode: '' }));
  });
  await page.goto(`${BASE_URL}/#/home`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const card = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.home-collab .service-card')).find((c) => c.textContent.includes('建立'));
    return el?.textContent?.replace(/\s+/g, ' ').slice(0, 120) || null;
  });
  console.log('relation invite card:', card);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.home-invite-actions button')).find((b) => b.textContent.trim() === '同意');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1200);

  // 3. 回到本人档案查看关系图谱
  await page.evaluate(() => {
    localStorage.setItem('cj_user', JSON.stringify({ phone: '13800138003', name: '张明远', token: 't1', roles: ['user'] }));
    localStorage.setItem('cj_token', 't1');
    localStorage.setItem('cj_mock_current_user', JSON.stringify({ id: 'u_13800138003', phone: '13800138003', nickname: '张明远', inviteCode: '' }));
  });
  await page.goto(`${BASE_URL}/#/archive`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('*')).find((el) => el.children.length === 0 && el.textContent.trim() === '人物关系图谱');
    if (tab) tab.click();
  });
  await page.waitForTimeout(800);
  const graph = await page.evaluate(() => document.body.textContent.includes('章化'));
  const relations = await page.evaluate(() => localStorage.getItem('cj_mock_family_relations_default') || '(check msw store)');
  console.log('章化 in graph page:', graph);
  await page.screenshot({ path: 'scripts/test-relation-graph.png' });

  await browser.close();
})();
