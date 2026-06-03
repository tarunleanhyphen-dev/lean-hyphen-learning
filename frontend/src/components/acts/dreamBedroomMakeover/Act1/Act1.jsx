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
import { Volume2, X, Home } from 'lucide-react';
import { lesson } from '../../../../data/lessons/dreamBedroomMakeover.js';
import { useMakeover } from './useMakeover.js';
import { useNarration } from './useNarration.js';
import {
  Screen1Intro, Screen2Vibe, Screen2Rules, Screen3Sort,
  Screen4Shop, Screen5Events, Screen6Snapshot,
} from './Screens.jsx';
import { unlockAudio } from '../../../../utils/sounds.js';
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

  const [audioAsked, setAudioAsked] = useState(() => {
    try { return localStorage.getItem(AUDIO_KEY) !== null; } catch { return false; }
  });
  const [showCard, setShowCard] = useState(false);

  /* DEV-only: ?dev= adds .dbm-reveal so headless screenshots show framer's
   * initial opacity:0 content. Seeding happens in useMakeover. No-op in prod. */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (new URLSearchParams(window.location.search).get('dev')) {
      document.documentElement.classList.add('dbm-reveal');
    }
  }, []);

  useEffect(() => {
    if (audioAsked) return undefined;
    const t = setTimeout(() => setShowCard(true), 900);
    return () => clearTimeout(t);
  }, [audioAsked]);

  // Re-narrate the intro once audio unlocks so the first screen reads aloud.
  const enableVoice = useCallback(async () => {
    try { await unlockAudio(true); } catch { /* noop */ }
    try { localStorage.setItem(AUDIO_KEY, 'on'); } catch { /* noop */ }
    setAudioAsked(true); setShowCard(false);
    // nudge the current screen to re-read now that TTS is live
    const sc = lesson.scenes.find((x) => x.id === mk.state.screen);
    if (sc?.narration) narration.replay(sc.narration);
    else if (sc?.intro) narration.replay([sc.intro]);
  }, [mk.state.screen, narration]);

  const skipVoice = useCallback(() => {
    try { localStorage.setItem(AUDIO_KEY, 'off'); } catch { /* noop */ }
    setAudioAsked(true); setShowCard(false);
  }, []);

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

      <AnimatePresence>
        {!audioAsked && showCard && (
          <motion.div className="dbm-audiocard" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}>
            <div className="dbm-audiocard__icon"><Volume2 size={20} /></div>
            <div className="dbm-audiocard__body">
              <strong>Turn on Kabir's voice?</strong>
              <span>He'll narrate the whole makeover aloud. Each scene reads fully before it unlocks the next step.</span>
            </div>
            <div className="dbm-audiocard__actions">
              <button className="dbm-audiocard__ghost" onClick={skipVoice}><X size={14} /> No, just text</button>
              <button className="dbm-audiocard__primary" onClick={enableVoice}>Yes, narrate</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
