
// =====================================================================
//  AREA BOSS (v0.4): 人形座長 ストリングス MAESTRO STRINGS (人形劇場の舞台 / puppet theater stage)
//    A life-size marionette conductor that works his own strings from the rigging. Not a friend character.
//    cut      : gold marks -> his strings whip straight down (2 waves; the 2nd fills the 1st's gaps)
//    dance    : a red mark under Kanata -> he leaps onto it: landing + sparkle waves both ways (jump them)
//    masks    : pink marks -> the troupe's masks are tossed in high arcs onto them (one leaves a PLATE = ammo)
//    spotlight: (every 3rd) a spotlight hunts Kanata, LOCKS (flashing) -> a sandbag drops from the rigging.
//               The rigging jerks, his strings tangle and he slumps: the MASK CORE pops out = weak point
//    rage     : (50%) shorter warnings, more masks, the dance becomes a double leap
// =====================================================================
BOSS_DEFS.marionette = { jp: '人形座長 ストリングス', en: 'MAESTRO STRINGS', cfg: 'marionette', cols: ['#e8c8a0', '#2a2040', '#ff6a8a', '#ffffff'],
  rageText: '座長が怒った！ 糸がぎりぎり鳴っている',
  sayIntro: '……おおきな、あやつり人形。……誰が糸を引いてるの？', sayCore: '……仮面のゴースト。……吸っちゃえ',
  make(b) { b.face = -1; b.jy = 0; b.tx = b.x; b.pose = 'idle'; b.markR = 22; b.spot = null; },
  hitBox(b) { return { x0: b.x - 22, x1: b.x + 22, y0: FLOOR_Y - 96 - b.jy, y1: FLOOR_Y - 10 - b.jy }; },
  aim(b) { return { x: b.x, y: FLOOR_Y - 58 - b.jy }; },
  update(b) {
    const C = CONFIG.marionette, px = clamp(pcx(), 16, room.W - 16);
    b.face = Math.sign(pcx() - b.x) || b.face;
    switch (b.state) {
      case 'idle': b.pose = 'idle'; b.markR = 22;
        if (b.t === 1) b.tx = pcx() < 192 ? rnd(250, 330) : rnd(54, 134);   // dances back to the far side of the stage
        b.x += clamp(b.tx - b.x, -1.2, 1.2);
        if (b.t >= bossP('idle')) chooseAttack(b, ['cut', 'dance', 'masks'], 'spotlight'); break;
      case 'cut': {
        const warn = bossP('cutWarn'), T2 = warn + 28;
        if (b.t === 1 || b.t === T2) { b.pose = 'cast'; b.marks = (b.t === 1 ? [px, px - 96, px + 96] : [px - 48, px + 48]).map(x => clamp(x, 16, room.W - 16)); b.mT = b.t; sfx('tick');
          tip('mcut', '金色の印に、座長の糸が振り下ろされる！ 印から離れて'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { for (const mx of b.marks) ebullets.push({ kind: 'string', x: mx - 5, y: 2 * TS, w: 10, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.cutDamage, life: 22, static: 1 });
          b.marks = []; sfx('whoosh'); cam.shake = 2; }
        if (b.t >= T2 + warn + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'dance': {
        const warn = bossP('leapWarn'), air = C.leapAir;
        if (b.t === 1) { b.marks = [clamp(px, 40, room.W - 40)]; b.markR = 58; b.lx0 = b.x; b.leaps = b.rage ? 2 : 1; b.pose = 'cast'; sfx('warn');
          tip('mdance', '座長が跳ぶ！ 赤い印から離れて、着地の波はジャンプでかわせ'); }
        if (b.t < warn) { if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === warn) { sfx('whoosh'); b.lx1 = b.marks[0]; b.pose = 'jump'; }
        if (b.t < warn + air) { const k = (b.t - warn) / air; b.x = b.lx0 + (b.lx1 - b.lx0) * k; b.jy = Math.sin(k * Math.PI) * 110; break; }
        if (b.t === warn + air) { b.jy = 0; b.x = b.lx1; b.marks = []; b.pose = 'idle'; sfx('boom'); cam.shake = 9; hitStop = 3;
          if (overlapBox(b.x - 30, FLOOR_Y - 90, b.x + 30, FLOOR_Y)) hurtPlayer(C.leapDamage, b.x, 'dance');
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', x: b.x + d * 36 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: d * C.waveSpeed, vy: 0, dmg: 1, life: 220 });
          for (let i = 0; i < 16; i++) parts.push({ x: b.x + rnd(-30, 30), y: FLOOR_Y - 4, vx: rnd(-2, 2), vy: rnd(-3, -0.5), life: 26, col: i & 1 ? '#ffe080' : '#ff8ab0', size: 2, grav: 1 }); }
        if (b.t === warn + air + 34 && --b.leaps > 0) { b.t = 1; b.lx0 = b.x; b.marks = [clamp(clamp(pcx(), 16, room.W - 16), 40, room.W - 40)]; b.pose = 'cast'; sfx('warn'); break; }
        if (b.t >= warn + air + 34) { b.markR = 22; b.state = 'idle'; b.t = 0; } break; }
      case 'masks': {
        const warn = bossP('maskWarn'), fl = C.maskFlight;
        if (b.t === 1) { const n = bossP('masks'); const xs = [px]; for (let k = 1; xs.length < n; k++) { xs.push(px + k * 64); if (xs.length < n) xs.push(px - k * 64); }
          b.marks = xs.map(x => clamp(x, 20, room.W - 20)); b.markR = 20; b.pose = 'cast'; sfx('warn'); tip('mmask', '桃色の印に、劇団の仮面が投げこまれる！ 印と印のあいだへ'); }
        if (b.t < warn && b.t % 12 === 0) sfx('warn');
        if (b.t === warn) { let i = 0; b.flyers = [];   // tossed up over the marks, then they drop straight down
          for (const mx of b.marks) { const plate = i++ === 0, q = { kind: 'maskshot', x: b.x - 7, y: FLOOR_Y - 96, w: 14, h: 12, vx: 0, vy: 0, g: 0, dmg: C.maskDamage, life: 400, static: 1,
            onLand: q => { for (let k = 0; k < 6; k++) parts.push({ x: q.x + 7, y: FLOOR_Y - 3, vx: rnd(-1.5, 1.5), vy: rnd(-2, -0.5), life: 16, col: '#ffd0e0', size: 2, grav: 1 }); sfx('tink'); if (plate) spawnItem('plate', clamp(q.x + 7, 24, room.W - 24), FLOOR_Y); } };
            b.flyers.push({ q, x0: b.x, y0: FLOOR_Y - 96, tx: mx }); ebullets.push(q); }
          b.pose = 'idle'; sfx('whoosh'); }
        if (b.t > warn && b.flyers) { const k = Math.min(1, (b.t - warn) / 24);
          for (const f of b.flyers) { f.q.x = f.x0 + (f.tx - f.x0) * k - 7; f.q.y = f.y0 + (60 - f.y0) * k - Math.sin(k * Math.PI) * 30;
            if (k >= 1) { f.q.static = 0; f.q.vy = 0.5; f.q.g = 0.32; } }
          if (k >= 1) b.flyers = null; }
        if (b.t === warn + fl + 2) b.marks = [];
        if (b.t >= warn + fl + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'spotlight': {
        const tr = C.spotTrack, lk = bossP('spotLock');
        if (b.t === 1) { b.spot = { x: pcx() }; b.markR = 34; b.pose = 'cast'; sfx('warn'); tip('mspot', 'スポットライトが追ってくる！ 点滅したら止まる… 光の下から逃げて！'); }
        if (b.t < tr) b.spot.x += clamp(pcx() - b.spot.x, -1.6, 1.6);
        if (b.t < tr + lk) { b.marks = [b.spot.x]; if (b.t % 8 === 0) sfx('warn'); }
        if (b.t === tr + lk) { b.marks = [b.spot.x]; ebullets.push({ kind: 'sandbag', x: b.spot.x - 20, y: 2 * TS, w: 40, h: 36, vx: 0, vy: 4, g: 0.45, dmg: C.bagDamage, life: 60,
          onLand: q => { sfx('boom'); cam.shake = 10; hitStop = 3; for (let i = 0; i < 18; i++) parts.push({ x: q.x + rnd(0, 40), y: FLOOR_Y - 4, vx: rnd(-2.5, 2.5), vy: rnd(-3, -0.5), life: 30, col: i & 1 ? '#c8a878' : '#e8d8b0', size: 2, grav: 1 }); } }); sfx('whoosh'); }
        if (b.t === tr + lk + 26) { b.marks = []; b.spot = null; b.state = 'slump'; b.t = 0; b.pose = 'slump'; b.markR = 22; b.winLen = bossP('stun'); sfx('crash');
          b.coreSide = Math.sign(pcx() - b.x) || 1; b.core = makeCore(b, b.x + b.coreSide * 40, FLOOR_Y - 30, () => ({ x: boss.x, y: FLOOR_Y - 50 }), 'mcore');
          tip('mcore', '糸がからまって座長がくずれ落ちた！ 仮面のコアを VAC で吸い込め！', true); }
        break; }
      case 'slump': coreBob(b, b.x + b.coreSide * 40, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'rise'; b.t = 0; } break;
      case 'rise': b.pose = b.t < 30 ? 'slump' : 'idle'; if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.pose = 'slump'; b.marks = []; b.spot = null; b.jy = 0; b.flyers = null; },
  onDefeat(b) { bossReward(b, b.x); say('……糸、ぜんぶほどけた。……おつかれさま、座長さん', 220);
    tip('sealTheater', '時計塔の封印がひとつ解けた！（' + ['clock', 'marionette', 'orrery'].filter(k => progress.bosses.has(k)).length + ' / 3）', true);
    checkBossGates(); velAppear('marionette', b.x > 192 ? 60 : 324, FLOOR_Y); },
  draw(b, lights) {
    const C = CONFIG.marionette, x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y);
    if (b.state === 'cut') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('cutWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'masks') for (const m of b.marks) drawFloorMark(m, Math.min(1, b.t / bossP('maskWarn')), 'rgba(255,110,170,0.9)');
    if (b.state === 'dance' && b.marks.length) drawFloorMark(b.marks[0], Math.min(1, b.t / bossP('leapWarn')), 'rgba(255,60,60,0.85)');
    if (b.state === 'spotlight' && b.spot) { const lock = b.t >= C.spotTrack, sx = b.spot.x - cam.x, top = 2 * TS - cam.y;
      g.globalCompositeOperation = 'lighter'; g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,120,120,0.30)' : 'rgba(255,240,200,0.30)') : 'rgba(255,240,190,0.16)';
      g.beginPath(); g.moveTo(sx - 6, top); g.lineTo(sx + 6, top); g.lineTo(sx + 30, y); g.lineTo(sx - 30, y); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
      drawFloorMark(b.spot.x, lock ? 1 : 0.5, 'rgba(255,60,60,0.9)'); lights.push({ x: b.spot.x, y: FLOOR_Y - 20, r: 50, warm: 1 }); }
    if (b.state === 'dying' && b.t >= 90) return;
    const key = b.pose === 'jump' ? 'str_jump' : b.pose === 'cast' ? 'str_cast' : b.pose === 'slump' ? 'str_slump' : 'str_idle' + ((frame >> 4) & 1);
    const r = rectOf('boss', key), sx = x - (r.w >> 1), sy = y - r.h - Math.round(b.jy) + (b.pose === 'slump' ? 0 : Math.round(Math.sin(frame * 0.07) * 2) - 2);
    // the control strings run up into the dark rigging (slack + tangled while slumped)
    g.strokeStyle = 'rgba(230,230,255,0.55)'; g.lineWidth = 1;
    for (const [ox, oy] of [[-20, 58], [20, 58], [-6, 6], [6, 6], [-10, 96], [10, 96]]) { g.beginPath(); g.moveTo(sx + 32 + ox, sy + oy);
      if (b.pose === 'slump') g.quadraticCurveTo(sx + 32 + ox * 2 + Math.sin(frame * 0.1 + ox) * 6, (sy + 2 * TS - cam.y) / 2, sx + 32 + ox * 0.3, 2 * TS - cam.y); else g.lineTo(sx + 32 + ox * 0.5, 2 * TS - cam.y); g.stroke(); }
    spr('boss', key, sx, sy, b.face < 0);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, b.face < 0); g.globalAlpha = 1; }
    if (b.state === 'dance' && b.t < bossP('leapWarn') && (frame & 4)) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, b.face < 0, '#ff4040'); g.globalAlpha = 1; }
    if (b.state === 'slump') for (let i = 0; i < 4; i++) { const an = frame * 0.12 + i * 1.57; g.fillStyle = '#ffe080'; g.fillRect(Math.round(x + Math.cos(an) * 18), Math.round(y - 92 + Math.sin(an) * 4), 2, 2); }
    lights.push({ x: b.x, y: FLOOR_Y - 60 - b.jy, r: 60, warm: 1 });
    drawCore(b, lights, 'mcore');
  },
};
