const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card.admin');
  await page.waitForTimeout(1500);
  await page.goto('http://localhost:5173/#/admin/ai-tasks', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.tab')).find((t) => t.textContent.trim() === '模板管理');
    if (tab) tab.click();
  });
  await page.waitForTimeout(1200);
  // 编辑第一个模板
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.ai-tpl-item button')).find((b) => b.textContent.includes('编辑'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  const input = page.locator('.ai-q-form input').first();
  await input.fill('传记生成·朴实纪实（修订版）');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.modal-content button')).find((b) => b.textContent.trim() === '保存');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);
  const updated = await page.evaluate(() => document.querySelector('.ai-tpl-item .ai-tpl-name')?.textContent);
  console.log('updated name:', updated);
  await page.screenshot({ path: 'scripts/test-template-edit.png' });
  await browser.close();
})();
