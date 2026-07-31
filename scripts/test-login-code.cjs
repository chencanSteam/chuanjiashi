const { chromium } = require('playwright-core');

const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  await page.locator('button:has-text("手机号登录")').first().click();
  await page.waitForTimeout(600);

  // 不获取验证码直接登录 → 应提示
  await page.locator('input[type=checkbox]').check();
  await page.locator('.login-submit').click();
  await page.waitForTimeout(500);
  const toast1 = await page.evaluate(() => document.body.textContent.includes('请先获取验证码'));
  console.log('blocks without code:', toast1);

  // 获取验证码
  await page.locator('.code-btn').click();
  await page.waitForTimeout(500);
  const toastText = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find((e) => e.children.length === 0 && e.textContent.includes('演示环境'));
    return el?.textContent || '';
  });
  const code = toastText.match(/(\d{6})/)?.[1];
  console.log('got code from toast:', code);

  // 输错验证码 → 应提示错误
  const inputs = page.locator('input:not([type=checkbox])');
  await inputs.nth(2).fill('000000');
  await page.locator('.login-submit').click();
  await page.waitForTimeout(500);
  const toast2 = await page.evaluate(() => document.body.textContent.includes('验证码错误'));
  console.log('rejects wrong code:', toast2);

  // 输入正确验证码 → 登录成功
  await inputs.nth(2).fill(code);
  await page.locator('.login-submit').click();
  await page.waitForTimeout(2000);
  console.log('after login url:', page.url());
  await page.screenshot({ path: 'scripts/test-login-code.png' });

  await browser.close();
})();
