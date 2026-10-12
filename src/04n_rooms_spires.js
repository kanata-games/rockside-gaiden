// =====================================================================
//  AREA 13 (v0.6): 尖塔の屋根 (ROOFTOP SPIRES) - out on the roofs above the clock tower, under the dream's moon.
//  Way in: a hatch in the belfry landing ceiling. The roofs themselves are open, but the needle spire to the
//  weathercock can only be climbed by wall-jumping (グリム吸着 from the knight captain).
//  Boss: 風見鶏 ゲイルコック (a big heart + its seal).
// =====================================================================
Object.assign(AREAS, { spires: { jp: '尖塔の屋根', short: '屋根', en: 'ROOFTOP SPIRES', music: 'spires', col: '#5a6a9a' } });
ROOM_DEFS.push(
  { id: 'spirebase', jp: '屋根裏の抜け穴', en: 'ROOF HATCH', area: 'spires', theme: 'spire', tiles: 'x', cx: 6, cy: -6, cw: 1, ch: 2, dark: 0.45,
    build(R) { R.box(); R.open('B', 0, 9, 12); R.open('R', 1, 11, 14); R.open('R', 0, 11, 14); R.plat(19, 22, 15); R.solid(1, 15, 3, 16); },
    ents: [['coin', 20, 15], ['coin', 21, 15], ['bats', 12, 22, { foe: { skin: 'crow' }, n: 2 }],
      ['hint', 15, 33, { have: 'cling', text: 'つるつるの壁… グリム吸着で張りついて、壁けりで登れそう' }], ['hint', 15, 33, { need: 'cling', text: '上は高すぎる… 外の屋根づたいに行ってみよう' }]],
    decor: [['ridge', 4, 33], ['vane_small', 19, 33], ['moon', 8, 8], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]] },

  { id: 'roofwalk', jp: '月夜の屋根', en: 'MOONLIT ROOFTOP', area: 'spires', theme: 'roof', tiles: 'x', cx: 7, cy: -5, cw: 3, ch: 1, dark: 0.35,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(5, 10, 11); R.plat(14, 19, 7); R.plat(24, 30, 11); R.plat(35, 40, 8); R.plat(46, 52, 11); R.plat(57, 62, 7); R.solid(42, 13, 44, 14); },
    ents: [['save', 32, 15], ['bats', 18, 4, { foe: { skin: 'crow' }, n: 2 }], ['bats', 56, 4, { foe: { skin: 'crow' }, n: 2 }], ['gargoyle', 38, 4, { foe: { skin: 'vanegarg' } }],
      ['coin', 15, 7], ['coin', 17, 7], ['coin', 58, 7], ['coin', 60, 7], ['bottle', 26, 11], ['gear', 48, 11], ['dust', 10, 15, { drop: ['coin', 'coin'] }], ['dust', 66, 15, { drop: ['heart'] }],
      ['hint', 28, 15, { text: '屋根の上に月… でも、これも主の夢の月。グリムがじっと見上げている' }]],
    decor: [['moon', 34, 7], ['chimney', 8, 15], ['chimney', 52, 15], ['vane_small', 22, 15], ['vane_small', 64, 15], ['ridge', 40, 15], ['ridge', 16, 15]] },

  { id: 'chimneys', jp: '煙突の林', en: 'CHIMNEY THICKET', area: 'spires', theme: 'roof', tiles: 'x', cx: 10, cy: -6, cw: 1, ch: 2, dark: 0.4,
    build(R) { R.box(); R.open('L', 1, 11, 14); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14);
      R.plat(3, 8, 29); R.plat(12, 17, 25); R.plat(4, 9, 21); R.plat(12, 17, 17); R.plat(1, 4, 15); R.plat(19, 22, 15); R.plat(8, 13, 9); },
    ents: [['bats', 12, 6, { foe: { skin: 'crow' }, n: 2 }], ['gargoyle', 6, 18, { foe: { skin: 'vanegarg' } }], ['coin', 9, 9], ['coin', 11, 9], ['coin', 14, 25], ['coin', 16, 25], ['gear', 5, 29]],
    decor: [['chimney', 20, 33], ['chimney', 4, 33], ['moon', 16, 6], ['ridge', 12, 33]] },

  { id: 'gargledge', jp: 'ガーゴイルの軒', en: 'GARGOYLE EAVES', area: 'spires', theme: 'spire', tiles: 'x', cx: 7, cy: -6, cw: 3, ch: 1, dark: 0.45,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('T', 1, 9, 12); R.plat(4, 9, 11); R.plat(14, 19, 8); R.plat(31, 38, 11); R.plat(44, 49, 8); R.plat(56, 62, 11); },
    ents: [['gargoyle', 20, 4, { foe: { skin: 'vanegarg' } }], ['gargoyle', 52, 4, { foe: { skin: 'vanegarg' } }], ['bats', 40, 4, { foe: { skin: 'crow' }, n: 2 }],
      ['coin', 15, 8], ['coin', 17, 8], ['coin', 45, 8], ['coin', 47, 8], ['plate', 6, 11], ['dust', 26, 15, { drop: ['coin', 'heart'] }],
      ['hint', 34, 15, { text: '真上に細い尖塔… てっぺんで、風見鶏がこっちを見ている' }]],
    decor: [['vane_small', 10, 15], ['vane_small', 60, 15], ['ridge', 24, 15], ['ridge', 48, 15], ['moon', 40, 7]] },

  { id: 'needle', jp: '針の尖塔', en: 'THE NEEDLE SPIRE', area: 'spires', theme: 'spire', tiles: 'x', cx: 8, cy: -8, cw: 1, ch: 2, dark: 0.5,
    build(R) { R.box(); R.open('B', 0, 9, 12); R.open('R', 0, 11, 14); R.solid(1, 2, 6, 32); R.solid(17, 15, 22, 32); R.plat(7, 9, 9); },
    ents: [['heartbig', 8, 7], ['bats', 12, 20, { foe: { skin: 'crow' }, n: 2 }], ['coin', 19, 14], ['coin', 21, 14]],
    decor: [['vane_small', 20, 15], ['cobweb', 7, 2, { top: 1 }]] },

  { id: 'weathertop', jp: '風見鶏の止まり木', en: 'THE WEATHERCOCK PERCH', area: 'spires', theme: 'roof', tiles: 'x', cx: 9, cy: -8, cw: 1, ch: 1, dark: 0.3, boss: 'galecock',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 14, 15]],
    decor: [['moon', 6, 6], ['ridge', 4, 15], ['ridge', 18, 15]] },
);
