import { chromium } from 'playwright-core';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5176';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await context.newPage();

  // 登录用户端
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.evaluate(() => localStorage.clear());
  await page.click('.portal-card'); // 用户端入口
  await page.waitForURL(/\/(|onboarding)/, { timeout: 8000 });
  console.log('logged in, url:', page.url());

  // 跳转到传记师列表
  await page.goto(`${BASE_URL}/biographers`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('page url:', page.url());
  console.log('page title:', await page.title());

  const hasCards = await page.$('.biographer-list-card');
  if (!hasCards) {
    console.log('No biographer cards found.');
    console.log('body text preview:', await page.$eval('body', (el) => el.textContent?.slice(0, 500)));
    await page.screenshot({ path: 'scripts/test-biographer-list-debug.png', fullPage: true });
    await browser.close();
    return;
  }

  const cards = await page.$$eval('.biographer-list-card', (els) =>
    els.map((el) => ({
      name: el.querySelector('.biographer-list-card-name')?.textContent?.trim(),
      title: el.querySelector('.biographer-list-card-title')?.textContent?.trim(),
      price: el.querySelector('.biographer-list-card-price')?.textContent?.trim(),
    }))
  );
  console.log('cards:', JSON.stringify(cards, null, 2));

  await page.screenshot({ path: 'scripts/test-biographer-list.png', fullPage: false });

  // 打开第一个卡片详情
  await page.click('.biographer-list-card:first-child');
  await page.waitForTimeout(800);

  const detailName = await page.$eval('.biographer-profile-name', (el) => el.textContent?.trim());
  console.log('detail name:', detailName);

  await page.screenshot({ path: 'scripts/test-biographer-detail.png', fullPage: false });

  // 点击第一个服务套餐的预约按钮
  const serviceBtn = await page.$('.biographer-profile-service-btn');
  if (serviceBtn) {
    await serviceBtn.click();
    await page.waitForTimeout(1200);
    console.log('after book toast:', await page.$eval('.toast-message, [role="status"]', (el) => el?.textContent?.trim()).catch(() => 'no toast'));
    await page.screenshot({ path: 'scripts/test-biographer-book.png', fullPage: false });
  }

  await browser.close();
})();
