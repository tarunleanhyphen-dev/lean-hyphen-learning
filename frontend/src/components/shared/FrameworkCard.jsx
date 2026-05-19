import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Check } from 'lucide-react';

/**
 * Pause & Think framework — five bullets that animate in one by one, then
 * a "Got it" button that fires onComplete. Each bullet shows label + a question
 * and a short detail line. Designed to be the closing beat of Act 2.
 *
 * As each bullet appears, onReveal(bullet) fires so the parent can speak it
 * aloud via TTS. The next bullet doesn't appear until the previous one's
 * narration is done — gated by `speakingDone` from the parent.
 *
 * `data`: { title, intro, bullets: [{id, emoji, label, question, detail}], closer }
 */
export default function FrameworkCard({ data, onReveal, speakingDone = true, onComplete }) {
  const [revealed, setRevealed] = useState(0);
  const total = data.bullets.length;
  const fullyRevealed = revealed >= total;

  // Stash callbacks in refs so render-induced identity changes don't
  // re-trigger reveals or the auto-advance timer.
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reveal each bullet in sequence:
  //   - bullet 1 appears 700 ms after mount, fires onReveal (which speaks it).
  //   - speech start synchronously flips speakingDone → false; effect re-runs
  //     and parks on the safety branch until speakingDone → true again.
  //   - 1.6 s breath after speech ends, reveal next bullet.
  //   - Safety cap of 8 s per bullet so a stuck TTS callback can't freeze
  //     the activity — bullets 4 + 5 always appear, audio or not.
  useEffect(() => {
    if (fullyRevealed) return;
    const revealNext = () => {
      const next = revealed + 1;
      setRevealed(next);
      const bullet = data.bullets[next - 1];
      if (bullet) onRevealRef.current?.(bullet);
    };
    if (revealed > 0 && !speakingDone) {
      // Speech is in flight — wait. Cap is 12 s, longer than the longest
      // bullet narration (~4 s), so a bullet is never cut off mid-sentence.
      const t = setTimeout(revealNext, 12000);
      return () => clearTimeout(t);
    }
    // ~1.2 s breath between bullets — bullets are short enough now that a
    // longer pause feels sluggish. Aim for ~30 s total for all 5.
    const delay = revealed === 0 ? 700 : 1200;
    const t = setTimeout(revealNext, delay);
    return () => clearTimeout(t);
  }, [revealed, fullyRevealed, speakingDone, data.bullets]);

  // After the last bullet's narration completes, advance automatically.
  // Hard cap of 6 s in case narration somehow never finishes.
  const advancedRef = useRef(false);
  useEffect(() => {
    if (!fullyRevealed) return;
    if (advancedRef.current) return;
    const fire = () => {
      if (advancedRef.current) return;
      advancedRef.current = true;
      onCompleteRef.current?.();
    };
    if (speakingDone) {
      const t = setTimeout(fire, 2200);
      return () => clearTimeout(t);
    }
    const fallback = setTimeout(fire, 6000);
    return () => clearTimeout(fallback);
  }, [fullyRevealed, speakingDone]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-saffron-400">
          <Pause className="h-3.5 w-3.5" />
          Activity 3 · The framework
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{data.title}</h3>
        <p className="mt-1 text-[13px] text-ink-700 sm:text-sm">{data.intro}</p>
      </header>

      <ol className="flex flex-col gap-2.5">
        {data.bullets.map((b, i) => {
          const visible = i < revealed;
          return (
            <AnimatePresence key={b.id}>
              {visible && (
                <motion.li
                  initial={{ opacity: 0, x: -12, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="relative flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-ink-300/20 sm:p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-saffron-500/25 to-coral-400/30 text-xl ring-1 ring-saffron-500/30">
                    <span aria-hidden>{b.emoji}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-saffron-500">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[15px] font-extrabold text-ink-900 sm:text-base">{b.label}</span>
                    </div>
                    <div className="mt-0.5 text-[14px] font-semibold leading-snug text-ink-900 sm:text-[15px]">
                      {b.question}
                    </div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-ink-700 sm:text-[13px]">
                      {b.detail}
                    </div>
                  </div>
                </motion.li>
              )}
            </AnimatePresence>
          );
        })}
      </ol>

      <AnimatePresence>
        {fullyRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-teal-500/15 via-white to-saffron-50 p-4 ring-1 ring-teal-500/40 shadow-md"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-500 text-white">
              <Check className="h-4 w-4" />
            </span>
            <p className="text-[13.5px] leading-relaxed text-ink-900 sm:text-sm">
              {data.closer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
