import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';

/**
 * Soft notification-style chip rendered ABOVE the phone — no overlap with the
 * room column. Frames the dark-pattern moments as "tips" rather than a lecture.
 */
export default function InsightCallout({ insight }) {
  return (
    <div className="pointer-events-none mb-3 flex min-h-[3.75rem] w-full justify-center" aria-live="polite">
      <AnimatePresence mode="wait">
        {insight && (
          <motion.div
            key={insight.label}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex w-full max-w-md items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-saffron-500/30"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-saffron-500/15">
              {insight.type === 'fact'
                ? <AlertCircle className="h-4 w-4 text-saffron-600" />
                : <Sparkles className="h-4 w-4 text-saffron-600" />}
            </span>
            <div className="flex-1 leading-tight">
              <div className="text-[15px] font-semibold text-ink-900 sm:text-base">{insight.label}</div>
              {insight.detail && (
                <div className="mt-0.5 text-[13px] text-ink-500 sm:text-sm">{insight.detail}</div>
              )}
            </div>
            <div aria-hidden className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white ring-1 ring-saffron-500/30" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
