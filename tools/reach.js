// Reachability validator: stitches every room into one world tile grid and flood-fills it with a simple
// movement model (1x2 tile body, climb budget per ability set), applying unlocks until a fixpoint.
//   node tools/reach.js         -> unlock order, unreachable cells / pickups; exit 1 on problems
const { chromium } = require('playwright'); const path = require('path');
const SERVE = require('./serve.js'); const ROOT = path.resolve(__dirname, '..');
const CC = 24, CR = 18;
(async () => {
  const srv = await SERVE.start(ROOT); const browser = await chromium.launch(); const page = await browser.newPage();
  await page.goto(srv.url + 'index.html'); await page.waitForTimeout(400);
  const defs = await page.evaluate(() => GAIDEN.ROOM_DEFS.map(d => { const G = GAIDEN.buildRoomGrid(d); return { id: d.id, area: d.area, cx: d.cx, cy: d.cy, cw: d.cw, ch: d.ch, boss: d.boss || null, bossGate: d.bossGate || null, secret: !!d.secret, cols: G.cols, rows: G.rows, grid: Array.from(G.grid), gates: G.gates, ents: (d.ents || []).map(e => [e[0], e[1], e[2], e[3] || {}]) }; }));
  await browser.close(); srv.close();
  let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
  for (const d of defs) { X0 = Math.min(X0, d.cx); Y0 = Math.min(Y0, d.cy); X1 = Math.max(X1, d.cx + d.cw); Y1 = Math.max(Y1, d.cy + d.ch); }
  const W = (X1 - X0) * CC, H = (Y1 - Y0) * CR, base = new Uint8Array(W * H).fill(1), owner = new Array(W * H).fill(null);
  const gx = (d, c) => (d.cx - X0) * CC + c, gy = (d, r) => (d.cy - Y0) * CR + r;
  const gatesAt = {}; // "room:gate" -> [world idx]
  for (const d of defs) for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) { const i = gy(d, r) * W + gx(d, c); base[i] = d.grid[r * d.cols + c]; owner[i] = d.id; }
  for (const d of defs) for (const [gid, list] of Object.entries(d.gates)) gatesAt[d.id + ':' + gid] = list.map(k => gy(d, Math.floor(k / d.cols)) * W + gx(d, k % d.cols));
  const ents = []; for (const d of defs) for (const [t, x, y, o] of d.ents) ents.push({ room: d.id, t, o, c: gx(d, Math.floor(x)), r: gy(d, Math.round(y)) });
  const start = ents.find(e => e.t === 'start');
  const S = { abil: new Set(), key: false, open: new Set(), beat: new Set() };
  const passT = i => { const t = base[i]; if (t === 0 || t === 2 || t === 3) return true; if (t === 4) return S.key; if (t === 5) { for (const [pre, ab] of [['spirit', 'phase'], ['ring', 'keyring'], ['dark', 'lantern']]) if (S.abil.has(ab)) for (const g in gatesAt) if (g.includes(':' + pre) && gatesAt[g].includes(i)) return true; for (const g of S.open) if (gatesAt[g] && gatesAt[g].includes(i)) return true; return false; } return false; };
  // movement model (tiles): body 1 wide x 3 tall (50px). From ground: climb budget K rows (jump 4, +4 with
  // double jump, +2 standing on a float platform) and an air budget HB of horizontal tiles (rise ~2.5 + hover
  // 70f x 1.7px ~ 7.4 tiles; double jump adds airtime). Falling one row lets you drift about one tile.
  function flood() {
    const K = (S.abil.has('djump') ? 8 : 4) + (S.abil.has('float') ? 2 : 0), HB = S.abil.has('djump') ? 12 : 10, KS = 12, HS = 14;
    const pass = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) pass[i] = passT(i) ? 1 : 0;
    const Pp = (c, r) => c >= 0 && r >= 0 && c < W && r < H && pass[r * W + c];
    const stand = (c, r) => r < H && (base[r * W + c] === 2 || !pass[r * W + c]);
    const best = new Int8Array(W * H).fill(-1), seen = new Uint8Array(W * H * KS * HS), q = [];
    par = new Int32Array(W * H).fill(-1); let cur = -1;
    const CL = S.abil.has('cling');   // v0.5 グリム吸着: next to a wall the player can wall-jump upward indefinitely
    const wallAdj = (c, r) => !Pp(c - 1, r - 2) || !Pp(c + 1, r - 2);
    const push = (c, r, k, h) => { if (!Pp(c, r - 1) || !Pp(c, r - 2) || !Pp(c, r - 3) || (r >= 4 && !Pp(c, r - 4))) return;   // v0.4.3: 50px body needs 4 clear rows
      if (EDGES && cur >= 0) EDGES.push(cur, r * W + c); if (stand(c, r)) { k = K; h = HB; } else if (CL && wallAdj(c, r)) { k = Math.max(k, 3); h = HB; }
      const i = r * W + c, si = (i * KS + k) * HS + h; if (seen[si]) return; seen[si] = 1;
      if (best[i] < 0 && i !== cur) par[i] = cur; if (k > best[i]) best[i] = k; q.push(c, r, k, h); };
    push(start.c, start.r, K, HB);
    while (q.length) { const h = q.pop(), k = q.pop(), r = q.pop(), c = q.pop(); cur = r * W + c;
      const gr = stand(c, r);
      if (gr) { push(c - 1, r, k, h); push(c + 1, r, k, h); }
      else if (h > 0) { push(c - 1, r, k, h - 1); push(c + 1, r, k, h - 1); }
      if (k > 0) { const nr = r - 1, top = nr - (nr % CR); let kk = k - 1, hh = h;
        // top exit: the game switches rooms once the feet are ~2.5 rows below the room top and re-launches
        // the player upward with a full jump (+ hover refill) -> model that as a refilled budget
        if (nr % CR <= 2 && top > 0 && owner[(top - 1) * W + c] && owner[(top - 1) * W + c] !== owner[top * W + c] && Pp(c, top - 1)) { kk = Math.max(kk, 4 + nr % CR); hh = HB; }
        push(c, nr, kk, hh); }
      if (!gr) push(c, r + 1, 0, Math.min(HB, h + 1));
    }
    return best;
  }
  const near = (best, e, dx = 2, dy = 3) => { for (let r = e.r - dy; r <= e.r + dy; r++) for (let c = e.c - dx; c <= e.c + dx; c++) if (c >= 0 && r >= 0 && c < W && r < H && best[r * W + c] >= 0) return true; return false; };
  let EDGES = null;
  let par; const log = [], seenArea = new Set(); let best;
  for (let it = 0; it < 60; it++) {
    best = flood(); let changed = false;
    for (const d of defs) if (!seenArea.has(d.area)) { let ok = false; for (let r = 0; r < d.rows && !ok; r++) for (let c = 0; c < d.cols; c++) if (best[gy(d, r) * W + gx(d, c)] >= 0) { ok = true; break; }
      if (ok && process.env.TRACE === d.area) { let i = -1; for (let r = 0; r < d.rows && i < 0; r++) for (let c = 0; c < d.cols; c++) if (best[gy(d, r) * W + gx(d, c)] >= 0) { i = gy(d, r) * W + gx(d, c); break; }
        const path = []; let last = null, guard = 0; while (i >= 0 && guard++ < 100000) { const o = owner[i]; if (o !== last) { path.push(o + '(' + (i % W - (defs.find(z => z.id === o).cx - X0) * CC) + ',' + (Math.floor(i / W) - (defs.find(z => z.id === o).cy - Y0) * CR) + ')'); last = o; } i = par[i]; }
        console.log('TRACE ' + d.area + ': ' + path.reverse().join(' <- ')); }
      if (ok) { seenArea.add(d.area); log.push('== area ' + d.area + ' reachable (abilities: ' + ([...S.abil].join(',') || 'none') + ')'); } }
    const did = (msg) => { log.push(msg); changed = true; };
    for (const e of ents) {
      if (e.done || !near(best, e)) continue;
      if (e.t === 'key') { e.done = 1; S.key = true; did('key (' + e.room + ')'); }
      else if (e.t === 'ability' && (!e.o.after || S.beat.has(e.o.after))) { e.done = 1; S.abil.add(e.o.abil); did('ability ' + e.o.abil + ' (' + e.room + ')'); }
      else if (e.t === 'lever' && S.abil.has('turbo')) { e.done = 1; S.open.add((e.o.room || e.room) + ':' + e.o.gate); did('lever -> ' + (e.o.room || e.room) + ':' + e.o.gate); }
      else if (e.t === 'heavy' && S.abil.has('turbo')) { e.done = 1; S.open.add(e.room + ':' + e.o.gate); did('wardrobe -> ' + e.room + ':' + e.o.gate); }
      else if (e.t === 'vines') { e.done = 1; S.open.add(e.room + ':' + e.o.gate); did('burn vines -> ' + e.room + ':' + e.o.gate); }
      else if (e.t === 'boss') { e.done = 1; }
    }
    for (const d of defs) if (d.boss && !S.beat.has(d.boss)) {
      let ok = false; for (let r = 0; r < d.rows && !ok; r++) for (let c = 0; c < d.cols; c++) if (best[gy(d, r) * W + gx(d, c)] >= 0) { ok = true; break; }
      if (ok) { S.beat.add(d.boss); if (d.boss === 'chandelier') S.open.add('ballroom:floor'); did('BOSS ' + d.boss + ' (' + d.id + ')'); }
    }
    for (const d of defs) if (d.bossGate && d.bossGate.need.every(k => S.beat.has(k)) && !S.open.has(d.id + ':' + d.bossGate.gate)) { S.open.add(d.id + ':' + d.bossGate.gate); did('seal -> ' + d.id + ':' + d.bossGate.gate + ' (' + d.bossGate.need.join('+') + ')'); }
    if (!changed) break;
  }
  console.log('unlock order:\n  ' + log.join('\n  '));
  // cells reached
  const missCells = [];
  for (const d of defs) for (let y = 0; y < d.ch; y++) for (let x = 0; x < d.cw; x++) {
    let ok = false; for (let r = 0; r < CR && !ok; r++) for (let c = 0; c < CC; c++) if (best[gy(d, y * CR + r) * W + gx(d, x * CC + c)] >= 0) { ok = true; break; }
    if (!ok) missCells.push(d.id + '[' + x + ',' + y + ']');
  }
  const PICK = new Set(['key', 'heartbig', 'ability', 'coin', 'candle', 'book', 'bottle', 'chair', 'plate', 'pan', 'pot', 'barrel', 'gear', 'seed', 'flowerpot', 'soap', 'crystal', 'save', 'lever', 'heavy', 'vines', 'warp', 'bone', 'duck']);
  const missEnts = ents.filter(e => PICK.has(e.t) && !near(best, e, e.t === 'lever' || e.t === 'heavy' ? 4 : 2, 3)).map(e => e.t + '@' + e.room + '(' + (e.c % CC) + ',' + (e.r % CR) + ')');
  const unbeaten = defs.filter(d => d.boss && !S.beat.has(d.boss)).map(d => d.boss);
  // v0.4.3 one-way trap check: with everything unlocked, every reachable spot must lead back to the start
  EDGES = []; best = flood(); const radj = new Map(); for (let i = 0; i < EDGES.length; i += 2) { const a = EDGES[i], b = EDGES[i + 1]; if (a === b) continue; let l = radj.get(b); if (!l) radj.set(b, l = []); l.push(a); }
  const back = new Uint8Array(W * H), bq = [start.r * W + start.c]; back[bq[0]] = 1;
  while (bq.length) { const i = bq.pop(); for (const j of radj.get(i) || []) if (!back[j]) { back[j] = 1; bq.push(j); } }
  const traps = {}; for (let i = 0; i < W * H; i++) if (best[i] >= 0 && !back[i]) { const o = owner[i], d = defs.find(z => z.id === o); const k = o + '(' + (i % W - (d.cx - X0) * CC) + ',' + (Math.floor(i / W) - (d.cy - Y0) * CR) + ')'; (traps[o] = traps[o] || []).push(k); }
  const trapRooms = Object.keys(traps); console.log('one-way traps:', trapRooms.length ? trapRooms.map(o => o + ' x' + traps[o].length + ' e.g. ' + traps[o][0]).join(' | ') : 'none');
  // v0.4.3 ledge headroom: a one-way ledge needs 4 clear rows above it (Kanata is 50px tall)
  const lowLedges = []; for (const d of defs) for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) if (d.grid[r * d.cols + c] === 2) {
    let bad = false; for (let k = 1; k <= 4 && r - k >= 0; k++) { const t = d.grid[(r - k) * d.cols + c]; if (t === 1 || t === 3 || t === 4) bad = true; } if (bad) lowLedges.push(d.id + '(' + c + ',' + r + ')'); }
  console.log('low-ceiling ledges:', lowLedges.length ? lowLedges.join(' ') : 'none');
  console.log('abilities:', [...S.abil].join(','), '| bosses:', [...S.beat].join(','));
  if (process.env.DUMP) { const d = defs.find(z => z.id === process.env.DUMP); for (let r = 0; r < d.rows; r++) { let l = ''; for (let c = 0; c < d.cols; c++) { const i = gy(d, r) * W + gx(d, c); l += best[i] >= 0 ? 'o' : base[i] === 1 ? '#' : base[i] === 2 ? '=' : base[i] === 5 ? 'G' : '.'; } console.log(l); } }
  console.log('unreached cells:', missCells.length ? missCells.join(' ') : 'none');
  console.log('unreached pickups:', missEnts.length ? missEnts.join(' ') : 'none');
  // gating sanity: which areas are reachable with NO abilities?
  // v0.6.1: every seal door must open in the unlock simulation, i.e. all of its bosses are beatable without going through it
  const badSeals = defs.filter(d => d.bossGate && !(S.open.has(d.id + ':' + d.bossGate.gate) && d.bossGate.need.every(k => S.beat.has(k))));
  for (const d of defs) if (d.bossGate) console.log('seal ' + d.id + ':' + d.bossGate.gate + ' needs ' + d.bossGate.need.length + ' bosses (' + d.bossGate.need.join(',') + ') -> ' + (badSeals.includes(d) ? 'NEVER OPENS' : 'opens'));
  const problems = missCells.length + missEnts.length + unbeaten.length + trapRooms.length + lowLedges.length + badSeals.length;
  console.log(problems ? 'REACH: PROBLEMS (' + problems + ')' : 'REACH: OK — every cell, pickup and boss reachable');
  process.exit(problems ? 1 : 0);
})();
