import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Check, X } from 'lucide-react';

/**
 * Scene 5 prediction puzzle. Renders the four payment-path options as
 * glowing cards on the digital stage. Picking any option locks in the
 * pick, shows the per-option hint, and calls `onDone` after a short
 * read window so the parent Act can advance to the next phase.
 */
export default function PredictionChallenge({ prompt, options = [], onDone }) {
  const [picked, setPicked] = useState(null);

  const pick = (opt) => {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onDone?.(opt), 3200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-3xl rounded-3xl bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-fuchsia-500/15 p-5 ring-1 ring-cyan-300/30 backdrop-blur sm:p-6"
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-200">
        <Sparkles className="h-3.5 w-3.5" /> System challenge
      </div>
      <h3 className="mt-2 text-lg font-extrabold text-white sm:text-xl">{prompt}</h3>
      <p className="mt-1 text-xs text-white/65">
        Don’t overthink — your gut answer is the prediction. Act 2 reveals the truth either way.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isPicked = picked?.id === opt.id;
          return (
            <motion.button
              key={opt.id}
              onClick={() => pick(opt)}
              whileHover={!picked ? { scale: 1.02 } : undefined}
              whileTap={!picked ? { scale: 0.98 } : undefined}
              className={`group relative rounded-2xl border p-4 text-left transition ${
                isPicked
                  ? opt.correct
                    ? 'border-emerald-300/70 bg-emerald-400/15'
                    : 'border-amber-300/60 bg-amber-400/10'
                  : picked
                    ? 'border-white/10 bg-white/[0.03] opacity-60'
                    : 'border-cyan-300/30 bg-white/[0.05] hover:border-cyan-200/60 hover:bg-white/[0.08]'
              }`}
              disabled={!!picked}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl ring-1 ring-white/20">
                  {opt.icon}
                </div>
                <div className="text-sm font-bold text-white">{opt.label}</div>
                {isPicked && (
                  <div className="ml-auto">
                    {opt.correct ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-emerald-950">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 text-amber-950">
                        <X className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                )}
              </div>
              <AnimatePresence>
                {isPicked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden text-[12px] text-white/80"
                  >
                    {opt.hint}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10"
          >
            <div className="text-xs text-white/75">
              Pick locked. Bringing you into Act 2…
            </div>
            <ArrowRight className="h-4 w-4 text-cyan-200" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
