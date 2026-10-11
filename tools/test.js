// Headless test for ROCKSIDE外伝 (build first: python3 tools/build.py):  node tools/test.js [--shots]
// Serves the repo root locally (same origin layout as GitHub Pages) and plays through the prototype's key systems.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '..'); const SERVE = require('./serve.js'); const BOT = require('./bossbot.js');
const SHOTS = path.join(ROOT, 'screenshots'); fs.mkdirSync(SHOTS, { recursive: true });
const WANT_SHOTS = process.argv.includes('--shots');
const results = [], errors = [];
const ok = (name, cond, info) => { results.push({ name, pass: !!cond }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let URL0;
async function open(browser, q) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: WANT_SHOTS ? 1 : 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`console.error ${q}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror ${q}: ${e.message}`));
  await page.goto(URL0 + 'index.html' + (q || '')); await sleep(300);
  return { ctx, page };
}
const E = (page, fn, arg) => page.evaluate(fn, arg);
async function waitFor(page, fn, timeout = 8000, arg) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (await E(page, fn, arg)) return true; await sleep(40); } return false; }
async function hold(page, key, ms) { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); }
const shot = async (page, name) => { if (WANT_SHOTS) await page.screenshot({ path: path.join(SHOTS, name) }); };

(async () => {
  const srv = await SERVE.start(ROOT); URL0 = srv.url; const browser = await chromium.launch();
  try {
    // ---- title + layout + new game
    { const { ctx, page } = await open(browser, '');
      ok('title screen', await waitFor(page, () => GAIDEN.state === 'title', 8000));
      ok('noindex meta', await E(page, () => !!document.querySelector('meta[name=robots][content*=noindex]')));
      const btns = await E(page, () => ['bL', 'bR', 'bJ', 'bV', 'bS'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return { id, ok: r.width >= 44 && r.height >= 44 && r.bottom <= innerHeight && r.right <= innerWidth && r.left >= 0 }; }));
      ok('touch buttons on screen (>=44px)', btns.every(b => b.ok), btns.filter(b => !b.ok));
      await sleep(900); await shot(page, '1_title.png');
      await page.keyboard.press('Enter');
      ok('new game -> play in foyer', await waitFor(page, () => GAIDEN.state === 'play' && GAIDEN.room.id === 'foyer', 4000));
      // walk right through the door into the gallery (real transition)
      const x0 = await E(page, () => GAIDEN.P.x);
      await hold(page, 'ArrowRight', 600); ok('walks right', (await E(page, () => GAIDEN.P.x)) > x0 + 20);
      await page.keyboard.down('z'); await sleep(120); await page.keyboard.up('z'); await sleep(50);
      ok('jumps', await waitFor(page, () => !GAIDEN.P.onGround, 600));
      await E(page, () => { GAIDEN.P.x = GAIDEN.room.W - 40; GAIDEN.P.y = 15 * 16 - GAIDEN.P.h; GAIDEN.P.vy = 0; });
      await page.keyboard.down('ArrowRight');
      ok('foyer -> gallery through door', await waitFor(page, () => GAIDEN.room.id === 'gallery', 3000));
      await page.keyboard.up('ArrowRight');
      await sleep(400); await shot(page, '2_exploration.png');
      // map screen
      await page.keyboard.press('Tab');
      ok('map screen opens', await waitFor(page, () => GAIDEN.state === 'map', 1500));
      await sleep(300); await shot(page, '4_map.png');
      await page.keyboard.press('Tab'); ok('map closes', await waitFor(page, () => GAIDEN.state === 'play', 1500));
      await ctx.close(); }

    // ---- vacuum tug-of-war: catch a puff ghost and swallow it
    { const { ctx, page } = await open(browser, '?room=foyer&x=12&y=16&god=1');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, () => { GAIDEN.ents.push(GAIDEN.makeGhost('puff', GAIDEN.P.x + 70, GAIDEN.P.y + 24)); GAIDEN.P.face = 1; });
      await page.keyboard.down('x');
      ok('ghost caught -> tug-of-war', await waitFor(page, () => !!GAIDEN.P.tug, 4000));
      await sleep(500); await shot(page, '3_vacuum_tug.png');
      const t0 = await E(page, () => GAIDEN.stats.captures); await page.keyboard.down('ArrowLeft');
      ok('pulling away swallows the ghost', await waitFor(page, n => GAIDEN.stats.captures > n, 12000, t0));
      await page.keyboard.up('ArrowLeft');
      // suck small objects into the tank, then SPIT
      await E(page, () => { GAIDEN.P.tank = []; GAIDEN.spawnItem('book', GAIDEN.P.x + 80, GAIDEN.P.y + GAIDEN.P.h); GAIDEN.P.face = 1; });
      ok('small object sucked into TANK', await waitFor(page, () => GAIDEN.P.tank.length > 0, 3000));
      await page.keyboard.up('x'); await sleep(100);
      const n0 = await E(page, () => GAIDEN.P.tank.length); await page.keyboard.press('c');
      ok('SPIT fires stored object', await waitFor(page, n => GAIDEN.P.tank.length < n && GAIDEN.playerShots.length >= 0, 1500, n0));
      // curtain -> coins
      const c0 = await E(page, () => GAIDEN.progress.coins);
      await E(page, () => { const c = GAIDEN.ents.find(e => e.type === 'curtain' && !e.torn); GAIDEN.placePlayer(c.x - 60, 16 * 16, 1); });
      await page.keyboard.down('x'); ok('curtain ripped by vacuum', await waitFor(page, () => GAIDEN.ents.some(e => e.type === 'curtain' && e.torn), 5000)); await sleep(1500); await page.keyboard.up('x');
      ok('curtain drops coins collected', (await E(page, () => GAIDEN.progress.coins)) > c0);
      // save point
      await E(page, () => { localStorage.clear(); const s = GAIDEN.ents.find(e => e.type === 'save'); GAIDEN.placePlayer(s.x, 16 * 16, 1); });
      ok('save point writes save', await waitFor(page, () => !!localStorage.getItem('gaiden_save_v1'), 3000));
      await ctx.close(); }

    // ---- secret curtain in the dining hall -> vault
    { const { ctx, page } = await open(browser, '?room=dining&x=42&y=16&god=1');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, () => { for (let i = GAIDEN.ents.length - 1; i >= 0; i--) if (GAIDEN.ents[i].ghost) GAIDEN.ents.splice(i, 1); });
      await page.keyboard.down('x');
      ok('secret revealed behind curtain', await waitFor(page, () => GAIDEN.progress.perm.has('dining:secret'), 6000));
      await page.keyboard.up('x'); await page.keyboard.down('ArrowRight');
      ok('hidden vault reachable', await waitFor(page, () => GAIDEN.room.id === 'vault', 6000));
      await page.keyboard.up('ArrowRight');
      await ctx.close(); }

    // ---- library hole -> cellar, cellar shaft -> library, key -> locked door
    { const { ctx, page } = await open(browser, '?room=library&x=12&y=33&god=1');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      ok('library floor hole drops to cellar', await waitFor(page, () => GAIDEN.room.id === 'cellar', 4000));
      await E(page, () => GAIDEN.placePlayer(12 * 16, 7 * 16, 1)); await sleep(200);
      await page.keyboard.down('z');
      ok('cellar shaft jumps back up to library', await waitFor(page, () => GAIDEN.room.id === 'library', 3000));
      await page.keyboard.up('z');
      await E(page, () => { GAIDEN.loadRoom('dining', { start: true }); GAIDEN.placePlayer(22.5 * 16, 6 * 16, 1); });
      ok('key collected', await waitFor(page, () => GAIDEN.progress.hasKey, 3000));
      await E(page, () => { GAIDEN.loadRoom('ante', { start: true }); GAIDEN.placePlayer(20 * 16, 16 * 16, 1); });
      await page.keyboard.down('ArrowRight');
      ok('locked door opens with key -> ballroom', await waitFor(page, () => GAIDEN.room.id === 'ballroom', 6000));
      await page.keyboard.up('ArrowRight');
      await ctx.close(); }

    // ---- every room loads and renders without errors
    { const { ctx, page } = await open(browser, '?room=foyer');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      const ids = await E(page, () => GAIDEN.ROOM_DEFS.map(d => d.id));
      for (const id of ids) { await E(page, id => GAIDEN.loadRoom(id, { start: true }), id); await sleep(150); }
      ok('all rooms load (' + ids.length + ')', ids.length >= 6 && ids.length <= 10, ids);
      await ctx.close(); }

    // ---- boss fight, played by the bot (god mode for determinism)
    { const { ctx, page } = await open(browser, '?room=ballroom&x=2&y=16&god=1');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, BOT);
      ok('boss intro starts', await waitFor(page, () => GAIDEN.boss && GAIDEN.boss.state !== 'sleep', 5000));
      if (WANT_SHOTS) { await waitFor(page, () => GAIDEN.boss.state === 'candles' || GAIDEN.boss.state === 'shards', 20000); await sleep(500); await shot(page, '5_boss.png'); }
      ok('boss crashes and core pops out', await waitFor(page, () => GAIDEN.boss.state === 'stuck', 40000));
      ok('core tug-of-war', await waitFor(page, () => GAIDEN.P.tug && GAIDEN.P.tug.boss, 8000));
      if (WANT_SHOTS) { await sleep(400); await shot(page, '6_boss_core_tug.png'); }
      ok('boss defeated -> clear screen', await waitFor(page, () => GAIDEN.state === 'clear', 120000));
      await sleep(2500); await shot(page, '7_clear.png');
      await ctx.close(); }
  } catch (e) { errors.push('test crash: ' + e.stack); }
  ok('no JS errors', errors.length === 0, errors.slice(0, 8));
  await browser.close(); srv.close();
  const fails = results.filter(r => !r.pass).length; console.log(`\n${results.length - fails}/${results.length} passed`); process.exit(fails ? 1 : 0);
})();
