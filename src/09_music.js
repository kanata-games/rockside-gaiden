
// =====================================================================
//  MUSIC: NES-style chiptune BGM synthesized live with Web Audio (engine reused from ROCKSIDE 04h_music.js:
//  4 channels pulse 1 lead / pulse 2 / triangle bass / noise drums, chord charts + melody bars).
//  All melodies below are original compositions for ROCKSIDE外伝.
//  melody token: <note><octave>[:len in 16ths] (len carries over), r = rest.  drums per 16th: k s x h o c t r .
// =====================================================================
const MUSIC_SONGS = {
  title: { name: 'HAUNTED HOUSEKEEPING', jp: 'タイトル：幽霊屋敷のおそうじ', mood: 'mysterious but cute D minor, lilting swing, harpsichord-like arpeggios', bpm: 118, swing: 0.22,
    lead: { duty: 0.25, vol: 0.066, gate: 0.9 }, p2v: { duty: 0.125, vol: 0.04 },
    sections: {
      A: { chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Gm,A', 'Dm'], p2: 'arp16', bass: 'half',
        drums: ['k...h...s...h...'], fill: 'k...h...s.s.sss.',
        mel: ['A4:4 D5:2 F5 A5:6 G5:2', 'F5:4 D5:2 Bb4 F5:8', 'G5:2 A5 Bb5 D6 C6:4 Bb5', 'A5:6 G5:2 E5:4 C#5',
              'D5:2 F5 A5 D6 F6:4 E6:2 D6', 'D6:4 Bb5:2 F5 D6:8', 'Bb5:2 A5 G5 Bb5 A5 G5 E5 C#5', 'D5:12 r:4'] },
      B: { chords: ['Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'A7'], p2: 'harm3', bass: 'pop',
        drums: ['k..kh...s...h.hh'], fill: 'k..kh...s.s.sscs',
        mel: ['F5:2 Bb5 D6:4 C6:2 Bb5 F5:4', 'G5:2 C6 E6:4 D6:2 C6 G5:4', 'A5:4 C6:2 E6 A6:4 G6', 'F6:6 E6:2 D6:8',
              'D6:2 Bb5 G5 Bb5 D6:4 G6', 'E6:4 C6:2 G5 E6:4 G6', 'F6:2 E6 D6 C6 A5:4 F5', 'E5:2 G5 A5 C#6 E6:4 A5'] } },
    order: ['A', 'B'] },

  mansion: { name: 'MIDNIGHT MOPPING', jp: '道中：真夜中のおそうじ', mood: 'driving gothic A minor exploration theme, walking-in-the-dark groove', bpm: 136,
    lead: { duty: 0.25, vol: 0.066, gate: 0.86 }, p2v: { duty: 0.125, vol: 0.038 },
    sections: {
      A: { chords: ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'Dm,E', 'Am'], p2: 'arp16', bass: 'oct8',
        drums: ['k.h.s.h.k.k.s.h.'], fill: 'k.h.s.h.k.s.ssss',
        mel: ['A4:2 C5 E5 A5:4 G5:2 E5 D5', 'E5:6 C5:2 A4:8', 'F5:2 A5 C6:4 B5:2 A5 F5:4', 'G5:4 B5 D6:6 B5:2',
              'C6:2 B5 A5 E5 A5:4 C6', 'E6:6 D6:2 C6:4 A5', 'F5:2 A5 D6 F5 E5 G#5 B5 E6', 'A5:12 r:4'] },
      B: { chords: ['Dm', 'Am', 'Dm', 'E', 'F', 'C', 'Dm', 'E7'], p2: 'echo', bass: 'root8',
        drums: ['k.hhs.h.k.hhs.hk'], fill: 'k.hhs.hhs.s.x.c.',
        mel: ['D6:4 F6:2 E6 D6:4 A5', 'C6:4 E6:2 D6 C6:4 E5', 'F5:2 A5 D6:4 F6 A6:2 F6', 'G#6:6 E6:2 B5:8',
              'A6:4 F6:2 C6 A5:4 C6', 'G6:4 E6:2 C6 G5:4 E6', 'F6:2 E6 D6 A5 F5 A5 D6 F6', 'E6:8 G#6:4 B6'] },
      C: { chords: ['Am', 'G', 'F', 'E'], p2: 'arp16', bass: 'gallop',
        drums: ['k.h.k.h.k.h.k.h.'], fill: 'k.s.k.s.sssscsss',
        mel: ['E5:4 r A5 r', 'D5:4 r G5 r', 'C5:4 F5 A5 C6', 'B5:2 G#5 E5 B4 G#4 B4 E5 G#5'] },
      A2: { base: 'A', p2: 'harm3' } },
    order: ['A', 'B', 'C', 'A2'] },

  boss: { name: 'GRAND LUMIERE', jp: 'ボス：呪いのシャンデリア', mood: 'fierce E harmonic minor boss rock; gallop bass, glittering crystal arps', bpm: 172,
    lead: { duty: 0.25, vol: 0.07, gate: 0.82 }, p2v: { duty: 0.25, vol: 0.036 },
    sections: {
      A: { chords: ['Em', 'Em', 'C', 'B', 'Em', 'Em', 'Am,B', 'Em'], p2: 'arp16', bass: 'gallop',
        drums: ['k.hhs.hkk.hhs.hk'], fill: 'k.hhs.hks.s.ssss',
        mel: ['E5:1 r E5 r B5:2 E5 G5 F#5 E5 D#5', 'E5:4 G5:2 B5 E6:8', 'C6:2 B5 A5 G5 E5 G5 C6 E6', 'D#6:6 F#6:2 B5:8',
              'E6:2 D#6 E6 B5 G5 B5 E6 G6', 'F#6:4 E6:2 D#6 E6:8', 'C6:2 E6 A6 E6 B5 D#6 F#6 A6', 'G6:4 F#6 E6:8'] },
      B: { chords: ['Am', 'D', 'G', 'C', 'Am', 'B', 'C', 'B7'], p2: 'harm3', bass: 'oct8',
        drums: ['k.hks.hkk.hks.hk'], fill: 'k.k.s.k.ssssxcx.',
        mel: ['A5:4 C6:2 E6 A6:4 G6', 'F#6:4 D6:2 A5 F#6:4 A6', 'G6:6 F#6:2 D6:4 B5', 'C6:2 E6 G6 C7 B6:4 G6',
              'A6:4 E6:2 C6 A5:4 C6', 'B5:2 D#6 F#6 B6 A6:4 F#6', 'G6:2 F#6 E6 G6 C7:4 B6', 'B6:8 A6:4 F#6'] },
      A2: { base: 'A', p2: 'echo' } },
    order: ['A', 'B', 'A2'] },

  vault: { name: 'SECRET SPARKLE', jp: '隠し宝物庫', mood: 'twinkly music-box F major for the hidden treasure room', bpm: 104,
    lead: { duty: 0.125, vol: 0.06, gate: 0.7 }, p2v: { duty: 0.25, vol: 0.03 },
    sections: { A: { chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Gm,C', 'F'], p2: 'arp8', bass: 'half', drums: ['................'], fill: null,
      mel: ['C6:2 F6 A6 F6 C6:4 A5', 'D6:2 F6 A6 F6 D6:8', 'Bb5:2 D6 F6 D6 Bb5:4 F6', 'E6:6 G6:2 C6:8',
            'A6:2 G6 F6 C6 F6:4 A6', 'D7:4 C7:2 A6 F6:8', 'G6:2 A6 Bb6 G6 E6:4 C6', 'F6:12 r:4'] } },
    order: ['A'] },

  afterglow: { name: 'AFTER THE CLEANUP', jp: 'クリア：おそうじ完了', mood: 'gentle, sleepy F major lullaby for the results screen', bpm: 92,
    lead: { duty: 0.5, vol: 0.055, gate: 0.95 }, p2v: { duty: 0.125, vol: 0.03 },
    sections: { A: { chords: ['F', 'Am', 'Bb', 'C', 'F', 'Am', 'Bb,C', 'F'], p2: 'arp8', bass: 'half', drums: ['k.......h.......'], fill: null,
      mel: ['A5:6 G5:2 F5:4 C5', 'E5:6 F5:2 G5:8', 'F5:4 D5 Bb5 A5:2 G5', 'G5:12 r:4',
            'C6:6 Bb5:2 A5:4 F5', 'E5:4 G5 C6 E6', 'D6:2 C6 Bb5 A5 G5 A5 Bb5 E5', 'F5:12 r:4'] } },
    order: ['A'] },

  laundry: { name: 'SOAP SUDS SHUFFLE', jp: '道中：地下の洗濯場', mood: 'bubbly, slightly sinister G minor shuffle; dripping pipes and steam', bpm: 124, swing: 0.18,
    lead: { duty: 0.125, vol: 0.064, gate: 0.8 }, p2v: { duty: 0.25, vol: 0.036 },
    sections: {
      A: { chords: ['Gm', 'Gm', 'Eb', 'D', 'Gm', 'Cm', 'Eb,D', 'Gm'], p2: 'stab', bass: 'walk',
        drums: ['k..hs.h.k.hhs.h.'], fill: 'k..hs.h.s.s.sscs',
        mel: ['G4:2 Bb4 D5 G5:4 F5:2 D5', 'Eb5:2 D5 C5 Bb4 A4:4 G4', 'Bb4:2 Eb5 G5 Bb5:4 G5:2 Eb5', 'F#5:6 A5:2 D5:8',
              'G5:2 A5 Bb5 D6 C6:4 Bb5:2 A5', 'G5:4 Eb5:2 C5 G5:4 C6', 'Bb5:2 G5 Eb5 G5 A5 F#5 D5 A4', 'G4:12 r:4'] },
      B: { chords: ['Cm', 'F', 'Bb', 'Eb', 'Cm', 'D', 'Gm', 'D7'], p2: 'arp8', bass: 'pop',
        drums: ['k.hhs..hk.hhs.hh'], fill: 'k.hhs.s.s.s.ccc.',
        mel: ['C6:4 Eb6:2 D6 C6:4 G5', 'A5:4 C6:2 Bb5 A5:4 F5', 'D6:2 C6 Bb5 F5 D6:4 F6', 'Eb6:8 G5:4 Bb5',
              'C6:2 D6 Eb6 G6 F6:4 Eb6', 'D6:4 F#6:2 E6 D6:4 A5', 'Bb5:2 A5 G5 D5 G5:4 Bb5', 'A5:8 F#5:4 D5'] },
      A2: { base: 'A', p2: 'echo' } },
    order: ['A', 'B', 'A2'] },

  garden: { name: 'MOONLIT GREENHOUSE', jp: '道中：月下の温室庭園', mood: 'airy, dreamy E dorian waltz-feel in 6/8-ish lilt; glassy arps and soft tom pulse', bpm: 112, swing: 0.28,
    lead: { duty: 0.5, vol: 0.058, gate: 0.92 }, p2v: { duty: 0.125, vol: 0.034 },
    sections: {
      A: { chords: ['Em', 'A', 'Em', 'A', 'G', 'D', 'C', 'B'], p2: 'arp16', bass: 'half',
        drums: ['k.....h.t.....h.'], fill: 'k.....h.t.t.t.c.',
        mel: ['B4:4 E5:2 F#5 G5:6 A5:2', 'B5:8 A5:4 F#5', 'G5:4 E5:2 B4 E5:6 F#5:2', 'C#6:8 B5:4 A5',
              'B5:2 D6 G6:4 F#6:2 E6 D6:4', 'A5:6 D6:2 F#6:8', 'E6:4 G6:2 E6 C6:4 G5', 'F#5:8 D#5:4 B4'] },
      B: { chords: ['C', 'G', 'Am', 'Em', 'C', 'G', 'A', 'B7'], p2: 'arp8', bass: 'drone',
        drums: ['k...h...t...h...'], fill: 'k...h...t.t.tccc',
        mel: ['E6:6 D6:2 C6:4 G5', 'D6:6 B5:2 G5:8', 'C6:4 E6 A6:4 G6:2 E6', 'G6:6 F#6:2 E6:8',
              'E6:2 G6 C7:4 B6:2 G6 E6:4', 'D6:4 G6:2 B6 D7:8', 'C#7:2 B6 A6 E6 C#6:4 E6', 'D#6:8 F#6:4 B5'] } },
    order: ['A', 'B'] },

  clock: { name: 'TICK-TOCK TOWER', jp: '道中：屋根裏と時計塔', mood: 'mechanical, clockwork F# minor march; ticking hats, music-box countermelody, steady climb', bpm: 128,
    lead: { duty: 0.25, vol: 0.064, gate: 0.78 }, p2v: { duty: 0.125, vol: 0.036 },
    sections: {
      A: { chords: ['F#m', 'F#m', 'D', 'E', 'F#m', 'Bm', 'D,E', 'F#m'], p2: 'arp8', bass: 'march',
        drums: ['k.r.s.r.k.r.s.r.'], fill: 'k.r.s.r.s.s.sscs',
        mel: ['F#5:2 C#5 F#5 A5 G#5:4 F#5', 'E5:2 F#5 G#5 A5 C#6:8', 'D6:2 C#6 B5 A5 F#5:4 D5', 'E5:2 G#5 B5 E6 D6:4 B5',
              'C#6:2 A5 F#5 A5 C#6:4 F#6', 'D6:4 B5:2 F#5 B5:4 D6', 'A5:2 F#5 D6 A5 G#5 E5 B5 G#5', 'F#5:12 r:4'] },
      B: { chords: ['Bm', 'C#', 'F#m', 'D', 'Bm', 'C#', 'D', 'C#7'], p2: 'harm3', bass: 'oct8',
        drums: ['k.rrs.r.k.rrs.rk'], fill: 'k.r.s.r.ssssxcx.',
        mel: ['D6:4 F#6:2 E6 D6:4 B5', 'C#6:4 E#6:2 G#6 C#7:8', 'A6:4 F#6:2 C#6 A5:4 C#6', 'D6:2 E6 F#6 A6 F#6:4 D6',
              'B5:2 D6 F#6 B6 A6:4 F#6', 'G#6:4 E#6:2 C#6 G#5:4 C#6', 'D6:2 F#6 A6 D7 C#7:4 A6', 'G#6:8 E#6:4 C#6'] },
      A2: { base: 'A', p2: 'echo' } },
    order: ['A', 'B', 'A2'] },

  chapel: { name: 'REQUIEM FOR DUST BUNNIES', jp: '道中：礼拝堂と地下墓所', mood: 'solemn, eerie C minor chorale-march; organ-like pads, slow hymn melody over a ghostly pulse', bpm: 96,
    lead: { duty: 0.5, vol: 0.058, gate: 0.95 }, p2v: { duty: 0.25, vol: 0.04 },
    sections: {
      A: { chords: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Eb', 'Fm,G', 'Cm'], p2: 'harm3', bass: 'drone',
        drums: ['k.......s.......'], fill: 'k.......s...s.s.',
        mel: ['G5:4 C6:4 Eb6:4 D6:4', 'C6:8 Ab5:8', 'F5:4 Ab5:4 C6:4 Bb5:4', 'B5:12 G5:4',
              'C6:4 Eb6:4 G6:4 F6:4', 'Eb6:8 Bb5:8', 'Ab5:4 C6:4 D6:4 B5:4', 'C6:12 r:4'] },
      B: { chords: ['Ab', 'Bb', 'Gm', 'Cm', 'Fm', 'G', 'Ab,Bb', 'G7'], p2: 'arp8', bass: 'half',
        drums: ['k...h...s...h...'], fill: 'k...h...s.s.sss.',
        mel: ['C6:2 Eb6 Ab6:4 G6:2 F6 Eb6:4', 'D6:2 F6 Bb6:4 Ab6:2 G6 F6:4', 'G6:4 D6:4 Bb5:4 D6:4', 'Eb6:8 C6:8',
              'Ab5:2 C6 F6:4 Eb6:2 D6 C6:4', 'B5:2 D6 G6:4 F6:2 D6 B5:4', 'C6:2 Eb6 Ab6 G6 F6 D6 Bb5 D6', 'G5:12 r:4'] },
      A2: { base: 'A', p2: 'echo' } },
    order: ['A', 'B', 'A2'] },
  bath: { name: 'STEAMY SPLASH', jp: '道中：大浴場と貯水槽', mood: 'relaxed but spooky Bb mixolydian bossa; dripping echoes, warm steam pads, rubber-duck squeaks', bpm: 116, swing: 0.2,
    lead: { duty: 0.125, vol: 0.06, gate: 0.7 }, p2v: { duty: 0.25, vol: 0.038 },
    sections: {
      A: { chords: ['Bb', 'Ab', 'Bb', 'Ab', 'Gm', 'Eb', 'F', 'Bb'], p2: 'arp16', bass: 'walk',
        drums: ['k..h..s.h.k.s..h'], fill: 'k..h..s.s.s.sscs',
        mel: ['D5:2 F5 Bb5:3 Ab5:1 F5:4 D5:2 F5', 'Eb5:3 C5:1 Eb5:2 Ab5:6 G5:2 F5', 'D5:2 F5 Bb5 D6:4 C6:2 Bb5 Ab5', 'C6:8 r:4 Ab5:2 C6',
              'Bb5:2 D6 G6:4 F6:2 D6 Bb5:4', 'G5:2 Bb5 Eb6:4 D6:2 Bb5 G5:4', 'A5:2 C6 F6 Eb6 C6:4 A5:4', 'Bb5:12 r:4'] },
      B: { chords: ['Eb', 'F', 'Dm', 'Gm', 'Cm', 'F', 'Bb,Gm', 'C7,F'], p2: 'stab', bass: 'pop',
        drums: ['k..h..s.h.kks..h'], fill: 'k..h..s.ssscsscs',
        mel: ['G5:2 Bb5 Eb6:6 D6:2 C6 Bb5', 'A5:2 C6 F6:6 Eb6:2 D6 C6', 'D6:4 F6:2 A6 F6:4 D6', 'G6:8 D6:8',
              'Eb6:2 D6 C6 G5 C6:4 Eb6', 'F6:4 C6:2 A5 F5:4 A5', 'Bb5:2 D6 F6 Bb6 G6:4 D6', 'E6:4 G6:4 F6:8'] } },
    order: ['A', 'B'] },
  boss4: { name: 'FORTISSIMO / BOILING POINT', jp: 'ボス：呪いのパイプオルガン＆大浴場の主', mood: 'dramatic D minor toccata-rock; descending organ runs over a pounding gallop', bpm: 168,
    lead: { duty: 0.25, vol: 0.066, gate: 0.82 }, p2v: { duty: 0.5, vol: 0.034 },
    sections: {
      A: { chords: ['Dm', 'C#dim', 'Dm', 'A7', 'Dm', 'Bb', 'Gm,A', 'Dm'], p2: 'arp16', bass: 'gallop',
        drums: ['k.h.s.h.k.k.s.h.'], fill: 'k.h.s.h.s.s.sscs',
        mel: ['A5:1 G5 A5:6 G5:1 F5 E5 D5 C#5:4', 'D5:12 r:4', 'A5:1 G5 A5:2 E5 F5 C#5 D5:6', 'A4:12 r:4',
              'D6:2 C6 Bb5 A5 G5 F5 E5 D5', 'Bb5:4 D6:4 F6:8', 'G6:2 F6 E6 D6 C#6:4 A5', 'D6:12 r:4'] },
      B: { chords: ['Bb', 'C', 'A', 'Dm', 'Gm', 'A', 'Bb,C', 'A7'], p2: 'harm3', bass: 'oct8',
        drums: ['k.hks.h.k.hks.hk'], fill: 'k.hks.h.sssscsxc',
        mel: ['F6:4 D6:2 Bb5 F6:4 Bb6', 'G6:4 E6:2 C6 G6:4 C7', 'A6:2 G6 F6 E6 C#6:4 A5', 'D6:4 F6:4 A6:8',
              'Bb6:2 A6 G6 F6 D6:4 G6', 'A6:2 G6 F6 E6 C#6:4 E6', 'D6:2 F6 Bb6 C7 A6:4 F6', 'E6:4 C#6:4 A5:8'] } },
    order: ['A', 'B'] },
  boss2: { name: 'WASH CYCLE / THORN WALTZ', jp: 'ボス：洗濯ゴーレム＆夜咲きの女王', mood: 'urgent C minor boss theme; churning ostinato, pounding toms', bpm: 160,
    lead: { duty: 0.25, vol: 0.07, gate: 0.82 }, p2v: { duty: 0.125, vol: 0.036 },
    sections: {
      A: { chords: ['Cm', 'Cm', 'Ab', 'G', 'Cm', 'Fm', 'Ab,G', 'Cm'], p2: 'arp16', bass: 'gallop',
        drums: ['k.hks.hkk.hks.ht'], fill: 'k.hks.hks.t.t.tt',
        mel: ['C5:2 Eb5 G5 C6 B5:4 G5', 'Ab5:2 G5 F5 Eb5 D5:4 G4', 'Ab5:2 C6 Eb6 Ab6 G6:4 Eb6', 'D6:6 F6:2 B5:8',
              'C6:2 G5 Eb6 C6 G6:4 F6:2 Eb6', 'F6:4 Ab6:2 G6 F6:4 C6', 'Eb6:2 D6 C6 Ab5 B5 D6 F6 G6', 'C6:12 r:4'] },
      B: { chords: ['Fm', 'Bb', 'Eb', 'Ab', 'Fm', 'G', 'Ab', 'G7'], p2: 'harm3', bass: 'oct8',
        drums: ['k.tks.tkk.tks.tk'], fill: 'k.k.s.k.ssssxcx.',
        mel: ['F5:4 Ab5:2 C6 F6:4 Eb6', 'D6:4 F6:2 Bb5 D6:4 F6', 'Eb6:6 D6:2 Bb5:4 G5', 'Ab5:2 C6 Eb6 Ab6 G6:4 Eb6',
              'F6:4 C6:2 Ab5 F5:4 Ab5', 'G5:2 B5 D6 G6 F6:4 D6', 'Eb6:2 D6 C6 Eb6 Ab6:4 G6', 'G6:8 F6:4 D6'] } },
    order: ['A', 'B'] },

  boss3: { name: 'MIDNIGHT STRIKES', jp: 'ボス：大時計の番人', mood: 'final boss, B minor; relentless ticking, bell-like accents, rising sequence', bpm: 176,
    lead: { duty: 0.25, vol: 0.072, gate: 0.8 }, p2v: { duty: 0.25, vol: 0.034 },
    sections: {
      A: { chords: ['Bm', 'Bm', 'G', 'F#', 'Bm', 'Em', 'G,F#', 'Bm'], p2: 'arp16', bass: 'gallop',
        drums: ['k.rks.rkk.rks.rk'], fill: 'k.rks.rks.s.ssss',
        mel: ['B4:1 r B4 r F#5:2 B5 D6 C#6 B5 A#5', 'B5:4 D6:2 F#6 B6:8', 'G6:2 F#6 E6 D6 B5 D6 G6 B6', 'A#6:6 C#7:2 F#6:8',
              'B6:2 A#6 B6 F#6 D6 F#6 B6 D7', 'C#7:4 B6:2 A#6 B6:8', 'G6:2 B6 E7 B6 F#6 A#6 C#7 E7', 'D7:4 C#7 B6:8'] },
      B: { chords: ['Em', 'A', 'D', 'G', 'Em', 'F#', 'G', 'F#7'], p2: 'harm3', bass: 'oct8',
        drums: ['k.hks.hkk.hks.hk'], fill: 'k.k.s.k.ssssxcx.',
        mel: ['E6:4 G6:2 B6 E7:4 D7', 'C#7:4 A6:2 E6 C#7:4 E7', 'D7:6 C#7:2 A6:4 F#6', 'G6:2 B6 D7 G7 F#7:4 D7',
              'E7:4 B6:2 G6 E6:4 G6', 'F#6:2 A#6 C#7 F#7 E7:4 C#7', 'D7:2 C#7 B6 D7 G7:4 F#7', 'F#7:8 E7:4 C#7'] },
      A2: { base: 'A', p2: 'echo' } },
    order: ['A', 'B', 'A2'] },

  // ---- v0.4 ----
  theater: { name: 'STRINGS ATTACHED', jp: '道中：人形劇場', mood: 'creepy cabaret waltz-tango in D minor, music-box lead over an oom-pah bass, curtain-call flourishes', bpm: 128,
    lead: { duty: 0.125, vol: 0.064, gate: 0.78 }, p2v: { duty: 0.25, vol: 0.034 },
    sections: {
      A: { chords: ['Dm', 'A7', 'Dm', 'Gm', 'Dm', 'Bb', 'Em7b5,A', 'Dm'], p2: 'stab', bass: 'pop',
        drums: ['k...s.s.k...s.s.'], fill: 'k...s.s.k.s.ssss',
        mel: ['D5:3 E5:1 F5:2 A5 D6:4 C#6:2 A5', 'G5:6 E5:2 C#5:8', 'F5:3 G5:1 A5:2 D6 F6:4 E6:2 D6', 'Bb5:6 G5:2 D5:8',
              'A5:3 G5:1 F5:2 E5 D5:4 F5:2 A5', 'D6:6 Bb5:2 F5:8', 'G5:2 Bb5 E6 G5 A5 C#6 E6 G6', 'F6:4 E6 D6:8'] },
      B: { chords: ['F', 'C', 'Bb', 'A', 'Gm', 'Dm', 'E7', 'A7'], p2: 'harm3', bass: 'walk',
        drums: ['k.h.s.h.k.h.s.hh'], fill: 'k.s.s.s.ssssxcx.',
        mel: ['A5:4 C6:2 F6 A6:4 G6:2 F6', 'E6:6 C6:2 G5:8', 'D6:4 F6:2 Bb6 D7:4 C7:2 Bb6', 'A6:6 C#7:2 E7:8',
              'D7:4 Bb6:2 G6 D6:4 G6', 'F6:4 D6:2 A5 F5:4 A5', 'G#5:2 B5 D6 E6 G#6 B6 D7 E7', 'C#7:8 E6:4 A6'] },
      A2: { base: 'A', p2: 'echo' } },
    order: ['A', 'B', 'A2'] },

  stars: { name: 'COUNTING STARS', jp: '道中：星見の天文台', mood: 'weightless, sparkling E major nocturne; glassy arpeggios turning like an orrery, soft pulse', bpm: 104,
    lead: { duty: 0.125, vol: 0.058, gate: 0.92 }, p2v: { duty: 0.125, vol: 0.03 },
    sections: {
      A: { chords: ['Emaj7', 'C#m', 'Amaj7', 'B', 'Emaj7', 'G#m', 'Amaj7', 'B'], p2: 'arp16', bass: 'half',
        drums: ['k.......s.......'], fill: 'k.......s...s.ss',
        mel: ['B5:4 G#5:2 E5 B5:4 D#6', 'E6:6 C#6:2 G#5:8', 'C#6:4 A5:2 E5 C#6:4 E6', 'F#6:8 D#6:4 B5',
              'G#6:4 E6:2 B5 G#6:4 B6', 'A#6:6 G#6:2 D#6:8', 'C#7:4 B6:2 A6 E6:4 C#6', 'D#6:12 r:4'] },
      B: { chords: ['C#m', 'G#m', 'A', 'E', 'F#m', 'C#m', 'D#m7b5,G#', 'C#m,B'], p2: 'echo', bass: 'drone',
        drums: ['k...h...s...h...'], fill: 'k...h...s.s.sss.',
        mel: ['E6:6 D#6:2 C#6:4 G#5', 'B5:6 A#5:2 G#5:8', 'C#6:4 E6:2 A6 C#7:4 B6', 'G#6:12 r:4',
              'A6:4 F#6:2 C#6 A5:4 C#6', 'E6:6 D#6:2 C#6:8', 'F#6:2 A6 C7 B6 G#6 D#6 B#5 D#6', 'C#6:8 D#6:4 B5'] },
      A2: { base: 'A', p2: 'arp8' } },
    order: ['A', 'B', 'A2'] },

  boss5: { name: 'CURTAIN CALL', jp: 'ボス：人形座長／星喰いの天球儀', mood: 'theatrical F minor boss theme; galloping strings, brassy stabs, a whirling bridge', bpm: 160,
    lead: { duty: 0.25, vol: 0.07, gate: 0.84 }, p2v: { duty: 0.125, vol: 0.036 },
    sections: {
      A: { chords: ['Fm', 'Fm', 'Db', 'C', 'Fm', 'Bbm', 'Gm7b5,C', 'Fm'], p2: 'arp16', bass: 'gallop',
        drums: ['k.hks.hkk.hks.hk'], fill: 'k.hks.hks.s.ssss',
        mel: ['F5:2 Ab5 C6 F6 E6:4 C6', 'Ab5:2 G5 F5 C5 F5:8', 'Db6:2 C6 Bb5 Ab5 F5:4 Ab5', 'G5:6 E5:2 C5:8',
              'C6:2 Ab5 F5 Ab5 C6:4 F6', 'Db6:4 Bb5:2 F5 Db6:4 F6', 'E6:2 G6 Bb6 G6 E6 C6 E6 G6', 'F6:12 r:4'] },
      B: { chords: ['Db', 'Eb', 'C', 'Fm', 'Bbm', 'C', 'Db,Eb', 'C7'], p2: 'harm3', bass: 'oct8',
        drums: ['k.k.s.k.k.k.s.kk'], fill: 'k.s.s.s.ssssxcx.',
        mel: ['F6:4 Ab6:2 F6 Db6:4 F6', 'G6:4 Bb6:2 G6 Eb6:4 G6', 'E6:4 G6:2 C7 E7:4 C7', 'Ab6:6 G6:2 F6:8',
              'F6:4 Db6:2 Bb5 F6:4 Bb6', 'G6:4 E6:2 C6 G6:4 C7', 'Db7:2 C7 Bb6 Ab6 Bb6 C7 Db7 Eb7', 'E7:8 C7:4 G6'] },
      A2: { base: 'A', p2: 'echo' } },
    order: ['A', 'B', 'A2'] },

  chronoa: { name: 'NOT DONE YET', jp: 'ボス：時計塔管理人クロノア', mood: 'true final boss, C# minor; drowsy music-box intro feel over a relentless clockwork gallop, rewinding runs', bpm: 164,
    lead: { duty: 0.25, vol: 0.07, gate: 0.82 }, p2v: { duty: 0.125, vol: 0.034 },
    sections: {
      A: { chords: ['C#m', 'A', 'F#m', 'G#', 'C#m', 'A', 'D#m7b5,G#', 'C#m'], p2: 'arp16', bass: 'gallop',
        drums: ['k.hks.hkk.hks.hk'], fill: 'k.hks.hks.s.ssss',
        mel: ['G#5:2 C#6 E6 G#6 F#6:4 E6', 'E6:2 D#6 C#6 B5 C#6:8', 'A5:2 C#6 F#6 A6 G#6:4 F#6', 'B#5:6 D#6:2 G#5:8',
              'C#6:2 E6 G#6 C#7 B6:4 G#6', 'A6:4 G#6:2 F#6 E6:8', 'F#6:2 A6 C#7 A6 G#6 B#6 D#7 B#6', 'C#7:12 r:4'] },
      B: { chords: ['A', 'B', 'G#m', 'C#m', 'F#m', 'G#', 'A,B', 'G#7'], p2: 'harm3', bass: 'oct8',
        drums: ['k.k.s.k.k.k.s.kk'], fill: 'k.s.s.s.ssssxcx.',
        mel: ['C#7:4 B6:2 A6 E6:4 A6', 'D#7:4 C#7:2 B6 F#6:4 B6', 'B6:2 A6 G#6 D#6 G#6:8', 'E6:2 G#6 C#7 E7 D#7:4 C#7',
              'C#7:4 A6:2 F#6 C#6:4 F#6', 'B#6:4 G#6:2 D#6 B#5:4 D#6', 'C#7:2 B6 A6 B6 C#7 D#7 E7 F#7', 'G#7:8 F#7:4 D#7'] },
      A2: { base: 'A', p2: 'echo' } },
    order: ['A', 'B', 'A2'] },

  velnight: { name: 'THE SECRETARY', jp: 'エンディング：主人付き秘書', mood: 'slow, polite and unsettling D minor; sparse harpsichord over a low drone, something breathing behind it', bpm: 76,
    lead: { duty: 0.125, vol: 0.05, gate: 0.9 }, p2v: { duty: 0.5, vol: 0.026 },
    sections: { A: { chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Em7b5,A', 'Dm'], p2: 'arp8', bass: 'drone', drums: ['k...............'], fill: null,
      mel: ['A5:6 F5:2 D5:8', 'D6:6 C6:2 Bb5:8', 'G5:4 Bb5 D6 C#6', 'E6:12 r:4',
            'F6:6 E6:2 D6:4 A5', 'Bb5:4 D6 F6 E6', 'G5:4 Bb5 E6 C#6', 'D6:12 r:4'] } },
    order: ['A'] },

  jingle_warning: { once: true, name: 'JINGLE: WARNING!', jp: 'ジングル：ボス出現', mood: 'tritone alarm before the boss', bpm: 150,
    lead: { duty: 0.125, vol: 0.06, gate: 0.9 }, p2v: { duty: 0.5, vol: 0.03 },
    sections: { A: { chords: ['E5', 'E5'], p2: 'echo', bass: 'drone', drums: ['t...t...t...t...'], fill: 'x.x.x.x.ssssc...',
      mel: ['E5:4 A#5 E5 A#5', 'E5:4 A#5 E6:8'] } },
    order: ['A'] },
  jingle_save: { once: true, name: 'JINGLE: SAVED', jp: 'ジングル：セーブ', mood: 'soft lantern chime', bpm: 120,
    lead: { duty: 0.25, vol: 0.06, gate: 1 }, p2v: { duty: 0.125, vol: 0.03 },
    sections: { A: { chords: ['C', 'F,G', 'C'], p2: 'arp8', bass: 'half', drums: ['................'], fill: null,
      mel: ['E5:2 G5 C6 E6:10', 'F6:4 D6 B5 G5', 'C6:12 r:4'] } },
    order: ['A'] },
  jingle_clear: { once: true, name: 'JINGLE: CLEANED UP!', jp: 'ジングル：ボス撃破', mood: 'triumphant fanfare', bpm: 150,
    lead: { duty: 0.25, vol: 0.075, gate: 0.95 }, p2v: { duty: 0.5, vol: 0.04 },
    sections: { A: { chords: ['Ab', 'Bb', 'C'], p2: 'harm3', bass: 'half', drums: ['x...s.s.x.s.s.ss'], fill: 'c...............',
      mel: ['C6:2 Eb6 Ab6 C7:6 Bb6:2 Ab6', 'D6:2 F6 Bb6 D7:6 C7:2 Bb6', 'C7:12 r:4'] } },
    order: ['A'] },
  jingle_gameover: { once: true, name: 'JINGLE: DOWN', jp: 'ジングル：やられた', mood: 'short, sleepy falling phrase', bpm: 92,
    lead: { duty: 0.5, vol: 0.06, gate: 1 }, p2v: { duty: 0.125, vol: 0.03 },
    sections: { A: { chords: ['Dm', 'Gm,A'], p2: 'harm3', bass: 'half', drums: ['................'], fill: null,
      mel: ['F5:2 E5 D5 A4 F4:8', 'G4:4 E4 D4:8'] } },
    order: ['A'] },
};
const MUSIC_LIST = ['title', 'mansion', 'laundry', 'garden', 'clock', 'chapel', 'bath', 'boss', 'boss2', 'boss3', 'boss4', 'theater', 'stars', 'boss5', 'vault', 'afterglow', 'jingle_warning', 'jingle_save', 'jingle_clear', 'jingle_gameover'];
const BOSS_THEMES = new Set(['boss', 'boss2', 'boss3']);
const BOSS_MUSIC = { chronoa: 'chronoa', marionette: 'boss5', orrery: 'boss5', chandelier: 'boss', golem: 'boss2', rose: 'boss2', clock: 'boss3', organ: 'boss4', serpent: 'boss4' };

// ---------------------------------------------------------------------
//  compiler: song -> events per 16th step  { ch: 'p1'|'p2'|'tri'|'noi', m: midi, len (steps), vol, duty, kind }
// ---------------------------------------------------------------------
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteMidi(s) { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) return null; return 12 * (+m[3] + 1) + NOTE_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
const CHORD_Q = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], m7b5: [0, 3, 6, 10], '5': [0, 7, 12], sus4: [0, 5, 7], aug: [0, 4, 8] };
function parseChord(c) { const m = /^([A-G])([#b]?)(.*)$/.exec(c); const pc = NOTE_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return { pc: (pc + 12) % 12, iv: CHORD_Q[m[3]] || CHORD_Q[''] }; }
function parseMel(str) { // -> [{m|null, len}]
  const out = []; let len = 2;
  for (const tok of str.trim().split(/\s+/)) { const [n, l] = tok.split(':'); if (l) len = +l; out.push({ m: n === 'r' ? null : noteMidi(n), len }); }
  return out;
}
function musicSection(song, key) {
  let s = song.sections[key]; if (!s.base) return s;
  const [sid, sk] = s.base.includes('.') ? s.base.split('.') : [null, s.base];
  const src = sid ? MUSIC_SONGS[sid].sections[sk] : song.sections[sk];
  return Object.assign({}, src, s, { base: undefined });
}
const MUSIC_CACHE = {};
function compileSong(id) {
  if (MUSIC_CACHE[id]) return MUSIC_CACHE[id];
  const song = MUSIC_SONGS[id], ev = [], push = (step, e) => { (ev[step] = ev[step] || []).push(e); };
  let bar0 = 0;
  for (const key of song.order) {
    const S = musicSection(song, key), bars = S.chords.length, L = song.lead, V = song.p2v;
    // chord segments
    const segs = []; S.chords.forEach((c, b) => { const parts = c.split(','), n = parts.length; parts.forEach((p, i) => segs.push({ s: (bar0 + b) * 16 + i * 16 / n, len: 16 / n, ch: parseChord(p) })); });
    const chordAt = st => { let r = segs[0]; for (const g of segs) if (g.s <= st) r = g; return r; };
    // lead
    const lead = []; let st = bar0 * 16;
    for (const barStr of S.mel) for (const n0 of parseMel(barStr)) { const n = n0.m === null ? n0 : { m: n0.m + (song.transpose || 0), len: n0.len }; if (n.m !== null) { lead.push({ s: st, m: n.m, len: n.len }); push(st, { ch: 'p1', m: n.m, len: n.len * L.gate, vol: L.vol, duty: L.duty }); } st += n.len; }
    // pulse 2
    if (S.p2line) { for (let b = 0; b < bars; b++) { let t = (bar0 + b) * 16; for (const n of parseMel(S.p2line)) { if (n.m !== null) push(t, { ch: 'p2', m: n.m, len: n.len * 0.7, vol: V.vol, duty: V.duty }); t += n.len; } } }
    else if (S.p2 === 'echo') for (const n of lead) push(n.s + 3, { ch: 'p2', m: n.m, len: Math.max(1, n.len * L.gate - 0.5), vol: V.vol, duty: V.duty });
    else if (S.p2 === 'harm3') for (const n of lead) { // closest chord tone at least a minor third below the lead
      const c = chordAt(n.s).ch; let best = n.m - 3;
      for (let m = n.m - 3; m > n.m - 10; m--) if (c.iv.some(iv => ((m - c.pc - iv) % 12 + 12) % 12 === 0)) { best = m; break; }
      push(n.s, { ch: 'p2', m: best, len: n.len * L.gate, vol: V.vol, duty: V.duty });
    }
    else for (const g of segs) {
      const tones = g.ch.iv.map(iv => 60 + ((g.ch.pc + iv) % 12));  // octave 4..5
      tones.sort((a, b) => a - b);
      if (S.p2 === 'arp16' || S.p2 === 'arp8') { const d = S.p2 === 'arp16' ? 1 : 2, seq = tones.concat([tones[0] + 12]); for (let k = 0; k < g.len; k += d) push(g.s + k, { ch: 'p2', m: seq[(k / d) % seq.length], len: d * 0.9, vol: V.vol, duty: V.duty }); }
      else if (S.p2 === 'stab') for (let k = 2; k < g.len; k += 4) push(g.s + k, { ch: 'p2', m: tones[(k >> 2) % 2 ? 2 : 1] || tones[1], len: 1, vol: V.vol, duty: V.duty });
      else if (S.p2 === 'comp') for (let k = 4; k < g.len; k += 8) { push(g.s + k, { ch: 'p2', m: tones[1], len: 1.5, vol: V.vol, duty: V.duty }); }
    }
    // triangle bass
    for (const g of segs) {
      const r = 36 + g.ch.pc + (g.ch.pc < 4 ? 12 : 0), f = r + (g.ch.iv[2] === 12 ? 7 : g.ch.iv[2]), b = (k, m, l) => push(g.s + k, { ch: 'tri', m, len: l });
      const st2 = S.bass;
      if (st2 === 'oct8') for (let k = 0; k < g.len; k += 2) b(k, (k >> 1) & 1 ? r + 12 : r, 1.6);
      else if (st2 === 'root8') for (let k = 0; k < g.len; k += 2) b(k, k === g.len - 2 ? f : r, 1.7);
      else if (st2 === 'gallop') for (let k = 0; k < g.len; k += 4) { b(k, r, 1.6); b(k + 2, r + 12, 0.8); b(k + 3, r + 12, 0.8); }
      else if (st2 === 'pop') { for (const k of [0, 3, 6, 8, 11, 14]) if (k < g.len) b(k, k === 8 ? f : k === 14 ? r + 12 : r, k === 8 || k === 0 ? 2.5 : 1.5); }
      else if (st2 === 'march') for (let k = 0; k < g.len; k += 4) { b(k, r, 1.8); b(k + 2, k % 8 ? f : r + 12, 1.6); }
      else if (st2 === 'half') for (let k = 0; k < g.len; k += 8) b(k, k ? f : r, 7.5);
      else if (st2 === 'drone') for (let k = 0; k < g.len; k += 4) b(k, k % 8 ? f : r, 3.6);
      else if (st2 === 'walk') { const nx = chordAt(g.s + g.len) || g, nr = 36 + nx.ch.pc + (nx.ch.pc < 4 ? 12 : 0); const third = r + g.ch.iv[1];
        const line = [r, third, f, nr + (nr > f ? -1 : 1)]; for (let k = 0; k < g.len; k += 4) b(k, line[(k >> 2) % 4], 3.2); }
    }
    // drums
    for (let b = 0; b < bars; b++) {
      const pat = (b === bars - 1 && S.fill) ? S.fill : S.drums[b % S.drums.length];
      for (let k = 0; k < 16; k++) { const c = pat[k]; if (c && c !== '.') push((bar0 + b) * 16 + k, { ch: 'noi', kind: c }); }
    }
    bar0 += bars;
  }
  const steps = bar0 * 16, stepDur = 60 / song.bpm / 4;
  return (MUSIC_CACHE[id] = { id, ev, steps, stepDur, dur: steps * stepDur, swing: song.swing || 0, once: !!song.once });
}
function musicStepTime(C, k) { return k * C.stepDur + ((k & 3) === 2 ? C.swing * C.stepDur * 2 : (k & 3) === 3 ? C.swing * C.stepDur : 0); }

// ---------------------------------------------------------------------
//  voices (work on any AudioContext / OfflineAudioContext)
// ---------------------------------------------------------------------
const MUSIC_WAVES = new WeakMap();
function pulseWave(ctx, duty) {
  let W = MUSIC_WAVES.get(ctx); if (!W) { W = {}; MUSIC_WAVES.set(ctx, W); }
  if (W[duty]) return W[duty];
  const N = 32, re = new Float32Array(N), im = new Float32Array(N);
  for (let n = 1; n < N; n++) { re[n] = Math.sin(2 * Math.PI * n * duty) / (n * Math.PI); im[n] = (1 - Math.cos(2 * Math.PI * n * duty)) / (n * Math.PI); } // pulse of width 'duty'
  return (W[duty] = ctx.createPeriodicWave(re, im));
}
function noiseBuf(ctx) {
  let W = MUSIC_WAVES.get(ctx); if (!W) { W = {}; MUSIC_WAVES.set(ctx, W); }
  if (W.noise) return W.noise;
  const n = Math.floor(ctx.sampleRate * 0.6), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  let lfsr = 1; for (let i = 0; i < n; i++) { if (i % 2 === 0) { const bit = (lfsr ^ (lfsr >> 1)) & 1; lfsr = (lfsr >> 1) | (bit << 14); } d[i] = (lfsr & 1) ? 0.9 : -0.9; } // NES-style LFSR noise
  return (W.noise = b);
}
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
function musicNote(ctx, dest, e, t, stepDur) {
  const dur = Math.max(0.03, e.len * stepDur), end = t + dur;
  if (e.ch === 'noi') return musicDrum(ctx, dest, e.kind, t);
  const o = ctx.createOscillator(), gn = ctx.createGain();
  if (e.ch === 'tri') { o.type = 'triangle'; } else o.setPeriodicWave(pulseWave(ctx, e.duty));
  o.frequency.setValueAtTime(midiHz(e.m), t);
  const v = e.ch === 'tri' ? 0.16 : e.vol;
  gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(v, t + 0.004);
  if (e.ch !== 'tri') gn.gain.linearRampToValueAtTime(v * 0.62, t + Math.min(dur, 0.18));
  gn.gain.setValueAtTime(e.ch === 'tri' ? v : v * 0.62, Math.max(t + 0.005, end - 0.012)); gn.gain.linearRampToValueAtTime(0, end);
  if (e.ch === 'p1' && dur > 0.32) { // gentle delayed vibrato on long lead notes
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(14, t + 0.3);
    lfo.connect(lg); lg.connect(o.detune); lfo.start(t + 0.15); lfo.stop(end + 0.02);
  }
  o.connect(gn); gn.connect(dest); o.start(t); o.stop(end + 0.02);
}
function musicDrum(ctx, dest, k, t) {
  const hit = (dur, vol, type, freq, q) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    s.buffer = noiseBuf(ctx); s.playbackRate.value = k === 't' || k === 'k' ? 0.5 : 1; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(gn); gn.connect(dest); s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.01);
  };
  const thump = (f0, f1, dur, vol) => { const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(gn); gn.connect(dest); o.start(t); o.stop(t + dur + 0.01); };
  if (k === 'k' || k === 'x') { thump(160, 45, 0.11, 0.22); hit(0.05, 0.08, 'lowpass', 900); }
  if (k === 's' || k === 'x') { hit(0.13, 0.11, 'bandpass', 1900, 0.8); }
  if (k === 'h') hit(0.035, 0.05, 'highpass', 7000);
  if (k === 'o') hit(0.16, 0.05, 'highpass', 6000);
  if (k === 'c') hit(0.7, 0.07, 'highpass', 4000);
  if (k === 'r') hit(0.03, 0.09, 'bandpass', 2600, 4);
  if (k === 't') { thump(110, 55, 0.28, 0.26); hit(0.2, 0.09, 'lowpass', 500); }
}
// schedule steps [k0, k1) of a compiled song, step k at time t0 + musicStepTime(k)
function musicSchedule(ctx, dest, C, k0, k1, t0) {
  for (let k = k0; k < k1; k++) { const L = C.ev[k]; if (!L) continue; const t = t0 + musicStepTime(C, k); for (const e of L) musicNote(ctx, dest, e, t, C.stepDur); }
}

// ---------------------------------------------------------------------
//  live player (Snd.ctx, under Snd.master so SOUND OFF mutes it)
// ---------------------------------------------------------------------
const Music = { id: null, want: null, C: null, bus: null, step: 0, loopT0: 0, vol: 0.4, plays: 0, history: [], done: false, endT: 0 };
function musicPlay(id) {
  if (Music.id === id) return;
  musicStopBus();
  Music.id = id; Music.C = null; Music.done = false;
  if (id) { Music.plays++; Music.history.push(id); if (Music.history.length > 40) Music.history.shift(); }
}
function musicStopBus() {
  const c = Snd.ctx; if (!c || !Music.bus) { Music.bus = null; return; }
  const b = Music.bus, t = c.currentTime; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t + 0.25);
  setTimeout(() => { try { b.disconnect(); } catch (_) {} }, 1500); Music.bus = null;
}
function musicTick() {
  const want = musicWanted(), c = Snd.ctx, live = !!c && c.state === 'running';
  if (want !== Music.want) { // a boss theme entered during the boss intro gets the WARNING sting first
    const prev = Music.want; Music.want = want;
    musicPlay(live && want && musicBossIntro() && BOSS_THEMES.has(want) && want !== prev ? 'jingle_warning' : want);
  }
  if (Music.done && Music.id !== Music.want && c && c.currentTime >= Music.endT) musicPlay(Music.want); // sting finished -> the wanted track
  if (!live || !Music.id || Music.done) return;
  if (!Music.bus) { // (re)start the current track
    Music.C = compileSong(Music.id); Music.bus = c.createGain(); Music.bus.gain.value = Music.vol; Music.bus.connect(Snd.master);
    Music.step = 0; Music.loopT0 = c.currentTime + 0.06;
  }
  const C = Music.C, ahead = c.currentTime + 0.18;
  if (Music.loopT0 + musicStepTime(C, Music.step) < c.currentTime - 0.3) { // tab was hidden: resync instead of a burst
    Music.loopT0 = c.currentTime + 0.05 - musicStepTime(C, Music.step);
  }
  let n = 0;
  while (Music.loopT0 + musicStepTime(C, Music.step) < ahead && n++ < 64) {
    musicSchedule(c, Music.bus, C, Music.step, Music.step + 1, Music.loopT0);
    if (++Music.step >= C.steps) { if (C.once) { Music.done = true; Music.endT = Music.loopT0 + C.dur; break; } Music.step = 0; Music.loopT0 += C.dur; }
  }
}
// which track each scene wants
function musicBossIntro() { return state === 'play' && boss && boss.state === 'intro'; }
function musicWanted() {
  if (state === 'title' || state === 'loading') return 'title';
  if (state === 'clear') return clearT < 200 ? 'jingle_clear' : 'afterglow';
  if (state !== 'play' && state !== 'map') return null;
  if (P.dead) return 'jingle_gameover';
  if (typeof STORY !== 'undefined' && STORY.scene) return STORY.scene.t < 220 ? null : 'velnight';
  if (boss && boss.state !== 'sleep' && boss.state !== 'done') return boss.state === 'dying' ? null : BOSS_MUSIC[boss.kind] || 'boss';
  if (room && room.def.secret) return 'vault';
  return room && AREAS[room.def.area] ? AREAS[room.def.area].music : 'mansion';
}
async function musicRenderWav(id, sampleRate, normalize) {
  const C = compileSong(id), sr = sampleRate || 44100, AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const len = Math.ceil((C.once ? C.dur + 0.8 : C.dur * 2) * sr), ctx = new AC(1, len, sr), bus = ctx.createGain(); bus.gain.value = Music.vol * 0.3 * 2.2; bus.connect(ctx.destination);
  musicSchedule(ctx, bus, C, 0, C.steps, 0); if (!C.once) musicSchedule(ctx, bus, C, 0, C.steps, C.dur); // loops: 2 passes, keep the 2nd (it carries the 1st loop's tails = seamless)
  const buf = await ctx.startRendering(), d = buf.getChannelData(0), s0 = C.once ? 0 : Math.round(C.dur * sr), n = C.once ? len : Math.round(C.dur * sr);
  const out = new DataView(new ArrayBuffer(44 + n * 2)), w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 2, true);
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[s0 + i] || 0));
  const gain = normalize && peak > 0 ? normalize / peak : 1; // e.g. 0.8 -> files peak at -2 dBFS
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, (d[s0 + i] || 0) * gain)) * 32767, true);
  const bytes = new Uint8Array(out.buffer); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { b64: btoa(bin), dur: C.dur, peak: peak * gain, rawPeak: peak };
}
