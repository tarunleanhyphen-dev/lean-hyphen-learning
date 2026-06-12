/**
 * Scam Smart · Act 2 — The Scenarios (split-screen).
 * Left: a glossy 3D phone showing the scam (a full fake YouTube channel, a
 * DM, an OTP, …). Right: Priya narrates the moment — her line streams in —
 * then the choices appear. A correct FIRST call earns a Shield; getting it
 * wrong then right is a "close call". Same analytics pipeline as L1/L2.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { scenarios } from '../../../../data/lessons/scamSmart.js';
import { useL3Analytics } from '../useL3Analytics.js';
import { TopBar, Shields } from '../parts.jsx';
import BgFx from '../BgFx.jsx';
import PhoneStage from './PhoneStage.jsx';
import ScamScreen from './ScamScreens.jsx';
import Narrator from './Narrator.jsx';
import { speak, cancelSpeech } from '../../../../utils/sounds.js';
import '../scamSmart.css';

export default function ScamSmartAct2({ onComplete, onGoHome }) {
  const analytics = useL3Analytics('act2');
  const startedAt = useRef(Date.now());

  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [shields, setShields] = useState(0);
  const [closeCalls, setCloseCalls] = useState(0);
  const [narrDone, setNarrDone] = useState(false);

  const s = scenarios[idx];
  const choice = chosen ? s.choices.find((c) => c.key === chosen) : null;
  const solved = choice?.verdict === 'win';

  useEffect(() => {
    analytics.actStarted();
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    analytics.sceneEntered(s.sceneId);
    return () => analytics.sceneCompleted(s.sceneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Scenario 1's fake "celebrity" giveaway is voiced by a deliberately
  // synthetic TTS (lower pitch) — never a real person's cloned voice.
  const speakGiveaway = () => {
    try { speak(s.body?.caption || s.narrate, { rate: 1.0, pitch: 0.85 }); } catch { /* noop */ }
  };
  useEffect(() => {
    if (s.app === 'youtube' && s.body?.caption) speakGiveaway();
    return () => { try { cancelSpeech(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

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
    setNarrDone(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="ss">
      <BgFx />
      <div className="ss__shell ss__shell--wide" style={{ position: 'relative', zIndex: 1 }}>
        <TopBar onGoHome={onGoHome} eyebrow={`Scam Smart · Act 2 — Scenario ${s.n} / ${scenarios.length}`} step={idx} total={scenarios.length} />

        <Shields count={shields} max={scenarios.length} />
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', margin: '6px 2px 16px' }}>
          ⚠️ Close calls: <b>{closeCalls}</b> · Each right call on the first try earns a shield.
        </p>

        <div className="ss__split">
          {/* LEFT — 3D phone showing the scam */}
          <AnimatePresence mode="wait">
            <motion.div key={`stage-${idx}`} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
              <PhoneStage><ScamScreen scenario={s} onSpeak={speakGiveaway} /></PhoneStage>
            </motion.div>
          </AnimatePresence>

          {/* RIGHT — narrator + thought + choices */}
          <AnimatePresence mode="wait">
            <motion.div key={`panel-${idx}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.3 }}>
              <h2 className="ss__h2" style={{ marginBottom: 14 }}>{s.title}</h2>

              <Narrator text={s.narrate} streamKey={idx} onDone={() => setNarrDone(true)} />

              <AnimatePresence>
                {narrDone && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="ss__thought" style={{ marginTop: 14 }}>{s.thought}</p>

                    <div className="ss__choices">
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
                  </motion.div>
                )}
              </AnimatePresence>

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
                      ? <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} onClick={next}>{idx + 1 >= scenarios.length ? 'See what you survived' : 'Next scenario'} <ArrowRight size={18} /></button>
                      : <button className="ss__btn ss__btn--ghost ss__btn--full" style={{ marginTop: 14 }} onClick={retry}><ShieldCheck size={16} /> Retry this one</button>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
