import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Mom v6 — SIMPLE minimal woman, SITTING pose.
 *
 * Same restructuring as Ritwik v6 — torso upright, lap stubs over the
 * sofa cushion, shins hanging down in front. viewBox 200×280.
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
      <svg viewBox="0 0 200 280" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        {/* === SITTING LEGS === */}
        {/* Lap covered by kurta hem */}
        <rect x="74"  y="200" width="22" height="20" rx="4" fill={PANTS} />
        <rect x="104" y="200" width="22" height="20" rx="4" fill={PANTS} />
        {/* Shins */}
        <rect x="78"  y="218" width="14" height="46" rx="5" fill={PANTS} />
        <rect x="108" y="218" width="14" height="46" rx="5" fill={PANTS} />
        {/* Shoes — flat juttis */}
        <ellipse cx="85"  cy="266" rx="10" ry="4" fill="#3A2310" />
        <ellipse cx="115" cy="266" rx="10" ry="4" fill="#3A2310" />

        {/* LONG HAIR — back panel reaches just past shoulders */}
        <path d="M 56 80 Q 50 40 76 28 Q 100 18 124 28 Q 150 40 144 80 L 146 195 Q 146 205 134 205 L 66 205 Q 54 205 54 195 Z"
              fill={HAIR} />

        {/* KURTA — flat with flared hem covering lap */}
        <path d="M 62 128 Q 62 116 76 110 L 124 110 Q 138 116 138 128 L 148 215 Q 148 220 144 220 L 56 220 Q 52 220 52 215 Z"
              fill={KURTA} />
        {/* Gold V-neck */}
        <path d="M 80 114 Q 100 136 120 114 L 124 124 Q 100 144 76 124 Z" fill={GOLD} />
        {/* Gold hem trim */}
        <rect x="52" y="216" width="96" height="3" fill={GOLD} />

        {/* ARMS resting on lap */}
        <path d="M 62 128 L 52 196 Q 52 202 58 204 L 70 204 L 66 170 Z" fill={KURTA} />
        <path d="M 138 128 L 148 196 Q 148 202 142 204 L 130 204 L 134 170 Z" fill={KURTA} />
        <circle cx="60"  cy="204" r="7" fill={SKIN} />
        <circle cx="140" cy="204" r="7" fill={SKIN} />
        {/* Bangles */}
        <line x1="52" y1="194" x2="68" y2="194" stroke={GOLD} strokeWidth="2" />
        <line x1="132" y1="194" x2="148" y2="194" stroke={GOLD} strokeWidth="2" />

        {/* NECK */}
        <rect x="92" y="100" width="16" height="14" fill={SKIN} />

        {/* HEAD */}
        <ellipse cx="100" cy="66" rx="38" ry="40" fill={SKIN} />

        {/* HAIR top */}
        <path d="M 62 64 Q 58 30 100 26 Q 142 30 138 64 L 138 40 Q 124 34 100 34 Q 76 34 62 40 Z" fill={HAIR} />
        <path d="M 62 60 Q 60 80 64 100 L 70 100 Q 72 80 72 60 Z" fill={HAIR} />
        <path d="M 138 60 Q 140 80 136 100 L 130 100 Q 128 80 128 60 Z" fill={HAIR} />

        {/* EARS */}
        <ellipse cx="62" cy="70" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="138" cy="70" rx="4" ry="6" fill={SKIN} />
        <circle cx="62" cy="76" r="2" fill={GOLD} />
        <circle cx="138" cy="76" r="2" fill={GOLD} />

        {/* BINDI */}
        <circle cx="100" cy="46" r="3" fill={BINDI} />

        {/* EYES */}
        {blink ? (
          <>
            <path d="M 84 68 Q 90 70 96 68" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 104 68 Q 110 70 116 68" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={90 + eyeOffset}  cy="68" r="3" fill="#1A1426" />
            <circle cx={110 + eyeOffset} cy="68" r="3" fill="#1A1426" />
          </>
        )}
        {/* EYEBROWS */}
        <rect x="82" y="58" width="14" height="2" rx="1" fill={HAIR} />
        <rect x="104" y="58" width="14" height="2" rx="1" fill={HAIR} />

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
    return { d: 'M 92 84 Q 100 96 108 84 Q 100 94 92 84 Z', fill: '#5C1A2A' };
  }
  if (level === 2) {
    return { d: 'M 94 85 Q 100 93 106 85 Q 100 92 94 85 Z', fill: '#5C1A2A' };
  }
  if (level === 1) {
    return { d: 'M 95 86 Q 100 90 105 86 Q 100 89 95 86 Z', fill: '#A53E45' };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 92 84 Q 100 92 108 84', fill: 'transparent' };
  }
  return { d: 'M 94 86 Q 100 88 106 86 Q 100 87 94 86 Z', fill: '#A53E45' };
}
