const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1491, height: 900 } })).newPage();
  page.on('console', (m) => { if (!m.text().includes('[vite]') && !m.text().includes('DevTools')) console.log('PAGE:', m.text().slice(0, 300)); });
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.portal-card.admin');
  await page.waitForTimeout(1500);
  const resp = await page.evaluate(async () => {
    const res = await fetch('/api/admin/archives?privacyStatus=all');
    const text = await res.text();
    return { status: res.status, body: text.slice(0, 400) };
  });
  console.log(JSON.stringify(resp, null, 2));
  await browser.close();
})();
