/**
 * Dream Bedroom Makeover — all six screens.
 *
 * Each narration screen speaks its lines on mount and only unlocks its CTA
 * once Kabir has finished reading (or the learner taps Skip). Interactive
 * screens (Sort, Shop, Events) wait for the learner instead.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Check, X, Lock, Sparkles, Mail, RotateCw, PartyPopper,
  AlertTriangle, ShoppingBag, Trophy, Info, ShieldCheck, Heart,
} from 'lucide-react';
import { lesson, sortItems, catalogue, surpriseEvents } from '../../../../data/lessons/dreamBedroomMakeover.js';
import { sounds, isAudioReady } from '../../../../utils/sounds.js';
import { Room3D } from './Room3D.jsx';
import { DustyRoom3D } from './DustyRoom3D.jsx';
import { VibeRoom3D } from './VibeRoom3D.jsx';
import { ItemArt } from './ItemArt.jsx';
import { ItemArt2D } from './ItemArt2D.jsx';
import { ItemPreview3D } from './ItemPreview3D.jsx';
import { ITEM_POS } from './Room3D.jsx';
import { Tracker, Donut, fmt, useCount } from './Tracker.jsx';
import { NarratorCard } from './NarratorCard.jsx';

/* ---------------- helpers ---------------- */
function sfx(name) { try { if (isAudioReady()) sounds[name]?.(); } catch { /* noop */ } }
function scene(id) { return lesson.scenes.find((s) => s.id === id); }
const BANDS = scene('screen-4-shop').budgetBands;

/** Speak a screen's lines on mount; expose done + replay/skip. */
function useScreenNarration(narration, lines) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDone(false);
    narration.narrate(lines, () => setDone(true));
    return () => narration.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    done,
    replay: () => narration.replay(lines),
    skip: () => { sfx('tap'); narration.skip(); setDone(true); },
  };
}

function CTA({ children, onClick, disabled, accent = '#A855F7', big }) {
  return (
    <motion.button
      className={`dbm-cta ${big ? 'dbm-cta--big' : ''}`}
      style={{ '--accent': accent }}
      onClick={() => { if (!disabled) { sfx('click'); onClick?.(); } }}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children} <ArrowRight size={18} />
    </motion.button>
  );
}

function Toast({ show, children, tone = 'bad' }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`dbm-toast dbm-toast--${tone}`}
          initial={{ opacity: 0, y: 24, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 24, x: '-50%' }}
        >
          <AlertTriangle size={16} /> {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ======================================================================
 * SCREEN 1 — Intro & Hook
 * ====================================================================== */
export function Screen1Intro({ mk, narration, accent }) {
  const s = scene('screen-1-intro');
  const n = useScreenNarration(narration, s.narration);

  return (
    <div className="dbm-screen dbm-screen--intro">
      <div className="dbm-intro__grid">
        <div className="dbm-intro__left">
          <motion.div className="dbm-eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles size={14} /> Where Does My Money Go? · Act 1
          </motion.div>
          <motion.h1 className="dbm-intro__title" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            Dream Bedroom <span style={{ color: accent }}>Makeover</span>
          </motion.h1>
          <NarratorCard narration={narration} lines={s.narration} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} hideAvatar />
          <div className="dbm-intro__cta">
            <CTA accent={accent} disabled={!n.done} onClick={() => mk.setScreen('screen-2-vibe')} big>
              {n.done ? s.cta : 'Listen first…'}
            </CTA>
          </div>
        </div>

        <div className="dbm-intro__right">
          <BudgetHero accent={accent} narration={narration} />
        </div>
      </div>
    </div>
  );
}

function BudgetHero({ accent, narration }) {
  const val = useCount(50000, 1400);
  return (
    <motion.div className="dbm-budgethero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
      <div className="dbm-budgethero__glow" style={{ background: accent }} />
      <div className="dbm-budgethero__room">
        <DustyRoom3D narration={narration} />
      </div>
      <div className="dbm-budgethero__chip">
        <span>Your budget</span>
        <strong style={{ color: accent }}>{fmt(val)}</strong>
        <small>one time · no top-ups</small>
      </div>
    </motion.div>
  );
}

/* ======================================================================
 * SCREEN 2 — Pick Your Vibe
 * ====================================================================== */
export function Screen2Vibe({ mk, narration, accent }) {
  const s = scene('screen-2-vibe');
  const n = useScreenNarration(narration, [s.intro, s.hint]);
  // Start with NO room selected — the check mark / selected styling only appears
  // after the user clicks a card here (even if a vibe was chosen on a past visit).
  const [picked, setPicked] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const pick = (id) => {
    sfx('add');
    setPicked(id);
    mk.pickVibe(id);
    // read the confirmation line aloud (Kabir) only on the FIRST pick — switching
    // between rooms afterwards updates the choice silently (no repeated voice).
    if (!confirmed) narration.say(s.confirmation);
    setConfirmed(true);
  };

  return (
    <div className="dbm-screen dbm-screen--vibe">
      {/* page-level confirmation banner — appears only after the user picks here */}
      <AnimatePresence>
        {confirmed && (
          <motion.div
            key="banner"
            className="dbm-vibe2__banner"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
          >
            <span className="dbm-vibe2__banner-ic"><Check size={16} /></span>
            {s.confirmation}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="dbm-vibe2">
        {/* LEFT — heading, narration, confirmation, CTA */}
        <div className="dbm-vibe2__left">
          <motion.div className="dbm-eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles size={14} /> Step 2 · Your style
          </motion.div>
          <h2 className="dbm-h2 dbm-vibe2__title">Pick your <span style={{ color: accent }}>vibe</span></h2>
          <NarratorCard narration={narration} lines={[s.intro, s.hint]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} hideAvatar />
          <div className="dbm-vibe2__hint"><Info size={13} /> Hover a room to see it in motion. This only sets the mood — prices don't change.</div>

          <AnimatePresence mode="wait">
            {!picked && (
              <motion.div key="pickme" className="dbm-vibe2__pickme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Tap a room to choose your style →
              </motion.div>
            )}
          </AnimatePresence>

          <CTA accent={accent} disabled={!picked} onClick={() => mk.setScreen('screen-2-rules')}>{s.cta}</CTA>
        </div>

        {/* RIGHT — 2×2 grid of live 3D rooms */}
        <div className="dbm-vibe2__grid">
          {lesson.vibes.map((v, i) => (
            <VibeCard key={v.id} v={v} index={i} picked={picked === v.id} onPick={() => pick(v.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VibeCard({ v, index, picked, onPick }) {
  const hoveredRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const enter = () => { hoveredRef.current = true; setHovered(true); };
  const leave = () => { hoveredRef.current = false; setHovered(false); };
  return (
    <motion.button
      type="button"
      className={`dbm-vcard ${picked ? 'is-picked' : ''} ${hovered ? 'is-hover' : ''}`}
      style={{ '--accent': v.accent, '--glow': v.glow }}
      onClick={onPick}
      onMouseEnter={enter} onMouseLeave={leave}
      onFocus={enter} onBlur={leave}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 * index }}
      whileHover={{ y: -5 }}
    >
      <div className="dbm-vcard__room"><VibeRoom3D vibe={v} hoveredRef={hoveredRef} /></div>
      <div className="dbm-vcard__body">
        <span className="dbm-vcard__logo" aria-hidden>{v.emoji}</span>
        <div className="dbm-vcard__text">
          <div className="dbm-vcard__label">{v.label}</div>
          <div className="dbm-vcard__tag">{v.tagline}</div>
        </div>
        <span className="dbm-vcard__check">{picked && <Check size={14} />}</span>
      </div>
    </motion.button>
  );
}

/* ======================================================================
 * SCREEN 2b — Ground Rules
 * ====================================================================== */
export function Screen2Rules({ mk, narration, accent }) {
  const s = scene('screen-2-rules');
  const n = useScreenNarration(narration, [s.intro]);

  return (
    <div className="dbm-screen dbm-screen--rules">
      <motion.div className="dbm-eyebrow dbm-rules__eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Sparkles size={14} /> Step 3 · The ground rules
      </motion.div>
      <motion.h2
        className="dbm-h2 dbm-rules__title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        Four rules <span className="dbm-rules__title-accent">before you spend</span>
      </motion.h2>
      <NarratorCard narration={narration} lines={[s.intro]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />

      <div className="dbm-rules">
        {s.rules.map((r, i) => (
          <motion.div
            key={i}
            className="dbm-rulecard"
            initial={{ opacity: 0, y: 46, rotateY: -92, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
            transition={{ delay: 0.18 * i, type: 'spring', stiffness: 130, damping: 15 }}
            whileHover={{ scale: 1.04, y: -6 }}
          >
            <div className="dbm-rulecard__float" style={{ animationDelay: `${i * 0.55}s` }}>
              <div className="dbm-flip">
                <div className="dbm-flip__face dbm-flip__front" style={{ '--accent': accent }}>
                  <span className="dbm-rulecard__bar" />
                  <span className="dbm-rulecard__no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="dbm-rulecard__icon">{r.icon}</span>
                  <span className="dbm-rulecard__title">{r.title}</span>
                  <span className="dbm-rulecard__fliphint">Hover to see why ↻</span>
                </div>
                <div className="dbm-flip__face dbm-flip__back" style={{ '--accent': accent }}>
                  <span className="dbm-rulecard__backno">Rule {String(i + 1).padStart(2, '0')}</span>
                  <span className="dbm-rulecard__text">{r.text}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dbm-rules__hint"><Info size={14} /> Hover any card to flip it and see why. The tracker stays on screen the whole time you shop.</div>

      <CTA accent={accent} disabled={!n.done} onClick={() => mk.setScreen('screen-3-sort')}>{s.cta}</CTA>
    </div>
  );
}

/* ======================================================================
 * SCREEN 4 — Sort It Out (Needs vs Wants)
 * ====================================================================== */
/* Big, fully-rendered item images (glossy emoji read as 3D on most platforms). */
const ITEM_EMOJI = {
  bed: '🛏️', desk: '🖥️', gchair: '🪑', wardrobe: '🚪', led: '🌈',
  lamp: '🪔', speaker: '🔊', curtains: '🪟', shelf: '📚', fridge: '🧊',
  chair: '🪑', poster: '🖼️', fan: '🌀', boxes: '📦', ceiling: '💡', mirror: '🪞',
};

export function Screen3Sort({ mk, narration, accent }) {
  const s = scene('screen-3-sort');
  useScreenNarration(narration, [s.intro]);

  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // { item, choice, text, grey }
  const [drop, setDrop] = useState(null); // 'need' | 'want' burst
  const [fly, setFly] = useState(null);   // card flying into a bucket

  // Start every visit with empty boxes (clears a previous run on replay).
  useEffect(() => { mk.resetSort(); setIdx(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const item = sortItems[idx];
  const finished = idx >= sortItems.length;

  const choose = (choice) => {
    if (!item || feedback || fly) return;
    sfx(choice === item.correct ? 'ding' : 'tap');
    mk.setSortAnswer(item.id, choice);
    setFly(choice);
    setDrop(choice);
    setTimeout(() => setDrop(null), 650);
    // feedback shows visually only — no per-item voice on this screen
    const text = item.feedback[choice];
    setTimeout(() => { setFeedback({ item, choice, text, grey: item.isGreyArea }); setFly(null); }, 470);
  };

  const next = () => {
    sfx('click');
    setFeedback(null);
    setIdx((i) => i + 1);
  };

  if (finished) {
    return <SortSummary mk={mk} accent={accent} narration={narration} />;
  }

  return (
    <div className="dbm-screen dbm-screen--sort">
      <motion.div className="dbm-eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Sparkles size={14} /> Step 4 · Needs vs Wants
      </motion.div>
      <h2 className="dbm-h2 dbm-sort__title">{s.prompt || 'Need or Want? Sort each item.'}</h2>
      <NarratorCard narration={narration} lines={[s.intro]} accent={accent} done compact size={92}
        onReplay={() => narration.replay([s.intro])} onSkip={() => narration.skip()} />

      <div className="dbm-sort__progress">
        Item {idx + 1} of {sortItems.length}
        <div className="dbm-sort__progressbar"><motion.div animate={{ width: `${(idx / sortItems.length) * 100}%` }} /></div>
      </div>

      <div className="dbm-sort__arena">
        <SortBox kind="need" label="Need" sub="can't go without" accent="#10B981" answers={mk.state.sortAnswers} active={fly === 'need'} />

        <div className="dbm-sort__cardzone">
          <AnimatePresence mode="wait">
            {!feedback && (
              <motion.div
                key={item.id}
                className="dbm-sortcard"
                initial={{ opacity: 0, y: -34, scale: 0.85 }}
                animate={fly
                  ? { x: fly === 'need' ? -280 : 280, y: 40, scale: 0.22, rotate: fly === 'need' ? -30 : 30, opacity: 0 }
                  : { opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              >
                <span className="dbm-sortcard__tag">Item {idx + 1}</span>
                <motion.div
                  className="dbm-sortcard__art"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ItemArt2D art={item.art} tier={item.id.includes('budget') ? 'budget' : 'premium'} size={132} />
                </motion.div>
                <div className="dbm-sortcard__name">{item.name}</div>
                <div className="dbm-sortcard__price">{fmt(item.price)}</div>
                {item.isGreyArea && <div className="dbm-sortcard__grey">🤔 grey area</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SortBox kind="want" label="Want" sub="nice to have" accent="#A855F7" answers={mk.state.sortAnswers} active={fly === 'want'} />
      </div>

      {!feedback ? (
        <div className="dbm-sort__buttons">
          <button className="dbm-sortbtn dbm-sortbtn--need" onClick={() => choose('need')} disabled={!!fly}><ShieldCheck size={17} /> It's a Need</button>
          <button className="dbm-sortbtn dbm-sortbtn--want" onClick={() => choose('want')} disabled={!!fly}><Heart size={16} /> It's a Want</button>
        </div>
      ) : (
        <motion.div className={`dbm-feedback ${feedback.choice === feedback.item.correct ? 'is-right' : 'is-soft'} ${feedback.grey ? 'is-grey' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dbm-feedback__icon">{feedback.grey ? '🤔' : feedback.choice === feedback.item.correct ? <Check size={18} /> : <Info size={18} />}</div>
          <p>{feedback.text}</p>
          <button className="dbm-feedback__next" onClick={next}>Next <ArrowRight size={15} /></button>
        </motion.div>
      )}

      <button className="dbm-sort__skip" onClick={() => { sfx('tap'); narration.skip(); setIdx(sortItems.length); }}>
        Skip to summary <ArrowRight size={13} />
      </button>
    </div>
  );
}

/* A clean 3D glass display cube drawn in SVG (front + top + right faces + base). */
function GlassCube({ accent }) {
  return (
    <svg className="dbm-cube__svg" viewBox="0 0 180 178" width="100%" aria-hidden preserveAspectRatio="xMidYMid meet">
      {/* ----- wood base (under the glass) ----- */}
      <path d="M130 140 L160 110 L160 138 L130 168 Z" fill="#4e3b25" />
      <path d="M10 140 L130 140 L130 168 L10 168 Z" fill="#6a5036" />
      <path d="M10 140 L130 140 L130 145 L10 145 Z" fill="#7d5e3c" />
      {/* ----- glass cube ----- */}
      {/* right side face (darker, tinted) */}
      <path d="M130 40 L160 10 L160 110 L130 140 Z" fill="rgba(150,172,190,0.33)" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      {/* top face (lightest) */}
      <path d="M10 40 L40 10 L160 10 L130 40 Z" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
      {/* front face (clear) */}
      <path d="M10 40 L130 40 L130 140 L10 140 Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" />
      {/* faint accent tint along the front floor */}
      <path d="M10 120 L130 120 L130 140 L10 140 Z" fill={accent} opacity="0.12" />
      {/* glass sheen band on the front */}
      <path d="M30 40 L54 40 L36 140 L12 140 Z" fill="rgba(255,255,255,0.16)" />
      {/* crisp vertical edges */}
      <line x1="10" y1="40" x2="10" y2="140" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" />
      <line x1="130" y1="40" x2="130" y2="140" stroke="rgba(255,255,255,0.65)" strokeWidth="1.2" />
    </svg>
  );
}

/* A 3D glass display cube labelled Need / Want. Items the learner has sorted
 * into it appear (and stay) inside the cube. */
function SortBox({ kind, label, sub, accent, answers, active }) {
  const items = sortItems.filter((it) => answers[it.id] === kind);
  return (
    <motion.div
      className={`dbm-sortbox dbm-sortbox--${kind} ${active ? 'is-active' : ''}`}
      style={{ '--accent': accent }}
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: active ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
    >
      {/* label tab on TOP */}
      <div className="dbm-sortbox__tab">{label}</div>
      {/* 3D glass display cube — items overlaid inside the front face */}
      <div className="dbm-sortbox__cube">
        <GlassCube accent={accent} />
        <div className="dbm-sortbox__items">
          <AnimatePresence>
            {items.map((it) => (
              <motion.div
                key={it.id}
                className="dbm-sortbox__item"
                initial={{ scale: 0, opacity: 0, y: -12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                title={it.name}
              >
                <ItemArt2D art={it.art} tier={it.id.includes('budget') ? 'budget' : 'premium'} size={34} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="dbm-sortbox__base">
          <span className="dbm-sortbox__sub">{sub}</span>
          <span className="dbm-sortbox__count">{items.length} item{items.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </motion.div>
  );
}

function SortSummary({ mk, accent, narration }) {
  const s = scene('screen-3-sort');
  const answers = mk.state.sortAnswers;
  const needsVal = sortItems.filter((it) => answers[it.id] === 'need').reduce((a, it) => a + it.price, 0);
  const wantsVal = sortItems.filter((it) => answers[it.id] === 'want').reduce((a, it) => a + it.price, 0);
  const total = needsVal + wantsVal || 1;
  const needsPct = Math.round((needsVal / total) * 100);
  const wantsPct = 100 - needsPct;
  // Read ONLY the short summary line aloud (no on-screen Kabir card here).
  const summaryLine = "Nice work! Here's a quick look at what you found.";
  useScreenNarration(narration, [summaryLine]);
  useEffect(() => { sfx('reveal'); }, []);

  return (
    <div className="dbm-screen dbm-screen--sortsum dbm-screen--sortsum-lg">
      <PartyPopper className="dbm-sortsum__pop" />
      <motion.div className="dbm-eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Sparkles size={14} /> Step 4 · The two zones of every budget
      </motion.div>
      <h2 className="dbm-h2 dbm-sort__title">{s.summaryHeading}</h2>

      {/* Start-shopping button moved to the top */}
      <CTA accent={accent} onClick={() => mk.setScreen('screen-4-shop')}><ShoppingBag size={18} /> {s.cta}</CTA>

      <div className="dbm-zonebar">
        <motion.div className="dbm-zonebar__seg dbm-zonebar__seg--need" initial={{ width: 0 }} animate={{ width: `${needsPct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }}>
          {needsPct >= 12 && `${needsPct}%`}
        </motion.div>
        <motion.div className="dbm-zonebar__seg dbm-zonebar__seg--want" initial={{ width: 0 }} animate={{ width: `${wantsPct}%` }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}>
          {wantsPct >= 12 && `${wantsPct}%`}
        </motion.div>
      </div>

      <div className="dbm-zones">
        <ZoneCard kind="need" emoji="🧺" title="Needs · fixed costs" caption="Has to be spent — no choice." value={needsVal} pct={needsPct} color="#10B981" answers={answers} />
        <ZoneCard kind="want" emoji="🛍️" title="Wants · flexible spending" caption="Where your decisions matter." value={wantsVal} pct={wantsPct} color="#A855F7" answers={answers} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, pct }) {
  const v = useCount(value, 900);
  return (
    <motion.div className="dbm-sumcard" style={{ '--c': color }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="dbm-sumcard__label">{label}</div>
      <div className="dbm-sumcard__val">{fmt(v)}</div>
      <div className="dbm-sumcard__pct">{pct}% of total</div>
    </motion.div>
  );
}

/* A "zone" card for the sort summary — fixed-cost Needs vs flexible Wants, with
 * a transparent box showing every item the learner sorted into it. */
function ZoneCard({ kind, emoji, title, caption, value, pct, color, answers }) {
  const v = useCount(value, 1000);
  const items = sortItems.filter((it) => answers[it.id] === kind);
  return (
    <motion.div
      className={`dbm-zone dbm-zone--${kind}`}
      style={{ '--c': color }}
      initial={{ opacity: 0, y: 34, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 16, delay: kind === 'want' ? 0.12 : 0 }}
    >
      <div className="dbm-zone__top">
        <span className="dbm-zone__emoji">{emoji}</span>
        <span className="dbm-zone__pct">{pct}%</span>
      </div>
      <div className="dbm-zone__val">{fmt(v)}</div>
      <div className="dbm-zone__title">{title}</div>
      <div className="dbm-zone__caption">{caption}</div>
      <div className="dbm-zone__box">
        {items.map((it) => (
          <div key={it.id} className="dbm-zone__item" title={it.name}><ItemArt2D art={it.art} tier={it.id.includes('budget') ? 'budget' : 'premium'} size={36} /></div>
        ))}
      </div>
    </motion.div>
  );
}

function DonutTwo({ needs, wants }) {
  const total = needs + wants || 1;
  const r = 63, c = 2 * Math.PI * r, size = 150;
  const nDash = (needs / total) * c;
  return (
    <svg className="dbm-donut2" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#A855F7" strokeWidth="14" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#10B981" strokeWidth="14"
        strokeDasharray={`${nDash} ${c - nDash}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
      <text x="50%" y="54%" textAnchor="middle" className="dbm-donut2__txt">{Math.round((needs / total) * 100)}%<tspan x="50%" dy="16" className="dbm-donut2__sub">Needs</tspan></text>
    </svg>
  );
}

/* ======================================================================
 * SCREEN 4 — Shop Smart (the centerpiece)
 * ====================================================================== */
export function Screen4Shop({ mk, narration, vibe, accent }) {
  const s = scene('screen-4-shop');
  // Read only the intro line aloud — not the sub / tip.
  useScreenNarration(narration, [s.intro]);
  // Entering the shop = a fresh build: blank room, ₹0 spent, ₹2,000 reserve,
  // no leftover event effects. The halfway review then fires only once the
  // learner spends ₹24,000 within THIS run.
  useEffect(() => { mk.resetShop(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [toast, setToast] = useState(null);
  const [shake, setShake] = useState(false);
  const [oppo, setOppo] = useState(null); // { oc, itemId }
  const [midPause, setMidPause] = useState(false); // halfway reflection card
  const midDone = useRef(false);
  const midArmed = useRef(false); // only arm AFTER the cart reset lands (spend low)
  const toastTimer = useRef(null);

  const { spent, spendable, needsCount, cartItems } = mk;
  const inCart = (id) => mk.state.cart.includes(id);
  const valid = needsCount >= s.gates.minNeeds && spent <= spendable;

  // Mid-period review — fires once when half the budget (₹24,000) is spent
  // DURING this run. We arm only after spend has been below the threshold,
  // so a previous run's leftover cart (cleared by resetShop on the next tick)
  // can't trip it the instant the shop mounts.
  useEffect(() => {
    if (spent < 24000) midArmed.current = true;
    if (midArmed.current && !midDone.current && spent >= 24000) {
      midDone.current = true;
      setMidPause(true);
      narration.say('Half the budget is gone. Are your Needs covered? Anything essential still missing? Checking in halfway is a real habit — budgeters call it a mid-period review.');
    }
  }, [spent, narration]);

  const flashToast = (msg, tone = 'bad') => {
    sfx('alert');
    setToast({ msg, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const priceOfSiblingInCart = (item) => {
    const sib = (item.siblings || []).find((id) => inCart(id));
    return sib ? mk.itemIndex[sib].price : 0;
  };

  const handleClick = (item) => {
    if (inCart(item.id)) { sfx('tap'); mk.removeItem(item.id); return; }
    // a table fan needs a desk to sit on — ask the learner to add a Study Desk first
    if (item.id === 'table-fan' && !inCart('study-desk')) {
      flashToast('Add a Study Desk first — the table fan sits on the desk.', 'warn');
      setShake(true); setTimeout(() => setShake(false), 500);
      return;
    }
    const projected = spent - priceOfSiblingInCart(item) + item.price;
    if (projected > spendable) {
      flashToast(s.gates.overBudgetMessage);
      setShake(true); setTimeout(() => setShake(false), 500);
      return;
    }
    // opportunity-cost teaching moment (premium upgrades)
    const oc = s.opportunityCosts.find((o) => o.when.added === item.id && inCart(o.when.removed));
    if (oc) { sfx('freeze'); setOppo({ oc, itemId: item.id }); return; }
    sfx('add'); mk.addItem(item.id);
  };

  const confirmOppo = () => {
    if (oppo) { sfx('add'); mk.addItem(oppo.itemId); }
    setOppo(null);
  };

  const tryProceed = () => {
    if (needsCount < s.gates.minNeeds) { flashToast(s.gates.insufficientNeedsMessage); return; }
    if (spent > spendable) { flashToast(s.gates.overBudgetMessage); return; }
    sfx('ding'); mk.setScreen('screen-5-events');
  };

  return (
    <div className="dbm-screen dbm-screen--shop">
      <div className="dbm-shop">
        {/* LEFT — sticky live 3D room + budget tracker */}
        <div className={`dbm-shop__left ${shake ? 'is-shake' : ''}`}>
          <div className="dbm-shop__roomwrap">
            <Room3D vibe={vibe} cart={mk.state.cart} className="dbm-shop__room" />
            <div className="dbm-shop__roomtag">Live 3D preview · {cartItems.length} items</div>
          </div>
          <Tracker mk={mk} bands={BANDS} />
        </div>

        {/* RIGHT — catalogue */}
        <div className="dbm-shop__right">
          <div className="dbm-shop__header">
            <h2 className="dbm-h2">Shop smart</h2>
            <p className="dbm-shop__intro">{s.intro}</p>
            <p className="dbm-shop__sub"><Lock size={12} /> {s.sub}</p>
            <p className="dbm-shop__tip"><Sparkles size={12} /> {s.tip}</p>
          </div>

          {Object.entries(catalogue).map(([catId, cat]) => (
            <div key={catId} className="dbm-catgroup">
              <div className="dbm-catgroup__head" style={{ '--c': cat.color }}>
                <span className="dbm-catgroup__icon">{cat.icon}</span> {cat.label}
              </div>
              <div className="dbm-catgroup__items">
                {cat.items.map((item) => {
                  const selected = inCart(item.id);
                  const projected = spent - priceOfSiblingInCart(item) + item.price;
                  const wouldOver = !selected && projected > spendable;
                  return (
                    <ShopCard key={item.id} item={item} selected={selected} wouldOver={wouldOver} color={cat.color} onClick={() => handleClick(item)} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* sticky action bar */}
      <div className="dbm-shop__action">
        <div className="dbm-shop__needs">
          <span className={needsCount >= s.gates.minNeeds ? 'is-ok' : ''}>
            {needsCount >= s.gates.minNeeds ? <Check size={14} /> : null}
            {needsCount}/{s.gates.minNeeds} Needs
          </span>
          <span className="dbm-shop__remain">{fmt(mk.remaining)} left</span>
        </div>
        <motion.button
          className="dbm-cta dbm-shop__go"
          style={{ '--accent': accent }}
          onClick={tryProceed}
          animate={valid ? { scale: [1, 1.05, 1] } : {}}
          transition={valid ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.4 } : {}}
          data-valid={valid}
        >
          {s.cta} <ArrowRight size={17} />
        </motion.button>
      </div>

      <Toast show={!!toast} tone={toast?.tone}>{toast?.msg}</Toast>

      <AnimatePresence>
        {oppo && <OpportunityModal oc={oppo.oc} mk={mk} accent={accent} onConfirm={confirmOppo} onCancel={() => { sfx('tap'); setOppo(null); }} />}
      </AnimatePresence>

      {/* halfway mid-period review pause */}
      <AnimatePresence>
        {midPause && (
          <motion.div className="dbm-modal__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="dbm-midpause"
              initial={{ scale: 0.85, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <motion.div className="dbm-midpause__ring" animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
              <div className="dbm-midpause__icon">⏸️</div>
              <div className="dbm-midpause__bar">
                <span style={{ width: '50%' }} />
              </div>
              <h3 className="dbm-midpause__title">Halfway check-in</h3>
              <p className="dbm-midpause__text">Half the budget is gone. Are your Needs covered? Anything essential still missing? Checking in halfway is a real habit — budgeters call it a <strong>mid-period review</strong>.</p>
              <button className="dbm-midpause__btn" onClick={() => { sfx('tap'); setMidPause(false); }}>
                Continue Shopping <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShopCard({ item, selected, wouldOver, color, onClick }) {
  const premium = item.tier === 'premium';
  const [hover, setHover] = useState(false);
  const has3D = !!ITEM_POS[item.id];
  return (
    <motion.button
      className={`dbm-shopcard ${selected ? 'is-selected' : ''} ${wouldOver ? 'is-over' : ''} ${premium ? 'is-premium' : ''} ${item.tier === 'budget' ? 'is-budget' : ''}`}
      style={{ '--c': color }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      layout
    >
      <div className="dbm-shopcard__badge" data-type={item.type}>{item.type === 'need' ? 'Need' : 'Want'}</div>
      {item.tierLabel && <div className={`dbm-shopcard__tier dbm-shopcard__tier--${item.tier}`}>{item.tierLabel}</div>}
      <div className={`dbm-shopcard__art ${hover && has3D ? 'is-3d' : ''}`}>
        <ItemArt2D art={item.art} tier={item.tier} size={64} className="dbm-shopcard__art3d" />
        {hover && has3D && <div className="dbm-shopcard__preview3d"><ItemPreview3D itemId={item.id} /></div>}
        {premium && <span className="dbm-shopcard__crown">👑</span>}
      </div>
      <div className="dbm-shopcard__name">{item.name}</div>
      <div className="dbm-shopcard__price">{fmt(item.price)}</div>
      <div className="dbm-shopcard__add">
        {selected ? <><Check size={14} /> Added</> : wouldOver ? 'Over budget' : <>+ Add</>}
      </div>
    </motion.button>
  );
}

function OpportunityModal({ oc, mk, accent, onConfirm, onCancel }) {
  const tradeItems = (oc.tradeFor || []).map((id) => mk.itemIndex[id]).filter(Boolean);
  return (
    <motion.div className="dbm-modal__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="dbm-modal" style={{ '--accent': accent }} initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}>
        <div className="dbm-modal__icon">⚖️</div>
        <h3>{oc.title}</h3>
        <p>{oc.message}</p>
        <div className="dbm-modal__trade">
          <span>That money could buy:</span>
          <div className="dbm-modal__tradeitems">
            {tradeItems.map((it) => (
              <div key={it.id} className="dbm-modal__tradeitem">
                <ItemArt art={it.art} size={40} />
                <small>{it.name}</small>
                <b>{fmt(it.price)}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="dbm-modal__actions">
          <button className="dbm-modal__no" onClick={onCancel}>Keep my pick</button>
          <button className="dbm-modal__yes" onClick={onConfirm}>Upgrade anyway</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ======================================================================
 * SCREEN 5 — Surprise Events
 * ====================================================================== */
export function Screen5Events({ mk, narration, vibe, accent }) {
  const s = scene('screen-5-events');
  const [phase, setPhase] = useState('intro'); // intro | fixed | spin | random | done
  const [cons, setCons] = useState(null);
  const n = useScreenNarration(narration, [s.intro]);

  const fixed = surpriseEvents.fixedEvent;
  const randomEv = mk.state.randomEvent;

  const pickFixed = (opt) => {
    sfx(fixed.bad ? 'alert' : 'ding');
    mk.applyEventEffect('fixed', opt.id, opt.effect);
    setCons({ text: opt.consequence, next: () => setPhase('spin') });
    narration.say(opt.consequence);
  };

  // The wheel lands on the chosen event, then reveals its decision card.
  const onWheelResult = (ev) => { mk.setRandomEvent(ev); setPhase('random'); };

  const pickRandom = (opt) => {
    sfx(randomEv.good ? 'ding' : 'alert');
    mk.applyEventEffect('random', opt.id, opt.effect);
    setCons({ text: opt.consequence, next: () => { setPhase('closing'); narration.say(s.closingLine); } });
    narration.say(opt.consequence);
  };

  return (
    <div className="dbm-screen dbm-screen--events">
      {/* top surprise line (read aloud via the intro narration) */}
      <motion.div className="dbm-events__toptext" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Mail size={16} /> {phase === 'closing' ? 'Surprises resolved' : "You've got a surprise waiting"}
      </motion.div>

      <div className="dbm-events__grid">
        <div className="dbm-events__stage">
          {phase === 'intro' && (
            <motion.div className="dbm-envelope" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <NarratorCard narration={narration} lines={[s.intro]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact size={78} />
              <motion.div className="dbm-envelope__icon" animate={{ rotate: [0, -4, 4, 0], y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.6 }}>
                <Mail size={56} />
              </motion.div>
              <p className="dbm-envelope__line">{s.envelopeLine}</p>
              <CTA accent={accent} disabled={!n.done} onClick={() => { sfx('reveal'); setPhase('fixed'); }}>{s.envelopeCta}</CTA>
            </motion.div>
          )}

          {phase === 'fixed' && (
            <EventCard event={fixed} accent={accent} onPick={pickFixed} />
          )}

          {phase === 'spin' && (
            <motion.div className="dbm-spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="dbm-h2" style={{ color: '#fff' }}>One more twist…</h2>
              <p className="dbm-envelope__line">{s.spinLine}</p>
              <SpinWheel events={surpriseEvents.randomEvents} accent={accent} cta={s.spinCta} onResult={onWheelResult} />
            </motion.div>
          )}

          {phase === 'random' && randomEv && (
            <EventCard event={randomEv} accent={accent} onPick={pickRandom} />
          )}

          {phase === 'closing' && (
            <motion.div className="dbm-eventcard is-good" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="dbm-eventcard__tag">✅ Lesson learnt</div>
              <div className="dbm-envelope__icon" style={{ fontSize: 44 }}>🛡️</div>
              <p className="dbm-eventcard__text">{s.closingLine}</p>
              <CTA accent={accent} onClick={() => mk.setScreen('screen-6-snapshot')}>See my spending snapshot</CTA>
            </motion.div>
          )}
        </div>

        {/* bigger live 3D room */}
        <div className="dbm-events__side">
          <div className="dbm-events__roomwrap">
            <Room3D vibe={vibe} cart={mk.state.cart} className="dbm-events__room" />
            <div className="dbm-shop__roomtag">Live room · updates with each choice</div>
          </div>
        </div>
      </div>

      {/* expense tracker below the envelope / events */}
      <div className="dbm-events__tracker"><Tracker mk={mk} bands={BANDS} /></div>

      <AnimatePresence>
        {cons && <ConsequenceModal text={cons.text} accent={accent} onClose={() => { const nx = cons.next; setCons(null); nx?.(); }} />}
      </AnimatePresence>
    </div>
  );
}

/* An interactive prize wheel — one coloured segment per random event. It
 * spins ~5 turns, decelerates onto a randomly chosen segment, then hands the
 * landed event back to the parent so its decision card can appear. */
const WHEEL_EMOJI = { coupon: '🎟️', gift: '🎁', electrician: '🔧', 'delivery-charge': '📦' };
const WHEEL_FILL  = { coupon: '#10b981', gift: '#22c55e', electrician: '#f59e0b', 'delivery-charge': '#ef4444' };
function SpinWheel({ events, accent, cta, onResult }) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const landed = useRef(null);
  const n = events.length;
  const seg = 360 / n;
  const R = 96, C = 100;
  const pt = (deg, r = R) => [C + r * Math.sin((deg * Math.PI) / 180), C - r * Math.cos((deg * Math.PI) / 180)];

  const spin = () => {
    if (spinning || landed.current) return;
    setSpinning(true);
    sfx('reveal');
    const i = Math.floor(Math.random() * n);
    landed.current = events[i];
    // 5 full turns, then bring segment i's centre under the top pointer.
    setRot(360 * 5 - i * seg);
  };

  return (
    <div className="dbm-wheelwrap">
      <div className="dbm-wheel__pointer" aria-hidden>▼</div>
      <motion.svg
        className="dbm-wheel3" width={210} height={210} viewBox="0 0 200 200"
        animate={{ rotate: rot }} transition={{ duration: 3.6, ease: [0.18, 0.9, 0.2, 1] }}
        onAnimationComplete={() => { if (spinning && landed.current) onResult(landed.current); }}
      >
        <circle cx={C} cy={C} r={R + 3} fill="#1b1830" stroke="rgba(255,255,255,.25)" strokeWidth="2" />
        {events.map((ev, i) => {
          const a0 = i * seg - seg / 2, a1 = i * seg + seg / 2;
          const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
          const [lx, ly] = pt(i * seg, R * 0.62);
          return (
            <g key={ev.id}>
              <path d={`M${C} ${C} L${x0} ${y0} A${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${x1} ${y1} Z`}
                fill={WHEEL_FILL[ev.id] || accent} stroke="rgba(0,0,0,.25)" strokeWidth="1" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize="26"
                transform={`rotate(${i * seg} ${lx} ${ly})`}>{WHEEL_EMOJI[ev.id] || '🎲'}</text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r="16" fill="#fff" stroke="rgba(0,0,0,.2)" strokeWidth="1" />
        <circle cx={C} cy={C} r="6" fill={accent} />
      </motion.svg>
      <CTA accent={accent} disabled={spinning} onClick={spin}>{spinning ? 'Spinning…' : cta}</CTA>
    </div>
  );
}

function EventCard({ event, accent, onPick }) {
  const bad = event.bad;
  return (
    <motion.div className={`dbm-eventcard ${bad ? 'is-bad' : 'is-good'}`} initial={{ opacity: 0, y: 24, rotateX: 12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}>
      <div className="dbm-eventcard__tag">{bad ? '⚠️ Surprise' : '🎁 Good news'}</div>
      <h3 className="dbm-eventcard__title">{event.title}</h3>
      <p className="dbm-eventcard__text">{event.text}</p>
      <div className="dbm-eventcard__options">
        {event.options.map((opt) => (
          <button key={opt.id} className="dbm-eventopt" style={{ '--accent': accent }} onClick={() => onPick(opt)}>
            {opt.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ConsequenceModal({ text, accent, onClose }) {
  return (
    <motion.div className="dbm-modal__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="dbm-modal" style={{ '--accent': accent }} initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}>
        <div className="dbm-modal__icon">💡</div>
        <p className="dbm-modal__cons">{text}</p>
        <div className="dbm-modal__actions">
          <button className="dbm-modal__yes" onClick={onClose}>Got it</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ======================================================================
 * SCREEN 6 — Spending Snapshot
 * ====================================================================== */
export function Screen6Snapshot({ mk, narration, accent, onComplete }) {
  const s = scene('screen-6-snapshot');
  const n = useScreenNarration(narration, [s.intro]);
  useEffect(() => { sfx('reveal'); }, []);

  const { spent, categoryTotals, needsTotal, wantsTotal, budget } = mk;
  const reserveStatus = mk.state.reserve >= 2000 ? 'intact' : 'used';
  const saved = (budget.total) - spent - mk.state.reserve + (mk.state.savings || 0);

  const insights = useMemo(() => buildInsights(s.insightTemplates, { categoryTotals, spent, wantsTotal, reserveStatus }), [categoryTotals, spent, wantsTotal, reserveStatus, s.insightTemplates]);

  const catRows = Object.entries(catalogue).map(([id, cat]) => ({ id, label: cat.label, color: cat.color, val: categoryTotals[id] || 0 }));
  const biggest = catRows.reduce((a, b) => (b.val > a.val ? b : a), catRows[0]);

  const [mcq, setMcq] = useState(mk.state.snapshotMcq);
  const answerMcq = (id) => {
    if (mcq) return;
    sfx(id === biggest.id ? 'ding' : 'tap');
    setMcq(id); mk.setSnapshotMcq(id);
    // No extra voice here — Scene 7 narrates only once (the intro line).
  };

  return (
    <div className="dbm-screen dbm-screen--snapshot">
      <motion.div className="dbm-eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Sparkles size={14} /> Your room is ready 🎉
      </motion.div>
      <h2 className="dbm-h2 dbm-snap__title">Here's your spending breakdown</h2>
      <NarratorCard narration={narration} lines={[s.intro]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />

      <div className="dbm-snap__grid dbm-snap__panel">
        <div className="dbm-snap__donut">
          <Donut categoryTotals={categoryTotals} spent={spent} size={180} />
        </div>

        <div className="dbm-snap__stats">
          <SnapStat label="Spent" value={spent} color={accent} />
          <SnapStat label="Saved / left" value={Math.max(0, saved)} color="#10B981" />
          <SnapStat label="Needs" value={needsTotal} color="#10B981" />
          <SnapStat label="Wants" value={wantsTotal} color="#A855F7" />
          <div className={`dbm-snap__reserve ${reserveStatus}`}>
            <Lock size={14} /> Reserve {reserveStatus === 'intact' ? 'kept safe' : 'used'} · {fmt(mk.state.reserve)}
          </div>
        </div>

        <div className="dbm-snap__cats">
          {catRows.map((c) => (
            <div key={c.id} className="dbm-snap__catrow">
              <span className="dbm-snap__catdot" style={{ background: c.color }} />
              <span className="dbm-snap__catlbl">{c.label}</span>
              <div className="dbm-snap__catbar"><motion.div animate={{ width: `${spent ? (c.val / spent) * 100 : 0}%` }} style={{ background: c.color }} /></div>
              <span className="dbm-snap__catval">{fmt(c.val)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dbm-snap__insights">
        {insights.map((t, i) => (
          <motion.div key={i} className="dbm-insight" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }}>
            <Sparkles size={15} /> {t}
          </motion.div>
        ))}
      </div>

      {/* MCQ */}
      <div className="dbm-mcq">
        <div className="dbm-mcq__q">{s.mcq.question}</div>
        <div className="dbm-mcq__opts">
          {catRows.map((c) => {
            const chosen = mcq === c.id;
            const correct = c.id === biggest.id;
            return (
              <button key={c.id} className={`dbm-mcq__opt ${mcq ? (correct ? 'is-correct' : chosen ? 'is-wrong' : 'is-dim') : ''}`} onClick={() => answerMcq(c.id)} disabled={!!mcq}>
                {c.label}
                {mcq && correct && <Check size={15} />}
                {mcq && chosen && !correct && <X size={15} />}
              </button>
            );
          })}
        </div>
        {mcq && (
          <motion.div className="dbm-mcq__fb" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {mcq === biggest.id ? `Correct! ${biggest.label} took the biggest chunk — ${fmt(biggest.val)}.` : `Actually, ${biggest.label} took the most — ${fmt(biggest.val)}. Check your tracker!`}
          </motion.div>
        )}
      </div>

      <div className="dbm-snap__transition">
        <Trophy size={20} />
        <strong>{s.transitionTitle}</strong>
        <span>{s.transitionSub}</span>
      </div>

      <CTA accent={accent} disabled={!n.done || !mcq} onClick={() => onComplete?.()} big>{s.cta}</CTA>
    </div>
  );
}

function SnapStat({ label, value, color }) {
  const v = useCount(value, 800);
  return (
    <div className="dbm-snapstat" style={{ '--c': color }}>
      <span className="dbm-snapstat__lbl">{label}</span>
      <span className="dbm-snapstat__val">{fmt(v)}</span>
    </div>
  );
}

function buildInsights(templates, ctx) {
  const out = [];
  const { categoryTotals, spent, wantsTotal, reserveStatus } = ctx;
  const total = spent || 1;
  templates.forEach((t) => {
    const m = t.match;
    if (m.categoryShareGte) {
      const [cat, gte] = Object.entries(m.categoryShareGte)[0];
      if ((categoryTotals[cat] || 0) / total >= gte) out.push(t.template.replace('{furniturePct}', Math.round((categoryTotals[cat] || 0) / total * 100)));
    } else if (m.wantsShareGte != null) {
      if (wantsTotal / total >= m.wantsShareGte) out.push(t.template.replace('{wantsPct}', Math.round(wantsTotal / total * 100)));
    } else if (m.reserveStatus) {
      if (m.reserveStatus === reserveStatus) out.push(t.template);
    }
  });
  if (!out.length) out.push('Nicely balanced! You spread your budget across needs and a few wants.');
  return out;
}
