
// =====================================================================
//  BOSS FRAMEWORK (4 bosses). Shared by all:
//    sleep -> (Kanata walks in) side doors bar shut -> intro (name card) -> fight -> dying -> done (doors open, reward)
//    - SPIT objects at the boss: damage = object dmg x CONFIG.bossMul (+ fire bonus)
//    - every 3rd attack ends in a long telegraphed move that leaves the boss stunned: its ghost CORE pops out at
//      nozzle height = WEAK POINT. Vacuum it for a tug-of-war that drains boss HP (capped per window).
//    - below 50% HP the boss is enraged (shorter telegraphs, more projectiles)
//  Each boss lives in BOSS_DEFS[kind] = { jp, en, cfg, make, update, draw, aim, hitBox, sayIntro, onDefeat }.
// =====================================================================
const FLOOR_Y = 15 * TS;
const BOSS_DEFS = {};
function bossCfg(b) { return CONFIG[b.D.cfg]; }
function bossP(k) { const B = bossCfg(boss); if (boss.over && B[k + 'Over'] !== undefined) return B[k + 'Over']; return boss.rage && B[k + 'Rage'] !== undefined ? B[k + 'Rage'] : B[k]; }
function makeBoss(kind, x, y) {
  const D = BOSS_DEFS[kind], C = CONFIG[D.cfg];
  const b = { type: 'boss', kind, D, hp: C.hp, maxHp: C.hp, state: 'sleep', t: 0, x, y, px: x, flash: 0, rage: false, lastAtk: '', atkN: 0, marks: [], core: null, dead: false, burnT: 0,
    hitTest(s) { if (!this.vulnerable()) return false; const h = D.hitBox(this), cx = s.x + s.w / 2, cy = s.y + s.h / 2; return cx > h.x0 - s.w / 2 && cx < h.x1 + s.w / 2 && cy > h.y0 - s.h / 2 && cy < h.y1 + s.h / 2; },
    hitBy(s) { const fire = s.burn ? (kind === 'rose' ? CONFIG.rose.burnBonus * 2 : 2) : 0; this.damage(s.dmg * (C.spitMul || CONFIG.bossMul) + fire);
      if (s.burn) { this.burnT = 40; if (kind === 'rose') tip('roseFire', 'よく燃える！ バラには火のついた物がとくに効く', true); } },
    damage(n) { if (this.state === 'dying' || this.state === 'done') return; this.hp -= n; this.flash = 10; sfx('bhit'); if (this.core) this.core.hp = this.hp;
      if (this.hp <= C.hp / 2 && !this.rage) { this.rage = true; tip('rage_' + kind, D.rageText, true); cam.shake = 8; }
      if (C.phase3 && this.hp <= C.hp * C.phase3 && !this.over) { this.over = true; tip('over_' + kind, D.overText || D.rageText, true); cam.shake = 12; sfx('crash'); }
      if (this.hp <= 0) this.die(); },
    die() { if (this.state === 'dying' || this.state === 'done') return; this.hp = 0; endTug(true); this.state = 'dying'; this.t = 0; sfx('crash'); cam.shake = 12;
      for (const e of ents) if (e.type === 'firewisp') e.dead = true; ebullets.length = 0; },
    vulnerable() { return !['sleep', 'intro', 'dying', 'done'].includes(this.state); },
    aimAt() { return this.vulnerable() && D.aim ? D.aim(this) : null; },
    onSuck() { const c = this.core; if (!c || c.state !== 'out' || P.tug) return;
      if (rectInCone(c.x - 12, c.y - 12, 24, 24)) { c.catchT += 1; c.inCone = 3; if (c.catchT >= CONFIG.vac.catchFrames * 0.6) startTug(c); } },
  };
  if (D.make) D.make(b);
  return b;
}
// the stunned boss's ghost core: tug-of-war target (drain capped by CONFIG.boss.coreCap per window)
function makeCore(b, x, y, anchor, sprite) {
  const B = CONFIG.boss;
  return { ghost: true, boss: true, x, y, hp: b.hp, maxHp: b.maxHp, state: 'out', t: 0, catchT: 0, seed: 3, inCone: 0, sprite: sprite || 'core', drained: 0,
    onDrain(d) { this.drained += d; boss.hp = this.hp;
      if (this.drained >= (bossCfg(boss).coreCap || B.coreCap) && boss.hp > 0 && P.tug === this) { endTug(false); this.state = 'flee'; boss.t = Math.max(boss.t, boss.winLen - 20); tip('coreBreak', 'コアがふりほどいた！ 次のチャンスを待とう', true); }
      if (boss.hp <= boss.maxHp / 2 && !boss.rage) boss.damage(0); },
    onCaptured() { boss.die(); },
    clampTug() { const a = anchor(), dx = this.x - a.x, dy = this.y - a.y, d = Math.hypot(dx, dy); if (d > 120) { this.x = a.x + dx / d * 120; this.y = a.y + dy / d * 120; } } };
}
function coreBob(b, x, y) { // keep a free core wobbling in place while the boss is stunned
  const c = b.core; if (!c || c.state === 'caught' || c.state === 'swallow') return;
  c.x = x + Math.sin(b.t * 0.05) * 14; c.y = y + Math.sin(b.t * 0.11) * 4;
  if (c.inCone > 0) c.inCone--; else c.catchT = Math.max(0, c.catchT - 1);
}
function coreWindowOver(b) { // returns true when the stun window ended (core escapes)
  const c = b.core;
  if (b.t >= b.winLen && !(c && c.state === 'swallow')) { if (c && P.tug === c) { endTug(false); tip('coreEsc', 'コアが逃げた！ また次のチャンスを待とう', true); } b.core = null; return true; }
  return false;
}
// bar every side door of the boss room during the fight
function setGate(on) {
  const named = new Set(); for (const gid in room.gates) for (const i of room.gates[gid]) named.add(i);   // v0.4: never touch a room's own named gates (e.g. the clock's seal door)
  for (const o of room.openings) { if (o.side !== 'L' && o.side !== 'R') continue; const c = o.side === 'L' ? 0 : room.cols - 1;
    for (let r = o.a; r <= o.b; r++) { const i = r * room.cols + c; if (!named.has(i) && (room.grid[i] === T_EMPTY || room.grid[i] === T_GATE)) room.grid[i] = on ? T_GATE : T_EMPTY; } }
  renderRoomStatic();
}
function updateBoss() {
  const b = boss; if (!b) return; const D = b.D;
  b.t++; if (b.flash > 0) b.flash--;
  if (b.burnT > 0) { b.burnT--; if (frame % 3 === 0) { const h = D.hitBox(b); parts.push({ x: rnd(h.x0, h.x1), y: rnd(h.y0, h.y1), vx: rnd(-0.4, 0.4), vy: -rnd(0.6, 1.4), life: 16, col: '#ffb040', size: 2, glow: 1 }); } }
  if (b.state === 'sleep') { if (P.x > 6 * TS && P.onGround) { b.state = 'intro'; b.t = 0; setGate(true); sfx('door'); cam.shake = 4; stats.bossStarted = true; } if (D.sleep) D.sleep(b); return; }
  if (b.state === 'intro') { if (D.intro) D.intro(b); if (b.t >= 230 || (b.t > 120 && inp.startPressed)) { b.state = 'idle'; b.t = 0; if (D.introEnd) D.introEnd(b); } return; }
  if (b.state === 'dying') {
    if (D.dying) D.dying(b);
    if (b.t % 6 === 0) { const h = D.hitBox(b); parts.push({ x: rnd(h.x0, h.x1), y: rnd(h.y0, h.y1), vx: rnd(-2, 2), vy: rnd(-2, 1), life: 34, col: D.cols[b.t % D.cols.length], size: 3, glow: 1, grav: 1 }); sfx('tink'); }
    if (b.t === 90) { sfx('crash'); cam.shake = 14; const h = D.hitBox(b); for (let i = 0; i < 40; i++) parts.push({ x: rnd(h.x0, h.x1), y: rnd(h.y0, h.y1), vx: rnd(-3, 3), vy: rnd(-4, 0), life: 50, col: D.cols[i % D.cols.length], size: 2, grav: 1 }); }
    if (b.t >= 200) { b.state = 'done'; progress.bosses.add(b.kind); stats.bossesBeaten = (stats.bossesBeaten || 0) + 1; setGate(false); D.onDefeat(b); }
    return;
  }
  if (b.state === 'done') return;
  D.update(b);
}
function chooseAttack(b, normal, special) {
  b.atkN++; let pick;
  const C = bossCfg(b), ev = b.over && C.specialEveryOver ? C.specialEveryOver : C.specialEvery || 3;
  if (b.atkN % ev === 0) pick = special;
  else { const opts = normal.filter(k => k !== b.lastAtk); pick = opts[Math.floor(Math.random() * opts.length)]; }
  if (QS.get('bossatk')) pick = QS.get('bossatk');
  b.lastAtk = pick; b.state = pick; b.t = 0; return pick;
}
function bossReward(b, x) { popItems(['heart', 'heart', 'coin', 'coin', 'coin', 'coin', 'coin'], x, FLOOR_Y - 60); P.hp = progress.maxHP; }
function overlapBox(x0, y0, x1, y1) { hzLog(x0, y0, x1, y1); return hitsKanata(x0, y0, x1, y1); }

// =====================================================================
//  BOSS 1: 呪いのシャンデリア グラン・ルミエール (ballroom)
//    candles : fire marks on the floor -> candles drop -> fire patches (leftover candles = ammo)
//    wisps   : fire wisps chase Kanata (vacuum them -> FIREBALL ammo)
//    shards  : dotted fall paths -> a fan of crystal shards (some stay = ammo)
//    crash   : a shadow follows Kanata, locks red -> drops, floor shockwaves (jump) -> STUCK: the core pops out
//  Defeat: the ballroom floor gives way (-> laundry) and a pedestal with ふわり化 appears.
// =====================================================================
const BOSS_CANDLES = [-56, -40, -22, 22, 40, 56];
BOSS_DEFS.chandelier = { jp: '呪いのシャンデリア', en: 'GRAND LUMIERE', cfg: 'boss', cols: ['#ffe080', '#c8ecff', '#ffffff'], rageText: 'シャンデリアが怒った！ 炎が青くなった',
  sayIntro: '……わ。でっかいシャンデリア。ホコリ、すごそう……', sayCore: '……つかまえた。……逃がさない',
  make(b) { b.y = 48; b.homeY = 48; b.lit = 0; b.shadowX = b.x; },
  intro(b) { b.lit = Math.min(6, Math.floor(b.t / 14)); if (b.t % 14 === 0 && b.t <= 84) sfx('chime'); if (b.t === 100) cam.shake = 6; },
  introEnd(b) { b.lit = 6; },
  hitBox(b) { return { x0: b.x - 52, x1: b.x + 52, y0: b.y + 18, y1: b.y + 76 }; },
  aim(b) { return ['idle', 'candles', 'wisps', 'shards', 'crash', 'stuck', 'rise'].includes(b.state) ? { x: b.x, y: b.y + 50 } : null; },
  update(b) {
    const B = CONFIG.boss;
    const trackTo = (tx, sp) => { tx = clamp(tx, 72, room.W - 72); b.px += clamp(tx - b.px, -sp, sp); };
    const swayX = Math.sin(frame * 0.025) * 6;
    switch (b.state) {
      case 'idle': trackTo(pcx(), bossP('trackSpeed')); if (b.t >= bossP('idle')) { const w = ents.filter(e => e.type === 'firewisp' && !e.dead).length; chooseAttack(b, w ? ['candles', 'shards'] : ['candles', 'shards', 'wisps'], 'crash'); b.shadowX = b.x; b.vy = 0; } break;
      case 'candles': {
        trackTo(pcx(), 0.3); const warn = bossP('candleWarn');
        if (b.t === 1) { const n = bossP('candles'), px = pcx(); b.marks = []; const xs = [px]; const gap = CONFIG.boss.candleGap || 58; for (let k = 1; xs.length < n; k++) { xs.push(px + k * gap); if (xs.length < n) xs.push(px - k * gap); }
          for (const x of xs) b.marks.push(clamp(x, 28, room.W - 28)); sfx('warn'); }
        if (b.t === warn) { for (const mx of b.marks) dropCandle(mx); b.marks = []; }
        if (b.t >= warn + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'wisps':
        if (b.t === 40) { const n = bossP('wispCount'); for (let i = 0; i < n; i++) spawnFireWisp(b.x + (i - (n - 1) / 2) * 34, b.y + 70); sfx('chime'); }
        if (b.t >= 70) { b.state = 'idle'; b.t = 0; } break;
      case 'shards': {
        const warn = bossP('shardWarn');
        if (b.t === 1) { const n = bossP('shards'); b.shardV = []; for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 2.2; b.shardV.push({ vx: Math.sin(a) * 2.4, vy: Math.cos(a) * 1.2 + 0.4 }); } sfx('warn'); }
        if (b.t === warn) { b.shardV.forEach((v, i) => ebullets.push({ kind: 'shard', x: b.x - 4, y: b.y + 70, w: 8, h: 10, vx: v.vx, vy: v.vy, g: 0.06, dmg: B.shardDamage, life: 240,
          onLand: (q) => { sfx('tink'); for (let k = 0; k < 4; k++) parts.push({ x: q.x + 4, y: q.y + 8, vx: rnd(-1.5, 1.5), vy: rnd(-2, 0), life: 16, col: '#c8ecff', size: 1, grav: 1 }); if (i % 2 === 0) spawnItem('crystal', q.x + 4, Math.min(q.y + q.h, FLOOR_Y)); } })); sfx('tink'); b.shardV = null; }
        if (b.t >= warn + 40) { b.state = 'idle'; b.t = 0; } break; }
      case 'crash': {
        const tr = bossP('crashTrack');
        if (b.t < tr) { b.shadowX += clamp(pcx() - b.shadowX, -B.crashFollow, B.crashFollow); trackTo(b.shadowX, 3); if (b.t % 16 === 0) sfx('warn'); }
        else if (b.t < tr + B.crashLock) trackTo(b.shadowX, 3);
        else {
          b.vy = (b.vy || 0) + 0.6; b.y += b.vy;
          if (b.y + 84 >= FLOOR_Y) { b.y = FLOOR_Y - 84; b.vy = 0; b.state = 'stuck'; b.t = 0; b.winLen = bossP('stuck'); sfx('crash'); cam.shake = 10; hitStop = 5;
            for (const d of [-1, 1]) ebullets.push({ kind: 'wave', x: b.x + d * 50 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: d * B.waveSpeed, vy: 0, dmg: B.waveDamage, life: 200 });
            for (let i = 0; i < 20; i++) parts.push({ x: b.x + rnd(-56, 56), y: FLOOR_Y - 4, vx: rnd(-2, 2), vy: rnd(-3, -0.5), life: 30, col: i % 2 ? '#c8ecff' : '#c9a24a', size: 2, grav: 1 });
            b.core = makeCore(b, b.x, b.y + 42, () => ({ x: boss.x, y: boss.y + 30 }));
            tip('core', '中のゴーストが出てきた！ 今だ、VACで吸い込め！', true); }
          if (overlapBossBody()) hurtPlayer(B.crashDamage, b.x, 'crash');
        } break; }
      case 'stuck': { const k = Math.min(1, b.t / 20); coreBob(b, b.x, b.y + 42 + k * 14); if (coreWindowOver(b)) { b.state = 'rise'; b.t = 0; } break; }
      case 'rise': b.y += (b.homeY - b.y) * 0.05; if (b.t > 70) { b.y = b.homeY; b.state = 'idle'; b.t = 0; } break;
    }
    if (b.state !== 'crash' && b.state !== 'stuck') b.x = b.px + swayX; else b.x = b.px;
    if ((b.state === 'idle' || b.state === 'candles' || b.state === 'shards' || b.state === 'wisps') && overlapBossBody()) hurtPlayer(B.contactDamage, b.x, 'chandelier');
  },
  dying(b) { b.y += Math.sin(b.t * 0.9) * 1.5; },
  onDefeat(b) { // the floor gives way + the float pedestal appears
    openGate('ballroom', 'floor'); cam.shake = 10; sfx('crash');
    for (const e of ents) if (e.type === 'ability') e.hidden = false;
    bossReward(b, b.x); say('……床、抜けちゃった。……下にも、まだお部屋があるみたい', 240);
    tip('floorGone', 'シャンデリアの重みで床が抜けた！ 台座の上で何かが光っている', true);
    velAppear('first', b.x > 192 ? 60 : 324, FLOOR_Y);   // v0.4: the secretary watches from the corner
  },
  draw(b, lights) {
    const x = Math.round(b.x - cam.x), y = Math.round(b.y - cam.y), blue = b.rage;
    if (b.state === 'candles' && b.marks.length) {
      const k = b.t / bossP('candleWarn');
      for (const mx of b.marks) { const xx = mx - cam.x, yy = FLOOR_Y - cam.y; g.fillStyle = (frame & 4) ? 'rgba(255,120,40,0.75)' : 'rgba(255,200,80,0.6)';
        g.beginPath(); g.ellipse(xx, yy - 1, 6 + k * 6, 2 + k, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,170,80,0.35)'; for (let yy2 = y + 40; yy2 < yy - 4; yy2 += 6) g.fillRect(Math.round(xx), yy2, 1, 3); }
    }
    if (b.state === 'shards' && b.shardV) {
      g.fillStyle = (frame & 4) ? 'rgba(200,236,255,0.7)' : 'rgba(200,236,255,0.35)';
      for (const v of b.shardV) { let px = b.x, py = b.y + 74, vx = v.vx, vy = v.vy; for (let s = 0; s < 90; s++) { px += vx; py += vy; vy += 0.06; if (py > FLOOR_Y) break; if (s % 5 === 0) g.fillRect(Math.round(px - cam.x), Math.round(py - cam.y), 1, 1); } }
    }
    if (b.state === 'crash') { const lock = b.t >= bossP('crashTrack'), sx = (lock ? b.px : b.shadowX) - cam.x, fy = FLOOR_Y - cam.y - 1;
      g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,60,60,0.7)' : 'rgba(0,0,0,0.65)') : 'rgba(0,0,0,0.6)'; g.beginPath(); g.ellipse(sx, fy, 54, 6, 0, 0, 7); g.fill();
      g.strokeStyle = lock ? '#ff5050' : 'rgba(255,220,160,0.8)'; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, fy, 55, 6.5, 0, 0, 7); g.stroke();
      g.fillStyle = lock ? 'rgba(255,80,80,0.5)' : 'rgba(255,220,160,0.3)'; for (const ox of [-54, 54]) for (let yy = Math.round(b.y - cam.y + 84); yy < fy; yy += 6) g.fillRect(Math.round(sx + ox), yy, 1, 3);
      if (lock && (frame & 4)) drawTextShadow('!', Math.round(sx), Math.round(fy - 20), 'r', 2, 'c'); }
    for (let yy = 2 * TS; yy < b.y; yy += 10) spr('boss', 'chain', Math.round(b.px - cam.x - 3), yy - cam.y);
    const key = b.rage ? 'chandelier_cracked' : 'chandelier', r = rectOf('boss', key);
    let jx = 0; if (b.state === 'crash' && b.t >= bossP('crashTrack')) jx = (frame & 2) ? 2 : -2;
    const c = b.core;
    if (!c || c.state === 'swallow') { if (b.state !== 'dying' || b.t < 90) { const mood = b.state === 'dying' ? 'dizzy' : b.rage || b.state === 'wisps' ? 'angry' : 'normal'; g.globalAlpha = 0.8; spr('boss', 'core_' + mood, x - 15 + jx, y + 27 + Math.round(Math.sin(frame * 0.08) * 2)); g.globalAlpha = 1; } }
    if (!(b.state === 'dying' && b.t >= 90)) {
      spr('boss', key, x - r.ax + jx, y);
      if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, x - r.ax + jx, y); g.globalAlpha = 1; }
      if (b.state === 'wisps' && b.t < 40) { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,200,120,' + (0.2 + 0.2 * Math.sin(frame * 0.5)) + ')'; g.beginPath(); g.arc(x, y + 42, 18 + b.t / 4, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; }
      const lit = b.state === 'sleep' ? 0 : b.state === 'intro' ? b.lit : 6, shake = (b.state === 'candles' && b.marks.length) ? ((frame & 2) ? 1 : -1) : 0;
      for (let i = 0; i < lit; i++) { const ox = BOSS_CANDLES[i]; spr('props', (blue ? 'bflame' : 'flame') + (((frame >> 2) + i) & 3), x + ox - 3 + jx, y + 22 + shake); lights.push({ x: b.x + ox, y: b.y + 26, r: 46, warm: !blue, blue }); }
      if (b.state === 'shards' && b.shardV) for (let i = 0; i < 6; i++) if (((frame >> 2) + i) % 4 === 0) { g.fillStyle = '#ffffff'; g.fillRect(x - 52 + i * 20, y + 52 + (i % 3) * 4, 2, 2); }
      if (b.state === 'stuck') for (let i = 0; i < 4; i++) { const an = frame * 0.12 + i * 1.57; g.fillStyle = '#ffe080'; g.fillRect(Math.round(x + Math.cos(an) * 40), Math.round(y + 18 + Math.sin(an) * 4), 2, 2); }
    }
    lights.push({ x: b.x, y: b.y + 42, r: 70, warm: 1 });
    drawCore(b, lights, 'core');
  },
};
function overlapBossBody() { const b = boss; hzLog(b.x - 50, b.y + 30, b.x + 50, b.y + 80); return hitsKanata(b.x - 50, b.y + 30, b.x + 50, b.y + 80); }
function dropCandle(x) {
  const B = CONFIG.boss;
  ebullets.push({ kind: 'candle', x: x - 3, y: boss.y + 30, w: 6, h: 12, vx: 0, vy: 1, g: 0.22, dmg: B.candleDamage, life: 200, suckable: true,
    onLand: (q) => { sfx('hit'); ebullets.push({ kind: 'firepatch', x: x - 11, y: FLOOR_Y - 10, w: 22, h: 10, vx: 0, vy: 0, dmg: B.fireDamage, life: B.candleFire, onExpire: () => spawnItem('candle', x, FLOOR_Y) }); } });
}
function spawnFireWisp(x, y) {
  const B = CONFIG.boss;
  ents.push(makeGhost('firewisp', x, y, { hp: B.wispHp, maxHp: B.wispHp, w: 14, h: 14, life: B.wispLife, catchable: true,
    onSwallowed() { if (P.tank.length < CONFIG.vac.tankMax) { P.tank.push('fireball'); sfx('stash'); tip('fireball', '火の玉をゲット！ SPITで撃つと強い（燃える）'); } } }));
}
function updateFireWisp(e) {
  const B = CONFIG.boss; e.life--;
  if (e.life <= 0) { e.dead = true; for (let i = 0; i < 8; i++) parts.push({ x: e.x, y: e.y, vx: rnd(-1.5, 1.5), vy: rnd(-1.5, 1.5), life: 18, col: '#ffb040', size: 2, glow: 1 }); return; }
  const dx = pcx() - e.x, dy = pcy() - 6 - e.y, d = Math.hypot(dx, dy) || 1;
  e.vx += dx / d * 0.04; e.vy += dy / d * 0.04; const sp = B.wispSpeed * (boss && boss.rage ? 1.25 : 1);
  const v = Math.hypot(e.vx, e.vy); if (v > sp) { e.vx *= sp / v; e.vy *= sp / v; }
  e.x += e.vx; e.y += e.vy + Math.sin(e.t * 0.15 + e.seed) * 0.4; clampGhost(e);
  if (frame % 5 === 0) parts.push({ x: e.x + rnd(-3, 3), y: e.y - 6, vx: 0, vy: -0.6, life: 12, col: '#ffb040', size: 1, glow: 1 });
  ghostTouchDamage(e, B.wispDamage);
}
// shared core drawing (sprite set prefix: core / gcore / rcore / ccore)
function drawCore(b, lights, pre) {
  const c = b.core; if (!c) return;
  if (c.state !== 'swallow') {
    const k = pre + (c.state === 'caught' ? '_tug' : '_dizzy'), cx = Math.round(c.x - cam.x), cy = Math.round(c.y - cam.y);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,200,100,0.25)'; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
    spr('boss', k, cx - 15 + (c.yankWarn > 0 && (frame & 2) ? 2 : 0), cy - 15);
    if (c.state === 'caught' && c.yankWarn > 0 && (frame & 4)) drawTextShadow('!', cx + 16, cy - 20, 'r', 2, 'c');
    if (c.state === 'out' && (frame >> 3) & 1) drawTextShadow('VAC!', cx, cy - 28, 'c', 1, 'c');
    if (c.catchT > 0 && c.state !== 'caught') { g.fillStyle = '#bff4ff'; const k2 = Math.min(1, c.catchT / (CONFIG.vac.catchFrames * 0.6)); for (let i = 0; i < 14 * k2; i++) { const an = -Math.PI / 2 + i / 14 * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(an) * 19), Math.round(cy + Math.sin(an) * 19), 1, 1); } }
    lights.push({ x: c.x, y: c.y, r: 50, warm: 1 });
  } else { const sc = Math.max(0.1, 1 - c.t / 18), rr = rectOf('boss', pre + '_tug'); g.drawImage(IMG.boss, rr.x, rr.y, rr.w, rr.h, Math.round(c.x - cam.x - rr.w * sc / 2), Math.round(c.y - cam.y - rr.h * sc / 2), Math.max(1, rr.w * sc | 0), Math.max(1, rr.h * sc | 0)); }
}
function drawFloorMark(x, k, col) { const xx = x - cam.x, yy = FLOOR_Y - cam.y; g.fillStyle = (frame & 4) ? col : 'rgba(255,230,160,0.6)'; g.beginPath(); g.ellipse(xx, yy - 1, 6 + k * 7, 2 + k, 0, 0, 7); g.fill(); }
