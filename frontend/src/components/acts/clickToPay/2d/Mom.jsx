import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Mom v3 — Indian mother in her late 30s. Tall, slim, elegant.
 *
 * Refined proportions (viewBox 240×440 — head ~1/6 of total height).
 * Long flowing black hair parted in the middle that falls past her
 * waist with side strands framing her face. Defined oval face,
 * almond eyes with eyelashes, slim refined nose, full lipsticked
 * lips, gold stud earrings, bindi, gold neckline embroidery on a
 * fitted orange kurta with bottom flare, slim leggings, gold bangles.
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
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 240 440" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="mm3-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ECC09A" />
            <stop offset="100%" stopColor="#D49E72" />
          </linearGradient>
          <linearGradient id="mm3-kurta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
          <linearGradient id="mm3-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A0E08" />
            <stop offset="100%" stopColor="#080503" />
          </linearGradient>
          <linearGradient id="mm3-pant" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6E2F1A" />
            <stop offset="100%" stopColor="#3D1A0E" />
          </linearGradient>
          <linearGradient id="mm3-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FFE873" />
            <stop offset="100%" stopColor="#D4A317" />
          </linearGradient>
          <radialGradient id="mm3-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E88B6C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#E88B6C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* SHADOW */}
        <ellipse cx="120" cy="420" rx="56" ry="7" fill="#000" opacity="0.22" />

        {/* === LEGS — slim leggings === */}
        <rect x="102" y="300" width="14" height="110" rx="6" fill="url(#mm3-pant)" />
        <rect x="124" y="300" width="14" height="110" rx="6" fill="url(#mm3-pant)" />
        {/* SHOES — flat slip-ons */}
        <ellipse cx="109" cy="412" rx="11" ry="5" fill="#3D2718" />
        <ellipse cx="131" cy="412" rx="11" ry="5" fill="#3D2718" />
        <path d="M 100 408 Q 109 405 118 408" stroke="#5A3E26" strokeWidth="0.8" fill="none" />
        <path d="M 122 408 Q 131 405 140 408" stroke="#5A3E26" strokeWidth="0.8" fill="none" />

        {/* === LONG HAIR — back panel, falls past her waist === */}
        <path d="M 70 120 Q 56 80 86 50 Q 106 36 120 36 Q 134 36 154 50 Q 184 80 170 120
                 Q 188 200 195 280 Q 198 320 175 322 L 65 322 Q 42 320 45 280 Q 52 200 70 120 Z"
              fill="url(#mm3-hair)" />
        {/* Hair tips at the bottom — soft tapered tendrils */}
        <path d="M 60 320 L 55 340 Q 62 348 70 340 L 68 320 Z" fill="url(#mm3-hair)" />
        <path d="M 80 320 L 76 348 Q 84 354 90 346 L 88 320 Z" fill="url(#mm3-hair)" />
        <path d="M 150 320 L 154 346 Q 160 354 165 348 L 167 320 Z" fill="url(#mm3-hair)" />
        <path d="M 172 320 L 175 340 Q 184 348 188 340 L 184 320 Z" fill="url(#mm3-hair)" />

        {/* === KURTA — fitted top with bottom flare === */}
        <path d="M 86 168 Q 86 152 102 146 L 138 146 Q 154 152 154 168 L 162 280 Q 180 305 60 305 Q 78 305 78 280 Z"
              fill="url(#mm3-kurta)" stroke="#7C1D1D" strokeWidth="1.5" />
        {/* Gold neckline V */}
        <path d="M 100 152 Q 120 184 140 152 L 144 162 Q 120 196 96 162 Z"
              fill="url(#mm3-gold)" stroke="#A16207" strokeWidth="1.2" />
        <path d="M 120 168 L 120 196" stroke="#A16207" strokeWidth="1" />
        <circle cx="120" cy="170" r="2" fill="#A16207" />
        {/* Gold border at hem */}
        <path d="M 60 295 L 180 295" stroke="url(#mm3-gold)" strokeWidth="3" />
        {/* Embroidery dots scattered around chest */}
        <g fill="url(#mm3-gold)">
          <circle cx="100" cy="200" r="1.5" />
          <circle cx="140" cy="200" r="1.5" />
          <circle cx="120" cy="208" r="1.2" />
          <circle cx="110" cy="220" r="1.2" />
          <circle cx="130" cy="220" r="1.2" />
        </g>
        {/* Centre seam */}
        <line x1="120" y1="190" x2="120" y2="298" stroke="#7C1D1D" strokeWidth="0.8" opacity="0.5" />

        {/* === ARMS — kurta sleeves, slim === */}
        <path d="M 86 168 Q 70 220 64 270 Q 64 276 70 278 L 80 280 L 82 220 Z" fill="url(#mm3-kurta)" stroke="#7C1D1D" strokeWidth="1.5" />
        <path d="M 154 168 Q 170 220 176 270 Q 176 276 170 278 L 160 280 L 158 220 Z" fill="url(#mm3-kurta)" stroke="#7C1D1D" strokeWidth="1.5" />
        {/* HANDS */}
        <circle cx="69" cy="280" r="8" fill="url(#mm3-skin)" stroke="#A06B40" strokeWidth="1.2" />
        <circle cx="171" cy="280" r="8" fill="url(#mm3-skin)" stroke="#A06B40" strokeWidth="1.2" />
        {/* Bangles on right wrist (multiple gold rings) */}
        <line x1="162" y1="270" x2="178" y2="270" stroke="url(#mm3-gold)" strokeWidth="1.5" />
        <line x1="161" y1="273" x2="179" y2="273" stroke="#A16207" strokeWidth="1.2" />
        <line x1="162" y1="276" x2="178" y2="276" stroke="url(#mm3-gold)" strokeWidth="1.5" />
        {/* Bangles on left wrist too */}
        <line x1="62" y1="270" x2="78" y2="270" stroke="url(#mm3-gold)" strokeWidth="1.5" />
        <line x1="61" y1="273" x2="79" y2="273" stroke="#A16207" strokeWidth="1.2" />

        {/* === NECK — slim === */}
        <rect x="110" y="135" width="20" height="14" fill="url(#mm3-skin)" />
        <path d="M 110 140 Q 120 148 130 140" stroke="#A06B40" strokeWidth="0.8" fill="none" />
        {/* Necklace (gold chain) */}
        <path d="M 102 152 Q 120 165 138 152" stroke="url(#mm3-gold)" strokeWidth="1.2" fill="none" />
        <circle cx="120" cy="162" r="2" fill="url(#mm3-gold)" />

        {/* === HEAD — slim oval, defined === */}
        <path d="M 84 88 Q 80 50 120 46 Q 160 50 156 88 L 154 116 Q 150 138 120 140 Q 90 138 86 116 Z"
              fill="url(#mm3-skin)" stroke="#A06B40" strokeWidth="1.2" />
        {/* Jawline shadow */}
        <path d="M 88 116 Q 120 138 152 116" stroke="#A06B40" strokeWidth="0.8" fill="none" opacity="0.5" />
        {/* Chin highlight */}
        <ellipse cx="120" cy="132" rx="5" ry="2.5" fill="#F2C9A0" opacity="0.5" />

        {/* Ears with earrings */}
        <ellipse cx="86" cy="98" rx="5" ry="9" fill="url(#mm3-skin)" stroke="#A06B40" strokeWidth="0.8" />
        <ellipse cx="154" cy="98" rx="5" ry="9" fill="url(#mm3-skin)" stroke="#A06B40" strokeWidth="0.8" />
        <circle cx="86" cy="106" r="3" fill="url(#mm3-gold)" stroke="#A16207" strokeWidth="0.6" />
        <circle cx="154" cy="106" r="3" fill="url(#mm3-gold)" stroke="#A16207" strokeWidth="0.6" />

        {/* === HAIR top scalp with middle parting === */}
        <path d="M 84 88 Q 80 48 116 42 L 124 42 Q 160 48 156 88
                 L 156 60 Q 144 50 124 52 L 124 50 L 116 50 L 116 52 Q 96 50 84 60 Z"
              fill="url(#mm3-hair)" />
        {/* Parting line */}
        <line x1="120" y1="44" x2="120" y2="60" stroke="#D49E72" strokeWidth="1.2" opacity="0.7" />
        {/* Side strands flowing down from temples */}
        <path d="M 82 82 Q 72 140 70 200 L 82 200 Q 84 140 90 88 Z" fill="url(#mm3-hair)" />
        <path d="M 158 82 Q 168 140 170 200 L 158 200 Q 156 140 150 88 Z" fill="url(#mm3-hair)" />
        {/* Hair shine highlight */}
        <path d="M 100 50 Q 110 46 120 48" stroke="#3E2818" strokeWidth="1.5" fill="none" opacity="0.5" />

        {/* CHEEKS */}
        <circle cx="98" cy="106" r="6" fill="url(#mm3-cheek)" />
        <circle cx="142" cy="106" r="6" fill="url(#mm3-cheek)" />

        {/* BINDI */}
        <circle cx="120" cy="70" r="3.2" fill="#DC2626" />
        <circle cx="120" cy="70" r="1.3" fill="#FCA5A5" opacity="0.85" />

        {/* === EYEBROWS — slim, defined === */}
        <motion.path
          animate={{
            d: `M ${94 - brow.tiltL} ${86 + brow.lift} Q 104 ${82 + brow.lift + brow.tiltL} 114 ${87 + brow.lift}`,
          }}
          transition={{ duration: 0.25 }}
          stroke="#1A0E08" strokeWidth="2.8" strokeLinecap="round" fill="none"
        />
        <motion.path
          animate={{
            d: `M ${126 + brow.tiltR} ${87 + brow.lift} Q 136 ${82 + brow.lift + brow.tiltR} 146 ${86 + brow.lift}`,
          }}
          transition={{ duration: 0.25 }}
          stroke="#1A0E08" strokeWidth="2.8" strokeLinecap="round" fill="none"
        />

        {/* EYELASHES — short strokes above each eye */}
        <g stroke="#1A0E08" strokeWidth="1.5" strokeLinecap="round">
          <line x1="96"  y1="94" x2="95"  y2="91" />
          <line x1="100" y1="92" x2="100" y2="89" />
          <line x1="104" y1="91" x2="105" y2="88" />
          <line x1="108" y1="92" x2="109" y2="89" />
          <line x1="112" y1="93" x2="113" y2="90" />
          <line x1="128" y1="93" x2="127" y2="90" />
          <line x1="132" y1="92" x2="131" y2="89" />
          <line x1="136" y1="91" x2="135" y2="88" />
          <line x1="140" y1="92" x2="140" y2="89" />
          <line x1="144" y1="94" x2="145" y2="91" />
        </g>

        {/* === EYES — almond, more elongated than Ritwik's === */}
        <g>
          <motion.path
            animate={{ d: blink
              ? 'M 94 98 Q 104 98 114 98'
              : 'M 94 98 Q 104 92 114 98 Q 104 104 94 98 Z'
            }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.3"
          />
          {!blink && (
            <>
              <ellipse cx={104 + eyeOffset} cy="98" rx="4" ry="4.5" fill="#2C1A0F" />
              <circle cx={104 + eyeOffset} cy="98" r="2.2" fill="#0A0604" />
              <circle cx={105 + eyeOffset} cy="96.5" r="1.1" fill="#FFFFFF" />
            </>
          )}
          <motion.path
            animate={{ d: blink
              ? 'M 126 98 Q 136 98 146 98'
              : 'M 126 98 Q 136 92 146 98 Q 136 104 126 98 Z'
            }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.3"
          />
          {!blink && (
            <>
              <ellipse cx={136 + eyeOffset} cy="98" rx="4" ry="4.5" fill="#2C1A0F" />
              <circle cx={136 + eyeOffset} cy="98" r="2.2" fill="#0A0604" />
              <circle cx={137 + eyeOffset} cy="96.5" r="1.1" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* === NOSE — slim, refined === */}
        <path d="M 118 102 Q 119 117 116 122 Q 120 124 124 122 Q 121 117 122 102"
              stroke="#A06B40" strokeWidth="0.8" fill="url(#mm3-skin)" opacity="0.95" />
        <ellipse cx="118" cy="123" rx="1" ry="0.7" fill="#7A4F2C" opacity="0.6" />
        <ellipse cx="122" cy="123" rx="1" ry="0.7" fill="#7A4F2C" opacity="0.6" />

        {/* === LIPS — defined, lipsticked === */}
        <motion.path
          animate={{ d: mouthDef.d }}
          transition={{ duration: 0.12 }}
          fill={mouthDef.fill}
          stroke="#8B1A2B"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {mouthDef.teeth && (
          <rect x="113" y="130" width="14" height="2.5" rx="0.5" fill="#FFFFFF" opacity="0.95" />
        )}
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
    return { d: 'M 108 128 Q 120 146 132 128 Q 120 142 108 128 Z', fill: '#5C1A2A', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 110 129 Q 120 140 130 129 Q 120 138 110 129 Z', fill: '#5C1A2A', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 112 130 Q 120 136 128 130 Q 120 134 112 130 Z', fill: '#A53E45', teeth: false };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 108 128 Q 120 140 132 128', fill: 'transparent', teeth: false };
  }
  return { d: 'M 108 130 Q 120 134 132 130 Q 120 132 108 130 Z', fill: '#A53E45', teeth: false };
}
