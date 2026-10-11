
// =====================================================================
//  PLAYER: 清掃員カナタ  -  walk / jump / half-ghost hover, vacuum (catch + tug-of-war), SPIT
// =====================================================================
const P = { x: 0, y: 0, w: CONFIG.playerW, h: CONFIG.playerH, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0, hover: CONFIG.hoverFrames, hovering: false,
  hp: CONFIG.maxHP, inv: 0, knock: 0, dead: false, deadT: 0, vacOn: false, tug: null, tank: [], spitCD: 0, spitPose: 0, animT: 0, airT: 0, spawnX: 0, spawnY: 0, god: false };
const stats = { updates: 0, frames: 0, captures: 0, spits: 0, puffs: 0, swallowed: 0, rooms: 0, hurts: 0, deaths: 0, saves: 0, secrets: 0, tugs: 0, maxTugFrames: 0, tips: [], bossHits: 0 };
const playerShots = [], ebullets = [], items = [], parts = [];
const pcx = () => P.x + P.w / 2, pcy = () => P.y + P.h / 2;
function nozzle() { const V = CONFIG.vac; return { x: pcx() + P.face * V.nozzleX, y: P.y + P.h - V.nozzleY }; }
// vacuum cone test (point)
function inCone(px, py, pad) {
  const V = CONFIG.vac, n = nozzle(), dx = (px - n.x) * P.face, p = pad || 0;
  if (dx < -8 - p || dx > V.range + p) return false;
  const half = V.spreadNear + (V.spreadFar - V.spreadNear) * clamp(dx, 0, V.range) / V.range + p;
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
  if (P.inv > 0 || P.dead || state !== 'play') return false;
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
  if (P.inv > 0) P.inv--;
  if (P.spitCD > 0) P.spitCD--;
  if (P.spitPose > 0) P.spitPose--;
  P.animT++;
  const dir = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
  if (inp.jumpPressed) P.jumpBuf = C.jumpBuffer; else if (P.jumpBuf > 0) P.jumpBuf--;
  const vacHeld = held('vac') && P.knock <= 0;
  P.vacOn = vacHeld;
  P.hovering = false;
  if (P.knock > 0) { P.knock--; }
  else if (P.tug) { updateTug(); }
  else {
    const sp = vacHeld ? C.vacWalkSpeed : C.walkSpeed, acc = P.onGround ? C.accel : C.airAccel;
    if (dir) { P.face = dir; P.vx += clamp(dir * sp - P.vx, -acc, acc); }
    else { P.vx += clamp(-P.vx, -C.decel, C.decel); }
    if (P.jumpBuf > 0 && (P.onGround || P.coyote > 0)) { P.vy = -C.jumpVel; P.jumpBuf = 0; P.coyote = 0; P.onGround = false; sfx('jump'); }
  }
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
  if (P.onGround) { if (!wasGround && vyBefore > 3) sfx('land'); P.hover = C.hoverFrames; P.coyote = C.coyote; P.airT = 0; }
  else { if (P.coyote > 0) P.coyote--; P.airT++; }
  // vacuum
  if (vacHeld && !P.tug) updateVacuum();
  Snd.vac(vacHeld, !!P.tug);
  // SPIT
  if (inp.spitPressed && P.spitCD <= 0 && !P.tug && P.knock <= 0) doSpit();
  // room exits
  if (P.x + P.w / 2 < 0) { if (!exitRoom('L')) P.x = -P.w / 2; }
  else if (P.x + P.w / 2 > room.W) { if (!exitRoom('R')) P.x = room.W - P.w / 2; }
  else if (P.y < -10 && P.vy < 0) { if (!exitRoom('T')) { P.y = -10; P.vy = 0; } }
  else if (P.y + P.h / 2 > room.H) { if (!exitRoom('B')) { P.y = P.spawnY; P.x = P.spawnX; P.vy = 0; hurtPlayer(2, pcx(), 'pit'); } }
}

// suck items / ghosts / objects in the cone
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
    const a = V.itemPull * (1.4 - d / V.range);
    it.vx += dx / d * a; it.vy += dy / d * a - CONFIG.gravity * 0.9; it.sucked = 8;
    it.vx = clamp(it.vx, -5, 5); it.vy = clamp(it.vy, -5, 5);
    if (d < V.swallowDist + 4) collectItem(it, true);
  }
  // enemy projectiles that can be swallowed (plates, candles)
  for (const b of ebullets) {
    if (b.dead || !b.suckable) continue;
    if (!inCone(b.x + b.w / 2, b.y + b.h / 2, 6)) continue;
    const dx = n.x - (b.x + b.w / 2), dy = n.y - (b.y + b.h / 2), d = Math.hypot(dx, dy) || 1;
    if (P.tank.length >= V.tankMax) continue;
    b.vx += dx / d * 0.8; b.vy += dy / d * 0.8; b.vx *= 0.9; b.vy *= 0.9; b.captured = true;
    if (d < V.swallowDist + 6) { b.dead = true; P.tank.push(b.kind === 'fire' ? 'fireball' : b.kind); sfx('stash'); tip('spit', '吸い込んだ物は SPIT で吐き出せる！'); }
  }
  // ghosts / interactables
  for (const e of ents) {
    if (e.dead) continue;
    if (e.ghost && e.state !== 'swallow' && e.state !== 'flee' && e.catchable !== false) {
      if (rectInCone(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
        e.catchT += e.stunT > 0 ? Math.ceil(V.catchFrames / V.catchFramesStunned) : 1; e.inCone = 3;
        if (e.catchT >= V.catchFrames && !P.tug) { startTug(e); return; }
      }
    } else if (e.onSuck && rectInCone(e.x - e.w / 2, e.y - e.h, e.w, e.h)) e.onSuck();
  }
  if (boss && boss.onSuck) boss.onSuck();
}
const AMMO = new Set(['book', 'plate', 'candle', 'crystal', 'fireball']);
const isAmmo = k => AMMO.has(k);
function collectItem(it, viaVac) {
  if (it.dead) return;
  const k = it.kind;
  if (isAmmo(k)) {
    if (P.tank.length >= CONFIG.vac.tankMax) return;
    P.tank.push(k); sfx('stash'); tip('spit', '吸い込んだ物は SPIT で吐き出せる！');
  } else if (k === 'coin') { progress.coins++; sfx('coin'); }
  else if (k === 'heart') { heal(2); sfx('item'); }
  else if (k === 'heartbig') { progress.maxHP += 2; P.hp = progress.maxHP; sfx('secret'); tip('hc', '最大HPがアップした！', true); }
  else if (k === 'key') { progress.hasKey = true; sfx('secret'); tip('key', '「舞踏会場の鍵」を手に入れた！ 地下の控え室の扉が開けられる', true); }
  it.dead = true; if (it.perm) progress.perm.add(it.perm);
  for (let i = 0; i < 5; i++) parts.push({ x: it.x + it.w / 2, y: it.y + it.h / 2, vx: rnd(-1.2, 1.2), vy: rnd(-1.6, 0.2), life: 16, col: k === 'coin' ? '#ffe080' : '#bff4ff', size: 1 });
}

// ---------------------------------------------------------------------
//  SPIT: fire the oldest stored object, or an air puff when empty
// ---------------------------------------------------------------------
const SHOT_INFO = { book: { w: 10, h: 8, dmg: 1 }, plate: { w: 12, h: 6, dmg: 1 }, candle: { w: 6, h: 10, dmg: 1 }, crystal: { w: 10, h: 10, dmg: 1 }, fireball: { w: 12, h: 12, dmg: 2 } };
function doSpit() {
  const S = CONFIG.spit, n = nozzle();
  P.spitPose = 16;
  if (P.tank.length) {
    const kind = P.tank.shift(), inf = SHOT_INFO[kind] || SHOT_INFO.book;
    const ox = n.x, oy = n.y - 12, tg = spitTarget(ox, oy);
    let vx = P.face * S.speed, vy = -0.6, grav = 0.07;
    if (tg) { const dx = tg.x - ox, dy = tg.y - oy, d = Math.hypot(dx, dy) || 1; vx = dx / d * S.speed; vy = dy / d * S.speed; grav = 0; }
    playerShots.push({ kind, x: ox - inf.w / 2, y: oy - inf.h / 2, w: inf.w, h: inf.h, vx, vy, grav, dmg: inf.dmg, life: 120, spin: 0, aimed: !!tg });
    P.spitCD = S.cooldown; stats.spits++; sfx('spit'); P.vx -= P.face * 0.6;
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
// SPIT auto-aim: nearest target in front within ~70 degrees of horizontal (mobile friendly; the chandelier hangs high)
function spitTarget(ox, oy) {
  const cand = [];
  for (const e of ents) {
    if (e.dead || !e.hitBy) continue;
    if (e.ghost && (e.state === 'swallow' || e.state === 'caught')) continue;
    if (e.type === 'vase' && e.empty) continue;
    cand.push({ x: e.x, y: e.ghost ? e.y : e.y - e.h / 2 });
  }
  if (boss && boss.hitTest && ['idle', 'candles', 'wisps', 'shards', 'crash', 'stuck', 'rise'].includes(boss.state)) cand.push({ x: boss.x, y: boss.y + 50, boss: 1 });
  let best = null, bd = 260;
  for (const c of cand) {
    const dx = (c.x - ox) * P.face, dy = c.y - oy; if (dx < 6) continue;
    if (Math.abs(Math.atan2(dy, dx)) > 1.25) continue;
    const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function updateShots() {
  for (const s of playerShots) {
    if (s.dead) continue;
    s.x += s.vx; s.y += s.vy; s.vy += s.grav; s.spin++; s.life--;
    if (s.kind === 'fireball' && frame % 2 === 0) parts.push({ x: s.x + s.w / 2, y: s.y + s.h / 2, vx: rnd(-0.4, 0.4), vy: rnd(-0.6, 0), life: 14, col: '#ffb040', size: 2, glow: 1 });
    if (s.life <= 0 || s.x < -20 || s.x > room.W + 20 || boxHitsSolid(s.x + 2, s.y + 2, s.w - 4, s.h - 4)) { shatter(s); continue; }
    for (const e of ents) {
      if (e.dead || !e.hitBy) continue;
      if (Math.abs(e.x - (s.x + s.w / 2)) < e.w / 2 + s.w / 2 && Math.abs((e.ghost ? e.y : e.y - e.h / 2) - (s.y + s.h / 2)) < e.h / 2 + s.h / 2) { if (e.hitBy(s) !== false) { shatter(s); break; } }
    }
    if (!s.dead && boss && boss.hitBy && boss.hitTest(s)) { boss.hitBy(s); shatter(s); }
  }
  for (let i = playerShots.length - 1; i >= 0; i--) if (playerShots[i].dead) playerShots.splice(i, 1);
}
function shatter(s) {
  s.dead = true; const col = { book: '#9a3040', plate: '#f4f4fc', candle: '#f0e8d8', crystal: '#a8e0ff', fireball: '#ffb040' }[s.kind] || '#fff';
  for (let i = 0; i < 7; i++) parts.push({ x: s.x + s.w / 2, y: s.y + s.h / 2, vx: rnd(-1.8, 1.8), vy: rnd(-2.2, 0.4), life: 22, col, size: 2, grav: 1 });
  sfx(s.kind === 'plate' || s.kind === 'crystal' ? 'tink' : 'hit');
}

// ---------------------------------------------------------------------
//  items (coins, hearts, ammo objects, key, heart container)
// ---------------------------------------------------------------------
const ITEM_SIZE = { coin: [10, 10], heart: [11, 10], heartbig: [18, 16], key: [14, 10], book: [12, 10], plate: [14, 6], candle: [6, 12], crystal: [12, 12], fireball: [12, 12] };
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
