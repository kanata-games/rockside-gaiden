
// =====================================================================
//  BOSS 5 (v0.3): 呪いのパイプオルガン CURSED PIPE ORGAN (organ loft, chapel)
//    notes      : the pipes sing -> music notes drift after Kanata (vacuum them = NOTE ammo); calls cursed books
//    pipes      : violet marks on the floor -> air-blast columns roar up from the floor pipes
//    chord      : a dotted guide line LOW (jump) or HIGH (stay on the floor) -> a chord wave rolls across
//    fortissimo : (every 3rd) the organ swells (shake + red) and slams three floor shockwaves (jump them),
//                 then runs out of breath: the organist ghost core drifts out = weak point (tug-of-war)
// =====================================================================
BOSS_DEFS.organ = { jp: '呪いのパイプオルガン', en: 'CURSED PIPE ORGAN', cfg: 'organ', cols: ['#d8b8ff', '#c8b088', '#ffffff', '#6a3a54'], rageText: 'オルガンが怒った！ 音が割れている',
  sayIntro: '……オルガン、ひとりで鳴ってる。……うるさい', sayCore: '……オルガン弾きの、ゴースト……',
  make(b) { b.x = room.W - 84; b.petalHigh = false; },
  hitBox(b) { return { x0: b.x - 58, x1: b.x + 58, y0: FLOOR_Y - 120, y1: FLOOR_Y }; },
  aim(b) { return { x: b.x - 30, y: FLOOR_Y - 60 }; },
  update(b) {
    const C = CONFIG.organ;
    switch (b.state) {
      case 'idle': if (b.t >= bossP('idle')) chooseAttack(b, ['notes', 'pipes', 'chord', 'requiem'], 'fortissimo'); break;
      case 'notes': {
        const n = bossP('notes'), t0 = C.noteWarn;
        if (b.t === 1) { sfx('warn'); const books = ents.filter(e => e.type === 'cursedbook' && !e.dead).length;
          if (books < bossP('books')) { const bk = makeFoe('cursedbook', b.x - 70, FLOOR_Y - 90); bk.cd = 80; ents.push(bk); for (let i = 0; i < 10; i++) parts.push({ x: bk.x, y: bk.y - 7, vx: rnd(-1.5, 1.5), vy: rnd(-1.5, 1), life: 20, col: '#d8b8ff', size: 2, glow: 1 }); } }
        if (b.t >= t0 && (b.t - t0) % 12 === 0 && (b.t - t0) / 12 < n) { sfx('bell');
          const px = b.x - 50 + rnd(-10, 40), py = FLOOR_Y - 100 + rnd(-10, 20);
          ebullets.push({ kind: 'note', x: px - 6, y: py - 6, w: 12, h: 12, vx: -C.noteSpeed, vy: rnd(-0.8, 0.4), g: 0, dmg: C.noteDamage, life: 320, suckable: true, ammo: 'note', home: 1, homeMax: C.noteSpeed, static: 1 }); }
        if (b.t >= t0 + n * 12 + 40) { b.state = 'idle'; b.t = 0; } break; }
      case 'pipes': {
        const warn = bossP('pipeWarn');
        if (b.t === 1) b.wave = 0;
        if (b.t === 1 || b.t === b.retgt) { const n = bossP('pipes'), px = pcx(); b.marks = []; const xs = [px]; for (let k = 1; xs.length < n; k++) { xs.push(px + k * 70); if (xs.length < n) xs.push(px - k * 70); }
          for (const x of xs) b.marks.push(clamp(x, 20, b.x - 70)); sfx('warn'); }
        if (b.t < warn && b.t % 10 === 0) sfx('tick');
        if (b.t === warn) { for (const mx of b.marks) ebullets.push({ kind: 'blast', x: mx - 11, y: 2 * TS, w: 22, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.pipeDamage, life: 30, static: 1 }); b.marks = []; sfx('whoosh'); cam.shake = 5; }
        if (b.t >= warn + 34) { if (b.wave < (b.rage ? 2 : 1)) { b.wave++; b.t = b.retgt = 4; } else { b.state = b.rage ? 'chord' : 'idle'; b.t = 0; b.retgt = -1; } } break; }
      case 'requiem': { // v0.3b phase 2: blasts over the whole floor except one "rest" gap - run to it (twice)
        const warn = 42, T2 = warn + 36;
        if (b.t === 1 || (b.rage && b.t === T2)) { const slots = []; for (let x = 20; x < b.x - 70; x += 36) slots.push(x);
          let gi = Math.floor(Math.random() * (slots.length - 1)); if (b.t > 1 && Math.abs(slots[gi] - pcx()) < 60) gi = (gi + 3) % (slots.length - 1);
          b.gap = (slots[gi] + slots[gi + 1]) / 2; b.marks = slots.filter((x, i) => i !== gi && i !== gi + 1); b.rT = b.t; sfx('bell'); tip('requiem', 'レクイエム！ 印のない「休符」に逃げこめ'); }
        if (b.t === b.rT + warn) { for (const mx of b.marks) ebullets.push({ kind: 'blast', x: mx - 11, y: 2 * TS, w: 22, h: FLOOR_Y - 2 * TS, vx: 0, vy: 0, g: 0, dmg: C.pipeDamage, life: 30, static: 1 }); b.marks = []; sfx('whoosh'); cam.shake = 7; }
        if (b.t >= (b.rage ? T2 : 0) + warn + 36) { b.state = 'idle'; b.t = 0; }
        break; }
      case 'chord': {
        const warn = bossP('chordWarn');
        if (b.t === 1) { b.petalHigh = Math.random() < 0.45; sfx('warn'); }
        if (b.t < warn && b.t % 12 === 0) sfx('warn');
        if (b.t === warn || (b.rage && b.t === warn + 46)) { if (b.t > warn) { b.petalHigh = !b.petalHigh; }
          const y = b.petalHigh ? FLOOR_Y - 92 : FLOOR_Y - 26, h = b.petalHigh ? 50 : 26;
          ebullets.push({ kind: 'chord', x: b.x - 70, y, w: 18, h, vx: -bossP('chordSpeed'), vy: 0, g: 0, dmg: C.chordDamage, life: 260, static: 1, wall: 1 }); sfx('bell'); cam.shake = 3; }
        if (b.t >= warn + (b.rage ? 130 : 84)) { b.state = 'idle'; b.t = 0; } break; }
      case 'fortissimo': {
        if (b.t === 1) { sfx('warn'); tip('organFF', 'オルガンが息を吸い込んでいる… 床の衝撃波はジャンプでかわせ！（呪いの本も呼ぶぞ）'); }
        if (b.t < 56) { if (b.t % 8 === 0) sfx('warn'); break; }
        if (b.t === 56 || b.t === 116 || b.t === 176) { sfx('boom'); cam.shake = 9; hitStop = 2;
          for (const d of [-1]) ebullets.push({ kind: 'wave', x: b.x - 70, y: FLOOR_Y - 14, w: 16, h: 14, vx: d * 2.4, vy: 0, dmg: 1, life: 200 });
          for (let i = 0; i < 14; i++) parts.push({ x: b.x - 40 + rnd(-30, 30), y: FLOOR_Y - 100 + rnd(-20, 20), vx: rnd(-2, 1), vy: rnd(-2, 1), life: 30, col: '#d8b8ff', size: 2, glow: 1 }); }
        if (b.t === 236) { b.state = 'stunned'; b.t = 0; b.winLen = bossP('stun'); sfx('crash'); cam.shake = 8;
          b.core = makeCore(b, b.x - 90, FLOOR_Y - 34, () => ({ x: boss.x - 40, y: FLOOR_Y - 60 }), 'ocore');
          tip('ocore', 'オルガンが息切れした！ 出てきたオルガン弾きのゴーストを VAC で吸い込め！', true); }
        break; }
      case 'stunned': coreBob(b, b.x - 90, FLOOR_Y - 34); if (coreWindowOver(b)) { b.state = 'idle'; b.t = 0; } break;
    }
    // the organ console is a solid wall of pipes: push Kanata out (no cheap contact damage)
    if (P.x + P.w > b.x - 52) { P.x = b.x - 52 - P.w; if (P.vx > 0) P.vx = 0; }
  },
  onDefeat(b) { bossReward(b, b.x - 80); say('……しずかになった。……耳が、きーんってする', 200); tip('organDown', '呪いのパイプオルガンをやっつけた！ 祭壇に新しい力が…', true); },
  draw(b, lights) {
    const x = Math.round(b.x - cam.x), y = Math.round(FLOOR_Y - cam.y);
    if (b.state === 'requiem' && b.marks.length) { const k = Math.min(1, (b.t - b.rT) / 42); for (const mx of b.marks) { drawFloorMark(mx, k, 'rgba(200,140,255,0.85)'); g.fillStyle = 'rgba(200,160,255,' + (0.06 + k * 0.16) + ')'; g.fillRect(Math.round(mx - 11 - cam.x), Math.round(2 * TS - cam.y), 22, FLOOR_Y - 2 * TS); }
      if (frame & 8) drawTextShadow('REST', Math.round(b.gap - cam.x), Math.round(FLOOR_Y - cam.y - 40), 'y', 1, 'c'); }
    if (b.state === 'pipes' && b.marks.length) { const k = Math.min(1, (b.t - (b.wave ? 4 : 0)) / bossP('pipeWarn')); for (const mx of b.marks) { drawFloorMark(mx, k, 'rgba(200,140,255,0.8)');
      g.fillStyle = 'rgba(200,160,255,' + (0.08 + k * 0.18) + ')'; g.fillRect(Math.round(mx - 11 - cam.x), Math.round(2 * TS - cam.y), 22, FLOOR_Y - 2 * TS); } }
    if (b.state === 'chord' && b.t < bossP('chordWarn') + (b.rage ? 46 : 0)) { const yy = Math.round((b.petalHigh ? FLOOR_Y - 67 : FLOOR_Y - 13) - cam.y); g.fillStyle = (frame & 4) ? 'rgba(220,170,255,0.9)' : 'rgba(255,255,255,0.6)';
      for (let xx = 0; xx < x - 60; xx += 8) g.fillRect(xx, yy, 4, 2); drawTextShadow(b.petalHigh ? 'HIGH' : 'LOW', 20, yy - 12, 'p', 1); }
    if (b.state === 'dying' && b.t >= 90) return;
    const key = b.state === 'stunned' || b.state === 'dying' ? 'organ_stop' : b.rage ? 'organ_rage' : (b.state === 'notes' || b.state === 'chord') && (frame & 8) ? 'organ_sing' : 'organ_idle';
    const r = rectOf('boss', key); let sx = x - (r.w >> 1), sy = y - r.h;
    if (b.state === 'fortissimo' && b.t < 56) sx += (frame & 2) ? 2 : -2;
    spr('boss', key, sx, sy);
    if (b.flash > 0 && (frame & 2)) { g.globalAlpha = 0.7; sprWhite('boss', key, sx, sy, false); g.globalAlpha = 1; }
    if (b.state === 'fortissimo' && b.t < 56 && (frame & 4)) { g.globalAlpha = 0.4; sprWhite('boss', key, sx, sy, false, '#ff4040'); g.globalAlpha = 1; }
    lights.push({ x: b.x, y: FLOOR_Y - 70, r: 90, cool: 1 });
    drawCore(b, lights, 'ocore');
  },
};
