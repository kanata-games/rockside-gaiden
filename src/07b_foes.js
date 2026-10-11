
// =====================================================================
//  NORMAL (non-ghost) ENEMIES - the vacuum can't hold them: SPIT objects at them.
//  v0.3: tiny critters (rat, bat) are EDIBLE - the mimic vacuum chomps them (heal + GABU gauge), see eatCritter().
//  The bigger ones (gargoyle, puppet, skeleton, cursedbook, armor) stay suction-immune.
//    bat (こうもり, swarm) / rat (ネズミ) / gargoyle (ガーゴイル) / puppet (あやつり人形) / skeleton (骸骨の給仕) / cursedbook (呪いの本)
//  Shared: hp, hit flash + knockback, burn damage over time, coin drops, "the vacuum doesn't work" feedback.
//  Positions: x = centre, y = bottom (feet), like every non-ghost entity.
// =====================================================================
const FOE_SIZE = { bat: [14, 10], rat: [18, 10], gargoyle: [26, 26], puppet: [16, 30], skeleton: [18, 40], cursedbook: [16, 14], skullwisp: [16, 18], crab: [20, 12] };
const SKIN_JP = { dancer: '踊り子人形', maskbat: '仮面コウモリ', starwisp: '星くず火', chart: '呪いの星図' };
const FOE_JP = { bat: 'コウモリ', rat: 'ネズミ', gargoyle: 'ガーゴイル', puppet: 'あやつり人形', skeleton: '骸骨の給仕', cursedbook: '呪いの本', skullwisp: 'どくろ火', crab: 'おふろガニ' };
const EDIBLE = { rat: 1, bat: 1, crab: 1 };  // tiny critters: the mimic vacuum eats them
function makeFoe(kind, x, y, opt) {
  const C = CONFIG.foes[kind], [w, h] = FOE_SIZE[kind];
  const e = { type: kind, foe: true, x, y, w, h, hp: C.hp, maxHp: C.hp, state: 'idle', t: 0, face: -1, flash: 0, burnT: 0, burnTick: 0, vx: 0, vy: 0,
    homeX: x, homeY: y, seed: Math.random() * 10, cd: 40 + Math.random() * (C.every || 60), body: null, inCone: 0, tinkT: 0,
    onSuck() { this.inCone = 3;
      if (EDIBLE[this.type]) { this.eatT = (this.eatT || 0) + 1; if (this.state === 'hang') this.state = 'fly'; tip('eat', 'ガブッ！ 小さな生き物は掃除機が食べちゃう。HP が少し回復して、GABU ゲージがたまる'); return; }
      if (frame % 9 === 0) { sfx('tink'); parts.push({ x: this.x + rnd(-6, 6), y: this.y - this.h / 2 + rnd(-6, 6), vx: rnd(-1, 1), vy: rnd(-1, 0), life: 10, col: '#ffffff', size: 1 }); }
      this.tinkT = 30; tip('foe', (SKIN_JP[this.skin] || FOE_JP[this.type]) + 'は生き物（？）だから掃除機が効かない！ 吸い込んだ物をぶつけよう（SPIT）'); },
    hitBy(s) { return foeHit(this, s); } };
  if (kind === 'rat' || kind === 'puppet' || kind === 'skeleton' || kind === 'crab') { e.body = { x: x - w / 2, y: y - h, w, h, vx: 0, vy: 0 }; e.state = 'walk'; e.face = Math.random() < 0.5 ? -1 : 1; }
  if (kind === 'bat') { e.state = 'hang'; e.y = Math.max(y, 2 * TS + h + 2); }
  if (kind === 'gargoyle') { e.state = 'perch'; }
  if (kind === 'cursedbook' || kind === 'skullwisp') { e.state = 'float'; }
  return Object.assign(e, opt || {});
}
function foeHit(e, s) {
  if (e.dead || e.hp <= 0) return false;
  if (e.type === 'gargoyle' && e.state === 'perch' && !s.heavy && !s.burn && !s.splashHit && s.dmg < 3) { // stone skin while asleep
    sfx('tink'); tip('gargoyle', '石になっているあいだは硬い！ 重い物か、動き出したところを狙おう'); return true; }
  let dmg = s.dmg || 1;
  e.hp -= dmg; e.flash = 10; sfx('hit');
  if (s.burn) { e.burnT = 90; tip('burn', '燃えてる！ 火のついた物は、あとからじわじわ効く'); }
  if (e.body && s.vx) e.body.vx = Math.sign(s.vx) * 1.6; else if (s.vx) e.x += Math.sign(s.vx) * 6;
  if (e.type === 'gargoyle' && e.state === 'perch') { e.state = 'warn'; e.t = 0; }
  if (e.hp <= 0) killFoe(e);
  return true;
}
function killFoe(e) {
  e.dead = true; stats.foeKills++; sfx('foedie'); cam.shake = Math.max(cam.shake, e.type === 'gargoyle' ? 6 : 2);
  const col = { bat: '#5a3a6a', rat: '#8a7a8a', gargoyle: '#8a8a96', puppet: '#e8c8a0', skeleton: '#e8e4d8', cursedbook: '#7a2030', skullwisp: '#7ae8ff', crab: '#e8603a' }[e.type];
  for (let i = 0; i < 14; i++) parts.push({ x: e.x + rnd(-e.w / 2, e.w / 2), y: e.y - e.h / 2 + rnd(-e.h / 2, e.h / 2), vx: rnd(-2, 2), vy: rnd(-2.6, 0.4), life: 26, col: i % 3 ? col : '#ffffff', size: 2, grav: 1 });
  const C = CONFIG.foes[e.type], list = []; for (let i = 0; i < C.coins; i++) list.push('coin'); if (Math.random() < 0.22) list.push('heart');
  if (e.type === 'cursedbook') list.push('book');
  if (e.type === 'skeleton') list.push('plate');
  if (e.type === 'skullwisp') list.push('bone');
  if (e.type === 'gargoyle') list.push('heart');
  popItems(list, e.x, e.y - e.h / 2);
}
function eatCritter(e) {
  const E = CONFIG.eat, n = nozzle(); e.dead = true; stats.eaten = (stats.eaten || 0) + 1; P.chomp = 16; sfx('chomp'); cam.shake = Math.max(cam.shake, 2); hitStop = Math.max(hitStop, 2);
  heal(E.heal); const was = P.gabu; P.gabu = Math.min(E.max, P.gabu + 1);
  for (let i = 0; i < 10; i++) parts.push({ x: n.x, y: n.y, vx: rnd(-1.5, 1.5), vy: rnd(-2, 0.5), life: 18, col: i & 1 ? '#ff8aa8' : '#ffe080', size: 2, glow: 1 });
  if (P.gabu >= E.max && was < E.max) { sfx('secret'); tip('gabuFull', 'GABU ゲージ満タン！ 次の SPIT がパワーアップ（物なら2倍＋貫通、空ならかみつき波）', true); }
}
function foeTouch(e, dmg) {
  if (e.dead || P.dead) return;
  const top = e.y - e.h, l = e.x - e.w / 2;
  if (e.recoil > 0) return;
  if (hitsKanata(l + 2, top + 2, l + e.w - 2, e.y - 2) && hurtPlayer(dmg, e.x, e.type)) { e.recoil = CONFIG.foeRecoil; e.face = Math.sign(e.x - pcx()) || -e.face; } // back off after a hit: no re-hit loops
}
function updateFoe(e) {
  const C = CONFIG.foes[e.type]; e.t++; if (e.recoil > 0) e.recoil--; if (e.flash > 0) e.flash--; if (e.inCone > 0) e.inCone--; if (e.tinkT > 0) e.tinkT--;
  if (e.burnT > 0) { e.burnT--; if (e.burnT % 30 === 0) { e.hp -= 1; e.flash = 6; if (e.hp <= 0) { killFoe(e); return; } }
    if (frame % 3 === 0) parts.push({ x: e.x + rnd(-e.w / 2, e.w / 2), y: e.y - rnd(0, e.h), vx: rnd(-0.3, 0.3), vy: -rnd(0.5, 1.2), life: 14, col: '#ffb040', size: 2, glow: 1 }); }
  if (EDIBLE[e.type] && e.eatT > 0) { // being slurped into the mimic's mouth: helpless, harmless
    if (e.inCone <= 0) e.eatT = 0;
    else { const n = nozzle(), k = Math.min(0.35, 0.08 + e.eatT * 0.015); e.x += (n.x - e.x) * k; e.y += (n.y + e.h / 2 - e.y) * k; e.face = Math.sign(pcx() - e.x) || e.face;
      if (e.body) { e.body.x = e.x - e.w / 2; e.body.y = e.y - e.h; e.body.vx = 0; e.body.vy = 0; }
      if (Math.hypot(n.x - e.x, n.y - (e.y - e.h / 2)) < 12 || e.eatT > CONFIG.eat.pullMax) eatCritter(e);
      return; } }
  const px = pcx(), py = pcy(), dx = px - e.x, dy = py - (e.y - e.h / 2), dist = Math.hypot(dx, dy);
  switch (e.type) {
    case 'bat': {
      if (e.state === 'hang') { if (dist < C.wake) { e.state = 'fly'; e.t = 0; sfx('bat'); } break; }
      const tx = px + Math.sin(e.t * 0.05 + e.seed) * 30, ty = P.y + 10 + Math.sin(e.t * 0.09 + e.seed * 2) * 26;
      e.vx += clamp((tx - e.x) * 0.01, -0.12, 0.12); e.vy += clamp((ty - (e.y - e.h / 2)) * 0.01, -0.12, 0.12);
      e.vx = clamp(e.vx, -C.speed, C.speed); e.vy = clamp(e.vy, -C.speed, C.speed);
      e.x += e.vx; e.y += e.vy; e.x = clamp(e.x, CONFIG.foeEdge, room.W - CONFIG.foeEdge); e.y = clamp(e.y, 2 * TS + e.h, room.H - 10);
      e.face = Math.sign(e.vx) || e.face; foeTouch(e, C.damage); break; }
    case 'rat': {
      const b = e.body; const near = Math.abs(dx) < 120 && Math.abs(P.y + P.h - e.y) < 40;
      if (e.recoil > 0) e.face = -(Math.sign(dx) || 1);
      else if (near && e.t % 40 === 0) e.face = Math.sign(dx) || e.face;
      b.vx = e.face * (near && !e.recoil ? C.speed : C.speed * 0.6);
      walkFoe(e); foeTouch(e, C.damage); break; }
    case 'puppet': case 'skeleton': {
      const b = e.body;
      if (e.state === 'walk') {
        if (Math.abs(dx) < 200 && Math.abs(dy) < 90) e.face = Math.sign(dx) || e.face; else if (Math.abs(e.x - e.homeX) > 60) e.face = Math.sign(e.homeX - e.x);
        b.vx = e.face * C.speed;
        if (--e.cd <= 0 && Math.abs(dx) < 230 && Math.abs(dy) < 100) { e.state = 'warn'; e.t = 0; b.vx = 0; e.face = Math.sign(dx) || e.face; sfx('warn'); }
      } else if (e.state === 'warn') {
        b.vx = 0;
        if (e.t >= C.warn) {
          if (e.type === 'puppet') { // needles fly straight at Kanata's height (not suckable)
            ebullets.push({ kind: 'needle', x: e.x + e.face * 8 - 5, y: e.y - 22, w: 10, h: 3, vx: e.face * C.needle, vy: 0, g: 0, dmg: C.damage, life: 150, nofloor: 1 });
          } else { // skeleton servant throws a plate in an arc (vacuum it = ammo)
            const tf = 44, tx = pcx(), ty = P.y + P.h - 20, vx = clamp((tx - e.x) / tf, -3, 3), gg = 0.1, vy = (ty - (e.y - 38) - 0.5 * gg * tf * tf) / tf;
            ebullets.push({ kind: 'plate', x: e.x - 7, y: e.y - 40, w: 14, h: 6, vx, vy: clamp(vy, -4, 2), g: gg, dmg: C.damage, suckable: true, life: 200, spin: 0 });
          }
          sfx('jump'); e.state = 'recover'; e.t = 0; e.cd = C.every + Math.random() * 50;
        }
      } else if (e.state === 'recover') { b.vx = 0; if (e.t > 24) { e.state = 'walk'; e.t = 0; } }
      walkFoe(e); foeTouch(e, C.damage); break; }
    case 'cursedbook': {
      if (e.state === 'float') {
        const tx = px - Math.sign(dx || 1) * 70, ty = P.y + 8;
        e.vx += clamp((tx - e.x) * 0.004, -0.06, 0.06); e.vy += clamp((ty - (e.y - e.h / 2)) * 0.006, -0.06, 0.06);
        e.vx = clamp(e.vx, -C.speed, C.speed); e.vy = clamp(e.vy, -C.speed, C.speed); e.x += e.vx; e.y += e.vy + Math.sin(e.t * 0.1 + e.seed) * 0.3;
        e.face = Math.sign(dx) || e.face;
        if (--e.cd <= 0 && dist < 170) { e.state = 'warn'; e.t = 0; e.tx = px; e.ty = py - 6; sfx('warn'); }
      } else if (e.state === 'warn') {
        if (e.t >= C.warn) { const d = Math.hypot(e.tx - e.x, e.ty - (e.y - e.h / 2)) || 1; e.vx = (e.tx - e.x) / d * C.dash; e.vy = (e.ty - (e.y - e.h / 2)) / d * C.dash; e.state = 'dash'; e.t = 0; sfx('flap'); }
      } else if (e.state === 'dash') { e.x += e.vx; e.y += e.vy; if (e.t > 30) { e.state = 'float'; e.t = 0; e.cd = C.every + Math.random() * 60; e.vx *= 0.2; e.vy *= 0.2; } }
      e.x = clamp(e.x, CONFIG.foeEdge, room.W - CONFIG.foeEdge); e.y = clamp(e.y, 2 * TS + e.h + 4, room.H - 3 * TS);
      if (e.state === 'dash' || e.state === 'float') foeTouch(e, C.damage); break; }
    case 'skullwisp': { // floats on a slow sine, keeps its distance, spits a bone (suckable = BONE ammo)
      if (e.state === 'float') {
        const tx = px - Math.sign(dx || 1) * 90, ty = P.y - 10 + Math.sin(e.t * 0.04 + e.seed) * 24;
        e.vx += clamp((tx - e.x) * 0.003, -0.05, 0.05); e.vy += clamp((ty - (e.y - e.h / 2)) * 0.004, -0.05, 0.05);
        e.vx = clamp(e.vx, -C.speed, C.speed); e.vy = clamp(e.vy, -C.speed, C.speed); e.x += e.vx; e.y += e.vy; e.face = Math.sign(dx) || e.face;
        if (--e.cd <= 0 && dist < 200) { e.state = 'warn'; e.t = 0; sfx('warn'); }
      } else if (e.state === 'warn') {
        if (e.t >= C.warn) { const d = Math.hypot(dx, dy) || 1; sfx('spit');
          ebullets.push({ kind: 'bone', x: e.x - 8, y: e.y - e.h / 2 - 4, w: 16, h: 8, vx: dx / d * C.bone, vy: dy / d * C.bone, g: 0, dmg: C.damage, life: 180, suckable: true, ammo: 'bone', nofloor: 1, spin: 0 });
          e.state = 'float'; e.t = 0; e.cd = C.every + Math.random() * 60; }
      }
      e.x = clamp(e.x, CONFIG.foeEdge, room.W - CONFIG.foeEdge); e.y = clamp(e.y, 2 * TS + e.h + 4, room.H - 3 * TS);
      foeTouch(e, C.damage); break; }
    case 'crab': { // scuttles sideways; when Kanata is close it raises its claws and lunges
      const b = e.body;
      if (e.state === 'walk') { if (e.recoil > 0) e.face = -(Math.sign(dx) || 1); b.vx = e.face * C.speed;
        if (!e.recoil && Math.abs(dx) < 70 && Math.abs(P.y + P.h - e.y) < 30 && e.t > 40) { e.state = 'warn'; e.t = 0; b.vx = 0; e.face = Math.sign(dx) || e.face; sfx('warn'); } }
      else if (e.state === 'warn') { b.vx = 0; if (e.t >= C.snapWarn) { e.state = 'snap'; e.t = 0; } }
      else if (e.state === 'snap') { b.vx = e.face * C.snap * Math.max(0, 1 - e.t / 26); if (e.t > 30) { e.state = 'walk'; e.t = 0; } }
      walkFoe(e); foeTouch(e, C.damage); break; }
    case 'gargoyle': {
      if (e.state === 'perch') { if (Math.abs(dx) < C.wake && py > e.y - 30) { e.state = 'warn'; e.t = 0; sfx('warn'); } break; }
      if (e.state === 'warn') { if (e.t === 1) { e.tx = pcx(); e.ty = P.y + P.h - 6; } if (e.t >= C.warn) { const d = Math.hypot(e.tx - e.x, e.ty - e.y) || 1; e.vx = (e.tx - e.x) / d * C.dive; e.vy = (e.ty - e.y) / d * C.dive; e.state = 'dive'; e.t = 0; sfx('flap'); } break; }
      if (e.state === 'dive') { e.x += e.vx; e.y += e.vy; foeTouch(e, C.damage);
        if (e.t > 120 || Math.hypot(e.tx - e.x, e.ty - e.y) < 4 || solidAtPx(e.x, e.y + 1)) { e.state = 'rest'; e.t = 0; sfx('thud'); cam.shake = 3; }
        break; }
      if (e.state === 'rest') { if (e.t >= C.rest) { e.state = 'return'; e.t = 0; } break; }
      if (e.state === 'return') { e.x += (e.homeX - e.x) * 0.04; e.y += (e.homeY - e.y) * 0.04; if (Math.hypot(e.homeX - e.x, e.homeY - e.y) < 3) { e.x = e.homeX; e.y = e.homeY; e.state = 'perch'; e.t = 0; } }
      break; }
  }
}
function walkFoe(e) {
  const b = e.body; b.vy = Math.min(b.vy + CONFIG.gravity, CONFIG.maxFall); moveBody(b, true);
  if (b.hitWall) e.face = -e.face;
  const ax = b.x + (e.face > 0 ? b.w + 2 : -2), ay = b.y + b.h + 4;
  if (b.onGround && !solidAtPx(ax, ay) && tileAt(Math.floor(ax / TS), Math.floor(ay / TS)) !== T_PLAT) { e.face = -e.face; b.x -= b.vx; }
  const M = CONFIG.foeEdge; if (b.x < M) { b.x = M; e.face = 1; } if (b.x + b.w > room.W - M) { b.x = room.W - M - b.w; e.face = -1; }
  e.x = b.x + b.w / 2; e.y = b.y + b.h;
}

// ---------------------------------------------------------------------
//  world objects for the abilities: levers, heavy furniture (wardrobe), burnable vines, ability pedestals, hints
// ---------------------------------------------------------------------
function makeLever(x, y, opt, id) {
  const target = opt.room || room.id, open = progress.perm.has(target + ':gate:' + opt.gate);
  return { type: 'lever', x, y, w: 16, h: 24, gate: opt.gate, target, down: open, pullT: 0, inCone: 0,
    onSuck() { if (this.down) return; this.inCone = 3;
      if (!hasAbil('turbo')) { if (frame % 14 === 0) sfx('tink'); this.wob = 6; tip('leverHard', 'レバーが固くて動かない… もっと強い吸引力があれば'); return; }
      if (++this.pullT >= 30) { this.down = true; stats.levers++; sfx('lever'); cam.shake = 3; openGate(this.target, this.gate);
        if (this.target !== room.id) tip('remote' + this.gate, 'ガコン！ …どこか遠くで鉄格子が開く音がした', true); else tip('lever' + this.gate, 'ガコン！ 鉄扉が開いた', true); } } };
}
function makeHeavy(x, y, opt, id) {
  return { type: 'heavy', x, y, w: 30, h: 64, gate: opt.gate, sprite: opt.sprite || 'wardrobe', suckT: 0, inCone: 0, gone: progress.perm.has(room.id + ':gate:' + opt.gate), slide: 0,
    onSuck() { if (this.gone || this.slide) return; this.inCone = 3;
      if (!hasAbil('turbo')) { this.wob = 6; if (frame % 16 === 0) sfx('tink'); tip('wardrobe', '大きなタンスが扉をふさいでいる… 今の吸引力ではびくともしない'); return; }
      if (++this.suckT >= 50) { this.slide = 1; sfx('swallow'); } } };
}
function updateHeavy(e) {
  if (e.wob > 0) e.wob--;
  if (e.inCone > 0) e.inCone--; else if (!e.slide) e.suckT = Math.max(0, e.suckT - 1);
  if (e.slide) { // shrinks into the nozzle
    e.slide++; const n = nozzle(); e.x += (n.x - e.x) * 0.12; e.y += (n.y + 20 - e.y) * 0.12;
    if (e.slide > 26) { e.gone = true; e.slide = 0; openGate(room.id, e.gate); tip('wardrobeGone', 'タンスを吸い込んだ！ 奥に扉が…', true); popItems(['coin', 'coin', 'coin'], e.x, e.y - 10);
      for (let i = 0; i < 20; i++) parts.push({ x: n.x, y: n.y, vx: rnd(-2, 2), vy: rnd(-2, 1), life: 22, col: '#bff4ff', size: 2, glow: 1 }); }
  }
}
function makeVines(opt) {
  const cells = room.gates[opt.gate] || []; let c0 = 1e9, c1 = -1, r0 = 1e9, r1 = -1;
  for (const i of cells) { const c = i % room.cols, r = (i / room.cols) | 0; c0 = Math.min(c0, c); c1 = Math.max(c1, c); r0 = Math.min(r0, r); r1 = Math.max(r1, r); }
  const open = progress.perm.has(room.id + ':gate:' + opt.gate);
  return { type: 'vines', gate: opt.gate, x: (c0 + c1 + 1) / 2 * TS, y: (r1 + 1) * TS, w: (c1 - c0 + 1) * TS + 6, h: (r1 - r0 + 1) * TS, c0, c1, r0, r1, burnT: 0, dead: open,
    hitBy(s) { if (this.burnT) return false;
      if (s.burn) { this.burnT = 1; sfx('burn'); tip('vinesBurn', 'つたが燃えていく！', true); return true; }
      if (!s.splashHit) { sfx('tink'); this.wob = 10; tip('vines', 'つたは丈夫で切れない… 火のついた物（ろうそく・タネ・火の玉）なら燃えそう', true); } return true; },
    onSuck() { if (!this.burnT) tip('vinesSuck', 'つたは根っこが深くて吸い込めない… 燃やせないかな'); } };
}
function updateVines(e) {
  if (e.wob > 0) e.wob--;
  if (!e.burnT) return;
  e.burnT++;
  if (frame % 2 === 0) parts.push({ x: e.x + rnd(-e.w / 2, e.w / 2), y: e.y - rnd(0, e.h), vx: rnd(-0.4, 0.4), vy: -rnd(0.6, 1.6), life: 20, col: e.burnT & 4 ? '#ffb040' : '#ff6020', size: 2, glow: 1 });
  if (e.burnT === 50) { openGate(room.id, e.gate); e.dead = true; for (let i = 0; i < 20; i++) parts.push({ x: e.x + rnd(-e.w / 2, e.w / 2), y: e.y - rnd(0, e.h), vx: rnd(-1, 1), vy: rnd(-1.5, 0), life: 30, col: '#3a2a1a', size: 2, grav: 1 }); }
}
function makeAbility(x, y, opt, id) {
  const has = hasAbil(opt.abil), locked = opt.after && !progress.bosses.has(opt.after);
  return { type: 'ability', x, y, w: 28, h: 34, abil: opt.abil, has, hidden: locked, t: 0 };
}
function updateAbility(e) {
  e.t++;
  if (e.hidden || e.has) return;
  const oy = e.y - 44 + Math.sin(e.t * 0.06) * 3;
  if (frame % 4 === 0) parts.push({ x: e.x + rnd(-8, 8), y: oy + rnd(-8, 8), vx: 0, vy: -rnd(0.2, 0.8), life: 20, col: ABIL_INFO[e.abil].col, size: 1, glow: 1 });
  if (!P.dead && Math.abs(pcx() - e.x) < 16 && P.y < oy + 8 && P.y + P.h > oy - 8) gainAbility(e);
}
function gainAbility(e) {
  e.has = true; progress.abil[e.abil] = true; stats.abilities.push(e.abil); sfx('get'); cam.shake = 4; hitStop = 10; P.hp = progress.maxHP;
  for (let i = 0; i < 30; i++) { const a = i / 30 * 6.28; parts.push({ x: e.x, y: e.y - 44, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, life: 34, col: ABIL_INFO[e.abil].col, size: 2, glow: 1 }); }
  abilityGet.t = 300; abilityGet.abil = e.abil; syncAbilities();
  if (e.abil === 'phase') openSpiritGates();
  tip('abil_' + e.abil, ABIL_INFO[e.abil].text, true);
}
const abilityGet = { t: 0, abil: null };
function makeHint(x, y, opt, id) { return { type: 'hint', x, y, w: 10, h: 10, need: opt.need, have: opt.have, text: opt.text, id }; }
function updateHint(e) {
  if (e.need && hasAbil(e.need)) return; if (e.have && !hasAbil(e.have)) return;
  if (Math.abs(pcx() - e.x) < 44 && Math.abs(P.y + P.h - e.y) < 50 && !P.dead) tip('hint:' + e.id, e.text);
}
