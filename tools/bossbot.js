// Frame-accurate boss bot injected into the page (window.__bot runs at the start of every update()).
// One bot for all four bosses. Plays like a careful (not perfect) human: reads the telegraphs (floor marks,
// HIGH/LOW lines, pendulum arc, rolling ball), jumps shockwaves, vacuums ammo/bullets, spits from range and
// wins the core tug-of-war. Used by test.js (clear check, god mode) and balance runs (hits taken, no god mode).
module.exports = String.raw`
window.__botStats = { frames: 0, hits: 0, lastHp: -1, causes: [], spits: 0, coreTugs: 0, windows: 0 };
window.__bot = function () {
  const G = GAIDEN, K = G._test.keys, I = G._test.inp, P = G.P, b = G.boss, S = window.__botStats;
  const wasV = K.vac; K.left = K.right = K.jump = K.vac = K.spit = false; K._v = wasV;
  if (b && (b.state === 'dying' || b.state === 'done') && !P.dead) S.won = true;
  if (b && (b.state === 'dying' || b.state === 'done' || P.dead)) { if (S.lastHp >= 0 && P.hp < S.lastHp) S.causes.push('AFTER.' + b.state + ':' + G.state + ':' + G.stats.lastHurt + '[' + S.lastHp + '>' + P.hp + ']'); S.lastHp = P.hp; }
  if (G.state !== 'play' || !b || P.dead) return;
  if (b.state === 'sleep') { K.right = true; return; }
  if (b.state === 'intro' || b.state === 'dying' || b.state === 'done') return;
  S.frames++; if (S.lastHp >= 0 && P.hp < S.lastHp) { S.hits++; S.dmg = (S.dmg || 0) + S.lastHp - P.hp; S.causes.push(b.kind + '.' + b.state + ':' + G.stats.lastHurt + '[' + S.lastHp + '>' + P.hp + ' t' + P.tank.length + (K._v ? 'v' : '') + (P.tug ? 'T' : '') + (P.onGround ? 'g' : 'a') + ' x' + Math.round(P.x + P.w / 2) + ' m' + S.lm + ' f' + S.frames + ']'); } S.lastHp = P.hp;
  const pcx = P.x + P.w / 2, W = G.room.W, L = 36, R = W - 36, FY = 15 * 16, kind = b.kind;
  let move = 0, vac = false, jump = false, face = 0, holdJump = false;
  const go = (tx, tol) => { if (pcx < tx - (tol || 4)) move = 1; else if (pcx > tx + (tol || 4)) move = -1; };
  const clampX = x => Math.max(L, Math.min(R, x));
  const away = (x, d) => { let tx = pcx < x ? x - d : x + d; if (tx < L || tx > R) tx = pcx < x ? x + d : x - d; go(clampX(tx), 6); };
  let aim = b.aimAt ? b.aimAt() : null;
  const books = G.ents.filter(e => e.type === 'cursedbook' && !e.dead && e.hp > 0);
  if (books.length && P.tank.length && b.state !== 'stunned' && b.state !== 'dizzy') { const bk = books.reduce((a, e) => Math.abs(e.x - pcx) < Math.abs(a.x - pcx) ? e : a); aim = { x: bk.x, y: bk.y, foe: 1 }; }
  // ---- danger model --------------------------------------------------
  const danger = []; // x positions to keep away from: [x, radius]
  // human-ish reaction time: new floor marks are only noticed REACT frames after they appear
  S.seen = S.seen || {}; const nowSeen = {};
  for (const m of (b.marks || [])) { const key = Math.round(m); nowSeen[key] = S.seen[key] !== undefined ? S.seen[key] : S.frames; if (S.frames - nowSeen[key] >= (window.__react ?? 16)) danger.push([m, b.markR || ({ chandelier: 30, golem: 20, rose: 20, clock: 18, organ: 24, serpent: 20 }[kind] || 26) + (b.state === 'leap' ? 36 : 0)]); }
  S.seen = nowSeen; if (b.marks && b.marks.length) S.lm = b.marks.map(Math.round).join('/') + '@' + S.frames;
  if (kind === 'chandelier' && b.state === 'crash') danger.push([b.t < (b.rage ? CONFIG.boss.crashTrackRage : CONFIG.boss.crashTrack) ? b.shadowX : b.px, 76]);
  if (kind === 'golem') { if (b.state === 'slam') danger.push([b.x, 96]); if (b.state === 'idle' || b.state === 'bubbles') danger.push([b.x, 46]); }
  if (kind === 'clock' && b.state !== 'stopped') danger.push([b.x, 46]);
  if (kind === 'marionette' && b.state === 'dance' && b.jy > 20) danger.push([b.x, 40]);
  if (kind === 'knight' && b.state === 'leap' && b.jy > 20) danger.push([b.x, 40]);
  if (kind === 'knight' && b.state === 'slash' && b.pose === 'raise') danger.push([b.x + b.face * 47, 40]);
  if (kind === 'tarant' && (b.state === 'drop' || b.state === 'plunge') && b.hy > 120) danger.push([b.x, 38]);
  if (kind === 'bellboard' && b.state === 'toll' && b.hy > 110) danger.push([b.x, 56]);   // v0.5.1
  if (kind === 'angler' && b.state === 'bite') { const end = (b.bx1 !== undefined && b.t >= CONFIG.angler.biteWarn ? b.bx1 : Math.max(76, Math.min(G.room.W - 76, b.x + b.face * CONFIG.angler.biteDist))) + b.face * 52; danger.push([(b.x + end) / 2, Math.abs(end - b.x) / 2 + 12]); }
  if (kind === 'angler' && b.state === 'lure' && b.t >= CONFIG.angler.lureTrack) danger.push([b.x + (b.lure ? (b.lure.x - b.x) / 2 : 0), Math.abs(b.lure ? b.lure.x - b.x : 0) / 2 + 50]);
  if (kind === 'angler' && b.pose !== 'dive' && b.state !== 'stuck') danger.push([b.x, 50]);
  if (kind === 'chronoa' && b.state === 'rewind' && b.orbs) for (const o of b.orbs) if (o.q || b.t < 60) danger.push([o.tx + (b.orbO ? (b.orbO.x - o.tx) * 0.2 : 0), 26]);
  if (kind === 'rose' && !b.burrow) danger.push([b.x, 34]);
  
  if (kind === 'organ' && b.state !== 'stunned') danger.push([b.x - 52, b.state === 'fortissimo' ? 80 : 44]);
  for (const e of books) if (e.state === 'warn' || e.state === 'dash') danger.push([e.state === 'warn' ? e.tx : e.x, 34]);
  if (kind === 'serpent' && !b.hidden && b.state !== 'dizzy' && b.state !== 'flung' && b.state !== 'sweep' && b.hy > FY - 70) danger.push([b.hx, 40]);
  if (kind === 'serpent' && b.state === 'sweep' && b.sweepVx) { const d = b.hx - pcx; if (Math.sign(d) === Math.sign(b.sweepVx) * -1 && Math.abs(d) < 56) { if (!b.petalHigh) { if (P.onGround) jump = true; holdJump = true; } } }
  for (const q of G.ebullets) {
    const qx = q.x + q.w / 2, toward = Math.sign(pcx - qx) === Math.sign(q.vx) || !q.vx, dx = Math.abs(qx - pcx);
    if ((q.kind === 'wave' || q.kind === 'suds' || q.kind === 'rgear' || q.kind === 'root' || q.kind === 'planet' || (q.kind === 'comet' && !q.high)) && toward && dx < (q.kind === 'comet' ? 52 : 40) && dx > 8 && P.onGround) { jump = true; holdJump = true; S.waveDir = Math.sign(q.vx) || 1; S.waveT = 40; }
    if (q.kind === 'bubble' && P.tank.length >= 3 && dx < 50 && Math.abs(q.y - P.y - 20) < 40) danger.push([qx, 50]);
    if (q.kind === 'firepatch' || q.kind === 'puddle') danger.push([qx, q.kind === 'puddle' ? 30 : 24]);
    if (q.kind === 'blast' || q.kind === 'geyser' || q.kind === 'hand' || q.kind === 'thorn' || q.kind === 'sandfall' || q.kind === 'string' || q.kind === 'halberd' || q.kind === 'ropecol' || q.kind === 'bubcol') danger.push([qx, q.w / 2 + 10]);
    if (q.kind === 'hotwater' && q.tx !== undefined) danger.push([q.tx + 6, 28]);
    if (q.kind === 'seedpod' && q.tx !== undefined) danger.push([q.tx, 22]);
    if ((q.kind === 'shard' || q.kind === 'candle' || q.kind === 'dropbottle' || q.kind === 'sock' || q.kind === 'drop' || q.kind === 'sandbag' || q.kind === 'maskshot' || q.kind === 'corkshot' || q.kind === 'gsword' || q.kind === 'bellshot') && q.vy > 0 && q.y < P.y + P.h) danger.push([qx, 18]);
    if (q.kind === 'chord' && toward && dx < 60 && q.y > FY - 40 && P.onGround && dx < 36) { jump = true; holdJump = true; }
    if (q.kind === 'petal' && toward && dx < 60) { if (q.y > FY - 40) { if (P.onGround && dx < 34) { jump = true; holdJump = true; } } }
  }
  if (kind === 'rose' && b.state === 'petals' && b.petalHigh) jump = false;
  if (kind === 'orrery' && G.ebullets.some(q => q.kind === 'comet' && q.high && !q.dead && Math.abs(q.x + 13 - pcx) < 120)) { jump = false; S.hold = 0; }   // HIGH comet: stay on the floor
  if (kind === 'orrery' && b.state === 'comet' && b.lane && b.lane.high) { jump = false; S.hold = 0; }
  if ((kind === 'organ' && b.state === 'chord' || kind === 'serpent' && b.state === 'sweep') && b.petalHigh && !G.ebullets.some(q => q.kind === 'chord' && q.y > FY - 40)) jump = false;   // HIGH stream: stay on the floor
  if (kind === 'rose' && b.state === 'petals' && !b.petalHigh) holdJump = true;
  // golem ball: jump it when it is close and coming at us
  if (kind === 'golem' && b.ball && b.state === 'roll') { const d = b.x - pcx; if (Math.sign(d) === -Math.sign(b.face) || Math.abs(d) < 10) { if (Math.abs(d) < 64 && P.onGround) jump = true; holdJump = true; } }
  // ---- decide -------------------------------------------------------
  const near = danger.find(([x, r]) => Math.abs(x - pcx) < r);
  if (P.tug) { vac = true; move = P.tug.x > pcx ? -1 : 1; if (P.tug.boss) S.coreTugs++; }
  else if (kind === 'chronoa' && b.state === 'beam' && !b.core) {   // v0.4.2 flat beam: get behind her during the lock, else jump it
    const tr = G.CONFIG.chronoa.beamTrack, behind = b.cx - b.face * 44;
    if (behind > L && behind < R && b.t < tr + 30) go(behind, 4);
    else if (Math.sign(pcx - b.cx) === b.face) { const fire = tr + (b.lockT || 40); if (b.t >= fire - 12 && b.t < fire + 24) { if (P.onGround && b.t < fire - 6) jump = true; holdJump = true; } } }
  else if ((kind === 'clock' || kind === 'chronoa') && b.state === 'pendulum') { go(pcx < 192 ? L : R, 4); }      // wait at a wall for the swing
  else if (b.core && b.core.state === 'out') {
    const c = b.core; S.cw = 1; let side = pcx < c.x ? -1 : 1, tx = c.x + side * 62; if (tx < L || tx > R) tx = c.x - side * 62;
    if (near && Math.abs(near[0] - tx) < near[1]) tx = c.x - side * 62;
    go(tx, 6); if (Math.abs(pcx - tx) < 26) { face = c.x > pcx ? 1 : -1; vac = true; }
  } else if (near) { // walk to the closest spot that is clear of every danger (falls back to stepping away)
    const clear = x => x >= L && x <= R && !danger.some(([dx, r]) => Math.abs(dx - x) < r + 6);
    let tx = null; for (let d = 4; d <= 260 && tx === null; d += 4) { if (clear(pcx - d)) tx = pcx - d; else if (clear(pcx + d)) tx = pcx + d; }
    if (tx !== null) go(tx, 2); else away(near[0], near[1] + 30); }
  else {
    const AMMO = G.CONFIG.ammo, suck = G.ebullets.filter(q => q.suckable && Math.abs(q.x - pcx) < 110 && Math.abs(q.y - (P.y + 20)) < 50);
    const wisps = G.ents.filter(e => e.type === 'firewisp' && !e.dead);
    const items = G.items.filter(i => AMMO[i.kind] && i.onGround && i.x > L - 20 && i.x < R + 20);
    if (wisps.length && P.tank.length < 3) { const w = wisps.reduce((a, e) => Math.abs(e.x - pcx) < Math.abs(a.x - pcx) ? e : a); const d = w.x - pcx;
      if (Math.abs(d) < 40) away(w.x, 70); else if (Math.abs(d) < 120) { face = Math.sign(d); vac = Math.abs(w.y - (P.y + 26)) < 40; } else go(w.x - Math.sign(d) * 80, 10); }
    else if (suck.length && P.tank.length < 3) { const q = suck.reduce((a, c) => Math.abs(c.x - pcx) < Math.abs(a.x - pcx) ? c : a); face = Math.sign(q.x + q.w / 2 - pcx) || 1; vac = true; }
    else if (P.tank.length && aim) { // spit from the side, at range
      const want = aim.foe ? 64 : kind === 'rose' ? 110 : 96; let side = pcx < aim.x ? -1 : 1, tx = aim.x + side * want; if (tx < L || tx > R) tx = aim.x - side * want; go(tx, 12);
      face = aim.x > pcx ? 1 : -1; if (Math.abs(pcx - tx) < 34 && P.spitCD <= 0 && G.frame % 6 === 0 && P.face === face) { I.spitPressed = true; S.spits++; }
    } else if (items.length && P.tank.length < 3) { const a = items.reduce((p, q) => Math.abs(q.x - pcx) < Math.abs(p.x - pcx) ? q : p); const d = a.x - pcx;
      if (Math.abs(d) > 70) go(a.x - Math.sign(d) * 50, 10); else { face = Math.sign(d) || 1; vac = true; } }
    else { const bx = aim ? aim.x : b.x; let side = pcx < bx ? -1 : 1, tx = bx + side * 110; if (tx < L || tx > R) tx = bx - side * 110; go(tx, 12); }
  }
  if (S.waveT > 0) { S.waveT--; if (!P.onGround && !P.tug && kind !== 'organ' && kind !== 'clock') move = -S.waveDir; }
  if (face && !move && !P.tug) { if (P.face !== face) move = face; }
  if (move > 0) K.right = true; else if (move < 0) K.left = true;
  if (vac) K.vac = true; K._v = vac;
  if (jump && P.onGround) S.hold = holdJump ? 30 : 16;  // keep JUMP held (variable jump height) for a full arc
  if (jump) { if (!S.jh) I.jumpPressed = true; K.jump = true; S.jh = true; } else { S.jh = false; if ((holdJump || S.hold > 0) && !P.onGround) K.jump = true; }
  if (S.hold > 0) { S.hold--; if (!P.onGround) K.jump = true; }
};
`;
