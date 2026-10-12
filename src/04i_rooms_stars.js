
// =====================================================================
//  AREA 8 (v0.4): 星見の天文台 (STARGAZING OBSERVATORY) - beside the clock tower. Way in: the spirit barrier on the
//  right of the gear shaft (needs 霊体化). Boss: 星喰いの天球儀 アストラ (holds one seal of the clock heart).
// =====================================================================
ROOM_DEFS.push(
  { id: 'starhall', jp: '星図の回廊', en: 'HALL OF STAR CHARTS', area: 'stars', theme: 'observatory', tiles: 'k', cx: 9, cy: -3, cw: 2, ch: 1, dark: 0.5,
    vel: 'stars', velAt: [40, 15],
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('B', 1, 8, 11); R.plat(6, 11, 11); R.plat(14, 19, 8); R.plat(22, 27, 11); R.plat(38, 43, 10); },
    ents: [['skullwisp', 16, 5, { foe: { skin: 'starwisp' } }], ['cursedbook', 26, 6, { foe: { skin: 'chart' } }], ['cursedbook', 40, 6, { foe: { skin: 'chart' } }],
      ['book', 8, 11], ['book', 24, 11], ['plate', 40, 10], ['coin', 15, 8], ['coin', 17, 8], ['dust', 20, 15, { drop: ['coin', 'coin'] }], ['bottle', 44, 15], ['chair', 4, 15]],
    decor: [['starchart', 10, 8], ['starchart', 26, 8], ['starchart', 41, 7], ['bookshelf', 3, 15], ['bookshelf', 30, 15], ['armillary', 18, 15], ['round_window', 36, 6],
      ['sconce', 12, 9, { light: 1 }], ['sconce', 34, 9, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'planetarium', jp: 'プラネタリウム', en: 'PLANETARIUM', area: 'stars', theme: 'stars', tiles: 'k', cx: 9, cy: -2, cw: 2, ch: 1, dark: 0.6,
    build(R) { R.box(); R.open('T', 1, 8, 11); R.open('R', 0, 11, 14); R.plat(26, 30, 12); R.plat(31, 36, 7); R.plat(6, 12, 11); R.plat(14, 19, 7); R.plat(40, 45, 11); },
    ents: [['save', 22, 15], ['heartbig', 16.5, 5], ['skullwisp', 10, 6, { foe: { skin: 'starwisp' } }], ['skullwisp', 42, 6, { foe: { skin: 'starwisp' } }], ['cursedbook', 30, 5, { foe: { skin: 'chart' } }],
      ['coin', 7, 11], ['coin', 9, 11], ['coin', 11, 11], ['gear', 42, 11], ['book', 28, 12], ['vase', 4, 15, { drop: ['coin', 'heart'] }], ['crystal', 46, 15]],
    decor: [['armillary', 22, 12], ['telescope', 36, 15], ['starchart', 8, 8], ['starchart', 44, 8], ['spiritlamp', 14, 15, { light: 1 }], ['spiritlamp', 32, 15, { light: 1 }]] },

  { id: 'telescope', jp: '望遠鏡の塔', en: 'TELESCOPE SHAFT', area: 'stars', theme: 'observatory', tiles: 'k', cx: 11, cy: -3, cw: 1, ch: 2, dark: 0.55,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('L', 1, 11, 14); R.open('R', 1, 11, 14); R.solid(1, 15, 4, 16); R.solid(19, 15, 22, 16);
      R.plat(9, 14, 29); R.plat(3, 8, 25); R.plat(15, 20, 21); R.plat(6, 17, 18); },
    ents: [['skullwisp', 12, 10, { foe: { skin: 'starwisp' } }], ['cursedbook', 6, 22, { foe: { skin: 'chart' } }], ['skullwisp', 16, 26, { foe: { skin: 'starwisp' } }],
      ['gear', 10, 29], ['book', 5, 25], ['coin', 16, 21], ['coin', 18, 21], ['bottle', 20, 33]],
    decor: [['telescope', 12, 15], ['starchart', 12, 26], ['sconce', 3, 21, { light: 1 }], ['sconce', 20, 28, { light: 1 }], ['sconce', 12, 5, { light: 1 }], ['gear_med', 4, 31]] },

  { id: 'dome', jp: '天文台のドーム', en: 'OBSERVATORY DOME', area: 'stars', theme: 'stars', tiles: 'k', cx: 12, cy: -3, cw: 1, ch: 1, dark: 0.4, boss: 'orrery',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 12, 15]],
    decor: [['telescope', 3, 15], ['telescope', 21, 15, { flip: 1 }], ['spiritlamp', 8, 15, { light: 1 }], ['spiritlamp', 16, 15, { light: 1 }]] },

  // ---- v0.6: two more rooms east of the dome
  { id: 'comethall', jp: '彗星の回廊', en: 'COMET GALLERY', area: 'stars', theme: 'observatory', tiles: 'k', cx: 13, cy: -2, cw: 2, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('T', 0, 9, 12); R.plat(8, 13, 7); R.plat(16, 22, 11); R.plat(26, 32, 8); R.plat(36, 42, 11); },
    ents: [['skullwisp', 20, 6, { foe: { skin: 'starwisp' } }], ['cursedbook', 34, 5, { foe: { skin: 'chart' } }], ['coin', 27, 8], ['coin', 29, 8], ['coin', 31, 8], ['heart', 40, 11],
      ['hint', 24, 15, { text: '天井の穴から、星がこぼれてくる… 上にもう一部屋ありそう' }]],
    decor: [['starchart', 22, 6], ['starchart', 40, 6]] },
  { id: 'starwell', jp: '星の井戸', en: 'STAR WELL', area: 'stars', theme: 'stars', tiles: 'k', cx: 13, cy: -4, cw: 1, ch: 2, dark: 0.6,
    build(R) { R.box(); R.open('B', 0, 9, 12); R.plat(13, 18, 30); R.plat(4, 9, 26); R.plat(13, 18, 22); R.plat(4, 9, 18); R.plat(13, 18, 14); R.plat(4, 9, 10); R.plat(13, 18, 6); },
    ents: [['heartbig', 15.5, 4], ['skullwisp', 8, 20, { foe: { skin: 'starwisp' } }], ['skullwisp', 16, 10, { foe: { skin: 'starwisp' } }], ['coin', 5, 26], ['coin', 7, 26], ['coin', 5, 18], ['coin', 7, 18], ['gear', 6, 10]],
    decor: [['starchart', 10, 14]] },
);
