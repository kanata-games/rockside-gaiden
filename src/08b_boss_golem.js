
// =====================================================================
//  BOSS 2: リネン・ゴーレム LINEN GOLEM (great washroom) - a heap of haunted laundry that walks
//    slam    : arms rise + red flash -> slams the floor: shockwaves both ways (jump). A bottle falls off the shelf (ammo)
//    bubbles : cheeks puff -> soap bubbles drift after Kanata (vacuum them = SOAP ammo, splash damage)
//    roll    : (every 3rd) spins up into a laundry ball (dust + red flash) -> rolls across the room (jump over it)
//              -> smacks the wall, unravels DIZZY: the sock-ghost core pops out = weak point (tug-of-war)
// =====================================================================
BOSS_DEFS.golem = { jp: 'リネン・ゴーレム', en: 'LINEN GOLEM', cfg: 'golem', cols: ['#e8f4ff', '#a8c8e8', '#ffffff', '#7ab0d8'], rageText: 'ゴーレムが怒った！ 泡だらけになった',
  sayIntro: '……洗濯物の山が、立ち上がった。……ちょっと、くさい', sayCore: '……くつした？ ……吸っちゃえ',
  make(b) { b.face = -1; b.vx = 0; b.ball = false; },
  hitBox(b) { return b.ball ? { x0: b.x - 22, x1: b.x + 22, y0: FLOOR_Y - 44, y1: FLOOR_Y } : { x0: b.x - 28, x1: b.x + 28, y0: FLOOR_Y - 76, y1: FLOOR_Y }; },
  aim(b) { return { x: b.x, y: b.ball ? FLOOR_Y - 22 : FLOOR_Y - 46 }; },
  update(b) {
    const C = CONFIG.golem, dx = pcx() - b.x;
    const walk = sp => { b.face = Math.sign(dx) || b.face; if (Math.abs(dx) > 70) b.x += b.face * sp; b.x = clamp(b.x, 44, room.W - 44); };
    switch (b.state) {
      case 'idle': walk(bossP('walk')); if (b.t >= bossP('idle')) chooseAttack(b, ['slam', 'bubbles'], 'roll'); break;
      case 'slam': {
        const warn = bossP('slamWarn'); if (b.t === 1) { b.face = Math.sign(dx) || b.face; sfx('warn'); }
        if (b.t < warn && b.t % 10 === 0) sfx('warn');
        if (b.t === warn) { sfx('boom'); cam.shake = 9; hitStop = 3;
          for (const d of [-1, 1]) ebullets.push({ kind: 'suds', x: b.x + d * 30 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: d * C.waveSpeed * (b.rage ? 1.15 : 1), vy: 0, dmg: C.slamDamage, life: 220 });
          if (overlapBox(b.x - 44, FLOOR_Y - 40, b.x + 44, FLOOR_Y)) hurtPlayer(C.slamDamage, b.x, 'slam');
          for (let i = 0; i < 18; i++) parts.push({ x: b.x + rnd(-40, 40), y: FLOOR_Y - 4, vx: rnd(-2, 2), vy: rnd(-3, -0.5), life: 30, col: i & 1 ? '#e8f4ff' : '#8ac0e8', size: 2, grav: 1 });
          const fx = clamp(pcx() + rnd(-60, 60), 30, room.W - 30); ebullets.push({ kind: 'dropbottle', x: fx - 4, y: 40, w: 8, h: 14, vx: 0, vy: 0.5, g: 0.2, dmg: 1, life: 200, suckable: true, ammo: 'bottle', onLand: q => spawnItem('bottle', q.x + 4, FLOOR_Y) }); }
        if (b.t >= warn + 40) { b.state = 'idle'; b.t = 0; } break; }
      case 'bubbles': {
        if (b.t === 1) sfx('warn');
        const n = bossP('bubbles'), t0 = 34;
        if (b.t >= t0 && (b.t - t0) % 14 === 0 && (b.t - t0) / 14 < n) { sfx('bubble');
          const bx = b.x + b.face * 26, by = FLOOR_Y - 58;
          ebullets.push({ kind: 'bubble', x: bx - 8, y: by - 8, w: 16, h: 16, vx: b.face * 0.9, vy: rnd(-0.6, 0.2), g: 0, dmg: C.bubbleDamage, life: 330, suckable: true, ammo: 'soap', home: 1, static: 1,
            onExpire: q => { if (Math.random() < 0.5) spawnItem('soap', q.x + 8, q.y + 16); for (let k = 0; k < 6; k++) parts.push({ x: q.x + 8, y: q.y + 8, vx: rnd(-1, 1), vy: rnd(-1, 1), life: 14, col: '#e8fbff', size: 1 }); } }); }
        if (b.t >= t0 + n * 14 + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'roll': {
        const warn = bossP('spinWarn');
        if (b.t === 1) { b.face = Math.sign(dx) || b.face; sfx('warn'); }
        if (b.t < warn) { if (b.t % 8 === 0) sfx('warn'); if (b.t > warn * 0.4) b.ball = true; if (frame % 2 === 0) parts.push({ x: b.x + rnd(-24, 24), y: FLOOR_Y - rnd(0, 8), vx: rnd(-1.5, 1.5), vy: -rnd(0.2, 1), life: 18, col: '#a8a0b0', size: 2 }); break; }
        b.ball = true; b.x += b.face * bossP('spinSpeed');
        if (overlapBox(b.x - 20, FLOOR_Y - 40, b.x + 20, FLOOR_Y)) hurtPlayer(C.spinDamage, b.x, 'roll');
        if (b.x < 36 || b.x > room.W - 36) { b.x = clamp(b.x, 36, room.W - 36); b.state = 'dizzy'; b.t = 0; b.ball = false; b.winLen = bossP('dizzy'); sfx('crash'); cam.shake = 10; hitStop = 4;
          b.core = makeCore(b, b.x - b.face * 34, FLOOR_Y - 30, () => ({ x: boss.x, y: FLOOR_Y - 40 }), 'gcore');
          tip('gcore', 'ゴーレムが目を回した！ 中のくつ下ゴーストを VAC で吸い込め！', true); }
        break; }
      case 'dizzy': coreBob(b, b.x - b.face * 34, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'reform'; b.t = 0; } break;
      case 'reform': if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
    if ((b.state === 'idle' || b.state === 'bubbles') && overlapBox(b.x - 24, FLOOR_Y - 70, b.x + 24, FLOOR_Y)) hurtPlayer(C.contactDamage, b.x, 'golem');
  },
  dying(b) { b.ball = false; },
  onDefeat(b) { bossReward(b, b.x); say('……洗濯物、ぜんぶ畳んだ。……ふぅ', 200); tip('golemDown', 'リネン・ゴーレムをやっつけた！ 屋敷のどこかで、まだ気配がする…', true); },
  draw(b, lights) {
    const x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y), fl = b.face > 0;
    if (b.state === 'slam' && b.t < bossP('slamWarn')) { const k = b.t / bossP('slamWarn'); g.fillStyle = (frame & 4) ? 'rgba(255,80,80,0.45)' : 'rgba(255,200,120,0.3)'; g.beginPath(); g.ellipse(x, y - 1, 30 + k * 20, 3 + k * 2, 0, 0, 7); g.fill(); }
    if (b.state === 'roll' && b.t < bossP('spinWarn')) { g.fillStyle = 'rgba(255,80,80,0.35)'; const dir = b.face; for (let i = 0; i < 8; i++) if (((frame >> 2) + i) % 3 === 0) g.fillRect(x + dir * (30 + i * 16), y - 3, 8, 2); }
    let key;
    if (b.state === 'dying' && b.t >= 90) return;
    if (b.ball) key = 'golem_ball' + ((frame >> 2) & 3);
    else if (b.state === 'slam') key = b.t < bossP('slamWarn') ? 'golem_raise' : 'golem_slam';
    else if (b.state === 'bubbles') key = 'golem_puff';
    else if (b.state === 'dizzy' || b.state === 'dying' || b.state === 'reform') key = 'golem_dizzy';
    else key = 'golem_idle' + ((frame >> 4) & 1);
    const r = rectOf('boss', key); let sx = x - (r.w >> 1), sy = y - r.h;
    if ((b.state === 'slam' && b.t < bossP('slamWarn')) || (b.state === 'roll' && b.t < bossP('spinWarn'))) sx += (frame & 2) ? 1 : -1;
    spr('boss', key, sx, sy, fl);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, fl); g.globalAlpha = 1; }
    if ((b.state === 'slam' && b.t < bossP('slamWarn') && (frame & 4)) || (b.state === 'roll' && b.t < bossP('spinWarn') && (frame & 4))) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, fl, '#ff4040'); g.globalAlpha = 1; }
    if (b.state === 'dizzy') for (let i = 0; i < 4; i++) { const an = frame * 0.12 + i * 1.57; g.fillStyle = '#ffe080'; g.fillRect(Math.round(x + Math.cos(an) * 22), Math.round(y - 74 + Math.sin(an) * 4), 2, 2); }
    lights.push({ x: b.x, y: FLOOR_Y - 40, r: 60, cool: 1 });
    drawCore(b, lights, 'gcore');
  },
};
