// V1.0 版本验证：检查各端在 v1.0 / full 两种模式下的入口与菜单
const { chromium } = require('playwright-core');
const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  async function setVersion(v) {
    await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
    await page.evaluate((ver) => {
      localStorage.clear();
      localStorage.setItem('cj_has_seen_guide', '1');
      localStorage.setItem('cj_app_version', ver);
    }, v);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
  }

  async function loginUser() {
    await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
    await page.waitForTimeout(2000);
  }

  // ---------- V1.0 登录页 ----------
  await setVersion('v1.0');
  const loginV1 = await page.evaluate(() => ({
    label: document.querySelector('.version-switch-label')?.textContent,
    portals: [...document.querySelectorAll('.portal-card .portal-name')].map((n) => n.textContent),
  }));
  console.log('V1.0 登录页:', JSON.stringify(loginV1, null, 1));
  await page.screenshot({ path: 'scripts/v1-login.png' });

  // ---------- V1.0 用户端 ----------
  await loginUser();
  const navV1 = await page.evaluate(() =>
    [...document.querySelectorAll('.nav-sub-link span, .nav-link span')].map((n) => n.textContent));
  console.log('V1.0 侧边导航:', JSON.stringify(navV1));
  await page.screenshot({ path: 'scripts/v1-home.png', fullPage: false });

  // V1.0 可访问页面抽查
  const checks = {};
  for (const path of ['/my-works', '/store', '/my-orders', '/biographers', '/biography-shelf', '/settings/account', '/settings/notification', '/settings/help']) {
    await page.goto(BASE + '/#' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    checks[path] = page.url().includes(path);
  }
  // V1.0 应重定向的页面抽查
  for (const path of ['/family', '/genealogy', '/family-hall', '/digital-person', '/group-buy', '/museum', '/settings/invite', '/photo-restore']) {
    await page.goto(BASE + '/#' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    checks[path + ' (应跳走)'] = !page.url().includes('#' + path);
  }
  console.log('V1.0 路由检查:', JSON.stringify(checks, null, 1));

  // 传记生成页：导出卡应出现，衍生内容应隐藏
  await page.goto(BASE + '/#/biography', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const bioV1 = await page.evaluate(() => ({
    hasExport: !!document.querySelector('.export-card'),
    hasDerived: !!document.querySelector('.derived-card'),
    hasQuickGen: !!document.querySelector('.quick-gen-card'),
  }));
  console.log('V1.0 传记生成页:', JSON.stringify(bioV1));

  // ---------- V1.0 移动端 ----------
  await page.goto(BASE + '/#/m', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const mobV1 = await page.evaluate(() => ({
    url: location.hash,
    tabs: [...document.querySelectorAll('.mobile-tab-item span')].map((n) => n.textContent),
  }));
  console.log('V1.0 移动端:', JSON.stringify(mobV1));
  await page.screenshot({ path: 'scripts/v1-mobile.png' });
  await page.goto(BASE + '/#/m/family', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  console.log('V1.0 移动端 /m/family 应跳走:', !page.url().includes('/m/family'));

  // ---------- V1.0 管理后台 ----------
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('cj_app_version', 'v1.0'); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('.portal-card.admin');
  await page.waitForTimeout(2000);
  const adminV1 = await page.evaluate(() =>
    [...document.querySelectorAll('.nav-sub-link span')].map((n) => n.textContent));
  console.log('V1.0 后台导航:', JSON.stringify(adminV1));
  await page.screenshot({ path: 'scripts/v1-admin.png' });
  for (const path of ['/admin/biographers', '/admin/orders', '/admin/ai-usage']) {
    await page.goto(BASE + '/#' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    console.log('V1.0 后台', path, '可访问:', page.url().includes(path));
  }
  await page.goto(BASE + '/#/admin/partners', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  console.log('V1.0 后台 /admin/partners 应跳走:', !page.url().includes('/admin/partners'));

  // ---------- 完整版回归 ----------
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('cj_app_version', 'full'); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const loginFull = await page.evaluate(() => ({
    label: document.querySelector('.version-switch-label')?.textContent,
    portals: [...document.querySelectorAll('.portal-card .portal-name')].map((n) => n.textContent),
  }));
  console.log('完整版登录页:', JSON.stringify(loginFull));

  console.log('JS 错误:', errors.length ? errors : '无');
  await browser.close();
})();
