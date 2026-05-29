import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Mom v8 — SIMPLE minimal woman.
 *
 * Pose is standing — the sofa renders OVER her in the home stages so
 * the cushion + back hide her hip/legs, making her look seated.
 *
 * Changes per user (2026-05-29):
 *  - Bindi removed.
 *  - Hair shortened to chin-length curly bob (was waist-length).
 *    Bumpy "scallop" curls along the bottom edge.
 *  - Kurta colour: warm orange/coral (was crimson).
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
  const KURTA = '#F97316';        // warm orange (new)
  const PANTS = '#3D1A0E';
  const GOLD  = '#FBBF24';

  return (
    <motion.div
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 200 360" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        {/* LEGS */}
        <rect x="80"  y="232" width="16" height="108" rx="6" fill={PANTS} />
        <rect x="104" y="232" width="16" height="108" rx="6" fill={PANTS} />
        <ellipse cx="88"  cy="340" rx="10" ry="4" fill="#3A2310" />
        <ellipse cx="112" cy="340" rx="10" ry="4" fill="#3A2310" />

        {/* === CURLY CHIN-LENGTH HAIR — back layer with scalloped curls === */}
        {/* Back panel that sits just behind the head, ending around the shoulders */}
        <path d="M 56 100 Q 50 60 76 48 Q 100 38 124 48 Q 150 60 144 100
                 Q 148 124 144 134 Q 138 128 134 134 Q 128 124 122 134
                 Q 114 126 108 134 Q 100 124 92 134 Q 86 126 78 134
                 Q 72 124 66 134 Q 60 128 56 134 Z"
              fill={HAIR} />

        {/* KURTA — warm orange, flared hem */}
        <path d="M 62 138 Q 62 124 76 120 L 124 120 Q 138 124 138 138 L 148 240 Q 148 244 144 244 L 56 244 Q 52 244 52 240 Z"
              fill={KURTA} />
        {/* Gold V-neck */}
        <path d="M 80 124 Q 100 146 120 124 L 124 134 Q 100 154 76 134 Z" fill={GOLD} />
        <rect x="52" y="240" width="96" height="3" fill={GOLD} />

        {/* ARMS */}
        <path d="M 62 138 L 48 222 Q 48 228 54 230 L 64 230 L 66 180 Z" fill={KURTA} />
        <path d="M 138 138 L 152 222 Q 152 228 146 230 L 136 230 L 134 180 Z" fill={KURTA} />
        <circle cx="57" cy="230" r="7" fill={SKIN} />
        <circle cx="143" cy="230" r="7" fill={SKIN} />
        <line x1="50" y1="220" x2="64" y2="220" stroke={GOLD} strokeWidth="2" />
        <line x1="136" y1="220" x2="150" y2="220" stroke={GOLD} strokeWidth="2" />

        {/* NECK */}
        <rect x="92" y="110" width="16" height="14" fill={SKIN} />

        {/* HEAD */}
        <ellipse cx="100" cy="76" rx="38" ry="40" fill={SKIN} />

        {/* === CURLY HAIR TOP — fluffy with visible curl loops === */}
        {/* Main hair cap on top of head */}
        <path d="M 60 74 Q 54 32 100 30 Q 146 32 140 74
                 Q 138 64 130 56 Q 124 64 118 56 Q 110 64 104 56 Q 96 64 90 56 Q 84 64 78 56 Q 72 64 64 56 Z"
              fill={HAIR} />
        {/* Side curls framing the face — bumpy loops */}
        <path d="M 60 70 Q 56 86 62 100 Q 56 110 66 116 L 76 116 Q 72 100 72 76 Z" fill={HAIR} />
        <path d="M 140 70 Q 144 86 138 100 Q 144 110 134 116 L 124 116 Q 128 100 128 76 Z" fill={HAIR} />
        {/* Visible curl loops (small circles along the edges for texture) */}
        <circle cx="64"  cy="46" r="5" fill={HAIR} />
        <circle cx="78"  cy="38" r="5" fill={HAIR} />
        <circle cx="100" cy="34" r="5" fill={HAIR} />
        <circle cx="122" cy="38" r="5" fill={HAIR} />
        <circle cx="136" cy="46" r="5" fill={HAIR} />
        <circle cx="60"  cy="108" r="4" fill={HAIR} />
        <circle cx="140" cy="108" r="4" fill={HAIR} />

        {/* EARS + studs */}
        <ellipse cx="62" cy="84" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="138" cy="84" rx="4" ry="6" fill={SKIN} />
        <circle cx="62" cy="90" r="2" fill={GOLD} />
        <circle cx="138" cy="90" r="2" fill={GOLD} />

        {/* EYES — same kind almond style as Ritwik */}
        {blink ? (
          <>
            <path d="M 82 78 Q 90 80 98 78" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 102 78 Q 110 80 118 78" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="90"  cy="78" rx="6.5" ry="4.5" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1.2" />
            <circle  cx={90 + eyeOffset}  cy="78" r="3" fill="#2C1A0F" />
            <circle  cx={90 + eyeOffset}  cy="78" r="1.6" fill="#0A0604" />
            <circle  cx={91 + eyeOffset}  cy="77" r="0.9" fill="#FFFFFF" />
            <ellipse cx="110" cy="78" rx="6.5" ry="4.5" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1.2" />
            <circle  cx={110 + eyeOffset} cy="78" r="3" fill="#2C1A0F" />
            <circle  cx={110 + eyeOffset} cy="78" r="1.6" fill="#0A0604" />
            <circle  cx={111 + eyeOffset} cy="77" r="0.9" fill="#FFFFFF" />
          </>
        )}
        {/* EYEBROWS — soft arched */}
        <path d="M 82 68 Q 90 65 98 68" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 102 68 Q 110 65 118 68" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />

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
