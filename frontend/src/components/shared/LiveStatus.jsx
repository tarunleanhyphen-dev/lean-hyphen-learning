import { AnimatePresence, motion } from 'framer-motion';

/**
 * Tiny "Now: [action]" chip rendered under the avatar. Updates per phase so the
 * left column narrates what's happening on the phone on the right, keeping
 * both screens in sync. If `text` is falsy, nothing renders (preserves space).
 */
export default function LiveStatus({ text }) {
  return (
    <div className="mt-3 min-h-[26px] text-center" aria-live="polite">
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md ring-1 ring-white/10 sm:text-[12px]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-coral-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-coral-500" />
            </span>
            <span className="opacity-70">Now</span>
            <span className="font-bold normal-case tracking-normal">{text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
