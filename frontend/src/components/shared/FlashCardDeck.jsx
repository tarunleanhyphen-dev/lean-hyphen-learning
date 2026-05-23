import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Clock, Sparkles, Gift, TrendingUp, RotateCw } from 'lucide-react';
import { cancelSpeech } from '../../utils/sounds.js';

/**
 * 3-card flip-card deck used in Act 2 Scene 8 to explain how impulse
 * buying works. Each card has a FRONT (title + subtitle + tap-to-reveal
 * cue) and a BACK (per-card visual + body). Tapping the card flips it
 * 3D-style; the TTS only fires when the card is flipped to its back,
 * so the learner hears the explanation only after they've engaged.
 *
 *   – Card 1 'countdown'  → ticking timer + "ONLY 2 LEFT" pulsing chip
 *   – Card 2 'triggers'   → three labelled tiles (Recommended / Trending / FREE)
 *   – Card 3 'addition'   → small purchases stacking up to a big total
 *
 * Props mirror FrameworkCard so Act2.jsx can route to it:
 *   data        — the `flashCards` block from act2Activities
 *   onReveal    — fires once per card on first FLIP; pipes title+body to TTS
 *   speakingDone— gates the Finish button (so finish-act doesn't fire
 *                 while the closer line is still being spoken)
 *   onComplete  — called once with `{ activity: 'flash-cards' }`
 */
export default function FlashCardDeck({ data, onReveal, speakingDone = true, onComplete }) {
  const [idx, setIdx] = useState(0);

  /* TRUE one-by-one model:
   *   - Each card lands on its FRONT face when navigated to.
   *   - Tap the card → flips to back, plays TTS, marks "seen".
   *   - Next button is disabled until the current card has been tapped.
   *   - Back / dot navigation goes to the target card and ALWAYS resets
   *     to FRONT face (so the learner has to re-tap → TTS replays).
   *   - Finish is enabled only after all cards have been seen at least
   *     once + the TTS queue is idle.
   *
   * State model:
   *   `revealedCurrent`  — has the current card been tapped this visit?
   *                        Resets to false on every idx change.
   *   `seen`             — Set<cardId> of cards tapped at any point.
   *                        Drives the Finish button + closer line. */
  const [revealedCurrent, setRevealedCurrent] = useState(false);
  const [seen, setSeen] = useState(() => new Set());

  // Strict-mode guard for the reset effect so it can't double-trigger.
  const lastResetIdxRef = useRef(-1);

  useEffect(() => {
    if (lastResetIdxRef.current === idx) return;
    lastResetIdxRef.current = idx;
    // New card visit — flip back to FRONT face and stop any in-flight
    // TTS from the previous card.
    setRevealedCurrent(false);
    cancelSpeech();
  }, [idx]);

  const card = data.cards[idx];
  const total = data.cards.length;
  const isLast = idx === total - 1;
  const isFlipped = revealedCurrent;
  const allSeen = seen.size === total;

  const handleFlip = () => {
    // Tap-to-reveal is a one-way action per card visit. A second tap
    // on an already-flipped card does nothing (use Back to revisit).
    if (revealedCurrent) return;
    cancelSpeech();
    setRevealedCurrent(true);
    setSeen((prev) => (prev.has(card.id) ? prev : new Set(prev).add(card.id)));
    onReveal?.(card);
  };

  const goNext = () => {
    if (isLast) return;
    if (!revealedCurrent) return; // must reveal current card first
    cancelSpeech();
    setIdx((i) => i + 1);
  };
  const goBack = () => {
    if (idx <= 0) return;
    cancelSpeech();
    setIdx((i) => i - 1);
  };
  const goToDot = (i) => {
    if (i === idx) return;
    cancelSpeech();
    setIdx(i);
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-500">
          🃏 Flash cards · {idx + 1} of {total}
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{data.title}</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-700 sm:text-[13px]">{data.intro}</p>
      </header>

      {/* Flip-card carousel.
         The outer wrapper handles the slide-between-cards transition;
         the inner motion.article handles the 3D flip via rotateY. */}
      <div className="relative" style={{ perspective: 1400 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative"
          >
            <motion.article
              role="button"
              tabIndex={0}
              onClick={handleFlip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFlip();
                }
              }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.75, ease: [0.2, 0.7, 0.3, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative min-h-[460px] cursor-pointer select-none sm:min-h-[500px]"
            >
              {/* FRONT — title + subtitle + tap cue */}
              <div
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-coral-500 via-burgundy-500 to-saffron-500 p-5 text-white shadow-lg ring-1 ring-white/10"
              >
                {/* Soft shimmer behind everything */}
                <motion.span
                  aria-hidden
                  initial={{ x: '-120%' }}
                  animate={{ x: '120%' }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
                <div className="relative flex h-full flex-col">
                  <div className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-white/80">
                    Card {idx + 1} of {total}
                  </div>
                  <div className="mt-auto flex flex-col items-center text-center">
                    <motion.span
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      className="grid h-20 w-20 place-items-center rounded-3xl bg-white/15 text-5xl ring-1 ring-white/30 backdrop-blur-sm"
                    >
                      {card.emoji}
                    </motion.span>
                    <div className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
                      {card.title}
                    </div>
                    {card.subtitle && (
                      <div className="mt-1 text-[13px] font-semibold text-white/90 sm:text-[14px]">
                        {card.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-center gap-1.5 pt-4 text-[11px] font-bold uppercase tracking-widest text-white/85">
                    <RotateCw className="h-3.5 w-3.5" />
                    Tap card to reveal
                  </div>
                </div>
              </div>

              {/* BACK — visual + body. overflow-y-auto so taller cards
                  (card 3's stacked totals) stay scrollable on phones. */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className="absolute inset-0 overflow-y-auto overflow-x-hidden rounded-2xl bg-gradient-to-br from-cream-50 to-white p-4 shadow-sm ring-1 ring-ink-300/15 sm:p-5"
              >
                <div className="flex min-h-full flex-col">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-coral-500 to-burgundy-500 text-xl text-white shadow-md">
                      {card.emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-coral-500">
                        Card {idx + 1}
                      </div>
                      <div className="text-[15.5px] font-extrabold leading-tight text-ink-900 sm:text-[17px]">
                        {card.title}
                      </div>
                      {card.subtitle && (
                        <div className="text-[11px] text-ink-500">{card.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <CardVisual kind={card.visual} />
                  </div>

                  <p className="mt-3 pb-1 text-[13px] leading-relaxed text-ink-700 sm:text-[13.5px]">
                    {card.body}
                  </p>
                </div>
              </div>
            </motion.article>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicator */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {data.cards.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => goToDot(i)}
              className={[
                'h-1.5 rounded-full transition-all',
                i === idx ? 'w-6 bg-coral-500' : 'w-1.5 bg-ink-300/40 hover:bg-ink-300/60',
              ].join(' ')}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goBack}
          disabled={idx === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-300/20 bg-white px-3 py-2 text-[11.5px] font-semibold text-ink-700 transition hover:bg-cream-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        {!isLast ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!isFlipped}
            className="inline-flex items-center gap-1.5 rounded-full bg-coral-500 px-4 py-2 text-[11.5px] font-bold text-white shadow-sm transition hover:bg-coral-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next card <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => speakingDone && allSeen && onComplete?.()}
            disabled={!speakingDone || !allSeen}
            className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500 px-5 py-2 text-[11.5px] font-bold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" /> Finish Act 2
          </button>
        )}
      </div>

      {data.closer && allSeen && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-saffron-500/15 to-coral-500/10 p-3 text-[12.5px] font-semibold text-ink-900 ring-1 ring-saffron-500/30"
        >
          ✨ {data.closer}
        </motion.p>
      )}
    </div>
  );
}

/* Per-card visual — each kind renders a small illustrative widget so
 * the card lands with more punch than just text + emoji. */
function CardVisual({ kind }) {
  if (kind === 'countdown') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy-500 via-coral-500 to-saffron-500 p-4 text-white shadow-lg">
        <motion.span
          aria-hidden
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />
        <div className="relative flex items-center justify-between gap-3">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2"
          >
            <Clock className="h-7 w-7" strokeWidth={2.6} />
            <div className="flex flex-col leading-none">
              <span className="text-[26px] font-extrabold tabular-nums">04:32</span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-90">offer ends in</span>
            </div>
          </motion.div>
          <motion.div
            animate={{ opacity: [1, 0.5, 1], scale: [1, 1.04, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="rounded-full bg-white/25 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest ring-1 ring-white/30 backdrop-blur-sm"
          >
            ⚡ Only 2 left
          </motion.div>
        </div>
        <div className="relative mt-2 text-[11px] font-semibold opacity-90">
          A clock ticking down nudges you to act now — even when you weren't planning to.
        </div>
      </div>
    );
  }
  if (kind === 'triggers') {
    const tiles = [
      { label: 'Recommended For You', sub: 'Based on your last buy',  tone: 'from-coral-500 to-burgundy-500',  Icon: Sparkles },
      { label: 'Trending Now',        sub: '🔥 12K bought this week',  tone: 'from-saffron-500 to-coral-500',   Icon: TrendingUp },
      { label: 'FREE Gift Unlocked',  sub: 'Add 1 more · get a freebie', tone: 'from-teal-500 to-emerald-600',  Icon: Gift },
    ];
    return (
      <div className="grid grid-cols-1 gap-2">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.14, duration: 0.4 }}
            className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${t.tone} p-2.5 text-white shadow-sm`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
              <t.Icon className="h-4 w-4" strokeWidth={2.6} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-extrabold leading-tight">{t.label}</div>
              <div className="text-[10.5px] opacity-90">{t.sub}</div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-80" />
          </motion.div>
        ))}
      </div>
    );
  }
  if (kind === 'addition') {
    const items = [
      { emoji: '🧦', label: 'Socks',  price: 299 },
      { emoji: '⌚', label: 'Watch',  price: 799 },
      { emoji: '👕', label: 'Hoodie', price: 799 },
      { emoji: '💡', label: 'Light',  price: 199 },
    ];
    const total = items.reduce((s, p) => s + p.price, 0);
    return (
      <div className="rounded-2xl bg-gradient-to-br from-cream-50 to-cream-100 p-3 ring-1 ring-ink-300/15">
        <div className="flex flex-col gap-1.5">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.12 }}
              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-900 ring-1 ring-ink-300/10"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="text-base leading-none">{it.emoji}</span>
                {it.label}
              </span>
              <span className="text-saffron-600">+ ₹{it.price}</span>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-burgundy-500 to-coral-500 px-3 py-2 text-white shadow-md"
        >
          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-90">Total spent</span>
          <span className="text-[22px] font-extrabold tabular-nums">₹{total.toLocaleString('en-IN')}</span>
        </motion.div>
        <div className="mt-1.5 text-center text-[10.5px] uppercase tracking-widest text-ink-500">
          Small spends add up fast
        </div>
      </div>
    );
  }
  return null;
}
