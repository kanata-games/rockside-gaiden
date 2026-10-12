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
      await sleep(1100); await page.keyboard.up('ArrowRight');
      await sleep(500); await shot(page, '2_exploration.png');
      // visit a few rooms so the map has something to show, then come back
      await E(page, () => { for (const id of ['library', 'dining', 'cellar', 'gallery']) GAIDEN.loadRoom(id, { start: true }); GAIDEN.placePlayer(40 * 16, 15 * 16, 1); GAIDEN.snapCamera(); });
      await sleep(300);
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
      for (const id of ids) { await E(page, id => GAIDEN.loadRoom(id, { start: true }), id); await sleep(120); }
      const areas = await E(page, () => { const n = {}; for (const d of GAIDEN.ROOM_DEFS) n[d.area] = (n[d.area] || 0) + 1; return n; });
      ok('all rooms load (' + ids.length + ')', ids.length >= 30, areas);
      ok('3 new areas with 6-10 rooms each', ['laundry', 'garden', 'clock'].every(a => areas[a] >= 6 && areas[a] <= 10), areas);
      ok('v0.3 areas: crypt + bath with 6+ rooms each', areas.crypt >= 6 && areas.bath >= 6, areas);
      const crit = await E(page, () => { let rats = 0, bats = 0; for (const d of GAIDEN.ROOM_DEFS) for (const e of d.ents || []) { if (e[0] === 'rat') rats++; if (e[0] === 'bats' && !(e[3] && e[3].foe && e[3].foe.skin)) bats++; } return { rats, bats, warps: GAIDEN.ROOM_DEFS.filter(d => d.warp).map(d => d.area) }; });
      ok('fewer rats and bat swarms (<= 15 rats, <= 6 swarms)', crit.rats <= 15 && crit.bats <= 6, crit);
      ok('a warp room in every area', ['east', 'laundry', 'garden', 'clock', 'crypt', 'bath', 'wine', 'armory', 'servants', 'lake'].every(a => crit.warps.includes(a)), crit.warps);
      ok('title has no PROTOTYPE', !(await E(page, () => document.documentElement.innerHTML.includes('PROTOTYPE'))));
      ok('version 0.5.2', await E(page, () => (typeof GAME_VERSION !== 'undefined' && GAME_VERSION === '0.5.2') || GAIDEN.CONFIG.version === '0.5.2'));
      await ctx.close(); }

    // ---- world reachability / ability gating (static check over the stitched tile grid)
    { const r = require('child_process').spawnSync('node', [path.join(__dirname, 'reach.js')], { encoding: 'utf8' });
      const order = (r.stdout.match(/== area \w+ reachable \(abilities: [^)]*\)/g) || []);
      ok('every cell / pickup / boss reachable', r.status === 0, r.stdout.split('\n').filter(l => /unreached|REACH/.test(l)));
      ok('areas gated by abilities (garden needs turbo, clock tower needs double jump)', order.some(l => /garden.*turbo/.test(l)) && order.some(l => /clock.*djump/.test(l)), order);
      ok('bath gated by phase (from the organ)', order.some(l => /bath.*phase/.test(l)) && /BOSS organ[\s\S]*ability phase[\s\S]*BOSS clock/.test(r.stdout), order); }

    // ---- v0.3: warp rooms + destination menu
    { const { ctx, page } = await open(browser, '?room=warp_east&x=4&y=16');
      await waitFor(page, () => GAIDEN.state === 'play', 5000); await sleep(300);
      await E(page, () => { for (const d of GAIDEN.ROOM_DEFS) if (d.warp) GAIDEN.progress.warps.add(d.id); GAIDEN.placePlayer(12 * 16, 15 * 16, 1); });
      ok('warp pad opens the destination menu', await waitFor(page, () => GAIDEN.state === 'warp', 3000));
      await sleep(400); await page.keyboard.press('ArrowRight'); await sleep(200); await shot(page, 'v03_warp_menu.png');
      await page.keyboard.press('z');
      ok('warp to another discovered warp room', await waitFor(page, () => GAIDEN.state === 'play' && GAIDEN.room.def.warp && GAIDEN.room.id !== 'warp_east', 3000), await E(page, () => GAIDEN.room.id));
      await ctx.close(); }

    // ---- v0.3: spirit barriers open with the phase ability
    { const { ctx, page } = await open(browser, '?room=gearshaft&x=6&y=16&abil=float,turbo,djump');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      const g0 = await E(page, () => { const R = GAIDEN.room; return R.grid[11 * R.cols]; });
      await E(page, () => GAIDEN.gainAbility({ abil: 'phase', x: 100, y: 240 })); await sleep(300);
      const g1 = await E(page, () => { const R = GAIDEN.room; return R.grid[11 * R.cols]; });
      ok('spirit barrier closed without phase, open after the organ\'s gift', g0 !== 0 && g1 === 0, { g0, g1 }); await ctx.close(); }
    // ---- v0.4.2: every Vel / Chronoa dialogue line fits the portrait box on a 390px phone (<= 3 lines, inside the right edge)
    //      and the room-name banner waits while a dialogue is showing
    { const fs = require('fs'); const src = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n');
      const texts = [...src.matchAll(/storySay\('(?:vel|chronoa)', '([^']+)'/g)].map(m => m[1]);
      const { ctx, page } = await open(browser, '?room=towertop&x=8&y=16&god=1&abil=float,turbo,djump,phase,tank');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      const all = texts.concat(await E(page, () => Object.values(GAIDEN.VEL_LINES)));
      const fit = await E(page, T => T.map(t => ({ t, ...GAIDEN.storyFit(t) })), all);
      const badFit = fit.filter(f => f.lines > 3 || f.w > f.limit || f.x0 + f.w > f.boxRight || f.bad);
      ok('v0.4.2: all ' + fit.length + ' Vel/Chronoa lines fit the dialogue box at 390px (<= 3 lines, no overflow, no wrapped line starting with 。/…)', fit.length >= 12 && !badFit.length, badFit.slice(0, 3));
      await waitFor(page, () => GAIDEN.STORY.box && GAIDEN.STORY.box.who === 'vel', 4000); await sleep(600);
      const b0 = await E(page, () => GAIDEN.banner.t);
      await E(page, () => { GAIDEN.STORY.box = null; GAIDEN.STORY.queue.length = 0; }); await sleep(600);
      const b1 = await E(page, () => GAIDEN.banner.t);
      ok('v0.4.2: the room banner is held while Vel speaks, then plays', b0 >= 168 && b1 < b0, { b0, b1 }); await ctx.close(); }
    // ---- v0.4: the two new areas are behind spirit barriers (theater: gallery ceiling, observatory: gear shaft) + skinned foes
    { const { ctx, page } = await open(browser, '?room=gallery&x=36&y=11&abil=float,turbo,djump');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      const t0 = await E(page, () => { const R = GAIDEN.room; return R.grid[0 * R.cols + 35]; });
      // (place Kanata inside the new room in the same tick: the gallery x=576 is outside the 384px gear shaft and would exit at once)
      await E(page, () => { GAIDEN.loadRoom('gearshaft', { start: true }); GAIDEN.placePlayer(19 * 16, 15 * 16, 1); });
      await page.keyboard.down('ArrowRight'); await sleep(1200); await page.keyboard.up('ArrowRight');   // walk into the barrier without 霊体化
      const s0 = await E(page, () => { const R = GAIDEN.room; return R.id === 'gearshaft' ? R.grid[12 * R.cols + R.cols - 1] : 'left:' + R.id; });
      await E(page, () => { GAIDEN.gainAbility({ abil: 'phase', x: 100, y: 240 }); GAIDEN.loadRoom('gallery', { start: true }); GAIDEN.placePlayer(36 * 16, 10 * 16, 1); }); await sleep(300);
      const t1 = await E(page, () => { const R = GAIDEN.room; return R.grid[0 * R.cols + 35]; });
      ok('v0.4: theater + observatory entrances are spirit barriers (need 霊体化)', t0 === 5 && s0 === 5 && t1 === 0, { t0, s0, t1 });
      await E(page, () => { GAIDEN.loadRoom('audience', { start: true }); GAIDEN.placePlayer(10 * 16, 15 * 16, 1); }); await sleep(300);
      ok('v0.4: theater foes wear their own skins (dancer / maskbat)', await E(page, () => GAIDEN.foes().some(e => e.skin === 'dancer') && GAIDEN.foes().some(e => e.skin === 'maskbat')));
      ok('v0.4: area music + Vel line exist for both new areas', await E(page, () => GAIDEN.AREAS.theater.music === 'theater' && GAIDEN.AREAS.stars.music === 'stars' && !!GAIDEN.ROOM_BY_ID.lobby.vel && !!GAIDEN.ROOM_BY_ID.starhall.vel));
      await ctx.close(); }

    // ---- v0.4.3: softlock fixes (lobby ledge wedge): unstick, drop-through, stuck escape, map 'return to entry'
    { const { ctx, page } = await open(browser, '?room=lobby&x=40&y=16&abil=float,turbo,djump');
      await waitFor(page, () => GAIDEN.state === 'play', 5000); await sleep(300);
      await E(page, () => { GAIDEN.placePlayer(8 * 16 + 8, 6 * 16, 1); }); await sleep(400);
      const on = await E(page, () => GAIDEN.P.onGround && Math.abs(GAIDEN.P.y + GAIDEN.P.h - 96) < 1);
      await page.keyboard.press('ArrowDown'); await sleep(600);
      const dropped = await E(page, () => GAIDEN.P.y + GAIDEN.P.h > 96 + 32);
      ok('v0.4.3: the lobby ledge has headroom and ↓ drops through it', on && dropped, { on, dropped });
      await E(page, () => { const P = GAIDEN.P; P.x = 8 * 16; P.y = 0; P.vx = P.vy = 0; }); await sleep(300);   // shove her into the ceiling
      ok('v0.4.3: overlapping a solid nudges her free', await E(page, () => !GAIDEN.boxHitsSolid(GAIDEN.P.x, GAIDEN.P.y, GAIDEN.P.w, GAIDEN.P.h)));
      await E(page, () => { const R = GAIDEN.room; window.__jv = GAIDEN.CONFIG.jumpVel; GAIDEN.CONFIG.jumpVel = 0; GAIDEN.STORY.box = null; GAIDEN.loadRoom('warp_east', { start: true }); GAIDEN.placePlayer(10 * 16 + 8, 15 * 16, 1); GAIDEN._test.keys.jump = true; }); await sleep(5500);   // simulate a wedge: JUMP held, 
      const esc = await E(page, () => { GAIDEN._test.keys.jump = false; GAIDEN.CONFIG.jumpVel = window.__jv; return GAIDEN.stats.lastEscape || null; });
      ok('v0.4.3: wedged in mid-air while pushing for 3s -> back to the room entry', esc === 'stuck', { esc });
      await E(page, () => { GAIDEN.P.x = 300; GAIDEN.P.y = 100; GAIDEN.stats.lastEscape = null; }); await page.keyboard.press('Tab'); await sleep(300); await page.keyboard.press('KeyX'); await sleep(300);
      ok('v0.4.3: MAP screen offers 部屋の入口に戻る', await E(page, () => GAIDEN.state === 'play' && GAIDEN.stats.lastEscape === 'menu'));
      await ctx.close(); }
    // ---- v0.5: wine cellar behind a spirit barrier, armory behind a ring gate (鍵束), watchtower top needs グリム吸着
    { const { ctx, page } = await open(browser, '?room=warp_east&x=3&y=15&abil=float,turbo,djump');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      const g = await E(page, () => { const R = GAIDEN.room; let n5 = 0; for (const v of R.grid) if (v === 5) n5++; return n5; });
      await E(page, () => { GAIDEN.loadRoom('ossuary', { start: true }); GAIDEN.placePlayer(10 * 16, 14 * 16, 1); }); await sleep(300);
      const r0 = await E(page, () => { const R = GAIDEN.room; return R.grid[12 * R.cols + R.cols - 1]; });
      await E(page, () => { GAIDEN.gainAbility({ abil: 'keyring', x: 100, y: 240 }); }); await sleep(300);
      const r1 = await E(page, () => { const R = GAIDEN.room; return R.grid[12 * R.cols + R.cols - 1]; });
      ok('v0.5: wine entrance is a spirit barrier; armory ring gate opens with 鍵束', g > 0 && r0 !== 0 && r1 === 0, { g, r0, r1 });
      ok('v0.5: new areas have music, Vel lines, warp rooms and bosses', await E(page, () => GAIDEN.AREAS.wine.music === 'wine' && GAIDEN.AREAS.armory.music === 'armory' && !!GAIDEN.ROOM_BY_ID.tasting.vel && !!GAIDEN.ROOM_BY_ID.armoryhall.vel && !!GAIDEN.ROOM_BY_ID.warp_wine && !!GAIDEN.ROOM_BY_ID.warp_armory));
      await ctx.close(); }
    { const { ctx, page } = await open(browser, '?room=watchtower&x=3&y=34&abil=cling');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, () => { const G = GAIDEN, K = G._test.keys, I = G._test.inp; window.__cl = { minY: 1e9, held: 0 };
        window.__bot = () => { const P = G.P, S = window.__cl; K.left = true; if (G.room.id === 'watchtower') S.minY = Math.min(S.minY, P.y);
          if (S.held > 0) { S.held--; K.jump = true; } else { K.jump = false; if (P.onGround || P.clingT > 0) { I.jumpPressed = true; K.jump = true; S.held = 14; } } }; window.__speed = 2; });
      await sleep(6000);
      const cl = await E(page, () => ({ room: GAIDEN.room.id, minY: window.__cl.minY })); await E(page, () => { window.__bot = null; });
      ok('v0.5: グリム吸着 wall-jumps climb the watchtower shaft', cl.room === 'watchtower' && cl.minY < 120, cl);
      await ctx.close(); }

    // ---- v0.6: rooftop spires up through the belfry hatch; the galecock topples into its core after the storm
    { const { ctx, page } = await open(browser, '?room=belfry&x=4&y=15&abil=float,turbo,djump,phase');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      ok('v0.6: belfry has a roof hatch up to the spires', await E(page, () => { const R = GAIDEN.room; return R.grid[0 * R.cols + 10] === 0 && R.grid[1 * R.cols + 11] === 0; }));
      ok('v0.6: spires area has music, warp room, boss', await E(page, () => GAIDEN.AREAS.spires.music === 'spires' && !!GAIDEN.ROOM_BY_ID.warp_spires && GAIDEN.ROOM_BY_ID.weathertop.boss === 'galecock'));
      await E(page, () => { GAIDEN.loadRoom('roofwalk', { start: true }); GAIDEN.placePlayer(3 * 16, 15 * 16, 1); }); await sleep(300);
      ok('v0.6: roof foes wear their own skins (crow / vanegarg)', await E(page, () => GAIDEN.foes().some(e => e.skin === 'crow') && GAIDEN.foes().some(e => e.skin === 'vanegarg')));
      await ctx.close(); }
    { const { ctx, page } = await open(browser, '?room=weathertop&x=2&y=16&god=1&abil=float,turbo,djump,phase,cling&bossatk=storm');
      await waitFor(page, () => GAIDEN.state === 'play', 5000); await E(page, () => { window.__speed = 4; GAIDEN._test.keys.right = true; });
      await waitFor(page, () => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', 30000); await E(page, () => { GAIDEN._test.keys.right = false; });
      const got = await waitFor(page, () => GAIDEN.boss && GAIDEN.boss.state === 'fallen' && !!GAIDEN.boss.core, 40000);
      ok('v0.6: galecock storm topples it and exposes the storm core', !!got);
      await ctx.close(); }
    // ---- v0.5.1: servants' quarters behind a ring gate in the bottling shaft, the lake behind black fog (カンテラ)
    { const { ctx, page } = await open(browser, '?room=bottling&x=3&y=33&abil=float,turbo,djump,phase');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      const r0 = await E(page, () => { const R = GAIDEN.room; return R.grid[30 * R.cols + 0]; });
      await E(page, () => { GAIDEN.gainAbility({ abil: 'keyring', x: 100, y: 240 }); }); await sleep(300);
      const r1 = await E(page, () => { const R = GAIDEN.room; return R.grid[30 * R.cols + 0]; });
      await E(page, () => { GAIDEN.loadRoom('servstair', { start: true }); GAIDEN.placePlayer(4 * 16, 33 * 16, 1); }); await sleep(300);
      const d0 = await E(page, () => { const R = GAIDEN.room; return R.grid[34 * R.cols + 10]; });
      await E(page, () => { GAIDEN.gainAbility({ abil: 'lantern', x: 100, y: 240 }); }); await sleep(300);
      const d1 = await E(page, () => { const R = GAIDEN.room; return R.grid[34 * R.cols + 10]; });
      ok('v0.5.1: servants door needs 鍵束, the lake hole needs カンテラ', r0 !== 0 && r1 === 0 && d0 !== 0 && d1 === 0, { r0, r1, d0, d1 });
      ok('v0.5.1: new areas have music, warp rooms, bosses and skinned foes', await E(page, () => GAIDEN.AREAS.servants.music === 'servants' && GAIDEN.AREAS.lake.music === 'lake' && !!GAIDEN.ROOM_BY_ID.warp_servants && !!GAIDEN.ROOM_BY_ID.warp_lake
        && GAIDEN.ROOM_BY_ID.bellhall.boss === 'bellboard' && GAIDEN.ROOM_BY_ID.abyss.boss === 'angler'));
      await E(page, () => { GAIDEN.loadRoom('shore', { start: true }); GAIDEN.placePlayer(3 * 16, 15 * 16, 1); }); await sleep(300);
      ok('v0.5.1: lake foes wear their own skins (blindcrab / lakewisp)', await E(page, () => GAIDEN.foes().some(e => e.skin === 'blindcrab') && GAIDEN.foes().some(e => e.skin === 'lakewisp')));
      await ctx.close(); }

    // ---- v0.3: room entry safety (no stunlock at the door)
    { const { ctx, page } = await open(browser, '?room=pantry&x=1&y=16&god=0');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      const r = await E(page, () => { const G = GAIDEN; G.ents.push(G.makeFoe('rat', G.P.x + 30, G.P.y + G.P.h)); G.ents.push(G.makeFoe('skeleton', G.P.x + 50, G.P.y + G.P.h)); G.entrySafety();
        return { near: G.foes().filter(e => Math.abs(e.x - (G.P.x + G.P.w / 2)) < G.CONFIG.entrySafe).length, grace: G.P.grace }; });
      ok('entering a room: foes pushed out of the door zone + grace i-frames', r.near === 0 && r.grace > 0, r); await ctx.close(); }

    // ---- normal (big) enemies: immune to the vacuum, beaten by thrown objects
    { const { ctx, page } = await open(browser, '?room=laundry&x=5&y=16&god=1');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, () => { GAIDEN.P.x = 150; GAIDEN.P.y = 15 * 16 - GAIDEN.P.h; GAIDEN.P.vx = GAIDEN.P.vy = 0; // v0.3.2: stand on the floor (the spawn is a ledge)
        for (let i = GAIDEN.ents.length - 1; i >= 0; i--) if (GAIDEN.ents[i].ghost || GAIDEN.ents[i].foe) GAIDEN.ents.splice(i, 1);
        GAIDEN.ents.push(GAIDEN.makeFoe('skeleton', GAIDEN.P.x + 90, 15 * 16)); GAIDEN.P.face = 1; GAIDEN.P.tank = []; });
      const hp0 = await E(page, () => GAIDEN.foes()[0].hp);
      await page.keyboard.down('x'); await sleep(900); await page.keyboard.up('x');
      ok('foe immune to suction', await E(page, h => GAIDEN.foes().length === 1 && GAIDEN.foes()[0].hp === h && GAIDEN.P.tank.length === 0, hp0));
      await E(page, () => { GAIDEN.P.tank = ['chair', 'bottle', 'book']; GAIDEN.P.face = 1; });
      for (let i = 0; i < 3; i++) { await page.keyboard.press('c'); await sleep(450); }
      await sleep(300); if (WANT_SHOTS) await shot(page, 'v02_throw_hit.png');
      ok('thrown objects hurt / defeat the foe', await waitFor(page, () => GAIDEN.stats.foeHits > 0 && (GAIDEN.stats.foeKills > 0 || GAIDEN.foes()[0].hp < GAIDEN.CONFIG.foes.skeleton.hp), 4000), await E(page, () => ({ hits: GAIDEN.stats.foeHits, kills: GAIDEN.stats.foeKills })));
      // heavy object needs turbo
      await E(page, () => { GAIDEN.spawnItem('barrel', GAIDEN.P.x + 70, 15 * 16); GAIDEN.P.face = 1; GAIDEN.P.tank = []; });
      await page.keyboard.down('x'); await sleep(900); await page.keyboard.up('x');
      ok('heavy barrel cannot be sucked without turbo', await E(page, () => !GAIDEN.P.tank.includes('barrel')));
      // v0.3: tiny critters are EATEN by the mimic vacuum (heal + GABU gauge); a full gauge powers up SPIT
      await E(page, () => { for (let i = GAIDEN.ents.length - 1; i >= 0; i--) if (GAIDEN.ents[i].ghost || GAIDEN.ents[i].foe) GAIDEN.ents.splice(i, 1);
        GAIDEN.items.length = 0; GAIDEN.ebullets.length = 0; for (let i = GAIDEN.ents.length - 1; i >= 0; i--) if (GAIDEN.ents[i].type === 'dish') GAIDEN.ents.splice(i, 1); GAIDEN.ents.push(GAIDEN.makeFoe('rat', GAIDEN.P.x + 60, GAIDEN.P.y + GAIDEN.P.h)); GAIDEN.P.face = 1; GAIDEN.P.tank = []; GAIDEN.P.hp = 4; GAIDEN.P.gabu = 0; });
      await page.keyboard.down('x'); await sleep(1200); await page.keyboard.up('x');
      ok('rat gets eaten (chomp): heal + GABU gauge, not stored in the tank', await E(page, () => GAIDEN.foes().length === 0 && GAIDEN.stats.eaten === 1 && GAIDEN.P.hp === 5 && GAIDEN.P.gabu === 1 && GAIDEN.P.tank.length === 0),
        await E(page, () => ({ foes: GAIDEN.foes().length, eaten: GAIDEN.stats.eaten, hp: GAIDEN.P.hp, gabu: GAIDEN.P.gabu, tank: GAIDEN.P.tank })));
      await E(page, () => { GAIDEN.ents.push(GAIDEN.makeFoe('bat', GAIDEN.P.x + 50, GAIDEN.P.y + 30)); GAIDEN.P.face = 1; });
      await page.keyboard.down('x'); await sleep(1200); await page.keyboard.up('x');
      ok('bat gets eaten too', await E(page, () => GAIDEN.stats.eaten === 2 && GAIDEN.P.gabu === 2));
      await E(page, () => { GAIDEN.ents.push(GAIDEN.makeFoe('skeleton', GAIDEN.P.x + 70, GAIDEN.P.y + GAIDEN.P.h)); GAIDEN.P.gabu = GAIDEN.CONFIG.eat.max; GAIDEN.P.tank = []; GAIDEN.P.face = 1; });
      const sk0 = await E(page, () => GAIDEN.foes()[0].hp); await page.keyboard.press('c'); await sleep(400);
      ok('full GABU gauge: empty-tank SPIT = bite wave that damages a big foe', await E(page, h => GAIDEN.P.gabu === 0 && GAIDEN.stats.gabuShots === 1 && (GAIDEN.foes().length === 0 || GAIDEN.foes()[0].hp < h), sk0));
      await ctx.close(); }

    // ---- chandelier defeat -> floor gives way + float pedestal; float power makes a platform
    { const { ctx, page } = await open(browser, '?room=ballroom&x=2&y=16&god=1');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, BOT); await E(page, () => { window.__speed = 8; });
      ok('boss 1 (chandelier) core tug-of-war', await waitFor(page, () => GAIDEN.P.tug && GAIDEN.P.tug.boss, 60000));
      ok('boss 1 defeated -> floor opens', await waitFor(page, () => GAIDEN.progress.bosses.has('chandelier') && GAIDEN.progress.perm.has('ballroom:gate:floor'), 90000));
      await E(page, () => { window.__bot = null; window.__speed = 0; for (const k in GAIDEN._test.keys) GAIDEN._test.keys[k] = false; });
      await E(page, () => { if (!GAIDEN.ents.find(e => e.type === 'ability')) GAIDEN.loadRoom('ballroom'); /* the bot may have dropped through the opened floor */ const a = GAIDEN.ents.find(e => e.type === 'ability'); GAIDEN.placePlayer(a.x, 15 * 16, 1); });
      ok('float ability collected from pedestal', await waitFor(page, () => GAIDEN.hasAbil('float'), 5000));
      await sleep(2500); for (let i = 0; i < 4; i++) { await page.keyboard.press('Enter'); await sleep(200); }
      await E(page, () => { GAIDEN.P.tank = ['chair']; GAIDEN.placePlayer(9 * 16, 15 * 16, 1); });
      await sleep(200); await page.keyboard.down('c'); await sleep(600); await page.keyboard.up('c');
      ok('hold SPIT -> object floats as a platform', await waitFor(page, () => GAIDEN.floats.length > 0, 2000));
      await page.keyboard.down('z'); await sleep(300); await page.keyboard.up('z');
      ok('stand on the float platform', await waitFor(page, () => GAIDEN.P.onFloat, 3000));
      await sleep(200); if (WANT_SHOTS) await shot(page, 'v02_float_platform.png');
      await ctx.close(); }

    // ---- turbo: lever + wardrobe; double jump; vines burn
    { const { ctx, page } = await open(browser, '?room=ironhall&x=14&y=16&god=1&abil=float,turbo');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, () => { for (let i = GAIDEN.ents.length - 1; i >= 0; i--) if (GAIDEN.ents[i].foe) GAIDEN.ents.splice(i, 1); const l = GAIDEN.ents.find(e => e.type === 'lever'); GAIDEN.placePlayer(l.x - 60, 15 * 16, 1); });
      await page.keyboard.down('x');
      ok('turbo suction pulls a lever -> gate opens', await waitFor(page, () => GAIDEN.progress.perm.has('ironhall:gate:iron'), 5000));
      await page.keyboard.up('x');
      await E(page, () => { GAIDEN.loadRoom('foyer', { start: true }); const h = GAIDEN.ents.find(e => e.type === 'heavy'); GAIDEN.placePlayer(h.x + 70, 15 * 16, -1); GAIDEN.P.face = -1; });
      await page.keyboard.down('x');
      ok('turbo suction drags the wardrobe away (foyer -> garden)', await waitFor(page, () => GAIDEN.progress.perm.has('foyer:gate:wardrobe'), 6000));
      await page.keyboard.up('x');
      await E(page, () => { GAIDEN.loadRoom('greenhouse', { start: true }); for (let i = GAIDEN.ents.length - 1; i >= 0; i--) if (GAIDEN.ents[i].foe || GAIDEN.ents[i].ghost) GAIDEN.ents.splice(i, 1);
        const v = GAIDEN.ents.find(e => e.type === 'vines'); GAIDEN.placePlayer(v.x + 80, (Math.floor(v.y / 16) + 1) * 16, -1); GAIDEN.P.face = -1; GAIDEN.P.tank = ['candle']; });
      await sleep(200); await page.keyboard.press('c');
      ok('burning object burns the vines', await waitFor(page, () => GAIDEN.progress.perm.has('greenhouse:gate:vine1'), 5000));
      await E(page, () => { GAIDEN.progress.abil.djump = true; GAIDEN.placePlayer(20 * 16, 15 * 16, 1); });
      await sleep(300); const d0 = await E(page, () => GAIDEN.stats.djumps);
      await page.keyboard.down('z'); await sleep(250); await page.keyboard.up('z'); await sleep(120); await page.keyboard.down('z'); await sleep(250); await page.keyboard.up('z');
      ok('double jump in the air', await waitFor(page, n => GAIDEN.stats.djumps > n, 1500, d0));
      await ctx.close(); }

    // ---- v0.3.1 regression: telegraphed from-above attacks must actually drop something that reaches the floor
    { const { ctx, page } = await open(browser, '?room=washroom&x=4&y=16&god=1&abil=float,turbo');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      const r = await E(page, async () => { const G = GAIDEN; G.ebullets.push({ kind: 'sock', x: 200, y: 20, w: 10, h: 12, vx: 0, vy: 1.4, g: 0.24, dmg: 1, life: 200 });
        const q = G.ebullets[G.ebullets.length - 1]; const y0 = q.y; await new Promise(res => setTimeout(res, 700)); return { y0, y: Math.round(q.y), dead: q.dead, fell: Math.round(q.y - y0) }; });
      ok('engine: a falling bullet spawned inside the ceiling drops out of it (is not culled on frame 1)', r.fell > 40, r);
      await ctx.close(); }
    { const DROPS = require('./drops.js'); const out = await DROPS(URL0, { speed: 4 });
      for (const c of out) ok(`drop attack ${c.boss}.${c.atk}${c.rage ? ' (enraged)' : ''}: projectiles fall and reach the floor`, c.pass, { n: c.n, bad: c.bad, e: c.sample && { kind: c.sample.kind, spawnY: c.sample.y0, lowest: Math.round(c.sample.maxB), frames: c.sample.frames } }); }
    // ---- v0.3.2: every boss attack is avoidable at human reaction speed (18f = 300ms) with the real movement (tools/avoid.js)
    if (process.env.AVOID !== '0') { const AV = require('./avoid.js'); const bosses = (process.env.AVOID || 'chandelier,golem,rose,organ,serpent,clock').split(',');
      const res = await AV.run(URL0, bosses, { reps: 1 });
      for (const r of res) ok(`avoidable: ${r.boss}.${r.atk}${r.rage ? ' (enraged)' : ''} (safe spot reachable in time, ${r.volleys} volleys)`, !r.fails.length && !r.errs.length, r.fails.slice(0, 1)); }
    { const { ctx, page } = await open(browser, '?room=clockroom&x=2&y=16&god=1&abil=float,turbo,djump,phase&bossatk=hands');
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, () => { const G = GAIDEN; window.__bot = () => { const K = G._test.keys; K.left = K.right = false; if (G.P.x < 8 * 16) K.right = true; }; window.__speed = 4; });
      ok('clock hands: the marked stab actually comes down from the ceiling', await waitFor(page, () => GAIDEN.ebullets.some(q => q.kind === 'hand' && q.h > 150), 20000)); await ctx.close(); }

    // ---- bosses 2-4, played by the bot (god mode; balance runs without god mode: tools/bossrun.js)
    for (const [kind, roomId, abil] of [['golem', 'washroom', 'float,turbo'], ['rose', 'rosebed', 'float,turbo,djump'], ['organ', 'choir', 'float,turbo,djump'], ['serpent', 'yubune', 'float,turbo,djump,phase'], ['marionette', 'stage', 'float,turbo,djump,phase'], ['orrery', 'dome', 'float,turbo,djump,phase'], ['tarant', 'winethrone', 'float,turbo,djump,phase'], ['knight', 'tiltyard', 'float,turbo,djump,phase,keyring'], ['bellboard', 'bellhall', 'float,turbo,djump,phase,keyring'], ['angler', 'abyss', 'float,turbo,djump,phase,keyring,lantern'], ['clock', 'clockroom', 'float,turbo,djump,phase'], ['chronoa', 'clockheart', 'float,turbo,djump,phase,tank']]) {
      const { ctx, page } = await open(browser, `?room=${roomId}&x=2&y=16&god=1&abil=${abil}`);
      await waitFor(page, () => GAIDEN.state === 'play', 5000);
      await E(page, BOT); await E(page, () => { window.__speed = 8; });
      if (kind === 'clock') { ok('v0.4: the seal door stays shut while the theater / observatory seals remain', await E(page, () => { const P = GAIDEN.progress; P.bosses.add('clock'); GAIDEN.checkBossGates(); const shut = !P.perm.has('clockroom:gate:heart') && GAIDEN.room.grid[12 * GAIDEN.room.cols + 23] !== 0; P.bosses.delete('clock'); P.bosses.add('marionette'); P.bosses.add('orrery'); return shut; })); }
      ok(`boss ${kind}: intro`, await waitFor(page, () => GAIDEN.boss && GAIDEN.boss.state !== 'sleep', 6000));
      ok(`boss ${kind}: weak point -> core tug-of-war`, await waitFor(page, () => GAIDEN.P.tug && GAIDEN.P.tug.boss, 60000));
      ok(`boss ${kind}: defeated`, await waitFor(page, k => GAIDEN.progress.bosses.has(k), 150000, kind));
      if (kind === 'clock') { await sleep(400); ok('v0.4: beating the clock opens the seal door to the tower top (no clear yet)', await E(page, () => GAIDEN.state === 'play' && GAIDEN.progress.perm.has('clockroom:gate:heart') && GAIDEN.room.grid[12 * GAIDEN.room.cols + 23] === 0));
        ok('v0.4: Vel appears after the clock with one line', await waitFor(page, () => GAIDEN.STORY.vel && GAIDEN.STORY.box && GAIDEN.STORY.box.who === 'vel', 3000)); }
      if (kind === 'chronoa') { ok('v0.4 ending: Vel comes for Chronoa', await waitFor(page, () => GAIDEN.STORY.scene && GAIDEN.STORY.scene.vel, 20000));
        ok('v0.4 ending: Chronoa is lifted by something unseen', await waitFor(page, () => GAIDEN.STORY.scene && GAIDEN.STORY.scene.lift > 0.5, 20000));
        ok('true final boss -> ending -> clear screen', await waitFor(page, () => GAIDEN.state === 'clear', 30000)); await E(page, () => { window.__speed = 0; }); await sleep(2500); await shot(page, 'v02_clear.png'); }
      await ctx.close(); }
  } catch (e) { errors.push('test crash: ' + e.stack); }
  ok('no JS errors', errors.length === 0, errors.slice(0, 8));
  await browser.close(); srv.close();
  const fails = results.filter(r => !r.pass).length; console.log(`\n${results.length - fails}/${results.length} passed`); process.exit(fails ? 1 : 0);
})();
