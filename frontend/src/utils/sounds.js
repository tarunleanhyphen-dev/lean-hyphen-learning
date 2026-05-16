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

/* ============== Music sequencer ==============
 * Pad + bass + melody. Four-bar progression: C → Am → F → G (looping).
 * Notes are scheduled ahead on the AudioContext clock for tight timing.
 */

let musicTimer = null;
let currentBar = 0;
let nextBarTime = 0;
let lowPassFilter = null;

// Mature lo-fi feel for class 7–9 students: slow tempo, minor-leaning vi-iii-IV-I
// progression (Am-Em-F-C), bass + atmospheric pad only — no bell melody.
const BPM = 64;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

const progression = [
  { notes: [220.00, 261.63, 329.63], bass: 110.00 }, // A minor
  { notes: [164.81, 196.00, 246.94], bass: 82.41  }, // E minor
  { notes: [174.61, 220.00, 261.63], bass: 87.31  }, // F major
  { notes: [196.00, 246.94, 293.66], bass: 98.00  }, // G major (resolves back to Am)
];

function schedulePad(freq, start, dur) {
  // Warm sustained chord tone — slightly detuned, slow attack/release.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  o.detune.value = Math.random() * 8 - 4;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.045, start + 1.2);
  g.gain.setValueAtTime(0.045, start + dur - 0.6);
  g.gain.linearRampToValueAtTime(0, start + dur);
  o.connect(g).connect(lowPassFilter);
  o.start(start);
  o.stop(start + dur + 0.2);
}

function scheduleBass(freq, start, dur) {
  // Low pluck on beat 1 of each bar — half-decay then quiet.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.16, start + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.7);
  o.connect(g).connect(musicGain);
  o.start(start);
  o.stop(start + dur + 0.1);
}

function scheduleShaker(start) {
  // Subtle hi-hat tick on beat 3 — short white noise burst through high-pass.
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

function scheduleBar(barIdx, startTime) {
  const chord = progression[barIdx % progression.length];
  chord.notes.forEach((freq) => schedulePad(freq, startTime, BAR));
  // Bass on beats 1 and 3 of each bar.
  scheduleBass(chord.bass, startTime, BAR / 2);
  scheduleBass(chord.bass, startTime + BAR / 2, BAR / 2);
  // Subtle shaker on the off-beats for lo-fi feel.
  scheduleShaker(startTime + BEAT * 1);
  scheduleShaker(startTime + BEAT * 3);
}

export function startMusic() {
  if (musicTimer || muted || !ensureCtx()) return;
  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    lowPassFilter = ctx.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 1100; // warmer / less bright than before
    lowPassFilter.Q.value = 0.65;
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

/** Soft duck — used when the sequencer pauses. Keeps the loop scheduled but mutes the bus. */
export function pauseMusic() {
  if (!musicGain || !ctx) return;
  const t = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(0, t + 0.25);
}

/** Counterpart to pauseMusic — fades the bus back to MUSIC_VOLUME. */
export function resumeMusic() {
  if (muted) return;
  if (!musicGain || !ctx) { startMusic(); return; }
  const t = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(MUSIC_VOLUME, t + 0.6);
}

export function setMusicMood(mood) {
  // Soft tone shift for silent/reflective scenes.
  if (!lowPassFilter || !ctx) return;
  const cutoff = mood === 'silent' ? 500 : mood === 'reflective' ? 900 : 1800;
  lowPassFilter.frequency.cancelScheduledValues(ctx.currentTime);
  lowPassFilter.frequency.linearRampToValueAtTime(cutoff, ctx.currentTime + 1.2);
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
  const url = `${CLOUD_TTS_BASE}/api/tts?voice=${encodeURIComponent(who)}&text=${encodeURIComponent(chunks[i])}`;
  const audio = new Audio(url);
  currentCloudAudio = audio;
  audio.volume = volume;
  audio.preservesPitch = false;
  // Shanaya is 12–13: speed/pitch up the youthful Google Translate voice.
  audio.playbackRate = who === 'shanaya' ? 1.15 : 1.0;
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
