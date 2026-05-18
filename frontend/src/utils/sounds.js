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
const MUSIC_VOLUME = 0.32; // more atmospheric, less foreground

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

const BPM = 64;
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
};

// Mood definitions tuned so transitions are *audible*, not subtle. The big
// dimensions of contrast: bus volume, presence of percussion, low-pass cutoff
// (brightness), and whether the bell melody is present.
const MOODS = {
  calm: {
    progression: ['Am', 'Em', 'F', 'C'],
    hasPad: true, hasBass: true, hasShaker: false, hasBell: false,
    padGain: 0.05, bassGain: 0.14,
    busGain: 0.32, lpfHz: 1000,
  },
  'app-tempo': {
    // Browsing / scrolling — adds shaker + a tiny tick on every beat for the
    // "swiping through the feed" feel, brighter LPF, slightly louder bus.
    progression: ['Am', 'Em', 'F', 'G'],
    hasPad: true, hasBass: true, hasShaker: true, hasBell: false,
    extraTick: true,
    padGain: 0.055, bassGain: 0.18,
    busGain: 0.40, lpfHz: 1600,
  },
  thinking: {
    // Halved bus volume, no bass, no percussion — just a slow pad + bell.
    // Very obviously quieter than calm/app-tempo.
    progression: ['Am', 'Fmaj7', 'C', 'G'],
    hasPad: true, hasBass: false, hasShaker: false, hasBell: true,
    padGain: 0.04, bellGain: 0.06,
    busGain: 0.16, lpfHz: 700,
  },
  reflective: {
    progression: ['F', 'C', 'Dm', 'Am'],
    hasPad: true, hasBass: true, hasShaker: false, hasBell: true,
    padGain: 0.055, bassGain: 0.10, bellGain: 0.05,
    busGain: 0.30, lpfHz: 950,
  },
  hit: {
    // Tense chord (Dm-Bb-A-A), bright LPF, big bus volume bump, plays an
    // impact swell on entry. This should be impossible to miss.
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

function scheduleShaker(start) {
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
  g.gain.setValueAtTime(0.06, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(hp).connect(g).connect(musicGain);
  src.start(start);
  src.stop(start + dur + 0.02);
}

function scheduleBell(freq, start, dur, peak) {
  // Soft mallet/bell tone — triangle wave, slow attack so it floats above
  // the pad rather than punching through. Used in thinking/reflective moods.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = freq * 2; // one octave up so the bell reads as melody
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(lowPassFilter);
  o.start(start);
  o.stop(start + dur + 0.1);
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
    chord.notes.forEach((freq) => schedulePad(freq, startTime, BAR, mood.padGain));
  }
  if (mood.hasBass) {
    scheduleBass(chord.bass, startTime, BAR / 2, mood.bassGain);
    scheduleBass(chord.bass, startTime + BAR / 2, BAR / 2, mood.bassGain * 0.7);
  }
  if (mood.hasShaker) {
    scheduleShaker(startTime + BEAT * 1);
    scheduleShaker(startTime + BEAT * 3);
    // Active / hit moods get extra eighth-note ticks for a more driven feel.
    if (mood.extraTick) {
      scheduleShaker(startTime + BEAT * 0.5);
      scheduleShaker(startTime + BEAT * 1.5);
      scheduleShaker(startTime + BEAT * 2.5);
      scheduleShaker(startTime + BEAT * 3.5);
    }
  }
  if (mood.hasBell) {
    // Bell on the downbeat of each bar — uses the top note of the chord.
    scheduleBell(chord.notes[2], startTime + 0.05, BAR * 0.9, mood.bellGain || 0.04);
  }
}

export function startMusic() {
  if (musicTimer || muted || !ensureCtx()) return;
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
}

/** Soft duck — used when the sequencer pauses. Keeps the loop scheduled but mutes the bus. */
export function pauseMusic() {
  if (!musicGain || !ctx) return;
  const t = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(0, t + 0.25);
}

/** Counterpart to pauseMusic — fades the bus back to current mood volume. */
export function resumeMusic() {
  if (muted) return;
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
let activeUtterances = 0;

/** Register callbacks so the avatar can mouth-animate while speaking.
 *  onWord fires roughly per word for lip-sync. */
export function setSpeechCallbacks(callbacks) {
  speakStartHandler = callbacks?.onStart || null;
  speakEndHandler = callbacks?.onEnd || null;
  speakBoundaryHandler = callbacks?.onWord || null;
}

export function speak(text, opts = {}) {
  if (!text) return;
  if (muted) {
    // eslint-disable-next-line no-console
    console.warn('[speak] muted — turn on Audio to hear:', text.slice(0, 50));
    return;
  }
  // Use the cloud TTS proxy — Chrome's local Web Speech is unreliable on
  // some macOS versions, the proxy streams Google Translate's TTS MP3 instead.
  cloudSpeak(text, opts);
}

export function cancelSpeech() {
  if ('speechSynthesis' in window) {
    try { speechSynthesis.cancel(); } catch {}
  }
  cancelCloudSpeech();
  activeUtterances = 0;
  speakEndHandler?.();
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
    try {
      currentCloudAudio.pause();
      currentCloudAudio.src = '';
      currentCloudAudio.load();
    } catch {}
    currentCloudAudio = null;
  }
}

export function cloudSpeak(text, { who = 'shanaya', volume = 1 } = {}) {
  if (muted || !text) return;
  cancelCloudSpeech();
  const chunks = chunkForTTS(stripEmoji(text));
  playChunkSequence(chunks, 0, who, volume);
}

function playChunkSequence(chunks, i, who, volume) {
  if (i >= chunks.length) {
    activeUtterances = Math.max(0, activeUtterances - 1);
    if (activeUtterances === 0) speakEndHandler?.();
    return;
  }
  // The `v` query param cache-busts when we change voices on the backend.
  // Without it, browsers that cached the old Google Translate MP3 (under
  // Cache-Control: immutable) would keep replaying the old voice for the
  // same phrase, even after a backend deploy. Bump this when voices change.
  const url = `${CLOUD_TTS_BASE}/api/tts?voice=${encodeURIComponent(who)}&v=3&text=${encodeURIComponent(chunks[i])}`;
  const audio = new Audio(url);
  currentCloudAudio = audio;
  audio.volume = volume;
  // preservesPitch must be TRUE so changing playbackRate doesn't shift pitch
  // — otherwise the en-IN voice gets squeaky and stops sounding Indian.
  audio.preservesPitch = true;
  // Both voices use the same en-IN locale on the backend; prosody is what
  // makes them distinct on the client side.
  //   shanaya  → 1.0  : natural Indian-English female voice
  //   narrator → 0.92 : slower so the narrator reads as more "adult"
  // We previously sped Shanaya to 1.15× with preservesPitch=false to make her
  // sound younger, but that distorted the accent.
  audio.playbackRate = who === 'shanaya' ? 1.0 : 0.92;
  audio.crossOrigin = 'anonymous';

  if (i === 0) {
    activeUtterances += 1;
    speakStartHandler?.();
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.log('[cloudSpeak] 🔊', who, 'rate=', audio.playbackRate, '→', text(chunks));
    }
  }

  let lastTick = -1;
  audio.ontimeupdate = () => {
    // Emit a "word boundary" every ~280ms of playback for lip-sync.
    if (audio.currentTime - lastTick >= 0.28) {
      lastTick = audio.currentTime;
      speakBoundaryHandler?.();
    }
  };
  audio.onended = () => playChunkSequence(chunks, i + 1, who, volume);
  audio.onerror = () => {
    // eslint-disable-next-line no-console
    console.warn('[cloudSpeak] audio error on chunk', i, '— skipping');
    playChunkSequence(chunks, i + 1, who, volume);
  };
  audio.play().catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('[cloudSpeak] play() rejected', err.message);
    playChunkSequence(chunks, i + 1, who, volume);
  });
}

function text(chunks) {
  return (chunks[0] || '').slice(0, 60) + (chunks.length > 1 ? ` (+${chunks.length - 1} more)` : '');
}

function stripEmoji(s) {
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
}
