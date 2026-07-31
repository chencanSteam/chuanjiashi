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

  await page.locator('button:has-text("手机号登录")').first().click();
  await page.waitForTimeout(600);
  const inputs = page.locator('input:not([type=checkbox])');
  await inputs.nth(0).fill('张明远');
  await inputs.nth(1).fill('13800138003');
  await inputs.nth(2).fill('123456');
  await page.locator('input[type=checkbox]').check();
  await page.locator('.login-submit').click();
  await page.waitForTimeout(2000);

  // 1) 采访页抽题
  await page.goto(`${BASE_URL}/#/interview`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '跳过');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  const drawn1 = await page.evaluate(() => localStorage.getItem('cj_interview_drawn_a1'));
  console.log('drawn questions:', drawn1);
  const currentQ = await page.evaluate(() => document.querySelector('.question-text')?.textContent);
  console.log('current question:', currentQ);

  // 刷新后抽题结果应保持
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const drawn2 = await page.evaluate(() => localStorage.getItem('cj_interview_drawn_a1'));
  console.log('draw persisted:', drawn1 === drawn2);

  // 2) 传记页材料不足提示
  await page.goto(`${BASE_URL}/#/biography`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('生成本章'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);
  const modal = await page.evaluate(() => {
    const body = document.body.textContent;
    return {
      hasLowMaterialTip: body.includes('材料还比较少') || body.includes('材料较少'),
      hasContinueBtn: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('仍然生成')),
    };
  });
  console.log('low material modal:', JSON.stringify(modal));
  await page.screenshot({ path: 'scripts/test-low-material.png' });

  await browser.close();
})();
