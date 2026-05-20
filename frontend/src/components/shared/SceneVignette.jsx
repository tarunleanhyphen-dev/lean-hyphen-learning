import { motion } from 'framer-motion';

/**
 * Scene 0 vignettes — short "animation video" panels that play next to
 * Shanaya during the opening context phases.
 *
 * Visual upgrades vs the first pass (per QA: needed more 3D / video feel):
 *   - Every shape that should read as round (balloons, candle bodies,
 *     cake layers, the coffee cup, the phone, the mirror, the lens) uses
 *     a radial OR linear gradient with a highlight + shadow side, so it
 *     volumetrically lifts off the page instead of looking flat.
 *   - A reusable `lh-soft` Gaussian-blur filter drops shadows under every
 *     foreground element so the layers stack with depth.
 *   - A reusable `lh-corner` overlay darkens the edges of every scene
 *     (filmic vignette) and pulls the eye into the centre.
 *   - The whole scene sits inside a slow camera-zoom motion wrapper
 *     (scale 1 → 1.045 over 9 s) — gives the panel a "playing video"
 *     quality even when nothing else is moving.
 *   - Background layer: bokeh-style light dots drift slowly. Provides
 *     parallax behind the foreground action.
 *
 * `kind` picks the scene:
 *   'meet-shanaya' | 'birthday' | 'group-chat' | 'vision' | 'app-open'
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
      className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-ink-300/20"
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

/* =========================================================================
 * Shared shell — defs (filters/gradients), camera zoom wrapper, vignette
 * ========================================================================= */

function SceneShell({ from, to, children }) {
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        {/* Background gradient unique per scene */}
        <linearGradient id={`bg-${from}-${to}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>

        {/* Soft drop shadow — reused on most foreground elements */}
        <filter id="lh-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
          <feOffset dx="0" dy="2" result="blurOut" />
          <feComponentTransfer><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stronger drop shadow for hero elements (cake, phone, mirror) */}
        <filter id="lh-hero" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="3" result="blurOut" />
          <feComponentTransfer><feFuncA type="linear" slope="0.55" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Filmic corner darkening overlay */}
        <radialGradient id="lh-vignette" cx="50%" cy="50%" r="72%">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </radialGradient>

        {/* Subtle warm "stage light" overlay top-left → soft, off bottom-right */}
        <radialGradient id="lh-stage" cx="22%" cy="18%" r="80%">
          <stop offset="0%"  stopColor="#FFF7C8" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#FFF7C8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFF7C8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="320" height="240" fill={`url(#bg-${from}-${to})`} />

      {/* Bokeh layer — drifts independently behind the foreground for
         parallax depth. Each circle has its own slow loop so the layer
         never looks tied. */}
      <BokehLayer />

      {/* Slow camera zoom + drift, gives the panel a "playing video" quality
         even when foreground elements are still. */}
      <motion.g
        animate={{ scale: [1, 1.045, 1], x: [0, 4, 0], y: [0, -2, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 120px' }}
      >
        {children}
      </motion.g>

      {/* Top-left warm key light + corner vignette darkening */}
      <rect width="320" height="240" fill="url(#lh-stage)"    pointerEvents="none" />
      <rect width="320" height="240" fill="url(#lh-vignette)" pointerEvents="none" />
    </svg>
  );
}

function BokehLayer() {
  const dots = [
    { cx: 30,  cy: 50,  r: 8,  color: '#FFFFFF', op: 0.35, dur: 7, dx: 12 },
    { cx: 280, cy: 80,  r: 10, color: '#FFFFFF', op: 0.30, dur: 9, dx: -14 },
    { cx: 100, cy: 200, r: 6,  color: '#FFFFFF', op: 0.40, dur: 6, dx:  10 },
    { cx: 250, cy: 180, r: 7,  color: '#FFFFFF', op: 0.30, dur: 8, dx: -10 },
    { cx: 170, cy: 30,  r: 5,  color: '#FFFFFF', op: 0.35, dur: 7.5, dx:  8 },
  ];
  return (
    <g style={{ filter: 'blur(2px)' }}>
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.cx} cy={d.cy} r={d.r}
          fill={d.color}
          opacity={d.op}
          animate={{
            x: [0, d.dx, 0],
            y: [0, d.dx / 2, 0],
            opacity: [d.op, d.op * 1.4, d.op],
          }}
          transition={{ duration: d.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        />
      ))}
    </g>
  );
}

/* =========================================================================
 * 1. MEET SHANAYA — three friends with depth, hearts, selfie flash
 * ========================================================================= */
function MeetShanaya() {
  return (
    <SceneShell from="#FFE0E9" to="#FFD0C0">
      <defs>
        {/* Volumetric skin highlights (light hits the cheek, shadow on the
           opposite side) — repeat per head with translate. */}
        <radialGradient id="skin-light" cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FFE3C9" />
          <stop offset="55%"  stopColor="#EDB98A" />
          <stop offset="100%" stopColor="#C99270" />
        </radialGradient>
        {/* Top-side highlight for the coral / teal / saffron tops */}
        <linearGradient id="top-coral" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FF7363" />
          <stop offset="100%" stopColor="#D8392C" />
        </linearGradient>
        <linearGradient id="top-teal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1FCFB6" />
          <stop offset="100%" stopColor="#0E8C7A" />
        </linearGradient>
        <linearGradient id="top-saff" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFC56B" />
          <stop offset="100%" stopColor="#D4863C" />
        </linearGradient>
        {/* Heart with highlight */}
        <radialGradient id="heart-3d" cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#FFB3B3" />
          <stop offset="50%"  stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#C13C3C" />
        </radialGradient>
      </defs>

      {/* Three friends with proper volumetric skin */}
      <FriendHeadV x={92}  y={138} top="url(#top-coral)" hair="#2C1B18" />
      <FriendHeadV x={170} y={130} top="url(#top-teal)"  hair="#4A2C24" />
      <FriendHeadV x={248} y={138} top="url(#top-saff)"  hair="#1A1426" />

      {/* Selfie phone — front-stage with strong shadow */}
      <g transform="translate(140 175)" filter="url(#lh-hero)">
        <rect width="40" height="58" rx="6" fill="#1A1426" />
        <rect width="40" height="58" rx="6" fill="url(#phone-screen-glow)" opacity="0.18" />
        <rect x="3" y="6" width="34" height="44" rx="2" fill="#B8E1F0" />
        {/* Screen shine */}
        <path d="M3 6 L37 6 L33 12 L7 12 Z" fill="#FFFFFF" opacity="0.35" />
        {/* Flash */}
        <motion.circle
          cx="32" cy="3" r="3" fill="#FFF7C8"
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.6, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          filter="url(#lh-soft)"
        />
      </g>

      {/* Floating volumetric hearts */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.g
          key={i}
          animate={{
            y: [220, 60 - i * 4, 30],
            x: [0, (i - 2) * 6, (i - 2) * 10],
            opacity: [0, 0.95, 0],
            scale: [0.5, 1, 0.7],
          }}
          transition={{ duration: 5.5, repeat: Infinity, delay: i * 1.0, ease: 'easeOut' }}
        >
          <path
            d={`M${55 + i * 50} 0 C${49 + i * 50} -5 ${39 + i * 50} -14 ${39 + i * 50} -23
                 C${39 + i * 50} -29 ${44 + i * 50} -33 ${50 + i * 50} -33
                 C${53 + i * 50} -33 ${55 + i * 50} -31 ${55 + i * 50} -31
                 C${55 + i * 50} -31 ${57 + i * 50} -33 ${60 + i * 50} -33
                 C${66 + i * 50} -33 ${71 + i * 50} -29 ${71 + i * 50} -23
                 C${71 + i * 50} -14 ${61 + i * 50} -5 ${55 + i * 50} 0 Z`}
            fill="url(#heart-3d)"
            filter="url(#lh-soft)"
          />
        </motion.g>
      ))}

      <Sparkle x={45}  y={90}  delay={0} />
      <Sparkle x={275} y={70}  delay={0.8} />
      <Sparkle x={50}  y={180} delay={1.6} />
      <Sparkle x={285} y={195} delay={0.4} />
    </SceneShell>
  );
}

/* =========================================================================
 * 2. BIRTHDAY — cake with shaded layers, balloon volumes, steaming coffee
 * ========================================================================= */
function Birthday() {
  return (
    <SceneShell from="#FFD7C0" to="#FFE5B4">
      <defs>
        <linearGradient id="cake-frost" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFD9E6" />
          <stop offset="100%" stopColor="#FF8FAB" />
        </linearGradient>
        <linearGradient id="cake-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFB3C7" />
          <stop offset="100%" stopColor="#D87898" />
        </linearGradient>
        <radialGradient id="balloon-red" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#FFA3A3" />
          <stop offset="55%"  stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#B83C3C" />
        </radialGradient>
        <radialGradient id="balloon-yel" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#FFE89E" />
          <stop offset="55%"  stopColor="#FFD23F" />
          <stop offset="100%" stopColor="#BF8D17" />
        </radialGradient>
        <radialGradient id="balloon-pur" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#C9A9F3" />
          <stop offset="55%"  stopColor="#9B5DE5" />
          <stop offset="100%" stopColor="#5E2B9C" />
        </radialGradient>
        <linearGradient id="floor-warm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D4A574" />
          <stop offset="100%" stopColor="#A07050" />
        </linearGradient>
      </defs>

      {/* Floor */}
      <rect y="170" width="320" height="70" fill="url(#floor-warm)" />
      <rect y="165" width="320" height="6" fill="#7A4F30" opacity="0.5" />

      {/* Birthday cake */}
      <g transform="translate(118 105)" filter="url(#lh-hero)">
        {/* Cake body */}
        <rect x="0" y="30" width="80" height="50" rx="5" fill="url(#cake-body)" />
        {/* Frosting band */}
        <rect x="0" y="30" width="80" height="9" fill="url(#cake-frost)" />
        {/* Frosting dollops */}
        {[6.5, 19.5, 32.5, 45.5, 58.5, 71.5].map((cx, i) => (
          <circle key={i} cx={cx} cy={30} r="6" fill="url(#cake-frost)" />
        ))}
        {/* Subtle shine on the cake body */}
        <rect x="3" y="40" width="74" height="3" fill="#FFFFFF" opacity="0.25" rx="1" />
        {/* Candles — cylindrical look via side strokes */}
        {[[22, 10, 20], [38, 6, 24], [55, 10, 20]].map(([x, y, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width="3" height={h} fill="#B97648" />
            <line x1={x} y1={y} x2={x} y2={y + h} stroke="#7A4F30" strokeWidth="0.4" />
            <line x1={x + 3} y1={y} x2={x + 3} y2={y + h} stroke="#FFFFFF" strokeWidth="0.4" opacity="0.6" />
          </g>
        ))}
        {/* Flickering flames + glow */}
        {[[23.5, 4], [39.5, 0], [56.5, 4]].map(([cx, cy], i) => (
          <g key={i}>
            <motion.circle
              cx={cx} cy={cy} r="5" fill="#FFC56B" opacity="0.5"
              animate={{ opacity: [0.45, 0.7, 0.45] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2 }}
              style={{ filter: 'blur(2px)' }}
            />
            <motion.ellipse
              cx={cx} cy={cy} rx="2" ry="4" fill="#FFB05A"
              animate={{ ry: [4, 5, 3.5, 4], opacity: [0.85, 1, 0.9, 0.85] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            />
            <motion.ellipse
              cx={cx} cy={cy} rx="1" ry="2.5" fill="#FFF7C8"
              animate={{ ry: [2.5, 3.2, 2.3, 2.5] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          </g>
        ))}
      </g>

      {/* Coffee cup with steam + volumetric body */}
      <g transform="translate(40 145)" filter="url(#lh-soft)">
        <ellipse cx="20" cy="0" rx="18" ry="5" fill="#3D1E10" />
        <ellipse cx="20" cy="0" rx="15" ry="3.5" fill="#7A4520" />
        <defs>
          <linearGradient id="cup-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#D9CFC6" />
          </linearGradient>
        </defs>
        <rect x="2" y="0" width="36" height="22" fill="url(#cup-body)" stroke="#A07050" strokeWidth="2" rx="2" />
        <path d="M40 4 Q50 6 50 12 Q50 18 40 18" stroke="#A07050" strokeWidth="2.5" fill="none" />
        {/* Steam */}
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M${10 + i * 8} -5 Q${12 + i * 8} -15 ${10 + i * 8} -25`}
            stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round"
            animate={{ opacity: [0, 0.7, 0], y: [0, -12, -22] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
          />
        ))}
      </g>

      {/* Balloons with proper volumes */}
      <Balloon3D x={250} y={130} gradient="balloon-red" delay={0}   />
      <Balloon3D x={278} y={150} gradient="balloon-yel" delay={0.8} />
      <Balloon3D x={265} y={170} gradient="balloon-pur" delay={1.6} />

      {/* Confetti */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.rect
          key={i}
          x={60 + i * 42}
          y={-10}
          width="5" height="10" rx="1"
          fill={['#FF6B6B', '#FFD23F', '#14B8A6', '#9B5DE5', '#FF8FAB', '#06AED5'][i]}
          animate={{ y: [-10, 230], rotate: [0, 540 * (i % 2 === 0 ? 1 : -1)], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.4, ease: 'linear' }}
        />
      ))}

      {/* "in 2 days" chip */}
      <motion.g
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: '160px 32px' }}
        filter="url(#lh-soft)"
      >
        <rect x="110" y="20" width="100" height="26" rx="13" fill="#1A1426" />
        <text x="160" y="38" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FFD23F">in 2 days</text>
      </motion.g>
    </SceneShell>
  );
}

/* =========================================================================
 * 3. GROUP CHAT — phone with depth, glow, popping chat bubbles
 * ========================================================================= */
function GroupChat() {
  const messages = [
    { side: 'left',  text: 'Birthday fit checkkk 👀', color: '#F1F5F9', delay: 0.0 },
    { side: 'right', text: 'cute photos!!! 💖',         color: '#FF6B6B', delay: 0.9 },
    { side: 'left',  text: 'matching vibes 😍',         color: '#F1F5F9', delay: 1.8 },
    { side: 'right', text: 'café 🥹',                   color: '#FF6B6B', delay: 2.7 },
  ];
  return (
    <SceneShell from="#E8F1FF" to="#F0E6FF">
      <defs>
        <linearGradient id="phone-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#3A2E4D" />
          <stop offset="100%" stopColor="#0F0820" />
        </linearGradient>
        <radialGradient id="phone-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft halo behind the phone — it's emitting light */}
      <circle cx="160" cy="120" r="100" fill="url(#phone-glow)" />

      <g transform="translate(80 18)" filter="url(#lh-hero)">
        <rect width="160" height="220" rx="22" fill="url(#phone-frame)" />
        {/* Inner frame highlight */}
        <rect x="2" y="2" width="156" height="216" rx="20" fill="none" stroke="#FFFFFF" strokeOpacity="0.06" strokeWidth="1" />
        <rect x="6" y="14" width="148" height="192" rx="12" fill="#FFFFFF" />
        {/* Subtle screen shine */}
        <path d="M6 14 L154 14 L140 28 L20 28 Z" fill="#F8FAFC" />
        {/* Notch */}
        <rect x="65" y="4" width="30" height="6" rx="3" fill="#000000" />

        {/* Chat header */}
        <rect x="6" y="14" width="148" height="22" fill="#F1F5F9" />
        <circle cx="20" cy="25" r="6" fill="#FF6B6B" />
        <text x="32" y="29" fontSize="9" fontWeight="700" fill="#1A1426">Birthday Squad</text>
        <text x="142" y="29" fontSize="8" fill="#9CA3AF" textAnchor="end">now</text>

        {/* Messages */}
        {messages.map((m, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 12, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: m.delay, duration: 0.45, ease: 'easeOut' }}
            filter="url(#lh-soft)"
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

        {/* Typing dots inside an empty bubble at the bottom */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 3.4, repeatDelay: 0.5 }}
        >
          <rect x="14" y="176" width="34" height="20" rx="10" fill="#F1F5F9" />
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx={22 + i * 6}
              cy={186}
              r="1.8"
              fill="#9CA3AF"
              animate={{ opacity: [0.4, 1, 0.4], y: [0, -2, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.g>
      </g>

      {/* Floating notifications — bouncing */}
      {[0, 1, 2].map((i) => (
        <motion.text
          key={i}
          x={28 + i * 8}
          y={70 + i * 20}
          fontSize="20"
          animate={{ y: [70 + i * 20, 35 + i * 20], opacity: [0, 1, 0], scale: [0.6, 1.2, 0.8] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
          filter="url(#lh-soft)"
        >🔔</motion.text>
      ))}
    </SceneShell>
  );
}

/* =========================================================================
 * 4. VISION — mirror with reflection, dress, camera, photo frames
 * ========================================================================= */
function Vision() {
  return (
    <SceneShell from="#FFE5B4" to="#FFE0E9">
      <defs>
        <linearGradient id="mirror-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFE3A8" />
          <stop offset="50%"  stopColor="#D4A574" />
          <stop offset="100%" stopColor="#8E5A36" />
        </linearGradient>
        <linearGradient id="mirror-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%"  stopColor="#FFE6E6" />
          <stop offset="100%" stopColor="#FFB3C7" />
        </linearGradient>
        <linearGradient id="dress-fold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFCFE0" />
          <stop offset="60%"  stopColor="#FF8FAB" />
          <stop offset="100%" stopColor="#C45A82" />
        </linearGradient>
        <radialGradient id="camera-lens" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#3FB8FF" />
          <stop offset="60%"  stopColor="#0E5F9E" />
          <stop offset="100%" stopColor="#06283D" />
        </radialGradient>
      </defs>

      {/* Mirror — centre */}
      <g transform="translate(130 32)" filter="url(#lh-hero)">
        <rect width="60" height="148" rx="30" fill="url(#mirror-frame)" />
        <rect x="6" y="6" width="48" height="136" rx="24" fill="url(#mirror-glass)" />
        {/* Mirror shine */}
        <path d="M10 16 L24 12 L24 60 L10 50 Z" fill="#FFFFFF" opacity="0.4" />
        {/* Girl silhouette */}
        <circle cx="30" cy="54" r="14" fill="#EDB98A" />
        <path d="M14 60 Q14 42 30 42 Q46 42 46 60 L46 76 Q30 56 14 76 Z" fill="#2C1B18" />
        {/* eyes + smile */}
        <ellipse cx="25" cy="52" rx="1.5" ry="2" fill="#1A1426" />
        <ellipse cx="35" cy="52" rx="1.5" ry="2" fill="#1A1426" />
        <path d="M26 58 Q30 61 34 58" stroke="#7A2A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Body */}
        <path d="M14 82 Q30 76 46 82 L48 128 L12 128 Z" fill="#FF5A4A" />
        {/* Body highlight */}
        <path d="M18 84 Q26 80 30 80 L30 124 L18 124 Z" fill="#FFFFFF" opacity="0.18" />
      </g>

      {/* Dress on hanger, left — proper silk folds */}
      <g transform="translate(34 58)" filter="url(#lh-soft)">
        <line x1="22" y1="0" x2="22" y2="10" stroke="#666" strokeWidth="2" />
        <circle cx="22" cy="14" r="5" fill="none" stroke="#888" strokeWidth="2" />
        <path d="M5 18 Q22 8 39 18 L48 58 Q22 54 -4 58 Z" fill="url(#dress-fold)" />
        {/* Folds */}
        <path d="M12 24 L18 56" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.4" />
        <path d="M22 22 L22 58" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.5" />
        <path d="M32 24 L26 56" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.4" />
        {/* Shoulder strap */}
        <path d="M16 20 Q22 16 28 20" stroke="#C45A82" strokeWidth="1" fill="none" />
      </g>

      {/* Camera + photo frames, right */}
      <g transform="translate(226 60)" filter="url(#lh-hero)">
        <rect width="58" height="42" rx="5" fill="#1A1426" />
        <rect x="2" y="4" width="54" height="34" rx="3" fill="#2A1F3D" />
        {/* Lens (3D-shaded) */}
        <circle cx="29" cy="22" r="14" fill="url(#camera-lens)" />
        <circle cx="29" cy="22" r="9"  fill="#06283D" />
        <circle cx="29" cy="22" r="5"  fill="#3FB8FF" />
        <circle cx="26" cy="18" r="2"  fill="#FFFFFF" opacity="0.7" />
        {/* Flash bulb */}
        <rect x="38" y="4" width="6" height="4" rx="1" fill="#FF6B6B" />
        <motion.circle
          cx="41" cy="2" r="3" fill="#FFFFFF"
          animate={{ opacity: [0, 1, 0], scale: [1, 2.5, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.5 }}
          filter="url(#lh-soft)"
        />
      </g>

      {/* Photo frames hovering top — three small Polaroids */}
      {[
        { x:  18, y: 12, r: -12, delay: 0.0 },
        { x: 138, y:  6, r:   3, delay: 0.6 },
        { x: 264, y: 18, r:  10, delay: 1.2 },
      ].map((f, i) => (
        <motion.g
          key={i}
          animate={{ y: [f.y, f.y - 5, f.y] }}
          transition={{ duration: 3.4, repeat: Infinity, delay: f.delay, ease: 'easeInOut' }}
          style={{ transformOrigin: `${f.x + 18}px ${f.y + 14}px` }}
        >
          <g transform={`rotate(${f.r} ${f.x + 18} ${f.y + 14})`} filter="url(#lh-soft)">
            <rect x={f.x} y={f.y} width="36" height="30" fill="#FFFFFF" />
            <rect x={f.x + 3} y={f.y + 3} width="30" height="20" fill={['#FFB3C7', '#A8D8E8', '#FFD23F'][i]} />
            <circle cx={f.x + 18} cy={f.y + 13} r="3" fill="#FFFFFF" opacity="0.7" />
          </g>
        </motion.g>
      ))}

      {/* Sparkles */}
      {[
        { x: 60, y: 195 }, { x: 270, y: 200 },
        { x: 165, y: 215 }, { x: 100, y: 130 }, { x: 222, y: 142 },
      ].map((s, i) => (
        <Sparkle key={i} x={s.x} y={s.y} delay={i * 0.4} />
      ))}
    </SceneShell>
  );
}

/* =========================================================================
 * 5. APP OPEN — phone with glowing screen, typing search, product grid
 * ========================================================================= */
function AppOpen() {
  return (
    <SceneShell from="#E0E5FF" to="#FFE0E9">
      <defs>
        <linearGradient id="phone-frame-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#3A2E4D" />
          <stop offset="100%" stopColor="#0F0820" />
        </linearGradient>
        <radialGradient id="phone-screen-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#F8FAFC" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* Phone — slight downward float */}
      <motion.g
        animate={{ y: [0, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        filter="url(#lh-hero)"
      >
        <g transform="translate(80 18)">
          <rect width="160" height="220" rx="22" fill="url(#phone-frame-2)" />
          <rect x="2" y="2" width="156" height="216" rx="20" fill="none" stroke="#FFFFFF" strokeOpacity="0.07" strokeWidth="1" />
          <rect x="6" y="14" width="148" height="192" rx="12" fill="url(#phone-screen-glow)" />
          <rect x="65" y="4" width="30" height="6" rx="3" fill="#000000" />

          {/* App header — spree. logo with subtle shadow */}
          <g filter="url(#lh-soft)">
            <text x="80" y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill="#FF6B6B">
              spree<tspan fill="#1A1426">.</tspan>
            </text>
          </g>

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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.15, duration: 0.4 }}
              filter="url(#lh-soft)"
            >
              <rect
                x={14 + (i % 2) * 70}
                y={76 + Math.floor(i / 2) * 64}
                width="60" height="56" rx="6"
                fill="#FFE0E9"
              />
              <text
                x={44 + (i % 2) * 70}
                y={112 + Math.floor(i / 2) * 64}
                textAnchor="middle"
                fontSize="28"
              >👟</text>
            </motion.g>
          ))}

          {/* Cart icon with pulse */}
          <g transform="translate(132 22)">
            <text fontSize="14">🛍</text>
            <motion.circle
              cx="11" cy="-3" r="5" fill="#FF6B6B"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              filter="url(#lh-soft)"
            />
            <text x="11" y="0.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#FFFFFF">0</text>
          </g>
        </g>
      </motion.g>

      {/* Floating "₹1,500 plan" chip with shadow */}
      <motion.g
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        filter="url(#lh-soft)"
      >
        <rect x="14" y="180" width="68" height="26" rx="13" fill="#14B8A6" />
        <text x="48" y="198" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">
          ₹1,500 plan
        </text>
      </motion.g>

      <Sparkle x={50}  y={40}  delay={0.3} />
      <Sparkle x={270} y={30}  delay={0.9} />
      <Sparkle x={42}  y={210} delay={1.5} />
      <Sparkle x={278} y={205} delay={0.6} />
    </SceneShell>
  );
}

/* =========================================================================
 * Reusable building blocks
 * ========================================================================= */

function FriendHeadV({ x, y, top, hair }) {
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#lh-soft)">
      {/* Hair back layer */}
      <path d="M-26 28 Q-26 2 0 2 Q26 2 26 28 L26 48 Q0 32 -26 48 Z" fill={hair} />
      {/* Face with volumetric gradient */}
      <circle cx="0" cy="0" r="22" fill="url(#skin-light)" />
      {/* Cheek blush */}
      <ellipse cx="-10" cy="6" rx="4" ry="2.5" fill="#FF8FAB" opacity="0.45" />
      <ellipse cx="10"  cy="6" rx="4" ry="2.5" fill="#FF8FAB" opacity="0.45" />
      {/* Eyes */}
      <ellipse cx="-7" cy="-2" rx="2" ry="3" fill="#1A1426" />
      <ellipse cx="7"  cy="-2" rx="2" ry="3" fill="#1A1426" />
      <ellipse cx="-6.5" cy="-3.5" rx="0.8" ry="1" fill="#FFFFFF" />
      <ellipse cx="7.5"  cy="-3.5" rx="0.8" ry="1" fill="#FFFFFF" />
      {/* Smile */}
      <path d="M-6 9 Q0 14 6 9" stroke="#7A2A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Top */}
      <path d="M-30 34 Q0 28 30 34 L30 64 L-30 64 Z" fill={top} />
      {/* Top highlight */}
      <path d="M-20 36 Q0 32 0 32 L0 60 L-20 60 Z" fill="#FFFFFF" opacity="0.12" />
    </g>
  );
}

function Balloon3D({ x, y, gradient, delay }) {
  return (
    <motion.g
      animate={{ y: [y, y - 10, y], rotate: [0, 2, -2, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{ transformOrigin: `${x}px ${y}px` }}
      filter="url(#lh-soft)"
    >
      <ellipse cx={x} cy={y} rx="12" ry="15" fill={`url(#${gradient})`} />
      {/* Specular highlight */}
      <ellipse cx={x - 4} cy={y - 5} rx="3" ry="4" fill="#FFFFFF" opacity="0.45" />
      <polygon points={`${x},${y + 14} ${x - 3},${y + 17} ${x + 3},${y + 17}`} fill={`url(#${gradient})`} />
      <path d={`M${x} ${y + 16} Q${x - 3} ${y + 24} ${x - 2} ${y + 34}`} stroke="#7A4F30" strokeWidth="1" fill="none" />
    </motion.g>
  );
}

function Sparkle({ x, y, delay = 0 }) {
  return (
    <motion.g
      animate={{ scale: [0.4, 1.3, 0.4], opacity: [0.3, 1, 0.3], rotate: [0, 45, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <path
        d={`M${x} ${y - 7} L${x + 1.5} ${y - 1.5} L${x + 7} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 7} L${x - 1.5} ${y + 1.5} L${x - 7} ${y} L${x - 1.5} ${y - 1.5} Z`}
        fill="#FFD23F"
      />
      <circle cx={x} cy={y} r="1.5" fill="#FFFFFF" />
    </motion.g>
  );
}
