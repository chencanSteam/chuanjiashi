const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 登录页 → 手机号登录 → 立即注册
  await page.locator('button:has-text("手机号登录")').first().click();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('立即注册'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);
  console.log('register page url:', page.url());

  // 注册流程
  const inputs = page.locator('input:not([type=checkbox])');
  await inputs.nth(0).fill('13955556666');
  await page.locator('.code-btn').click();
  await page.waitForTimeout(500);
  const toastText = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find((e) => e.children.length === 0 && e.textContent.includes('演示环境'));
    return el?.textContent || '';
  });
  const code = toastText.match(/(\d{6})/)?.[1];
  console.log('code:', code);
  await inputs.nth(1).fill(code);
  await page.locator('input[type=checkbox]').check();
  await page.screenshot({ path: 'scripts/test-register.png' });
  await page.locator('.login-submit').click();
  await page.waitForTimeout(2000);
  console.log('after register url:', page.url());
  await browser.close();
})();
