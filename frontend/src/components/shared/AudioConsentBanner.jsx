import { motion } from 'framer-motion';
import { Volume2, X } from 'lucide-react';

/**
 * Shown once when entering Act 1 if audio isn't enabled yet.
 * Clicking "Yes" both turns audio on AND unlocks the AudioContext via the
 * user-gesture requirement.
 */
export default function AudioConsentBanner({ onEnable, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-saffron-500/30 bg-saffron-500/10 px-4 py-3 text-sm text-white/90"
      role="region"
      aria-label="Enable audio prompt"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-saffron-500/20">
        <Volume2 className="h-4 w-4 text-saffron-400" />
      </span>
      <div className="flex-1">
        <div className="font-semibold">Want to hear the story too?</div>
        <div className="text-xs text-white/60">Soft music + reaction sounds. Works best with the audio on.</div>
      </div>
      <button onClick={onEnable} className="rounded-full bg-saffron-500 px-4 py-2 text-xs font-bold text-ink-900 hover:bg-saffron-400">
        Yes, audio on
      </button>
      <button onClick={onDismiss} className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">
        Text only
      </button>
      <button onClick={onDismiss} className="rounded-full p-1.5 text-white/50 hover:text-white" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
