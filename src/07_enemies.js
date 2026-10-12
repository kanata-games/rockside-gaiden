
// =====================================================================
//  ENTITIES: ghosts (ふわゴースト / お皿ゴースト / よろい亡霊), interactables (curtain, dust, vase), save altar, locked door
// =====================================================================
const ents = [];
let boss = null;
function spawnRoomEntities() {
  ents.length = 0; items.length = 0; playerShots.length = 0; ebullets.length = 0; parts.length = 0; floats.length = 0; P.onFloat = null; boss = null;
  const d = room.def;
  d.ents.forEach((e, i) => {
    const [type, c, r, o] = e, opt = o || {}, x = c * TS, y = r * TS, id = d.id + ':' + i;
    if (progress.perm.has(id) && type !== 'curtain' && type !== 'vase') return;
    switch (type) {
      case 'start': room.start = { x, y }; break;
      case 'save': ents.push({ type: 'save', x, y, w: 28, h: 40, used: false }); room.save = { x, y }; break;
      case 'coin': case 'heart': spawnItem(type, x, y, { perm: id }); break;
      case 'bats': for (let k = 0; k < (opt.n || 2); k++) ents.push(makeFoe('bat', x + (k - 0.5) * 18, y + (k & 1) * 6, opt.foe)); break;
      case 'rat': case 'gargoyle': case 'puppet': case 'skeleton': case 'cursedbook': case 'skullwisp': case 'crab': ents.push(makeFoe(type, x, y, opt.foe)); break;
      case 'warp': ents.push(makeWarp(x, y, opt, id)); break;
      case 'shopkeeper': ents.push(makeShopkeeper(x, y)); break;   // v0.7
      case 'sheet': ents.push(makeGhost('sheet', x, y)); break;
      case 'lever': ents.push(makeLever(x, y, opt, id)); break;
      case 'heavy': ents.push(makeHeavy(x, y, opt, id)); break;
      case 'vines': ents.push(makeVines(opt)); break;
      case 'ability': ents.push(makeAbility(x, y, opt, id)); break;
      case 'hint': ents.push(makeHint(x, y, opt, id)); break;
      case 'key': case 'heartbig': { const it = spawnItem(type, x, y, { perm: id, fixed: true }); it.baseY = it.y; break; }
      case 'curtain': ents.push(makeCurtain(x, y, opt, id)); break;
      case 'dust': ents.push({ type: 'dust', x, y, w: 20, h: 12, stage: 0, suckT: 0, drop: opt.drop || [], id, onSuck() { this.suckT++; this.inCone = 3; } }); break;
      case 'vase': ents.push({ type: 'vase', x, y, w: 14, h: 22, suckT: 0, empty: progress.perm.has(id), drop: opt.drop || [], id, onSuck() { if (!this.empty) { this.suckT++; this.inCone = 3; } }, hitBy(s) { if (!this.empty) { this.suckT = 99; } return false; } }); break;
      case 'puff': ents.push(makeGhost('puff', x, y)); break;
      case 'dish': ents.push(makeGhost('dish', x, y)); break;
      case 'armor': ents.push(makeArmor(x, y)); break;
      case 'boss': if (!progress.bosses.has(d.boss)) boss = makeBoss(d.boss, x, y); break;
      default: if (CONFIG.ammo[type]) spawnItem(type, x, y);
    }
  });
}
// ---------------------------------------------------------------------
//  ghosts
// ---------------------------------------------------------------------
function makeGhost(kind, x, y, extra) {
  const C = CONFIG[kind === 'armorghost' ? 'puff' : kind] || CONFIG.puff;
  if (kind === 'sheet') return Object.assign(makeGhost('puff', x, y), { type: 'sheet', hp: C.hp, maxHp: C.hp, w: 28, h: 30 }, extra || {});
  const hp = kind === 'armorghost' ? CONFIG.armor.ghostHp : C.hp;
  return Object.assign({ type: kind, ghost: true, x, y, w: kind === 'dish' ? 28 : 24, h: kind === 'dish' ? 28 : 24, hp, maxHp: hp, state: 'float', t: 0, catchT: 0, stunT: 0,
    vx: 0, vy: 0, homeX: x, homeY: y, seed: Math.random() * 10, dashCD: 60 + Math.random() * 80, throwCD: 60 + Math.random() * 60, inCone: 0, flash: 0,
    hitBy(s) { if (this.state === 'swallow') return false; this.stunT = CONFIG.spit.stunFrames; this.hp = Math.max(8, this.hp - CONFIG.spit.ghostDamage * s.dmg); this.flash = 8; sfx('hit');
      if (this.state === 'caught') return true; this.state = 'float'; tip('stun', '目を回したゴーストはすぐにつかまえられる！'); return true; } }, extra || {});
}
function ghostTouchDamage(e, dmg) {
  if (e.state === 'caught' || e.state === 'swallow' || e.stunT > 0 || P.dead) return;
  if (hitsKanata(e.x - e.w / 2 + 3, e.y - e.h / 2 + 4, e.x + e.w / 2 - 3, e.y + e.h / 2 - 4) && hurtPlayer(dmg, e.x, e.type) && e.type !== 'firewisp' && e.state !== 'caught') { e.state = 'flee'; e.t = 0; } // drift away after a hit
}
function updateGhost(e) {
  e.t++; if (e.flash > 0) e.flash--; if (e.inCone > 0) e.inCone--; else if (e.catchT > 0 && e.state !== 'caught') e.catchT = Math.max(0, e.catchT - 2);
  const px = pcx(), py = P.y + 24, dx = px - e.x, dy = py - e.y, dist = Math.hypot(dx, dy);
  const C = e.type === 'dish' ? CONFIG.dish : e.type === 'sheet' ? CONFIG.sheet : CONFIG.puff, fast = e.type === 'armorghost' ? 1.45 : 1;
  if (e.state === 'swallow') {
    const n = nozzle(), k = Math.min(1, e.t / 18); e.x = e.sx + (n.x - e.sx) * k * k; e.y = e.sy + (n.y - e.sy) * k * k;
    if (e.t >= 18) { e.dead = true; stats.swallowed++; progress.captures++; if (e.onSwallowed) { e.onSwallowed(); return; } const nn = e.type === 'dish' ? CONFIG.dish.coins : e.type === 'armorghost' ? CONFIG.armor.coins : e.type === 'sheet' ? CONFIG.sheet.coins : CONFIG.puff.coins;
      const list = []; for (let i = 0; i < nn; i++) list.push('coin'); if (Math.random() < 0.35) list.push('heart'); popItems(list, n.x + P.face * 30, n.y);
      for (let i = 0; i < 14; i++) parts.push({ x: n.x, y: n.y, vx: rnd(-2, 2), vy: rnd(-2, 2), life: 20, col: '#bff4ff', size: 2, glow: 1 }); }
    return;
  }
  if (e.state === 'caught') return;              // driven by updateTug
  if (e.stunT > 0) { e.stunT--; e.vx *= 0.85; e.vy *= 0.85; e.x += e.vx; e.y += e.vy; return; }
  if (e.inCone > 0 && P.vacOn && e.type !== 'firewisp') { // held in the vacuum wind: slowed and drawn toward the nozzle
    const n = nozzle(); if (e.state === 'warn' || e.state === 'dash') { e.state = 'float'; e.dashCD = 90; }
    e.vx *= 0.8; e.vy *= 0.8; e.x += (n.x - e.x) * 0.006 - Math.sign(n.x - e.x) * 0.25 + Math.sin(e.t * 0.3) * 0.4; e.y += (n.y - e.y) * 0.02; clampGhost(e); return;
  }
  if (e.state === 'flee') { e.x -= Math.sign(dx) * 1.2; e.y += Math.sin(e.t * 0.1) * 0.6 - 0.2; if (e.t > 60) { e.state = 'float'; e.t = 0; } clampGhost(e); return; }
  if (e.type === 'firewisp') updateFireWisp(e);
  else if (e.type === 'dish') updateDish(e, dx, dy, dist);
  else {
    if (e.state === 'float') {
      if (dist < C.aggro) { e.vx += Math.sign(dx) * 0.04 * fast; e.vy += Math.sign(dy) * 0.03; }
      else { e.vx += (e.homeX - e.x) * 0.0008; e.vy += (e.homeY - e.y) * 0.0008; }
      const sp = C.speed * fast; e.vx = clamp(e.vx, -sp, sp); e.vy = clamp(e.vy, -sp * 0.8, sp * 0.8);
      e.x += e.vx; e.y += e.vy + Math.sin(e.t * 0.08 + e.seed) * 0.35;
      if (--e.dashCD <= 0 && dist < 150) { e.state = 'warn'; e.t = 0; e.tx = px; e.ty = py; }
    } else if (e.state === 'warn') {
      if (e.t >= C.dashWarn) { e.state = 'dash'; e.t = 0; const d = Math.hypot(e.tx - e.x, e.ty - e.y) || 1; e.vx = (e.tx - e.x) / d * C.dashSpeed * fast; e.vy = (e.ty - e.y) / d * C.dashSpeed * fast; }
    } else if (e.state === 'dash') {
      e.x += e.vx; e.y += e.vy; if (e.t > 34) { e.state = 'float'; e.t = 0; e.dashCD = C.dashEvery / fast + Math.random() * 60; e.vx *= 0.3; e.vy *= 0.3; }
    }
    clampGhost(e);
    ghostTouchDamage(e, C.damage);
  }
}
function clampGhost(e) { const m = e.state === 'caught' ? 14 : CONFIG.foeEdge; e.x = clamp(e.x, m, room.W - m); e.y = clamp(e.y, 40, room.H - 24); }
function updateDish(e, dx, dy, dist) {
  const C = CONFIG.dish;
  const wantX = pcx() - Math.sign(dx || 1) * C.keep, wantY = Math.max(56, P.y - 30);
  if (e.state === 'float') {
    e.vx += clamp((wantX - e.x) * 0.004, -0.05, 0.05); e.vy += clamp((wantY - e.y) * 0.004, -0.04, 0.04);
    e.vx = clamp(e.vx, -C.speed, C.speed); e.vy = clamp(e.vy, -C.speed, C.speed);
    e.x += e.vx; e.y += e.vy + Math.sin(e.t * 0.07 + e.seed) * 0.3;
    if (--e.throwCD <= 0 && dist < 230) { e.state = 'warn'; e.t = 0; }
  } else if (e.state === 'warn') {
    if (e.t >= C.throwWarn) {
      const tf = 46, tx = pcx(), ty = P.y + P.h - 20, vx = clamp((tx - e.x) / tf, -3.2, 3.2), g = 0.1, vy = (ty - e.y - 0.5 * g * tf * tf) / tf;
      ebullets.push({ kind: 'plate', x: e.x - 7, y: e.y - 18, w: 14, h: 6, vx, vy: clamp(vy, -4, 2), g, dmg: C.damage, suckable: true, life: 200, spin: 0 });
      e.state = 'float'; e.t = 0; e.throwCD = C.throwEvery + Math.random() * 40; sfx('jump');
    }
  }
  clampGhost(e);
  ghostTouchDamage(e, C.damage);
}
// ---------------------------------------------------------------------
//  よろい亡霊 (haunted armour): the vacuum can't grab it; SPIT something at it to knock the ghost out
// ---------------------------------------------------------------------
function makeArmor(x, y) {
  return { type: 'armor', x, y, w: 20, h: 48, body: { x: x - 10, y: y - 48, w: 20, h: 48, vx: 0, vy: 0 }, state: 'walk', t: 0, face: -1, homeX: x, flash: 0, tinkT: 0,
    onSuck() { if (frame % 10 === 0) { sfx('tink'); parts.push({ x: this.x + rnd(-6, 6), y: this.y - rnd(10, 40), vx: rnd(-1, 1), vy: rnd(-1, 0), life: 10, col: '#ffffff', size: 1 }); } tip('armor', 'よろいには掃除機が効かない…何かをぶつけてみよう（SPIT）'); },
    hitBy(s) { breakArmor(this); return true; } };
}
function breakArmor(a) {
  if (a.dead) return; a.dead = true; sfx('break'); cam.shake = 5; hitStop = 4;
  ents.push({ type: 'shell', x: a.x, y: a.y, w: 20, h: 48, face: a.face });
  parts.push({ x: a.x, y: a.y - 44, vx: -a.face * 1.5, vy: -3.5, life: 70, sprite: 'helmet', grav: 1, rot: 1 });
  const g = makeGhost('armorghost', a.x, a.y - 34); g.stunT = 50; ents.push(g);
  tip('armorghost', 'よろいから中身が出てきた！ 吸い込もう');
}
function updateArmor(a) {
  const A = CONFIG.armor, b = a.body; a.t++; if (a.flash > 0) a.flash--; if (a.recoil > 0) a.recoil--;
  const dx = pcx() - a.x, near = Math.abs(dx) < 150 && Math.abs(pcy() - (a.y - 24)) < 60;
  if (a.state === 'walk') {
    if (a.recoil > 0) a.face = -(Math.sign(dx) || 1);
    else if (near) a.face = Math.sign(dx) || a.face;
    else if (Math.abs(a.x - a.homeX) > 64) a.face = Math.sign(a.homeX - a.x);
    b.vx = a.face * A.walk;
    if (!a.recoil && near && Math.abs(dx) < A.swingRange + 14 && Math.sign(dx) === a.face) { a.state = 'windup'; a.t = 0; b.vx = 0; sfx('warn'); }
  } else if (a.state === 'windup') { b.vx = 0; if (a.t >= A.swingWarn) { a.state = 'swing'; a.t = 0; sfx('jump'); } }
  else if (a.state === 'swing') {
    b.vx = 0;
    const hx = a.face > 0 ? a.x : a.x - A.swingRange, hy = a.y - 40;
    if (hitsKanata(hx, hy, hx + A.swingRange, hy + 34) && hurtPlayer(A.damage, a.x, 'armor')) a.recoil = CONFIG.foeRecoil;
    if (a.t >= A.swingFrames) { a.state = 'recover'; a.t = 0; }
  } else if (a.state === 'recover') { b.vx = 0; if (a.t >= 34) { a.state = 'walk'; a.t = 0; } }
  b.vy = Math.min(b.vy + CONFIG.gravity, CONFIG.maxFall); moveBody(b, true);
  if (b.hitWall) a.face = -a.face;
  // don't walk off ledges
  if (b.onGround && !solidAtPx(b.x + (a.face > 0 ? b.w + 2 : -2), b.y + b.h + 4) && tileAt(Math.floor((b.x + (a.face > 0 ? b.w + 2 : -2)) / TS), Math.floor((b.y + b.h + 4) / TS)) !== T_PLAT) { a.face = -a.face; b.x -= b.vx; }
  a.x = b.x + b.w / 2; a.y = b.y + b.h;
  if (!a.recoil && hitsKanata(a.x - 10, a.y - 46, a.x + 10, a.y) && hurtPlayer(1, a.x, 'armor-touch')) a.recoil = CONFIG.foeRecoil;
}
// ---------------------------------------------------------------------
//  curtain / dust / vase / save / locked door
// ---------------------------------------------------------------------
function makeCurtain(x, y, opt, id) {
  const torn = progress.perm.has(id);
  return { type: 'curtain', x, y, w: 32, h: 72, suckT: 0, torn, need: 50, secret: !!opt.secret, drop: opt.drop || [], id, inCone: 0, sprite: opt.sprite || 'curtain',
    onSuck() { if (!this.torn) { this.suckT++; this.inCone = 3; if (this.suckT === 1) tip('vac', 'VAC長押しで吸い込み中…カーテンやホコリの中に何かあるかも'); } } };
}
function updateInteractables(e) {
  if (e.inCone > 0) e.inCone--; else if (e.suckT > 0 && e.type !== 'vase') e.suckT = Math.max(0, e.suckT - 0.5);
  if (e.type === 'curtain' && !e.torn && e.suckT >= e.need) {
    e.torn = true; progress.perm.add(e.id); sfx('rip'); cam.shake = 2;
    parts.push({ x: e.x, y: e.y - 40, tx: 1, life: 26, sprite: 'curtain', key: e.sprite, fly: 1, sx: e.x - 16, sy: e.y - 72 });
    if (e.secret) { revealSecret(); stats.secrets++; }
    popItems(e.drop, e.x, e.y - 30);
  }
  if (e.type === 'dust' && !e.dead) {
    if (e.inCone > 0 && frame % 3 === 0) { const n = nozzle(); parts.push({ x: e.x + rnd(-8, 8), y: e.y - rnd(0, 8), vx: (n.x - e.x) * 0.04, vy: (n.y - e.y) * 0.04, life: 20, col: '#a8a0b0', size: 2 }); }
    if (e.suckT >= 26) { e.suckT = 0; e.stage++; sfx('puff'); if (e.stage >= 3) { e.dead = true; progress.perm.add(e.id); popItems(e.drop, e.x, e.y - 6); tip('dust', 'ホコリの中から何か出てきた！'); } }
  }
  if (e.type === 'vase' && !e.empty && e.suckT >= 40) { e.empty = true; progress.perm.add(e.id); popItems(e.drop, e.x, e.y - 22); sfx('tink'); }
  if (e.type === 'save') {
    const on = Math.abs(pcx() - e.x) < 18 && P.y + P.h > e.y - 44 && P.y < e.y;
    if (on && !e.used && !P.dead) { e.used = true; P.hp = progress.maxHP; saveGame(room.id); stats.saves++; sfx('save'); tip('save', 'HPが回復して、セーブしました', true); for (let i = 0; i < 16; i++) parts.push({ x: e.x + rnd(-10, 10), y: e.y - rnd(0, 40), vx: 0, vy: -rnd(0.5, 1.5), life: 40, col: '#8ad0ff', size: 2, glow: 1 }); }
    if (!on) e.used = false;
  }
}
function checkLockedDoor() {
  for (let r = 0; r < room.rows; r++) {
    const c = room.cols - 1; if (tileAt(c, r) !== T_LOCK) continue;
    if (P.x + P.w > c * TS - 6 && P.y < (r + 1) * TS && P.y + P.h > r * TS) {
      if (progress.hasKey) { openLock(); tip('unlock', '鍵が開いた…この先から強い気配がする', true); }
      else if (!room.lockTold || frame - room.lockTold > 300) { room.lockTold = frame; tip('locked' + frame, '鍵がかかってる… 屋敷のどこかに鍵があるはず', true); }
      return;
    }
  }
}
// ---------------------------------------------------------------------
//  enemy bullets (plates, candles, crystal shards, fire patches, floor waves)
// ---------------------------------------------------------------------
const PERSIST_BULLETS = new Set(['firepatch', 'wave', 'suds', 'thorn', 'hand', 'root', 'blast', 'geyser', 'puddle', 'sandorb', 'sandfall', 'string', 'halberd', 'gsword', 'ropecol', 'bubcol', 'bolt', 'paintcol', 'jackcol']);
function updateEBullets() {
  for (const b of ebullets) {
    if (b.dead) continue;
    b.life--; if (b.life <= 0) { b.dead = true; if (b.onExpire) b.onExpire(b); continue; }
    if (!b.captured) {
      b.vy += b.g || 0;
      if (b.home) { const dx = pcx() - (b.x + b.w / 2), dy = P.y + 20 - (b.y + b.h / 2), d = Math.hypot(dx, dy) || 1; b.vx += dx / d * 0.018; b.vy += dy / d * 0.018; const v = Math.hypot(b.vx, b.vy); const hm = b.homeMax || 0.9; if (v > hm) { b.vx *= hm / v; b.vy *= hm / v; } }
    }
    b.captured = false;
    b.x += b.vx; b.y += b.vy; b.spin = (b.spin || 0) + 1;
    if (b.kind === 'wave' || b.kind === 'suds' || b.kind === 'root' || b.kind === 'firepatch') { if (b.kind !== 'firepatch' && (solidAtPx(b.x + (b.vx > 0 ? b.w : 0), b.y + b.h / 2) || b.x < 0 || b.x > room.W)) b.dead = true; }
    else if (b.static) {
      if ((b.roll || b.wall || b.home) && (solidAtPx(b.x + (b.vx > 0 ? b.w : 0), b.y + b.h / 2) || b.x < -4 || b.x + b.w > room.W + 4 || (b.home && (solidAtPx(b.x + b.w / 2, b.y) || solidAtPx(b.x + b.w / 2, b.y + b.h))))) {
        if (b.bounces > 0) { b.bounces--; b.vx = -b.vx; b.x += b.vx * 2; sfx('tink'); }
        else { b.dead = true; if (b.roll) spawnItem('gear', clamp(b.x + b.w / 2, 20, room.W - 20), b.y + b.h); if (b.onExpire) b.onExpire(b); for (let i = 0; i < 5; i++) parts.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: rnd(-1.5, 1.5), vy: rnd(-2, 0), life: 16, col: '#e8e2ff', size: 2, grav: 1 }); }
        continue;
      }
    }
    // v0.3.1: the "top is inside a solid tile" test only applies to bullets moving UP (hitting the ceiling). A falling bullet that
    // starts inside the ceiling (e.g. the golem's sock rain spawned at y=26 in the 2-row ceiling) used to count as "landed" on its
    // very first frame: the telegraph played, the splash ran, but nothing ever fell. Now a falling bullet inside the ceiling band
    // (rows 0-1) simply drops out of it; everywhere else (platforms, walls) the old landing test is unchanged.
    else if (b.y + b.h > room.H - 3 * TS + 1 || (!(b.vy > 0 && b.y < 2 * TS) && (solidAtPx(b.x + b.w / 2, b.y + b.h) || solidAtPx(b.x + b.w / 2, b.y))) || b.x < -10 || b.x > room.W + 10) {
      b.dead = true; if (b.onLand) b.onLand(b);
      else { const col = b.kind === 'plate' ? '#f4f4fc' : b.kind === 'needle' ? '#e8e8f0' : '#a8e0ff'; for (let i = 0; i < 6; i++) parts.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: rnd(-1.5, 1.5), vy: rnd(-2, 0), life: 18, col, size: 2, grav: 1 }); sfx('tink'); }
      continue;
    }
    if (!b.home) hzLog(b.x, b.y, b.x + b.w, b.y + b.h, b.kind === 'firepatch' || b.kind === 'puddle', b);
    if (!P.dead && hitsKanata(b.x, b.y, b.x + b.w, b.y + b.h)) {
      if ((b.kind !== 'firepatch' && b.kind !== 'puddle') || P.onGround) { if (hurtPlayer(b.dmg, b.x + b.w / 2, b.kind) && !PERSIST_BULLETS.has(b.kind)) b.dead = true; }
    }
  }
  for (let i = ebullets.length - 1; i >= 0; i--) if (ebullets[i].dead) ebullets.splice(i, 1);
}
function updateEnts() {
  for (const e of ents) {
    if (e.dead) continue;
    if (e.ghost) updateGhost(e);
    else if (e.foe) updateFoe(e);
    else if (e.type === 'armor') updateArmor(e);
    else if (e.type === 'lever') { if (e.wob > 0) e.wob--; if (e.inCone > 0) e.inCone--; else if (!e.down) e.pullT = Math.max(0, e.pullT - 1); }
    else if (e.type === 'heavy') updateHeavy(e);
    else if (e.type === 'vines') updateVines(e);
    else if (e.type === 'ability') updateAbility(e);
    else if (e.type === 'hint') updateHint(e);
    else if (e.type === 'warp') updateWarp(e);
    else if (e.type === 'shopkeeper') updateShopkeeper(e);
    else updateInteractables(e);
  }
  for (let i = ents.length - 1; i >= 0; i--) if (ents[i].dead && ents[i] !== P.tug) ents.splice(i, 1);
}
function updateParts() {
  for (const p of parts) {
    p.life--;
    if (p.streak) { const n = nozzle(); p.x += (n.x - p.x) * 0.16; p.y += (n.y - p.y) * 0.16; if (Math.abs(n.x - p.x) < 4) p.life = 0; continue; }
    if (p.fly) { const n = nozzle(); p.sx += (n.x - 16 - p.sx) * 0.14; p.sy += (n.y - 36 - p.sy) * 0.14; continue; }
    p.x += p.vx; p.y += p.vy; if (p.grav) p.vy += 0.15;
  }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
  if (parts.length > 400) parts.splice(0, parts.length - 400);
}
