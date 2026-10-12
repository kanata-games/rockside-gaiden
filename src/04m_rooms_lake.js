// =====================================================================
//  AREA 12 (v0.5.1): 地底の湖 (UNDERGROUND LAKE) - far below the servants' stair, in the roots of the domain.
//  Way in: the hole in the servants' stair floor is choked with black fog (needs the カンテラ LANTERN).
//  Boss: 灯り鮟鱇 ランタンアングラー (a big heart + the lake seal). Black-fog walls also guard its lair.
// =====================================================================
Object.assign(AREAS, { lake: { jp: '地底の湖', short: '地底湖', en: 'UNDERGROUND LAKE', music: 'lake', col: '#2a8a8a' } });
ROOM_DEFS.push(
  { id: 'lakeshaft', jp: '湖への縦穴', en: 'SHAFT TO THE LAKE', area: 'lake', theme: 'lake', tiles: 'l', cx: -6, cy: 5, cw: 1, ch: 2, dark: 0.72,
    build(R) { R.box(); R.open('T', 0, 9, 12); R.open('R', 0, 11, 14); R.open('R', 1, 11, 14); R.open('L', 1, 11, 14);
      R.plat(3, 8, 29); R.plat(13, 18, 25); R.plat(4, 9, 21); R.plat(12, 17, 17); R.plat(18, 22, 15); R.plat(14, 18, 11); R.plat(4, 8, 8); },
    ents: [['save', 12, 33], ['skullwisp', 10, 22, { foe: { skin: 'lakewisp' } }], ['coin', 5, 29], ['coin', 7, 29], ['coin', 15, 11], ['coin', 17, 11],
      ['hint', 16, 33, { text: 'しずくの音が反響している… ここは主の夢の、いちばん深いところ' }]],
    decor: [['stalactite', 6, 2, { top: 1 }], ['stalactite', 18, 2, { top: 1 }], ['stalagmite', 20, 33], ['glowmoss', 6, 33], ['glowmoss', 15, 25], ['lakerock', 3, 33, { light: 1 }]] },

  { id: 'shore', jp: '地底湖のほとり', en: 'LAKESHORE', area: 'lake', theme: 'lake', tiles: 'l', cx: -5, cy: 6, cw: 2, ch: 1, dark: 0.72,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.plat(6, 11, 11); R.plat(15, 20, 7); R.plat(28, 33, 11); R.plat(37, 42, 7); },
    ents: [['crab', 18, 15, { foe: { skin: 'blindcrab' } }], ['crab', 34, 15, { foe: { skin: 'blindcrab' } }], ['skullwisp', 26, 5, { foe: { skin: 'lakewisp' } }],
      ['bottle', 8, 11], ['coin', 16, 7], ['coin', 18, 7], ['coin', 38, 7], ['coin', 40, 7], ['dust', 44, 15, { drop: ['heart'] }]],
    decor: [['rowboat', 12, 15], ['stalagmite', 4, 15], ['stalagmite', 44, 15], ['stalactite', 10, 2, { top: 1 }], ['stalactite', 32, 2, { top: 1 }], ['glowmoss', 22, 15], ['glowmoss', 36, 15],
      ['lakerock', 28, 15, { light: 1 }]] },

  { id: 'grotto', jp: '光る苔の洞窟', en: 'GLOWMOSS GROTTO', area: 'lake', theme: 'grotto', tiles: 'l', cx: -3, cy: 6, cw: 3, ch: 1, dark: 0.8,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('T', 0, 9, 12); R.gate(71, 11, 71, 14, 'dark_abyss');
      R.plat(6, 11, 11); R.plat(12, 16, 7); R.plat(20, 26, 11); R.plat(31, 37, 8); R.plat(42, 48, 11); R.plat(53, 59, 8); R.plat(63, 68, 11); },
    ents: [['crab', 16, 15, { foe: { skin: 'blindcrab' } }], ['crab', 46, 15, { foe: { skin: 'blindcrab' } }], ['skullwisp', 34, 5, { foe: { skin: 'lakewisp' } }], ['skullwisp', 58, 5, { foe: { skin: 'lakewisp' } }],
      ['bottle', 22, 11], ['crystal', 44, 11], ['coin', 32, 8], ['coin', 34, 8], ['coin', 54, 8], ['coin', 56, 8], ['dust', 28, 15, { drop: ['coin', 'coin'] }], ['dust', 62, 15, { drop: ['heart'] }],
      ['hint', 66, 15, { need: 'lantern', text: '奥は真っ黒な霧… 何か大きなものが、光をまっている' }]],
    decor: [['glowmoss', 4, 15], ['glowmoss', 18, 15], ['glowmoss', 38, 15], ['glowmoss', 52, 15], ['glowmoss', 66, 15], ['stalactite', 24, 2, { top: 1 }], ['stalactite', 46, 2, { top: 1 }],
      ['stalagmite', 30, 15], ['stalagmite', 60, 15], ['lakerock', 40, 15, { light: 1 }]] },

  { id: 'stalacvault', jp: '鍾乳洞の天井', en: 'STALACTITE VAULT', area: 'lake', theme: 'lake', tiles: 'l', cx: -5, cy: 5, cw: 3, ch: 1, dark: 0.75,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.open('B', 2, 9, 12);
      R.plat(4, 9, 11); R.plat(14, 19, 8); R.plat(24, 29, 11); R.plat(34, 39, 8); R.plat(44, 49, 11); R.plat(56, 62, 9); R.plat(64, 70, 11); },
    ents: [['bats', 20, 4, { foe: { skin: 'bellbat' }, n: 2 }], ['skullwisp', 40, 5, { foe: { skin: 'lakewisp' } }], ['skullwisp', 60, 5, { foe: { skin: 'lakewisp' } }],
      ['crystal', 16, 8], ['crystal', 36, 8], ['coin', 25, 11], ['coin', 27, 11], ['coin', 45, 11], ['coin', 47, 11], ['dust', 52, 15, { drop: ['coin', 'heart'] }]],
    decor: [['stalactite', 8, 2, { top: 1 }], ['stalactite', 20, 2, { top: 1 }], ['stalactite', 32, 2, { top: 1 }], ['stalactite', 44, 2, { top: 1 }], ['stalactite', 58, 2, { top: 1 }],
      ['stalagmite', 12, 15], ['stalagmite', 40, 15], ['glowmoss', 28, 15], ['glowmoss', 54, 15], ['lakerock', 66, 15, { light: 1 }]] },

  { id: 'eelpond', jp: '盲魚の池', en: 'BLINDFISH POOL', area: 'lake', theme: 'grotto', tiles: 'l', cx: -2, cy: 5, cw: 2, ch: 1, dark: 0.78,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(8, 13, 11); R.plat(17, 22, 7); R.plat(28, 33, 10); R.plat(38, 44, 7); },
    ents: [['heartbig', 41, 5], ['crab', 24, 15, { foe: { skin: 'blindcrab' } }], ['skullwisp', 30, 5, { foe: { skin: 'lakewisp' } }], ['crystal', 30, 10], ['coin', 18, 7], ['coin', 20, 7]],
    decor: [['rowboat', 32, 15], ['glowmoss', 6, 15], ['glowmoss', 44, 15], ['stalactite', 14, 2, { top: 1 }], ['stalactite', 36, 2, { top: 1 }], ['lakerock', 22, 15, { light: 1 }]] },

  { id: 'abyss', jp: '灯りの淵', en: 'ABYSS OF THE LURE', area: 'lake', theme: 'grotto', tiles: 'l', cx: 0, cy: 6, cw: 1, ch: 1, dark: 0.6, boss: 'angler',
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 14, 15], ['heartbig', 19.5, 9]],
    decor: [['glowmoss', 4, 15], ['glowmoss', 20, 15], ['stalactite', 6, 2, { top: 1 }], ['stalactite', 18, 2, { top: 1 }], ['lakerock', 12, 15, { light: 1 }]] },
);
