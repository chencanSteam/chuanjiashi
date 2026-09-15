const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const bad = [];
  page.on('response', (res) => { if (res.status() >= 400) bad.push(res.status() + ' ' + res.url()); });

  await page.goto('http://localhost:5199/#/login');
  await page.evaluate(() => {
    const user = { phone: '13800138003', name: '张明远', token: 'local_token_test', roles: ['user'] };
    localStorage.setItem('cj_user', JSON.stringify(user));
    localStorage.setItem('cj_token', user.token);
    localStorage.setItem('cj_mock_current_user', JSON.stringify({ id: 'u_13800138003', phone: '13800138003', nickname: '张明远', inviteCode: '' }));
  });
  await page.goto('http://localhost:5199/#/biographers');
  await page.waitForTimeout(1500);
  let buttons = await page.$$('text=查看详情');
  console.log('列表传记师数:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    buttons = await page.$$('text=查看详情');
    await buttons[i].click();
    await page.waitForTimeout(800);
    const modalText = await page.evaluate(() => {
      const modal = document.querySelector('.biographer-list-modal');
      return modal ? modal.innerText.replace(/\s+/g, ' ').slice(0, 60) : '(no modal)';
    });
    console.log(`卡片${i + 1}:`, modalText);
    await page.evaluate(() => {
      const overlay = document.querySelector('.biographer-list-modal-overlay');
      if (overlay) overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await page.waitForTimeout(300);
  }
  console.log('4xx:', bad.join(' | ') || '(none)');
  await browser.close();
})();
