// Version label (title screen + footer). Bump on every release.
const GAME_VERSION = '0.2.0';
// =====================================================================
//  ROCKSIDE外伝 清掃員カナタ  -  haunted-mansion exploration + vacuum action (prototype)
//  All gameplay tuning lives in CONFIG. Units: pixels and frames @60Hz.
// =====================================================================
const CONFIG = {
  viewW: 384, viewH: 288, tile: 16, cellCols: 24, cellRows: 18,   // one map cell = one screen

  // ---- player (hitbox w x h; sprite is drawn feet-centred) ----
  playerW: 16, playerH: 50,
  gravity: 0.28, maxFall: 6.5,
  jumpVel: 6.6,            // apex ~ 78 px: a 4-tile step is comfortable
  jumpCutVel: 1.6,         // releasing JUMP while rising clamps the upward speed (variable jump height)
  walkSpeed: 1.7, accel: 0.35, airAccel: 0.25, decel: 0.5,
  vacWalkSpeed: 0.7,       // move speed while the vacuum runs
  coyote: 6, jumpBuffer: 7,
  hoverFrames: 70,         // half-ghost float: hold JUMP while falling -> slow descent for this long (refills on the ground)
  hoverFall: 0.45,         // max fall speed while hovering
  maxHP: 10, invFrames: 80, knockFrames: 16, knockVx: 1.6, knockVy: 2.6,

  // ---- vacuum (Luigi's Mansion style) ----
  vac: {
    nozzleX: 40, nozzleY: 26,         // nozzle mouth relative to the feet centre (suck pose, facing right)
    range: 108, spreadNear: 12, spreadFar: 38,   // cone: length, half height at the nozzle / at full range
    itemPull: 0.55,                    // accel on loose items in the cone
    catchFrames: 26, catchFramesStunned: 4,     // frames a ghost must stay in the cone before it is caught
    tugBaseDrain: 0.18,                // ghost HP lost per frame while caught
    tugPullDrain: 0.72,                // ... while holding the direction AWAY from the ghost
    tugYankBonus: 1.6,                 // multiplier while resisting a yank
    tugDrag: 0.55,                     // how hard a caught ghost drags Kanata toward it
    tugPullSpeed: 0.55,                // Kanata's speed while pulling away
    tugYankDrag: 1.5, tugYankWarn: 22, tugYankFrames: 24,
    tugBreakDist: 170,                 // hose "snaps" (ghost escapes) beyond this distance
    tankMax: 3,                        // stored objects for SPIT
    swallowDist: 12,
  },
  spit: { speed: 5.2, heavySpeed: 4.2, cooldown: 14, puffCooldown: 22, puffRange: 56, puffStun: 70, stunFrames: 110, ghostDamage: 34 },

  // ---- abilities found in the mansion ----
  turboRange: 1.18,                  // ターボ吸引: cone length multiplier; also lifts heavy objects, levers and wardrobes
  djumpVel: 5.9,                     // 二段ジャンプ (ゴーストステップ): second jump in the air
  float: { holdFrames: 16, life: 330, max: 2, w: 26, h: 8 },   // ふわり化: hold SPIT -> the oldest stored object floats as a platform

  // ---- objects you can suck up and SPIT (dmg = damage to normal enemies; bosses take x bossMul) ----
  //   shatter: breaks into 3 shards   burn: sets enemies on fire (+3 over time, plants x2)   splash: area damage
  //   pierce: flies through enemies   bounce: rebounds off walls   heavy: needs ターボ吸引 to lift
  ammo: {
    book:      { dmg: 2, w: 12, h: 10 },
    plate:     { dmg: 2, w: 14, h: 6, shatter: 1 },
    candle:    { dmg: 1, w: 6, h: 12, burn: 1 },
    bottle:    { dmg: 2, w: 8, h: 14, splash: 34 },
    chair:     { dmg: 4, w: 14, h: 16 },
    crystal:   { dmg: 3, w: 12, h: 12, pierce: 1 },
    fireball:  { dmg: 4, w: 12, h: 12, burn: 1 },
    pan:       { dmg: 3, w: 16, h: 8 },
    gear:      { dmg: 3, w: 12, h: 12, bounce: 2 },
    flowerpot: { dmg: 3, w: 12, h: 12, splash: 26 },
    soap:      { dmg: 2, w: 12, h: 12, splash: 30 },
    seed:      { dmg: 2, w: 10, h: 10, burn: 1 },
    pot:       { dmg: 5, w: 16, h: 14, heavy: 1, pierce: 1 },
    barrel:    { dmg: 6, w: 16, h: 18, heavy: 1, pierce: 1 },
  },
  bossMul: 2,

  // ---- enemies (hp = vacuum units) ----
  puff:  { hp: 100, speed: 0.55, aggro: 170, dashWarn: 26, dashSpeed: 2.6, dashEvery: 150, damage: 1, coins: 3 },
  dish:  { hp: 140, keep: 110, speed: 0.6, throwEvery: 120, throwWarn: 26, plateSpeed: 2.6, damage: 1, coins: 4 },
  armor: { walk: 0.45, swingWarn: 30, swingFrames: 16, swingRange: 34, damage: 2, ghostHp: 160, coins: 6 },
  sheet: { hp: 120, speed: 0.7, aggro: 180, dashWarn: 24, dashSpeed: 2.8, dashEvery: 140, damage: 1, coins: 3 },  // シーツおばけ (laundry ghost)

  // ---- normal (non-ghost) enemies: the vacuum can't hold them - hit them with objects ----
  foes: {
    bat:      { hp: 1, speed: 1.2, wake: 130, damage: 1, coins: 1 },
    rat:      { hp: 1, speed: 1.35, damage: 1, coins: 1 },
    gargoyle: { hp: 6, wake: 150, warn: 34, dive: 3.2, rest: 110, damage: 2, coins: 4 },
    puppet:   { hp: 3, speed: 0.35, every: 150, warn: 30, needle: 2.4, damage: 1, coins: 2 },
    skeleton: { hp: 4, speed: 0.4, every: 130, warn: 26, damage: 1, coins: 3 },
    cursedbook: { hp: 2, speed: 0.8, warn: 22, dash: 3.0, every: 120, damage: 1, coins: 2 },
  },

  // ---- boss: 呪いのシャンデリア GRAND LUMIERE ----
  boss: {
    hp: 100, idle: 64, idleRage: 42, trackSpeed: 0.7, trackSpeedRage: 1.0,
    candleWarn: 46, candleWarnRage: 36, candles: 3, candlesRage: 4, candleFire: 110, candleDamage: 1, fireDamage: 1,
    wispCount: 2, wispCountRage: 3, wispLife: 420, wispSpeed: 0.55, wispHp: 34, wispDamage: 1,
    shardWarn: 38, shardWarnRage: 30, shards: 5, shardsRage: 7, shardDamage: 1,
    crashTrack: 64, crashTrackRage: 52, crashLock: 30, crashDamage: 2, crashFollow: 1.2, waveDamage: 1, waveSpeed: 2.4,
    stuck: 170, stuckRage: 140, coreHp: 70,
    coreCap: 25, coreBaseDrain: 0.06, corePullDrain: 0.18,  // boss HP per frame while the core is in a tug-of-war
    contactDamage: 2,
  },
  // ---- boss 2: リネン・ゴーレム LINEN GOLEM (laundry) ----
  golem: { hp: 140, idle: 70, idleRage: 48, walk: 0.55, walkRage: 0.8, slamWarn: 44, slamWarnRage: 34, waveSpeed: 2.3, slamDamage: 2,
    bubbles: 3, bubblesRage: 5, bubbleDamage: 1, spinWarn: 50, spinWarnRage: 40, spinSpeed: 3.2, spinDamage: 2, dizzy: 170, dizzyRage: 140, contactDamage: 1 },
  // ---- boss 3: 夜咲きの女王 マダム・ローズ MADAME ROSE (greenhouse) ----
  rose: { hp: 170, idle: 64, idleRage: 44, thornWarn: 46, thornWarnRage: 36, thorns: 3, thornsRage: 4, thornDamage: 2,
    seeds: 3, seedsRage: 4, seedDamage: 1, petalWarn: 50, petalWarnRage: 40, petalSpeed: 2.2, petalDamage: 1, bloom: 170, bloomRage: 140, burnBonus: 3, contactDamage: 1 },
  // ---- boss 4: 大時計の番人 グランドファーザー・チクタク GRANDFATHER TICKTOCK (clock tower) ----
  clock: { hp: 180, spitMul: 1.2, idle: 56, idleRage: 40, handWarn: 40, handWarnRage: 32, hands: 3, handsRage: 4, handDamage: 2,
    gears: 3, gearsRage: 4, gearSpeed: 2.0, gearDamage: 1, pendWarn: 50, pendWarnRage: 40, pendDamage: 2, chime: 170, chimeRage: 140, contactDamage: 1 },
};
