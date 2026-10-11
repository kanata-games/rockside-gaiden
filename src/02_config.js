// Version label (title screen + footer). Bump on every release.
const GAME_VERSION = '0.1.0';
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
  spit: { speed: 5.2, cooldown: 14, puffCooldown: 22, puffRange: 56, puffStun: 70, stunFrames: 110, ghostDamage: 34 },

  // ---- enemies (hp = vacuum units) ----
  puff:  { hp: 100, speed: 0.55, aggro: 170, dashWarn: 26, dashSpeed: 2.6, dashEvery: 150, damage: 1, coins: 3 },
  dish:  { hp: 140, keep: 110, speed: 0.6, throwEvery: 120, throwWarn: 26, plateSpeed: 2.6, damage: 1, coins: 4 },
  armor: { walk: 0.45, swingWarn: 30, swingFrames: 16, swingRange: 34, damage: 2, ghostHp: 160, coins: 6 },

  // ---- boss: 呪いのシャンデリア GRAND LUMIERE ----
  boss: {
    hp: 100, idle: 64, idleRage: 42, trackSpeed: 0.7, trackSpeedRage: 1.0,
    candleWarn: 46, candleWarnRage: 36, candles: 3, candlesRage: 4, candleFire: 110, candleDamage: 1, fireDamage: 1,
    wispCount: 2, wispCountRage: 3, wispLife: 420, wispSpeed: 0.55, wispHp: 34, wispDamage: 1,
    shardWarn: 38, shardWarnRage: 30, shards: 5, shardsRage: 7, shardDamage: 1,
    crashTrack: 64, crashTrackRage: 52, crashLock: 30, crashDamage: 2, crashFollow: 1.2, waveDamage: 1, waveSpeed: 2.4,
    stuck: 170, stuckRage: 140, coreHp: 70,
    coreCap: 25, coreBaseDrain: 0.06, corePullDrain: 0.18,  // boss HP per frame while the core is in a tug-of-war
    spitDamage: 4, fireballDamage: 7, contactDamage: 2,
  },
};
