
// =====================================================================
//  BOSS 3: 夜咲きの女王 マダム・ローズ MADAME ROSE (night-bloom rose bed) - a giant haunted rose, rooted in the bed
//    thorns : glowing marks on the floor -> thorn spikes burst out of the ground
//    seeds  : the bulb swells -> seed pods arc toward Kanata; the ones that land become SEED ammo (they burn!)
//    petals : petals glow + a guide line LOW (jump) or HIGH (stay on the floor) -> a petal stream sweeps the room
//    bloom  : (every 3rd) the flower opens wide, sneezes pollen and droops: the ghost core peeks out = weak point.
//             afterwards she burrows and comes up on the other side of the bed.
//  Fire is super effective (burnBonus).
// =====================================================================
BOSS_DEFS.rose = { jp: '夜咲きの女王 マダム・ローズ', en: 'MADAME ROSE', cfg: 'rose', cols: ['#ff5d8a', '#ffb0c8', '#6ad08a', '#ffffff'], rageText: 'マダム・ローズが怒った！ 花びらが真っ赤に',
  sayIntro: '……おっきいバラ。……お水、あげすぎた？', sayCore: '……花の中に、ゴーストがいた',
  make(b) { b.x = 300; b.side = 1; b.headY = FLOOR_Y - 110; b.droop = 0; b.burrow = 0; },
  head(b) { return { x: b.x - b.side * 6, y: b.headY + b.droop * 70 }; },
  hitBox(b) { const h = this.head(b); return { x0: h.x - 30, x1: h.x + 30, y0: h.y - 26, y1: Math.max(h.y + 26, FLOOR_Y - 10) }; },
  aim(b) { if (b.burrow) return null; const h = this.head(b); return { x: h.x, y: h.y }; },
  update(b) {
    const C = CONFIG.rose, D = this;
    switch (b.state) {
      case 'idle': if (b.t >= bossP('idle')) chooseAttack(b, ['thorns', 'seeds', 'petals'], 'bloom'); break;
      case 'thorns': {
        const warn = bossP('thornWarn');
        if (b.t === 1) { const n = bossP('thorns'), px = pcx(); b.marks = [clamp(px, 20, room.W - 20)]; for (let k = 1; b.marks.length < n; k++) { b.marks.push(clamp(px + k * 52, 20, room.W - 20)); if (b.marks.length < n) b.marks.push(clamp(px - k * 52, 20, room.W - 20)); } sfx('warn'); }
        if (b.t < warn && b.t % 12 === 0) sfx('warn');
        if (b.t === warn) { for (const mx of b.marks) ebullets.push({ kind: 'thorn', x: mx - 8, y: FLOOR_Y - 44, w: 16, h: 44, vx: 0, vy: 0, g: 0, dmg: C.thornDamage, life: 34, static: 1 }); b.marks = []; sfx('thorn'); cam.shake = 4; }
        if (b.t >= warn + 40) { b.state = 'idle'; b.t = 0; } break; }
      case 'seeds': {
        if (b.t === 1) sfx('warn');
        const n = bossP('seeds');
        if (b.t === 36) { const h = D.head(b); sfx('spit');
          for (let i = 0; i < n; i++) { const tx = clamp(pcx() + (i - (n - 1) / 2) * 44, 20, room.W - 20), tf = 56, gg = 0.12, vx = (tx - h.x) / tf, vy = (FLOOR_Y - 8 - h.y - 0.5 * gg * tf * tf) / tf;
            ebullets.push({ kind: 'seedpod', x: h.x - 5, y: h.y - 5, w: 10, h: 10, vx, vy, g: gg, dmg: C.seedDamage, life: 200, suckable: true, ammo: 'seed', tx, onLand: q => { spawnItem('seed', q.x + 5, FLOOR_Y); sfx('hit'); } }); } }
        if (b.t >= 80) { b.state = 'idle'; b.t = 0; } break; }
      case 'petals': {
        const warn = bossP('petalWarn');
        if (b.t === 1) { b.petalHigh = Math.random() < 0.45; sfx('warn'); }
        if (b.t < warn && b.t % 12 === 0) sfx('warn');
        if (b.t >= warn && b.t < warn + 48 && (b.t - warn) % 8 === 0) { const h = D.head(b), y = b.petalHigh ? FLOOR_Y - 76 : FLOOR_Y - 14;
          ebullets.push({ kind: 'petal', x: h.x - 6, y: y + rnd(-3, 3), w: 12, h: 8, vx: -b.side * bossP('petalSpeed') * (b.rage ? 1.2 : 1), vy: 0, g: 0, dmg: C.petalDamage, life: 260, static: 1, wall: 1 }); sfx('flap'); }
        if (b.t >= warn + 80) { b.state = 'idle'; b.t = 0; } break; }
      case 'bloom': {
        if (b.t === 1) { sfx('warn'); }
        if (b.t < 50) { if (b.t % 10 === 0) sfx('warn'); break; }
        if (b.t === 50) { sfx('puff'); cam.shake = 5; const h = D.head(b); for (let i = 0; i < 30; i++) parts.push({ x: h.x, y: h.y, vx: rnd(-3, 3), vy: rnd(-2.5, 1), life: 40, col: i & 1 ? '#ffe080' : '#fff4c0', size: 2, glow: 1 }); }
        b.droop = Math.min(1, (b.t - 50) / 24);
        if (b.t === 74) { b.state = 'wilt'; b.t = 0; b.winLen = bossP('bloom'); const h = D.head(b);
          b.core = makeCore(b, h.x - b.side * 30, FLOOR_Y - 30, () => { const hh = BOSS_DEFS.rose.head(boss); return { x: hh.x, y: hh.y }; }, 'rcore');
          tip('rcore', 'バラがしおれた！ 花の中のゴーストを VAC で吸い込め！', true); }
        break; }
      case 'wilt': { const h = D.head(b); coreBob(b, h.x - b.side * 30, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'burrow'; b.t = 0; } break; }
      case 'burrow': {
        b.droop = Math.max(0, 1 - b.t / 20);
        if (b.t === 20) { b.burrow = 1; sfx('boom'); cam.shake = 4; for (let i = 0; i < 20; i++) parts.push({ x: b.x + rnd(-20, 20), y: FLOOR_Y - 2, vx: rnd(-2, 2), vy: rnd(-3, -1), life: 26, col: '#5a3a1a', size: 2, grav: 1 }); }
        if (b.t === 60) { b.side = -b.side; b.x = b.side > 0 ? 300 : 84; if (Math.abs(pcx() - b.x) < 40) b.x += b.side * 30; b.burrow = 0; sfx('boom'); for (let i = 0; i < 20; i++) parts.push({ x: b.x + rnd(-20, 20), y: FLOOR_Y - 2, vx: rnd(-2, 2), vy: rnd(-3, -1), life: 26, col: '#5a3a1a', size: 2, grav: 1 }); }
        if (b.t >= 90) { b.state = 'idle'; b.t = 0; } break; }
    }
    if (!b.burrow && b.state !== 'wilt' && overlapBox(b.x - 12, FLOOR_Y - 90, b.x + 12, FLOOR_Y)) hurtPlayer(C.contactDamage, b.x, 'rose');
  },
  onDefeat(b) { bossReward(b, b.x); say('……バラ、しずかになった。……いい匂い', 200); tip('roseDown', 'マダム・ローズをやっつけた！', true); },
  draw(b, lights) {
    const D = this, h = D.head(b), fl = b.side < 0;
    if (b.state === 'thorns' && b.marks.length) { const k = b.t / bossP('thornWarn'); for (const mx of b.marks) drawFloorMark(mx, k, 'rgba(255,60,120,0.75)'); }
    if (b.state === 'seeds' && b.t < 36) { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,200,80,' + (0.15 + 0.15 * Math.sin(frame * 0.6)) + ')'; g.beginPath(); g.arc(h.x - cam.x, h.y - cam.y, 30 + b.t / 3, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; }
    if (b.state === 'petals' && b.t < bossP('petalWarn')) { const y = (b.petalHigh ? FLOOR_Y - 72 : FLOOR_Y - 10) - cam.y; g.fillStyle = (frame & 4) ? 'rgba(255,90,140,0.6)' : 'rgba(255,200,220,0.3)'; for (let x = 0; x < VW; x += 10) g.fillRect(x, Math.round(y), 5, 2);
      drawText(b.petalHigh ? 'HIGH' : 'LOW', Math.round(h.x - cam.x - b.side * 40), Math.round(y - 10), 'p', 1, 'c'); }
    if (b.state === 'dying' && b.t >= 90) return;
    if (b.burrow) { spr('boss', 'rose_mound', Math.round(b.x - cam.x - 20), Math.round(FLOOR_Y - cam.y - 10)); return; }
    const sway = Math.round(Math.sin(frame * 0.03) * 2);
    // stem + leaves
    const sk = 'rose_stem', sr = rectOf('boss', sk); spr('boss', sk, Math.round(b.x - cam.x - sr.w / 2), Math.round(FLOOR_Y - cam.y - sr.h), fl);
    // head
    const key = b.state === 'wilt' || b.state === 'dying' ? 'rose_wilt' : b.state === 'bloom' ? 'rose_bloom' : b.rage ? 'rose_rage' : 'rose_head';
    const r = rectOf('boss', key), hx = Math.round(h.x - cam.x - r.w / 2 + sway), hy = Math.round(h.y - cam.y - r.h / 2);
    spr('boss', key, hx, hy, fl);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, hx, hy, fl); g.globalAlpha = 1; }
    if ((b.state === 'thorns' || b.state === 'petals') && b.t < 40 && (frame & 4)) { g.globalAlpha = 0.35; sprWhite('boss', key, hx, hy, fl, '#ff3060'); g.globalAlpha = 1; }
    if (b.state === 'wilt') for (let i = 0; i < 4; i++) { const an = frame * 0.12 + i * 1.57; g.fillStyle = '#ffe080'; g.fillRect(Math.round(h.x - cam.x + Math.cos(an) * 24), Math.round(h.y - cam.y - 30 + Math.sin(an) * 4), 2, 2); }
    lights.push({ x: h.x, y: h.y, r: 70, warm: 1 });
    drawCore(b, lights, 'rcore');
  },
};
