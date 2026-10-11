// quick dev smoke: node tools/smoke.js [query] [outPrefix]
const { chromium } = require('playwright'); const path = require('path');
const SERVE = require('./serve.js'); const ROOT = path.resolve(__dirname, '..');
(async () => {
  const srv = await SERVE.start(ROOT); const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const q = process.argv[2] || ''; const pre = process.argv[3] || '/tmp/smoke';
  await page.goto(srv.url + 'index.html' + q); await page.waitForTimeout(1200);
  await page.screenshot({ path: pre + '_1.png' });
  if (!q) { await page.keyboard.press('Enter'); await page.waitForTimeout(1500); }
  await page.screenshot({ path: pre + '_2.png' });
  const steps = JSON.parse(process.argv[4] || '[]');
  for (const [k, ms] of steps) { if (k === 'wait') await page.waitForTimeout(ms); else { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); } }
  await page.screenshot({ path: pre + '_3.png' });
  console.log(JSON.stringify(await page.evaluate(() => ({ st: GAIDEN.state, room: GAIDEN.room && GAIDEN.room.id, P: { x: GAIDEN.P.x | 0, y: GAIDEN.P.y | 0, hp: GAIDEN.P.hp, tank: GAIDEN.P.tank }, stats: GAIDEN.stats }))));
  console.log(errs.join('\n') || 'no errors');
  await browser.close(); srv.close();
})();
