import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Mom v4 — Indian mother in her late 30s.
 *
 * Per user feedback (2026-05-29): hair shortened to waist-length (not
 * floor length), stylish kurta with embroidered yoke + dupatta drape,
 * thicker proper legs (not stick figures), responsive lip-sync that
 * visibly opens/closes, and a slight head tilt + pupil shift toward
 * whoever is speaking.
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
      setTimeout(() => setBlink(false), 140);
    }, 4500 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);

  const eyeOffset = lookAt === 'left' ? -4 : lookAt === 'right' ? 4 : 0;
  const headTilt = lookAt === 'left' ? -3 : lookAt === 'right' ? 3 : 0;
  const brow = browFor(emotion);
  const mouthDef = mouthShape(emotion, mouthLevel);

  return (
    <motion.div
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 240 440" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="mm4-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ECC09A" />
            <stop offset="100%" stopColor="#D49E72" />
          </linearGradient>
          {/* Stylish kurta — magenta/maroon → coral */}
          <linearGradient id="mm4-kurta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#9D174D" />
          </linearGradient>
          <linearGradient id="mm4-dupatta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="mm4-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A0E08" />
            <stop offset="100%" stopColor="#080503" />
          </linearGradient>
          <linearGradient id="mm4-pant" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3D1A0E" />
            <stop offset="100%" stopColor="#1E0D08" />
          </linearGradient>
          <linearGradient id="mm4-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FFE873" />
            <stop offset="100%" stopColor="#D4A317" />
          </linearGradient>
          <radialGradient id="mm4-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E88B6C" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E88B6C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* SHADOW */}
        <ellipse cx="120" cy="424" rx="62" ry="7" fill="#000" opacity="0.25" />

        {/* === LEGS — thicker leggings === */}
        <path d="M 96 290 L 92 414 Q 92 420 98 420 L 118 420 Q 124 420 124 414 L 122 290 Z" fill="url(#mm4-pant)" />
        <path d="M 118 290 L 116 414 Q 116 420 122 420 L 142 420 Q 148 420 148 414 L 144 290 Z" fill="url(#mm4-pant)" />
        {/* SHOES — closed-toe juttis */}
        <path d="M 88 414 L 124 414 Q 128 414 128 418 L 128 422 L 88 422 Q 86 422 86 418 Z" fill="#5A3818" stroke="#3A2310" strokeWidth="0.8" />
        <path d="M 100 416 Q 108 412 116 416" stroke="url(#mm4-gold)" strokeWidth="1" fill="none" />
        <path d="M 116 414 L 152 414 Q 154 414 154 418 L 154 422 L 116 422 L 116 418 Z" fill="#5A3818" stroke="#3A2310" strokeWidth="0.8" />
        <path d="M 124 416 Q 132 412 140 416" stroke="url(#mm4-gold)" strokeWidth="1" fill="none" />

        {/* === SHORTER HAIR — back panel ends around waist (NOT floor) === */}
        <path d="M 72 120 Q 60 80 86 50 Q 106 36 120 36 Q 134 36 154 50 Q 180 80 168 120
                 Q 170 180 174 240 Q 176 268 156 270 L 84 270 Q 64 268 66 240 Q 70 180 72 120 Z"
              fill="url(#mm4-hair)" />
        {/* Tapered hair tips at the bottom */}
        <path d="M 84 270 L 82 285 Q 88 290 92 285 L 92 270 Z" fill="url(#mm4-hair)" />
        <path d="M 148 270 L 148 285 Q 152 290 158 285 L 156 270 Z" fill="url(#mm4-hair)" />

        {/* === KURTA — fitted top with bottom flare === */}
        <path d="M 86 168 Q 86 152 102 146 L 138 146 Q 154 152 154 168 L 162 290 Q 175 310 65 310 Q 78 310 78 290 Z"
              fill="url(#mm4-kurta)" stroke="#7C1D1D" strokeWidth="1.5" />
        {/* Embroidered yoke (decorative band across chest) */}
        <path d="M 84 168 Q 120 188 156 168 L 156 200 Q 120 220 84 200 Z" fill="url(#mm4-kurta)" stroke="url(#mm4-gold)" strokeWidth="2" />
        {/* Embroidery patterns on yoke */}
        <g fill="url(#mm4-gold)">
          <circle cx="100" cy="184" r="2" />
          <circle cx="110" cy="186" r="1.5" />
          <circle cx="120" cy="188" r="2" />
          <circle cx="130" cy="186" r="1.5" />
          <circle cx="140" cy="184" r="2" />
          <path d="M 100 196 Q 120 204 140 196" stroke="url(#mm4-gold)" strokeWidth="1.5" fill="none" />
        </g>
        {/* Gold V-neckline */}
        <path d="M 100 152 Q 120 178 140 152 L 144 162 Q 120 188 96 162 Z"
              fill="url(#mm4-gold)" stroke="#A16207" strokeWidth="1.2" />
        {/* Gold border at hem */}
        <path d="M 65 304 L 175 304" stroke="url(#mm4-gold)" strokeWidth="3" />
        {/* Centre seam */}
        <line x1="120" y1="200" x2="120" y2="305" stroke="#7C1D1D" strokeWidth="0.8" opacity="0.5" />

        {/* === DUPATTA — flowing yellow scarf over one shoulder === */}
        <path d="M 86 168 Q 80 200 75 270 L 65 305 Q 80 305 85 295 Q 90 260 95 200 Z"
              fill="url(#mm4-dupatta)" opacity="0.9" />
        <path d="M 65 305 L 60 320 L 72 318 Z" fill="url(#mm4-dupatta)" />
        {/* Dupatta gold trim */}
        <path d="M 86 170 Q 82 200 76 270" stroke="url(#mm4-gold)" strokeWidth="1.5" fill="none" />

        {/* === ARMS === */}
        <path d="M 86 168 Q 70 220 64 270 Q 64 276 70 278 L 80 280 L 82 220 Z" fill="url(#mm4-kurta)" stroke="#7C1D1D" strokeWidth="1.5" />
        <path d="M 154 168 Q 170 220 176 270 Q 176 276 170 278 L 160 280 L 158 220 Z" fill="url(#mm4-kurta)" stroke="#7C1D1D" strokeWidth="1.5" />
        {/* HANDS */}
        <circle cx="69" cy="280" r="9" fill="url(#mm4-skin)" stroke="#A06B40" strokeWidth="1.2" />
        <circle cx="171" cy="280" r="9" fill="url(#mm4-skin)" stroke="#A06B40" strokeWidth="1.2" />
        {/* Bangles on right wrist */}
        <line x1="162" y1="270" x2="178" y2="270" stroke="url(#mm4-gold)" strokeWidth="1.5" />
        <line x1="161" y1="273" x2="179" y2="273" stroke="#A16207" strokeWidth="1.2" />
        <line x1="162" y1="276" x2="178" y2="276" stroke="url(#mm4-gold)" strokeWidth="1.5" />
        {/* Bangles on left wrist */}
        <line x1="62" y1="270" x2="78" y2="270" stroke="url(#mm4-gold)" strokeWidth="1.5" />
        <line x1="61" y1="273" x2="79" y2="273" stroke="#A16207" strokeWidth="1.2" />

        {/* === NECK === */}
        <rect x="108" y="135" width="24" height="14" fill="url(#mm4-skin)" />
        <path d="M 108 140 Q 120 148 132 140" stroke="#A06B40" strokeWidth="0.8" fill="none" />
        <path d="M 100 152 Q 120 165 140 152" stroke="url(#mm4-gold)" strokeWidth="1.2" fill="none" />
        <circle cx="120" cy="162" r="2" fill="url(#mm4-gold)" />

        {/* === HEAD + face === */}
        <g style={{ transformOrigin: '120px 100px' }} transform={`rotate(${headTilt})`}>
          <path d="M 84 88 Q 80 50 120 46 Q 160 50 156 88 L 154 116 Q 150 138 120 140 Q 90 138 86 116 Z"
                fill="url(#mm4-skin)" stroke="#A06B40" strokeWidth="1.2" />
          <path d="M 88 116 Q 120 138 152 116" stroke="#A06B40" strokeWidth="0.8" fill="none" opacity="0.5" />
          <ellipse cx="120" cy="132" rx="5" ry="2.5" fill="#F2C9A0" opacity="0.5" />

          {/* Ears with earrings */}
          <ellipse cx="86" cy="98" rx="5" ry="9" fill="url(#mm4-skin)" stroke="#A06B40" strokeWidth="0.8" />
          <ellipse cx="154" cy="98" rx="5" ry="9" fill="url(#mm4-skin)" stroke="#A06B40" strokeWidth="0.8" />
          <circle cx="86" cy="106" r="3" fill="url(#mm4-gold)" stroke="#A16207" strokeWidth="0.6" />
          <circle cx="154" cy="106" r="3" fill="url(#mm4-gold)" stroke="#A16207" strokeWidth="0.6" />

          {/* === HAIR top — proper bun-volume on top, middle parting === */}
          <path d="M 84 88 Q 78 40 116 36 L 124 36 Q 162 40 156 88
                   L 156 60 Q 144 42 124 44 L 124 42 L 116 42 L 116 44 Q 96 42 84 60 Z"
                fill="url(#mm4-hair)" />
          {/* Parting line */}
          <line x1="120" y1="40" x2="120" y2="60" stroke="#D49E72" strokeWidth="1.2" opacity="0.7" />
          {/* Volume at the crown */}
          <ellipse cx="120" cy="44" rx="22" ry="8" fill="url(#mm4-hair)" />
          {/* Side strands framing the face — shorter, only to the jaw */}
          <path d="M 84 88 Q 78 110 80 132 L 88 132 Q 92 110 92 88 Z" fill="url(#mm4-hair)" />
          <path d="M 156 88 Q 162 110 160 132 L 152 132 Q 148 110 148 88 Z" fill="url(#mm4-hair)" />
          <path d="M 100 50 Q 110 46 120 48" stroke="#3E2818" strokeWidth="1.5" fill="none" opacity="0.5" />

          {/* CHEEKS */}
          <circle cx="98" cy="106" r="6" fill="url(#mm4-cheek)" />
          <circle cx="142" cy="106" r="6" fill="url(#mm4-cheek)" />

          {/* BINDI */}
          <circle cx="120" cy="68" r="3.4" fill="#DC2626" />
          <circle cx="120" cy="68" r="1.3" fill="#FCA5A5" opacity="0.85" />

          {/* EYEBROWS */}
          <motion.path
            animate={{
              d: `M ${94 - brow.tiltL} ${88 + brow.lift} Q 104 ${85 + brow.lift + brow.tiltL} 114 ${89 + brow.lift}`,
            }}
            transition={{ duration: 0.25 }}
            stroke="#1A0E08" strokeWidth="3" strokeLinecap="round" fill="none"
          />
          <motion.path
            animate={{
              d: `M ${126 + brow.tiltR} ${89 + brow.lift} Q 136 ${85 + brow.lift + brow.tiltR} 146 ${88 + brow.lift}`,
            }}
            transition={{ duration: 0.25 }}
            stroke="#1A0E08" strokeWidth="3" strokeLinecap="round" fill="none"
          />

          {/* EYELASHES */}
          <g stroke="#1A0E08" strokeWidth="1.5" strokeLinecap="round">
            <line x1="96"  y1="96" x2="95"  y2="93" />
            <line x1="100" y1="94" x2="100" y2="91" />
            <line x1="104" y1="93" x2="105" y2="90" />
            <line x1="108" y1="94" x2="109" y2="91" />
            <line x1="112" y1="95" x2="113" y2="92" />
            <line x1="128" y1="95" x2="127" y2="92" />
            <line x1="132" y1="94" x2="131" y2="91" />
            <line x1="136" y1="93" x2="135" y2="90" />
            <line x1="140" y1="94" x2="140" y2="91" />
            <line x1="144" y1="96" x2="145" y2="93" />
          </g>

          {/* EYES — bigger almond */}
          <g>
            <motion.path
              animate={{ d: blink
                ? 'M 92 100 Q 104 100 116 100'
                : 'M 92 100 Q 104 92 116 100 Q 104 108 92 100 Z'
              }}
              transition={{ duration: 0.08 }}
              fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.3"
            />
            {!blink && (
              <>
                <ellipse cx={104 + eyeOffset} cy="100" rx="4.5" ry="5" fill="#2C1A0F" />
                <circle cx={104 + eyeOffset} cy="100" r="2.5" fill="#0A0604" />
                <circle cx={105 + eyeOffset} cy="98" r="1.2" fill="#FFFFFF" />
              </>
            )}
            <motion.path
              animate={{ d: blink
                ? 'M 124 100 Q 136 100 148 100'
                : 'M 124 100 Q 136 92 148 100 Q 136 108 124 100 Z'
              }}
              transition={{ duration: 0.08 }}
              fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.3"
            />
            {!blink && (
              <>
                <ellipse cx={136 + eyeOffset} cy="100" rx="4.5" ry="5" fill="#2C1A0F" />
                <circle cx={136 + eyeOffset} cy="100" r="2.5" fill="#0A0604" />
                <circle cx={137 + eyeOffset} cy="98" r="1.2" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* NOSE */}
          <path d="M 118 104 Q 119 119 116 124 Q 120 126 124 124 Q 121 119 122 104"
                stroke="#A06B40" strokeWidth="0.8" fill="url(#mm4-skin)" opacity="0.95" />
          <ellipse cx="118" cy="125" rx="1" ry="0.7" fill="#7A4F2C" opacity="0.6" />
          <ellipse cx="122" cy="125" rx="1" ry="0.7" fill="#7A4F2C" opacity="0.6" />

          {/* LIPS — bigger so lip-sync reads */}
          <motion.path
            animate={{ d: mouthDef.d }}
            transition={{ duration: 0.10 }}
            fill={mouthDef.fill}
            stroke="#8B1A2B"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {mouthDef.teeth && (
            <rect x="113" y="132" width="14" height="2.5" rx="0.5" fill="#FFFFFF" opacity="0.95" />
          )}
        </g>
      </svg>
    </motion.div>
  );
}

function browFor(emotion) {
  switch (emotion) {
    case 'shocked':   return { lift: -5, tiltL:  3, tiltR: -3 };
    case 'unsettled': return { lift:  2, tiltL: -3, tiltR:  3 };
    case 'curious':   return { lift: -2, tiltL: -2, tiltR:  2 };
    case 'happy':
    case 'confident': return { lift:  0, tiltL: -1, tiltR:  1 };
    default:          return { lift:  0, tiltL:  0, tiltR:  0 };
  }
}

function mouthShape(emotion, level) {
  if (emotion === 'shocked' || level >= 3) {
    return { d: 'M 106 130 Q 120 152 134 130 Q 120 146 106 130 Z', fill: '#5C1A2A', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 108 131 Q 120 144 132 131 Q 120 140 108 131 Z', fill: '#5C1A2A', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 110 132 Q 120 138 130 132 Q 120 136 110 132 Z', fill: '#A53E45', teeth: false };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 106 130 Q 120 142 134 130', fill: 'transparent', teeth: false };
  }
  return { d: 'M 106 132 Q 120 136 134 132 Q 120 134 106 132 Z', fill: '#A53E45', teeth: false };
}
