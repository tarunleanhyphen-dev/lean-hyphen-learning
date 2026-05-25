import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';

/**
 * Act 4's Key Takeaways grid — five tap-to-reveal cards distilling
 * the lesson into a portable rule set.
 *
 * Each card starts as a "locked" placeholder showing only the emoji
 * and a "Tap to reveal" hint. Tapping flips the card to show its
 * title + body. The cards must be revealed in order so the reflection
 * lands as a sequence — the next card stays locked until the
 * previous one is revealed. Once all 5 are open the identity
 * statement ("I can pause and choose before I spend") slides in
 * with a confetti-style sparkle and Finish enables.
 *
 * Props mirror the other activity components:
 *   data         — { title, instruction, cards[], identity }
 *   onCueClick   — soft tap cue when a card opens
 *   speakingDone — gates Finish so the act doesn't end mid-narration
 *   onComplete   — called with { activity: 'takeaways-grid' }
 */
export default function KeyTakeawaysGrid({
  data,
  onCueClick,
  speakingDone = true,
  onComplete,
}) {
  // Set of card ids currently revealed.
  const [revealed, setRevealed] = useState(() => new Set());
  const total = data.cards.length;
  const allRevealed = revealed.size === total;

  // Index of the next card the learner can open (everything before it
  // must already be open). Forces the sequence and keeps the moment
  // controlled rather than letting them tap them all in one go.
  const nextIdx = data.cards.findIndex((c) => !revealed.has(c.id));

  const handleReveal = (cardId, idx) => {
    if (revealed.has(cardId)) return;
    if (idx !== nextIdx) return; // must reveal in order
    onCueClick?.();
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-500">
          📜 Five rules · take them with you
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">
          {data.title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-700 sm:text-[14px]">
          {data.instruction}
        </p>
      </header>

      {/* Progress strip — five dots that fill in as cards reveal. */}
      <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-widest text-ink-500">
        <span>{revealed.size} / {total}</span>
        <div className="flex flex-1 items-center gap-1.5">
          {data.cards.map((c) => {
            const open = revealed.has(c.id);
            return (
              <div
                key={c.id}
                className={[
                  'h-1.5 flex-1 rounded-full transition-colors',
                  open ? 'bg-gradient-to-r from-saffron-500 to-coral-500' : 'bg-ink-300/25',
                ].join(' ')}
              />
            );
          })}
        </div>
      </div>

      {/* Five cards stacked. Sequential — only the next one is tappable. */}
      <div className="grid grid-cols-1 gap-2.5">
        {data.cards.map((card, i) => {
          const isOpen = revealed.has(card.id);
          const isNext = i === nextIdx;
          const isLocked = !isOpen && !isNext;
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => handleReveal(card.id, i)}
              disabled={isOpen || isLocked}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isLocked ? 0.45 : 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
              whileHover={isNext ? { y: -2, scale: 1.005 } : {}}
              whileTap={isNext ? { scale: 0.99 } : {}}
              className={[
                'group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 text-left transition-all sm:p-3.5',
                'ring-1 shadow-sm',
                isOpen
                  ? 'bg-gradient-to-br from-saffron-500/12 via-coral-500/8 to-teal-500/10 ring-2 ring-saffron-500/50 shadow-saffron-500/20'
                  : isNext
                    ? 'bg-white ring-ink-300/30 hover:ring-saffron-500/50 cursor-pointer'
                    : 'bg-ink-300/5 ring-ink-300/15 cursor-not-allowed',
              ].join(' ')}
            >
              {/* Big circular emoji puck */}
              <span
                className={[
                  'grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl shadow-md ring-1 ring-white/40',
                  isOpen
                    ? 'bg-gradient-to-br from-saffron-500 to-coral-500 text-white'
                    : 'bg-gradient-to-br from-ink-300/30 to-ink-300/15',
                ].join(' ')}
              >
                {isOpen ? card.emoji : <Lock className="h-4 w-4 text-ink-500" />}
              </span>

              {/* Title + body OR locked-state hint */}
              <div className="min-w-0 flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="open"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-saffron-600">
                        Rule {i + 1}
                      </div>
                      <div className="text-[14.5px] font-extrabold leading-tight text-ink-900 sm:text-[15.5px]">
                        {card.title}
                      </div>
                      <div className="mt-0.5 text-[12.5px] leading-snug text-ink-700">
                        {card.body}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="closed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5"
                    >
                      <div>
                        <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-ink-500">
                          Rule {i + 1}
                        </div>
                        <div className="text-[13px] font-semibold leading-tight text-ink-700">
                          {isNext ? 'Tap to reveal' : 'Locked'}
                        </div>
                      </div>
                      {isNext && (
                        <motion.span
                          aria-hidden
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                          className="ml-1 text-saffron-500"
                        >
                          →
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Number pip on the right */}
              <span
                aria-hidden
                className={[
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ring-1',
                  isOpen
                    ? 'bg-saffron-500 text-ink-900 ring-saffron-500/60'
                    : isNext
                      ? 'bg-saffron-500/15 text-saffron-600 ring-saffron-500/40'
                      : 'bg-ink-300/15 text-ink-500 ring-ink-300/30',
                ].join(' ')}
              >
                {i + 1}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Identity statement — only appears once all five rules are revealed. */}
      <AnimatePresence>
        {allRevealed && data.identity && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-saffron-500 via-coral-500 to-burgundy-500 p-5 text-white shadow-2xl ring-1 ring-white/20"
          >
            {/* Soft shimmer behind text */}
            <motion.span
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
            <div className="relative">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] opacity-90">
                🪞 Say it once. Then carry it.
              </div>
              <div className="mt-2 text-[18px] font-extrabold leading-snug sm:text-[22px]">
                "{data.identity}"
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish */}
      <div className="flex items-center justify-end">
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
