
// =====================================================================
//  STATES, RENDERING, HUD, MAP, TITLE, RESULTS, MAIN LOOP
// =====================================================================
let state = 'loading', stateT = 0, hitStop = 0, clearT = 0, titleSel = 0;
const talk = { text: '', t: 0 };
function say(text, frames) { talk.text = text; talk.t = frames || 220; }
function setState(s) { state = s; stateT = 0; }
const QS = new URLSearchParams(location.search);

function startNewGame() {
  resetProgress(); eraseSave();
  enterGame('foyer', true);
  say('……ふぁ。今日のおそうじは、このお屋敷。……ゴーストだらけ。がんばろ', 260);
  tip('move', '← → で移動、JUMP でジャンプ。落ちるときに JUMP 長押しで、ふわっと浮ける');
}
function continueGame() { const d = loadSave(); if (!d) return startNewGame(); applySave(d); enterGame(progress.saveRoom || 'foyer', false); say('……ん。つづき、やろっか', 150); }
function enterGame(roomId, atStart) {
  P.hp = progress.maxHP; P.dead = false; P.tank = []; P.inv = 0; P.tug = null; P.hover = CONFIG.hoverFrames;
  loadRoom(roomId, { start: true });
  const sp = (atStart && room.start) || room.save || room.start || { x: 3 * TS, y: 15 * TS };
  placePlayer(sp.x + (room.save && !atStart ? 22 : 0), sp.y, 1);
  for (const e of ents) if (e.type === 'save') e.used = true; // don't re-save on spawn
  snapCamera(); setState('play');
}
function respawn() {
  const d = loadSave(); if (d) applySave(d); else resetProgress();
  enterGame(d ? progress.saveRoom : 'foyer', !d);
  say('……いたた。もう一回', 140);
}
function startClear() { setState('clear'); clearT = 0; saveGame(room.id); say('', 0); }

// ---------------------------------------------------------------------
//  update
// ---------------------------------------------------------------------
function update() {
  stats.updates++; frame++; stateT++;
  if (window.__bot) { try { window.__bot(); } catch (e) { console.error('bot', e); } }
  if (state === 'loading') { if (assetsReady()) { setState('title'); if (QS.get('room')) debugStart(); } }
  else if (state === 'title') updateTitle();
  else if (state === 'play') updatePlay();
  else if (state === 'map') { if (inp.mapPressed || inp.startPressed || inp.jumpPressed) { setState('play'); sfx('cursor'); } }
  else if (state === 'clear') { clearT++; if (clearT > 240 && (inp.startPressed || inp.jumpPressed)) { setState('title'); sfx('start'); } }
  musicTick();
  for (const k in inp) inp[k] = false;
}
function updateTitle() {
  const hasSave = !!loadSave();
  if (!hasSave) titleSel = 0;
  if (hasSave && (inp.leftPressed || inp.rightPressed)) { titleSel = 1 - titleSel; sfx('cursor'); }
  if (stateT > 20 && (inp.startPressed || inp.jumpPressed)) { Snd.init(); sfx('start'); if (hasSave && titleSel === 0) continueGame(); else startNewGame(); }
}
function updatePlay() {
  if (inp.mapPressed && !P.dead && !(boss && boss.state === 'intro')) { setState('map'); sfx('cursor'); Snd.vac(false); return; }
  if (hitStop > 0) { hitStop--; return; }
  progress.time++;
  if (fadeT > 0) fadeT--;
  const cut = boss && (boss.state === 'intro' || boss.state === 'dying');
  if (cut) { const sv = Object.assign({}, keys), st = Object.assign({}, touch); for (const k in keys) keys[k] = touch[k] = false; inp.jumpPressed = inp.spitPressed = false; updatePlayer(); Object.assign(keys, sv); Object.assign(touch, st); }
  else updatePlayer();
  if (state !== 'play') return;
  if (P.dead) { if (P.deadT > 170) respawn(); updateParts(); return; }
  updateEnts(); updateItems(); updateShots(); updateEBullets(); updateBoss();
  if (boss && boss.core && boss.core.state === 'swallow') { const c = boss.core, n = nozzle(); c.t++; c.x += (n.x - c.x) * 0.2; c.y += (n.y - c.y) * 0.2; if (c.t > 18) boss.core = null; }
  updateParts(); checkLockedDoor(); updateTips(); updateCamera();
  if (talk.t > 0) talk.t--;
  if (boss && boss.state === 'intro' && boss.t === 130) say('……わ。でっかいシャンデリア。ホコリ、すごそう……', 160);
  if (boss && boss.state === 'stuck' && boss.t === 1 && !progress.tips.has('tip:coresay')) { progress.tips.add('tip:coresay'); say('……つかまえた。……逃がさない', 120); }
}
function debugStart() {
  resetProgress(); if (QS.get('key')) progress.hasKey = true;
  enterGame(QS.get('room'), true);
  if (QS.get('x')) placePlayer(+QS.get('x') * TS, +(QS.get('y') || 15) * TS, 1);
  snapCamera(); if (QS.get('god')) P.god = true;
}

// ---------------------------------------------------------------------
//  rendering helpers
// ---------------------------------------------------------------------
const lightCv = mkCanvas(VW, VH), lc = lightCv.getContext('2d');
function drawLighting(extra) {
  const d = room.def.dark; if (!d) return;
  lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, VW, VH); lc.fillStyle = 'rgba(6,4,18,' + d + ')'; lc.fillRect(0, 0, VW, VH);
  lc.globalCompositeOperation = 'destination-out';
  const all = room.lights.concat(extra);
  for (const L of all) {
    const x = L.x - cam.x, y = L.y - cam.y, r = L.r * (L.flick ? 1 : (1 + Math.sin(frame * 0.11 + L.x) * 0.04));
    if (x < -r || x > VW + r || y < -r || y > VH + r) continue;
    const gr = lc.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,' + (L.s || 0.95) + ')'); gr.addColorStop(0.55, 'rgba(0,0,0,' + (L.s || 0.95) * 0.55 + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    lc.fillStyle = gr; lc.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.drawImage(lightCv, 0, 0);
  // warm / cool tints
  g.globalCompositeOperation = 'lighter';
  for (const L of all) {
    if (!L.warm && !L.cool && !L.blue) continue;
    const x = L.x - cam.x, y = L.y - cam.y, r = L.r * 0.7; if (x < -r || x > VW + r || y < -r || y > VH + r) continue;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, L.warm ? 'rgba(255,150,60,0.16)' : L.blue ? 'rgba(80,170,255,0.18)' : 'rgba(90,120,255,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // moonlight shafts from windows
  for (const s of room.shafts) {
    const x = s.x - cam.x, y = s.y - cam.y; if (x > VW || x + s.w + 60 < 0) continue;
    g.fillStyle = 'rgba(110,140,255,0.06)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s.w, y); g.lineTo(x + s.w + 46, y + s.h + 70); g.lineTo(x + 30, y + s.h + 70); g.closePath(); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
}
function heroPose() {
  if (P.dead) return 7;
  if (P.knock > 0) return 6 + (P.animT >> 3 & 1) * 8;
  if (P.spitPose > 0) return 5 + ((P.spitPose >> 3) & 1) * 8;
  if (P.vacOn) return 4 + ((P.animT >> 2) & 1) * 8;
  if (!P.onGround) return P.hovering ? 3 + ((P.animT >> 4) & 1) * 8 : 2 + ((P.animT >> 4) & 1) * 8;
  if (Math.abs(P.vx) > 0.25) return [2, 3, 10, 11][(P.animT >> 3) & 3];
  const cyc = P.animT % 240; if (cyc > 228) return 1 + ((P.animT / 240 | 0) & 1) * 8;
  return ((P.animT / 120 | 0) & 1) * 8;
}
function drawWisps(front) {
  const cx = pcx() - cam.x, cy = P.y + 22 - cam.y;
  for (let i = 0; i < 3; i++) {
    const a = frame * 0.035 + i * 2.094, s = Math.sin(a);
    if ((s > 0) !== front) continue;
    let x = cx + Math.cos(a) * 24, y = cy + s * 7 + Math.sin(frame * 0.07 + i) * 3;
    if (P.hovering) { x = cx + Math.cos(a) * 14; y = P.y + P.h - cam.y + 2 + s * 3; }
    if (P.vacOn) { const n = nozzle(); x = n.x - cam.x + P.face * (10 + ((frame * 2 + i * 20) % 50)); y = n.y - cam.y + Math.sin(frame * 0.3 + i * 2) * 8; }
    g.globalAlpha = front ? 0.85 : 0.55;
    const r = { w: IMG.wisp.width, h: IMG.wisp.height }; g.drawImage(IMG.wisp, Math.round(x - r.w / 2), Math.round(y - r.h / 2)); g.globalAlpha = 1;
  }
}
function drawPlayer() {
  if (P.inv > 0 && !P.dead && (P.inv >> 2) % 2 === 0) return;
  drawWisps(false);
  // vacuum cone glow
  if (P.vacOn && !P.dead) {
    const n = nozzle(), V = CONFIG.vac, x = n.x - cam.x, y = n.y - cam.y, f = P.face;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(x, 0, x + f * V.range, 0); gr.addColorStop(0, 'rgba(140,220,255,0.30)'); gr.addColorStop(1, 'rgba(140,220,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x, y - V.spreadNear); g.lineTo(x + f * V.range, y - V.spreadFar); g.lineTo(x + f * V.range, y + V.spreadFar); g.lineTo(x, y + V.spreadNear); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over';
  }
  drawHero(heroPose(), Math.round(pcx() - cam.x), Math.round(P.y + P.h - cam.y), P.face < 0, false);
  drawWisps(true);
  // tug rope
  if (P.tug) {
    const n = nozzle(), gh = P.tug, x0 = n.x - cam.x, y0 = n.y - cam.y, x1 = gh.x - cam.x, y1 = gh.y - cam.y;
    g.globalCompositeOperation = 'lighter';
    for (let pass = 0; pass < 2; pass++) {
      g.fillStyle = pass ? '#ffffff' : 'rgba(120,220,255,0.7)';
      for (let i = 0; i <= 24; i++) { const t = i / 24, w = Math.sin(t * Math.PI) * Math.sin(frame * 0.5 + t * 12) * (gh.yanking ? 5 : 2.5);
        g.fillRect(Math.round(x0 + (x1 - x0) * t - (pass ? 0 : 1)), Math.round(y0 + (y1 - y0) * t + w - (pass ? 0 : 1)), pass ? 1 : 3, pass ? 1 : 3); }
    }
    g.globalCompositeOperation = 'source-over';
  }
}
function ghostSprite(e) {
  if (e.type === 'firewisp') return ['enemies', 'firewisp' + ((e.t >> 3) % 3)];
  if (e.type === 'dish') return ['enemies', e.state === 'caught' || e.state === 'swallow' ? 'dish_tug' : e.state === 'warn' ? 'dish_throw' : 'dish' + ((e.t >> 4) % 3)];
  if (e.state === 'caught' || e.state === 'swallow') return ['enemies', 'puff_tug'];
  if (e.type === 'armorghost' || e.state === 'warn' || e.state === 'dash') return ['enemies', 'puff_angry'];
  return ['enemies', 'puff' + ((e.t >> 4) & 3)];
}
function drawGhost(e) {
  const [a, k] = ghostSprite(e), r = rectOf(a, k);
  let x = e.x - cam.x - r.w / 2, y = e.y - cam.y - r.h / 2;
  if (e.state === 'warn' || (e.catchT > 0 && e.state !== 'caught')) x += (frame & 2) ? 1 : -1;
  if (e.state === 'caught' && e.yankWarn > 0) x += (frame & 2) ? 2 : -2;
  let sc = 1;
  if (e.state === 'swallow') { sc = Math.max(0.1, 1 - e.t / 18); }
  g.globalAlpha = e.type === 'firewisp' ? 1 : 0.88 + Math.sin(frame * 0.2 + e.seed) * 0.08;
  if (sc !== 1) { g.drawImage(IMG[a], r.x, r.y, r.w, r.h, Math.round(e.x - cam.x - r.w * sc / 2), Math.round(e.y - cam.y - r.h * sc / 2), Math.max(1, Math.round(r.w * sc)), Math.max(1, Math.round(r.h * sc))); }
  else { spr(a, k, x, y, pcx() < e.x); if (e.flash > 0 && (frame & 2)) sprWhite(a, k, x, y, pcx() < e.x); }
  g.globalAlpha = 1;
  if (e.type === 'armorghost' && e.state !== 'swallow') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; sprWhite(a, k, x, y, pcx() < e.x, '#ff3050'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if (e.type === 'dish' && e.state === 'warn') spr('items', 'plate', e.x - cam.x - 7, y - 8 - Math.min(6, e.t / 3));
  if (e.stunT > 0 && e.state !== 'caught') for (let i = 0; i < 3; i++) { const an = frame * 0.15 + i * 2.1; g.fillStyle = '#ffe080'; g.fillRect(Math.round(e.x - cam.x + Math.cos(an) * 10), Math.round(y - 2 + Math.sin(an) * 3), 2, 2); }
  if (e.state === 'caught') {
    const hp = String(Math.max(0, Math.ceil(e.hp))); drawTextShadow(hp, Math.round(e.x - cam.x), Math.round(y - 10), e.pullingAway ? 'y' : 'c', 1, 'c');
    if (e.yankWarn > 0 && (frame & 4)) drawTextShadow('!', Math.round(e.x - cam.x + 14), Math.round(y - 4), 'r', 2, 'c');
  } else if (e.catchT > 0 && e.state !== 'swallow') { // catch meter ring
    const k2 = Math.min(1, e.catchT / CONFIG.vac.catchFrames); g.fillStyle = '#bff4ff';
    for (let i = 0; i < 12 * k2; i++) { const an = -Math.PI / 2 + i / 12 * Math.PI * 2; g.fillRect(Math.round(e.x - cam.x + Math.cos(an) * (r.w / 2 + 3)), Math.round(e.y - cam.y + Math.sin(an) * (r.h / 2 + 3)), 1, 1); }
  }
}
function drawEnt(e) {
  const x = e.x - cam.x, y = e.y - cam.y;
  switch (e.type) {
    case 'save': {
      sprBC('props', 'save', x, y); spr('props', 'bflame' + ((frame >> 3) & 3), x - 4, y - 30);
      break; }
    case 'curtain': {
      if (e.torn) { spr('props', 'curtain_rod', x - 16, y - 72); break; }
      const r = rectOf('props', 'curtain'), n = nozzle(), dir = Math.sign(n.x - e.x) || 1, k = e.suckT / e.need;
      for (let yy = 0; yy < r.h; yy += 2) {
        const t = yy / r.h, off = Math.round(dir * (k * 14 * Math.pow(t, 1.3) + Math.sin(frame * (0.05 + k * 0.4) + yy * 0.08) * (0.6 + k * 3) * t));
        g.drawImage(IMG.props, r.x, r.y + yy, r.w, 2, Math.round(x - 16 + off), Math.round(y - 72 + yy), r.w, 2);
      }
      break; }
    case 'dust': { const jit = e.inCone > 0 ? ((frame & 2) ? 1 : -1) : 0; sprBC('props', 'dust' + Math.min(2, e.stage), x + jit, y); break; }
    case 'vase': { const jit = (!e.empty && e.inCone > 0) ? Math.round(Math.sin(frame * 1.3) * Math.min(3, e.suckT / 10)) : 0; sprBC('props', 'vase', x + jit, y); break; }
    case 'shell': sprBC('enemies', 'armor_shell', x, y, e.face < 0); break;
    case 'armor': {
      const k = e.state === 'walk' ? 'armor' + ((e.t >> 4) & 1) : 'armor0', r = rectOf('enemies', k);
      const sx = x - r.w / 2 + (e.state === 'windup' ? ((frame & 2) ? 1 : -1) : 0), sy = y - r.h;
      spr('enemies', k, sx, sy, e.face < 0);
      if (e.state === 'windup' && (frame & 4)) { g.globalAlpha = 0.5; sprWhite('enemies', k, sx, sy, e.face < 0, '#ff5050'); g.globalAlpha = 1; }
      if (e.state === 'swing') { g.fillStyle = 'rgba(255,255,255,0.8)'; const t = e.t / CONFIG.armor.swingFrames; for (let i = 0; i < 10; i++) { const an = -1.4 + t * 2.4 - i * 0.08; g.fillRect(Math.round(x + e.face * Math.cos(an) * 30), Math.round(y - 30 + Math.sin(an) * 26), 2, 2); } }
      break; }
  }
}
function drawItem(it) {
  const x = it.x - cam.x, y = it.y - cam.y;
  if (it.kind === 'coin') spr('items', 'coin' + ((it.t >> 3) & 3), x, y);
  else if (it.kind === 'heartbig') { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,80,120,0.15)'; g.beginPath(); g.arc(x + 9, y + 8, 14 + Math.sin(frame * 0.1) * 2, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; spr('items', 'heartbig', x, y); }
  else if (it.kind === 'key') { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,220,120,0.15)'; g.beginPath(); g.arc(x + 7, y + 5, 12 + Math.sin(frame * 0.1) * 2, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; spr('items', 'key', x, y); }
  else spr('items', it.kind === 'fireball' ? 'fireball' : it.kind, x, y);
  if (isAmmo(it.kind) && it.t % 90 < 6) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + it.w / 2), Math.round(y - 2), 1, 1); }
}
function drawShot(s) {
  const x = s.x - cam.x, y = s.y - cam.y, r = rectOf('items', s.kind);
  g.save(); g.translate(Math.round(x + s.w / 2), Math.round(y + s.h / 2)); g.rotate(s.kind === 'plate' ? 0 : s.spin * 0.3 * Math.sign(s.vx));
  g.drawImage(IMG.items, r.x, r.y, r.w, r.h, -r.w >> 1, -r.h >> 1, r.w, r.h); g.restore();
}
function drawEBullet(b) {
  const x = b.x - cam.x, y = b.y - cam.y;
  if (b.kind === 'plate') { spr('items', 'plate', x, y); if (b.spin & 4) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + 2), Math.round(y + 1), 3, 1); } }
  else if (b.kind === 'candle') { spr('items', 'candle', x, y); spr('props', (boss && boss.rage ? 'bflame' : 'flame') + ((frame >> 2) & 3), x, y - 7); }
  else if (b.kind === 'shard') { g.fillStyle = '#c8ecff'; g.fillRect(Math.round(x + 3), Math.round(y), 2, 10); g.fillRect(Math.round(x + 1), Math.round(y + 3), 6, 4); g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + 3), Math.round(y + 2), 1, 4); }
  else if (b.kind === 'firepatch') { const k = boss && boss.rage ? 'bflame' : 'flame'; for (let i = 0; i < 3; i++) spr('props', k + (((frame >> 2) + i) & 3), x + 1 + i * 7, y + (b.life < 30 ? 4 : 1)); }
  else if (b.kind === 'wave') { for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#c9a24a' : '#e8f8ff'; const hgt = 4 + ((frame + i * 3) % 8); g.fillRect(Math.round(x + i * 3), Math.round(y + b.h - hgt), 2, hgt); } }
}
function drawParts() {
  for (const p of parts) {
    const x = p.x - cam.x, y = p.y - cam.y;
    if (p.sprite === 'helmet') { spr('enemies', 'helmet', x - 6, y - 6); continue; }
    if (p.sprite === 'curtain') { const r = rectOf('props', 'curtain'), sc = Math.max(0.05, p.life / 26); g.drawImage(IMG.props, r.x, r.y, r.w, r.h, Math.round(p.sx - cam.x + r.w * (1 - sc) / 2), Math.round(p.sy - cam.y + r.h * (1 - sc) / 2), Math.max(1, Math.round(r.w * sc)), Math.max(1, Math.round(r.h * sc))); continue; }
    if (p.glow) g.globalCompositeOperation = 'lighter';
    g.globalAlpha = Math.min(1, p.life / 10); g.fillStyle = p.col;
    if (p.streak) { g.fillRect(Math.round(x), Math.round(y), 4, 1); }
    else g.fillRect(Math.round(x), Math.round(y), p.size || 1, p.size || 1);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
}
function drawBoss(lights) {
  const b = boss; if (!b || b.state === 'done') return;
  const x = Math.round(b.x - cam.x), y = Math.round(b.y - cam.y), blue = b.rage;
  // telegraphs on the floor
  if (b.state === 'candles' && b.marks.length) {
    const k = b.t / bossP('candleWarn');
    for (const mx of b.marks) { const xx = mx - cam.x, yy = FLOOR_Y - cam.y; g.fillStyle = (frame & 4) ? 'rgba(255,120,40,0.75)' : 'rgba(255,200,80,0.6)';
      g.beginPath(); g.ellipse(xx, yy - 1, 6 + k * 6, 2 + k, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,170,80,0.35)'; for (let yy2 = y + 40; yy2 < yy - 4; yy2 += 6) g.fillRect(Math.round(xx), yy2, 1, 3); }
  }
  if (b.state === 'shards' && b.shardV) {
    g.fillStyle = (frame & 4) ? 'rgba(200,236,255,0.7)' : 'rgba(200,236,255,0.35)';
    for (const v of b.shardV) { let px = b.x, py = b.y + 74, vx = v.vx, vy = v.vy; for (let s = 0; s < 90; s++) { px += vx; py += vy; vy += 0.06; if (py > FLOOR_Y) break; if (s % 5 === 0) g.fillRect(Math.round(px - cam.x), Math.round(py - cam.y), 1, 1); } }
  }
  if (b.state === 'crash') {
    const tr = bossP('crashTrack'), lock = b.t >= tr; const sx = (lock ? b.px : b.shadowX) - cam.x;
    g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,60,60,0.55)' : 'rgba(0,0,0,0.5)') : 'rgba(0,0,0,0.42)';
    g.beginPath(); g.ellipse(sx, FLOOR_Y - cam.y - 1, 54, 5, 0, 0, 7); g.fill();
  }
  // chain
  const cr = rectOf('boss', 'chain');
  for (let yy = 2 * TS; yy < b.y; yy += 10) spr('boss', 'chain', Math.round(b.px - cam.x - 3), yy - cam.y);
  // chandelier
  const key = b.rage ? 'chandelier_cracked' : 'chandelier', r = rectOf('boss', key);
  let jx = 0; if (b.state === 'crash' && b.t >= bossP('crashTrack')) jx = (frame & 2) ? 2 : -2; if (b.state === 'stuck') jx = 0;
  // core inside the globe
  const c = b.core;
  if (!c || c.state === 'swallow') { if (b.state !== 'dying' || b.t < 90) { const mood = b.state === 'dying' ? 'dizzy' : b.rage || b.state === 'wisps' ? 'angry' : 'normal'; g.globalAlpha = 0.8; spr('boss', 'core_' + mood, x - 15 + jx, y + 27 + Math.round(Math.sin(frame * 0.08) * 2)); g.globalAlpha = 1; } }
  if (b.state === 'dying' && b.t >= 90) { /* shattered: draw falling pieces only */ }
  else {
    spr('boss', key, x - r.ax + jx, y);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, x - r.ax + jx, y); g.globalAlpha = 1; }
    if (b.state === 'wisps' && b.t < 40) { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,200,120,' + (0.2 + 0.2 * Math.sin(frame * 0.5)) + ')'; g.beginPath(); g.arc(x, y + 42, 18 + b.t / 4, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; }
    // candle flames
    const lit = b.state === 'sleep' ? 0 : b.state === 'intro' ? b.lit : 6, shake = (b.state === 'candles' && b.marks.length) ? ((frame & 2) ? 1 : -1) : 0;
    for (let i = 0; i < lit; i++) { const ox = BOSS_CANDLES[i]; spr('props', (blue ? 'bflame' : 'flame') + (((frame >> 2) + i) & 3), x + ox - 3 + jx, y + 22 + shake); lights.push({ x: b.x + ox, y: b.y + 26, r: 46, warm: !blue, blue }); }
    if (b.state === 'shards' && b.shardV) for (let i = 0; i < 6; i++) if (((frame >> 2) + i) % 4 === 0) { g.fillStyle = '#ffffff'; g.fillRect(x - 52 + i * 20, y + 52 + (i % 3) * 4, 2, 2); }
    if (b.state === 'stuck') for (let i = 0; i < 4; i++) { const an = frame * 0.12 + i * 1.57; g.fillStyle = '#ffe080'; g.fillRect(Math.round(x + Math.cos(an) * 40), Math.round(y + 18 + Math.sin(an) * 4), 2, 2); }
  }
  lights.push({ x: b.x, y: b.y + 42, r: 70, warm: 1 });
  if (c && c.state !== 'swallow') {
    const k = c.state === 'caught' ? 'core_tug' : 'core_dizzy', cx = Math.round(c.x - cam.x), cy = Math.round(c.y - cam.y);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,200,100,0.25)'; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
    spr('boss', k, cx - 15 + (c.yankWarn > 0 && (frame & 2) ? 2 : 0), cy - 15);
    if (c.state === 'caught' && c.yankWarn > 0 && (frame & 4)) drawTextShadow('!', cx + 16, cy - 20, 'r', 2, 'c');
    if (c.catchT > 0 && c.state !== 'caught') { g.fillStyle = '#bff4ff'; const k2 = Math.min(1, c.catchT / (CONFIG.vac.catchFrames * 0.6)); for (let i = 0; i < 14 * k2; i++) { const an = -Math.PI / 2 + i / 14 * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(an) * 19), Math.round(cy + Math.sin(an) * 19), 1, 1); } }
    lights.push({ x: c.x, y: c.y, r: 50, warm: 1 });
  } else if (c && c.state === 'swallow') { const sc = Math.max(0.1, 1 - c.t / 18), rr = rectOf('boss', 'core_tug'); g.drawImage(IMG.boss, rr.x, rr.y, rr.w, rr.h, Math.round(c.x - cam.x - rr.w * sc / 2), Math.round(c.y - cam.y - rr.h * sc / 2), Math.max(1, rr.w * sc | 0), Math.max(1, rr.h * sc | 0)); }
}

// ---------------------------------------------------------------------
//  HUD
// ---------------------------------------------------------------------
function drawHeart(x, y, fill) { // 7x6 pixel heart, fill 0 / 1 (half) / 2
  const rows = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) if (rows[r][c] === '#') {
    const on = fill === 2 || (fill === 1 && c < 4);
    g.fillStyle = on ? (r < 2 && c < 3 ? '#ffb0c4' : '#ff4a6a') : '#3a2440'; g.fillRect(x + c, y + r, 1, 1);
  }
}
function drawMapGrid(ox, oy, cw, chh, mini) {
  const curCells = new Set(); const d = room.def; for (let y = 0; y < d.ch; y++) for (let x = 0; x < d.cw; x++) curCells.add((d.cx + x) + ',' + (d.cy + y));
  for (const rd of ROOM_DEFS) {
    let seen = false; for (let y = 0; y < rd.ch; y++) for (let x = 0; x < rd.cw; x++) if (progress.visited.has((rd.cx + x) + ',' + (rd.cy + y))) seen = true;
    if (!seen) continue;
    const x0 = ox + rd.cx * cw, y0 = oy + rd.cy * chh, w = rd.cw * cw, h = rd.ch * chh, cur = rd.id === room.id;
    g.fillStyle = cur ? ((frame >> 4) & 1 ? '#3a64c8' : '#2a4aa0') : rd.boss ? '#5a2238' : rd.secret ? '#5a4a18' : '#2a3a7a'; g.fillRect(x0, y0, w, h);
    rectLine(x0, y0, w, h, cur ? '#c8e0ff' : '#8aa8ff');
    if (!mini) {
      if (rd.ents.some(e => e[0] === 'save')) { g.fillStyle = '#8ad0ff'; g.fillRect(x0 + 3, y0 + 3, 4, 4); drawText('S', x0 + 9, y0 + 3, 'c', 1); }
      if (rd.boss) drawText(progress.bossDone ? 'X' : 'B', x0 + w - 9, y0 + 3, progress.bossDone ? 'b' : 'r', 1);
    }
  }
  // door ticks between rooms
  if (!mini) for (const rd of ROOM_DEFS) {
    if (![...Array(rd.cw * rd.ch).keys()].some(i => progress.visited.has((rd.cx + i % rd.cw) + ',' + (rd.cy + Math.floor(i / rd.cw))))) continue;
    const G = buildRoomGrid(rd);
    for (const o of roomOpenings(rd, G)) {
      g.fillStyle = '#ffe080';
      if (o.side === 'L') g.fillRect(ox + rd.cx * cw - 1, oy + (rd.cy + o.cell) * chh + chh / 2 - 2, 2, 4);
      if (o.side === 'R') g.fillRect(ox + (rd.cx + rd.cw) * cw - 1, oy + (rd.cy + o.cell) * chh + chh / 2 - 2, 2, 4);
      if (o.side === 'T') g.fillRect(ox + (rd.cx + o.cell) * cw + cw / 2 - 2, oy + rd.cy * chh - 1, 4, 2);
      if (o.side === 'B') g.fillRect(ox + (rd.cx + o.cell) * cw + cw / 2 - 2, oy + (rd.cy + rd.ch) * chh - 1, 4, 2);
    }
  }
  // player dot
  const gx = ox + d.cx * cw + clamp(pcx() / CELL_W, 0, d.cw - 0.01) * cw, gy = oy + d.cy * chh + clamp(pcy() / CELL_H, 0, d.ch - 0.01) * chh;
  if ((frame >> 3) & 1) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(gx) - (mini ? 0 : 1), Math.round(gy) - (mini ? 0 : 1), mini ? 2 : 3, mini ? 2 : 3); }
}
function mapPercent() { return Math.round(progress.visited.size / TOTAL_CELLS * 100); }
function drawHUD() {
  // panel
  g.fillStyle = 'rgba(8,6,20,0.72)'; g.fillRect(4, 4, 112, 30); rectLine(4, 4, 112, 30, '#4e4876');
  drawTextShadow('KANATA', 8, 8, 'c', 1);
  const hearts = progress.maxHP / 2; for (let i = 0; i < hearts; i++) drawHeart(46 + i * 9, 7, clamp(P.hp - i * 2, 0, 2));
  // tank slots
  drawText('TANK', 8, 21, 'b', 1);
  for (let i = 0; i < CONFIG.vac.tankMax; i++) {
    const x = 34 + i * 15, y = 18; g.fillStyle = '#16122a'; g.fillRect(x, y, 13, 13); rectLine(x, y, 13, 13, i < P.tank.length ? '#8fe8ff' : '#3e3866');
    if (i < P.tank.length) { const r = rectOf('items', P.tank[i]); const sc = Math.min(1, 11 / Math.max(r.w, r.h)); g.drawImage(IMG.items, r.x, r.y, r.w, r.h, Math.round(x + 6.5 - r.w * sc / 2), Math.round(y + 6.5 - r.h * sc / 2), Math.round(r.w * sc), Math.round(r.h * sc)); }
  }
  spr('items', 'coin0', 82, 20); drawTextShadow(String(progress.coins), 94, 22, 'y', 1);
  if (progress.hasKey) spr('items', 'key', 100, 6);
  // minimap (whole area)
  const cw = 7, chh = 5, mw = 9 * cw + 4, mh = 3 * chh + 4, mx = VW - mw - 4;
  g.fillStyle = 'rgba(8,6,20,0.72)'; g.fillRect(mx, 4, mw, mh + 10); rectLine(mx, 4, mw, mh + 10, '#4e4876');
  drawMapGrid(mx + 2, 6, cw, chh, true);
  drawText('MAP ' + mapPercent() + '%', mx + mw / 2, mh + 7, 'b', 1, 'c');
  // boss bar
  if (boss && boss.state !== 'sleep' && boss.state !== 'done') {
    const w = 200, x = (VW - w) / 2, y = VH - 14, k = Math.max(0, boss.hp / boss.maxHp);
    g.fillStyle = 'rgba(8,6,20,0.8)'; g.fillRect(x - 2, y - 2, w + 4, 9); g.fillStyle = '#3a1428'; g.fillRect(x, y, w, 5);
    g.fillStyle = boss.rage ? '#6ab0ff' : '#ffb040'; g.fillRect(x, y, Math.round(w * (boss.state === 'intro' ? Math.min(1, boss.t / 120) : k)), 5);
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x, y, Math.round(w * k), 1);
  }
}

// ---------------------------------------------------------------------
//  screens
// ---------------------------------------------------------------------
function renderPlay() {
  const sx = cam.shake > 0 ? Math.round(rnd(-cam.shake, cam.shake) * 0.5) : 0, sy = cam.shake > 0 ? Math.round(rnd(-cam.shake, cam.shake) * 0.5) : 0;
  const cx = Math.round(cam.x) + sx, cy = Math.round(cam.y) + sy;
  const savedCam = { x: cam.x, y: cam.y }; cam.x = cx; cam.y = cy;
  g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH);
  g.drawImage(room.canvas, clamp(cx, 0, room.W - VW), clamp(cy, 0, room.H - VH), VW, VH, clamp(cx, 0, room.W - VW) - cx, clamp(cy, 0, room.H - VH) - cy, VW, VH);
  for (const f of room.flames) { const x = f.x - cx - 3, y = f.y - cy - 8; if (x > -8 && x < VW && y > -10 && y < VH) spr('props', 'flame' + (((frame >> 2) + f.k) & 3), x, y); }
  for (const e of ents) if (!e.ghost && !e.dead) drawEnt(e);
  for (const it of items) if (!it.dead) drawItem(it);
  const lights = [{ x: pcx(), y: pcy(), r: 84, s: 0.9 }];
  for (const e of ents) { if (e.type === 'save') lights.push({ x: e.x, y: e.y - 26, r: 70, blue: 1 }); if (e.type === 'firewisp') lights.push({ x: e.x, y: e.y, r: 40, warm: 1 }); if (e.ghost && e.type !== 'firewisp') lights.push({ x: e.x, y: e.y, r: 34, s: 0.5 }); }
  for (const b of ebullets) if (b.kind === 'firepatch' || b.kind === 'candle') lights.push({ x: b.x + b.w / 2, y: b.y, r: 36, warm: 1 });
  if (P.vacOn) { const n = nozzle(); lights.push({ x: n.x + P.face * 30, y: n.y, r: 60, blue: 1, s: 0.8 }); }
  const bossLights = []; if (boss) { const tmp = g.globalAlpha; drawBoss(bossLights); g.globalAlpha = tmp; }
  drawLighting(lights.concat(bossLights));
  if (boss) { /* boss drawn under the darkness but its flames add light; redraw glowing flames on top for punch */ }
  for (const e of ents) if (e.type === 'armor' && !e.dead) drawEnt(e);
  for (const e of ents) if (e.ghost && !e.dead) drawGhost(e);
  drawPlayer();
  for (const s of playerShots) drawShot(s);
  for (const b of ebullets) drawEBullet(b);
  drawParts();
  cam.x = savedCam.x; cam.y = savedCam.y;
  drawHUD();
  if (fadeT > 0) { g.fillStyle = 'rgba(0,0,0,' + (fadeT / 14) + ')'; g.fillRect(0, 0, VW, VH); }
  if (P.dead) { const k = Math.min(1, P.deadT / 60); g.fillStyle = 'rgba(10,4,20,' + k * 0.6 + ')'; g.fillRect(0, 0, VW, VH); }
  blit();
  // hi-res overlays
  if (banner.t > 0) { const a = Math.min(1, banner.t / 20, (170 - banner.t) / 15); drawHiText(banner.text, VW / 2, 52, 15, '#fff4e0', '#1a0e28', 'center', a); drawHiText(banner.en, VW / 2, 72, 7, '#c8b8ff', '#1a0e28', 'center', a); }
  if (tipBox.t > 0) { const a = Math.min(1, tipBox.t / 15, (240 - tipBox.t) / 10 + 0.2); drawDialogue('', '#8fe8ff', tipBox.text, a, 40); }
  if (talk.t > 0 && talk.text) drawBubble(pcx() - cam.x, P.y - cam.y - 6, talk.text, Math.min(1, talk.t / 15));
  if (boss && boss.state === 'intro' && boss.t > 60) { const a = Math.min(1, (boss.t - 60) / 20); drawHiText('呪いのシャンデリア', VW / 2, 150, 18, '#ffe6b0', '#2a0e10', 'center', a); drawHiText('GRAND LUMIERE', VW / 2, 174, 9, '#ffb060', '#2a0e10', 'center', a); }
  if (boss && boss.state !== 'sleep' && boss.state !== 'done' && boss.state !== 'intro') drawHiText('呪いのシャンデリア', VW / 2, VH - 27, 7, '#ffe6b0', '#140a20', 'center');
  if (P.dead && P.deadT > 40) drawHiText('やられちゃった…', VW / 2, VH / 2 - 10, 16, '#ffd0e0', '#200818', 'center', Math.min(1, (P.deadT - 40) / 20));
}
function renderMap() {
  renderPlayBase();
  g.fillStyle = 'rgba(6,4,16,0.9)'; g.fillRect(0, 0, VW, VH);
  const cw = 36, chh = 26, ox = Math.round((VW - 9 * cw) / 2), oy = 88;
  rectLine(ox - 6, oy - 6, 9 * cw + 12, 3 * chh + 12, '#4e4876');
  drawMapGrid(ox, oy, cw, chh, false);
  drawTextShadow('MAP', VW / 2, 18, 'c', 2, 'c');
  drawText('MAP ' + mapPercent() + '%', ox, oy + 3 * chh + 14, 'w', 1);
  drawText('COIN ' + progress.coins, ox + 90, oy + 3 * chh + 14, 'y', 1);
  const tsec = Math.floor(progress.time / 60); drawText('TIME ' + Math.floor(tsec / 60) + ':' + String(tsec % 60).padStart(2, '0'), ox + 170, oy + 3 * chh + 14, 'b', 1);
  drawText('TAP / MAP: BACK', VW / 2, VH - 16, 'b', 1, 'c');
  blit();
  drawHiText(AREA_JP, VW / 2, 36, 11, '#fff4e0', '#1a0e28');
  drawHiText('現在地：' + room.def.jp, VW / 2, 56, 8.5, '#bfe0ff', '#1a0e28');
  drawHiText('S＝セーブ　B＝ボス　黄色＝とびら', VW / 2, oy + 3 * chh + 30, 7.5, '#a8a0d8', null);
  if (!progress.hasKey) drawHiText('舞踏会場の鍵：まだ見つけていない', VW / 2, oy + 3 * chh + 48, 7.5, '#a8a0d8', null);
  else drawHiText('舞踏会場の鍵：持っている', VW / 2, oy + 3 * chh + 48, 7.5, '#ffe080', null);
}
function renderPlayBase() { g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH); g.drawImage(room.canvas, clamp(Math.round(cam.x), 0, room.W - VW), clamp(Math.round(cam.y), 0, room.H - VH), VW, VH, 0, 0, VW, VH); }
const TITLE_MENU = [{ x: 108, y: 246, w: 76, h: 18 }, { x: 200, y: 246, w: 76, h: 18 }];
function renderTitle() {
  g.drawImage(IMG.title_bg, 0, 0);
  // hero x2 on the hill
  const f = heroFrame(((stateT / 120 | 0) & 1) * 8 + ((stateT % 240) > 228 ? 1 : 0)), sc = 2;
  const ck = 'title_hero' + f.sx; let c = FLIP_CACHE.get(ck); if (!c) { c = mkCanvas(f.w, f.h); c.getContext('2d').drawImage(IMG.kanata, f.sx, 0, f.w, f.h, 0, 0, f.w, f.h); FLIP_CACHE.set(ck, c); }
  const bob = Math.round(Math.sin(stateT * 0.04) * 2);
  g.drawImage(c, 0, 0, f.w, f.h, 300 - f.ax * sc, 236 - f.ay * sc + bob, f.w * sc, f.h * sc);
  for (let i = 0; i < 3; i++) { const a = stateT * 0.03 + i * 2.1; g.globalAlpha = 0.8; g.drawImage(IMG.wisp, Math.round(300 + Math.cos(a) * 52 - 7), Math.round(160 + Math.sin(a) * 14 + bob)); g.globalAlpha = 1; }
  // logo
  drawTextShadow('ROCKSIDE', 26, 30, 'c', 2);
  drawTextShadow('GAIDEN', 26, 46, 'p', 1);
  const hasSave = assetsReady() && !!loadSave();
  if (hasSave) { TITLE_MENU.forEach((m, i) => { const on = i === titleSel; g.fillStyle = on ? 'rgba(90,76,192,0.85)' : 'rgba(20,16,40,0.8)'; g.fillRect(m.x, m.y, m.w, m.h); rectLine(m.x, m.y, m.w, m.h, on ? '#e0d8ff' : '#5a5488'); }); }
  else drawTextShadow('TAP / PRESS ENTER', VW / 2 - 50, 254, ((stateT >> 5) & 1) ? 'w' : 'b', 1, 'c');
  drawText('v' + GAME_VERSION + '  PROTOTYPE', 6, VH - 9, 'd', 1);
  blit();
  drawHiText('清掃員カナタ', 104, 62, 30, '#f4f0ff', '#2a1648');
  drawHiText('〜幽霊屋敷のおそうじ〜', 104, 102, 10, '#bfe0ff', '#1a0e28');
  drawHiText('ROCKSIDE 外伝', 104, 120, 8, '#ff9ad8', '#1a0e28');
  if (hasSave) { drawHiText('つづきから', TITLE_MENU[0].x + TITLE_MENU[0].w / 2, TITLE_MENU[0].y + 4, 8, '#ffffff'); drawHiText('はじめから', TITLE_MENU[1].x + TITLE_MENU[1].w / 2, TITLE_MENU[1].y + 4, 8, '#ffffff'); }
}
function renderClear() {
  renderPlayBase();
  const k = Math.min(1, clearT / 60);
  g.fillStyle = 'rgba(6,4,16,' + 0.82 * k + ')'; g.fillRect(0, 0, VW, VH);
  if (clearT > 40) {
    const tsec = Math.floor(progress.time / 60);
    const rows = [['TIME', Math.floor(tsec / 60) + ':' + String(tsec % 60).padStart(2, '0')], ['COINS', String(progress.coins)], ['MAP', mapPercent() + '%'], ['GHOSTS', String(stats.captures)], ['SECRET', progress.perm.has('dining:secret') ? 'FOUND' : '---']];
    rows.forEach((r, i) => { if (clearT > 60 + i * 12) { drawText(r[0], 120, 122 + i * 14, 'b', 1); drawText(r[1], 264, 122 + i * 14, 'w', 1, 'r'); } });
    if (clearT > 240 && (clearT >> 5) & 1) drawTextShadow('TAP TO TITLE', VW / 2, 252, 'w', 1, 'c');
  }
  blit();
  if (clearT > 20) drawHiText('おそうじ完了！', VW / 2, 34, 20, '#fff4c0', '#2a1648', 'center', Math.min(1, (clearT - 20) / 20));
  if (clearT > 40) drawHiText('試作版クリア ― THANK YOU FOR PLAYING!', VW / 2, 66, 8.5, '#bfe0ff', '#1a0e28', 'center', Math.min(1, (clearT - 40) / 20));
  if (clearT > 100) drawDialogue('清掃員カナタ', '#8fe8ff', '……ふぁ。シャンデリア、ぴかぴか。……今日はもう、おしまい。おやすみ……', Math.min(1, (clearT - 100) / 20), 196);
}
function renderLoading() { g.fillStyle = '#0b0914'; g.fillRect(0, 0, VW, VH); drawText('LOADING...', VW / 2, VH / 2, 'b', 1, 'c'); blit(); }
let blitMid = null, blitK = 0;
function blit() {
  const sw = screen.width, sh = screen.height;
  const k = Math.max(1, Math.ceil(Math.min(sw / VW, sh / VH) - 1e-6));
  if (VW * k === sw && VH * k === sh) { sctx.imageSmoothingEnabled = false; sctx.drawImage(buf, 0, 0, sw, sh); return; }
  if (!blitMid || blitK !== k) { blitMid = mkCanvas(VW * k, VH * k); blitK = k; }
  const mg = blitMid.getContext('2d'); mg.imageSmoothingEnabled = false; mg.drawImage(buf, 0, 0, VW * k, VH * k);
  sctx.imageSmoothingEnabled = true; sctx.imageSmoothingQuality = 'high'; sctx.drawImage(blitMid, 0, 0, sw, sh); sctx.imageSmoothingEnabled = false;
}
function render() {
  stats.frames++;
  if (state === 'loading') renderLoading();
  else if (state === 'title') renderTitle();
  else if (state === 'play') renderPlay();
  else if (state === 'map') renderMap();
  else if (state === 'clear') renderClear();
}
function screenTap(gx, gy) {
  if (state === 'title' && assetsReady() && loadSave()) {
    for (let i = 0; i < TITLE_MENU.length; i++) { const m = TITLE_MENU[i]; if (gx >= m.x && gx < m.x + m.w && gy >= m.y && gy < m.y + m.h) { titleSel = i; inp.startPressed = true; return true; } }
  }
  if (state === 'map') { inp.mapPressed = true; return true; }
  return false;
}

// ---------------------------------------------------------------------
//  main loop: fixed 60Hz simulation
// ---------------------------------------------------------------------
const STEP = 1000 / 60; let acc = 0, last = performance.now();
function loop(now) {
  acc += Math.min(250, now - last); last = now;
  let n = 0; while (acc >= STEP && n < 5) { update(); acc -= STEP; n++; }
  if (n === 5) acc = 0;
  render(); requestAnimationFrame(loop);
}
doLayout();
requestAnimationFrame(loop);
window.GAIDEN = { CONFIG, P, cam, layout, stats, progress, ents, items, ebullets, playerShots, parts, ROOM_DEFS, CELL_ROOM,
  get state() { return state; }, get stateT() { return stateT; }, get room() { return room; }, get boss() { return boss; }, get frame() { return frame; }, get tipBox() { return tipBox; },
  get music() { return Music; }, nozzle, inCone, loadRoom, placePlayer, startNewGame, continueGame, enterGame, eraseSave, saveGame, loadSave, mapPercent, setState, snapCamera, buildRoomGrid, roomOpenings,
  spawnItem, makeGhost, startTug, _test: { keys, inp, touch } };
</script>
</body>
</html>
