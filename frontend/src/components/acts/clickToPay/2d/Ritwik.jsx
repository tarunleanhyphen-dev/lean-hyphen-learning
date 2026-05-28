import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Ritwik — hand-built SVG cartoon of a 13-year-old Indian boy:
 * round-ish face, brown skin, messy black hair with a strong fringe over
 * the forehead, big expressive anime-style eyes, casual blue hoodie with
 * a drawstring + pocket pouch, dark jeans, sneakers. Holding a phone in
 * his right hand.
 *
 * Animations:
 *   - Idle bob (CSS transform on the whole svg)
 *   - Talk: mouth shape morphs between closed line / parted / wide-open
 *     based on `speaking` + `amplitudeRef`
 *   - Blink loop (~6 s, 140 ms close)
 *   - Pupils softly shift in the direction of `lookAt` ('left' | 'right' |
 *     'forward')
 *   - Emotion: brow tilt + mouth shape choice
 */
export default function Ritwik({
  speaking = false,
  amplitudeRef,
  emotion = 'neutral',
  lookAt = 'forward',
  className = '',
}) {
  const mouthRef = useRef(null);
  const [mouthLevel, setMouthLevel] = useState(0);     // 0–3
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!speaking) { setMouthLevel(0); return undefined; }
    let raf = 0;
    let smoothed = 0;
    let lastSwitch = 0;
    let lastLevel = -1;
    const tick = (now) => {
      const raw = amplitudeRef?.current ?? 0;
      const boosted = Math.min(1, Math.max(0, (raw - 0.04) * 2.6));
      const alpha = boosted > smoothed ? 0.55 : 0.22;
      smoothed = smoothed * (1 - alpha) + boosted * alpha;
      const desired = smoothed > 0.55 ? 3 : smoothed > 0.30 ? 2 : smoothed > 0.12 ? 1 : 0;
      if (desired !== lastLevel && now - lastSwitch > 80) {
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
      setTimeout(() => setBlink(false), 140);
    }, 4500 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);

  const eyeOffset = lookAt === 'left' ? -3 : lookAt === 'right' ? 3 : 0;
  const brow = browFor(emotion);
  const mouthDef = mouthShape(emotion, mouthLevel);

  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 240 360" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rw-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F0C99C" />
            <stop offset="100%" stopColor="#D9A876" />
          </linearGradient>
          <linearGradient id="rw-hoodie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="rw-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1A0E08" />
            <stop offset="100%" stopColor="#0A0604" />
          </linearGradient>
          <linearGradient id="rw-jeans" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1E3A5F" />
            <stop offset="100%" stopColor="#0F1F33" />
          </linearGradient>
          <radialGradient id="rw-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#E88B6C" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E88B6C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* SHADOW under feet */}
        <ellipse cx="120" cy="338" rx="62" ry="8" fill="#000" opacity="0.18" />

        {/* LEGS — jeans */}
        <rect x="92"  y="240" width="22" height="90" rx="10" fill="url(#rw-jeans)" />
        <rect x="126" y="240" width="22" height="90" rx="10" fill="url(#rw-jeans)" />
        {/* SHOES */}
        <ellipse cx="103" cy="332" rx="16" ry="7" fill="#0F172A" />
        <ellipse cx="137" cy="332" rx="16" ry="7" fill="#0F172A" />
        <rect x="89"  y="328" width="28" height="3" fill="#FFFFFF" opacity="0.4" />
        <rect x="123" y="328" width="28" height="3" fill="#FFFFFF" opacity="0.4" />

        {/* TORSO — hoodie */}
        <path d="M 60 150 Q 60 130 80 125 L 160 125 Q 180 130 180 150 L 184 240 L 56 240 Z"
              fill="url(#rw-hoodie)" stroke="#1E3A8A" strokeWidth="2" />
        {/* Hoodie pocket */}
        <path d="M 80 195 Q 120 215 160 195 L 158 220 Q 120 235 82 220 Z"
              fill="#1E3A8A" opacity="0.7" />
        {/* Hoodie collar/hood neckline */}
        <path d="M 88 130 Q 120 145 152 130 L 155 122 L 85 122 Z"
              fill="#1E3A8A" opacity="0.85" />
        {/* Drawstrings */}
        <line x1="112" y1="148" x2="108" y2="180" stroke="#F1F5F9" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="128" y1="148" x2="132" y2="180" stroke="#F1F5F9" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="108" cy="182" r="3" fill="#F1F5F9" />
        <circle cx="132" cy="182" r="3" fill="#F1F5F9" />

        {/* ARMS — hoodie sleeves */}
        <path d="M 60 150 L 38 215 Q 36 225 44 230 L 56 232 L 60 200 Z" fill="url(#rw-hoodie)" stroke="#1E3A8A" strokeWidth="2" />
        <path d="M 180 150 L 202 215 Q 204 225 196 230 L 184 232 L 180 200 Z" fill="url(#rw-hoodie)" stroke="#1E3A8A" strokeWidth="2" />
        {/* HANDS */}
        <circle cx="44" cy="232" r="11" fill="url(#rw-skin)" stroke="#A06B40" strokeWidth="1.5" />
        <circle cx="196" cy="232" r="11" fill="url(#rw-skin)" stroke="#A06B40" strokeWidth="1.5" />
        {/* PHONE in right hand */}
        <rect x="188" y="225" width="14" height="22" rx="2.5" fill="#0F172A" stroke="#374151" strokeWidth="1" transform="rotate(-15 195 236)" />
        <rect x="190" y="227" width="10" height="18" rx="1.5" fill="#2563EB" opacity="0.6" transform="rotate(-15 195 236)" />

        {/* NECK */}
        <rect x="106" y="116" width="28" height="16" fill="url(#rw-skin)" />
        <path d="M 106 120 Q 120 130 134 120" stroke="#A06B40" strokeWidth="1" fill="none" />

        {/* HEAD — face shape */}
        <path d="M 70 70 Q 70 30 120 30 Q 170 30 170 70 L 168 100 Q 165 122 120 124 Q 75 122 72 100 Z"
              fill="url(#rw-skin)" stroke="#A06B40" strokeWidth="1.5" />
        {/* Ears */}
        <ellipse cx="72" cy="82" rx="7" ry="11" fill="url(#rw-skin)" stroke="#A06B40" strokeWidth="1" />
        <ellipse cx="168" cy="82" rx="7" ry="11" fill="url(#rw-skin)" stroke="#A06B40" strokeWidth="1" />
        <path d="M 70 80 Q 73 86 70 92" stroke="#A06B40" strokeWidth="0.8" fill="none" />
        <path d="M 170 80 Q 167 86 170 92" stroke="#A06B40" strokeWidth="0.8" fill="none" />

        {/* CHEEKS — soft blush */}
        <circle cx="90" cy="90" r="8" fill="url(#rw-cheek)" />
        <circle cx="150" cy="90" r="8" fill="url(#rw-cheek)" />

        {/* HAIR — messy with strong fringe */}
        <path d="M 65 70 Q 60 35 95 24 Q 120 18 145 24 Q 180 32 178 75 L 175 56 Q 165 38 145 35
                 L 150 50 Q 130 38 120 48 Q 110 38 90 50 L 95 35 Q 75 38 65 56 Z"
              fill="url(#rw-hair)" />
        {/* Fringe tufts over forehead */}
        <path d="M 78 55 Q 86 75 96 60 Q 100 70 110 58 Q 115 70 125 56 Q 132 70 142 56 Q 148 72 158 56 Q 162 65 168 55 L 170 70 Q 130 76 75 72 Z"
              fill="url(#rw-hair)" />
        {/* Highlight */}
        <path d="M 100 36 Q 115 30 140 35" stroke="#3E2818" strokeWidth="2" fill="none" opacity="0.6" />

        {/* EYEBROWS */}
        <motion.path
          animate={{
            d: `M ${88 - brow.tiltL} ${65 + brow.lift} Q 100 ${60 + brow.lift + brow.tiltL} 112 ${66 + brow.lift}`,
          }}
          transition={{ duration: 0.25 }}
          stroke="#1A0E08" strokeWidth="4" strokeLinecap="round" fill="none"
        />
        <motion.path
          animate={{
            d: `M ${128 + brow.tiltR} ${66 + brow.lift} Q 140 ${60 + brow.lift + brow.tiltR} 152 ${65 + brow.lift}`,
          }}
          transition={{ duration: 0.25 }}
          stroke="#1A0E08" strokeWidth="4" strokeLinecap="round" fill="none"
        />

        {/* EYES — big anime-style */}
        <g>
          {/* Left eye white */}
          <motion.ellipse
            cx="100" cy="80"
            rx="11"
            animate={{ ry: blink ? 0.5 : 9 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.5"
          />
          {/* Left iris/pupil */}
          {!blink && (
            <>
              <ellipse cx={100 + eyeOffset} cy="80" rx="6" ry="6" fill="#3B2A1A" />
              <circle cx={100 + eyeOffset} cy="80" r="3.5" fill="#1A0E08" />
              <circle cx={101 + eyeOffset} cy="78" r="1.5" fill="#FFFFFF" />
              <circle cx={98  + eyeOffset} cy="82" r="0.8" fill="#FFFFFF" />
            </>
          )}
          {/* Right eye */}
          <motion.ellipse
            cx="140" cy="80"
            rx="11"
            animate={{ ry: blink ? 0.5 : 9 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.5"
          />
          {!blink && (
            <>
              <ellipse cx={140 + eyeOffset} cy="80" rx="6" ry="6" fill="#3B2A1A" />
              <circle cx={140 + eyeOffset} cy="80" r="3.5" fill="#1A0E08" />
              <circle cx={141 + eyeOffset} cy="78" r="1.5" fill="#FFFFFF" />
              <circle cx={138 + eyeOffset} cy="82" r="0.8" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* NOSE — small button */}
        <path d="M 117 96 Q 120 102 123 96" stroke="#A06B40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="120" cy="98" r="1.2" fill="#A06B40" opacity="0.5" />

        {/* MOUTH — morphs by emotion + amplitude */}
        <motion.path
          ref={mouthRef}
          animate={{ d: mouthDef.d }}
          transition={{ duration: 0.12 }}
          fill={mouthDef.fill}
          stroke="#7B2933"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Teeth peek when mouth open */}
        {mouthDef.teeth && (
          <rect x="111" y="111" width="18" height="3" rx="0.5" fill="#FFFFFF" opacity="0.9" />
        )}
      </svg>
    </motion.div>
  );
}

function browFor(emotion) {
  switch (emotion) {
    case 'shocked':   return { lift: -6, tiltL:  3, tiltR: -3 };
    case 'realised':  return { lift: -3, tiltL:  2, tiltR: -2 };
    case 'unsettled': return { lift:  3, tiltL: -3, tiltR:  3 };
    case 'curious':   return { lift: -2, tiltL: -3, tiltR:  3 };
    case 'happy':
    case 'confident': return { lift:  0, tiltL: -1, tiltR:  1 };
    default:          return { lift:  0, tiltL:  0, tiltR:  0 };
  }
}

function mouthShape(emotion, level) {
  // d = SVG path for the mouth, fill = inner colour
  // level 0 closed / 1 small open / 2 medium open / 3 wide open
  if (emotion === 'shocked' || level >= 3) {
    return { d: 'M 105 110 Q 120 130 135 110 Q 120 124 105 110 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 108 112 Q 120 122 132 112 Q 120 120 108 112 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 110 113 Q 120 119 130 113 Q 120 117 110 113 Z', fill: '#7B2933', teeth: false };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 105 110 Q 120 124 135 110', fill: 'transparent', teeth: false };
  }
  if (emotion === 'unsettled' || emotion === 'guilty') {
    return { d: 'M 105 116 Q 120 104 135 116', fill: 'transparent', teeth: false };
  }
  return { d: 'M 108 113 Q 120 117 132 113', fill: 'transparent', teeth: false };
}
