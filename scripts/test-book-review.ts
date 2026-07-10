import { chromium } from 'playwright-core';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5176';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1491, height: 900 } });
  const page = await context.newPage();

  // 通过登录页进入管理后台
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 清理旧数据
  await page.evaluate(() => localStorage.clear());

  // 点击管理后台入口
  await page.click('.portal-card.admin');
  await page.waitForURL(/\/admin/, { timeout: 8000 });
  console.log('logged in, url:', page.url());

  // 直接跳转到审核页
  await page.goto(`${BASE_URL}/admin/book-review`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  console.log('page url:', page.url());
  console.log('body text preview:', await page.$eval('body', (el) => el.textContent?.slice(0, 500)));

  const hasTable = await page.$('.book-review-table');
  if (!hasTable) {
    console.log('No table found.');
    await page.screenshot({ path: 'scripts/test-book-review-debug.png', fullPage: true });
    await browser.close();
    return;
  }

  // 统计信息
  const statValues = await page.$$eval('.book-review-stat-value', (els) => els.map((e) => e.textContent?.trim()));
  console.log('stats:', statValues);

  // 每行操作按钮
  const rowButtons = await page.$$eval('.book-review-row:not(.book-review-header-row)', (rows) =>
    rows.map((row) => {
      const title = row.querySelector('.book-review-title')?.textContent?.trim() || '';
      const buttons = Array.from(row.querySelectorAll('.book-review-btn')).map((b) => b.textContent?.trim());
      return { title, buttons };
    })
  );
  console.log('row buttons:', JSON.stringify(rowButtons, null, 2));

  // 打开第一个 pending 项的详情
  const pendingRow = await page.$('.book-review-row:not(.book-review-header-row):has(.book-status-pending)');
  if (!pendingRow) {
    console.log('no pending row found');
    await browser.close();
    return;
  }

  await pendingRow.$eval('.book-review-btn-view', (el) => (el as HTMLElement).click());
  await page.waitForTimeout(1000);

  const title = await page.$eval('.book-review-detail-title', (el) => el.textContent?.trim());
  const chapterCount = await page.$eval('.book-review-content-metrics', (el) => el.textContent?.trim());
  const chapterText = await page.$eval('.book-review-chapter-text', (el) => el.textContent?.slice(0, 80));
  const actionButtons = await page.$$eval('.book-review-detail-actions .btn', (els) =>
    els.map((e) => e.textContent?.trim())
  );
  console.log('detail title:', title);
  console.log('chapter count:', chapterCount);
  console.log('chapter preview:', chapterText);
  console.log('detail actions:', actionButtons);

  await page.screenshot({ path: 'scripts/test-book-review-detail.png', fullPage: false });

  // 点击拒绝按钮，测试拒绝弹窗
  await page.click('.book-review-detail-actions .btn-danger');
  await page.waitForTimeout(500);
  console.log('reject modal title:', await page.$eval('.modal-header .modal-title, .modal-header h4', (el) => el.textContent?.trim()));
  await page.screenshot({ path: 'scripts/test-book-review-reject.png', fullPage: false });

  await browser.close();
})();
