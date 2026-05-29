import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Ritwik v3 — 15-16 year old Indian teen boy.
 *
 * Taller, thinner proportions than v2 (viewBox 240×440 — head is now
 * ~1/6.5 of total height, body slender). Refined facial features:
 * defined jawline, hint of nose contour, almond-shaped eyes, defined
 * eyebrows, proper hair with side-parting + fringe over the forehead,
 * slight stubble of jawline shadow.
 *
 * Clothing: navy hoodie (well-fitted on a slim frame) with white
 * drawstrings + kangaroo pocket, slim dark jeans, white sneakers with
 * coloured sole accent, phone in his right hand.
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

  const eyeOffset = lookAt === 'left' ? -2.5 : lookAt === 'right' ? 2.5 : 0;
  const brow = browFor(emotion);
  const mouthDef = mouthShape(emotion, mouthLevel);

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 240 440" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="rk3-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E8B98A" />
            <stop offset="100%" stopColor="#D49E72" />
          </linearGradient>
          <linearGradient id="rk3-hoodie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B5998" />
            <stop offset="100%" stopColor="#1E3A5F" />
          </linearGradient>
          <linearGradient id="rk3-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#241612" />
            <stop offset="100%" stopColor="#0F0908" />
          </linearGradient>
          <linearGradient id="rk3-jeans" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <radialGradient id="rk3-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#E88B6C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#E88B6C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* SHADOW */}
        <ellipse cx="120" cy="420" rx="48" ry="6" fill="#000" opacity="0.22" />

        {/* === LEGS — slim jeans === */}
        <rect x="100" y="290" width="16" height="118" rx="7" fill="url(#rk3-jeans)" />
        <rect x="124" y="290" width="16" height="118" rx="7" fill="url(#rk3-jeans)" />
        {/* Knee accent lines (fold) */}
        <path d="M 100 340 Q 108 343 116 340" stroke="#0F172A" strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M 124 340 Q 132 343 140 340" stroke="#0F172A" strokeWidth="0.8" fill="none" opacity="0.5" />
        {/* SHOES — sneakers with coloured sole */}
        <path d="M 92 408 L 122 408 L 122 416 L 92 416 Z" fill="#FFFFFF" />
        <path d="M 92 414 L 122 414 L 122 418 L 92 418 Z" fill="#22D3EE" />
        <path d="M 92 408 Q 92 405 96 405 L 116 405 Q 122 405 122 408" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1" />
        <path d="M 118 408 L 122 408 L 122 416 L 118 416 Z" fill="#1E293B" />
        <path d="M 124 408 L 154 408 L 154 416 L 124 416 Z" fill="#FFFFFF" />
        <path d="M 124 414 L 154 414 L 154 418 L 124 418 Z" fill="#22D3EE" />
        <path d="M 124 408 Q 124 405 128 405 L 148 405 Q 154 405 154 408" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1" />
        <path d="M 150 408 L 154 408 L 154 416 L 150 416 Z" fill="#1E293B" />

        {/* === TORSO — slim navy hoodie === */}
        <path d="M 80 170 Q 80 154 100 148 L 140 148 Q 160 154 160 170 L 168 295 L 72 295 Z"
              fill="url(#rk3-hoodie)" stroke="#1E3A8A" strokeWidth="2" />
        {/* Hoodie kangaroo pocket */}
        <path d="M 88 220 Q 120 232 152 220 L 150 252 Q 120 262 90 252 Z"
              fill="#1E3A8A" opacity="0.7" />
        {/* Pocket seam line */}
        <line x1="120" y1="226" x2="120" y2="258" stroke="#0F1F33" strokeWidth="0.8" opacity="0.6" />
        {/* Hoodie collar/hood opening */}
        <path d="M 96 156 Q 120 168 144 156 L 148 148 L 92 148 Z"
              fill="#1E3A8A" opacity="0.85" />
        {/* Hood folds (back of hood peeking up) */}
        <path d="M 92 148 Q 100 138 120 138 Q 140 138 148 148 Q 144 142 120 142 Q 96 142 92 148 Z"
              fill="#2A4577" opacity="0.95" />
        {/* DRAWSTRINGS */}
        <line x1="110" y1="166" x2="106" y2="200" stroke="#F1F5F9" strokeWidth="2" strokeLinecap="round" />
        <line x1="130" y1="166" x2="134" y2="200" stroke="#F1F5F9" strokeWidth="2" strokeLinecap="round" />
        <circle cx="106" cy="202" r="2.5" fill="#F1F5F9" />
        <circle cx="134" cy="202" r="2.5" fill="#F1F5F9" />

        {/* === ARMS — slim hoodie sleeves === */}
        <path d="M 80 170 Q 65 220 60 268 Q 60 274 66 276 L 76 278 L 80 220 Z" fill="url(#rk3-hoodie)" stroke="#1E3A8A" strokeWidth="1.5" />
        <path d="M 160 170 Q 175 220 180 268 Q 180 274 174 276 L 164 278 L 160 220 Z" fill="url(#rk3-hoodie)" stroke="#1E3A8A" strokeWidth="1.5" />
        {/* HANDS */}
        <circle cx="64" cy="278" r="9" fill="url(#rk3-skin)" stroke="#A06B40" strokeWidth="1.2" />
        <circle cx="176" cy="278" r="9" fill="url(#rk3-skin)" stroke="#A06B40" strokeWidth="1.2" />
        {/* PHONE in right hand */}
        <g transform="rotate(-12 178 280)">
          <rect x="168" y="270" width="14" height="22" rx="2.5" fill="#0F172A" stroke="#374151" strokeWidth="1" />
          <rect x="170" y="272" width="10" height="18" rx="1.5" fill="#2563EB" opacity="0.6" />
        </g>

        {/* === NECK — slimmer === */}
        <rect x="110" y="138" width="20" height="14" fill="url(#rk3-skin)" />
        <path d="M 110 142 Q 120 150 130 142" stroke="#A06B40" strokeWidth="0.8" fill="none" />

        {/* === HEAD — slimmer oval, more teen-shaped === */}
        <path d="M 84 90 Q 80 50 120 46 Q 160 50 156 90 L 154 116 Q 150 140 120 142 Q 90 140 86 116 Z"
              fill="url(#rk3-skin)" stroke="#A06B40" strokeWidth="1.2" />
        {/* Jawline shadow */}
        <path d="M 88 116 Q 120 138 152 116" stroke="#A06B40" strokeWidth="0.8" fill="none" opacity="0.5" />
        {/* Chin highlight */}
        <ellipse cx="120" cy="134" rx="6" ry="3" fill="#F2C9A0" opacity="0.6" />

        {/* Ears */}
        <ellipse cx="86" cy="100" rx="5" ry="9" fill="url(#rk3-skin)" stroke="#A06B40" strokeWidth="0.8" />
        <ellipse cx="154" cy="100" rx="5" ry="9" fill="url(#rk3-skin)" stroke="#A06B40" strokeWidth="0.8" />
        <path d="M 85 98 Q 87 104 85 110" stroke="#A06B40" strokeWidth="0.6" fill="none" />
        <path d="M 155 98 Q 153 104 155 110" stroke="#A06B40" strokeWidth="0.6" fill="none" />

        {/* === HAIR — modern teen cut with side parting + textured fringe === */}
        <path d="M 80 90 Q 76 48 110 38 Q 120 35 130 38 Q 165 48 158 90
                 L 158 70 Q 150 50 130 48 L 134 64 Q 124 50 120 56 Q 116 50 106 64 L 110 48
                 Q 90 50 82 70 Z"
              fill="url(#rk3-hair)" />
        {/* Side-parted fringe — bigger, more textured */}
        <path d="M 92 60 Q 105 78 115 64 Q 122 80 132 60 Q 138 78 148 62 Q 154 76 158 66 L 158 92 Q 122 96 82 90 Z"
              fill="url(#rk3-hair)" />
        {/* Hair highlight strands */}
        <path d="M 105 48 Q 115 42 125 46" stroke="#3E2818" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M 130 50 Q 140 45 150 50" stroke="#3E2818" strokeWidth="1.2" fill="none" opacity="0.5" />
        {/* Long strand falling over forehead — defines the modern teen look */}
        <path d="M 132 50 Q 120 80 112 88" stroke="#241612" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* CHEEKS — subtle blush */}
        <circle cx="100" cy="106" r="6" fill="url(#rk3-cheek)" />
        <circle cx="140" cy="106" r="6" fill="url(#rk3-cheek)" />

        {/* === EYEBROWS — defined, slightly thick === */}
        <motion.path
          animate={{
            d: `M ${94 - brow.tiltL} ${85 + brow.lift} Q 104 ${82 + brow.lift + brow.tiltL} 114 ${86 + brow.lift}`,
          }}
          transition={{ duration: 0.25 }}
          stroke="#1A0E08" strokeWidth="3.5" strokeLinecap="round" fill="none"
        />
        <motion.path
          animate={{
            d: `M ${126 + brow.tiltR} ${86 + brow.lift} Q 136 ${82 + brow.lift + brow.tiltR} 146 ${85 + brow.lift}`,
          }}
          transition={{ duration: 0.25 }}
          stroke="#1A0E08" strokeWidth="3.5" strokeLinecap="round" fill="none"
        />

        {/* === EYES — almond, slightly narrower than a child's === */}
        <g>
          {/* Left eye */}
          <motion.ellipse
            cx="104" cy="98" rx="8"
            animate={{ ry: blink ? 0.4 : 6 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.3"
          />
          {!blink && (
            <>
              <ellipse cx={104 + eyeOffset} cy="98" rx="4.5" ry="5" fill="#3B2A1A" />
              <circle cx={104 + eyeOffset} cy="98" r="2.5" fill="#0A0604" />
              <circle cx={105 + eyeOffset} cy="96.5" r="1.1" fill="#FFFFFF" />
            </>
          )}
          {/* Right eye */}
          <motion.ellipse
            cx="136" cy="98" rx="8"
            animate={{ ry: blink ? 0.4 : 6 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.3"
          />
          {!blink && (
            <>
              <ellipse cx={136 + eyeOffset} cy="98" rx="4.5" ry="5" fill="#3B2A1A" />
              <circle cx={136 + eyeOffset} cy="98" r="2.5" fill="#0A0604" />
              <circle cx={137 + eyeOffset} cy="96.5" r="1.1" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* === NOSE — slim with shading === */}
        <path d="M 118 102 Q 119 115 117 120" stroke="#A06B40" strokeWidth="1" fill="none" />
        <path d="M 122 102 Q 121 115 123 120" stroke="#A06B40" strokeWidth="1" fill="none" />
        <ellipse cx="118" cy="121" rx="1" ry="0.6" fill="#7A4F2C" opacity="0.6" />
        <ellipse cx="122" cy="121" rx="1" ry="0.6" fill="#7A4F2C" opacity="0.6" />

        {/* === MOUTH === */}
        <motion.path
          animate={{ d: mouthDef.d }}
          transition={{ duration: 0.12 }}
          fill={mouthDef.fill}
          stroke="#7B2933"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {mouthDef.teeth && (
          <rect x="113" y="131" width="14" height="2.5" rx="0.5" fill="#FFFFFF" opacity="0.95" />
        )}
      </svg>
    </motion.div>
  );
}

function browFor(emotion) {
  switch (emotion) {
    case 'shocked':   return { lift: -5, tiltL:  3, tiltR: -3 };
    case 'realised':  return { lift: -3, tiltL:  2, tiltR: -2 };
    case 'unsettled': return { lift:  2, tiltL: -3, tiltR:  3 };
    case 'curious':   return { lift: -2, tiltL: -3, tiltR:  2 };
    case 'happy':
    case 'confident': return { lift:  0, tiltL: -1, tiltR:  1 };
    default:          return { lift:  0, tiltL:  0, tiltR:  0 };
  }
}

function mouthShape(emotion, level) {
  if (emotion === 'shocked' || level >= 3) {
    return { d: 'M 108 128 Q 120 146 132 128 Q 120 142 108 128 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 110 129 Q 120 140 130 129 Q 120 138 110 129 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 112 130 Q 120 136 128 130 Q 120 134 112 130 Z', fill: '#7B2933', teeth: false };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 108 128 Q 120 140 132 128', fill: 'transparent', teeth: false };
  }
  if (emotion === 'unsettled' || emotion === 'guilty') {
    return { d: 'M 108 134 Q 120 124 132 134', fill: 'transparent', teeth: false };
  }
  return { d: 'M 110 131 Q 120 134 130 131', fill: 'transparent', teeth: false };
}
