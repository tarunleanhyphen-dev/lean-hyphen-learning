import { AnimatePresence, motion } from 'framer-motion';

/**
 * Comic-style thought clouds that float next to Shanaya's head.
 *
 * `position` is one of:
 *   'right' — to the right of the avatar (default; trailing dots point down-left)
 *   'left'  — to the left of the avatar (trailing dots point down-right)
 *   'above' — directly above (dots point straight down)
 *
 * Only the most recent ~2 bubbles are kept on screen so the area never grows.
 */
export default function ThoughtBubble({ bubbles = [], position = 'right' }) {
  const visible = bubbles.slice(-2);
  const dotSide = position === 'left' ? 'right-2' : 'left-2';
  const align = position === 'left' ? 'items-end' : 'items-start';

  return (
    <div className={`pointer-events-none flex flex-col gap-3 ${align}`} aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((b, i) => (
          <motion.div
            key={`${b.text}-${i}`}
            initial={{ opacity: 0, y: -8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative"
          >
            {/* Trailing thought-cloud dots pointing back toward the avatar */}
            <div className={`absolute ${dotSide} -bottom-3 flex flex-col items-center gap-0.5`} aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-white shadow ring-1 ring-ink-300/20" />
              <span className="h-1 w-1 rounded-full bg-white shadow ring-1 ring-ink-300/20" />
              <span className="h-[3px] w-[3px] rounded-full bg-white shadow ring-1 ring-ink-300/20" />
            </div>

            {/* The cloud — three overlapping rounded blobs evoke a comic-style thought bubble */}
            <div className="relative">
              <span aria-hidden className="absolute -left-2.5 top-2 h-4 w-4 rounded-full bg-white shadow ring-1 ring-ink-300/15" />
              <span aria-hidden className="absolute -right-2 top-3 h-3 w-3 rounded-full bg-white shadow ring-1 ring-ink-300/15" />
              <span aria-hidden className="absolute right-3 -top-2 h-3 w-3 rounded-full bg-white shadow ring-1 ring-ink-300/15" />

              <div className="relative max-w-[20rem] rounded-[1.6rem] bg-white px-4 py-3 text-[15px] leading-snug text-ink-900 shadow-xl ring-1 ring-ink-300/15 sm:text-base">
                <span className="mr-1.5 text-ink-500">💭</span>
                {b.text}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
