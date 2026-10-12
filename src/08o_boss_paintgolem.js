
// =====================================================================
//  AREA BOSS (v0.6): 絵の具ゴーレム パレットン PALETTON, THE PAINT GOLEM (絵の中の世界 / the palette throne)
//    A hulking golem of wet oil paint the master never finished. Not a friend character.
//    splat : gold marks -> paint blobs rain onto them (two waves; the 2nd fills the gaps)
//    brush : a paint stroke rolls toward Kanata along the floor, then a second one rolls back from the far wall (jump each)
//    drip  : red columns (one under Kanata, one beside) -> thick paint pours straight down there
//    leap  : (every 3rd) it jumps out of the picture; its shadow follows Kanata, LOCKS (flashing) -> it crashes down,
//            splatters and melts into a puddle: the PALETTE CORE is left bare = weak point
//    rage  : (50%) shorter warnings, more blobs
// =====================================================================
BOSS_DEFS.paintgolem = { jp: '絵の具ゴーレム パレットン', en: 'PALETTON, THE PAINT GOLEM', cfg: 'paintgolem', cols: ['#e84a4a', '#f0c030', '#3a8ae8', '#4ac86a'],
  rageText: '絵の具が煮えたった！ パレットンが本気になった',
  sayIntro: '……描きかけのまま、ずっと待ってたんだね。……グリム、汚れても平気？', sayCore: '……溶けた！ パレットのコアが見えた、今だよ',
  make(b) { b.face = -1; b.jy = 0; b.tx = b.x; b.pose = 'idle'; b.markR = 22; b.shadow = null; },
  hitBox(b) { return b.pose === 'melt' ? { x0: b.x - 36, x1: b.x + 36, y0: FLOOR_Y - 46, y1: FLOOR_Y } : { x0: b.x - 26, x1: b.x + 26, y0: FLOOR_Y - 88 - b.jy, y1: FLOOR_Y - b.jy }; },
  aim(b) { return { x: b.x, y: b.pose === 'melt' ? FLOOR_Y - 20 : FLOOR_Y - 66 - b.jy }; },
  update(b) {
    const C = CONFIG.paintgolem, px = clamp(pcx(), 16, room.W - 16);
    if (b.state === 'idle') b.face = Math.sign(pcx() - b.x) || b.face;
    switch (b.state) {
      case 'idle': b.pose = b.rage ? 'rage' : 'idle'; b.markR = 22;
        if (b.t === 1) b.tx = pcx() < 192 ? rnd(250, 320) : rnd(64, 134);
        b.x += clamp(b.tx - b.x, -0.9, 0.9);
        if (b.t >= bossP('idle')) chooseAttack(b, ['splat', 'brush', 'drip'], 'leap'); break;
      case 'splat': {
        const warn = bossP('splatWarn'), T2 = warn + 26;
        if (b.t === 1 || b.t === T2) { const n = bossP('blobs'), xs = []; b.pose = 'raise';
          if (b.t === 1) { xs.push(px); for (let k = 1; xs.length < n; k++) { xs.push(px + k * 84); if (xs.length < n) xs.push(px - k * 84); } }
          else for (const m of b.first) xs.push(m - 42);
          b.marks = xs.map(x => clamp(x, 16, room.W - 16)); if (b.t === 1) b.first = b.marks.slice(0); b.mT = b.t; sfx('warn');
          tip('psplat', '金色の印に、絵の具が降ってくる！ 二回目は印のすきま'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { b.pose = 'splat'; b.marks.forEach((mx, i) => ebullets.push({ kind: 'blob', spr: 'paintblob' + (i % 4), x: mx - 6, y: 2 * TS, w: 12, h: 12, vx: 0, vy: 2.5, g: 0.34, dmg: C.blobDamage, life: 200,
              onLand: q => { sfx('splash'); for (let k = 0; k < 6; k++) parts.push({ x: q.x + 6, y: FLOOR_Y - 3, vx: rnd(-1.8, 1.8), vy: rnd(-2.2, -0.6), life: 16, col: BOSS_DEFS.paintgolem.cols[i % 4], size: 2, grav: 1 }); } }));
          sfx('whoosh'); }
        if (b.t === b.mT + warn + 30) b.marks = [];
        if (b.t >= T2 + warn + 40) { b.marks = []; b.pose = 'idle'; b.state = 'idle'; b.t = 0; } break; }
      case 'brush': {
        const warn = bossP('brushWarn');
        if (b.t === 1) { b.pose = 'raise'; b.bd = Math.sign(pcx() - b.x) || 1; sfx('warn'); tip('pbrush', '絵の具の波が床を走ってくる！ ジャンプでとびこえよう… 壁から戻ってくるのにも注意'); }
        if (b.t < warn && b.t % 8 === 0) sfx('tick');
        if (b.t === warn) { b.pose = 'splat'; sfx('splash'); cam.shake = 3;
          ebullets.push({ kind: 'wave', spr: 'paintwave', x: b.x + b.bd * 30 - 10, y: FLOOR_Y - 16, w: 20, h: 16, vx: b.bd * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 220 }); }
        if (b.t === warn + 70) { sfx('splash'); const sx = b.bd > 0 ? room.W - 40 : 20;
          ebullets.push({ kind: 'wave', spr: 'paintwave', x: sx, y: FLOOR_Y - 16, w: 20, h: 16, vx: -b.bd * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 220 }); }
        if (b.t >= warn + 150) { b.pose = 'idle'; b.state = 'idle'; b.t = 0; } break; }
      case 'drip': {
        const warn = bossP('dripWarn');
        if (b.t === 1) { const off = (px < room.W / 2 ? 1 : -1) * rnd(90, 130); b.marks = [px, clamp(px + off, 24, room.W - 24)]; b.markR = 22; b.pose = 'raise'; sfx('warn');
          tip('pdrip', '赤い印の上から、絵の具がどっと流れ落ちる！ 印の外へ'); }
        if (b.t < warn) { if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === warn) { b.pose = 'splat'; sfx('splash'); cam.shake = 4; for (const mx of b.marks) ebullets.push({ kind: 'paintcol', x: mx - 14, y: 2 * TS, w: 28, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.dripDamage, life: 22, static: 1 }); }
        if (b.t === warn + 22) b.marks = [];
        if (b.t >= warn + 50) { b.pose = 'idle'; b.state = 'idle'; b.t = 0; } break; }
      case 'leap': {
        const up = 30, tr = C.shadowTrack, lk = bossP('shadowLock');
        if (b.t === 1) { b.pose = 'raise'; sfx('warn'); tip('pleap', 'パレットンが絵の外へ跳んだ！ 影が追ってくる… 点滅したら止まる、影から逃げて！'); }
        if (b.t <= up) { b.jy = (b.t / up) * 320; break; }
        if (b.t === up + 1) { b.shadow = { x: pcx() }; b.markR = 40; }
        if (b.t < up + tr) b.shadow.x += clamp(pcx() - b.shadow.x, -1.6, 1.6);
        if (b.t < up + tr + lk) { b.marks = [b.shadow.x]; b.x = b.shadow.x; if (b.t % 8 === 0) sfx('warn'); break; }
        const f = b.t - (up + tr + lk);
        if (f < 12) { b.jy = 320 * (1 - (f + 1) / 12); break; }
        if (f === 12) { b.jy = 0; b.marks = []; sfx('crash'); cam.shake = 10; hitStop = 3; b.pose = 'melt';
          if (overlapBox(b.x - 40, FLOOR_Y - 90, b.x + 40, FLOOR_Y)) hurtPlayer(C.crashDamage, b.x, 'crash');
          for (let k = 0; k < 16; k++) parts.push({ x: b.x + rnd(-30, 30), y: FLOOR_Y - 6, vx: rnd(-3, 3), vy: rnd(-3.5, -1), life: 22, col: BOSS_DEFS.paintgolem.cols[k % 4], size: 3, grav: 1 }); }
        if (f === 30) { b.shadow = null; b.state = 'melted'; b.t = 0; b.markR = 22; b.winLen = bossP('stun');
          b.coreSide = Math.sign(pcx() - b.x) || 1; if (b.x + b.coreSide * 50 < 30 || b.x + b.coreSide * 50 > room.W - 30) b.coreSide = -b.coreSide;
          b.core = makeCore(b, b.x + b.coreSide * 50, FLOOR_Y - 30, () => ({ x: boss.x, y: FLOOR_Y - 20 }), 'pcore');
          tip('pcore', 'パレットンが溶けて、パレットのコアが出た！ VAC で吸い込め！', true); }
        break; }
      case 'melted': b.pose = 'melt'; coreBob(b, b.x + b.coreSide * 50, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'reform'; b.t = 0; } break;
      case 'reform': b.pose = b.t < 30 ? 'melt' : 'idle'; if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.pose = 'melt'; b.marks = []; b.shadow = null; b.jy = 0; },
  onDefeat(b) { bossReward(b, b.x); say('……描きかけでも、きれいな色だったよ。……おやすみ', 220); },
  draw(b, lights) {
    const C = CONFIG.paintgolem, x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y), top = Math.round(2 * TS - cam.y);
    if (b.state === 'splat') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('splatWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'drip') for (const m of b.marks) { const k = Math.min(1, b.t / bossP('dripWarn')); g.fillStyle = 'rgba(255,80,80,' + (0.08 + 0.12 * k) + ')'; g.fillRect(Math.round(m - cam.x) - 14, top, 28, y - top); drawFloorMark(m, k, 'rgba(255,60,60,0.85)'); }
    if (b.state === 'leap' && b.shadow) { const lock = b.t >= 30 + C.shadowTrack, sx = Math.round(b.shadow.x - cam.x);
      g.fillStyle = lock && (frame & 2) ? 'rgba(255,60,60,0.45)' : 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(sx, y - 2, 36, 6, 0, 0, 7); g.fill(); drawFloorMark(b.shadow.x, lock ? 1 : 0.5, 'rgba(255,60,60,0.9)'); }
    if (b.state === 'dying' && b.t >= 90) return;
    const key = 'pg_' + b.pose, r = rectOf('boss', key), sx = x - (r.w >> 1), sy = y - r.h - Math.round(b.jy);
    if (sy + r.h > 0) { spr('boss', key, sx, sy, b.face < 0);
      if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, b.face < 0); g.globalAlpha = 1; } }
    if (b.rage && frame % 5 === 0 && b.jy < 10) parts.push({ x: b.x + rnd(-24, 24), y: FLOOR_Y - rnd(10, 80), vx: 0, vy: 0.8, life: 18, col: BOSS_DEFS.paintgolem.cols[frame % 4], size: 2 });
    lights.push({ x: b.x, y: FLOOR_Y - 50 - b.jy, r: 50, warm: 1 });
    drawCore(b, lights, 'pcore');
  },
};
