
// =====================================================================
//  AREA 9 (v0.5): 古酒の大貯蔵庫 (OLD VINTAGE VAULTS) - below the foyer, west of the east-wing wine cellar.
//  Way in: the warp room under the east wing (ワープの間) has a spirit barrier on its west side (needs 霊体化).
//  Boss: 樽蜘蛛 バレルタラント (gives the 鍵束 KEY RING -> golden padlocked doors).
// =====================================================================
Object.assign(AREAS, { wine: { jp: '古酒の大貯蔵庫', short: '大貯蔵庫', en: 'OLD VINTAGE VAULTS', music: 'wine', col: '#7a1a3a' } });
ROOM_DEFS.push(
  { id: 'cellarstair', jp: '樽の降り口', en: 'CASK STAIRS', area: 'wine', theme: 'vintage', tiles: 'r', cx: 3, cy: 2, cw: 1, ch: 1, dark: 0.58,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('B', 0, 16, 19); R.plat(3, 8, 11); R.plat(10, 14, 7); R.plat(17, 21, 11); },
    ents: [['bats', 12, 4, { foe: { skin: 'corkbat' }, n: 2 }], ['coin', 11, 7], ['coin', 13, 7], ['bottle', 5, 11], ['cork', 19, 11], ['dust', 6, 15, { drop: ['coin', 'coin'] }],
      ['hint', 17, 15, { text: '甘酸っぱい匂い… グリムが「くしゅん」とくしゃみをした' }]],
    decor: [['caskstack', 5, 15], ['grapevine', 12, 2, { top: 1 }], ['sconce', 9, 9, { light: 1 }], ['sconce', 21, 8, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'casks', jp: '大樽の回廊', en: 'GREAT CASK HALL', area: 'wine', theme: 'casks', tiles: 'r', cx: 1, cy: 2, cw: 2, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(5, 10, 11); R.plat(13, 18, 7); R.plat(23, 29, 11); R.plat(33, 37, 7); R.plat(40, 45, 11); },
    ents: [['save', 26, 15], ['bats', 16, 4, { foe: { skin: 'corkbat' }, n: 2 }], ['skullwisp', 36, 5, { foe: { skin: 'grapewisp' } }], 
      ['cork', 7, 11], ['cork', 42, 11], ['bottle', 20, 15], ['barrel', 44, 15], ['coin', 14, 7], ['coin', 16, 7], ['coin', 34, 7], ['coin', 36, 7],
      ['dust', 3, 15, { drop: ['coin', 'coin'] }], ['dust', 38, 15, { drop: ['heart'] }], ['vase', 30, 15, { drop: ['coin', 'coin', 'coin'] }]],
    decor: [['cask_big', 4, 15], ['cask_big', 12, 15], ['caskstack', 21, 15], ['winerack', 34, 15], ['cask_big', 41, 15], ['grapevine', 9, 2, { top: 1 }], ['grapevine', 30, 2, { top: 1 }],
      ['sconce', 8, 8, { light: 1 }], ['sconce', 24, 8, { light: 1 }], ['sconce', 40, 8, { light: 1 }], ['cobweb', 46.75, 2, { top: 1, flip: 1 }]] },

  { id: 'fermenting', jp: '発酵の大桶', en: 'FERMENTING VATS', area: 'wine', theme: 'vintage', tiles: 'r', cx: 1, cy: 3, cw: 3, ch: 1, dark: 0.6,
    build(R) { R.box(); R.open('T', 2, 16, 19); R.open('L', 0, 11, 14);
      R.plat(60, 64, 11); R.plat(66, 70, 8); R.plat(63, 67, 6); R.plat(6, 12, 11); R.plat(16, 22, 8); R.plat(28, 34, 11); R.plat(40, 46, 8); R.plat(50, 56, 11); },
    ents: [['skullwisp', 20, 5, { foe: { skin: 'grapewisp' } }], ['skullwisp', 48, 5, { foe: { skin: 'grapewisp' } }], ['bats', 40, 4, { foe: { skin: 'corkbat' }, n: 2 }],
      ['cork', 8, 11], ['cork', 52, 11], ['bottle', 31, 11], ['bottle', 44, 15], ['coin', 18, 8], ['coin', 20, 8], ['coin', 42, 8], ['coin', 44, 8],
      ['dust', 24, 15, { drop: ['coin', 'coin'] }], ['dust', 66, 15, { drop: ['heart'] }], ['puff', 36, 9],
      ['hint', 6, 15, { text: 'このお屋敷は、呪われた人形が見ている「夢」の中… 大桶の底まで夢がしみこんでいる' }]],
    decor: [['vat', 10, 15], ['vat', 14, 15], ['vat', 36, 15], ['vat', 40, 15], ['caskstack', 58, 15], ['winerack', 26, 15], ['grapevine', 20, 2, { top: 1 }], ['grapevine', 46, 2, { top: 1 }],
      ['sconce', 4, 8, { light: 1 }], ['sconce', 24, 7, { light: 1 }], ['sconce', 48, 7, { light: 1 }], ['sconce', 68, 10, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'tasting', jp: '試飲の間', en: 'TASTING ROOM', area: 'wine', theme: 'casks', tiles: 'r', cx: 0, cy: 3, cw: 1, ch: 1, dark: 0.5,
    vel: 'wine', velAt: [16, 15],
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(3, 8, 11); R.plat(15, 20, 11); R.plat(9, 14, 7); },
    ents: [['plate', 5, 11], ['plate', 17, 11], ['bottle', 11, 7], ['chair', 8, 15], ['coin', 10, 7], ['coin', 13, 7], ['skullwisp', 12, 4, { foe: { skin: 'grapewisp' } }]],
    decor: [['table', 12, 15], ['chair', 9, 15], ['chair', 15, 15, { flip: 1 }], ['candelabra', 12, 13, { light: 1 }], ['winerack', 3, 15], ['winerack', 21, 15], ['grapevine', 12, 2, { top: 1 }]] },

  { id: 'bottling', jp: '瓶詰めの縦穴', en: 'BOTTLING SHAFT', area: 'wine', theme: 'vintage', tiles: 'r', cx: -1, cy: 3, cw: 1, ch: 2, dark: 0.62,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.open('R', 1, 11, 14); R.plat(15, 22, 15);
      R.plat(12, 17, 29); R.plat(4, 9, 25); R.plat(11, 16, 21); R.plat(4, 9, 18); R.plat(7, 12, 11); R.plat(2, 5, 7); },
    ents: [['heartbig', 3.5, 6], ['bats', 12, 24, { foe: { skin: 'corkbat' }, n: 2 }], ['skullwisp', 8, 14, { foe: { skin: 'grapewisp' } }], ['cork', 14, 29], ['bottle', 6, 25],
      ['coin', 8, 11], ['coin', 10, 11], ['coin', 13, 21], ['coin', 15, 21], ['dust', 18, 33, { drop: ['coin', 'heart'] }]],
    decor: [['winerack', 4, 33], ['winerack', 20, 15], ['caskstack', 18, 33], ['sconce', 12, 9, { light: 1 }], ['sconce', 6, 22, { light: 1 }], ['sconce', 18, 27, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'winethrone', jp: '大樽の玉座', en: 'THRONE OF THE GRAND CASK', area: 'wine', theme: 'casks', tiles: 'r', cx: 0, cy: 4, cw: 1, ch: 1, dark: 0.42, boss: 'tarant',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 14, 15], ['ability', 4, 15, { abil: 'keyring', after: 'tarant' }]],
    decor: [['caskstack', 20, 15], ['cask_big', 3, 15], ['grapevine', 8, 2, { top: 1 }], ['grapevine', 17, 2, { top: 1 }], ['sconce', 6, 8, { light: 1 }], ['sconce', 18, 8, { light: 1 }]] },
);
