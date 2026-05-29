import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Ritwik v7 — SIMPLE minimal teen boy, ACTUALLY sitting.
 *
 * Per user feedback (2026-05-29 again): v6 still looked standing
 * because the legs were straight rectangles going down from the body.
 * v7 has a proper sitting silhouette — diagonal thighs going OUTWARD
 * from the hip to the knees (clearly bent), shins dropping straight
 * down from the knees, body slightly forward. Reads as seated from
 * the first glance.
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
      <svg viewBox="0 0 240 320" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        {/* === BENT LEGS — thighs going OUT then knees + shins going DOWN === */}
        {/* Left thigh — diagonal from left hip outward */}
        <polygon points="98,210 80,210 38,232 60,250" fill={PANTS} />
        {/* Left shin — straight down from knee */}
        <rect x="38" y="248" width="22" height="48" rx="4" fill={PANTS} />
        {/* Left shoe */}
        <ellipse cx="49" cy="298" rx="16" ry="5" fill="#0F172A" />

        {/* Right thigh — mirrored */}
        <polygon points="142,210 160,210 202,232 180,250" fill={PANTS} />
        {/* Right shin */}
        <rect x="180" y="248" width="22" height="48" rx="4" fill={PANTS} />
        {/* Right shoe */}
        <ellipse cx="191" cy="298" rx="16" ry="5" fill="#0F172A" />

        {/* === TORSO — hoodie, slightly leaned back as if on the couch === */}
        <path d="M 80 130 Q 80 118 96 112 L 144 112 Q 160 118 160 130 L 164 215 L 76 215 Z" fill={HOODIE} />
        {/* Hoodie pocket */}
        <path d="M 92 168 Q 120 178 148 168 L 146 200 Q 120 208 94 200 Z" fill={HOODIE} stroke="#1E40AF" strokeWidth="1.5" />
        {/* Hood opening */}
        <path d="M 96 120 Q 120 130 144 120 L 144 112 L 96 112 Z" fill="#1E40AF" />

        {/* === ARMS — resting on lap (hands forward over thighs) === */}
        <path d="M 80 130 L 64 200 Q 60 208 68 212 L 82 214 L 84 170 Z" fill={HOODIE} />
        <path d="M 160 130 L 176 200 Q 180 208 172 212 L 158 214 L 156 170 Z" fill={HOODIE} />
        {/* HANDS — resting on lap area */}
        <circle cx="74"  cy="214" r="9" fill={SKIN} />
        <circle cx="166" cy="214" r="9" fill={SKIN} />

        {/* === NECK === */}
        <rect x="112" y="102" width="16" height="12" fill={SKIN} />

        {/* === HEAD === */}
        <circle cx="120" cy="70" r="38" fill={SKIN} />

        {/* HAIR */}
        <path d="M 84 68 Q 80 34 120 30 Q 160 34 156 68 L 156 50 Q 150 40 120 40 Q 90 40 84 50 Z" fill={HAIR} />
        <path d="M 90 54 Q 108 70 120 58 Q 132 70 150 54 L 152 70 Q 120 74 88 70 Z" fill={HAIR} />

        {/* EARS */}
        <ellipse cx="82" cy="74" rx="4" ry="6" fill={SKIN} />
        <ellipse cx="158" cy="74" rx="4" ry="6" fill={SKIN} />

        {/* EYES */}
        {blink ? (
          <>
            <path d="M 102 70 Q 108 72 114 70" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 126 70 Q 132 72 138 70" stroke="#1A1426" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={108 + eyeOffset} cy="70" r="3" fill="#1A1426" />
            <circle cx={132 + eyeOffset} cy="70" r="3" fill="#1A1426" />
          </>
        )}
        {/* EYEBROWS */}
        <rect x="100" y="59" width="14" height="2.5" rx="1" fill={HAIR} />
        <rect x="126" y="59" width="14" height="2.5" rx="1" fill={HAIR} />

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
    return { d: 'M 110 86 Q 120 100 130 86 Q 120 98 110 86 Z', fill: '#3B0A18' };
  }
  if (level === 2) {
    return { d: 'M 112 87 Q 120 96 128 87 Q 120 94 112 87 Z', fill: '#3B0A18' };
  }
  if (level === 1) {
    return { d: 'M 114 88 Q 120 92 126 88 Q 120 91 114 88 Z', fill: '#7B2933' };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 110 86 Q 120 94 130 86', fill: 'transparent' };
  }
  if (emotion === 'unsettled' || emotion === 'guilty') {
    return { d: 'M 110 90 Q 120 84 130 90', fill: 'transparent' };
  }
  return { d: 'M 114 88 Q 120 90 126 88', fill: 'transparent' };
}
