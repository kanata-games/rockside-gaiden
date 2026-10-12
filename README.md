# ROCKSIDE外伝 – 清掃員カナタ 〜幽霊屋敷のおそうじ〜 (v0.5.0)

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
| 霊体化 PHASE | after the organ boss (chapel choir) | Walk through pale-blue spirit barriers: the clock-tower gearshaft (→ clock tower, and on its right → the observatory), the gallery ceiling hole (→ puppet theater), the reliquary secret and the well down to the grand bath. |
| 大容量タンク BIG TANK | after the serpent boss (grand bath) | The TANK holds 4 objects. |

## Areas (15 areas as of v0.6, plus a warp room in each; the list below covers the original 8)
Each area has its own tiles, background and music.

| area | rooms | boss |
|---|---|---|
| 幽霊屋敷 東棟 (East Wing) | 8 | 呪いのシャンデリア GRAND LUMIERE |
| 地下 洗濯場と厨房 (Laundry & Kitchen) | 9 | リネン・ゴーレム LINEN GOLEM |
| 月下の温室庭園 (Moonlit Garden) | 8 | 夜咲きの女王 マダム・ローズ MADAME ROSE |
| 屋根裏と時計塔 (Attic & Clock Tower) | 9 | 大時計の番人 チクタク GRANDFATHER TICKTOCK (midboss), then the TRUE final boss 時計塔管理人 クロノア CHRONOA |
| 礼拝堂と地下墓所 (Chapel & Crypt), new in v0.3 | 6 | 呪いのパイプオルガン CURSED PIPE ORGAN |
| 大浴場と貯水槽 (Grand Bath & Cistern), new in v0.3 (optional, behind a spirit barrier) | 6 | 大浴場の主 ユブネ BATHWATER SERPENT |
| 人形劇場 (Puppet Theater), new in v0.4 (gallery ceiling, spirit barrier) | 5 | 人形座長 ストリングス MAESTRO STRINGS |
| 星見の天文台 (Stargazing Observatory), new in v0.4 (gearshaft, spirit barrier) | 5 | 星喰いの天球儀 アストラ ASTRA |

**v0.4 story.** The door behind the great clock carries three seals: the clock, the strings and the stars. Beat チクタク, Maestro Strings and Astra to open it. At the top of the tower waits クロノア, the clock tower's keeper and one of the thirteen mimic girls. Her mimic is the great clock face with the giant eye. Her attacks are clock hands, the pocket-watch pendulum, rewinding sand orbs, slow-time zones and the eye beam. When the eye shuts, its core is the weak point. ヴェル, the master's secretary, is never fought. She appears with one quiet line when you reach the new areas, after certain bosses and before Chronoa, and she returns for the ending.

**Warp rooms.** Every area has a ワープの間 with a glowing circle. Step on it to open the destination menu, which lists every warp room you have found and shows them on the map (W). The map marks discovered warp rooms.

Every boss telegraphs its attacks: floor marks, red flashes, HIGH/LOW guide lines, a dotted pendulum arc. Every 3rd attack (every 4th for the later bosses) is a long special move that leaves the boss stunned. Its ghost core pops out, and that core is the weak point: vacuum it and win the tug-of-war. The core breaks free after a capped amount of damage per opening. Spitting objects also deals damage. Below 50% HP the boss gets angry and gains phase-2 moves and combos: the golem's leap, the rose's garden of thorns, the organ's requiem, the clock's MIDNIGHT barrage. At 25% the clock goes into OVERDRIVE.

Difficulty rises chandelier < golem < rose < organ ≈ serpent < strings < astra < clock < chronoa (see the bot table in the release notes). Since v0.3.2 every attack passes tools/avoid.js.

Other features:
- Save altars.
- Door safety: brief i-frames on entering a room, no enemies spawn near the entry, and knockback can't push you through a door (fixes the pantry rat stunlock).
- Secret rooms (4).
- Map screen with completion %, plus a mini-map.
- Max-HP hearts.

## v0.6.0 – expansion phase C (15 areas)
- **尖塔の屋根 ROOFTOP SPIRES** (6 rooms + warp): up through a hatch in the belfry ceiling. The roofs are open, but the needle spire needs グリム吸着 (wall-cling). Boss **風見鶏 ゲイルコック**: iron feathers on gold marks, gust rings, a red-marked swoop; a storm cloud follows Kanata, locks and strikes, the lightning rod pulls the bolt into the weathercock and it topples, exposing its core.
- **絵の中の世界 THE PAINTED WORLD** (6 rooms + warp): a padlocked gilt frame in the auditorium ceiling (鍵束). Boss **絵の具ゴーレム パレットン**: paint blobs on gold marks, paint strokes that roll out and back, red-marked paint columns; it leaps out of the picture, its shadow follows, locks, it crashes and melts, leaving its palette core bare.
- **おもちゃ箱の子供部屋 THE TOY NURSERY** (6 rooms + warp): blacked-out stairs under the phantom kitchen (カンテラ). Boss **びっくり箱 ボックスジャック**: falling toy blocks, a red-marked hop, rolling wind-up blocks; the crank winds, the jester head follows Kanata, locks, pops down and the overstretched spring flops: wind-up core.
- Extra rooms: theater +2 (楽屋, 大道具の倉庫), observatory +2 (彗星の回廊, 星の井戸).
- The clock heart now holds **six seals**: clock, marionette, orrery, galecock, paletton, boxjack.
- Boss HP curve rises gently: … bellboard 180 → galecock 215 → paletton 225 → angler 230 → boxjack 235 → clock 240 → Chronoa 260.
- New foe skins: crow, iron vane-gargoyle, ink bat, brush dancer, tin soldier, wind-up mouse.

## v0.5.0 – expansion phase A
- New area **古酒の大貯蔵庫** (wine cellar, behind a spirit barrier east of the warp hub): 6 rooms + warp. Boss **樽蜘蛛 バレルタラント**: falling corks, wine waves, thread drop, then a plunge that gets it stuck. Its core pops out to vacuum. Reward: **鍵束** (opens ring gates).
- New area **騎士の武具庫** (armory, through the ring gate in the ossuary): 6 rooms + warp. Boss **空っぽの騎士団長 アイアンホロウ**: halberd rain, slash wave, leap, then a greatsword drop. He kneels, his helmet pops off, and his core is exposed. Reward: **グリム吸着** (wall cling + wall jump).
- New foes (corkbat, grapewisp, squire, stone griffin), tilesets, backgrounds and music for both areas, plus two new Vel lines.

## v0.4.3 – softlock fix
- Fixed a wedge on the top-left ledge of the theater lobby: ledges now need full headroom (lobby, wings and pump room ledges moved), and one-way ledges without room for Kanata can't be landed on.
- Unstick: if Kanata ever overlaps a wall, she is nudged to the nearest free spot (or sent back to the room entrance).
- Drop through ledges: ↓ (or S) on keyboard, or swipe down on the ←→ pad on mobile.
- Universal escape: holding inputs for 3 s without moving returns you to the room entrance. The MAP screen also has a 「部屋の入口に戻る」 button (or press VAC / ↓).
- reach.js now fails on low-ceiling ledges and on any spot you can reach but not get back from.

## v0.4.2 – final art
Chronoa (10-frame sheet + clock mimic), Vel (7 frames: walk in, bow, turn, leave) and 64px portraits from `assets/gaiden_src/`, packed 1:1 into `assets/gaiden.png` by `tools/import_gaiden_art.py`. Chronoa's watch, glyph orbs and eye beam spawn from the art's marked points; soft rim light keeps both readable in dark rooms.

## Dev
```
python3 tools/make_art.py       # regenerate the pixel art atlases (assets/*.png + json)
python3 tools/build.py          # src/*.js + src/01_head.html -> index.html (asset JSON inlined)
node tools/test.js              # Playwright: ~140 checks (abilities, gating, eating, warps, door safety, drop attacks, avoidability, all bosses beaten by the bot); AVOID=0 skips the avoid audit
node tools/reach.js             # whole-mansion reachability + ability gating check
node tools/bossrun.js 5         # boss balance: the bot fights each boss 5x WITHOUT god mode
node tools/rooms.js /tmp/rooms  # load + screenshot every room
node tools/shots03.js           # phone screenshots -> screenshots/v03_*.png
node tools/shots04.js           # v0.4 screenshots (new areas, bosses, Vel, ending, map) -> screenshots/v04_*.png
node tools/doors.js             # audit: no enemies placed next to doors
node tools/avoid.js [bosses] --reps=2   # fairness audit: for EVERY boss attack (normal + enraged), Kanata parked at 4 spots,
                                # reacts after 18 frames (300 ms) and must reach a safe spot with real walk/jump/hover physics
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
