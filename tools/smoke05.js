const { chromium } = require('playwright'); const path = require('path');
const SERVE = require('./serve.js'); const BOT = require('./bossbot.js'); const ROOT = '/workspace/kanata-gaiden';
const rooms = process.argv[2].split(','), bosses = (process.argv[3] || '').split(',').filter(Boolean);
(async () => {
  const srv = await SERVE.start(ROOT); const browser = await chromium.launch(); const errs = [];
  for (const r of rooms) { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); const page = await ctx.newPage(); page.on('pageerror', e => errs.push(r + ': ' + e.message));
    await page.goto(srv.url + 'index.html?room=' + r + '&x=3&y=16&god=1&abil=float,turbo,djump,phase,keyring'); await page.waitForTimeout(1200); await ctx.close(); }
  for (const spec of bosses) { const [kind, room, abil] = spec.split(':');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); const page = await ctx.newPage(); page.on('pageerror', e => errs.push(kind + ': ' + e.message));
    await page.goto(srv.url + 'index.html?room=' + room + '&x=2&y=16&god=1&abil=' + abil.replace(/\+/g, ',')); await page.waitForFunction(() => window.GAIDEN && GAIDEN.state === 'play');
    await page.evaluate(BOT); await page.evaluate(() => { window.__speed = 8; });
    const t0 = Date.now(); const ok = await page.waitForFunction(k => GAIDEN.progress.bosses.has(k), kind, { timeout: 200000 }).then(() => true).catch(() => false);
    const st = await page.evaluate(() => ({ s: window.__botStats, hp: GAIDEN.boss && GAIDEN.boss.hp, state: GAIDEN.boss && GAIDEN.boss.state }));
    console.log(kind, ok ? 'DEFEATED' : 'NOT', ((Date.now() - t0) / 1000).toFixed(0) + 's', 'hits', st.s.hits, 'tugs', st.s.coreTugs, 'hp', st.hp, st.state, (st.s.causes || []).slice(0, 6).join(' '));
    await ctx.close(); }
  console.log('errors:', errs.length ? errs.slice(0, 10).join('\n') : 'none');
  await browser.close(); srv.close();
})();
