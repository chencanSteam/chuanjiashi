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
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);

  // 1. 本人打开邀请弹窗，查找手机号
  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('邀请补充'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.locator('.invite-search-row input').fill('13900001111');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '查找');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  const found = await page.evaluate(() => document.querySelector('.invite-found-info')?.textContent || null);
  console.log('found account:', found);
  await page.screenshot({ path: 'scripts/test-invite-search.png' });

  // 发送邀请
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('发送邀请'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);
  const invites = await page.evaluate(() => localStorage.getItem('cj_collab_invites'));
  console.log('invites:', invites?.slice(0, 200));

  // 2. 协作者账号登录，首页应出现协作邀请
  await page.evaluate(() => {
    localStorage.setItem('cj_user', JSON.stringify({ phone: '13900001111', name: '章化', token: 't2', roles: ['user'] }));
    localStorage.setItem('cj_token', 't2');
    localStorage.setItem('cj_mock_current_user', JSON.stringify({ id: 'u_13900001111', phone: '13900001111', nickname: '章化', inviteCode: '' }));
  });
  await page.goto(`${BASE_URL}/#/home`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  const inviteCard = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.home-collab .service-card')).find((c) => c.textContent.includes('邀请你'));
    return card?.textContent?.replace(/\s+/g, ' ').slice(0, 120) || null;
  });
  console.log('pending invite card:', inviteCard);

  // 3. 同意邀请
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.home-invite-actions button')).find((b) => b.textContent.trim() === '同意');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);
  const after = await page.evaluate(() => ({
    collabCard: document.querySelector('.home-collab .service-info h4')?.textContent || null,
    collaborators: localStorage.getItem('cj_interview_collaborators_a1'),
    inviteStatus: JSON.parse(localStorage.getItem('cj_collab_invites') || '[]')[0]?.status,
  }));
  console.log('after accept:', JSON.stringify(after, null, 2));
  await page.screenshot({ path: 'scripts/test-invite-accept.png' });

  await browser.close();
})();
