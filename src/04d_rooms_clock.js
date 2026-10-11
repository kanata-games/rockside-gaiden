
// =====================================================================
//  AREA 4: 屋根裏と時計塔 (ATTIC & CLOCK TOWER) - above the dining hall (needs 二段ジャンプ)
//  Final boss: 大時計の番人 グランドファーザー・チクタク
// =====================================================================
ROOM_DEFS.push(
  { id: 'attic', jp: 'ほこりの屋根裏', en: 'DUSTY ATTIC', area: 'clock', theme: 'attic', tiles: 'w', cx: 6, cy: -1, cw: 3, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('B', 1, 18, 21); R.open('T', 2, 8, 11); R.secret(0, 11, 14); R.plat(8, 14, 11); R.plat(18, 24, 7); R.plat(30, 36, 11);
      R.plat(46, 51, 11); R.plat(53, 62, 8); R.plat(65, 70, 11); },
    ents: [['save', 32, 15], ['cursedbook', 12, 6], ['cursedbook', 40, 6], ['cursedbook', 60, 5], ['bats', 22, 3], ['rat', 26, 15], ['rat', 56, 15], ['puppet', 66, 15],
      ['chair', 6, 15], ['chair', 36, 15], ['book', 10, 11], ['book', 20, 7], ['book', 49, 11], ['bottle', 28, 15], ['gear', 58, 8], ['plate', 33, 11],
      ['curtain', 2.5, 15, { secret: 1, sprite: 'ivy' }], ['dust', 16, 15, { drop: ['coin', 'coin'] }], ['dust', 50, 15, { drop: ['heart'] }], ['dust', 68, 15, { drop: ['coin', 'coin', 'coin'] }]],
    decor: [['crate', 8, 15], ['crate', 9.5, 13.5], ['trunk', 22, 15], ['dollshelf', 38, 15], ['crate', 62, 15], ['trunk', 70, 15], ['round_window', 14, 6],
      ['round_window', 40, 6], ['round_window', 66, 5], ['sconce', 28, 9, { light: 1 }], ['sconce', 52, 9, { light: 1 }], ['candelabra', 32, 11, { light: 1 }],
      ['cobweb', 1, 2, { top: 1 }], ['cobweb', 70.75, 2, { top: 1, flip: 1 }], ['cobweb', 35, 2, { top: 1 }]] },

  { id: 'dollroom', jp: '人形の隠し部屋', en: 'HIDDEN DOLL ROOM', area: 'clock', theme: 'attic', tiles: 'w', cx: 5, cy: -1, cw: 1, ch: 1, dark: 0.4, secret: true,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.plat(3, 8, 11); },
    ents: [['heartbig', 5.5, 9], ['puppet', 14, 15], ['puppet', 18, 15], ['coin', 10, 15], ['coin', 12, 15], ['coin', 4, 11], ['coin', 7, 11], ['book', 20, 15], ['chair', 9, 15]],
    decor: [['dollshelf', 12, 15], ['dollshelf', 20, 15], ['round_window', 12, 7], ['candelabra', 5, 11, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'gearshaft', jp: '歯車の縦穴', en: 'GEAR SHAFT', area: 'clock', theme: 'gears', tiles: 'w', cx: 8, cy: -3, cw: 1, ch: 2, dark: 0.5,
    build(R) { R.box(); R.open('B', 0, 8, 11); R.open('L', 0, 11, 14); R.solid(1, 15, 6, 16); R.plat(13, 20, 27); R.plat(3, 10, 21); },
    ents: [['gargoyle', 18, 14], ['bats', 10, 26], ['cursedbook', 16, 20], ['gear', 15, 27], ['gear', 18, 27], ['gear', 6, 21], ['chair', 4, 33], ['bottle', 20, 33]],
    decor: [['gear_big', 12, 32], ['gear_med', 5, 28], ['gear_big', 17, 20], ['gear_med', 8, 13], ['gear_big', 14, 8], ['sconce', 3, 30, { light: 1 }], ['sconce', 20, 24, { light: 1 }],
      ['sconce', 11, 16, { light: 1 }], ['sconce', 20, 7, { light: 1 }]] },

  { id: 'pendulum', jp: '振り子の回廊', en: 'PENDULUM HALL', area: 'clock', theme: 'tower', tiles: 'w', cx: 6, cy: -3, cw: 2, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.open('B', 0, 4, 7); R.open('T', 0, 16, 19); R.gate(16, 0, 19, 1, 'belfry'); R.plat(26, 32, 11); R.plat(15, 22, 7);
      R.plat(36, 42, 11); },
    ents: [['puppet', 30, 15], ['skeleton', 40, 15], ['cursedbook', 20, 4], ['puff', 10, 8], ['gear', 28, 11], ['gear', 38, 11], ['chair', 34, 15], ['book', 12, 15], ['bottle', 44, 15],
      ['hint', 18, 7, { text: '上の扉に鉄格子… どこかに仕掛けがあるはず' }]],
    decor: [['clockface', 10, 9], ['clockface', 36, 8], ['gear_med', 24, 6], ['gear_big', 46, 14], ['sconce', 6, 9, { light: 1 }], ['sconce', 24, 10, { light: 1 }],
      ['sconce', 43, 9, { light: 1 }], ['clock', 2, 15], ['clock', 45, 15]] },

  { id: 'clockback', jp: '文字盤の裏側', en: 'BEHIND THE CLOCKFACE', area: 'clock', theme: 'gears', tiles: 'w', cx: 6, cy: -2, cw: 2, ch: 1, dark: 0.52,
    build(R) { R.box(); R.open('T', 0, 4, 7); R.plat(10, 16, 11); R.plat(2, 9, 7); R.plat(22, 28, 11); R.plat(32, 38, 8); },
    ents: [['lever', 42, 15, { room: 'pendulum', gate: 'belfry' }], ['gargoyle', 34, 4], ['bats', 26, 4], ['rat', 20, 15], ['rat', 38, 15], ['cursedbook', 14, 5],
      ['gear', 24, 11], ['gear', 26, 11], ['gear', 35, 8], ['pot', 44, 15], ['chair', 30, 15], ['bottle', 8, 15]],
    decor: [['gear_big', 8, 15], ['gear_big', 30, 13], ['gear_med', 18, 7], ['gear_med', 40, 9], ['clockface', 24, 6], ['sconce', 14, 9, { light: 1 }], ['sconce', 36, 12, { light: 1 }],
      ['sconce', 46, 9, { light: 1 }]] },

  { id: 'belfry', jp: '鐘楼の踊り場', en: 'BELFRY LANDING', area: 'clock', theme: 'tower', tiles: 'w', cx: 6, cy: -4, cw: 1, ch: 1, dark: 0.42,
    build(R) { R.box(); R.open('B', 0, 16, 19); R.open('R', 0, 11, 14); R.plat(3, 9, 11); },
    ents: [['save', 6, 15], ['gear', 10, 15], ['chair', 4, 11], ['bottle', 12, 15], ['book', 8, 11],
      ['hint', 11, 15, { text: 'チクタク…チクタク… この先から大きな時計の音がする' }]],
    decor: [['bell', 12, 2, { top: 1 }], ['round_window', 6, 7], ['round_window', 19, 7], ['sconce', 12, 10, { light: 1 }], ['gear_med', 20, 15]] },

  { id: 'clockroom', jp: '大時計の間', en: 'GREAT CLOCK CHAMBER', area: 'clock', theme: 'tower', tiles: 'w', cx: 7, cy: -4, cw: 1, ch: 1, dark: 0.36, boss: 'clock',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 12, 15]],
    decor: [['round_window', 4, 6], ['round_window', 20, 6], ['sconce', 3, 9, { light: 1 }], ['sconce', 21, 9, { light: 1 }], ['gear_med', 12, 4]] },
);
