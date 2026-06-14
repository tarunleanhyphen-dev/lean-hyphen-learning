/**
 * Scam Smart · Act 2 — The Scenarios.
 * Matches the Netlify "Spot the Scam" layout: a left act-sidebar + a content
 * column with the scenario header (Scenario X/5, Shields, Close calls), the
 * scam shown inside an iPhone, an INTERNAL THOUGHT bubble, then the choices.
 * A correct FIRST call earns a Shield; wrong-then-right is a "close call".
 * Same analytics pipeline as L1/L2.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, XCircle, ShieldCheck, Brain, Volume2 } from 'lucide-react';
import { scenarios } from '../../../../data/lessons/scamSmart.js';
import { useL3Analytics } from '../useL3Analytics.js';
import Sidebar from '../shell/Sidebar.jsx';
import BgFx3D from '../shell/BgFx3D.jsx';
import PhoneShell from '../shell/PhoneShell.jsx';
import ScamScreen from './ScamScreens.jsx';
import { speak, cancelSpeech } from '../../../../utils/sounds.js';
import { useSoftMusic } from '../shell/useSoftMusic.js';
import '../scamSmart.css';

export default function ScamSmartAct2({ onComplete, onGoHome }) {
  const analytics = useL3Analytics('act2');
  const navigate = useNavigate();
  const location = useLocation();
  const startedAt = useRef(Date.now());

  useSoftMusic('calm');
  const sceneParam = () => {
    const n = Number(new URLSearchParams(window.location.search).get('scene'));
    return Number.isInteger(n) && n >= 0 && n < scenarios.length ? n : 0;
  };
  const [idx, setIdx] = useState(sceneParam);
  const [chosen, setChosen] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [shields, setShields] = useState(0);
  const [closeCalls, setCloseCalls] = useState(0);
  const [opened, setOpened] = useState(false); // has the learner read the phone message?

  const s = scenarios[idx];
  const choice = chosen ? s.choices.find((c) => c.key === chosen) : null;
  const solved = choice?.verdict === 'win';

  useEffect(() => {
    analytics.actStarted();
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOpened(false);
    analytics.sceneEntered(s.sceneId);
    return () => analytics.sceneCompleted(s.sceneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Once the learner opens/reads the phone message, reveal + voice the question.
  const openQuestion = () => {
    setOpened(true);
    try { speak(s.thought, { who: 'priya' }); } catch { /* noop */ }
  };

  // Deep-link from the sidebar SHOW SCENES list.
  useEffect(() => {
    const n = sceneParam();
    setIdx(n); setChosen(null); setAttempts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Scenario 1's fake giveaway is read by a mature male Indian voice (the
  // synthetic "narrator" — NOT a clone of any real person).
  const speakGiveaway = () => { try { speak(s.body?.caption || s.narrate, { who: 'narrator' }); } catch { /* noop */ } };
  // The learner's INTERNAL THOUGHT is read in a different (teen) voice.
  const speakThought = () => { try { speak(s.thought, { who: 'priya' }); } catch { /* noop */ } };
  // On scenario load: play the giveaway pitch, then the internal thought.
  useEffect(() => {
    try { cancelSpeech(); } catch { /* noop */ }
    if (s.app === 'youtube' && s.body?.caption) {
      const t = setTimeout(() => { speakGiveaway(); }, 500);
      return () => { clearTimeout(t); try { cancelSpeech(); } catch { /* noop */ } };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);
  useEffect(() => () => { try { cancelSpeech(); } catch { /* noop */ } }, []);

  const pick = (c) => {
    if (solved) return;
    const attemptNo = attempts + 1;
    setChosen(c.key);
    setAttempts(attemptNo);
    analytics.interaction('scenario_decision', {
      sceneId: s.sceneId, activityId: s.activityId,
      payload: { choice: c.key, verdict: c.verdict, attemptNo },
    });
    if (c.verdict === 'win') {
      const firstTry = attemptNo === 1;
      if (firstTry) setShields((n) => n + 1); else setCloseCalls((n) => n + 1);
      analytics.activityCompleted(s.activityId, {
        sceneId: s.sceneId, attemptNo,
        detail: { correct: 1, total: 1, accuracyPct: firstTry ? 100 : 50, attempts: attemptNo, firstTry },
      });
    }
  };

  const retry = () => {
    analytics.activityRetried(s.activityId, { sceneId: s.sceneId, payload: { attemptNo: attempts } });
    setChosen(null);
  };

  const next = () => {
    if (idx + 1 >= scenarios.length) {
      analytics.actCompleted({ timeMs: Date.now() - startedAt.current });
      analytics.flush?.();
      onComplete?.();
      return;
    }
    setIdx((i) => i + 1);
    setChosen(null);
    setAttempts(0);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="ssh">
      <BgFx3D />
      <Sidebar
        current="act2"
        onHome={() => navigate('/lesson3')}
        onNavigate={(actId) => navigate(`/lesson3/${actId}`)}
        onNavigateScene={(actId, idx2) => navigate(`/lesson3/${actId}?scene=${idx2}`)}
      />

      <main className="ssh__main">
        <div className="ssh__col ssh__col--wide">
          <div className="ssh__eyebrow">Act 2 — The Scenarios</div>
          <div className="ssh__scenetitle">Scenario {s.n} / {scenarios.length}</div>

          <div className="ssh__stats">
            <span className="ssh__shields">
              🛡️ Shields: {shields} / {scenarios.length}
              <span className="ssh__shieldpips">
                {Array.from({ length: scenarios.length }).map((_, i) => (
                  <span key={i} className={i < shields ? 'is-on' : ''}>🛡️</span>
                ))}
              </span>
            </span>
            <span className="ssh__close">⚠️ Close calls: {closeCalls}</span>
          </div>
          <p className="ssh__help">Each right call earns a shield. Shields protect people like Rohan.</p>

          <AnimatePresence mode="wait">
            <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="ss2">
              <div className="ss2__left">
                <PhoneShell screenClass="ssh__screen--scam">
                  <ScamScreen scenario={s} onSpeak={s.app === 'youtube' ? speakGiveaway : undefined} />
                </PhoneShell>
              </div>

              <div className="ss2__right">
                {!opened ? (
                  <div className="ssh__gate ss__fade">
                    <Brain size={40} style={{ color: '#a855f7' }} />
                    <h2 className="ss__h2" style={{ marginTop: 8 }}>Read the message first</h2>
                    <p className="ssh__help" style={{ maxWidth: 360 }}>Open and read what just arrived on the phone. When you've taken it in, reveal the question.</p>
                    <button className="ss__btn" style={{ marginTop: 16 }} onClick={openQuestion}>I've read it — what do I do? <ArrowRight size={18} /></button>
                  </div>
                ) : (<>
                <div className="ssh__thought">
                  <div className="ssh__thought-label">
                    <Brain size={13} /> Internal thought
                    <button onClick={speakThought} title="Hear this thought" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fcd34d', cursor: 'pointer', display: 'inline-flex' }}>
                      <Volume2 size={14} />
                    </button>
                  </div>
                  <div className="ssh__thought-text">{s.thought}</div>
                </div>

                <div className="ss__choices" style={{ marginTop: 14 }}>
                  {s.choices.map((c) => {
                    const isChosen = chosen === c.key;
                    const cls = isChosen ? (c.verdict === 'win' ? 'is-win' : 'is-fail') : '';
                    return (
                      <button key={c.key} className={`ss__choice ${cls}`} onClick={() => pick(c)} disabled={solved || (isChosen && c.verdict === 'fail')}>
                        <span className="ss__key">{c.key}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {choice && (
                    <motion.div key={chosen + String(attempts)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`ss__outcome ss__outcome--${choice.verdict}`}>
                      <h4>
                        {choice.verdict === 'win'
                          ? <><CheckCircle2 size={18} style={{ color: '#22c55e' }} /> {attempts === 1 ? 'Shield earned' : 'Got there — close call'}</>
                          : <><XCircle size={18} style={{ color: '#ef4444' }} /> That one cost you</>}
                      </h4>
                      {choice.loss && <div className="ss__loss">🚨 {choice.loss}</div>}
                      <p>{choice.feedback}</p>
                      {choice.redFlags && <ul className="ss__redflags">{choice.redFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>}
                      {choice.verdict === 'win'
                        ? <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} onClick={next}>{idx + 1 >= scenarios.length ? 'Move to Act 3' : 'Next scenario'} <ArrowRight size={18} /></button>
                        : <button className="ss__btn ss__btn--ghost ss__btn--full" style={{ marginTop: 14 }} onClick={retry}><ShieldCheck size={16} /> Retry this one</button>}
                    </motion.div>
                  )}
                </AnimatePresence>
                </>)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
