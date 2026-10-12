
// =====================================================================
//  AREA 6 (v0.3): 大浴場と貯水槽 (GRAND BATH & CISTERN) - under the crypt, behind a spirit barrier (needs 霊体化)
//  Boss: 大浴場の主 ユブネ (bathwater serpent) -> 大容量タンク (tank holds 4)
// =====================================================================
ROOM_DEFS.push(
  { id: 'well', jp: '湯けむりの井戸', en: 'STEAMY WELL', area: 'bath', theme: 'cistern', tiles: 'b', cx: 12, cy: 2, cw: 1, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('T', 0, 8, 11); R.open('R', 0, 11, 14); R.plat(2, 7, 11); R.plat(9, 14, 7); R.plat(16, 21, 11); },
    ents: [['crab', 13, 15], ['duck', 4, 11], ['duck', 19, 11], ['coin', 11, 7], ['coin', 12, 7]],
    decor: [['pipes', 4, 15], ['spiritlamp', 14, 15, { light: 1 }], ['buckets', 20, 15]] },

  { id: 'grandbath', jp: '大浴場', en: 'GRAND BATH', area: 'bath', theme: 'bath', tiles: 'b', cx: 13, cy: 2, cw: 2, ch: 1, dark: 0.36,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('B', 1, 8, 11); R.solid(14, 13, 28, 14); R.plat(4, 9, 11); R.plat(17, 25, 8); R.plat(37, 43, 11); },
    ents: [['save', 7, 15], ['crab', 20, 13], ['crab', 36, 15], ['puff', 30, 6], ['sheet', 12, 6], ['duck', 16, 13], ['duck', 26, 13], ['soap', 38, 11], ['bottle', 5, 11],
      ['coin', 20, 8], ['coin', 22, 8], ['dust', 30, 15, { drop: ['heart'] }]],
    decor: [['liontap', 21, 11], ['bathstool', 3, 15], ['bathstool', 44, 15], ['buckets', 11, 15], ['duckprop', 25, 13], ['lamp_wall', 8, 8, { light: 1 }], ['lamp_wall', 40, 8, { light: 1 }],
      ['round_window', 32, 7], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'sauna', jp: '呪いのサウナ', en: 'CURSED SAUNA', area: 'bath', theme: 'shed', tiles: 'w', cx: 15, cy: 2, cw: 1, ch: 1, dark: 0.45,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(4, 9, 11); R.plat(14, 19, 9); },
    ents: [['crab', 12, 15], ['skullwisp', 16, 5], ['soap', 6, 11], ['duck', 17, 9], ['hint', 20, 15, { text: 'ぐらぐら… 奥から湯気と、大きな気配がする' }]],
    decor: [['bathstool', 6, 15], ['buckets', 14, 15], ['stove', 20, 15, { light: 1 }], ['sconce', 12, 7, { light: 1 }]] },

  { id: 'yubune', jp: '主の湯船', en: 'SERPENT\'S TUB', area: 'bath', theme: 'bath', tiles: 'b', cx: 16, cy: 2, cw: 1, ch: 1, dark: 0.35, boss: 'serpent',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); },
    ents: [['boss', 16, 15], ['ability', 4, 15, { abil: 'tank', after: 'serpent' }]],
    decor: [['liontap', 12, 7], ['bathstool', 3, 15], ['lamp_wall', 6, 8, { light: 1 }], ['lamp_wall', 19, 8, { light: 1 }]] },

  { id: 'pumproom', jp: 'ポンプ室', en: 'PUMP ROOM', area: 'bath', theme: 'boiler', tiles: 't', cx: 14, cy: 3, cw: 1, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('T', 0, 8, 11); R.open('L', 0, 11, 14); R.plat(2, 7, 11); R.plat(10, 15, 9); R.plat(18, 21, 6); },
    ents: [['heartbig', 19.5, 4], ['crab', 16, 15], ['skullwisp', 6, 5], ['gear', 4, 11], ['pan', 12, 9], ['coin', 18, 15], ['coin', 20, 15]],
    decor: [['pipes', 14, 15], ['boiler', 20, 15, { light: 1 }], ['lamp_wall', 4, 8, { light: 1 }]] },

  { id: 'cistern', jp: '地下貯水槽', en: 'UNDERGROUND CISTERN', area: 'bath', theme: 'cistern', tiles: 'b', cx: 12, cy: 3, cw: 2, ch: 1, dark: 0.6,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(6, 11, 11); R.plat(15, 20, 8); R.plat(26, 31, 11); R.plat(35, 40, 7); },
    ents: [['crab', 14, 15], ['crab', 34, 15], ['puff', 24, 6], ['duck', 8, 11], ['bottle', 28, 11], ['coin', 36, 7], ['coin', 38, 7], ['dust', 44, 15, { drop: ['coin', 'coin', 'coin'] }]],
    decor: [['pipes', 3, 15], ['pipes', 46, 15], ['spiritlamp', 18, 15, { light: 1 }], ['spiritlamp', 30, 15, { light: 1 }], ['buckets', 22, 15]] },
);
