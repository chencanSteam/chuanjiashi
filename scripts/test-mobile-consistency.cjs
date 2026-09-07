// 移动端与 Web 端逻辑一致性验证
const { chromium } = require('playwright-core');
const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 420, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  // 登录（用户端入口）
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cj_has_seen_guide', '1');
    localStorage.setItem('cj_app_version', 'v1.0');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('.portal-card:not(.admin):not(.partner):not(.biographer):not(.mobile)');
  await page.waitForTimeout(2000);
  // 隐藏逻辑标注悬浮按钮，避免遮挡操作
  await page.addStyleTag({ content: '.annotation-toggle { display: none !important; }' });

  const archiveId = await page.evaluate(() => localStorage.getItem('cj_current_archive_id'));
  console.log('当前档案:', archiveId);

  // ---------- 1. 移动端采访：回答主问题 → 应出现延伸问题 ----------
  await page.goto(BASE + '/#/m/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const ANSWER = '我小时候在苏州河边长大，最喜欢跟着父亲去赶集。';
  await page.fill('.mobile-interview-inputbar input', ANSWER);
  await page.click('.mobile-interview-send');
  await page.waitForTimeout(2500); // 等待追问生成（800ms）与额度消耗
  const afterMain = await page.evaluate(() => ({
    bubbles: [...document.querySelectorAll('.mobile-interview-bubble')].map((b) => b.textContent),
    hasFollowUp: [...document.querySelectorAll('.mobile-interview-category')].some((c) => c.textContent === '延伸问题'),
  }));
  console.log('主问题回答后出现延伸问题:', afterMain.hasFollowUp);

  // 回答延伸问题（可能 1~2 个），直到出现下一道主问题
  for (let i = 0; i < 3; i += 1) {
    const waitingFollowUp = await page.evaluate(() =>
      [...document.querySelectorAll('.mobile-interview-category')].some((c) => c.textContent === '延伸问题')
    );
    const inputDisabled = await page.evaluate(() => document.querySelector('.mobile-interview-inputbar input').disabled);
    if (!waitingFollowUp || inputDisabled) break;
    // 最后一条是延伸问题时才回答
    const lastCategory = await page.evaluate(() => {
      const cats = [...document.querySelectorAll('.mobile-interview-message:last-child .mobile-interview-category')];
      return cats.length ? cats[cats.length - 1].textContent : null;
    });
    if (lastCategory !== '延伸问题') break;
    await page.fill('.mobile-interview-inputbar input', `延伸问题回答 ${i + 1}：印象很深。`);
    await page.click('.mobile-interview-send');
    await page.waitForTimeout(1200);
  }

  // 检查存储：转写为 Web 共用 key + TranscriptLine 结构；回答写入共用 answers key
  const storage = await page.evaluate((aid) => {
    const transcript = JSON.parse(localStorage.getItem(`cj_interview_transcript_${aid}`) || '[]');
    const answers = JSON.parse(localStorage.getItem(`cj_interview_answers_${aid}`) || '{}');
    const session = JSON.parse(localStorage.getItem(`cj_interview_session_${aid}`) || '{}');
    const legacy = localStorage.getItem(`cj_interview_transcript_mobile_${aid}`);
    return {
      transcriptLines: transcript.length,
      hasTranscriptStruct: transcript.every((l) => 'speaker' in l && 'time' in l && 'text' in l),
      answersCount: Object.keys(answers).length,
      followUps: Object.keys(session.followUps || {}).length,
      legacyKeyExists: legacy !== null,
    };
  }, archiveId);
  console.log('采访存储检查:', JSON.stringify(storage));

  // ---------- 2. 语音输入（mock 回退路径） ----------
  await page.click('.mobile-interview-mic');
  await page.waitForTimeout(1200);
  await page.click('.mobile-interview-mic'); // 停止
  await page.waitForTimeout(500);
  const voiceText = await page.evaluate(() => document.querySelector('.mobile-interview-inputbar input').value);
  console.log('语音转写填入输入框:', voiceText.includes('[语音转写]') || voiceText.length === 0, `(len=${voiceText.length})`);

  // ---------- 3. Web 端 /interview 应看到同一条回答 ----------
  await page.goto(BASE + '/#/interview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const webSeesAnswer = await page.evaluate((ans) => document.body.innerText.includes(ans), ANSWER);
  console.log('Web 端采访页看到移动端回答:', webSeesAnswer);
  await page.screenshot({ path: 'scripts/consistency-web-interview.png' });

  // ---------- 4. Web 端 /my-works 状态应为「采集中」 ----------
  await page.goto(BASE + '/#/my-works', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const myWorksStatus = await page.evaluate(() => document.body.innerText.includes('采集中'));
  console.log('Web 我的传记出现「采集中」状态:', myWorksStatus);

  // ---------- 5. 移动端作品列表与 Web 一致 ----------
  await page.goto(BASE + '/#/m/works', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const mobileWorks = await page.evaluate(() =>
    [...document.querySelectorAll('.works-item-desc')].map((n) => n.textContent));
  console.log('移动端作品列表:', JSON.stringify(mobileWorks));

  // ---------- 6. 照片修复持久化 ----------
  await page.goto(BASE + '/#/m/photo-restore', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.setInputFiles('.mobile-photo-restore-input', 'scripts/home.png');
  await page.waitForTimeout(800);
  await page.click('.mobile-photo-btn.primary'); // 开始修复
  await page.waitForTimeout(3500);
  await page.click('.mobile-photo-btn.primary'); // 保存到人生档案
  await page.waitForTimeout(800);
  const photoStorage = await page.evaluate((aid) => ({
    records: JSON.parse(localStorage.getItem('cj_photo_restore_records') || '[]').length,
    restored: JSON.parse(localStorage.getItem(`cj_restored_photos_${aid}`) || '[]').length,
    media: JSON.parse(localStorage.getItem(`cj_media_${aid}`) || '[]').length,
  }), archiveId);
  console.log('照片修复存储:', JSON.stringify(photoStorage));

  // Web 端照片修复页应看到同一条记录
  await page.goto(BASE + '/#/photo-restore', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const webRecords = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cj_photo_restore_records') || '[]').length);
  console.log('Web 端修复记录数（应=移动端写入）:', webRecords);

  // ---------- 7. 移动端首页最近动态 ----------
  await page.goto(BASE + '/#/m', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const mobileActivities = await page.evaluate(() =>
    [...document.querySelectorAll('.mobile-activity-title')].map((n) => n.textContent.trim()));
  console.log('移动端最近动态:', JSON.stringify(mobileActivities));

  // Web 首页动态对比
  await page.goto(BASE + '/#/home', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const webActivities = await page.evaluate(() =>
    [...document.querySelectorAll('.activity-title')].map((n) => n.textContent.trim()));
  console.log('Web 端最近动态:', JSON.stringify(webActivities));

  // ---------- 8. 移动端改昵称 → Web 端一致 ----------
  await page.goto(BASE + '/#/m/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.click('.mobile-profile-item'); // 个人资料
  await page.waitForTimeout(500);
  await page.fill('.mobile-modal-row input', '张明远改');
  await page.click('.mobile-modal-btn.primary');
  await page.waitForTimeout(800);
  await page.goto(BASE + '/#/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const webName = await page.evaluate(() => document.body.innerText.includes('张明远改'));
  console.log('移动端改昵称后 Web 个人中心一致:', webName);
  // 恢复昵称
  await page.evaluate(() => {
    const raw = localStorage.getItem('cj_auth_user');
    if (raw) {
      const u = JSON.parse(raw);
      u.name = '张明远';
      localStorage.setItem('cj_auth_user', JSON.stringify(u));
    }
  });

  console.log('JS 错误:', errors.length ? errors : '无');
  await browser.close();
})();
