import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Ritwik v8 — SIMPLE minimal teen boy.
 *
 * Pose is normal standing — the sofa now renders OVER the character
 * so the cushion + back naturally hides the hip/legs, making him look
 * seated without needing awkward bent-knee SVGs.
 *
 * Changes per user (2026-05-29):
 *  - Kind, calm eyes: bigger almond shape with white sclera + soft
 *    black pupils + gentle highlight. Brows softly arched.
 *  - Hoodie colour: emerald green (was blue).
 */
export default function Ritwik({
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

  // Flat palette — green hoodie + dark pants
  const SKIN   = '#E8B98A';
  const HAIR   = '#1A0E08';
  const HOODIE = '#10B981';
  const PANTS  = '#1E293B';

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 200 360" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        {/* LEGS — straight, hidden by sofa cushion in front */}
        <rect x="78"  y="220" width="18" height="120" rx="6" fill={PANTS} />
        <rect x="104" y="220" width="18" height="120" rx="6" fill={PANTS} />
        {/* SHOES */}
        <ellipse cx="87"  cy="340" rx="12" ry="5" fill="#0F172A" />
        <ellipse cx="113" cy="340" rx="12" ry="5" fill="#0F172A" />

        {/* TORSO — green hoodie */}
        <path d="M 60 140 Q 60 128 76 122 L 124 122 Q 140 128 140 140 L 144 232 L 56 232 Z" fill={HOODIE} />
        <path d="M 72 178 Q 100 188 128 178 L 126 202 Q 100 210 74 202 Z" fill={HOODIE} stroke="#047857" strokeWidth="1.5" />
        <path d="M 76 130 Q 100 140 124 130 L 124 122 L 76 122 Z" fill="#047857" />

        {/* ARMS */}
        <path d="M 60 140 L 46 218 Q 46 224 52 226 L 62 226 L 64 180 Z" fill={HOODIE} />
        <path d="M 140 140 L 154 218 Q 154 224 148 226 L 138 226 L 136 180 Z" fill={HOODIE} />
        {/* HANDS */}
        <circle cx="55" cy="226" r="8" fill={SKIN} />
        <circle cx="145" cy="226" r="8" fill={SKIN} />

        {/* NECK */}
        <rect x="92" y="112" width="16" height="12" fill={SKIN} />

        {/* HEAD */}
        <circle cx="100" cy="80" r="38" fill={SKIN} />

        {/* HAIR */}
        <path d="M 64 78 Q 60 44 100 40 Q 140 44 136 78 L 136 60 Q 130 50 100 50 Q 70 50 64 60 Z" fill={HAIR} />
        <path d="M 70 64 Q 88 80 100 68 Q 112 80 130 64 L 132 80 Q 100 84 68 80 Z" fill={HAIR} />

        {/* EARS */}
        <ellipse cx="62" cy="84" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="138" cy="84" rx="4" ry="6" fill={SKIN} />

        {/* === EYES — kind, calm, almond shape with sclera + soft pupils === */}
        {blink ? (
          <>
            <path d="M 80 80 Q 88 82 96 80" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 104 80 Q 112 82 120 80" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Left eye: white sclera (almond) + iris + pupil + highlight */}
            <ellipse cx="88"  cy="80" rx="7" ry="5" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1.2" />
            <circle  cx={88 + eyeOffset}  cy="80" r="3.5" fill="#3B2A1A" />
            <circle  cx={88 + eyeOffset}  cy="80" r="2"   fill="#0A0604" />
            <circle  cx={89 + eyeOffset}  cy="79" r="1"   fill="#FFFFFF" />
            {/* Right eye */}
            <ellipse cx="112" cy="80" rx="7" ry="5" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1.2" />
            <circle  cx={112 + eyeOffset} cy="80" r="3.5" fill="#3B2A1A" />
            <circle  cx={112 + eyeOffset} cy="80" r="2"   fill="#0A0604" />
            <circle  cx={113 + eyeOffset} cy="79" r="1"   fill="#FFFFFF" />
          </>
        )}

        {/* EYEBROWS — soft arched (kind/calm) */}
        <path d="M 80 70 Q 88 67 96 70" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 104 70 Q 112 67 120 70" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* MOUTH */}
        <motion.path
          animate={{ d: mouthDef.d }}
          transition={{ duration: 0.10 }}
          fill={mouthDef.fill}
          stroke="#7B2933"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

function mouthShape(emotion, level) {
  if (emotion === 'shocked' || level >= 3) {
    return { d: 'M 90 96 Q 100 110 110 96 Q 100 108 90 96 Z', fill: '#3B0A18' };
  }
  if (level === 2) {
    return { d: 'M 92 97 Q 100 106 108 97 Q 100 104 92 97 Z', fill: '#3B0A18' };
  }
  if (level === 1) {
    return { d: 'M 94 98 Q 100 102 106 98 Q 100 101 94 98 Z', fill: '#7B2933' };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 90 96 Q 100 104 110 96', fill: 'transparent' };
  }
  if (emotion === 'unsettled' || emotion === 'guilty') {
    return { d: 'M 90 100 Q 100 94 110 100', fill: 'transparent' };
  }
  return { d: 'M 92 98 Q 100 102 108 98', fill: 'transparent' };
}
