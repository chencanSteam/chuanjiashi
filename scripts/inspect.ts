import { chromium } from 'playwright-core';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1491, height: 900 } });
  await page.goto('http://localhost:5173/archive', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const info = await page.$eval('.timeline-body', (el) => {
    const cs = getComputedStyle(el);
    return {
      inlineDisplay: (el as HTMLElement).style.display,
      computedDisplay: cs.display,
      all: Array.from((el as HTMLElement).style).join(','),
    };
  });
  console.log(info);
  await browser.close();
})();
