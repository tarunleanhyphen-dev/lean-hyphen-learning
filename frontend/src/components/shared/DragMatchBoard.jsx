import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import MicroConfetti from './MicroConfetti.jsx';

/**
 * Tap-to-match board: students tap a trigger, then tap a reason. Correct
 * matches glow green and reveal a small insight card; wrong matches shake
 * and clear the selection. When all pairs are matched, onComplete fires.
 *
 * Engagement assists:
 *   - On mount, the first unmatched trigger pulses with a saffron ring and
 *     a "↑ start here" hint, and the parent gets onSpeakPrompt(text) so it
 *     can play "Please match each trigger to the right reason" aloud.
 *   - If the student doesn't interact within 5 seconds, the board starts
 *     auto-solving — picking the next unmatched pair every ~1.6 s so the
 *     simulation never stalls.
 *
 * `data` shape (from lesson data): { title, instruction, pairs: [{ id, trigger, category, insight }] }
 *
 * Drag-and-drop was considered, but tap-to-match is more accessible on
 * mobile/tablet, doesn't fight scroll, and works with keyboard naturally.
 */
export default function DragMatchBoard({ data, onCueClick, onCueCorrect, onCueWrong, onSpeakInsight, onSpeakPrompt, speakingDone = true, onComplete }) {
  const pairs = data.pairs;
  const [matched, setMatched] = useState({});             // { pairId: true }
  const [pickedTrigger, setPickedTrigger] = useState(null);
  const [wrongPulse, setWrongPulse] = useState(null);     // pairId-pairId
  const [openInsight, setOpenInsight] = useState(null);   // pairId
  // Stash the prompt callback in a ref so the mount-only effect doesn't
  // have to depend on its identity — that's what was making the prompt
  // re-fire every render.
  const onSpeakPromptRef = useRef(onSpeakPrompt);
  onSpeakPromptRef.current = onSpeakPrompt;

  const triggerOrder = useMemo(() => pairs.map((p) => p.id), [pairs]);
  // Deterministic non-trivial mapping so rows DON'T align visually — the
  // student has to actually read each pair instead of pattern-matching by
  // row index:
  //   trigger 1 (urgency)        ↦ category in row 3
  //   trigger 2 (social)         ↦ category in row 4
  //   trigger 3 (pairing)        ↦ category in row 1
  //   trigger 4 (free-delivery)  ↦ category in row 2
  // Category column order: [pairing, free-delivery, urgency, social]
  const categoryOrder = useMemo(() => {
    const positions = [2, 3, 0, 1]; // index of the trigger-pair to place in this category row
    return positions.map((triggerIdx) => pairs[triggerIdx]?.id).filter(Boolean);
  }, [pairs]);

  const allDone = Object.keys(matched).length === pairs.length;
  const firstUnmatched = triggerOrder.find((id) => !matched[id]) || null;

  // Voice prompt fires exactly once, on mount. Empty deps + ref for the
  // callback means React's re-renders can't retrigger this.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => {
      onSpeakPromptRef.current?.('Please match each cart trigger to the right reason now.');
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Wait for the student to match all four pairs themselves, THEN wait for
  // the last insight's narration to fully finish, then advance. No auto-
  // solve fallback — every learner does the matching by hand.
  useEffect(() => {
    if (!allDone) return;
    if (!speakingDone) return;
    const t = setTimeout(() => onComplete?.(), 1400);
    return () => clearTimeout(t);
  }, [allDone, speakingDone, onComplete]);

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
      const matchedPair = pairs.find((p) => p.id === id);
      if (matchedPair) onSpeakInsight?.(matchedPair);
    } else {
      setWrongPulse(`${pickedTrigger}-${id}`);
      onCueWrong?.();
      setTimeout(() => setWrongPulse(null), 500);
      setPickedTrigger(null);
    }
  }, [pickedTrigger, matched, onCueCorrect, onCueWrong, onSpeakInsight, pairs]);

  return (
    <div className="relative flex flex-col gap-4">
      <MicroConfetti active={allDone} keyId="match-confetti" />
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-400">Activity 1 · Match the trick</div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{data.title}</h3>
        <p className="mt-1 text-[13px] text-ink-700 sm:text-sm">{data.instruction}</p>
      </header>

      {/* Two parallel columns; row heights are kept equal via auto-rows-fr +
         min-h on each button, so trigger N visually lines up with the
         category in the same row index — even though categories are shuffled
         and trigger text length varies. */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500 pb-2">From the cart</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500 pb-2">Pick the reason</div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 auto-rows-fr">
        {triggerOrder.map((id, rowIdx) => {
          const triggerPair = pairs.find((x) => x.id === id);
          const isMatched = !!matched[id];
          const isPicked = pickedTrigger === id;
          const shake = wrongPulse?.startsWith(`${id}-`);

          const catId = categoryOrder[rowIdx];
          const catPair = pairs.find((x) => x.id === catId);
          const catMatched = !!matched[catId];
          const catShake = wrongPulse?.endsWith(`-${catId}`);
          const catArmed = !!pickedTrigger && !catMatched;

          return (
            <div key={id} className="contents">
              <motion.button
                type="button"
                onClick={() => pickTrigger(id)}
                animate={shake
                  ? { x: [0, -6, 6, -4, 4, 0] }
                  : (id === firstUnmatched && !pickedTrigger
                      ? { x: 0, boxShadow: ['0 0 0 0 rgba(255,159,28,0)', '0 0 0 5px rgba(255,159,28,0.35)', '0 0 0 0 rgba(255,159,28,0)'] }
                      : { x: 0 })}
                transition={shake
                  ? { duration: 0.4 }
                  : (id === firstUnmatched && !pickedTrigger
                      ? { duration: 1.6, repeat: Infinity }
                      : { duration: 0.4 })}
                disabled={isMatched}
                className={[
                  'group relative text-left rounded-2xl px-4 py-3 ring-1 transition shadow-sm min-h-[78px] flex items-center',
                  isMatched
                    ? 'bg-teal-500/15 ring-teal-500/50 text-ink-900 cursor-default'
                    : isPicked
                      ? 'bg-saffron-500/20 ring-saffron-500/60 text-ink-900 scale-[1.01]'
                      : id === firstUnmatched
                        ? 'bg-saffron-50 ring-saffron-500 text-ink-900 hover:bg-saffron-100'
                        : 'bg-white ring-ink-300/20 text-ink-800 hover:ring-saffron-500/40 hover:bg-saffron-50',
                ].join(' ')}
              >
                <div className="flex w-full items-start gap-2">
                  <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isMatched ? 'bg-teal-500 text-white' : 'bg-ink-900/85 text-white/95'}`}>
                    {isMatched ? <Check className="h-3.5 w-3.5" /> : pairs.findIndex((x) => x.id === id) + 1}
                  </span>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold leading-snug sm:text-[15px]">{triggerPair.trigger}</div>
                    {isPicked && (
                      <div className="mt-1 text-[11px] font-semibold text-saffron-500">Now tap the reason →</div>
                    )}
                  </div>
                </div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => pickCategory(catId)}
                animate={catShake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                disabled={catMatched || !pickedTrigger}
                className={[
                  'relative text-left rounded-2xl px-4 py-3 ring-1 transition shadow-sm min-h-[78px] flex items-center',
                  catMatched
                    ? 'bg-teal-500/15 ring-teal-500/50 text-ink-900 cursor-default'
                    : catArmed
                      ? 'bg-white ring-saffron-500/50 text-ink-900 hover:bg-saffron-50 hover:ring-saffron-500'
                      : 'bg-white/70 ring-ink-300/20 text-ink-500',
                ].join(' ')}
              >
                <div className="flex w-full items-center gap-2">
                  {catMatched && <Check className="h-4 w-4 shrink-0 text-teal-500" />}
                  <div className="flex-1">
                    <div className="text-[14px] font-bold sm:text-[15px]">{catPair.category}</div>
                    {catMatched && (
                      <div className="mt-1 text-[12px] text-ink-700">↳ {catPair.trigger}</div>
                    )}
                  </div>
                </div>
              </motion.button>
            </div>
          );
        })}
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
