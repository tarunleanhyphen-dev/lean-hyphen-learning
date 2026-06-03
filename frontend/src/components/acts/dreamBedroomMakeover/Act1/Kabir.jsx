/**
 * Kabir — the 14-year-old host of the Dream Bedroom Makeover.
 *
 * A friendly, Nobita-inspired boy: round glasses, tidy black hair, warm skin,
 * bright tee. Pure SVG so he's crisp at any size and needs zero network.
 *
 * Props:
 *   mood       'happy' | 'thinking' | 'surprised' | 'excited' | 'wave'
 *   speaking   boolean — when true the mouth opens/closes
 *   amplitude  0–1 live TTS loudness; drives the mouth so it lip-syncs
 *   size       px (square). Default 132.
 */
import { motion } from 'framer-motion';

export function Kabir({ mood = 'happy', speaking = false, amplitude = 0, size = 132, accent = '#A855F7' }) {
  // Mouth opening: idle tiny smile; while speaking, track amplitude.
  const open = speaking ? 3 + Math.min(13, amplitude * 22) : 0;

  const brow = {
    happy:     { l: 0, r: 0 },
    thinking:  { l: -3, r: 2 },
    surprised: { l: -4, r: -4 },
    excited:   { l: -2, r: -2 },
    wave:      { l: -1, r: -1 },
  }[mood] || { l: 0, r: 0 };

  return (
    <motion.div
      style={{ width: size, height: size, lineHeight: 0 }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden
    >
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="kb-skin" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#f4c89e" />
            <stop offset="100%" stopColor="#e0a875" />
          </radialGradient>
          <linearGradient id="kb-shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <radialGradient id="kb-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff9a9e" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ff9a9e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Body / shirt */}
        <path d="M58 196 C58 150 78 132 100 132 C122 132 142 150 142 196 Z" fill="url(#kb-shirt)" />
        <path d="M100 132 L92 150 L100 160 L108 150 Z" fill="#ffffff" opacity="0.85" />

        {/* Waving arm (only in wave mood) */}
        {mood === 'wave' && (
          <motion.g
            style={{ transformOrigin: '140px 150px' }}
            animate={{ rotate: [0, 18, -6, 18, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="136" y="138" width="14" height="40" rx="7" fill="url(#kb-skin)" transform="rotate(28 143 150)" />
            <circle cx="160" cy="120" r="11" fill="url(#kb-skin)" />
          </motion.g>
        )}

        {/* Neck */}
        <rect x="92" y="118" width="16" height="20" rx="7" fill="url(#kb-skin)" />

        {/* Head */}
        <ellipse cx="100" cy="84" rx="46" ry="48" fill="url(#kb-skin)" />
        {/* Ears */}
        <circle cx="55" cy="86" r="8" fill="url(#kb-skin)" />
        <circle cx="145" cy="86" r="8" fill="url(#kb-skin)" />

        {/* Hair — tidy with a little tuft */}
        <path d="M54 78 C50 36 86 24 100 24 C118 24 150 38 146 80 C140 60 120 50 100 50 C82 50 62 58 54 78 Z" fill="#241b1b" />
        <path d="M96 26 C104 18 116 22 116 30 C110 26 102 26 96 32 Z" fill="#241b1b" />

        {/* Cheeks */}
        <circle cx="72" cy="96" r="11" fill="url(#kb-cheek)" />
        <circle cx="128" cy="96" r="11" fill="url(#kb-cheek)" />

        {/* Eyebrows */}
        <motion.rect x="66" y="68" width="20" height="5" rx="2.5" fill="#241b1b" animate={{ y: 68 + brow.l }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} />
        <motion.rect x="114" y="68" width="20" height="5" rx="2.5" fill="#241b1b" animate={{ y: 68 + brow.r }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} />

        {/* Round Nobita-style glasses */}
        <circle cx="76" cy="88" r="15" fill="#ffffff" opacity="0.18" stroke="#2b2b2b" strokeWidth="3.5" />
        <circle cx="124" cy="88" r="15" fill="#ffffff" opacity="0.18" stroke="#2b2b2b" strokeWidth="3.5" />
        <rect x="90" y="86" width="20" height="3.5" rx="1.75" fill="#2b2b2b" />

        {/* Eyes (blink) */}
        <motion.g animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.92, 0.95, 0.98, 1] }} style={{ transformOrigin: '100px 88px' }}>
          <circle cx="76" cy="89" r={mood === 'surprised' ? 7 : 5.5} fill="#241b1b" />
          <circle cx="124" cy="89" r={mood === 'surprised' ? 7 : 5.5} fill="#241b1b" />
          <circle cx="78" cy="87" r="2" fill="#fff" />
          <circle cx="126" cy="87" r="2" fill="#fff" />
        </motion.g>

        {/* Nose */}
        <path d="M100 94 L96 104 L104 104 Z" fill="#d9966a" opacity="0.6" />

        {/* Mouth — opens with amplitude while speaking, else a smile */}
        {open > 1 ? (
          <ellipse cx="100" cy="114" rx={9} ry={open / 2 + 2} fill="#7a2e2e" />
        ) : mood === 'surprised' ? (
          <circle cx="100" cy="114" r="6" fill="#7a2e2e" />
        ) : (
          <path d="M86 112 Q100 124 114 112" stroke="#7a2e2e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </motion.div>
  );
}
