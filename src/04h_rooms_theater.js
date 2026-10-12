
// =====================================================================
//  AREA 7 (v0.4): 人形劇場 (PUPPET THEATER) - above the portrait gallery. Way in: the hole in the gallery
//  ceiling (needs にだんジャンプ). Boss: 人形座長 ストリングス (holds one seal of the clock heart).
// =====================================================================
ROOM_DEFS.push(
  { id: 'lobby', jp: '劇場のロビー', en: 'THEATER LOBBY', area: 'theater', theme: 'theater', tiles: 'w', cx: 2, cy: 0, cw: 2, ch: 1, dark: 0.42,
    vel: 'theater', velAt: [44, 15],
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('B', 1, 10, 13); R.open('T', 0, 8, 11);
      R.plat(38, 43, 12); R.plat(20, 25, 12); R.plat(13, 18, 9); R.plat(6, 11, 6); R.plat(28, 32, 8); },
    ents: [['save', 30, 15], ['puppet', 16, 15, { foe: { skin: 'dancer' } }], ['puppet', 36, 15, { foe: { skin: 'dancer' } }], ['coin', 29, 8], ['coin', 31, 8],
      ['plate', 22, 12], ['chair', 4, 15], ['bottle', 41, 12], ['dust', 44, 15, { drop: ['coin', 'coin'] }], ['curtain', 2.5, 15, { drop: ['coin', 'heart'] }], ['vase', 24, 15, { drop: ['coin', 'coin'] }]],
    decor: [['stagecurtain', 9, 15], ['portrait_big', 24, 9], ['masks', 34, 8], ['chandelier_deco', 24, 3.5, { hang: 1, light: 2 }], ['sconce', 18, 8, { light: 1 }], ['sconce', 40, 8, { light: 1 }],
      ['rug', 30, 15], ['rug', 37, 15], ['pillar', 12, 15], ['pillar', 46, 15], ['cobweb', 46.75, 2, { top: 1, flip: 1 }]] },

  { id: 'wings', jp: '舞台袖', en: 'BACKSTAGE WINGS', area: 'theater', theme: 'stage', tiles: 'w', cx: 4, cy: 0, cw: 1, ch: 1, dark: 0.55,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(4, 9, 11); R.plat(12, 16, 9); R.plat(17, 21, 6); },
    ents: [['heartbig', 19, 4], ['puppet', 12, 15, { foe: { skin: 'dancer' } }], ['puppet', 18, 15, { foe: { skin: 'dancer' } }], ['chair', 6, 11], ['plate', 14, 9], ['coin', 20, 15], ['coin', 21, 15],
      ['curtain', 21.5, 15, { drop: ['coin', 'coin', 'coin'] }]],
    decor: [['stagecurtain', 4, 15], ['masks', 15, 11], ['dollshelf', 10, 15], ['footlight', 14, 15, { light: 1 }], ['sconce', 20, 9, { light: 1 }], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]] },

  { id: 'audience', jp: '観客席', en: 'AUDITORIUM', area: 'theater', theme: 'theater', tiles: 'w', cx: 1, cy: -1, cw: 3, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('B', 1, 8, 11); R.open('R', 0, 11, 14); R.open('T', 0, 8, 11); R.gate(8, 0, 11, 1, 'ring_paint'); R.plat(8, 11, 6);   // v0.6: padlocked gilt frame up into the painting
      R.plat(4, 12, 12); R.plat(14, 22, 10); R.plat(38, 46, 12); R.plat(50, 58, 10); R.plat(60, 68, 12); R.plat(26, 30, 7); R.plat(43, 48, 6); },
    ents: [['puppet', 10, 15, { foe: { skin: 'dancer' } }], ['puppet', 44, 15, { foe: { skin: 'dancer' } }], ['puppet', 62, 15, { foe: { skin: 'dancer' } }],
      ['bats', 54, 4, { foe: { skin: 'maskbat' }, n: 3 }], ['chair', 6, 12], ['chair', 18, 10], ['chair', 52, 10], ['plate', 40, 12], ['book', 64, 12],
      ['coin', 27, 7], ['coin', 29, 7], ['coin', 44, 6], ['coin', 46, 6], ['dust', 24, 15, { drop: ['coin', 'coin'] }], ['dust', 58, 15, { drop: ['heart'] }], ['bottle', 68, 15],
      ['hint', 69, 15, { text: '舞台の上から、糸のきしむ音がする…' }]],
    decor: [['masks', 36, 9], ['portrait_big', 12, 8], ['portrait_big', 60, 8], ['chandelier_deco', 20, 3.5, { hang: 1, light: 2 }], ['chandelier_deco', 52, 3.5, { hang: 1, light: 2 }],
      ['sconce', 4, 8, { light: 1 }], ['sconce', 34, 10, { light: 1 }], ['sconce', 68, 8, { light: 1 }], ['stagecurtain', 70, 15], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'stage', jp: '人形劇場の舞台', en: 'THE MARIONETTE STAGE', area: 'theater', theme: 'stage', tiles: 'w', cx: 4, cy: -1, cw: 1, ch: 1, dark: 0.38, boss: 'marionette',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 16, 15]],
    decor: [['stagecurtain', 2, 15], ['stagecurtain', 22, 15, { flip: 1 }], ['footlight', 6, 15, { light: 1 }], ['footlight', 10, 15, { light: 1 }], ['footlight', 14, 15, { light: 1 }], ['footlight', 18, 15, { light: 1 }],
      ['masks', 12, 5]] },
);
