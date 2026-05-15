import { motion, AnimatePresence } from 'framer-motion';

const FACES = {
  neutral:    { emoji: '😊', label: 'calm' },
  curious:    { emoji: '🤔', label: 'curious' },
  excited:    { emoji: '😮', label: 'excited' },
  unsettled:  { emoji: '😟', label: 'unsettled' },
};

export default function EmotionIndicator({ emotion = 'neutral', name = 'Shanaya' }) {
  const face = FACES[emotion] || FACES.neutral;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-xl">
          👩🏽
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={emotion}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow ring-1 ring-ink-300/30"
            aria-label={`mood: ${face.label}`}
          >
            {face.emoji}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="text-xs">
        <div className="font-semibold text-white/90">{name}</div>
        <div className="text-white/50">feeling {face.label}</div>
      </div>
    </div>
  );
}
