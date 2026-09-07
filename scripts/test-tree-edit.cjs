const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  page.on('dialog', (d) => d.accept());
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_archives', JSON.stringify([
      { id: 'a1', name: '张明远', gender: '男', birthYear: '1958', origin: '江苏苏州', occupation: '企业家', completion: 80 },
    ]));
    localStorage.setItem('cj_current_archive_id', 'a1');
    localStorage.setItem('cj_has_seen_guide', '1');
    localStorage.setItem('cj_biography_outline_a1', JSON.stringify({
      version: 1, status: 'confirmed', updatedAt: '2026/8/13 10:00:00',
      chapters: [
        { id: 'c0', title: '前言', summary: '', eventTitles: [] },
        { id: 'c1', title: '童年记忆', summary: '', eventTitles: [] },
        { id: 'c2', title: '求学岁月', summary: '', eventTitles: [] },
        { id: 'c3', title: '后记', summary: '', eventTitles: [] },
      ],
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:5173/#/biography', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 进入目录编辑模式
  await page.click('.chapter-edit-toggle');
  await page.waitForTimeout(400);

  // 改名：童年记忆 -> 儿时往事
  await page.fill('.chapter-item.editing >> nth=1 >> input', '儿时往事');
  // 下移第一章（前言 <-> 儿时往事）
  await page.click('.chapter-item.editing >> nth=0 >> .chapter-icon-btn[title="下移"]');
  // 删除最后一章（后记）
  await page.click('.chapter-item.editing >> nth=3 >> .chapter-icon-btn[title="删除"]');
  // 添加新章节
  await page.click('.chapter-add-btn');
  await page.fill('.chapter-item.editing >> nth=3 >> input', '军旅生涯');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scripts/tree-editing.png' });

  // 退出编辑模式
  await page.click('.chapter-edit-toggle');
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => ({
    tree: Array.from(document.querySelectorAll('.chapter-item-left span')).map((s) => s.textContent),
  }));
  console.log('after edit:', JSON.stringify(after));

  // 刷新验证持久化（大纲 v1 未变，人工目录应保留）
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const persisted = await page.evaluate(() => ({
    tree: Array.from(document.querySelectorAll('.chapter-item-left span')).map((s) => s.textContent),
    stamp: localStorage.getItem('cj_biography_chapters_outline_v_a1'),
  }));
  console.log('persisted:', JSON.stringify(persisted));
  await page.screenshot({ path: 'scripts/tree-edited-persisted.png' });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
