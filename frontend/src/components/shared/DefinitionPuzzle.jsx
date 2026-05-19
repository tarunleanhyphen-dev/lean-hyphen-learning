import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

/**
 * Word-tile puzzle: build a target sentence by tapping tiles in order.
 * Two of the six tiles are decoys; placing a decoy shakes the slot and bounces
 * the tile back. When the four correct tiles are placed in the right order:
 *   1. The full definition is spoken aloud (onSpeakDefinition fires once).
 *   2. Once narration completes (speakingDone flips true), onComplete fires.
 *
 * `data`: { title, instruction, leadIn, slots, tiles: [{id, label, correctIndex|null}], finalLine }
 */
export default function DefinitionPuzzle({ data, onCueClick, onCueCorrect, onCueWrong, onSpeakDefinition, speakingDone = true, onComplete }) {
  const { tiles, leadIn, slots: slotCount, finalLine } = data;

  const [placed, setPlaced] = useState(() => Array(slotCount).fill(null)); // tile ids
  const [shakeSlot, setShakeSlot] = useState(null);
  const [done, setDone] = useState(false);

  const tileById = useMemo(() => Object.fromEntries(tiles.map((t) => [t.id, t])), [tiles]);
  const shuffled = useMemo(() => {
    const list = [...tiles];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [tiles]);

  const nextSlot = placed.findIndex((id) => id === null);

  const placeTile = useCallback((tileId) => {
    if (done) return;
    if (placed.includes(tileId)) return;
    if (nextSlot === -1) return;

    const tile = tileById[tileId];
    const expectedHere = nextSlot;

    if (tile.correctIndex === expectedHere) {
      onCueCorrect?.();
      setPlaced((cur) => {
        const next = [...cur];
        next[expectedHere] = tileId;
        return next;
      });
    } else {
      onCueWrong?.();
      setShakeSlot(expectedHere);
      setTimeout(() => setShakeSlot(null), 500);
    }
  }, [done, placed, nextSlot, tileById, onCueCorrect, onCueWrong]);

  const removeTile = useCallback((slotIdx) => {
    if (done) return;
    setPlaced((cur) => {
      const next = [...cur];
      // Remove this tile and everything after — keeps the in-order constraint.
      for (let i = slotIdx; i < next.length; i += 1) next[i] = null;
      return next;
    });
    onCueClick?.();
  }, [done, onCueClick]);

  // Stash callbacks in refs so render-induced identity changes don't keep
  // re-triggering speech or cancelling the advance timer.
  const onSpeakDefinitionRef = useRef(onSpeakDefinition);
  onSpeakDefinitionRef.current = onSpeakDefinition;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const spokeRef = useRef(false);
  // When all 4 slots are filled, mark done and speak the definition (once).
  useEffect(() => {
    if (!placed.every((id) => id !== null)) return;
    if (spokeRef.current) return;
    spokeRef.current = true;
    setDone(true);
    onSpeakDefinitionRef.current?.(data.finalLine);
  }, [placed, data.finalLine]);

  // Advance after narration finishes. If speakingDone is still false (speech
  // in flight), wait — with a hard cap of 8 s. If speakingDone is true (either
  // speech ended or audio is off), give a 1.4 s breath then advance. Either
  // path fires onComplete exactly once via the advancedRef guard.
  const advancedRef = useRef(false);
  useEffect(() => {
    if (!done) return;
    if (advancedRef.current) return;
    const fire = () => {
      if (advancedRef.current) return;
      advancedRef.current = true;
      onCompleteRef.current?.();
    };
    if (!speakingDone) {
      // 12 s cap is longer than the 17-word definition (~7-8 s), so the
      // line is never cut off mid-sentence.
      const cap = setTimeout(fire, 12000);
      return () => clearTimeout(cap);
    }
    const t = setTimeout(fire, 1400);
    return () => clearTimeout(t);
  }, [done, speakingDone]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-400">Activity 2 · Build the sentence</div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{data.title}</h3>
        <p className="mt-1 text-[13px] text-ink-700 sm:text-sm">{data.instruction}</p>
      </header>

      {/* Sentence bar — lead-in + slots */}
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-ink-300/20 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 text-[14px] leading-relaxed sm:text-[15px]">
          <span className="font-semibold text-ink-900">{leadIn}</span>
          {placed.map((tileId, i) => {
            const shake = shakeSlot === i;
            const filled = !!tileId;
            return (
              <motion.span
                key={i}
                animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={[
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-semibold transition sm:text-[14px]',
                  filled
                    ? done
                      ? 'bg-teal-500/15 text-ink-900 ring-1 ring-teal-500/40'
                      : 'bg-saffron-500/15 text-ink-900 ring-1 ring-saffron-500/40'
                    : i === nextSlot
                      ? 'bg-ink-900/5 text-ink-500 ring-2 ring-dashed ring-saffron-500/50 animate-pulse'
                      : 'bg-ink-900/5 text-ink-500 ring-1 ring-dashed ring-ink-300/40',
                ].join(' ')}
              >
                {filled ? (
                  <>
                    <span>{tileById[tileId].label}</span>
                    {!done && (
                      <button
                        type="button"
                        onClick={() => removeTile(i)}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-ink-900/15 text-ink-700 hover:bg-ink-900/30"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="opacity-70">_____</span>
                )}
              </motion.span>
            );
          })}
          <span className="font-semibold text-ink-900">.</span>
        </div>
      </div>

      {/* Tile bank */}
      <div className="flex flex-wrap gap-2">
        {shuffled.map((tile) => {
          const used = placed.includes(tile.id);
          return (
            <motion.button
              key={tile.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => placeTile(tile.id)}
              disabled={used || done}
              className={[
                'rounded-2xl px-3.5 py-2 text-[13px] font-semibold shadow-sm ring-1 transition sm:text-[14px]',
                used
                  ? 'bg-ink-900/5 text-ink-500 ring-ink-300/20 opacity-40 cursor-default'
                  : 'bg-white text-ink-900 ring-ink-300/25 hover:bg-saffron-50 hover:ring-saffron-500/50',
              ].join(' ')}
            >
              {tile.label}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-gradient-to-br from-teal-500/15 via-white to-saffron-50 p-4 shadow-md ring-1 ring-teal-500/40"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-500">
              <Sparkles className="h-3.5 w-3.5" />
              Definition unlocked
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-1.5 text-[14px] font-semibold leading-relaxed text-ink-900 sm:text-[15px]"
            >
              {finalLine}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
