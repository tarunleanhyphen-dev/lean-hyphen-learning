/**
 * "Where Does My Money Go?" · Act 2 — The 50/30/20 Rule.
 * Concept-teach module that builds on the learner's Act 1 spending.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX, Home, Play } from 'lucide-react';
import { act2 } from '../../../../data/lessons/dreamBedroomMakeover.js';
import { useNarration } from '../Act1/useNarration.js';
import { unlockAudio } from '../../../../utils/sounds.js';
import { C1Reveal, C2Apply, C3Activity, C4Takeaway, loadAct1Spend } from './Screens2.jsx';
import { useL2Analytics } from '../useL2Analytics.js';
import '../Act1/makeover.css';
import './act2.css';

const AUDIO_KEY = 'lh.dbm.audio.v1';
const ACCENT = '#A855F7', GLOW = '#c084fc';
const ORDER = ['c1-reveal', 'c2-apply', 'c3-activity', 'c4-takeaway'];

export default function DreamBedroomAct2({ onComplete, onGoHome }) {
  const narration = useNarration();
  const act1 = useMemo(loadAct1Spend, []);

  const initial = (() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      const dev = new URLSearchParams(window.location.search).get('dev');
      if (dev && ORDER.includes(dev)) return dev;
    }
    return 'c1-reveal';
  })();
  const [screen, setScreen] = useState(initial);
  const go = useCallback((id) => { narration.stop(); setScreen(id); window.scrollTo({ top: 0 }); }, [narration]);

  const [voiceOn, setVoiceOn] = useState(false);
  const [started, setStarted] = useState(false); // gate: Act 2 begins on Start click

  /* ---- analytics: act/scene lifecycle + the First-Salary answers ---- */
  const analytics = useL2Analytics('act2');
  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev')) document.documentElement.classList.add('dbm-reveal');
  }, []);

  // scene_entered on each screen, scene_completed on leaving it
  useEffect(() => {
    if (!started) return undefined;
    analytics.sceneEntered(screen);
    return () => analytics.sceneCompleted(screen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, screen]);

  // Always open each screen at the very top (the previous act may have left the
  // page scrolled down).
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [screen, started]);

  // Explicit Start gate — clicking Start is a real gesture, so audio + music
  // unlock reliably, then the first scene mounts and Kabir begins.
  const handleStart = useCallback(async () => {
    try { await unlockAudio(true); } catch { /* noop */ }
    try { localStorage.setItem(AUDIO_KEY, 'on'); } catch { /* noop */ }
    setVoiceOn(true);
    setStarted(true);
    analytics.actStarted();
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // act_completed (+ flush) when Act 2's takeaway finishes.
  const handleComplete = useCallback(() => {
    analytics.actCompleted();
    analytics.flush?.();
    onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  const toggleVoice = useCallback(async () => {
    if (voiceOn) {
      try { await unlockAudio(false); } catch { /* noop */ }
      try { localStorage.setItem(AUDIO_KEY, 'off'); } catch { /* noop */ }
      setVoiceOn(false);
    } else {
      try { await unlockAudio(true); } catch { /* noop */ }
      try { localStorage.setItem(AUDIO_KEY, 'on'); } catch { /* noop */ }
      setVoiceOn(true); narration.restart();
    }
  }, [voiceOn, narration]);

  const stepIdx = ORDER.indexOf(screen);

  return (
    <div className="dbm dbm--study" style={{ '--accent': ACCENT, '--glow': GLOW }}>
      <div className="dbm__bg">
        <div className="dbm__bg-blob dbm__bg-blob--1" />
        <div className="dbm__bg-blob dbm__bg-blob--2" />
        <div className="dbm__bg-grid" />
      </div>

      {/* Start gate — Act 2 + Kabir's voice begin on click */}
      <AnimatePresence>
        {!started && (
          <motion.div key="start" className="dbm__start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="dbm__start-card" initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 22 }}>
              <span className="dbm__start-eyebrow">Lesson 2 · Act 2</span>
              <h1 className="dbm__start-title">The <span className="dbm__gold">50 / 30 / 20</span> Rule</h1>
              <p className="dbm__start-sub">Kabir explains the one rule smart budgeters use. Turn your sound on for the full experience.</p>
              <button className="dbm__start-btn" onClick={handleStart}><Play size={18} /> Start Act 2</button>
              <span className="dbm__start-note">🔊 Plays with voice narration</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {started && (
        <>
          <header className="dbm__topbar">
            <button className="dbm__home" onClick={onGoHome} title="Home"><Home size={16} /></button>
            <div className="dbm__steps">
              {ORDER.map((id, i) => (<span key={id} className={`dbm__step ${i <= stepIdx ? 'is-on' : ''} ${i === stepIdx ? 'is-now' : ''}`} />))}
            </div>
            <div className="dbm__nowtitle">Act 2 · {act2.scenes[stepIdx]?.title}</div>
            <button className={`dbm__voice ${voiceOn ? 'is-on' : ''}`} onClick={toggleVoice} title={voiceOn ? "Mute Kabir's voice" : "Play Kabir's voice"}>
              {voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </header>

          <main className="dbm__main">
            <AnimatePresence mode="wait">
              <motion.div key={screen} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="dbm__screenwrap">
                {screen === 'c1-reveal'   && <C1Reveal   go={go} narration={narration} accent={ACCENT} />}
                {screen === 'c2-apply'    && <C2Apply    go={go} narration={narration} accent={ACCENT} act1={act1} />}
                {screen === 'c3-activity' && <C3Activity go={go} narration={narration} accent={ACCENT} analytics={analytics} />}
                {screen === 'c4-takeaway' && <C4Takeaway narration={narration} accent={ACCENT} act1={act1} onComplete={handleComplete} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}
