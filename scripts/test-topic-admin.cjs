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
  await page.click('.portal-card.admin');
  await page.waitForTimeout(1500);

  // 进入采访主题 tab
  await page.goto(`${BASE_URL}/#/admin/ai-tasks`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.tab')).find((t) => t.textContent.trim() === '采访主题');
    if (tab) tab.click();
  });
  await page.waitForTimeout(800);
  const topics = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.ai-tpl-item .ai-tpl-name')).map((el) => el.textContent.trim())
  );
  console.log('admin topics:', JSON.stringify(topics));
  await page.screenshot({ path: 'scripts/test-topics-admin.png' });

  // 新增主题「军旅生涯」
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('新增主题'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.locator('.ai-q-form input').fill('军旅生涯');
  await page.locator('.ai-q-form textarea').fill('参军动机、部队生活与战友情谊。');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.modal-content button, .ai-q-form button')).find((b) => b.textContent.trim() === '保存');
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);
  const topicsAfter = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.ai-tpl-item .ai-tpl-name')).map((el) => el.textContent.trim())
  );
  console.log('after create:', JSON.stringify(topicsAfter));

  // 登录用户端看采访页是否包含新主题
  await page.evaluate(() => {
    localStorage.setItem('cj_user', JSON.stringify({ phone: '13800138003', name: '张明远', token: 't1', roles: ['user'] }));
    localStorage.setItem('cj_token', 't1');
    localStorage.setItem('cj_mock_current_user', JSON.stringify({ id: 'u_13800138003', phone: '13800138003', nickname: '张明远', inviteCode: '' }));
  });
  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const interviewTopics = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.topic-item')).map((el) => el.textContent.trim().slice(0, 10))
  );
  console.log('interview topics:', JSON.stringify(interviewTopics));
  await page.screenshot({ path: 'scripts/test-topics-interview.png' });

  await browser.close();
})();
