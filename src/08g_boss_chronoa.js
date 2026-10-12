
// =====================================================================
//  TRUE FINAL BOSS (v0.4): 時計塔管理人 クロノア CHRONOA (時計塔の心臓 / clock heart)
//    One of the 13 mimic girls. Languid, hates being hurried. Her mimic is the huge clock face with a giant
//    eye behind her (チクタク downstairs was only its servant = the midboss). Every attack is telegraphed
//    and checked by tools/avoid.js (a safe spot exists and is reachable after a 300 ms reaction).
//    hands    : ticking gold marks -> clock hands stab down (2 waves; the 2nd fills the 1st's gaps)
//    pendulum : her pocket watch swings on its chain across the room (dotted arc first): jump it,
//               or wait by a wall where it passes high
//    rewind   : dotted lines fan out -> sand orbs fly down them, stop, then REWIND back up the same lines
//    slow     : 時の淀み - purple slow-time zones (you move slowly inside, but the sand never falls there)
//               + three volleys of sand columns everywhere else
//    beam     : (every 3rd) the eye charges and tracks Kanata (red line), LOCKS (flashing) -> fires.
//               Exhausted, the eye shuts: its EYE CORE drops out = weak point (tug-of-war)
//    rage     : (50%) the clock face cracks, shorter warnings, more orbs / swings
// =====================================================================
const CHR_PIVOT = { x: 192, y: 40 }, CHR_PLEN = 170;
// v0.4.2 final art (assets/gaiden_src/chronoa.png, 128x80 cells, right-facing, feet (64,79), used 1:1). Spawn points from the
// artist's README, cell-local; facing left mirrors x -> 127-x.
const CHR_ART = { watch: [111, 61], glyph: [108, 41], beam: [121, 35], eyeBeam: [102, 35], eyeIdle: [26, 44], cracked: [98, 64] };
function chrPt(b, p, face) { const f = face || b.face; return { x: b.cx - 64 + (f > 0 ? p[0] : 127 - p[0]), y: FLOOR_Y - 79 + p[1] }; }
// where the clock mimic's eye is right now (behind her, or floating in front while she charges / fires the beam)
function chrEye(b) { return chrPt(b, b.pose === 'beam' || b.pose === 'charge' ? CHR_ART.eyeBeam : CHR_ART.eyeIdle); }
BOSS_DEFS.chronoa = { jp: '時計塔管理人 クロノア', en: 'CHRONOA, KEEPER OF THE CLOCK TOWER', cfg: 'chronoa', cols: ['#56d0c0', '#f3d98a', '#ffffff', '#b07a52'],
  rageText: '時計の目が怒りに燃えた！ クロノアが少しだけ本気になった',
  sayIntro: '……女の子。……うしろの時計、目がある……', sayCore: '……目の中に、ゴースト……',
  make(b) { b.cx = 290; b.cy = FLOOR_Y; b.tx = 290; b.face = -1; b.eye = 'open'; b.zones = []; b.orbs = []; b.pose = 'idle'; b.markR = 20; b.hand = 0; const e = chrEye(b); b.mx = e.x; b.my = e.y; },
  intro(b) { if (b.t === 20) storySay('chronoa', '……まだ、終わってないよ。急いでる人、嫌い……', 230); b.face = Math.sign(pcx() - b.cx) || b.face; },
  hitBox(b) { const e = chrEye(b); return { x0: Math.min(b.cx - 14, e.x - 19), x1: Math.max(b.cx + 14, e.x + 19), y0: Math.min(FLOOR_Y - 70, e.y - 21), y1: FLOOR_Y }; },
  aim(b) { return b.state === 'shut' ? null : { x: b.mx, y: b.my }; },
  update(b) {
    const C = CONFIG.chronoa;
    const dxm = clamp(b.tx - b.cx, -1.1, 1.1); b.cx += dxm; b.moving = Math.abs(dxm) > 0.3;   // she walks (languidly) on the floor now
    if (b.state === 'idle') b.face = b.moving ? Math.sign(dxm) : (Math.sign(pcx() - b.cx) || b.face);
    { const e = chrEye(b); b.mx = e.x; b.my = e.y; }
    if (b.rage && !b.angry) { b.angry = true; storySay('chronoa', '……もう。……ちょっとだけ、本気……', 200); }
    if (b.state !== 'slow') b.zones = b.zones.filter(z => (z.life -= 3) > 0);
    switch (b.state) {
      case 'idle': b.pose = 'idle'; b.markR = 20; if (b.t === 1) b.face = Math.sign(pcx() - b.cx) || b.face;
        if (b.t === 1) b.tx = pcx() < 192 ? 290 : 94;   // drifts to the side away from Kanata
        if (b.t >= bossP('idle')) chooseAttack(b, ['hands', 'pendulum', 'rewind', 'slow'], 'beam'); break;
      case 'hands': {
        const warn = bossP('handWarn'), T2 = warn + 28;
        if (b.t === 1 || b.t === T2) { const px = clamp(pcx(), 16, room.W - 16); b.pose = 'time';
          b.marks = (b.t === 1 ? [px, px - 96, px + 96] : [px - 48, px + 48]).map(x => clamp(x, 16, room.W - 16)); b.mT = b.t; sfx('tick');
          tip('chands', '金色の印に、時計の針が落ちてくる！ 印から離れて'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { for (const mx of b.marks) ebullets.push({ kind: 'hand', x: mx - 5, y: 2 * TS, w: 10, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.handDamage, life: 22, static: 1 });
          b.marks = []; sfx('thud'); cam.shake = 3; }
        if (b.t >= T2 + warn + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'pendulum': {
        const warn = C.pendWarn, n = bossP('swings'), half = 64, A0 = 1.05;
        if (b.t === 1) { b.pd = pcx() < CHR_PIVOT.x ? 1 : -1; b.face = Math.sign(pcx() - b.cx) || b.face; b.pose = 'pend'; b.w0 = chrPt(b, CHR_ART.watch); sfx('warn'); tip('cwatch', '懐中時計が振れる！ ジャンプでかわすか、壁ぎわで待とう（端では高く通る）'); }
        if (b.t === 14) b.pose = 'time';   // the watch has left her hand: she steers it with the raised palm
        let th = b.pd * A0;
        if (b.t >= warn) th = b.pd * A0 * Math.cos((b.t - warn) / half * Math.PI);
        b.bob = { x: CHR_PIVOT.x + Math.sin(th) * CHR_PLEN, y: CHR_PIVOT.y + Math.cos(th) * CHR_PLEN };
        if (b.t < warn) { const k = Math.min(1, b.t / (warn - 6)), e = k * k * (3 - 2 * k); b.bob = { x: b.w0.x + (b.bob.x - b.w0.x) * e, y: b.w0.y + (b.bob.y - b.w0.y) * e - Math.sin(k * Math.PI) * 30 }; }   // harmless until the swing starts
        if (b.t >= warn && b.t < warn + n * half) { if ((b.t - warn) % half === Math.round(half / 2)) sfx('whoosh');
          if (overlapBox(b.bob.x - 8, b.bob.y - 8, b.bob.x + 8, b.bob.y + 8)) hurtPlayer(C.pendDamage, b.bob.x, 'watch'); /* = the 16x17 watch sprite */ }
        if (b.t >= warn + n * half + 24) { b.bob = null; b.state = 'idle'; b.t = 0; } break; }
      case 'rewind': {
        const warn = bossP('orbWarn'), n = bossP('orbs'), sp = C.orbSpeed;
        if (b.t === 1) { const px = pcx(); b.face = Math.sign(px - b.cx) || b.face; b.pose = 'time'; const gp = chrPt(b, CHR_ART.glyph); b.glyphP = gp;
          const o = { x: clamp(gp.x, 40, room.W - 40), y: 84 }; b.orbO = o; b.orbs = [];
          for (let i = 0; i < n; i++) { const tx = clamp(px + (i - (n - 1) / 2) * 64, 18, room.W - 18); b.orbs.push({ tx, ty: FLOOR_Y - 7, k: 0, dir: 0, q: null }); }
          sfx('tick'); tip('crewind', '砂の玉は、点線を通って落ちて… 同じ線を巻き戻って帰る！ 線と線のあいだへ'); }
        if (b.t === warn) { for (const o of b.orbs) { o.dir = 1; o.q = { kind: 'sandorb', x: b.orbO.x - 6, y: b.orbO.y - 6, w: 12, h: 12, vx: 0, vy: 0, g: 0, dmg: C.orbDamage, life: 9999, static: 1 }; ebullets.push(o.q); } sfx('whoosh'); }
        if (b.t > warn) { let alive = 0;
          for (const o of b.orbs) { if (!o.q) continue; const L = Math.hypot(o.tx - b.orbO.x, o.ty - b.orbO.y) || 1;
            if (o.dir === 1) { o.k = Math.min(1, o.k + sp / L); if (o.k >= 1) { o.dir = 0; o.hold = 18; } }
            else if (o.dir === 0) { if (--o.hold <= 0) { o.dir = -1; sfx('tick'); } }
            else { o.k = Math.max(0, o.k - sp / L); if (o.k <= 0) { o.q.dead = true; o.q = null; continue; } }
            o.q.x = b.orbO.x + (o.tx - b.orbO.x) * o.k - 6; o.q.y = b.orbO.y + (o.ty - b.orbO.y) * o.k - 6; alive++; }
          if (!alive) { b.orbs = []; b.state = 'idle'; b.t = 0; } }
        break; }
      case 'slow': {
        const warn = C.zoneWarn, sw = bossP('sandWarn');
        if (b.t === 1) { const px = pcx(); const z1 = clamp(px + (Math.random() < 0.5 ? -1 : 1) * rnd(30, 70), 56, room.W - 56), z2 = clamp(z1 > 192 ? z1 - 170 : z1 + 170, 56, room.W - 56);
          b.zones = [{ x: z1, r: 44, life: 999, on: 0 }, { x: z2, r: 44, life: 999, on: 0 }]; b.pose = 'time'; b.face = Math.sign(px - b.cx) || b.face; sfx('warn');
          tip('cslow', '紫の「時の淀み」の中は動きがおそくなる。でも砂はそこには落ちてこない'); }
        if (b.t === warn) for (const z of b.zones) z.on = 1;
        for (let k = 0; k < 3; k++) { const t0 = warn + k * (sw + 22);
          if (b.t === t0) { b.marks = []; for (let x = 22 + (k % 2) * 22; x < room.W - 14; x += 44) if (!b.zones.some(z => Math.abs(z.x - x) < z.r + 14)) b.marks.push(x); b.mT = b.t; sfx('tick'); }
          if (b.t === t0 + sw) { for (const mx of b.marks) ebullets.push({ kind: 'sandfall', x: mx - 11, y: 2 * TS, w: 22, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.sandDamage, life: 26, static: 1 });
            b.marks = []; sfx('whoosh'); cam.shake = 3; } }
        if (b.t >= warn + 3 * (sw + 22) + 10) { for (const z of b.zones) z.life = 60; b.state = 'idle'; b.t = 0; } break; }
      case 'beam': {   // v0.4.2: the clock floats in front of her and fires flat along the floor-side, from the art's beam point
        const tr = C.beamTrack, lk = bossP('beamLock'); b.lockT = lk;
        if (b.t === 1) { b.pose = 'charge'; b.eye = 'charge'; sfx('warn'); tip('cbeam', '時計の目が光った！ 赤い線が点滅したら撃ってくる… 跳び越えるか、クロノアの後ろへ！'); }
        if (b.t < tr) b.face = Math.sign(pcx() - b.cx) || b.face;   // turns to follow Kanata, then LOCKS
        if (b.t < tr + lk && b.t % 8 === 0) sfx('warn');
        if (b.t === tr + lk) { b.pose = 'beam'; sfx('boom'); cam.shake = 8; hitStop = 2; }
        if (b.t >= tr + lk && b.t < tr + lk + 24) { const o = chrPt(b, CHR_ART.beam), x1 = b.face > 0 ? room.W : 0;
          if (overlapBox(Math.min(o.x, x1), o.y - BEAM_UP, Math.max(o.x, x1), o.y + BEAM_DN)) hurtPlayer(C.beamDamage, o.x, 'beam');
          if (b.t % 3 === 0) parts.push({ x: o.x + b.face * rnd(10, 300), y: o.y + rnd(-6, 12), vx: b.face * rnd(1, 3), vy: rnd(-1, 1), life: 16, col: '#9affc8', size: 2, glow: 1 }); }
        if (b.t === tr + lk + 24) { b.state = 'shut'; b.t = 0; b.eye = 'shut'; b.pose = 'hurt'; b.winLen = bossP('stun'); sfx('crash'); cam.shake = 6;
          const e = chrPt(b, CHR_ART.eyeBeam); b.coreX = clamp(e.x + b.face * 34, 30, room.W - 30);
          b.core = makeCore(b, b.coreX, FLOOR_Y - 30, () => ({ x: boss.mx, y: boss.my }), 'ecore');
          tip('ccore', '目が閉じた！ こぼれ落ちた「目のコア」を VAC で吸い込め！', true); }
        break; }
      case 'shut': coreBob(b, b.coreX, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'wake'; b.t = 0; } break;
      case 'wake': if (b.t === 30) { b.eye = 'open'; b.pose = 'idle'; } if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.eye = 'crack'; b.pose = 'defeat'; b.marks = []; b.zones = []; b.bob = null; b.tx = b.cx; },
  onDefeat(b) { startEnding(b); },
  draw(b, lights) {
    const C = CONFIG.chronoa;
    // slow-time zones (domes of purple light with a ticking ring)
    for (const z of b.zones) { const zx = z.x - cam.x, zy = FLOOR_Y - cam.y, a = Math.min(1, z.life / 60) * (z.on ? 1 : (frame & 4) ? 0.5 : 0.25);
      g.fillStyle = 'rgba(150,90,230,' + 0.22 * a + ')'; g.beginPath(); g.ellipse(zx, zy, z.r, z.r * 0.9, 0, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgba(210,170,255,' + 0.7 * a + ')'; g.lineWidth = 1; g.beginPath(); g.ellipse(zx, zy, z.r, z.r * 0.9, 0, Math.PI, 0); g.stroke();
      for (let k = 0; k < 12; k++) { const an = Math.PI + k / 11 * Math.PI - (z.on ? frame * 0.01 : 0); g.fillStyle = 'rgba(230,210,255,' + 0.8 * a + ')'; g.fillRect(Math.round(zx + Math.cos(an) * z.r), Math.round(zy + Math.sin(an) * z.r * 0.9), 1, 2); }
      lights.push({ x: z.x, y: FLOOR_Y - 20, r: 50, cool: 1 }); }
    // telegraphs
    if (b.state === 'hands') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('handWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'slow') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('sandWarn')), 'rgba(240,190,110,0.9)');
    if (b.state === 'rewind' && b.orbO) { if (b.t < bossP('orbWarn') && b.glyphP) { const k = b.t / bossP('orbWarn'); g.fillStyle = 'rgba(255,230,150,0.8)';   // sand streams up from her glyph to the hub
        for (let d = 0; d < 1; d += 0.08) { const yy = b.glyphP.y + (b.orbO.y - b.glyphP.y) * Math.min(1, d + k * 0.3), xx = b.glyphP.x + (b.orbO.x - b.glyphP.x) * d; if ((frame + d * 50) % 6 < 3) g.fillRect(Math.round(xx - cam.x), Math.round(yy - cam.y), 2, 2); }
        g.fillStyle = 'rgba(255,220,140,' + (0.3 + 0.5 * k) + ')'; g.beginPath(); g.arc(b.orbO.x - cam.x, b.orbO.y - cam.y, 3 + k * 5, 0, 7); g.fill(); lights.push({ x: b.orbO.x, y: b.orbO.y, r: 30, warm: 1 }); }
      for (const o of b.orbs) { if (b.t > bossP('orbWarn') && !o.q) continue; g.fillStyle = b.t < bossP('orbWarn') && (frame & 4) ? 'rgba(255,240,180,0.9)' : 'rgba(240,200,120,0.55)';
        const L = Math.hypot(o.tx - b.orbO.x, o.ty - b.orbO.y); for (let d = 0; d < L; d += 6) { const k = d / L; g.fillRect(Math.round(b.orbO.x + (o.tx - b.orbO.x) * k - cam.x), Math.round(b.orbO.y + (o.ty - b.orbO.y) * k - cam.y), 2, 2); }
        drawFloorMark(o.tx, 0.6, 'rgba(240,190,110,0.8)'); } }
    if (b.state === 'pendulum') { const warn = C.pendWarn;
      if (b.t < warn) { g.fillStyle = (frame & 4) ? 'rgba(255,230,160,0.8)' : 'rgba(255,200,120,0.4)'; for (let a = -1.05; a <= 1.05; a += 0.05) g.fillRect(Math.round(CHR_PIVOT.x + Math.sin(a) * CHR_PLEN - cam.x), Math.round(CHR_PIVOT.y + Math.cos(a) * CHR_PLEN - cam.y), 2, 2); }
      if (b.bob && b.t >= 14) { const bx = b.bob.x - cam.x, by = b.bob.y - cam.y; g.strokeStyle = '#b8b8c8'; g.setLineDash([2, 2]); g.beginPath(); g.moveTo((b.t < warn ? b.w0.x : CHR_PIVOT.x) - cam.x, (b.t < warn ? b.w0.y : CHR_PIVOT.y) - cam.y); g.lineTo(bx, by); g.stroke(); g.setLineDash([]);
        spr('gaiden', 'watch', Math.round(bx - 8), Math.round(by - 8)); lights.push({ x: b.bob.x, y: b.bob.y, r: 40, warm: 1 }); } }
    if (b.state === 'beam') { const tr = C.beamTrack, lk = bossP('beamLock'), o = chrPt(b, CHR_ART.beam), x0 = o.x - cam.x, y0 = o.y - cam.y, x1 = (b.face > 0 ? room.W : 0) - cam.x;
      if (b.t < tr + lk) { const lock = b.t >= tr; g.fillStyle = lock ? ((frame & 2) ? 'rgba(255,60,60,0.30)' : 'rgba(255,220,220,0.22)') : 'rgba(255,80,80,0.12)';
        g.fillRect(Math.min(x0, x1), y0 - BEAM_UP, Math.abs(x1 - x0), BEAM_UP + BEAM_DN); g.fillStyle = lock ? ((frame & 2) ? '#ff4040' : '#ffd0d0') : 'rgba(255,90,90,0.6)';
        for (let xx = Math.min(x0, x1); xx < Math.max(x0, x1); xx += 6) g.fillRect(Math.round(xx), Math.round(y0), 3, 1); }
      else if (b.t < tr + lk + 24) { const k = 1 - (b.t - tr - lk) / 24; g.fillStyle = 'rgba(120,255,170,' + (0.35 + 0.35 * k) + ')'; g.fillRect(Math.min(x0, x1), y0 - BEAM_UP, Math.abs(x1 - x0), BEAM_UP + BEAM_DN);
        g.fillStyle = 'rgba(235,255,240,0.95)'; g.fillRect(Math.min(x0, x1), Math.round(y0 - 1 + (1 - k) * 0), Math.abs(x1 - x0), 3); lights.push({ x: (o.x + (b.face > 0 ? room.W : 0)) / 2, y: o.y, r: 90, cool: 1 }); } }
    // Chronoa + her clock mimic (final art, 1:1, mirrored when she faces left)
    let f, clk = null;   // clk: separate mimic frame (0 open, 1 half, 2 charge, 3 cracked) drawn where the art has no clock
    switch (b.pose) {
      case 'pend': f = 2; clk = 0; break;
      case 'time': f = 3; clk = 0; break;
      case 'charge': f = 1; clk = 2; break;
      case 'beam': f = 4; break;
      case 'hurt': f = 5; clk = 1; break;
      case 'defeat': f = 6; break;
      default: if (b.flash > 4) { f = 5; clk = 1; } else if (b.moving) f = (frame >> 3) & 1 ? 9 : 1, clk = 0; else f = ((frame >> 4) & 3) === 3 ? 8 : 0;
    }
    if (b.state === 'dying' && b.t >= 190) return;
    const flip = b.face < 0, sx = Math.round(b.cx - cam.x) - 64, sy = Math.round(FLOOR_Y - cam.y) - 79;
    const ce = clk !== null ? chrPt(b, b.pose === 'charge' ? CHR_ART.eyeBeam : CHR_ART.eyeIdle) : null;
    drawRimSprite('gaiden', 'chr' + f, sx, sy, flip, '#7ae0d0', 1);
    if (ce) { const bobY = b.pose === 'charge' ? 0 : Math.round(Math.sin(frame * 0.05) * 1); drawRimSprite('gaiden', 'clk' + clk, Math.round(ce.x - cam.x) - 23 - (flip ? 1 : 0), Math.round(ce.y - cam.y) - 26 + bobY, flip, '#9affc8', 0.6); }
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.6; sprWhite('gaiden', 'chr' + f, sx, sy, flip); g.globalAlpha = 1; }
    if (b.rage && b.state !== 'dying' && (frame & 32)) { g.globalAlpha = 0.12; sprWhite('gaiden', 'chr' + f, sx, sy, flip, '#ff4040'); g.globalAlpha = 1; }
    if (b.pose === 'charge' && ce) lights.push({ x: ce.x, y: ce.y, r: 46, warm: 1 });
    lights.push({ x: b.mx, y: b.my, r: 46, cool: 1 }); lights.push({ x: b.cx, y: FLOOR_Y - 40, r: 56, cool: 1 });
    drawCore(b, lights, 'ecore');
  },
};
const BEAM_UP = 6, BEAM_DN = 16;   // beam band around the art's beam point (y = floor-44): hits a standing Kanata, a jump/hover clears it
// slow-time zones: Kanata walks at 55% inside an active zone
function timeSlowAt(x, feetY) {
  if (!boss || boss.kind !== 'chronoa' || !boss.zones) return 1;
  for (const z of boss.zones) if (z.on && z.life > 0 && Math.abs(x - z.x) < z.r && feetY > FLOOR_Y - z.r) return CONFIG.chronoa.slowMul;
  return 1;
}
