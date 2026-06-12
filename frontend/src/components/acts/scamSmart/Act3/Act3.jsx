/**
 * Scam Smart · Act 3 — The Patterns (Netlify shell).
 * Left act-sidebar + content column. Priya's intro → the 3 scam-pattern
 * cards one at a time → the "urgency" throughline. Comprehension-graded
 * (full marks once all three are seen).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { act3 } from '../../../../data/lessons/scamSmart.js';
import { useL3Analytics } from '../useL3Analytics.js';
import Sidebar from '../shell/Sidebar.jsx';
import BgFx3D from '../shell/BgFx3D.jsx';
import PhoneShell from '../shell/PhoneShell.jsx';
import WhatsAppChat from '../Act1/WhatsAppChat.jsx';
import { useSoftMusic } from '../shell/useSoftMusic.js';
import '../scamSmart.css';

// Act 3 opens back in the Squad Goals chat (12:14 AM) with Priya's recap.
const INTRO_CHAT = {
  group: { name: 'Squad Goals', emoji: '🔥', members: ['Aryan', 'Diya', 'Priya', 'Kabir', 'Meera'], time: '12:14 AM' },
  messages: act3.intro.map((m) => ({ from: 'Priya', avatar: '👩', side: 'out', text: m.text, typing: 1100 })),
};

const CARD_SCENES = ['sc-card-deepfake', 'sc-card-otp', 'sc-card-gaming'];

// ?scene → { phase, cardIdx }: 0 intro · 1-3 cards · 4 urgency.
function sceneToState3() {
  const raw = new URLSearchParams(window.location.search).get('scene');
  if (raw === null) return null;
  const n = Number(raw);
  if (n === 0) return { phase: 'intro', cardIdx: 0 };
  if (n >= 1 && n <= 3) return { phase: 'cards', cardIdx: n - 1 };
  if (n >= 4) return { phase: 'urgency', cardIdx: 0 };
  return null;
}

function ScamCard({ card }) {
  return (
    <div className="ss__card ss__fade">
      <div className="ss__card-icon">{card.icon}</div>
      <h3>{card.title}</h3>
      <div className="ss__card-tag">“{card.tagline}”</div>
      <div className="ss__card-sec"><h5>How the trick works</h5><p>{card.how}</p></div>
      <div className="ss__card-sec"><h5>The red flags</h5><ul className="ss__redflags">{card.redFlags.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
      <div className="ss__card-sec"><h5>Real example</h5><div className="ss__example">{card.example}</div></div>
      <div className="ss__card-sec"><h5>What you do</h5><ul className="ss__do">{card.doThis.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
    </div>
  );
}

export default function ScamSmartAct3({ onComplete, onGoHome }) {
  const analytics = useL3Analytics('act3');
  const navigate = useNavigate();
  const location = useLocation();
  const startedAt = useRef(Date.now());
  const gradedRef = useRef(false);
  useSoftMusic('calm');

  const [phase, setPhase] = useState(() => {
    const sc = sceneToState3();
    if (sc) return sc.phase;
    if (import.meta.env.DEV) {
      const p = new URLSearchParams(window.location.search).get('phase');
      if (p === 'cards' || p === 'urgency') return p;
    }
    return 'intro';
  });
  const [cardIdx, setCardIdx] = useState(() => sceneToState3()?.cardIdx ?? 0);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const sc = sceneToState3();
    if (sc) { setPhase(sc.phase); setCardIdx(sc.cardIdx); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const sceneId = useMemo(() => {
    if (phase === 'intro') return 'sc-cards-intro';
    if (phase === 'cards') return CARD_SCENES[cardIdx];
    return 'sc-urgency';
  }, [phase, cardIdx]);

  useEffect(() => { analytics.actStarted(); window.scrollTo({ top: 0 }); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    analytics.sceneEntered(sceneId);
    return () => analytics.sceneCompleted(sceneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  const nextCard = () => {
    if (cardIdx + 1 < act3.cards.length) {
      setCardIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (!gradedRef.current) {
        gradedRef.current = true;
        analytics.activityCompleted('a3-cards', { sceneId: 'sc-card-gaming', detail: { seen: act3.cards.length, total: act3.cards.length } });
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
    <div className="ssh">
      <BgFx3D />
      <Sidebar
        current="act3"
        onHome={() => navigate('/lesson3')}
        onNavigate={(actId) => navigate(`/lesson3/${actId}`)}
        onNavigateScene={(actId, idx) => navigate(`/lesson3/${actId}?scene=${idx}`)}
      />

      <main className="ssh__main">
        <div className="ssh__col">
          <div className="ssh__eyebrow">Act 3 — The Patterns</div>

          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="ssh__eyebrow">Back to the group chat · 12:14 AM</div>
                <div className="ssh__scenetitle">Priya breaks it down</div>
                <PhoneShell screenClass="ssh__screen--chat" time="12:14 AM">
                  <WhatsAppChat chat={INTRO_CHAT} soundOn onDone={() => setIntroDone(true)} />
                </PhoneShell>
                {introDone && (
                  <button className="ss__btn ss__btn--full" style={{ marginTop: 16 }} onClick={() => { setPhase('cards'); window.scrollTo({ top: 0 }); }}>
                    Show me the patterns <ArrowRight size={18} />
                  </button>
                )}
              </motion.div>
            )}

            {phase === 'cards' && (
              <motion.div key={`card-${cardIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <div className="ssh__scenetitle">Pattern {cardIdx + 1} / {act3.cards.length}</div>
                <div style={{ marginTop: 14 }}><ScamCard card={card} /></div>
                <button className="ss__btn ss__btn--full" style={{ marginTop: 16 }} onClick={nextCard}>
                  {cardIdx + 1 < act3.cards.length ? 'Next pattern' : 'One thing ties it all together'} <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {phase === 'urgency' && (
              <motion.div key="urgency" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="ssh__scenetitle">The one thing underneath all of it</div>
                <div className="ss__card" style={{ marginTop: 14, borderColor: 'rgba(245,158,11,.4)', background: 'rgba(245,158,11,.06)' }}>
                  <Zap size={40} style={{ color: '#f59e0b' }} />
                  {act3.urgency.lines.map((l, i) => (
                    <p key={i} className={i === 1 ? 'ss__h2' : ''} style={{ marginTop: i === 1 ? 6 : 12, color: i === 1 ? '#fbbf24' : undefined }}>{l}</p>
                  ))}
                </div>
                <button className="ss__btn ss__btn--full" style={{ marginTop: 16 }} onClick={finish}>{act3.urgency.cta} <ArrowRight size={18} /></button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
