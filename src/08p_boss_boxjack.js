
// =====================================================================
//  AREA BOSS (v0.6): びっくり箱 ボックスジャック BOXJACK (おもちゃ箱の子供部屋 / the jack-in-the-box room)
//    The nursery's jack-in-the-box, wound far too tight for far too long. Not a friend character.
//    blocks: gold marks -> toy blocks tumble onto them (two waves; the 2nd fills the gaps)
//    hop   : red mark under Kanata -> the whole box hops over and lands on it
//    roll  : the lid pops and wind-up blocks roll out both ways along the floor (jump them; rage: a 3rd pair)
//    crank : (every 3rd) the crank turns: the jester's head floats after Kanata on its spring, LOCKS (flashing) ->
//            POP! it slams down there, the spring overstretches and the head flops dizzy: the WIND-UP CORE = weak point
//    rage  : (50%) shorter warnings, more blocks
// =====================================================================
BOSS_DEFS.boxjack = { jp: 'びっくり箱 ボックスジャック', en: 'BOXJACK, THE JACK-IN-THE-BOX', cfg: 'boxjack', cols: ['#c83a3a', '#ffd84a', '#3a8ae8', '#f0e0d0'],
  rageText: 'ぜんまいが巻ききれた！ ボックスジャックが本気になった',
  sayIntro: '……ずっと、開けてもらうのを待ってたの？ ……グリム、びっくりしないでね', sayCore: '……ばねが伸びきった！ 今だよ、グリム',
  make(b) { b.face = -1; b.jy = 0; b.tx = b.x; b.pose = 'closed'; b.markR = 22; b.head = null; },
  hitBox(b) { return { x0: b.x - 24, x1: b.x + 24, y0: FLOOR_Y - (b.pose === 'closed' || b.pose === 'dizzy' ? 50 : 100) - b.jy, y1: FLOOR_Y - b.jy }; },
  aim(b) { return { x: b.x, y: FLOOR_Y - 60 - b.jy }; },
  update(b) {
    const C = CONFIG.boxjack, px = clamp(pcx(), 16, room.W - 16);
    if (b.state === 'idle') b.face = Math.sign(pcx() - b.x) || b.face;
    switch (b.state) {
      case 'idle': b.pose = b.rage ? 'rage' : 'closed'; b.markR = 22;
        if (b.t === 1) b.tx = pcx() < 192 ? rnd(250, 320) : rnd(64, 134);
        b.x += clamp(b.tx - b.x, -1, 1); b.jy = (b.t % 24 < 6) ? 3 : 0;
        if (b.t >= bossP('idle')) { b.jy = 0; chooseAttack(b, ['blocks', 'hop', 'roll'], 'crank'); } break;
      case 'blocks': {
        const warn = bossP('blockWarn'), T2 = warn + 26;
        if (b.t === 1 || b.t === T2) { const n = bossP('blocks'), xs = []; b.pose = 'open';
          if (b.t === 1) { xs.push(px); for (let k = 1; xs.length < n; k++) { xs.push(px + k * 84); if (xs.length < n) xs.push(px - k * 84); } }
          else for (const m of b.first) xs.push(m - 42);
          b.marks = xs.map(x => clamp(x, 16, room.W - 16)); if (b.t === 1) b.first = b.marks.slice(0); b.mT = b.t; sfx('warn');
          tip('jblocks', '金色の印に、積み木が降ってくる！ 二回目は印のすきま'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { b.marks.forEach((mx, i) => ebullets.push({ kind: 'blob', spr: 'toyblock' + (i % 4), x: mx - 6, y: 2 * TS, w: 12, h: 12, vx: 0, vy: 2.5, g: 0.34, dmg: C.blockDamage, life: 200,
              onLand: q => { sfx('tink'); for (let k = 0; k < 4; k++) parts.push({ x: q.x + 6, y: FLOOR_Y - 3, vx: rnd(-1.5, 1.5), vy: rnd(-2, -0.5), life: 14, col: '#f4f0e4', size: 2, grav: 1 }); } }));
          sfx('whoosh'); }
        if (b.t === b.mT + warn + 30) b.marks = [];
        if (b.t >= T2 + warn + 40) { b.marks = []; b.pose = 'closed'; b.state = 'idle'; b.t = 0; } break; }
      case 'hop': {
        const warn = bossP('hopWarn'), air = C.hopAir;
        if (b.t === 1) { b.marks = [clamp(px, 40, room.W - 40)]; b.markR = 50; b.sx0 = b.x; b.pose = 'closed'; sfx('warn'); tip('jhop', 'ボックスジャックが跳んでくる！ 赤い印から離れて'); }
        if (b.t < warn) { if (b.t % 8 === 0) sfx('warn'); b.jy = (b.t % 10 < 3) ? 4 : 0; break; }
        if (b.t === warn) { sfx('jump'); b.sx1 = b.marks[0]; }
        if (b.t < warn + air) { const k = (b.t - warn) / air; b.x = b.sx0 + (b.sx1 - b.sx0) * k; b.jy = Math.sin(k * Math.PI) * 110; break; }
        if (b.t === warn + air) { b.jy = 0; b.x = b.sx1; b.marks = []; sfx('boom'); cam.shake = 8; hitStop = 3;
          if (overlapBox(b.x - 30, FLOOR_Y - 60, b.x + 30, FLOOR_Y)) hurtPlayer(C.hopDamage, b.x, 'hop'); }
        if (b.t >= warn + air + 40) { b.markR = 22; b.state = 'idle'; b.t = 0; } break; }
      case 'roll': {
        const warn = bossP('rollWarn'), n = b.rage ? 3 : 2;
        if (b.t === 1) { b.pose = 'open'; sfx('warn'); tip('jroll', 'ふたが開いた！ ぜんまい積み木が転がってくる… ジャンプでとびこえよう'); }
        if (b.t < warn && b.t % 8 === 0) sfx('tick');
        for (let k = 0; k < n; k++) if (b.t === warn + k * 54) { sfx('jump');
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', spr: 'toyblock' + ((k + (d > 0 ? 1 : 0)) % 4), x: b.x + d * 28 - 6, y: FLOOR_Y - 12, w: 12, h: 12, vx: d * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 220 }); }
        if (b.t >= warn + (n - 1) * 54 + 80) { b.pose = 'closed'; b.state = 'idle'; b.t = 0; } break; }
      case 'crank': {
        const tr = C.headTrack, lk = bossP('headLock');
        if (b.t === 1) { b.head = { x: pcx() }; b.pose = 'open'; b.markR = 30; sfx('warn'); tip('jcrank', 'ぜんまいが巻かれていく… 頭が追ってくる！ 点滅したら止まる、その下から逃げて！'); }
        if (b.t < tr) b.head.x += clamp(pcx() - b.head.x, -1.6, 1.6);
        if (b.t % 6 === 0 && b.t < tr + lk) sfx('tick');
        if (b.t < tr + lk) { b.marks = [b.head.x]; break; }
        if (b.t === tr + lk) { sfx('crash'); cam.shake = 9; hitStop = 3;
          ebullets.push({ kind: 'jackcol', x: b.head.x - 14, y: 2 * TS, w: 28, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.popDamage, life: 14, static: 1 }); }
        if (b.t === tr + lk + 14) b.marks = [];
        if (b.t === tr + lk + 24) { b.head = null; b.state = 'sprung'; b.t = 0; b.pose = 'dizzy'; b.markR = 22; b.winLen = bossP('stun');
          b.coreSide = Math.sign(pcx() - b.x) || 1; if (b.x + b.coreSide * 48 < 30 || b.x + b.coreSide * 48 > room.W - 30) b.coreSide = -b.coreSide;
          b.core = makeCore(b, b.x + b.coreSide * 48, FLOOR_Y - 30, () => ({ x: boss.x, y: FLOOR_Y - 50 }), 'jcore');
          tip('jcore', 'ばねが伸びきった！ 飛び出たぜんまいのコアを VAC で吸い込め！', true); }
        break; }
      case 'sprung': b.pose = 'dizzy'; coreBob(b, b.x + b.coreSide * 48, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'rewind'; b.t = 0; } break;
      case 'rewind': b.pose = b.t < 30 ? 'dizzy' : 'closed'; if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.pose = 'dizzy'; b.marks = []; b.head = null; b.jy = 0; },
  onDefeat(b) { bossReward(b, b.x); sealTip('sealToys'); say('……びっくりした。……でも、ちゃんと遊んでもらえたね', 220); },
  draw(b, lights) {
    const C = CONFIG.boxjack, x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y), top = Math.round(2 * TS - cam.y);
    if (b.state === 'blocks') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('blockWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'hop' && b.marks.length) drawFloorMark(b.marks[0], Math.min(1, b.t / bossP('hopWarn')), 'rgba(255,60,60,0.85)');
    if (b.state === 'crank' && b.head) { const lock = b.t >= C.headTrack, hx = Math.round(b.head.x - cam.x);
      g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,120,120,0.22)' : 'rgba(255,240,200,0.2)') : 'rgba(255,240,200,0.08)'; g.fillRect(hx - 14, top, 28, y - top);
      g.strokeStyle = '#c8c8d0'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 60); g.quadraticCurveTo((x + hx) / 2, top - 10, hx, top + 14); g.stroke();
      spr('boss', 'jackhead', hx - 12, top + 4); drawFloorMark(b.head.x, lock ? 1 : 0.5, 'rgba(255,60,60,0.9)'); }
    if (b.state === 'dying' && b.t >= 90) return;
    const key = 'jb_' + b.pose, r = rectOf('boss', key), sx = x - (r.w >> 1), sy = y - r.h - Math.round(b.jy);
    if (b.jy > 4) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 24, y - 3, 48, 3); }
    spr('boss', key, sx, sy, b.face < 0);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, b.face < 0); g.globalAlpha = 1; }
    if (b.state === 'hop' && b.t < bossP('hopWarn') && (frame & 4)) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, b.face < 0, '#ff4040'); g.globalAlpha = 1; }
    lights.push({ x: b.x, y: FLOOR_Y - 60 - b.jy, r: 56, warm: 1 });
    drawCore(b, lights, 'jcore');
  },
};
