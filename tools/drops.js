// Regression probe: every telegraphed from-above / lobbed boss attack must produce projectiles that visibly fall and reach the floor.
//   node tools/drops.js [baseURL] [--speed=N]   (default: serve the repo locally)
// For each attack it forces the move (?bossatk=), plays with the bot in god mode, hooks every ebullet of the attack's kinds and tracks it
// frame by frame (spawn y, lowest y, frames alive, how it ended).  FAIL if an attack telegraphs but nothing falls, or a projectile dies
// before falling at least MIN_FALL px / doesn't end near a floor or platform.
const { chromium } = require('playwright'); const path = require('path');
const SERVE = require('./serve.js'); const ROOT = path.resolve(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CASES = [ // boss, room, abilities, forced attack, falling kinds, rounds to watch
  ['chandelier', 'ballroom', '', 'candles', ['candle']], ['chandelier', 'ballroom', '', 'shards', ['shard']],
  ['golem', 'washroom', 'float,turbo', 'socks', ['sock']], ['golem', 'washroom', 'float,turbo', 'slam', ['dropbottle']], ['golem', 'washroom', 'float,turbo', 'leap', ['dropbottle']],
  ['rose', 'rosebed', 'float,turbo,djump', 'seeds', ['seedpod']],
  ['serpent', 'yubune', 'float,turbo,djump,phase', 'rain', ['drop']], ['serpent', 'yubune', 'float,turbo,djump,phase', 'arcs', ['hotwater']],
];
const MIN_FALL = 40;
module.exports = async function run(base, opt = {}) {
  const browser = await chromium.launch(); const out = [];
  for (const [boss, room, abil, atk, kinds] of CASES) {
    for (const rage of [false, true]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.goto(`${base}index.html?room=${room}&x=2&y=16&god=1${abil ? '&abil=' + abil : ''}&bossatk=${atk}`);
      await page.waitForFunction(() => window.GAIDEN && GAIDEN.state === 'play', null, { timeout: 10000 });
      await page.evaluate(([kinds, speed]) => {
        const G = GAIDEN, T = window.__drops = { tele: 0, list: [] };
        // no bot: Kanata walks in to wake the boss, then stands still (god mode) so nothing is vacuumed out of the air
        const orig = () => { const K = G._test.keys; K.left = K.right = K.jump = K.vac = K.spit = false; if (G.P.x < 8 * 16) K.right = true; };
        const push = G.ebullets.push.bind(G.ebullets);
        G.ebullets.push = function (...a) { for (const q of a) if (kinds.includes(q.kind)) { q.__id = T.list.length; T.list.push({ cx: q.x + q.w / 2, kind: q.kind, y0: Math.round(q.y), x0: Math.round(q.x), maxB: q.y + q.h, f0: G.frame, alive: 1, frames: 0, state: G.boss && G.boss.state, rage: !!(G.boss && G.boss.rage) }); q.__t = T.list[q.__id]; } return push(...a); };
        window.__bot = function () { orig(); const b = G.boss; if (b && b.marks && b.marks.length) T.tele++;
          for (const r of T.list) if (r.alive) r.seen = 0;
          for (const q of G.ebullets) if (q.__t && !q.dead) { q.__t.seen = 1; q.__t.frames++; q.__t.maxB = Math.max(q.__t.maxB, q.y + q.h); q.__t.lastY = q.y; q.__t.cx = q.x + q.w / 2; }
          const R = G.room, under = r => { const c = Math.floor((r.cx) / 16), row = Math.floor((r.maxB + 10) / 16); return R.grid[row * R.cols + c]; };
          for (const r of T.list) if (r.alive && !r.seen && G.frame > r.f0) { r.alive = 0; r.endTile = under(r); r.landed = [1, 2, 4, 5].includes(r.endTile); } };
        window.__speed = speed;
      }, [kinds, opt.speed || 2]);
      await page.waitForFunction(() => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', null, { timeout: 20000 });
      if (rage) await page.evaluate(() => { const b = GAIDEN.boss; b.hp = Math.floor(b.maxHp * 0.45); b.damage(0); });
      // watch until we've seen enough projectiles of this attack (or time out)
      const t0 = Date.now(); while (Date.now() - t0 < 25000) { const n = await page.evaluate(() => window.__drops.list.filter(r => !r.alive).length); if (n >= 6) break; await sleep(200); }
      const res = await page.evaluate(() => ({ tele: window.__drops.tele, list: window.__drops.list.filter(r => !r.alive), floor: 15 * 16 }));
      const bad = res.list.filter(r => r.maxB - r.y0 < MIN_FALL || r.frames < 6 || !r.landed);
      const pass = res.list.length > 0 && bad.length === 0 && errs.length === 0;
      out.push({ boss, atk, rage, pass, n: res.list.length, bad: bad.length, sample: (bad[0] || res.list[0] || null), errs });
      await ctx.close();
    }
  }
  await browser.close(); return out;
};
if (require.main === module) (async () => {
  const arg = process.argv.find(a => /^https?:/.test(a)); const sp = +((process.argv.find(a => a.startsWith('--speed=')) || '').split('=')[1] || 2);
  let srv = null, base = arg; if (!base) { srv = await SERVE.start(ROOT); base = srv.url; } if (!base.endsWith('/')) base += '/';
  const out = await module.exports(base, { speed: sp }); let fails = 0;
  for (const r of out) { if (!r.pass) fails++; console.log((r.pass ? 'PASS ' : 'FAIL ') + `${r.boss}.${r.atk}${r.rage ? ' (enraged)' : ''}: ${r.n} projectiles, ${r.bad} bad` + (r.sample ? `  e.g. ${JSON.stringify({ kind: r.sample.kind, spawnY: r.sample.y0, lowestBottom: Math.round(r.sample.maxB), frames: r.sample.frames, landedOnTile: r.sample.endTile, state: r.sample.state })}` : '') + (r.errs.length ? ' errs=' + r.errs.join('|') : '')); }
  console.log(fails ? `DROPS: ${fails} FAIL` : 'DROPS: OK'); if (srv) srv.close(); process.exit(fails ? 1 : 0);
})();
