# ROCKSIDE外伝 – 清掃員カナタ 〜幽霊屋敷のおそうじ〜 (v0.2.0)

A small SotN-style exploration game with a Luigi's-Mansion vacuum. It is a spin-off of ROCKSIDE.
Play it here: https://kanata-games.github.io/rockside-gaiden/ (the page has noindex).

## Controls
| | Touch (portrait) | Keyboard |
|---|---|---|
| Move | ← → | ←/→ or A/D |
| Jump (hold while falling to float; press again in the air = double jump once you have it) | JUMP | Z / Space / K / ↑ / W |
| Vacuum (hold) | VAC | X / J |
| Spit a stored object (auto-aim). **Hold** = ふわり化 (float platform) | SPIT | C / L |
| Map | MAP | Tab / Q |
| Mute | SOUND | M |

## Two core mechanics
1. **Ghost tug-of-war.** VAC catches ghosts in the cone. Pull **away** from the ghost to drain it, and resist the yanks (⚠).
2. **Throwing objects.** Most rooms are full of props you can suck into the TANK (3 slots) and SPIT. Each object behaves differently:

| object | damage | effect |
|---|---|---|
| plate | 2 | shatters into 3 shards |
| bottle / soap / flowerpot | 2-3 | splash damage around the hit |
| candle / seed / fireball | 1-4 | **burns**: damage over time, burns vines, extra damage to the rose |
| crystal | 3 | pierces through enemies |
| gear | 3 | bounces off walls |
| book / chair / pan | 2-4 | sturdy: drops back so it can be reused (but breaks on a boss) |
| pot / barrel (heavy, need ターボ吸引) | 5-6 | heavy hit that pierces through enemies and breaks gargoyle stone skin |

**Normal enemies are immune to the vacuum** (it only goes "tink"). You beat them by throwing things:
- living armor
- bat swarm
- rats
- gargoyle (stone skin while perched: use heavy, burning or splash hits)
- puppet doll (throws needles)
- skeleton butler (throws plates you can catch)
- cursed book (bites, then dashes)

Normal enemies and ghosts appear together in the same rooms.

## Abilities (gate the mansion)
| ability | where | what it opens |
|---|---|---|
| ふわり化 FLOAT | appears after the chandelier boss | Hold SPIT: the oldest stored object floats as a temporary platform (only usable from solid ground). Reaches higher ledges in the laundry area. |
| ターボ吸引 TURBO | pantry | Longer, stronger suction. Lifts heavy objects, pulls levers, and drags the foyer wardrobe aside (→ garden). |
| ゴーストステップ DOUBLE JUMP | garden tool shed | A second jump in mid-air. Reaches the dining-hall ceiling hole (→ attic & clock tower) and the greenhouse birdcage. |

## Areas (32 rooms, 54 map cells)
Each area has its own tiles, background and music.

| area | rooms | boss |
|---|---|---|
| 幽霊屋敷 東棟 (East Wing) | 8 | 呪いのシャンデリア GRAND LUMIERE |
| 地下 洗濯場と厨房 (Laundry & Kitchen) | 9 | リネン・ゴーレム LINEN GOLEM |
| 月下の温室庭園 (Moonlit Garden) | 8 | 夜咲きの女王 マダム・ローズ MADAME ROSE |
| 屋根裏と時計塔 (Attic & Clock Tower) | 7 | 大時計の番人 チクタク GRANDFATHER TICKTOCK (final) |

Every boss telegraphs its attacks: floor marks, red flashes, HIGH/LOW guide lines, a dotted pendulum arc. Every 3rd attack is a long special move that leaves the boss stunned. Its ghost core pops out, and that core is the weak point: vacuum it and win the tug-of-war. Spitting objects also deals damage. Below 50% HP the boss gets angry.

Other features:
- Save altars.
- Secret rooms (4).
- Map screen with completion %, plus a mini-map.
- Max-HP hearts.

## Dev
```
python3 tools/make_art.py       # regenerate the pixel art atlases (assets/*.png + json)
python3 tools/build.py          # src/*.js + src/01_head.html -> index.html (asset JSON inlined)
node tools/test.js              # Playwright: 50 checks (abilities, gating, foes, all 4 bosses beaten by the bot)
node tools/reach.js             # whole-mansion reachability + ability gating check
node tools/bossrun.js 5         # boss balance: the bot fights each boss 5x WITHOUT god mode
node tools/rooms.js /tmp/rooms  # load + screenshot every room
node tools/shots.js             # phone screenshots -> screenshots/v02_*.png
```
Debug URL params:
- `?room=attic&x=3&y=15&god=1`
- `&abil=float,turbo,djump`
- `&beat=chandelier,golem`
- `&open=foyer:gate:wardrobe`
- `&bossatk=pendulum` (forces that attack every time)

## Art: swappable assets
Every sprite is a PNG atlas plus a JSON rect map in `assets/`. To replace art, keep the frame names, update the JSON and rebuild.
- `kanata.png/json`: the hero, cut from the user's sheets.
- `tiles`, `bg`, `props`, `items`, `enemies`, `boss`, `title_bg`: procedural pixel art from tools/make_art.py.
