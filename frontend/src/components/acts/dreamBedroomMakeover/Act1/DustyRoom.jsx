/**
 * DustyRoom — the "before" of the makeover: a bare, neglected bedroom.
 * Faded walls, a grimy window with a dusty light shaft, a cobweb, ghost
 * marks where furniture used to be, a lone cardboard box, and drifting dust.
 * Pure SVG + a few framer motes. Used on the Scene 1 hero.
 */
import { motion } from 'framer-motion';

const MOTES = [
  { x: 150, y: 90, r: 2.2, d: 7 }, { x: 210, y: 130, r: 1.6, d: 9 },
  { x: 180, y: 70, r: 1.4, d: 6 }, { x: 250, y: 100, r: 2.0, d: 8 },
  { x: 130, y: 150, r: 1.8, d: 10 }, { x: 230, y: 165, r: 1.3, d: 7.5 },
  { x: 190, y: 120, r: 2.4, d: 11 },
];

export function DustyRoom({ className = '' }) {
  return (
    <div className={`dbm-dusty ${className}`}>
      <svg viewBox="0 0 400 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="dr-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b5847" />
            <stop offset="100%" stopColor="#534334" />
          </linearGradient>
          <linearGradient id="dr-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a5b3c" />
            <stop offset="100%" stopColor="#4f3a25" />
          </linearGradient>
          <linearGradient id="dr-beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe6a8" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#ffe6a8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="dr-vig" cx="50%" cy="44%" r="70%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
        </defs>

        {/* walls + floor */}
        <rect x="0" y="0" width="400" height="196" fill="url(#dr-wall)" />
        <polygon points="0,196 400,196 400,300 0,300" fill="url(#dr-floor)" />
        {/* skirting + floor seam */}
        <rect x="0" y="190" width="400" height="7" fill="#3c2e20" />
        {/* floorboards */}
        {[60, 130, 200, 270, 340].map((x) => (
          <line key={x} x1={x} y1="197" x2={x + (x - 200) * 0.5} y2="300" stroke="#3c2c1c" strokeWidth="2" opacity="0.5" />
        ))}

        {/* grimy window */}
        <g>
          <rect x="250" y="40" width="96" height="96" rx="3" fill="#2b2620" stroke="#3a2f24" strokeWidth="6" />
          <rect x="256" y="46" width="84" height="84" fill="#9fb4c4" opacity="0.5" />
          <line x1="298" y1="46" x2="298" y2="130" stroke="#3a2f24" strokeWidth="5" />
          <line x1="256" y1="88" x2="340" y2="88" stroke="#3a2f24" strokeWidth="5" />
          {/* grime streaks */}
          <path d="M262 50 q4 30 -2 76" stroke="#7d8e9b" strokeWidth="3" opacity="0.4" fill="none" />
          <path d="M330 52 q-3 26 2 72" stroke="#7d8e9b" strokeWidth="2" opacity="0.35" fill="none" />
        </g>

        {/* dusty light shaft from window to floor */}
        <polygon points="262,128 338,128 250,300 120,300" fill="url(#dr-beam)" />

        {/* ghost marks where furniture used to be (cleaner patches) */}
        <rect x="40" y="96" width="80" height="92" fill="#7a6650" opacity="0.5" />
        <rect x="150" y="70" width="54" height="62" fill="#7a6650" opacity="0.4" />
        {/* nail / hook holes */}
        <circle cx="95" cy="80" r="2" fill="#2c2117" />
        <circle cx="178" cy="60" r="2" fill="#2c2117" />

        {/* cobweb top-left corner */}
        <g stroke="#cabfa9" strokeWidth="1" opacity="0.55" fill="none">
          <path d="M0 0 L46 46" />
          <path d="M46 0 L0 36 M0 18 L30 0" />
          <path d="M8 0 Q26 14 0 26" />
          <path d="M22 0 Q34 24 0 40" />
          <path d="M0 8 Q16 24 8 44" />
        </g>

        {/* lonely cardboard box */}
        <g transform="translate(96 214)">
          <polygon points="0,18 44,18 50,6 6,6" fill="#b48a5e" />
          <rect x="0" y="18" width="44" height="34" fill="#a87c4f" />
          <polygon points="44,18 50,6 50,40 44,52" fill="#8a6038" />
          <path d="M0 18 L44 18 M22 18 L22 52" stroke="#7d5733" strokeWidth="1.5" opacity="0.6" />
          <path d="M14 6 L22 18 L30 6" stroke="#7d5733" strokeWidth="1.5" fill="none" opacity="0.6" />
        </g>

        {/* a forgotten ball on the floor */}
        <circle cx="300" cy="244" r="11" fill="#9a5a4a" opacity="0.85" />
        <path d="M291 240 q9 6 18 0" stroke="#6e3b30" strokeWidth="1.5" fill="none" />

        {/* drifting dust motes */}
        {MOTES.map((m, i) => (
          <motion.circle
            key={i} cx={m.x} cy={m.y} r={m.r} fill="#ffe9bd" opacity="0.0"
            animate={{ y: [0, -14, 0], x: [0, 6, 0], opacity: [0, 0.7, 0] }}
            transition={{ duration: m.d, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
          />
        ))}

        <rect x="0" y="0" width="400" height="300" fill="url(#dr-vig)" />
      </svg>

      <div className="dbm-dusty__tag">Your room — right now 🕸️</div>
    </div>
  );
}
