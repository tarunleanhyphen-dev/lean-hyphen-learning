import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Money500 v3 — directly modeled on the reference image the user
 * supplied (the classic "Money Saver" cartoon mascot: a smiling
 * ₹500 RBI note with a big face directly on the note, arms emerging
 * from the sides with white-gloved hands, blue trousers + brown shoes
 * underneath, and a "Money Saver" name badge clipped on at the top).
 *
 * Faithful changes from v2:
 *  - Square-ish lavender note proportions
 *  - Big smiling face takes up the upper half of the note
 *  - Classic stick arms with white gloved hands (one waves, one
 *    presents forward as if introducing itself)
 *  - Two stubby blue legs with brown shoes
 *  - Small "Money Saver" rectangular badge clipped to the top edge
 *  - "RESERVE BANK OF INDIA" arc-text at the top, "₹500" denomination
 *    in the corners
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
    }, 3500 + Math.random() * 2500);
    return () => clearInterval(id);
  }, []);

  const mouth = mouthShape(mouthLevel);

  // Left arm — waving up + back (classic mascot wave)
  const armLeft = pose === 'wave'
    ? { rotate: [-15, -28, -15] }
    : pose === 'walk'
      ? { rotate: [-10, 20, -10] }
      : { rotate: [-8, -4, -8] };
  // Right arm — extended outward presenting (the iconic open-hand gesture
  // from the reference image)
  const armRight = pose === 'wave'
    ? { rotate: [-65, -70, -65] }
    : pose === 'walk'
      ? { rotate: [20, -10, 20] }
      : { rotate: [-60, -55, -60] };
  const legLeft  = pose === 'walk' ? { rotate: [-8, 8, -8] } : { rotate: 0 };
  const legRight = pose === 'walk' ? { rotate: [8, -8, 8] } : { rotate: 0 };

  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 360 440" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Note body — RBI ₹500 lavender, slightly more saturated to match the reference */}
          <linearGradient id="m5c-note" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E8C4D2" />
            <stop offset="100%" stopColor="#B07E97" />
          </linearGradient>
          <linearGradient id="m5c-pants" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B5998" />
            <stop offset="100%" stopColor="#1E3A5F" />
          </linearGradient>
          <radialGradient id="m5c-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FF8B6C" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF8B6C" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="m5c-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FDE047" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* GLOW HALO behind everything */}
        <circle cx="180" cy="200" r="200" fill="url(#m5c-glow)" />

        {/* Shadow under feet */}
        <ellipse cx="180" cy="424" rx="80" ry="9" fill="#000" opacity="0.25" />

        {/* === LEGS — blue trousers, stubby === */}
        <motion.g animate={legLeft} transition={{ duration: 0.7, repeat: Infinity }} style={{ transformOrigin: '156px 330px' }}>
          <rect x="148" y="330" width="22" height="70" rx="10" fill="url(#m5c-pants)" />
          <ellipse cx="159" cy="406" rx="22" ry="9" fill="#4A2E1A" stroke="#1A1426" strokeWidth="1.2" />
          <ellipse cx="156" cy="402" rx="17" ry="3" fill="#6E4A30" />
          {/* shoe lace */}
          <line x1="152" y1="400" x2="166" y2="400" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.7" />
        </motion.g>
        <motion.g animate={legRight} transition={{ duration: 0.7, repeat: Infinity }} style={{ transformOrigin: '204px 330px' }}>
          <rect x="190" y="330" width="22" height="70" rx="10" fill="url(#m5c-pants)" />
          <ellipse cx="201" cy="406" rx="22" ry="9" fill="#4A2E1A" stroke="#1A1426" strokeWidth="1.2" />
          <ellipse cx="198" cy="402" rx="17" ry="3" fill="#6E4A30" />
          <line x1="194" y1="400" x2="208" y2="400" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.7" />
        </motion.g>

        {/* === NOTE BODY ===
           Wider-than-tall rectangle representing the ₹500 note, with the
           BIG FACE directly on it (face IS the front of the note). */}
        <g>
          {/* Outer note border — thick black outline like a cartoon */}
          <rect x="40" y="80" width="280" height="250" rx="10" fill="url(#m5c-note)" stroke="#1A1426" strokeWidth="3" />
          {/* Inner border line */}
          <rect x="52" y="92" width="256" height="226" rx="6" fill="none" stroke="#6E5566" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />

          {/* === RBI top text === */}
          <rect x="58" y="98" width="244" height="22" rx="3" fill="#7A5A6B" opacity="0.18" />
          <text x="180" y="114" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="serif" fill="#3E2A38" letterSpacing="1.8">RESERVE BANK OF INDIA</text>

          {/* === Denomination corners === */}
          <text x="68" y="146" fontSize="20" fontWeight="800" fontFamily="serif" fill="#3E2A38">₹500</text>
          <text x="292" y="146" textAnchor="end" fontSize="20" fontWeight="800" fontFamily="serif" fill="#3E2A38">₹500</text>
          <text x="68" y="312" fontSize="20" fontWeight="800" fontFamily="serif" fill="#3E2A38">₹500</text>
          <text x="292" y="312" textAnchor="end" fontSize="20" fontWeight="800" fontFamily="serif" fill="#3E2A38">₹500</text>

          {/* === Side ornamental bands === */}
          <rect x="60" y="156" width="4" height="146" fill="#8A6B7E" opacity="0.5" />
          <rect x="296" y="156" width="4" height="146" fill="#8A6B7E" opacity="0.5" />
        </g>

        {/* === NAME BADGE clipped at top — "Money Saver" === */}
        <g transform="translate(140 64)">
          {/* Clip */}
          <rect x="32" y="0" width="16" height="22" rx="2" fill="#94A3B8" stroke="#1A1426" strokeWidth="1" />
          <circle cx="40" cy="6" r="3" fill="#475569" stroke="#1A1426" strokeWidth="0.8" />
          {/* Badge body */}
          <rect x="0" y="14" width="80" height="22" rx="3" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1.5" />
          <text x="40" y="30" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="sans-serif" fill="#1E3A5F">MONEY SAVER</text>
        </g>

        {/* === BIG FACE on the note ===
           Face takes up the centre/upper portion of the note. Big
           classic cartoon eyes + smile. Cheek blush. */}
        {/* Cheeks */}
        <circle cx="120" cy="220" r="16" fill="url(#m5c-cheek)" />
        <circle cx="240" cy="220" r="16" fill="url(#m5c-cheek)" />

        {/* EYEBROWS — friendly raised */}
        <path d="M 132 188 Q 152 178 172 188" stroke="#1A1426" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M 188 188 Q 208 178 228 188" stroke="#1A1426" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        {/* EYES — BIG round white sclera, large black pupils with white highlights */}
        <g>
          <motion.ellipse
            cx="152" cy="210" rx="18"
            animate={{ ry: blink ? 1 : 22 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.8"
          />
          {!blink && (
            <>
              <ellipse cx="152" cy="214" rx="11" ry="14" fill="#1A1426" />
              <circle cx="156" cy="208" r="5" fill="#FFFFFF" />
              <circle cx="148" cy="220" r="2" fill="#FFFFFF" />
            </>
          )}
          <motion.ellipse
            cx="208" cy="210" rx="18"
            animate={{ ry: blink ? 1 : 22 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.8"
          />
          {!blink && (
            <>
              <ellipse cx="208" cy="214" rx="11" ry="14" fill="#1A1426" />
              <circle cx="212" cy="208" r="5" fill="#FFFFFF" />
              <circle cx="204" cy="220" r="2" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* === BIG CLASSIC SMILE === */}
        <motion.path
          animate={{ d: mouth.d }}
          transition={{ duration: 0.10 }}
          fill={mouth.fill}
          stroke="#1A1426"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {mouth.teeth && (
          <rect x="158" y="260" width="44" height="6" rx="2" fill="#FFFFFF" opacity="0.95" />
        )}

        {/* === ARMS — stick arms with white gloves emerging from the sides === */}
        {/* Left arm — bent up in a wave */}
        <motion.g
          animate={armLeft}
          transition={{ duration: pose === 'wave' ? 1.6 : 0.7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '50px 230px' }}
        >
          {/* Upper arm */}
          <line x1="50" y1="230" x2="30" y2="185" stroke="#1A1426" strokeWidth="8" strokeLinecap="round" />
          {/* Forearm raised */}
          <line x1="30" y1="185" x2="40" y2="135" stroke="#1A1426" strokeWidth="8" strokeLinecap="round" />
          {/* Elbow joint */}
          <circle cx="30" cy="185" r="5" fill="#1A1426" />
          {/* White-gloved hand waving */}
          <circle cx="42" cy="128" r="18" fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.8" />
          {/* Splayed fingers showing the wave */}
          <line x1="36" y1="116" x2="32" y2="106" stroke="#1A1426" strokeWidth="3" strokeLinecap="round" />
          <line x1="44" y1="113" x2="44" y2="103" stroke="#1A1426" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="116" x2="54" y2="108" stroke="#1A1426" strokeWidth="3" strokeLinecap="round" />
          {/* Glove thumb fold */}
          <path d="M 30 130 Q 36 122 30 116" stroke="#1A1426" strokeWidth="2" fill="none" />
        </motion.g>

        {/* Right arm — extended outward (presenting hand) */}
        <motion.g
          animate={armRight}
          transition={{ duration: pose === 'wave' ? 2 : 0.7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '310px 230px' }}
        >
          {/* Upper arm out to the side */}
          <line x1="310" y1="230" x2="350" y2="218" stroke="#1A1426" strokeWidth="8" strokeLinecap="round" />
          {/* Forearm presenting forward */}
          <line x1="350" y1="218" x2="354" y2="180" stroke="#1A1426" strokeWidth="8" strokeLinecap="round" />
          {/* Elbow joint */}
          <circle cx="350" cy="218" r="5" fill="#1A1426" />
          {/* White-gloved hand, palm-up presenting */}
          <ellipse cx="355" cy="172" rx="20" ry="16" fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.8" />
          {/* Open-palm finger lines */}
          <line x1="345" y1="166" x2="343" y2="156" stroke="#1A1426" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="355" y1="162" x2="355" y2="151" stroke="#1A1426" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="365" y1="166" x2="368" y2="156" stroke="#1A1426" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 340 175 Q 348 168 340 162" stroke="#1A1426" strokeWidth="2" fill="none" />
        </motion.g>

        {/* === Sparkle stars (subtle, around the character) === */}
        {[
          { x: 60,  y: 70  },
          { x: 320, y: 80  },
          { x: 30,  y: 280 },
          { x: 340, y: 270 },
          { x: 180, y: 50  },
        ].map((s, i) => (
          <motion.g
            key={i}
            animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4 }}
            style={{ transformOrigin: `${s.x}px ${s.y}px` }}
          >
            <path d={`M ${s.x} ${s.y - 6} L ${s.x + 2} ${s.y - 2} L ${s.x + 6} ${s.y} L ${s.x + 2} ${s.y + 2} L ${s.x} ${s.y + 6} L ${s.x - 2} ${s.y + 2} L ${s.x - 6} ${s.y} L ${s.x - 2} ${s.y - 2} Z`} fill="#FDE047" />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
}

function mouthShape(level) {
  if (level >= 3) {
    return { d: 'M 150 248 Q 180 286 210 248 Q 180 280 150 248 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 155 252 Q 180 278 205 252 Q 180 274 155 252 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 158 256 Q 180 270 202 256 Q 180 266 158 256 Z', fill: '#7B2933', teeth: false };
  }
  // Big classic smile at rest (the iconic mascot smile from the reference image)
  return { d: 'M 142 252 Q 180 290 218 252', fill: 'transparent', teeth: false };
}
