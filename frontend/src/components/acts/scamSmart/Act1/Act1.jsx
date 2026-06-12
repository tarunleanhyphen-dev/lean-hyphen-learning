/**
 * Scam Smart · Act 1 — The Hook.
 * Start gate (unlocks audio) → authentic WhatsApp group chat (typewriter +
 * notification sounds, Priya as the main "you") → a 3D phone transition that
 * slides in with a pulsing "5 waiting" badge → teaser → hand off to Act 2.
 */
import { Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck, Volume2, VolumeX, Play } from 'lucide-react';
import { act1Hook } from '../../../../data/lessons/scamSmart.js';
import { useL3Analytics } from '../useL3Analytics.js';
import { TopBar } from '../parts.jsx';
import BgFx, { hasWebGL } from '../BgFx.jsx';
import WhatsAppChat from './WhatsAppChat.jsx';
import PhoneScene3D from './PhoneScene3D.jsx';
import PhoneCSS from './PhoneCSS.jsx';
import { unlockAudio, stopMusic, speak, cancelSpeech } from '../../../../utils/sounds.js';
import '../scamSmart.css';

const SCENES = { chat: 'sc-chat', teaser: 'sc-teaser' };

export default function ScamSmartAct1({ onComplete, onGoHome }) {
  const analytics = useL3Analytics('act1', { bumpAttempt: true });
  const startedAt = useRef(Date.now());
  const [started, setStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [screen, setScreen] = useState('chat'); // chat | transition
  const [chatDone, setChatDone] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  // DEV-only: ?play=1 auto-opens the chat (skips the gesture gate) and
  // ?screen=transition jumps straight to the 3D transition — for screenshots.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('play')) {
      setStarted(true);
      analytics.lessonStarted();
      analytics.actStarted();
      if (q.get('screen') === 'transition') { setScreen('transition'); setChatDone(true); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-scene timing (only once started).
  useEffect(() => {
    if (!started) return undefined;
    analytics.sceneEntered(SCENES[screen] || 'sc-chat');
    return () => analytics.sceneCompleted(SCENES[screen] || 'sc-chat');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, screen]);

  const handleStart = async () => {
    try { await unlockAudio(true); } catch { /* noop */ }
    try { stopMusic(); } catch { /* noop */ }   // chat plays SFX only, no music bed
    setStarted(true);
    analytics.lessonStarted();
    analytics.actStarted();
    window.scrollTo({ top: 0 });
  };

  const toggleSound = async () => {
    if (!soundOn) { try { await unlockAudio(true); } catch { /* noop */ } try { stopMusic(); } catch { /* noop */ } }
    setSoundOn((v) => !v);
  };

  const goTransition = () => { setScreen('transition'); window.scrollTo({ top: 0 }); };

  // Voice-narrate the bridge line when the transition appears.
  useEffect(() => {
    if (screen !== 'transition') return undefined;
    if (soundOn) { try { speak(act1Hook.bridge[0], { rate: 0.98 }); } catch { /* noop */ } }
    return () => { try { cancelSpeech(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const finish = () => {
    try { cancelSpeech(); } catch { /* noop */ }
    analytics.actCompleted({ timeMs: Date.now() - startedAt.current });
    analytics.flush?.();
    onComplete?.();
  };

  const canUse3D = hasWebGL();
  return (
    <div className="ss">
      <BgFx />
      <div className="ss__shell" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TopBar onGoHome={onGoHome} eyebrow="Scam Smart · Act 1 — The Hook" />
          <button className="ss__iconbtn" style={{ marginLeft: 'auto' }} onClick={toggleSound} title={soundOn ? 'Mute' : 'Unmute'} aria-label="Toggle sound">
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>

        {/* ── Start gate (a real gesture so audio + sounds unlock) ── */}
        <AnimatePresence>
          {!started && (
            <motion.div
              key="gate"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="ss__verdict" style={{ marginTop: 8 }}
            >
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
                <ShieldCheck size={58} style={{ color: '#a855f7' }} />
              </motion.div>
              <h1 className="ss__h1" style={{ marginTop: 10 }}>It starts with a midnight message.</h1>
              <p className="ss__lead" style={{ marginTop: 8 }}>
                You're in the <b>Squad Goals</b> group chat. It's 11:47 PM. Read what just happened to Rohan — with the sound on for the full experience.
              </p>
              <button className="ss__btn" style={{ marginTop: 20 }} onClick={handleStart}><Play size={18} /> Open the chat</button>
              <p className="ss__eyebrow" style={{ marginTop: 12 }}>🔊 Best with sound</p>
            </motion.div>
          )}
        </AnimatePresence>

        {started && (
          <AnimatePresence mode="wait">
            {/* ── WhatsApp chat ── */}
            {screen === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
                <WhatsAppChat chat={act1Hook} soundOn={soundOn} onDone={() => setChatDone(true)} />
                <AnimatePresence>
                  {chatDone && (
                    <motion.button
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="ss__btn ss__btn--full" style={{ marginTop: 18 }} onClick={goTransition}
                    >
                      Continue <ArrowRight size={18} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── 3D transition + teaser ── */}
            {screen === 'transition' && (
              <motion.div key="transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                <motion.p
                  className="ss__lead"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ maxWidth: 560, margin: '4px auto 0' }}
                >
                  What happened to Rohan happens to <b style={{ color: '#fff' }}>thousands of students every week</b>. Now you're going to walk through it yourself — and learn to spot it in real time.
                </motion.p>

                <motion.div initial={{ opacity: 0, scale: 0.9, x: 60 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 90, damping: 16 }}>
                  {canUse3D
                    ? <Suspense fallback={<PhoneCSS />}><PhoneScene3D height={320} /></Suspense>
                    : <PhoneCSS />}
                </motion.div>

                <motion.h2
                  className="ss__h2"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
                  style={{ maxWidth: 540, margin: '0 auto' }}
                >
                  5 messages are waiting for you. Some are fine. Some will try to take everything. <span style={{ background: 'linear-gradient(90deg,#22d3ee,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Can you tell the difference?</span>
                </motion.h2>

                <motion.button
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
                  className="ss__btn" style={{ marginTop: 22, fontSize: 16, padding: '15px 30px' }} onClick={finish}
                >
                  Move to Act 2 <ArrowRight size={18} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
