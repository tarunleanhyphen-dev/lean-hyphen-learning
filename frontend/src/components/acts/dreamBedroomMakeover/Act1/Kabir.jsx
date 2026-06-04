/**
 * Kabir — the host of the makeover. An ORIGINAL full-body young-adult guy
 * (~20): modern short hair, slim glasses, a graphic tee, jeans and sneakers.
 * Pure SVG so he stays crisp at any size. Lip-syncs to the TTS amplitude.
 *
 * Props:
 *   mood       'happy' | 'thinking' | 'surprised' | 'excited' | 'wave'
 *   speaking   boolean — mouth opens/closes while true
 *   amplitude  0–1 live TTS loudness; drives the mouth
 *   size       rendered HEIGHT in px (width auto ≈ 0.52×). Default 220.
 */
import { motion } from 'framer-motion';

export function Kabir({ mood = 'happy', speaking = false, amplitude = 0, size = 220 }) {
  const open = speaking ? 1.4 + Math.min(6, amplitude * 11) : 0;
  const brow = {
    happy: { l: 0, r: 0 }, thinking: { l: -2, r: 1.5 }, surprised: { l: -2.5, r: -2.5 },
    excited: { l: -1.5, r: -1.5 }, wave: { l: -1, r: -1 },
  }[mood] || { l: 0, r: 0 };
  const w = size * 0.52;

  return (
    <motion.div
      style={{ width: w, height: size, lineHeight: 0 }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden
    >
      <svg viewBox="0 0 150 290" width={w} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="kb-skin" cx="50%" cy="36%" r="70%">
            <stop offset="0%" stopColor="#f3c79c" /><stop offset="100%" stopColor="#dca06f" />
          </radialGradient>
          <linearGradient id="kb-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c211c" /><stop offset="100%" stopColor="#191210" />
          </linearGradient>
          <linearGradient id="kb-tee" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e84a4a" /><stop offset="100%" stopColor="#c5282f" />
          </linearGradient>
          <linearGradient id="kb-jeans" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#23305e" /><stop offset="100%" stopColor="#161f3d" />
          </linearGradient>
          <radialGradient id="kb-grd" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.22" /><stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ground shadow */}
        <ellipse cx="75" cy="284" rx="42" ry="7" fill="url(#kb-grd)" />

        {/* ---- legs / jeans ---- */}
        <g>
          <path d="M58 168 L54 268 L70 268 L74 200 L78 268 L94 268 L90 168 Z" fill="url(#kb-jeans)" stroke="#222c47" strokeWidth="1.5" />
          <line x1="74" y1="176" x2="74" y2="258" stroke="#222c47" strokeWidth="1.5" opacity="0.6" />
          <path d="M58 214 q8 3 16 0" stroke="#2a3658" strokeWidth="1" fill="none" opacity="0.7" />
          <path d="M76 214 q8 3 16 0" stroke="#2a3658" strokeWidth="1" fill="none" opacity="0.7" />
        </g>
        {/* sneakers */}
        <g>
          <path d="M50 268 q-2 12 6 14 l16 0 0-14 Z" fill="#f4f4f6" stroke="#cfd3da" strokeWidth="1.5" />
          <path d="M78 268 l16 0 q8 0 8 14 l-24 0 Z" fill="#f4f4f6" stroke="#cfd3da" strokeWidth="1.5" />
          <path d="M50 279 l22 2 M78 281 l24 0" stroke="#c5282f" strokeWidth="2" />
        </g>

        {/* ---- arms ---- */}
        {mood === 'wave' ? (
          <motion.g style={{ transformOrigin: '108px 120px' }}
            animate={{ rotate: [0, 22, -4, 22, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
            <path d="M104 120 L128 78" stroke="url(#kb-tee)" strokeWidth="13" strokeLinecap="round" />
            <circle cx="130" cy="74" r="8" fill="url(#kb-skin)" stroke="#cf9568" strokeWidth="1.2" />
          </motion.g>
        ) : (
          <path d="M104 120 L112 176" stroke="url(#kb-tee)" strokeWidth="13" strokeLinecap="round" />
        )}
        <path d="M46 120 L38 176" stroke="url(#kb-tee)" strokeWidth="13" strokeLinecap="round" />
        {mood !== 'wave' && <circle cx="113" cy="180" r="7.5" fill="url(#kb-skin)" stroke="#cf9568" strokeWidth="1.2" />}
        <circle cx="37" cy="180" r="7.5" fill="url(#kb-skin)" stroke="#cf9568" strokeWidth="1.2" />

        {/* ---- torso / tee ---- */}
        <path d="M48 112 Q75 100 102 112 L106 172 Q75 182 44 172 Z" fill="url(#kb-tee)" stroke="#1f6e9e" strokeWidth="1.6" />
        <circle cx="75" cy="140" r="12" fill="#fff" opacity="0.85" />
        <path d="M70 140 l4 5 7 -9" stroke="#a02830" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M66 110 Q75 120 84 110" fill="none" stroke="#8f2329" strokeWidth="2.5" />

        {/* ---- neck ---- */}
        <rect x="67" y="96" width="16" height="20" rx="7" fill="url(#kb-skin)" stroke="#cf9568" strokeWidth="1" />

        {/* ---- head + face (scaled up a touch for a bigger face) ---- */}
        <g transform="translate(75 66) scale(1.16) translate(-75 -66)">
        <ellipse cx="75" cy="64" rx="29" ry="31" fill="url(#kb-skin)" stroke="#cf9568" strokeWidth="1.4" />
        <circle cx="47" cy="66" r="6" fill="url(#kb-skin)" stroke="#cf9568" strokeWidth="1" />
        <circle cx="103" cy="66" r="6" fill="url(#kb-skin)" stroke="#cf9568" strokeWidth="1" />
        <path d="M46 60 C42 28 64 20 75 20 C87 20 108 27 104 62 C100 44 92 38 92 38
                 C88 46 80 46 74 42 C70 50 60 48 58 40 C58 40 50 46 46 60 Z" fill="url(#kb-hair)" />
        <path d="M74 22 C82 16 95 19 96 28 C90 23 82 24 76 30 Z" fill="url(#kb-hair)" />

        {/* light stubble */}
        <path d="M52 74 Q75 96 98 74 Q92 88 75 90 Q58 88 52 74 Z" fill="#7a5a3f" opacity="0.16" />

        {/* eyebrows */}
        <motion.path d="M55 54 q9 -4 17 -0.5" stroke="#23170f" strokeWidth="3" fill="none" strokeLinecap="round"
          animate={{ y: brow.l }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} />
        <motion.path d="M78 53.5 q9 -3 17 0.5" stroke="#23170f" strokeWidth="3" fill="none" strokeLinecap="round"
          animate={{ y: brow.r }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} />

        {/* slim glasses */}
        <g stroke="#2b2620" strokeWidth="2.4" fill="none">
          <rect x="52" y="58" width="18" height="13" rx="5" fill="#bfe9ff" fillOpacity="0.12" />
          <rect x="80" y="58" width="18" height="13" rx="5" fill="#bfe9ff" fillOpacity="0.12" />
          <path d="M70 63 q5 -2 10 0" />
          <path d="M52 62 l-6 -2 M98 62 l6 -2" />
        </g>
        {/* eyes */}
        <motion.g animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.94, 0.97, 1] }} style={{ transformOrigin: '75px 64px' }}>
          <circle cx="61" cy="65" r={mood === 'surprised' ? 4.6 : 3.7} fill="#221a12" />
          <circle cx="89" cy="65" r={mood === 'surprised' ? 4.6 : 3.7} fill="#221a12" />
          <circle cx="62.4" cy="63.6" r="1.4" fill="#fff" />
          <circle cx="90.4" cy="63.6" r="1.4" fill="#fff" />
        </motion.g>
        {/* nose */}
        <path d="M75 68 q-3 5 -1 8 q2 2 4 0 q2 -3 -1 -8 Z" fill="#d9966a" opacity="0.6" />
        {/* mouth */}
        {open > 1 ? (
          <ellipse cx="75" cy="84" rx={7} ry={open} fill="#7a2e2e" />
        ) : mood === 'surprised' ? (
          <circle cx="75" cy="84" r="4" fill="#7a2e2e" />
        ) : (
          <path d="M64 81 Q75 90 86 81" stroke="#7a2e2e" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        )}
        </g>
      </svg>
    </motion.div>
  );
}
