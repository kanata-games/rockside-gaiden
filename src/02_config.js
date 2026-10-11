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
  hurtInsetX: 3, hurtInsetTop: 12,  // damage hurtbox inset (see hurtBox())
  foeRecoil: 60, foeEdge: 34,        // normal enemies back off this long after hitting Kanata; never closer than this to the room edge (doorways)
  entryGrace: 50, entrySafe: 112,     // after entering a room: no damage for N frames; enemies kept this far (px) from the entry point
  // v0.3: the mimic vacuum EATS tiny critters (rat, bat): +heal and +1 GABU gauge; a full gauge powers up the next SPIT
  eat: { heal: 1, max: 3, pullMax: 40, biteDmg: 3, biteRange: 96, shotMul: 2 },
  maxHP: 10, invFrames: 100, knockFrames: 16, knockVx: 1.6, knockVy: 2.6,

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
    // v0.3: the first boss is gentler (fewer/slower drops, wider gaps, longer warnings, lower HP)
    hp: 80, idle: 80, idleRage: 58, trackSpeed: 0.6, trackSpeedRage: 0.85,
    candleWarn: 64, candleWarnRage: 50, candles: 2, candlesRage: 3, candleGap: 84, candleFire: 90, candleDamage: 1, fireDamage: 1,
    wispCount: 2, wispCountRage: 2, wispLife: 380, wispSpeed: 0.45, wispHp: 30, wispDamage: 1,
    shardWarn: 54, shardWarnRage: 44, shards: 4, shardsRage: 5, shardDamage: 1,
    crashTrack: 80, crashTrackRage: 66, crashLock: 44, crashDamage: 2, crashFollow: 1.0, waveDamage: 1, waveSpeed: 2.0,
    stuck: 200, stuckRage: 170, coreHp: 70,
    coreCap: 25, coreBaseDrain: 0.06, corePullDrain: 0.18,  // boss HP per frame while the core is in a tug-of-war
    contactDamage: 1,
  },
  // ---- boss 2: リネン・ゴーレム LINEN GOLEM (laundry) ----
  // v0.3: noticeably stronger (faster, double slam + wall-bounce roll when angry, sock rain)
  golem: { hp: 175, idle: 52, idleRage: 36, walk: 0.8, walkRage: 1.1, slamWarn: 40, slamWarnRage: 32, waveSpeed: 2.8, slamDamage: 2,
    bubbles: 3, bubblesRage: 4, bubbleDamage: 1, bubbleSpeed: 1.0, spinWarn: 40, spinWarnRage: 34, spinSpeed: 4.2, spinDamage: 2, dizzy: 130, dizzyRage: 110,
    socks: 4, socksRage: 5, sockWarn: 44, sockWarnRage: 36, sockDamage: 1, contactDamage: 1 },
  // ---- boss 3: 夜咲きの女王 マダム・ローズ MADAME ROSE (greenhouse) ----
  rose: { hp: 200, idle: 52, idleRage: 38, thornWarn: 42, thornWarnRage: 34, thorns: 4, thornsRage: 5, thornGap: 44, thornDamage: 2,
    seeds: 4, seedsRage: 6, seedDamage: 1, petalWarn: 44, petalWarnRage: 36, petalSpeed: 2.6, petalDamage: 1, bloom: 170, bloomRage: 140, burnBonus: 3, contactDamage: 1 },
  // ---- boss 4: 大時計の番人 グランドファーザー・チクタク GRANDFATHER TICKTOCK (clock tower) ----
  clock: { hp: 220, spitMul: 1.2, idle: 46, idleRage: 34, handWarn: 34, handWarnRage: 28, hands: 4, handsRage: 6, handDamage: 2,
    gears: 5, gearsRage: 7, gearSpeed: 2.8, gearDamage: 1, pendWarn: 42, pendWarnRage: 34, pendDamage: 2, chime: 160, chimeRage: 130, contactDamage: 2 },
};
