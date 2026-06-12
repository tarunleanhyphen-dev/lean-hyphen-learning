/**
 * Scam Smart · Act 3 — The Patterns (narrator + split-screen).
 * Priya walks the learner through the 3 scam patterns. Each card is a
 * split-screen: left a phone showing that scam in the wild, right Priya
 * explaining how it works (streamed) then the red flags + what to do.
 * Closes on the "urgency" throughline. Comprehension-graded (all 3 seen).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { act3 } from '../../../../data/lessons/scamSmart.js';
import { useL3Analytics } from '../useL3Analytics.js';
import { TopBar } from '../parts.jsx';
import BgFx from '../BgFx.jsx';
import PhoneStage from '../Act2/PhoneStage.jsx';
import Narrator from '../Act2/Narrator.jsx';
import CardScreen from './CardScreens.jsx';
import '../scamSmart.css';

const CARD_SCENES = ['sc-card-deepfake', 'sc-card-otp', 'sc-card-gaming'];

export default function ScamSmartAct3({ onComplete, onGoHome }) {
  const analytics = useL3Analytics('act3');
  const startedAt = useRef(Date.now());
  const gradedRef = useRef(false);

  const [phase, setPhase] = useState(() => {
    if (import.meta.env.DEV) {
      const p = new URLSearchParams(window.location.search).get('phase');
      if (p === 'cards' || p === 'urgency') return p;
    }
    return 'intro';
  }); // intro | cards | urgency
  const [introDone, setIntroDone] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [cardNarrDone, setCardNarrDone] = useState(false);

  const sceneId = useMemo(() => {
    if (phase === 'intro') return 'sc-cards-intro';
    if (phase === 'cards') return CARD_SCENES[cardIdx];
    return 'sc-urgency';
  }, [phase, cardIdx]);

  useEffect(() => {
    analytics.actStarted();
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    analytics.sceneEntered(sceneId);
    return () => analytics.sceneCompleted(sceneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  const introText = act3.intro.map((m) => m.text).join(' ');

  const nextCard = () => {
    if (cardIdx + 1 < act3.cards.length) {
      setCardIdx((i) => i + 1);
      setCardNarrDone(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (!gradedRef.current) {
        gradedRef.current = true;
        analytics.activityCompleted('a3-cards', {
          sceneId: 'sc-card-gaming',
          detail: { seen: act3.cards.length, total: act3.cards.length },
        });
      }
      setPhase('urgency');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const finish = () => {
    analytics.actCompleted({ timeMs: Date.now() - startedAt.current });
    analytics.flush?.();
    onComplete?.();
  };

  const card = act3.cards[cardIdx];

  return (
    <div className="ss">
      <BgFx />
      <div className="ss__shell ss__shell--wide" style={{ position: 'relative', zIndex: 1 }}>
        <TopBar
          onGoHome={onGoHome}
          eyebrow="Scam Smart · Act 3 — The Patterns"
          step={phase === 'intro' ? 0 : phase === 'cards' ? cardIdx + 1 : 4}
          total={5}
        />

        <AnimatePresence mode="wait">
          {/* ── Intro — Priya speaks ── */}
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
              <Narrator text={introText} streamKey="intro" onDone={() => setIntroDone(true)} />
              {introDone && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="ss__btn ss__btn--full" style={{ marginTop: 18 }}
                  onClick={() => { setPhase('cards'); setCardNarrDone(false); window.scrollTo({ top: 0 }); }}
                >
                  Show me the patterns <ArrowRight size={18} />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── Cards — split-screen ── */}
          {phase === 'cards' && (
            <motion.div key={`card-${cardIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <p className="ss__eyebrow" style={{ marginBottom: 12 }}>Pattern {cardIdx + 1} of {act3.cards.length}</p>
              <div className="ss__split">
                <PhoneStage><CardScreen card={card} /></PhoneStage>

                <div>
                  <h2 className="ss__h2" style={{ marginBottom: 6 }}><span style={{ fontSize: 28, marginRight: 6 }}>{card.icon}</span>{card.title}</h2>
                  <div className="ss__card-tag" style={{ marginBottom: 14 }}>“{card.tagline}”</div>

                  <Narrator name="Priya" role="Breaking down the pattern" text={card.how} streamKey={`c${cardIdx}`} onDone={() => setCardNarrDone(true)} />

                  <AnimatePresence>
                    {cardNarrDone && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="ss__card-sec">
                          <h5>The red flags</h5>
                          <ul className="ss__redflags">{card.redFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>
                        </div>
                        <div className="ss__card-sec">
                          <h5>What you do</h5>
                          <ul className="ss__do">{card.doThis.map((d, i) => <li key={i}>{d}</li>)}</ul>
                        </div>
                        <button className="ss__btn ss__btn--full" style={{ marginTop: 16 }} onClick={nextCard}>
                          {cardIdx + 1 < act3.cards.length ? 'Next pattern' : 'One thing ties it all together'} <ArrowRight size={18} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Urgency throughline ── */}
          {phase === 'urgency' && (
            <motion.div key="urgency" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="ss__card" style={{ borderColor: 'rgba(245,158,11,.4)', background: 'rgba(245,158,11,.06)' }}>
                <Zap size={40} style={{ color: '#f59e0b' }} />
                <h3 style={{ marginTop: 8 }}>The one thing underneath all of it</h3>
                {act3.urgency.lines.map((l, i) => (
                  <p key={i} className={i === 1 ? 'ss__h2' : ''} style={{ marginTop: i === 1 ? 6 : 12, color: i === 1 ? '#fbbf24' : undefined }}>{l}</p>
                ))}
              </div>

              <div style={{ marginTop: 18 }}>
                <Narrator name="Priya" role="The takeaway" text={act3.urgency.outro.map((m) => m.text).join('  ')} streamKey="urgency" />
              </div>

              <button className="ss__btn ss__btn--full" style={{ marginTop: 18 }} onClick={finish}>
                {act3.urgency.cta} <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
