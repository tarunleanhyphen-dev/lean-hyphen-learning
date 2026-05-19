import { motion } from 'framer-motion';

/**
 * Three-dot "typing" indicator. Rendered briefly inside a thought bubble
 * before the actual text appears, so each thought feels like Shanaya is
 * forming it in real time (rather than the bubble just popping in fully
 * written).
 */
export default function TypingDots({ tone = 'thought' }) {
  const dotClass = tone === 'speech'
    ? 'bg-coral-500/80'
    : 'bg-ink-700/60';
  return (
    <div className="inline-flex items-center gap-1 py-1" aria-label="thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`block h-1.5 w-1.5 rounded-full ${dotClass}`}
          animate={{ y: [0, -3, 0], opacity: [0.45, 1, 0.45] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
