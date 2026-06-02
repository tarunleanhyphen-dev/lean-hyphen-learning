/**
 * Six screens of Act 1 — rebuilt for top-tier UX.
 *
 * Design language:
 *   - The StyleCoach (top-left) carries all narration. Each screen passes
 *     its own narration lines + an onDone that advances the flow.
 *   - The interactive surface sits center-bottom with generous whitespace,
 *     big bold typography, and springy micro-interactions.
 *   - The 3D room is always in the background; we never leave it.
 *   - No wall-of-text panels. Narration is conversational; UI is decisive.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronRight, Check, Sparkles, AlertTriangle, Gift, Zap, Hammer } from 'lucide-react';
import {
  lesson, sortItems, catalogue, surpriseEvents,
} from '../../../../data/lessons/whereDoesMyMoneyGo.js';
import { StyleCoach } from './StyleCoach.jsx';
import { Room3D, VIBES } from './Room3D.jsx';
import { VibeMini } from './VibeMini.jsx';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { sounds, speak, cancelSpeech, isAudioReady } from '../../../../utils/sounds.js';

/* Tiny safe-call wrapper so a missing/muted audio context never throws. */
function sfx(name) { try { sounds[name]?.(); } catch { /* noop */ } }
function say(text) { try { if (isAudioReady()) speak(text, { voice: 'narrator', who: 'narrator' }); } catch { /* noop */ } }

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function scene(id) { return lesson.acts.act1.scenes.find((s) => s.id === id); }

/* ============================================================
 * SCREEN 1 — Cinematic split-screen intro.
 *
 * Left half  : the 3D bedroom transforms from empty to fully dressed as
 *              items spawn in on a staggered timeline.
 * Right half : a beat-sequenced rail that scrolls through five moments —
 *              big-news narration, animated ₹50,000 budget reveal, mini
 *              trade-off demo, mystery envelope, and a premium "Let's Go"
 *              CTA. Clicking the CTA pops the vibe picker modal.
 *
 * Beats auto-advance on a timer (with a Skip Intro button on the panel
 * for impatient learners). Items spawn in the 3D room independently.
 * ============================================================ */
const SCENE1_PREVIEW_ITEMS = [
  { id: 'bed-budget',      delay: 600 },
  { id: 'wardrobe-budget', delay: 1200 },
  { id: 'study-desk',      delay: 1800 },
  { id: 'basic-chair',     delay: 2300 },
  { id: 'curtains',        delay: 2900 },
  { id: 'desk-lamp',       delay: 3400 },
  { id: 'posters',         delay: 3900 },
  { id: 'bookshelf',       delay: 4400 },
  { id: 'led-strips',      delay: 5000 },
];

const SCENE1_BEATS = [
  {
    id: 'big-news',
    durationMs: 6500,
    lines: [
      "Your parents just gave you some big news.",
      "They're renovating the house — and YOUR room is getting a complete makeover.",
    ],
    visual: null,
  },
  {
    id: 'budget',
    durationMs: 5500,
    lines: [
      "The budget? ₹50,000.",
      "All yours. One time. No top-ups.",
    ],
    visual: 'budget',
  },
  {
    id: 'tradeoff',
    durationMs: 7000,
    lines: [
      "But here's the catch — you have to plan every single rupee.",
      "Spend too much on one thing and you won't have enough for something else.",
    ],
    visual: 'tradeoff',
  },
  {
    id: 'envelope',
    durationMs: 4500,
    lines: [
      "And life has a few surprises waiting for you too.",
    ],
    visual: 'envelope',
  },
  {
    id: 'cta',
    durationMs: null,            // last beat — wait for click
    lines: [
      "Ready to design your dream bedroom — on a budget?",
    ],
    visual: 'cta',
  },
];

export function Screen1Intro({ mk }) {
  const [beatIdx, setBeatIdx] = useState(0);
  const [previewIds, setPreviewIds] = useState([]);
  const beat = SCENE1_BEATS[beatIdx];

  /* Auto-advance through beats. Last beat has duration=null so it holds. */
  useEffect(() => {
    if (!beat?.durationMs) return undefined;
    const t = setTimeout(() => setBeatIdx((i) => Math.min(SCENE1_BEATS.length - 1, i + 1)), beat.durationMs);
    return () => clearTimeout(t);
  }, [beatIdx, beat]);

  /* TTS — speak each beat's narration lines as they appear.
     Cancels any pending speech on beat change / unmount so lines never overlap. */
  useEffect(() => {
    if (!beat?.lines?.length) return undefined;
    cancelSpeech();
    beat.lines.forEach((line, i) => {
      const delay = i * 950; // matches typewriter line stagger
      setTimeout(() => say(line), delay);
    });
    return () => cancelSpeech();
  }, [beatIdx, beat]);

  /* Cancel any speech on full unmount (leaving Scene 1). */
  useEffect(() => () => cancelSpeech(), []);

  /* Stagger furniture into the room as the intro plays. */
  useEffect(() => {
    const timers = SCENE1_PREVIEW_ITEMS.map((it) =>
      setTimeout(() => {
        setPreviewIds((ids) => (ids.includes(it.id) ? ids : [...ids, it.id]));
        sfx('tap');
      }, it.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  function skipIntro() {
    sfx('click');
    setBeatIdx(SCENE1_BEATS.length - 1);
    setPreviewIds(SCENE1_PREVIEW_ITEMS.map((it) => it.id));
  }

  function goToVibeScreen() {
    sfx('reveal');
    cancelSpeech();
    mk.setScreen('screen-2-vibe');
  }

  return (
    <div className="scene1">
      {/* LEFT — cinematic 3D room */}
      <div className="scene1__room">
        <Room3D
          vibeId="cosy"
          purchasedIds={previewIds}
          shot="hero"
          orbit
          showCharacter
        />
        <div className="scene1__room-grad" aria-hidden />
        {/* Floating items-counter overlay */}
        <motion.div
          className="scene1__roomchip"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 22 }}
        >
          <span className="scene1__roomchip-dot" />
          {previewIds.length} item{previewIds.length === 1 ? '' : 's'} placed
        </motion.div>
      </div>

      {/* RIGHT — narration + visual rail */}
      <div className="scene1__panel">
        <div className="scene1__head">
          <div className="scene1__eyebrow">Lesson 2 · Act 1</div>
          <button className="scene1__skip" onClick={skipIntro} aria-label="Skip intro">
            Skip intro <ChevronRight size={12} />
          </button>
        </div>
        <h1 className="scene1__title">
          <span className="scene1__title-gradient">Dream Bedroom</span>
          <span className="scene1__title-plain">Makeover</span>
        </h1>

        {/* Beat dots */}
        <div className="scene1__beats">
          {SCENE1_BEATS.map((b, i) => (
            <button
              key={b.id}
              className={`scene1__beat ${i === beatIdx ? 'is-active' : ''} ${i < beatIdx ? 'is-done' : ''}`}
              onClick={() => setBeatIdx(i)}
              aria-label={`Go to beat ${i + 1}`}
            />
          ))}
        </div>

        {/* Narration block */}
        <div className="scene1__narr">
          <AnimatePresence mode="wait">
            <motion.div
              key={beat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32 }}
            >
              {beat.lines.map((line, i) => (
                <Typewriter key={i} text={line} delayMs={i * 950} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Visual rail — morphs per beat */}
        <div className="scene1__visual">
          <AnimatePresence mode="wait">
            {beat.visual === 'budget'   && <BudgetReveal key="b" />}
            {beat.visual === 'tradeoff' && <TradeoffDemo key="t" />}
            {beat.visual === 'envelope' && <SecretEnvelope key="e" />}
            {beat.visual === 'cta'      && <LetsGoCTA key="c" onClick={goToVibeScreen} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* -------- Scene 1 sub-components -------- */

function Typewriter({ text, delayMs = 0, speedMs = 22 }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    setShown('');
    const startTimer = setTimeout(() => {
      const iv = setInterval(() => {
        i += 2;
        if (i >= text.length) { setShown(text); clearInterval(iv); }
        else setShown(text.slice(0, i));
      }, speedMs);
    }, delayMs);
    return () => clearTimeout(startTimer);
  }, [text, delayMs, speedMs]);
  return <p className="scene1__line">{shown}</p>;
}

function BudgetReveal() {
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => '₹' + Math.round(n).toLocaleString('en-IN'));
  useEffect(() => {
    const c = animate(v, 50000, { duration: 1.7, ease: [0.16, 1, 0.3, 1] });
    setTimeout(() => sfx('reveal'), 100);
    return () => c.stop();
  }, []);
  return (
    <motion.div
      className="budgetreveal"
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -16 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="budgetreveal__halo" aria-hidden />
      <div className="budgetreveal__label">Your budget</div>
      <motion.div className="budgetreveal__num">{text}</motion.div>
      <div className="budgetreveal__sub">All yours · One time · No top-ups</div>
    </motion.div>
  );
}

function TradeoffDemo() {
  const [stage, setStage] = useState(0);
  // Animated budget value
  const budget = useMotionValue(50000);
  const budgetText = useTransform(budget, (n) => '₹' + Math.round(n).toLocaleString('en-IN'));

  useEffect(() => {
    const timers = [
      setTimeout(() => { setStage(1); sfx('tap'); }, 600),
      setTimeout(() => { setStage(2); sfx('add'); animate(budget, 28000, { duration: 1.2 }); }, 1800),
      setTimeout(() => { setStage(3); sfx('alert'); }, 3300),
    ];
    return () => timers.forEach(clearTimeout);
  }, [budget]);

  const items = [
    { id: 'bed-pre', name: 'Premium Bed', price: 22000, icon: '🛏️', highlighted: stage >= 1, picked: stage >= 2 },
    { id: 'desk',    name: 'Study Desk',  price:  7500, icon: '🗄️', faded: stage >= 3 },
    { id: 'lamp',    name: 'Desk Lamp',   price:   800, icon: '💡', faded: stage >= 3 },
    { id: 'speaker', name: 'Speaker',     price:  2500, icon: '🔊', faded: stage >= 3 },
  ];

  return (
    <motion.div
      className="tradeoff"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="tradeoff__label">Spending preview</div>
      <div className="tradeoff__items">
        {items.map((it) => (
          <motion.div
            key={it.id}
            className={`tradeoffitem ${it.highlighted ? 'is-highlighted' : ''} ${it.picked ? 'is-picked' : ''} ${it.faded ? 'is-faded' : ''}`}
            animate={it.faded ? { x: [0, -4, 4, -2, 2, 0] } : {}}
            transition={{ duration: 0.35 }}
          >
            <div className="tradeoffitem__emoji">{it.icon}</div>
            <div className="tradeoffitem__name">{it.name}</div>
            <div className="tradeoffitem__price">₹{it.price.toLocaleString('en-IN')}</div>
            {it.picked && <div className="tradeoffitem__badge">✓ picked</div>}
            {it.faded && <div className="tradeoffitem__x">✕</div>}
          </motion.div>
        ))}
      </div>
      <div className="tradeoff__budgetbar">
        <div className="tradeoff__budgetbar-label">Remaining</div>
        <motion.div className="tradeoff__budgetbar-val">{budgetText}</motion.div>
        <div className="tradeoff__budgetbar-track">
          <motion.div
            className="tradeoff__budgetbar-fill"
            initial={{ width: '100%' }}
            animate={{ width: stage >= 2 ? '56%' : '100%' }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function SecretEnvelope() {
  return (
    <motion.div
      className="envelopeshow"
      initial={{ opacity: 0, scale: 0.85, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -24 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <motion.div
        className="envelopeshow__halo"
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="envelopeshow__icon"
        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
      >
        ✉️
        <div className="envelopeshow__seal">★</div>
      </motion.div>
      <div className="envelopeshow__label">a surprise is waiting…</div>
      <div className="envelopeshow__sparks" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.span
            key={i}
            className="envelopeshow__spark"
            style={{ left: `${15 + i * 14}%` }}
            animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2.2, delay: i * 0.18, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function LetsGoCTA({ onClick }) {
  return (
    <motion.div
      className="letsgo"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <motion.button
        className="letsgo__btn"
        onClick={onClick}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label="Start designing your dream bedroom"
      >
        <span className="letsgo__pulse" aria-hidden />
        <span className="letsgo__label">Let's Go</span>
        <motion.span
          className="letsgo__arrow"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >→</motion.span>
      </motion.button>
      <div className="letsgo__hint">click to pick your style</div>
    </motion.div>
  );
}

/* ============================================================
 * SCREEN 2 — Pick Your Room Vibe
 *
 * Premium customization screen. 4 large cards, each with its own
 * live 3D mini-room preview (rendered via drei <View> on a single
 * shared Canvas so we only spin up one WebGL context).
 *
 * Flow:
 *   1. Cards float in, narrator asks "what's your style?"
 *   2. Hover a card → that preview rotates faster + glows
 *   3. Tap a card → it expands, locks in, others fade
 *   4. Confirmation banner slides in: "Nice choice! …"
 *   5. Continue button → screen-2-rules
 * ============================================================ */
export function Screen2Vibe({ mk }) {
  const s = scene('screen-2-vibe');
  const vibes = s?.vibes || scene('screen-1-intro').vibes;
  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const [hovered, setHovered] = useState(null);
  const [picked, setPicked] = useState(mk.state.vibe || null);
  const [confirmed, setConfirmed] = useState(false);

  /* Narrate the intro line once on mount. */
  useEffect(() => {
    say(s.intro);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePick(v) {
    if (confirmed) return;
    sfx('ding');
    setPicked(v.id);
    mk.pickVibe(v.id);
    setTimeout(() => {
      sfx('aha');
      say(s.confirmation);
      setConfirmed(true);
    }, 700);
  }

  function handleContinue() {
    sfx('reveal');
    cancelSpeech();
    mk.setScreen('screen-2-rules');
  }

  return (
    <div className="vibescreen" ref={containerRef}>
      <div className="vibescreen__head">
        <div className="vibescreen__eyebrow">Scene 2 · Pick your style</div>
        <h1 className="vibescreen__title">{s.intro}</h1>
        <p className="vibescreen__sub">
          Just a vibe — your budget, your trade-offs, and the surprises will be the same no matter what you pick.
        </p>
      </div>

      <div className="vibegrid">
        {vibes.map((v, i) => {
          const isPicked = picked === v.id;
          const isOther = picked && !isPicked;
          return (
            <motion.button
              key={v.id}
              ref={(el) => { if (el) cardRefs.current[v.id] = el; }}
              className={`vibecard-big ${isPicked ? 'is-picked' : ''} ${isOther ? 'is-other' : ''} vibecard-big--${v.id}`}
              style={{ '--vibe-accent': v.accent }}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: isOther ? 0.45 : 1, y: 0, scale: isPicked ? 1.03 : 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 24 }}
              whileHover={!confirmed ? { y: -6 } : {}}
              whileTap={!confirmed ? { scale: 0.98 } : {}}
              onMouseEnter={() => setHovered(v.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handlePick(v)}
              disabled={confirmed}
            >
              <div className="vibecard-big__halo" aria-hidden />
              <div className="vibecard-big__preview">
                {/* drei View tracks this ref's bounding rect.
                    The shared Canvas at the bottom of this component renders into it. */}
                <View
                  className="vibecard-big__view"
                  track={{ current: cardRefs.current[`${v.id}-preview`] }}
                />
                <div
                  className="vibecard-big__preview-anchor"
                  ref={(el) => { if (el) cardRefs.current[`${v.id}-preview`] = el; }}
                />
              </div>
              <div className="vibecard-big__head">
                <span className="vibecard-big__emoji">{v.emoji}</span>
                <span className="vibecard-big__label">{v.label}</span>
              </div>
              <div className="vibecard-big__tagline">{v.tagline}</div>
              <div className="vibecard-big__sub">{v.sub}</div>
              {isPicked && (
                <motion.div
                  className="vibecard-big__pickedchip"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Check size={12} /> Locked in
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Shared Canvas — one WebGL context renders all 4 mini scenes via Views. */}
      <Canvas
        className="vibescreen__sharedcanvas"
        eventSource={containerRef}
        dpr={[1, 1.6]}
        gl={{ antialias: true }}
      >
        <View.Port />
        {vibes.map((v) => (
          <View key={v.id} track={{ current: cardRefs.current[`${v.id}-preview`] }}>
            <VibeMini vibeId={v.id} hovered={hovered === v.id} selected={picked === v.id} />
          </View>
        ))}
      </Canvas>

      <AnimatePresence>
        {confirmed && (
          <motion.div
            className="vibeconfirm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <div className="vibeconfirm__icon">✨</div>
            <div className="vibeconfirm__body">
              <div className="vibeconfirm__title">{s.confirmation}</div>
            </div>
            <motion.button
              className="vibeconfirm__cta"
              onClick={handleContinue}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {s.cta} <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
 * SCREEN 2 — Rules (now Scene 3 in the user-facing flow)
 * Stagger rule cards; CTA appears after the last one lands.
 * ============================================================ */
export function Screen2Rules({ mk }) {
  const s = scene('screen-2-rules');
  return (
    <>
      <StyleCoach
        lines={[s.intro, s.outro]}
        name="Maya"
        vibeId={mk.state.vibe}
      />
      <motion.div
        className="stage stage--bottom"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <div className="stage__eyebrow">Step 2 of 6 · Ground rules</div>
        <div className="rules">
          {s.rules.map((r, i) => (
            <motion.div
              key={i}
              className="rule"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <div className="rule__icon">{r.icon}</div>
              <div className="rule__text">{r.text}</div>
            </motion.div>
          ))}
        </div>
        <motion.button
          className="cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => { sfx('click'); mk.setScreen('screen-3-sort'); }}
        >
          {s.cta} <ChevronRight size={16} />
        </motion.button>
      </motion.div>
    </>
  );
}

/* ============================================================
 * SCREEN 3 — Sort: drag into NEED / WANT bucket
 * ============================================================ */
export function Screen3Sort({ mk }) {
  const s = scene('screen-3-sort');
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [throwDir, setThrowDir] = useState(null); // 'need' | 'want' | null
  const item = sortItems[idx];
  const isDone = idx >= sortItems.length;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-14, 14]);
  const needHi = useTransform(x, [-260, -60, 0], [1, 0.4, 0]);
  const wantHi = useTransform(x, [0, 60, 260], [0, 0.4, 1]);

  function commit(choice) {
    if (feedback) return;
    sfx(choice === item.correct ? 'ding' : 'tap');
    mk.setSortAnswer(item.id, choice);
    setThrowDir(choice);
    setFeedback({ choice, text: item.feedback[choice], isGrey: item.isGreyArea });
    setTimeout(() => {
      setFeedback(null);
      setThrowDir(null);
      x.set(0);
      setIdx((i) => i + 1);
    }, 2000);
  }

  function handleDragEnd(_, info) {
    const dx = info.offset.x + info.velocity.x * 0.2;
    if (dx < -120) return commit('need');
    if (dx >  120) return commit('want');
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
  }

  if (isDone) {
    const answers = mk.state.sortAnswers;
    const needsValue = sortItems.reduce((s, it) => s + (answers[it.id] === 'need' ? it.price : 0), 0);
    const wantsValue = sortItems.reduce((s, it) => s + (answers[it.id] === 'want' ? it.price : 0), 0);
    return (
      <>
        <StyleCoach
          lines={[s.summaryHeading, s.summaryOutro]}
          name="Maya"
          vibeId={mk.state.vibe}
        />
        <motion.div className="stage stage--bottom" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stage__eyebrow">Sort complete</div>
          <div className="sort-summary">
            <SortSummaryRow label="Needs"  value={needsValue} color="#10B981" />
            <SortSummaryRow label="Wants"  value={wantsValue} color="#8B5CF6" />
          </div>
          <button className="cta" onClick={() => { sfx('aha'); mk.setScreen('screen-4-shop'); }}>
            {s.cta} <ChevronRight size={16} />
          </button>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <StyleCoach
        lines={[s.intro]}
        name="Maya"
        vibeId={mk.state.vibe}
        autoAdvance
      />
      <div className="sort-arena">
        <div className="sort-arena__buckets">
          <motion.div className="bucket bucket--need" style={{ opacity: useTransform(needHi, [0, 1], [0.6, 1]) }}>
            <div className="bucket__chip">⬅️ NEED</div>
            <div className="bucket__hint">drag left for Need</div>
          </motion.div>
          <motion.div className="bucket bucket--want" style={{ opacity: useTransform(wantHi, [0, 1], [0.6, 1]) }}>
            <div className="bucket__chip">WANT ➡️</div>
            <div className="bucket__hint">drag right for Want</div>
          </motion.div>
        </div>

        <div className="sort-arena__center">
          <div className="sort-counter">{idx + 1} / {sortItems.length}</div>
          {/* Draggable card holds only visual content — buttons sit below
              as siblings so framer-motion drag never swallows their clicks. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              className="sortcard"
              drag={feedback ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              style={{ x, rotate }}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={throwDir
                ? { x: throwDir === 'need' ? -700 : 700, opacity: 0, rotate: throwDir === 'need' ? -25 : 25, transition: { duration: 0.5 } }
                : { opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <div className="sortcard__emoji">{item.icon}</div>
              <div className="sortcard__name">{item.name}</div>
              <div className="sortcard__price">{fmt(item.price)}</div>
              {item.isGreyArea && <div className="sortcard__grey">grey area · choose your reasoning</div>}
              <div className="sortcard__hint">drag left / right · or use the buttons below</div>
            </motion.div>
          </AnimatePresence>
          <div className="sortcard__tap">
            <button
              type="button"
              className="tapbtn tapbtn--need"
              onClick={() => commit('need')}
              disabled={!!feedback}
            >
              <Check size={16} /> NEED
            </button>
            <button
              type="button"
              className="tapbtn tapbtn--want"
              onClick={() => commit('want')}
              disabled={!!feedback}
            >
              <Sparkles size={16} /> WANT
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            className={`toast ${feedback.isGrey ? 'toast--grey' : feedback.choice === item?.correct ? 'toast--good' : 'toast--info'}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SortSummaryRow({ label, value, color }) {
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => fmt(n));
  useEffect(() => {
    const c = animate(v, value, { duration: 0.8, ease: 'easeOut' });
    return () => c.stop();
  }, [value]);
  return (
    <div className="sort-summary__row">
      <span className="sort-summary__chip" style={{ background: color }}>{label}</span>
      <motion.strong>{text}</motion.strong>
    </div>
  );
}

/* ============================================================
 * SCREEN 4 — Shop
 * ============================================================ */
export function Screen4Shop({ mk }) {
  const s = scene('screen-4-shop');
  const [oppCost, setOppCost] = useState(null);
  const { state, spent, budget, needsCount, toggleItem, cartItems } = mk;

  const overBudget  = spent > budget.spendable;
  const enoughNeeds = needsCount >= s.gates.minNeeds;
  const canCheckout = !overBudget && enoughNeeds && cartItems.length > 0;

  function handleAdd(item) {
    const matchedOC = s.opportunityCosts.find((oc) => oc.when.added === item.id);
    if (matchedOC && !state.cart.includes(item.id)) {
      sfx('alert');
      setOppCost({ message: matchedOC.message, itemId: item.id });
      return;
    }
    sfx(state.cart.includes(item.id) ? 'tap' : 'add');
    toggleItem(item.id);
  }

  return (
    <>
      <StyleCoach
        lines={[s.intro, s.tip]}
        name="Maya"
        vibeId={mk.state.vibe}
      />

      <motion.div
        className="stage stage--shop"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <div className="stage__eyebrow">Catalogue · {Object.values(catalogue).reduce((c, cat) => c + cat.items.length, 0)} items</div>

        <div className="catalog">
          {Object.entries(catalogue).map(([catId, cat]) => (
            <section key={catId} className="catalog__cat">
              <h4 className="catalog__cat-title">{cat.icon} {cat.label}</h4>
              <div className="catalog__grid">
                {cat.items.map((it) => {
                  const inCart = state.cart.includes(it.id);
                  return (
                    <motion.button
                      key={it.id}
                      className={`shopcard ${inCart ? 'shopcard--in' : ''} shopcard--${it.type}`}
                      onClick={() => handleAdd(it)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      layout
                    >
                      <div className="shopcard__top">
                        <span className={`shopcard__type shopcard__type--${it.type}`}>{it.type}</span>
                        {it.tier && <span className="shopcard__tier">{it.tier}</span>}
                      </div>
                      <div className="shopcard__name">{it.name}</div>
                      <div className="shopcard__price">{fmt(it.price)}</div>
                      <div className="shopcard__action">
                        {inCart ? <><Check size={12}/> In room</> : '+ Add to room'}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="stage__footer">
          {!enoughNeeds && (
            <div className="gate">
              <AlertTriangle size={14}/> {s.gates.insufficientNeedsMessage}
            </div>
          )}
          {overBudget && (
            <div className="gate gate--over">
              <AlertTriangle size={14}/> {s.gates.overBudgetMessage}
            </div>
          )}
          <button
            className="cta"
            disabled={!canCheckout}
            onClick={() => { sfx('reveal'); mk.setScreen('screen-5-events'); }}
          >
            {s.cta} <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {oppCost && (
          <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal"
              initial={{ scale: 0.86, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.86, opacity: 0 }}
            >
              <div className="modal__icon">⚖️</div>
              <h3>Opportunity cost</h3>
              <p>{oppCost.message}</p>
              <div className="modal__actions">
                <button className="btn btn--ghost" onClick={() => setOppCost(null)}>Stick with budget</button>
                <button className="btn btn--primary" onClick={() => { mk.toggleItem(oppCost.itemId); setOppCost(null); }}>
                  Upgrade anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
 * SCREEN 5 — Events
 * ============================================================ */
export function Screen5Events({ mk }) {
  const s = scene('screen-5-events');
  const [stage, setStage] = useState('intro');
  const [showConsequence, setShowConsequence] = useState(null);
  const { state, setRandomEvent, applyEventEffect } = mk;

  useEffect(() => {
    if (!state.randomEvent && stage === 'spin') {
      const pick = surpriseEvents.randomEvents[Math.floor(((state.cart.length * 7) + (Date.now() % 17)) % surpriseEvents.randomEvents.length)];
      setTimeout(() => setRandomEvent(pick), 2400);
    }
  }, [stage, state.randomEvent, state.cart.length, setRandomEvent]);

  function handlePick(eventKind, choice) {
    sfx('aha');
    applyEventEffect(eventKind, choice.id, choice.effect);
    setShowConsequence({ text: choice.consequence, next: eventKind === 'fixed' ? 'afterFixed' : 'done' });
  }

  function dismissConsequence() {
    const next = showConsequence.next;
    setShowConsequence(null);
    if (next === 'afterFixed') setStage('spin');
    if (next === 'done') mk.setScreen('screen-6-snapshot');
  }

  if (stage === 'intro') {
    return (
      <>
        <StyleCoach
          lines={[s.intro, s.envelopeLine]}
          name="Maya"
          vibeId={mk.state.vibe}
          onDone={() => { /* user opens the envelope themselves */ }}
        />
        <motion.div
          className="stage stage--bottom"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="stage__eyebrow">Plot twist incoming</div>
          <motion.button
            className="envelope"
            onClick={() => { sfx('reveal'); setStage('fixed'); }}
            whileHover={{ scale: 1.05, rotate: -3 }}
            whileTap={{ scale: 0.96 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
          >
            <div className="envelope__icon">✉️</div>
            <span>{s.envelopeCta}</span>
          </motion.button>
        </motion.div>
      </>
    );
  }

  if (stage === 'fixed') {
    const ev = surpriseEvents.fixedEvent;
    return (
      <>
        <StyleCoach lines={[ev.text]} name="Maya" vibeId={mk.state.vibe} autoAdvance />
        <EventStage event={ev} kind="bad" onPick={(c) => handlePick('fixed', c)} />
        <ConsequenceModal cons={showConsequence} onClose={dismissConsequence} />
      </>
    );
  }

  if (stage === 'spin') {
    return (
      <>
        <StyleCoach lines={['Another twist is on the way…']} name="Maya" vibeId={mk.state.vibe} autoAdvance />
        {!state.randomEvent ? (
          <motion.div className="wheel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div
              className="wheel__disc"
              animate={{ rotate: 1080 }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            >🎡</motion.div>
            <div className="wheel__hint">Spinning…</div>
          </motion.div>
        ) : (
          <>
            <EventStage event={state.randomEvent} kind={state.randomEvent.good ? 'good' : 'bad'} onPick={(c) => handlePick('random', c)} />
            <ConsequenceModal cons={showConsequence} onClose={dismissConsequence} />
          </>
        )}
      </>
    );
  }

  return null;
}

function EventStage({ event, kind, onPick }) {
  const Icon = kind === 'good' ? Gift : kind === 'bad' ? Zap : AlertTriangle;
  return (
    <motion.div
      className={`stage stage--bottom event-stage event-stage--${kind}`}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <div className="event-stage__head">
        <Icon size={18} />
        <h3>{event.title}</h3>
      </div>
      <p className="event-stage__text">{event.text}</p>
      <div className="event-stage__options">
        {event.options.map((opt) => (
          <motion.button
            key={opt.id}
            className="event-option"
            onClick={() => onPick(opt)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ConsequenceModal({ cons, onClose }) {
  return (
    <AnimatePresence>
      {cons && (
        <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="modal"
            initial={{ scale: 0.86, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.86, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <div className="modal__icon">{cons.next === 'done' ? '✨' : '💭'}</div>
            <h3>Here's what happened</h3>
            <p>{cons.text}</p>
            <button className="btn btn--primary" onClick={onClose}>
              Continue <ChevronRight size={14} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
 * SCREEN 6 — Snapshot
 * Hero number reveal + animated bar chart + MCQ
 * ============================================================ */
export function Screen6Snapshot({ mk, onComplete }) {
  const s = scene('screen-6-snapshot');
  const { state, spent, budget, categoryTotals, needsTotal, wantsTotal, cartItems } = mk;

  // Celebratory chord when the snapshot lands.
  useEffect(() => {
    const a = setTimeout(() => sfx('ding'), 400);
    const b = setTimeout(() => sfx('aha'),  900);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const reserveStatus = state.reserve >= 2000 ? 'intact' : 'used';
  const totalForPct = Math.max(1, spent);
  const furniturePct = Math.round((categoryTotals.furniture / totalForPct) * 100);
  const wantsPct = Math.round((wantsTotal / totalForPct) * 100);
  const saved = budget.total - spent - state.reserve + (state.savings || 0);

  const insights = useMemo(() => {
    const out = [];
    s.insightTemplates.forEach((tpl) => {
      const m = tpl.match;
      if (m.categoryShareGte) {
        const [catId, threshold] = Object.entries(m.categoryShareGte)[0];
        if ((categoryTotals[catId] || 0) / totalForPct >= threshold) {
          out.push(tpl.template.replaceAll('{furniturePct}', String(furniturePct)));
        }
      }
      if (m.wantsShareGte && (wantsTotal / totalForPct) >= m.wantsShareGte) {
        out.push(tpl.template.replaceAll('{wantsPct}', String(wantsPct)));
      }
      if (m.reserveStatus && m.reserveStatus === reserveStatus) out.push(tpl.template);
    });
    return out;
  }, [s, categoryTotals, totalForPct, wantsTotal, reserveStatus, furniturePct, wantsPct]);

  const categoryRows = Object.entries(catalogue).map(([catId, cat]) => ({
    id: catId, label: cat.label, icon: cat.icon, value: categoryTotals[catId] || 0,
  }));

  return (
    <>
      <StyleCoach lines={[s.intro]} name="Maya" vibeId={mk.state.vibe} autoAdvance />
      <ConfettiBurst accent={VIBES[mk.state.vibe]?.accent || '#10B981'} />
      <motion.div
        className="stage stage--bottom snapshot"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <div className="stage__eyebrow">Your snapshot</div>
        <div className="snapshot__hero">
          <div className="snapshot__hero-label">Total spent on your room</div>
          <HeroCount value={spent} />
          <div className="snapshot__hero-meta">
            of {fmt(budget.total)} · {Math.max(0, saved) > 0 ? `${fmt(Math.max(0, saved))} saved` : 'fully invested'} · reserve {reserveStatus}
          </div>
        </div>

        <div className="snapshot__bars">
          {categoryRows.map((row, i) => {
            const pct = Math.round((row.value / totalForPct) * 100);
            return (
              <motion.div
                key={row.id}
                className="snapshot__bar"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <div className="snapshot__bar-head">
                  <span>{row.icon} {row.label}</span>
                  <span><strong>{fmt(row.value)}</strong> <em>{pct}%</em></span>
                </div>
                <div className="snapshot__bar-track">
                  <motion.div
                    className="snapshot__bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="snapshot__needwant">
          <div><span className="tag tag--need">NEEDS</span> {fmt(needsTotal)} · {Math.round((needsTotal / totalForPct) * 100)}%</div>
          <div><span className="tag tag--want">WANTS</span> {fmt(wantsTotal)} · {Math.round((wantsTotal / totalForPct) * 100)}%</div>
        </div>

        {insights.length > 0 && (
          <div className="snapshot__insights">
            {insights.map((line, i) => (
              <motion.div
                key={i}
                className="snapshot__insight"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.12 }}
              >
                <Sparkles size={13} /> {line}
              </motion.div>
            ))}
          </div>
        )}

        <Mcq mk={mk} s={s} categoryRows={categoryRows} />

        <div className="snapshot__transition">
          <h3>{s.transitionTitle}</h3>
          <p>{s.transitionSub}</p>
          <button
            className="cta"
            onClick={() => {
              sfx('reveal');
              onComplete?.({
                spent, categoryTotals, needsTotal, wantsTotal,
                reserveStatus, insights, cartItems: cartItems.map((it) => it.id),
              });
            }}
          >
            <Hammer size={14} /> {s.cta} <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* Confetti — short, joyful burst at the top of the snapshot screen. */
function ConfettiBurst({ accent }) {
  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#FACC15', accent || '#10B981'].filter(Boolean);
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      x: 50 + (Math.random() - 0.5) * 14,    // start near top-center (%)
      angle: (Math.random() - 0.5) * 200,    // spread (px)
      drop: 60 + Math.random() * 38,         // fall distance (vh)
      delay: Math.random() * 0.2,
      duration: 1.6 + Math.random() * 1.4,
      size: 6 + Math.random() * 6,
      rot: (Math.random() - 0.5) * 540,
    })), []
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="confetti__piece"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: `${p.drop}vh`,
            x: p.angle,
            rotate: p.rot,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.85, 1],
          }}
        />
      ))}
    </div>
  );
}

function HeroCount({ value }) {
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => '₹' + Math.round(n).toLocaleString('en-IN'));
  useEffect(() => {
    const c = animate(v, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [value]);
  return <motion.div className="snapshot__hero-num">{text}</motion.div>;
}

function Mcq({ mk, s, categoryRows }) {
  const top = [...categoryRows].sort((a, b) => b.value - a.value)[0];
  const opts = categoryRows.map((r) => ({ id: r.id, label: `${r.icon} ${r.label}` }));
  const [picked, setPicked] = useState(mk.state.snapshotMcq);
  return (
    <div className="snap-mcq">
      <h4>{s.mcq.question}</h4>
      <div className="snap-mcq__opts">
        {opts.map((o) => {
          const correct = picked && o.id === top.id;
          const wrong   = picked === o.id && o.id !== top.id;
          return (
            <button
              key={o.id}
              className={`snap-mcq__opt ${correct ? 'is-correct' : ''} ${wrong ? 'is-wrong' : ''}`}
              disabled={!!picked}
              onClick={() => {
              setPicked(o.id);
              mk.setSnapshotMcq(o.id);
              sfx(o.id === top.id ? 'ding' : 'tap');
            }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {picked && (
        <motion.p className="snap-mcq__fb" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {picked === top.id
            ? `Spot on — ${top.label} was your biggest spend.`
            : `Actually ${top.label} took the biggest chunk. Reading your tracker pays off.`}
        </motion.p>
      )}
    </div>
  );
}
