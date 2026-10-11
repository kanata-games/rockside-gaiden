// =====================================================================
//  room index (all areas are loaded by now), tile codes, room grid builder (DSL)
// =====================================================================
const ROOM_BY_ID = {}; for (const d of ROOM_DEFS) ROOM_BY_ID[d.id] = d;
// cell -> room id
const CELL_ROOM = {};
for (const d of ROOM_DEFS) for (let y = 0; y < d.ch; y++) for (let x = 0; x < d.cw; x++) CELL_ROOM[(d.cx + x) + ',' + (d.cy + y)] = d.id;
const TOTAL_CELLS = Object.keys(CELL_ROOM).length;
const BOSS_TOTAL = ROOM_DEFS.filter(d => d.boss).length;
const WORLD = (() => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const d of ROOM_DEFS) { x0 = Math.min(x0, d.cx); y0 = Math.min(y0, d.cy); x1 = Math.max(x1, d.cx + d.cw - 1); y1 = Math.max(y1, d.cy + d.ch - 1); } return { x0, y0, x1, y1, cols: x1 - x0 + 1, rows: y1 - y0 + 1 }; })();

// tile codes
const T_EMPTY = 0, T_SOLID = 1, T_PLAT = 2, T_SECRET = 3, T_LOCK = 4, T_GATE = 5;
const isSolidT = t => t === T_SOLID || t === T_SECRET || t === T_LOCK || t === T_GATE;
function buildRoomGrid(def) {
  const cols = def.cw * CC, rows = def.ch * CR, grid = new Uint8Array(cols * rows), gates = {};
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
    gate(c0, r0, c1, r1, id) { R.fill(c0, r0, c1, r1, T_GATE); const l = gates[id] || (gates[id] = []); for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (c >= 0 && c < cols && r >= 0 && r < rows) l.push(r * cols + c); },
  };
  def.build(R);
  return { cols, rows, grid, gates };
}
// openings on each edge, for the map + door matching: [{side, cell, a, b}] (a..b tile range along that edge)
function roomOpenings(def, G) {
  const out = [], { cols, rows, grid } = G, at = (c, r) => grid[r * cols + c];
  const scan = (side, n, get) => { let a = -1; for (let i = 0; i <= n; i++) { const open = i < n && (get(i) === T_EMPTY || get(i) === T_SECRET || get(i) === T_LOCK || get(i) === T_GATE); if (open && a < 0) a = i; if (!open && a >= 0) { out.push({ side, a, b: i - 1 }); a = -1; } } };
  scan('L', rows, r => at(0, r)); scan('R', rows, r => at(cols - 1, r)); scan('T', cols, c => at(c, 0)); scan('B', cols, c => at(c, rows - 1));
  for (const o of out) o.cell = Math.floor(o.a / (o.side === 'L' || o.side === 'R' ? CR : CC));
  return out;
}
