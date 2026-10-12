// Boss balance runs: the bot fights each boss N times WITHOUT god mode (8x speed) and reports
// wins / deaths / hits taken / fight length.  node tools/bossrun.js [runs=4] [kinds=chandelier,golem,rose,clock] [--god]
const { chromium } = require('playwright'); const path = require('path');
const SERVE = require('./serve.js'); const BOT = require('./bossbot.js'); const ROOT = path.resolve(__dirname, '..');
const BOSSES = { chandelier: ['ballroom', ''], golem: ['washroom', 'float,turbo'], rose: ['rosebed', 'float,turbo,djump'], clock: ['clockroom', 'float,turbo,djump,phase'], organ: ['choir', 'float,turbo,djump'], serpent: ['yubune', 'float,turbo,djump,phase'],
  marionette: ['stage', 'float,turbo,djump,phase'], orrery: ['dome', 'float,turbo,djump,phase'], chronoa: ['clockheart', 'float,turbo,djump,phase,tank'],
  tarant: ['winethrone', 'float,turbo,djump,phase'], knight: ['tiltyard', 'float,turbo,djump,phase,keyring'],
  bellboard: ['bellhall', 'float,turbo,djump,phase,keyring'], angler: ['abyss', 'float,turbo,djump,phase,keyring,lantern'],
  galecock: ['weathertop', 'float,turbo,djump,phase,keyring,lantern,cling'],
  paintgolem: ['paintthrone', 'float,turbo,djump,phase,keyring,lantern,cling'], boxjack: ['jackroom', 'float,turbo,djump,phase,keyring,lantern,cling'] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fight(browser, url, kind, god) {
  const [roomId, abil] = BOSSES[kind];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(url + 'index.html?room=' + roomId + '&x=2&y=16' + (abil ? '&abil=' + abil : '') + (god ? '&god=1' : ''));
  await page.waitForFunction(() => window.GAIDEN && GAIDEN.state === 'play', null, { timeout: 8000 });
  await page.evaluate(BOT); await page.evaluate(() => { window.__speed = 8; });
  const t0 = Date.now(); let res;
  while (Date.now() - t0 < 150000) {
    res = await page.evaluate(() => { const b = GAIDEN.boss, P = GAIDEN.P; return { st: GAIDEN.state, bs: b ? b.state : 'none', hp: P.hp, dead: P.dead || GAIDEN.state === 'gameover', bhp: b ? Math.round(b.hp) : 0, rage: b && b.rage, f: window.__botStats.frames, hits: window.__botStats.hits, dmg: window.__botStats.dmg || 0, causes: window.__botStats.causes, spits: window.__botStats.spits, beaten: !!window.__botStats.won || GAIDEN.progress.bosses.has(b ? b.kind : ''), lh: GAIDEN.stats.lastHurt, px: Math.round(P.x), py: Math.round(P.y), room: GAIDEN.room.id }; });
    if (res.beaten || res.dead || res.st === 'clear' || res.bs === 'done') break;
    await sleep(250);
  }
  await page.close();
  return { ...res, win: res.beaten || res.st === 'clear' || res.bs === 'done', secs: Math.round(res.f / 60), errs };
}
(async () => {
  const runs = +(process.argv[2] || 4), kinds = (process.argv[3] || Object.keys(BOSSES).join(',')).split(','), god = process.argv.includes('--god');
  const srv = await SERVE.start(ROOT); const browser = await chromium.launch(); let allErr = 0;
  for (const k of kinds) {
    const rs = [];
    for (let i = 0; i < runs; i++) { const r = await fight(browser, srv.url, k, god); rs.push(r); allErr += r.errs.length;
      console.log(`  ${k} #${i + 1}: ${r.win ? 'WIN ' : r.dead ? 'DIED' : 'TIMEOUT'} fight ${r.secs}s, hits ${r.hits}, dmg ${r.dmg}, hp left ${r.hp}, boss hp ${r.bhp}, spits ${r.spits}` + (r.errs.length ? ' ERR ' + r.errs[0] : '') + (r.dead ? ` [last hurt: ${r.lh} @${r.room} ${r.px},${r.py} bs=${r.bs}]` : ''));
      if (process.env.CAUSES) console.log('     ' + r.causes.join(' ')); }
    const w = rs.filter(r => r.win).length, avgHits = (rs.reduce((a, r) => a + r.hits, 0) / rs.length).toFixed(1), avgDmg = (rs.reduce((a, r) => a + r.dmg, 0) / rs.length).toFixed(1), avgT = Math.round(rs.reduce((a, r) => a + r.secs, 0) / rs.length);
    console.log(`${k.toUpperCase()}: ${w}/${rs.length} wins, avg hits ${avgHits}, avg dmg ${avgDmg}/10, avg fight ${avgT}s`);
  }
  await browser.close(); srv.close(); process.exit(allErr ? 1 : 0);
})();
