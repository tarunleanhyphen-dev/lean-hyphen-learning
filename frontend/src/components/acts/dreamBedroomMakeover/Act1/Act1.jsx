/**
 * Lesson 3 · Act 1 — Dream Bedroom Makeover.
 *
 * Owns: the makeover state, the narration controller (single TTS writer),
 * the first-run audio-permission card, and per-screen routing. Each screen is
 * a self-contained surface that reads/writes the shared state and drives its
 * own narration.
 */
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX, Home } from 'lucide-react';
import { lesson } from '../../../../data/lessons/dreamBedroomMakeover.js';
import { useMakeover } from './useMakeover.js';
import { useNarration } from './useNarration.js';
import {
  Screen1Intro, Screen2Vibe, Screen2Rules, Screen3Sort,
  Screen4Shop, Screen5Events, Screen6Snapshot,
} from './Screens.jsx';
import { unlockAudio, isAudioReady } from '../../../../utils/sounds.js';
import './makeover.css';

const AUDIO_KEY = 'lh.dbm.audio.v1';
const VIBE_BY_ID = Object.fromEntries(lesson.vibes.map((v) => [v.id, v]));

const SCREENS = {
  'screen-1-intro':    Screen1Intro,
  'screen-2-vibe':     Screen2Vibe,
  'screen-2-rules':    Screen2Rules,
  'screen-3-sort':     Screen3Sort,
  'screen-4-shop':     Screen4Shop,
  'screen-5-events':   Screen5Events,
  'screen-6-snapshot': Screen6Snapshot,
};

export default function DreamBedroomAct1({ onComplete, onGoHome }) {
  const mk = useMakeover();
  const narration = useNarration();
  const vibe = VIBE_BY_ID[mk.state.vibe] || lesson.vibes[0];
  const accent = vibe.accent;

  const initialPref = (() => { try { return localStorage.getItem(AUDIO_KEY); } catch { return null; } })();
  const [voiceOn, setVoiceOn] = useState(false); // audio actually unlocked + unmuted

  /* DEV-only: ?dev= adds .dbm-reveal so headless screenshots show framer's
   * initial opacity:0 content. Seeding happens in useMakeover. No-op in prod. */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (new URLSearchParams(window.location.search).get('dev')) {
      document.documentElement.classList.add('dbm-reveal');
    }
  }, []);

  /* Auto-start Kabir's voice on entry. Arriving via an in-app click (Start
   * Act 1 / the Act card) gives a transient user-activation, so the AudioContext
   * can resume and the narration plays with no extra button. If the browser
   * still blocks it (e.g. a direct page reload), the first interaction anywhere
   * kicks it off. A previous explicit mute (pref 'off') is respected. */
  useEffect(() => {
    if (initialPref === 'off') return undefined;
    let cancelled = false;
    (async () => {
      try { await unlockAudio(true); } catch { /* noop */ }
      if (cancelled) return;
      setVoiceOn(true);
      try { localStorage.setItem(AUDIO_KEY, 'on'); } catch { /* noop */ }
      narration.restart();
    })();
    const onGesture = async () => {
      if (isAudioReady()) return; // autoplay already running — nothing to do
      try { await unlockAudio(true); } catch { /* noop */ }
      setVoiceOn(true);
      narration.restart();       // autoplay was blocked → start on first interaction
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => { cancelled = true; window.removeEventListener('pointerdown', onGesture); window.removeEventListener('keydown', onGesture); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Persistent speaker toggle in the top bar (mute / unmute + replay-on). */
  const toggleVoice = useCallback(async () => {
    if (voiceOn) {
      try { await unlockAudio(false); } catch { /* noop */ }
      try { localStorage.setItem(AUDIO_KEY, 'off'); } catch { /* noop */ }
      setVoiceOn(false);
    } else {
      try { await unlockAudio(true); } catch { /* noop */ }
      try { localStorage.setItem(AUDIO_KEY, 'on'); } catch { /* noop */ }
      setVoiceOn(true);
      narration.restart();
    }
  }, [voiceOn, narration]);

  const ScreenComp = SCREENS[mk.state.screen] || Screen1Intro;
  const stepIdx = lesson.scenes.findIndex((s) => s.id === mk.state.screen);

  return (
    <div className={`dbm dbm--${mk.state.vibe || 'cosy'}`} style={{ '--accent': accent, '--glow': vibe.glow }}>
      {/* ambient background */}
      <div className="dbm__bg">
        <div className="dbm__bg-blob dbm__bg-blob--1" />
        <div className="dbm__bg-blob dbm__bg-blob--2" />
        <div className="dbm__bg-grid" />
      </div>

      {/* top bar */}
      <header className="dbm__topbar">
        <button className="dbm__home" onClick={onGoHome} title="Home"><Home size={16} /></button>
        <div className="dbm__steps">
          {lesson.scenes.map((s, i) => (
            <span key={s.id} className={`dbm__step ${i <= stepIdx ? 'is-on' : ''} ${i === stepIdx ? 'is-now' : ''}`} />
          ))}
        </div>
        <div className="dbm__nowtitle">{lesson.scenes[stepIdx]?.title}</div>
        <button className={`dbm__voice ${voiceOn ? 'is-on' : ''}`} onClick={toggleVoice} title={voiceOn ? "Mute Kabir's voice" : "Play Kabir's voice"}>
          {voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </header>

      <main className="dbm__main">
        <AnimatePresence mode="wait">
          <motion.div
            key={mk.state.screen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="dbm__screenwrap"
          >
            <ScreenComp mk={mk} narration={narration} vibe={vibe} accent={accent} onComplete={onComplete} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
