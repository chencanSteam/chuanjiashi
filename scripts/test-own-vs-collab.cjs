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
      { id: 'a2', name: '1', gender: '男', birthYear: '1960', origin: '北京', occupation: '工人' },
      { id: 'a3', name: '张三', gender: '男', birthYear: '1950', origin: '江苏苏州', occupation: '教师' },
    ]));
    localStorage.setItem('cj_current_archive_id', 'a1');
    localStorage.setItem('cj_interview_collaborators_a3', JSON.stringify([
      { id: 'c_1', name: '张明远', relation: '朋友', joinedAt: new Date().toISOString() },
    ]));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 以昵称"张明远"登录
  await page.locator('button:has-text("手机号登录")').first().click();
  await page.waitForTimeout(600);
  const inputs = page.locator('input:not([type=checkbox])');
  await inputs.nth(0).fill('张明远');
  await inputs.nth(1).fill('13966667777');
  await inputs.nth(2).fill('123456');
  await page.locator('input[type=checkbox]').check();
  await page.locator('.login-submit').click();
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);

  const info = await page.evaluate(() => ({
    options: Array.from(document.querySelectorAll('.archive-switch-row option')).map((o) => o.textContent),
    identity: document.querySelector('.respondent-identity')?.textContent || null,
  }));
  console.log('own archive:', JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'scripts/test-own.png' });

  // 切到张三（协作）
  await page.selectOption('.archive-switch-row select', 'a3');
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({
    identity: document.querySelector('.respondent-identity')?.textContent || null,
    inviteBtn: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('邀请补充')),
    collabTip: document.querySelector('.collab-mode-tip')?.textContent || null,
  }));
  console.log('collab archive:', JSON.stringify(after, null, 2));
  await page.screenshot({ path: 'scripts/test-collab2.png' });

  await browser.close();
})();
