
// =====================================================================
//  WORLD: room loading, static pre-render, collision, camera, lights, progress / save
// =====================================================================
let room = null;            // current room: { def, cols, rows, grid, W, H, canvas, lights, shafts, flames }
const cam = { x: 0, y: 0, shake: 0 };
let fadeT = 0;              // room-entry fade (frames left)
const progress = {          // persists in localStorage (save altars)
  coins: 0, maxHP: CONFIG.maxHP, perm: new Set(), visited: new Set(), hasKey: false, bosses: new Set(), abil: {}, saveRoom: 'foyer', tips: new Set(), time: 0, captures: 0, warps: new Set(),
};
const SAVE_KEY = 'gaiden_save_v1';
const ABIL_INFO = {
  float: { jp: 'ふわり化', en: 'FLOAT', col: '#8fe8ff', text: '吸い込んだ物を SPIT 長押しで「ふわり化」！ しばらく空中に浮かぶ足場になる。高い場所へ登れるようになった' },
  turbo: { jp: 'ターボ吸引', en: 'TURBO', col: '#ffb040', text: '掃除機がパワーアップ！ 重い物（なべ・たる）やレバー、大きな家具まで吸い込めるようになった' },
  djump: { jp: '二段ジャンプ', en: 'GHOST STEP', col: '#c8a0ff', text: '空中でもう一度 JUMP できるようになった！（ゴーストステップ）' },
  phase: { jp: '霊体化', en: 'PHASE', col: '#e0b8ff', text: '半分ゴーストの力が目覚めた！ 青白い「霊の結界」をすり抜けられるようになった' },
  tank:  { jp: '大容量タンク', en: 'BIG TANK', col: '#9affc8', text: '掃除機のタンクが大きくなった！ 物を 4 つまでためておける' },
  keyring: { jp: '鍵束', en: 'KEY RING', col: '#ffd84a', text: '屋敷じゅうの錠前に合う「鍵束」を手に入れた！ 金色の錠前がかかった扉を開けられる' },
  lantern: { jp: 'カンテラ', en: 'LANTERN', col: '#ffc070', text: '呼び鈴盤の中から古いカンテラが出てきた！ グリムの口にさげると、まわりが明るくなり「黒い霧」が晴れる' },
  cling: { jp: 'グリム吸着', en: 'GRIM GRIP', col: '#a8d8ff', text: '相棒の掃除機グリムが壁に吸いつけるようになった！ 空中で壁に向かって押すと張りつき、JUMP で壁をけって登れる' },
};
const hasAbil = k => !!progress.abil[k];
function saveGame(roomId) {
  progress.saveRoom = roomId;
  const d = { v: 2, coins: progress.coins, maxHP: progress.maxHP, perm: [...progress.perm], visited: [...progress.visited], hasKey: progress.hasKey,
    bosses: [...progress.bosses], abil: progress.abil, saveRoom: roomId, tips: [...progress.tips], time: progress.time, captures: progress.captures, warps: [...progress.warps], shop: progress.shop || null };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (_) {}
}
function loadSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (_) { return null; } }
function applySave(d) {
  progress.coins = d.coins || 0; progress.maxHP = d.maxHP || CONFIG.maxHP; progress.perm = new Set(d.perm || []); progress.visited = new Set(d.visited || []);
  progress.hasKey = !!d.hasKey; progress.bosses = new Set(d.bosses || (d.bossDone ? ['chandelier'] : [])); progress.abil = Object.assign({}, d.abil || {});
  progress.saveRoom = ROOM_BY_ID[d.saveRoom] ? d.saveRoom : 'foyer'; progress.tips = new Set(d.tips || []); progress.time = d.time || 0; progress.captures = d.captures || 0; progress.warps = new Set(d.warps || []); progress.shop = d.shop ? Object.assign({ heart: 0, tank: 0, gabu: 0, tea: 0, maps: [], pals: [], pal: '' }, d.shop) : null; if (typeof FLIP_CACHE !== 'undefined') FLIP_CACHE.clear(); syncAbilities();
  if (progress.bosses.has('chandelier')) progress.perm.add('ballroom:gate:floor'); // v0.1 saves: the floor gives way after the chandelier
}
function resetProgress() {
  progress.coins = 0; progress.maxHP = CONFIG.maxHP; progress.perm = new Set(); progress.visited = new Set(); progress.hasKey = false; progress.bosses = new Set(); progress.abil = {};
  progress.saveRoom = 'foyer'; progress.tips = new Set(); progress.time = 0; progress.captures = 0; progress.warps = new Set(); progress.shop = null; if (typeof FLIP_CACHE !== 'undefined') FLIP_CACHE.clear(); syncAbilities();
}
function eraseSave() { try { localStorage.removeItem(SAVE_KEY); } catch (_) {} }

// ---------------------------------------------------------------------
//  tiles / collision
// ---------------------------------------------------------------------
function tileAt(c, r) {
  if (c < 0 || c >= room.cols || r < 0 || r >= room.rows) return T_EMPTY;
  return room.grid[r * room.cols + c];
}
function solidAtPx(x, y) { return isSolidT(tileAt(Math.floor(x / TS), Math.floor(y / TS))); }
// AABB vs solid tiles
function boxHitsSolid(x, y, w, h) {
  const c0 = Math.floor(x / TS), c1 = Math.floor((x + w - 0.001) / TS), r0 = Math.floor(y / TS), r1 = Math.floor((y + h - 0.001) / TS);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (isSolidT(tileAt(c, r))) return true;
  return false;
}
// move a body {x,y,w,h,vx,vy} with tile collision; sets onGround / hitWall / hitCeil. oneWay: land on platforms
function moveBody(b, oneWay) {
  b.hitWall = 0; b.hitCeil = false; const wasGround = b.onGround; b.onGround = false;
  // X
  if (b.vx) {
    b.x += b.vx;
    if (boxHitsSolid(b.x, b.y, b.w, b.h)) {
      if (b.vx > 0) { b.x = Math.floor((b.x + b.w) / TS) * TS - b.w - 0.01; b.hitWall = 1; }
      else { b.x = (Math.floor(b.x / TS) + 1) * TS + 0.01; b.hitWall = -1; }
      // step back further if still inside (corner cases)
      let n = 0; while (boxHitsSolid(b.x, b.y, b.w, b.h) && n++ < 16) b.x -= Math.sign(b.vx);
      b.vx = 0;
    }
  }
  // Y
  const prevBottom = b.y + b.h, isP = b === P;
  b.y += b.vy;
  if (isP) b.onFloat = null;
  if (b.vy > 0) {
    // ふわり足場 (float platforms): one-way, player only
    if (oneWay && isP) for (const f of floats) if (b.x + b.w > f.x + 1 && b.x < f.x + f.w - 1 && prevBottom <= f.y + 0.5 && b.y + b.h >= f.y) { b.y = f.y - b.h; b.vy = 0; b.onGround = true; b.onFloat = f; break; }
    const c0 = Math.floor(b.x / TS), c1 = Math.floor((b.x + b.w - 0.001) / TS), r = Math.floor((b.y + b.h - 0.001) / TS);
    if (!b.onFloat) for (let c = c0; c <= c1; c++) {
      const t = tileAt(c, r);
      if (isSolidT(t) || (oneWay && t === T_PLAT && prevBottom <= r * TS + 0.5 && !(b.dropT > 0) && !boxHitsSolid(b.x, r * TS - b.h, b.w, b.h))) { b.y = r * TS - b.h; b.vy = 0; b.onGround = true; break; }
    }
  } else if (b.vy < 0) {
    if (boxHitsSolid(b.x, b.y, b.w, b.h)) { const r = Math.floor(b.y / TS); b.y = (r + 1) * TS + 0.01; b.vy = 0; b.hitCeil = true; }
  } else {
    // resting: probe 1px below
    const c0 = Math.floor(b.x / TS), c1 = Math.floor((b.x + b.w - 0.001) / TS), r = Math.floor((b.y + b.h + 0.5) / TS);
    for (let c = c0; c <= c1; c++) { const t = tileAt(c, r); if (isSolidT(t) || (oneWay && t === T_PLAT && Math.abs(b.y + b.h - r * TS) < 1)) { b.onGround = true; break; } }
    if (oneWay && isP && !b.onGround) for (const f of floats) if (b.x + b.w > f.x + 1 && b.x < f.x + f.w - 1 && Math.abs(b.y + b.h - f.y) < 1) { b.onGround = true; b.onFloat = f; break; }
  }
  return wasGround;
}

// ---------------------------------------------------------------------
//  static pre-render of a room (background, decor, tiles). Rebuilt when a secret opens.
// ---------------------------------------------------------------------
// flame / light spots per decor sprite (offsets from bottom-centre)
const DECOR_FLAMES = {
  sconce: [[-0.5, -22]], stove: [[-10, -2], [6, -2]], candelabra: [[-8.5, -18], [0, -18], [8, -18]],
  chandelier_deco: [[-20, -20], [-10, -18], [0, -16], [10, -18], [20, -20]],
};
function renderRoomStatic() {
  const d = room.def, W = room.W, H = room.H, cv = room.canvas || (room.canvas = mkCanvas(W, H));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, W, H);
  const th = d.theme, wr = rectOf('bg', 'wall_' + th);
  for (let y = 0; y < H; y += wr.h) for (let x = 0; x < W; x += wr.w) spr('bg', 'wall_' + th, x, y, false, c);
  // soft vertical gradient (darker toward the ceiling) for depth
  const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(5,3,12,0.45)'); gr.addColorStop(0.5, 'rgba(5,3,12,0.08)'); gr.addColorStop(1, 'rgba(5,3,12,0.25)');
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  // crown molding under the top ceiling
  for (let x = 0; x < W; x += 32) spr('bg', 'mold_' + th, x, 2 * TS, false, c);
  // wainscot above every solid floor surface
  for (let r = 1; r < room.rows; r++) for (let col = 0; col < room.cols; col++) {
    if (isSolidT(tileAt(col, r)) && !isSolidT(tileAt(col, r - 1)) && !isSolidT(tileAt(col, r - 2))) {
      const wr2 = rectOf('bg', 'wain_' + th);
      c.drawImage(IMG.bg, wr2.x + (col & 1) * 16, wr2.y, 16, wr2.h, col * TS, r * TS - wr2.h, 16, wr2.h);
    }
  }
  // decor
  for (const dc of d.decor || []) {
    const [name, col, row, o] = dc, opt = o || {}, x = col * TS, y = row * TS;
    if (name === 'pillar') { const pr = rectOf('bg', 'pillar_' + th); for (let yy = 2 * TS + 10; yy < y; yy += pr.h) c.drawImage(IMG.bg, pr.x, pr.y, pr.w, Math.min(pr.h, y - yy), x - 8, yy, pr.w, Math.min(pr.h, y - yy)); continue; }
    const r = rectOf('props', name);
    if (opt.top) { spr('props', name, x - (r.w >> 1), y, opt.flip, c); continue; }
    if (opt.hang) { c.fillStyle = '#8a6a2a'; for (let yy = 2 * TS; yy < y - r.h; yy += 3) { c.fillRect(x - 1, yy, 2, 2); } }
    spr('props', name, x - (r.w >> 1), y - r.h, opt.flip, c);
  }
  // tiles
  const pre = d.tiles || '';
  const gateAt = {}; for (const gid in room.gates) for (const i of room.gates[gid]) gateAt[i] = room.gateStyle[gid];
  for (let r = 0; r < room.rows; r++) for (let col = 0; col < room.cols; col++) {
    const t = tileAt(col, r), x = col * TS, y = r * TS;
    const gs = t === T_GATE ? (gateAt[r * room.cols + col] || 'bars') : null;
    if (gs === 'hidden') continue;
    if (gs === 'spirit') { drawSpiritTile(c, x, y, col, r); continue; }
    if (gs === 'ring') { drawRingTile(c, x, y, col, r); continue; }
    if (gs === 'dark') { drawDarkTile(c, x, y, col, r); continue; }
    if (gs === 'bars') { const horiz = tileAt(col - 1, r) === T_GATE || tileAt(col + 1, r) === T_GATE; spr('tiles', horiz && !(tileAt(col, r - 1) === T_GATE || tileAt(col, r + 1) === T_GATE) ? 'grate' : 'bars', x, y, false, c); continue; }
    if (t === T_SOLID || t === T_SECRET || t === T_GATE) {
      const v = hash(col, r) & 1, top = r > 0 && !isSolidT(tileAt(col, r - 1)) && tileAt(col, r - 1) !== T_LOCK;
      spr('tiles', t === T_SECRET || gs === 'floor' ? pre + 'secret' : (pre + (top ? 'top' : 'brick') + v), x, y, false, c);
      // depth: interior mass darker, exposed sides shaded
      let depth = 9; for (let k = 1; k <= 2; k++) for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k]]) { const tt = tileAt(col + dx, r + dy); const inside = col + dx >= 0 && col + dx < room.cols && r + dy >= 0 && r + dy < room.rows; if (inside && !isSolidT(tt)) depth = Math.min(depth, k); }
      if (depth >= 3) { c.fillStyle = 'rgba(8,6,16,0.55)'; c.fillRect(x, y, TS, TS); } else if (depth === 2) { c.fillStyle = 'rgba(8,6,16,0.28)'; c.fillRect(x, y, TS, TS); }
      c.fillStyle = 'rgba(6,4,12,0.6)';
      if (!isSolidT(tileAt(col, r + 1)) && r + 1 < room.rows) c.fillRect(x, y + TS - 2, TS, 2);
      if (!isSolidT(tileAt(col - 1, r)) && col > 0) c.fillRect(x, y, 1, TS);
      if (!isSolidT(tileAt(col + 1, r)) && col + 1 < room.cols) c.fillRect(x + TS - 1, y, 1, TS);
    } else if (t === T_PLAT) {
      const l = tileAt(col - 1, r) === T_PLAT, rr = tileAt(col + 1, r) === T_PLAT;
      spr('tiles', !l ? 'platL' : !rr ? 'platR' : 'platM', x, y, false, c);
    } else if (t === T_LOCK) {
      c.fillStyle = '#2a1a10'; c.fillRect(x, y, TS, TS);
      if (tileAt(col, r - 1) !== T_LOCK) { // draw the sealed double door once, from its top tile
        let h = 0; while (tileAt(col, r + h) === T_LOCK) h++;
        spr('props', 'door', x + 3, y + h * TS - 48, false, c); c.fillStyle = 'rgba(150,120,255,0.35)'; c.fillRect(x + 2, y, 12, h * TS);
        c.fillStyle = '#c9a24a'; c.fillRect(x + 4, y + h * TS / 2 - 4, 8, 7); c.fillStyle = '#4a3612'; c.fillRect(x + 7, y + h * TS / 2 - 2, 2, 3);
      }
    }
  }
  // door frames at side openings
  for (const o of room.openings) {
    if (o.side !== 'L' && o.side !== 'R') continue;
    const y = o.a * TS, h = (o.b - o.a + 1) * TS, x = o.side === 'L' ? 0 : W - 20;
    const fr = rectOf('props', 'doorframe');
    c.drawImage(IMG.props, fr.x, fr.y, fr.w, 6, x, y - 6, fr.w, 6);   // lintel above the gap
    c.fillStyle = 'rgba(4,3,10,0.55)'; c.fillRect(o.side === 'L' ? 0 : W - 10, y, 10, h);
  }
  // lights / flames / moon shafts from decor
  room.lights = []; room.flames = []; room.shafts = [];
  for (const dc of d.decor || []) {
    const [name, col, row, o] = dc, opt = o || {}, x = col * TS, y = row * TS;
    if (DECOR_FLAMES[name]) for (const [fx, fy] of DECOR_FLAMES[name]) { room.flames.push({ x: x + fx, y: y + fy, k: hash(x, fx | 0) & 3 }); }
    if (opt.light) { const ly = name === 'chandelier_deco' ? 20 : name === 'sconce' ? 24 : name === 'gardenlamp' ? 40 : name === 'lamp_wall' ? 14 : 20; room.lights.push({ x, y: y - ly, r: opt.light === 2 ? 110 : 70, warm: name !== 'gardenlamp', cool: name === 'gardenlamp' }); }
    if (name === 'window' || name === 'window_wide' || name === 'round_window' || name === 'glasspane' || name === 'stainedglass') { const r = rectOf('props', name); room.shafts.push({ x: x - r.w / 2 + 3, y: y - r.h + 6, w: r.w - 6, h: r.h - 12 }); room.lights.push({ x, y: y - r.h / 2, r: 60, cool: 1 }); }
  }
}

// ---------------------------------------------------------------------
//  load a room; entry = { from: 'L'|'R'|'T'|'B', gx, gy } (global px of the player) or { save: true } / { start: true }
// ---------------------------------------------------------------------
function loadRoom(id, entry) {
  const def = ROOM_BY_ID[id], G = buildRoomGrid(def);
  room = { def, id, cols: G.cols, rows: G.rows, grid: G.grid, gates: G.gates, W: G.cols * TS, H: G.rows * TS, canvas: room && room.canvas, openings: roomOpenings(def, G), t: 0 };
  // permanent changes
  for (const gid in G.gates) if (progress.perm.has(id + ':gate:' + gid) || (gateAbil(gid) && hasAbil(gateAbil(gid)))) for (const i of G.gates[gid]) room.grid[i] = T_EMPTY;
  room.gateStyle = {};
  for (const gid in G.gates) { const e = def.ents.find(e => (e[0] === 'heavy' || e[0] === 'vines') && e[3] && e[3].gate === gid);
    room.gateStyle[gid] = e ? 'hidden' : gid === 'floor' ? 'floor' : gateKind(gid) || 'bars'; }
  if (progress.perm.has(id + ':secret')) for (let i = 0; i < room.grid.length; i++) if (room.grid[i] === T_SECRET) room.grid[i] = T_EMPTY;
  if (progress.hasKey && progress.perm.has(id + ':lock')) for (let i = 0; i < room.grid.length; i++) if (room.grid[i] === T_LOCK) room.grid[i] = T_EMPTY;
  renderRoomStatic();
  spawnRoomEntities();
  for (let y = 0; y < def.ch; y++) for (let x = 0; x < def.cw; x++) progress.visited.add((def.cx + x) + ',' + (def.cy + y));
  fadeT = 14; roomBanner(def);
  checkBossGates(); storyRoomEnter(def);
  stats.rooms++;
}
function revealSecret() {
  for (let i = 0; i < room.grid.length; i++) if (room.grid[i] === T_SECRET) room.grid[i] = T_EMPTY;
  progress.perm.add(room.id + ':secret'); renderRoomStatic(); sfx('secret'); tip('secret', '隠し通路を見つけた！');
}
// v0.4: seal doors - def.bossGate = { gate, need: [boss kinds] } opens for good once every listed boss is beaten
function checkBossGates() {
  for (const d of ROOM_DEFS) if (d.bossGate && d.bossGate.need.every(k => progress.bosses.has(k))) openGate(d.id, d.bossGate.gate, room && room.id !== d.id);
}
// open a gate for good (lever / wardrobe / vines / boss). Works for the current room or a remote one.
function openGate(roomId, gid, quiet) {
  const key = roomId + ':gate:' + gid; if (progress.perm.has(key)) return false; progress.perm.add(key);
  if (room && roomId === room.id && room.gates[gid]) {
    for (const i of room.gates[gid]) { room.grid[i] = T_EMPTY; const c = i % room.cols, r = (i / room.cols) | 0;
      for (let k = 0; k < 2; k++) parts.push({ x: c * TS + rnd(0, 16), y: r * TS + rnd(0, 16), vx: rnd(-1.5, 1.5), vy: rnd(-2, 0), life: 26, col: '#8a8494', size: 2, grav: 1 }); }
    renderRoomStatic(); if (!quiet) { sfx('door'); cam.shake = 5; }
  }
  return true;
}
function openLock() {
  for (let i = 0; i < room.grid.length; i++) if (room.grid[i] === T_LOCK) room.grid[i] = T_EMPTY;
  progress.perm.add(room.id + ':lock'); renderRoomStatic(); sfx('secret'); cam.shake = 6;
}
function exitRoom(side) {
  const d = room.def, pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
  const gx = d.cx * CELL_W + P.x, gy = d.cy * CELL_H + P.y;
  let cx, cy;
  if (side === 'L') { cx = d.cx - 1; cy = d.cy + clamp(Math.floor(pcy / CELL_H), 0, d.ch - 1); }
  else if (side === 'R') { cx = d.cx + d.cw; cy = d.cy + clamp(Math.floor(pcy / CELL_H), 0, d.ch - 1); }
  else if (side === 'T') { cx = d.cx + clamp(Math.floor(pcx / CELL_W), 0, d.cw - 1); cy = d.cy - 1; }
  else { cx = d.cx + clamp(Math.floor(pcx / CELL_W), 0, d.cw - 1); cy = d.cy + d.ch; }
  const nid = CELL_ROOM[cx + ',' + cy];
  if (!nid) return false;
  endTug(true);
  const nd = ROOM_BY_ID[nid];
  loadRoom(nid, { from: side });
  P.x = gx - nd.cx * CELL_W; P.y = gy - nd.cy * CELL_H;
  if (side === 'L') P.x = room.W - P.w - 3;
  else if (side === 'R') P.x = 3;
  else if (side === 'T') { P.y = room.H - P.h - 6; P.vy = -CONFIG.jumpVel; P.hover = CONFIG.hoverFrames; }
  else { P.y = 2; }
  P.spawnX = P.x; P.spawnY = P.y;
  entrySafety();
  snapCamera(); sfx('door');
  return true;
}
// Entering a room: a short no-damage grace, and no enemy may start inside the safe zone around the entry point
// (walkers are moved further into the room onto solid ground, flyers just slide over; if there is no room, they are removed).
function entrySafety() {
  P.grace = Math.max(P.grace, CONFIG.entryGrace);
  const S = CONFIG.entrySafe, px = pcx(), feet = P.y + P.h, dir = px < room.W / 2 ? 1 : -1;
  for (let i = ents.length - 1; i >= 0; i--) {
    const e = ents[i]; if (!(e.foe || e.ghost || e.type === 'armor') || e.type === 'firewisp') continue;
    const ey = e.body ? e.body.y + e.body.h : e.y;
    if (Math.abs(e.x - px) >= S || Math.abs(ey - feet) > 90) continue;
    let nx = px + dir * (S + 24 + Math.random() * 40);
    if (nx < CONFIG.foeEdge + 10 || nx > room.W - CONFIG.foeEdge - 10) { ents.splice(i, 1); continue; }
    if (e.body) { // walker: needs floor under the new spot and no wall in it
      const fy = e.body.y + e.body.h + 2;
      if (!solidAtPx(nx, fy) || solidAtPx(nx, e.body.y + e.body.h / 2)) { ents.splice(i, 1); continue; }
      e.body.x = nx - e.body.w / 2; e.x = nx; e.face = -dir; if (e.homeX !== undefined) e.homeX = nx;
    } else { e.x = nx; if (e.homeX !== undefined) e.homeX = nx; }
  }
}
function snapCamera() { cam.x = clamp(P.x + P.w / 2 - VW / 2, 0, room.W - VW); cam.y = clamp(P.y + P.h / 2 - VH * 0.55, 0, room.H - VH); }
function updateCamera() {
  const lead = P.tug ? 0 : P.face * 28;
  const tx = clamp(P.x + P.w / 2 + lead - VW / 2, 0, room.W - VW), ty = clamp(P.y + P.h / 2 - VH * 0.55, 0, room.H - VH);
  cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.14;
  if (Math.abs(tx - cam.x) < 0.3) cam.x = tx; if (Math.abs(ty - cam.y) < 0.3) cam.y = ty;
  if (cam.shake > 0) cam.shake -= 0.5;
}

// ---------------------------------------------------------------------
//  tips / room banners (hi-res text, queued)
// ---------------------------------------------------------------------
const banner = { text: '', en: '', t: 0 };
function roomBanner(def) {
  const key = 'room:' + def.id;
  if (progress.tips.has(key)) return; progress.tips.add(key);
  banner.text = def.jp; banner.en = def.en; banner.t = 170;
}
const tipBox = { text: '', t: 0, queue: [] };
function tip(id, text, force) {
  if (!force && progress.tips.has('tip:' + id)) return; progress.tips.add('tip:' + id);
  if (tipBox.t > 0) { tipBox.queue.push(text); return; }
  tipBox.text = text; tipBox.t = 240; stats.tips.push(id);
}
function updateTips() {
  if (banner.t > 0 && !STORY.box && !STORY.pending) banner.t--;   // v0.4.1: the room banner waits until Vel / Chronoa finish speaking
  if (tipBox.t > 0) { tipBox.t--; if (tipBox.t === 0 && tipBox.queue.length) { tipBox.text = tipBox.queue.shift(); tipBox.t = 220; } }
}
