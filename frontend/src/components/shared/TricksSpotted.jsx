import { AnimatePresence, motion } from 'framer-motion';

/**
 * Persistent header chip showing how many distinct manipulation patterns
 * (insights) the student has encountered so far in the lesson.
 *
 * Behavioural-econ-inspired: making the score visible converts a passive
 * "I'm watching a story" experience into an active "I'm catching the
 * tricks" game. Every new insight feels like a small +1 win.
 *
 * `count` is just a number from the parent. When it increases, the chip
 * pulses + the number animates in via a key-flip so the change is felt.
 */
export default function TricksSpotted({ count = 0 }) {
  return (
    <motion.div
      animate={count > 0 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      key={`pulse-${count}`}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="inline-flex items-center gap-1.5 rounded-full border border-saffron-500/40 bg-saffron-500/15 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-saffron-300 sm:px-3 sm:text-[11px]"
      aria-label={`${count} tricks spotted`}
    >
      <span aria-hidden className="text-[12px] leading-none">🔍</span>
      <span className="hidden sm:inline">Tricks spotted</span>
      <span className="sm:hidden">Tricks</span>
      <span className="inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-saffron-500 px-1.5 text-[11px] font-extrabold tracking-normal text-ink-900">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.div>
  );
}
