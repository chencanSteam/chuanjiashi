// V1.0 导航分组与设置重定向复查
const { chromium } = require('playwright-core');
const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_has_seen_guide', '1');
    localStorage.setItem('cj_app_version', 'v1.0');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);

  // 展开全部分组后读取完整导航
  const nav = await page.evaluate(() => {
    document.querySelectorAll('.nav-group-header').forEach((b) => {
      const group = b.parentElement;
      if (group && !group.querySelector('.nav-sub-list')) b.click();
    });
    return null;
  });
  await page.waitForTimeout(400);
  const navFull = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.nav-group')].map((g) => ({
      group: g.querySelector('.nav-group-header span')?.textContent,
      items: [...g.querySelectorAll('.nav-sub-link span')].map((n) => n.textContent),
    }));
    return groups;
  });
  console.log('V1.0 用户端导航分组:', JSON.stringify(navFull, null, 1));
  await page.screenshot({ path: 'scripts/v1-nav.png' });

  // 设置重定向
  await page.goto(BASE + '/#/settings/invite', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('V1.0 /settings/invite 重定向到:', page.url().split('#')[1]);

  // 管理后台分组
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('cj_app_version', 'v1.0'); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('.portal-card.admin');
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.querySelectorAll('.nav-group-header').forEach((b) => {
      const group = b.parentElement;
      if (group && !group.querySelector('.nav-sub-list')) b.click();
    });
  });
  await page.waitForTimeout(400);
  const adminNav = await page.evaluate(() =>
    [...document.querySelectorAll('.nav-group')].map((g) => ({
      group: g.querySelector('.nav-group-header span')?.textContent,
      items: [...g.querySelectorAll('.nav-sub-link span')].map((n) => n.textContent),
    })));
  console.log('V1.0 后台导航分组:', JSON.stringify(adminNav, null, 1));
  await page.screenshot({ path: 'scripts/v1-admin-nav.png' });

  console.log('JS 错误:', errors.length ? errors : '无');
  await browser.close();
})();
