
// =====================================================================
//  AREA BOSS (v0.4): 星喰いの天球儀 アストラ ASTRA, THE STAR-EATING ORRERY (星見の天文台 / observatory dome)
//    A brass orrery that swallowed a little sun and now wants the whole night sky. Not a friend character.
//    meteor   : blue marks -> shooting stars fall straight onto them
//    comet    : a dotted lane flashes (LOW = jump it / HIGH = stay on the floor) -> a comet streaks across from the far wall
//    orbit    : the planets come loose and roll along the floor from the walls, one after another (jump them)
//    supernova: (every 3rd) the sun swells, dotted rays fan out -> star shards fly down the rays.
//               Burnt out, the sun goes grey: its SUN CORE drops out = weak point (tug-of-war)
//    rage     : (50%) the sun turns red: shorter warnings, more stars / planets, faster comets
// =====================================================================
BOSS_DEFS.orrery = { jp: '星喰いの天球儀 アストラ', en: 'ASTRA, THE STAR-EATING ORRERY', cfg: 'orrery', cols: ['#ffd060', '#ff8a3a', '#ffffff', '#c9a24a'],
  rageText: 'アストラの太陽が赤く燃え上がった！',
  sayIntro: '……天球儀が、星を食べてる。……おなか、こわすよ', sayCore: '……太陽の中に、ゴースト……',
  make(b) { b.x = 192; b.y = 96; b.markR = 22; b.rays = null; b.lane = null; },
  hitBox(b) { return { x0: b.x - 30, x1: b.x + 30, y0: b.y - 30, y1: b.y + 30 }; },
  aim(b) { return b.state === 'stop' ? null : { x: b.x, y: b.y }; },
  update(b) {
    const C = CONFIG.orrery, px = clamp(pcx(), 16, room.W - 16);
    b.x = 192 + Math.sin(frame * 0.012) * 26; b.y = 96 + Math.sin(frame * 0.023) * 6;
    switch (b.state) {
      case 'idle': b.markR = 22; if (b.t >= bossP('idle')) chooseAttack(b, ['meteor', 'comet', 'orbit'], 'supernova'); break;
      case 'meteor': {
        const warn = bossP('meteorWarn');
        if (b.t === 1) { const n = bossP('meteors'), xs = [px]; for (let k = 1; xs.length < n; k++) { xs.push(px + k * 56); if (xs.length < n) xs.push(px - k * 56); }
          b.marks = xs.map(x => clamp(x, 18, room.W - 18)); b.marks0 = b.marks.slice(); b.markR = 18; b.second = 0; sfx('warn'); tip('ometeor', '青い印に流れ星が落ちてくる！ 印と印のあいだへ'); }
        if (b.t < warn && b.t % 12 === 0) sfx('tick');
        if (b.t === warn) { let i = 0; for (const mx of b.marks) { const gem = i++ === 0; ebullets.push({ kind: 'starshot', x: mx - 7, y: 2 * TS, w: 14, h: 14, vx: 0, vy: 5, g: 0.2, dmg: C.starDamage, life: 90,
          onLand: q => { if (gem) spawnItem('crystal', clamp(q.x + 7, 24, room.W - 24), FLOOR_Y); for (let k = 0; k < 6; k++) parts.push({ x: q.x + 7, y: FLOOR_Y - 3, vx: rnd(-1.5, 1.5), vy: rnd(-2, -0.5), life: 16, col: '#fff4a0', size: 2, glow: 1, grav: 1 }); } }); } sfx('whoosh'); }
        if (b.t === warn + 30) { b.marks = []; if (b.rage && !b.second) { b.second = 1; b.marks = b.marks0.map(x => clamp(x + 28, 18, room.W - 18)); b.t = warn - 30; } }   // rage: a 2nd volley in the gaps
        if (b.t >= warn + 56) { b.second = 0; b.state = 'idle'; b.t = 0; } break; }
      case 'comet': {
        const warn = bossP('cometWarn'), n = b.rage ? 2 : 1;
        if (b.t === 1) { b.cn = 0; b.cT = 1; }
        if (b.t === b.cT) { b.lane = { high: b.cn === 0 ? Math.random() < 0.5 : !b.lastHigh, dir: pcx() < 192 ? 1 : -1 }; b.lastHigh = b.lane.high; b.petalHigh = b.lane.high; sfx('warn');
          tip('ocomet', 'ほうき星！ 低い線ならジャンプ、高い線なら床でじっと'); }
        if (b.lane && b.t < b.cT + warn && (b.t - b.cT) % 10 === 0) sfx('tick');
        if (b.lane && b.t === b.cT + warn) { const L = b.lane, y = L.high ? FLOOR_Y - 60 : FLOOR_Y - 16;
          ebullets.push({ kind: 'comet', x: L.dir > 0 ? room.W - 16 - 26 : 16, y, w: 26, h: 14, vx: -L.dir * bossP('cometSpeed'), vy: 0, g: 0, dmg: C.cometDamage, life: 200, static: 1, wall: 1, high: L.high }); sfx('whoosh'); }
        if (b.lane && b.t === b.cT + warn + 120) { b.cn++; b.lane = null; if (b.cn < n) b.cT = b.t + 1; }
        if (b.cn >= n && !ebullets.some(q => q.kind === 'comet' && !q.dead)) { b.petalHigh = false; b.state = 'idle'; b.t = 0; } break; }
      case 'orbit': {
        const warn = bossP('orbitWarn'), n = bossP('planets');
        if (b.t === 1) { b.pn = 0; b.pdir = pcx() < 192 ? 1 : -1; b.pT = warn; sfx('warn'); tip('oorbit', '惑星が外れて床を転がってくる！ ジャンプでかわせ'); }
        if (b.t === b.pT && b.pn < n) { const d = b.pn % 2 ? -b.pdir : b.pdir;   // first one from the far wall
          ebullets.push({ kind: 'planet', x: d > 0 ? room.W - 34 : 16, y: FLOOR_Y - 18, w: 18, h: 18, vx: -d * bossP('planetSpeed'), vy: 0, g: 0, dmg: C.planetDamage, life: 400, static: 1, wall: 1, onExpire: q => spawnItem('gear', clamp(q.x + 9, 24, room.W - 24), FLOOR_Y) }); b.pn++; sfx('whoosh'); }
        if (b.t > warn && b.pn < n && !ebullets.some(q => q.kind === 'planet' && !q.dead) && b.t >= b.pT) b.pT = b.t + 30;
        if (b.pn >= n && b.t > b.pT + 2 && !ebullets.some(q => q.kind === 'planet' && !q.dead)) { b.state = 'idle'; b.t = 0; } break; }
      case 'supernova': {   // shards fly out along the rays to a point high above each mark, hang there, then drop straight down
        const warn = bossP('novaWarn'), sp = C.shardSpeed, HY = 64, hang = 16;
        if (b.t === 1) { const n = bossP('shards'), off = rnd(-20, 20); b.rays = []; b.rO = { x: b.x, y: b.y + 26 };
          for (let i = 0; i < n; i++) b.rays.push({ tx: clamp(192 + off + (i - (n - 1) / 2) * 60, 16, room.W - 16), k: 0, q: null, st: 0 });
          b.marks = b.rays.map(r => r.tx); b.markR = 18; sfx('warn'); tip('onova', '太陽がふくらむ！ 点線の先に星のかけらが降ってくる… 線と線のあいだへ'); }
        if (b.t < warn && b.t % 8 === 0) sfx('warn');
        if (b.t === warn) { for (const r of b.rays) { r.q = { kind: 'starshot', x: b.rO.x - 7, y: b.rO.y - 7, w: 14, h: 14, vx: 0, vy: 0, g: 0, dmg: C.shardDamage, life: 9999, static: 1 }; ebullets.push(r.q); } sfx('boom'); cam.shake = 8; }
        if (b.t > warn) { let alive = 0;
          for (const r of b.rays) { if (!r.q) continue; alive++;
            if (r.st === 0) { const L = Math.hypot(r.tx - b.rO.x, HY - b.rO.y) || 1; r.k = Math.min(1, r.k + sp / L);
              r.q.x = b.rO.x + (r.tx - b.rO.x) * r.k - 7; r.q.y = b.rO.y + (HY - b.rO.y) * r.k - 7; if (r.k >= 1) { r.st = 1; r.hold = hang; } }
            else if (r.st === 1) { if (--r.hold <= 0) { r.st = 2; r.q.static = 0; r.q.vy = 1; r.q.g = 0.4; r.q.life = 80;
              r.q.onLand = q => { for (let k = 0; k < 6; k++) parts.push({ x: q.x + 7, y: FLOOR_Y - 3, vx: rnd(-1.5, 1.5), vy: rnd(-2, -0.5), life: 16, col: '#fff4a0', size: 2, glow: 1, grav: 1 }); }; } }
            else if (r.q.dead) { r.q = null; alive--; } }
          if (!alive) { b.rays = null; b.marks = []; b.markR = 22; b.state = 'stop'; b.t = 0; b.winLen = bossP('stun'); sfx('crash'); cam.shake = 6;
            b.coreSide = Math.sign(pcx() - 192) || 1; b.core = makeCore(b, 192 + b.coreSide * 40, FLOOR_Y - 30, () => ({ x: boss.x, y: boss.y + 50 }), 'scor');
            tip('ocore', '太陽が燃えつきた！ こぼれ落ちた「太陽のコア」を VAC で吸い込め！', true); } }
        break; }
      case 'stop': coreBob(b, 192 + b.coreSide * 40, FLOOR_Y - 30); if (coreWindowOver(b)) { b.state = 'relight'; b.t = 0; } break;
      case 'relight': if (b.t > 50) { b.state = 'idle'; b.t = 0; } break;
    }
  },
  dying(b) { b.marks = []; b.rays = null; b.lane = null; },
  onDefeat(b) { bossReward(b, b.x); say('……星、みんな空にかえった。……きれい', 220);
    tip('sealStars', '時計塔の封印がひとつ解けた！（' + ['clock', 'marionette', 'orrery'].filter(k => progress.bosses.has(k)).length + ' / 3）', true);
    checkBossGates(); velAppear('orrery', pcx() < 192 ? 330 : 54, FLOOR_Y); },
  draw(b, lights) {
    const x = Math.round(b.x - cam.x), y = Math.round(b.y - cam.y);
    if (b.state === 'meteor') for (const m of b.marks) drawFloorMark(m, Math.min(1, b.t / bossP('meteorWarn')), 'rgba(110,170,255,0.9)');
    if (b.state === 'comet' && b.lane && b.t < b.cT + bossP('cometWarn')) { const ly = (b.lane.high ? FLOOR_Y - 53 : FLOOR_Y - 9) - cam.y;
      g.fillStyle = (frame & 4) ? 'rgba(160,220,255,0.9)' : 'rgba(255,255,255,0.5)'; for (let xx = 4; xx < room.W; xx += 8) g.fillRect(Math.round(xx - cam.x), Math.round(ly), 4, 1);
      drawTextShadow(b.lane.high ? 'HIGH' : 'LOW', Math.round((b.lane.dir > 0 ? room.W - 40 : 40) - cam.x), Math.round(ly - 12), 'c', 1, 'c'); }
    if (b.state === 'orbit' && b.t < bossP('orbitWarn')) { g.fillStyle = (frame & 4) ? 'rgba(160,220,255,0.7)' : 'rgba(255,255,255,0.3)';
      for (let xx = 18; xx < room.W - 18; xx += 10) g.fillRect(Math.round(xx - cam.x), FLOOR_Y - 2 - cam.y, 5, 1); }
    if (b.state === 'supernova' && b.rays) for (const r of b.rays) { if (b.t > bossP('novaWarn') && !r.q) continue;
      g.fillStyle = b.t < bossP('novaWarn') && (frame & 4) ? 'rgba(255,240,160,0.95)' : 'rgba(255,190,90,0.55)';
      const L = Math.hypot(r.tx - b.rO.x, 64 - b.rO.y); for (let d = 0; d < L; d += 6) { const k = d / L; g.fillRect(Math.round(b.rO.x + (r.tx - b.rO.x) * k - cam.x), Math.round(b.rO.y + (64 - b.rO.y) * k - cam.y), 2, 2); }
      for (let yy = 64; yy < FLOOR_Y; yy += 8) g.fillRect(Math.round(r.tx - cam.x), Math.round(yy - cam.y), 1, 4);
      drawFloorMark(r.tx, 0.6, 'rgba(255,190,90,0.8)'); }
    if (b.state === 'dying' && b.t >= 90) return;
    const key = b.state === 'stop' || b.state === 'relight' && b.t < 25 || b.state === 'dying' ? 'astra_stop' : b.state === 'supernova' ? 'astra_nova' : b.rage ? 'astra_rage' : 'astra_idle';
    let ox = 0; if (b.state === 'supernova' && b.t < bossP('novaWarn')) ox = (frame & 2) ? 1 : -1;
    spr('boss', key, x - 56 + ox, y - 56);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.6; sprWhite('boss', key, x - 56, y - 56); g.globalAlpha = 1; }
    if (b.state === 'stop') for (let i = 0; i < 4; i++) { const an = frame * 0.12 + i * 1.57; g.fillStyle = '#ffe080'; g.fillRect(Math.round(x + Math.cos(an) * 26), Math.round(y - 40 + Math.sin(an) * 4), 2, 2); }
    lights.push({ x: b.x, y: b.y, r: b.state === 'stop' ? 50 : 110, warm: 1 });
    drawCore(b, lights, 'scor');
  },
};
