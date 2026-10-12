
// =====================================================================
//  AREA BOSS (v0.6): 風見鶏 ゲイルコック GALECOCK, THE WEATHERCOCK (尖塔の屋根 / the weathercock perch)
//    The iron rooster on top of the dream's highest spire, spinning with every wind. Not a friend character.
//    feathers: gold marks -> iron feathers rain onto them (two waves; the 2nd fills the gaps)
//    gust    : it spins, then gust rings sweep along the roof from its pole, both ways (jump them; rage: a 3rd)
//    swoop   : red mark under Kanata -> the rooster hops off its pole and swoops down onto the mark
//    storm   : (every 3rd) a storm cloud drifts after Kanata, LOCKS (flashing) -> lightning strikes there; the
//              lightning rod pulls the bolt back into the weathercock and it topples: the STORM CORE pops out = weak point
//    rage    : (50%) shorter warnings, more feathers, an extra gust
// =====================================================================
BOSS_DEFS.galecock = { jp: '風見鶏 ゲイルコック', en: 'GALECOCK, THE WEATHERCOCK', cfg: 'galecock', cols: ['#7a8494', '#c83a3a', '#ffd84a', '#ffffff'],
  rageText: '風が逆巻いた！ ゲイルコックが本気になった',
  sayIntro: '……ずっと、風の向きだけ見てきたんだね。……グリム、飛ばされないで', sayCore: '……雷を吸っちゃった！ 今だよ、グリム',
  make(b) { b.face = -1; b.jy = 0; b.tx = b.x; b.pose = 'idle'; b.markR = 22; b.cloud = null; },
  hitBox(b) { return b.pose === 'fall' ? { x0: b.x - 40, x1: b.x + 40, y0: FLOOR_Y - 28, y1: FLOOR_Y } : { x0: b.x - 24, x1: b.x + 30, y0: FLOOR_Y - 104 - b.jy, y1: FLOOR_Y - 60 - b.jy }; },
  aim(b) { return { x: b.x + (b.pose === 'fall' ? 26 : 4), y: b.pose === 'fall' ? FLOOR_Y - 16 : FLOOR_Y - 82 - b.jy }; },
  update(b) {
    const C = CONFIG.galecock, px = clamp(pcx(), 16, room.W - 16);
    if (b.state === 'idle') b.face = Math.sign(pcx() - b.x) || b.face;
    switch (b.state) {
      case 'idle': b.pose = b.rage ? 'rage' : 'idle'; b.markR = 22;
        if (b.t === 1) b.tx = pcx() < 192 ? rnd(250, 320) : rnd(64, 134);
        b.x += clamp(b.tx - b.x, -1.1, 1.1);
        if (b.t >= bossP('idle')) chooseAttack(b, ['feathers', 'gust', 'swoop'], 'storm'); break;
      case 'feathers': {
        const warn = bossP('featherWarn'), T2 = warn + 26;
        if (b.t === 1 || b.t === T2) { const n = bossP('feathers'), xs = [];
          if (b.t === 1) { xs.push(px); for (let k = 1; xs.length < n; k++) { xs.push(px + k * 84); if (xs.length < n) xs.push(px - k * 84); } }
          else for (const m of b.first) xs.push(m - 42);
          b.marks = xs.map(x => clamp(x, 16, room.W - 16)); if (b.t === 1) b.first = b.marks.slice(0); b.mT = b.t; sfx('warn');
          tip('gfeather', '金色の印に、鉄の羽根が降ってくる！ 二回目は印のすきま'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { for (const mx of b.marks) ebullets.push({ kind: 'feather', spr: 'feather', x: mx - 5, y: 2 * TS, w: 10, h: 18, vx: 0, vy: 2.5, g: 0.34, dmg: C.featherDamage, life: 200,
              onLand: q => { sfx('tink'); for (let k = 0; k < 5; k++) parts.push({ x: q.x + 5, y: FLOOR_Y - 3, vx: rnd(-1.5, 1.5), vy: rnd(-2, -0.5), life: 14, col: '#a8b4c8', size: 2, grav: 1 }); } });
          sfx('whoosh'); }
        if (b.t === b.mT + warn + 30) b.marks = [];
        if (b.t >= T2 + warn + 40) { b.marks = []; b.state = 'idle'; b.t = 0; } break; }
      case 'gust': {
        const warn = bossP('gustWarn'), n = b.rage ? 3 : 2;
        if (b.t === 1) { b.pose = 'spin'; sfx('warn'); tip('ggust', 'ゲイルコックが回りはじめた！ 風の輪が屋根をすべってくる… ジャンプでとびこえよう'); }
        if (b.t < warn && b.t % 8 === 0) sfx('flap');
        for (let k = 0; k < n; k++) if (b.t === warn + k * 52) { sfx('whoosh'); cam.shake = 3;
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', spr: 'gustwave', x: b.x + d * 22 - 10, y: FLOOR_Y - 14, w: 20, h: 14, vx: d * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 220 }); }
        if (b.t >= warn + (n - 1) * 52 + 80) { b.pose = 'idle'; b.state = 'idle'; b.t = 0; } break; }
      case 'swoop': {
        const warn = bossP('swoopWarn'), air = C.swoopAir;
        if (b.t === 1) { b.marks = [clamp(px, 40, room.W - 40)]; b.markR = 54; b.sx0 = b.x; b.pose = 'swoop'; sfx('warn'); tip('gswoop', 'ゲイルコックが飛びかかってくる！ 赤い印から離れて'); }
        if (b.t < warn) { if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === warn) { sfx('flap'); b.sx1 = b.marks[0]; }
        if (b.t < warn + air) { const k = (b.t - warn) / air; b.x = b.sx0 + (b.sx1 - b.sx0) * k; b.jy = Math.sin(k * Math.PI) * 90; break; }
        if (b.t === warn + air) { b.jy = 0; b.x = b.sx1; b.marks = []; b.pose = 'idle'; sfx('boom'); cam.shake = 8; hitStop = 3;
          if (overlapBox(b.x - 32, FLOOR_Y - 104, b.x + 32, FLOOR_Y)) hurtPlayer(C.swoopDamage, b.x, 'swoop'); }
        if (b.t >= warn + air + 40) { b.markR = 22; b.state = 'idle'; b.t = 0; } break; }
      case 'storm': {
        const tr = C.cloudTrack, lk = bossP('cloudLock');
        if (b.t === 1) { b.cloud = { x: pcx() }; b.markR = 34; sfx('warn'); tip('gstorm', '雷雲が追ってくる！ 点滅したら止まる… 雲の下から逃げて！'); }
        if (b.t < tr) b.cloud.x += clamp(pcx() - b.cloud.x, -1.6, 1.6);
        if (b.t < tr + lk) { b.marks = [b.cloud.x]; if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === tr + lk) { const cx = b.cloud.x; sfx('crash'); cam.shake = 10; hitStop = 3; b.flashT = 10;
          ebullets.push({ kind: 'bolt', x: cx - 14, y: 2 * TS, w: 28, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.boltDamage, life: 14, static: 1 }); }
        if (b.t === tr + lk + 14) b.marks = [];
        if (b.t === tr + lk + 24) { b.cloud = null; b.state = 'fallen'; b.t = 0; b.pose = 'fall'; b.markR = 22; b.winLen = bossP('stun'); sfx('crash'); cam.shake = 8;
          b.coreSide = Math.sign(pcx() - b.x) || 1; if (b.x + b.coreSide * 54 < 30 || b.x + b.coreSide * 54 > room.W - 30) b.coreSide = -b.coreSide;
          b.core = makeCore(b, b.x + b.coreSide * 54, FLOOR_Y - 30, () => ({ x: boss.x + 26, y: FLOOR_Y - 16 }), 'vcore');
          tip('gcore', '雷を吸って、ゲイルコックが倒れた！ 出てきたコアを VAC で吸い込め！', true); }
        break; }
      case 'fallen': coreBob(b, b.x + b.coreSide * 54, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'standup'; b.t = 0; } break;
      case 'standup': b.pose = b.t < 30 ? 'fall' : 'idle'; if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
    if (b.flashT > 0) b.flashT--;
  },
  dying(b) { b.pose = 'fall'; b.marks = []; b.cloud = null; b.jy = 0; },
  onDefeat(b) { bossReward(b, b.x); say('……もう、どっちを向いてもいいんだよ。……風、止んだね', 220); },
  draw(b, lights) {
    const C = CONFIG.galecock, x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y), top = Math.round(2 * TS - cam.y);
    if (b.flashT > 0) { g.fillStyle = 'rgba(220,230,255,' + (b.flashT / 30) + ')'; g.fillRect(0, 0, VW, VH); }
    if (b.state === 'feathers') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('featherWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'swoop' && b.marks.length) drawFloorMark(b.marks[0], Math.min(1, b.t / bossP('swoopWarn')), 'rgba(255,60,60,0.85)');
    if (b.state === 'storm' && b.cloud) { const lock = b.t >= C.cloudTrack, cx = Math.round(b.cloud.x - cam.x);
      g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,120,120,0.22)' : 'rgba(220,230,255,0.22)') : 'rgba(200,210,255,0.10)'; g.fillRect(cx - 16, top, 32, y - top);
      g.fillStyle = '#2a2e3e'; for (const [dx, dy, r] of [[-14, 6, 10], [0, 2, 13], [14, 6, 10]]) { g.beginPath(); g.arc(cx + dx, top + 8 + dy, r, 0, 7); g.fill(); }
      drawFloorMark(b.cloud.x, lock ? 1 : 0.5, 'rgba(255,60,60,0.9)'); }
    if (b.state === 'dying' && b.t >= 90) return;
    const key = 'wv_' + b.pose, r = rectOf('boss', key), sx = x - (r.w >> 1), sy = y - r.h - Math.round(b.jy);
    if (b.pose === 'swoop' && b.t >= bossP('swoopWarn')) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 20, y - 3, 40, 3); }
    spr('boss', key, sx, sy, b.face < 0 && b.pose !== 'fall');
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, b.face < 0 && b.pose !== 'fall'); g.globalAlpha = 1; }
    if (b.state === 'swoop' && b.t < bossP('swoopWarn') && (frame & 4)) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, b.face < 0, '#ff4040'); g.globalAlpha = 1; }
    if (b.rage && b.pose !== 'fall' && frame % 4 === 0) parts.push({ x: b.x + rnd(-30, 30), y: FLOOR_Y - rnd(60, 104), vx: rnd(-2, 2), vy: rnd(-0.5, 0.5), life: 16, col: '#c8e0ff', size: 2, glow: 1 });
    lights.push({ x: b.x, y: FLOOR_Y - 80 - b.jy, r: 60, cool: 1 });
    drawCore(b, lights, 'vcore');
  },
};
