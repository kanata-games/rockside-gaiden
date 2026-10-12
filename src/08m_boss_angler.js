
// =====================================================================
//  AREA BOSS (v0.5.1): 灯り鮟鱇 ランタンアングラー LANTERN ANGLER (地底の湖 / abyss of the lure)
//    A huge blind anglerfish that crawls on its fins and hunts by its glowing lure. Not a friend character.
//    bubbles: gold marks -> bubble columns burst up from the floor (two waves; the 2nd fills the gaps)
//    bite   : red zone in front -> it lunges forward along the floor jaws-first (then a splash wave toward Kanata)
//    dive   : it sinks into the black water; a red mark under Kanata -> it bursts out there (splash waves both ways)
//    lure   : (every 3rd) its lure drifts after Kanata, LOCKS (flashing) -> its jaws snap shut on the spot and bite
//             the rock: the stuck lure bulb (the LURE CORE) dangles free = weak point
//    rage   : (50%) shorter warnings, more bubbles, the bite lunges twice
// =====================================================================
BOSS_DEFS.angler = { jp: '灯り鮟鱇 ランタンアングラー', en: 'LANTERN ANGLER', cfg: 'angler', cols: ['#4a9aa0', '#1e4a50', '#fff8a0', '#ffffff'],
  rageText: '体じゅうの苔が光りだした！ ランタンアングラーが本気になった',
  sayIntro: '……光に寄ってきたもの、ぜんぶ食べちゃう子だ。……グリム、カンテラ消さないでね', sayCore: '……ちょうちんが岩にはさまった！ グリム、吸って',
  make(b) { b.face = -1; b.pose = 'idle'; b.markR = 22; b.sink = 0; b.lure = null; },
  hitBox(b) { return b.pose === 'dive' ? { x0: b.x - 10, x1: b.x + 10, y0: FLOOR_Y - 4, y1: FLOOR_Y } : { x0: b.x - 44, x1: b.x + 44, y0: FLOOR_Y - 58 + b.sink, y1: FLOOR_Y }; },
  aim(b) { return { x: b.x, y: FLOOR_Y - 32 + b.sink }; },
  update(b) {
    const C = CONFIG.angler, px = clamp(pcx(), 16, room.W - 16);
    if (b.state === 'idle' || b.state === 'bubbles') b.face = Math.sign(pcx() - b.x) || b.face;
    switch (b.state) {
      case 'idle': b.pose = b.rage ? 'rage' : 'idle'; b.markR = 22; b.sink += (0 - b.sink) * 0.2;
        if (b.t === 1) b.tx = pcx() < 192 ? rnd(250, 320) : rnd(64, 134);
        b.x += clamp(b.tx - b.x, -1.0, 1.0);
        if (b.t >= bossP('idle')) chooseAttack(b, ['bubbles', 'bite', 'dive'], 'lure'); break;
      case 'bubbles': {
        const warn = bossP('bubWarn'), T2 = warn + 28;
        if (b.t === 1 || b.t === T2) { const n = bossP('bubbles'), xs = [];
          if (b.t === 1) { xs.push(px); for (let k = 1; xs.length < n; k++) { xs.push(px + k * 96); if (xs.length < n) xs.push(px - k * 96); } }
          else for (const m of b.first) xs.push(m + 48);
          b.marks = xs.map(x => clamp(x, 16, room.W - 16)); if (b.t === 1) b.first = b.marks.slice(0); b.mT = b.t; sfx('bubble');
          tip('abub', '金色の印から、泡の柱がふきあがる！ 印から離れて'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { for (const mx of b.marks) ebullets.push({ kind: 'bubcol', x: mx - 10, y: 2 * TS, w: 20, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.bubDamage, life: 22, static: 1 });
          b.marks = []; sfx('splash'); cam.shake = 3; }
        if (b.t >= T2 + warn + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'bite': {
        const warn = bossP('biteWarn'), dash = 22, n = b.rage ? 2 : 1;
        if (b.t === 1) { b.face = Math.sign(pcx() - b.x) || b.face; b.bites = n; b.bx0 = b.x; b.pose = 'bite'; sfx('warn'); tip('abite', '大きな口をあけた！ 前の赤いところから離れて、しぶきの波はジャンプ！'); }
        if (b.t < warn) { if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === warn) { b.bx1 = clamp(b.x + b.face * C.biteDist, 50, room.W - 50); sfx('whoosh'); }
        if (b.t < warn + dash) { const k = (b.t - warn) / dash; b.x = b.bx0 + (b.bx1 - b.bx0) * k;
          if (overlapBox(b.x + (b.face > 0 ? 10 : -52), FLOOR_Y - 50, b.x + (b.face > 0 ? 52 : -10), FLOOR_Y)) hurtPlayer(C.biteDamage, b.x, 'bite'); break; }
        if (b.t === warn + dash) { b.pose = 'idle'; sfx('thud'); cam.shake = 5; ebullets.push({ kind: 'wave', x: b.x + b.face * 50 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: b.face * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 200 }); }
        if (b.t === warn + dash + 30 && --b.bites > 0) { b.t = 1; b.face = Math.sign(pcx() - b.x) || -b.face; b.bx0 = b.x; b.pose = 'bite'; sfx('warn'); break; }
        if (b.t >= warn + dash + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'dive': {
        const warn = bossP('diveWarn'), sinkT = 20;
        if (b.t === 1) { b.pose = 'dive'; sfx('splash'); tip('adive', 'ランタンアングラーが水にもぐった！ 赤い印から飛び出してくる… 印から離れて！'); }
        if (b.t < sinkT) { b.sink = 58 * (b.t / sinkT); break; }
        if (b.t === sinkT) { b.marks = [clamp(px, 50, room.W - 50)]; b.markR = 52; }
        if (b.t < sinkT + warn) { b.x += clamp(b.marks[0] - b.x, -3, 3); if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === sinkT + warn) { b.x = b.marks[0]; b.marks = []; b.pose = 'bite'; b.sink = 0; sfx('boom'); cam.shake = 9; hitStop = 3;
          if (overlapBox(b.x - 40, FLOOR_Y - 80, b.x + 40, FLOOR_Y)) hurtPlayer(C.diveDamage, b.x, 'dive');
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', x: b.x + d * 44 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: d * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 200 });
          for (let i = 0; i < 18; i++) parts.push({ x: b.x + rnd(-30, 30), y: FLOOR_Y - 6, vx: rnd(-2, 2), vy: rnd(-4, -1), life: 30, col: i & 1 ? '#a0e8ff' : '#4a9aa0', size: 2, grav: 1 }); }
        if (b.t === sinkT + warn + 24) b.pose = b.rage ? 'rage' : 'idle';
        if (b.t >= sinkT + warn + 50) { b.markR = 22; b.state = 'idle'; b.t = 0; } break; }
      case 'lure': {
        const tr = C.lureTrack, lk = bossP('lureLock');
        if (b.t === 1) { b.lure = { x: b.x + b.face * 40 }; b.markR = 40; sfx('warn'); tip('alure', 'ちょうちんの光が追ってくる！ 点滅したら止まる… 光の下から逃げて！'); }
        if (b.t < tr) b.lure.x += clamp(pcx() - b.lure.x, -1.6, 1.6);
        b.lure.x = clamp(b.lure.x, 50, room.W - 50);
        if (b.t < tr + lk) { b.marks = [b.lure.x]; if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === tr + lk) { b.face = Math.sign(b.lure.x - b.x) || b.face; b.lx0 = b.x; b.pose = 'bite'; sfx('whoosh'); }
        if (b.t < tr + lk + 12) { b.x = b.lx0 + (b.lure.x - b.lx0) * ((b.t - tr - lk) / 12); break; }
        if (b.t === tr + lk + 12) { b.x = b.lure.x; b.marks = []; sfx('crash'); cam.shake = 11; hitStop = 4;
          if (overlapBox(b.x - 44, FLOOR_Y - 60, b.x + 44, FLOOR_Y)) hurtPlayer(C.snapDamage, b.x, 'snap');
          for (let i = 0; i < 18; i++) parts.push({ x: b.x + rnd(-30, 30), y: FLOOR_Y - 4, vx: rnd(-2.5, 2.5), vy: rnd(-3, -0.5), life: 26, col: i & 1 ? '#7affc0' : '#5a6a6a', size: 2, grav: 1 }); }
        if (b.t === tr + lk + 30) { b.state = 'stuck'; b.t = 0; b.pose = 'stun'; b.markR = 22; b.winLen = bossP('stun'); b.lure = null; sfx('pop');
          b.coreSide = Math.sign(pcx() - b.x) || 1; if (b.x + b.coreSide * 56 < 30 || b.x + b.coreSide * 56 > room.W - 30) b.coreSide = -b.coreSide;
          b.core = makeCore(b, b.x + b.coreSide * 56, FLOOR_Y - 30, () => ({ x: boss.x, y: FLOOR_Y - 40 }), 'lcore');
          tip('acore', 'アゴが岩にささった！ ちぎれたちょうちん（コア）を VAC で吸い込め！', true); }
        break; }
      case 'stuck': coreBob(b, b.x + b.coreSide * 56, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'free'; b.t = 0; } break;
      case 'free': b.pose = 'idle'; if (b.t > 40) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.pose = 'stun'; b.marks = []; b.lure = null; b.sink = 0; },
  onDefeat(b) { bossReward(b, b.x); say('……光るものが好きだっただけ、だよね。……おやすみ', 220); },
  draw(b, lights) {
    const C = CONFIG.angler, x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y), top = Math.round(2 * TS - cam.y);
    if (b.state === 'bubbles') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('bubWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'dive' && b.marks.length) drawFloorMark(b.marks[0], Math.min(1, (b.t - 20) / bossP('diveWarn')), 'rgba(255,60,60,0.85)');
    if (b.state === 'bite' && b.t < bossP('biteWarn')) { const x0 = x + b.face * 10, x1 = x + b.face * (C.biteDist + 52); g.fillStyle = (frame & 4) ? 'rgba(255,60,60,0.22)' : 'rgba(255,60,60,0.12)'; g.fillRect(Math.min(x0, x1), y - 50, Math.abs(x1 - x0), 50); }
    if (b.state === 'lure' && b.lure) { const lock = b.t >= C.lureTrack, lx = Math.round(b.lure.x - cam.x);
      g.globalCompositeOperation = 'lighter'; g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,120,120,0.30)' : 'rgba(255,250,180,0.30)') : 'rgba(255,250,180,0.14)';
      g.fillRect(lx - 40, top, 80, y - top); g.globalCompositeOperation = 'source-over';
      drawFloorMark(b.lure.x, lock ? 1 : 0.5, 'rgba(255,60,60,0.9)'); spr('boss', 'lurebulb', lx - 7, y - 70 + Math.round(Math.sin(frame * 0.2) * 3)); lights.push({ x: b.lure.x, y: FLOOR_Y - 60, r: 60, warm: 1 }); }
    if (b.state === 'dying' && b.t >= 90) return;
    const key = 'an_' + b.pose, r = rectOf('boss', key), sx = x - (r.w >> 1), sy = y - r.h + Math.round(b.pose === 'dive' ? 0 : b.sink);
    if (b.pose !== 'dive' || b.sink < 40) { g.save(); g.beginPath(); g.rect(0, 0, VW, y); g.clip(); spr('boss', key, sx, sy, b.face < 0);
      if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, b.face < 0); g.globalAlpha = 1; }
      if (b.state === 'bite' && b.t < bossP('biteWarn') && (frame & 4)) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, b.face < 0, '#ff4040'); g.globalAlpha = 1; }
      g.restore(); }
    else spr('boss', 'an_dive', sx, y - 72, b.face < 0);
    // the lure on its stalk (when not out hunting / not snapped off)
    if (b.state !== 'lure' && b.state !== 'stuck' && b.pose !== 'dive') { const lx = x + b.face * 40, ly = y - 76 + b.sink + Math.round(Math.sin(frame * 0.1) * 2);
      g.strokeStyle = '#1e4a50'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + b.face * 14, y - 54 + b.sink); g.quadraticCurveTo(x + b.face * 20, ly - 14, lx, ly); g.stroke(); spr('boss', 'lurebulb', lx - 7, ly - 7);
      lights.push({ x: b.x + b.face * 40, y: FLOOR_Y - 76 + b.sink, r: 70, warm: 1 }); }
    if (b.rage && b.pose !== 'dive' && frame % 3 === 0) parts.push({ x: b.x + rnd(-40, 40), y: FLOOR_Y - rnd(10, 50), vx: 0, vy: -rnd(0.3, 0.8), life: 18, col: '#7affc0', size: 2, glow: 1 });
    drawCore(b, lights, 'lcore');
  },
};
