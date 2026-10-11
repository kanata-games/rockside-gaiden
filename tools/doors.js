// Audit: enemies placed near a side door (they would meet Kanata right at the entry point).
//   node tools/doors.js [tiles=7]
const { chromium } = require('playwright'); const path = require('path'); const SERVE = require('./serve.js');
(async () => { const N = +(process.argv[2] || 7); const srv = await SERVE.start(path.resolve(__dirname, '..')); const br = await chromium.launch(); const page = await br.newPage();
  await page.goto(srv.url + 'index.html'); await page.waitForTimeout(400);
  const out = await page.evaluate(N => { const FOES = new Set(['rat', 'bat', 'bats', 'gargoyle', 'puppet', 'skeleton', 'cursedbook', 'armor', 'puff', 'dish', 'sheet', 'crab', 'skullwisp', 'ghoul']); const res = [];
    for (const d of GAIDEN.ROOM_DEFS) { const G = GAIDEN.buildRoomGrid(d), ops = GAIDEN.roomOpenings(d, G).filter(o => o.side === 'L' || o.side === 'R');
      for (const [t, x, y] of d.ents || []) { if (!FOES.has(t)) continue;
        for (const o of ops) { const dx = o.side === 'L' ? x : G.cols - 1 - x; if (dx < N && y >= o.a - 4 && y <= o.b + 6) res.push(`${d.id}: ${t}@(${x},${y}) ${dx.toFixed(1)} tiles from ${o.side} door rows ${o.a}-${o.b}`); } } }
    return res; }, N);
  console.log(out.join('\n') || 'none'); await br.close(); srv.close(); })();
