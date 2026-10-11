
// =====================================================================
//  BOSS 4 (final): 大時計の番人 グランドファーザー・チクタク GRANDFATHER TICKTOCK (great clock chamber)
//    hands    : red lines from the ceiling mark Kanata's spot (+ more when enraged) -> the clock hands stab down
//    gears    : gears rattle in its base -> gears roll along the floor (jump them / vacuum them = GEAR ammo, bounces)
//    pendulum : the pendulum glows + dotted arc -> it swings out across the whole room (stand near a wall, or jump over at the centre)
//    chime    : (every 3rd) strikes twelve: three rings, then floor shockwaves (jump) -> overwound and stopped:
//               the cuckoo-ghost core pops out = weak point.
//    midnight : (v0.3b, phase 2) the room goes dark: a chain of hand stabs chases Kanata (+ gears in OVERDRIVE)
//    combo    : (v0.3b, phase 2) hands stab during the pendulum swing; OVERDRIVE (25% HP): faster everything, double chime quake  Beating it = the end of v0.2.
// =====================================================================
BOSS_DEFS.clock = { jp: '大時計の番人 チクタク', en: 'GRANDFATHER TICKTOCK', cfg: 'clock', cols: ['#ffe080', '#c9a24a', '#ffffff', '#8a6a2a'], rageText: '大時計が怒った！ 針が速くなった', overText: '大時計が暴走した！ 真夜中の鐘が鳴りやまない…',
  sayIntro: '……時計のおばけ。……もう寝る時間なのに', sayCore: '……鳩時計の、ゴースト……',
  PIV: { x: 192, y: 34 }, PLEN: 190,
  make(b) { b.x = 192; b.tx = 192; b.pend = 0; b.pendOut = false; },
  hitBox(b) { return { x0: b.x - 28, x1: b.x + 28, y0: FLOOR_Y - 120, y1: FLOOR_Y }; },
  aim(b) { return { x: b.x, y: FLOOR_Y - 70 }; },
  bob(b) { const P0 = this.PIV, a = b.pend; return { x: P0.x + Math.sin(a) * this.PLEN, y: P0.y + Math.cos(a) * this.PLEN }; },
  update(b) {
    const C = CONFIG.clock, D = this;
    b.x += clamp(b.tx - b.x, -0.6, 0.6);
    switch (b.state) {
      case 'idle': if (b.t === 1) b.tx = clamp(pcx() < 192 ? 230 : 154, 120, 264); if (b.t >= bossP('idle')) chooseAttack(b, b.rage ? ['hands', 'gears', 'pendulum', 'midnight'] : ['hands', 'gears', 'pendulum'], 'chime'); break;
      case 'hands': {
        const warn = bossP('handWarn');
        if (b.t === 1) b.wave = 0;
        if (b.t === 1 || b.t === b.retgt) { const n = bossP('hands'), px = pcx(); b.marks = [clamp(px, 16, room.W - 16)]; for (let k = 1; b.marks.length < n; k++) { b.marks.push(clamp(px + (k & 1 ? 1 : -1) * Math.ceil(k / 2) * 60, 16, room.W - 16)); } sfx('warn'); }
        if (b.t < warn && b.t % 10 === 0) sfx('tick');
        if (b.t === warn) { for (const mx of b.marks) ebullets.push({ kind: 'hand', x: mx - 5, y: 2 * TS, w: 10, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.handDamage, life: 22, static: 1 }); b.marks = []; sfx('thorn'); cam.shake = 5; }
        if (b.t >= warn + 34) { if (b.wave < (b.rage ? 2 : 1)) { b.wave++; b.t = b.retgt = 4; } else { b.state = 'idle'; b.t = 0; b.retgt = -1; } } break; }
      case 'gears': {
        if (b.t === 1) { sfx('warn'); b.handT = 0; b.marks = []; }
        const n = bossP('gears');
        if (b.t === 40 || (b.rage && b.t === 106)) b.marks = [clamp(pcx(), 16, room.W - 16)], b.handT = b.t + bossP('handWarn');  // a hand stabs during the gear roll (twice when enraged)
        if (b.handT && b.t === b.handT) { for (const mx of b.marks) ebullets.push({ kind: 'hand', x: mx - 5, y: 2 * TS, w: 10, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: 1, life: 22, static: 1 }); b.marks = []; b.handT = 0; sfx('thud'); }
        if (b.t >= 34 && (b.t - 34) % 22 === 0 && (b.t - 34) / 22 < n) { const i = (b.t - 34) / 22, d = i % 2 === 0 ? Math.sign(pcx() - b.x) || 1 : -(Math.sign(pcx() - b.x) || 1);
          ebullets.push({ kind: 'rgear', x: b.x + d * 26 - 7, y: FLOOR_Y - 14, w: 14, h: 14, vx: d * C.gearSpeed * (b.over ? 1.35 : b.rage ? 1.2 : 1), vy: 0, g: 0, dmg: C.gearDamage, life: 400, static: 1, suckable: true, ammo: 'gear', bounces: 1, roll: 1 }); sfx('tick'); }
        if (b.t >= 34 + n * 22 + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'pendulum': {
        const warn = bossP('pendWarn');
        if (b.t === 1) { b.pdir = pcx() < 192 ? 1 : -1; b.pend = -b.pdir * 1.25; sfx('warn'); }
        if (b.t < warn) { if (b.t % 12 === 0) sfx('tick'); break; }
        const k = Math.min(1, (b.t - warn) / 100); b.pendOut = k < 1; b.pend = -b.pdir * 1.25 * Math.cos(k * Math.PI);
        if (b.pendOut) { const bb = D.bob(b); if (overlapBox(bb.x - 13, bb.y - 13, bb.x + 13, bb.y + 13)) hurtPlayer(C.pendDamage, bb.x, 'pendulum');
          if (frame % 2 === 0) parts.push({ x: bb.x + rnd(-6, 6), y: bb.y + rnd(-6, 6), vx: 0, vy: 0, life: 12, col: '#ffe080', size: 2, glow: 1 }); }
        if (b.t === warn + 50) sfx('whoosh');
        if (b.rage && (b.t === warn + 24 || (b.over && b.t === warn + 64))) { b.marks = [clamp(pcx(), 16, room.W - 16)]; b.handT = b.t + bossP('handWarn') + 6; }   // combo: a hand stab during the swing
        if (b.handT && b.t === b.handT) { for (const mx of b.marks) ebullets.push({ kind: 'hand', x: mx - 5, y: 2 * TS, w: 10, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: 1, life: 22, static: 1 }); b.marks = []; b.handT = 0; sfx('thud'); }
        if (b.t >= warn + 120) { b.state = 'idle'; b.t = 0; b.pendOut = false; b.marks = []; b.handT = 0; } break; }
      case 'midnight': {
        const n = bossP('midStabs'), gap = C.midGap, w = C.midWarn;
        if (b.t === 1) { b.mids = []; sfx('bell'); cam.shake = 4; tip('midnight', '真夜中！ 針が追いかけてくる。止まらず走りつづけろ'); }
        // v0.3.2: one chasing stab at a time, aimed at where Kanata IS (no lead) - always escapable by moving
        if (b.t === 20) b.midN = 0;
        if (b.t >= 20 && !b.mids.length && b.midN < n && b.t >= (b.midNext || 0)) { b.mids.push({ x: clamp(pcx(), 16, room.W - 16), t: b.t + w }); b.midN++; sfx('tick'); }
        for (const m of b.mids) if (m.t === b.t) { ebullets.push({ kind: 'hand', x: m.x - 5, y: 2 * TS, w: 10, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.handDamage, life: 22, static: 1 }); sfx('thud'); cam.shake = 2; b.midNext = b.t + gap; }
        b.mids = b.mids.filter(m => m.t > b.t); b.marks = b.mids.map(m => m.x);
        if (b.over && (b.t === 30 || b.t === 80)) for (const d of [-1, 1]) ebullets.push({ kind: 'rgear', x: b.x + d * 26 - 7, y: FLOOR_Y - 14, w: 14, h: 14, vx: d * C.gearSpeed, vy: 0, g: 0, dmg: C.gearDamage, life: 400, static: 1, suckable: true, ammo: 'gear', bounces: 0, roll: 1 });
        if (b.midN >= n && !b.mids.length && b.t >= (b.midNext || 0) + 30) { b.state = 'idle'; b.t = 0; b.marks = []; } break; }
      case 'chime': {
        for (const k of [20, 44, 68]) if (b.t === k) { sfx('bell'); cam.shake = 5; b.ring = 1; }
        if (b.ring) b.ring++;
        if (b.t === 80 || (b.over && b.t === 36)) { for (const d of [-1, 1]) ebullets.push({ kind: 'wave', x: b.x + d * 30 - 8, y: FLOOR_Y - 14, w: 16, h: 14, vx: d * 2.4, vy: 0, dmg: 1, life: 200 }); sfx('boom'); }
        if (b.t === 100) { b.state = 'stopped'; b.t = 0; b.winLen = bossP('chime'); sfx('crash'); const side = Math.sign(pcx() - b.x) || 1;
          b.core = makeCore(b, b.x + side * 36, FLOOR_Y - 30, () => ({ x: boss.x, y: FLOOR_Y - 96 }), 'ccore'); b.coreSide = side;
          tip('ccore', '時計が止まった！ 鳩時計のゴーストを VAC で吸い込め！', true); }
        break; }
      case 'stopped': coreBob(b, b.x + b.coreSide * 36, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'rewind'; b.t = 0; } break;
      case 'rewind': if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
    if (b.state !== 'stopped' && overlapBox(b.x - 22, FLOOR_Y - 116, b.x + 22, FLOOR_Y)) hurtPlayer(C.contactDamage, b.x, 'clock');
  },
  onDefeat(b) { bossReward(b, b.x); say('……止まった。……でも、まだ上から、チクタクって聞こえる', 220); checkBossGates();   // v0.4: no longer the last boss
    if (progress.perm.has('clockroom:gate:heart')) tip('clockDown', 'チクタクをやっつけた！ 奥の扉が開いた… 時計塔の最上階へ', true);
    else tip('clockDown', 'チクタクをやっつけた！ 奥の扉には、まだ封印が残っている…', true);
    velAppear('clock', b.x + 70, FLOOR_Y); },
  draw(b, lights) {
    const D = this, x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y);
    if (b.state === 'midnight') { g.fillStyle = 'rgba(10,0,30,' + Math.min(0.45, b.t / 40) + ')'; g.fillRect(0, 0, VW, VH); }
    if ((b.state === 'hands' || b.state === 'gears' || b.state === 'pendulum' || b.state === 'midnight') && b.marks.length) { const k = b.state === 'hands' ? b.t / bossP('handWarn') : 0.7; for (const mx of b.marks) { drawFloorMark(mx, k, 'rgba(255,60,60,0.75)'); g.fillStyle = (frame & 4) ? 'rgba(255,80,80,0.45)' : 'rgba(255,200,160,0.25)'; for (let yy = 2 * TS; yy < FLOOR_Y; yy += 6) g.fillRect(Math.round(mx - cam.x), Math.round(yy - cam.y), 1, 3); } }
    if (b.state === 'pendulum' && b.t < bossP('pendWarn')) { g.fillStyle = (frame & 4) ? 'rgba(255,220,120,0.7)' : 'rgba(255,220,120,0.3)'; for (let a = -1.25; a <= 1.25; a += 0.05) { const px = D.PIV.x + Math.sin(a) * D.PLEN, py = D.PIV.y + Math.cos(a) * D.PLEN; g.fillRect(Math.round(px - cam.x), Math.round(py - cam.y), 2, 2); } }
    if (b.state === 'dying' && b.t >= 90) return;
    // swinging pendulum (outside the body)
    if (b.state === 'pendulum' && b.t >= bossP('pendWarn')) { const bb = D.bob(b); g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.beginPath(); g.moveTo(D.PIV.x - cam.x, D.PIV.y - cam.y); g.lineTo(bb.x - cam.x, bb.y - cam.y); g.stroke(); g.lineWidth = 1;
      spr('boss', 'pend_bob', Math.round(bb.x - cam.x - 16), Math.round(bb.y - cam.y - 16)); lights.push({ x: bb.x, y: bb.y, r: 50, warm: 1 }); }
    const key = b.state === 'stopped' || b.state === 'dying' ? 'clock_stop' : b.rage ? 'clock_rage' : 'clock_body', r = rectOf('boss', key);
    let sx = x - (r.w >> 1) + ((b.state === 'hands' || b.state === 'chime') && b.t < 40 ? ((frame & 2) ? 1 : -1) : 0), sy = y - r.h;
    spr('boss', key, sx, sy);
    // face hands (inside the body sprite)
    const fx = x, fy = y - 96, hr = b.state === 'stopped' ? 0 : frame * 0.05, mr = b.state === 'stopped' ? 0 : frame * 0.004;
    g.fillStyle = '#2a1a10'; for (let i = 0; i < 9; i++) { g.fillRect(Math.round(fx + Math.sin(hr) * i), Math.round(fy - Math.cos(hr) * i), 1, 1); if (i < 6) g.fillRect(Math.round(fx + Math.sin(mr) * i), Math.round(fy - Math.cos(mr) * i), 2, 1); }
    // inner pendulum
    if (!(b.state === 'pendulum' && b.t >= bossP('pendWarn'))) { const a = b.state === 'stopped' ? 0 : Math.sin(frame * 0.08) * 0.35; g.fillStyle = '#c9a24a'; for (let i = 0; i < 26; i++) g.fillRect(Math.round(fx + Math.sin(a) * i), Math.round(y - 66 + i), 1, 1);
      g.fillStyle = (b.state === 'pendulum' && (frame & 4)) ? '#fff0a0' : '#e0b040'; g.beginPath(); g.arc(fx + Math.sin(a) * 28, y - 38, 5, 0, 7); g.fill(); }
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy); g.globalAlpha = 1; }
    if (b.ring) { g.strokeStyle = 'rgba(255,230,150,' + Math.max(0, 0.7 - b.ring / 30) + ')'; g.beginPath(); g.arc(fx, fy, 10 + b.ring * 3, 0, 7); g.stroke(); if (b.ring > 24) b.ring = 0; }
    if (b.state === 'stopped') for (let i = 0; i < 4; i++) { const an = frame * 0.12 + i * 1.57; g.fillStyle = '#ffe080'; g.fillRect(Math.round(fx + Math.cos(an) * 24), Math.round(fy - 30 + Math.sin(an) * 4), 2, 2); }
    lights.push({ x: b.x, y: FLOOR_Y - 96, r: 70, warm: 1 });
    drawCore(b, lights, 'ccore');
  },
};
