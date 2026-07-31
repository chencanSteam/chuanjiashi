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
      { id: 'arch_demo', name: '张三', gender: '男', birthYear: '1950', origin: '江苏苏州', occupation: '教师' },
    ]));
    localStorage.setItem('cj_current_archive_id', 'arch_demo');
    localStorage.setItem('cj_interview_collaborators_arch_demo', JSON.stringify([
      { id: 'c_1', name: '章化', relation: '配偶', phone: '13900001111', joinedAt: new Date().toISOString() },
    ]));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 协作者账号登录
  await page.locator('button:has-text("手机号登录")').first().click();
  await page.waitForTimeout(600);
  const inputs = page.locator('input:not([type=checkbox])');
  await inputs.nth(0).fill('13900001111');
  await inputs.nth(1).fill('123456');
  await page.locator('input[type=checkbox]').check();
  await page.locator('.login-submit').click();
  await page.waitForTimeout(2000);
  console.log('after login url:', page.url());

  // 关掉新手引导
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  const homeInfo = await page.evaluate(() => ({
    collabSection: document.querySelector('.home-collab .surface-header')?.textContent?.trim() || null,
    collabCard: document.querySelector('.home-collab .service-info')?.textContent?.trim() || null,
  }));
  console.log('home:', JSON.stringify(homeInfo, null, 2));
  await page.screenshot({ path: 'scripts/test-collab-home.png' });

  // 点击协助卡片进入采访
  await page.evaluate(() => {
    const card = document.querySelector('.home-collab .service-card');
    if (card) card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForTimeout(2000);
  const interviewInfo = await page.evaluate(() => ({
    url: location.href,
    identity: document.querySelector('.respondent-identity')?.textContent || null,
    collabTip: document.querySelector('.collab-mode-tip')?.textContent || null,
  }));
  console.log('interview:', JSON.stringify(interviewInfo, null, 2));

  await browser.close();
})();
