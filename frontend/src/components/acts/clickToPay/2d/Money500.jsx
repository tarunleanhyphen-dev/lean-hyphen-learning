import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Money500 — the ₹500 rupee note as a friendly mascot character that
 * Ritwik transforms into during Scene 3. Rectangular note body with the
 * RBI lavender colour scheme, a smiling face, white-gloved stick arms
 * waving hello, blue pants + brown shoes underneath, plus a small name
 * badge. Inspired by the reference image the user supplied.
 *
 * Drives:
 *   - Idle: gentle bob + breath
 *   - Speaking: mouth opens/closes from amplitudeRef
 *   - Blink loop
 *   - Optional `pose`: 'wave' | 'walk' | 'idle' — used by the digital-
 *     world scenes when Money500 travels between systems.
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
    ? { rotate: [-25, -45, -25] }
    : pose === 'walk'
      ? { rotate: [-15, 25, -15] }
      : { rotate: [-10, -5, -10] };
  const armRight = pose === 'wave'
    ? { rotate: [10, 5, 10] }
    : pose === 'walk'
      ? { rotate: [25, -15, 25] }
      : { rotate: [10, 5, 10] };
  const legLeft  = pose === 'walk' ? { rotate: [-12, 12, -12] } : { rotate: [0, 0, 0] };
  const legRight = pose === 'walk' ? { rotate: [12, -12, 12] } : { rotate: [0, 0, 0] };

  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 280 380" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Note body — RBI ₹500 lavender → pink */}
          <linearGradient id="m5-note" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#E5C7C0" />
            <stop offset="35%"  stopColor="#D9A6BC" />
            <stop offset="65%"  stopColor="#C28DA8" />
            <stop offset="100%" stopColor="#8A6B7E" />
          </linearGradient>
          <linearGradient id="m5-note-shade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7A5A6B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7A5A6B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="m5-pants" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B5998" />
            <stop offset="100%" stopColor="#1E3A5F" />
          </linearGradient>
          <radialGradient id="m5-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FF8B6C" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF8B6C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="140" cy="362" rx="78" ry="10" fill="#000" opacity="0.22" />

        {/* === LEGS === */}
        <motion.g animate={legLeft} transition={{ duration: 0.6, repeat: Infinity }} style={{ transformOrigin: '120px 280px' }}>
          <rect x="112" y="280" width="22" height="62" rx="10" fill="url(#m5-pants)" />
          <ellipse cx="123" cy="346" rx="18" ry="7" fill="#4A2E1A" />
          <ellipse cx="120" cy="343" rx="14" ry="3" fill="#6E4A30" />
        </motion.g>
        <motion.g animate={legRight} transition={{ duration: 0.6, repeat: Infinity }} style={{ transformOrigin: '160px 280px' }}>
          <rect x="146" y="280" width="22" height="62" rx="10" fill="url(#m5-pants)" />
          <ellipse cx="157" cy="346" rx="18" ry="7" fill="#4A2E1A" />
          <ellipse cx="154" cy="343" rx="14" ry="3" fill="#6E4A30" />
        </motion.g>

        {/* === NOTE BODY ===
           Wide rectangle representing the ₹500 note, with subtle border
           ornament + value numbers + RBI text — readable mascot, not a
           photocopy. */}
        <g>
          {/* Note outer */}
          <rect x="20" y="60" width="240" height="220" rx="14" fill="url(#m5-note)" stroke="#6E5566" strokeWidth="2.5" />
          {/* Inner frame */}
          <rect x="32" y="72" width="216" height="196" rx="10" fill="none" stroke="#8A6B7E" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.55" />
          {/* Top text strip */}
          <rect x="32" y="72" width="216" height="22" rx="3" fill="#7A5A6B" opacity="0.15" />
          <text x="140" y="88" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="serif" fill="#3E2A38" letterSpacing="1.5">RESERVE BANK OF INDIA</text>

          {/* Big ₹500 numerals — top-left & bottom-right corners */}
          <text x="48" y="120" fontSize="22" fontWeight="800" fontFamily="serif" fill="#3E2A38">₹500</text>
          <text x="232" y="258" textAnchor="end" fontSize="22" fontWeight="800" fontFamily="serif" fill="#3E2A38">₹500</text>

          {/* Decorative side bands */}
          <rect x="38" y="125" width="6" height="120" fill="#8A6B7E" opacity="0.5" />
          <rect x="236" y="125" width="6" height="120" fill="#8A6B7E" opacity="0.5" />

          {/* Subtle ornamental ovals (replaces Gandhi portrait — keeps it abstract) */}
          <ellipse cx="140" cy="190" rx="44" ry="46" fill="#F0DDE3" opacity="0.55" />
          <ellipse cx="140" cy="190" rx="36" ry="38" fill="none" stroke="#8A6B7E" strokeWidth="1.5" opacity="0.4" />

          {/* Diagonal shade for depth */}
          <rect x="20" y="60" width="240" height="220" rx="14" fill="url(#m5-note-shade)" />
        </g>

        {/* === FACE (sits on top of the note body) === */}
        {/* Cheeks */}
        <circle cx="100" cy="208" r="11" fill="url(#m5-cheek)" />
        <circle cx="180" cy="208" r="11" fill="url(#m5-cheek)" />

        {/* Eyes — big cartoon eyes with white sclera, large pupils, highlights */}
        <g>
          <motion.ellipse
            cx="115" cy="195" rx="14"
            animate={{ ry: blink ? 1 : 16 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A1426" strokeWidth="2"
          />
          {!blink && (
            <>
              <ellipse cx="115" cy="198" rx="9" ry="11" fill="#1A1426" />
              <circle cx="118" cy="194" r="3.5" fill="#FFFFFF" />
              <circle cx="113" cy="201" r="1.6" fill="#FFFFFF" />
            </>
          )}
          <motion.ellipse
            cx="165" cy="195" rx="14"
            animate={{ ry: blink ? 1 : 16 }}
            transition={{ duration: 0.08 }}
            fill="#FFFFFF" stroke="#1A1426" strokeWidth="2"
          />
          {!blink && (
            <>
              <ellipse cx="165" cy="198" rx="9" ry="11" fill="#1A1426" />
              <circle cx="168" cy="194" r="3.5" fill="#FFFFFF" />
              <circle cx="163" cy="201" r="1.6" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* Smile — big curved smile, opens with amplitude */}
        <motion.path
          animate={{ d: mouth.d }}
          transition={{ duration: 0.12 }}
          fill={mouth.fill}
          stroke="#1A1426"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Teeth row when mouth open */}
        {mouth.teeth && (
          <rect x="124" y="232" width="32" height="4" rx="1" fill="#FFFFFF" opacity="0.95" />
        )}

        {/* === ARMS — stick arms with white gloves === */}
        <motion.g
          animate={armLeft}
          transition={{ duration: pose === 'wave' ? 1.4 : 0.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '32px 160px' }}
        >
          {/* Left arm */}
          <line x1="32" y1="160" x2="0" y2="100" stroke="#1A1426" strokeWidth="6" strokeLinecap="round" />
          {/* Left hand — white glove */}
          <circle cx="-2" cy="96" r="13" fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.5" />
          {/* Finger lines */}
          <path d="M -8 90 Q -2 84 4 90" stroke="#1A1426" strokeWidth="1.5" fill="none" />
        </motion.g>
        <motion.g
          animate={armRight}
          transition={{ duration: pose === 'wave' ? 1.4 : 0.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '248px 160px' }}
        >
          {/* Right arm */}
          <line x1="248" y1="160" x2="276" y2="140" stroke="#1A1426" strokeWidth="6" strokeLinecap="round" />
          {/* Right hand — gesturing outward */}
          <circle cx="278" cy="142" r="13" fill="#FFFFFF" stroke="#1A1426" strokeWidth="2.5" />
          <path d="M 272 136 Q 278 130 284 136" stroke="#1A1426" strokeWidth="1.5" fill="none" />
        </motion.g>

        {/* Sparkle stars to give a magical/transformed feel */}
        {[
          { x: 32,  y: 70  },
          { x: 245, y: 80  },
          { x: 18,  y: 230 },
          { x: 254, y: 220 },
        ].map((s, i) => (
          <motion.g
            key={i}
            animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            style={{ transformOrigin: `${s.x}px ${s.y}px` }}
          >
            <path d={`M ${s.x} ${s.y - 5} L ${s.x + 1.5} ${s.y - 1.5} L ${s.x + 5} ${s.y} L ${s.x + 1.5} ${s.y + 1.5} L ${s.x} ${s.y + 5} L ${s.x - 1.5} ${s.y + 1.5} L ${s.x - 5} ${s.y} L ${s.x - 1.5} ${s.y - 1.5} Z`} fill="#FDE047" />
          </motion.g>
        ))}

        {/* Glow halo around the character */}
        <motion.circle
          cx="140" cy="190" r="160"
          fill="none"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          stroke="#FDE047"
          strokeWidth="2"
          opacity="0.2"
          filter="url(#m5-blur)"
        />
      </svg>
    </motion.div>
  );
}

function mouthShape(level) {
  if (level >= 3) {
    return { d: 'M 115 220 Q 140 248 165 220 Q 140 240 115 220 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 118 222 Q 140 240 162 222 Q 140 236 118 222 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 120 224 Q 140 234 160 224 Q 140 232 120 224 Z', fill: '#7B2933', teeth: false };
  }
  // Big confident smile at rest
  return { d: 'M 115 222 Q 140 248 165 222', fill: 'transparent', teeth: false };
}
