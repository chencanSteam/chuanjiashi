const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  page.on('dialog', (d) => d.accept());
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_archives', JSON.stringify([
      { id: 'a1', name: '张明远', gender: '男', birthYear: '1958', origin: '江苏苏州', occupation: '企业家' },
    ]));
    localStorage.setItem('cj_current_archive_id', 'a1');
    localStorage.setItem('cj_has_seen_guide', '1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);

  // 1. 打开润色页，上传 docx
  await page.goto('http://localhost:5173/#/polish', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/polish-upload.png' });
  await page.setInputFiles('.polish-dropzone input[type=file]', 'scripts/test-biography.docx');
  await page.waitForTimeout(1500);
  const loaded = await page.evaluate(() => ({
    chapters: Array.from(document.querySelectorAll('.polish-chapter-left span')).map((s) => s.textContent),
    progress: document.querySelector('.polish-tree-progress')?.textContent?.trim(),
    words: document.querySelector('.polish-words')?.textContent,
  }));
  console.log('loaded:', JSON.stringify(loaded, null, 1));
  await page.screenshot({ path: 'scripts/polish-loaded.png' });

  // 2. AI 润色本章
  const before = await page.inputValue('.polish-editor');
  await page.click('.polish-toolbar-actions .btn.btn-primary');
  await page.waitForTimeout(1800);
  const after = await page.inputValue('.polish-editor');
  const status1 = await page.evaluate(() => ({
    status: document.querySelector('.polish-chapter-item.active .polish-status')?.textContent?.trim(),
    progress: document.querySelector('.polish-tree-progress')?.textContent?.trim(),
  }));
  console.log('polished changed:', before !== after);
  console.log('after polish:', JSON.stringify(status1));
  console.log('sample:', after.slice(0, 80));
  await page.screenshot({ path: 'scripts/polish-polished.png' });

  // 3. 恢复原稿
  await page.click('.polish-toolbar-actions .btn.btn-outline >> nth=1');
  await page.waitForTimeout(600);
  const restored = await page.inputValue('.polish-editor');
  console.log('restored === before:', restored === before);

  // 4. 全文润色 + 保存 + 刷新验证持久化
  await page.click('.polish-toolbar-actions .btn.btn-outline >> nth=0');
  await page.waitForTimeout(2200);
  await page.click('.page-actions .btn.btn-primary');
  await page.waitForTimeout(600);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const persisted = await page.evaluate(() => ({
    progress: document.querySelector('.polish-tree-progress')?.textContent?.trim(),
    stored: !!localStorage.getItem('cj_polish_doc_a1'),
  }));
  console.log('persisted:', JSON.stringify(persisted));
  await page.screenshot({ path: 'scripts/polish-all.png', fullPage: true });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
