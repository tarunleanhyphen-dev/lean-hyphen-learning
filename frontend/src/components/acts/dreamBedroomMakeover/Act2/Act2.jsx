/**
 * "Where Does My Money Go?" · Act 2 — The 50/30/20 Rule.
 * Concept-teach module that builds on the learner's Act 1 spending.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, X, Home } from 'lucide-react';
import { act2 } from '../../../../data/lessons/dreamBedroomMakeover.js';
import { useNarration } from '../Act1/useNarration.js';
import { unlockAudio } from '../../../../utils/sounds.js';
import { C1Reveal, C2Apply, C3Activity, C4Takeaway, loadAct1Spend } from './Screens2.jsx';
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
  const go = useCallback((id) => { narration.stop(); setScreen(id); }, [narration]);

  const [audioAsked, setAudioAsked] = useState(() => { try { return localStorage.getItem(AUDIO_KEY) !== null; } catch { return false; } });
  const [showCard, setShowCard] = useState(false);
  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev')) document.documentElement.classList.add('dbm-reveal');
    if (audioAsked) return undefined;
    const t = setTimeout(() => setShowCard(true), 900);
    return () => clearTimeout(t);
  }, [audioAsked]);

  const enableVoice = useCallback(async () => {
    try { await unlockAudio(true); } catch { /* noop */ }
    try { localStorage.setItem(AUDIO_KEY, 'on'); } catch { /* noop */ }
    setAudioAsked(true); setShowCard(false);
  }, []);
  const skipVoice = useCallback(() => { try { localStorage.setItem(AUDIO_KEY, 'off'); } catch { /* noop */ } setAudioAsked(true); setShowCard(false); }, []);

  const stepIdx = ORDER.indexOf(screen);

  return (
    <div className="dbm dbm--study" style={{ '--accent': ACCENT, '--glow': GLOW }}>
      <div className="dbm__bg">
        <div className="dbm__bg-blob dbm__bg-blob--1" />
        <div className="dbm__bg-blob dbm__bg-blob--2" />
        <div className="dbm__bg-grid" />
      </div>

      <header className="dbm__topbar">
        <button className="dbm__home" onClick={onGoHome} title="Home"><Home size={16} /></button>
        <div className="dbm__steps">
          {ORDER.map((id, i) => (<span key={id} className={`dbm__step ${i <= stepIdx ? 'is-on' : ''} ${i === stepIdx ? 'is-now' : ''}`} />))}
        </div>
        <div className="dbm__nowtitle">Act 2 · {act2.scenes[stepIdx]?.title}</div>
      </header>

      <main className="dbm__main">
        <AnimatePresence mode="wait">
          <motion.div key={screen} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="dbm__screenwrap">
            {screen === 'c1-reveal'   && <C1Reveal   go={go} narration={narration} accent={ACCENT} />}
            {screen === 'c2-apply'    && <C2Apply    go={go} narration={narration} accent={ACCENT} act1={act1} />}
            {screen === 'c3-activity' && <C3Activity go={go} narration={narration} accent={ACCENT} />}
            {screen === 'c4-takeaway' && <C4Takeaway narration={narration} accent={ACCENT} act1={act1} onComplete={onComplete} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {!audioAsked && showCard && (
          <motion.div className="dbm-audiocard" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}>
            <div className="dbm-audiocard__icon"><Volume2 size={20} /></div>
            <div className="dbm-audiocard__body">
              <strong>Turn on Kabir's voice?</strong>
              <span>He'll narrate the 50/30/20 rule aloud as you go.</span>
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
