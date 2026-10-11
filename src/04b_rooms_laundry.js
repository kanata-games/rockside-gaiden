
// =====================================================================
//  AREA 2: 地下 洗濯場と厨房 (UNDERGROUND LAUNDRY & KITCHEN) - below the cellar / ballroom
//  Way in: the chandelier smashes the ballroom floor. Needs ふわり化 (float) to go on, holds ターボ吸引 (turbo),
//  boss: リネン・ゴーレム. The lever in the drying room opens a shortcut grate up into the wine cellar.
// =====================================================================
ROOM_DEFS.push(
  { id: 'linen', jp: 'リネン室', en: 'LINEN ROOM', area: 'laundry', theme: 'laundry', tiles: 't', cx: 8, cy: 3, cw: 1, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('T', 0, 15, 18); R.open('L', 0, 11, 14); R.secret(23, 11, 14); R.plat(3, 8, 11); R.plat(13, 20, 7); },
    ents: [['sheet', 8, 6], ['rat', 16, 15], ['bottle', 4, 15], ['bottle', 6, 15], ['chair', 11, 15], ['plate', 5, 11], ['soap', 18, 7],
      ['curtain', 21.5, 15, { secret: 1, sprite: 'sheet' }], ['dust', 14, 15, { drop: ['coin', 'coin'] }],
      ['hint', 12, 15, { have: 'float', text: 'SPIT長押しで、吸い込んだ物を「ふわり化」。少しのあいだ浮かぶ足場になる' }]],
    decor: [['linenshelf', 6, 15], ['linenshelf', 11, 11], ['pipes', 2, 15], ['lamp_wall', 9, 8, { light: 1 }], ['lamp_wall', 21, 9, { light: 1 }],
      ['sheetline', 16, 3, { top: 1 }], ['basket', 14, 7], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'detergent', jp: '洗剤倉庫', en: 'DETERGENT STORE', area: 'laundry', theme: 'laundry', tiles: 't', cx: 9, cy: 3, cw: 1, ch: 1, dark: 0.42, secret: true,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(4, 9, 11); R.plat(14, 19, 11); },
    ents: [['heartbig', 12, 12], ['coin', 5, 11], ['coin', 7, 11], ['coin', 15, 11], ['coin', 17, 11], ['coin', 9, 15], ['coin', 15, 15], ['bottle', 20, 15], ['soap', 4, 15]],
    decor: [['linenshelf', 6, 11], ['linenshelf', 17, 11], ['pedestal', 12, 15], ['lamp_wall', 12, 8, { light: 1 }], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]] },

  { id: 'laundry', jp: '洗濯場', en: 'LAUNDRY', area: 'laundry', theme: 'laundry', tiles: 't', cx: 6, cy: 3, cw: 2, ch: 1, dark: 0.48,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.open('L', 0, 5, 8); R.solid(1, 9, 4, 14); R.plat(20, 26, 11); R.plat(28, 33, 7); R.plat(36, 42, 11); },
    ents: [['save', 31, 15], ['sheet', 24, 8], ['sheet', 40, 8], ['rat', 14, 15], ['rat', 38, 15], ['bottle', 7, 15], ['bottle', 9, 15], ['bottle', 11, 15],
      ['plate', 22, 11], ['soap', 30, 7], ['chair', 44, 15], ['curtain', 17, 15, { sprite: 'sheet', drop: ['coin', 'coin', 'heart'] }], ['dust', 34, 15, { drop: ['coin', 'coin'] }],
      ['hint', 8, 15, { need: 'float', text: '扉が高すぎて届かない…' }, ], ['hint', 7, 15, { have: 'float', text: '高い扉。物を吸ってSPIT長押し→ふわり足場に乗ってジャンプ！' }]],
    decor: [['washtub', 12, 15], ['washtub', 26, 15], ['washtub', 41, 15], ['pipes', 18, 15], ['pipes', 46, 15], ['boiler', 35, 15],
      ['sheetline', 10, 3, { top: 1 }], ['sheetline', 24, 3, { top: 1 }], ['sheetline', 38, 3, { top: 1 }], ['lamp_wall', 6, 7, { light: 1 }],
      ['lamp_wall', 20, 8, { light: 1 }], ['lamp_wall', 31, 6, { light: 1 }], ['lamp_wall', 44, 8, { light: 1 }], ['basket', 29, 15]] },

  { id: 'drying', jp: '物干し部屋', en: 'DRYING ROOM', area: 'laundry', theme: 'laundry', tiles: 't', cx: 4, cy: 3, cw: 2, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('R', 0, 5, 8); R.solid(43, 9, 46, 14); R.open('B', 0, 4, 7); R.open('T', 1, 4, 7); R.plat(18, 24, 11); R.plat(27, 33, 7); R.plat(10, 15, 11); },
    ents: [['bats', 16, 4], ['bats', 38, 4], ['sheet', 10, 7], ['bottle', 40, 15], ['bottle', 36, 15], ['chair', 22, 15], ['candle', 12, 11], ['plate', 20, 11],
      ['curtain', 26, 15, { sprite: 'sheet', drop: ['coin', 'coin', 'coin'] }], ['curtain', 34, 15, { sprite: 'sheet', drop: ['heart'] }],
      ['lever', 32, 7, { room: 'cellar', gate: 'grate' }], ['hint', 31, 7, { need: 'turbo', text: 'レバーが固くて動かない… もっと強く吸えたら' }]],
    decor: [['sheetline', 8, 3, { top: 1 }], ['sheetline', 20, 3, { top: 1 }], ['sheetline', 40, 3, { top: 1 }], ['pipes', 2, 15], ['pipes', 16, 15],
      ['lamp_wall', 12, 8, { light: 1 }], ['lamp_wall', 30, 4, { light: 1 }], ['lamp_wall', 40, 7, { light: 1 }], ['basket', 3, 15], ['basket', 45, 9], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'boiler', jp: 'ボイラー室', en: 'BOILER ROOM', area: 'laundry', theme: 'boiler', tiles: 't', cx: 4, cy: 4, cw: 1, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('T', 0, 4, 7); R.open('R', 0, 11, 14); R.plat(10, 16, 11); R.plat(3, 9, 7); },
    ents: [['rat', 8, 15], ['rat', 11, 15], ['skeleton', 15, 15], ['pot', 4, 15], ['pot', 20, 11], ['pan', 12, 11], ['pan', 6, 7], ['bottle', 21, 15],
      ['hint', 5, 15, { need: 'turbo', text: '鉄なべは重くて吸い込めない…' }]],
    decor: [['boiler', 12, 15], ['pipes', 2, 15], ['pipes', 20, 15], ['pipes', 22, 7], ['lamp_wall', 8, 10, { light: 1 }], ['lamp_wall', 17, 8, { light: 1 }]] },

  { id: 'kitchen', jp: '亡霊の厨房', en: 'PHANTOM KITCHEN', area: 'laundry', theme: 'kitchen', tiles: 't', cx: 5, cy: 4, cw: 3, ch: 1, dark: 0.46,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.solid(10, 13, 17, 14); R.plat(20, 27, 11); R.solid(30, 13, 36, 14); R.plat(38, 44, 10);
      R.plat(46, 52, 7); R.solid(55, 13, 62, 14); R.plat(64, 70, 11); },
    ents: [['skeleton', 24, 15], ['skeleton', 58, 13], ['rat', 40, 15], ['rat', 54, 15], ['dish', 34, 6], ['puff', 50, 4],
      ['plate', 11, 13], ['plate', 13, 13], ['plate', 16, 13], ['plate', 32, 13], ['plate', 35, 13], ['pan', 22, 11], ['pan', 42, 10], ['pan', 57, 13],
      ['pot', 6, 15], ['pot', 48, 15], ['chair', 28, 15], ['chair', 52, 15], ['bottle', 45, 7], ['bottle', 61, 13], ['candle', 50, 7],
      ['dust', 68, 15, { drop: ['coin', 'heart'] }], ['vase', 4, 15, { drop: ['coin', 'coin', 'coin'] }]],
    decor: [['stove', 14, 13], ['stove', 59, 13], ['potshelf', 6, 10], ['potshelf', 33, 9], ['potshelf', 68, 9], ['hangpans', 22, 2, { top: 1 }],
      ['hangpans', 44, 2, { top: 1 }], ['hangpans', 64, 2, { top: 1 }], ['barrel', 3, 15], ['sack', 46, 15], ['sack', 70, 15], ['winerack', 26, 15],
      ['lamp_wall', 9, 8, { light: 1 }], ['lamp_wall', 28, 7, { light: 1 }], ['lamp_wall', 48, 4, { light: 1 }], ['lamp_wall', 66, 7, { light: 1 }]] },

  { id: 'pantry', jp: '食料庫', en: 'PANTRY', area: 'laundry', theme: 'kitchen', tiles: 't', cx: 8, cy: 4, cw: 1, ch: 1, dark: 0.44,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.solid(14, 9, 20, 14); },
    ents: [['save', 5, 15], ['ability', 17, 9, { abil: 'turbo' }], ['bottle', 9, 15], ['chair', 11, 15], ['plate', 3, 15], ['rat', 12, 15],
      ['hint', 11, 15, { have: 'float', text: '棚の上に何か光ってる… ふわり足場で登ろう' }]],
    decor: [['potshelf', 9, 11], ['sack', 13, 15], ['sack', 21, 15], ['barrel', 2, 15], ['hangpans', 17, 2, { top: 1 }], ['lamp_wall', 5, 9, { light: 1 }], ['lamp_wall', 21, 7, { light: 1 }]] },

  { id: 'ironhall', jp: '鉄扉の通路', en: 'IRON DOOR PASSAGE', area: 'laundry', theme: 'boiler', tiles: 't', cx: 9, cy: 4, cw: 1, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.gate(23, 11, 23, 14, 'iron'); R.plat(4, 9, 11); },
    ents: [['lever', 18, 15, { gate: 'iron' }], ['barrel', 8, 15], ['pot', 12, 15], ['rat', 14, 15], ['pan', 6, 11],
      ['hint', 17, 15, { have: 'turbo', text: 'ターボ吸引でレバーを引こう（VAC長押し）' }]],
    decor: [['pipes', 3, 15], ['pipes', 21, 15], ['boiler', 12, 11], ['lamp_wall', 7, 8, { light: 1 }], ['lamp_wall', 19, 8, { light: 1 }]] },

  { id: 'washroom', jp: '大洗い場', en: 'GREAT WASHROOM', area: 'laundry', theme: 'laundry', tiles: 't', cx: 10, cy: 4, cw: 1, ch: 1, dark: 0.4, boss: 'golem',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 16, 15]],
    decor: [['washtub', 4, 15], ['washtub', 20, 15], ['sheetline', 6, 3, { top: 1 }], ['sheetline', 18, 3, { top: 1 }], ['boiler', 12, 9],
      ['lamp_wall', 3, 8, { light: 1 }], ['lamp_wall', 21, 8, { light: 1 }]] },
);
