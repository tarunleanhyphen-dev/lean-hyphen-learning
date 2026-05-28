import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Mom — Indian mother in her late 30s. Oval face, warm skin, long black
 * hair parted in the middle and flowing past her shoulders, almond eyes
 * with eyelashes, bindi, defined lips with lipstick, orange kurta with
 * gold neckline trim.
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

  const eyeOffset = lookAt === 'left' ? -3 : lookAt === 'right' ? 3 : 0;
  const brow = browFor(emotion);
  const mouthDef = mouthShape(emotion, mouthLevel);

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 240 360" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mm-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ECC09A" />
            <stop offset="100%" stopColor="#D49E72" />
          </linearGradient>
          <linearGradient id="mm-kurta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
          <linearGradient id="mm-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A0E08" />
            <stop offset="100%" stopColor="#0A0604" />
          </linearGradient>
          <linearGradient id="mm-pant" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C2D12" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <radialGradient id="mm-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E88B6C" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E88B6C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* SHADOW */}
        <ellipse cx="120" cy="340" rx="68" ry="9" fill="#000" opacity="0.18" />

        {/* LEGS — leggings */}
        <rect x="92"  y="248" width="22" height="86" rx="10" fill="url(#mm-pant)" />
        <rect x="126" y="248" width="22" height="86" rx="10" fill="url(#mm-pant)" />
        {/* SHOES — slip-ons */}
        <ellipse cx="103" cy="336" rx="14" ry="6" fill="#4A3520" />
        <ellipse cx="137" cy="336" rx="14" ry="6" fill="#4A3520" />

        {/* KURTA — long with flared bottom + side slits */}
        <path d="M 56 150 Q 56 132 80 128 L 160 128 Q 184 132 184 150 L 192 248 Q 192 256 184 258 L 56 258 Q 48 256 48 248 Z"
              fill="url(#mm-kurta)" stroke="#9A3412" strokeWidth="2" />
        {/* Gold neckline trim */}
        <path d="M 90 134 Q 120 154 150 134 L 152 145 Q 120 165 88 145 Z"
              fill="#FDE047" stroke="#A16207" strokeWidth="1.5" />
        <circle cx="120" cy="148" r="2" fill="#A16207" />
        {/* Embroidery dots near neckline */}
        <g fill="#FDE047">
          <circle cx="100" cy="170" r="1.5" />
          <circle cx="120" cy="174" r="1.5" />
          <circle cx="140" cy="170" r="1.5" />
        </g>
        {/* Kurta seam */}
        <line x1="120" y1="160" x2="120" y2="250" stroke="#9A3412" strokeWidth="1" opacity="0.5" />

        {/* ARMS — kurta sleeves */}
        <path d="M 56 150 L 34 220 Q 32 232 42 235 L 56 236 L 60 200 Z" fill="url(#mm-kurta)" stroke="#9A3412" strokeWidth="2" />
        <path d="M 184 150 L 206 220 Q 208 232 198 235 L 184 236 L 180 200 Z" fill="url(#mm-kurta)" stroke="#9A3412" strokeWidth="2" />
        {/* HANDS */}
        <circle cx="42" cy="237" r="11" fill="url(#mm-skin)" stroke="#A07050" strokeWidth="1.5" />
        <circle cx="198" cy="237" r="11" fill="url(#mm-skin)" stroke="#A07050" strokeWidth="1.5" />
        {/* Bangles on right wrist */}
        <line x1="190" y1="226" x2="206" y2="228" stroke="#FDE047" strokeWidth="1.5" />
        <line x1="189" y1="230" x2="205" y2="232" stroke="#A16207" strokeWidth="1.2" />

        {/* NECK */}
        <rect x="106" y="118" width="28" height="14" fill="url(#mm-skin)" />
        <path d="M 106 121 Q 120 130 134 121" stroke="#A07050" strokeWidth="1" fill="none" />

        {/* LONG HAIR — back panel behind head */}
        <path d="M 56 88 Q 50 50 80 30 Q 96 18 120 16 Q 144 18 160 30 Q 190 50 184 88 L 200 220 Q 198 240 178 240 L 62 240 Q 42 240 40 220 Z"
              fill="url(#mm-hair)" opacity="0.92" />

        {/* HEAD — oval face */}
        <path d="M 72 70 Q 72 30 120 30 Q 168 30 168 70 L 166 102 Q 162 124 120 126 Q 78 124 74 102 Z"
              fill="url(#mm-skin)" stroke="#A07050" strokeWidth="1.5" />
        {/* Ears */}
        <ellipse cx="74" cy="84" rx="6" ry="10" fill="url(#mm-skin)" stroke="#A07050" strokeWidth="1" />
        <ellipse cx="166" cy="84" rx="6" ry="10" fill="url(#mm-skin)" stroke="#A07050" strokeWidth="1" />
        {/* Earrings — gold studs */}
        <circle cx="74" cy="92" r="2.5" fill="#FDE047" stroke="#A16207" strokeWidth="0.8" />
        <circle cx="166" cy="92" r="2.5" fill="#FDE047" stroke="#A16207" strokeWidth="0.8" />

        {/* HAIR — top with middle parting */}
        <path d="M 72 70 Q 70 36 105 30 L 118 28 L 122 28 L 135 30 Q 170 36 168 70 L 165 50 Q 145 40 135 50 L 125 38 L 115 38 L 105 50 Q 95 40 75 50 Z"
              fill="url(#mm-hair)" />
        {/* Parting line */}
        <line x1="120" y1="28" x2="120" y2="55" stroke="#D49E72" strokeWidth="1.5" opacity="0.6" />
        {/* Side strands flowing down */}
        <path d="M 72 65 Q 60 130 56 200 L 72 200 Q 75 130 82 70 Z" fill="url(#mm-hair)" />
        <path d="M 168 65 Q 180 130 184 200 L 168 200 Q 165 130 158 70 Z" fill="url(#mm-hair)" />

        {/* CHEEKS */}
        <circle cx="92" cy="92" r="8" fill="url(#mm-cheek)" />
        <circle cx="148" cy="92" r="8" fill="url(#mm-cheek)" />

        {/* BINDI */}
        <circle cx="120" cy="58" r="3.5" fill="#DC2626" />
        <circle cx="120" cy="58" r="1.5" fill="#FCA5A5" opacity="0.85" />

        {/* EYEBROWS — thinner, more defined */}
        <motion.path
          animate={{
            d: `M ${86 - brow.tiltL} ${66 + brow.lift} Q 100 ${62 + brow.lift + brow.tiltL} 113 ${67 + brow.lift}`,
          }}
          transition={{ duration: 0.25 }}
          stroke="#1A0E08" strokeWidth="3" strokeLinecap="round" fill="none"
        />
        <motion.path
          animate={{
            d: `M ${127 + brow.tiltR} ${67 + brow.lift} Q 140 ${62 + brow.lift + brow.tiltR} 154 ${66 + brow.lift}`,
          }}
          transition={{ duration: 0.25 }}
          stroke="#1A0E08" strokeWidth="3" strokeLinecap="round" fill="none"
        />

        {/* EYELASHES — short strokes above each eye */}
        <g stroke="#1A0E08" strokeWidth="1.5" strokeLinecap="round">
          <line x1="92"  y1="76" x2="91"  y2="73" />
          <line x1="96"  y1="74" x2="96"  y2="71" />
          <line x1="100" y1="73" x2="101" y2="70" />
          <line x1="104" y1="74" x2="105" y2="71" />
          <line x1="108" y1="75" x2="109" y2="72" />
          <line x1="132" y1="75" x2="131" y2="72" />
          <line x1="136" y1="74" x2="135" y2="71" />
          <line x1="140" y1="73" x2="139" y2="70" />
          <line x1="144" y1="74" x2="144" y2="71" />
          <line x1="148" y1="76" x2="149" y2="73" />
        </g>

        {/* EYES — almond */}
        <g>
          <motion.path
            animate={{ d: blink
              ? 'M 90 80 Q 100 80 110 80'
              : 'M 90 80 Q 100 73 110 80 Q 100 86 90 80 Z'
            }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.5"
          />
          {!blink && (
            <>
              <ellipse cx={100 + eyeOffset} cy="80" rx="5.5" ry="5.5" fill="#2C1A0F" />
              <circle cx={100 + eyeOffset} cy="80" r="3" fill="#1A0E08" />
              <circle cx={101 + eyeOffset} cy="78" r="1.4" fill="#FFFFFF" />
            </>
          )}
          <motion.path
            animate={{ d: blink
              ? 'M 130 80 Q 140 80 150 80'
              : 'M 130 80 Q 140 73 150 80 Q 140 86 130 80 Z'
            }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.5"
          />
          {!blink && (
            <>
              <ellipse cx={140 + eyeOffset} cy="80" rx="5.5" ry="5.5" fill="#2C1A0F" />
              <circle cx={140 + eyeOffset} cy="80" r="3" fill="#1A0E08" />
              <circle cx={141 + eyeOffset} cy="78" r="1.4" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* NOSE — slim with shading */}
        <path d="M 118 84 Q 119 95 116 100 Q 120 103 124 100 Q 121 95 122 84"
              stroke="#A07050" strokeWidth="1" fill="url(#mm-skin)" opacity="0.95" />
        <ellipse cx="118" cy="101" rx="1" ry="0.8" fill="#7A4F2C" opacity="0.5" />
        <ellipse cx="122" cy="101" rx="1" ry="0.8" fill="#7A4F2C" opacity="0.5" />

        {/* LIPS — with lipstick */}
        <motion.path
          animate={{ d: mouthDef.d }}
          transition={{ duration: 0.12 }}
          fill={mouthDef.fill}
          stroke="#8B1A2B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {mouthDef.teeth && (
          <rect x="111" y="111" width="18" height="3" rx="0.5" fill="#FFFFFF" opacity="0.9" />
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
    return { d: 'M 106 110 Q 120 128 134 110 Q 120 122 106 110 Z', fill: '#5C1A2A', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 108 111 Q 120 121 132 111 Q 120 119 108 111 Z', fill: '#5C1A2A', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 110 112 Q 120 118 130 112 Q 120 116 110 112 Z', fill: '#A53E45', teeth: false };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 106 110 Q 120 122 134 110', fill: 'transparent', teeth: false };
  }
  // Neutral — full lips drawn as a soft horizontal pillow
  return { d: 'M 106 112 Q 120 117 134 112 Q 120 114 106 112 Z', fill: '#A53E45', teeth: false };
}
