
// =====================================================================
//  Core: canvas, pixel font, hi-res Japanese text, assets, sound effects, input, layout
// =====================================================================
const VW = CONFIG.viewW, VH = CONFIG.viewH, TS = CONFIG.tile, CC = CONFIG.cellCols, CR = CONFIG.cellRows;
const CELL_W = CC * TS, CELL_H = CR * TS;
const screen = document.getElementById('screen');
const sctx = screen.getContext('2d', { alpha: false });
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const buf = mkCanvas(VW, VH);
const g = buf.getContext('2d');
g.imageSmoothingEnabled = false;
function hash(a, b) { let h = Math.imul(a, 73856093) ^ Math.imul(b, 19349663); h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
let frame = 0;

// ---------------------------------------------------------------------
//  Pixel font (5x5 bitmap, shared with ROCKSIDE), pre-rendered to a colour atlas
// ---------------------------------------------------------------------
const GLYPHS = {
A:'0111010001111111000110001',B:'1111010001111101000111110',C:'0111110000100001000001111',D:'1111010001100011000111110',
E:'1111110000111101000011111',F:'1111110000111101000010000',G:'0111110000100111000101111',H:'1000110001111111000110001',
I:'1111100100001000010011111',J:'0011100001000011000101110',K:'1000110010111001001010001',L:'1000010000100001000011111',
M:'1000111011101011000110001',N:'1000111001101011001110001',O:'0111010001100011000101110',P:'1111010001111101000010000',
Q:'0111010001101011001001101',R:'1111010001111101001010001',S:'0111110000011100000111110',T:'1111100100001000010000100',
U:'1000110001100011000101110',V:'1000110001100010101000100',W:'1000110001101011101110001',X:'1000101010001000101010001',
Y:'1000101010001000010000100',Z:'1111100010001000100011111',
'0':'0111010011101011100101110','1':'0010001100001000010001110','2':'1111000001011101000011111','3':'1111000001011100000111110',
'4':'1001010010111110001000010','5':'1111110000111100000111110','6':'0111010000111101000101110','7':'1111100001000100010000100',
'8':'0111010001011101000101110','9':'0111010001011110000101110',
' ':'0000000000000000000000000','!':'0010000100001000000000100','.':'0000000000000000000000100',':':'0000000100000000010000000',
'-':'0000000000011100000000000','/':'0000100010001000100010000','?':'0111010001001100000000100','%':'1100111010001000101110011',"'":'0010000100000000000000000',
',':'0000000000000000010001000','>':'0100000100000100010001000','(':'0001000100001000010000010',')':'0100000100001000010001000',
'+':'0000000100011100010000000'
};
const FONT_CHARS = Object.keys(GLYPHS).join('');
const FONT_IDX = new Int16Array(128).fill(-1);
for (let i = 0; i < FONT_CHARS.length; i++) FONT_IDX[FONT_CHARS.charCodeAt(i)] = i;
const FONT_COLORS = { w: "#ffffff", y: "#ffd84a", c: "#8fe8ff", r: "#ff5d6d", k: "#0c0a18", g: "#8be07a", b: "#9a92d0", p: "#ff9ad8", d: "#5a5488" };
const FONT_CI = {};
const fontAtlas = mkCanvas(FONT_CHARS.length * 6, Object.keys(FONT_COLORS).length * 6);
(function buildFont() {
  const fg = fontAtlas.getContext('2d'); let ci = 0;
  for (const k in FONT_COLORS) {
    FONT_CI[k] = ci; fg.fillStyle = FONT_COLORS[k];
    for (let i = 0; i < FONT_CHARS.length; i++) {
      const bits = GLYPHS[FONT_CHARS[i]];
      for (let p = 0; p < 25; p++) if (bits.charCodeAt(p) === 49) fg.fillRect(i * 6 + (p % 5), ci * 6 + ((p / 5) | 0), 1, 1);
    }
    ci++;
  }
})();
function textWidth(str, s) { return str.length * 6 * s - s; }
function drawText(str, x, y, col, s, align) {
  s = s || 1; const ci = FONT_CI[col] * 6;
  if (align === 'c') x -= (textWidth(str, s) / 2) | 0; else if (align === 'r') x -= textWidth(str, s);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i); const gi = code < 128 ? FONT_IDX[code] : -1;
    if (gi >= 0) g.drawImage(fontAtlas, gi * 6, ci, 5, 5, x + i * 6 * s, y, 5 * s, 5 * s);
  }
}
function drawTextShadow(str, x, y, col, s, align) { drawText(str, x + s, y + s, 'k', s, align); drawText(str, x, y, col, s, align); }

// ---------------------------------------------------------------------
//  Hi-res text (Japanese) drawn straight onto the device-resolution screen canvas after the blit
// ---------------------------------------------------------------------
const JP_FONT = '"Hiragino Kaku Gothic ProN","Hiragino Sans","Noto Sans JP","Noto Sans CJK JP","Yu Gothic UI","Yu Gothic","Meiryo",sans-serif';
function hiS() { return screen.width / VW; }
const wrapCache = new Map();
const NO_LINE_START = '、。，．…」』）！？ーぁぃぅぇぉっゃゅょァィゥェォッャュョ';
function wrapText(text, maxW, soft) {
  const key = sctx.font + '|' + maxW + '|' + (soft ? 's|' : '') + text; let lines = wrapCache.get(key);
  if (lines) return lines;
  lines = []; let cur = '';
  for (const ch of text) { if (ch === '\n') { lines.push(cur); cur = ''; continue; }
    if (cur && sctx.measureText(cur + ch).width > maxW) {
      // kinsoku: never start a line with closing punctuation / a split ellipsis - carry the last char(s) down with it
      let carry = ''; if (NO_LINE_START.includes(ch) && cur.length > 2) { carry = cur.slice(-1); if (carry === '…' && cur.slice(-2, -1) === '…') carry = '……'; }
      if (soft) { // dialogue: prefer breaking right after the last 、/。 in the second half of the line (no orphaned syllables)
        let k = -1; for (let i = cur.length - 1; i >= cur.length * 0.5; i--) if ('、。」！？'.includes(cur[i])) { k = i; break; }
        if (k >= 0 && k < cur.length - 1) carry = cur.slice(k + 1); }
      lines.push(cur.slice(0, cur.length - carry.length)); cur = carry + ch; } else cur += ch; }
  if (cur) lines.push(cur);
  wrapCache.set(key, lines); return lines;
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
function fontPx(gameUnits) { return Math.round(Math.max(gameUnits * hiS(), 11 * (screen.width / Math.max(1, layout.gameW)))); }
function drawHiText(text, gx, gy, gsize, color, outline, align, alpha) {
  const s = hiS(), fs = fontPx(gsize);
  sctx.save(); if (alpha !== undefined) sctx.globalAlpha = alpha;
  sctx.font = '700 ' + fs + 'px ' + JP_FONT; sctx.textAlign = align || 'center'; sctx.textBaseline = 'top';
  if (outline) { sctx.lineWidth = Math.max(2, Math.round(s * 1.3)); sctx.strokeStyle = outline; sctx.lineJoin = 'round'; sctx.strokeText(text, gx * s, gy * s); }
  sctx.fillStyle = color; sctx.fillText(text, gx * s, gy * s); sctx.restore();
}
// dialogue box (speaker name + wrapped text), top y in game px (default: along the bottom)
function drawDialogue(name, nameColor, text, alpha, topY) {
  const s = hiS(), fs = fontPx(8), nfs = Math.round(fs * 0.85), pad = Math.round(fs * 0.7);
  const bx = Math.round(10 * s), bw = Math.round((VW - 20) * s);
  sctx.save(); sctx.globalAlpha = alpha === undefined ? 1 : alpha;
  sctx.font = '700 ' + fs + 'px ' + JP_FONT;
  const lines = wrapText(text, bw - pad * 2), lh = Math.round(fs * 1.4);
  const bh = pad * 2 + (name ? nfs + Math.round(fs * 0.35) : 0) + lh * lines.length;
  const by = topY !== undefined ? Math.round(topY * s) : Math.round((VH - 10) * s - bh);
  sctx.fillStyle = 'rgba(12,10,28,0.9)'; sctx.strokeStyle = nameColor || '#9ad8ff'; sctx.lineWidth = Math.max(2, Math.round(s));
  roundRect(sctx, bx, by, bw, bh, Math.round(4 * s)); sctx.fill(); sctx.stroke();
  sctx.textBaseline = 'top'; sctx.textAlign = 'left';
  let ty = by + pad;
  if (name) { sctx.font = '700 ' + nfs + 'px ' + JP_FONT; sctx.fillStyle = nameColor; sctx.fillText(name, bx + pad, ty); ty += nfs + Math.round(fs * 0.35); }
  sctx.font = '700 ' + fs + 'px ' + JP_FONT; sctx.fillStyle = '#ffffff';
  for (let i = 0; i < lines.length; i++) sctx.fillText(lines[i], bx + pad, ty + i * lh);
  sctx.restore();
}
// small speech bubble above a point in game coords
function drawBubble(gx, gy, text, alpha) {
  const s = hiS(), fs = fontPx(7.5), pad = Math.round(fs * 0.5);
  sctx.save(); sctx.globalAlpha = alpha === undefined ? 1 : alpha;
  sctx.font = '700 ' + fs + 'px ' + JP_FONT;
  const lines = wrapText(text, 190 * s); let w = 0; for (const l of lines) w = Math.max(w, sctx.measureText(l).width);
  const lh = Math.round(fs * 1.3), bw = Math.ceil(w + pad * 2), bh = pad * 2 + lh * lines.length - Math.round(fs * 0.3);
  let bx = Math.round(gx * s - bw / 2); bx = clamp(bx, Math.round(3 * s), screen.width - bw - Math.round(3 * s));
  let by = Math.round(gy * s - bh - 6 * s); if (by < 22 * s) by = Math.round(22 * s);
  sctx.fillStyle = '#f6f2ff'; sctx.strokeStyle = '#1a1630'; sctx.lineWidth = Math.max(2, Math.round(s * 0.9));
  roundRect(sctx, bx, by, bw, bh, Math.round(4 * s)); sctx.fill(); sctx.stroke();
  const tx = clamp(gx * s, bx + 8 * s, bx + bw - 8 * s);
  sctx.beginPath(); sctx.moveTo(tx - 4 * s, by + bh - 1); sctx.lineTo(tx, by + bh + 5 * s); sctx.lineTo(tx + 4 * s, by + bh - 1); sctx.closePath(); sctx.fill();
  sctx.textBaseline = 'top'; sctx.textAlign = 'left'; sctx.fillStyle = '#1a1630';
  for (let i = 0; i < lines.length; i++) sctx.fillText(lines[i], bx + pad, by + pad + i * lh);
  sctx.restore();
}
function rectLine(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); }

// ---------------------------------------------------------------------
//  Assets: PNG atlases in assets/ (+ rect maps inlined at build time as EMBEDDED_META)
//  Every sprite is looked up by name, so an artist can redraw an atlas freely as long as the names stay.
// ---------------------------------------------------------------------
const ASSET_FILES = ['kanata', 'wisp', 'tiles', 'bg', 'props', 'items', 'enemies', 'boss', 'chars', 'gaiden', 'title_bg'];
const IMG = {}; let assetsLoaded = 0, assetsFailed = [];
const META = (typeof EMBEDDED_META !== 'undefined') ? EMBEDDED_META : {};
for (const n of ASSET_FILES) {
  const im = new Image(); im.onload = () => { assetsLoaded++; }; im.onerror = () => { assetsFailed.push(n); assetsLoaded++; };
  im.src = 'assets/' + n + '.png?v=' + GAME_VERSION; IMG[n] = im;
}
const assetsReady = () => assetsLoaded >= ASSET_FILES.length;
const FLIP_CACHE = new Map();
function rectOf(atlas, key) { const m = META[atlas]; const r = m && m[key]; if (!r) throw new Error('missing sprite ' + atlas + '.' + key); return r; }
// draw a named sprite with its top-left at (x,y); flip mirrors horizontally inside its own box
function spr(atlas, key, x, y, flip, ctx) {
  const r = rectOf(atlas, key), c = ctx || g;
  if (!flip) { c.drawImage(IMG[atlas], r.x, r.y, r.w, r.h, Math.round(x), Math.round(y), r.w, r.h); return r; }
  const ck = atlas + '.' + key; let f = FLIP_CACHE.get(ck);
  if (!f) { f = mkCanvas(r.w, r.h); const fg = f.getContext('2d'); fg.translate(r.w, 0); fg.scale(-1, 1); fg.drawImage(IMG[atlas], r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); FLIP_CACHE.set(ck, f); }
  c.drawImage(f, Math.round(x), Math.round(y)); return r;
}
// bottom-centre anchored
function sprBC(atlas, key, cx, by, flip, ctx) { const r = rectOf(atlas, key); return spr(atlas, key, cx - (r.w >> 1), by - r.h, flip, ctx); }
// white silhouette (hit flash) of a sprite
const WHITE_CACHE = new Map();
function sprWhite(atlas, key, x, y, flip, col) {
  const r = rectOf(atlas, key), ck = atlas + '.' + key + (flip ? 'F' : '') + (col || ''); let f = WHITE_CACHE.get(ck);
  if (!f) { f = mkCanvas(r.w, r.h); const fg = f.getContext('2d'); if (flip) { fg.translate(r.w, 0); fg.scale(-1, 1); }
    fg.drawImage(IMG[atlas], r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); fg.setTransform(1, 0, 0, 1, 0, 0); fg.globalCompositeOperation = 'source-in'; fg.fillStyle = col || '#fff'; fg.fillRect(0, 0, r.w, r.h); WHITE_CACHE.set(ck, f); }
  g.drawImage(f, Math.round(x), Math.round(y));
}
// v0.4.2: backlight + 1px rim so dark characters read against dark rooms (soft additive glow behind, tinted outline at ~50%)
function drawRimSprite(atlas, key, x, y, flip, col, k) {
  const r = rectOf(atlas, key); k = k === undefined ? 1 : k; const a0 = g.globalAlpha;
  g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x + r.w / 2, y + r.h * 0.55, 2, x + r.w / 2, y + r.h * 0.55, r.w * 0.45);
  gr.addColorStop(0, col + '30'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.globalAlpha = a0 * k; g.fillRect(x, y, r.w, r.h); g.restore();
  g.globalAlpha = a0 * 0.5 * k; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1]]) sprWhite(atlas, key, x + dx, y + dy, flip, col);
  g.globalAlpha = a0; spr(atlas, key, x, y, flip);
}
// hero frames: assets/kanata.png is one row of equal frames; kanata.json gives the feet anchor
function heroFrame(i) { const m = META.kanata; return { sx: i * m.frameWidth, w: m.frameWidth, h: m.frameHeight, ax: m.anchorX, ay: m.anchorY }; }
function drawHero(i, feetX, feetY, flip, white, alpha) {
  const f = heroFrame(i); if (alpha !== undefined) g.globalAlpha = alpha;
  const x = Math.round(feetX - (flip ? f.w - 1 - f.ax : f.ax)), y = Math.round(feetY - f.ay);
  const ck = 'hero' + ((progress.shop && progress.shop.pal) || '') + i + (flip ? 'F' : '') + (white ? 'W' : ''); let c = FLIP_CACHE.get(ck);
  if (!c) { c = mkCanvas(f.w, f.h); const cg = c.getContext('2d'); if (flip) { cg.translate(f.w, 0); cg.scale(-1, 1); } cg.drawImage(kanataSheet(), f.sx, 0, f.w, f.h, 0, 0, f.w, f.h);
    if (white) { cg.setTransform(1, 0, 0, 1, 0, 0); cg.globalCompositeOperation = 'source-atop'; cg.fillStyle = 'rgba(255,255,255,0.85)'; cg.fillRect(0, 0, f.w, f.h); } FLIP_CACHE.set(ck, c); }
  g.drawImage(c, x, y); g.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Sound effects (Web Audio, no files)
// ---------------------------------------------------------------------
const Snd = {
  ctx: null, master: null, noiseB: null, muted: false, vacNode: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.3; this.master.connect(this.ctx.destination);
      const n = this.ctx.sampleRate * 1.0; this.noiseB = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.noiseB.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.3; },
  tone(type, f0, f1, dur, vol, delay) {
    const c = this.ctx; if (!c || this.muted) return;
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), gn = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(gn); gn.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, freq, delay, type) {
    const c = this.ctx; if (!c || this.muted) return;
    const t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), gn = c.createGain();
    s.buffer = this.noiseB; f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.2), t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(gn); gn.connect(this.master); s.start(t); s.stop(t + dur + 0.02);
  },
  // continuous vacuum hum (pitch rises during a tug-of-war)
  vac(on, tug) {
    const c = this.ctx; if (!c) return;
    if (on && !this.vacNode) {
      const s = c.createBufferSource(), f = c.createBiquadFilter(), gn = c.createGain(), o = c.createOscillator(), og = c.createGain();
      s.buffer = this.noiseB; s.loop = true; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.8; gn.gain.value = 0;
      o.type = 'sawtooth'; o.frequency.value = 95; og.gain.value = 0.018;
      s.connect(f); f.connect(gn); o.connect(og); og.connect(gn); gn.connect(this.master); s.start(); o.start();
      gn.gain.linearRampToValueAtTime(0.13, c.currentTime + 0.12);
      this.vacNode = { s, f, gn, o };
    } else if (!on && this.vacNode) {
      const n = this.vacNode, t = c.currentTime; n.gn.gain.cancelScheduledValues(t); n.gn.gain.setValueAtTime(n.gn.gain.value, t); n.gn.gain.linearRampToValueAtTime(0, t + 0.12);
      n.s.stop(t + 0.15); n.o.stop(t + 0.15); this.vacNode = null;
    }
    if (on && this.vacNode) { const t = c.currentTime; this.vacNode.f.frequency.setTargetAtTime(tug ? 1500 + Math.sin(frame * 0.3) * 200 : 900, t, 0.05); this.vacNode.o.frequency.setTargetAtTime(tug ? 140 : 95, t, 0.05); }
  },
  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'jump': this.tone('square', 240, 470, 0.09, 0.1); break;
      case 'hover': this.tone('triangle', 520, 700, 0.12, 0.06); break;
      case 'land': this.noise(0.08, 0.18, 600); break;
      case 'catch': this.tone('square', 300, 900, 0.12, 0.1); this.tone('square', 600, 1200, 0.1, 0.06, 0.06); break;
      case 'yank': this.tone('sawtooth', 200, 120, 0.15, 0.1); break;
      case 'swallow': for (let i = 0; i < 4; i++) this.tone('square', 400 + i * 180, 900 + i * 180, 0.06, 0.08, i * 0.05); this.noise(0.25, 0.15, 3000, 0, 'highpass'); break;
      case 'escape': this.tone('triangle', 800, 300, 0.2, 0.1); break;
      case 'item': this.tone('square', 1200, 1200, 0.04, 0.06); this.tone('square', 1600, 1600, 0.05, 0.06, 0.04); break;
      case 'coin': this.tone('square', 1320, 1320, 0.03, 0.05); this.tone('square', 1760, 1760, 0.08, 0.05, 0.03); break;
      case 'stash': this.tone('triangle', 500, 250, 0.08, 0.12); break;
      case 'spit': this.tone('square', 180, 700, 0.08, 0.12); this.noise(0.1, 0.15, 2500); break;
      case 'puff': this.noise(0.14, 0.18, 1800); break;
      case 'hit': this.tone('square', 320, 160, 0.06, 0.12); break;
      case 'tink': this.tone('triangle', 1900, 1600, 0.05, 0.12); this.tone('triangle', 2600, 2300, 0.05, 0.06, 0.03); break;
      case 'break': this.noise(0.3, 0.3, 3500); this.tone('square', 600, 100, 0.2, 0.08); break;
      case 'hurt': this.tone('sawtooth', 420, 110, 0.22, 0.13); this.noise(0.12, 0.18, 1500); break;
      case 'rip': this.noise(0.35, 0.22, 4000, 0, 'highpass'); break;
      case 'secret': for (let i = 0; i < 6; i++) this.tone('triangle', [523, 659, 784, 1047, 784, 1319][i], [523, 659, 784, 1047, 784, 1319][i], 0.12, 0.08, i * 0.09); break;
      case 'save': for (let i = 0; i < 4; i++) this.tone('triangle', [392, 523, 659, 784][i], [392, 523, 659, 784][i], 0.25, 0.08, i * 0.11); break;
      case 'door': this.noise(0.18, 0.15, 700); this.tone('square', 110, 80, 0.12, 0.06); break;
      case 'boom': this.noise(0.6, 0.4, 900); this.tone('triangle', 120, 40, 0.5, 0.25); break;
      case 'crash': this.noise(0.5, 0.35, 5000, 0, 'highpass'); this.noise(0.6, 0.4, 600); this.tone('triangle', 110, 35, 0.6, 0.3); break;
      case 'warn': this.tone('square', 880, 880, 0.06, 0.05); break;
      case 'bhit': this.tone('square', 200, 110, 0.08, 0.14); this.noise(0.06, 0.2, 2500); break;
      case 'cursor': this.tone('square', 900, 900, 0.03, 0.06); break;
      case 'start': this.tone('square', 523, 523, 0.07, 0.08); this.tone('square', 784, 784, 0.1, 0.08, 0.07); this.tone('square', 1047, 1047, 0.16, 0.08, 0.14); break;
      case 'death': for (let i = 0; i < 5; i++) this.tone('square', 700 - i * 110, 500 - i * 90, 0.09, 0.12, i * 0.09); break;
      case 'chime': this.tone('triangle', 1568, 1568, 0.5, 0.07); this.tone('triangle', 2093, 2093, 0.6, 0.05, 0.1); break;
      case 'djump': this.tone('triangle', 600, 1100, 0.12, 0.09); this.noise(0.08, 0.08, 4000, 0, 'highpass'); break;
      case 'float': this.tone('triangle', 400, 900, 0.25, 0.08); this.tone('square', 900, 1300, 0.12, 0.04, 0.08); break;
      case 'heavyspit': this.tone('square', 120, 320, 0.12, 0.14); this.noise(0.16, 0.2, 1200); break;
      case 'thud': this.noise(0.18, 0.3, 500); this.tone('triangle', 140, 60, 0.18, 0.18); break;
      case 'splash': this.noise(0.25, 0.22, 2500, 0, 'bandpass'); this.tone('triangle', 900, 300, 0.12, 0.05); break;
      case 'lever': this.tone('square', 200, 90, 0.15, 0.12); this.noise(0.2, 0.2, 900); this.tone('square', 90, 90, 0.08, 0.1, 0.15); break;
      case 'burn': this.noise(0.5, 0.18, 1800, 0, 'bandpass'); break;
      case 'get': for (let i = 0; i < 8; i++) this.tone('square', [523, 659, 784, 1047, 784, 1047, 1319, 1568][i], [523, 659, 784, 1047, 784, 1047, 1319, 1568][i], 0.12, 0.07, i * 0.07); break;
      case 'bat': this.tone('square', 2400, 1800, 0.05, 0.04); this.tone('square', 2600, 2000, 0.05, 0.04, 0.07); break;
      case 'flap': this.noise(0.1, 0.12, 1200, 0, 'bandpass'); break;
      case 'foedie': this.tone('square', 500, 120, 0.16, 0.1); this.noise(0.15, 0.16, 2000); break;
      case 'bubble': this.tone('sine', 300, 900, 0.1, 0.08); break;
      case 'thorn': this.noise(0.2, 0.22, 3000, 0, 'highpass'); this.tone('sawtooth', 300, 120, 0.12, 0.06); break;
      case 'tick': this.tone('square', 2200, 2200, 0.02, 0.05); break;
      case 'bell': this.tone('triangle', 392, 392, 1.2, 0.16); this.tone('triangle', 784, 784, 0.9, 0.06); this.tone('sine', 196, 196, 1.4, 0.12); break;
      case 'warp': for (let i = 0; i < 6; i++) this.tone('triangle', 400 + i * 160, 700 + i * 200, 0.12, 0.07, i * 0.05); this.noise(0.4, 0.12, 2400, 0, 'bandpass'); break;
      case 'chomp': this.noise(0.05, 0.3, 3000, 0, 'highpass'); this.tone('square', 260, 90, 0.08, 0.14); this.noise(0.05, 0.25, 2200, 0.09, 'highpass'); this.tone('square', 220, 70, 0.08, 0.12, 0.09); break;
      case 'whoosh': this.noise(0.5, 0.2, 1500, 0, 'bandpass'); break;
    }
  },
};
function sfx(n) { Snd.play(n); }

// ---------------------------------------------------------------------
//  Input: keyboard + on-screen buttons (← → JUMP VAC SPIT, MAP)
// ---------------------------------------------------------------------
const keys = { left: false, right: false, jump: false, vac: false, spit: false, down: false };
const touch = { left: false, right: false, jump: false, vac: false, spit: false, down: false };
const inp = { jumpPressed: false, spitPressed: false, vacPressed: false, startPressed: false, mapPressed: false, dropPressed: false, leftPressed: false, rightPressed: false };
const held = k => keys[k] || touch[k];
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyZ: 'jump', Space: 'jump', KeyK: 'jump', ArrowUp: 'jump', KeyW: 'jump',
  ArrowDown: 'down', KeyS: 'down', KeyX: 'vac', KeyJ: 'vac', KeyC: 'spit', KeyL: 'spit' };
window.addEventListener('keydown', e => {
  Snd.init();
  const k = KEYMAP[e.code];
  if (k) { if (!keys[k]) { if (k === 'jump') inp.jumpPressed = true; if (k === 'spit') inp.spitPressed = true; if (k === 'vac') inp.vacPressed = true; if (k === 'left') inp.leftPressed = true; if (k === 'right') inp.rightPressed = true; if (k === 'down') inp.dropPressed = true; } keys[k] = true; e.preventDefault(); refreshButtons(); }
  if (e.code === 'Enter') { inp.startPressed = true; e.preventDefault(); }
  if (e.code === 'Tab' || e.code === 'KeyQ') { inp.mapPressed = true; e.preventDefault(); }
  if (e.code === 'KeyM' && !e.repeat) toggleMute();
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { keys[k] = false; refreshButtons(); } });

const msgEl = document.getElementById('msg');
const pad = document.getElementById('pad'), muteBtn = document.getElementById('mute'), hintEl = document.getElementById('hint'), mapBtn = document.getElementById('bMap');
hintEl.textContent = '清掃員カナタ ～ミミックと呪いの館～  v' + GAME_VERSION;
const BTN = { left: document.getElementById('bL'), right: document.getElementById('bR'), jump: document.getElementById('bJ'), vac: document.getElementById('bV'), spit: document.getElementById('bS') };
const BTN_ON = { left: false, right: false, jump: false, vac: false, spit: false };
const ptrs = new Map();
const layout = { portrait: true, W: 390, H: 844, gameX: 0, gameY: 0, gameW: 390, gameH: 292, dpadMid: 100, act: {}, ctrlTop: 0 };
function zoneAt(x, y) {
  if (layout.portrait && y < layout.ctrlTop) return null;
  if (x < layout.W / 2) return x < layout.dpadMid ? 'left' : 'right';
  let best = null, bd = 1e9;
  for (const k in layout.act) { const p = layout.act[k], d = (x - p.x) * (x - p.x) + (y - p.y) * (y - p.y); if (d < bd) { bd = d; best = k; } }
  return best;
}
function recomputeTouch() {
  const was = Object.assign({}, touch);
  for (const k in touch) touch[k] = false;
  ptrs.forEach(z => { if (z) touch[z] = true; });
  if (touch.jump && !was.jump) inp.jumpPressed = true;
  if (touch.spit && !was.spit) inp.spitPressed = true;
  if (touch.vac && !was.vac) inp.vacPressed = true;
  if (touch.left && !was.left) inp.leftPressed = true;
  if (touch.right && !was.right) inp.rightPressed = true;
  refreshButtons();
}
function refreshButtons() { for (const k in BTN) { const on = touch[k] || keys[k]; if (on !== BTN_ON[k]) { BTN_ON[k] = on; BTN[k].classList.toggle('on', on); } } }
pad.addEventListener('pointerdown', e => {
  e.preventDefault(); Snd.init();
  if (e.target === muteBtn) { toggleMute(); return; }
  if (e.target === mapBtn) { inp.mapPressed = true; mapBtn.classList.add('on'); setTimeout(() => mapBtn.classList.remove('on'), 120); return; }
  const gx = (e.clientX - layout.gameX) / layout.gameW * VW, gy = (e.clientY - layout.gameY) / layout.gameH * VH;
  if (gx >= 0 && gx < VW && gy >= 0 && gy < VH && screenTap(gx, gy)) return;
  inp.startPressed = true;
  try { pad.setPointerCapture(e.pointerId); } catch (_) {}
  ptrs.set(e.pointerId, zoneAt(e.clientX, e.clientY)); swipe.set(e.pointerId, { y: e.clientY, x: e.clientX, done: false }); recomputeTouch();
});
const swipe = new Map();   // v0.4.3: swipe down on the ←→ pad = drop through a ledge
pad.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return; e.preventDefault();
  const sw = swipe.get(e.pointerId); if (sw && !sw.done && sw.x < layout.W / 2 && e.clientY - sw.y > 26) { sw.done = true; inp.dropPressed = true; }
  const z = zoneAt(e.clientX, e.clientY); if (ptrs.get(e.pointerId) !== z) { ptrs.set(e.pointerId, z); recomputeTouch(); }
});
function ptrUp(e) { swipe.delete(e.pointerId); if (ptrs.delete(e.pointerId)) recomputeTouch(); }
pad.addEventListener('pointerup', ptrUp); pad.addEventListener('pointercancel', ptrUp); pad.addEventListener('lostpointercapture', ptrUp);
const stopEv = e => { if (e.cancelable) e.preventDefault(); };
for (const ev of ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'dblclick']) document.addEventListener(ev, stopEv, { passive: false });
document.addEventListener('contextmenu', stopEv);
function releaseAll() { ptrs.clear(); for (const k in keys) keys[k] = false; recomputeTouch(); }
window.addEventListener('blur', releaseAll);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
function toggleMute() {
  Snd.init(); Snd.setMuted(!Snd.muted);
  muteBtn.textContent = Snd.muted ? 'SOUND OFF' : 'SOUND ON'; muteBtn.classList.toggle('off', Snd.muted);
  try { localStorage.setItem('gaiden_muted', Snd.muted ? '1' : '0'); } catch (_) {}
}
try { if (localStorage.getItem('gaiden_muted') === '1') { Snd.muted = true; muteBtn.textContent = 'SOUND OFF'; muteBtn.classList.add('off'); } } catch (_) {}

function place(el, x, y, w, h) { el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.width = Math.round(w) + 'px'; el.style.height = Math.round(h) + 'px'; }
// Portrait: canvas at the top, then the message panel (tips / room name), the MAP + SOUND row and the controls
// packed right underneath (no dead gap); spare height is split around the controls (a bit more below).
function doLayout() {
  const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
  const portrait = H >= W * 1.1;
  layout.W = W; layout.H = H; layout.portrait = portrait;
  document.body.classList.toggle('land', !portrait);
  let gw, gh, gx, gy;
  if (portrait) {
    gw = W; gh = Math.round(W * VH / VW);
    if (gh > H * 0.5) { gh = Math.round(H * 0.5); gw = Math.round(gh * VW / VH); }
    gx = Math.round((W - gw) / 2); gy = H > 700 ? 22 : H > 600 ? 10 : 0; // clear of the notch / status bar
  } else {
    gh = H; gw = Math.round(H * VW / VH); if (gw > W) { gw = W; gh = Math.round(W * VH / VW); }
    gx = Math.round((W - gw) / 2); gy = Math.round((H - gh) / 2);
  }
  layout.gameX = gx; layout.gameY = gy; layout.gameW = gw; layout.gameH = gh;
  screen.style.left = gx + 'px'; screen.style.top = gy + 'px'; screen.style.width = gw + 'px'; screen.style.height = gh + 'px';
  const pw = Math.round(gw * dpr), ph = Math.round(gh * dpr);
  if (screen.width !== pw || screen.height !== ph) { screen.width = pw; screen.height = ph; wrapCache.clear(); }
  sctx.imageSmoothingEnabled = false;
  let bs, gap = 10, cy, margin;
  if (portrait) {
    margin = Math.max(12, Math.round(W * 0.03));
    const msgH = H > 740 ? 62 : 50, msgTop = gy + gh + 6;
    place(msgEl, margin, msgTop, W - margin * 2, msgH);
    const rowTop = msgTop + msgH + 8;
    place(mapBtn, margin, rowTop, 64, 32); place(muteBtn, W - margin - 100, rowTop + 1, 100, 30);
    const ctrlTop = rowTop + 40; layout.ctrlTop = ctrlTop;
    bs = Math.max(66, Math.min(92, Math.floor((W / 2 - 30) / 2)));
    const off = bs * 0.62, vb = Math.round(bs * 1.12), clusterH = off * 1.75 + bs / 2 + vb / 2;
    const spare = Math.max(0, H - 24 - ctrlTop - clusterH);
    cy = ctrlTop + Math.min(spare * 0.45, 90) + off + bs / 2; // a little lower = easier thumb reach
    hintEl.style.top = (H - 20) + 'px';
  } else {
    bs = Math.max(60, Math.min(84, H * 0.2));
    margin = 14; cy = H * 0.66; gap = 8; layout.ctrlTop = 0;
    place(muteBtn, 10, 10, 96, 30); place(mapBtn, 10, 48, 64, 34);
  }
  const lx = margin, rx = margin + bs + gap;
  place(BTN.left, lx, cy - bs / 2, bs, bs); place(BTN.right, rx, cy - bs / 2, bs, bs);
  layout.dpadMid = rx - gap / 2;
  // right cluster: SPIT (upper left) + JUMP (upper right), big VAC below between them
  const off = bs * 0.62, jx = W - margin - bs, sx = jx - bs - gap, vb = Math.round(bs * 1.12);
  const vx = (jx + sx + bs) / 2 - vb / 2;
  place(BTN.spit, sx, cy - off - bs / 2, bs, bs); place(BTN.jump, jx, cy - off - bs / 2, bs, bs); place(BTN.vac, vx, cy + off * 0.75 - vb / 2, vb, vb);
  layout.act = { spit: { x: sx + bs / 2, y: cy - off }, jump: { x: jx + bs / 2, y: cy - off }, vac: { x: vx + vb / 2, y: cy + off * 0.75 } };
}
window.addEventListener('resize', doLayout);
window.addEventListener('orientationchange', () => setTimeout(doLayout, 100));
