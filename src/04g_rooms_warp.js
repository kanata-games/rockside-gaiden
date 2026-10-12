
// =====================================================================
//  v0.3 WARP ROOMS (ワープの間): one small room per area with a warp circle (see 07c_warp.js).
// =====================================================================
const warpRoom = (id, area, theme, tiles, cx, cy, side, decor, extra) => ({ id, jp: 'ワープの間', en: 'WARP ROOM', area, theme, tiles, cx, cy, cw: 1, ch: 1, dark: 0.5, warp: true,
  build(R) { R.box(); R.open(side, 0, 11, 14); R.plat(side === 'L' ? 15 : 3, side === 'L' ? 20 : 8, 11); if (extra) extra(R); },
  ents: [['warp', 12, 15], ['coin', side === 'L' ? 17 : 5, 11], ['coin', side === 'L' ? 18 : 6, 11]],
  decor: [['spiritlamp', 6, 15, { light: 1 }], ['spiritlamp', 18, 15, { light: 1 }], ['cobweb', 1, 2, { top: 1 }], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]].concat(decor || []) });
ROOM_DEFS.push(
  warpRoom('warp_east', 'east', 'cellar', 'c', 4, 2, 'R', [['winerack', 4, 15]], R => { R.open('L', 0, 11, 14); R.gate(0, 11, 0, 14, 'spirit_wine'); }),   // v0.5: way down to the vintage vaults
  warpRoom('warp_laundry', 'laundry', 'boiler', 't', 3, 4, 'R', [['pipes', 4, 15]]),
  warpRoom('warp_garden', 'garden', 'courtyard', 'g', -7, 1, 'R', [['fern', 4, 15]]),
  warpRoom('warp_clock', 'clock', 'gears', 'w', 5, -2, 'R', [['gear_med', 4, 12]]),
  warpRoom('warp_crypt', 'crypt', 'crypt', 'k', 13, 1, 'L', [['urn', 20, 15]]),
  warpRoom('warp_bath', 'bath', 'bath', 'b', 11, 3, 'R', [['duckprop', 4, 15]]),
  warpRoom('warp_theater', 'theater', 'theater', 'w', 1, 0, 'R', [['masks', 4, 9]]),
  warpRoom('warp_stars', 'stars', 'observatory', 'k', 12, -2, 'L', [['starchart', 20, 8]]),
  warpRoom('warp_wine', 'wine', 'casks', 'r', 0, 2, 'R', [['cask_big', 5, 15]]),            // v0.5
  warpRoom('warp_servants', 'servants', 'servants', 'v', -7, 4, 'R', [['broom', 4, 15]]),   // v0.5.1
  warpRoom('warp_lake', 'lake', 'lake', 'l', -7, 6, 'R', [['glowmoss', 4, 15]]),
  warpRoom('warp_spires', 'spires', 'roof', 'x', 11, -6, 'L', [['chimney', 20, 15]]),   // v0.6
  warpRoom('warp_armory', 'armory', 'armory', 'a', 17, -1, 'L', [['weaponrack', 19, 15]]),
);
