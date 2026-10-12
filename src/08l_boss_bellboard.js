
// =====================================================================
//  AREA BOSS (v0.5.1): 呼び鈴盤 リンガリング RINGALING, THE BELL BOARD (使用人の裏廊下 / hall of bells)
//    The servants' bell board that once summoned every doll servant, now ringing for nobody. Not a friend character.
//    It glides along a rail under the ceiling.
//    peal   : gold marks -> little bells fall onto them, in two waves (the 2nd fills the gaps of the 1st)
//    chime  : it shivers, then chime rings roll along the floor from both walls (jump them; rage: a 3rd ring)
//    rope   : a red column under Kanata -> a bell rope whips straight down it; the clapper sends rings both ways
//    toll   : (every 3rd) it slides along the ceiling after Kanata, LOCKS (flashing) -> slams to the floor; the
//             great bell cracks open: the BELL CORE rolls out = weak point
//    rage   : (50%) shorter warnings, more bells, an extra ring
// =====================================================================
const BB_UP = 70;
BOSS_DEFS.bellboard = { jp: '呼び鈴盤 リンガリング', en: 'RINGALING, THE BELL BOARD', cfg: 'bellboard', cols: ['#c9a24a', '#5a3a24', '#ffe08a', '#ffffff'],
  rageText: '呼び鈴がいっせいに鳴りだした！ リンガリングが本気になった',
  sayIntro: '……だれも来ないのに、ずっと呼んでる。……グリム、耳ふさいで', sayCore: '……大きな鈴が割れた！ 中のゴースト、吸っちゃえ',
  make(b) { b.hy = BB_UP; b.tx = b.x; b.mood = 'idle'; b.markR = 20; },
  hitBox(b) { return { x0: b.x - 48, x1: b.x + 48, y0: b.hy - 28, y1: b.hy + 30 }; },
  aim(b) { return { x: b.x, y: b.hy + 10 }; },
  update(b) {
    const C = CONFIG.bellboard, px = clamp(pcx(), 16, room.W - 16);
    b.mood = b.state === 'cracked' ? 'open' : b.rage ? 'rage' : 'idle';
    switch (b.state) {
      case 'idle': b.markR = 20; b.hy += (BB_UP - b.hy) * 0.08;
        if (b.t === 1) b.tx = pcx() < 192 ? rnd(240, 320) : rnd(64, 144);
        b.x += clamp(b.tx - b.x, -1.3, 1.3);
        if (b.t >= bossP('idle')) chooseAttack(b, ['peal', 'chime', 'rope'], 'toll'); break;
      case 'peal': {
        const warn = bossP('bellWarn'), T2 = warn + 26;
        if (b.t === 1 || b.t === T2) { const n = bossP('bells'), xs = [];
          if (b.t === 1) { xs.push(px); for (let k = 1; xs.length < n; k++) { xs.push(px + k * 84); if (xs.length < n) xs.push(px - k * 84); } }
          else for (const m of b.first) xs.push(m + 42);
          b.marks = xs.map(x => clamp(x, 16, room.W - 16)); if (b.t === 1) b.first = b.marks.slice(0); b.mT = b.t; sfx('warn');
          tip('bpeal', '金色の印に、呼び鈴が降ってくる！ 二回目は印のすきまに落ちるよ'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { for (const mx of b.marks) ebullets.push({ kind: 'bellshot', spr: 'bellshot', x: mx - 6, y: 2 * TS, w: 12, h: 14, vx: 0, vy: 2, g: 0.34, dmg: C.bellDamage, life: 200,
              onLand: q => { sfx('tink'); for (let k = 0; k < 6; k++) parts.push({ x: q.x + 6, y: FLOOR_Y - 3, vx: rnd(-1.5, 1.5), vy: rnd(-2, -0.5), life: 16, col: '#ffe08a', size: 2, grav: 1 }); } });
          sfx('whoosh'); b.lastMarks = b.marks; }
        if (b.t === b.mT + warn + 30) b.marks = [];
        if (b.t >= T2 + warn + 40) { b.marks = []; b.state = 'idle'; b.t = 0; } break; }
      case 'chime': {
        const warn = bossP('chimeWarn'), n = b.rage ? 3 : 2;
        if (b.t === 1) { sfx('warn'); tip('bchime', '盤がふるえている… 鈴の輪が床を転がってくる！ ジャンプでとびこえよう'); }
        if (b.t < warn && b.t % 8 === 0) sfx('warn');
        for (let k = 0; k < n; k++) if (b.t === warn + k * 50) { sfx('chime'); cam.shake = 3; const d = k % 2 ? -1 : 1;
          ebullets.push({ kind: 'wave', spr: 'chimering', x: d > 0 ? 18 : room.W - 36, y: FLOOR_Y - 14, w: 18, h: 14, vx: d * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 240 }); }
        if (b.t >= warn + (n - 1) * 50 + 90) { b.state = 'idle'; b.t = 0; } break; }
      case 'rope': {
        const warn = bossP('ropeWarn');
        if (b.t === 1) { b.marks = [clamp(px, 30, room.W - 30)]; b.markR = 22; sfx('warn'); tip('brope', '赤い柱の中に、呼び鈴のひもが落ちてくる！ 柱から出て、鈴の輪はジャンプ'); }
        if (b.t < warn) { b.x += clamp(b.marks[0] - b.x, -2, 2); if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === warn) { const mx = b.marks[0]; sfx('thud'); cam.shake = 6; hitStop = 2;
          ebullets.push({ kind: 'ropecol', x: mx - 11, y: 2 * TS, w: 22, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.ropeDamage, life: 20, static: 1 });
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', spr: 'chimering', x: mx + d * 20 - 9, y: FLOOR_Y - 14, w: 18, h: 14, vx: d * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 200 }); }
        if (b.t === warn + 20) b.marks = [];
        if (b.t >= warn + 70) { b.markR = 20; b.state = 'idle'; b.t = 0; } break; }
      case 'toll': {
        const tr = C.tollTrack, lk = bossP('tollLock'), fall = 12;
        if (b.t === 1) { b.markR = 50; sfx('warn'); tip('btoll', 'リンガリングが天井をすべって追ってくる！ 点滅したら落ちてくる… 真下から逃げて！'); }
        if (b.t < tr) { b.hy += (BB_UP - 10 - b.hy) * 0.1; b.x += clamp(px - b.x, -1.7, 1.7); b.x = clamp(b.x, 56, room.W - 56); }
        if (b.t < tr + lk) { b.marks = [b.x]; if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t < tr + lk + fall) { b.hy = BB_UP - 10 + (FLOOR_Y - 32 - (BB_UP - 10)) * ((b.t - tr - lk) / fall) ** 2; break; }
        if (b.t === tr + lk + fall) { b.hy = FLOOR_Y - 32; b.marks = []; sfx('crash'); cam.shake = 12; hitStop = 4;
          if (overlapBox(b.x - 48, FLOOR_Y - 60, b.x + 48, FLOOR_Y)) hurtPlayer(C.tollDamage, b.x, 'toll');
          for (let i = 0; i < 20; i++) parts.push({ x: b.x + rnd(-40, 40), y: FLOOR_Y - 4, vx: rnd(-2.5, 2.5), vy: rnd(-3, -0.5), life: 30, col: i & 1 ? '#ffe08a' : '#8a6a44', size: 2, grav: 1 }); }
        if (b.t === tr + lk + fall + 20) { b.state = 'cracked'; b.t = 0; b.winLen = bossP('stun'); sfx('pop'); b.markR = 20;
          b.coreSide = Math.sign(pcx() - b.x) || (b.x < 192 ? 1 : -1); if (b.x + b.coreSide * 62 < 30 || b.x + b.coreSide * 62 > room.W - 30) b.coreSide = -b.coreSide;
          b.core = makeCore(b, b.x + b.coreSide * 62, FLOOR_Y - 30, () => ({ x: boss.x, y: boss.hy + 10 }), 'bcore');
          tip('bcore', 'ガシャン！ 大きな鈴が割れて、ゴーストが転がり出た！ 鈴のコアを VAC で吸い込め！', true); }
        break; }
      case 'cracked': coreBob(b, b.x + b.coreSide * 62, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'rehang'; b.t = 0; } break;
      case 'rehang': b.hy += (BB_UP - b.hy) * 0.05; if (b.t > 60) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.mood = 'stun'; b.marks = []; b.hy += (FLOOR_Y - 32 - b.hy) * 0.08; },
  onDefeat(b) { bossReward(b, b.x); say('……もう、だれも呼ばなくていいよ。……あれ、中にカンテラ？', 220); },
  draw(b, lights) {
    const x = Math.round(b.x - cam.x), y = Math.round(b.hy - cam.y), top = 2 * TS - cam.y;
    if (b.state === 'peal') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('bellWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'rope' && b.marks.length) { const mx = Math.round(b.marks[0] - cam.x), k = Math.min(1, b.t / bossP('ropeWarn'));
      g.fillStyle = (frame & 4) ? 'rgba(255,60,60,' + (0.12 + 0.14 * k) + ')' : 'rgba(255,60,60,' + (0.08 + 0.1 * k) + ')'; g.fillRect(mx - 12, Math.round(top), 24, Math.round(FLOOR_Y - cam.y) - Math.round(top));
      drawFloorMark(b.marks[0], k, 'rgba(255,60,60,0.85)'); }
    if (b.state === 'toll' && b.marks.length) { const lock = b.t >= CONFIG.bellboard.tollTrack; drawFloorMark(b.marks[0], lock ? 1 : 0.5, lock && (frame & 2) ? 'rgba(255,240,240,0.95)' : 'rgba(255,60,60,0.9)');
      g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,80,80,0.22)' : 'rgba(255,230,230,0.16)') : 'rgba(255,80,80,0.08)'; g.fillRect(x - 48, y, 96, Math.round(FLOOR_Y - cam.y) - y); }
    if (b.state === 'dying' && b.t >= 90) return;
    // the rail it hangs from + two hanger rods
    g.fillStyle = '#3a2416'; g.fillRect(0, Math.round(top), VW, 3); g.fillStyle = '#8a6a44';
    for (const s of [-1, 1]) g.fillRect(x + s * 38, Math.round(top), 2, Math.max(0, y - 28 - Math.round(top)));
    const key = 'bb_' + (b.state === 'dying' ? 'stun' : b.mood), r = rectOf('boss', key), shake = b.state === 'chime' && b.t < bossP('chimeWarn') ? ((frame & 2) ? 1 : -1) : 0;
    const sx = x - (r.w >> 1) + shake, sy = y - (r.h >> 1);
    spr('boss', key, sx, sy);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy); g.globalAlpha = 1; }
    if (b.state === 'toll' && b.t >= CONFIG.bellboard.tollTrack && b.t < CONFIG.bellboard.tollTrack + bossP('tollLock') && (frame & 4)) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, false, '#ff4040'); g.globalAlpha = 1; }
    lights.push({ x: b.x, y: b.hy, r: 70, warm: 1 });
    drawCore(b, lights, 'bcore');
  },
};
