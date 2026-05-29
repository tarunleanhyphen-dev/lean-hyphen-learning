import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Ritwik v6 — SIMPLE minimal teen boy, SITTING pose.
 *
 * Per user feedback (2026-05-29): the sofa is right there, they
 * shouldn't be standing. Pose is now seated upright — torso normal
 * height, legs bent forward over the seat with shins hanging down.
 * Stage2D positions the character so the hip area lands on the sofa
 * cushion and the shins hang down in front.
 *
 * Total viewBox: 200×280 (shorter than the standing 360).
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

  // 4-colour flat palette
  const SKIN   = '#E8B98A';
  const HAIR   = '#1A0E08';
  const HOODIE = '#2563EB';
  const PANTS  = '#1E293B';

  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 200 280" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        {/* === SITTING LEGS — short thigh stubs + shins going down === */}
        {/* Lap / upper thigh — sits on the cushion */}
        <rect x="74"  y="200" width="22" height="20" rx="4" fill={PANTS} />
        <rect x="104" y="200" width="22" height="20" rx="4" fill={PANTS} />
        {/* Shins hanging down in front of the sofa */}
        <rect x="78"  y="218" width="14" height="46" rx="5" fill={PANTS} />
        <rect x="108" y="218" width="14" height="46" rx="5" fill={PANTS} />
        {/* Shoes */}
        <ellipse cx="85"  cy="266" rx="12" ry="4" fill="#0F172A" />
        <ellipse cx="115" cy="266" rx="12" ry="4" fill="#0F172A" />

        {/* === TORSO — flat hoodie === */}
        <path d="M 60 130 Q 60 118 76 112 L 124 112 Q 140 118 140 130 L 144 202 L 56 202 Z" fill={HOODIE} />
        {/* Hoodie pocket */}
        <path d="M 72 168 Q 100 178 128 168 L 126 192 Q 100 200 74 192 Z" fill={HOODIE} stroke="#1E40AF" strokeWidth="1.5" />
        {/* Hood opening */}
        <path d="M 76 120 Q 100 130 124 120 L 124 112 L 76 112 Z" fill="#1E40AF" />

        {/* ARMS — resting on lap */}
        <path d="M 60 130 L 50 196 Q 50 202 56 204 L 70 204 L 64 170 Z" fill={HOODIE} />
        <path d="M 140 130 L 150 196 Q 150 202 144 204 L 130 204 L 136 170 Z" fill={HOODIE} />
        <circle cx="60"  cy="204" r="8" fill={SKIN} />
        <circle cx="140" cy="204" r="8" fill={SKIN} />

        {/* NECK */}
        <rect x="92" y="102" width="16" height="12" fill={SKIN} />

        {/* HEAD — circle */}
        <circle cx="100" cy="70" r="38" fill={SKIN} />

        {/* HAIR */}
        <path d="M 64 68 Q 60 34 100 30 Q 140 34 136 68 L 136 50 Q 130 40 100 40 Q 70 40 64 50 Z" fill={HAIR} />
        <path d="M 70 54 Q 88 70 100 58 Q 112 70 130 54 L 132 70 Q 100 74 68 70 Z" fill={HAIR} />

        {/* EARS */}
        <ellipse cx="62" cy="74" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="138" cy="74" rx="4" ry="6" fill={SKIN} />

        {/* EYES */}
        {blink ? (
          <>
            <path d="M 82 70 Q 88 72 94 70" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 106 70 Q 112 72 118 70" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={88 + eyeOffset}  cy="70" r="3" fill="#1A1426" />
            <circle cx={112 + eyeOffset} cy="70" r="3" fill="#1A1426" />
          </>
        )}
        {/* EYEBROWS */}
        <rect x="80" y="59" width="14" height="2.5" rx="1" fill={HAIR} />
        <rect x="106" y="59" width="14" height="2.5" rx="1" fill={HAIR} />

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
    return { d: 'M 90 86 Q 100 100 110 86 Q 100 98 90 86 Z', fill: '#3B0A18' };
  }
  if (level === 2) {
    return { d: 'M 92 87 Q 100 96 108 87 Q 100 94 92 87 Z', fill: '#3B0A18' };
  }
  if (level === 1) {
    return { d: 'M 94 88 Q 100 92 106 88 Q 100 91 94 88 Z', fill: '#7B2933' };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 90 86 Q 100 94 110 86', fill: 'transparent' };
  }
  if (emotion === 'unsettled' || emotion === 'guilty') {
    return { d: 'M 90 90 Q 100 84 110 90', fill: 'transparent' };
  }
  return { d: 'M 94 88 Q 100 90 106 88', fill: 'transparent' };
}
