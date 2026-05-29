import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Mom v5 — SIMPLE minimal woman.
 *
 * Per user feedback (2026-05-29): clean and simple. Flat fills, basic
 * shapes, 5 colours total — skin, hair, kurta, pants, gold/bindi. Lip-
 * sync still works because the mouth path morphs with audio amplitude.
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

  // Flat colour palette
  const SKIN  = '#ECC09A';
  const HAIR  = '#1A0E08';
  const KURTA = '#E11D48';
  const PANTS = '#3D1A0E';
  const GOLD  = '#FBBF24';
  const BINDI = '#DC2626';

  return (
    <motion.div
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 200 360" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        {/* SHADOW */}
        <ellipse cx="100" cy="346" rx="44" ry="5" fill="#000" opacity="0.18" />

        {/* LEGS */}
        <rect x="80"  y="232" width="16" height="108" rx="6" fill={PANTS} />
        <rect x="104" y="232" width="16" height="108" rx="6" fill={PANTS} />
        {/* SHOES */}
        <ellipse cx="88"  cy="340" rx="10" ry="4" fill="#3A2310" />
        <ellipse cx="112" cy="340" rx="10" ry="4" fill="#3A2310" />

        {/* LONG HAIR — back panel reaches just past shoulders */}
        <path d="M 56 90 Q 50 50 76 38 Q 100 28 124 38 Q 150 50 144 90 L 146 200 Q 146 212 134 212 L 66 212 Q 54 212 54 200 Z"
              fill={HAIR} />

        {/* KURTA — flat with flared hem */}
        <path d="M 62 138 Q 62 124 76 120 L 124 120 Q 138 124 138 138 L 148 240 Q 148 244 144 244 L 56 244 Q 52 244 52 240 Z"
              fill={KURTA} />
        {/* Gold V-neckline */}
        <path d="M 80 124 Q 100 146 120 124 L 124 134 Q 100 154 76 134 Z" fill={GOLD} />
        {/* Gold hem trim */}
        <rect x="52" y="240" width="96" height="3" fill={GOLD} />

        {/* ARMS */}
        <path d="M 62 138 L 48 222 Q 48 228 54 230 L 64 230 L 66 180 Z" fill={KURTA} />
        <path d="M 138 138 L 152 222 Q 152 228 146 230 L 136 230 L 134 180 Z" fill={KURTA} />
        {/* HANDS */}
        <circle cx="57" cy="230" r="7" fill={SKIN} />
        <circle cx="143" cy="230" r="7" fill={SKIN} />
        {/* Gold bangles — single line on each wrist */}
        <line x1="50" y1="220" x2="64" y2="220" stroke={GOLD} strokeWidth="2" />
        <line x1="136" y1="220" x2="150" y2="220" stroke={GOLD} strokeWidth="2" />

        {/* NECK */}
        <rect x="92" y="110" width="16" height="14" fill={SKIN} />

        {/* HEAD — simple oval */}
        <ellipse cx="100" cy="76" rx="38" ry="40" fill={SKIN} />

        {/* HAIR top — middle parting */}
        <path d="M 62 74 Q 58 40 100 36 Q 142 40 138 74 L 138 50 Q 124 44 100 44 Q 76 44 62 50 Z" fill={HAIR} />
        {/* Side strands down to jaw */}
        <path d="M 62 70 Q 60 90 64 110 L 70 110 Q 72 90 72 70 Z" fill={HAIR} />
        <path d="M 138 70 Q 140 90 136 110 L 130 110 Q 128 90 128 70 Z" fill={HAIR} />

        {/* EARS */}
        <ellipse cx="62" cy="80" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="138" cy="80" rx="4" ry="6" fill={SKIN} />
        {/* Gold studs */}
        <circle cx="62" cy="86" r="2" fill={GOLD} />
        <circle cx="138" cy="86" r="2" fill={GOLD} />

        {/* BINDI */}
        <circle cx="100" cy="56" r="3" fill={BINDI} />

        {/* EYES */}
        {blink ? (
          <>
            <path d="M 84 78 Q 90 80 96 78" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 104 78 Q 110 80 116 78" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={90 + eyeOffset}  cy="78" r="3" fill="#1A1426" />
            <circle cx={110 + eyeOffset} cy="78" r="3" fill="#1A1426" />
          </>
        )}

        {/* EYEBROWS — short flat marks */}
        <rect x="82" y="68" width="14" height="2" rx="1" fill={HAIR} />
        <rect x="104" y="68" width="14" height="2" rx="1" fill={HAIR} />

        {/* LIPS — small lipsticked mouth */}
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
    return { d: 'M 92 94 Q 100 106 108 94 Q 100 104 92 94 Z', fill: '#5C1A2A' };
  }
  if (level === 2) {
    return { d: 'M 94 95 Q 100 103 106 95 Q 100 102 94 95 Z', fill: '#5C1A2A' };
  }
  if (level === 1) {
    return { d: 'M 95 96 Q 100 100 105 96 Q 100 99 95 96 Z', fill: '#A53E45' };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 92 94 Q 100 102 108 94', fill: 'transparent' };
  }
  return { d: 'M 94 96 Q 100 98 106 96 Q 100 97 94 96 Z', fill: '#A53E45' };
}
