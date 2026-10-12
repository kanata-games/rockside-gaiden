
// =====================================================================
//  AREA BOSS (v0.5): 樽蜘蛛 バレルタラント BARRELTARANT, THE CASK SPIDER (古酒の大貯蔵庫 / throne of the grand cask)
//    A giant wine cask on eight corkscrew legs, hanging from a thread in the vault ceiling. Not a friend character.
//    corks  : gold marks -> corks rain straight down onto them (one leaves a CORK = ammo)
//    spill  : it shakes, then sloshes a wine wave both ways along the floor (jump it; rage: a 2nd pair)
//    drop   : a red mark under Kanata -> it slides over and drops on its thread (landing splash waves)
//    plunge : (every 3rd) climbs to the ceiling, tracks Kanata, LOCKS (flashing) -> plunges, gets stuck in the
//             floor and its cork pops: the WINE CORE comes out = weak point
//    rage   : (50%) shorter warnings, more corks, double waves
// =====================================================================
const TAR_UP = 92;   // hanging height (body centre)
BOSS_DEFS.tarant = { jp: '樽蜘蛛 バレルタラント', en: 'BARRELTARANT, THE CASK SPIDER', cfg: 'tarant', cols: ['#9a6a3e', '#b83a5a', '#ffd84a', '#ffffff'],
  rageText: '樽がぐらぐら煮えたった！ バレルタラントが本気になった',
  sayIntro: '……樽に、足が八本。……グリム、あれは吸っちゃダメ', sayCore: '……栓が抜けた！ 中のゴースト、吸っちゃえ',
  make(b) { b.hy = TAR_UP; b.tx = b.x; b.face = -1; b.mood = 'idle'; b.markR = 20; },
  hitBox(b) { return { x0: b.x - 30, x1: b.x + 30, y0: b.hy - 26, y1: b.hy + 26 }; },
  aim(b) { return { x: b.x, y: b.hy }; },
  update(b) {
    const C = CONFIG.tarant, px = clamp(pcx(), 16, room.W - 16);
    b.face = Math.sign(pcx() - b.x) || b.face;
    b.mood = b.state === 'stuck' ? 'open' : b.rage ? 'rage' : 'idle';
    switch (b.state) {
      case 'idle': b.markR = 20; b.hy += (TAR_UP - b.hy) * 0.08;
        if (b.t === 1) b.tx = pcx() < 192 ? rnd(250, 320) : rnd(64, 134);
        b.x += clamp(b.tx - b.x, -1.3, 1.3);
        if (b.t >= bossP('idle')) chooseAttack(b, ['corks', 'spill', 'drop'], 'plunge'); break;
      case 'corks': {
        const warn = bossP('corkWarn');
        if (b.t === 1) { const n = bossP('corks'), xs = [px]; for (let k = 1; xs.length < n; k++) { xs.push(px + k * 72); if (xs.length < n) xs.push(px - k * 72); }
          b.marks = xs.map(x => clamp(x, 20, room.W - 20)); b.markR = 20; sfx('warn'); tip('tcork', '金色の印に、コルクの雨が降ってくる！ 印と印のあいだへ'); }
        if (b.t < warn && b.t % 10 === 0) sfx('tick');
        if (b.t === warn) { let i = 0; for (const mx of b.marks) { const ammo = i++ === 0;
            ebullets.push({ kind: 'corkshot', x: mx - 6, y: 2 * TS, w: 12, h: 14, vx: 0, vy: 2, g: 0.32, dmg: C.corkDamage, life: 200,
              onLand: q => { sfx('tink'); for (let k = 0; k < 6; k++) parts.push({ x: q.x + 6, y: FLOOR_Y - 3, vx: rnd(-1.5, 1.5), vy: rnd(-2, -0.5), life: 16, col: '#e8c890', size: 2, grav: 1 }); if (ammo) spawnItem('cork', clamp(q.x + 6, 24, room.W - 24), FLOOR_Y); } }); }
          sfx('whoosh'); }
        if (b.t === warn + 34) b.marks = [];
        if (b.t >= warn + 60) { b.state = 'idle'; b.t = 0; } break; }
      case 'spill': {
        const warn = bossP('spillWarn'), pairs = b.rage ? 2 : 1;
        if (b.t === 1) { sfx('warn'); tip('tspill', '樽がゆれている… ワインの波が来る！ 波はジャンプでとびこえよう'); }
        if (b.t < warn && b.t % 8 === 0) sfx('warn');
        for (let k = 0; k < pairs; k++) if (b.t === warn + k * 46) { sfx('splash'); cam.shake = 4;
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', spr: 'winewave', x: b.x + d * 20 - 9, y: FLOOR_Y - 14, w: 18, h: 14, vx: d * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 220 });
          for (let i = 0; i < 14; i++) parts.push({ x: b.x + rnd(-20, 20), y: b.hy + 20, vx: rnd(-1, 1), vy: rnd(0.5, 3), life: 30, col: i & 1 ? '#b83a5a' : '#7a1a3a', size: 2, grav: 1 }); }
        if (b.t >= warn + (pairs - 1) * 46 + 80) { b.state = 'idle'; b.t = 0; } break; }
      case 'drop': {
        const warn = bossP('dropWarn'), fall = 14;
        if (b.t === 1) { b.marks = [clamp(px, 44, room.W - 44)]; b.markR = 50; sfx('warn'); tip('tdrop', '赤い印の上に、樽が落ちてくる！ 印から離れて、しぶきの波はジャンプ'); }
        if (b.t < warn) { b.x += clamp(b.marks[0] - b.x, -2.4, 2.4); if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t < warn + fall) { b.x = b.marks[0]; b.hy = TAR_UP + (FLOOR_Y - 28 - TAR_UP) * ((b.t - warn) / fall) ** 2; break; }
        if (b.t === warn + fall) { b.hy = FLOOR_Y - 28; b.marks = []; sfx('boom'); cam.shake = 9; hitStop = 3;
          if (overlapBox(b.x - 32, FLOOR_Y - 56, b.x + 32, FLOOR_Y)) hurtPlayer(C.dropDamage, b.x, 'drop');
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', spr: 'winewave', x: b.x + d * 36 - 9, y: FLOOR_Y - 14, w: 18, h: 14, vx: d * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 200 }); }
        if (b.t > warn + fall + 24) b.hy += (TAR_UP - b.hy) * 0.06;
        if (b.t >= warn + fall + 70) { b.markR = 20; b.state = 'idle'; b.t = 0; } break; }
      case 'plunge': {
        const tr = C.plungeTrack, lk = bossP('plungeLock'), fall = 12;
        if (b.t === 1) { b.markR = 36; sfx('warn'); tip('tplunge', 'バレルタラントが天井で狙っている！ 点滅したら落ちてくる… 真下から逃げて！'); }
        if (b.t < tr) { b.hy += (56 - b.hy) * 0.1; b.x += clamp(px - b.x, -1.7, 1.7); }
        if (b.t < tr + lk) { b.marks = [b.x]; if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t < tr + lk + fall) { b.hy = 56 + (FLOOR_Y - 26 - 56) * ((b.t - tr - lk) / fall) ** 2; break; }
        if (b.t === tr + lk + fall) { b.hy = FLOOR_Y - 26; b.marks = []; sfx('crash'); cam.shake = 12; hitStop = 4;
          if (overlapBox(b.x - 32, FLOOR_Y - 54, b.x + 32, FLOOR_Y)) hurtPlayer(C.plungeDamage, b.x, 'plunge');
          for (let i = 0; i < 20; i++) parts.push({ x: b.x + rnd(-30, 30), y: FLOOR_Y - 4, vx: rnd(-2.5, 2.5), vy: rnd(-3, -0.5), life: 30, col: i & 1 ? '#b83a5a' : '#e8c890', size: 2, grav: 1 }); }
        if (b.t === tr + lk + fall + 20) { b.state = 'stuck'; b.t = 0; b.winLen = bossP('stun'); sfx('pop'); b.markR = 20;
          b.coreSide = Math.sign(pcx() - b.x) || (b.x < 192 ? 1 : -1); if (b.x + b.coreSide * 46 < 30 || b.x + b.coreSide * 46 > room.W - 30) b.coreSide = -b.coreSide;
          b.core = makeCore(b, b.x + b.coreSide * 46, FLOOR_Y - 30, () => ({ x: boss.x, y: boss.hy - 20 }), 'wcore');
          tip('tcore', 'ポンッ！ 栓が抜けて、中のゴーストが飛び出した！ ワインのコアを VAC で吸い込め！', true); }
        break; }
      case 'stuck': coreBob(b, b.x + b.coreSide * 46, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'climb'; b.t = 0; } break;
      case 'climb': b.hy += (TAR_UP - b.hy) * 0.05; if (b.t > 60) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.mood = 'stun'; b.marks = []; b.hy += (FLOOR_Y - 26 - b.hy) * 0.08; },
  onDefeat(b) { bossReward(b, b.x); say('……樽、からっぽ。……グリム、酔ってない？', 220); },
  draw(b, lights) {
    const x = Math.round(b.x - cam.x), y = Math.round(b.hy - cam.y), top = 2 * TS - cam.y;
    if (b.state === 'corks') for (const m of b.marks) drawFloorMark(m, Math.min(1, b.t / bossP('corkWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'drop' && b.marks.length) drawFloorMark(b.marks[0], Math.min(1, b.t / bossP('dropWarn')), 'rgba(255,60,60,0.85)');
    if (b.state === 'plunge' && b.marks.length) { const lock = b.t >= CONFIG.tarant.plungeTrack; drawFloorMark(b.marks[0], lock ? 1 : 0.5, lock && (frame & 2) ? 'rgba(255,240,240,0.95)' : 'rgba(255,60,60,0.9)');
      g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,80,80,0.22)' : 'rgba(255,230,230,0.16)') : 'rgba(255,80,80,0.08)'; g.fillRect(x - 32, y, 64, Math.round(FLOOR_Y - cam.y) - y); }
    if (b.state === 'dying' && b.t >= 90) return;
    // the thread it hangs from
    g.fillStyle = 'rgba(230,220,240,0.6)'; g.fillRect(x, Math.round(top), 1, Math.max(0, y - 26 - Math.round(top)));
    // eight corkscrew legs (drawn under the body), splayed on the floor when it is down
    const down = b.hy > FLOOR_Y - 60;
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const ph = frame * 0.12 + i * 1.3 + (s > 0 ? 0.6 : 0), hx = x + s * (14 + i * 5), hy = y + 2 + i * 3;
      const kx = hx + s * (14 + i * 3), ky = hy - 12 + Math.sin(ph) * 3 + (down ? 4 : 0);
      const fx = kx + s * (down ? 10 : 4), fy = down ? Math.round(FLOOR_Y - cam.y) - 1 : ky + 20 + Math.sin(ph + 1) * 3;
      g.strokeStyle = '#3e2614'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
      g.strokeStyle = '#c9a24a'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
      g.fillStyle = '#9a6a3e'; for (let k = 0; k < 3; k++) { const t = (k + 0.5) / 3; g.fillRect(Math.round(kx + (fx - kx) * t), Math.round(ky + (fy - ky) * t), 2, 1); } }
    const key = 'tar_' + (b.state === 'dying' ? 'stun' : b.mood), r = rectOf('boss', key), sx = x - (r.w >> 1), sy = y - (r.h >> 1) + (b.state === 'spill' ? Math.round(Math.sin(frame * 0.8) * 2) : 0);
    spr('boss', key, sx + (b.state === 'spill' ? ((frame & 2) ? 1 : -1) : 0), sy);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy); g.globalAlpha = 1; }
    if ((b.state === 'drop' && b.t < bossP('dropWarn') || b.state === 'plunge' && b.t >= CONFIG.tarant.plungeTrack && b.t < CONFIG.tarant.plungeTrack + bossP('plungeLock')) && (frame & 4)) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, false, '#ff4040'); g.globalAlpha = 1; }
    lights.push({ x: b.x, y: b.hy, r: 64, warm: 1 });
    drawCore(b, lights, 'wcore');
  },
};
