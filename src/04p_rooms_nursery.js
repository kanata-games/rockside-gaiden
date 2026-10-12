// =====================================================================
//  AREA 15 (v0.6): おもちゃ箱の子供部屋 (THE TOY NURSERY) - under the phantom kitchen, the nursery where the master's
//  dolls were once played with. The lights are out: カンテラ (from the bell board) is needed to go down.
//  Boss: びっくり箱 ボックスジャック (a big heart + its seal).
// =====================================================================
Object.assign(AREAS, { nursery: { jp: 'おもちゃ箱の子供部屋', short: '子供部屋', en: 'THE TOY NURSERY', music: 'nursery', col: '#e8a04a' } });
ROOM_DEFS.push(
  { id: 'toystair', jp: '子供部屋への階段', en: 'NURSERY STAIRWELL', area: 'nursery', theme: 'nursery', tiles: 'o', cx: 7, cy: 5, cw: 1, ch: 2, dark: 0.45,
    build(R) { R.box(); R.open('T', 0, 2, 5); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('L', 1, 11, 14); R.open('R', 1, 11, 14);
      R.plat(1, 7, 6); R.plat(9, 14, 10); R.plat(1, 4, 15); R.plat(19, 22, 15); R.plat(9, 14, 19); R.plat(2, 7, 23); R.plat(14, 19, 27); R.plat(6, 11, 30); },
    ents: [['save', 12, 33], ['rat', 6, 33, { foe: { skin: 'toymouse' } }], ['coin', 10, 10], ['coin', 12, 10], ['coin', 15, 27], ['coin', 17, 27]],
    decor: [['blocks', 18, 33], ['toydrum', 4, 33], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]] },

  { id: 'dollhouse', jp: 'ドールハウス', en: 'THE DOLLHOUSE', area: 'nursery', theme: 'nursery', tiles: 'o', cx: 5, cy: 5, cw: 2, ch: 1, dark: 0.4,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.plat(6, 12, 11); R.plat(16, 22, 7); R.plat(28, 34, 10); R.plat(38, 44, 7); R.solid(24, 13, 26, 14); },
    ents: [['heartbig', 40.5, 5], ['skeleton', 32, 15, { foe: { skin: 'tinsoldier' } }], ['rat', 12, 15, { foe: { skin: 'toymouse' } }], ['coin', 17, 7], ['coin', 19, 7], ['coin', 21, 7], ['bottle', 8, 11],
      ['hint', 20, 15, { text: '小さな家に、小さな椅子… 人形たちはここで遊ばれていたのかな' }]],
    decor: [['toychest', 4, 15], ['rockinghorse', 36, 15], ['blocks', 46, 15]] },

  { id: 'playroom', jp: 'あそび部屋', en: 'THE PLAYROOM', area: 'nursery', theme: 'nursery', tiles: 'o', cx: 8, cy: 5, cw: 3, ch: 1, dark: 0.4,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(6, 12, 11); R.plat(16, 22, 8); R.plat(28, 34, 11); R.plat(40, 46, 8); R.plat(52, 58, 11); R.plat(62, 68, 7); R.solid(36, 13, 38, 14); },
    ents: [['skeleton', 24, 15, { foe: { skin: 'tinsoldier' } }], ['skeleton', 56, 15, { foe: { skin: 'tinsoldier' } }], ['rat', 44, 15, { foe: { skin: 'toymouse' } }], ['rat', 14, 15, { foe: { skin: 'toymouse' } }],
      ['coin', 17, 8], ['coin', 19, 8], ['coin', 21, 8], ['coin', 63, 7], ['coin', 65, 7], ['plate', 30, 11], ['gear', 54, 11], ['dust', 48, 15, { drop: ['coin', 'heart'] }], ['dust', 68, 15, { drop: ['coin', 'coin'] }]],
    decor: [['rockinghorse', 10, 15], ['toychest', 40, 15], ['blocks', 60, 15], ['toydrum', 30, 15]] },

  { id: 'blockcastle', jp: '積み木の城', en: 'BUILDING-BLOCK CASTLE', area: 'nursery', theme: 'toybox', tiles: 'o', cx: 4, cy: 6, cw: 3, ch: 1, dark: 0.45,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.solid(14, 12, 17, 14); R.solid(30, 10, 33, 14); R.solid(46, 12, 49, 14);
      R.plat(6, 11, 10); R.plat(20, 26, 8); R.plat(36, 42, 7); R.plat(52, 58, 9); R.plat(62, 68, 11); },
    ents: [['skeleton', 24, 15, { foe: { skin: 'tinsoldier' } }], ['skeleton', 54, 15, { foe: { skin: 'tinsoldier' } }], ['bats', 40, 3, { n: 2 }], ['coin', 31, 9], ['coin', 32, 9], ['coin', 37, 7], ['coin', 39, 7], ['coin', 41, 7], ['heart', 64, 11]],
    decor: [['blocks', 8, 15], ['blocks', 40, 15], ['toychest', 60, 15]] },

  { id: 'trainline', jp: 'おもちゃの線路', en: 'TOY RAILWAY', area: 'nursery', theme: 'toybox', tiles: 'o', cx: 8, cy: 6, cw: 3, ch: 1, dark: 0.45,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(6, 12, 11); R.plat(18, 24, 8); R.plat(30, 36, 11); R.plat(42, 48, 8); R.plat(54, 60, 11); R.solid(26, 13, 28, 14); R.solid(50, 13, 52, 14); },
    ents: [['save', 64, 15], ['rat', 20, 15, { foe: { skin: 'toymouse' } }], ['rat', 40, 15, { foe: { skin: 'toymouse' } }], ['skeleton', 46, 15, { foe: { skin: 'tinsoldier' } }],
      ['coin', 19, 8], ['coin', 21, 8], ['coin', 23, 8], ['coin', 43, 8], ['coin', 45, 8], ['bottle', 32, 11], ['dust', 12, 15, { drop: ['heart'] }],
      ['hint', 66, 15, { text: 'ぜんまいを巻く音… この先の箱、ぜったい何か飛び出してくる' }]],
    decor: [['toydrum', 8, 15], ['rockinghorse', 34, 15], ['toychest', 58, 15]] },

  { id: 'jackroom', jp: 'びっくり箱の部屋', en: 'THE JACK-IN-THE-BOX', area: 'nursery', theme: 'nursery', tiles: 'o', cx: 11, cy: 6, cw: 1, ch: 1, dark: 0.35, boss: 'boxjack',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 15, 15]],
    decor: [['toychest', 2, 15], ['blocks', 19, 15]] },
);
