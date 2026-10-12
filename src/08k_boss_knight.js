
// =====================================================================
//  AREA BOSS (v0.5): 空っぽの騎士団長 アイアンホロウ IRON HOLLOW, THE EMPTY CAPTAIN (騎士の武具庫 / the tiltyard)
//    A towering suit of plate armour with nobody inside, still drilling for a master. Not a friend character.
//    halberds  : gold marks -> halberds drop from the rafters onto them (2 waves; the 2nd fills the gaps)
//    slash     : sword raised (red zone in front) -> a big slash + a ground wave toward Kanata (jump it; rage: 2)
//    leap      : red mark under Kanata -> he leaps onto it (landing + waves both ways)
//    greatsword: (every 3rd) a gleam hunts Kanata, LOCKS (flashing) -> he hurls the greatsword down onto it.
//                Disarmed, he kneels and his helmet rolls off: the HOLLOW CORE floats out of the neck = weak point
//    rage      : (50%) shorter warnings, more halberds, the slash sends two waves, the leap doubles
// =====================================================================
BOSS_DEFS.knight = { jp: '空っぽの騎士団長 アイアンホロウ', en: 'IRON HOLLOW, THE EMPTY CAPTAIN', cfg: 'knight', cols: ['#d0d8e8', '#a8242e', '#c9a24a', '#ffffff'],
  rageText: '鎧のすきまから青い炎が吹き出した！ 騎士団長が本気だ',
  sayIntro: '……中身、からっぽ。……なのに、まだ誰かに仕えてる', sayCore: '……首のところから、ゴースト！ グリム、吸って',
  make(b) { b.face = -1; b.jy = 0; b.tx = b.x; b.pose = 'idle'; b.markR = 22; b.gleam = null; },
  hitBox(b) { return b.pose === 'kneel' ? { x0: b.x - 24, x1: b.x + 24, y0: FLOOR_Y - 76, y1: FLOOR_Y } : { x0: b.x - 22, x1: b.x + 22, y0: FLOOR_Y - 104 - b.jy, y1: FLOOR_Y - b.jy }; },
  aim(b) { return { x: b.x, y: FLOOR_Y - (b.pose === 'kneel' ? 46 : 64) - b.jy }; },
  update(b) {
    const C = CONFIG.knight, px = clamp(pcx(), 16, room.W - 16);
    if (b.state === 'idle' || b.state === 'halberds' || b.state === 'leap') b.face = Math.sign(pcx() - b.x) || b.face;
    switch (b.state) {
      case 'idle': b.pose = 'idle'; b.markR = 22;
        if (b.t === 1) b.tx = pcx() < 192 ? rnd(250, 330) : rnd(54, 134);
        b.x += clamp(b.tx - b.x, -1.1, 1.1);
        if (b.t >= bossP('idle')) chooseAttack(b, ['halberds', 'slash', 'leap'], 'greatsword'); break;
      case 'halberds': {
        const warn = bossP('halbWarn'), T2 = warn + 28;
        if (b.t === 1 || b.t === T2) { b.pose = 'raise'; const n = bossP('halberds'), xs = [];
          if (b.t === 1) { xs.push(px); for (let k = 1; xs.length < n; k++) { xs.push(px + k * 96); if (xs.length < n) xs.push(px - k * 96); } }
          else for (const m of b.first) { xs.push(m - 48); } 
          b.marks = xs.map(x => clamp(x, 16, room.W - 16)); if (b.t === 1) b.first = b.marks.slice(0); b.mT = b.t; sfx('tick');
          tip('khalb', '金色の印に、天井から槍斧が落ちてくる！ 印から離れて'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { for (const mx of b.marks) ebullets.push({ kind: 'halberd', x: mx - 6, y: 2 * TS, w: 12, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.halbDamage, life: 22, static: 1 });
          b.marks = []; sfx('thud'); cam.shake = 3; b.pose = 'idle'; }
        if (b.t >= T2 + warn + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'slash': {
        const warn = bossP('slashWarn'), n = b.rage ? 2 : 1;
        if (b.t === 1) { b.face = Math.sign(pcx() - b.x) || b.face; b.pose = 'raise'; sfx('warn'); tip('kslash', '大剣をふりかぶった！ 前の赤いところから離れて、地をはう斬撃はジャンプ！'); }
        if (b.t < warn && b.t % 8 === 0) sfx('warn');
        for (let k = 0; k < n; k++) if (b.t === warn + k * 40) { b.pose = 'slash'; sfx('whoosh'); cam.shake = 5;
          if (overlapBox(Math.min(b.x + b.face * 18, b.x + b.face * 76), FLOOR_Y - 84, Math.max(b.x + b.face * 18, b.x + b.face * 76), FLOOR_Y)) hurtPlayer(C.slashDamage, b.x, 'slash');
          ebullets.push({ kind: 'wave', x: b.x + b.face * 40 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: b.face * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 220 }); }
        for (let k = 1; k < n; k++) if (b.t === warn + k * 40 - 22) b.pose = 'raise';
        if (b.t >= warn + (n - 1) * 40 + 44) { b.state = 'idle'; b.t = 0; } break; }
      case 'leap': {
        const warn = bossP('leapWarn'), air = C.leapAir;
        if (b.t === 1) { b.marks = [clamp(px, 40, room.W - 40)]; b.markR = 58; b.lx0 = b.x; b.leaps = b.rage ? 2 : 1; b.pose = 'raise'; sfx('warn');
          tip('kleap', '騎士団長が跳ぶ！ 赤い印から離れて、着地の波はジャンプでかわせ'); }
        if (b.t < warn) { if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === warn) { sfx('whoosh'); b.lx1 = b.marks[0]; b.pose = 'leap'; }
        if (b.t < warn + air) { const k = (b.t - warn) / air; b.x = b.lx0 + (b.lx1 - b.lx0) * k; b.jy = Math.sin(k * Math.PI) * 100; break; }
        if (b.t === warn + air) { b.jy = 0; b.x = b.lx1; b.marks = []; b.pose = 'idle'; sfx('boom'); cam.shake = 10; hitStop = 3;
          if (overlapBox(b.x - 30, FLOOR_Y - 90, b.x + 30, FLOOR_Y)) hurtPlayer(C.leapDamage, b.x, 'leap');
          for (const d of [-1, 1]) ebullets.push({ kind: 'wave', x: b.x + d * 36 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: d * C.waveSpeed, vy: 0, dmg: C.waveDamage, life: 220 }); }
        if (b.t === warn + air + 34 && --b.leaps > 0) { b.t = 1; b.lx0 = b.x; b.marks = [clamp(clamp(pcx(), 16, room.W - 16), 40, room.W - 40)]; b.pose = 'raise'; sfx('warn'); break; }
        if (b.t >= warn + air + 34) { b.markR = 22; b.state = 'idle'; b.t = 0; } break; }
      case 'greatsword': {
        const tr = C.gleamTrack, lk = bossP('gleamLock');
        if (b.t === 1) { b.gleam = { x: pcx() }; b.markR = 34; b.pose = 'raise'; sfx('warn'); tip('kgsword', '剣の光が追ってくる！ 点滅したら止まる… 光の下から逃げて！'); }
        if (b.t < tr) b.gleam.x += clamp(pcx() - b.gleam.x, -1.6, 1.6);
        if (b.t < tr + lk) { b.marks = [b.gleam.x]; if (b.t % 8 === 0) sfx('warn'); }
        if (b.t === tr + lk) { b.marks = [b.gleam.x]; b.pose = 'slash'; const gx = b.gleam.x;
          ebullets.push({ kind: 'gsword', x: gx - 15, y: 2 * TS - 40, w: 30, h: 72, vx: 0, vy: 5, g: 0.5, dmg: C.gswordDamage, life: 60,
            onLand: q => { sfx('crash'); cam.shake = 10; hitStop = 3; boss.swordAt = q.x + 15; for (let i = 0; i < 16; i++) parts.push({ x: q.x + 15 + rnd(-16, 16), y: FLOOR_Y - 4, vx: rnd(-2.5, 2.5), vy: rnd(-3, -0.5), life: 26, col: i & 1 ? '#d0d8e8' : '#ffffff', size: 2, grav: 1 }); } });
          sfx('whoosh'); }
        if (b.t === tr + lk + 26) { b.marks = []; b.gleam = null; b.state = 'kneel'; b.t = 0; b.pose = 'kneel'; b.markR = 22; b.winLen = bossP('stun'); sfx('crash');
          b.helm = { x: b.x, y: FLOOR_Y - 92, vx: (b.x < 192 ? 1 : -1) * 1.6, vy: -3 };
          b.coreSide = Math.sign(pcx() - b.x) || 1; if (b.x + b.coreSide * 40 < 30 || b.x + b.coreSide * 40 > room.W - 30) b.coreSide = -b.coreSide;
          b.core = makeCore(b, b.x + b.coreSide * 40, FLOOR_Y - 30, () => ({ x: boss.x, y: FLOOR_Y - 76 }), 'acore');
          tip('kcore', '剣を失って騎士団長がひざをついた！ 首から出てきたコアを VAC で吸い込め！', true); }
        break; }
      case 'kneel': coreBob(b, b.x + b.coreSide * 40, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'rise'; b.t = 0; } break;
      case 'rise': b.pose = b.t < 30 ? 'kneel' : 'idle'; if (b.t === 30) { b.helm = null; b.swordAt = null; } if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
    if (b.helm) { const h = b.helm; h.vy += 0.3; h.x += h.vx; h.y += h.vy; if (h.y > FLOOR_Y - 12) { h.y = FLOOR_Y - 12; h.vy = -h.vy * 0.4; h.vx *= 0.7; if (Math.abs(h.vy) < 0.6) h.vy = 0; } }
  },
  dying(b) { b.pose = 'kneel'; b.marks = []; b.gleam = null; b.jy = 0; },
  onDefeat(b) { bossReward(b, b.x); say('……おやすみなさい、騎士団長さん。……もう、だれにも仕えなくていいよ', 230); },
  draw(b, lights) {
    const C = CONFIG.knight, x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y);
    if (b.state === 'halberds') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('halbWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'leap' && b.marks.length) drawFloorMark(b.marks[0], Math.min(1, b.t / bossP('leapWarn')), 'rgba(255,60,60,0.85)');
    if (b.state === 'slash' && b.pose === 'raise') { const x0 = x + b.face * 18, x1 = x + b.face * 76; g.fillStyle = (frame & 4) ? 'rgba(255,60,60,0.22)' : 'rgba(255,60,60,0.12)'; g.fillRect(Math.min(x0, x1), y - 84, Math.abs(x1 - x0), 84); }
    if (b.state === 'slash' && b.pose === 'slash') { g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 50, 60, b.face > 0 ? -1.2 : Math.PI - 0.4, b.face > 0 ? 0.4 : Math.PI + 1.2); g.stroke(); }
    if (b.state === 'greatsword' && b.gleam) { const lock = b.t >= C.gleamTrack, gx = b.gleam.x - cam.x;
      g.globalCompositeOperation = 'lighter'; g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,120,120,0.30)' : 'rgba(220,240,255,0.30)') : 'rgba(200,230,255,0.14)';
      g.fillRect(Math.round(gx - 16), Math.round(2 * TS - cam.y), 32, y - Math.round(2 * TS - cam.y)); g.globalCompositeOperation = 'source-over';
      drawFloorMark(b.gleam.x, lock ? 1 : 0.5, 'rgba(255,60,60,0.9)'); lights.push({ x: b.gleam.x, y: FLOOR_Y - 20, r: 44, cool: 1 }); }
    if (b.swordAt) spr('boss', 'greatsword', Math.round(b.swordAt - cam.x) - 7, y - 52);
    if (b.helm) spr('boss', 'helm', Math.round(b.helm.x - cam.x) - 12, Math.round(b.helm.y - cam.y) - 13);
    if (b.state === 'dying' && b.t >= 90) return;
    const key = 'kn_' + b.pose, r = rectOf('boss', key), sx = x - (r.w >> 1), sy = y - r.h - Math.round(b.jy) + (b.pose === 'idle' ? Math.round(Math.sin(frame * 0.06) * 1) : 0);
    spr('boss', key, sx, sy, b.face < 0);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, b.face < 0); g.globalAlpha = 1; }
    if (b.rage && b.pose !== 'kneel' && frame % 3 === 0) parts.push({ x: b.x + rnd(-14, 14), y: FLOOR_Y - 96 - b.jy + rnd(0, 20), vx: rnd(-0.3, 0.3), vy: -rnd(0.4, 1), life: 18, col: '#6af0ff', size: 2, glow: 1 });
    if ((b.state === 'leap' && b.t < bossP('leapWarn')) && (frame & 4)) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, b.face < 0, '#ff4040'); g.globalAlpha = 1; }
    lights.push({ x: b.x, y: FLOOR_Y - 60 - b.jy, r: 64, cool: 1 });
    drawCore(b, lights, 'acore');
  },
};
