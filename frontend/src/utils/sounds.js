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

const MASTER_VOLUME = 0.9;
const MUSIC_VOLUME = 0.45;

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

/* ============== Music sequencer ==============
 * Pad + bass + melody. Four-bar progression: C → Am → F → G (looping).
 * Notes are scheduled ahead on the AudioContext clock for tight timing.
 */

let musicTimer = null;
let currentBar = 0;
let nextBarTime = 0;
let lowPassFilter = null;

const BPM = 76;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

const progression = [
  { notes: [261.63, 329.63, 392.00], bass: 130.81, melodyIdx: 0 }, // C  major
  { notes: [220.00, 261.63, 329.63], bass: 110.00, melodyIdx: 1 }, // A  minor
  { notes: [174.61, 220.00, 261.63], bass: 87.31,  melodyIdx: 2 }, // F  major
  { notes: [196.00, 246.94, 293.66], bass: 98.00,  melodyIdx: 3 }, // G  major
];

const melodies = [
  // C major bar:   C5, E5, G5
  [[0, 523.25, 1.0], [1.5, 659.25, 1.0], [3, 783.99, 1.0]],
  // A minor bar:   A4, C5, E5
  [[0, 440.00, 1.0], [1.5, 523.25, 1.0], [3, 659.25, 1.0]],
  // F major bar:   F4, A4, C5
  [[0, 349.23, 1.0], [1.5, 440.00, 1.0], [3, 523.25, 1.0]],
  // G major bar:   G4, B4, D5
  [[0, 392.00, 1.0], [1.5, 493.88, 1.0], [3, 587.33, 1.0]],
];

function schedulePad(freq, start, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  o.detune.value = Math.random() * 6 - 3;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.05, start + 0.8);
  g.gain.setValueAtTime(0.05, start + dur - 0.4);
  g.gain.linearRampToValueAtTime(0, start + dur);
  o.connect(g).connect(lowPassFilter);
  o.start(start);
  o.stop(start + dur + 0.1);
}

function scheduleBass(freq, start, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.18, start + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(musicGain);
  o.start(start);
  o.stop(start + dur + 0.1);
}

function scheduleMelody(freq, start, dur) {
  // Bell-ish: triangle with quick attack + medium decay
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.14, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(musicGain);
  o.start(start);
  o.stop(start + dur + 0.1);
}

function scheduleBar(barIdx, startTime) {
  const chord = progression[barIdx % progression.length];
  chord.notes.forEach((freq) => schedulePad(freq, startTime, BAR));
  scheduleBass(chord.bass, startTime, BAR);
  melodies[chord.melodyIdx].forEach(([beatOff, freq, durBeats]) => {
    scheduleMelody(freq, startTime + beatOff * BEAT, durBeats * BEAT);
  });
}

export function startMusic() {
  if (musicTimer || muted || !ensureCtx()) return;
  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    lowPassFilter = ctx.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 1800;
    lowPassFilter.Q.value = 0.7;
    lowPassFilter.connect(musicGain);
    musicGain.connect(master);
  }
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(MUSIC_VOLUME, ctx.currentTime + 1.5);

  currentBar = 0;
  nextBarTime = ctx.currentTime + 0.15;
  // schedule the first two bars now
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

export function setMusicMood(mood) {
  // Soft tone shift for silent/reflective scenes.
  if (!lowPassFilter || !ctx) return;
  const cutoff = mood === 'silent' ? 500 : mood === 'reflective' ? 900 : 1800;
  lowPassFilter.frequency.cancelScheduledValues(ctx.currentTime);
  lowPassFilter.frequency.linearRampToValueAtTime(cutoff, ctx.currentTime + 1.2);
}

/* ============== Speech (TTS) ==============
 * Reads Shanaya's bubbles + narrator lines aloud via Web Speech API.
 */

let preferredShanayaVoice = null;
let preferredNarratorVoice = null;
let voicesReady = false;

function pickVoices() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return;
  voicesReady = true;

  // Shanaya: prefer Indian English female, fall back to other female-leaning EN voices.
  const shanayaPrefs = [
    /Veena/i,                       // macOS — en-IN female
    /Lekha/i,                       // macOS — Indian
    /en-IN.*female/i,
    /Samantha/i,                    // macOS — clear female
    /Tessa|Karen|Moira|Fiona/i,     // other Mac/EN female
    /Google.*US English/i,          // Chrome female default
    /Google.*Female/i,
  ];
  for (const re of shanayaPrefs) {
    const v = voices.find((x) => re.test(x.name) || (re.test(x.lang || '')));
    if (v) { preferredShanayaVoice = v; break; }
  }

  // Narrator: prefer male-leaning EN voice
  const narratorPrefs = [
    /Rishi/i,                       // macOS — en-IN male
    /Daniel/i,                      // macOS — en-GB
    /Alex/i,                        // macOS — en-US
    /Google.*UK English Male/i,
  ];
  for (const re of narratorPrefs) {
    const v = voices.find((x) => re.test(x.name));
    if (v) { preferredNarratorVoice = v; break; }
  }

  if (!preferredShanayaVoice) {
    preferredShanayaVoice = voices.find((v) => /^en/.test(v.lang)) || voices[0];
  }
  if (!preferredNarratorVoice) preferredNarratorVoice = preferredShanayaVoice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoices();
  // Voices load asynchronously in Chrome — listen for the event.
  window.speechSynthesis.onvoiceschanged = pickVoices;
}

export function speak(text, { who = 'shanaya', rate, pitch, volume = 1 } = {}) {
  if (muted || !('speechSynthesis' in window) || !text) return;
  if (!voicesReady) pickVoices();
  const utter = new SpeechSynthesisUtterance(stripEmoji(text));
  const isShanaya = who === 'shanaya';
  utter.voice = isShanaya ? preferredShanayaVoice : preferredNarratorVoice;
  utter.rate = rate ?? (isShanaya ? 0.98 : 0.96);
  utter.pitch = pitch ?? (isShanaya ? 1.15 : 0.95);
  utter.volume = volume;
  speechSynthesis.speak(utter);
}

export function cancelSpeech() {
  if ('speechSynthesis' in window) {
    try { speechSynthesis.cancel(); } catch {}
  }
}

function stripEmoji(s) {
  // Speech engines stumble over emojis — strip them for narration.
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
}
