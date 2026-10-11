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
  S.frames++; if (S.lastHp >= 0 && P.hp < S.lastHp) { S.hits++; S.dmg = (S.dmg || 0) + S.lastHp - P.hp; S.causes.push(b.kind + '.' + b.state + ':' + G.stats.lastHurt + '[' + S.lastHp + '>' + P.hp + ' t' + P.tank.length + (K._v ? 'v' : '') + (P.tug ? 'T' : '') + (P.onGround ? 'g' : 'a') + ']'); } S.lastHp = P.hp;
  const pcx = P.x + P.w / 2, W = G.room.W, L = 36, R = W - 36, FY = 15 * 16, kind = b.kind;
  let move = 0, vac = false, jump = false, face = 0, holdJump = false;
  const go = (tx, tol) => { if (pcx < tx - (tol || 4)) move = 1; else if (pcx > tx + (tol || 4)) move = -1; };
  const clampX = x => Math.max(L, Math.min(R, x));
  const away = (x, d) => { let tx = pcx < x ? x - d : x + d; if (tx < L || tx > R) tx = pcx < x ? x + d : x - d; go(clampX(tx), 6); };
  const aim = b.aimAt ? b.aimAt() : null;
  // ---- danger model --------------------------------------------------
  const danger = []; // x positions to keep away from: [x, radius]
  // human-ish reaction time: new floor marks are only noticed REACT frames after they appear
  const mk = (b.marks || []).join(','); if (mk !== S.mk) { S.mk = mk; S.mkT = 0; } else S.mkT = (S.mkT || 0) + 1;
  if (b.marks && b.marks.length && S.mkT >= (window.__react ?? 16)) for (const m of b.marks) danger.push([m, 30]);
  if (kind === 'chandelier' && b.state === 'crash') danger.push([b.t < (b.rage ? CONFIG.boss.crashTrackRage : CONFIG.boss.crashTrack) ? b.shadowX : b.px, 76]);
  if (kind === 'golem') { if (b.state === 'slam') danger.push([b.x, 96]); if (b.state === 'idle' || b.state === 'bubbles') danger.push([b.x, 46]); }
  if (kind === 'clock' && b.state !== 'stopped') danger.push([b.x, 46]);
  if (kind === 'rose' && !b.burrow) danger.push([b.x, 34]);
  for (const q of G.ebullets) {
    const qx = q.x + q.w / 2, toward = Math.sign(pcx - qx) === Math.sign(q.vx) || !q.vx, dx = Math.abs(qx - pcx);
    if ((q.kind === 'wave' || q.kind === 'suds' || q.kind === 'rgear') && toward && dx < 40 && dx > 8 && P.onGround) { jump = true; holdJump = true; S.waveDir = Math.sign(q.vx) || 1; S.waveT = 40; }
    if (q.kind === 'bubble' && P.tank.length >= 3 && dx < 50 && Math.abs(q.y - P.y - 20) < 40) danger.push([qx, 50]);
    if (q.kind === 'firepatch') danger.push([qx, 24]);
    if (q.kind === 'seedpod' && q.tx !== undefined) danger.push([q.tx, 22]);
    if ((q.kind === 'shard' || q.kind === 'candle' || q.kind === 'dropbottle' || q.kind === 'sock') && q.vy > 0 && q.y < P.y + P.h) danger.push([qx, 18]);
    if (q.kind === 'petal' && toward && dx < 60) { if (q.y > FY - 40) { if (P.onGround && dx < 34) { jump = true; holdJump = true; } } }
  }
  if (kind === 'rose' && b.state === 'petals' && b.petalHigh) jump = false;   // HIGH stream: stay on the floor
  if (kind === 'rose' && b.state === 'petals' && !b.petalHigh) holdJump = true;
  // golem ball: jump it when it is close and coming at us
  if (kind === 'golem' && b.ball && b.state === 'roll') { const d = b.x - pcx; if (Math.sign(d) === -Math.sign(b.face) || Math.abs(d) < 10) { if (Math.abs(d) < 64 && P.onGround) jump = true; holdJump = true; } }
  // ---- decide -------------------------------------------------------
  const near = danger.find(([x, r]) => Math.abs(x - pcx) < r);
  if (P.tug) { vac = true; move = P.tug.x > pcx ? -1 : 1; if (P.tug.boss) S.coreTugs++; }
  else if (kind === 'clock' && b.state === 'pendulum') { go(pcx < 192 ? L : R, 4); }      // wait at a wall for the swing
  else if (b.core && b.core.state === 'out') {
    const c = b.core; S.cw = 1; let side = pcx < c.x ? -1 : 1, tx = c.x + side * 62; if (tx < L || tx > R) tx = c.x - side * 62;
    if (near && Math.abs(near[0] - tx) < near[1]) tx = c.x - side * 62;
    go(tx, 6); if (Math.abs(pcx - tx) < 26) { face = c.x > pcx ? 1 : -1; vac = true; }
  } else if (near) away(near[0], near[1] + 30);
  else {
    const AMMO = G.CONFIG.ammo, suck = G.ebullets.filter(q => q.suckable && Math.abs(q.x - pcx) < 110 && Math.abs(q.y - (P.y + 20)) < 50);
    const wisps = G.ents.filter(e => e.type === 'firewisp' && !e.dead);
    const items = G.items.filter(i => AMMO[i.kind] && i.onGround && i.x > L - 20 && i.x < R + 20);
    if (wisps.length && P.tank.length < 3) { const w = wisps.reduce((a, e) => Math.abs(e.x - pcx) < Math.abs(a.x - pcx) ? e : a); const d = w.x - pcx;
      if (Math.abs(d) < 40) away(w.x, 70); else if (Math.abs(d) < 120) { face = Math.sign(d); vac = Math.abs(w.y - (P.y + 26)) < 40; } else go(w.x - Math.sign(d) * 80, 10); }
    else if (suck.length && P.tank.length < 3) { const q = suck[0]; face = Math.sign(q.x - pcx) || 1; vac = true; if (Math.abs(q.x - pcx) < 24) away(q.x, 50); }
    else if (P.tank.length && aim) { // spit from the side, at range
      const want = kind === 'rose' ? 110 : 96; let side = pcx < aim.x ? -1 : 1, tx = aim.x + side * want; if (tx < L || tx > R) tx = aim.x - side * want; go(tx, 12);
      face = aim.x > pcx ? 1 : -1; if (Math.abs(pcx - tx) < 34 && P.spitCD <= 0 && G.frame % 6 === 0 && P.face === face) { I.spitPressed = true; S.spits++; }
    } else if (items.length && P.tank.length < 3) { const a = items.reduce((p, q) => Math.abs(q.x - pcx) < Math.abs(p.x - pcx) ? q : p); const d = a.x - pcx;
      if (Math.abs(d) > 70) go(a.x - Math.sign(d) * 50, 10); else { face = Math.sign(d) || 1; vac = true; } }
    else { const bx = aim ? aim.x : b.x; let side = pcx < bx ? -1 : 1, tx = bx + side * 110; if (tx < L || tx > R) tx = bx - side * 110; go(tx, 12); }
  }
  if (S.waveT > 0) { S.waveT--; if (!P.onGround && !P.tug) move = -S.waveDir; }
  if (face && !move && !P.tug) { if (P.face !== face) move = face; }
  if (move > 0) K.right = true; else if (move < 0) K.left = true;
  if (vac) K.vac = true; K._v = vac;
  if (jump && P.onGround) S.hold = holdJump ? 30 : 16;  // keep JUMP held (variable jump height) for a full arc
  if (jump) { if (!S.jh) I.jumpPressed = true; K.jump = true; S.jh = true; } else { S.jh = false; if ((holdJump || S.hold > 0) && !P.onGround) K.jump = true; }
  if (S.hold > 0) { S.hold--; if (!P.onGround) K.jump = true; }
};
`;
