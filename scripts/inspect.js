const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1491, height: 900 } });
  await page.goto('http://localhost:5173/archive', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const ev = await page.$('.timeline-event');
  const styles = await ev.evaluate(el => {
    const cs = getComputedStyle(el);
    return { display: cs.display, flexDirection: cs.flexDirection, width: cs.width, float: cs.cssFloat, position: cs.position };
  });
  const body = await page.$('.timeline-body');
  const bodyStyles = await body.evaluate(el => {
    const cs = getComputedStyle(el);
    return { display: cs.display, flexDirection: cs.flexDirection, flexWrap: cs.flexWrap };
  });
  console.log('event', styles);
  console.log('body', bodyStyles);
  await browser.close();
})();
