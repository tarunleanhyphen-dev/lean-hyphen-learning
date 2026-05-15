import { AnimatePresence, motion } from 'framer-motion';

/**
 * Big animated character portrait that shifts expression as Shanaya's mood
 * changes. Uses stacked emoji + aura for a richer feel without illustration assets.
 */

const FACES = {
  neutral:    { emoji: '🙂',  label: 'calm',     aura: 'bg-saffron-400/60',  ring: 'ring-saffron-500/40' },
  curious:    { emoji: '🤔',  label: 'curious',  aura: 'bg-coral-400/55',    ring: 'ring-coral-500/40' },
  tempted:    { emoji: '😋',  label: 'tempted',  aura: 'bg-coral-400/60',    ring: 'ring-coral-500/40' },
  excited:    { emoji: '😃',  label: 'excited',  aura: 'bg-saffron-500/60',  ring: 'ring-saffron-500/50' },
  happy:      { emoji: '😄',  label: 'happy',    aura: 'bg-teal-400/55',     ring: 'ring-teal-500/40' },
  shocked:    { emoji: '😯',  label: 'startled', aura: 'bg-coral-500/55',    ring: 'ring-coral-500/40' },
  unsettled:  { emoji: '😟',  label: 'unsettled',aura: 'bg-burgundy-500/55', ring: 'ring-burgundy-500/40' },
  guilty:     { emoji: '😬',  label: 'uneasy',   aura: 'bg-burgundy-500/55', ring: 'ring-burgundy-500/40' },
  realised:   { emoji: '😮‍💨', label: 'realising', aura: 'bg-burgundy-500/60',ring: 'ring-burgundy-500/40' },
};

export default function CharacterSpotlight({ emotion = 'neutral' }) {
  const face = FACES[emotion] || FACES.neutral;

  // Subtle motion variants based on emotion
  const bob = emotion === 'shocked'
    ? { y: [0, -4, 2, -2, 0] }
    : emotion === 'excited' || emotion === 'happy'
      ? { y: [0, -6, 0], rotate: [-1, 1, -1] }
      : { y: [0, -3, 0] };

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Aura */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-0 -z-10 rounded-full blur-2xl ${face.aura}`}
      />

      {/* Twinkle */}
      <motion.span
        className="absolute -top-3 -right-1 text-base sm:text-lg"
        animate={{ y: [0, -4, 0], rotate: [0, 12, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.6, repeat: Infinity }}
      >
        ✨
      </motion.span>
      <motion.span
        className="absolute -bottom-1 -left-2 text-sm opacity-80"
        animate={{ y: [0, 3, 0], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}
      >
        ✨
      </motion.span>

      {/* Face card */}
      <motion.div
        animate={bob}
        transition={{ duration: emotion === 'shocked' ? 0.6 : 3.6, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative grid h-32 w-32 place-items-center rounded-full bg-white shadow-xl ring-4 sm:h-40 sm:w-40 ${face.ring}`}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={emotion}
            initial={{ scale: 0.55, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0, rotate: 18 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="text-6xl sm:text-7xl"
            aria-label={`Shanaya looks ${face.label}`}
            role="img"
          >
            {face.emoji}
          </motion.span>
        </AnimatePresence>

        {/* Blink overlay — a thin lid that briefly closes */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-3 origin-center rounded-full bg-white/0"
          animate={{ scaleY: [0, 1, 0], opacity: [0, 0.65, 0] }}
          transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 4.2 }}
          style={{ background: 'rgba(0,0,0,0.0)' }}
        />
      </motion.div>

      {/* Name + mood chip */}
      <motion.div
        layout
        className="-mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1 text-[11px] font-bold text-white shadow"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-saffron-400" />
        Shanaya · <span className="font-semibold opacity-80">{face.label}</span>
      </motion.div>
    </div>
  );
}
