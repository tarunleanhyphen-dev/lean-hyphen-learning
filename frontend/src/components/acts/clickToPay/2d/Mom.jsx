import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Mom v7 — SIMPLE minimal woman, ACTUALLY sitting.
 *
 * Same restructuring as Ritwik v7 — diagonal thighs going out from
 * the hip to the knees, shins dropping straight down from there.
 * Reads as seated immediately, not standing.
 */
export default function Mom({
  speaking = false,
  amplitudeRef,
  emotion = 'neutral',
  lookAt = 'forward',
  className = '',
}) {
  const [mouthLevel, setMouthLevel] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!speaking) { setMouthLevel(0); return undefined; }
    let raf = 0;
    let smoothed = 0;
    let lastSwitch = 0;
    let lastLevel = -1;
    const tick = (now) => {
      const raw = amplitudeRef?.current ?? 0;
      const boosted = Math.min(1, Math.max(0, (raw - 0.03) * 3.0));
      const alpha = boosted > smoothed ? 0.65 : 0.30;
      smoothed = smoothed * (1 - alpha) + boosted * alpha;
      const desired = smoothed > 0.55 ? 3 : smoothed > 0.28 ? 2 : smoothed > 0.10 ? 1 : 0;
      if (desired !== lastLevel && now - lastSwitch > 60) {
        lastSwitch = now;
        lastLevel = desired;
        setMouthLevel(desired);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, amplitudeRef]);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    }, 4500 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);

  const eyeOffset = lookAt === 'left' ? -1.5 : lookAt === 'right' ? 1.5 : 0;
  const mouthDef = mouthShape(emotion, mouthLevel);

  const SKIN  = '#ECC09A';
  const HAIR  = '#1A0E08';
  const KURTA = '#E11D48';
  const PANTS = '#3D1A0E';
  const GOLD  = '#FBBF24';
  const BINDI = '#DC2626';

  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 240 320" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        {/* === BENT LEGS — thighs out, shins down === */}
        <polygon points="98,215 80,215 38,235 60,252" fill={PANTS} />
        <rect x="38" y="250" width="22" height="48" rx="4" fill={PANTS} />
        <ellipse cx="49" cy="300" rx="14" ry="5" fill="#3A2310" />

        <polygon points="142,215 160,215 202,235 180,252" fill={PANTS} />
        <rect x="180" y="250" width="22" height="48" rx="4" fill={PANTS} />
        <ellipse cx="191" cy="300" rx="14" ry="5" fill="#3A2310" />

        {/* LONG HAIR — back panel just past shoulders */}
        <path d="M 76 80 Q 70 40 96 28 Q 120 18 144 28 Q 170 40 164 80 L 168 200 Q 168 212 156 212 L 84 212 Q 72 212 72 200 Z"
              fill={HAIR} />

        {/* KURTA — flat with flared hem covering lap */}
        <path d="M 82 128 Q 82 116 96 110 L 144 110 Q 158 116 158 128 L 168 220 Q 168 225 164 225 L 76 225 Q 72 225 72 220 Z"
              fill={KURTA} />
        {/* Gold V-neck */}
        <path d="M 100 114 Q 120 136 140 114 L 144 124 Q 120 144 96 124 Z" fill={GOLD} />
        {/* Gold hem */}
        <rect x="72" y="221" width="96" height="3" fill={GOLD} />

        {/* ARMS — resting on lap */}
        <path d="M 82 128 L 66 200 Q 62 208 70 212 L 84 214 L 86 170 Z" fill={KURTA} />
        <path d="M 158 128 L 174 200 Q 178 208 170 212 L 156 214 L 154 170 Z" fill={KURTA} />
        <circle cx="76"  cy="214" r="8" fill={SKIN} />
        <circle cx="164" cy="214" r="8" fill={SKIN} />
        <line x1="66" y1="204" x2="84" y2="204" stroke={GOLD} strokeWidth="2" />
        <line x1="156" y1="204" x2="174" y2="204" stroke={GOLD} strokeWidth="2" />

        {/* NECK */}
        <rect x="112" y="100" width="16" height="14" fill={SKIN} />

        {/* HEAD */}
        <ellipse cx="120" cy="66" rx="38" ry="40" fill={SKIN} />

        {/* HAIR top */}
        <path d="M 82 64 Q 78 30 120 26 Q 162 30 158 64 L 158 40 Q 144 34 120 34 Q 96 34 82 40 Z" fill={HAIR} />
        <path d="M 82 60 Q 80 80 84 100 L 90 100 Q 92 80 92 60 Z" fill={HAIR} />
        <path d="M 158 60 Q 160 80 156 100 L 150 100 Q 148 80 148 60 Z" fill={HAIR} />

        {/* EARS + studs */}
        <ellipse cx="82" cy="70" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="158" cy="70" rx="4" ry="6" fill={SKIN} />
        <circle cx="82" cy="76" r="2" fill={GOLD} />
        <circle cx="158" cy="76" r="2" fill={GOLD} />

        {/* BINDI */}
        <circle cx="120" cy="46" r="3" fill={BINDI} />

        {/* EYES */}
        {blink ? (
          <>
            <path d="M 104 68 Q 110 70 116 68" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 124 68 Q 130 70 136 68" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={110 + eyeOffset} cy="68" r="3" fill="#1A1426" />
            <circle cx={130 + eyeOffset} cy="68" r="3" fill="#1A1426" />
          </>
        )}
        {/* EYEBROWS */}
        <rect x="102" y="58" width="14" height="2" rx="1" fill={HAIR} />
        <rect x="124" y="58" width="14" height="2" rx="1" fill={HAIR} />

        {/* LIPS */}
        <motion.path
          animate={{ d: mouthDef.d }}
          transition={{ duration: 0.10 }}
          fill={mouthDef.fill}
          stroke="#8B1A2B"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

function mouthShape(emotion, level) {
  if (emotion === 'shocked' || level >= 3) {
    return { d: 'M 112 84 Q 120 96 128 84 Q 120 94 112 84 Z', fill: '#5C1A2A' };
  }
  if (level === 2) {
    return { d: 'M 114 85 Q 120 93 126 85 Q 120 92 114 85 Z', fill: '#5C1A2A' };
  }
  if (level === 1) {
    return { d: 'M 115 86 Q 120 90 125 86 Q 120 89 115 86 Z', fill: '#A53E45' };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 112 84 Q 120 92 128 84', fill: 'transparent' };
  }
  return { d: 'M 114 86 Q 120 88 126 86 Q 120 87 114 86 Z', fill: '#A53E45' };
}
