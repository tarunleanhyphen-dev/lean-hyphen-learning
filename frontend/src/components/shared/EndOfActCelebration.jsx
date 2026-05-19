import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import MicroConfetti from './MicroConfetti.jsx';

/**
 * End-of-act recap. Appears in a modal overlay AFTER the student finishes
 * the act's final beat and BEFORE navigation to the next act / home.
 *
 * Converts the simulation into stats the student feels good about
 * having earned — the same loop Duolingo / Banzai use:
 *
 *   - Headline ("Act 1 complete!")
 *   - 2×2 stat grid (tricks spotted, items in cart, money spent, time)
 *   - One key takeaway line that distils what the act was really about
 *   - Continue button that fires onContinue
 *
 * Hosts MicroConfetti so the moment of arriving on this screen lands
 * with a celebratory burst.
 *
 * Props:
 *   - actLabel       : "Act 1" / "Act 2"
 *   - title          : "Temptation" / "Understanding Impulse Buying"
 *   - stats          : [{ label, value, sub? }]
 *   - takeaway       : long form text — the one thing to remember
 *   - continueLabel  : "Move to Act 2 →" / "Back to home →"
 *   - onContinue     : () => void
 */
export default function EndOfActCelebration({ actLabel, title, stats = [], takeaway, continueLabel = 'Continue →', onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-900/80 px-4 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative my-4 w-full max-w-xl rounded-3xl bg-gradient-to-br from-white via-saffron-50 to-coral-50 p-6 shadow-2xl ring-1 ring-saffron-500/30 sm:p-8"
      >
        <MicroConfetti active keyId={`celebration-${actLabel}`} count={48} duration={1.9} />

        {/* Eyebrow + headline */}
        <div className="inline-flex items-center gap-2 rounded-full bg-saffron-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-saffron-600">
          <Sparkles className="h-3.5 w-3.5" />
          {actLabel} complete
        </div>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
          Nice work — you finished <span className="text-saffron-600">{title}</span>.
        </h2>
        <p className="mt-1 text-[13px] text-ink-700 sm:text-sm">
          Here's what you just lived through.
        </p>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + 0.08 * stats.indexOf(s) }}
              className="rounded-2xl bg-white p-3 ring-1 ring-ink-300/15 shadow-sm sm:p-4"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">{s.label}</div>
              <div className="mt-0.5 text-xl font-extrabold leading-tight text-ink-900 sm:text-2xl">{s.value}</div>
              {s.sub && (
                <div className="mt-0.5 text-[11px] font-semibold text-ink-700">{s.sub}</div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Takeaway */}
        {takeaway && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-5 rounded-2xl bg-ink-900 p-4 text-[13px] leading-relaxed text-white sm:text-[14px]"
          >
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-saffron-300">
              💡 What this was really about
            </div>
            {takeaway}
          </motion.div>
        )}

        <div className="mt-6 flex items-center justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-full bg-saffron-500 px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98]"
          >
            {continueLabel} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
