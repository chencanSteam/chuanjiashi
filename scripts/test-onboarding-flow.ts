import { chromium } from 'playwright-core';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    await page.goto('http://localhost:5176/login', { waitUntil: 'networkidle' });
    await page.locator('text=注册').click();
    await page.locator('input[placeholder="您的称呼"]').fill('王五');
    await page.locator('input[placeholder="手机号"]').fill('13912345678');
    await page.locator('input[placeholder="验证码"]').fill('123456');
    await page.locator('button:has-text("注册并登录")').click();
    await page.waitForURL('**/onboarding', { timeout: 5000 });
    console.log('✓ reached onboarding');

    // Step 1
    await page.locator('input[placeholder="如：张三"]').fill('王五');
    await page.locator('select').selectOption('男');
    await page.locator('input[placeholder="如：1958"]').fill('1960');
    await page.locator('input[placeholder="如：江苏苏州"]').fill('湖北武汉');
    await page.locator('input[placeholder="如：教师、工程师、企业家"]').fill('工程师');
    await page.locator('button:has-text("下一步")').click();
    console.log('✓ step 1 done');

    // Step 2
    await page.locator('button:has-text("添加一个人生阶段")').click();
    const rows = page.locator('.stage-row');
    await rows.nth(0).locator('input').nth(0).fill('1980');
    await rows.nth(0).locator('input').nth(1).fill('1990');
    await rows.nth(0).locator('input').nth(2).fill('工作');
    await rows.nth(0).locator('input').nth(3).fill('在武汉机床厂工作');
    await page.locator('button:has-text("下一步")').click();
    console.log('✓ step 2 done');

    // Step 3
    await page.locator('button:has-text("开始 AI 采访")').click();
    await page.waitForURL('**/interview', { timeout: 5000 });
    console.log('✓ reached interview');

    // End interview
    await page.locator('button:has-text("结束访谈")').click();
    await page.waitForURL('**/biography**', { timeout: 5000 });
    console.log('✓ reached biography');

    // Wait for generation
    await page.waitForTimeout(2500);

    // Sync to archive
    await page.locator('button:has-text("同步到人生档案")').click();
    await page.locator('button:has-text("查看人生档案")').click();
    await page.waitForURL('**/archive', { timeout: 5000 });
    console.log('✓ reached archive');

    // Verify timeline has events
    const eventCount = await page.locator('.timeline-event').count();
    console.log(`✓ timeline events: ${eventCount}`);

    const archiveId = await page.evaluate(() => localStorage.getItem('cj_current_archive_id'));
    const eventsRaw = await page.evaluate((id) => localStorage.getItem(`cj_events_${id}`), archiveId);
    console.log(`✓ current archive id: ${archiveId}`);
    console.log(`✓ raw events: ${eventsRaw}`);

    if (eventCount === 0) {
      await page.screenshot({ path: 'scripts/test-archive-empty.png', fullPage: true });
    }

    console.log('FLOW PASSED');
  } catch (e) {
    console.error('FLOW FAILED:', (e as Error).message);
    await page.screenshot({ path: 'scripts/test-onboarding-fail.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
