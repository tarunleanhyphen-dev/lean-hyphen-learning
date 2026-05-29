import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Money500 v2 — the ₹500 rupee note as a friendly mascot character.
 *
 * Detailed upgrade per user feedback:
 *  - Realistic RBI note design: lavender colour scheme, microprint
 *    border, security thread, watermark oval, Devanagari "पाँच सौ"
 *    text, ASHOKA emblem dot, denomination on both corners.
 *  - Glossy shine sweep across the note (subtle highlight gradient).
 *  - Bigger expressive face: round eyes with double highlights, full
 *    smile with cheek dimples, raised eyebrows.
 *  - More natural arm + leg poses: arms with elbows, hands with
 *    visible fingers, legs in walking stance.
 *  - Floating sparkle cloud + glow halo to sell the "transformed
 *    magical character" energy.
 */

export default function Money500({
  speaking = false,
  amplitudeRef,
  pose = 'wave',
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
    }, 3500 + Math.random() * 2500);
    return () => clearInterval(id);
  }, []);

  const mouth = mouthShape(mouthLevel);

  const armLeft = pose === 'wave'
    ? { rotate: [-30, -50, -30] }
    : pose === 'walk'
      ? { rotate: [-18, 30, -18] }
      : { rotate: [-12, -6, -12] };
  const armRight = pose === 'wave'
    ? { rotate: [12, 6, 12] }
    : pose === 'walk'
      ? { rotate: [30, -18, 30] }
      : { rotate: [12, 6, 12] };
  const legLeft  = pose === 'walk' ? { rotate: [-12, 12, -12] } : { rotate: [0, 0, 0] };
  const legRight = pose === 'walk' ? { rotate: [12, -12, 12] } : { rotate: [0, 0, 0] };

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 320 420" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Note body — realistic RBI ₹500 lavender → mauve */}
          <linearGradient id="m5b-note" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#F2DDD7" />
            <stop offset="30%"  stopColor="#D9A6BC" />
            <stop offset="65%"  stopColor="#B17EA0" />
            <stop offset="100%" stopColor="#7A5A6B" />
          </linearGradient>
          <linearGradient id="m5b-note-shine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%"  stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="55%"  stopColor="#FFFFFF" stopOpacity="0.30" />
            <stop offset="65%"  stopColor="#FFFFFF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="m5b-pants" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B5998" />
            <stop offset="100%" stopColor="#1E3A5F" />
          </linearGradient>
          <radialGradient id="m5b-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FF8B6C" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF8B6C" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="m5b-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FDE047" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
          </radialGradient>
          {/* Watermark oval (Gandhi-style portrait abstracted) */}
          <radialGradient id="m5b-water" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#F2DDD7" stopOpacity="0.95" />
            <stop offset="80%"  stopColor="#D9A6BC" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D9A6BC" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* === GLOW HALO behind everything === */}
        <circle cx="160" cy="200" r="180" fill="url(#m5b-glow)" />

        {/* Shadow */}
        <ellipse cx="160" cy="402" rx="80" ry="10" fill="#000" opacity="0.22" />

        {/* === LEGS === */}
        <motion.g animate={legLeft} transition={{ duration: 0.7, repeat: Infinity }} style={{ transformOrigin: '140px 308px' }}>
          <rect x="130" y="308" width="22" height="70" rx="10" fill="url(#m5b-pants)" />
          <ellipse cx="141" cy="382" rx="20" ry="7" fill="#4A2E1A" />
          <ellipse cx="139" cy="379" rx="16" ry="3" fill="#6E4A30" />
          {/* Shoe lace */}
          <line x1="135" y1="376" x2="147" y2="376" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.6" />
        </motion.g>
        <motion.g animate={legRight} transition={{ duration: 0.7, repeat: Infinity }} style={{ transformOrigin: '180px 308px' }}>
          <rect x="168" y="308" width="22" height="70" rx="10" fill="url(#m5b-pants)" />
          <ellipse cx="179" cy="382" rx="20" ry="7" fill="#4A2E1A" />
          <ellipse cx="177" cy="379" rx="16" ry="3" fill="#6E4A30" />
          <line x1="173" y1="376" x2="185" y2="376" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.6" />
        </motion.g>

        {/* === NOTE BODY ===
           Detailed ₹500 RBI note: outer border, micro-print frame,
           denomination numbers, security thread, language strip,
           watermark, ashoka emblem. */}
        <g>
          {/* Note outer with rounded corners */}
          <rect x="30" y="80" width="260" height="220" rx="14" fill="url(#m5b-note)" stroke="#6E5566" strokeWidth="2.5" />
          {/* Inner micro-print frame (decorative dashed border) */}
          <rect x="42" y="92" width="236" height="196" rx="10" fill="none" stroke="#8A6B7E" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
          <rect x="46" y="96" width="228" height="188" rx="8" fill="none" stroke="#7A5A6B" strokeWidth="0.6" opacity="0.5" />

          {/* Top text strip (RBI) */}
          <rect x="42" y="92" width="236" height="20" rx="3" fill="#7A5A6B" opacity="0.15" />
          <text x="160" y="106" textAnchor="middle" fontSize="9.5" fontWeight="700" fontFamily="serif" fill="#3E2A38" letterSpacing="1.6">RESERVE BANK OF INDIA</text>

          {/* Denomination corners */}
          <text x="58" y="138" fontSize="22" fontWeight="800" fontFamily="serif" fill="#3E2A38">₹500</text>
          <text x="262" y="278" textAnchor="end" fontSize="22" fontWeight="800" fontFamily="serif" fill="#3E2A38">₹500</text>
          {/* Hindi denomination */}
          <text x="160" y="142" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="serif" fill="#3E2A38">पाँच सौ रुपये</text>

          {/* Side ornamental bands */}
          <rect x="50" y="146" width="6" height="120" fill="#8A6B7E" opacity="0.5" />
          <rect x="264" y="146" width="6" height="120" fill="#8A6B7E" opacity="0.5" />
          {/* Decorative dots in the side bands */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <circle cx="53" cy={156 + i * 18} r="1.2" fill="#3E2A38" opacity="0.6" />
              <circle cx="267" cy={156 + i * 18} r="1.2" fill="#3E2A38" opacity="0.6" />
            </g>
          ))}

          {/* Security thread — vertical iridescent line */}
          <rect x="100" y="92" width="3" height="196" fill="#8A6B7E" opacity="0.55" />
          <rect x="100" y="92" width="3" height="196" fill="#FDE047" opacity="0.35" />

          {/* Watermark oval — placeholder for the portrait */}
          <ellipse cx="160" cy="210" rx="46" ry="48" fill="url(#m5b-water)" />
          <ellipse cx="160" cy="210" rx="38" ry="40" fill="none" stroke="#8A6B7E" strokeWidth="1.2" opacity="0.45" />
          {/* Ashoka emblem placeholder — small triangular crown */}
          <polygon points="160,176 156,182 164,182" fill="#3E2A38" opacity="0.55" />
          {/* "500" in big behind the watermark (washed out) */}
          <text x="160" y="222" textAnchor="middle" fontSize="36" fontWeight="800" fontFamily="serif" fill="#7A5A6B" opacity="0.35">500</text>

          {/* Subtle micro-printing horizontal lines */}
          <g stroke="#7A5A6B" strokeWidth="0.4" opacity="0.4">
            <line x1="60" y1="156" x2="92" y2="156" />
            <line x1="60" y1="160" x2="92" y2="160" />
            <line x1="60" y1="164" x2="92" y2="164" />
            <line x1="226" y1="246" x2="258" y2="246" />
            <line x1="226" y1="250" x2="258" y2="250" />
            <line x1="226" y1="254" x2="258" y2="254" />
          </g>

          {/* GLOSSY SHINE sweep across note */}
          <rect x="30" y="80" width="260" height="220" rx="14" fill="url(#m5b-note-shine)" />
        </g>

        {/* === FACE on top of the note === */}
        {/* Cheeks */}
        <circle cx="110" cy="232" r="12" fill="url(#m5b-cheek)" />
        <circle cx="210" cy="232" r="12" fill="url(#m5b-cheek)" />

        {/* === EYES — big with double highlights === */}
        <g>
          <motion.ellipse
            cx="130" cy="218" rx="16"
            animate={{ ry: blink ? 1 : 18 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.2"
          />
          {!blink && (
            <>
              <ellipse cx="130" cy="221" rx="10" ry="12" fill="#1A1426" />
              <circle cx="133" cy="217" r="4" fill="#FFFFFF" />
              <circle cx="127" cy="224" r="1.8" fill="#FFFFFF" />
            </>
          )}
          <motion.ellipse
            cx="190" cy="218" rx="16"
            animate={{ ry: blink ? 1 : 18 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.2"
          />
          {!blink && (
            <>
              <ellipse cx="190" cy="221" rx="10" ry="12" fill="#1A1426" />
              <circle cx="193" cy="217" r="4" fill="#FFFFFF" />
              <circle cx="187" cy="224" r="1.8" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* === EYEBROWS — friendly raised === */}
        <path d="M 116 196 Q 130 189 144 196" stroke="#1A1426" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 176 196 Q 190 189 204 196" stroke="#1A1426" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* === SMILE === */}
        <motion.path
          animate={{ d: mouth.d }}
          transition={{ duration: 0.12 }}
          fill={mouth.fill}
          stroke="#1A1426"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {mouth.teeth && (
          <rect x="142" y="254" width="36" height="5" rx="1.5" fill="#FFFFFF" opacity="0.95" />
        )}
        {/* Smile dimples */}
        <circle cx="124" cy="252" r="2" fill="#9A5252" opacity="0.6" />
        <circle cx="196" cy="252" r="2" fill="#9A5252" opacity="0.6" />

        {/* === ARMS — with elbows + visible fingers === */}
        <motion.g
          animate={armLeft}
          transition={{ duration: pose === 'wave' ? 1.4 : 0.7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '40px 180px' }}
        >
          {/* Upper arm */}
          <line x1="40" y1="180" x2="22" y2="142" stroke="#1A1426" strokeWidth="7" strokeLinecap="round" />
          {/* Forearm */}
          <line x1="22" y1="142" x2="14" y2="108" stroke="#1A1426" strokeWidth="7" strokeLinecap="round" />
          {/* Elbow joint */}
          <circle cx="22" cy="142" r="4" fill="#1A1426" />
          {/* Glove hand */}
          <circle cx="12" cy="104" r="14" fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.5" />
          {/* Fingers — visible thumb + fold lines */}
          <path d="M 2 96 Q 8 92 12 96" stroke="#1A1426" strokeWidth="1.5" fill="none" />
          <path d="M 6 110 Q 12 106 18 110" stroke="#1A1426" strokeWidth="1.5" fill="none" />
          {/* Wave gesture — extra splayed fingers when waving */}
          {pose === 'wave' && (
            <>
              <line x1="6" y1="92" x2="2" y2="86" stroke="#1A1426" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="90" x2="12" y2="84" stroke="#1A1426" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="92" x2="22" y2="86" stroke="#1A1426" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </motion.g>
        <motion.g
          animate={armRight}
          transition={{ duration: pose === 'wave' ? 1.4 : 0.7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '280px 180px' }}
        >
          <line x1="280" y1="180" x2="298" y2="158" stroke="#1A1426" strokeWidth="7" strokeLinecap="round" />
          <line x1="298" y1="158" x2="312" y2="148" stroke="#1A1426" strokeWidth="7" strokeLinecap="round" />
          <circle cx="298" cy="158" r="4" fill="#1A1426" />
          <circle cx="314" cy="150" r="14" fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.5" />
          <path d="M 308 142 Q 314 138 320 142" stroke="#1A1426" strokeWidth="1.5" fill="none" />
          <path d="M 308 156 Q 314 152 320 156" stroke="#1A1426" strokeWidth="1.5" fill="none" />
        </motion.g>

        {/* === Sparkle stars === */}
        {[
          { x: 42,  y: 90  },
          { x: 280, y: 95  },
          { x: 22,  y: 250 },
          { x: 296, y: 240 },
          { x: 150, y: 75  },
          { x: 175, y: 320 },
        ].map((s, i) => (
          <motion.g
            key={i}
            animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35 }}
            style={{ transformOrigin: `${s.x}px ${s.y}px` }}
          >
            <path d={`M ${s.x} ${s.y - 6} L ${s.x + 1.8} ${s.y - 1.8} L ${s.x + 6} ${s.y} L ${s.x + 1.8} ${s.y + 1.8} L ${s.x} ${s.y + 6} L ${s.x - 1.8} ${s.y + 1.8} L ${s.x - 6} ${s.y} L ${s.x - 1.8} ${s.y - 1.8} Z`} fill="#FDE047" />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
}

function mouthShape(level) {
  if (level >= 3) {
    return { d: 'M 130 240 Q 160 274 190 240 Q 160 266 130 240 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 134 244 Q 160 264 186 244 Q 160 260 134 244 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 136 246 Q 160 258 184 246 Q 160 254 136 246 Z', fill: '#7B2933', teeth: false };
  }
  // Big confident smile at rest
  return { d: 'M 130 246 Q 160 272 190 246', fill: 'transparent', teeth: false };
}
