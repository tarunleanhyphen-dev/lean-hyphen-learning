import { motion } from 'framer-motion';

/**
 * Scene 0 vignettes for Act 1's opening context.
 *
 * Each vignette is a single rich SVG illustration with internal motion
 * (drifting hearts, flickering candles, chat bubbles popping in, sparkles
 * pulsing, etc.) — a small "animation video" that plays while the phase
 * narrates. Replaces the previous static-bubble thought clouds.
 *
 * Pick a scene by passing `kind`:
 *   'meet-shanaya' | 'birthday' | 'group-chat' | 'vision' | 'app-open'
 *
 * The wrapper is a single rounded card with a gradient background; the
 * SVG inside fills 100% width. All animations run on framer-motion + CSS
 * with `willChange` hints so the browser keeps them on the compositor.
 */
export default function SceneVignette({ kind }) {
  if (!kind) return null;
  return (
    <motion.div
      key={kind}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-ink-300/20"
      style={{ aspectRatio: '4 / 3' }}
    >
      <Scene kind={kind} />
    </motion.div>
  );
}

function Scene({ kind }) {
  switch (kind) {
    case 'meet-shanaya': return <MeetShanaya />;
    case 'birthday':     return <Birthday />;
    case 'group-chat':   return <GroupChat />;
    case 'vision':       return <Vision />;
    case 'app-open':     return <AppOpen />;
    default:             return null;
  }
}

/* =================================================================
 * 1. MEET SHANAYA — three friends laughing, selfie + hearts
 * ================================================================= */
function MeetShanaya() {
  return (
    <SceneShell from="#FFE0E9" to="#FFD7C0">
      {/* Soft sunlight glow upper-left */}
      <motion.circle
        cx="60" cy="50" r="40" fill="#FFF4B8"
        animate={{ opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Three friends — rounded heads + coral/teal/saffron tops */}
      <FriendHead x={92}  y={138} skin="#EDB98A" hair="#2C1B18" top="#FF5A4A" />
      <FriendHead x={170} y={130} skin="#F4C99C" hair="#4A2C24" top="#14B8A6" />
      <FriendHead x={248} y={138} skin="#E8B187" hair="#1A1426" top="#FFB05A" />

      {/* Selfie phone in the foreground */}
      <g transform="translate(140 175)">
        <rect width="40" height="58" rx="5" fill="#1A1426" />
        <rect x="3" y="6" width="34" height="44" rx="2" fill="#A8D8E8" />
        {/* Flash sparkle */}
        <motion.circle
          cx="32" cy="3" r="3" fill="#FFF7C8"
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </g>

      {/* Floating hearts */}
      {[0, 1, 2, 3].map((i) => (
        <motion.text
          key={i}
          x={70 + i * 60}
          y={220}
          fontSize="20"
          fill="#FF6B6B"
          animate={{
            y: [220, 80 - i * 5, 60],
            opacity: [0, 0.95, 0],
            scale: [0.6, 1.1, 0.8],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'easeOut',
          }}
        >❤</motion.text>
      ))}

      {/* Sparkle confetti */}
      <Sparkle x={45} y={90} delay={0} />
      <Sparkle x={275} y={70} delay={0.8} />
      <Sparkle x={50} y={180} delay={1.6} />
      <Sparkle x={285} y={195} delay={0.4} />
    </SceneShell>
  );
}

/* =================================================================
 * 2. BIRTHDAY — cake, candles, balloons, café, countdown
 * ================================================================= */
function Birthday() {
  return (
    <SceneShell from="#FFD7C0" to="#FFE5B4">
      {/* Café table line at the back */}
      <rect y="170" width="320" height="70" fill="#D4A574" />
      <rect y="165" width="320" height="6" fill="#A07050" />

      {/* Birthday cake */}
      <g transform="translate(118 105)">
        {/* Top layer */}
        <rect x="0" y="30" width="80" height="50" rx="5" fill="#FFB3C7" />
        <rect x="0" y="30" width="80" height="6" fill="#FF8FAB" />
        {/* Frosting dollops */}
        <circle cx="13" cy="30" r="5" fill="#FFD9E6" />
        <circle cx="27" cy="30" r="5" fill="#FFD9E6" />
        <circle cx="41" cy="30" r="5" fill="#FFD9E6" />
        <circle cx="55" cy="30" r="5" fill="#FFD9E6" />
        <circle cx="69" cy="30" r="5" fill="#FFD9E6" />
        {/* Candles */}
        <rect x="22" y="10" width="3" height="20" fill="#A85F3A" />
        <rect x="38.5" y="6" width="3" height="24" fill="#A85F3A" />
        <rect x="55" y="10" width="3" height="20" fill="#A85F3A" />
        {/* Flickering flames */}
        {[[23.5, 4], [40, 0], [56.5, 4]].map(([cx, cy], i) => (
          <motion.ellipse
            key={i}
            cx={cx} cy={cy} rx="2" ry="4" fill="#FFB05A"
            animate={{
              ry: [4, 5, 3.5, 4],
              opacity: [0.85, 1, 0.9, 0.85],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </g>

      {/* Coffee cup (café) */}
      <g transform="translate(40 145)">
        <ellipse cx="20" cy="0" rx="18" ry="5" fill="#5A2D1A" />
        <rect x="2" y="0" width="36" height="22" fill="#FFFFFF" stroke="#A07050" strokeWidth="2" rx="2" />
        <path d="M40 4 Q50 6 50 12 Q50 18 40 18" stroke="#A07050" strokeWidth="2.5" fill="none" />
        {/* Steam */}
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M${10 + i * 8} -5 Q${12 + i * 8} -15 ${10 + i * 8} -25`}
            stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round"
            animate={{ opacity: [0, 0.7, 0], y: [0, -8, -14] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
          />
        ))}
      </g>

      {/* Balloons */}
      <Balloon x={250} y={130} color="#FF6B6B" delay={0} />
      <Balloon x={278} y={150} color="#FFD23F" delay={0.8} />
      <Balloon x={265} y={170} color="#9B5DE5" delay={1.6} />

      {/* Confetti */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={i}
          x={60 + i * 50}
          y={-10}
          width="4" height="8"
          fill={['#FF6B6B', '#FFD23F', '#14B8A6', '#9B5DE5', '#FF8FAB'][i]}
          animate={{
            y: [-10, 220],
            rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'linear',
          }}
        />
      ))}

      {/* "in 2 days" chip */}
      <motion.g
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: '160px 32px' }}
      >
        <rect x="110" y="20" width="100" height="26" rx="13" fill="#1A1426" />
        <text x="160" y="38" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FFD23F">in 2 days</text>
      </motion.g>
    </SceneShell>
  );
}

/* =================================================================
 * 3. GROUP CHAT — phone with messages popping in
 * ================================================================= */
function GroupChat() {
  const messages = [
    { side: 'left',  text: 'Birthday fit checkkk 👀', color: '#F1F5F9', delay: 0.0 },
    { side: 'right', text: 'cute photos!!! 💖',         color: '#FF6B6B', delay: 0.8 },
    { side: 'left',  text: 'matching vibes 😍',         color: '#F1F5F9', delay: 1.6 },
    { side: 'right', text: 'café 🥹',                   color: '#FF6B6B', delay: 2.4 },
  ];
  return (
    <SceneShell from="#E8F1FF" to="#F0E6FF">
      {/* Phone frame */}
      <g transform="translate(80 18)">
        <rect width="160" height="220" rx="22" fill="#1A1426" />
        <rect x="6" y="14" width="148" height="192" rx="12" fill="#FFFFFF" />
        {/* Notch */}
        <rect x="65" y="4" width="30" height="6" rx="3" fill="#000000" />

        {/* Chat header */}
        <rect x="6" y="14" width="148" height="22" fill="#F1F5F9" />
        <circle cx="20" cy="25" r="6" fill="#FF6B6B" />
        <text x="32" y="29" fontSize="9" fontWeight="700" fill="#1A1426">Birthday Squad</text>

        {/* Messages — pop in one by one */}
        {messages.map((m, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: m.delay, duration: 0.45, ease: 'easeOut' }}
          >
            <rect
              x={m.side === 'right' ? 60 : 14}
              y={48 + i * 32}
              width="86"
              height="24"
              rx="12"
              fill={m.color}
            />
            <text
              x={m.side === 'right' ? 70 : 22}
              y={64 + i * 32}
              fontSize="9"
              fontWeight="700"
              fill={m.side === 'right' ? '#FFFFFF' : '#1A1426'}
            >
              {m.text}
            </text>
          </motion.g>
        ))}
      </g>

      {/* Floating notifications */}
      {[0, 1, 2].map((i) => (
        <motion.text
          key={i}
          x={30 + i * 8}
          y={70 + i * 20}
          fontSize="18"
          animate={{
            y: [70 + i * 20, 40 + i * 20],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeOut',
          }}
        >🔔</motion.text>
      ))}
    </SceneShell>
  );
}

/* =================================================================
 * 4. VISION — outfit, photo frame, sparkles
 * ================================================================= */
function Vision() {
  return (
    <SceneShell from="#FFE5B4" to="#FFE0E9">
      {/* Standing mirror frame, center */}
      <g transform="translate(130 35)">
        <rect width="60" height="140" rx="30" fill="#FFFFFF" stroke="#A07050" strokeWidth="3" />
        <rect x="6" y="6" width="48" height="128" rx="24" fill="#FFE6E6" />
        {/* Girl silhouette */}
        <circle cx="30" cy="50" r="14" fill="#EDB98A" />
        <path d="M14 56 Q14 38 30 38 Q46 38 46 56 L46 70 Q30 50 14 70 Z" fill="#2C1B18" />
        <path d="M16 76 Q30 70 44 76 L48 122 L12 122 Z" fill="#FF5A4A" />
      </g>

      {/* Dress on hanger, left */}
      <g transform="translate(36 60)">
        <line x1="22" y1="0" x2="22" y2="10" stroke="#888" strokeWidth="2" />
        <path d="M5 18 Q22 8 39 18 L48 56 Q22 52 -4 56 Z" fill="#FF8FAB" />
        <circle cx="22" cy="14" r="5" fill="none" stroke="#888" strokeWidth="2" />
      </g>

      {/* Camera + photo frames, right */}
      <g transform="translate(228 62)">
        <rect width="56" height="40" rx="4" fill="#1A1426" />
        <circle cx="28" cy="20" r="13" fill="#A07050" />
        <circle cx="28" cy="20" r="8"  fill="#1A1426" />
        <circle cx="28" cy="20" r="4"  fill="#A8D8E8" />
        <rect x="36" y="4" width="6" height="4" rx="1" fill="#FF6B6B" />
        {/* Flash spark */}
        <motion.circle
          cx="38" cy="2" r="3" fill="#FFFFFF"
          animate={{ opacity: [0, 1, 0], scale: [1, 2, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.5 }}
        />
      </g>

      {/* Floating sparkles */}
      {[
        { x: 40,  y: 30 }, { x: 280, y: 35 },
        { x: 60,  y: 200 }, { x: 270, y: 195 },
        { x: 175, y: 20 }, { x: 100, y: 110 }, { x: 220, y: 130 },
      ].map((s, i) => (
        <Sparkle key={i} x={s.x} y={s.y} delay={i * 0.4} />
      ))}
    </SceneShell>
  );
}

/* =================================================================
 * 5. APP OPEN — phone with shopping app + search "shoes"
 * ================================================================= */
function AppOpen() {
  return (
    <SceneShell from="#E0E5FF" to="#FFE0E9">
      {/* Phone */}
      <g transform="translate(80 18)">
        <rect width="160" height="220" rx="22" fill="#1A1426" />
        <rect x="6" y="14" width="148" height="192" rx="12" fill="#FFFFFF" />
        <rect x="65" y="4" width="30" height="6" rx="3" fill="#000000" />

        {/* App header — spree. logo */}
        <text x="80" y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill="#FF6B6B">
          spree
          <tspan fill="#1A1426">.</tspan>
        </text>

        {/* Search bar with typing text */}
        <rect x="14" y="46" width="132" height="22" rx="11" fill="#F1F5F9" />
        <text x="22" y="61" fontSize="10" fill="#1A1426" fontWeight="700">
          🔍
          <motion.tspan
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            dx="4"
          >
            shoes
          </motion.tspan>
          <motion.tspan
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            dx="1"
          >|</motion.tspan>
        </text>

        {/* Product grid */}
        {[0, 1, 2, 3].map((i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.15, duration: 0.4 }}
          >
            <rect
              x={14 + (i % 2) * 70}
              y={76 + Math.floor(i / 2) * 64}
              width="60" height="56" rx="6"
              fill="#FFE0E9"
            />
            <text
              x={44 + (i % 2) * 70}
              y={108 + Math.floor(i / 2) * 64}
              textAnchor="middle"
              fontSize="22"
            >👟</text>
          </motion.g>
        ))}

        {/* Cart icon top-right with badge */}
        <g transform="translate(132 22)">
          <text fontSize="12">🛍</text>
          <motion.circle
            cx="11" cy="-2" r="5" fill="#FF6B6B"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <text x="11" y="1.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#FFFFFF">0</text>
        </g>
      </g>

      {/* Floating "₹1,500 plan" chip */}
      <motion.g
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <rect x="14" y="180" width="60" height="24" rx="12" fill="#14B8A6" />
        <text x="44" y="197" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">
          ₹1,500 plan
        </text>
      </motion.g>

      <Sparkle x={50}  y={40} delay={0.3} />
      <Sparkle x={270} y={30} delay={0.9} />
    </SceneShell>
  );
}

/* =========================================================================
 * Shared building blocks
 * ========================================================================= */
function SceneShell({ from, to, children }) {
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <linearGradient id={`grad-${from}-${to}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill={`url(#grad-${from}-${to})`} />
      {children}
    </svg>
  );
}

function FriendHead({ x, y, skin, hair, top }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-24 26 Q-24 4 0 4 Q24 4 24 26 L24 46 Q0 32 -24 46 Z" fill={hair} />
      <circle cx="0" cy="0" r="22" fill={skin} />
      <ellipse cx="-7" cy="-2" rx="2" ry="3" fill="#1A1426" />
      <ellipse cx="7"  cy="-2" rx="2" ry="3" fill="#1A1426" />
      <path d="M-6 8 Q0 14 6 8" stroke="#7A2A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M-28 34 Q0 28 28 34 L28 62 L-28 62 Z" fill={top} />
    </g>
  );
}

function Balloon({ x, y, color, delay }) {
  return (
    <motion.g
      animate={{ y: [y, y - 8, y] }}
      transition={{ duration: 3, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <ellipse cx={x} cy={y} rx="11" ry="14" fill={color} />
      <line x1={x} y1={y + 13} x2={x - 2} y2={y + 32} stroke="#A07050" strokeWidth="1" />
      <polygon points={`${x},${y + 13} ${x - 3},${y + 16} ${x + 3},${y + 16}`} fill={color} />
    </motion.g>
  );
}

function Sparkle({ x, y, delay = 0 }) {
  return (
    <motion.g
      animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <path
        d={`M${x} ${y - 6} L${x + 1.5} ${y - 1.5} L${x + 6} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 6} L${x - 1.5} ${y + 1.5} L${x - 6} ${y} L${x - 1.5} ${y - 1.5} Z`}
        fill="#FFD23F"
      />
    </motion.g>
  );
}
