// Frame-accurate boss bot injected into the page (window.__bot runs at the start of every update()).
// Used by test.js (boss clear) and balance runs (hits taken without god mode). Plays like a careful human:
// dodges the telegraphed attacks, vacuums ammo / fire wisps, spits (auto-aim) and wins the core tug-of-war.
module.exports = String.raw`
window.__botStats = { frames: 0, hits: 0, lastHp: -1, causes: [], spits: 0, coreTugs: 0 };
window.__bot = function () {
  const G = GAIDEN, K = G._test.keys, I = G._test.inp, P = G.P, b = G.boss, S = window.__botStats;
  K.left = K.right = K.jump = K.vac = K.spit = false;
  if (G.state !== 'play' || !b || b.state === 'sleep' && P.x > 90 || P.dead) { if (G.state === 'play' && b && b.state === 'sleep') K.right = true; return; }
  if (b.state === 'sleep') { K.right = true; return; }
  if (b.state === 'intro' || b.state === 'dying' || b.state === 'done') return;
  S.frames++; if (S.lastHp >= 0 && P.hp < S.lastHp) { S.hits++; S.causes.push(b.state + ':' + G.stats.lastHurt); } S.lastHp = P.hp;
  const pcx = P.x + P.w / 2, W = G.room.W, L = 40, R = W - 40;
  let move = 0, vac = false, jump = false, face = 0;
  const go = (tx, tol) => { if (pcx < tx - (tol || 4)) move = 1; else if (pcx > tx + (tol || 4)) move = -1; };
  const away = (x, d) => { const want = pcx < x ? x - d : x + d; const tx = (want < L || want > R) ? (pcx < x ? x + d : x - d) : want; go(Math.max(L, Math.min(R, tx)), 6); };
  // tug in progress: pull away
  if (P.tug) { vac = true; move = P.tug.x > pcx ? -1 : 1; if (P.tug.boss) S.coreTugs++; }
  else if (b.state === 'stuck' && b.core && b.core.state === 'out') {
    S.cs = 1; const c = b.core, side = pcx < c.x ? -1 : 1; let tx = c.x + side * 62; if (tx < L || tx > R) tx = c.x - side * 62;
    go(tx, 6); if (Math.abs(pcx - tx) < 26) { face = c.x > pcx ? 1 : -1; vac = true; }
  } else {
    const wisps = G.ents.filter(e => e.type === 'firewisp' && !e.dead);
    const ammo = G.items.filter(i => ['candle', 'crystal'].includes(i.kind) && i.onGround);
    const marks = b.state === 'candles' ? b.marks : [];
    const danger = [];
    for (const m of marks) danger.push(m);
    if (b.state === 'crash') danger.push(b.t < 80 ? b.shadowX : b.px);
    // waves along the floor: jump when close
    for (const q of G.ebullets) {
      if (q.kind === 'wave' && Math.sign(pcx - q.x) === Math.sign(q.vx) && Math.abs(q.x - pcx) < 34 && P.onGround) jump = true;
      if (q.kind === 'firepatch' && Math.abs(q.x + q.w / 2 - pcx) < 22) danger.push(q.x + q.w / 2);
      if ((q.kind === 'shard' || q.kind === 'candle') && Math.abs(q.x - pcx) < 18 && q.y < P.y + P.h && q.vy > 0) danger.push(q.x);
    }
    const near = danger.find(x => Math.abs(x - pcx) < (b.state === 'crash' ? 74 : 30));
    if (near !== undefined) away(near, b.state === 'crash' ? 96 : 40);
    else if (b.state === 'shards' && Math.abs(b.x - pcx) < 120) away(b.x, 140);
    else if (wisps.length) { const w = wisps.reduce((a, e) => Math.abs(e.x - pcx) < Math.abs(a.x - pcx) ? e : a); const d = w.x - pcx;
      if (Math.abs(d) < 40) away(w.x, 70); else if (Math.abs(d) < 120) { face = Math.sign(d); vac = Math.abs(w.y - (P.y + 26)) < 40; } else go(w.x - Math.sign(d) * 80, 10); }
    else if (P.tank.length) { // spit at the chandelier from the side
      const side = pcx < b.x ? -1 : 1; let tx = b.x + side * 84; if (tx < L || tx > R) tx = b.x - side * 84; go(tx, 10);
      face = b.x > pcx ? 1 : -1; if (Math.abs(pcx - tx) < 30 && P.spitCD <= 0 && G.frame % 6 === 0) { I.spitPressed = true; S.spits++; }
    } else if (ammo.length) { const a = ammo.reduce((p, q) => Math.abs(q.x - pcx) < Math.abs(p.x - pcx) ? q : p); const d = a.x - pcx;
      if (Math.abs(d) > 70) go(a.x - Math.sign(d) * 50, 10); else { face = Math.sign(d) || 1; vac = true; } }
    else { const side = pcx < b.x ? -1 : 1; let tx = b.x + side * 100; if (tx < L || tx > R) tx = b.x - side * 100; go(tx, 12); }
  }
  if (face && !move && !P.tug) { if (P.face !== face) move = face; }
  if (move > 0) K.right = true; else if (move < 0) K.left = true;
  if (vac) K.vac = true;
  if (jump) { if (!S.jh) I.jumpPressed = true; K.jump = true; S.jh = true; } else S.jh = false;
};
`;
