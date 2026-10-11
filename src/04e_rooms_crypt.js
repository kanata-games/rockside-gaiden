
// =====================================================================
//  AREA 5 (v0.3): 礼拝堂と地下墓所 (CHAPEL & CRYPT) - east of the attic (needs 二段ジャンプ)
//  Boss: 呪いのパイプオルガン (cursed pipe organ) -> 霊体化 (PHASE): pass the pale spirit barriers.
//  The spirit barrier in the gear shaft keeps the clock tower closed until then.
// =====================================================================
ROOM_DEFS.push(
  { id: 'cloister', jp: '月光の回廊', en: 'MOONLIT CLOISTER', area: 'crypt', theme: 'chapel', tiles: 'k', cx: 9, cy: -1, cw: 1, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(4, 9, 11); R.plat(13, 18, 8); },
    ents: [['skullwisp', 14, 6], ['candle', 6, 11], ['coin', 15, 8], ['coin', 16, 8], ['bone', 18, 15], ['dust', 10, 15, { drop: ['coin', 'coin'] }]],
    decor: [['stainedglass', 11, 9], ['pillar', 3, 15], ['pillar', 21, 15], ['sconce', 7, 9, { light: 1 }], ['sconce', 17, 9, { light: 1 }], ['urn', 19, 15], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'nave', jp: '呪われた礼拝堂', en: 'CURSED CHAPEL', area: 'crypt', theme: 'chapel', tiles: 'k', cx: 10, cy: -1, cw: 2, ch: 1, dark: 0.48,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('B', 1, 8, 11); R.plat(4, 9, 11); R.plat(12, 18, 7); R.plat(22, 27, 11); R.plat(28, 31, 7); R.plat(38, 44, 11); },
    ents: [['save', 16, 15], ['skullwisp', 22, 6], ['skullwisp', 40, 6], ['cursedbook', 30, 5], ['puff', 10, 7], ['book', 6, 11], ['book', 24, 11], ['candle', 14, 7], ['bone', 42, 11],
      ['coin', 29, 7], ['coin', 30, 7], ['dust', 26, 15, { drop: ['heart'] }], ['dust', 44, 15, { drop: ['coin', 'coin'] }]],
    decor: [['stainedglass', 8, 9], ['stainedglass', 24, 9], ['stainedglass', 40, 9], ['pew', 5, 15], ['pew', 10.5, 15], ['pew', 21, 15], ['pew', 39, 15], ['altar', 27, 15],
      ['candelabra', 24, 15, { light: 1 }], ['candelabra', 30, 15, { light: 1 }], ['sconce', 16, 9, { light: 1 }], ['sconce', 32, 9, { light: 1 }], ['organpipes', 45, 15], ['cobweb', 1, 2, { top: 1 }], ['cobweb', 46.75, 2, { top: 1, flip: 1 }]] },

  { id: 'choir', jp: 'パイプオルガンの聖歌隊席', en: 'ORGAN LOFT', area: 'crypt', theme: 'chapel', tiles: 'k', cx: 12, cy: -1, cw: 1, ch: 1, dark: 0.4, boss: 'organ',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); },
    ents: [['boss', 16, 15], ['ability', 4, 15, { abil: 'phase', after: 'organ' }]],
    decor: [['stainedglass', 6, 9], ['stainedglass', 18, 9], ['sconce', 12, 7, { light: 1 }], ['pew', 4, 15], ['cobweb', 1, 2, { top: 1 }], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]] },

  { id: 'catacomb', jp: '地下墓所', en: 'CATACOMBS', area: 'crypt', theme: 'crypt', tiles: 'k', cx: 10, cy: 0, cw: 2, ch: 1, dark: 0.62,
    build(R) { R.box(); R.open('T', 1, 8, 11); R.open('R', 0, 11, 14); R.open('L', 0, 11, 14); R.gate(0, 11, 0, 14, 'spirit_reliq'); R.plat(25, 30, 11); R.plat(33, 38, 7);
      R.plat(6, 11, 11); R.plat(14, 19, 8); R.plat(41, 45, 11); },
    ents: [['skeleton', 14, 15], ['skullwisp', 20, 5], ['rat', 40, 15], ['puff', 30, 4], ['bone', 8, 11], ['bone', 16, 8], ['coin', 42, 11], ['coin', 44, 11],
      ['hint', 3, 15, { need: 'phase', text: '壁に青白い結界… 奥に何かがありそうだ' }], ['dust', 22, 15, { drop: ['heart'] }]],
    decor: [['coffin', 10, 15], ['coffin', 34, 15], ['skullpile', 4, 15], ['skullpile', 44, 15], ['urn', 20, 15], ['urn', 26, 15], ['spiritlamp', 2, 15, { light: 1 }],
      ['sconce', 16, 6, { light: 1 }], ['sconce', 38, 5, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'reliquary', jp: '聖遺物の隠し部屋', en: 'HIDDEN RELIQUARY', area: 'crypt', theme: 'chapel', tiles: 'k', cx: 9, cy: 0, cw: 1, ch: 1, dark: 0.4, secret: true,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.plat(4, 9, 11); R.plat(14, 19, 11); },
    ents: [['heartbig', 12, 12], ['coin', 5, 11], ['coin', 7, 11], ['coin', 15, 11], ['coin', 17, 11], ['coin', 9, 15], ['coin', 15, 15], ['crystal', 4, 15], ['bone', 19, 15]],
    decor: [['altar', 12, 15], ['stainedglass', 12, 8], ['candelabra', 5, 11, { light: 1 }], ['candelabra', 18, 11, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'ossuary', jp: '納骨堂の縦穴', en: 'OSSUARY SHAFT', area: 'crypt', theme: 'crypt', tiles: 'k', cx: 12, cy: 0, cw: 1, ch: 2, dark: 0.6,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 1, 11, 14); R.open('B', 0, 8, 11); R.gate(8, 33, 11, 35, 'spirit_well'); R.solid(1, 15, 6, 16);
      R.plat(10, 14, 18); R.plat(3, 8, 21); R.plat(12, 17, 25); R.plat(3, 8, 29); R.plat(17, 21, 12); },
    ents: [['skullwisp', 14, 8], ['skullwisp', 8, 24], ['bats', 18, 20], ['bone', 5, 21], ['bone', 14, 25], ['coin', 18, 12], ['coin', 20, 12],
      ['hint', 12, 33, { need: 'phase', text: '床の下から水の音… 青白い結界でふさがれている' }], ['dust', 18, 33, { drop: ['heart'] }]],
    decor: [['skullpile', 4, 15], ['skullpile', 20, 33], ['urn', 15, 33], ['coffin', 4, 33], ['sconce', 12, 10, { light: 1 }], ['sconce', 6, 26, { light: 1 }], ['spiritlamp', 13, 33, { light: 1 }]] },
);
