
// =====================================================================
//  v0.6.1 CLOCK-FACE SEALS: the clock heart is sealed twelve times, one hour per area boss.
//    Beating a sealed boss lights its hour, the hand ticks forward with a chime, and a tip says which hour fell.
//    When all twelve are lit the hands meet at 12, the door behind the great clock opens, and Chronoa waits.
// =====================================================================
const SEAL_HOURS = {};   SEAL_BOSSES.forEach((k, i) => { SEAL_HOURS[k] = i + 1; });
const SEAL_JP = { rose: 'ローズ', organ: 'オルガン', marionette: '人形座長', orrery: '天球儀', tarant: '樽タラント', knight: '騎士団長', bellboard: '呼び鈴盤',
  angler: 'アングラー', paintgolem: 'パレットン', galecock: 'ゲイルコック', boxjack: 'ボックスジャック', clock: '大時計' };
let SEAL_ANIM = null;   // { hour, t } - the little dial that pops up when an hour is lit
function sealsLit() { return SEAL_BOSSES.filter(k => progress.bosses.has(k)).length; }
function sealsDone() { return sealsLit() === SEAL_BOSSES.length; }
function onSealBeat(kind) {   // called once when any boss is beaten
  const h = SEAL_HOURS[kind]; if (!h) return;
  const n = sealsLit(); SEAL_ANIM = { hour: h, t: 0 }; sfx('chime');
  tip('seal_' + kind, '時計塔の封印 ' + h + '時が解けた！（' + n + ' / ' + SEAL_BOSSES.length + '）' + (n === SEAL_BOSSES.length ? ' ……針が十二時で重なった' : ''), true);
  checkBossGates();
  if (n === SEAL_BOSSES.length && room.id === 'clockroom') setTimeout0(() => velAppear('twelve', pcx() < 192 ? 320 : 64, FLOOR_Y));
}
// the hand points at the highest lit hour run from 12 (lit count = how far it has moved); both hands at 12 when complete
function drawSealDial(cx, cy, r, opt = {}) {
  const n = sealsLit(), done = n === SEAL_BOSSES.length, anim = opt.anim;
  g.fillStyle = done ? 'rgba(255,236,170,0.95)' : 'rgba(26,20,44,0.92)'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.strokeStyle = done ? '#fff4c0' : '#c8a24a'; g.lineWidth = Math.max(1, r / 12); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
  for (let h = 1; h <= 12; h++) { const k = SEAL_BOSSES[h - 1], lit = progress.bosses.has(k) && !(anim && anim.hour === h && anim.t < 30), a = h / 12 * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(a) * r * 0.78, py = cy + Math.sin(a) * r * 0.78, pr = Math.max(1.5, r * 0.11) * (anim && anim.hour === h && anim.t >= 30 ? 1 + Math.max(0, 1 - (anim.t - 30) / 30) : 1);
    g.fillStyle = lit ? (done ? '#ff9a3a' : '#ffd84a') : '#3a3458'; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
    if (lit && r >= 24) { g.fillStyle = 'rgba(255,220,120,0.25)'; g.beginPath(); g.arc(px, py, pr * 2.2, 0, 7); g.fill(); } }
  // hands: hour hand = lit count, minute hand sweeps; when done both point straight up
  let step = n; if (anim && anim.t < 30) step = n - 1 + anim.t / 30;
  const ha = done ? -Math.PI / 2 : step / 12 * Math.PI * 2 - Math.PI / 2, ma = done ? -Math.PI / 2 : (frame * 0.02) % (Math.PI * 2) - Math.PI / 2;
  g.lineCap = 'round'; g.strokeStyle = done ? '#5a2a0a' : '#f0e0b0';
  g.lineWidth = Math.max(1.5, r / 9); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ha) * r * 0.5, cy + Math.sin(ha) * r * 0.5); g.stroke();
  g.lineWidth = Math.max(1, r / 16); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ma) * r * 0.72, cy + Math.sin(ma) * r * 0.72); g.stroke(); g.lineCap = 'butt';
  g.fillStyle = '#c8a24a'; g.beginPath(); g.arc(cx, cy, Math.max(1.5, r / 10), 0, 7); g.fill();
}
// the big seal on the heart door in the great clock chamber (drawn with the room background)
function drawDoorSeal() {
  if (room.id !== 'clockroom') return; const x = Math.round(23 * TS - 34 - cam.x), y = Math.round(9 * TS - cam.y);
  if (sealsDone()) { g.fillStyle = 'rgba(255,220,140,' + (0.18 + 0.08 * Math.sin(frame * 0.08)) + ')'; g.beginPath(); g.arc(x, y, 46, 0, 7); g.fill(); }
  drawSealDial(x, y, 34);
}
function updateSeals() { if (SEAL_ANIM && ++SEAL_ANIM.t > 200) SEAL_ANIM = null; }
function drawSealPopup() { if (!SEAL_ANIM) return; const a = Math.min(1, SEAL_ANIM.t / 12, (200 - SEAL_ANIM.t) / 20); g.globalAlpha = a; drawSealDial(VW / 2, 104, 24, { anim: SEAL_ANIM }); g.globalAlpha = 1; }
