
// =====================================================================
//  AREA 3: 月下の温室庭園 (MOONLIT GREENHOUSE) - west of the foyer, behind the wardrobe (needs ターボ吸引)
//  Vines block some paths: burn them with a candle / fire / seed (SPIT). Holds 二段ジャンプ, boss: マダム・ローズ.
// =====================================================================
ROOM_DEFS.push(
  { id: 'conserv', jp: '温室の入口', en: 'CONSERVATORY', area: 'garden', theme: 'garden', tiles: 'g', cx: -2, cy: 1, cw: 2, ch: 1, dark: 0.4,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.open('L', 0, 11, 14); R.plat(8, 14, 11); R.plat(18, 24, 7); R.plat(28, 34, 11); R.plat(38, 43, 7); },
    ents: [['rat', 12, 15], ['puff', 30, 8], ['flowerpot', 5, 15], ['flowerpot', 10, 11], ['flowerpot', 30, 11], ['flowerpot', 44, 15],
      ['candle', 20, 7], ['seed', 40, 7], ['bottle', 26, 15], ['dust', 16, 15, { drop: ['coin', 'coin'] }], ['curtain', 2.5, 15, { sprite: 'ivy', drop: ['coin', 'coin', 'coin'] }]],
    decor: [['glasspane', 6, 10], ['glasspane', 18, 10], ['glasspane', 30, 10], ['glasspane', 42, 10], ['fern', 8, 15], ['fern', 33, 15], ['rosebush', 21, 15],
      ['rosebush', 40, 15], ['vine_hang', 13, 2, { top: 1 }], ['vine_hang', 27, 2, { top: 1 }], ['gardenlamp', 4, 15, { light: 1 }], ['gardenlamp', 24, 15, { light: 1 }], ['gardenlamp', 46, 15, { light: 1 }]] },

  { id: 'greenhouse', jp: '薔薇の大温室', en: 'ROSE GREENHOUSE', area: 'garden', theme: 'garden', tiles: 'g', cx: -4, cy: 0, cw: 2, ch: 2, dark: 0.45,
    build(R) { R.box(); R.open('R', 1, 11, 14); R.open('L', 1, 11, 14); R.open('L', 0, 11, 14); R.gate(0, 11, 1, 14, 'vine1'); R.open('T', 1, 8, 11);
      R.solid(1, 15, 5, 16); R.plat(30, 37, 29); R.plat(19, 26, 25); R.plat(8, 15, 21); R.plat(7, 12, 18); R.plat(30, 37, 21); R.plat(38, 44, 17); R.plat(20, 26, 17); R.plat(26, 31, 13); R.plat(32, 37, 10); },
    ents: [['gargoyle', 24, 6], ['bats', 14, 22], ['rat', 10, 33], ['puff', 28, 26], ['puff', 16, 12],
      ['flowerpot', 4, 33], ['flowerpot', 33, 29], ['flowerpot', 22, 25], ['candle', 10, 21], ['candle', 13, 21], ['candle', 3, 15], ['seed', 41, 17], ['bottle', 44, 33],
      ['vines', 1, 15, { gate: 'vine1' }], ['hint', 5, 15, { text: 'つたで道がふさがれてる… 火をつけたら燃えそう' }],
      ['hint', 34, 10, { need: 'djump', text: '天井の穴の先… もう少し高く跳べたら' }], ['dust', 26, 33, { drop: ['coin', 'heart'] }]],
    decor: [['glasspane', 8, 28], ['glasspane', 20, 28], ['glasspane', 32, 28], ['glasspane', 44, 28], ['glasspane', 14, 10], ['glasspane', 26, 10], ['glasspane', 40, 10],
      ['fern', 6, 33], ['fern', 28, 33], ['rosebush', 16, 33], ['rosebush', 36, 33], ['rosebush', 46, 33], ['hedge', 22, 33],
      ['vine_hang', 6, 2, { top: 1 }], ['vine_hang', 20, 2, { top: 1 }], ['vine_hang', 42, 2, { top: 1 }], ['vine_hang', 12, 19, { top: 1 }],
      ['gardenlamp', 2, 33, { light: 1 }], ['gardenlamp', 25, 33, { light: 1 }], ['gardenlamp', 45, 17, { light: 1 }], ['gardenlamp', 11, 21, { light: 1 }], ['statue', 41, 33]] },

  { id: 'birdcage', jp: '秘密の鳥かご', en: 'SECRET AVIARY', area: 'garden', theme: 'garden', tiles: 'g', cx: -3, cy: -1, cw: 1, ch: 1, dark: 0.35, secret: true,
    build(R) { R.box(); R.open('B', 0, 8, 11); R.plat(2, 6, 11); R.plat(16, 21, 11); },
    ents: [['heartbig', 18.5, 9], ['coin', 3, 11], ['coin', 5, 11], ['coin', 3, 15], ['coin', 5, 15], ['coin', 17, 15], ['coin', 20, 15], ['seed', 14, 15], ['flowerpot', 6, 15]],
    decor: [['glasspane', 6, 10], ['glasspane', 18, 10], ['fern', 13, 15], ['rosebush', 4, 15], ['vine_hang', 10, 2, { top: 1 }], ['gardenlamp', 15, 15, { light: 1 }]] },

  { id: 'courtyard', jp: '噴水の中庭', en: 'FOUNTAIN COURTYARD', area: 'garden', theme: 'courtyard', tiles: 'g', cx: -6, cy: 1, cw: 2, ch: 1, dark: 0.32,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.open('B', 0, 6, 9); R.plat(14, 20, 11); R.plat(24, 30, 7); R.plat(34, 40, 11); },
    ents: [['save', 42, 15], ['puppet', 30, 15], ['gargoyle', 20, 5], ['flowerpot', 12, 15], ['flowerpot', 16, 11], ['candle', 27, 7], ['seed', 36, 11],
      ['bottle', 3, 15], ['chair', 33, 15], ['dust', 22, 15, { drop: ['coin', 'coin', 'coin'] }]],
    decor: [['fountain', 24, 15], ['statue', 4, 15], ['statue', 44, 15], ['hedge', 13, 15], ['hedge', 36, 15], ['gardenlamp', 10, 15, { light: 1 }],
      ['gardenlamp', 32, 15, { light: 1 }], ['gardenlamp', 46, 15, { light: 1 }], ['rosebush', 18, 15], ['rosebush', 40, 15]] },

  { id: 'shed', jp: '庭師の小屋', en: "GARDENER'S SHED", area: 'garden', theme: 'shed', tiles: 'w', cx: -5, cy: 0, cw: 1, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.solid(2, 9, 8, 14); },
    ents: [['ability', 5, 9, { abil: 'djump' }], ['rat', 15, 15], ['cursedbook', 12, 8], ['flowerpot', 11, 15], ['flowerpot', 13, 15], ['chair', 17, 15], ['bottle', 20, 15],
      ['hint', 13, 15, { have: 'float', text: '棚の上に何かある… ふわり足場で登れそう' }]],
    decor: [['crate', 19, 15], ['crate', 21, 15], ['trunk', 16, 15], ['fern', 10, 15], ['sconce', 12, 8, { light: 1 }], ['sconce', 20, 9, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'thorns', jp: '茨の迷路', en: 'THORN MAZE', area: 'garden', theme: 'thorn', tiles: 'g', cx: -6, cy: 2, cw: 3, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('T', 0, 6, 9); R.open('R', 0, 11, 14); R.plat(12, 18, 11); R.plat(4, 11, 7); R.gate(30, 2, 31, 14, 'vine2'); R.plat(36, 42, 11);
      R.plat(44, 50, 7); R.gate(54, 2, 55, 14, 'vine3'); R.plat(60, 66, 11); },
    ents: [['puppet', 20, 15], ['puppet', 46, 15], ['rat', 38, 15], ['bats', 40, 4], ['armor', 62, 15], ['puff', 16, 5],
      ['candle', 24, 15], ['candle', 26, 15], ['seed', 15, 11], ['candle', 49, 7], ['seed', 51, 15], ['flowerpot', 8, 7], ['flowerpot', 34, 15], ['bottle', 58, 15],
      ['vines', 30.5, 15, { gate: 'vine2' }], ['vines', 54.5, 15, { gate: 'vine3' }], ['dust', 44, 15, { drop: ['coin', 'heart'] }]],
    decor: [['hedge', 6, 15], ['hedge', 21, 15], ['hedge', 40, 15], ['hedge', 64, 15], ['rosebush', 14, 15], ['rosebush', 47, 15], ['statue', 70, 15],
      ['vine_hang', 10, 2, { top: 1 }], ['vine_hang', 36, 2, { top: 1 }], ['vine_hang', 60, 2, { top: 1 }],
      ['gardenlamp', 3, 15, { light: 1 }], ['gardenlamp', 26, 15, { light: 1 }], ['gardenlamp', 50, 15, { light: 1 }], ['gardenlamp', 68, 15, { light: 1 }]] },

  { id: 'rosegate', jp: '薔薇園の門', en: 'ROSE GARDEN GATE', area: 'garden', theme: 'courtyard', tiles: 'g', cx: -3, cy: 2, cw: 1, ch: 1, dark: 0.4,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(8, 15, 11); },
    ents: [['save', 6, 15], ['candle', 10, 11], ['candle', 13, 11], ['flowerpot', 17, 15], ['seed', 19, 15],
      ['hint', 12, 15, { text: 'この先から甘い香り… バラなら、火に弱いかも' }]],
    decor: [['hedge', 3, 15], ['hedge', 21, 15], ['rosebush', 12, 15], ['gardenlamp', 9, 15, { light: 1 }], ['gardenlamp', 18, 15, { light: 1 }]] },

  { id: 'rosebed', jp: '夜咲きの薔薇園', en: 'NIGHT-BLOOM ROSE BED', area: 'garden', theme: 'courtyard', tiles: 'g', cx: -2, cy: 2, cw: 1, ch: 1, dark: 0.36, boss: 'rose',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(9, 12, 8); },
    ents: [['boss', 18, 15]],
    decor: [['hedge', 4, 15], ['rosebush', 10, 15], ['gardenlamp', 2, 15, { light: 1 }], ['vine_hang', 6, 2, { top: 1 }], ['vine_hang', 15, 2, { top: 1 }]] },
);
