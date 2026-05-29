import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Ritwik v5 — SIMPLE minimal teen boy.
 *
 * Per user feedback (2026-05-29): scrap the detailed character, give
 * me something clean and simple. Flat fills (no gradients), basic
 * shapes, friendly proportions, 4 colours total — skin, hair, hoodie,
 * pants. Lip-sync still works because the mouth path morphs with
 * audio amplitude.
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

  // Flat colour palette — only 4 colours
  const SKIN   = '#E8B98A';
  const HAIR   = '#1A0E08';
  const HOODIE = '#2563EB';
  const PANTS  = '#1E293B';

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 200 360" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        {/* SHADOW */}
        <ellipse cx="100" cy="346" rx="40" ry="5" fill="#000" opacity="0.18" />

        {/* LEGS — flat pants */}
        <rect x="78"  y="220" width="18" height="120" rx="6" fill={PANTS} />
        <rect x="104" y="220" width="18" height="120" rx="6" fill={PANTS} />
        {/* SHOES — flat dark */}
        <ellipse cx="87"  cy="340" rx="12" ry="5" fill="#0F172A" />
        <ellipse cx="113" cy="340" rx="12" ry="5" fill="#0F172A" />

        {/* TORSO — flat hoodie */}
        <path d="M 60 140 Q 60 128 76 122 L 124 122 Q 140 128 140 140 L 144 232 L 56 232 Z"
              fill={HOODIE} />
        {/* Hoodie pocket — same colour but slightly different shape */}
        <path d="M 72 178 Q 100 188 128 178 L 126 202 Q 100 210 74 202 Z"
              fill={HOODIE} stroke="#1E40AF" strokeWidth="1.5" />
        {/* Hood opening */}
        <path d="M 76 130 Q 100 140 124 130 L 124 122 L 76 122 Z" fill="#1E40AF" />

        {/* ARMS — flat hoodie */}
        <path d="M 60 140 L 46 218 Q 46 224 52 226 L 62 226 L 64 180 Z" fill={HOODIE} />
        <path d="M 140 140 L 154 218 Q 154 224 148 226 L 138 226 L 136 180 Z" fill={HOODIE} />
        {/* HANDS — flat skin */}
        <circle cx="55" cy="226" r="8" fill={SKIN} />
        <circle cx="145" cy="226" r="8" fill={SKIN} />

        {/* NECK */}
        <rect x="92" y="112" width="16" height="12" fill={SKIN} />

        {/* HEAD — simple circle */}
        <circle cx="100" cy="80" r="38" fill={SKIN} />

        {/* HAIR — simple top cap */}
        <path d="M 64 78 Q 60 44 100 40 Q 140 44 136 78 L 136 60 Q 130 50 100 50 Q 70 50 64 60 Z" fill={HAIR} />
        {/* Simple side fringe */}
        <path d="M 70 64 Q 88 80 100 68 Q 112 80 130 64 L 132 80 Q 100 84 68 80 Z" fill={HAIR} />

        {/* EARS */}
        <ellipse cx="62" cy="84" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="138" cy="84" rx="4" ry="6" fill={SKIN} />

        {/* EYES — simple */}
        {blink ? (
          <>
            <path d="M 82 80 Q 88 82 94 80" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 106 80 Q 112 82 118 80" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={88 + eyeOffset}  cy="80" r="3" fill="#1A1426" />
            <circle cx={112 + eyeOffset} cy="80" r="3" fill="#1A1426" />
          </>
        )}

        {/* EYEBROWS — short flat marks */}
        <rect x="80" y="69" width="14" height="2.5" rx="1" fill={HAIR} />
        <rect x="106" y="69" width="14" height="2.5" rx="1" fill={HAIR} />

        {/* MOUTH — morphs with lip-sync */}
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
  return { d: 'M 94 98 Q 100 100 106 98', fill: 'transparent' };
}
