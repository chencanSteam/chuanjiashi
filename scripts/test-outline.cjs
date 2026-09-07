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
    localStorage.setItem('cj_events_a1', JSON.stringify([
      { year: '1968', title: '童年发大水，父亲背我去上学', desc: '约 1968 年，江苏苏州，最难忘的是十岁那年发大水。' },
      { year: '1976', title: '考入南京大学机械工程系', desc: '1976 年，以优异成绩考入南京大学。' },
      { year: '1982', title: '进入南京机床厂任技术员', desc: '1982 年毕业，分配到机床厂工作。' },
      { year: '1992', title: '辞职创办明远机械', desc: '1992 年下海创业，与伙伴共同创立公司。' },
      { year: '1988', title: '与王丽华结婚', desc: '1988 年春，与相恋多年的妻子结婚。' },
      { year: '2018', title: '金婚纪念，全家团聚', desc: '2018 年，儿孙满堂举办金婚纪念。' },
      { year: '2003', title: '搬入新居', desc: '2003 年，一家人搬入新居。' },
    ]));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);

  // 1. 大纲页：AI 草案
  await page.goto('http://localhost:5173/#/biography/outline', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const draft = await page.evaluate(() => ({
    badge: document.querySelector('.outline-badge')?.textContent?.trim(),
    chapters: Array.from(document.querySelectorAll('.outline-chapter-title')).map((i) => i.value),
    pool: Array.from(document.querySelectorAll('.outline-pool-title')).map((s) => s.textContent),
  }));
  console.log('draft:', JSON.stringify(draft, null, 1));
  await page.screenshot({ path: 'scripts/outline-draft.png', fullPage: true });

  // 2. 确认大纲
  await page.click('.page-actions .btn.btn-primary');
  await page.waitForTimeout(800);
  const confirmed = await page.evaluate(() => ({
    badge: document.querySelector('.outline-badge')?.textContent?.trim(),
    stored: JSON.parse(localStorage.getItem('cj_biography_outline_a1') || 'null')?.status,
    version: JSON.parse(localStorage.getItem('cj_biography_outline_a1') || 'null')?.version,
  }));
  console.log('confirmed:', JSON.stringify(confirmed));
  await page.screenshot({ path: 'scripts/outline-confirmed.png', fullPage: true });

  // 3. 传记生成页：章节结构应来自大纲
  await page.goto('http://localhost:5173/#/biography', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const bio = await page.evaluate(() => ({
    tree: Array.from(document.querySelectorAll('.chapter-item-left span')).map((s) => s.textContent),
    outlineBadge: Array.from(document.querySelectorAll('.chapter-progress .progress-text')).map((s) => s.textContent),
  }));
  console.log('biography:', JSON.stringify(bio, null, 1));
  await page.screenshot({ path: 'scripts/biography-with-outline.png', fullPage: true });

  // 4. 生成全部章节
  await page.click('.editor-toolbar .btn.btn-primary');
  await page.waitForTimeout(2500);
  const generated = await page.evaluate(() => ({
    statuses: Array.from(document.querySelectorAll('.chapter-status')).map((s) => s.textContent?.trim()),
    progress: document.querySelector('.chapter-progress .progress-text')?.textContent,
  }));
  console.log('generated:', JSON.stringify(generated));
  await page.screenshot({ path: 'scripts/biography-outline-generated.png', fullPage: true });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
