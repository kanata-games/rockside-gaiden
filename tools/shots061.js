// v0.6.1 screenshots: node tools/shots061.js -> screenshots/v061_*.png (390x844 @2x)
const { chromium } = require('playwright'); const path = require('path'); const SERVE = require('./serve.js');
const OUT = path.join(__dirname, '..', 'screenshots'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = await SERVE.start(path.join(__dirname, '..')); const browser = await chromium.launch(); const errs = [];
  const open = async q => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message)); await page.goto(srv.url + 'index.html' + q);
    await page.waitForFunction(() => window.GAIDEN && GAIDEN.state === 'play', null, { timeout: 8000 }); return { ctx, page }; };
  const snap = async (page, n) => { await page.screenshot({ path: path.join(OUT, n) }); console.log('saved', n); };
  const seven = 'rose,organ,marionette,orrery,tarant,knight,bellboard';
  // 1) door, partly lit (7/12) - beat the 8th (angler) live so the popup dial animates
  { const { ctx, page } = await open('?room=clockroom&x=12&y=15&god=1&beat=' + seven + ',clock&abil=float,turbo,djump,phase');
    await sleep(800); await snap(page, 'v061_door_partly_lit.png');
    await page.evaluate(() => { GAIDEN.progress.bosses.add('angler'); GAIDEN._test.onSealBeat('angler'); }); await sleep(900); await snap(page, 'v061_dial_hour_lit.png'); await ctx.close(); }
  // 2) all twelve: hands at 12, door open, Vel
  { const { ctx, page } = await open('?room=clockroom&x=12&y=15&god=1&beat=' + seven + ',angler,paintgolem,galecock,boxjack&abil=float,turbo,djump,phase');
    await sleep(500); await page.evaluate(() => { GAIDEN.progress.bosses.add('clock'); GAIDEN._test.onSealBeat('clock'); }); await sleep(1500); await snap(page, 'v061_door_twelve.png'); await ctx.close(); }
  // 3) map with hour numbers and the dial (partly lit)
  { const { ctx, page } = await open('?room=lobby&x=30&y=16&beat=' + seven + '&abil=float,turbo,djump,phase,tank,keyring,cling,lantern');
    const ids = await page.evaluate(() => GAIDEN.ROOM_DEFS.map(d => d.id).filter(id => !['clockheart', 'reliquary', 'sauna'].includes(id)));
    for (const id of ids) await page.evaluate(id => GAIDEN.loadRoom(id, { start: true }), id);
    await page.evaluate(() => { for (const d of GAIDEN.ROOM_DEFS) if (d.warp) GAIDEN.progress.warps.add(d.id); GAIDEN.loadRoom('armoryhall', { start: true }); GAIDEN.placePlayer(20 * 16, 15 * 16, 1); });
    await sleep(300); await page.evaluate(() => { const S = GAIDEN.STORY; S.queue.length = 0; S.box = null; S.vel = null; S.pending = null; });
    await sleep(500); await page.keyboard.press('Tab'); await sleep(700); await snap(page, 'v061_map.png'); await ctx.close(); }
  console.log('errors:', errs.length ? errs : 'none'); await browser.close(); srv.close(); process.exit(0);
})();
