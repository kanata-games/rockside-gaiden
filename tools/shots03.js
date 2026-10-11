// Phone screenshots for v0.3: node tools/shots03.js [filter] -> screenshots/v03_*.png (390x844 @2x)
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
  const ALL = 'float,turbo,djump,phase';
  // ---- new areas
  for (const [name, q, walk] of [['v03_area_crypt_nave.png', '?room=nave&x=8&y=16', 'ArrowRight'], ['v03_area_crypt_catacomb.png', '?room=catacomb&x=30&y=16', 'ArrowLeft'],
    ['v03_area_bath_grandbath.png', '?room=grandbath&x=10&y=16', 'ArrowRight'], ['v03_area_bath_cistern.png', '?room=cistern&x=20&y=16', 'ArrowRight']]) {
    if (!want(name)) continue; const { ctx, page } = await open(q + '&god=1&abil=' + ALL);
    await sleep(600); await page.keyboard.down(walk); await sleep(700); await page.keyboard.up(walk); await sleep(1500); await snap(page, name); await ctx.close(); }
  // ---- warp menu
  if (want('v03_warp')) { const { ctx, page } = await open('?room=warp_crypt&x=4&y=16&abil=' + ALL);
    await sleep(400); await E(page, () => { for (const d of GAIDEN.ROOM_DEFS) if (d.warp) GAIDEN.progress.warps.add(d.id); for (const d of GAIDEN.ROOM_DEFS) for (let x = 0; x < d.cw; x++) for (let y = 0; y < d.ch; y++) GAIDEN.progress.visited.add((d.cx + x) + ',' + (d.cy + y)); });
    await sleep(200); await E(page, () => GAIDEN.placePlayer(12 * 16, 15 * 16, 1));
    await page.waitForFunction(() => GAIDEN.state === 'warp', null, { timeout: 4000 }).catch(() => console.log('no warp menu'));
    await sleep(500); await page.keyboard.press('ArrowRight'); await sleep(400); await snap(page, 'v03_warp_menu.png');
    await page.keyboard.press('z'); await sleep(1400); await snap(page, 'v03_warp_arrive.png'); await ctx.close(); }
  // ---- map (most of the castle explored)
  if (want('v03_map')) { const { ctx, page } = await open('?room=nave&x=8&y=16&abil=' + ALL);
    const ids = await E(page, () => GAIDEN.ROOM_DEFS.map(d => d.id).filter(id => !['yubune', 'clockroom', 'reliquary', 'sauna'].includes(id)));
    for (const id of ids) await E(page, id => GAIDEN.loadRoom(id, { start: true }), id);
    await E(page, () => { for (const d of GAIDEN.ROOM_DEFS) if (d.warp) GAIDEN.progress.warps.add(d.id); GAIDEN.loadRoom('nave', { start: true }); GAIDEN.placePlayer(8 * 16, 15 * 16, 1); });
    await sleep(500); await page.keyboard.press('Tab'); await sleep(700); await snap(page, 'v03_map.png'); await ctx.close(); }
  // ---- the mimic eats a rat (catch the chomp)
  if (want('v03_eat')) { const { ctx, page } = await open('?room=laundry&x=36&y=16&god=1&abil=float');
    await E(page, () => { const G = GAIDEN; for (let i = G.ents.length - 1; i >= 0; i--) if (G.ents[i].ghost || G.ents[i].foe || G.ents[i].type === 'dish') G.ents.splice(i, 1); G.items.length = 0; G.P.face = 1; G.P.tank = []; G.P.gabu = 2;
      G.ents.push(G.makeFoe('rat', G.P.x + 64, G.P.y + G.P.h)); });
    await sleep(300); await page.keyboard.down('x');
    await page.waitForFunction(() => GAIDEN.P.chomp > 8, null, { timeout: 5000, polling: 'raf' }).catch(() => console.log('no chomp'));
    await snap(page, 'v03_eat_chomp.png'); await page.keyboard.up('x'); await sleep(900); await snap(page, 'v03_gabu_full.png'); await ctx.close(); }
  // ---- new bosses mid-attack + weak point
  for (const [kind, roomId, states] of [['organ', 'choir', ['pipes', 'chord', 'requiem']], ['serpent', 'yubune', ['sweep', 'arcs', 'rain']]]) {
    const name = 'v03_boss_' + kind + '.png'; if (!want(name)) continue;
    const { ctx, page } = await open(`?room=${roomId}&x=2&y=16&god=1&abil=${ALL}`);
    await E(page, BOT);
    await page.waitForFunction(st => GAIDEN.boss && st.includes(GAIDEN.boss.state) && GAIDEN.boss.t > 30 && GAIDEN.boss.t < 60, states, { timeout: 90000, polling: 'raf' }).catch(e => console.log('boss wait', kind, e.message));
    await snap(page, name);
    await E(page, () => { window.__speed = 3; }); await page.waitForFunction(() => GAIDEN.P.tug && GAIDEN.P.tug.boss && GAIDEN.P.tug.tugFrames > 20, null, { timeout: 120000, polling: 'raf' }).catch(() => console.log('no core tug', kind));
    await E(page, () => { window.__speed = 0; }); await snap(page, 'v03_boss_' + kind + '_core.png'); await ctx.close(); }
  // ---- buffed bosses: phase-2 moves
  for (const [kind, roomId, abil, st] of [['golem', 'washroom', 'float,turbo', 'leap'], ['rose', 'rosebed', 'float,turbo,djump', 'garden'], ['clock', 'clockroom', ALL, 'midnight']]) {
    const name = 'v03_boss_' + kind + '_' + st + '.png'; if (!want(name)) continue;
    const { ctx, page } = await open(`?room=${roomId}&x=2&y=16&god=1&abil=${abil}&bossatk=${st}`);
    await E(page, BOT); await E(page, () => { window.__speed = 2; });
    await page.waitForFunction(() => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', null, { timeout: 20000 });
    await E(page, () => { const b = GAIDEN.boss; b.hp = Math.floor(b.maxHp * 0.45); b.damage(0); });
    await page.waitForFunction(s => GAIDEN.boss && GAIDEN.boss.state === s && GAIDEN.boss.t > (s === 'midnight' ? 70 : s === 'leap' ? 40 : 30), st, { timeout: 120000, polling: 'raf' }).catch(e => console.log('wait', kind, st, e.message));
    await E(page, () => { window.__speed = 0; }); await sleep(150); await snap(page, name); await ctx.close(); }
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close(); srv.close(); process.exit(0);
})();
