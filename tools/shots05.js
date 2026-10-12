// Phone screenshots for v0.5: node tools/shots05.js [filter] -> screenshots/v05_*.png (390x844 @2x)
const { chromium } = require('playwright'); const path = require('path');
const SERVE = require('./serve.js'); const BOT = require('./bossbot.js'); const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'screenshots'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const only = process.argv[2];
(async () => {
  const srv = await SERVE.start(ROOT); const browser = await chromium.launch(); const errs = [];
  const open = async q => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message));
    await page.goto(srv.url + 'index.html' + q); await page.waitForFunction(() => window.GAIDEN && GAIDEN.state === 'play', null, { timeout: 8000 }); return { ctx, page }; };
  const E = (page, fn, a) => page.evaluate(fn, a);
  const snap = async (page, name) => { await page.screenshot({ path: path.join(OUT, name) }); console.log('saved', name); };
  const want = n => !only || n.includes(only);
  const ALL = 'float,turbo,djump,phase', ALL5 = ALL + ',tank';
  // ---- new areas (Vel greets you in the first room of each)
  const AREAS05 = (process.env.AREAS05 || "wine_casks:?room=casks&x=30&y=16:ArrowLeft:400,wine_tasting:?room=tasting&x=12&y=16:ArrowLeft:300,armory_hall:?room=armoryhall&x=30&y=16:ArrowLeft:300,armory_knightshall:?room=knightshall&x=30&y=34:ArrowRight:400").split(',').map(s => { const [n, q, w, ms] = s.split(':'); return ['v05_area_' + n + '.png', q, w, +ms]; });
  for (const [name, q, walk, ms] of AREAS05) {
    if (!want(name)) continue; const { ctx, page } = await open(q + '&god=1&abil=' + ALL);
    await sleep(600); await page.keyboard.down(walk); await sleep(ms); await page.keyboard.up(walk); await sleep(1600); await snap(page, name); await ctx.close(); }
  // ---- area bosses mid-attack + weak point
  for (const [kind, roomId, st, tt, ab] of JSON.parse(process.env.BOSSES05 || '[["tarant","winethrone","corks",50,""],["knight","tiltyard","halberds",50,",keyring"]]')) {
    const name = 'v05_boss_' + kind + '.png'; if (!want(name)) continue;
    const { ctx, page } = await open(`?room=${roomId}&x=2&y=16&god=1&abil=${ALL5}${ab}&bossatk=${st}`);
    await E(page, BOT); await E(page, () => { window.__speed = 2; });
    await page.waitForFunction(() => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', null, { timeout: 20000 });
    await page.waitForFunction(([s, t]) => GAIDEN.boss && GAIDEN.boss.state === s && GAIDEN.boss.t > t, [st, tt], { timeout: 60000, polling: 'raf' }).catch(e => console.log('wait', kind, e.message));
    await E(page, () => { window.__speed = 0; }); await sleep(150); await snap(page, name);
    await ctx.close(); { const { ctx, page } = await open(`?room=${roomId}&x=2&y=16&god=1&abil=${ALL5}${ab}`); await E(page, BOT);
    await E(page, () => { window.__speed = 4; }); await page.waitForFunction(() => GAIDEN.P.tug && GAIDEN.P.tug.boss && GAIDEN.P.tug.tugFrames > 20, null, { timeout: 120000, polling: 'raf' }).catch(() => console.log('no core tug', kind));
    await E(page, () => { window.__speed = 0; }); await sleep(150); await snap(page, 'v05_boss_' + kind + '_core.png'); await ctx.close(); } }
  // ---- map with both new areas
  if (want('v05_map')) { const { ctx, page } = await open('?room=lobby&x=30&y=16&abil=' + ALL5 + ',keyring,cling');
    const ids = await E(page, () => GAIDEN.ROOM_DEFS.map(d => d.id).filter(id => !['clockheart', 'reliquary', 'sauna'].includes(id)));
    for (const id of ids) await E(page, id => GAIDEN.loadRoom(id, { start: true }), id);
    await E(page, () => { for (const d of GAIDEN.ROOM_DEFS) if (d.warp) GAIDEN.progress.warps.add(d.id); GAIDEN.loadRoom('armoryhall', { start: true }); GAIDEN.placePlayer(20 * 16, 15 * 16, 1); });
    await sleep(500); await page.keyboard.press('Tab'); await sleep(700); await snap(page, 'v05_map.png'); await ctx.close(); }
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close(); srv.close(); process.exit(0);
})();
