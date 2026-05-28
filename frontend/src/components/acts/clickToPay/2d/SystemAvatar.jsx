import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * System — the digital-world AI voice. A floating glowing orb with a
 * circuit pattern, an animated energy ring, and an inner core that
 * pulses with speech amplitude. No human features — intentionally
 * abstract since "System" is the world itself talking.
 */
export default function SystemAvatar({ speaking = false, amplitudeRef, className = '' }) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!speaking) { setPulse(0); return undefined; }
    let raf = 0;
    let smoothed = 0;
    const tick = () => {
      const raw = amplitudeRef?.current ?? 0;
      smoothed = smoothed * 0.7 + raw * 0.3;
      setPulse(Math.min(1, smoothed * 2.5));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, amplitudeRef]);

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 240 360" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sys-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFFFFF" />
            <stop offset="35%"  stopColor="#7DD3FC" />
            <stop offset="75%"  stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sys-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFFFFF" />
            <stop offset="60%"  stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
          <linearGradient id="sys-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#22D3EE" />
            <stop offset="50%"  stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>

        {/* Outer glow */}
        <circle cx="120" cy="180" r="115" fill="url(#sys-glow)" opacity={0.45 + pulse * 0.3} />

        {/* Orbital rings — rotate */}
        <motion.g
          style={{ transformOrigin: '120px 180px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        >
          <ellipse cx="120" cy="180" rx="92" ry="20" fill="none" stroke="url(#sys-ring)" strokeWidth="2" opacity="0.7" />
          <circle cx="212" cy="180" r="4" fill="#F472B6" />
          <circle cx="28"  cy="180" r="3" fill="#22D3EE" />
        </motion.g>
        <motion.g
          style={{ transformOrigin: '120px 180px' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        >
          <ellipse cx="120" cy="180" rx="20" ry="92" fill="none" stroke="url(#sys-ring)" strokeWidth="2" opacity="0.6" />
          <circle cx="120" cy="272" r="4" fill="#A78BFA" />
          <circle cx="120" cy="88"  r="3" fill="#22D3EE" />
        </motion.g>

        {/* Main orb */}
        <circle cx="120" cy="180" r="78" fill="#0B1739" stroke="#22D3EE" strokeWidth="2" />
        {/* Hex/circuit pattern */}
        <g stroke="#22D3EE" strokeWidth="0.8" fill="none" opacity="0.55">
          <polygon points="120,120 160,140 160,180 120,200 80,180 80,140" />
          <polygon points="120,135 150,150 150,180 120,195 90,180 90,150" />
          <line x1="120" y1="120" x2="120" y2="135" />
          <line x1="120" y1="195" x2="120" y2="200" />
          <line x1="80" y1="140" x2="90" y2="150" />
          <line x1="160" y1="140" x2="150" y2="150" />
          <line x1="80" y1="180" x2="90" y2="180" />
          <line x1="160" y1="180" x2="150" y2="180" />
        </g>

        {/* Inner pulsing core */}
        <motion.circle
          cx="120" cy="180"
          animate={{ r: 18 + pulse * 22, opacity: 0.85 + pulse * 0.15 }}
          transition={{ duration: 0.1 }}
          fill="url(#sys-core)"
        />
        <motion.circle
          cx="120" cy="180"
          animate={{ r: 10 + pulse * 12 }}
          transition={{ duration: 0.1 }}
          fill="#FFFFFF"
          opacity="0.9"
        />

        {/* Speaking energy bars below the orb */}
        {speaking && (
          <g>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.rect
                key={i}
                x={92 + i * 12}
                width="6"
                rx="2"
                fill="#22D3EE"
                animate={{ y: 285 - (pulse * (20 + i * 4)), height: 6 + pulse * (20 + i * 4) }}
                transition={{ duration: 0.12 }}
              />
            ))}
          </g>
        )}

        {/* Sparkle stars */}
        {[
          { x: 50,  y: 70  },
          { x: 200, y: 110 },
          { x: 32,  y: 260 },
          { x: 210, y: 250 },
        ].map((s, i) => (
          <motion.g
            key={i}
            animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5 }}
            style={{ transformOrigin: `${s.x}px ${s.y}px` }}
          >
            <path d={`M ${s.x} ${s.y - 6} L ${s.x + 2} ${s.y - 2} L ${s.x + 6} ${s.y} L ${s.x + 2} ${s.y + 2} L ${s.x} ${s.y + 6} L ${s.x - 2} ${s.y + 2} L ${s.x - 6} ${s.y} L ${s.x - 2} ${s.y - 2} Z`} fill="#FDE047" />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
}
