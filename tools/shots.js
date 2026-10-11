// Phone screenshots for v0.2: node tools/shots.js  -> screenshots/v02_*.png (390x844 @2x, like an iPhone)
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
  // ---- areas (walk a little so the scene is alive)
  for (const [name, q, walk] of [['v02_area_laundry.png', '?room=laundry&x=12&y=16&abil=float', 'ArrowRight'], ['v02_area_garden.png', '?room=greenhouse&x=40&y=30&abil=float,turbo', 'ArrowLeft'],
    ['v02_area_courtyard.png', '?room=courtyard&x=30&y=16&abil=float,turbo', 'ArrowRight'], ['v02_area_clock.png', '?room=pendulum&x=14&y=16&abil=float,turbo,djump', 'ArrowRight'], ['v02_area_attic.png', '?room=attic&x=60&y=16&abil=float,turbo,djump', 'ArrowLeft']]) {
    if (!want(name)) continue; const { ctx, page } = await open(q + '&god=1');
    await sleep(600); await page.keyboard.down(walk); await sleep(700); await page.keyboard.up(walk); await sleep(1700); await snap(page, name); await ctx.close(); }
  // ---- bosses mid-attack (bot plays, real speed)
  for (const [kind, roomId, abil, states] of [['chandelier', 'ballroom', '', ['candles', 'shards']], ['golem', 'washroom', 'float,turbo', ['roll']], ['rose', 'rosebed', 'float,turbo,djump', ['petals', 'thorns']], ['clock', 'clockroom', 'float,turbo,djump', ['pendulum']]]) {
    const name = 'v02_boss_' + kind + '.png'; if (!want(name)) continue;
    const { ctx, page } = await open(`?room=${roomId}&x=2&y=16&god=1${abil ? '&abil=' + abil : ''}`);
    await E(page, BOT);
    await page.waitForFunction(st => GAIDEN.boss && st.includes(GAIDEN.boss.state) && GAIDEN.boss.t > (GAIDEN.boss.kind === 'clock' ? 95 : GAIDEN.boss.kind === 'golem' ? 70 : 52), states, { timeout: 90000, polling: 'raf' }).catch(e => console.log('boss wait', kind, e.message));
    await snap(page, name);
    // the weak point
    await E(page, () => { window.__speed = 3; }); await page.waitForFunction(() => GAIDEN.P.tug && GAIDEN.P.tug.boss && GAIDEN.P.tug.tugFrames > 20, null, { timeout: 120000, polling: 'raf' }).catch(() => console.log('no core tug', kind));
    await E(page, () => { window.__speed = 0; }); await snap(page, 'v02_boss_' + kind + '_core.png');
    await ctx.close(); }
  // ---- throwing an object at a normal enemy: capture the moment of impact
  if (want('v02_throw_hit')) { const { ctx, page } = await open('?room=laundry&x=36&y=16&god=1&abil=float');
    await E(page, () => { for (let i = GAIDEN.ents.length - 1; i >= 0; i--) if (GAIDEN.ents[i].ghost || GAIDEN.ents[i].foe) GAIDEN.ents.splice(i, 1);
      GAIDEN.ents.push(GAIDEN.makeFoe('skeleton', GAIDEN.P.x + 110, 15 * 16)); GAIDEN.P.face = 1; GAIDEN.P.tank = ['bottle', 'chair']; });
    await sleep(800); const h0 = await E(page, () => GAIDEN.stats.foeHits);
    await page.keyboard.press('c');
    await page.waitForFunction(() => { const f = GAIDEN.foes()[0], s = GAIDEN.playerShots[0]; return f && s && Math.abs(s.x + s.w / 2 - f.x) < 22; }, null, { timeout: 4000, polling: 'raf' }).catch(() => console.log('no shot near foe'));
    await snap(page, 'v02_throw_hit.png'); await ctx.close(); }
  // ---- float platform
  if (want('v02_float')) { const { ctx, page } = await open('?room=pantry&x=8&y=16&god=1&abil=float,turbo');
    await E(page, () => { for (let i = GAIDEN.ents.length - 1; i >= 0; i--) if (GAIDEN.ents[i].foe) GAIDEN.ents.splice(i, 1); GAIDEN.P.tank = ['chair', 'pot']; GAIDEN.P.face = 1; });
    await sleep(500); await page.keyboard.down('c'); await sleep(500); await page.keyboard.up('c'); await sleep(150);
    await page.keyboard.down('ArrowLeft'); await sleep(300); await page.keyboard.up('ArrowLeft'); await sleep(100);
    await page.keyboard.down('z'); await page.keyboard.down('ArrowRight'); await sleep(160); await page.keyboard.up('ArrowRight');
    await page.waitForFunction(() => GAIDEN.P.vy > 0.3 && !GAIDEN.P.onGround, null, { timeout: 3000, polling: 'raf' }).catch(() => console.log('no apex'));
    await snap(page, 'v02_float_jump.png'); await page.keyboard.up('z');
    await E(page, () => { const f = GAIDEN.floats[0]; GAIDEN.P.x = f.x + f.w / 2 - GAIDEN.P.w / 2; GAIDEN.P.y = f.y - GAIDEN.P.h - 1; GAIDEN.P.vy = 0; GAIDEN.P.face = 1; });
    await page.waitForFunction(() => GAIDEN.P.onFloat, null, { timeout: 3000, polling: 'raf' }).catch(() => console.log('not on float'));
    await sleep(250); await snap(page, 'v02_float_platform.png'); await ctx.close(); }
  // ---- full map (late-game save: most of the mansion explored)
  if (want('v02_map')) { const { ctx, page } = await open('?room=belfry&x=8&y=16&abil=float,turbo,djump&beat=chandelier,golem,rose');
    await E(page, () => { const skip = new Set(['dollroom', 'clockroom', 'birdcage']); for (const k in GAIDEN.CELL_ROOM) if (!skip.has(GAIDEN.CELL_ROOM[k])) GAIDEN.progress.visited.add(k); GAIDEN.progress.coins = 312; GAIDEN.progress.hasKey = true; });
    await sleep(500); await page.keyboard.press('Tab'); await sleep(700); await snap(page, 'v02_map.png'); await ctx.close(); }
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors');
  await browser.close(); srv.close();
})();
