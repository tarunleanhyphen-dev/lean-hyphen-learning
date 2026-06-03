/**
 * Audio system for Act 1.
 * - Effect cues synthesised via Web Audio (no asset files needed)
 * - Background music: pad + bass + melody scheduled on AudioContext clock
 * - Shanaya's lines spoken via the Web Speech API
 *
 * AudioContext must be unlocked by a user gesture. Call `unlockAudio(true)`
 * from a click handler before scheduling anything.
 */

let ctx = null;
let master = null;
let musicGain = null;
let muted = true;

const MASTER_VOLUME = 0.85;
// Round 2 of the music-too-loud QA cycle. 0.25 was still too forward,
// so dropping again to 0.10 puts the busiest mood at ~0.17 final gain
// — barely-there ambience that won't fight the narrator.
const MUSIC_VOLUME = 0.10;

function ensureCtx() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_VOLUME;
  master.connect(ctx.destination);
  return ctx;
}

export function isAudioReady() {
  return ctx?.state === 'running' && !muted;
}

export async function unlockAudio(enabled) {
  ensureCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }
  muted = !enabled;
  const target = enabled ? MASTER_VOLUME : 0;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.15);
  if (!enabled) {
    stopMusic();
    cancelSpeech();
  }
}

/* ============== Effect synthesis ============== */

function tone({ freq, freqEnd, type = 'sine', attack = 0.005, hold = 0, decay = 0.25, peak = 0.32, target }) {
  if (muted || !ensureCtx()) return;
  const dest = target || master;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + attack + hold + decay);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  if (hold > 0) g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + decay);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + attack + hold + decay + 0.05);
}

export const sounds = {
  add() {
    tone({ freq: 880,  freqEnd: 1320, type: 'sine',     attack: 0.005, decay: 0.22, peak: 0.32 });
    setTimeout(() => tone({ freq: 1320, freqEnd: 1568, type: 'sine', attack: 0.005, decay: 0.18, peak: 0.22 }), 70);
  },
  ding() {
    tone({ freq: 1175, type: 'triangle', attack: 0.003, decay: 0.55, peak: 0.35 });
    setTimeout(() => tone({ freq: 1568, type: 'triangle', attack: 0.003, decay: 0.40, peak: 0.22 }), 40);
  },
  freeze() {
    tone({ freq: 392, freqEnd: 196, type: 'sine', attack: 0.02, decay: 0.9, peak: 0.30 });
  },
  reveal() {
    tone({ freq: 110, freqEnd: 220, type: 'triangle', attack: 0.25, decay: 1.4, peak: 0.34 });
    setTimeout(() => tone({ freq: 220, freqEnd: 330, type: 'sine', attack: 0.05, decay: 1.2, peak: 0.22 }), 250);
  },
  tap() {
    tone({ freq: 660, freqEnd: 440, type: 'sine', attack: 0.001, decay: 0.10, peak: 0.18 });
  },
  click() {
    tone({ freq: 1200, type: 'sine', attack: 0.001, decay: 0.07, peak: 0.12 });
  },
  alert() {
    tone({ freq: 880, freqEnd: 1100, type: 'sawtooth', attack: 0.003, decay: 0.22, peak: 0.18 });
  },
  // "Aha moment" — a clean two-note bell that says "you just noticed
  // something". Played alongside the InsightCallout reveal so every
  // insight earns a tiny audible win.
  aha() {
    tone({ freq: 988,  type: 'triangle', attack: 0.003, decay: 0.32, peak: 0.22 });
    setTimeout(() => tone({ freq: 1318, type: 'triangle', attack: 0.003, decay: 0.45, peak: 0.18 }), 80);
  },
};

/* ============== Music sequencer (mood-aware) ==============
 * The music engine schedules four-bar chord loops on the AudioContext clock.
 * Instead of one fixed loop, every bar reads the *current mood* and uses that
 * mood's chord progression + instrumentation. Mood transitions happen on bar
 * boundaries, so the music never glitches mid-phrase — it just gracefully
 * shifts when Shanaya's emotion / the scene shifts.
 *
 * Moods:
 *   calm        — opening / planning      → warm pad, soft bass, no shaker
 *   app-tempo   — browsing / scrolling    → pad + bass + shaker (the "scrolling" feel)
 *   thinking    — reflection / doubt      → sparse pad + slow bell, very quiet
 *   hit         — shock / realisation     → bright pad + bass + shaker + impact swell
 *   reflective  — Act 2 / closing         → major pad + slow bell, gentle bass
 *   silent      — full duck                → everything off
 */

let musicTimer = null;
let currentBar = 0;
let nextBarTime = 0;
let lowPassFilter = null;
let activeMood = 'calm';     // mood that the next-scheduled bar will use
let lastImpactAt = 0;        // ctx.currentTime of last hit-impact, debounces re-entry

// Slowed from 64 → 52 BPM per QA — chords unfold ~20% slower, which
// reads as "peaceful, ambient" instead of "walking-pace background
// track". Every other rhythm value (pluck, hat, kick) inherits this.
const BPM = 52;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// Chord = [pad voices (3 notes), bass root]. Voicings in low/mid registers so
// they sit under the speech without competing with vocal frequencies (~250 Hz+).
const CHORDS = {
  Am:  { notes: [220.00, 261.63, 329.63], bass: 110.00 },
  Em:  { notes: [164.81, 196.00, 246.94], bass:  82.41 },
  F:   { notes: [174.61, 220.00, 261.63], bass:  87.31 },
  G:   { notes: [196.00, 246.94, 293.66], bass:  98.00 },
  C:   { notes: [196.00, 261.63, 329.63], bass: 130.81 },
  Dm:  { notes: [220.00, 293.66, 349.23], bass: 146.83 },
  Bb:  { notes: [233.08, 293.66, 349.23], bass: 116.54 },
  A:   { notes: [220.00, 277.18, 329.63], bass: 110.00 },
  Fmaj7:{notes: [174.61, 261.63, 329.63], bass:  87.31 },
  /* Jazz 7th / 9th extensions — lush voicings for the lo-fi mood.
   * Each chord stacks the 7th (and sometimes 9th) on top of the
   * triad so the pad sounds like a Rhodes/Wurli rather than a flat
   * organ. Bass roots stay in the same octave as the other moods. */
  Cmaj9:  { notes: [261.63, 329.63, 392.00, 493.88, 587.33], bass: 130.81 }, // C E G B D
  Am9:    { notes: [220.00, 261.63, 329.63, 392.00, 493.88], bass: 110.00 }, // A C E G B
  Dm9:    { notes: [293.66, 349.23, 440.00, 523.25, 659.26], bass: 146.83 }, // D F A C E
  G13:    { notes: [196.00, 246.94, 293.66, 349.23, 493.88], bass:  98.00 }, // G B D F B
  Fmaj9:  { notes: [174.61, 220.00, 261.63, 329.63, 392.00], bass:  87.31 }, // F A C E G
  Em9:    { notes: [164.81, 196.00, 246.94, 293.66, 369.99], bass:  82.41 }, // E G B D F#
};

/* ============== Real background music tracks ==============
 * When a mood has a URL here we stream the track and silence the
 * Web-Audio synth for that mood. When the URL is null we fall back to
 * the synth (preserves the existing behaviour for moods we don't have
 * a real track for yet).
 *
 * Why streaming and not download:
 *   • Pixabay CDN serves these files reliably to <audio> elements
 *     (same CDN we already use for the Act 3 reel's lo-fi bed).
 *   • Means we don't bundle ~3 MB of MP3 with the app for every page
 *     load — only the moods that actually play in a session fetch.
 *
 * Adding a new mood: drop a stable URL here, no other changes
 * needed. Falls back to synth automatically if the URL fails to load. */
/* Per QA: the Pixabay CDN stream was unreliable in Acts 2-4 (autoplay
 * blocks + intermittent CDN failures). Reverting to synth across all
 * moods — same engine Act 1 already uses, runs in-browser via Web
 * Audio so it can never be blocked by browser autoplay policy and
 * has no network dependency. The lofi mood's synth profile (Cmaj9 →
 * Am9 → Fmaj9 → G13 jazz progression, Rhodes-style detuned pad,
 * half-time brushed hat, syncopated plucks, vinyl-crackle texture)
 * is what Acts 2-4 now play — soft, chill, ambient. */
const MUSIC_TRACKS = {
  calm:        null,
  'app-tempo': null,
  reflective:  null,
  thinking:    null,
  lofi:        null,
  hit:         null,
  silent:      null,
};
/* Volume the real audio plays at. Deliberately lower than the synth
 * mood gain so the music sits CLEARLY under the narrator. */
const BG_MUSIC_VOLUME = 0.08;

// Mood definitions tuned so transitions are *audible*, not subtle. The big
// dimensions of contrast: bus volume, presence of percussion, low-pass cutoff
// (brightness), and whether the bell melody is present.
// Modern-poem feel: the bell now plays a real arpeggiated melody (root →
// fifth → octave → third) on every bar, sliding gently with the chord
// progression. Calm + reflective moods use the I–V–vi–IV / vi–IV–I–V
// progressions that anchor most modern indie songs — gives the soundtrack
// a "song you've heard before" warmth instead of an abstract pad.
const MOODS = {
  calm: {
    // vi–IV–I–V emotional pop progression with a hooky pluck on top —
    // the cosy storytelling scenes get a "Spotify chill playlist" vibe
    // instead of a flat pad bed.
    progression: ['Am', 'F', 'C', 'G'],
    hasPad: true, hasBass: true, hasShaker: false, hasBell: true, hasPluck: true,
    padGain: 0.08, bassGain: 0.16, bellGain: 0.11, pluckGain: 0.05,
    busGain: 0.48, lpfHz: 1300,
  },
  'app-tempo': {
    // Shopping / scrolling — same warm key, but now with a soft 808-
    // style sub kick on beat 1 + a synth pluck on beats 1/3 + tight
    // eighth-note shaker. GenZ "TikTok shopping reel" energy.
    progression: ['Am', 'F', 'C', 'G'],
    hasPad: true, hasBass: true, hasShaker: true, hasBell: true,
    hasPluck: true, hasKick: true,
    extraTick: true,
    padGain: 0.085, bassGain: 0.22, bellGain: 0.09,
    pluckGain: 0.075, kickGain: 0.18,
    busGain: 0.58, lpfHz: 1800,
  },
  thinking: {
    // Quiet, sparse, low — pad + slow bell + a single far-away pluck on
    // beat 1 so it doesn't feel sterile.
    progression: ['Am', 'Fmaj7', 'C', 'G'],
    hasPad: true, hasBass: false, hasShaker: false, hasBell: true, hasPluck: true,
    padGain: 0.06, bellGain: 0.11, pluckGain: 0.03,
    busGain: 0.32, lpfHz: 900,
  },
  reflective: {
    // vi–IV–I–V — gentle major-leaning resolve with a soft pluck so the
    // cart-reveal beat still has emotional momentum.
    progression: ['Am', 'F', 'C', 'G'],
    hasPad: true, hasBass: true, hasShaker: false, hasBell: true, hasPluck: true,
    padGain: 0.085, bassGain: 0.13, bellGain: 0.11, pluckGain: 0.045,
    busGain: 0.46, lpfHz: 1200,
  },
  hit: {
    // Tense chord set + bright LPF + big bus bump. Impact swell fires
    // separately on entry.
    progression: ['Dm', 'Bb', 'A', 'A'],
    hasPad: true, hasBass: true, hasShaker: true, hasBell: false,
    extraTick: true,
    padGain: 0.07, bassGain: 0.26,
    busGain: 0.62, lpfHz: 2800,
  },
  silent: {
    progression: ['Am', 'Am', 'Am', 'Am'],
    hasPad: false, hasBass: false, hasShaker: false, hasBell: false,
    padGain: 0, bassGain: 0,
    busGain: 0, lpfHz: 500,
  },
  /* Lo-fi / chill-pop bedroom mood — used for Act 2's reflective
   * "understanding impulse buying" scenes. Hallmarks:
   *   – Jazz 9th chords (Cmaj9 → Am9 → Fmaj9 → G13) so the pad reads
   *     as a Rhodes/electric-piano instead of an organ.
   *   – Warm Rhodes-style pad with a slight tremolo (via slight
   *     detune across three oscillator voices).
   *   – Soft brushed half-time hat — ticks on beat 3 + the "& of 4"
   *     for that lazy lo-fi swing.
   *   – Continuous vinyl crackle through a low-pass — sells the
   *     tape-cassette texture.
   *   – Sparse bell arpeggio (every other bar) so the soundtrack
   *     breathes between phrases.
   *   – Low-passed bus + a touch of sub kick on bar 1, none on bar 3
   *     so the half-time feel reads. */
  lofi: {
    progression: ['Cmaj9', 'Am9', 'Fmaj9', 'G13'],
    hasPad: true, hasBass: true, hasShaker: true, hasBell: true,
    hasPluck: true, hasKick: true, hasCrackle: true, isLofi: true,
    halfTimeHat: true, sparseBell: true,
    padGain: 0.07, bassGain: 0.18, bellGain: 0.07,
    pluckGain: 0.045, kickGain: 0.14,
    busGain: 0.52, lpfHz: 1500,
  },
};

function schedulePad(freq, start, dur, peak) {
  // Warm sustained chord tone — slightly detuned, slow attack/release.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  o.detune.value = Math.random() * 8 - 4;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 1.2);
  g.gain.setValueAtTime(peak, start + dur - 0.6);
  g.gain.linearRampToValueAtTime(0, start + dur);
  o.connect(g).connect(lowPassFilter);
  o.start(start);
  o.stop(start + dur + 0.2);
}

function scheduleBass(freq, start, dur, peak) {
  // Low pluck on beat 1 of each bar — half-decay then quiet.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.7);
  o.connect(g).connect(musicGain);
  o.start(start);
  o.stop(start + dur + 0.1);
}

function scheduleShaker(start, peak = 0.06) {
  // Subtle hi-hat tick — short white noise burst through high-pass.
  const dur = 0.06;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(hp).connect(g).connect(musicGain);
  src.start(start);
  src.stop(start + dur + 0.02);
}

/* Rhodes-style pad voice — three slightly-detuned triangle/sine
 * oscillators with a slow attack and a long release. The combined
 * detune produces the gentle chorus shimmer that defines an electric
 * piano / Wurli sound; the low-pass at the bus then takes the edge
 * off so it sits behind the speech without competing. */
function scheduleRhodesPad(freq, start, dur, peak) {
  const ATTACK = 0.6;
  const RELEASE = 0.9;
  const detunes = [-7, 0, 6];           // cents
  const types = ['triangle', 'sine', 'triangle'];
  const sub = ctx.createGain();
  sub.gain.setValueAtTime(0, start);
  sub.gain.linearRampToValueAtTime(peak, start + ATTACK);
  sub.gain.setValueAtTime(peak, start + dur - RELEASE);
  sub.gain.linearRampToValueAtTime(0, start + dur);
  detunes.forEach((cents, i) => {
    const o = ctx.createOscillator();
    o.type = types[i];
    o.frequency.value = freq;
    o.detune.value = cents;
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = i === 1 ? 1 : 0.65;
    o.connect(voiceGain).connect(sub);
    o.start(start);
    o.stop(start + dur + 0.3);
  });
  sub.connect(lowPassFilter);
}

/* Vinyl-crackle layer — bar-length filtered pink-ish noise at very
 * low level. Adds the "tape cassette / lofi" texture without ever
 * masking speech (HPF removes rumble, LPF removes hiss, and the
 * peak gain is in the 0.012–0.018 range). */
function scheduleVinylCrackle(start, dur) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  // Random pops (~12/sec at peak amplitude) layered over a low hiss bed.
  for (let i = 0; i < len; i += 1) {
    const hiss = (Math.random() * 2 - 1) * 0.15;
    const pop = Math.random() < 0.0012 ? (Math.random() * 2 - 1) * 0.9 : 0;
    data[i] = hiss + pop;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 800;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 4500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.018, start + 0.12);
  g.gain.setValueAtTime(0.018, start + dur - 0.2);
  g.gain.linearRampToValueAtTime(0, start + dur);
  src.connect(hp).connect(lp).connect(g).connect(musicGain);
  src.start(start);
  src.stop(start + dur + 0.05);
}

function schedulePluck(freq, start, peak) {
  // Crisp synth pluck — triangle wave, fast attack, short decay. Sits
  // above the pad / bell, gives the shopping moods a modern "playlist
  // pop" hook on the strong beats.
  const o = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o2.type = 'sine';
  o.frequency.value = freq;
  o2.frequency.value = freq * 1.5;   // a fifth above for sparkle
  o2.detune.value = 8;
  const dur = 0.42;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  o2.connect(g);
  g.connect(lowPassFilter);
  o.start(start);  o2.start(start);
  o.stop(start + dur + 0.05);  o2.stop(start + dur + 0.05);
}

function scheduleSubKick(start, peak) {
  // Tight 808-style sub kick — sine that drops from ~95Hz to ~38Hz. Sits
  // on beat 1 to give the chord a "drop" instead of just floating in.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(95, start);
  o.frequency.exponentialRampToValueAtTime(38, start + 0.18);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
  o.connect(g).connect(musicGain);
  o.start(start);
  o.stop(start + 0.35);
}

function scheduleBellNote(freq, start, dur, peak) {
  // Single bell note — triangle wave, soft pluck envelope. Used as one
  // step of the per-bar arpeggio rather than a single held note.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(lowPassFilter);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function scheduleBellMelody(chord, startTime, barDur, peak) {
  // Walk the chord as an 8-step (eighth-note) arpeggio — root → third →
  // fifth → octave → fifth → octave+third → fifth → third (all one octave
  // up). Twice as melodic as the previous 4-step quarter-note arpeggio,
  // gives the soundtrack a real flowing top-line and a noticeably more
  // emotional feel per the May 2026 user feedback.
  const step = barDur / 8;
  const [root, third, fifth] = chord.notes;
  const arp = [
    root * 2,    // beat 1
    third * 2,   // & of 1
    fifth * 2,   // beat 2
    root * 4,    // & of 2 — high octave shimmer
    fifth * 2,   // beat 3
    third * 4,   // & of 3 — second shimmer
    fifth * 2,   // beat 4
    third * 2,   // & of 4 — gentle landing
  ];
  arp.forEach((f, i) => {
    // Slight velocity dip on the off-beats so the strong beats lead the line.
    const v = peak * (1 - (i * 0.045)) * (i % 2 === 0 ? 1 : 0.78);
    scheduleBellNote(f, startTime + step * i + 0.02, step * 1.4, v);
  });
}

function playImpactSwell() {
  // One-shot "hit" cue — low boom + reversed-noise swell. Used when the mood
  // flips into 'hit'. Played outside the bar scheduler so it lands immediately.
  if (!ensureCtx() || muted) return;
  const t = ctx.currentTime;
  if (t - lastImpactAt < 1.2) return; // debounce
  lastImpactAt = t;

  // Sub boom
  const o = ctx.createOscillator();
  const og = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(70, t);
  o.frequency.exponentialRampToValueAtTime(32, t + 1.4);
  og.gain.setValueAtTime(0, t);
  og.gain.linearRampToValueAtTime(0.55, t + 0.02);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  o.connect(og).connect(master);
  o.start(t);
  o.stop(t + 1.5);

  // White-noise swell (cymbal-ish), rises into the boom
  const dur = 0.9;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const env = i / data.length;
    data[i] = (Math.random() * 2 - 1) * env * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 4000;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(0.18, t + dur - 0.05);
  ng.gain.linearRampToValueAtTime(0, t + dur + 0.05);
  src.connect(hp).connect(ng).connect(master);
  src.start(t);
  src.stop(t + dur + 0.1);
}

function scheduleBar(barIdx, startTime) {
  const mood = MOODS[activeMood] || MOODS.calm;
  const chordName = mood.progression[barIdx % mood.progression.length];
  const chord = CHORDS[chordName];

  if (mood.hasPad) {
    if (mood.isLofi) {
      // Rhodes-style stacked voicing — top 4 notes of the 9th chord
      // played softly, slightly detuned, with a small octave-down sub
      // root for warmth. Drops the brittle high shimmer the other
      // moods use so the pad sits soft like a Wurli.
      const voicing = chord.notes.slice(0, 4);
      voicing.forEach((freq, i) => {
        const v = mood.padGain * (i === 0 ? 1 : 0.78 - i * 0.04);
        scheduleRhodesPad(freq, startTime, BAR, v);
      });
      // Sub-octave root underneath — fattens the chord without adding
      // mud (it's heavily low-passed by the mood's lpfHz).
      scheduleRhodesPad(chord.notes[0] / 2, startTime, BAR, mood.padGain * 0.55);
    } else {
      chord.notes.forEach((freq) => schedulePad(freq, startTime, BAR, mood.padGain));
      // Octave-up shimmer pad on the chord's root + fifth — adds a brighter,
      // more emotional top layer without competing with the bell melody.
      schedulePad(chord.notes[0] * 2, startTime, BAR, mood.padGain * 0.45);
      schedulePad(chord.notes[2] * 2, startTime, BAR, mood.padGain * 0.35);
    }
  }
  // Soft synth pluck on beats 1 + 3 — a hooky top-line note that gives
  // the shopping moods a GenZ "modern pop" feel without overshadowing
  // the bell melody.
  if (mood.hasPluck) {
    if (mood.isLofi) {
      // Lo-fi plucks land on the "&" of 2 and the "&" of 4 — that
      // syncopated half-time placement reads as a chill beatmaker
      // sketch instead of straight pop.
      schedulePluck(chord.notes[2] * 2, startTime + BEAT * 1.5, mood.pluckGain || 0.045);
      schedulePluck(chord.notes[1] * 2, startTime + BEAT * 3.5, mood.pluckGain || 0.045);
    } else {
      schedulePluck(chord.notes[2] * 2, startTime + BEAT * 0,    mood.pluckGain || 0.06);
      schedulePluck(chord.notes[1] * 2, startTime + BEAT * 2,    mood.pluckGain || 0.06);
    }
  }
  // Sub-kick on beat 1 of every bar — anchors the chord like an 808 in
  // a TikTok track. Only the shopping-tempo mood gets it so calmer moods
  // stay airy.
  if (mood.hasKick) {
    // Lo-fi: half-time kick (every other bar) so the groove breathes.
    if (!mood.isLofi || barIdx % 2 === 0) {
      scheduleSubKick(startTime, mood.kickGain || 0.18);
    }
  }
  if (mood.hasBass) {
    if (mood.isLofi) {
      // Half-note bass — root on 1, root on 3 — that's the classic
      // lazy lo-fi walk under jazz chords.
      scheduleBass(chord.bass, startTime, BAR / 2, mood.bassGain);
      scheduleBass(chord.bass / 2 * 1.5, startTime + BAR / 2, BAR / 2, mood.bassGain * 0.6); // fifth up an octave down
    } else {
      scheduleBass(chord.bass, startTime, BAR / 2, mood.bassGain);
      scheduleBass(chord.bass, startTime + BAR / 2, BAR / 2, mood.bassGain * 0.7);
    }
  }
  if (mood.hasShaker) {
    if (mood.halfTimeHat) {
      // Half-time brushed hat — tick on beat 3 only + a soft "&" of 4
      // shadow. Gives the bedroom-pop / Rhodes vibe instead of a busy
      // pop pattern. Plus a softer in-between tick on beat 1 for pulse.
      scheduleShaker(startTime + BEAT * 0, 0.025);
      scheduleShaker(startTime + BEAT * 2, 0.055);
      scheduleShaker(startTime + BEAT * 3.5, 0.04);
    } else {
      scheduleShaker(startTime + BEAT * 1);
      scheduleShaker(startTime + BEAT * 3);
      if (mood.extraTick) {
        scheduleShaker(startTime + BEAT * 0.5);
        scheduleShaker(startTime + BEAT * 1.5);
        scheduleShaker(startTime + BEAT * 2.5);
        scheduleShaker(startTime + BEAT * 3.5);
      }
    }
  }
  if (mood.hasBell) {
    // Sparse bell — only on even bars for the lo-fi mood, so the
    // chord can breathe between phrases.
    if (!mood.sparseBell || barIdx % 2 === 0) {
      scheduleBellMelody(chord, startTime, BAR, mood.bellGain || 0.05);
    }
  }
  // Vinyl-crackle texture for the lo-fi mood — a continuous low-level
  // filtered noise layer. Re-scheduled per bar so it never gaps.
  if (mood.hasCrackle) {
    scheduleVinylCrackle(startTime, BAR);
  }
}

/* ============== Real-track player ==============
 *
 * Persistent <audio> element for streaming the per-mood track. We use
 * a single element and either swap its src (when transitioning between
 * two URL-backed moods) or fade it out (when transitioning to a synth
 * mood or to silent). Cross-fade between *different* URL-backed moods
 * runs both an old and a new element in parallel for ~1.2 s.
 *
 * Why not Web Audio routing for music: simpler. We don't need the
 * music in the analyser graph (lip-sync only cares about the speech
 * <audio> elements), and HTMLAudioElement.volume is already smooth
 * enough at the timescales we ramp over.
 */
let bgAudio = null;       // currently-playing <audio>
let bgAudioMood = null;   // the MUSIC_TRACKS key the bgAudio represents
let bgFadeRaf = 0;

function cancelBgFade() {
  if (bgFadeRaf) {
    cancelAnimationFrame(bgFadeRaf);
    bgFadeRaf = 0;
  }
}

function fadeAudioTo(audio, targetVol, durationMs, onDone) {
  if (!audio) { onDone?.(); return; }
  const startVol = audio.volume;
  const startAt = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - startAt) / durationMs);
    audio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * t));
    if (t < 1) bgFadeRaf = requestAnimationFrame(tick);
    else onDone?.();
  };
  bgFadeRaf = requestAnimationFrame(tick);
}

function startBgTrack(mood) {
  const url = MUSIC_TRACKS[mood];
  if (!url || muted) return;
  if (bgAudio && bgAudioMood === mood) {
    // Same track already playing — just make sure it's audible.
    cancelBgFade();
    if (bgAudio.paused) bgAudio.play().catch(() => {});
    fadeAudioTo(bgAudio, BG_MUSIC_VOLUME, 800);
    return;
  }
  // New track — build it and cross-fade against the previous one (if any).
  const next = new Audio(url);
  next.loop = true;
  next.volume = 0;
  next.crossOrigin = 'anonymous';
  next.preload = 'auto';
  next.play().catch(() => { /* autoplay may need a gesture; we'll retry on the next unlock */ });
  const prev = bgAudio;
  const prevMood = bgAudioMood;
  bgAudio = next;
  bgAudioMood = mood;
  cancelBgFade();
  // Sequenced fade: ramp the new track up; once that's underway, ramp
  // the previous track out and dispose of it.
  fadeAudioTo(next, BG_MUSIC_VOLUME, 1200);
  if (prev) {
    // Run the prev fade-out on its own RAF chain so it doesn't fight
    // the bgFadeRaf used by the new track. Direct setInterval is fine.
    const startVol = prev.volume;
    const startAt = performance.now();
    const dur = 1200;
    const id = setInterval(() => {
      const t = Math.min(1, (performance.now() - startAt) / dur);
      prev.volume = Math.max(0, startVol * (1 - t));
      if (t >= 1) {
        clearInterval(id);
        try { prev.pause(); } catch {}
        prev.src = '';
      }
    }, 33);
    // Side-note: prevMood unused except for debug breadcrumbs.
    void prevMood;
  }
}

function stopBgTrack(fadeMs = 800) {
  if (!bgAudio) return;
  const a = bgAudio;
  bgAudio = null;
  bgAudioMood = null;
  cancelBgFade();
  fadeAudioTo(a, 0, fadeMs, () => {
    try { a.pause(); } catch {}
    a.src = '';
  });
}

export function startMusic() {
  if (muted || !ensureCtx()) return;
  // Real-track moods bypass the synth scheduler entirely.
  if (MUSIC_TRACKS[activeMood]) { startBgTrack(activeMood); return; }
  if (musicTimer) return;
  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    lowPassFilter = ctx.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = (MOODS[activeMood] || MOODS.calm).lpfHz;
    lowPassFilter.Q.value = 0.65;
    lowPassFilter.connect(musicGain);
    musicGain.connect(master);
  }
  const mood = MOODS[activeMood] || MOODS.calm;
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(mood.busGain * MUSIC_VOLUME * 3, ctx.currentTime + 1.5);

  currentBar = 0;
  nextBarTime = ctx.currentTime + 0.15;
  scheduleBar(0, nextBarTime);
  scheduleBar(1, nextBarTime + BAR);
  currentBar = 2;
  nextBarTime += BAR * 2;

  musicTimer = setInterval(() => {
    if (!ctx) return;
    while (nextBarTime - ctx.currentTime < BAR * 1.5) {
      scheduleBar(currentBar, nextBarTime);
      currentBar += 1;
      nextBarTime += BAR;
    }
  }, 250);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicGain && ctx) {
    const t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.linearRampToValueAtTime(0, t + 0.8);
  }
  // Also stop any real-track that's playing.
  stopBgTrack(800);
}

/** Soft duck — used when the sequencer pauses. Keeps the loop scheduled but mutes the bus. */
export function pauseMusic() {
  if (musicGain && ctx) {
    const t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.linearRampToValueAtTime(0, t + 0.25);
  }
  // Pause the real track too if one is playing.
  if (bgAudio && !bgAudio.paused) {
    cancelBgFade();
    fadeAudioTo(bgAudio, 0, 250, () => { try { bgAudio?.pause(); } catch {} });
  }
}

/** Counterpart to pauseMusic — fades the bus back to current mood volume. */
export function resumeMusic() {
  if (muted) return;
  // Real-track mood: rewind the audio to active, fade back up.
  if (MUSIC_TRACKS[activeMood]) {
    if (bgAudio) {
      cancelBgFade();
      bgAudio.play().catch(() => {});
      fadeAudioTo(bgAudio, BG_MUSIC_VOLUME, 600);
    } else {
      startBgTrack(activeMood);
    }
    return;
  }
  // Synth mood: ramp the synth bus back up.
  if (!musicGain || !ctx) { startMusic(); return; }
  const mood = MOODS[activeMood] || MOODS.calm;
  const t = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(mood.busGain * MUSIC_VOLUME * 3, t + 0.6);
}

/**
 * Set the current music mood. The next-scheduled bar uses the new mood's
 * chord progression + instrumentation; the bus gain + low-pass filter ramp
 * to the new targets over ~1s so transitions don't pop.
 */
export function setMusicMood(mood) {
  const next = MOODS[mood] ? mood : 'calm';
  const prev = activeMood;
  activeMood = next;

  // If we just entered 'hit', schedule a one-shot impact immediately.
  if (next === 'hit' && prev !== 'hit') playImpactSwell();

  // Decide which engine owns the new mood.
  const nextHasTrack = !!MUSIC_TRACKS[next];
  const prevHadTrack = !!MUSIC_TRACKS[prev];

  if (nextHasTrack) {
    // Cross-fade into the real track (start it if needed; same-URL
    // moods will no-op inside startBgTrack).
    startBgTrack(next);
    // Silence the synth bus so it doesn't double with the audio.
    if (musicGain && ctx) {
      const t = ctx.currentTime;
      musicGain.gain.cancelScheduledValues(t);
      musicGain.gain.setValueAtTime(musicGain.gain.value, t);
      musicGain.gain.linearRampToValueAtTime(0, t + 1.0);
    }
    return;
  }

  // Synth mood — fade out the real track if one was playing.
  if (prevHadTrack) stopBgTrack(1000);

  // Make sure the synth scheduler is running (it'd be idle if the
  // previous mood was a real track).
  if (!musicTimer && !muted) startMusic();

  if (!lowPassFilter || !ctx || !musicGain) return;
  const m = MOODS[next];
  const t = ctx.currentTime;

  lowPassFilter.frequency.cancelScheduledValues(t);
  lowPassFilter.frequency.linearRampToValueAtTime(m.lpfHz, t + 1.0);

  // Don't ramp bus when paused (muted bus) — pauseMusic owns it then.
  if (musicGain.gain.value > 0.0001 || m.busGain > 0) {
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.linearRampToValueAtTime(m.busGain * MUSIC_VOLUME * 3, t + 0.8);
  }
}

/* ============== Speech (TTS) ==============
 * Reads Shanaya's bubbles + narrator lines aloud via the /api/tts proxy
 * (cloud TTS over <audio>). Web Speech is no longer used — it's silently
 * broken in some Chrome versions on macOS.
 */

let speakStartHandler = null;
let speakEndHandler = null;
let speakBoundaryHandler = null;
let speakAmplitudeHandler = null;
let activeUtterances = 0;

/** Register callbacks so the avatar can mouth-animate while speaking.
 *  - onStart(who):    speech started ('shanaya' or 'narrator')
 *  - onEnd():         all queued speech finished
 *  - onWord():        approximate per-word tick (still used for fallback lip-sync)
 *  - onAmplitude(v):  real-time audio amplitude 0–1, sampled ~60 times/sec
 *                     from the audio element via Web Audio AnalyserNode.
 *                     This is what drives the avatar's mouth to actually
 *                     open and close in time with the speech waveform. */
export function setSpeechCallbacks(callbacks) {
  speakStartHandler = callbacks?.onStart || null;
  speakEndHandler = callbacks?.onEnd || null;
  speakBoundaryHandler = callbacks?.onWord || null;
  speakAmplitudeHandler = callbacks?.onAmplitude || null;
}

/* ---------------------- Speech amplitude analyser --------------------------
 *
 * A single AnalyserNode lives on the AudioContext; each <audio> element
 * we create for a TTS chunk gets routed through `createMediaElementSource`
 * → analyser → destination. Once playback starts we run a RAF loop that
 * samples byte-frequency data, averages the speech-band bins (roughly
 * 100–2 kHz), normalises to 0–1, and forwards it to the avatar via
 * onAmplitude.
 *
 * `createMediaElementSource` can only be called once per element; we
 * cache the source on the element itself (`__lhSource`) so reconnecting
 * an already-routed element is a no-op. CORS: the TTS proxy serves
 * audio same-origin (via Vercel rewrites in prod and Vite proxy in dev)
 * and we set `audio.crossOrigin = 'anonymous'`, so the analyser can read
 * the buffer.
 */
let speechAnalyser = null;
let amplitudeRafId = null;

function ensureSpeechAnalyser() {
  if (speechAnalyser || !ensureCtx()) return speechAnalyser;
  speechAnalyser = ctx.createAnalyser();
  speechAnalyser.fftSize = 256;
  speechAnalyser.smoothingTimeConstant = 0.55;
  return speechAnalyser;
}

function routeAudioToAnalyser(audio) {
  if (!ensureSpeechAnalyser() || audio.__lhSource) return;
  try {
    const source = ctx.createMediaElementSource(audio);
    source.connect(speechAnalyser);
    speechAnalyser.connect(ctx.destination);
    audio.__lhSource = source;
  } catch {
    // Already routed, or browser doesn't support it — fall back to fake
    // word-tick mouth animation, which the avatar still listens for.
  }
}

function startAmplitudeLoop() {
  if (amplitudeRafId || !speechAnalyser) return;
  const data = new Uint8Array(speechAnalyser.frequencyBinCount);
  // Bins 3–32 in a 256-bin FFT at 48 kHz sample rate roughly cover the
  // speech band (~280 Hz – 3 kHz). That's where vocal energy actually
  // lives, so the mouth tracks dialogue prosody instead of pad/bass.
  const start = 3, end = Math.min(32, data.length);
  const tick = () => {
    speechAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = start; i < end; i += 1) sum += data[i];
    const avg = sum / (end - start);     // 0–255
    speakAmplitudeHandler?.(avg / 255);
    amplitudeRafId = requestAnimationFrame(tick);
  };
  amplitudeRafId = requestAnimationFrame(tick);
}

function stopAmplitudeLoop() {
  if (amplitudeRafId) cancelAnimationFrame(amplitudeRafId);
  amplitudeRafId = null;
  speakAmplitudeHandler?.(0);
}

/* ----------------------------- Speech queue --------------------------------
 *
 * Every speak() request joins a FIFO queue. The processor plays them one at
 * a time, so multiple bubbles in the same phase (or a bubble + a narration
 * line) read back-to-back instead of cancelling each other mid-sentence.
 *
 * Before this queue existed, speak() called cloudSpeak() which called
 * cancelCloudSpeech() — meaning each new speak request killed the previous
 * audio mid-flight. Users heard "half a sentence then jumps to the next".
 *
 * isSpeaking stays true the entire time the queue is being processed (since
 * the start handler fires when each item begins and the end handler only
 * fires when the queue is empty). So sequencer holds and FrameworkCard /
 * DefinitionPuzzle gates that key on speakingDone still behave correctly.
 */

let speechQueue = [];
let processing = false;
// When `queuePaused` is true the queue processor refuses to start the next
// item, and the currently-playing audio is paused (not killed). Used by
// pauseSpeech / resumeSpeech so a sequencer Pause+Resume actually resumes
// the same line where it left off, instead of skipping it.
let queuePaused = false;

export function speak(text, opts = {}) {
  if (!text || muted) return;
  speechQueue.push({ text, opts });
  processSpeechQueue();
}

function processSpeechQueue() {
  if (processing || queuePaused) return;
  const next = speechQueue.shift();
  if (!next) return;
  processing = true;

  // Fire start handler SYNCHRONOUSLY so the sequencer's holdWhile sees the
  // speak immediately (before the 200–500 ms network round-trip to fetch
  // the MP3). Forwards `who` so the avatar lip-syncs only on Shanaya lines.
  speakStartHandler?.(next.opts.who || 'shanaya');

  cloudSpeakOnce(next.text, next.opts, () => {
    processing = false;
    if (speechQueue.length > 0) {
      // Small breath between back-to-back utterances so they don't blur.
      setTimeout(processSpeechQueue, 180);
    } else {
      // Queue empty — fire the end handler exactly once.
      speakEndHandler?.();
    }
  });
}

export function cancelSpeech() {
  if ('speechSynthesis' in window) {
    try { speechSynthesis.cancel(); } catch {}
  }
  speechQueue = [];
  cancelCloudSpeech();
  processing = false;
  queuePaused = false;
  activeUtterances = 0;
  stopAmplitudeLoop();
  speakEndHandler?.();
}

/* Pause currently-playing TTS without destroying state. Unlike
 * cancelSpeech, this keeps the audio element, the queue, and the
 * processing flag — calling resumeSpeech() picks up exactly where the
 * student left off. Used by the sequencer's Pause button so a pause +
 * resume doesn't silently skip the current narration. */
export function pauseSpeech() {
  queuePaused = true;
  if (currentCloudAudio && !currentCloudAudio.paused) {
    try { currentCloudAudio.pause(); } catch {}
  }
  // Freeze the amplitude RAF too so the avatar's mouth doesn't keep
  // moving while there's no audio coming out.
  stopAmplitudeLoop();
}

/* Counterpart to pauseSpeech — resumes the paused audio element so the
 * sentence continues from the exact word it was paused on. Falls back to
 * advancing the queue if the audio element is already finished / errored,
 * so Pause+Resume never gets stuck in silence. */
export function resumeSpeech() {
  queuePaused = false;
  if (currentCloudAudio && currentCloudAudio.paused && !currentCloudAudio.ended) {
    try {
      currentCloudAudio.play()
        .then(() => startAmplitudeLoop())
        .catch(() => {
          // play() rejected (autoplay block / disposed element) — drop
          // the dead audio and kick the queue forward so the learner
          // doesn't end up in silence.
          currentCloudAudio = null;
          if (!processing && speechQueue.length > 0) processSpeechQueue();
        });
    } catch {
      currentCloudAudio = null;
      if (!processing && speechQueue.length > 0) processSpeechQueue();
    }
  } else if (!processing && speechQueue.length > 0) {
    processSpeechQueue();
  }
}

/* ============== Cloud TTS path (bypasses broken Web Speech) ==============
 * Uses the /api/tts proxy on the backend, which streams MP3 audio from
 * Google Translate's TTS endpoint. Works regardless of Chrome's local
 * speech engine being silent.
 *
 * We chunk the text by sentence (~180 chars max per call) and play each
 * chunk via a real <audio> element. `audio.ontimeupdate` is used to fake
 * word-boundary ticks for lip-sync.
 */

let currentCloudAudio = null;
const CLOUD_TTS_BASE = import.meta.env?.VITE_API_BASE_URL || '';

function chunkForTTS(text, max = 180) {
  const sentences = text.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) || [text];
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur.length) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

export function cancelCloudSpeech() {
  if (currentCloudAudio) {
    const audio = currentCloudAudio;
    // Null out the global FIRST so any in-flight chunk handler that
    // fires below sees `audio !== currentCloudAudio` and bails. Without
    // this, setting src='' + load() triggers audio.onerror, which in
    // turn called playChunkSequence(i+1) and played the NEXT chunk of
    // the cancelled utterance — i.e. card 2's voice bleeding into
    // card 3 even after cancelSpeech.
    currentCloudAudio = null;
    try {
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      audio.pause();
      audio.src = '';
      audio.load();
    } catch {}
  }
}

/* Play one utterance through the cloud TTS pipeline. The queue processor
 * calls this; never call it directly (you'll bypass queueing and risk
 * cancelling whatever's currently playing). The `done` callback fires
 * exactly once when the final chunk finishes — that's the queue's signal
 * to start the next item. */
function cloudSpeakOnce(text, { who = 'shanaya', volume = 1 } = {}, done) {
  if (muted || !text) { done?.(); return; }
  cancelCloudSpeech();
  // Expand prices/digits into English words BEFORE stripping emoji + chunking.
  // Without this, hi-IN Swara/Madhur read "3,596" with Hindi number prosody
  // inside an English sentence — which is exactly what the user wants gone.
  const chunks = chunkForTTS(stripEmoji(expandNumbersForTTS(text)));
  if (chunks.length === 0) { done?.(); return; }
  activeUtterances += 1;
  playChunkSequence(chunks, 0, who, volume, () => {
    activeUtterances = Math.max(0, activeUtterances - 1);
    done?.();
  });
}

/* Backwards-compatible wrapper: anything that still calls cloudSpeak() goes
 * through the queue so timing stays consistent. */
export function cloudSpeak(text, opts = {}) {
  speak(text, opts);
}

function playChunkSequence(chunks, i, who, volume, onFinished) {
  if (i >= chunks.length) {
    onFinished?.();
    return;
  }
  // The `v` query param cache-busts when we change voices on the backend.
  // Bumped to 12 with the ElevenLabs voice swap so any cached Edge MP3s
  // are evicted in browsers that already heard the old voices.
  const url = `${CLOUD_TTS_BASE}/api/tts?voice=${encodeURIComponent(who)}&v=12&text=${encodeURIComponent(chunks[i])}`;
  const audio = new Audio(url);
  currentCloudAudio = audio;
  audio.volume = volume;
  // preservesPitch must be TRUE so changing playbackRate doesn't shift pitch
  // — otherwise the voice gets squeaky and stops sounding natural.
  audio.preservesPitch = true;
  // With ElevenLabs we pick voices that already match the target age,
  // so no client-side rate boost is needed. Both roles play at native
  // 1.0× — the natural cadence of the source voice carries the scene.
  // (Edge fallback still works fine at 1.0× too; the 1.3× narrator
  // boost was a stop-gap to push the only en-IN male voice younger.)
  audio.playbackRate = 1.0;
  audio.crossOrigin = 'anonymous';

  // Route this chunk through the Web Audio analyser so the avatar can
  // read real-time amplitude (drives accurate mouth open/close instead
  // of the fake "tick on every word" pulse).
  routeAudioToAnalyser(audio);

  if (i === 0 && import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log('[cloudSpeak] 🔊', who, 'rate=', audio.playbackRate, '→', text(chunks));
  }
  // NB: `speak()` is now the canonical place that increments activeUtterances
  // + fires speakStartHandler — we don't do it again on chunk 0 here. That
  // change makes isSpeaking flip true synchronously when speak() is called,
  // closing the network-load window where short phases auto-advanced before
  // TTS even began.

  let lastTick = -1;
  audio.ontimeupdate = () => {
    // Emit a "word boundary" every ~280ms of playback. Kept as a fallback
    // for browsers where createMediaElementSource fails (so the avatar
    // can still mouth-pulse off word ticks if the analyser isn't reading).
    if (audio.currentTime - lastTick >= 0.28) {
      lastTick = audio.currentTime;
      speakBoundaryHandler?.();
    }
  };
  audio.onended = () => {
    // If this audio has been superseded by cancelCloudSpeech (or by a
    // newer utterance), don't advance — that'd play the cancelled
    // utterance's next chunk on top of the new one.
    if (audio !== currentCloudAudio) return;
    if (i + 1 >= chunks.length) stopAmplitudeLoop();
    playChunkSequence(chunks, i + 1, who, volume, onFinished);
  };
  audio.onerror = () => {
    if (audio !== currentCloudAudio) return; // superseded
    // eslint-disable-next-line no-console
    console.warn('[cloudSpeak] audio error on chunk', i, '— skipping');
    if (i + 1 >= chunks.length) stopAmplitudeLoop();
    playChunkSequence(chunks, i + 1, who, volume, onFinished);
  };
  audio.play().then(() => {
    if (audio !== currentCloudAudio) {
      // Cancelled mid-load. Pause this orphan so its decoded buffer
      // doesn't leak audio.
      try { audio.pause(); } catch {}
      return;
    }
    // play() resolved → audio is actually flowing → start sampling.
    startAmplitudeLoop();
  }).catch((err) => {
    if (audio !== currentCloudAudio) return; // superseded
    // eslint-disable-next-line no-console
    console.warn('[cloudSpeak] play() rejected', err.message);
    playChunkSequence(chunks, i + 1, who, volume, onFinished);
  });
}

function text(chunks) {
  return (chunks[0] || '').slice(0, 60) + (chunks.length > 1 ? ` (+${chunks.length - 1} more)` : '');
}

function stripEmoji(s) {
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
}

/* ============== Number → English-words pre-processor ==============
 * The Hindi-speaker Swara/Madhur voices read raw digit strings ("3596") in
 * Hindi, which sounds wrong inside English narration. So before sending the
 * text to TTS we replace numeric prices / counts with their English-word
 * form: "₹3,596" → "three thousand five hundred ninety six rupees",
 * "12K" → "twelve thousand", "₹1,499" → "one thousand four hundred ninety
 * nine rupees". The mp3 cache key is still the same since the same source
 * text always produces the same expanded string. */

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
              'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
              'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function intToWords(n) {
  if (n < 0) return 'minus ' + intToWords(-n);
  if (n < 20) return ONES[n];
  if (n < 100) {
    return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  }
  if (n < 1000) {
    const r = n % 100;
    return ONES[Math.floor(n / 100)] + ' hundred' + (r ? ' ' + intToWords(r) : '');
  }
  if (n < 100000) {
    const r = n % 1000;
    return intToWords(Math.floor(n / 1000)) + ' thousand' + (r ? ' ' + intToWords(r) : '');
  }
  if (n < 10000000) {
    const r = n % 100000;
    return intToWords(Math.floor(n / 100000)) + ' lakh' + (r ? ' ' + intToWords(r) : '');
  }
  const r = n % 10000000;
  return intToWords(Math.floor(n / 10000000)) + ' crore' + (r ? ' ' + intToWords(r) : '');
}

export function expandNumbersForTTS(text) {
  if (!text) return text;
  let out = text;

  // ₹3,596  or  ₹3596  → "three thousand five hundred ninety six rupees"
  out = out.replace(/₹\s?([\d,]+)/g, (_m, digits) => {
    const n = parseInt(digits.replace(/,/g, ''), 10);
    if (Number.isNaN(n)) return _m;
    return intToWords(n) + ' rupees';
  });

  // 12K / 12k → "twelve thousand"
  out = out.replace(/\b(\d+)([Kk])\b/g, (_m, d) => `${intToWords(parseInt(d, 10))} thousand`);

  // Bare comma-grouped numbers like "1,499" or "3,795" (no rupee sign)
  out = out.replace(/\b\d{1,2},\d{3}\b/g, (m) => {
    const n = parseInt(m.replace(/,/g, ''), 10);
    return Number.isNaN(n) ? m : intToWords(n);
  });

  // Standalone 4-digit numbers (e.g. 1499 in a sentence)
  out = out.replace(/(?<!\d)\d{3,5}(?!\d)/g, (m) => intToWords(parseInt(m, 10)));

  return out;
}
