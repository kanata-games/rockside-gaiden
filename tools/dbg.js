const { chromium } = require('playwright'); const SERVE = require('./serve.js'); const BOT = require('./bossbot.js');
(async () => { const srv = await SERVE.start(require('path').resolve(__dirname, '..')); const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(srv.url + 'index.html?' + process.argv[2]); await p.waitForTimeout(800);
  if (process.argv[4]) { await p.evaluate(BOT); await p.evaluate(s => { window.__speed = +s; }, process.argv[4]); }
  await p.waitForTimeout(+process.argv[3] || 3000);
  console.log(JSON.stringify(await p.evaluate(() => ({ st: GAIDEN.state, room: GAIDEN.room && GAIDEN.room.id, px: GAIDEN.P.x, py: GAIDEN.P.y, b: GAIDEN.boss && [GAIDEN.boss.state, GAIDEN.boss.t, GAIDEN.boss.hp], bot: window.__botStats, keys: GAIDEN._test.keys, hasBot: typeof window.__bot, P: { knock: GAIDEN.P.knock, tug: !!GAIDEN.P.tug, dead: GAIDEN.P.dead, vx: GAIDEN.P.vx } }))), errs);
  await p.screenshot({ path: '/tmp/dbg.png' }); await b.close(); srv.close(); })();
