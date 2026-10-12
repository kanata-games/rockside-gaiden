// =====================================================================
//  AREA 14 (v0.6): 絵の中の世界 (THE PAINTED WORLD) - a padlocked gilt frame in the auditorium ceiling opens
//  into a domain painted inside a painting: canvas floors, oil-paint seas, a sky of frames.
//  Way in: 鍵束 (the frame's padlock).  Boss: 絵の具ゴーレム パレットン (a big heart + its seal).
// =====================================================================
Object.assign(AREAS, { painted: { jp: '絵の中の世界', short: '絵画', en: 'THE PAINTED WORLD', music: 'painted', col: '#e86a8a' } });
ROOM_DEFS.push(
  { id: 'canvasgate', jp: '額縁の入口', en: 'THROUGH THE FRAME', area: 'painted', theme: 'canvas', tiles: 'p', cx: 1, cy: -3, cw: 1, ch: 2, dark: 0.25,
    build(R) { R.box(); R.open('B', 0, 8, 11); R.open('L', 1, 11, 14); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14);
      R.plat(13, 18, 29); R.plat(4, 9, 25); R.plat(13, 18, 21); R.plat(4, 9, 17); R.plat(1, 4, 15); R.plat(19, 22, 15); },
    ents: [['save', 16, 33], ['bats', 12, 8, { foe: { skin: 'inkbat' }, n: 2 }], ['coin', 5, 25], ['coin', 7, 25], ['coin', 14, 21], ['coin', 16, 21],
      ['hint', 4, 33, { text: '額縁をくぐったら、絵の中だった… ここも主の夢のつづき。絵の具のにおい' }]],
    decor: [['frame_empty', 12, 12], ['easel', 4, 33], ['splash', 18, 33], ['paintpot', 21, 33]] },

  { id: 'oilsea', jp: '油彩の海', en: 'SEA OF OILS', area: 'painted', theme: 'oils', tiles: 'p', cx: -1, cy: -2, cw: 2, ch: 1, dark: 0.3,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.solid(14, 13, 18, 14); R.solid(30, 13, 34, 14); R.plat(4, 9, 11); R.plat(20, 27, 9); R.plat(38, 44, 11); },
    ents: [['bats', 24, 4, { foe: { skin: 'inkbat' }, n: 2 }], ['puppet', 36, 15, { foe: { skin: 'brushdancer' } }], ['coin', 22, 9], ['coin', 25, 9], ['bottle', 40, 11], ['dust', 10, 15, { drop: ['coin', 'heart'] }]],
    decor: [['splash', 8, 15], ['splash', 26, 15], ['frame_empty', 22, 6], ['paintpot', 44, 15]] },

  { id: 'sketchroom', jp: '下書きの間', en: 'THE SKETCHBOOK', area: 'painted', theme: 'canvas', tiles: 'p', cx: -3, cy: -2, cw: 2, ch: 1, dark: 0.25,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(6, 12, 11); R.plat(16, 22, 7); R.plat(26, 32, 11); R.plat(36, 42, 8); },
    ents: [['puppet', 14, 15, { foe: { skin: 'brushdancer' } }], ['puppet', 34, 15, { foe: { skin: 'brushdancer' } }], ['coin', 17, 7], ['coin', 19, 7], ['coin', 21, 7], ['heart', 38, 8], ['book', 28, 11],
      ['hint', 24, 15, { text: '鉛筆の線だけの部屋… 描きかけのまま、主の気が変わったらしい' }]],
    decor: [['easel', 10, 15], ['easel', 40, 15], ['frame_empty', 24, 6]] },

  { id: 'skyline', jp: '額縁の空', en: 'SKY OF FRAMES', area: 'painted', theme: 'oils', tiles: 'p', cx: -3, cy: -3, cw: 4, ch: 1, dark: 0.2,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(84, 90, 11); R.plat(74, 80, 8); R.plat(62, 68, 11); R.plat(50, 56, 7); R.plat(38, 44, 11);
      R.plat(26, 32, 8); R.plat(14, 20, 11); R.plat(4, 10, 8); R.solid(22, 13, 24, 14); R.solid(46, 13, 48, 14); R.solid(70, 13, 72, 14); },
    ents: [['save', 86, 11], ['bats', 60, 4, { foe: { skin: 'inkbat' }, n: 2 }], ['bats', 30, 4, { foe: { skin: 'inkbat' }, n: 2 }], ['puppet', 54, 15, { foe: { skin: 'brushdancer' } }], ['puppet', 18, 15, { foe: { skin: 'brushdancer' } }],
      ['coin', 51, 7], ['coin', 53, 7], ['coin', 55, 7], ['coin', 27, 8], ['coin', 29, 8], ['plate', 76, 8], ['gear', 6, 8], ['dust', 40, 15, { drop: ['heart'] }]],
    decor: [['frame_empty', 12, 5], ['frame_empty', 36, 4], ['frame_empty', 60, 5], ['frame_empty', 82, 4], ['splash', 30, 15], ['splash', 66, 15], ['paintpot', 92, 15]] },

  { id: 'stilllife', jp: '静物画の部屋', en: 'STILL LIFE', area: 'painted', theme: 'canvas', tiles: 'p', cx: 2, cy: -3, cw: 2, ch: 1, dark: 0.3,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(8, 14, 11); R.plat(18, 24, 7); R.plat(30, 36, 10); R.plat(40, 45, 6); },
    ents: [['heartbig', 42.5, 4], ['bats', 26, 4, { foe: { skin: 'inkbat' }, n: 2 }], ['puppet', 32, 15, { foe: { skin: 'brushdancer' } }], ['coin', 19, 7], ['coin', 21, 7], ['coin', 23, 7], ['bottle', 10, 11]],
    decor: [['easel', 6, 15], ['paintpot', 20, 15], ['splash', 36, 15], ['frame_empty', 30, 5]] },

  { id: 'paintthrone', jp: 'パレットの玉座', en: 'THE PALETTE THRONE', area: 'painted', theme: 'canvas', tiles: 'p', cx: -4, cy: -3, cw: 1, ch: 1, dark: 0.25, boss: 'paintgolem',
    build(R) { R.box(); R.open('R', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 10, 15]],
    decor: [['frame_empty', 2, 5], ['frame_empty', 16, 5], ['splash', 4, 15]] },
);
