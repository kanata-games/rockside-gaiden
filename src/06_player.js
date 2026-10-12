
// =====================================================================
//  PLAYER: 清掃員カナタ  -  walk / jump / half-ghost hover, vacuum (catch + tug-of-war), SPIT
// =====================================================================
const P = { x: 0, y: 0, w: CONFIG.playerW, h: CONFIG.playerH, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0, hover: CONFIG.hoverFrames, hovering: false,
  hp: CONFIG.maxHP, inv: 0, grace: 0, gabu: 0, chomp: 0, gabuShot: 0, knock: 0, dead: false, deadT: 0, vacOn: false, tug: null, tank: [], spitCD: 0, spitPose: 0, animT: 0, airT: 0, spawnX: 0, spawnY: 0, god: false,
  dj: false, djT: 0, spitHold: 0, onFloat: null };
const stats = { floats: 0, djumps: 0, foeKills: 0, foeHits: 0, levers: 0, abilities: [], updates: 0, frames: 0, captures: 0, spits: 0, puffs: 0, swallowed: 0, rooms: 0, hurts: 0, deaths: 0, saves: 0, secrets: 0, tugs: 0, maxTugFrames: 0, tips: [], bossHits: 0, eaten: 0, gabuShots: 0 };
const playerShots = [], ebullets = [], items = [], parts = [], floats = [];
const pcx = () => P.x + P.w / 2, pcy = () => P.y + P.h / 2;
// damage hurtbox: a bit smaller than the 16x50 body (the sprite is drawn even bigger), so near-misses feel fair
const hurtBox = () => ({ x0: P.x + CONFIG.hurtInsetX, x1: P.x + P.w - CONFIG.hurtInsetX, y0: P.y + CONFIG.hurtInsetTop, y1: P.y + P.h - 1 });
// v0.3.2 avoidability audit (tools/avoid.js): when window.__hz is set, every boss/bullet damage test logs its rectangle per frame
function hzLog(x0, y0, x1, y1, groundOnly, src) { const H = window.__hz; if (!H || !H.length) return; if (src && src.__hzB === undefined) src.__hzB = H.length - 1;
  H[H.length - 1].push([Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), groundOnly ? 1 : 0, src ? src.__hzB : -1]); }
function hitsKanata(x0, y0, x1, y1) { const h = hurtBox(); return h.x0 < x1 && h.x1 > x0 && h.y0 < y1 && h.y1 > y0; }
function nozzle() { const V = CONFIG.vac; return { x: pcx() + P.face * V.nozzleX, y: P.y + P.h - V.nozzleY }; }
const vacRange = () => CONFIG.vac.range * (hasAbil('turbo') ? CONFIG.turboRange : 1);
// vacuum cone test (point)
function inCone(px, py, pad) {
  const V = CONFIG.vac, n = nozzle(), dx = (px - n.x) * P.face, p = pad || 0, R = vacRange();
  if (dx < -8 - p || dx > R + p) return false;
  const half = V.spreadNear + (V.spreadFar - V.spreadNear) * clamp(dx, 0, R) / R + p;
  return Math.abs(py - n.y) < half;
}
function rectInCone(x, y, w, h) { // any of 5 sample points
  return inCone(x + w / 2, y + h / 2) || inCone(x + 2, y + 2) || inCone(x + w - 2, y + 2) || inCone(x + 2, y + h - 2) || inCone(x + w - 2, y + h - 2);
}
function placePlayer(x, feetY, face) {
  P.x = x - P.w / 2; P.y = feetY - P.h; P.vx = 0; P.vy = 0; P.face = face || 1; P.onGround = false; P.knock = 0; P.tug = null;
  if (room) { let n = 0; while (boxHitsSolid(P.x, P.y, P.w, P.h) && n++ < 64) P.y -= 1; } // never start embedded in the floor
  P.spawnX = P.x; P.spawnY = P.y;
}
function hurtPlayer(dmg, fromX, why) {
  if (P.inv > 0 || P.grace > 0 || P.dead || state !== 'play') return false;
  if (P.god) { P.inv = 30; return false; }
  P.hp -= dmg; P.inv = CONFIG.invFrames; P.knock = CONFIG.knockFrames; stats.hurts++; stats.lastHurt = why || '';
  const d = Math.sign(pcx() - fromX) || -P.face; P.vx = d * CONFIG.knockVx; P.vy = -CONFIG.knockVy;
  endTug(false); sfx('hurt'); cam.shake = 5; hitStop = 4;
  for (let i = 0; i < 8; i++) parts.push({ x: pcx(), y: pcy(), vx: rnd(-2, 2), vy: rnd(-2.5, 0.5), life: 24, col: '#ff8aa8', size: 2 });
  if (P.hp <= 0) { P.hp = 0; P.dead = true; P.deadT = 0; stats.deaths++; sfx('death'); Snd.vac(false); }
  return true;
}
function heal(n) { P.hp = Math.min(progress.maxHP, P.hp + n); }

// ---------------------------------------------------------------------
//  tug-of-war (Luigi's Mansion style)
// ---------------------------------------------------------------------
function startTug(gh) {
  P.tug = gh; gh.state = 'caught'; gh.t = 0; gh.yankT = 70 + Math.random() * 50; gh.yankWarn = 0; gh.yanking = 0;
  const n = nozzle(); gh.rope0 = clamp(Math.hypot(gh.x - n.x, gh.y - n.y), 40, 92); gh.ropeLen = gh.rope0; gh.tugFrames = 0;
  sfx('catch'); stats.tugs++; hitStop = 3;
  tip('tug', 'つかまえた！ ゴーストと反対の方向を押して、引っぱろう（HPが早く減る）');
}
function endTug(silent) {
  const gh = P.tug; if (!gh) return; P.tug = null;
  if (gh.state === 'caught') { gh.state = 'flee'; gh.t = 0; gh.catchT = 0; gh.yanking = 0; if (!silent) sfx('escape'); }
}
function updateTug() {
  const V = CONFIG.vac, gh = P.tug;
  if (!held('vac') || P.knock > 0) { endTug(false); return; }
  gh.tugFrames++; stats.maxTugFrames = Math.max(stats.maxTugFrames, gh.tugFrames);
  const n0 = nozzle(), dir = Math.sign(gh.x - pcx()) || P.face; P.face = dir;
  const away = held(dir > 0 ? 'left' : 'right'), toward = held(dir > 0 ? 'right' : 'left');
  gh.pullingAway = away;
  // yank cycle
  if (gh.yanking > 0) gh.yanking--;
  else if (gh.yankWarn > 0) { if (--gh.yankWarn === 0) { gh.yanking = V.tugYankFrames; sfx('yank'); cam.shake = 3; } }
  else if (--gh.yankT <= 0) { gh.yankWarn = V.tugYankWarn; gh.yankT = 80 + Math.random() * 60; sfx('warn'); }
  // HP drain
  let drain = V.tugBaseDrain + (away ? V.tugPullDrain : 0);
  if (gh.yanking > 0 && away) drain *= V.tugYankBonus;
  if (gh.boss) drain = (CONFIG.boss.coreBaseDrain + (away ? CONFIG.boss.corePullDrain : 0)) * (gh.yanking > 0 && away ? V.tugYankBonus : 1);
  gh.hp -= drain; if (gh.onDrain) gh.onDrain(drain);
  // rope shortens as the ghost weakens
  gh.ropeLen = gh.rope0 + (24 - gh.rope0) * (1 - Math.max(0, gh.hp) / gh.maxHp);
  // ghost struggles away (+ wiggle); player is dragged unless pulling away
  const str = gh.yanking > 0 ? 2.2 : 0.9;
  gh.x += dir * str * 0.5 + Math.sin(frame * 0.21 + gh.seed) * 0.6;
  gh.y += Math.sin(frame * 0.13 + gh.seed) * 0.7 + (n0.y - 6 - gh.y) * 0.03;
  let pvx;
  if (away) pvx = -dir * (gh.yanking > 0 ? 0 : V.tugPullSpeed);
  else if (toward) pvx = dir * 0.3;
  else pvx = dir * (gh.yanking > 0 ? V.tugYankDrag : V.tugDrag * 0.5);
  if (gh.yanking > 0 && !away) pvx = dir * V.tugYankDrag;
  P.vx = pvx;
  // constrain ghost to the rope (measured from the nozzle after Kanata moves)
  const n = { x: pcx() + P.vx + dir * V.nozzleX, y: n0.y }, dx = gh.x - n.x, dy = gh.y - n.y, dist = Math.hypot(dx, dy);
  if (dist > gh.ropeLen) { const k = gh.ropeLen / dist; gh.x = n.x + dx * k; gh.y = n.y + dy * k; }
  if (gh.boss && gh.clampTug) gh.clampTug();
  gh.x = clamp(gh.x, 10, room.W - 10); gh.y = clamp(gh.y, 34, room.H - 20);
  if (dist > V.tugBreakDist) { endTug(false); return; }
  if (gh.hp <= 0) { gh.hp = 0; P.tug = null; gh.state = 'swallow'; gh.t = 0; gh.sx = gh.x; gh.sy = gh.y; stats.captures++; sfx('swallow'); hitStop = 6; cam.shake = 4; if (gh.onCaptured) gh.onCaptured(); }
  // sparkles along the beam
  if (frame % 3 === 0) parts.push({ x: gh.x + rnd(-6, 6), y: gh.y + rnd(-6, 6), vx: -dir * rnd(0.5, 1.5), vy: rnd(-0.5, 0.5), life: 14, col: '#bff4ff', size: 1 });
}

// ---------------------------------------------------------------------
//  per-frame player update
// ---------------------------------------------------------------------
function updatePlayer() {
  const C = CONFIG;
  if (P.dead) { P.deadT++; P.vx *= 0.9; P.vy = Math.min(P.vy + C.gravity, C.maxFall); moveBody(P, true); return; }
  if (P.inv > 0) P.inv--; if (P.grace > 0) P.grace--;
  if (P.spitCD > 0) P.spitCD--;
  if (P.chomp > 0) P.chomp--; if (P.gabuShot > 0) P.gabuShot--;
  if (P.spitPose > 0) P.spitPose--;
  P.animT++;
  if (P.dropT > 0) P.dropT--;
  unstickPlayer();
  const dir = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
  if (inp.jumpPressed) P.jumpBuf = C.jumpBuffer; else if (P.jumpBuf > 0) P.jumpBuf--;
  const vacHeld = held('vac') && P.knock <= 0;
  P.vacOn = vacHeld;
  P.hovering = false;
  if (P.knock > 0) { P.knock--; }
  else if (P.tug) { updateTug(); }
  else {
    const sp = (vacHeld ? C.vacWalkSpeed : C.walkSpeed) * timeSlowAt(pcx(), P.y + P.h), acc = P.onGround ? C.accel : C.airAccel;
    if (dir) { P.face = dir; P.vx += clamp(dir * sp - P.vx, -acc, acc); }
    else { P.vx += clamp(-P.vx, -C.decel, C.decel); }
    if (P.onGround && !P.onFloat && (inp.dropPressed || (held('down') && P.jumpBuf > 0)) && onPlatOnly()) { P.dropT = 12; P.jumpBuf = 0; P.onGround = false; P.coyote = 0; P.y += 2; P.vy = 1; }   // v0.4.3 drop through
    else if (P.jumpBuf > 0 && (P.onGround || P.coyote > 0)) { P.vy = -C.jumpVel; P.jumpBuf = 0; P.coyote = 0; P.onGround = false; sfx('jump'); }
    else if (inp.jumpPressed && !P.onGround && P.coyote <= 0 && hasAbil('djump') && !P.dj) { // ゴーストステップ: second jump in the air
      P.vy = -C.djumpVel; P.dj = true; P.djT = 18; P.jumpBuf = 0; stats.djumps++; sfx('djump');
      for (let i = 0; i < 10; i++) parts.push({ x: pcx() + rnd(-6, 6), y: P.y + P.h, vx: rnd(-1.5, 1.5), vy: rnd(0.5, 1.8), life: 20, col: i & 1 ? '#c8a0ff' : '#ffffff', size: 2, glow: 1 });
    }
  }
  if (P.djT > 0) P.djT--;
  if (!held('jump') && P.vy < -C.jumpCutVel && P.knock <= 0) P.vy = -C.jumpCutVel;
  P.vy += C.gravity;
  if (!P.onGround && P.vy > 0 && held('jump') && P.hover > 0 && P.knock <= 0 && !P.tug) {
    if (P.vy > C.hoverFall) P.vy = C.hoverFall; P.hover--; P.hovering = true;
    if (!P.wasHover) sfx('hover');
    if (frame % 4 === 0) parts.push({ x: pcx() + rnd(-8, 8), y: P.y + P.h - 2, vx: rnd(-0.3, 0.3), vy: rnd(0.3, 0.9), life: 22, col: '#7ad0ff', size: 2, glow: 1 });
  }
  P.wasHover = P.hovering;
  if (P.vy > C.maxFall) P.vy = C.maxFall;
  const vyBefore = P.vy, wasGround = P.onGround;
  moveBody(P, true);
  // v0.4.3 universal escape: pressing inputs in mid-air without moving for 3s = wedged -> back to the room entry
  // (holding JUMP, or ←→ in mid-air, while staying inside an 8px box for 3s; walking into a wall on the ground doesn't count)
  const pushing = held('jump') || (dir && !P.onGround);
  if (pushing && !P.tug && !(P.knock > 0) && !P.dead) { if (!(P.stuckT > 0) || Math.abs(P.x - P.ax) > 8 || Math.abs(P.y - P.ay) > 8) { P.ax = P.x; P.ay = P.y; P.stuckT = 1; } else if (++P.stuckT > 180) returnToEntry('stuck'); } else P.stuckT = 0;
  if (P.onGround) { if (!wasGround && vyBefore > 3) sfx('land'); P.hover = C.hoverFrames; P.coyote = C.coyote; P.airT = 0; P.dj = false; }
  else { if (P.coyote > 0) P.coyote--; P.airT++; }
  // vacuum
  if (vacHeld && !P.tug) updateVacuum();
  Snd.vac(vacHeld, !!P.tug);
  // SPIT
  updateSpitButton();
  // room exits
  if (P.x + P.w / 2 < 0) { if (P.knock > 0 || !exitRoom('L')) { P.x = -P.w / 2; if (P.knock > 0) P.vx = Math.max(0, P.vx); } }
  else if (P.x + P.w / 2 > room.W) { if (P.knock > 0 || !exitRoom('R')) { P.x = room.W - P.w / 2; if (P.knock > 0) P.vx = Math.min(0, P.vx); } }
  else if (P.y < -10 && P.vy < 0) { if (!exitRoom('T')) { P.y = -10; P.vy = 0; } }
  else if (P.y + P.h / 2 > room.H) { if (!exitRoom('B')) { P.y = P.spawnY; P.x = P.spawnX; P.vy = 0; hurtPlayer(2, pcx(), 'pit'); } }
}

// v0.4.3: standing only on one-way ledge tiles (nothing solid under the feet)
function onPlatOnly() { const r = Math.floor((P.y + P.h + 1) / TS), c0 = Math.floor(P.x / TS), c1 = Math.floor((P.x + P.w - 0.001) / TS); let plat = false;
  for (let c = c0; c <= c1; c++) { const t = tileAt(c, r); if (isSolidT(t)) return false; if (t === T_PLAT) plat = true; } return plat; }
// v0.4.3: if Kanata overlaps a solid tile, nudge her to the nearest free spot (up to 3 tiles); otherwise back to the entry
function unstickPlayer() {
  if (P.dead || !boxHitsSolid(P.x, P.y, P.w, P.h)) { P.inSolidT = 0; return; }
  for (let d = 1; d <= 48; d++) for (const [dx, dy] of [[0, d], [0, -d], [-d, 0], [d, 0], [-d, d], [d, d], [-d, -d], [d, -d]])
    if (!boxHitsSolid(P.x + dx, P.y + dy, P.w, P.h)) { P.x += dx; P.y += dy; stats.unsticks = (stats.unsticks || 0) + 1; return; }
  returnToEntry('solid');
}
function returnToEntry(why) {
  P.x = P.spawnX; P.y = P.spawnY; P.vx = 0; P.vy = 0; P.knock = 0; P.tug = null; P.stuckT = 0; P.dropT = 0;
  let n = 0; while (boxHitsSolid(P.x, P.y, P.w, P.h) && n++ < 64) P.y -= 1;
  P.grace = Math.max(P.grace, CONFIG.entryGrace); fadeT = 14; stats.escapes = (stats.escapes || 0) + 1; stats.lastEscape = why || 'menu';
}

// suck items / ghosts / objects in the cone
function inMouth(e) { // critters between Kanata and the nozzle are in the mimic's mouth
  const n = nozzle(), f = P.face, front = f > 0 ? e.x > pcx() - 4 && e.x < n.x + 8 : e.x < pcx() + 4 && e.x > n.x - 8;
  return front && e.y > P.y && e.y - e.h < P.y + P.h; }
function updateVacuum() {
  const V = CONFIG.vac, n = nozzle();
  // wind streaks
  for (let k = 0; k < 2; k++) {
    const d = rnd(30, V.range), half = V.spreadNear + (V.spreadFar - V.spreadNear) * d / V.range;
    parts.push({ x: n.x + P.face * d, y: n.y + rnd(-half, half), tx: 1, life: 18, col: k ? '#d8f6ff' : '#7ac8ff', size: 1, streak: 1, face: P.face });
  }
  // loose items
  for (const it of items) {
    if (it.dead || it.fixed) continue;
    if (!inCone(it.x + it.w / 2, it.y + it.h / 2, 10)) continue; // generous: floor items right under the nozzle count
    const dx = n.x - (it.x + it.w / 2), dy = n.y - (it.y + it.h / 2), d = Math.hypot(dx, dy) || 1;
    if (isAmmo(it.kind) && P.tank.length >= V.tankMax) { if (frame % 20 === 0) tip('full', 'タンクがいっぱい。SPIT で吐き出そう'); continue; }
    if (CONFIG.ammo[it.kind] && CONFIG.ammo[it.kind].heavy && !hasAbil('turbo')) { it.wob = 6; if (frame % 12 === 0) sfx('tink'); tip('heavy', '重すぎて吸い込めない… もっと強い吸引力があれば'); continue; }
    const a = V.itemPull * (1.4 - d / vacRange());
    it.vx += dx / d * a; it.vy += dy / d * a - CONFIG.gravity * 0.9; it.sucked = 8;
    it.vx = clamp(it.vx, -5, 5); it.vy = clamp(it.vy, -5, 5);
    if (d < V.swallowDist + 4) collectItem(it, true);
  }
  // enemy projectiles that can be swallowed (plates, candles)
  for (const b of ebullets) {
    if (b.dead || !b.suckable) continue;
    { // the stretch between Kanata and the nozzle counts as the mouth (stuff that slips past the cone is still swallowed)
      const bx = b.x + b.w / 2, by = b.y + b.h / 2, front = P.face > 0 ? bx > pcx() - 2 && bx < n.x + 6 : bx < pcx() + 2 && bx > n.x - 6;
      if (front && by > P.y - 6 && by < P.y + P.h && P.tank.length < V.tankMax) { b.dead = true; P.tank.push(b.ammo || (b.kind === 'fire' ? 'fireball' : b.kind)); sfx('stash'); tip('spit', '吸い込んだ物は SPIT で吐き出せる！'); continue; }
    }
    if (!inCone(b.x + b.w / 2, b.y + b.h / 2, 6)) continue;
    const dx = n.x - (b.x + b.w / 2), dy = n.y - (b.y + b.h / 2), d = Math.hypot(dx, dy) || 1;
    if (P.tank.length >= V.tankMax) continue;
    b.vx += dx / d * 0.8; b.vy += dy / d * 0.8; b.vx *= 0.9; b.vy *= 0.9; b.captured = true;
    if (d < V.swallowDist + 6) { b.dead = true; P.tank.push(b.ammo || (b.kind === 'fire' ? 'fireball' : b.kind)); sfx('stash'); tip('spit', '吸い込んだ物は SPIT で吐き出せる！'); }
  }
  // ghosts / interactables
  for (const e of ents) {
    if (e.dead) continue;
    if (e.ghost && e.state !== 'swallow' && e.state !== 'flee' && e.catchable !== false) {
      if (rectInCone(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
        e.catchT += e.stunT > 0 ? Math.ceil(V.catchFrames / V.catchFramesStunned) : 1; e.inCone = 3;
        if (e.catchT >= V.catchFrames && !P.tug) { startTug(e); return; }
      }
    } else if (e.onSuck && (rectInCone(e.x - e.w / 2, e.y - e.h, e.w, e.h) || (e.foe && EDIBLE[e.type] && inMouth(e)))) e.onSuck();
  }
  if (boss && boss.onSuck) boss.onSuck();
}
const isAmmo = k => !!CONFIG.ammo[k];
function collectItem(it, viaVac) {
  if (it.dead) return;
  const k = it.kind;
  if (isAmmo(k)) {
    if (P.tank.length >= CONFIG.vac.tankMax) return;
    P.tank.push(k); sfx('stash'); tip('spit', '吸い込んだ物は SPIT で吐き出せる！ 物によって威力や効果がちがう');
  } else if (k === 'coin') { progress.coins++; sfx('coin'); }
  else if (k === 'heart') { heal(2); sfx('item'); }
  else if (k === 'heartbig') { progress.maxHP += 2; P.hp = progress.maxHP; sfx('secret'); tip('hc', '最大HPがアップした！', true); }
  else if (k === 'key') { progress.hasKey = true; sfx('secret'); tip('key', '「舞踏会場の鍵」を手に入れた！ 地下の控え室の扉が開けられる', true); }
  it.dead = true; if (it.perm) progress.perm.add(it.perm);
  for (let i = 0; i < 5; i++) parts.push({ x: it.x + it.w / 2, y: it.y + it.h / 2, vx: rnd(-1.2, 1.2), vy: rnd(-1.6, 0.2), life: 16, col: k === 'coin' ? '#ffe080' : '#bff4ff', size: 1 });
}

// ---------------------------------------------------------------------
//  SPIT: fire the oldest stored object (damage / effect per object, see CONFIG.ammo), or an air puff when empty.
//  With ふわり化: tap = fire on release, hold = the oldest object becomes a floating platform.
// ---------------------------------------------------------------------
function updateSpitButton() {
  const busy = P.tug || P.knock > 0 || P.dead;
  if (!hasAbil('float')) { if (inp.spitPressed && P.spitCD <= 0 && !busy) doSpit(); P.spitHold = 0; return; }
  if (inp.spitPressed && !held('spit')) { if (P.spitCD <= 0 && !busy) doSpit(); P.spitHold = 0; return; } // tap shorter than a frame
  if (held('spit')) {
    if (inp.spitPressed) P.spitHold = 1; else if (P.spitHold > 0) P.spitHold++;
    if (P.spitHold === CONFIG.float.holdFrames) { if (!busy && makeFloat()) P.spitHold = -1; }
  } else {
    if (P.spitHold > 0 && P.spitCD <= 0 && !busy) doSpit();
    P.spitHold = 0;
  }
}
function canFloat() { return P.tank.length > 0 && P.onGround && !P.onFloat; }
function makeFloat() {
  if (!P.tank.length) { tip('floatEmpty', 'ふわり化するには、まず物を吸い込もう'); return false; }
  if (!P.onGround || P.onFloat) { tip('floatGround', 'ふわり化は地面（床や足場）に立っているときだけ使える'); return false; }
  const F = CONFIG.float, kind = P.tank.shift(), y = P.y + P.h - 26;
  let x = pcx() + P.face * 14 - F.w / 2;
  if (boxHitsSolid(x, y, F.w, F.h)) x = pcx() - F.w / 2;
  if (boxHitsSolid(x, y, F.w, F.h)) x = pcx() - P.face * 10 - F.w / 2;
  while (floats.length >= F.max) expireFloat(floats[0]);
  floats.push({ kind, x, y, w: F.w, h: F.h, life: F.life, t: 0 });
  stats.floats++; P.spitPose = 12; P.spitCD = 10; sfx('float');
  for (let i = 0; i < 12; i++) parts.push({ x: x + rnd(0, F.w), y: y + rnd(0, 8), vx: rnd(-0.6, 0.6), vy: rnd(-1.2, -0.2), life: 26, col: i & 1 ? '#8fe8ff' : '#ffffff', size: 2, glow: 1 });
  tip('floatUse', 'ふわり足場の上に乗ってジャンプ！ 少しすると落ちて元にもどる', true);
  return true;
}
function expireFloat(f) {
  const i = floats.indexOf(f); if (i >= 0) floats.splice(i, 1);
  if (P.onFloat === f) P.onFloat = null;
  spawnItem(f.kind, f.x + f.w / 2, f.y + f.h, { vy: 0 });
  for (let k = 0; k < 6; k++) parts.push({ x: f.x + rnd(0, f.w), y: f.y + 4, vx: rnd(-1, 1), vy: rnd(-1, 0.5), life: 16, col: '#8fe8ff', size: 1, glow: 1 });
}
function updateFloats() { for (const f of floats.slice()) { f.t++; if (--f.life <= 0) expireFloat(f); } }

function doSpit() {
  const S = CONFIG.spit, n = nozzle();
  P.spitPose = 16;
  if (P.tank.length) {
    const kind = P.tank.shift(), A0 = CONFIG.ammo[kind] || CONFIG.ammo.book, sp = A0.heavy ? S.heavySpeed : S.speed, E = CONFIG.eat;
    const pow = P.gabu >= E.max, A = pow ? { ...A0, dmg: A0.dmg * E.shotMul, pierce: true, w: Math.round(A0.w * 1.4), h: Math.round(A0.h * 1.4) } : A0;
    if (pow) { P.gabu = 0; P.chomp = 16; stats.gabuShots = (stats.gabuShots || 0) + 1; sfx('chomp'); }
    const ox = n.x, oy = n.y - 12, tg = spitTarget(ox, oy, A);
    let vx = P.face * sp, vy = -0.6, grav = A.heavy ? 0.1 : 0.07;
    if (tg) { const dx = tg.x - ox, dy = tg.y - oy, d = Math.hypot(dx, dy) || 1; vx = dx / d * sp; vy = dy / d * sp; grav = 0; }
    playerShots.push({ kind, x: ox - A.w / 2, y: oy - A.h / 2, w: A.w, h: A.h, vx, vy, grav, dmg: A.dmg, life: 120, spin: 0, aimed: !!tg,
      burn: !!A.burn, splash: A.splash || 0, pierce: !!A.pierce, power: pow, bounce: A.bounce || 0, shatter: !!A.shatter, heavy: !!A.heavy, hit: new Set() });
    P.spitCD = S.cooldown; stats.spits++; sfx(A.heavy ? 'heavyspit' : 'spit'); P.vx -= P.face * (A.heavy ? 1.2 : 0.6);
  } else if (P.gabu >= CONFIG.eat.max) { // GABU bite wave: a ghostly set of jaws snaps forward
    const E = CONFIG.eat; P.gabu = 0; P.chomp = 16; P.gabuShot = 22; P.spitCD = S.puffCooldown; stats.gabuShots = (stats.gabuShots || 0) + 1; sfx('chomp'); sfx('heavyspit'); cam.shake = 4;
    for (let i = 0; i < 16; i++) parts.push({ x: n.x + P.face * rnd(0, E.biteRange), y: n.y + rnd(-14, 14), vx: P.face * rnd(1, 3), vy: rnd(-0.6, 0.6), life: 18, col: i & 1 ? '#ff8aa8' : '#ffffff', size: 2, glow: 1 });
    for (const e of ents) { if (e.dead) continue; const dx = (e.x - n.x) * P.face, ey = e.ghost ? e.y : e.y - (e.h || 0) / 2;
      if (dx < -10 || dx > E.biteRange || Math.abs(ey - n.y) > 40) continue;
      if (e.ghost) { if (e.state !== 'swallow' && e.state !== 'caught') { e.stunT = S.puffStun * 2; e.x += P.face * 14; if (e.state === 'dash' || e.state === 'warn') e.state = 'float'; } }
      else if (e.hitBy && (e.foe || e.type === 'armor')) e.hitBy({ dmg: E.biteDmg, vx: P.face * 3, heavy: true }); }
    if (boss && boss.vulnerable() && boss.D.hitBox) { const h = boss.D.hitBox(boss); if ((P.face > 0 ? h.x0 - n.x : n.x - h.x1) < E.biteRange && h.y0 < n.y + 30 && h.y1 > n.y - 30) boss.hitBy({ dmg: E.biteDmg, vx: P.face }); }
    tip('gabuBite', 'かみつき波！ タンクが空でも GABU ゲージ満タンなら強力な一撃', true);
  } else {
    P.spitCD = S.puffCooldown; stats.puffs++; sfx('puff');
    for (let i = 0; i < 10; i++) parts.push({ x: n.x, y: n.y - 4, vx: P.face * rnd(1.5, 3.5), vy: rnd(-0.8, 0.8), life: 18, col: '#e8f8ff', size: 2, glow: 1 });
    for (const e of ents) {
      if (!e.ghost || e.dead || e.state === 'swallow' || e.state === 'caught') continue;
      const dx = (e.x - n.x) * P.face; if (dx > -8 && dx < S.puffRange && Math.abs(e.y - n.y) < 30) { e.stunT = S.puffStun; e.x += P.face * 10; if (e.state === 'dash' || e.state === 'warn') e.state = 'float'; }
    }
    tip('puff', 'タンクが空のときの SPIT は空気砲。ゴーストを少しのあいだ目を回させる');
  }
}
// SPIT auto-aim: nearest target in front within ~70 degrees of horizontal (mobile friendly)
function spitTarget(ox, oy, A) {
  const cand = [];
  for (const e of ents) {
    if (e.dead || !e.hitBy) continue;
    if (e.ghost && (e.state === 'swallow' || e.state === 'caught')) continue;
    if (e.type === 'vase' && e.empty) continue;
    if (e.type === 'vines' && !(A && A.burn)) continue;
    if (e.foe && e.hp <= 0) continue;
    cand.push({ x: e.x, y: e.ghost ? e.y : e.y - e.h / 2 });
  }
  if (boss && boss.aimAt) { const a = boss.aimAt(); if (a) cand.push(a); }
  let best = null, bd = 260;
  for (const c of cand) {
    const dx = (c.x - ox) * P.face, dy = c.y - oy; if (dx < 6) continue;
    if (Math.abs(Math.atan2(dy, dx)) > 1.25) continue;
    const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = c; }
  }
  return best;
}
const shotHitsEnt = (s, e) => Math.abs(e.x - (s.x + s.w / 2)) < e.w / 2 + s.w / 2 && Math.abs((e.ghost ? e.y : e.y - e.h / 2) - (s.y + s.h / 2)) < e.h / 2 + s.h / 2;
function updateShots() {
  for (const s of playerShots) {
    if (s.dead) continue;
    s.x += s.vx; s.y += s.vy; s.vy += s.grav; s.spin++; s.life--;
    if ((s.kind === 'fireball' || s.burn) && frame % 2 === 0) parts.push({ x: s.x + s.w / 2, y: s.y + s.h / 2, vx: rnd(-0.4, 0.4), vy: rnd(-0.6, 0), life: 14, col: s.kind === 'seed' ? '#ff8040' : '#ffb040', size: 2, glow: 1 });
    // targets first (vines sit inside solid gate tiles)
    for (const e of ents) {
      if (e.dead || !e.hitBy || s.hit.has(e)) continue;
      if (shotHitsEnt(s, e)) { const r = e.hitBy(s); if (r !== false) { s.hit.add(e); if (!e.ghost && e.foe) stats.foeHits++; if (!s.pierce || e.type === 'vines') { impact(s, e); break; } } }
    }
    if (s.dead) continue;
    if (boss && boss.hitBy && !s.hit.has(boss) && boss.hitTest(s)) { s.hit.add(boss); boss.hitBy(s); stats.bossHits++; if (!s.pierce) { impact(s, boss); continue; } }
    const wall = boxHitsSolid(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
    if (wall && s.bounce > 0) { s.bounce--; s.x -= s.vx; s.vx = -s.vx * 0.85; s.vy = Math.min(s.vy, 0) - 1; sfx('tink'); continue; }
    if (s.life <= 0 || s.x < -20 || s.x > room.W + 20 || s.y > room.H + 20 || wall) impact(s, null);
  }
  for (let i = playerShots.length - 1; i >= 0; i--) if (playerShots[i].dead) playerShots.splice(i, 1);
}
const DURABLE = new Set(['book', 'chair', 'pan', 'pot', 'barrel', 'gear']);
const SHOT_COL = { book: '#9a3040', plate: '#f4f4fc', candle: '#f0e8d8', crystal: '#a8e0ff', fireball: '#ffb040', bottle: '#6ad08a', chair: '#7a4a2a', pan: '#5a5a66',
  gear: '#c9a24a', flowerpot: '#c06a3a', soap: '#d8f4ff', seed: '#8a6a2a', pot: '#4a4a56', barrel: '#6a4424', shard: '#f4f4fc' };
function impact(s, target) {
  if (s.dead) return; s.dead = true;
  const cx = s.x + s.w / 2, cy = s.y + s.h / 2, col = SHOT_COL[s.kind] || '#fff';
  for (let i = 0; i < 7; i++) parts.push({ x: cx, y: cy, vx: rnd(-1.8, 1.8), vy: rnd(-2.2, 0.4), life: 22, col, size: 2, grav: 1 });
  if (s.splash) { // bottle / flowerpot / soap: hits everything around
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; parts.push({ x: cx, y: cy, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2 - 0.6, life: 20, col: s.kind === 'soap' ? '#e8fbff' : s.kind === 'flowerpot' ? '#8a5a2a' : '#7af0a0', size: 2, grav: 1 }); }
    for (const e of ents) if (!e.dead && e.hitBy && e !== target && !e.ghost && e.foe && Math.hypot(e.x - cx, e.y - e.h / 2 - cy) < s.splash + e.w / 2) e.hitBy({ dmg: Math.ceil(s.dmg / 2), splashHit: true, kind: s.kind, vx: s.vx });
    for (const e of ents) if (!e.dead && e.ghost && e.hitBy && e !== target && e.state !== 'caught' && e.state !== 'swallow' && Math.hypot(e.x - cx, e.y - cy) < s.splash + 10) e.hitBy({ dmg: 1, splashHit: true });
    sfx('splash'); cam.shake = Math.max(cam.shake, 2);
  }
  if (s.shatter) { // plate: breaks into shards that keep flying
    for (let k = -1; k <= 1; k++) playerShots.push({ kind: 'shard', x: cx - 3, y: cy - 3, w: 6, h: 6, vx: -Math.sign(s.vx || 1) * rnd(0.6, 1.4) + k * 1.4, vy: -2 + k * 0.6, grav: 0.18, dmg: 1, life: 28, spin: 0, hit: new Set(target ? [target] : []) });
    sfx('tink');
  }
  if (target && target.type === 'boss' && DURABLE.has(s.kind)) { for (let i = 0; i < 6; i++) parts.push({ x: cx, y: cy, vx: rnd(-2, 2), vy: rnd(-2.5, 0), life: 26, col: '#8a6a4a', size: 2, grav: 1 }); } // smashed on a boss: no reuse loop
  else if (DURABLE.has(s.kind) && !s.burnt) spawnItem(s.kind, clamp(cx, 20, room.W - 20), cy + s.h / 2, { vx: -s.vx * 0.15, vy: -2.2, pop: 0 });
  if (s.kind === 'shard') return;
  sfx(s.heavy ? 'thud' : s.kind === 'plate' || s.kind === 'crystal' ? 'tink' : 'hit');
  if (s.heavy) cam.shake = Math.max(cam.shake, 4);
}
// legacy name used by older code paths
function shatter(s) { impact(s, null); }

// ---------------------------------------------------------------------
//  items (coins, hearts, ammo objects, key, heart container)
// ---------------------------------------------------------------------
const ITEM_SIZE = { coin: [10, 10], heart: [11, 10], heartbig: [18, 16], key: [14, 10] };
for (const k in CONFIG.ammo) ITEM_SIZE[k] = [CONFIG.ammo[k].w, CONFIG.ammo[k].h];
function spawnItem(kind, x, y, opt) {
  const [w, h] = ITEM_SIZE[kind] || [10, 10];
  const it = Object.assign({ kind, x: x - w / 2, y: y - h, w, h, vx: 0, vy: 0, t: 0, onGround: false, sucked: 0 }, opt || {});
  items.push(it); return it;
}
function popItems(list, x, y) { for (const k of list) spawnItem(k, x, y, { vx: rnd(-1.6, 1.6), vy: rnd(-3.4, -2), pop: 30 }); }
function updateItems() {
  for (const it of items) {
    if (it.dead) continue;
    it.t++; if (it.pop > 0) it.pop--;
    if (it.fixed) { // floating pickups (key, heart container) bob in place
      it.y = it.baseY + Math.sin(it.t * 0.06) * 2;
    } else {
      if (it.wob > 0) it.wob--;
      if (it.sucked > 0) it.sucked--;
      else { it.vy += CONFIG.gravity * 0.8; it.vx *= it.onGround ? 0.8 : 0.99; }
      if (it.vy > 5) it.vy = 5;
      moveBody(it, true);
    }
    // touch pickup
    if (!isAmmo(it.kind) && !(it.pop > 18) && it.x < P.x + P.w && it.x + it.w > P.x && it.y < P.y + P.h && it.y + it.h > P.y && !P.dead) collectItem(it, false);
    if (it.y > room.H + 40) it.dead = true;
  }
  for (let i = items.length - 1; i >= 0; i--) if (items[i].dead) items.splice(i, 1);
}
