
// =====================================================================
//  v0.3 WARP ROOMS (ワープの間): one small room per area with a warp circle (see 07c_warp.js).
// =====================================================================
const warpRoom = (id, area, theme, tiles, cx, cy, side, decor) => ({ id, jp: 'ワープの間', en: 'WARP ROOM', area, theme, tiles, cx, cy, cw: 1, ch: 1, dark: 0.5, warp: true,
  build(R) { R.box(); R.open(side, 0, 11, 14); R.plat(side === 'L' ? 15 : 3, side === 'L' ? 20 : 8, 11); },
  ents: [['warp', 12, 15], ['coin', side === 'L' ? 17 : 5, 11], ['coin', side === 'L' ? 18 : 6, 11]],
  decor: [['spiritlamp', 6, 15, { light: 1 }], ['spiritlamp', 18, 15, { light: 1 }], ['cobweb', 1, 2, { top: 1 }], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]].concat(decor || []) });
ROOM_DEFS.push(
  warpRoom('warp_east', 'east', 'cellar', 'c', 4, 2, 'R', [['winerack', 4, 15]]),
  warpRoom('warp_laundry', 'laundry', 'boiler', 't', 3, 4, 'R', [['pipes', 4, 15]]),
  warpRoom('warp_garden', 'garden', 'courtyard', 'g', -7, 1, 'R', [['fern', 4, 15]]),
  warpRoom('warp_clock', 'clock', 'gears', 'w', 5, -2, 'R', [['gear_med', 4, 12]]),
  warpRoom('warp_crypt', 'crypt', 'crypt', 'k', 13, 1, 'L', [['urn', 20, 15]]),
  warpRoom('warp_bath', 'bath', 'bath', 'b', 11, 3, 'R', [['duckprop', 4, 15]]),
);
