
// =====================================================================
//  BOSS: 呪いのシャンデリア グラン・ルミエール (GRAND LUMIERE) - a haunted chandelier in the ballroom
//  Hangs from a rail along the ceiling and follows Kanata. Every attack is telegraphed:
//    candles : candles glow + fire marks on the floor -> candles drop on the marks -> short fire patches (the candles left over = ammo)
//    wisps   : the core glows -> 2-3 fire wisps chase Kanata (vacuum them -> FIREBALL ammo, strong)
//    shards  : crystals glint + dotted fall paths -> a fan of crystal shards (some stay on the floor = ammo)
//    crash   : a shadow follows Kanata, flashes red (locks) -> the chandelier drops, floor shockwaves (jump)
//              -> it is STUCK and dizzy: the ghost core pops out = WEAK POINT. Vacuum it for a tug-of-war that drains the boss HP.
//  Damage: SPIT objects at the chandelier (4, fireball 7) + the core tug-of-war. Below 50% HP it is enraged (faster, more).
// =====================================================================
const FLOOR_Y = 15 * TS;
const BOSS_CANDLES = [-56, -40, -22, 22, 40, 56];
function makeBoss(x, y) {
  const B = CONFIG.boss;
  const b = { type: 'boss', hp: B.hp, maxHp: B.hp, state: 'sleep', t: 0, x, px: x, y: 48, homeY: 48, sway: 0, flash: 0, rage: false, lastAtk: '', atkN: 0, marks: [], lit: 0,
    core: null, shadowX: x, dead: false,
    hitTest(s) { if (this.state === 'sleep' || this.state === 'intro' || this.state === 'dying' || this.state === 'done') return false;
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2; return Math.abs(cx - this.x) < 52 && cy > this.y + 18 && cy < this.y + 76; },
    hitBy(s) { const dmg = s.kind === 'fireball' ? B.fireballDamage : B.spitDamage; this.damage(dmg); stats.bossHits++; },
    damage(n) { this.hp -= n; this.flash = 10; sfx('bhit'); if (this.core) this.core.hp = this.hp; if (this.hp <= B.hp / 2 && !this.rage) { this.rage = true; tip('rage', 'シャンデリアが怒った！ 炎が青くなった', true); cam.shake = 8; } if (this.hp <= 0) this.die(); },
    die() { if (this.state === 'dying' || this.state === 'done') return; this.hp = 0; endTug(true); this.state = 'dying'; this.t = 0; sfx('crash'); cam.shake = 12; for (const e of ents) if (e.type === 'firewisp') e.dead = true; ebullets.length = 0; },
    onSuck() { const c = this.core; if (!c || this.state !== 'stuck' || P.tug) return;
      if (rectInCone(c.x - 12, c.y - 12, 24, 24)) { c.catchT += 1; c.inCone = 3; if (c.catchT >= CONFIG.vac.catchFrames * 0.6) startTug(c); } },
  };
  return b;
}
function bossP(k) { const B = CONFIG.boss; return boss.rage && B[k + 'Rage'] !== undefined ? B[k + 'Rage'] : B[k]; }
function setGate(on) {
  for (let r = 11; r <= 14; r++) room.grid[r * room.cols] = on ? T_GATE : T_EMPTY;
  renderRoomStatic();
}
function updateBoss() {
  const b = boss, B = CONFIG.boss; if (!b) return;
  b.t++; if (b.flash > 0) b.flash--;
  const trackTo = (tx, sp) => { tx = clamp(tx, 72, room.W - 72); b.px += clamp(tx - b.px, -sp, sp); };
  const swayX = Math.sin(frame * 0.025) * 6;
  switch (b.state) {
    case 'sleep':
      b.x = b.px; b.y = b.homeY;
      if (P.x > 6 * TS && P.onGround) { b.state = 'intro'; b.t = 0; setGate(true); sfx('door'); cam.shake = 4; stats.bossStarted = true; }
      return;
    case 'intro':
      b.lit = Math.min(6, Math.floor(b.t / 14));
      if (b.t % 14 === 0 && b.t <= 84) sfx('chime');
      if (b.t === 100) cam.shake = 6;
      if (b.t >= 230 || (b.t > 120 && inp.startPressed)) { b.state = 'idle'; b.t = 0; b.lit = 6; }
      break;
    case 'idle':
      trackTo(pcx(), bossP('trackSpeed'));
      if (b.t >= bossP('idle')) chooseBossAttack();
      break;
    case 'candles': {
      trackTo(pcx(), 0.3);
      const warn = bossP('candleWarn');
      if (b.t === 1) { const n = bossP('candles'), px = pcx(); b.marks = [];
        const xs = [px]; for (let k = 1; xs.length < n; k++) { xs.push(px + k * 58); if (xs.length < n) xs.push(px - k * 58); }
        for (const x of xs) b.marks.push(clamp(x, 28, room.W - 28)); sfx('warn'); }
      if (b.t === warn) { for (const mx of b.marks) dropCandle(mx); b.marks = []; }
      if (b.t >= warn + 30) { b.state = 'idle'; b.t = 0; }
      break; }
    case 'wisps':
      if (b.t === 40) { const n = bossP('wispCount'); for (let i = 0; i < n; i++) spawnFireWisp(b.x + (i - (n - 1) / 2) * 34, b.y + 70); sfx('chime'); }
      if (b.t >= 70) { b.state = 'idle'; b.t = 0; }
      break;
    case 'shards': {
      const warn = bossP('shardWarn');
      if (b.t === 1) { const n = bossP('shards'); b.shardV = [];
        for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 2.2; b.shardV.push({ vx: Math.sin(a) * 2.4, vy: Math.cos(a) * 1.2 + 0.4 }); } sfx('warn'); }
      if (b.t === warn) { b.shardV.forEach((v, i) => ebullets.push({ kind: 'shard', x: b.x - 4, y: b.y + 70, w: 8, h: 10, vx: v.vx, vy: v.vy, g: 0.06, dmg: B.shardDamage, life: 240,
        onLand: (q) => { sfx('tink'); for (let k = 0; k < 4; k++) parts.push({ x: q.x + 4, y: q.y + 8, vx: rnd(-1.5, 1.5), vy: rnd(-2, 0), life: 16, col: '#c8ecff', size: 1, grav: 1 }); if (i % 2 === 0) spawnItem('crystal', q.x + 4, Math.min(q.y + q.h, FLOOR_Y)); } })); sfx('tink'); b.shardV = null; }
      if (b.t >= warn + 40) { b.state = 'idle'; b.t = 0; }
      break; }
    case 'crash': {
      const tr = bossP('crashTrack');
      if (b.t < tr) { b.shadowX += clamp(pcx() - b.shadowX, -B.crashFollow, B.crashFollow); trackTo(b.shadowX, 3); if (b.t % 16 === 0) sfx('warn'); }
      else if (b.t < tr + B.crashLock) { trackTo(b.shadowX, 3); }
      else { // fall
        b.vy = (b.vy || 0) + 0.6; b.y += b.vy;
        if (b.y + 84 >= FLOOR_Y) { b.y = FLOOR_Y - 84; b.vy = 0; b.state = 'stuck'; b.t = 0; sfx('crash'); cam.shake = 10; hitStop = 5;
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', x: b.x + d * 50 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: d * B.waveSpeed, vy: 0, dmg: B.waveDamage, life: 200 });
          for (let i = 0; i < 20; i++) parts.push({ x: b.x + rnd(-56, 56), y: FLOOR_Y - 4, vx: rnd(-2, 2), vy: rnd(-3, -0.5), life: 30, col: i % 2 ? '#c8ecff' : '#c9a24a', size: 2, grav: 1 });
          b.core = { ghost: true, boss: true, x: b.x, y: b.y + 42, hp: b.hp, maxHp: b.maxHp, state: 'out', t: 0, catchT: 0, seed: 3, inCone: 0,
            onDrain(d) { this.drained = (this.drained || 0) + d; boss.hp = this.hp;
              if (this.drained >= B.coreCap && boss.hp > 0 && P.tug === this) { endTug(false); this.state = 'flee'; boss.t = Math.max(boss.t, bossP('stuck') - 20); tip('coreBreak', 'コアがふりほどいた！ もう一度落とさせよう', true); } if (boss.hp <= boss.maxHp / 2 && !boss.rage) boss.damage(0); },
            onCaptured() { boss.die(); },
            clampTug() { const dx = this.x - boss.x, dy = this.y - (boss.y + 30); const d = Math.hypot(dx, dy); if (d > 120) { this.x = boss.x + dx / d * 120; this.y = boss.y + 30 + dy / d * 120; } } };
          tip('core', '中のゴーストが出てきた！ 今だ、VACで吸い込め！', true);
        }
        if (overlapBossBody()) hurtPlayer(B.crashDamage, b.x, 'crash');
      }
      break; }
    case 'stuck': {
      const c = b.core;
      if (c && c.state !== 'caught' && c.state !== 'swallow') { // core bobs out of the globe, dizzy
        const k = Math.min(1, b.t / 20); c.x = b.x + Math.sin(b.t * 0.05) * 22; c.y = b.y + 42 + k * 14 + Math.sin(b.t * 0.11) * 4; // drops out under the globe, at nozzle height
        if (c.inCone > 0) c.inCone--; else c.catchT = Math.max(0, c.catchT - 1);
      }
      if (b.t >= bossP('stuck') && !(c && c.state === 'swallow')) { if (P.tug === c) { endTug(false); tip('coreEsc', 'コアが逃げた！ また落ちてくるのを待とう', true); } b.core = null; b.state = 'rise'; b.t = 0; }
      break; }
    case 'rise':
      b.y += (b.homeY - b.y) * 0.05; if (b.t > 70) { b.y = b.homeY; b.state = 'idle'; b.t = 0; }
      break;
    case 'dying':
      b.y += Math.sin(b.t * 0.9) * 1.5;
      if (b.t % 6 === 0) { parts.push({ x: b.x + rnd(-60, 60), y: b.y + rnd(20, 80), vx: rnd(-2, 2), vy: rnd(-2, 1), life: 34, col: ['#ffe080', '#c8ecff', '#ffffff'][b.t % 3], size: 3, glow: 1, grav: 1 }); sfx('tink'); }
      if (b.t === 90) { sfx('crash'); cam.shake = 14; for (let i = 0; i < 40; i++) parts.push({ x: b.x + rnd(-60, 60), y: b.y + rnd(10, 80), vx: rnd(-3, 3), vy: rnd(-4, 0), life: 50, col: i % 3 ? '#c8ecff' : '#c9a24a', size: 2, grav: 1 }); }
      if (b.t >= 200) { b.state = 'done'; progress.bossDone = true; setGate(false); startClear(); }
      break;
  }
  if (b.state !== 'crash' && b.state !== 'stuck' && b.state !== 'dying') b.x = b.px + swayX; else b.x = b.px;
  if ((b.state === 'idle' || b.state === 'candles' || b.state === 'shards' || b.state === 'wisps') && overlapBossBody()) hurtPlayer(B.contactDamage, b.x, 'chandelier');
}
function overlapBossBody() { const b = boss; return P.x < b.x + 54 && P.x + P.w > b.x - 54 && P.y < b.y + 80 && P.y + P.h > b.y + 30; }
function chooseBossAttack() {
  const b = boss; b.atkN++;
  let pick;
  const wispsAlive = ents.filter(e => e.type === 'firewisp' && !e.dead).length;
  if (b.atkN % 3 === 0) pick = 'crash';
  else { const opts = ['candles', 'shards', 'wisps'].filter(k => k !== b.lastAtk && !(k === 'wisps' && wispsAlive > 0)); pick = opts[Math.floor(Math.random() * opts.length)]; }
  if (location.search.includes('bossatk=')) pick = new URLSearchParams(location.search).get('bossatk');
  b.lastAtk = pick; b.state = pick; b.t = 0; b.shadowX = b.x; b.vy = 0;
}
function dropCandle(x) {
  const B = CONFIG.boss;
  ebullets.push({ kind: 'candle', x: x - 3, y: boss.y + 30, w: 6, h: 12, vx: 0, vy: 1, g: 0.22, dmg: B.candleDamage, life: 200, suckable: true,
    onLand: (q) => { sfx('hit'); ebullets.push({ kind: 'firepatch', x: x - 11, y: FLOOR_Y - 10, w: 22, h: 10, vx: 0, vy: 0, dmg: B.fireDamage, life: B.candleFire, onExpire: () => spawnItem('candle', x, FLOOR_Y) }); } });
}
function spawnFireWisp(x, y) {
  const B = CONFIG.boss;
  ents.push(makeGhost('firewisp', x, y, { hp: B.wispHp, maxHp: B.wispHp, w: 14, h: 14, life: B.wispLife, catchable: true,
    onSwallowed() { if (P.tank.length < CONFIG.vac.tankMax) { P.tank.push('fireball'); sfx('stash'); tip('fireball', '火の玉をゲット！ SPITで撃つと強い'); } } }));
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
