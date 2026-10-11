
// =====================================================================
//  v0.3  WARP ROOMS (ワープの間) + SPIRIT BARRIERS (霊の結界) + new passive abilities
//   - every area has a small warp room with a glowing circle. Entering one registers it (progress.warps).
//     Step onto the circle -> the warp menu lists every warp room found so far (also shown on the map as W).
//     Left/Right choose, JUMP/Enter warp, VAC/MAP back (or tap a destination / outside the panel).
//   - gates whose id starts with "spirit" are pale violet barriers: only 霊体化 (phase) lets Kanata pass.
// =====================================================================
function makeWarp(x, y, opt, id) { return { type: 'warp', x, y, w: 48, h: 10, armed: false, t: 0 }; }
function updateWarp(e) {
  e.t++;
  if (!progress.warps.has(room.id)) {
    progress.warps.add(room.id); sfx('secret');
    tip('warpFound', 'ワープの間を見つけた！ 光る魔法陣に乗ると、見つけたワープの間どうしを行き来できる（マップの W）', true);
  }
  if (frame % 5 === 0) parts.push({ x: e.x + rnd(-20, 20), y: e.y - 4, vx: 0, vy: -rnd(0.4, 1.2), life: 30, col: (frame & 8) ? '#a8e8ff' : '#c8a0ff', size: 1, glow: 1 });
  const on = !P.dead && P.onGround && Math.abs(pcx() - e.x) < 14 && Math.abs(P.y + P.h - e.y) < 6;
  if (!on) { if (Math.abs(pcx() - e.x) > CONFIG.warpArm || Math.abs(P.y + P.h - e.y) > 40) e.armed = true; return; }
  if (e.armed && !P.tug && !boss) { e.armed = false; openWarpMenu(); }
}
const warpMenu = { sel: 0, list: [], from: null };
function warpRooms() { return ROOM_DEFS.filter(d => d.warp); }
function openWarpMenu() {
  warpMenu.list = warpRooms().filter(d => progress.warps.has(d.id)); warpMenu.from = room.id;
  warpMenu.sel = Math.max(0, warpMenu.list.findIndex(d => d.id === room.id));
  if (warpMenu.list.length > 1) { const nxt = (warpMenu.sel + 1) % warpMenu.list.length; warpMenu.sel = nxt; }
  P.vx = 0; Snd.vac(false); setState('warp'); sfx('cursor');
  if (warpMenu.list.length < 2) tip('warpOne', 'ほかのワープの間を見つけると、ここからワープできるようになる', true);
}
function closeWarpMenu() { setState('play'); sfx('cursor'); }
function updateWarpMenu() {
  const n = warpMenu.list.length;
  if (inp.leftPressed && n) { warpMenu.sel = (warpMenu.sel + n - 1) % n; sfx('cursor'); }
  if (inp.rightPressed && n) { warpMenu.sel = (warpMenu.sel + 1) % n; sfx('cursor'); }
  if (stateT > 8 && (inp.jumpPressed || inp.startPressed)) { const d = warpMenu.list[warpMenu.sel]; if (!d || d.id === room.id) closeWarpMenu(); else warpTo(d.id); return; }
  if (stateT > 4 && (inp.vacPressed || inp.mapPressed)) closeWarpMenu();
}
function warpTo(id) {
  endTug(true); stats.warps = (stats.warps || 0) + 1;
  loadRoom(id, { warp: true });
  const w = room.def.ents.find(e => e[0] === 'warp');
  placePlayer(w[1] * TS, w[2] * TS, 1);
  for (const e of ents) if (e.type === 'warp') e.armed = false;   // don't bounce straight back
  entrySafety(); snapCamera(); setState('play'); sfx('warp'); fadeT = 24;
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.28; parts.push({ x: pcx(), y: P.y + P.h - 6, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 1.2 - 0.6, life: 30, col: i & 1 ? '#a8e8ff' : '#c8a0ff', size: 2, glow: 1 }); }
}
// warp menu layout (buffer px): destination buttons in a row under a map
function warpButtons() {
  const n = warpMenu.list.length, bw = Math.min(60, Math.floor((VW - 20) / Math.max(1, n)) - 4), tot = n * (bw + 4) - 4, x0 = Math.round((VW - tot) / 2);
  return warpMenu.list.map((d, i) => ({ d, x: x0 + i * (bw + 4), y: 206, w: bw, h: 34 }));
}
function warpTap(gx, gy) {
  for (const [i, b] of warpButtons().entries()) if (gx >= b.x && gx < b.x + b.w && gy >= b.y && gy < b.y + b.h) {
    if (warpMenu.sel === i) { inp.jumpPressed = true; } else { warpMenu.sel = i; sfx('cursor'); } return true; }
  if (gy > 250) { inp.vacPressed = true; return true; }
  return false;
}
function renderWarpMenu() {
  renderPlayBase();
  g.fillStyle = 'rgba(6,4,20,0.9)'; g.fillRect(0, 0, VW, VH);
  const { cw, chh } = mapLayout(true), mw = WORLD.cols * cw, mh = WORLD.rows * chh, ox = Math.round((VW - mw) / 2), oy = 40;
  g.fillStyle = 'rgba(30,24,60,0.5)'; g.fillRect(ox - 3, oy - 3, mw + 6, mh + 6); rectLine(ox - 4, oy - 4, mw + 8, mh + 8, '#6a5aa8');
  drawMapGrid(ox, oy, cw, chh, false);
  const sel = warpMenu.list[warpMenu.sel];
  if (sel && (frame >> 3) & 1) { const x = ox + (sel.cx - WORLD.x0) * cw, y = oy + (sel.cy - WORLD.y0) * chh; rectLine(x - 2, y - 2, cw + 4, chh + 4, '#ffffff'); }
  for (const [i, b] of warpButtons().entries()) {
    const on = i === warpMenu.sel, here = b.d.id === room.id;
    g.fillStyle = on ? 'rgba(110,80,200,0.9)' : 'rgba(24,18,48,0.9)'; g.fillRect(b.x, b.y, b.w, b.h); rectLine(b.x, b.y, b.w, b.h, on ? '#e8dcff' : '#5a4a90');
    g.fillStyle = AREAS[b.d.area].col; g.fillRect(b.x + 3, b.y + 3, b.w - 6, 4);
    if (here) drawText('HERE', b.x + b.w / 2, b.y + b.h - 9, 'b', 1, 'c');
  }
  drawText('< >: SELECT   JUMP: WARP   VAC: BACK', VW / 2, VH - 22, 'b', 1, 'c');
  blit();
  drawHiText('ワープの間 ― 行き先をえらぶ', VW / 2, 10, 11, '#e8dcff', '#1a0e28');
  for (const b of warpButtons()) drawHiText((AREAS[b.d.area].short || AREAS[b.d.area].jp), b.x + b.w / 2, b.y + 11, 6.5, '#ffffff', null);
  if (sel) drawHiText(sel.id === room.id ? '（いまいる場所）' : AREAS[sel.area].jp + ' の ' + sel.jp + ' へワープ', VW / 2, 250, 8, sel.id === room.id ? '#a8a0d8' : '#fff4c0', '#1a0e28');
}

// ---- spirit barriers -----------------------------------------------------
const isSpirit = gid => gid.startsWith('spirit');
function openSpiritGates() { for (const gid in room.gates) if (isSpirit(gid)) openGate(room.id, gid); }
function updateSpirit() {
  for (const gid in room.gates) {
    if (!isSpirit(gid) || progress.perm.has(room.id + ':gate:' + gid)) continue;
    const cells = room.gates[gid];
    if (frame % 4 === 0) { const i = cells[(Math.random() * cells.length) | 0], c = i % room.cols, r = (i / room.cols) | 0;
      parts.push({ x: c * TS + rnd(0, 16), y: r * TS + rnd(0, 16), vx: rnd(-0.2, 0.2), vy: -rnd(0.2, 0.7), life: 26, col: (frame & 8) ? '#e0b8ff' : '#a8e8ff', size: 1, glow: 1 }); }
    for (const i of cells) { const c = i % room.cols, r = (i / room.cols) | 0;
      if (hitsKanata(c * TS - 6, r * TS - 6, c * TS + TS + 6, r * TS + TS + 6)) { tip('spirit', '青白い霊の結界… 体が押し返される。霊体になれる力があれば通れそうだ'); break; } }
  }
}
// static look of a closed spirit barrier (drawn into the room canvas)
function drawSpiritTile(c, x, y, col, row) {
  c.fillStyle = 'rgba(150,90,230,0.42)'; c.fillRect(x, y, TS, TS);
  c.fillStyle = 'rgba(220,190,255,0.75)'; for (let k = 0; k < 16; k += 4) c.fillRect(x + ((k + row * 5 + col * 3) % 16), y + k, 2, 2);
  c.fillStyle = 'rgba(168,232,255,0.5)'; c.fillRect(x + ((row * 7) % 12) + 2, y, 1, TS);
}
// tank upgrade (大容量タンク): 3 -> 4 slots
function syncAbilities() { CONFIG.vac.tankMax = hasAbil('tank') ? 4 : 3; }
