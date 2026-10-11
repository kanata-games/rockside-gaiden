# ROCKSIDE外伝 – 清掃員カナタ 〜幽霊屋敷のおそうじ〜 (v0.3.0)

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

**The vacuum is a mimic, and it EATS tiny critters.** Rats, bats and bath crabs are sucked in and eaten ("GABU!" + chomp). Each one heals half a heart and fills the **GABU gauge** (3 fangs under the HUD). With a full gauge the next SPIT is powered up: a stored object does double damage, pierces and glows. With an empty tank you get a **bite wave** that hits everything close in front of you (3 damage, and it stuns ghosts).

**Bigger enemies are immune to the vacuum** (it only goes "tink"). You beat them by throwing things:
- living armor
- gargoyle (stone skin while perched: use heavy, burning or splash hits)
- puppet doll (throws needles)
- skeleton butler (throws plates you can catch)
- cursed book (bites, then dashes)
- skull wisp (crypt; spits bones you can catch = BONE ammo that pierces)
- bath crab (bath; snaps sideways, edible)

Normal enemies and ghosts appear together in the same rooms.

## Abilities (gate the mansion)
| ability | where | what it opens |
|---|---|---|
| ふわり化 FLOAT | appears after the chandelier boss | Hold SPIT: the oldest stored object floats as a temporary platform (only usable from solid ground). Reaches higher ledges in the laundry area. |
| ターボ吸引 TURBO | pantry | Longer, stronger suction. Lifts heavy objects, pulls levers, and drags the foyer wardrobe aside (→ garden). |
| ゴーストステップ DOUBLE JUMP | garden tool shed | A second jump in mid-air. Reaches the dining-hall ceiling hole (→ attic & clock tower, chapel) and the greenhouse birdcage. |
| 霊体化 PHASE | after the organ boss (chapel choir) | Walk through pale-blue spirit barriers: the clock-tower gearshaft (→ final boss), the reliquary secret and the well down to the grand bath. |
| 大容量タンク BIG TANK | after the serpent boss (grand bath) | The TANK holds 4 objects. |

## Areas (6 areas, plus a warp room in each)
Each area has its own tiles, background and music.

| area | rooms | boss |
|---|---|---|
| 幽霊屋敷 東棟 (East Wing) | 8 | 呪いのシャンデリア GRAND LUMIERE |
| 地下 洗濯場と厨房 (Laundry & Kitchen) | 9 | リネン・ゴーレム LINEN GOLEM |
| 月下の温室庭園 (Moonlit Garden) | 8 | 夜咲きの女王 マダム・ローズ MADAME ROSE |
| 屋根裏と時計塔 (Attic & Clock Tower) | 7 | 大時計の番人 チクタク GRANDFATHER TICKTOCK (final) |
| 礼拝堂と地下墓所 (Chapel & Crypt), new in v0.3 | 6 | 呪いのパイプオルガン CURSED PIPE ORGAN |
| 大浴場と貯水槽 (Grand Bath & Cistern), new in v0.3 (optional, behind a spirit barrier) | 6 | 大浴場の主 ユブネ BATHWATER SERPENT |

**Warp rooms.** Every area has a ワープの間 with a glowing circle. Step on it to open the destination menu, which lists every warp room you have found and shows them on the map (W). The map marks discovered warp rooms.

Every boss telegraphs its attacks: floor marks, red flashes, HIGH/LOW guide lines, a dotted pendulum arc. Every 3rd attack (every 4th for the later bosses) is a long special move that leaves the boss stunned. Its ghost core pops out, and that core is the weak point: vacuum it and win the tug-of-war. The core breaks free after a capped amount of damage per opening. Spitting objects also deals damage. Below 50% HP the boss gets angry and gains phase-2 moves and combos: the golem's leap, the rose's garden of thorns, the organ's requiem, the clock's MIDNIGHT barrage. At 25% the clock goes into OVERDRIVE.

Difficulty rises chandelier < golem < rose ≈ organ < serpent < clock (see the bot table in the release notes).

Other features:
- Save altars.
- Door safety: brief i-frames on entering a room, no enemies spawn near the entry, and knockback can't push you through a door (fixes the pantry rat stunlock).
- Secret rooms (4).
- Map screen with completion %, plus a mini-map.
- Max-HP hearts.

## Dev
```
python3 tools/make_art.py       # regenerate the pixel art atlases (assets/*.png + json)
python3 tools/build.py          # src/*.js + src/01_head.html -> index.html (asset JSON inlined)
node tools/test.js              # Playwright: 68 checks (abilities, gating, eating, warps, spirit gates, door safety, all 6 bosses beaten by the bot)
node tools/reach.js             # whole-mansion reachability + ability gating check
node tools/bossrun.js 5         # boss balance: the bot fights each boss 5x WITHOUT god mode
node tools/rooms.js /tmp/rooms  # load + screenshot every room
node tools/shots03.js           # phone screenshots -> screenshots/v03_*.png
node tools/doors.js             # audit: no enemies placed next to doors
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
