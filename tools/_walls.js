const { chromium } = require('playwright'); const SERVE = require('./serve.js');
(async () => { const srv = await SERVE.start(require('path').resolve(__dirname, '..')); const br = await chromium.launch(); const page = await br.newPage();
  await page.goto(srv.url + 'index.html'); await page.waitForTimeout(300);
  const q = JSON.parse(process.argv[2]);
  console.log(await page.evaluate(q => q.map(([id, side, cell]) => { const d = GAIDEN.ROOM_BY_ID[id], G = GAIDEN.buildRoomGrid(d); const c = side === 'L' ? 0 : G.cols - 1, c2 = side === 'L' ? 1 : G.cols - 2;
    let s = id + ' ' + side + cell + ': '; for (let r = cell * 18; r < cell * 18 + 18; r++) s += G.grid[r * G.cols + c] + '' + G.grid[r * G.cols + c2] + ' '; return s; }).join('\n'), q));
  await br.close(); srv.close(); })();
