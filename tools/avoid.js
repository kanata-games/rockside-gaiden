// Avoidability audit (v0.3.2): is every boss attack escapable by a human?
//   node tools/avoid.js [boss[,boss]] [--react=18] [--base=URL]
// For each attack (forced with ?bossatk=) and each start position x0, Kanata stands frozen in god mode while the game logs every
// damage rectangle per frame (window.__hz, see hzLog()).  Offline, a search over Kanata's real movement (walk speed, jump arcs
// with/without the float-hover, platforms ignored = conservative) asks: starting at x0, unable to act for REACT frames
// (human reaction ~300 ms), is there ANY path that touches no hazard?  Attacks that re-aim at Kanata (new floor marks) are checked
// again from each re-aim, standing on the aimed spot.  An attack fails if some volley has no escape.
const { chromium } = require('playwright'); const path = require('path');
const SERVE = require('./serve.js'); const ROOT = path.resolve(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const REACT = +(arg('react') || 18), ACC_PEN = 3;       // reaction frames + a few frames to get up to speed
const ATTACKS = {
  chandelier: ['ballroom', '', ['candles', 'shards', 'wisps', 'crash']],
  golem: ['washroom', 'float,turbo', ['slam', 'bubbles', 'socks', 'leap', 'roll']],
  rose: ['rosebed', 'float,turbo,djump', ['thorns', 'seeds', 'petals', 'roots', 'garden', 'bloom']],
  organ: ['choir', 'float,turbo,djump', ['notes', 'pipes', 'chord', 'requiem', 'fortissimo']],
  serpent: ['yubune', 'float,turbo,djump,phase', ['arcs', 'sweep', 'rain', 'geyser']],
  clock: ['clockroom', 'float,turbo,djump,phase', ['hands', 'gears', 'pendulum', 'midnight', 'chime']],
  marionette: ['stage', 'float,turbo,djump,phase', ['cut', 'dance', 'masks', 'spotlight']],
  orrery: ['dome', 'float,turbo,djump,phase', ['meteor', 'comet', 'orbit', 'supernova']],
  tarant: ['winethrone', 'float,turbo,djump,phase', ['corks', 'spill', 'drop', 'plunge']],
  knight: ['tiltyard', 'float,turbo,djump,phase,keyring', ['halberds', 'slash', 'leap', 'greatsword']],
  bellboard: ['bellhall', 'float,turbo,djump,phase,keyring', ['peal', 'chime', 'rope', 'toll']],   // v0.5.1
  angler: ['abyss', 'float,turbo,djump,phase,keyring,lantern', ['bubbles', 'bite', 'dive', 'lure']],
  chronoa: ['clockheart', 'float,turbo,djump,phase,tank', ['hands', 'pendulum', 'rewind', 'slow', 'beam']],
};
module.exports.ATTACKS = ATTACKS;
// ---------------- movement model (mirrors updatePlayer) ----------------
function arcs(C) { // vertical offset (px above the floor, >0 = up) per air frame for several ways of pressing JUMP
  const out = [];
  for (const [hold, hover] of [[1, 0], [8, 0], [999, 0], [999, 1]]) {
    let vy = -C.jumpVel, y = 0, hv = C.hoverFrames; const a = [];
    for (let f = 0; f < 400; f++) { const held = f < hold || (hover && vy > 0); if (!held && vy < -C.jumpCutVel) vy = -C.jumpCutVel; vy += C.gravity;
      if (vy > 0 && held && hover && hv > 0) { if (vy > C.hoverFall) vy = C.hoverFall; hv--; } if (vy > C.maxFall) vy = C.maxFall; y += vy; if (y >= 0) break; a.push(-y); }
    out.push(a);
  }
  return out;
}
function search(H, x0, startF, C, ctx, reaim) { // reaim: a re-aimed volley - hazards inside the reaction window are the previous volley's (already being dodged) // H[f] = rect list for frame f. returns { ok, failF, rects }
  const { L, R, groundY } = ctx, W = C.playerW, hw = W / 2 - C.hurtInsetX, top = C.playerH - C.hurtInsetTop, sp = C.walkSpeed, A = ctx.arcs;
  const hit = (x, yoff, rects, ground) => { const x0b = x - hw, x1b = x + hw, y1b = groundY - yoff, y0b = y1b - top;
    for (const r of rects) { if (r[4] && !ground) continue; if (x0b < r[2] && x1b > r[0] && y0b < r[3] && y1b > r[1]) return true; } return false; };
  // state key: a*1000+k (a=-1 ground) -> Set of x (integers)
  let S = new Map([[-1, new Set([Math.round(x0)])]]); const frozenUntil = startF + REACT + ACC_PEN;
  for (let f = startF; f < H.length; f++) {
    // a re-aimed volley is judged on what it creates: bullets born before the re-aim belong to the previous volley
    const rects = (reaim && f < frozenUntil) ? [] : (H[f] || []).filter(r => !reaim || r[5] < 0 || r[5] >= startF); const N = new Map(); const add = (key, x) => { if (x < L || x > R) return; let s = N.get(key); if (!s) N.set(key, s = new Set()); s.add(x); };
    const step = Math.max(1, Math.round(sp));
    for (const [key, xs] of S) for (const x of xs) {
      if (f < frozenUntil) { if (key === -1) add(-1, x); else { const a = Math.floor(key / 1000), k = key % 1000; if (k + 1 < A[a].length) add(key + 1, x); else add(-1, x); } continue; }
      const moves = [-step, 0, step];
      if (key === -1) { for (const m of moves) { add(-1, x + m); for (let a = 0; a < A.length; a++) add(a * 1000 + 0, x + m); } }
      else { const a = Math.floor(key / 1000), k = key % 1000; for (const m of moves) { if (k + 1 < A[a].length) add(key + 1, x + m); else add(-1, x + m); } }
    }
    // remove states that touch a hazard this frame
    for (const [key, xs] of N) { const yoff = key === -1 ? 0 : A[Math.floor(key / 1000)][key % 1000]; for (const x of [...xs]) if (hit(x, yoff, rects, key === -1)) xs.delete(x); if (!xs.size) N.delete(key); }
    if (!N.size) return { ok: false, failF: f - startF, rects };
    // keep the state set small: thin x to every px (already ints)
    S = N;
  }
  return { ok: true };
}
module.exports.run = async function run(base, bosses, opt = {}) {
  const browser = await chromium.launch(); const results = [];
  const jobs = []; for (const boss of bosses) for (const atk of ATTACKS[boss][2]) if (!process.env.ATK || process.env.ATK.split(',').includes(atk)) for (const rage of [false, true]) jobs.push([boss, atk, rage]);
  const worker = async () => { while (jobs.length) { const [boss, atk, rage] = jobs.shift(); let r = await one(browser, base, boss, atk, rage, opt);
    if (r.fails.length && r.fails.every(f => f.why === 'attack never started')) r = await one(browser, base, boss, atk, rage, opt); // load hiccup: retry once
    results.push(r); } };
  await Promise.all([worker(), worker(), worker()]);
  await browser.close(); return results;
};
async function one(browser, base, boss, atk, rage, opt) {
  const [room, abil] = ATTACKS[boss];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`${base}index.html?room=${room}&x=2&y=16&god=1${abil ? '&abil=' + abil : ''}&bossatk=${atk}`);
  await page.waitForFunction(() => window.GAIDEN && GAIDEN.state === 'play', null, { timeout: 10000 });
  const info = await page.evaluate(() => { const G = GAIDEN, C = G.CONFIG; return { C: { playerW: C.playerW, playerH: C.playerH, hurtInsetX: C.hurtInsetX, hurtInsetTop: C.hurtInsetTop, walkSpeed: C.walkSpeed, jumpVel: C.jumpVel, jumpCutVel: C.jumpCutVel, gravity: C.gravity, maxFall: C.maxFall, hoverFrames: C.hoverFrames, hoverFall: C.hoverFall }, W: G.room.W }; });
  // wake the boss, then pick start positions spread over the arena
  await page.evaluate(() => { const G = GAIDEN; window.__ctl = { x: null }; window.__bot = () => { const K = G._test.keys; K.left = K.right = K.jump = K.vac = K.spit = false;
    if (window.__ctl.x === null) { if (G.P.x < 8 * 16) K.right = true; } else { G.P.x = window.__ctl.x - G.P.w / 2; G.P.vx = 0; }
    if (window.__hz && window.__hzOn) { window.__hz.push([]); const b = G.boss; window.__mk.push(b && b.marks ? b.marks.map(Math.round).join(',') : ''); } }; window.__speed = 4; });
  await page.waitForFunction(() => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', null, { timeout: 60000 });
  if (rage) await page.evaluate(() => { const b = GAIDEN.boss; b.hp = Math.floor(b.maxHp * 0.45); b.damage(0); });
  const arena = await page.evaluate(() => { const G = GAIDEN, R = G.room, row = 14; let L = 0, Rr = R.W; // walls at foot height
    const solid = c => { const t = R.grid[row * R.cols + c]; return t === 1 || t === 4 || t === 5; };
    for (let c = 1; c < R.cols; c++) if (!solid(c)) { L = c * 16; break; } for (let c = R.cols - 2; c > 0; c--) if (!solid(c)) { Rr = (c + 1) * 16; break; }
    const b = G.boss; if (b.kind === 'organ') Rr = Math.min(Rr, b.x - 52);
    return { L: L + G.P.w / 2, R: Rr - G.P.w / 2, groundY: 15 * 16 }; });
  // pendulum: the safe lanes are under the high ends of the swing (by the walls), so a sane player waits there
  const starts = []; for (const fr of (atk === 'pendulum' ? [0.03, 0.1, 0.9, 0.97] : [0.18, 0.4, 0.62, 0.84])) starts.push(Math.round(arena.L + (arena.R - arena.L) * fr));
  const out = { boss, atk, rage, volleys: 0, fails: [], errs };
  const A = arcs(info.C), sctx = { L: Math.ceil(arena.L), R: Math.floor(arena.R), groundY: arena.groundY, arcs: A };
  for (const x0 of starts) for (let rep = 0; rep < (opt.reps || 2); rep++) {
    // move Kanata to x0, wait for the next start of the forced attack, record until the boss is back to idle/stunned (+ lingering bullets)
    await page.evaluate(x => { window.__ctl.x = x; window.__hz = null; window.__hzOn = false; }, x0);
    await page.waitForFunction(atk => { const b = GAIDEN.boss; return b && b.state !== atk; }, atk, { timeout: 30000, polling: 'raf' }).catch(() => {});
    const okStart = await page.waitForFunction(atk => { const b = GAIDEN.boss; if (b && b.state === atk && b.t <= 2) { for (const e of GAIDEN.ebullets) e.__hzB = -2; window.__bx = (b.kind === 'chronoa' || b.kind === 'orrery') ? -1e9 : Math.round(b.hx !== undefined ? b.hx : b.x);   /* chronoa: no body on the floor */ window.__hz = [[]]; window.__hzOn = true; window.__mk = ['']; return true; } return false; }, atk, { timeout: 40000, polling: 'raf' }).then(() => true).catch(() => false);
    if (!okStart) { out.fails.push({ x0, why: 'attack never started' }); continue; }
    // log marks per frame (re-aims) and the end of the attack
    // (marks are logged by the bot hook in the same frame as the hazards, so the two stay aligned)
    await page.waitForFunction(atk => { const b = GAIDEN.boss; if (!b) return true; const idle = (['idle', 'dizzy', 'stunned', 'wilt', 'stopped', 'burrow', 'return', 'reform', 'flung', 'shut', 'wake', 'slump', 'rise', 'stop', 'relight'].includes(b.state) || (b.state === 'rewind' && b.kind !== 'chronoa')) || b.state === 'dying';
      if (idle && !window.__endF) window.__endF = window.__hz.length; return window.__endF && window.__hz.length > window.__endF + 90; }, atk, { timeout: 60000, polling: 'raf' }).catch(() => {});
    const rec = await page.evaluate(() => { const r = { H: window.__hz, mk: window.__mk, end: window.__endF, bx: window.__bx }; window.__hz = null; window.__hzOn = false; window.__endF = 0; return r; });
    // the boss body itself is ignored for the trailing frames after the attack (it's the next attack's business)
    // leftovers of the previous attack (already on screen, already being dodged) are not this attack's business
    const H = rec.H.slice(0, (rec.end || rec.H.length) + 90).map(fr => fr.filter(r => r[5] !== -2));
    // hugging the boss body (contact range) is not a sane place to wait for an attack
    if (Math.abs(x0 - rec.bx) < 44) { out.skipped = (out.skipped || 0) + 1; continue; }
    // volley starts: frame 0 + every frame where a new non-empty mark set appears
    const starts2 = [0]; for (let f = 1; f < rec.mk.length; f++) if (rec.mk[f] && rec.mk[f] !== rec.mk[f - 1]) starts2.push(f);
    for (const sf of [...new Set(starts2)]) {
      // invalid start: Kanata was parked inside a hazard (e.g. the boss walked/landed on her spot during the previous attack)
      const hb = [0, 1, 2, 3].some(d => (H[sf + d] || []).filter(r => sf === 0 || r[5] < 0 || r[5] >= sf).some(r => { const hw = info.C.playerW / 2 - info.C.hurtInsetX; return x0 - hw < r[2] && x0 + hw > r[0] && arena.groundY - (info.C.playerH - info.C.hurtInsetTop) < r[3] && arena.groundY > r[1]; }));
      if (hb) { out.skipped = (out.skipped || 0) + 1; continue; }
      out.volleys++; const r = search(H, x0, sf, info.C, sctx, sf > 0);
      if (!r.ok) out.fails.push({ x0, rep, volleyAt: sf, failAfter: r.failF, marks: rec.mk[sf], hazards: (H[sf + r.failF] || []).filter(q => sf === 0 || q[5] < 0 || q[5] >= sf).slice(0, 5) }); }
  }
  await ctx.close(); return out;
}
if (require.main === module) (async () => {
  const bosses = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : Object.keys(ATTACKS).join(',')).split(',');
  let srv = null, base = arg('base'); if (!base) { srv = await SERVE.start(ROOT); base = srv.url; } if (!base.endsWith('/')) base += '/';
  const res = await module.exports.run(base, bosses, { reps: +(arg('reps') || 2) }); let bad = 0;
  res.sort((a, b) => (a.boss + a.atk + a.rage).localeCompare(b.boss + b.atk + b.rage));
  for (const r of res) { const ok = !r.fails.length && !r.errs.length; if (!ok) bad++;
    console.log((ok ? 'PASS ' : 'FAIL ') + `${r.boss}.${r.atk}${r.rage ? ' (enraged)' : ''}: ${r.volleys} volleys` + (r.skipped ? ` (${r.skipped} starts skipped)` : '') + (r.fails.length ? `, ${r.fails.length} unavoidable: ` + JSON.stringify(r.fails.slice(0, 2)) : '') + (r.errs.length ? ' ERR ' + r.errs[0] : '')); }
  console.log(bad ? `AVOID: ${bad} attack(s) not avoidable (react ${REACT}f)` : `AVOID: OK (react ${REACT}f)`); if (srv) srv.close(); process.exit(bad ? 1 : 0);
})();
