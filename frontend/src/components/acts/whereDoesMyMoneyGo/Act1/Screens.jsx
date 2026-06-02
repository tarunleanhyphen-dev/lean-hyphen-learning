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
import { SortItem3D } from './SortItem3D.jsx';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { sounds, speak, cancelSpeech, isAudioReady, setSpeechCallbacks } from '../../../../utils/sounds.js';

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

/* Beat durations are the FALLBACK for silent / no-TTS mode. When TTS is
 * enabled, beats actually advance on the speech-end callback so every
 * narration line is heard in full no matter how long it runs. */
const SCENE1_BEATS = [
  {
    id: 'big-news',
    fallbackMs: 8500,
    lines: [
      "Your parents just gave you some big news.",
      "They're renovating the house — and YOUR room is getting a complete makeover.",
    ],
    visual: null,
  },
  {
    id: 'budget',
    fallbackMs: 7000,
    lines: [
      "The budget? ₹50,000.",
      "All yours. One time. No top-ups.",
    ],
    visual: 'budget',
  },
  {
    id: 'tradeoff',
    fallbackMs: 9000,
    lines: [
      "But here's the catch — you have to plan every single rupee.",
      "Spend too much on one thing and you won't have enough for something else.",
    ],
    visual: 'tradeoff',
  },
  {
    id: 'envelope',
    fallbackMs: 5500,
    lines: [
      "And life has a few surprises waiting for you too.",
    ],
    visual: 'envelope',
  },
  {
    id: 'cta',
    fallbackMs: null,            // last beat — wait for click
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

  /* Beat advancement is driven by whichever happens first:
   *   (a) the narrator finishes speaking all lines for this beat
   *   (b) the fallback timer (for silent / no-TTS mode) fires
   * Either way we only advance once per beat, never past the last beat. */
  useEffect(() => {
    if (!beat) return undefined;
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      if (beatIdx < SCENE1_BEATS.length - 1) setBeatIdx(beatIdx + 1);
    };

    cancelSpeech();
    setSpeechCallbacks({ onEnd: () => setTimeout(advance, 1100) });

    // Queue every line at once so the speak engine plays them back-to-back.
    // onEnd only fires when the entire queue empties.
    if (beat.lines?.length) {
      beat.lines.forEach((line) => say(line));
    }

    const fallback = beat.fallbackMs ? setTimeout(advance, beat.fallbackMs) : null;
    return () => {
      if (fallback) clearTimeout(fallback);
      setSpeechCallbacks(null);
      cancelSpeech();
    };
    // beatIdx in deps so each beat sets up its own callbacks/timers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIdx]);

  /* Cancel speech on Scene 1 unmount. */
  useEffect(() => () => { cancelSpeech(); setSpeechCallbacks(null); }, []);

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
          {/* Per-beat Next button — visible on every beat except the CTA,
             so the learner can always advance whenever they're ready. */}
          {beatIdx < SCENE1_BEATS.length - 1 && (
            <motion.button
              className="scene1__nextbeat"
              onClick={() => { sfx('tap'); cancelSpeech(); setBeatIdx(beatIdx + 1); }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              aria-label="Next"
            >
              Next <ChevronRight size={14} />
            </motion.button>
          )}
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
  /* Always start with all four cards selectable — even if the learner
   * picked a vibe in a previous session, this screen is the moment to
   * pick again. The actual vibe still lives in mk.state.vibe until the
   * learner commits a new one via handlePick. */
  const [picked, setPicked] = useState(null);
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
                {/* If the vibe has a real room photo (previewImage), show it
                    instead of the 3D mini — photos read clearer at small
                    sizes. Otherwise, drei View tracks this ref's bounding
                    rect and the shared Canvas renders the mini room. */}
                {v.previewImage ? (
                  <img
                    className="vibecard-big__photo"
                    src={v.previewImage}
                    alt={`${v.label} room preview`}
                    loading="lazy"
                  />
                ) : (
                  <>
                    <View
                      className="vibecard-big__view"
                      track={{ current: cardRefs.current[`${v.id}-preview`] }}
                    />
                    <div
                      className="vibecard-big__preview-anchor"
                      ref={(el) => { if (el) cardRefs.current[`${v.id}-preview`] = el; }}
                    />
                  </>
                )}
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
        {/* Only spin up a 3D View for vibes that don't have a photo. */}
        {vibes.filter((v) => !v.previewImage).map((v) => (
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
/* Each rule card has a built-in mini animation that explains the rule
 * visually — not just an icon, an actual moving demo. */
const RULE_BLOCKS = [
  {
    id: 'budget',
    icon: '💰',
    title: 'You have ₹50,000 to spend',
    sub: 'The whole budget. One time. No top-ups.',
    accent: '#FACC15',
    voice: 'You have fifty thousand rupees to spend. The whole budget. One time. No top-ups.',
  },
  {
    id: 'reserve',
    icon: '🛡️',
    title: 'Keep ₹2,000 locked as Emergency Reserve',
    sub: "Don't touch it. Life has surprises.",
    accent: '#3B82F6',
    voice: 'Keep two thousand rupees locked as your Emergency Reserve. Don\'t touch it. Life has surprises.',
  },
  {
    id: 'needs-first',
    icon: '✅',
    title: 'Buy at least 3 Needs before any Wants',
    sub: 'Essentials first. Then comes the fun stuff.',
    accent: '#10B981',
    voice: 'Buy at least three Need items before adding any Wants. Essentials first. Then comes the fun stuff.',
  },
  {
    id: 'overbudget',
    icon: '⚠️',
    title: 'Go over budget? Remove items before continuing',
    sub: 'The tracker turns red, and you have to bring it back.',
    accent: '#EF4444',
    voice: 'If you go over budget, you must remove items before moving forward.',
  },
];

/* Single-stage guided briefing — one rule at a time, then tracker, then CTA.
 * Full-screen, responsive, no inner scrolling. */
const RULES_TOTAL_PAGES = RULE_BLOCKS.length + 1; // +1 for tracker preview

export function Screen2Rules({ mk }) {
  const s = scene('screen-2-rules');
  /* page = -1  → opening title
     page = 0..3 → one rule card per page
     page = 4    → tracker preview
     page = 5    → final CTA (auto-shown when tracker exit-able) */
  const [page, setPage] = useState(-1);
  const [showCta, setShowCta] = useState(false);

  /* Auto-advance through the title beat to page 0. */
  useEffect(() => {
    if (page !== -1) return undefined;
    const t = setTimeout(() => setPage(0), 1600);
    return () => clearTimeout(t);
  }, [page]);

  /* Auto-advance each rule after its demo completes (different durations
   * per rule based on demo length). The tracker preview holds until CTA. */
  const ruleAutoDurations = { 'budget': 4200, 'reserve': 4500, 'needs-first': 5000, 'overbudget': 4500 };
  useEffect(() => {
    if (page < 0 || page >= RULE_BLOCKS.length) return undefined;
    const r = RULE_BLOCKS[page];
    const t = setTimeout(() => setPage(page + 1), ruleAutoDurations[r.id] || 4200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /* Show the CTA shortly after the tracker preview lands. */
  useEffect(() => {
    if (page !== RULE_BLOCKS.length) return undefined;
    const t = setTimeout(() => setShowCta(true), 3200);
    return () => clearTimeout(t);
  }, [page]);

  /* Narrate the title + each rule + tracker outro as they appear. */
  useEffect(() => {
    cancelSpeech();
    if (page === -1)                       say(s.intro);
    else if (page < RULE_BLOCKS.length)    say(RULE_BLOCKS[page].voice);
    else                                   say(s.outro);
  }, [page, s.intro, s.outro]);

  useEffect(() => () => cancelSpeech(), []);

  function jumpTo(p) { sfx('tap'); setPage(p); }
  function next() { sfx('tap'); setPage((p) => Math.min(RULE_BLOCKS.length, p + 1)); }
  function skipAll() {
    sfx('tap');
    setPage(RULE_BLOCKS.length);
    setTimeout(() => setShowCta(true), 1500);
  }

  function go() {
    sfx('reveal');
    cancelSpeech();
    mk.setScreen('screen-3-sort');
  }

  const onTracker = page === RULE_BLOCKS.length;
  const currentRule = page >= 0 && page < RULE_BLOCKS.length ? RULE_BLOCKS[page] : null;

  return (
    <div className="briefing">
      {/* ===== Header: scene chip + dots ===== */}
      <header className="briefing__head">
        <div className="briefing__chip">Scene 3 · Mission briefing</div>
        <div className="briefing__dots">
          {RULE_BLOCKS.map((r, i) => (
            <button
              key={r.id}
              className={`briefing__dot ${page === i ? 'is-active' : ''} ${page > i ? 'is-done' : ''}`}
              onClick={() => jumpTo(i)}
              aria-label={`Rule ${i + 1}`}
            />
          ))}
          <button
            className={`briefing__dot briefing__dot--tracker ${onTracker ? 'is-active' : ''} ${page > RULE_BLOCKS.length - 1 ? 'is-done' : ''}`}
            onClick={() => jumpTo(RULE_BLOCKS.length)}
            aria-label="Tracker"
          />
        </div>
        {page >= 0 && !showCta && (
          <button className="briefing__skip" onClick={skipAll}>Skip ahead <ChevronRight size={12}/></button>
        )}
      </header>

      {/* ===== Stage: one card at a time ===== */}
      <main className="briefing__stage">
        <AnimatePresence mode="wait">
          {page === -1 && (
            <motion.div
              key="title"
              className="briefing__titlecard"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            >
              <div className="briefing__eyebrow">Mission Briefing</div>
              <h1 className="briefing__h1">{s.intro}</h1>
              <p className="briefing__sub">A quick walkthrough of the four rules + a tour of your live Expense Tracker.</p>
              <button className="briefing__begin" onClick={() => setPage(0)}>
                Begin briefing <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {currentRule && (
            <RulePage key={currentRule.id} rule={currentRule} index={page} onNext={next} />
          )}

          {onTracker && (
            <TrackerPage key="tracker" outro={s.outro} />
          )}
        </AnimatePresence>
      </main>

      {/* ===== Footer: persistent CTA when ready ===== */}
      <footer className="briefing__foot">
        <AnimatePresence>
          {showCta && (
            <motion.button
              key="cta"
              className="briefing__cta"
              onClick={go}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="briefing__cta-pulse" aria-hidden />
              <span className="briefing__cta-label">{s.cta}</span>
              <ChevronRight size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}

/* ----- One rule page (icon + title + demo) ----- */
function RulePage({ rule, index, onNext }) {
  return (
    <motion.div
      key={rule.id}
      className={`rpage rpage--${rule.id}`}
      style={{ '--rule-accent': rule.accent }}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="rpage__halo" aria-hidden />
      <div className="rpage__step">Rule {index + 1} of {RULE_BLOCKS.length}</div>
      <div className="rpage__icon-wrap">
        <div className="rpage__icon-halo" aria-hidden />
        <motion.div
          className="rpage__icon"
          animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {rule.icon}
        </motion.div>
      </div>
      <h2 className="rpage__title">{rule.title}</h2>
      <p className="rpage__sub">{rule.sub}</p>
      <div className="rpage__demo">
        {rule.id === 'budget'     && <BudgetDemo />}
        {rule.id === 'reserve'    && <ReserveDemo />}
        {rule.id === 'needs-first'&& <NeedsFirstDemo />}
        {rule.id === 'overbudget' && <OverbudgetDemo />}
      </div>
      <button className="rpage__next" onClick={onNext}>
        {index === RULE_BLOCKS.length - 1 ? 'Meet the Tracker' : 'Next rule'} <ChevronRight size={14} />
      </button>
    </motion.div>
  );
}

/* ----- Tracker page (replaces the broken side-panel layout) ----- */
function TrackerPage({ outro }) {
  return (
    <motion.div
      key="tracker"
      className="tpage"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="tpage__col tpage__col--left">
        <div className="tpage__eyebrow">Your live game companion</div>
        <h2 className="tpage__title">Meet the Expense Tracker</h2>
        <p className="tpage__sub">
          {outro || "Watch your tracker update as you shop. It'll show you exactly where your money is going."}
        </p>
        <ul className="tpage__bullets">
          <li><span className="tpage__bullet-dot" /> Real-time spent / remaining / reserve</li>
          <li><span className="tpage__bullet-dot" /> Category breakdown across 5 buckets</li>
          <li><span className="tpage__bullet-dot" /> Donut chart that fills as you spend</li>
          <li><span className="tpage__bullet-dot" /> Warns the moment you cross budget</li>
        </ul>
      </div>
      <div className="tpage__col tpage__col--right">
        <TrackerPreview />
      </div>
    </motion.div>
  );
}

/* ------------------ Demos: each rule's mini animation ------------------ */

function BudgetDemo() {
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => '₹' + Math.round(n).toLocaleString('en-IN'));
  useEffect(() => {
    const c = animate(v, 50000, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, []);
  return (
    <div className="demo demo--budget">
      <motion.div className="demo__bignum">{text}</motion.div>
      <div className="demo__row">
        {[...Array(10)].map((_, i) => (
          <motion.span
            key={i}
            className="demo__coin"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 240, damping: 18 }}
          >
            🪙
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function ReserveDemo() {
  return (
    <div className="demo demo--reserve">
      <div className="demo__vault">
        <motion.div
          className="demo__vault-door"
          initial={{ rotateY: -85 }}
          animate={{ rotateY: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="demo__vault-lock">🔒</span>
        </motion.div>
        <motion.div
          className="demo__vault-bill"
          initial={{ opacity: 0, x: -40, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 22 }}
        >
          ₹2,000
        </motion.div>
      </div>
      <div className="demo__caption">safely locked away</div>
    </div>
  );
}

function NeedsFirstDemo() {
  return (
    <div className="demo demo--needs">
      <div className="demo__items">
        {[
          { icon: '🛏️', label: 'Bed',      kind: 'need', delay: 0.1 },
          { icon: '🚪', label: 'Wardrobe', kind: 'need', delay: 0.3 },
          { icon: '💡', label: 'Lamp',     kind: 'need', delay: 0.5 },
          { icon: '🎮', label: 'Gaming',   kind: 'want', delay: 0.8 },
          { icon: '🔊', label: 'Speaker',  kind: 'want', delay: 1.0 },
        ].map((it) => (
          <motion.div
            key={it.label}
            className={`demo__item demo__item--${it.kind}`}
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: it.delay, type: 'spring', stiffness: 220, damping: 22 }}
          >
            <span className="demo__item-icon">{it.icon}</span>
            <span className="demo__item-label">{it.label}</span>
            <span className={`demo__item-badge demo__item-badge--${it.kind}`}>
              {it.kind === 'need' ? '✓' : '🔒'}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="demo__caption"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Wants unlock <strong>after</strong> 3 Needs ✓
      </motion.div>
    </div>
  );
}

function OverbudgetDemo() {
  const [phase, setPhase] = useState(0);
  // phase 0: bar normal, phase 1: bar red overflow, phase 2: item flies out, bar back to green
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const fill = phase === 0 ? '85%' : phase === 1 ? '108%' : '72%';
  const color = phase === 1 ? '#EF4444' : phase === 2 ? '#10B981' : '#FACC15';
  return (
    <div className="demo demo--overbudget">
      <div className="demo__bar">
        <motion.div
          className="demo__bar-fill"
          animate={{ width: fill, background: color }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        />
        <div className="demo__bar-label" style={{ color }}>
          {phase === 1 ? 'over budget!' : phase === 2 ? 'back on track' : 'on budget'}
        </div>
      </div>
      <div className="demo__items demo__items--inline">
        {['🛏️', '🚪', '🎮'].map((g, i) => (
          <motion.span
            key={i}
            className={`demo__chip ${phase === 2 && i === 2 ? 'demo__chip--gone' : ''}`}
            animate={phase === 2 && i === 2
              ? { x: 60, y: -30, opacity: 0, rotate: 25 }
              : {}}
            transition={{ duration: 0.5 }}
          >
            {g}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/* ------------------ Tracker Preview ------------------ */
function TrackerPreview() {
  const spent = useMotionValue(0);
  const remaining = useMotionValue(48000);
  const furniture = useMotionValue(0);
  const remText = useTransform(remaining, (n) => '₹' + Math.round(n).toLocaleString('en-IN'));
  const spentText = useTransform(spent, (n) => '₹' + Math.round(n).toLocaleString('en-IN'));
  const furnText = useTransform(furniture, (n) => '₹' + Math.round(n).toLocaleString('en-IN'));

  // Sample-value demo: pulse to ₹12,000, hold, then back to ₹0
  useEffect(() => {
    const seq = async () => {
      await new Promise((r) => setTimeout(r, 1100));
      const a = animate(spent, 12000, { duration: 1.0, ease: 'easeOut' });
      const b = animate(remaining, 36000, { duration: 1.0, ease: 'easeOut' });
      const c = animate(furniture, 12000, { duration: 1.0, ease: 'easeOut' });
      await Promise.all([a.finished, b.finished, c.finished].map((p) => p.catch?.(() => {}) || p));
      await new Promise((r) => setTimeout(r, 1300));
      animate(spent, 0,     { duration: 0.8 });
      animate(remaining, 48000, { duration: 0.8 });
      animate(furniture, 0, { duration: 0.8 });
    };
    seq();
  }, []);

  // Width transform must be created outside .map() (Rules of Hooks).
  const furnWidth = useTransform(furniture, (v) => `${Math.min(100, (v / 48000) * 100)}%`);
  const CATS = [
    { id: 'furniture', label: 'Furniture & Bed',  icon: '🛏️', val: furnText, width: furnWidth },
    { id: 'seating',   label: 'Seating & Desk',   icon: '🪑', val: null, width: null },
    { id: 'storage',   label: 'Storage',          icon: '📦', val: null, width: null },
    { id: 'lighting',  label: 'Lighting',         icon: '💡', val: null, width: null },
    { id: 'decor',     label: 'Décor & Tech',     icon: '🎨', val: null, width: null },
  ];

  return (
    <motion.aside
      className="trackpreview"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24 }}
    >
      <div className="trackpreview__head">
        <div className="trackpreview__title">Expense Tracker</div>
        <div className="trackpreview__sub">your live game companion</div>
      </div>

      <div className="trackpreview__hero">
        <div className="trackpreview__hero-label">Remaining</div>
        <motion.div className="trackpreview__hero-num">{remText}</motion.div>
        <div className="trackpreview__hero-meta">of ₹48,000 spendable</div>
      </div>

      <div className="trackpreview__stats">
        <div className="trackpreview__stat">
          <span>Total Budget</span><strong>₹50,000</strong>
        </div>
        <div className="trackpreview__stat trackpreview__stat--lock">
          <span>🔒 Reserve</span><strong>₹2,000</strong>
        </div>
        <div className="trackpreview__stat">
          <span>Spent</span><motion.strong>{spentText}</motion.strong>
        </div>
      </div>

      <div className="trackpreview__catbreak">
        <div className="trackpreview__catbreak-title">Category breakdown</div>
        {CATS.map((c) => (
          <div key={c.id} className="trackpreview__cat">
            <div className="trackpreview__cat-row">
              <span>{c.icon} {c.label}</span>
              {c.val
                ? <motion.strong>{c.val}</motion.strong>
                : <strong>₹0</strong>}
            </div>
            <div className="trackpreview__cat-bar">
              {c.width
                ? <motion.div className="trackpreview__cat-fill" style={{ width: c.width }} />
                : null}
            </div>
          </div>
        ))}
      </div>

      <div className="trackpreview__chart">
        <DonutPreview liveSpent={spent} />
      </div>

      <div className="trackpreview__caption">
        Watch your tracker update as you shop. It'll show you exactly where your money is going.
      </div>
    </motion.aside>
  );
}

/* Simple SVG donut chart that fills as spent rises. */
function DonutPreview({ liveSpent }) {
  const dashOffset = useTransform(liveSpent, (n) => {
    const pct = Math.min(1, n / 48000);
    const total = 2 * Math.PI * 36;
    return total * (1 - pct);
  });
  return (
    <svg className="donut" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r="36" stroke="rgba(255,255,255,0.10)" strokeWidth="10" fill="none" />
      <motion.circle
        cx="48" cy="48" r="36"
        stroke="#FACC15"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={2 * Math.PI * 36}
        style={{ strokeDashoffset: dashOffset }}
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="52" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">spend %</text>
    </svg>
  );
}

/* ============================================================
 * SCREEN 4 (user-facing) — Sort: NEED vs WANT mini-game
 *
 * Modern drag-and-drop game with:
 *   - Cinematic intro showing animated NEED + WANT explainer
 *   - Big animated buckets with depth, glow, hover pulse, particle burst
 *   - Premium item card with drag + tap, throw-to-bucket animation
 *   - Per-answer feedback toast (correct/incorrect/grey-area)
 *   - Progress dots + "Item N of 14" counter
 *   - Summary screen with Needs vs Wants totals, comparison bar,
 *     personalised insight, then "Start Shopping →" CTA
 * ============================================================ */
const SORT_INTRO_BEATS = [
  { lines: ["Before you spend a single rupee — let's think."], dur: 3000, voice: "Before you spend a single rupee — let's think." },
  { lines: ["Some things in your room are things you NEED.", "Others are things you WANT."], dur: 4500, voice: 'Some things in your room are things you need. Others are things you want.' },
  { lines: ["Can you tell the difference?", 'Sort each item into the right bucket.'], dur: 3500, voice: "Can you tell the difference? Sort each item into the right bucket." },
];

export function Screen3Sort({ mk }) {
  const s = scene('screen-3-sort');
  const [stage, setStage] = useState('intro');   // 'intro' | 'playing' | 'summary'
  const [beatIdx, setBeatIdx] = useState(0);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [throwDir, setThrowDir] = useState(null); // 'need' | 'want' | null
  const [burstAt, setBurstAt] = useState(null);   // 'need' | 'want' | null — for particle burst

  const item = sortItems[idx];
  const isDone = idx >= sortItems.length;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-14, 14]);
  const dragGlowL = useTransform(x, [-260, -40, 0], [1, 0.3, 0]);
  const dragGlowR = useTransform(x, [0, 40, 260], [0, 0.3, 1]);

  /* ---------- Intro beat sequencing ---------- */
  useEffect(() => {
    if (stage !== 'intro') return undefined;
    if (beatIdx >= SORT_INTRO_BEATS.length) {
      setStage('playing');
      return undefined;
    }
    const beat = SORT_INTRO_BEATS[beatIdx];
    say(beat.voice);
    const t = setTimeout(() => setBeatIdx((b) => b + 1), beat.dur);
    return () => clearTimeout(t);
  }, [stage, beatIdx]);

  /* ---------- Transition to summary when all sorted ---------- */
  useEffect(() => {
    if (stage === 'playing' && isDone) {
      cancelSpeech();
      say(s.summaryHeading + ' ' + s.summaryOutro);
      setStage('summary');
    }
  }, [stage, isDone, s.summaryHeading, s.summaryOutro]);

  /* ---------- Cancel speech on unmount ---------- */
  useEffect(() => () => cancelSpeech(), []);

  /* ---------- Sort commit ---------- */
  function commit(choice) {
    if (feedback) return;
    const correct = choice === item.correct;
    sfx(correct ? 'ding' : 'tap');
    mk.setSortAnswer(item.id, choice);
    setThrowDir(choice);
    setBurstAt(choice);
    setFeedback({ choice, text: item.feedback[choice], isGrey: item.isGreyArea, correct });
    setTimeout(() => {
      setFeedback(null);
      setThrowDir(null);
      setBurstAt(null);
      x.set(0);
      setIdx((i) => i + 1);
    }, 1800);
  }

  function handleDragEnd(_, info) {
    const dx = info.offset.x + info.velocity.x * 0.2;
    if (dx < -120) return commit('need');
    if (dx >  120) return commit('want');
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
  }

  /* ---------- Render: intro stage ---------- */
  if (stage === 'intro') {
    const beat = SORT_INTRO_BEATS[Math.min(beatIdx, SORT_INTRO_BEATS.length - 1)];
    return (
      <div className="sortgame sortgame--intro">
        <button className="sortgame__skipintro" onClick={() => { sfx('tap'); cancelSpeech(); setStage('playing'); }}>
          Skip intro <ChevronRight size={12} />
        </button>
        <div className="sortgame__introdots">
          {SORT_INTRO_BEATS.map((_, i) => (
            <span key={i} className={`sortgame__dot ${i === beatIdx ? 'is-active' : ''} ${i < beatIdx ? 'is-done' : ''}`} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={beatIdx}
            className="sortgame__introcard"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            {beat.lines.map((line, i) => (
              <motion.div
                key={i}
                className="sortgame__introline"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.5 }}
              >
                {renderHighlightedLine(line)}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  /* ---------- Render: summary stage ---------- */
  if (stage === 'summary') {
    return <SortSummary mk={mk} s={s} />;
  }

  /* ---------- Render: playing stage ---------- */
  return (
    <div className="sortgame sortgame--play">
      <header className="sortgame__head">
        <div className="sortgame__chip">Scene 4 · Sort it out</div>
        <div className="sortgame__counter">Item {idx + 1} of {sortItems.length}</div>
        <div className="sortgame__progress" aria-hidden>
          {sortItems.map((_, i) => (
            <span key={i} className={`sortgame__pdot ${i < idx ? 'is-done' : ''} ${i === idx ? 'is-active' : ''}`} />
          ))}
        </div>
      </header>

      <main className="sortgame__arena">
        <Bucket kind="need" glow={dragGlowL} burst={burstAt === 'need'} onClick={() => commit('need')} disabled={!!feedback} />

        <div className="sortgame__center">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              className="sortcard-pro"
              drag={feedback ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              style={{ x, rotate }}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={throwDir
                ? { x: throwDir === 'need' ? -800 : 800, opacity: 0, rotate: throwDir === 'need' ? -30 : 30, scale: 0.8, transition: { duration: 0.55 } }
                : { opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            >
              <div className="sortcard-pro__halo" aria-hidden />
              <div className="sortcard-pro__preview">
                <SortItem3D itemId={item.id} />
              </div>
              <div className="sortcard-pro__name">{item.name}</div>
              <div className="sortcard-pro__price">{fmt(item.price)}</div>
              {item.isGreyArea && (
                <div className="sortcard-pro__grey">🟡 grey area · context matters</div>
              )}
              <div className="sortcard-pro__hint">drag a side · or tap a bucket</div>
            </motion.div>
          </AnimatePresence>
        </div>

        <Bucket kind="want" glow={dragGlowR} burst={burstAt === 'want'} onClick={() => commit('want')} disabled={!!feedback} />
      </main>

      {/* Always-visible compact tracker chip */}
      <aside className="sortgame__trackerchip">
        <div className="sortgame__trackerchip-label">Spent</div>
        <div className="sortgame__trackerchip-num">₹0</div>
        <div className="sortgame__trackerchip-meta">of ₹48,000 spendable</div>
      </aside>

      <AnimatePresence>
        {feedback && (
          <motion.div
            className={`sortgame__feedback sortgame__feedback--${feedback.isGrey ? 'grey' : feedback.correct ? 'good' : 'info'}`}
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <div className="sortgame__feedback-icon">
              {feedback.isGrey ? '🟡' : feedback.correct ? '✨' : '💭'}
            </div>
            <div>{feedback.text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Render line with NEED/WANT visually emphasized. */
function renderHighlightedLine(line) {
  const parts = line.split(/(NEED|WANT)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p === 'NEED') return <span key={i} className="hi hi--need">NEED</span>;
        if (p === 'WANT') return <span key={i} className="hi hi--want">WANT</span>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

/* ----- Big animated bucket ----- */
function Bucket({ kind, glow, burst, onClick, disabled }) {
  const label = kind === 'need' ? 'NEED' : 'WANT';
  const arrow = kind === 'need' ? '⬅️' : '➡️';
  const dotPositions = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      x: (Math.random() - 0.5) * 240,
      y: (Math.random() - 0.5) * 240,
      d: Math.random() * 0.15,
    })),
  [kind]); // re-seed per bucket
  return (
    <motion.button
      type="button"
      className={`bucket-pro bucket-pro--${kind}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.04, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      style={{
        boxShadow: kind === 'need'
          ? `0 0 0 ${0}px rgba(16, 185, 129, 0.4)`
          : `0 0 0 ${0}px rgba(139, 92, 246, 0.4)`,
      }}
    >
      {/* Glow ring driven by drag proximity */}
      <motion.div
        className="bucket-pro__glow"
        style={{ opacity: glow }}
        aria-hidden
      />
      <motion.div className="bucket-pro__halo" animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} aria-hidden />

      <div className="bucket-pro__arrow">{arrow}</div>
      <div className="bucket-pro__label">{label}</div>
      <div className="bucket-pro__sub">{kind === 'need' ? 'essential, must-have' : 'fun, optional'}</div>

      {/* Particle burst when an item lands here */}
      <AnimatePresence>
        {burst && (
          <motion.div className="bucket-pro__burst" aria-hidden>
            {dotPositions.map((p, i) => (
              <motion.span
                key={i}
                className="bucket-pro__particle"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: p.d, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ----- Premium results summary with confetti + donut + insight + catalogue preview ----- */
function SortSummary({ mk, s }) {
  const answers = mk.state.sortAnswers;
  const needsValue = sortItems.reduce((acc, it) => acc + (answers[it.id] === 'need' ? it.price : 0), 0);
  const wantsValue = sortItems.reduce((acc, it) => acc + (answers[it.id] === 'want' ? it.price : 0), 0);
  const greyCount = sortItems.reduce((acc, it) => acc + (it.isGreyArea && answers[it.id] ? 1 : 0), 0);
  const total = Math.max(1, needsValue + wantsValue);
  const needsPct = Math.round((needsValue / total) * 100);
  const wantsPct = 100 - needsPct;

  // Personalised insight derived from the player's actual split.
  const insight = useMemo(() => {
    if (needsPct >= 70)      return "You leaned hard into Needs — exactly how a planner starts. Now you'll see how trade-offs shape the room.";
    if (needsPct >= 55)      return "A healthy Need-first split. Most spending usually goes here — and that's completely normal.";
    if (wantsPct >= 60)      return "You favoured Wants — fun! Coming up, you'll see how this changes what fits in the budget.";
    return "Roughly balanced. Whether that holds up depends on what makes your final room actually work.";
  }, [needsPct, wantsPct]);

  /* Fire celebration sounds on mount. */
  useEffect(() => {
    const a = setTimeout(() => sfx('ding'), 300);
    const b = setTimeout(() => sfx('aha'),  900);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  return (
    <div className="sortsummary">
      {/* Celebration confetti */}
      <ConfettiBurst accent="#10B981" />

      <header className="sortsummary__head">
        <motion.div
          className="sortsummary__chip"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        >
          ✓ All 14 sorted
        </motion.div>
        <motion.h1
          className="sortsummary__title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Nice work! Here's a quick look at what you found.
        </motion.h1>
      </header>

      <div className="sortsummary__stage">
        <div className="sortsummary__stagecol sortsummary__stagecol--data">
          {/* Animated hero totals */}
          <div className="sortsummary__hero">
            <SortSummaryHero label="NEEDS" value={needsValue} color="#10B981" delay={0.4} />
            <SortSummaryHero label="WANTS" value={wantsValue} color="#8B5CF6" delay={0.55} />
          </div>

          {/* Comparison bar */}
          <div className="sortsummary__bar" aria-hidden>
            <motion.div
              className="sortsummary__bar-need"
              initial={{ width: 0 }}
              animate={{ width: `${needsPct}%` }}
              transition={{ delay: 0.8, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="sortsummary__bar-want"
              initial={{ width: 0 }}
              animate={{ width: `${wantsPct}%` }}
              transition={{ delay: 0.9, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="sortsummary__bar-tick" style={{ left: `${needsPct}%` }} />
            <div className="sortsummary__bar-need-pct">{needsPct}% Needs</div>
            <div className="sortsummary__bar-want-pct">{wantsPct}% Wants</div>
          </div>

          {/* Stat chips */}
          <div className="sortsummary__chips">
            <div className="sortsummary__statchip">
              <span className="sortsummary__statchip-label">Grey-area calls</span>
              <span className="sortsummary__statchip-value">{greyCount}</span>
            </div>
            <div className="sortsummary__statchip">
              <span className="sortsummary__statchip-label">Items total</span>
              <span className="sortsummary__statchip-value">{fmt(needsValue + wantsValue)}</span>
            </div>
          </div>

          {/* Personalised insight */}
          <motion.div
            className="sortsummary__insight"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
          >
            <Sparkles size={14} /> {insight}
          </motion.div>

          {/* Transition copy */}
          <motion.div
            className="sortsummary__transition"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
          >
            <strong>Now let's actually start shopping.</strong>
            <div>Can you build your dream room while staying within budget?</div>
          </motion.div>

          <motion.button
            className="sortsummary__cta"
            onClick={() => { sfx('reveal'); cancelSpeech(); mk.setScreen('screen-4-shop'); }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3 }}
          >
            <span className="sortsummary__cta-pulse" aria-hidden />
            Start Shopping <ChevronRight size={18} />
          </motion.button>
        </div>

        <aside className="sortsummary__stagecol sortsummary__stagecol--viz">
          {/* Animated donut chart */}
          <SortDonut needsPct={needsPct} />
          {/* Catalogue tease — small icons fly in as a preview of shopping */}
          <CataloguePreview />
        </aside>
      </div>
    </div>
  );
}

function SortDonut({ needsPct }) {
  const R = 64;
  const C = 2 * Math.PI * R;
  const needsLen = (C * needsPct) / 100;
  const wantsLen = C - needsLen;
  return (
    <div className="sortsummary__donutwrap">
      <svg className="sortsummary__donut" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="grad-need" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="grad-want" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={R} stroke="rgba(255,255,255,0.06)" strokeWidth="18" fill="none" />
        {/* Needs arc */}
        <motion.circle
          cx="80" cy="80" r={R}
          stroke="url(#grad-need)" strokeWidth="18" fill="none" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - needsLen }}
          transition={{ delay: 1.0, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          transform="rotate(-90 80 80)"
        />
        {/* Wants arc — starts after needs end */}
        <motion.circle
          cx="80" cy="80" r={R}
          stroke="url(#grad-want)" strokeWidth="18" fill="none" strokeLinecap="round"
          strokeDasharray={`${wantsLen} ${C}`}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -needsLen }}
          transition={{ delay: 1.2, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          transform="rotate(-90 80 80)"
        />
        <text x="80" y="76" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fff">{needsPct}%</text>
        <text x="80" y="96" textAnchor="middle" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.55)">NEEDS</text>
      </svg>
    </div>
  );
}

function CataloguePreview() {
  const tease = ['🛏️', '🪑', '🗄️', '💡', '📦', '🎨', '🪟', '🔊', '🪞', '🧊'];
  return (
    <div className="sortsummary__cataloguewrap">
      <div className="sortsummary__catalogue-label">Coming up</div>
      <div className="sortsummary__catalogue">
        {tease.map((g, i) => (
          <motion.div
            key={i}
            className="sortsummary__catalogue-item"
            initial={{ opacity: 0, y: -16, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 1.6 + i * 0.08, type: 'spring', stiffness: 220, damping: 22 }}
          >
            {g}
          </motion.div>
        ))}
      </div>
      <motion.div
        className="sortsummary__catalogue-caption"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4 }}
      >
        18-item catalogue · ₹48,000 to spend
      </motion.div>
    </div>
  );
}

function SortSummaryHero({ label, value, color, delay = 0 }) {
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => fmt(n));
  useEffect(() => {
    const t = setTimeout(() => animate(v, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1] }), delay * 1000);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <motion.div
      className="sortsummary__col"
      style={{ '--col-color': color }}
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="sortsummary__col-chip">{label}</div>
      <motion.div className="sortsummary__col-num">{text}</motion.div>
    </motion.div>
  );
}

/* ============================================================
 * SCREEN 4 — Shop Smart
 *
 * Premium split-screen room-design simulator:
 *   LEFT  : Live 3D room that fills with furniture as the player adds
 *           items, with a floating items-count chip.
 *   RIGHT : Sticky tracker (animated remaining + budget bar + donut +
 *           category breakdown + needs/wants split) above the catalogue
 *           grouped into 5 sections, all 18 items as premium cards.
 *
 * Behaviour:
 *   - Adding an item pushes that item into mk.state.cart, which the
 *     Room3D component renders immediately, so the room visibly fills
 *     up in real time.
 *   - Adding a tier-swap item (e.g. premium bed when budget bed in cart)
 *     triggers the opportunity-cost popup.
 *   - Trying to add an item that would push over budget triggers the
 *     budget-bar flash + shake + toast.
 *   - CTA only unlocks when budget is valid AND 3+ Need items are in.
 *   - TTS speaks the 3 intro lines on mount.
 * ============================================================ */
const CATEGORY_TIPS = {
  furniture: "The biggest line items — bed + wardrobe usually eat half the budget.",
  seating:   'Pick one chair. Basic or gaming — both are valid choices.',
  storage:   'Small spend, big quality-of-life. Easy to skip — easy to regret.',
  lighting:  'A ceiling light is essential. LED strips and lamps are flavour.',
  decor:     "Pure flavour. Spend here LAST, only with the money left over.",
};

export function Screen4Shop({ mk }) {
  const s = scene('screen-4-shop');
  const [oppCost, setOppCost] = useState(null);
  const [toast, setToast] = useState(null);
  const [overFlash, setOverFlash] = useState(false);

  const {
    state, spent, remaining, budget,
    categoryTotals, needsTotal, wantsTotal, needsCount,
    toggleItem, cartItems,
  } = mk;

  const overBudget  = spent > budget.spendable;
  const enoughNeeds = needsCount >= s.gates.minNeeds;
  const canCheckout = !overBudget && enoughNeeds && cartItems.length > 0;
  const zone = spent > 45000 ? 'edge' : spent > 38000 ? 'tight' : 'safe';
  const zoneColor = zone === 'edge' ? '#EF4444' : zone === 'tight' ? '#F59E0B' : '#10B981';

  /* ----- TTS: speak the 3 intro lines on mount, then go quiet ----- */
  useEffect(() => {
    say(s.intro);
    say("Remember: two thousand rupees is locked as your Emergency Reserve.");
    say(s.tip);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- Add / remove with full guard rails ----- */
  function handleAdd(item) {
    const currentlyIn = state.cart.includes(item.id);
    // Opportunity cost popups intercept the FIRST-time add of a premium swap.
    const matchedOC = s.opportunityCosts.find((oc) => oc.when.added === item.id);
    if (matchedOC && !currentlyIn) {
      sfx('alert');
      // Derive the budget alternative + delta dynamically so the compare
      // grid is correct for whichever tier swap triggered this popup.
      const budgetSiblingId = matchedOC.when.removed;
      const budgetSibling = mk.itemIndex[budgetSiblingId];
      const delta = budgetSibling ? item.price - budgetSibling.price : item.price;
      setOppCost({
        message: matchedOC.message,
        itemId: item.id,
        item,
        budgetSibling,
        delta,
      });
      return;
    }
    if (!currentlyIn) {
      // Adding this would push us over budget? Reject + shake.
      if (spent + item.price > budget.spendable) {
        sfx('alert');
        triggerOverFlash(s.gates.overBudgetMessage);
        return;
      }
      sfx('add');
    } else {
      sfx('tap');
    }
    toggleItem(item.id);
  }

  function triggerOverFlash(message) {
    setOverFlash(true);
    setToast({ msg: message, kind: 'over' });
    setTimeout(() => { setOverFlash(false); setToast(null); }, 2400);
  }

  function handleCheckout() {
    if (overBudget)   { triggerOverFlash(s.gates.overBudgetMessage); return; }
    if (!enoughNeeds) {
      setToast({ msg: s.gates.insufficientNeedsMessage, kind: 'needs' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    sfx('reveal');
    cancelSpeech();
    mk.setScreen('screen-5-events');
  }

  const totalCatalogueItems = Object.values(catalogue).reduce((c, cat) => c + cat.items.length, 0);

  return (
    <div className={`shopstage shopstage--zone-${zone} ${overFlash ? 'is-overflash' : ''}`}>
      {/* ===== LEFT — live 3D room ===== */}
      <aside className="shopstage__room">
        <Room3D
          vibeId={mk.state.vibe || 'cosy'}
          purchasedIds={state.cart}
          shot="shop"
          orbit={false}
          showCharacter
          speaking={false}
        />
        <div className="shopstage__room-grad" aria-hidden />
        <motion.div
          className="shopstage__roomchip"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="shopstage__roomchip-dot" />
          {cartItems.length} of {totalCatalogueItems} items placed
        </motion.div>
        <motion.div
          className="shopstage__roomtag"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          Your room — updates live as you shop
        </motion.div>
      </aside>

      {/* ===== RIGHT — tracker + catalogue + CTA ===== */}
      <section className="shopstage__panel">
        <header className="shopstage__head">
          <div className="shopstage__chip">Scene 5 · Shop Smart</div>
          <h1 className="shopstage__title">Build your dream room.</h1>
          <p className="shopstage__sub">{s.intro}</p>
        </header>

        {/* Sticky tracker */}
        <div className="shoptracker">
          <ShopTrackerHero remaining={remaining} spendable={budget.spendable} zoneColor={zoneColor} />
          <BudgetBar spent={spent} spendable={budget.spendable} flash={overFlash} />
          <div className="shoptracker__stats">
            <ShopStat label="Total" value={budget.total} />
            <ShopStat label="🔒 Reserve" value={budget.reserve} muted />
            <ShopStat label="Spent" value={spent} animate />
          </div>
          <div className="shoptracker__split">
            <ShopDonut spent={spent} categoryTotals={categoryTotals} />
            <div className="shoptracker__breakdown">
              {Object.entries(catalogue).map(([catId, cat]) => (
                <CategoryRow
                  key={catId}
                  icon={cat.icon}
                  label={cat.label}
                  amount={categoryTotals[catId] || 0}
                  ofBudget={budget.spendable}
                />
              ))}
            </div>
          </div>
          <NeedsWantsSplit needs={needsTotal} wants={wantsTotal} />
          <div className="shoptracker__zone" style={{ color: zoneColor }}>
            <span className="shoptracker__zone-dot" style={{ background: zoneColor }} /> {s.budgetBands.find((b) => b.id === zone)?.label}
            <span className="shoptracker__zone-spare">· {needsCount} Need{needsCount === 1 ? '' : 's'} placed</span>
          </div>
        </div>

        {/* Catalogue */}
        <div className="shopcat">
          {Object.entries(catalogue).map(([catId, cat]) => {
            const catSpent = categoryTotals[catId] || 0;
            return (
              <section key={catId} className="shopcat__section">
                <header className="shopcat__head">
                  <div className="shopcat__title">{cat.icon} {cat.label}</div>
                  {catSpent > 0 && (
                    <div className="shopcat__spent">{fmt(catSpent)} spent here</div>
                  )}
                </header>
                <div className="shopcat__tip">{CATEGORY_TIPS[catId]}</div>
                <div className="shopcat__grid">
                  {cat.items.map((it) => (
                    <ShopItemCard
                      key={it.id}
                      item={it}
                      inCart={state.cart.includes(it.id)}
                      wouldOverBudget={!state.cart.includes(it.id) && spent + it.price > budget.spendable}
                      onClick={() => handleAdd(it)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Sticky footer with CTA */}
        <footer className="shopstage__foot">
          <div className="shopstage__foot-gates">
            {!enoughNeeds && (
              <span className="shopstage__gate"><AlertTriangle size={12} /> 3+ Needs required · {needsCount}/3</span>
            )}
            {overBudget && (
              <span className="shopstage__gate shopstage__gate--over"><AlertTriangle size={12} /> over budget by {fmt(spent - budget.spendable)}</span>
            )}
          </div>
          <motion.button
            className={`shopstage__cta ${canCheckout ? 'is-ready' : ''}`}
            onClick={handleCheckout}
            whileHover={canCheckout ? { scale: 1.04 } : {}}
            whileTap={canCheckout ? { scale: 0.97 } : {}}
            animate={canCheckout ? { boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.45)', '0 0 0 14px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0)'] } : {}}
            transition={canCheckout ? { duration: 1.8, repeat: Infinity } : {}}
          >
            I'm happy with my room <ChevronRight size={18} />
          </motion.button>
        </footer>
      </section>

      {/* Opportunity-cost popup */}
      <AnimatePresence>
        {oppCost && <OpportunityCostModal data={oppCost} onClose={() => setOppCost(null)} onConfirm={() => { toggleItem(oppCost.itemId); setOppCost(null); }} />}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`shoptoast shoptoast--${toast.kind}`}
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <span className="shoptoast__icon">{toast.kind === 'over' ? '⚠️' : '💡'}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Tracker sub-components ---------- */
function ShopTrackerHero({ remaining, spendable, zoneColor }) {
  const v = useMotionValue(remaining);
  const text = useTransform(v, (n) => fmt(Math.round(n)));
  useEffect(() => { animate(v, remaining, { duration: 0.55, ease: 'easeOut' }); }, [remaining]);
  return (
    <div className="shoptracker__hero" style={{ '--zone': zoneColor }}>
      <div className="shoptracker__hero-label">Remaining</div>
      <motion.div className="shoptracker__hero-num">{text}</motion.div>
      <div className="shoptracker__hero-meta">of {fmt(spendable)} spendable</div>
    </div>
  );
}

function BudgetBar({ spent, spendable, flash }) {
  const pct = Math.min(120, (spent / spendable) * 100);
  return (
    <div className={`shopbar ${flash ? 'is-flash' : ''}`}>
      <div className="shopbar__zones">
        <span className="shopbar__zone shopbar__zone--safe" />
        <span className="shopbar__zone shopbar__zone--tight" />
        <span className="shopbar__zone shopbar__zone--edge" />
      </div>
      <motion.div
        className="shopbar__fill"
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      />
      <span className="shopbar__tick shopbar__tick--low"  >₹38k</span>
      <span className="shopbar__tick shopbar__tick--high" >₹45k</span>
    </div>
  );
}

function ShopStat({ label, value, muted, animate: animVal }) {
  const v = useMotionValue(value);
  const text = useTransform(v, (n) => fmt(Math.round(n)));
  useEffect(() => { animate(v, value, { duration: 0.45 }); }, [value]);
  return (
    <div className={`shopstat ${muted ? 'is-muted' : ''}`}>
      <span className="shopstat__label">{label}</span>
      {animVal
        ? <motion.span className="shopstat__value">{text}</motion.span>
        : <span className="shopstat__value">{fmt(value)}</span>}
    </div>
  );
}

function ShopDonut({ spent, categoryTotals }) {
  const R = 38, C = 2 * Math.PI * R;
  const max = 48000;
  const totalPct = Math.min(1, spent / max);
  const totalLen = C * totalPct;
  return (
    <div className="shopdonut">
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <circle cx="50" cy="50" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
        <motion.circle
          cx="50" cy="50" r={R}
          stroke="url(#shopdonut-grad)" strokeWidth="12" fill="none" strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C - totalLen }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          transform="rotate(-90 50 50)"
        />
        <defs>
          <linearGradient id="shopdonut-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="60%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">{Math.round(totalPct * 100)}%</text>
        <text x="50" y="62" textAnchor="middle" fontSize="7" fontWeight="700" fill="rgba(255,255,255,0.55)">SPENT</text>
      </svg>
    </div>
  );
}

function CategoryRow({ icon, label, amount, ofBudget }) {
  const pct = Math.min(100, (amount / ofBudget) * 100);
  const v = useMotionValue(amount);
  const text = useTransform(v, (n) => fmt(Math.round(n)));
  useEffect(() => { animate(v, amount, { duration: 0.45 }); }, [amount]);
  return (
    <div className="shopcatrow">
      <div className="shopcatrow__line">
        <span className="shopcatrow__label">{icon} {label}</span>
        <motion.strong className="shopcatrow__amount">{text}</motion.strong>
      </div>
      <div className="shopcatrow__bar">
        <motion.div className="shopcatrow__fill" animate={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NeedsWantsSplit({ needs, wants }) {
  const total = Math.max(1, needs + wants);
  const needsPct = Math.round((needs / total) * 100);
  return (
    <div className="shopsplit">
      <div className="shopsplit__bar">
        <motion.div className="shopsplit__need" animate={{ width: `${needsPct}%` }} />
        <motion.div className="shopsplit__want" animate={{ width: `${100 - needsPct}%` }} />
      </div>
      <div className="shopsplit__legend">
        <span><span className="shopsplit__dot shopsplit__dot--need" /> Needs {fmt(needs)}</span>
        <span><span className="shopsplit__dot shopsplit__dot--want" /> Wants {fmt(wants)}</span>
      </div>
    </div>
  );
}

/* ---------- Premium item card ---------- */
function ShopItemCard({ item, inCart, wouldOverBudget, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`shopitem shopitem--${item.type} ${inCart ? 'is-in' : ''} ${item.tier ? `shopitem--tier-${item.tier}` : ''} ${wouldOverBudget ? 'is-disabled-budget' : ''}`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      layout
    >
      <div className="shopitem__head">
        <span className={`shopitem__badge shopitem__badge--${item.type}`}>{item.type === 'need' ? 'Need' : 'Want'}</span>
        {item.tier && <span className="shopitem__tier">{item.tier}</span>}
      </div>
      <div className="shopitem__name">{item.name}</div>
      <div className="shopitem__price">{fmt(item.price)}</div>
      <div className="shopitem__cta">
        {inCart
          ? <><Check size={12} /> In room — tap to remove</>
          : wouldOverBudget
            ? <><AlertTriangle size={12} /> would overspend</>
            : <>+ Add to room</>}
      </div>
      {inCart && <div className="shopitem__glow" aria-hidden />}
    </motion.button>
  );
}

/* ---------- Opportunity-cost modal ---------- */
function OpportunityCostModal({ data, onClose, onConfirm }) {
  return (
    <motion.div
      className="oppcost-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="oppcost"
        initial={{ scale: 0.86, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.86, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="oppcost__eyebrow">A moment of trade-off</div>
        <div className="oppcost__icon">⚖️</div>
        <h2 className="oppcost__title">Worth the upgrade?</h2>
        <p className="oppcost__body">{data.message}</p>
        <div className="oppcost__compare">
          <div className="oppcost__compare-col">
            <div className="oppcost__compare-label">Upgrade adds</div>
            <div className="oppcost__compare-value">+{fmt(data.delta)}</div>
            <div className="oppcost__compare-meta">to {data.item.name}</div>
          </div>
          <div className="oppcost__compare-arrow">vs.</div>
          <div className="oppcost__compare-col">
            <div className="oppcost__compare-label">Stick with</div>
            <div className="oppcost__compare-value">{data.budgetSibling?.name || 'Budget option'}</div>
            <div className="oppcost__compare-meta">{fmt(data.budgetSibling?.price || 0)}</div>
          </div>
        </div>
        <div className="oppcost__actions">
          <button className="oppcost__btn oppcost__btn--ghost" onClick={onClose}>Stick with budget</button>
          <button className="oppcost__btn oppcost__btn--primary" onClick={onConfirm}>Upgrade anyway</button>
        </div>
      </motion.div>
    </motion.div>
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
