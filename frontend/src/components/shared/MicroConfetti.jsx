import { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Small one-shot confetti burst. Render it when `active=true` and it
 * emits ~28 colored particles outward from the center of its container,
 * each on a slightly different trajectory, then fades them out. Pointer-
 * events are off so it can sit on top of activity cards without
 * interfering with clicks.
 *
 * Use a unique `keyId` per burst (e.g. the activity id + completion
 * timestamp) so a new burst plays on each completion even when the
 * parent doesn't unmount the component.
 */
export default function MicroConfetti({ active, keyId, count = 28, duration = 1.5 }) {
  const particles = useMemo(() => {
    if (!active) return [];
    const palette = ['#FF9F1C', '#FF6B6B', '#27AE60', '#FFD23F', '#9B5DE5', '#06D6A0'];
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const distance = 70 + Math.random() * 90;
      return {
        id: i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 30, // bias upward
        rotate: (Math.random() - 0.5) * 540,
        size: 6 + Math.random() * 6,
        color: palette[i % palette.length],
        shape: i % 3 === 0 ? 'rect' : 'circle',
        delay: Math.random() * 0.08,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, keyId, count]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      key={keyId}
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.6 }}
          animate={{ x: p.dx, y: p.dy, opacity: [0, 1, 1, 0], rotate: p.rotate, scale: 1 }}
          transition={{ duration, delay: p.delay, ease: [0.16, 1, 0.3, 1], times: [0, 0.15, 0.7, 1] }}
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'rect' ? 2 : '50%',
            position: 'absolute',
          }}
        />
      ))}
    </div>
  );
}
