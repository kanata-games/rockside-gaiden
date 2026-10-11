
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
BOSS_DEFS.chronoa = { jp: '時計塔管理人 クロノア', en: 'CHRONOA, KEEPER OF THE CLOCK TOWER', cfg: 'chronoa', cols: ['#56d0c0', '#f3d98a', '#ffffff', '#b07a52'],
  rageText: '時計の目にひびが入った！ クロノアが少しだけ本気になった',
  sayIntro: '……女の子。……うしろの時計、目がある……', sayCore: '……目の中に、ゴースト……',
  make(b) { b.mx = 192; b.my = 100; b.cx = 286; b.cy = 128; b.tx = 286; b.eye = 'open'; b.zones = []; b.orbs = []; b.pose = 'idle'; b.hand = 0; b.markR = 20; },
  intro(b) { if (b.t === 20) storySay('chronoa', '……まだ、終わってないよ。急いでる人、嫌い……', 230); b.hand -= 0.02; },
  hitBox(b) { return { x0: b.mx - 34, x1: b.mx + 34, y0: b.my - 22, y1: b.my + 22 }; },
  aim(b) { return b.state === 'shut' ? null : { x: b.mx, y: b.my }; },
  update(b) {
    const C = CONFIG.chronoa;
    b.hand += b.state === 'rewind' ? -0.08 : 0.012;
    b.cx += (b.tx - b.cx) * 0.06;
    if (b.rage && !b.cracked) { b.cracked = true; b.eye = 'crack'; storySay('chronoa', '……もう。……ちょっとだけ、本気……', 200); }
    if (b.state !== 'slow') b.zones = b.zones.filter(z => (z.life -= 3) > 0);
    switch (b.state) {
      case 'idle': b.pose = 'idle'; b.markR = 20;
        if (b.t === 1) b.tx = pcx() < 192 ? 290 : 94;   // drifts to the side away from Kanata
        if (b.t >= bossP('idle')) chooseAttack(b, ['hands', 'pendulum', 'rewind', 'slow'], 'beam'); break;
      case 'hands': {
        const warn = bossP('handWarn'), T2 = warn + 28;
        if (b.t === 1 || b.t === T2) { const px = clamp(pcx(), 16, room.W - 16); b.pose = 'cast';
          b.marks = (b.t === 1 ? [px, px - 96, px + 96] : [px - 48, px + 48]).map(x => clamp(x, 16, room.W - 16)); b.mT = b.t; sfx('tick');
          tip('chands', '金色の印に、時計の針が落ちてくる！ 印から離れて'); }
        if (b.t < b.mT + warn && (b.t - b.mT) % 10 === 0) sfx('tick');
        if (b.t === b.mT + warn) { for (const mx of b.marks) ebullets.push({ kind: 'hand', x: mx - 5, y: 2 * TS, w: 10, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.handDamage, life: 22, static: 1 });
          b.marks = []; sfx('thud'); cam.shake = 3; }
        if (b.t >= T2 + warn + 30) { b.state = 'idle'; b.t = 0; } break; }
      case 'pendulum': {
        const warn = C.pendWarn, n = bossP('swings'), half = 64, A0 = 1.05;
        if (b.t === 1) { b.pd = pcx() < CHR_PIVOT.x ? 1 : -1; b.pose = 'cast'; sfx('warn'); tip('cwatch', '懐中時計が振れる！ ジャンプでかわすか、壁ぎわで待とう（端では高く通る）'); }
        let th = b.pd * A0;
        if (b.t >= warn) th = b.pd * A0 * Math.cos((b.t - warn) / half * Math.PI);
        b.bob = { x: CHR_PIVOT.x + Math.sin(th) * CHR_PLEN, y: CHR_PIVOT.y + Math.cos(th) * CHR_PLEN };
        if (b.t >= warn && b.t < warn + n * half) { if ((b.t - warn) % half === Math.round(half / 2)) sfx('whoosh');
          if (overlapBox(b.bob.x - 12, b.bob.y - 12, b.bob.x + 12, b.bob.y + 12)) hurtPlayer(C.pendDamage, b.bob.x, 'watch'); }
        if (b.t >= warn + n * half + 24) { b.bob = null; b.state = 'idle'; b.t = 0; } break; }
      case 'rewind': {
        const warn = bossP('orbWarn'), n = bossP('orbs'), sp = C.orbSpeed;
        if (b.t === 1) { const px = pcx(), o = { x: b.cx, y: b.cy - 44 }; b.orbO = o; b.pose = 'cast'; b.orbs = [];
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
          b.zones = [{ x: z1, r: 44, life: 999, on: 0 }, { x: z2, r: 44, life: 999, on: 0 }]; b.pose = 'cast'; sfx('warn');
          tip('cslow', '紫の「時の淀み」の中は動きがおそくなる。でも砂はそこには落ちてこない'); }
        if (b.t === warn) for (const z of b.zones) z.on = 1;
        for (let k = 0; k < 3; k++) { const t0 = warn + k * (sw + 22);
          if (b.t === t0) { b.marks = []; for (let x = 22 + (k % 2) * 22; x < room.W - 14; x += 44) if (!b.zones.some(z => Math.abs(z.x - x) < z.r + 14)) b.marks.push(x); b.mT = b.t; sfx('tick'); }
          if (b.t === t0 + sw) { for (const mx of b.marks) ebullets.push({ kind: 'sandfall', x: mx - 11, y: 2 * TS, w: 22, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.sandDamage, life: 26, static: 1 });
            b.marks = []; sfx('whoosh'); cam.shake = 3; } }
        if (b.t >= warn + 3 * (sw + 22) + 10) { for (const z of b.zones) z.life = 60; b.state = 'idle'; b.t = 0; } break; }
      case 'beam': {
        const tr = C.beamTrack, lk = bossP('beamLock');
        if (b.t === 1) { b.beamX = pcx(); b.eye = 'charge'; b.pose = 'cast'; b.markR = 34; sfx('warn'); tip('cbeam', '目が赤く光った！ 赤い線が点滅したら、もう動かない… その場所から離れて！'); }
        if (b.t < tr) b.beamX += clamp(pcx() - b.beamX, -1.6, 1.6);
        if (b.t < tr + lk) { b.marks = [b.beamX]; if (b.t % 8 === 0) sfx('warn'); }
        if (b.t === tr + lk) { b.marks = []; sfx('boom'); cam.shake = 8; hitStop = 2; }
        if (b.t >= tr + lk && b.t < tr + lk + 24) { const x0 = b.mx, y0 = b.my + 22, x1 = b.beamX, y1 = FLOOR_Y;
          for (let y = y0; y <= y1; y += 10) { const x = x0 + (x1 - x0) * (y - y0) / (y1 - y0); if (overlapBox(x - 10, y - 6, x + 10, y + 6)) { hurtPlayer(C.beamDamage, x, 'beam'); break; } }
          if (b.t % 3 === 0) parts.push({ x: b.beamX + rnd(-8, 8), y: FLOOR_Y - 2, vx: rnd(-1.5, 1.5), vy: rnd(-2.5, -0.5), life: 20, col: '#ff8a8a', size: 2, glow: 1, grav: 1 }); }
        if (b.t === tr + lk + 24) { b.state = 'shut'; b.t = 0; b.eye = 'shut'; b.pose = 'hurt'; b.winLen = bossP('stun'); b.markR = 20; sfx('crash'); cam.shake = 6;
          b.coreSide = Math.sign(pcx() - b.mx) || 1; b.core = makeCore(b, b.mx + b.coreSide * 44, FLOOR_Y - 30, () => ({ x: boss.mx, y: boss.my + 40 }), 'ecore');
          tip('ccore', '目が閉じた！ こぼれ落ちた「目のコア」を VAC で吸い込め！', true); }
        break; }
      case 'shut': coreBob(b, b.mx + b.coreSide * 44, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'wake'; b.t = 0; } break;
      case 'wake': if (b.t === 30) b.eye = b.rage ? 'crack' : 'open'; if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.eye = 'shut'; b.pose = 'hurt'; b.marks = []; b.zones = []; b.bob = null; b.tx = 200; b.cy += (FLOOR_Y - 4 - b.cy) * 0.03; },
  onDefeat(b) { startEnding(b); },
  draw(b, lights) {
    const C = CONFIG.chronoa, mx = Math.round(b.mx - cam.x), my = Math.round(b.my - cam.y);
    // slow-time zones (domes of purple light with a ticking ring)
    for (const z of b.zones) { const zx = z.x - cam.x, zy = FLOOR_Y - cam.y, a = Math.min(1, z.life / 60) * (z.on ? 1 : (frame & 4) ? 0.5 : 0.25);
      g.fillStyle = 'rgba(150,90,230,' + 0.22 * a + ')'; g.beginPath(); g.ellipse(zx, zy, z.r, z.r * 0.9, 0, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgba(210,170,255,' + 0.7 * a + ')'; g.lineWidth = 1; g.beginPath(); g.ellipse(zx, zy, z.r, z.r * 0.9, 0, Math.PI, 0); g.stroke();
      for (let k = 0; k < 12; k++) { const an = Math.PI + k / 11 * Math.PI - (z.on ? frame * 0.01 : 0); g.fillStyle = 'rgba(230,210,255,' + 0.8 * a + ')'; g.fillRect(Math.round(zx + Math.cos(an) * z.r), Math.round(zy + Math.sin(an) * z.r * 0.9), 1, 2); }
      lights.push({ x: z.x, y: FLOOR_Y - 20, r: 50, cool: 1 }); }
    // the mimic: clock face + giant eye, hands turning (backwards while rewinding)
    const key = 'mimic_' + (b.state === 'dying' || b.state === 'shut' ? 'shut' : b.eye);
    let ox = 0; if (b.state === 'beam' && b.t > C.beamTrack) ox = (frame & 2) ? 1 : -1;
    spr('chars', key, mx - 64 + ox, my - 64);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.6; sprWhite('chars', key, mx - 64, my - 64); g.globalAlpha = 1; }
    g.lineCap = 'round';
    for (const [len, w, sp] of [[46, 3, 1], [32, 4, 1 / 12]]) { const an = b.hand * (sp === 1 ? 12 : 1); g.strokeStyle = '#2a1a10'; g.lineWidth = w + 2; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.sin(an) * len, my - Math.cos(an) * len); g.stroke();
      g.strokeStyle = '#c9a24a'; g.lineWidth = w; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.sin(an) * len, my - Math.cos(an) * len); g.stroke(); }
    g.lineCap = 'butt'; g.lineWidth = 1;
    lights.push({ x: b.mx, y: b.my, r: 90, cool: b.eye !== 'charge' }); if (b.eye === 'charge') lights.push({ x: b.mx, y: b.my, r: 60, warm: 1 });
    // telegraphs
    if (b.state === 'hands') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('handWarn')), 'rgba(255,210,90,0.9)');
    if (b.state === 'slow') for (const m of b.marks) drawFloorMark(m, Math.min(1, (b.t - b.mT) / bossP('sandWarn')), 'rgba(240,190,110,0.9)');
    if (b.state === 'rewind' && b.orbO) for (const o of b.orbs) { if (b.t > bossP('orbWarn') && !o.q) continue; g.fillStyle = b.t < bossP('orbWarn') && (frame & 4) ? 'rgba(255,240,180,0.9)' : 'rgba(240,200,120,0.55)';
      const L = Math.hypot(o.tx - b.orbO.x, o.ty - b.orbO.y); for (let d = 0; d < L; d += 6) { const k = d / L; g.fillRect(Math.round(b.orbO.x + (o.tx - b.orbO.x) * k - cam.x), Math.round(b.orbO.y + (o.ty - b.orbO.y) * k - cam.y), 2, 2); }
      drawFloorMark(o.tx, 0.6, 'rgba(240,190,110,0.8)'); }
    if (b.state === 'pendulum') { const warn = C.pendWarn;
      if (b.t < warn) { g.fillStyle = (frame & 4) ? 'rgba(255,230,160,0.8)' : 'rgba(255,200,120,0.4)'; for (let a = -1.05; a <= 1.05; a += 0.05) g.fillRect(Math.round(CHR_PIVOT.x + Math.sin(a) * CHR_PLEN - cam.x), Math.round(CHR_PIVOT.y + Math.cos(a) * CHR_PLEN - cam.y), 2, 2); }
      if (b.bob) { const bx = b.bob.x - cam.x, by = b.bob.y - cam.y; g.strokeStyle = '#b8b8c8'; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(CHR_PIVOT.x - cam.x, CHR_PIVOT.y - cam.y); g.lineTo(bx, by); g.stroke(); g.setLineDash([]);
        spr('chars', 'pocketwatch', Math.round(bx - 13), Math.round(by - 13)); lights.push({ x: b.bob.x, y: b.bob.y, r: 40, warm: 1 }); } }
    if (b.state === 'beam') { const tr = C.beamTrack, lk = bossP('beamLock'), x0 = mx, y0 = my + 22, x1 = b.beamX - cam.x, y1 = FLOOR_Y - cam.y;
      if (b.t < tr + lk) { const lock = b.t >= tr; g.strokeStyle = lock ? ((frame & 2) ? 'rgba(255,60,60,0.95)' : 'rgba(255,220,220,0.9)') : 'rgba(255,80,80,0.45)'; g.lineWidth = lock ? 2 : 1;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.lineWidth = 1; drawFloorMark(b.beamX, lock ? 1 : 0.5, 'rgba(255,60,60,0.9)'); }
      else if (b.t < tr + lk + 24) { const k = 1 - (b.t - tr - lk) / 24; g.strokeStyle = 'rgba(255,90,90,' + (0.5 + 0.4 * k) + ')'; g.lineWidth = 20 * (0.6 + 0.4 * k); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6 * k + 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.lineWidth = 1; lights.push({ x: b.beamX, y: FLOOR_Y - 20, r: 70, warm: 1 }); } }
    // Chronoa herself, floating beside her clock (bobbing, languid)
    const pose = b.pose === 'cast' ? 'chr_cast' : b.pose === 'hurt' ? 'chr_hurt' : 'chr_idle' + ((frame >> 5) & 1);
    const r = rectOf('chars', pose), cx = Math.round(b.cx - cam.x), cy = Math.round(b.cy - cam.y + Math.sin(frame * 0.05) * 3);
    if (b.state !== 'dying' || b.t < 190) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(cx, FLOOR_Y - cam.y - 1, 12, 2, 0, 0, 7); g.fill(); spr('chars', pose, cx - (r.w >> 1), cy - r.h, b.cx > b.mx); }
    lights.push({ x: b.cx, y: b.cy - 30, r: 50, cool: 1 });
    drawCore(b, lights, 'ecore');
  },
};
// slow-time zones: Kanata walks at 55% inside an active zone
function timeSlowAt(x, feetY) {
  if (!boss || boss.kind !== 'chronoa' || !boss.zones) return 1;
  for (const z of boss.zones) if (z.on && z.life > 0 && Math.abs(x - z.x) < z.r && feetY > FLOOR_Y - z.r) return CONFIG.chronoa.slowMul;
  return 1;
}
