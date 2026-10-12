
// =====================================================================
//  v0.4 STORY: portrait dialogue box, ヴェル VEL's one-line appearances, the true ending.
//    ヴェル (主人付き秘書) is never fought. She appears in human form at key moments (new areas, after certain
//    bosses, before Chronoa), says ONE short polite cryptic line, and fades away.
//    Ending: Chronoa falls asleep, Vel comes for her; something invisible lifts Chronoa (no visible tentacles,
//    only a faint warping shadow) and they leave together.
// =====================================================================
const STORY = { box: null, queue: [], vel: null, scene: null };
const SPEAKERS = { vel: { name: 'ヴェル', col: '#d8c8e8', portrait: 'portrait_vel64' }, chronoa: { name: 'クロノア', col: '#7ae0d0', portrait: 'portrait_chronoa64' } };
const VEL_LINES = {
  first:   '見えているものが、すべてではありません。',
  theater: '……拍手は、幕が下りてからでも遅くはありません。',
  stars:   '星は、見られていることに気づいています。',
  marionette: '糸の切れた人形は、自由なのでしょうか。……それとも。',
  orrery:  '夜空の数を数えるのは、主のささやかなご趣味です。',
  clock:   '時計の針は、まだ止まっていませんよ。',
  chronoa: '……私の後ろには、立たないことをお勧めします。',
  wine:    '古いものほど、主はお喜びになります。……人形も、お酒も。',
  armory:  '中身がなくても、忠誠は残るものです。',
  twelve:  '……十二時です。あの方は、遅刻がお嫌いですよ。',   // v0.6.1: all twelve seals lit
};
function storySay(who, text, frames) { const it = { who, text, t: frames || 260, T: frames || 260 }; if (STORY.box) STORY.queue.push(it); else STORY.box = it; }
// Vel appears once per save for each key, near (x, feet y), says her line, and fades out
function velAppear(key, x, y) {
  if (progress.perm.has('vel:' + key)) return false; progress.perm.add('vel:' + key);
  STORY.vel = { key, x: clamp(x, 30, room.W - 30), y, t: 0, life: 330 }; storySay('vel', VEL_LINES[key], 300); sfx('chime'); stats.velSeen = (stats.velSeen || 0) + 1;
  return true;
}
function storyRoomEnter(def) {
  STORY.vel = null;
  if (def.id === 'clockroom' && sealsDone() && !progress.perm.has('vel:twelve')) { setTimeout0(() => velAppear('twelve', 64, FLOOR_Y)); return; }   // v0.6.1
  if (def.vel) setTimeout0(() => velAppear(def.vel, def.velAt ? def.velAt[0] * TS : P.x + P.face * 90, def.velAt ? def.velAt[1] * TS : FLOOR_Y));
}
function setTimeout0(fn) { STORY.pending = fn; }   // run on the next update (after the room finished loading)
function updateStory() {
  if (STORY.pending) { const f = STORY.pending; STORY.pending = null; f(); }
  if (STORY.box && --STORY.box.t <= 0) STORY.box = STORY.queue.shift() || null;
  if (STORY.vel && ++STORY.vel.t > STORY.vel.life) STORY.vel = null;
  updateSeals();
  if (STORY.scene) updateEnding();
}
// ---- the true ending ---------------------------------------------------
function startEnding(b) {
  STORY.scene = { t: 0, cx: b.cx, cx0: b.cx, face: b.face || -1, cy: FLOOR_Y - 4, vx: 300, lift: 0, alpha: 1 }; STORY.queue.length = 0; STORY.box = null;
  progress.trueEnd = true; stats.ending = 1;
}
function updateEnding() {
  const S = STORY.scene; S.t++;
  if (S.t === 30) storySay('chronoa', '……負けちゃった。……ふぁ……ねむい……', 200);
  if (S.t === 240) { S.vel = 1; sfx('chime'); }
  if (S.t === 270) storySay('vel', 'お迎えにあがりました、クロノア様。', 190);
  if (S.t === 300) say('……だれ？', 120);
  if (S.t === 470) { storySay('chronoa', '……ん。……はこんで……', 170); sfx('whoosh'); }
  if (S.t >= 480 && S.t < 900) { S.lift = Math.min(1, S.lift + 0.006); S.cx += (S.vx - 34 - S.cx) * 0.006; }   // carried by something unseen
  if (S.t === 660) storySay('vel', '主が、お待ちです。……残りの十人とも、いずれお会いになるでしょう。', 260);
  if (S.t >= 900) S.alpha = Math.max(0, S.alpha - 0.012);
  if (S.t === 1000) { STORY.scene = null; startClear(); }
}
function storyCutscene() { return !!STORY.scene; }
// ---- drawing -------------------------------------------------------------
// Vel (final art, gaiden.png vel0..6, 64x80, cx 32, feet at the bottom row). face>0 = right-facing art; flip when facing left.
function drawVelSprite(x, y, a, f, face) {   // x = centre, y = feet (world px)
  const sx = Math.round(x - cam.x) - 32, sy = Math.round(y - cam.y) - 80;
  g.save(); g.globalAlpha = a * 0.35; g.fillStyle = '#000000'; g.beginPath(); g.ellipse(x - cam.x, y - cam.y - 1, 16, 3, 0, 0, 7); g.fill();
  // her shadow is a little too big, and it moves on its own
  g.globalAlpha = a * 0.28; for (let i = 0; i < 5; i++) { const an = frame * 0.03 + i * 1.3; g.beginPath(); g.ellipse(x - cam.x + Math.cos(an) * 14, y - cam.y - 2, 9 + Math.sin(an * 1.7) * 3, 2, 0, 0, 7); g.fill(); }
  g.globalAlpha = a; drawRimSprite('gaiden', 'vel' + f, sx, sy, face < 0, '#b8a8ff', 1); g.restore();
}
// walk in (f2/f3) from 56px on the side away from Kanata, idle+blink, bow (f4), then turn (f5) and leave (f6) the way she came
function velPose(t, life, x0, x1, tBow, tTurn) {
  const dir = Math.sign(x1 - x0) || 1, walk = 50;
  if (t < walk) { const k = t / walk; return { x: x0 + (x1 - x0) * k, f: (t >> 3) & 1 ? 3 : 2, face: dir, a: Math.min(1, t / 20) }; }
  if (t >= tTurn + 20) { const k = (t - tTurn - 20) / Math.max(1, life - tTurn - 20); return { x: x1 - dir * 30 * k, f: 6, face: -dir, a: Math.max(0, 1 - k) }; }
  if (t >= tTurn) return { x: x1, f: 5, face: dir, a: 1 };
  if (t >= tBow && t < tBow + 50) return { x: x1, f: 4, face: dir, a: 1 };
  return { x: x1, f: (t % 150) > 142 ? 1 : 0, face: dir, a: 1 };
}
function drawStoryWorld(lights) {
  const V = STORY.vel;
  if (V) { if (V.from === undefined) V.from = V.x + (Math.sign(V.x - pcx()) || 1) * 56;
    const P = velPose(V.t, V.life, V.from, V.x, 70, V.life - 60); drawVelSprite(P.x, V.y, P.a, P.f, P.face); lights.push({ x: P.x, y: V.y - 40, r: 60, cool: 1 }); }
  const S = STORY.scene; if (!S) return;
  // Chronoa: defeated (f6, cracked clock) until she is lifted; then f7 (float pose, feet at cell y 74) carried by something unseen
  const fl = S.t >= 470, cx = S.cx, cy = S.cy + 4 - S.lift * 46 + Math.sin(S.t * 0.04) * 2 * S.lift, key = 'chr' + (fl ? 7 : 6), feetY = fl ? 74 : 79;
  g.save(); g.globalAlpha = S.alpha;
  if (fl) { const cp = { x: S.cx0 - 64 + (S.face > 0 ? 98 : 29), y: FLOOR_Y - 79 + 64 }; spr('gaiden', 'clk3', Math.round(cp.x - cam.x) - 23, Math.round(FLOOR_Y - cam.y) - 40, S.face < 0); }   // the cracked clock stays behind
  if (S.lift > 0) { for (let i = 0; i < 9; i++) { const an = S.t * 0.05 + i * 0.7, rr = 18 + Math.sin(S.t * 0.07 + i) * 5;
      g.fillStyle = 'rgba(8,4,16,' + (0.10 + 0.06 * Math.sin(S.t * 0.1 + i)) * S.lift + ')'; g.beginPath(); g.ellipse(cx - cam.x + Math.cos(an) * rr, cy - cam.y - 30 + Math.sin(an * 1.3) * rr * 0.9, 10, 7, an, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,' + 0.3 * S.lift + ')'; g.beginPath(); g.ellipse(cx - cam.x, FLOOR_Y - cam.y - 1, 14 + 6 * S.lift, 2, 0, 0, 7); g.fill(); }
  const sx = Math.round(cx - cam.x) - 64 + (fl ? Math.round(Math.sin(S.t * 0.05) * 1.5 * S.lift) : 0), sy = Math.round(cy - cam.y) - feetY;
  if (S.lift > 0) { g.globalAlpha = S.alpha * 0.25 * S.lift; sprWhite('gaiden', key, sx + Math.round(Math.sin(S.t * 0.2) * 2), sy, S.face < 0, '#1a0a2a'); g.globalAlpha = S.alpha; }
  drawRimSprite('gaiden', key, sx, sy, S.face < 0, '#7ae0d0', 1); g.restore();
  if (S.vel) { const P = velPose(S.t - 240, 760, S.vx + 56, S.vx, 45, 600); drawVelSprite(P.x, FLOOR_Y, P.a * S.alpha, P.f, P.face); lights.push({ x: P.x, y: FLOOR_Y - 40, r: 60, cool: 1 }); }
  lights.push({ x: cx, y: cy - 30, r: 56, cool: 1 });
}
// portrait dialogue box at the top of the game screen (game pixels for the frame + portrait, hi-res text)
function drawStoryBox() {
  const B = STORY.box; if (!B) return;
  const Sp = SPEAKERS[B.who], a = Math.min(1, B.t / 14, (B.T - B.t) / 10);
  g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(10,8,22,0.88)'; g.fillRect(6, 22, VW - 12, 72); g.strokeStyle = Sp.col; g.lineWidth = 1; g.strokeRect(6.5, 22.5, VW - 13, 71);
  g.fillStyle = '#000000'; g.fillRect(10, 26, 66, 66); spr('gaiden', Sp.portrait, 11, 27); g.strokeStyle = '#5a4a7a'; g.strokeRect(10.5, 26.5, 65, 65); g.restore();
}
const STORY_TEXT_W = VW - 84 - 18;   // v0.4.2: 64px portrait; text starts at x=84; the box's inner edge is at VW-7 -> ~11px right margin
// test hook: how a dialogue line lays out in the box at the current screen size
function storyFit(text) { const s = hiS(); sctx.save(); sctx.font = '700 ' + fontPx(8.5) + 'px ' + JP_FONT; const lines = wrapText(text, STORY_TEXT_W * s, true);
  const w = Math.max(...lines.map(l => sctx.measureText(l).width)); sctx.restore(); return { lines: lines.length, w: Math.round(w), limit: Math.round(STORY_TEXT_W * s), boxRight: Math.round((VW - 7) * s), x0: Math.round(84 * s), bad: lines.slice(1).filter(l => NO_LINE_START.includes(l[0]) || l.length < 3).length }; }
function drawStoryText() {
  const B = STORY.box; if (!B) return;
  const Sp = SPEAKERS[B.who], a = Math.min(1, B.t / 14, (B.T - B.t) / 10), shown = Math.min(B.text.length, Math.floor((B.T - B.t) / 2) + 1);
  drawHiText(Sp.name, 84, 29, 8, Sp.col, '#0a0816', 'left', a);
  const s = hiS(), fs = fontPx(8.5); sctx.save(); sctx.globalAlpha = a; sctx.font = '700 ' + fs + 'px ' + JP_FONT;
  // v0.4.1: wrap the WHOLE line once (stable layout while it types out) to the box's inner width, then reveal it char by char
  const lines = wrapText(B.text, STORY_TEXT_W * s, true); sctx.fillStyle = '#f4f0ff'; sctx.textAlign = 'left'; sctx.textBaseline = 'top';
  let left = shown; lines.slice(0, 3).forEach((l, i) => { if (left > 0) sctx.fillText(l.slice(0, left), 84 * s, (45 + i * 13) * s); left -= l.length; }); sctx.restore();
}
