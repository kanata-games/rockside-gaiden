// =====================================================================
//  AREA 11 (v0.5.1): 使用人の裏廊下 (SERVANTS' QUARTERS) - behind the bottling shaft, under the garden.
//  Way in: the bottling shaft's lower west door is a golden padlock (needs 鍵束 from バレルタラント).
//  Boss: 呼び鈴盤 リンガリング (gives the カンテラ LANTERN -> walls of black fog melt away).
// =====================================================================
Object.assign(AREAS, { servants: { jp: '使用人の裏廊下', short: '裏廊下', en: "SERVANTS' QUARTERS", music: 'servants', col: '#a88a5a' } });
ROOM_DEFS.push(
  { id: 'servhall', jp: '使用人の廊下', en: "SERVANTS' PASSAGE", area: 'servants', theme: 'servants', tiles: 'v', cx: -3, cy: 4, cw: 2, ch: 1, dark: 0.48,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(6, 11, 11); R.plat(15, 20, 7); R.plat(26, 31, 11); R.plat(36, 41, 8); },
    ents: [['save', 24, 15], ['puppet', 12, 15, { foe: { skin: 'dustmaid' } }], ['bats', 38, 4, { foe: { skin: 'bellbat' }, n: 2 }], ['plate', 8, 11], ['pot', 28, 11],
      ['coin', 16, 7], ['coin', 18, 7], ['coin', 37, 8], ['coin', 39, 8], ['dust', 4, 15, { drop: ['coin', 'coin'] }], ['dust', 44, 15, { drop: ['heart'] }],
      ['hint', 40, 15, { text: 'グリムが小声で「ここ、ほこりだらけ」… 仕える人形たちの通り道みたい' }]],
    decor: [['bellplaque', 24, 5], ['broom', 3, 15], ['mopbucket', 34, 15], ['sconce', 10, 8, { light: 1 }], ['sconce', 22, 8, { light: 1 }], ['sconce', 42, 8, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'linenroom', jp: 'リネン室', en: 'LINEN ROOM', area: 'servants', theme: 'linen', tiles: 'v', cx: -5, cy: 4, cw: 2, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(4, 9, 11); R.plat(13, 18, 8); R.plat(22, 27, 11); R.plat(31, 36, 7); R.plat(40, 45, 11); },
    ents: [['puppet', 20, 15, { foe: { skin: 'dustmaid' } }], ['puppet', 38, 15, { foe: { skin: 'dustmaid' } }], ['skullwisp', 30, 4],
      ['curtain', 10.5, 15, { drop: ['coin', 'heart'] }], ['curtain', 27.5, 15, { drop: ['coin', 'coin'] }], ['soap', 6, 11], ['soap', 42, 11], ['coin', 14, 8], ['coin', 16, 8], ['coin', 32, 7], ['coin', 34, 7]],
    decor: [['linenshelf', 4, 15], ['linenshelf', 44, 15], ['ironboard', 24, 15], ['sheetline', 16, 2, { top: 1 }], ['sheetline', 34, 2, { top: 1 }], ['sconce', 12, 9, { light: 1 }], ['sconce', 36, 9, { light: 1 }]] },

  { id: 'servstair', jp: '使用人階段', en: "SERVANTS' STAIR", area: 'servants', theme: 'servants', tiles: 'v', cx: -6, cy: 3, cw: 1, ch: 2, dark: 0.6,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('L', 1, 11, 14); R.open('R', 1, 11, 14); R.open('B', 1, 9, 12); R.gate(9, 33, 12, 35, 'dark_lake');
      R.plat(14, 19, 29); R.plat(4, 9, 25); R.plat(13, 18, 21); R.plat(5, 10, 17); R.plat(1, 5, 15); R.plat(18, 22, 15); R.plat(9, 14, 10); },
    ents: [['bats', 12, 24, { foe: { skin: 'bellbat' }, n: 2 }], ['puppet', 12, 33, { foe: { skin: 'dustmaid' } }], ['coin', 15, 29], ['coin', 17, 29], ['coin', 10, 10], ['coin', 12, 10], ['pan', 6, 25],
      ['hint', 10, 33, { need: 'lantern', text: '床の穴から冷たい風… 真っ黒な霧がつまっていて、何も見えない' }]],
    decor: [['broom', 21, 33], ['sconce', 12, 27, { light: 1 }], ['sconce', 8, 13, { light: 1 }], ['cobweb', 1, 2, { top: 1 }], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]] },

  { id: 'butlerpantry', jp: '執事の食器室', en: "BUTLER'S PANTRY", area: 'servants', theme: 'linen', tiles: 'v', cx: -7, cy: 3, cw: 1, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.plat(14, 19, 11); R.plat(6, 11, 7); },
    ents: [['heartbig', 8.5, 5], ['skullwisp', 12, 4], ['plate', 15, 11], ['plate', 17, 11], ['coin', 4, 15], ['coin', 6, 15], ['dust', 20, 15, { drop: ['coin', 'coin', 'coin'] }]],
    decor: [['potshelf', 4, 15], ['table', 12, 15], ['candelabra', 12, 13, { light: 1 }]] },

  { id: 'dormitory', jp: '女中部屋', en: "MAIDS' DORMITORY", area: 'servants', theme: 'servants', tiles: 'v', cx: -5, cy: 3, cw: 3, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(6, 12, 11); R.plat(16, 22, 8); R.plat(28, 34, 11); R.plat(40, 46, 8); R.plat(52, 58, 11); R.plat(62, 68, 8); },
    ents: [['puppet', 14, 15, { foe: { skin: 'dustmaid' } }], ['puppet', 44, 15, { foe: { skin: 'dustmaid' } }], ['bats', 30, 4, { foe: { skin: 'bellbat' }, n: 2 }], ['bats', 60, 4, { foe: { skin: 'bellbat' }, n: 2 }],
      ['chair', 8, 11], ['plate', 30, 11], ['soap', 54, 11], ['coin', 17, 8], ['coin', 19, 8], ['coin', 41, 8], ['coin', 43, 8], ['coin', 63, 8], ['coin', 65, 8],
      ['dust', 24, 15, { drop: ['coin', 'coin'] }], ['dust', 50, 15, { drop: ['heart'] }], ['vase', 36, 15, { drop: ['coin', 'coin', 'coin'] }],
      ['hint', 66, 15, { text: 'ベッドが十三台… どれも人形用の小さなベッド。奥で呼び鈴がひとりでに鳴っている' }]],
    decor: [['bunk', 6, 15], ['bunk', 20, 15], ['bunk', 32, 15], ['bunk', 46, 15], ['bunk', 58, 15], ['bellplaque', 36, 5], ['sconce', 13, 8, { light: 1 }], ['sconce', 38, 8, { light: 1 }], ['sconce', 62, 8, { light: 1 }]] },

  { id: 'bellhall', jp: '呼び鈴の間', en: 'HALL OF BELLS', area: 'servants', theme: 'bellroom', tiles: 'v', cx: -2, cy: 3, cw: 1, ch: 1, dark: 0.42, boss: 'bellboard',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 14, 15], ['ability', 4, 15, { abil: 'lantern', after: 'bellboard' }]],
    decor: [['bellplaque', 5, 6], ['bellplaque', 19, 6], ['sconce', 6, 9, { light: 1 }], ['sconce', 18, 9, { light: 1 }]] },
);
