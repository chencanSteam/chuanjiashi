const { chromium } = require('playwright-core');

const BASE_URL = 'http://localhost:5173';
const OUT = 'scripts/prd-shots';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await context.newPage();

  const skipGuide = async () => {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);
  };
  const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

  // 登录页
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot('01-login');

  // 设为 MVP 模式并以演示账号登录
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_app_version', 'mvp');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2500);

  // 首页
  await page.goto(`${BASE_URL}/#/home`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await skipGuide();
  await shot('02-home');

  // AI 智能采访
  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await skipGuide();
  await shot('03-interview');

  // 邀请补充弹窗（查找样例账号）
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('邀请补充'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.locator('.invite-search-row input').fill('13911112222');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.invite-search-row button')).find((b) => b.textContent.trim() === '查找');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await shot('04-interview-invite');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const btn = document.querySelector('.modal-close');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);

  // AI 传记生成
  await page.goto(`${BASE_URL}/#/biography`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot('05-biography');

  // 人生档案（时间轴）
  await page.goto(`${BASE_URL}/#/archive`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot('06-archive');

  // 人物关系图谱
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('*')).find((el) => el.children.length === 0 && el.textContent.trim() === '人物关系图谱');
    if (tab) tab.click();
  });
  await page.waitForTimeout(1200);
  await shot('07-archive-relations');

  // 个人中心
  await page.goto(`${BASE_URL}/#/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot('08-profile');

  // 管理后台（MVP 模式）：先退出用户端登录
  await page.evaluate(() => {
    localStorage.removeItem('cj_user');
    localStorage.removeItem('cj_token');
    localStorage.removeItem('cj_mock_current_user');
  });
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('.portal-card.admin');
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/#/admin/users`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot('09-admin-users');

  await page.goto(`${BASE_URL}/#/admin/archives`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot('10-admin-archives');

  await page.goto(`${BASE_URL}/#/admin/ai-tasks`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.tab')).find((t) => t.textContent.trim() === '采访主题');
    if (tab) tab.click();
  });
  await page.waitForTimeout(800);
  await shot('11-admin-topics');
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.tab')).find((t) => t.textContent.trim() === '采访题库');
    if (tab) tab.click();
  });
  await page.waitForTimeout(800);
  await shot('12-admin-questions');

  await page.goto(`${BASE_URL}/#/admin/roles`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot('13-admin-roles');

  await page.goto(`${BASE_URL}/#/admin/notifications`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot('14-admin-notifications');

  await browser.close();
  console.log('all screenshots done');
})();
