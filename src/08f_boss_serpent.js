
// =====================================================================
//  BOSS 6 (v0.3): 大浴場の主 ユブネ BATHWATER SERPENT (grand bath) - a long serpent of hot bathwater
//    arcs   : rears back -> blue landing marks -> hot-water blobs arc onto them and leave scalding puddles
//    sweep  : the head drops LOW (jump) or HIGH (stay on the floor) and sweeps the whole room
//    rain   : drip marks on the floor -> hot droplets fall from the steam on the ceiling
//    geyser : (every 3rd) dives into the tub; geysers burst at the marks, the last one throws it out onto the
//             floor DIZZY: the rubber-duck ghost core bobs out = weak point (tug-of-war)
//  Rubber ducks (bouncy DUCK ammo) float out of the tub during the fight.
// =====================================================================
BOSS_DEFS.serpent = { jp: '大浴場の主 ユブネ', en: 'BATHWATER SERPENT', cfg: 'serpent', cols: ['#5ac8e0', '#b8f0ff', '#ffffff', '#ffd83a'], rageText: 'ユブネが怒った！ お湯が煮えたぎる',
  sayIntro: '……お湯が、立ち上がった。……のぼせそう', sayCore: '……あひるの、ゴースト？',
  BASE: 318,
  make(b) { b.hx = 300; b.hy = FLOOR_Y - 110; b.hidden = 0; b.petalHigh = false; b.face = -1; b.duckT = 0; },
  hitBox(b) { if (b.hidden) return { x0: -999, x1: -998, y0: -999, y1: -998 }; return { x0: b.hx - 24, x1: b.hx + 24, y0: b.hy - 20, y1: b.hy + 20 }; },
  aim(b) { return b.hidden ? null : { x: b.hx, y: b.hy }; },
  home(b, k) { const tx = this.BASE - 22 + Math.sin(b.t * 0.03) * 10, ty = FLOOR_Y - 112 + Math.sin(b.t * 0.05) * 8; b.hx += (tx - b.hx) * (k || 0.06); b.hy += (ty - b.hy) * (k || 0.06); },
  update(b) {
    const C = CONFIG.serpent, D = this;
    // ducks to throw: keep ~2 lying around
    if (++b.duckT > 260 && items.filter(i => i.kind === 'duck' && !i.dead).length < 2) { b.duckT = 0; spawnItem('duck', D.BASE - 10, FLOOR_Y - 40, { vx: -rnd(1.2, 2.4), vy: -2.5 }); sfx('bubble'); }
    switch (b.state) {
      case 'idle': D.home(b); if (b.t >= bossP('idle')) chooseAttack(b, ['arcs', 'sweep', 'rain'], 'geyser'); break;
      case 'arcs': {
        const warn = C.arcWarn; D.home(b, 0.04); b.hy -= 0.3;
        if (b.t === 1) { const n = bossP('arcs'), px = pcx(); b.marks = []; const xs = [px]; for (let k = 1; xs.length < n; k++) { xs.push(px + k * 60); if (xs.length < n) xs.push(px - k * 60); }
          for (const x of xs) b.marks.push(clamp(x, 24, D.BASE - 50)); sfx('warn'); }
        if (b.t === warn) { sfx('spit');
          for (const tx of b.marks) { const tf = 50, gg = 0.14, vx = (tx - b.hx) / tf, vy = (FLOOR_Y - 8 - b.hy - 0.5 * gg * tf * tf) / tf;
            ebullets.push({ kind: 'hotwater', x: b.hx - 6, y: b.hy - 6, w: 12, h: 12, vx, vy, g: gg, dmg: C.arcDamage, life: 200, tx,
              onLand: q => { sfx('splash'); ebullets.push({ kind: 'puddle', x: q.x + 6 - 14, y: FLOOR_Y - 6, w: 28, h: 6, vx: 0, vy: 0, dmg: C.puddleDamage, life: C.puddle, static: 1 }); } }); }
          b.marks = []; }
        if (b.t >= warn + 70) { b.state = 'idle'; b.t = 0; } break; }
      case 'sweep': {
        const warn = bossP('sweepWarn');
        if (b.t === 1) { b.petalHigh = Math.random() < 0.45; b.sweepHold = 0; sfx('warn'); }
        const yy = b.petalHigh ? FLOOR_Y - 70 : FLOOR_Y - 16;
        if (b.t < warn) { b.hx += (D.BASE - 30 - b.hx) * 0.1; b.hy += (yy - b.hy) * 0.1; if (b.t % 12 === 0) sfx('warn'); break; }
        if (b.t === warn) { b.sweepVx = -bossP('sweepSpeed'); sfx('whoosh'); }
        if (b.sweepHold) { b.hy += (yy - b.hy) * 0.15; if (b.t >= b.sweepHold) { b.sweepHold = 0; b.sweepVx = bossP('sweepSpeed') * 0.9; sfx('whoosh'); } break; } // v0.3.2: telegraphed return
        b.hx += b.sweepVx; b.hy = yy + Math.sin(b.t * 0.3) * 2; b.sweepX = b.hx;
        if (b.hx < 26 && b.sweepVx < 0) { b.hx = 26; if (b.rage) { b.sweepVx = 0; b.sweepHold = b.t + 30; b.petalHigh = !b.petalHigh; sfx('warn'); break; } b.sweepVx = 0; }
        if (b.sweepVx === 0 || b.hx > D.BASE - 30) { b.sweepX = undefined; b.state = 'idle'; b.t = 0; }
        break; }
      case 'rain': {
        const warn = bossP('rainWarn'); D.home(b);
        if (b.t === 1) { const n = bossP('drops'), px = pcx(); b.marks = []; const xs = [px]; for (let k = 1; xs.length < n; k++) { xs.push(px + k * 46); if (xs.length < n) xs.push(px - k * 46); }
          for (const x of xs) b.marks.push(clamp(x, 20, room.W - 20)); sfx('warn'); }
        if (b.t < warn && b.t % 10 === 0) sfx('tick');
        if (b.t === warn) { for (const mx of b.marks) ebullets.push({ kind: 'drop', x: mx - 4, y: 2 * TS, w: 8, h: 10, vx: 0, vy: 1.5, g: 0.25, dmg: C.dropDamage, life: 200, onLand: q => { for (let k = 0; k < 4; k++) parts.push({ x: q.x + 4, y: FLOOR_Y - 2, vx: rnd(-1.2, 1.2), vy: rnd(-1.6, -0.4), life: 14, col: '#b8f0ff', size: 1, grav: 1 }); } }); b.marks = []; sfx('splash'); }
        if (b.t >= warn + 40) { b.state = 'idle'; b.t = 0; } break; }
      case 'geyser': {
        const gw = C.geyserWarn;
        if (b.t === 1) { sfx('warn'); tip('geyser', 'ユブネがお湯にもぐった！ 光る印から間欠泉が吹き出すぞ'); }
        if (b.t < 30) { b.hy += 4; b.hx += (D.BASE - b.hx) * 0.1; if (b.t === 20) { b.hidden = 1; sfx('splash'); cam.shake = 4; } break; }
        const k = Math.floor((b.t - 30) / (gw + 14)), tt = (b.t - 30) % (gw + 14);
        if (k < 3) {
          if (tt === 0) { b.marks = [clamp(k === 2 ? 150 : pcx(), 24, D.BASE - 40)]; if (b.rage && k < 2) b.marks.push(clamp(pcx() + (Math.random() < 0.5 ? -70 : 70), 24, D.BASE - 40)); sfx('warn'); }
          if (tt === gw) { for (const mx of b.marks) ebullets.push({ kind: 'geyser', x: mx - 13, y: FLOOR_Y - 120, w: 26, h: 120, vx: 0, vy: 0, g: 0, dmg: 2, life: 24, static: 1 }); sfx('whoosh'); cam.shake = 6;
            if (k === 2) { b.hidden = 0; b.hx = b.marks[0]; b.hy = FLOOR_Y - 130; b.state = 'flung'; b.t = 0; }
            b.marks = []; }
        }
        break; }
      case 'flung': b.hy = Math.min(FLOOR_Y - 18, b.hy + b.t * 0.35); if (b.hy >= FLOOR_Y - 18) { b.state = 'dizzy'; b.t = 0; b.winLen = bossP('dizzy'); sfx('crash'); cam.shake = 9; hitStop = 4;
          b.core = makeCore(b, b.hx - 40, FLOOR_Y - 30, () => ({ x: boss.hx, y: boss.hy }), 'dcore'); tip('dcore', 'ユブネが目を回した！ あひるのゴーストを VAC で吸い込め！', true); } break;
      case 'dizzy': coreBob(b, b.hx - 40, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'return'; b.t = 0; } break;
      case 'return': b.hx += (D.BASE - 22 - b.hx) * 0.05; b.hy += (FLOOR_Y - 112 - b.hy) * 0.05; if (b.t > 70) { b.state = 'idle'; b.t = 0; } break;
    }
    if (!b.hidden && ((b.state === 'sweep' && b.t >= bossP('sweepWarn')) || b.state === 'idle' || b.state === 'arcs' || b.state === 'rain') && overlapBox(b.hx - 18, b.hy - 14, b.hx + 18, b.hy + 14)) hurtPlayer(b.state === 'sweep' ? C.sweepDamage : C.contactDamage, b.hx, 'serpent');
  },
  dying(b) { b.hy += 0.4; },
  onDefeat(b) { bossReward(b, 180); say('……お湯、ぬるくなった。……いいお湯だった', 200); tip('serpentDown', '大浴場の主ユブネをやっつけた！', true); },
  draw(b, lights) {
    const D = this;
    if ((b.state === 'arcs' || b.state === 'rain' || b.state === 'geyser') && b.marks.length) {
      const k = b.state === 'geyser' ? ((b.t - 30) % (CONFIG.serpent.geyserWarn + 14)) / CONFIG.serpent.geyserWarn : b.state === 'arcs' ? b.t / CONFIG.serpent.arcWarn : b.t / bossP('rainWarn');
      for (const mx of b.marks) drawFloorMark(mx, Math.min(1, k), 'rgba(90,200,255,0.85)'); }
    if (b.state === 'sweep' && b.t < bossP('sweepWarn')) { const yy = Math.round((b.petalHigh ? FLOOR_Y - 70 : FLOOR_Y - 16) - cam.y); g.fillStyle = (frame & 4) ? 'rgba(120,220,255,0.9)' : 'rgba(255,255,255,0.6)';
      for (let xx = 0; xx < room.W; xx += 8) g.fillRect(Math.round(xx - cam.x), yy, 4, 2); drawTextShadow(b.petalHigh ? 'HIGH' : 'LOW', 20, yy - 12, 'c', 1); }
    // tub rim at the base
    if (b.state === 'dying' && b.t >= 90) return;
    const rage = b.rage, seg = rage ? 'serp_seg_r' : 'serp_seg';
    if (!b.hidden && b.state !== 'flung' && b.state !== 'dizzy') { // body: segments from the tub to the head
      const bx = D.BASE, by = FLOOR_Y - 6, mx = (bx + b.hx) / 2 + 30, my = Math.min(by, b.hy) - 10;
      for (let i = 9; i >= 1; i--) { const u = i / 10, x = (1 - u) * (1 - u) * bx + 2 * (1 - u) * u * mx + u * u * b.hx, y = (1 - u) * (1 - u) * by + 2 * (1 - u) * u * my + u * u * b.hy;
        const sc = 0.75 + u * 0.25, r = rectOf('boss', seg); g.drawImage(IMG.boss, r.x, r.y, r.w, r.h, Math.round(x - cam.x - r.w * sc / 2), Math.round(y - cam.y - r.h * sc / 2), Math.round(r.w * sc), Math.round(r.h * sc)); }
    }
    if (!b.hidden) {
      const key = b.state === 'dizzy' || b.state === 'flung' || b.state === 'dying' ? 'serp_dizzy' : rage ? 'serp_rage' : b.state === 'arcs' && b.t > 20 ? 'serp_spit' : 'serp_head';
      const r = rectOf('boss', key), fl = b.state === 'sweep' && b.sweepVx > 0; let sx = Math.round(b.hx - cam.x - r.w / 2), sy = Math.round(b.hy - cam.y - r.h / 2);
      spr('boss', key, sx, sy, !fl);
      if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, !fl); g.globalAlpha = 1; }
    }
    const rr = rectOf('boss', 'splashring'); spr('boss', 'splashring', Math.round(D.BASE - cam.x - rr.w / 2), Math.round(FLOOR_Y - cam.y - rr.h + 2));
    if (frame % 6 === 0) parts.push({ x: D.BASE + rnd(-20, 20), y: FLOOR_Y - 10, vx: rnd(-0.3, 0.3), vy: -rnd(0.4, 1), life: 30, col: 'rgba(230,250,255,0.6)', size: 3 });
    lights.push({ x: b.hx, y: b.hy, r: 70, cool: 1 });
    drawCore(b, lights, 'dcore');
  },
};
