
// =====================================================================
//  AREA 10 (v0.5): 騎士の武具庫 (HALL OF KNIGHTS) - east of the crypt. Way in: the ossuary shaft, behind a golden
//  padlocked door (needs the 鍵束 KEY RING). Boss: 空っぽの騎士団長 アイアンホロウ (gives グリム吸着 GRIM GRIP = wall cling).
// =====================================================================
Object.assign(AREAS, { armory: { jp: '騎士の武具庫', short: '武具庫', en: 'HALL OF KNIGHTS', music: 'armory', col: '#5a6a8a' } });
ROOM_DEFS.push(
  { id: 'armoryhall', jp: '武具庫の大広間', en: 'ARMORY HALL', area: 'armory', theme: 'armory', tiles: 'a', cx: 13, cy: 0, cw: 2, ch: 1, dark: 0.5,
    vel: 'armory', velAt: [38, 15],
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('T', 1, 8, 11);
      R.plat(27, 31, 11); R.plat(35, 39, 8); R.plat(31, 35, 6); R.plat(4, 9, 11); R.plat(12, 17, 8); R.plat(41, 45, 11); },
    ents: [['save', 21, 15], ['skeleton', 14, 15, { foe: { skin: 'squire' } }], ['skeleton', 43, 15, { foe: { skin: 'squire' } }], ['armor', 30, 15],
      ['plate', 6, 11], ['pan', 43, 11], ['coin', 13, 8], ['coin', 15, 8], ['coin', 36, 8], ['coin', 38, 8], ['dust', 9, 15, { drop: ['coin', 'coin'] }], ['dust', 38, 15, { drop: ['heart'] }]],
    decor: [['weaponrack', 6, 15], ['knightstatue', 18, 15], ['knightstatue', 26, 15], ['weaponrack', 44, 15], ['banner', 10, 2, { top: 1 }], ['banner', 22, 2, { top: 1 }], ['banner', 40, 2, { top: 1 }],
      ['sconce', 4, 8, { light: 1 }], ['sconce', 16, 6, { light: 1 }], ['sconce', 46, 8, { light: 1 }]] },

  { id: 'knightshall', jp: '騎士たちの回廊', en: 'GALLERY OF KNIGHTS', area: 'armory', theme: 'knights', tiles: 'a', cx: 13, cy: -1, cw: 3, ch: 1, dark: 0.52,
    build(R) { R.box(); R.open('B', 1, 8, 11); R.open('R', 0, 11, 14);
      R.plat(4, 10, 11); R.plat(13, 18, 7); R.plat(22, 27, 11); R.plat(38, 44, 11); R.plat(47, 52, 7); R.plat(56, 62, 11); R.plat(64, 68, 7); },
    ents: [['gargoyle', 15, 7, { foe: { skin: 'griffin' } }], ['gargoyle', 50, 7, { foe: { skin: 'griffin' } }], ['skeleton', 24, 15, { foe: { skin: 'squire' } }], ['armor', 58, 15],
      ['skeleton', 66, 15, { foe: { skin: 'squire' } }], ['pan', 6, 11], ['plate', 60, 11], ['coin', 14, 7], ['coin', 16, 7], ['coin', 48, 7], ['coin', 50, 7], ['coin', 65, 7], ['coin', 67, 7],
      ['dust', 44, 15, { drop: ['coin', 'coin', 'coin'] }], ['curtain', 70, 15, { drop: ['coin', 'heart'] }],
      ['hint', 46, 15, { text: '空っぽの鎧が、まだ誰かに仕えている… この屋敷を見ている「主」に？' }]],
    decor: [['knightstatue', 8, 15], ['knightstatue', 20, 15], ['knightstatue', 44, 15], ['knightstatue', 54, 15], ['weaponrack', 30, 15], ['banner', 12, 2, { top: 1 }], ['banner', 36, 2, { top: 1 }],
      ['banner', 60, 2, { top: 1 }], ['stainedglass', 26, 9], ['stainedglass', 50, 9], ['sconce', 4, 8, { light: 1 }], ['sconce', 32, 8, { light: 1 }], ['sconce', 68, 10, { light: 1 }]] },

  { id: 'barracks', jp: '従者の詰め所', en: 'SQUIRES\' BARRACKS', area: 'armory', theme: 'armory', tiles: 'a', cx: 15, cy: 0, cw: 1, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('B', 0, 8, 11); R.plat(2, 6, 11); R.plat(14, 19, 9); R.plat(17, 22, 5); },
    ents: [['skeleton', 16, 15, { foe: { skin: 'squire' } }], ['pan', 4, 11], ['coin', 18, 5], ['coin', 20, 5], ['heart', 16, 9], ['chair', 20, 15]],
    decor: [['trunk', 3, 15], ['table', 18, 15], ['weaponrack', 13, 15], ['banner', 6, 2, { top: 1 }], ['sconce', 10, 8, { light: 1 }]] },

  { id: 'smithy', jp: '鍛冶場', en: 'THE SMITHY', area: 'armory', theme: 'armory', tiles: 'a', cx: 14, cy: 1, cw: 2, ch: 1, dark: 0.48,
    build(R) { R.box(); R.open('T', 1, 8, 11); R.plat(28, 32, 11); R.plat(35, 39, 8); R.plat(31, 35, 6); R.plat(6, 12, 11); R.plat(16, 21, 8); R.plat(40, 45, 11); },
    ents: [['skeleton', 12, 15, { foe: { skin: 'squire' } }], ['skeleton', 40, 15, { foe: { skin: 'squire' } }], ['pan', 8, 11], ['pot', 20, 15], ['pan', 42, 11],
      ['coin', 17, 8], ['coin', 19, 8], ['dust', 4, 15, { drop: ['coin', 'coin'] }], ['dust', 44, 15, { drop: ['heart'] }], ['heartbig', 18.5, 6]],
    decor: [['forge', 8, 15], ['anvil', 16, 15], ['forge', 26, 15], ['anvil', 36, 15], ['weaponrack', 44, 15], ['hangpans', 22, 2, { top: 1 }], ['sconce', 32, 9, { light: 1 }]] },

  { id: 'watchtower', jp: '見張りの塔', en: 'WATCHTOWER', area: 'armory', theme: 'knights', tiles: 'a', cx: 16, cy: -2, cw: 1, ch: 2, dark: 0.55,
    build(R) { R.box(); R.open('L', 1, 11, 14); R.open('R', 1, 11, 14); R.plat(1, 4, 7); R.plat(6, 10, 29); R.plat(14, 18, 25); },
    ents: [['heartbig', 2.5, 6], ['coin', 7, 29], ['coin', 9, 29], ['coin', 15, 25], ['coin', 17, 25], ['gargoyle', 16, 25, { foe: { skin: 'griffin' } }],
      ['hint', 4, 33, { need: 'cling', text: 'はるか上に何か光っている… 壁をのぼれたら届くのに' }]],
    decor: [['banner', 12, 2, { top: 1 }], ['banner', 12, 20, { top: 1 }], ['window', 12, 13], ['sconce', 4, 27, { light: 1 }], ['sconce', 20, 27, { light: 1 }], ['knightstatue', 20, 33]] },

  { id: 'tiltyard', jp: '騎士団長の馬上試合場', en: 'THE TILTYARD', area: 'armory', theme: 'knights', tiles: 'a', cx: 16, cy: 0, cw: 1, ch: 1, dark: 0.4, boss: 'knight',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 16, 15], ['ability', 4, 15, { abil: 'cling', after: 'knight' }]],
    decor: [['banner', 6, 2, { top: 1 }], ['banner', 12, 2, { top: 1 }], ['banner', 18, 2, { top: 1 }], ['knightstatue', 2, 15], ['knightstatue', 22, 15], ['sconce', 9, 8, { light: 1 }], ['sconce', 15, 8, { light: 1 }]] },
);
