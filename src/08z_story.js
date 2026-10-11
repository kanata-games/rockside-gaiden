
// =====================================================================
//  v0.4 STORY: portrait dialogue box, ヴェル VEL's one-line appearances, the true ending.
//    ヴェル (主人付き秘書) is never fought. She appears in human form at key moments (new areas, after certain
//    bosses, before Chronoa), says ONE short polite cryptic line, and fades away.
//    Ending: Chronoa falls asleep, Vel comes for her; something invisible lifts Chronoa (no visible tentacles,
//    only a faint warping shadow) and they leave together.
// =====================================================================
const STORY = { box: null, queue: [], vel: null, scene: null };
const SPEAKERS = { vel: { name: 'ヴェル', col: '#d8c8e8', portrait: 'portrait_vel' }, chronoa: { name: 'クロノア', col: '#7ae0d0', portrait: 'portrait_chronoa' } };
const VEL_LINES = {
  first:   '見えているものが、すべてではありません。',
  theater: '……拍手は、幕が下りてからでも遅くはありません。',
  stars:   '星は、見られていることに気づいています。',
  marionette: '糸の切れた人形は、自由なのでしょうか。……それとも。',
  orrery:  '夜空の数を数えるのは、主のささやかなご趣味です。',
  clock:   '時計の針は、まだ止まっていませんよ。',
  chronoa: '……私の後ろには、立たないことをお勧めします。',
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
  if (def.vel) setTimeout0(() => velAppear(def.vel, def.velAt ? def.velAt[0] * TS : P.x + P.face * 90, def.velAt ? def.velAt[1] * TS : FLOOR_Y));
}
function setTimeout0(fn) { STORY.pending = fn; }   // run on the next update (after the room finished loading)
function updateStory() {
  if (STORY.pending) { const f = STORY.pending; STORY.pending = null; f(); }
  if (STORY.box && --STORY.box.t <= 0) STORY.box = STORY.queue.shift() || null;
  if (STORY.vel && ++STORY.vel.t > STORY.vel.life) STORY.vel = null;
  if (STORY.scene) updateEnding();
}
// ---- the true ending ---------------------------------------------------
function startEnding(b) {
  STORY.scene = { t: 0, cx: b.cx, cy: FLOOR_Y - 4, vx: 300, lift: 0, alpha: 1 }; STORY.queue.length = 0; STORY.box = null;
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
  if (S.t === 660) storySay('vel', '主が、お待ちです。……残りの十二人とも、いずれお会いになるでしょう。', 260);
  if (S.t >= 900) S.alpha = Math.max(0, S.alpha - 0.012);
  if (S.t === 1000) { STORY.scene = null; startClear(); }
}
function storyCutscene() { return !!STORY.scene; }
// ---- drawing -------------------------------------------------------------
function drawVelSprite(x, y, a, key) {   // x = centre, y = feet (world px)
  const r = rectOf('chars', key || 'vel_idle'), sx = Math.round(x - cam.x - r.w / 2), sy = Math.round(y - cam.y - r.h);
  g.save(); g.globalAlpha = a * 0.35; g.fillStyle = '#000000'; g.beginPath(); g.ellipse(x - cam.x, y - cam.y - 1, 16, 3, 0, 0, 7); g.fill();
  // her shadow is a little too big, and it moves on its own
  g.globalAlpha = a * 0.28; for (let i = 0; i < 5; i++) { const an = frame * 0.03 + i * 1.3; g.beginPath(); g.ellipse(x - cam.x + Math.cos(an) * 14, y - cam.y - 2, 9 + Math.sin(an * 1.7) * 3, 2, 0, 0, 7); g.fill(); }
  g.globalAlpha = a; spr('chars', key || 'vel_idle', sx, sy, x > pcx()); g.restore();
}
function drawStoryWorld(lights) {
  const V = STORY.vel;
  if (V) { const a = Math.min(1, V.t / 40, (V.life - V.t) / 40); drawVelSprite(V.x, V.y, a, V.t > 60 && V.t < 120 ? 'vel_bow' : 'vel_idle'); lights.push({ x: V.x, y: V.y - 40, r: 46, cool: 1 }); }
  const S = STORY.scene; if (!S) return;
  // Chronoa, asleep, lifted by something nobody can see: a faint warping shadow around her, nothing else
  const cx = S.cx, cy = S.cy - S.lift * 46 + Math.sin(S.t * 0.04) * 2 * S.lift, key = S.t < 470 ? 'chr_hurt' : 'chr_sleep', r = rectOf('chars', key);
  g.save(); g.globalAlpha = S.alpha;
  if (S.lift > 0) { for (let i = 0; i < 9; i++) { const an = S.t * 0.05 + i * 0.7, rr = 18 + Math.sin(S.t * 0.07 + i) * 5;
      g.fillStyle = 'rgba(8,4,16,' + (0.10 + 0.06 * Math.sin(S.t * 0.1 + i)) * S.lift + ')'; g.beginPath(); g.ellipse(cx - cam.x + Math.cos(an) * rr, cy - cam.y - 30 + Math.sin(an * 1.3) * rr * 0.9, 10, 7, an, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,' + 0.3 * S.lift + ')'; g.beginPath(); g.ellipse(cx - cam.x, FLOOR_Y - cam.y - 1, 14 + 6 * S.lift, 2, 0, 0, 7); g.fill(); }
  g.translate(Math.round(cx - cam.x), Math.round(cy - cam.y - r.h / 2)); g.rotate(S.lift * -0.35 + (S.lift > 0 ? Math.sin(S.t * 0.05) * 0.04 : 0));
  // the space around her ripples (distortion): draw her twice, slightly offset, with a dark tint
  if (S.lift > 0) { g.globalAlpha = S.alpha * 0.25 * S.lift; sprWhite('chars', key, -(r.w >> 1) + Math.round(Math.sin(S.t * 0.2) * 2), -(r.h >> 1), false, '#1a0a2a'); g.globalAlpha = S.alpha; }
  spr('chars', key, -(r.w >> 1), -(r.h >> 1)); g.restore();
  if (S.vel) { const a = Math.min(1, (S.t - 240) / 50) * S.alpha; drawVelSprite(S.vx, FLOOR_Y, a, S.t > 270 && S.t < 330 ? 'vel_bow' : 'vel_idle'); lights.push({ x: S.vx, y: FLOOR_Y - 40, r: 50, cool: 1 }); }
  lights.push({ x: cx, y: cy - 30, r: 50, cool: 1 });
}
// portrait dialogue box at the top of the game screen (game pixels for the frame + portrait, hi-res text)
function drawStoryBox() {
  const B = STORY.box; if (!B) return;
  const Sp = SPEAKERS[B.who], a = Math.min(1, B.t / 14, (B.T - B.t) / 10);
  g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(10,8,22,0.88)'; g.fillRect(6, 22, VW - 12, 58); g.strokeStyle = Sp.col; g.lineWidth = 1; g.strokeRect(6.5, 22.5, VW - 13, 57);
  g.fillStyle = '#000000'; g.fillRect(10, 27, 50, 50); spr('chars', Sp.portrait, 11, 28); g.strokeStyle = '#5a4a7a'; g.strokeRect(10.5, 27.5, 49, 49); g.restore();
}
function drawStoryText() {
  const B = STORY.box; if (!B) return;
  const Sp = SPEAKERS[B.who], a = Math.min(1, B.t / 14, (B.T - B.t) / 10), shown = Math.min(B.text.length, Math.floor((B.T - B.t) / 2) + 1);
  drawHiText(Sp.name, 68, 27, 8, Sp.col, '#0a0816', 'left', a);
  const s = hiS(), fs = fontPx(8.5); sctx.save(); sctx.globalAlpha = a; sctx.font = '700 ' + fs + 'px ' + JP_FONT;
  const lines = wrapText(B.text.slice(0, shown), (VW - 82) * s); sctx.fillStyle = '#f4f0ff'; sctx.textAlign = 'left'; sctx.textBaseline = 'top';
  lines.slice(0, 3).forEach((l, i) => sctx.fillText(l, 68 * s, (41 + i * 12) * s)); sctx.restore();
}
