import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

/**
 * Yellow "Your turn" prompt that overlays the phone column. Used during
 * the new Act 1 hold-and-click moments where the learner has to actually
 * tap [Add to Cart] before the sequence advances.
 *
 * Wired by Act1.jsx: it watches `phase.prompt` and renders this. On click
 * we call onClick which marks the hold complete and advances the
 * sequencer just like the MCQ / reflection holds.
 *
 * Props:
 *   label    – small uppercase header above the button ("Help Shanaya shop")
 *   cta      – button text ("Add to Cart")
 *   onClick  – fires when the user taps the button
 */
export default function InteractivePrompt({ label = 'Your turn', cta = 'Add to Cart', onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35 }}
      className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-saffron-500 via-saffron-400 to-coral-400 p-[2px] shadow-lg shadow-saffron-500/30 ring-1 ring-saffron-500/40"
    >
      <div className="rounded-[14px] bg-white px-4 py-3.5">
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-saffron-600">
          <span className="text-base leading-none">👉</span>
          {label}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-[13px] font-semibold text-ink-700">
            Tap below to help Shanaya add it to her cart.
          </div>
          <motion.button
            type="button"
            onClick={onClick}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(255, 90, 100, 0.4)',
                '0 0 0 10px rgba(255, 90, 100, 0)',
                '0 0 0 0 rgba(255, 90, 100, 0)',
              ],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-coral-500 to-burgundy-500 px-4 py-2 text-[12px] font-extrabold uppercase tracking-wide text-white shadow-md"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
            {cta}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
