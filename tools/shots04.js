// Phone screenshots for v0.4: node tools/shots04.js [filter] -> screenshots/v04_*.png (390x844 @2x)
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
  for (const [name, q, walk, ms] of [['v04_area_theater_lobby.png', '?room=lobby&x=30&y=16', 'ArrowRight', 500], ['v04_area_theater_audience.png', '?room=audience&x=40&y=16', 'ArrowRight', 600],
    ['v04_area_stars_starhall.png', '?room=starhall&x=30&y=16', 'ArrowRight', 500], ['v04_area_stars_planetarium.png', '?room=planetarium&x=22&y=16', 'ArrowLeft', 500]]) {
    if (!want(name)) continue; const { ctx, page } = await open(q + '&god=1&abil=' + ALL);
    await sleep(600); await page.keyboard.down(walk); await sleep(ms); await page.keyboard.up(walk); await sleep(1600); await snap(page, name); await ctx.close(); }
  // ---- Vel's dialogue (before Chronoa, at the top of the tower)
  if (want('v04_vel')) { const { ctx, page } = await open('?room=towertop&x=8&y=16&god=1&abil=' + ALL5);
    await page.waitForFunction(() => GAIDEN.STORY.box && GAIDEN.STORY.box.who === 'vel', null, { timeout: 6000 }).catch(() => console.log('no vel'));
    await sleep(1400); await snap(page, 'v04_vel_dialogue.png'); await ctx.close(); }
  // ---- area bosses mid-attack + weak point
  for (const [kind, roomId, st, tt] of [['marionette', 'stage', 'masks', 60], ['orrery', 'dome', 'supernova', 58], ['chronoa', 'clockheart', 'pendulum', 80]]) {
    const name = 'v04_boss_' + kind + '.png'; if (!want(name)) continue;
    const { ctx, page } = await open(`?room=${roomId}&x=2&y=16&god=1&abil=${ALL5}&bossatk=${st}`);
    await E(page, BOT); await E(page, () => { window.__speed = 2; });
    await page.waitForFunction(() => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', null, { timeout: 20000 });
    await page.waitForFunction(([s, t]) => GAIDEN.boss && GAIDEN.boss.state === s && GAIDEN.boss.t > t, [st, tt], { timeout: 60000, polling: 'raf' }).catch(e => console.log('wait', kind, e.message));
    await E(page, () => { window.__speed = 0; }); await sleep(150); await snap(page, name);
    await E(page, () => { window.__speed = 3; }); await page.waitForFunction(() => GAIDEN.P.tug && GAIDEN.P.tug.boss && GAIDEN.P.tug.tugFrames > 20, null, { timeout: 120000, polling: 'raf' }).catch(() => console.log('no core tug', kind));
    await E(page, () => { window.__speed = 0; }); await sleep(150); await snap(page, 'v04_boss_' + kind + '_core.png'); await ctx.close(); }
  // ---- Chronoa's other moves (rage)
  for (const st of ['beam', 'slow', 'rewind']) { const name = 'v04_boss_chronoa_' + st + '.png'; if (!want(name)) continue;
    const { ctx, page } = await open(`?room=clockheart&x=2&y=16&god=1&abil=${ALL5}&bossatk=${st}`);
    await E(page, BOT); await E(page, () => { window.__speed = 2; });
    await page.waitForFunction(() => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', null, { timeout: 20000 });
    if (st === 'beam') await E(page, () => { const b = GAIDEN.boss; b.hp = Math.floor(b.maxHp * 0.45); b.damage(0); });
    await page.waitForFunction(s => GAIDEN.boss && GAIDEN.boss.state === s && GAIDEN.boss.t > (s === 'beam' ? 60 : s === 'slow' ? 80 : 70), st, { timeout: 60000, polling: 'raf' }).catch(e => console.log('wait', st, e.message));
    await E(page, () => { window.__speed = 0; }); await sleep(150); await snap(page, name); await ctx.close(); }
  // ---- the ending: Vel arrives, Chronoa is carried away by something unseen
  if (want('v04_ending')) { const { ctx, page } = await open('?room=clockheart&x=2&y=16&god=1&abil=' + ALL5);
    await E(page, BOT); await E(page, () => { window.__speed = 8; });
    await page.waitForFunction(() => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', null, { timeout: 20000 });
    await E(page, () => { const b = GAIDEN.boss; b.hp = 1; b.die(); });
    await page.waitForFunction(() => GAIDEN.STORY.scene && GAIDEN.STORY.scene.t > 300, null, { timeout: 60000, polling: 'raf' });
    await E(page, () => { window.__speed = 0; }); await sleep(200); await snap(page, 'v04_ending_vel.png');
    await E(page, () => { window.__speed = 1; }); await page.waitForFunction(() => GAIDEN.STORY.scene && GAIDEN.STORY.scene.t > 700, null, { timeout: 60000, polling: 'raf' });
    await E(page, () => { window.__speed = 0; }); await sleep(200); await snap(page, 'v04_ending_carry.png'); await ctx.close(); }
  // ---- map with both new areas
  if (want('v04_map')) { const { ctx, page } = await open('?room=lobby&x=30&y=16&abil=' + ALL);
    const ids = await E(page, () => GAIDEN.ROOM_DEFS.map(d => d.id).filter(id => !['clockheart', 'reliquary', 'sauna'].includes(id)));
    for (const id of ids) await E(page, id => GAIDEN.loadRoom(id, { start: true }), id);
    await E(page, () => { for (const d of GAIDEN.ROOM_DEFS) if (d.warp) GAIDEN.progress.warps.add(d.id); GAIDEN.loadRoom('starhall', { start: true }); GAIDEN.placePlayer(30 * 16, 15 * 16, 1); });
    await sleep(500); await page.keyboard.press('Tab'); await sleep(700); await snap(page, 'v04_map.png'); await ctx.close(); }
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close(); srv.close(); process.exit(0);
})();
