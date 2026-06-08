/**
 * Lesson 3 · Act 1 — Dream Bedroom Makeover.
 *
 * Owns: the makeover state, the narration controller (single TTS writer),
 * the first-run audio-permission card, and per-screen routing. Each screen is
 * a self-contained surface that reads/writes the shared state and drives its
 * own narration.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX, Home, Play } from 'lucide-react';
import { lesson, sortItems } from '../../../../data/lessons/dreamBedroomMakeover.js';
import { useMakeover } from './useMakeover.js';
import { useNarration } from './useNarration.js';
import { useL2Analytics } from '../useL2Analytics.js';
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

  const [voiceOn, setVoiceOn] = useState(false); // audio actually unlocked + unmuted
  const [started, setStarted] = useState(false);  // gate: Scene 1 + audio begin on Start click

  /* ---- analytics: lesson/act/scene lifecycle + graded activities ---- */
  const analytics = useL2Analytics('act1', { bumpAttempt: true });
  const emitted = useRef({ sort: false, mcq: false });

  // scene_entered on each screen, scene_completed on leaving it
  useEffect(() => {
    if (!started) return undefined;
    const s = mk.state.screen;
    analytics.sceneEntered(s);
    return () => analytics.sceneCompleted(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, mk.state.screen]);

  // a1-sort — graded once the learner reaches the shop (after sorting)
  useEffect(() => {
    if (mk.state.screen !== 'screen-4-shop' || emitted.current.sort) return;
    emitted.current.sort = true;
    const ans = mk.state.sortAnswers || {};
    const total = sortItems.length;
    const correct = sortItems.filter((it) => ans[it.id] === it.correct).length;
    analytics.activityCompleted('a1-sort', {
      sceneId: 'screen-3-sort',
      payload: { sceneId: 'screen-3-sort', detail: { correct, total, accuracyPct: total ? Math.round((correct / total) * 100) : 0 } },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mk.state.screen]);

  // a1-snapshot-mcq — the "biggest category" answer
  useEffect(() => {
    if (!mk.state.snapshotMcq || emitted.current.mcq) return;
    emitted.current.mcq = true;
    const totals = mk.categoryTotals || {};
    const biggest = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
    const correct = mk.state.snapshotMcq === biggest ? 1 : 0;
    analytics.activityCompleted('a1-snapshot-mcq', {
      sceneId: 'screen-6-snapshot',
      payload: { sceneId: 'screen-6-snapshot', detail: { correct, total: 1, accuracyPct: correct * 100 } },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mk.state.snapshotMcq]);

  // act_completed (+ flush) when the snapshot CTA finishes Act 1
  const handleComplete = useCallback(() => {
    analytics.actCompleted();
    analytics.flush?.();
    onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  /* DEV-only: ?dev= adds .dbm-reveal so headless screenshots show framer's
   * initial opacity:0 content. Seeding happens in useMakeover. No-op in prod. */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (new URLSearchParams(window.location.search).get('dev')) {
      document.documentElement.classList.add('dbm-reveal');
    }
  }, []);

  /* Every screen should open at the top — otherwise the scroll position from a
   * long previous screen (e.g. the Shop) carries over and Scene 6 looks like it
   * jumped straight to the expense tracker. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.querySelector('.dbm__main')?.scrollTo?.({ top: 0 });
  }, [mk.state.screen]);

  /* Explicit Start gate. Clicking Start is a real user gesture, so the
   * AudioContext resumes reliably; we unlock audio, then reveal Scene 1, whose
   * narration begins automatically as the screen mounts (Kabir's voice plays). */
  const handleStart = useCallback(async () => {
    try { await unlockAudio(true); } catch { /* noop */ }
    setVoiceOn(true);
    try { localStorage.setItem(AUDIO_KEY, 'on'); } catch { /* noop */ }
    setStarted(true);
    analytics.lessonStarted();
    analytics.actStarted();
    // Scene 1 mounts now and its own narration begins automatically — no restart needed.
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
        {[
          { x: 12, s: 4, d: 12, delay: 0 }, { x: 27, s: 3, d: 15, delay: 2.5 },
          { x: 41, s: 5, d: 11, delay: 1.2 }, { x: 56, s: 3, d: 16, delay: 3.4 },
          { x: 68, s: 4, d: 13, delay: 0.6 }, { x: 81, s: 3, d: 17, delay: 2.0 },
          { x: 92, s: 5, d: 14, delay: 4.0 },
        ].map((m, i) => (
          <span key={i} className="dbm__bg-mote" style={{ left: `${m.x}%`, width: m.s, height: m.s, animationDuration: `${m.d}s`, animationDelay: `${m.delay}s` }} />
        ))}
      </div>

      {/* Start gate — Scene 1 and Kabir's voice begin only on click */}
      <AnimatePresence>
        {!started && (
          <motion.div
            key="start"
            className="dbm__start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="dbm__start-card"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 22 }}
            >
              <span className="dbm__start-eyebrow">Lesson 2 · Act 1</span>
              <h1 className="dbm__start-title">Dream Bedroom <span className="dbm__gold">Makeover</span></h1>
              <p className="dbm__start-sub">Kabir will walk you through it. Turn your sound on for the full experience.</p>
              <button className="dbm__start-btn" onClick={handleStart}>
                <Play size={18} /> Start
              </button>
              <span className="dbm__start-note">🔊 Plays with voice narration</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* top bar + scene mount only after Start (so Scene 1 + audio don't run early) */}
      {started && (
        <>
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
                <ScreenComp mk={mk} narration={narration} vibe={vibe} accent={accent} onComplete={handleComplete} />
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}
