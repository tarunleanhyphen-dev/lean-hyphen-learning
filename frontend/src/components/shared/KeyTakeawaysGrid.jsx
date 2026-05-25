import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Lock, Check, ChevronRight,
  Pause, Coins, AlertTriangle, Clock, Target,
} from 'lucide-react';

/**
 * Act 4's Key Takeaways grid — v2 "Premium edtech rule cards".
 *
 * Design influences: Duolingo lesson-tree nodes, Brilliant insight
 * cards, Headspace daily-meditation tiles.
 *
 * Each rule renders as a tall, premium gradient card (one of five
 * colour families: sky / amber / rose / emerald / purple). When
 * locked the card is monochrome with a lock glyph + "Locked"
 * status. When it's the next-to-reveal it surfaces with a pulsing
 * "Tap to unlock" CTA + active accent. When opened, a stamped ✓
 * badge rotates in, the content slides up, and a "+1 rule
 * unlocked" toast pops above the card (Duolingo XP-gain style).
 *
 * Sequential unlock — the next card stays locked until the previous
 * one is revealed. Once all five are open the identity statement
 * card slides in with shimmer + sparkles.
 */

/* Resolve a card's `icon` (string name from the lesson data) to an
 * actual lucide component. Keeps the data file readable and avoids
 * importing lucide inside the data module. */
const ICON_MAP = {
  Pause,
  Coins,
  AlertTriangle,
  Clock,
  Target,
};

export default function KeyTakeawaysGrid({
  data,
  onCueClick,
  speakingDone = true,
  onComplete,
}) {
  // Set of card ids currently revealed.
  const [revealed, setRevealed] = useState(() => new Set());
  // Index of the card that just unlocked — drives the "+1 unlocked" toast.
  const [justUnlocked, setJustUnlocked] = useState(null);

  const total = data.cards.length;
  const allRevealed = revealed.size === total;
  // Index of the next-tappable card; -1 if all revealed.
  const nextIdx = data.cards.findIndex((c) => !revealed.has(c.id));

  const handleReveal = (cardId, idx) => {
    if (revealed.has(cardId)) return;
    if (idx !== nextIdx) return;
    onCueClick?.();
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
    setJustUnlocked(idx);
    // Auto-dismiss the toast after a short window.
    setTimeout(() => setJustUnlocked((cur) => (cur === idx ? null : cur)), 1600);
  };

  return (
    <div className="flex flex-col gap-3">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-500">
          📜 The Five · take them with you
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">
          {data.title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-700 sm:text-[14px]">
          {data.instruction}
        </p>
      </header>

      {/* Progress strip — five chunky pips that fill as cards unlock */}
      <ProgressStrip cards={data.cards} revealed={revealed} />

      {/* The five rule cards */}
      <div className="flex flex-col gap-2.5">
        {data.cards.map((card, i) => {
          const isOpen = revealed.has(card.id);
          const isNext = i === nextIdx;
          return (
            <RuleCard
              key={card.id}
              card={card}
              index={i}
              total={total}
              state={isOpen ? 'open' : isNext ? 'next' : 'locked'}
              onReveal={() => handleReveal(card.id, i)}
              showToast={justUnlocked === i}
            />
          );
        })}
      </div>

      {/* Identity statement card — only once all five rules are open */}
      <AnimatePresence>
        {allRevealed && data.identity && (
          <IdentityCard key="identity" text={data.identity} />
        )}
      </AnimatePresence>

      {/* Finish Act 4 */}
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={() => speakingDone && allRevealed && onComplete?.({ activity: 'takeaways-grid' })}
          disabled={!speakingDone || !allRevealed}
          className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500 px-5 py-2 text-[12px] font-bold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Finish Act 4
        </button>
      </div>
    </div>
  );
}

/* ===========================================================================
 * Progress strip — five pips with gradient fill + a counter.
 * =========================================================================== */
function ProgressStrip({ cards, revealed }) {
  return (
    <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-widest text-ink-500">
      <span className="shrink-0">{revealed.size} / {cards.length} unlocked</span>
      <div className="flex flex-1 items-center gap-1.5">
        {cards.map((c) => {
          const open = revealed.has(c.id);
          return (
            <motion.div
              key={c.id}
              initial={false}
              animate={{
                background: open
                  ? 'linear-gradient(90deg, rgb(245 180 58) 0%, rgb(255 90 74) 100%)'
                  : 'rgba(154, 144, 174, 0.25)',
              }}
              transition={{ duration: 0.4 }}
              className="h-1.5 flex-1 rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
}

/* ===========================================================================
 * RuleCard — locked / next / open states with their own animations.
 * =========================================================================== */
function RuleCard({ card, index, total, state, onReveal, showToast }) {
  const isOpen = state === 'open';
  const isNext = state === 'next';
  const isLocked = state === 'locked';
  const Icon = ICON_MAP[card.icon] || Sparkles;

  return (
    <motion.button
      type="button"
      onClick={onReveal}
      disabled={isLocked || isOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isLocked ? 0.55 : 1,
        y: 0,
        scale: isOpen ? 1 : isNext ? 1 : 0.99,
      }}
      transition={{ delay: 0.04 + index * 0.05, type: 'spring', stiffness: 240, damping: 24 }}
      whileHover={isNext ? { scale: 1.01, y: -2 } : {}}
      whileTap={isNext ? { scale: 0.99 } : {}}
      className={[
        'group relative w-full overflow-hidden rounded-2xl text-left transition-shadow',
        isOpen
          ? `bg-gradient-to-br ${card.gradient} text-white shadow-xl ring-1 ring-white/20`
          : isNext
            ? 'bg-white text-ink-900 shadow-md ring-1 ring-ink-300/30 hover:shadow-lg cursor-pointer'
            : 'bg-ink-300/10 text-ink-500 shadow-none ring-1 ring-ink-300/20 cursor-not-allowed',
      ].join(' ')}
    >
      {/* Shimmer sweep on opened cards */}
      {isOpen && (
        <motion.span
          aria-hidden
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      )}

      {/* Pulsing "tap me" outer halo on the active card */}
      {isNext && (
        <motion.span
          aria-hidden
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.005, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className={`pointer-events-none absolute inset-0 rounded-2xl ${card.ring} ring-2`}
        />
      )}

      {/* "+1 rule unlocked" toast — pops on first reveal */}
      <AnimatePresence>
        {showToast && (
          <motion.span
            key="toast"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-saffron-600 shadow-lg ring-1 ring-saffron-500/40"
          >
            +1 unlocked
          </motion.span>
        )}
      </AnimatePresence>

      <div className="relative flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Icon puck */}
        <motion.span
          animate={isOpen ? { scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] } : {}}
          transition={isOpen ? { duration: 0.6 } : {}}
          className={[
            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-md ring-1 sm:h-14 sm:w-14',
            isOpen
              ? 'bg-white/20 text-white ring-white/30 backdrop-blur-sm'
              : isNext
                ? `bg-gradient-to-br ${card.gradient} text-white ring-white/40`
                : 'bg-ink-300/20 text-ink-500 ring-ink-300/20',
          ].join(' ')}
        >
          {isOpen || isNext
            ? <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.4} />
            : <Lock className="h-5 w-5" strokeWidth={2.4} />}
        </motion.span>

        {/* Title / body */}
        <div className="min-w-0 flex-1">
          <div className={[
            'text-[10.5px] font-extrabold uppercase tracking-widest',
            isOpen ? 'text-white/85' : isNext ? card.accent : 'text-ink-500',
          ].join(' ')}>
            Rule {index + 1} of {total}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.div
                key="open"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="text-[15px] font-extrabold leading-tight sm:text-[17px]">
                  {card.title}
                </div>
                <div className="mt-1 text-[12.5px] leading-snug opacity-95 sm:text-[13.5px]">
                  {card.body}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-0.5 flex items-center gap-1"
              >
                <span className="text-[13px] font-semibold leading-tight">
                  {isNext ? 'Tap to unlock the next rule' : 'Locked'}
                </span>
                {isNext && (
                  <motion.span
                    aria-hidden
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className={`ml-1 ${card.accent}`}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right-side state badge */}
        <span className="shrink-0">
          {isOpen ? (
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-900 shadow ring-1 ring-white/40"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </motion.span>
          ) : (
            <span className={[
              'grid h-7 w-7 place-items-center rounded-full text-[11px] font-extrabold ring-1',
              isNext
                ? `bg-white ${card.accent} ${card.ring}`
                : 'bg-ink-300/15 text-ink-500 ring-ink-300/30',
            ].join(' ')}>
              {index + 1}
            </span>
          )}
        </span>
      </div>
    </motion.button>
  );
}

/* ===========================================================================
 * IdentityCard — final closing statement once all rules are revealed.
 * =========================================================================== */
function IdentityCard({ text }) {
  const sparkles = Array.from({ length: 8 }, (_, k) => ({
    id: k,
    x: 10 + (k * 47) % 80,
    y: 10 + (k * 31) % 70,
    delay: 0.1 + (k * 0.12),
  }));
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-saffron-500 via-coral-500 to-burgundy-500 p-5 text-white shadow-2xl ring-1 ring-white/20"
    >
      {/* Shimmer sweep */}
      <motion.span
        aria-hidden
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      {/* Sparkle dots */}
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          aria-hidden
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.1, 0.5] }}
          transition={{ duration: 1.6, delay: s.delay, repeat: Infinity, repeatDelay: 1.4 }}
          className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.7)]"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
      <div className="relative">
        <div className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] opacity-90">
          🪞 Say it once. Then carry it.
        </div>
        <div className="mt-2 text-[18px] font-extrabold leading-snug sm:text-[22px] md:text-[24px]">
          "{text}"
        </div>
      </div>
    </motion.div>
  );
}
