# ROCKSIDE外伝 – 清掃員カナタ 〜幽霊屋敷のおそうじ〜 (prototype)

A small SotN-style exploration + Luigi's-Mansion vacuum game. It is a spin-off of ROCKSIDE.
Play it here: https://kanata-games.github.io/rockside-gaiden/ (the page has noindex).

## Controls
| | Touch (portrait) | Keyboard |
|---|---|---|
| Move | ← → | ←/→ or A/D |
| Jump (hold while falling to float briefly) | JUMP | Z / Space / K / ↑ / W |
| Vacuum (hold) | VAC | X / J |
| Spit stored object (auto-aim) | SPIT | C / L |
| Map | MAP | Tab / Q |
| Mute | SOUND | M |

## How it plays
- **VAC** sucks in ghosts. A ghost caught in the cone starts a tug-of-war. Press the direction **away** from the ghost to drain it faster. Watch for yanks (⚠ flash). At 0 HP the ghost is swallowed.
- Small objects (books, plates, candles, crystals, fire wisps) go into the **TANK** (3 slots). **SPIT** fires the oldest object at the nearest target.
- Curtains, dust piles and vases hide coins and hearts. One curtain hides a **secret room**.
- The key is in the dining hall. It opens the antechamber door, which leads to the boss.
- Save altars (blue lanterns) heal you and save your progress (localStorage).
- **Boss: 呪いのシャンデリア GRAND LUMIERE.** Its attacks are telegraphed:
  - candle drops (floor marks)
  - fire wisps (vacuum them for strong FIREBALL ammo)
  - crystal shards
  - a crash every 3rd attack (a shadow tracks you, then locks)
  
  After the crash it is stuck and its ghost core pops out. That is the weak point: vacuum the core and win the tug-of-war. Spitting objects also damages it. Below 50% HP it enrages (blue flames).

## Area (8 rooms)
玄関ホール → 肖像画の回廊 → ささやく書斎 (2 screens tall, hole down to the cellar) → 幽霊たちの食堂 (key, secret curtain → 隠し宝物庫, which holds a max-HP heart) / 地下ワイン蔵 → 舞踏会場の控え室 (save, locked door) → 月夜の舞踏会場 (boss)

## Dev
```
python3 tools/build.py          # src/*.js + src/01_head.html -> index.html (asset JSON is inlined)
cd tools && node test.js        # Playwright: 28 checks incl. a bot that beats the boss
node test.js --shots            # also writes 390x844 screenshots into screenshots/
python3 tools/cut_hero.py       # re-cut hero frames from art/src/kanata_gaiden_sheet_a/b.png
python3 tools/make_art.py       # regenerate the placeholder pixel art
```
Debug URL params: `?room=ballroom&x=3&y=15&god=1&key=1`, `&bossatk=crash`.

## Art: swappable assets
Every sprite is a PNG atlas plus a JSON rect map in `assets/`. To replace art, keep the same frame names, update the JSON, and rebuild.
- `kanata.png/json`: hero. 16 frames (sheet A + sheet B as alternate frames): idle, blink, move1, move2, suck, spit, hurt, down. Cut from the user's sheets.
- `wisp.png`: hero's blue wisp.
- `tiles`, `bg`, `props`, `items`, `enemies`, `boss`, `title_bg`: **procedural placeholder art** (tools/make_art.py).
