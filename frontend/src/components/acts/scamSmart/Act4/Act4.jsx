/**
 * Scam Smart · Act 4 — The Challenge (Netlify shell).
 * Left act-sidebar + content column. Intro → 4 timed mini-games → boss level
 * (scam shown in an iPhone) → scoreboard + badge + the 5 rules. Each game
 * emits a graded activity_completed event (same pipeline as L1/L2); finishing
 * fires act_completed + lesson_completed.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw, Home, BarChart3, Trophy, Phone, Globe, Volume2,
  Link2, KeyRound, Lock, Video, AlertTriangle, ShieldCheck, LifeBuoy } from 'lucide-react';
import { act4 } from '../../../../data/lessons/scamSmart.js';
import { speak, cancelSpeech } from '../../../../utils/sounds.js';
import { useL3Analytics } from '../useL3Analytics.js';
import Sidebar from '../shell/Sidebar.jsx';
import BgFx3D from '../shell/BgFx3D.jsx';
import { useSoftMusic } from '../shell/useSoftMusic.js';
import { SpotLink, SpeedRound, WhatsWrong, MatchGame, BossLevel } from './Games.jsx';
import '../scamSmart.css';

const ORDER = ['intro', 'mg1', 'mg2', 'mg3', 'mg4', 'boss', 'result'];
const SCENE_OF = { mg1: 'sc-mg1', mg2: 'sc-mg2', mg3: 'sc-mg3', mg4: 'sc-mg4', boss: 'sc-boss', result: 'sc-scoreboard' };

function tierFor(points) {
  return act4.scoreboard.find((t) => points >= t.min) || act4.scoreboard[act4.scoreboard.length - 1];
}

export default function ScamSmartAct4({ onComplete, onGoHome }) {
  const analytics = useL3Analytics('act4');
  const navigate = useNavigate();
  const location = useLocation();
  const startedAt = useRef(Date.now());
  const lessonDoneRef = useRef(false);
  useSoftMusic('calm');

  const phaseFromScene = () => {
    const raw = new URLSearchParams(window.location.search).get('scene');
    if (raw === null) return null;
    const n = Number(raw);
    return ORDER[n] && n >= 0 && n < ORDER.length ? ORDER[n] : null;
  };
  const [phase, setPhase] = useState(() => {
    const fromScene = phaseFromScene();
    if (fromScene) return fromScene;
    if (import.meta.env.DEV) {
      const p = new URLSearchParams(window.location.search).get('phase');
      if (ORDER.includes(p)) return p;
    }
    return 'intro';
  });
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const p = phaseFromScene();
    if (p) setPhase(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => { analytics.actStarted(); window.scrollTo({ top: 0 }); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    const sid = SCENE_OF[phase];
    if (!sid) return undefined;
    analytics.sceneEntered(sid);
    return () => analytics.sceneCompleted(sid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const advance = () => {
    const i = ORDER.indexOf(phase);
    setPhase(ORDER[i + 1]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGame = (activityId, sceneId) => ({ points: p, correct, total }) => {
    setPoints((prev) => prev + p);
    analytics.activityCompleted(activityId, {
      sceneId, detail: { correct, total, accuracyPct: total ? Math.round((correct / total) * 100) : 0 },
    });
    if (phase === 'boss') reachResult(); else advance();
  };

  const reachResult = () => {
    setPhase('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!lessonDoneRef.current) {
      lessonDoneRef.current = true;
      analytics.actCompleted({ timeMs: Date.now() - startedAt.current });
      analytics.lessonCompleted({ totalTimeMs: Date.now() - startedAt.current });
      analytics.flush?.();
    }
  };

  return (
    <div className="ssh">
      <Sidebar
        current="act4"
        onHome={() => navigate('/lesson3')}
        onNavigate={(actId) => navigate(`/lesson3/${actId}`)}
        onNavigateScene={(actId, idx) => navigate(`/lesson3/${actId}?scene=${idx}`)}
      />

      <main className="ssh__main">
        <div className="ssh__col">
          <div className="ssh__eyebrow">Act 4 — The Challenge</div>

          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="ss__verdict" style={{ marginTop: 14 }}>
                <Trophy size={56} style={{ color: '#fbbf24' }} />
                <h1 className="ss__h1" style={{ marginTop: 10 }}>{act4.intro.title}</h1>
                <p className="ss__lead" style={{ marginTop: 8 }}>{act4.intro.sub}</p>
                <p className="ss__eyebrow" style={{ marginTop: 12 }}>{act4.intro.meta}</p>
                <button className="ss__btn" style={{ marginTop: 20 }} onClick={advance}>{act4.intro.cta} <ArrowRight size={18} /></button>
              </motion.div>
            )}
            {phase === 'mg1' && <motion.div key="mg1" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}><SpotLink data={act4.mg1} onDone={handleGame('a4-mg1', 'sc-mg1')} /></motion.div>}
            {phase === 'mg2' && <motion.div key="mg2" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}><SpeedRound data={act4.mg2} onDone={handleGame('a4-mg2', 'sc-mg2')} /></motion.div>}
            {phase === 'mg3' && <motion.div key="mg3" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}><WhatsWrong data={act4.mg3} onDone={handleGame('a4-mg3', 'sc-mg3')} /></motion.div>}
            {phase === 'mg4' && <motion.div key="mg4" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}><MatchGame data={act4.mg4} onDone={handleGame('a4-mg4', 'sc-mg4')} /></motion.div>}
            {phase === 'boss' && <motion.div key="boss" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}><BossLevel data={act4.boss} onDone={handleGame('a4-boss', 'sc-boss')} /></motion.div>}
            {phase === 'result' && <Result key="result" points={points} onGoHome={onGoHome} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const RULE_ICONS = { link: Link2, key: KeyRound, lock: Lock, video: Video, alert: AlertTriangle };

/* One flip card for a rule. Front = short hook; back = full rule + a voice
 * button that reads it aloud. Tap anywhere to flip. */
function RuleCard({ card, index }) {
  const [flipped, setFlipped] = useState(false);
  const Icon = RULE_ICONS[card.icon] || ShieldCheck;
  // Flipping to the back auto-reads the rule aloud; flipping back stops it.
  const toggle = () => {
    setFlipped((f) => {
      const next = !f;
      try { cancelSpeech(); if (next) speak(card.back, { who: 'shanaya' }); } catch { /* noop */ }
      return next;
    });
  };
  return (
    <motion.div
      className={`flipcard ${flipped ? 'is-flipped' : ''}`}
      initial={{ opacity: 0, y: 22, rotateX: -12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 120, damping: 16 }}
      onClick={toggle}
    >
      <div className="flipcard__inner">
        <div className="flipcard__face flipcard__front">
          <div className="flipcard__num">{index + 1}</div>
          <div className="flipcard__icon"><Icon size={26} /></div>
          <div className="flipcard__title">{card.front}</div>
          <div className="flipcard__hook">{card.hook}</div>
          <div className="flipcard__flip">Tap to flip ↻</div>
        </div>
        <div className="flipcard__face flipcard__back">
          <p className="flipcard__text">{card.back}</p>
          <span className="flipcard__playing"><Volume2 size={13} /> Reading aloud…</span>
        </div>
      </div>
    </motion.div>
  );
}

const PAGE_TX = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

function Result({ points, onGoHome }) {
  const tier = tierFor(points);
  const [page, setPage] = useState('verdict'); // verdict → rules → help → final
  useEffect(() => () => cancelSpeech(), []);

  // Read multi-digit numbers digit-by-digit (so 1930 → "one nine three zero").
  const spell = (s) => String(s).replace(/\d{2,}/g, (m) => m.split('').join(' '));
  const go = (p) => {
    cancelSpeech();
    setPage(p);
    // The final page reads its closing line aloud on arrival.
    if (p === 'final') setTimeout(() => { try { speak(act4.closer, { who: 'narrator' }); } catch { /* noop */ } }, 550);
  };
  const readHelp = () => {
    cancelSpeech();
    speak(`If it happens to you. ${act4.ifItHappens.join('. ')} If you need help, call the ${act4.helpline.label} on ${spell(act4.helpline.phone)}, or visit ${act4.helpline.site}.`, { who: 'narrator' });
  };

  return (
    <div className="ss__result">
      <AnimatePresence mode="wait">
        {/* ── 1. Verdict / scoreboard ── */}
        {page === 'verdict' && (
          <motion.div key="verdict" {...PAGE_TX}>
            <div className="ss__verdict" style={{ marginTop: 14 }}>
              <motion.div className="ss__verdict-badge" initial={{ scale: 0.3, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}>{tier.badge}</motion.div>
              <div className="ss__verdict-score">{points} <span style={{ fontSize: 18, opacity: 0.6 }}>pts</span></div>
              <div className="ss__shieldrow">{Array.from({ length: 5 }).map((_, i) => (
                <motion.span key={i} className={i < tier.shields ? 'is-on' : ''} initial={{ scale: 0, y: 8 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>🛡️</motion.span>
              ))}</div>
              <h2 className="ss__h2" style={{ marginTop: 6 }}>{tier.verdict}</h2>
              <p className="ss__lead" style={{ marginTop: 6 }}>{tier.sub}</p>
            </div>
            <button className="ss__btn ss__btn--full" style={{ marginTop: 20 }} onClick={() => go('rules')}>Lock in the 5 rules <ArrowRight size={18} /></button>
          </motion.div>
        )}

        {/* ── 2. The 5 rules — flip cards (one page) ── */}
        {page === 'rules' && (
          <motion.div key="rules" {...PAGE_TX}>
            <div className="ss__step-head">
              <span className="ss__step-tag"><ShieldCheck size={14} /> Step 1 of 2</span>
              <h2 className="ss__h2" style={{ margin: '8px 0 4px' }}>The 5 rules — lock these in</h2>
              <p className="ss__lead">Tap each card to flip it. Press <b>Hear it</b> to listen.</p>
            </div>
            <div className="flipgrid">
              {act4.ruleCards.map((c, i) => <RuleCard key={i} card={c} index={i} />)}
            </div>
            <div className="ss__nav">
              <button className="ss__btn ss__btn--ghost" onClick={() => go('verdict')}>← Back</button>
              <button className="ss__btn" onClick={() => go('help')}>Next: if it happens <ArrowRight size={18} /></button>
            </div>
          </motion.div>
        )}

        {/* ── 3. If it happens to you — full text + read aloud ── */}
        {page === 'help' && (
          <motion.div key="help" {...PAGE_TX}>
            <div className="ss__step-head">
              <span className="ss__step-tag ss__step-tag--sos"><LifeBuoy size={14} /> Step 2 of 2</span>
              <h2 className="ss__h2" style={{ margin: '8px 0 4px' }}>If it happens to you</h2>
              <p className="ss__lead">It can happen to anyone. Here is exactly what to do.</p>
              <button className="flipcard__voice" style={{ marginTop: 10 }} onClick={readHelp}><Volume2 size={15} /> Read this aloud</button>
            </div>
            <div className="ss__helpcard">
              {act4.ifItHappens.map((r, i) => (
                <motion.div key={i} className="ss__helpitem" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <span className="ss__helpnum">{i + 1}</span>
                  <span>{r}</span>
                </motion.div>
              ))}
              <div className="ss__helpline" style={{ marginTop: 16 }}>
                <span><Phone size={15} style={{ verticalAlign: -2 }} /> {act4.helpline.label}: <b>{act4.helpline.phone}</b></span>
                <span><Globe size={15} style={{ verticalAlign: -2 }} /> {act4.helpline.site}</span>
              </div>
            </div>
            <div className="ss__nav">
              <button className="ss__btn ss__btn--ghost" onClick={() => go('rules')}>← Back</button>
              <button className="ss__btn" onClick={() => go('final')}>Finish <ArrowRight size={18} /></button>
            </div>
          </motion.div>
        )}

        {/* ── 4. Final note + actions ── */}
        {page === 'final' && (
          <motion.div key="final" {...PAGE_TX}>
            <div className="ss__card" style={{ marginTop: 14, textAlign: 'center', background: 'rgba(0,0,0,.35)' }}>
              {act4.final.map((t, i) => (
                <motion.p key={i} className="ss__lead" style={{ marginBottom: 10 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>{t}</motion.p>
              ))}
              <motion.p className="ss__h2" style={{ marginTop: 8, background: 'linear-gradient(90deg,#22d3ee,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>{act4.closer}</motion.p>
            </div>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginTop: 18 }}>
              <Link to="/lesson3/act1" className="ss__btn ss__btn--ghost" style={{ textDecoration: 'none' }}><RotateCcw size={16} /> Play again</Link>
              <Link to="/lesson3/report" className="ss__btn" style={{ textDecoration: 'none' }}><BarChart3 size={16} /> My report</Link>
            </div>
            <button className="ss__btn ss__btn--ghost ss__btn--full" style={{ marginTop: 10 }} onClick={onGoHome}><Home size={16} /> Back to lesson home</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
