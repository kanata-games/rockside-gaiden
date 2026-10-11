
// =====================================================================
//  ROOMS  -  幽霊屋敷 東棟 (EAST WING). One map cell = one screen (24 x 18 tiles).
//  Each room is built with a tiny DSL so it stays easy to edit:
//    R.box()                  walls all round (ceiling rows 0-1, floor rows 15-17 of every bottom cell)
//    R.open(side, cell, a, b) carve a passage: side 'L'/'R' = rows a..b of that cell row; 'T'/'B' = cols a..b of that cell column
//    R.plat(c0, c1, r)        one-way wooden platform        R.solid(c0, r0, c1, r1) solid block      R.clear(...) empty
//    R.secret(c, r0, r1)      secret wall (solid until revealed)   R.lock(c, r0, r1) locked door (opens with the key)
//  ents:  [type, col, row, opts]  feet / bottom at the top edge of 'row' (floaters: centre)
//  decor: [sprite, col, row, opts] bottom-centre at (col*16, row*16); opts.hang draws a chain up to the ceiling
//  Rooms are joined automatically by map position: an opening on an edge leads to the room in the neighbouring cell.
// =====================================================================
const AREA_JP = '幽霊屋敷 東棟', AREA_EN = 'HAUNTED MANSION - EAST WING';
const ROOM_DEFS = [
  { id: 'foyer', jp: '玄関ホール', en: 'GRAND FOYER', theme: 'foyer', cx: 0, cy: 1, cw: 2, ch: 1, dark: 0.42,
    build(R) { R.box(); R.open('R', 0, 11, 14); R.plat(5, 11, 11); R.plat(14, 19, 7); R.plat(24, 30, 11); R.plat(34, 41, 7); },
    ents: [['start', 3, 15], ['save', 8, 15], ['book', 7, 11], ['book', 10, 11], ['coin', 16, 7], ['coin', 17, 7], ['coin', 18, 7],
      ['curtain', 21, 15, { drop: ['coin', 'coin', 'coin'] }], ['dust', 27, 15, { drop: ['coin'] }], ['dust', 38, 15, { drop: ['heart'] }],
      ['vase', 44, 15, { drop: ['coin', 'coin'] }], ['puff', 31, 9], ['coin', 36, 7], ['coin', 38, 7], ['coin', 40, 7]],
    decor: [['window_wide', 13, 10], ['window_wide', 32, 10], ['portrait_lord', 3, 8], ['portrait_big', 24, 9], ['portrait_lady', 45, 9],
      ['sconce', 9, 8.5, { light: 1 }], ['sconce', 18, 11, { light: 1 }], ['sconce', 28, 8.5, { light: 1 }], ['sconce', 39, 11, { light: 1 }],
      ['chandelier_deco', 16, 5, { hang: 1, light: 2 }], ['chandelier_deco', 36, 4.5, { hang: 1, light: 2 }], ['clock', 33, 15], ['cobweb', 1, 2, { top: 1 }],
      ['rug', 22, 15], ['rug', 30, 15]] },

  { id: 'gallery', jp: '肖像画の回廊', en: 'PORTRAIT GALLERY', theme: 'gallery', cx: 2, cy: 1, cw: 3, ch: 1, dark: 0.5,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.solid(30, 13, 41, 14); R.plat(10, 16, 11); R.plat(18, 23, 7); R.plat(55, 61, 11); R.plat(48, 53, 7); },
    ents: [['book', 5, 15], ['book', 26, 15], ['book', 43, 15], ['puff', 14, 8], ['armor', 38, 13], ['puff', 57, 8],
      ['coin', 19, 7], ['coin', 21, 7], ['dust', 22, 15, { drop: ['coin', 'coin'] }], ['vase', 33, 13, { drop: ['heart'] }],
      ['curtain', 65, 15, { drop: ['coin', 'coin', 'coin', 'coin'] }], ['coin', 49, 7], ['coin', 51, 7], ['candle', 59, 11]],
    decor: [['portrait_lord', 6, 9.5], ['portrait_lady', 12, 9.5], ['portrait_land', 27, 9], ['portrait_big', 36, 10], ['portrait_lady', 45, 9.5],
      ['portrait_lord', 58, 9.5], ['portrait_land', 67, 9], ['sconce', 9, 11, { light: 1 }], ['sconce', 24, 11, { light: 1 }], ['sconce', 41, 9, { light: 1 }],
      ['sconce', 54, 11, { light: 1 }], ['sconce', 70, 11, { light: 1 }], ['pillar', 24, 15], ['pillar', 48, 15], ['cobweb', 70.75, 2, { top: 1, flip: 1 }]] },

  { id: 'library', jp: 'ささやく書斎', en: 'WHISPERING LIBRARY', theme: 'library', cx: 5, cy: 0, cw: 1, ch: 2, dark: 0.52,
    build(R) { R.box(); R.open('L', 1, 11, 14); R.open('R', 0, 11, 14); R.open('B', 0, 11, 13);
      R.solid(17, 15, 22, 16); R.plat(4, 9, 29); R.plat(13, 20, 25); R.plat(4, 10, 21); R.plat(12, 16, 17); R.plat(3, 8, 13); R.plat(9, 13, 9); },
    ents: [['book', 6, 29], ['book', 15, 25], ['book', 18, 25], ['puff', 16, 21], ['puff', 7, 15], ['coin', 4, 13], ['coin', 6, 13], ['heart', 11, 9],
      ['dust', 20, 15, { drop: ['coin', 'coin'] }], ['candle', 7, 21]],
    decor: [['bookshelf', 4, 33], ['bookshelf', 20, 33], ['bookshelf', 17, 25], ['bookshelf', 7, 21], ['bookshelf', 20, 15], ['window', 12, 13], ['clock', 9, 33],
      ['sconce', 11, 28, { light: 1 }], ['sconce', 2, 18, { light: 1 }], ['sconce', 15, 6, { light: 1 }], ['candelabra', 6, 29, { light: 1 }], ['cobweb', 1, 2, { top: 1 }]] },

  { id: 'dining', jp: '幽霊たちの食堂', en: 'PHANTOM DINING HALL', theme: 'dining', cx: 6, cy: 0, cw: 2, ch: 1, dark: 0.46,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.secret(47, 11, 14); R.plat(13, 20, 13); R.plat(25, 32, 13); R.plat(28, 33, 9); R.plat(20, 25, 6); R.plat(5, 9, 10); },
    ents: [['plate', 14, 13], ['plate', 17, 13], ['plate', 26, 13], ['plate', 30, 13], ['candle', 19, 13], ['dish', 12, 7], ['dish', 36, 7], ['puff', 24, 10],
      ['key', 22.5, 6], ['coin', 6, 10], ['coin', 8, 10], ['dust', 40, 15, { drop: ['coin', 'heart'] }], ['curtain', 46.5, 15, { secret: 1 }], ['vase', 3, 15, { drop: ['coin', 'coin'] }]],
    decor: [['table', 16.5, 15], ['table', 28.5, 15], ['chair', 12.5, 15], ['chair', 21, 15, { flip: 1 }], ['chair', 24.5, 15], ['chair', 33, 15, { flip: 1 }],
      ['candelabra', 16.5, 13, { light: 1 }], ['candelabra', 28.5, 13, { light: 1 }], ['window_wide', 9, 9.5], ['window_wide', 39, 9.5],
      ['chandelier_deco', 24, 3.5, { hang: 1, light: 2 }], ['portrait_lady', 3, 8], ['sconce', 15, 8, { light: 1 }], ['sconce', 34, 8, { light: 1 }]] },

  { id: 'vault', jp: '隠し宝物庫', en: 'HIDDEN VAULT', theme: 'vault', cx: 8, cy: 0, cw: 1, ch: 1, dark: 0.4, secret: true,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(3, 7, 11); R.plat(16, 20, 11); },
    ents: [['heartbig', 12, 13], ['coin', 4, 11], ['coin', 6, 11], ['coin', 17, 11], ['coin', 19, 11], ['coin', 9, 15], ['coin', 15, 15], ['crystal', 12, 15]],
    decor: [['pedestal', 12, 15], ['portrait_big', 12, 9], ['candelabra', 5, 11, { light: 1 }], ['candelabra', 18, 11, { light: 1 }], ['cobweb', 22.75, 2, { top: 1, flip: 1 }]] },

  { id: 'cellar', jp: '地下ワイン蔵', en: 'WINE CELLAR', theme: 'cellar', cx: 5, cy: 2, cw: 2, ch: 1, dark: 0.6, tiles: 'c',
    build(R) { R.box(); R.open('T', 0, 11, 13); R.open('R', 0, 11, 14); R.plat(10, 14, 7); R.plat(3, 8, 11); R.plat(20, 26, 11); R.plat(36, 42, 11); R.plat(29, 33, 7); },
    ents: [['puff', 22, 8], ['armor', 30, 15], ['puff', 40, 8], ['candle', 5, 11], ['candle', 23, 11], ['candle', 39, 11], ['dust', 16, 15, { drop: ['coin', 'coin'] }],
      ['dust', 44, 15, { drop: ['heart'] }], ['coin', 30, 7], ['coin', 32, 7], ['vase', 27, 15, { drop: ['coin', 'coin', 'coin'] }]],
    decor: [['winerack', 6, 15], ['winerack', 19, 15], ['barrel', 24, 15], ['barrel', 34, 15], ['barrel', 36, 15], ['winerack', 42, 15],
      ['candelabra', 5, 11, { light: 1 }], ['candelabra', 39, 11, { light: 1 }], ['sconce', 28, 10, { light: 1 }], ['cobweb', 1, 2, { top: 1 }], ['cobweb', 46.75, 2, { top: 1, flip: 1 }]] },

  { id: 'ante', jp: '舞踏会場の控え室', en: 'BALLROOM ANTECHAMBER', theme: 'ballroom', cx: 7, cy: 2, cw: 1, ch: 1, dark: 0.45,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.open('R', 0, 11, 14); R.lock(23, 11, 14); },
    ents: [['save', 9, 15], ['candle', 15, 15], ['book', 4, 15]],
    decor: [['portrait_big', 12, 9], ['sconce', 5, 9, { light: 1 }], ['sconce', 19, 9, { light: 1 }], ['clock', 17, 15], ['rug', 12, 15]] },

  { id: 'ballroom', jp: '月夜の舞踏会場', en: 'MOONLIT BALLROOM', theme: 'ballroom', cx: 8, cy: 2, cw: 1, ch: 1, dark: 0.38, boss: true,
    build(R) { R.box(); R.open('L', 0, 11, 14); R.plat(2, 5, 11); R.plat(18, 21, 11); },
    ents: [['boss', 12, 2]],
    decor: [['window_wide', 4, 9.5], ['window_wide', 20, 9.5], ['window', 12, 8.5], ['sconce', 8, 9, { light: 1 }], ['sconce', 16, 9, { light: 1 }], ['rug', 12, 15]] },
];
const ROOM_BY_ID = {}; for (const d of ROOM_DEFS) ROOM_BY_ID[d.id] = d;
// cell -> room id
const CELL_ROOM = {};
for (const d of ROOM_DEFS) for (let y = 0; y < d.ch; y++) for (let x = 0; x < d.cw; x++) CELL_ROOM[(d.cx + x) + ',' + (d.cy + y)] = d.id;
const TOTAL_CELLS = Object.keys(CELL_ROOM).length;

// tile codes
const T_EMPTY = 0, T_SOLID = 1, T_PLAT = 2, T_SECRET = 3, T_LOCK = 4, T_GATE = 5;
const isSolidT = t => t === T_SOLID || t === T_SECRET || t === T_LOCK || t === T_GATE;
function buildRoomGrid(def) {
  const cols = def.cw * CC, rows = def.ch * CR, grid = new Uint8Array(cols * rows);
  const set = (c, r, t) => { if (c >= 0 && c < cols && r >= 0 && r < rows) grid[r * cols + c] = t; };
  const R = {
    fill(c0, r0, c1, r1, t) { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, t); },
    box() {
      R.fill(0, 0, cols - 1, 1, T_SOLID); R.fill(0, 0, 0, rows - 1, T_SOLID); R.fill(cols - 1, 0, cols - 1, rows - 1, T_SOLID);
      R.fill(0, rows - 3, cols - 1, rows - 1, T_SOLID);
    },
    open(side, cell, a, b) {
      if (side === 'L') R.fill(0, cell * CR + a, 0, cell * CR + b, T_EMPTY);
      else if (side === 'R') R.fill(cols - 1, cell * CR + a, cols - 1, cell * CR + b, T_EMPTY);
      else if (side === 'T') R.fill(cell * CC + a, 0, cell * CC + b, 1, T_EMPTY);
      else if (side === 'B') R.fill(cell * CC + a, rows - 3, cell * CC + b, rows - 1, T_EMPTY);
    },
    plat(c0, c1, r) { R.fill(c0, r, c1, r, T_PLAT); },
    solid(c0, r0, c1, r1) { R.fill(c0, r0, c1, r1, T_SOLID); },
    clear(c0, r0, c1, r1) { R.fill(c0, r0, c1, r1, T_EMPTY); },
    secret(c, r0, r1) { R.fill(c, r0, c, r1, T_SECRET); },
    lock(c, r0, r1) { R.fill(c, r0, c, r1, T_LOCK); },
  };
  def.build(R);
  return { cols, rows, grid };
}
// openings on each edge, for the map + door matching: [{side, cell, a, b}] (a..b tile range along that edge)
function roomOpenings(def, G) {
  const out = [], { cols, rows, grid } = G, at = (c, r) => grid[r * cols + c];
  const scan = (side, n, get) => { let a = -1; for (let i = 0; i <= n; i++) { const open = i < n && (get(i) === T_EMPTY || get(i) === T_SECRET || get(i) === T_LOCK); if (open && a < 0) a = i; if (!open && a >= 0) { out.push({ side, a, b: i - 1 }); a = -1; } } };
  scan('L', rows, r => at(0, r)); scan('R', rows, r => at(cols - 1, r)); scan('T', cols, c => at(c, 0)); scan('B', cols, c => at(c, rows - 1));
  for (const o of out) o.cell = Math.floor(o.a / (o.side === 'L' || o.side === 'R' ? CR : CC));
  return out;
}
