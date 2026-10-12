// v0.7 screenshots: node tools/shots07.js -> screenshots/v07_*.png (390x844 @2x)
const { chromium } = require('playwright'); const path = require('path'); const SERVE = require('./serve.js');
const OUT = path.join(__dirname, '..', 'screenshots'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = await SERVE.start(path.join(__dirname, '..')); const browser = await chromium.launch(); const errs = [];
  const open = async q => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message)); await page.goto(srv.url + 'index.html' + q);
    await page.waitForFunction(() => window.GAIDEN && GAIDEN.state === 'play', null, { timeout: 8000 }); return { ctx, page }; };
  const snap = async (page, n) => { await page.screenshot({ path: path.join(OUT, n) }); console.log('saved', n); };
  { const { ctx, page } = await open('?room=catshop&x=4&y=15');
    await sleep(900); await snap(page, 'v07_shop_room.png');
    await page.evaluate(() => { GAIDEN.progress.coins = 185; GAIDEN._test.openShop(); }); await sleep(200);
    await page.evaluate(() => { const T = GAIDEN._test; T.shopBuy(T.shopItems()[0]); T.shopBuy(T.shopItems()[3]); }); await sleep(300);
    for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowRight'); await sleep(80); } await sleep(400); await snap(page, 'v07_shop_menu.png');
    await page.evaluate(() => { const T = GAIDEN._test; T.shopBuy(T.shopItems().find(i => i.id === 'pal_sakura')); T.inp.vacPressed = true; }); await sleep(400);
    await page.evaluate(() => { GAIDEN.loadRoom('foyer', { start: true }); GAIDEN.placePlayer(14 * 16, 15 * 16, 1); }); await sleep(1200); await snap(page, 'v07_palette_sakura.png');
    await page.evaluate(() => { GAIDEN._test.setPalette('midnight'); GAIDEN._test.shopState().pals.push('midnight'); }); await sleep(400); await snap(page, 'v07_palette_midnight.png');
    await page.evaluate(() => { GAIDEN.P.hp = 3; }); await page.keyboard.press('Tab'); await sleep(600); await snap(page, 'v07_map_tea.png');
    await page.keyboard.press('Tab'); await sleep(200);
    // the clear -> THANK YOU card
    await page.evaluate(() => { GAIDEN._test.startClear(); window.__speed = 8; }); await sleep(1500); await page.evaluate(() => { window.__speed = 1; GAIDEN._test.inp.jumpPressed = true; }); await sleep(2500); await snap(page, 'v07_thank_you.png');
    await ctx.close(); }
  // Vel's ending line (fast-forward the true ending)
  { const { ctx, page } = await open('?room=clockheart&x=4&y=15&god=1&abil=float,turbo,djump,phase,tank');
    await page.evaluate(() => { window.__speed = 8; GAIDEN._test.keys.right = true; }); await sleep(300); await page.evaluate(() => { GAIDEN._test.keys.right = false; });
    await page.waitForFunction(() => GAIDEN.boss && GAIDEN.boss.state !== 'sleep' && GAIDEN.boss.state !== 'intro', null, { timeout: 30000 });
    await page.evaluate(() => { GAIDEN.boss.hp = 1; GAIDEN.boss.damage(5); });
    await page.waitForFunction(() => GAIDEN.STORY.box && GAIDEN.STORY.box.text.includes('残りの'), null, { timeout: 90000, polling: 200 }).catch(e => console.log('no vel line', e.message));
    await page.evaluate(() => { window.__speed = 1; }); await sleep(3500); await page.evaluate(() => { window.__speed = 0; }); await sleep(200); await snap(page, 'v07_vel_ending_line.png'); await ctx.close(); }
  console.log('errors:', errs.length ? errs : 'none'); await browser.close(); srv.close(); process.exit(0);
})();
