import { AnimatePresence, motion } from 'framer-motion';

/**
 * Floating "imagination" clouds around the avatar. Each cloud carries a big
 * emoji + a short caption — the visual version of "she's picturing the café
 * with her friends" so we don't rely on narration alone to convey the scene.
 *
 * `items` is an array of:
 *   { id, emoji, caption?, pos: 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'right', delay? }
 *
 * Position values map to absolute placements around the avatar block.
 */
export default function ThoughtImagery({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {items.map((it) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -10 }}
            transition={{ duration: 0.6, delay: it.delay ?? 0, ease: 'easeOut' }}
            className={positionClass(it.pos)}
          >
            <div className="relative flex flex-col items-center">
              {/* Cloud body — soft white blob with a giant emoji + tiny caption */}
              <div className="relative">
                <span aria-hidden className="absolute -left-2 top-2 h-4 w-4 rounded-full bg-white shadow ring-1 ring-ink-300/15" />
                <span aria-hidden className="absolute -right-1.5 top-3 h-3 w-3 rounded-full bg-white shadow ring-1 ring-ink-300/15" />
                <span aria-hidden className="absolute right-3 -top-1.5 h-3 w-3 rounded-full bg-white shadow ring-1 ring-ink-300/15" />
                <div className="relative flex flex-col items-center rounded-[1.4rem] bg-white px-3.5 py-2.5 shadow-xl ring-1 ring-ink-300/20">
                  <motion.span
                    animate={{ y: [0, -3, 0], rotate: [-2, 2, -2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-3xl leading-none sm:text-4xl"
                  >
                    {it.emoji}
                  </motion.span>
                  {it.caption && (
                    <span className="mt-1 max-w-[7rem] text-center text-[10px] font-bold uppercase tracking-wider text-ink-700">
                      {it.caption}
                    </span>
                  )}
                </div>
              </div>
              {/* Trailing thought-cloud dots */}
              <div className="-mt-1 flex flex-col items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white shadow ring-1 ring-ink-300/20" />
                <span className="h-1 w-1 rounded-full bg-white shadow ring-1 ring-ink-300/20" />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function positionClass(pos) {
  switch (pos) {
    case 'tl': return 'absolute left-1 top-2';
    case 'tr': return 'absolute right-1 top-2';
    case 'bl': return 'absolute left-1 bottom-12';
    case 'br': return 'absolute right-1 bottom-12';
    case 'top': return 'absolute left-1/2 top-0 -translate-x-1/2';
    case 'right': return 'absolute right-2 top-1/2 -translate-y-1/2';
    default: return 'absolute right-1 top-2';
  }
}
