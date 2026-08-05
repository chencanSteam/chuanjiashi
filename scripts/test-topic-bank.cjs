const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_archives', JSON.stringify([
      { id: 'a1', name: '张明远', gender: '男', birthYear: '1958', origin: '江苏苏州', occupation: '企业家' },
    ]));
    localStorage.setItem('cj_current_archive_id', 'a1');
    // 给预设主题 childhood 加一个手动题目
    localStorage.setItem('cj_topic_questions_childhood', JSON.stringify([
      { id: 'tq_1', text: '手动题：小时候谁给你讲过故事？' },
    ]));
    // 给后台新增主题 admin_x 加手动题目，并写入主题配置
    localStorage.setItem('cj_topic_questions_admin_x', JSON.stringify([
      { id: 'tq_2', text: '手动题：军旅中最难忘的一次训练？' },
    ]));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card.admin');
  await page.waitForTimeout(1500);

  // 后台新增主题「军旅生涯」
  await page.goto('http://localhost:5173/#/admin/ai-tasks', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.tab')).find((t) => t.textContent.trim() === '采访主题');
    if (tab) tab.click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('新增主题'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.locator('.ai-q-form input').fill('军旅生涯');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.ai-q-form button')).find((b) => b.textContent.trim() === '保存');
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);

  // 打开该主题的题库管理，添加一道题
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll('.ai-tpl-item')).find((r) => r.textContent.includes('军旅生涯'));
    const btn = Array.from(row.querySelectorAll('button')).find((b) => b.textContent.includes('题库'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.locator('.ai-bank-add input').fill('手动题：军旅中最难忘的一次训练？');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.ai-bank-add button')).find((b) => b.textContent.includes('添加'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  const bank = await page.evaluate(() => Array.from(document.querySelectorAll('.ai-bank-item')).map((el) => el.textContent.trim().slice(0, 30)));
  console.log('bank items:', JSON.stringify(bank));
  await page.screenshot({ path: 'scripts/test-topic-bank.png' });

  // 预设主题「童年」的题库应有内置题+手动题
  await page.evaluate(() => {
    const btn = document.querySelector('.modal-close');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll('.ai-tpl-item')).find((r) => r.textContent.includes('童年'));
    const btn = Array.from(row.querySelectorAll('button')).find((b) => b.textContent.includes('题库'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  const childhoodBank = await page.evaluate(() => ({
    builtin: document.querySelectorAll('.ai-bank-item.builtin').length,
    hasManual: document.body.textContent.includes('手动题：小时候谁给你讲过故事？'),
  }));
  console.log('childhood bank:', JSON.stringify(childhoodBank));
  await browser.close();
})();
