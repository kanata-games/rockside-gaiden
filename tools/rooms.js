// Dev smoke: load every room (all abilities, god mode), run a few seconds, record JS errors + screenshots.
//   node tools/rooms.js [outDir] [roomFilter]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const SERVE = require('./serve.js'); const ROOT = path.resolve(__dirname, '..');
(async () => {
  const out = process.argv[2] || '/tmp/rooms'; fs.mkdirSync(out, { recursive: true });
  const srv = await SERVE.start(ROOT); const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); let errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(srv.url + 'index.html'); await page.waitForTimeout(500);
  const ids = await page.evaluate(() => GAIDEN.ROOM_DEFS.map(d => d.id));
  let bad = 0;
  for (const id of ids) {
    if (process.argv[3] && !id.includes(process.argv[3])) continue;
    errs = [];
    await page.goto(srv.url + 'index.html?room=' + id + '&abil=float,turbo,djump&god=1'); await page.waitForTimeout(2500);
    await page.screenshot({ path: out + '/' + id + '.png' });
    const info = await page.evaluate(() => ({ st: GAIDEN.state, room: GAIDEN.room && GAIDEN.room.id, ents: GAIDEN.ents.length, boss: GAIDEN.boss && GAIDEN.boss.kind }));
    if (errs.length) bad++;
    console.log(id.padEnd(12), JSON.stringify(info), errs.length ? '\n   ' + [...new Set(errs)].join('\n   ') : 'ok');
  }
  console.log(bad ? bad + ' rooms with errors' : 'ALL ROOMS OK');
  await browser.close(); srv.close();
})();
