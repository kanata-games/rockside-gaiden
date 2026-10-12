
// =====================================================================
//  v0.7 COIN SHOP: おばけ猫の行商人 ミャオ (an original ghost-cat peddler, not one of the 13) sets up shop in the
//  attic room above the grand foyer. Step up to her counter to open the shop.
//    < > choose, JUMP buy (or change clothes), VAC/MAP leave; tap a row to choose, tap it again to buy.
//  Prices are set so a full exploration (~600 coins incl. one pass of foes) buys everything; a main-path run ~half.
// =====================================================================
const SHOP = {
  heart:  { jp: 'ハートのかけら', desc: '最大HP +1ハート（在庫 3）', prices: [40, 60, 80] },
  tank:   { jp: 'グリムの増設タンク', desc: 'ためておける物 +1', prices: [120] },
  gabu:   { jp: 'がぶがぶ砥石', desc: 'GABU ゲージが 2 匹で満タンに', prices: [90] },
  tea:    { jp: 'ハーブティー', desc: 'マップ画面で飲むと HP 全回復（3 個まで）', price: 15, max: 3 },
  map:    { jp: 'エリアの地図', desc: 'まだ見ていない部屋も地図にのる', price: 8 },
  pal_midnight: { jp: '着せかえ：ミッドナイト', desc: '夜色のメイド服', price: 30, pal: 'midnight' },
  pal_sakura:   { jp: '着せかえ：さくら', desc: '桜色のメイド服', price: 30, pal: 'sakura' },
  pal_mint:     { jp: '着せかえ：ミント', desc: 'ミント色のメイド服', price: 30, pal: 'mint' },
};
const PALETTES = { midnight: { to: 238, sat: 0.55, lit: 0.72 }, sakura: { to: 338, sat: 0.9, lit: 1.08 }, mint: { to: 158, sat: 0.7, lit: 1.05 } };   // target hue for every coloured (non-skin) pixel
function shopState() { return progress.shop || (progress.shop = { heart: 0, tank: 0, gabu: 0, tea: 0, maps: [], pals: [], pal: '' }); }
function nextMapArea() { const S = shopState(); return Object.keys(AREAS).find(a => !S.maps.includes(a)); }
function shopItems() {
  const S = shopState(), list = [];
  list.push({ id: 'heart', price: S.heart < 3 ? SHOP.heart.prices[S.heart] : 0, sold: S.heart >= 3 });
  list.push({ id: 'tank', price: 120, sold: S.tank >= 1 });
  list.push({ id: 'gabu', price: 90, sold: S.gabu >= 1 });
  list.push({ id: 'tea', price: 15, sold: false, full: S.tea >= SHOP.tea.max });
  const na = nextMapArea(); list.push({ id: 'map', price: 8, sold: !na, area: na });
  for (const k of ['pal_midnight', 'pal_sakura', 'pal_mint']) { const p = SHOP[k].pal; list.push({ id: k, price: S.pals.includes(p) ? 0 : 30, owned: S.pals.includes(p), worn: S.pal === p }); }
  return list;
}
function shopBuy(it) {
  const S = shopState();
  if (it.owned) { setPalette(it.worn ? '' : SHOP[it.id].pal); sfx('cursor'); shopSay(it.worn ? 'いつもの服がいちばん、かにゃ？' : 'よく似合うにゃ！'); return true; }
  if (it.sold) { sfx('hurt'); shopSay('それはもう売り切れにゃ'); return false; }
  if (it.full) { sfx('hurt'); shopSay('そんなに持てないにゃ。マップ画面で飲んでからにゃ'); return false; }
  if (progress.coins < it.price) { sfx('hurt'); shopSay('コインが足りないにゃ… お屋敷をもっと掃除してくるにゃ'); return false; }
  progress.coins -= it.price; sfx('secret'); stats.shopBuys = (stats.shopBuys || 0) + 1;
  if (it.id === 'heart') { S.heart++; progress.maxHP += 2; P.hp = progress.maxHP; shopSay('ハートがひとつ増えたにゃ'); }
  else if (it.id === 'tank') { S.tank = 1; syncAbilities(); shopSay('グリムのおなかが広くなったにゃ'); }
  else if (it.id === 'gabu') { S.gabu = 1; syncAbilities(); shopSay('グリムの歯がぎらぎらにゃ'); }
  else if (it.id === 'tea') { S.tea++; shopSay('マップ画面で飲むにゃ。あったまるにゃ'); }
  else if (it.id === 'map') { S.maps.push(it.area); shopSay(AREAS[it.area].jp + ' の地図にゃ'); }
  else if (SHOP[it.id].pal) { S.pals.push(SHOP[it.id].pal); setPalette(SHOP[it.id].pal); shopSay('よく似合うにゃ！ もう一回えらぶと元の服にもどるにゃ'); }
  saveGame(progress.saveRoom);   // purchases are kept right away (the save point stays where it was)
  return true;
}
// ---- palettes: hue-shifted copies of the kanata sheet (skin, white and dark outlines are left alone)
const PAL_CACHE = {};
function setPalette(p) { shopState().pal = p || ''; FLIP_CACHE.clear(); }
function kanataSheet() {
  const p = progress.shop && progress.shop.pal; if (!p || !PALETTES[p] || !IMG.kanata.width) return IMG.kanata;
  if (PAL_CACHE[p]) return PAL_CACHE[p];
  const src = IMG.kanata, c = mkCanvas(src.width, src.height), cg = c.getContext('2d'); cg.drawImage(src, 0, 0);
  const d = cg.getImageData(0, 0, c.width, c.height), a = d.data, P0 = PALETTES[p];
  for (let i = 0; i < a.length; i += 4) { if (a[i + 3] === 0) continue;
    const r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn; if (dd < 0.12) continue;
    let h = mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h *= 60; if (h < 0) h += 360;
    if (h < 50 && l > 0.45) continue;   // skin / blush stay
    const s = Math.min(1, dd / (1 - Math.abs(2 * l - 1)) * P0.sat), L = Math.min(1, l * P0.lit), H = (P0.to + (h - 220) * 0.15 + 360) % 360;   // keep a hint of the original hue spread
    const C = (1 - Math.abs(2 * L - 1)) * s, X = C * (1 - Math.abs((H / 60) % 2 - 1)), m = L - C / 2; let rr, g2, bb;
    [rr, g2, bb] = H < 60 ? [C, X, 0] : H < 120 ? [X, C, 0] : H < 180 ? [0, C, X] : H < 240 ? [0, X, C] : H < 300 ? [X, 0, C] : [C, 0, X];
    a[i] = (rr + m) * 255; a[i + 1] = (g2 + m) * 255; a[i + 2] = (bb + m) * 255; }
  cg.putImageData(d, 0, 0); return (PAL_CACHE[p] = c);
}
// ---- shopkeeper entity + menu
function makeShopkeeper(x, y) { return { type: 'shopkeeper', x, y, w: 40, h: 40, armed: true, t: 0 }; }
function updateShopkeeper(e) {
  e.t++; const near = !P.dead && P.onGround && Math.abs(pcx() - e.x) < 30 && Math.abs(P.y + P.h - e.y) < 8;
  if (!near) { if (Math.abs(pcx() - e.x) > 56) e.armed = true; return; }
  if (e.armed && !P.tug) { e.armed = false; openShop(); }
}
const shopMenu = { sel: 0, line: '', lineT: 0 };
function shopSay(t) { shopMenu.line = t; shopMenu.lineT = 200; }
function openShop() { P.vx = 0; Snd.vac(false); setState('shop'); sfx('cursor'); shopSay(progress.perm.has('shop:met') ? 'いらっしゃいにゃ。また来てくれたにゃ' : 'にゃ。幽霊相手の行商人、ミャオにゃ。コインがあるなら、いいもの売るにゃ'); progress.perm.add('shop:met'); }
function updateShop() {
  const L = shopItems(), n = L.length; if (shopMenu.lineT > 0) shopMenu.lineT--;
  if (inp.leftPressed) { shopMenu.sel = (shopMenu.sel + n - 1) % n; sfx('cursor'); }
  if (inp.rightPressed || inp.dropPressed) { shopMenu.sel = (shopMenu.sel + 1) % n; sfx('cursor'); }
  if (stateT > 8 && (inp.jumpPressed || inp.startPressed)) shopBuy(L[shopMenu.sel]);
  if (stateT > 4 && (inp.vacPressed || inp.mapPressed)) { setState('play'); sfx('cursor'); }
}
const SHOP_ROW = i => ({ x: 20, y: 58 + i * 20, w: VW - 40, h: 18 });
function shopTap(gx, gy) {
  const L = shopItems(); for (let i = 0; i < L.length; i++) { const r = SHOP_ROW(i); if (gx >= r.x && gx < r.x + r.w && gy >= r.y && gy < r.y + r.h) { if (shopMenu.sel === i) inp.jumpPressed = true; else { shopMenu.sel = i; sfx('cursor'); } return true; } }
  if (gy > 236) { inp.vacPressed = true; return true; } return false;
}
function renderShop() {
  renderPlayBase(); g.fillStyle = 'rgba(10,6,22,0.9)'; g.fillRect(0, 0, VW, VH);
  const L = shopItems(); spr('props', (frame >> 4) & 1 ? 'shopcat1' : 'shopcat0', 14, 4);
  L.forEach((it, i) => { const r = SHOP_ROW(i), on = i === shopMenu.sel; g.fillStyle = on ? 'rgba(110,80,200,0.9)' : 'rgba(24,18,48,0.9)'; g.fillRect(r.x, r.y, r.w, r.h); rectLine(r.x, r.y, r.w, r.h, on ? '#e8dcff' : '#5a4a90');
    const tag = it.owned ? (it.worn ? 'WEAR' : 'OWN') : it.sold ? 'SOLD' : String(it.price); drawText(tag, r.x + r.w - 6, r.y + 6, it.sold ? 'b' : it.owned ? 'c' : progress.coins >= it.price ? 'y' : 'r', 1, 'r'); });
  drawText('COIN ' + progress.coins, VW - 16, 40, 'y', 1, 'r'); drawText('TEA ' + shopState().tea + '/3', VW - 16, 28, 'c', 1, 'r');
  drawText('< >: SELECT   JUMP: BUY   VAC: LEAVE', VW / 2, VH - 12, 'b', 1, 'c');
  if (shopState().pal || L[shopMenu.sel].id.startsWith('pal_')) { const sel = L[shopMenu.sel], keep = shopState().pal; if (sel.id.startsWith('pal_')) shopState().pal = SHOP[sel.id].pal;   // preview the palette
    drawHero(0, VW - 40, 250, true); shopState().pal = keep; }
  blit();
  drawHiText('おばけ猫の行商人 ミャオ', 58, 10, 10, '#ffe0a0', '#1a0e28', 'left');
  drawHiText(shopMenu.line, 58, 28, 7, '#fff4e0', null, 'left');
  L.forEach((it, i) => { const r = SHOP_ROW(i), S = SHOP[it.id]; drawHiText(S.jp + (it.id === 'map' && it.area ? '（' + AREAS[it.area].short + '）' : ''), r.x + 6, r.y + 4, 7.5, '#ffffff', null, 'left');
    if (i === shopMenu.sel) drawHiText(S.desc, VW / 2, 222, 7.5, '#c8c0f0', '#1a0e28'); });
}
// ---- the herbal tea, drunk from the map screen
const MAP_TEA_BTN = { x: VW / 2 + 4, y: VH - 30, w: 140, h: 16 };
function drinkTea() { const S = shopState(); if (S.tea <= 0 || P.dead) { sfx('hurt'); return false; } if (P.hp >= progress.maxHP) { tip('teaFull', 'HP はもう満タン。ハーブティーはとっておこう', true); sfx('cursor'); return false; }
  S.tea--; P.hp = progress.maxHP; sfx('secret'); tip('teaDrink', 'ハーブティーを飲んだ。ほっ… HP が全回復した（のこり ' + S.tea + ' 個）', true); saveGame(progress.saveRoom); return true; }
