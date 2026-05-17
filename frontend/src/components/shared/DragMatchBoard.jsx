import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

/**
 * Tap-to-match board: students tap a trigger, then tap a reason. Correct
 * matches glow green and reveal a small insight card; wrong matches shake
 * and clear the selection. When all pairs are matched, onComplete fires.
 *
 * `data` shape (from lesson data): { title, instruction, pairs: [{ id, trigger, category, insight }] }
 *
 * Drag-and-drop was considered, but tap-to-match is more accessible on
 * mobile/tablet, doesn't fight scroll, and works with keyboard naturally.
 */
export default function DragMatchBoard({ data, onCueClick, onCueCorrect, onCueWrong, onComplete }) {
  const pairs = data.pairs;
  const [matched, setMatched] = useState({});             // { pairId: true }
  const [pickedTrigger, setPickedTrigger] = useState(null);
  const [wrongPulse, setWrongPulse] = useState(null);     // pairId-pairId
  const [openInsight, setOpenInsight] = useState(null);   // pairId

  const triggerOrder = useMemo(() => pairs.map((p) => p.id), [pairs]);
  // Shuffle categories so the order doesn't give it away. Deterministic per mount.
  const categoryOrder = useMemo(() => {
    const ids = pairs.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }, [pairs]);

  const allDone = Object.keys(matched).length === pairs.length;

  useEffect(() => {
    if (!allDone) return;
    const t = setTimeout(() => onComplete?.(), 1400);
    return () => clearTimeout(t);
  }, [allDone, onComplete]);

  const pickTrigger = useCallback((id) => {
    if (matched[id]) return;
    onCueClick?.();
    setPickedTrigger((cur) => (cur === id ? null : id));
  }, [matched, onCueClick]);

  const pickCategory = useCallback((id) => {
    if (!pickedTrigger) return;
    if (matched[id]) return;
    if (pickedTrigger === id) {
      setMatched((m) => ({ ...m, [id]: true }));
      setOpenInsight(id);
      setPickedTrigger(null);
      onCueCorrect?.();
    } else {
      setWrongPulse(`${pickedTrigger}-${id}`);
      onCueWrong?.();
      setTimeout(() => setWrongPulse(null), 500);
      setPickedTrigger(null);
    }
  }, [pickedTrigger, matched, onCueCorrect, onCueWrong]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-400">Activity 1 · Match the trick</div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{data.title}</h3>
        <p className="mt-1 text-[13px] text-ink-700 sm:text-sm">{data.instruction}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* LEFT COLUMN — triggers (fixed order, same as cart) */}
        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">From the cart</div>
          {triggerOrder.map((id) => {
            const p = pairs.find((x) => x.id === id);
            const isMatched = !!matched[id];
            const isPicked = pickedTrigger === id;
            const shake = wrongPulse?.startsWith(`${id}-`);
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => pickTrigger(id)}
                animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                disabled={isMatched}
                className={[
                  'group relative text-left rounded-2xl px-4 py-3 ring-1 transition shadow-sm',
                  isMatched
                    ? 'bg-teal-500/15 ring-teal-500/50 text-ink-900 cursor-default'
                    : isPicked
                      ? 'bg-saffron-500/20 ring-saffron-500/60 text-ink-900 scale-[1.01]'
                      : 'bg-white ring-ink-300/20 text-ink-800 hover:ring-saffron-500/40 hover:bg-saffron-50',
                ].join(' ')}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isMatched ? 'bg-teal-500 text-white' : 'bg-ink-900/85 text-white/95'}`}>
                    {isMatched ? <Check className="h-3.5 w-3.5" /> : pairs.findIndex((x) => x.id === id) + 1}
                  </span>
                  <div className="text-[14px] font-semibold leading-snug sm:text-[15px]">{p.trigger}</div>
                </div>
                {isPicked && (
                  <div className="mt-1 text-[11px] font-semibold text-saffron-500">Now tap the reason →</div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* RIGHT COLUMN — categories (shuffled) */}
        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Pick the reason</div>
          {categoryOrder.map((id) => {
            const p = pairs.find((x) => x.id === id);
            const isMatched = !!matched[id];
            const shake = wrongPulse?.endsWith(`-${id}`);
            const armed = !!pickedTrigger && !isMatched;
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => pickCategory(id)}
                animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                disabled={isMatched || !pickedTrigger}
                className={[
                  'relative text-left rounded-2xl px-4 py-3 ring-1 transition shadow-sm',
                  isMatched
                    ? 'bg-teal-500/15 ring-teal-500/50 text-ink-900 cursor-default'
                    : armed
                      ? 'bg-white ring-saffron-500/50 text-ink-900 hover:bg-saffron-50 hover:ring-saffron-500'
                      : 'bg-white/70 ring-ink-300/20 text-ink-500',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  {isMatched && <Check className="h-4 w-4 shrink-0 text-teal-500" />}
                  <div className="text-[14px] font-bold sm:text-[15px]">{p.category}</div>
                </div>
                {isMatched && (
                  <div className="mt-1 text-[12px] text-ink-700">↳ {p.trigger}</div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Insight reveal — small floating card after a correct match */}
      <AnimatePresence>
        {openInsight && (
          <motion.div
            key={openInsight}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-gradient-to-br from-saffron-50 via-white to-coral-50 p-4 ring-1 ring-saffron-500/30 shadow-md"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-saffron-500">
              <Sparkles className="h-3.5 w-3.5" />
              Insight unlocked · {pairs.find((p) => p.id === openInsight)?.insight.label}
            </div>
            <div className="mt-1.5 text-[13px] leading-relaxed text-ink-800 sm:text-sm">
              {pairs.find((p) => p.id === openInsight)?.insight.detail}
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenInsight(null)}
                className="text-[11px] font-bold uppercase tracking-widest text-ink-500 hover:text-ink-900"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between text-[12px] text-ink-700">
        <span>Matched {Object.keys(matched).length} of {pairs.length}</span>
        {allDone && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-full bg-teal-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-teal-500"
          >
            ✓ All four named
          </motion.span>
        )}
      </div>
    </div>
  );
}
