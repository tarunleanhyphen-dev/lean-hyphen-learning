import { AnimatePresence, motion } from 'framer-motion';

/**
 * Stack of Shanaya's thought/speech bubbles. Larger, more legible text for
 * the new Act 1 polish pass.
 */
export default function SpeechBubble({ bubbles = [], speaker }) {
  return (
    <div className="flex flex-col items-stretch gap-3" aria-live="polite">
      <AnimatePresence initial={false}>
        {bubbles.map((b, i) => (
          <motion.div
            key={`${b.text}-${i}`}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`flex ${b.side === 'right' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex max-w-[22rem] items-end gap-2 sm:max-w-[26rem]">
              {b.side === 'left' && <Avatar emoji={speaker?.avatar || '🗣️'} />}
              <div
                className={`speech-bubble text-[16px] sm:text-[17px] leading-snug ${
                  b.type === 'thought'
                    ? 'bg-white text-ink-900 ring-1 ring-ink-300/20'
                    : 'bg-saffron-500 text-ink-900'
                }`}
              >
                {b.type === 'thought' && <span className="mr-1 opacity-70">💭</span>}
                {b.text}
              </div>
              {b.side === 'right' && <Avatar emoji={speaker?.avatar || '👩🏽'} />}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ emoji }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-100 text-xl shadow-sm ring-1 ring-white/50">
      {emoji}
    </div>
  );
}
