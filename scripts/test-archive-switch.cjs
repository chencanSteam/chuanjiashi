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
      { id: 'arch_mine', name: '张三', gender: '男', birthYear: '1950', origin: '江苏苏州', occupation: '教师' },
      { id: 'arch_other', name: '李四', gender: '男', birthYear: '1948', origin: '浙江杭州', occupation: '医生' },
    ]));
    localStorage.setItem('cj_current_archive_id', 'arch_mine');
    localStorage.setItem('cj_interview_collaborators_arch_other', JSON.stringify([
      { id: 'c_9', name: '用户1111', relation: '子女', phone: '13900001111', joinedAt: new Date().toISOString() },
    ]));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  await page.locator('button:has-text("手机号登录")').first().click();
  await page.waitForTimeout(600);
  const inputs = page.locator('input:not([type=checkbox])');
  await inputs.nth(0).fill('13900001111');
  await inputs.nth(1).fill('123456');
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

  const before = await page.evaluate(() => ({
    options: Array.from(document.querySelectorAll('.archive-switch-row option')).map((o) => o.textContent),
    selected: document.querySelector('.archive-switch-row select')?.value,
    identity: document.querySelector('.respondent-identity')?.textContent || null,
    subject: document.querySelector('.person-name')?.textContent || null,
  }));
  console.log('before switch:', JSON.stringify(before, null, 2));
  await page.screenshot({ path: 'scripts/test-switch-before.png' });

  // 切换到李四的传记
  await page.selectOption('.archive-switch-row select', 'arch_other');
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({
    url: location.href,
    selected: document.querySelector('.archive-switch-row select')?.value,
    identity: document.querySelector('.respondent-identity')?.textContent || null,
    subject: document.querySelector('.person-name')?.textContent || null,
    collabTip: document.querySelector('.collab-mode-tip')?.textContent || null,
    inviteBtn: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('邀请补充')),
  }));
  console.log('after switch:', JSON.stringify(after, null, 2));
  await page.screenshot({ path: 'scripts/test-switch-after.png' });

  await browser.close();
})();
