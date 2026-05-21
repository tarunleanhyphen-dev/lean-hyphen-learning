import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
import { products as lessonProducts } from '../../data/lessons/thinkBeforeYouSpend.js';

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
/* Shanaya base avataaars config — kept in sync with ShanayaAvatar.jsx so
 * the girl in the centre of the MeetShanaya vignette is the SAME character
 * as the avatar rendered on the left side of the stage. */
const SHANAYA_AVATAR_BASE = {
  seed: 'Shanaya-LeanHyphen-v6',
  size: 240,
  style: ['default'],
  backgroundColor: ['transparent'],
  skinColor: ['edb98a'],
  hairColor: ['2c1b18'],
  top: ['straightAndStrand'],
  topProbability: 100,
  hatColor: ['ff5a4a'],
  facialHair: ['blank'],
  facialHairProbability: 0,
  accessories: ['blank'],
  accessoriesProbability: 0,
  clothing: ['shirtCrewNeck'],
  clothesColor: ['ff5a4a'],
  clothingGraphic: ['skull'],
  clothingGraphicProbability: 0,
  nose: ['default'],
  eyes: ['happy'],
  eyebrows: ['raisedExcited'],
  mouth: ['smile'],
};

/* Two friend avataaars — same long-hair top as Shanaya
 * (`straightAndStrand`) so all three girls have visibly long flowing
 * hair; only the colour, top and expression vary. */
const FRIEND_LEFT_BASE = {
  ...SHANAYA_AVATAR_BASE,
  seed: 'Shanaya-friend-priya-v4',
  skinColor: ['d08b5b'],
  hairColor: ['a55728'],            // warm auburn
  top: ['straightAndStrand'],       // long straight hair with side strand
  clothesColor: ['ff5a7a'],         // pink top
  eyes: ['hearts'],                 // heart eyes
  eyebrows: ['defaultNatural'],
  mouth: ['twinkle'],
};
const FRIEND_RIGHT_BASE = {
  ...SHANAYA_AVATAR_BASE,
  seed: 'Shanaya-friend-aanya-v5',
  skinColor: ['ffdbb4'],            // fair / light skin
  hairColor: ['4a312c'],            // deep chestnut
  top: ['straightAndStrand'],       // long straight hair with side strand
  clothesColor: ['8c52ff'],         // purple top
  eyes: ['wink'],                   // playful wink
  eyebrows: ['raisedExcitedNatural'],
  mouth: ['smile'],
};

function MeetShanaya() {
  /* Composition (rewritten May 2026 per direct user feedback):
   *   – Middle girl is the SAME Shanaya avataaars character as the left
   *     side of the page (same seed, same skin / hair / outfit config).
   *   – Two friends flank her, each a different avataaars (different
   *     hair, skin, top) so they read as a friend group.
   *   – Background is the SAME bedroom (peach wall, brown floor, window
   *     with curtains, heart frame, pinboard, plant, bed peek, sparkles)
   *     as the RoomScene behind the left-side avatar.
   *   – A small phone is held in a visible hand at the bottom centre,
   *     back-out so we see the camera island + real Apple logo. */

  /* Cache the three DiceBear data URIs so they're not regenerated on
   * every render. */
  const shanayaUri = useMemo(() => createAvatar(avataaars, SHANAYA_AVATAR_BASE).toDataUri(), []);
  const friendLeftUri = useMemo(() => createAvatar(avataaars, FRIEND_LEFT_BASE).toDataUri(), []);
  const friendRightUri = useMemo(() => createAvatar(avataaars, FRIEND_RIGHT_BASE).toDataUri(), []);

  return (
    <SceneShell from="#FFE0E9" to="#FFD0C0">
      <defs>
        {/* Same palette as the RoomScene behind the left-side avatar so the
           vignette reads as the SAME bedroom. */}
        <linearGradient id="ms-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#FFE0E9" />
          <stop offset="100%" stopColor="#FFD0C0" />
        </linearGradient>
        <linearGradient id="ms-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#E8B98A" />
          <stop offset="100%" stopColor="#C99B6D" />
        </linearGradient>
        <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#CDEEF9" />
          <stop offset="100%" stopColor="#A8D8E8" />
        </linearGradient>
        {/* Phone back gradient */}
        <linearGradient id="ms-phone-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#4A4A50" />
          <stop offset="50%"  stopColor="#1F1F24" />
          <stop offset="100%" stopColor="#0A0A0F" />
        </linearGradient>
        <radialGradient id="ms-cam-lens" cx="35%" cy="35%" r="70%">
          <stop offset="0%"   stopColor="#A6B8D8" />
          <stop offset="60%"  stopColor="#2C3E6A" />
          <stop offset="100%" stopColor="#06091A" />
        </radialGradient>
        {/* Skin tone for the hand */}
        <linearGradient id="ms-hand-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#F2C49A" />
          <stop offset="100%" stopColor="#D8A476" />
        </linearGradient>
      </defs>

      {/* ============ BEDROOM (same scene as the RoomScene behind the
           left-side avatar — wall, floor, window, curtains, heart frame,
           pinboard, plant, bed peek, sparkles). y-coordinates compressed
           by 0.75 to fit the 320×240 viewBox. ============ */}
      <g transform="scale(1 0.75)">
        {/* Wall + floor */}
        <rect width="320" height="240" fill="url(#ms-wall)" />
        <rect y="240" width="320" height="80" fill="url(#ms-floor)" />
        <rect y="237" width="320" height="6" fill="#B8855F" />

        {/* Window — top-left */}
        <rect x="20" y="22"  width="86" height="70" fill="#A07050" rx="4" />
        <rect x="24" y="26"  width="78" height="62" fill="url(#ms-sky)" rx="2" />
        <circle cx="86" cy="40" r="6" fill="#FFF7C8" />
        <rect x="24" y="55"  width="78" height="3" fill="#A07050" />
        <rect x="61" y="26"  width="3"  height="62" fill="#A07050" />
        <path d="M10 22 Q14 80 8 96 Q18 90 24 96 L24 22 Z" fill="#FF8FAB" opacity="0.92" />
        <path d="M116 22 Q112 80 118 96 Q108 90 102 96 L102 22 Z" fill="#FF8FAB" opacity="0.92" />

        {/* Heart picture frame — top-right */}
        <rect x="215" y="32" width="76" height="62" fill="#FFFFFF" stroke="#A07050" strokeWidth="3" rx="3" />
        <path
          d="M253 80
             C246 73 233 63 233 51
             C233 44 239 39 246 39
             C250 39 253 41 253 41
             C253 41 256 39 260 39
             C267 39 273 44 273 51
             C273 63 260 73 253 80 Z"
          fill="#FF6B6B"
        />

        {/* Pinboard / small sticky notes — center wall */}
        <rect x="138" y="118" width="48" height="36" fill="#FFE9B0" stroke="#C99B6D" strokeWidth="1.5" transform="rotate(-3 162 136)" />
        <rect x="180" y="128" width="32" height="28" fill="#C7E8B5" stroke="#7BC470" strokeWidth="1.5" transform="rotate(4 196 142)" />

        {/* Decorative ceramic vase with a small floral bouquet on top —
           replaces the previous leafy "tree" pot per user feedback. */}
        <defs>
          <linearGradient id="ms-vase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FFFFFF" />
            <stop offset="55%"  stopColor="#FFCED9" />
            <stop offset="100%" stopColor="#C4738A" />
          </linearGradient>
        </defs>
        {/* Vase body — curvy ceramic silhouette */}
        <path
          d="M256 296
             Q244 286 252 268
             Q260 262 260 252
             Q260 244 268 244
             L284 244
             Q292 244 292 252
             Q292 262 300 268
             Q308 286 296 296 Z"
          fill="url(#ms-vase)"
        />
        {/* Glossy highlight running down the left side */}
        <path
          d="M260 274 Q258 286 263 294"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* Gold band around the neck */}
        <rect x="260" y="248" width="32" height="3" rx="1.5" fill="#E0B040" />
        <rect x="260" y="248" width="32" height="1" fill="#FFE066" opacity="0.85" />

        {/* Floral bouquet — three blooms + a couple of leaves */}
        {/* Stems */}
        <path d="M270 244 Q269 234 268 226" stroke="#3B9D6B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M276 244 Q277 232 278 224" stroke="#3B9D6B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M282 244 Q283 234 284 228" stroke="#3B9D6B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Leaves */}
        <ellipse cx="272" cy="236" rx="3" ry="1.4" fill="#5BB985" transform="rotate(-30 272 236)" />
        <ellipse cx="280" cy="234" rx="3" ry="1.4" fill="#5BB985" transform="rotate(30 280 234)" />
        {/* Pink rose */}
        <circle cx="268" cy="222" r="4.5" fill="#FF7AA2" />
        <circle cx="268" cy="222" r="2.4" fill="#FF5A7A" />
        <circle cx="267" cy="221" r="1.1" fill="#FFFFFF" opacity="0.7" />
        {/* White daisy */}
        <g>
          {[0, 1, 2, 3, 4, 5].map((p) => {
            const a = p * 60 * Math.PI / 180;
            return (
              <ellipse
                key={p}
                cx={278 + Math.cos(a) * 3}
                cy={220 + Math.sin(a) * 3}
                rx="2.2" ry="1.3"
                transform={`rotate(${p * 60} ${278 + Math.cos(a) * 3} ${220 + Math.sin(a) * 3})`}
                fill="#FFFFFF"
              />
            );
          })}
          <circle cx="278" cy="220" r="1.6" fill="#FFE066" />
        </g>
        {/* Yellow bloom */}
        <circle cx="284" cy="224" r="3.5" fill="#FFD27A" />
        <circle cx="284" cy="224" r="1.8" fill="#FFB347" />
        <circle cx="283.3" cy="223.3" r="0.8" fill="#FFFFFF" opacity="0.7" />

        {/* Bed peek — bottom-left */}
        <rect x="-10" y="260" width="120" height="60" fill="#F7C4D0" rx="6" />
        <rect x="-10" y="260" width="120" height="14" fill="#E89AAE" rx="6" />
        <circle cx="40" cy="282" r="8" fill="#FFFFFF" opacity="0.7" />

        {/* Warm sparkles */}
        <g fill="#FFD23F" opacity="0.85">
          <circle cx="155" cy="38"  r="2.5" />
          <circle cx="195" cy="68"  r="1.8" />
          <circle cx="135" cy="78"  r="2"   />
          <circle cx="195" cy="180" r="1.6" />
        </g>
      </g>

      {/* ============ THREE GIRLS — all rendered as DiceBear avataaars.
           Middle one uses the EXACT same Shanaya config as the left-side
           avatar on the page. Left + right are friend variants. ============ */}

      {/* Friend (left) — leaning slightly toward Shanaya */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <image
          href={friendLeftUri}
          x="-8" y="56"
          width="120" height="120"
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: 'rotate(8deg)', transformOrigin: '52px 116px' }}
        />
      </motion.g>

      {/* Shanaya (centre) — same avatar as the left-side stage. Slightly
         larger so she reads as the protagonist. */}
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      >
        <image
          href={shanayaUri}
          x="92" y="36"
          width="140" height="140"
          preserveAspectRatio="xMidYMid slice"
        />
      </motion.g>

      {/* Friend (right) — mirrors the left girl */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <image
          href={friendRightUri}
          x="208" y="56"
          width="120" height="120"
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: 'rotate(-8deg)', transformOrigin: '268px 116px' }}
        />
      </motion.g>

      {/* ============ TINY PHONE — back-out so we see the camera island
           + Apple logo. Floats on its own (the hand was removed per user
           feedback — it was reading more as clutter than as "holding"). */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Phone body — tiny, back-out, slight tilt */}
        <g transform="translate(155 168) rotate(-4 10 17)" filter="url(#lh-hero)">
          <rect width="20" height="34" rx="5" fill="url(#ms-phone-back)" />
          <rect x="0.4" y="0.4" width="19.2" height="33.2" rx="4.6" fill="none" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="0.5" />
          {/* Vertical sheen on the back */}
          <rect x="1.8" y="2.4" width="0.8" height="29" rx="0.4" fill="#FFFFFF" opacity="0.08" />

          {/* Camera island — small square top-left with two lenses */}
          <g transform="translate(2 2)">
            <rect width="7" height="7" rx="2" fill="#15151A" />
            <circle cx="2.4" cy="2.4" r="1.3" fill="url(#ms-cam-lens)" />
            <circle cx="2.1" cy="2.1" r="0.3" fill="#FFFFFF" opacity="0.85" />
            <circle cx="5"   cy="5"   r="1.3" fill="url(#ms-cam-lens)" />
            <circle cx="4.7" cy="4.7" r="0.3" fill="#FFFFFF" opacity="0.85" />
            {/* LED flash */}
            <circle cx="5"   cy="2.4" r="0.6" fill="#FFE066" />
          </g>

          {/* APPLE LOGO — proper bitten-apple silhouette (Bootstrap Icons
             apple mark), scaled to fit the new tiny phone back. */}
          <g transform="translate(7 14) scale(0.4)">
            <path
              d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 2.005-.484.595.005 1.301.183 1.81.483.391.234 1.187.413 1.741-.04.371-.286 1.453-1.703 2.085-3.146Z"
              fill="#FFFFFF"
            />
          </g>
        </g>
      </motion.g>

      {/* Corner sparkles for a bit of charm — kept light */}
      <Sparkle x={36}  y={36}  delay={0} />
      <Sparkle x={284} y={28}  delay={0.55} />
      <Sparkle x={296} y={170} delay={1.1} />
      <Sparkle x={28}  y={190} delay={0.35} />
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
  /* Composition (rewritten May 2026 — same girl avatars as Scene 1 /
   * MeetShanaya, same RoomScene background, with chat bubbles cleanly
   * placed so nothing overlaps the avatars):
   *   – Three girls = the SAME three DiceBear avataaars used in Scene 1
   *     (Shanaya in the middle + two friends).
   *   – Background = the SAME bedroom (peach wall, brown floor, window,
   *     heart frame, plant, bed peek) as the RoomScene behind the
   *     left-side avatar.
   *   – Chat bubbles are stacked in the upper free-space above the
   *     avatars and never collide with them. */
  const shanayaUri    = useMemo(() => createAvatar(avataaars, SHANAYA_AVATAR_BASE).toDataUri(), []);
  const friendLeftUri = useMemo(() => createAvatar(avataaars, FRIEND_LEFT_BASE).toDataUri(),    []);
  const friendRightUri= useMemo(() => createAvatar(avataaars, FRIEND_RIGHT_BASE).toDataUri(),   []);

  return (
    <SceneShell from="#FFE0E9" to="#FFD0C0">
      <defs>
        {/* Same palette / IDs (gc- prefix) as the MeetShanaya RoomScene
           so this scene reads as the SAME bedroom. */}
        <linearGradient id="gc-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#FFE0E9" />
          <stop offset="100%" stopColor="#FFD0C0" />
        </linearGradient>
        <linearGradient id="gc-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#E8B98A" />
          <stop offset="100%" stopColor="#C99B6D" />
        </linearGradient>
        <linearGradient id="gc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#CDEEF9" />
          <stop offset="100%" stopColor="#A8D8E8" />
        </linearGradient>
        {/* Decorative vase gradient (same as MeetShanaya) */}
        <linearGradient id="gc-vase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="55%"  stopColor="#FFCED9" />
          <stop offset="100%" stopColor="#C4738A" />
        </linearGradient>
      </defs>

      {/* ============ BEDROOM (same as the RoomScene behind the left-side
           avatar — y-coords compressed by 0.75 to fit 320×240). ============ */}
      <g transform="scale(1 0.75)">
        <rect width="320" height="240" fill="url(#gc-wall)" />
        <rect y="240" width="320" height="80" fill="url(#gc-floor)" />
        <rect y="237" width="320" height="6" fill="#B8855F" />

        {/* Window — top-left */}
        <rect x="20" y="22"  width="86" height="70" fill="#A07050" rx="4" />
        <rect x="24" y="26"  width="78" height="62" fill="url(#gc-sky)" rx="2" />
        <circle cx="86" cy="40" r="6" fill="#FFF7C8" />
        <rect x="24" y="55"  width="78" height="3" fill="#A07050" />
        <rect x="61" y="26"  width="3"  height="62" fill="#A07050" />
        <path d="M10 22 Q14 80 8 96 Q18 90 24 96 L24 22 Z" fill="#FF8FAB" opacity="0.92" />
        <path d="M116 22 Q112 80 118 96 Q108 90 102 96 L102 22 Z" fill="#FF8FAB" opacity="0.92" />

        {/* Heart picture frame — top-right */}
        <rect x="215" y="32" width="76" height="62" fill="#FFFFFF" stroke="#A07050" strokeWidth="3" rx="3" />
        <path
          d="M253 80
             C246 73 233 63 233 51
             C233 44 239 39 246 39
             C250 39 253 41 253 41
             C253 41 256 39 260 39
             C267 39 273 44 273 51
             C273 63 260 73 253 80 Z"
          fill="#FF6B6B"
        />

        {/* Pinboard / sticky notes — center wall */}
        <rect x="138" y="118" width="48" height="36" fill="#FFE9B0" stroke="#C99B6D" strokeWidth="1.5" transform="rotate(-3 162 136)" />
        <rect x="180" y="128" width="32" height="28" fill="#C7E8B5" stroke="#7BC470" strokeWidth="1.5" transform="rotate(4 196 142)" />

        {/* Decorative ceramic vase + bouquet — bottom-right corner */}
        <path
          d="M256 296
             Q244 286 252 268
             Q260 262 260 252
             Q260 244 268 244
             L284 244
             Q292 244 292 252
             Q292 262 300 268
             Q308 286 296 296 Z"
          fill="url(#gc-vase)"
        />
        <path
          d="M260 274 Q258 286 263 294"
          stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.7"
        />
        <rect x="260" y="248" width="32" height="3" rx="1.5" fill="#E0B040" />
        <rect x="260" y="248" width="32" height="1" fill="#FFE066" opacity="0.85" />
        <path d="M270 244 Q269 234 268 226" stroke="#3B9D6B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M276 244 Q277 232 278 224" stroke="#3B9D6B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M282 244 Q283 234 284 228" stroke="#3B9D6B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="268" cy="222" r="4.5" fill="#FF7AA2" />
        <circle cx="268" cy="222" r="2.4" fill="#FF5A7A" />
        <circle cx="278" cy="220" r="3.2" fill="#FFFFFF" />
        <circle cx="278" cy="220" r="1.6" fill="#FFE066" />
        <circle cx="284" cy="224" r="3.5" fill="#FFD27A" />
        <circle cx="284" cy="224" r="1.8" fill="#FFB347" />

        {/* Bed peek — bottom-left */}
        <rect x="-10" y="260" width="120" height="60" fill="#F7C4D0" rx="6" />
        <rect x="-10" y="260" width="120" height="14" fill="#E89AAE" rx="6" />
        <circle cx="40" cy="282" r="8" fill="#FFFFFF" opacity="0.7" />

        {/* Warm sparkles */}
        <g fill="#FFD23F" opacity="0.85">
          <circle cx="155" cy="38"  r="2.5" />
          <circle cx="195" cy="68"  r="1.8" />
          <circle cx="135" cy="78"  r="2"   />
          <circle cx="195" cy="180" r="1.6" />
        </g>
      </g>

      {/* ============ THREE GIRLS — exact same DiceBear avatars as the
           MeetShanaya scene. Positioned identically to Scene 1. ============ */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <image
          href={friendLeftUri}
          x="-8" y="100"
          width="120" height="120"
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: 'rotate(8deg)', transformOrigin: '52px 160px' }}
        />
      </motion.g>
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      >
        <image
          href={shanayaUri}
          x="92" y="86"
          width="140" height="140"
          preserveAspectRatio="xMidYMid slice"
        />
      </motion.g>
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <image
          href={friendRightUri}
          x="208" y="100"
          width="120" height="120"
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: 'rotate(-8deg)', transformOrigin: '268px 160px' }}
        />
      </motion.g>

      {/* ============ SPEECH LABELS — placed ON TOP of each avatar's head
           so each chat line reads as if it's coming from one of the girls.
           4 labels, staggered to pop in matching the TTS read order so the
           on-screen text + voiceover land together. ============ */}
      <SpeechLabel x={56}  y={66}  text="Birthday fit check!" delay={0.15} accent="#FFB3C7" />
      <SpeechLabel x={162} y={32}  text="We need pics!"        delay={1.10} accent="#FF6B6B" />
      <SpeechLabel x={264} y={66}  text="Dress extra cool!"    delay={2.05} accent="#A678F2" />

      {/* ============ FLOATING REACTIONS — light touches in the corners ============ */}
      {[
        { x: 304, y: 36,  emoji: '💖', delay: 0.2 },
        { x: 20,  y: 200, emoji: '✨', delay: 0.8 },
        { x: 296, y: 200, emoji: '😍', delay: 1.4 },
      ].map((r, i) => (
        <motion.text
          key={i}
          x={r.x}
          y={r.y}
          fontSize="14"
          textAnchor="middle"
          animate={{ y: [r.y, r.y - 6, r.y], opacity: [0.8, 1, 0.8], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: r.delay, ease: 'easeInOut' }}
          filter="url(#lh-soft)"
        >{r.emoji}</motion.text>
      ))}
    </SceneShell>
  );
}

/* Small floating speech label that overlays each girl's head in the
 * GroupChat vignette. Auto-sizes the white pill to the text length, with
 * a coloured accent stripe on the left to match the speaker's identity.
 * Pops in with a stagger so the visual matches the TTS read order. */
function SpeechLabel({ x, y, text, delay = 0, accent = '#FF6B6B' }) {
  // Rough character-width estimate so the pill width tracks the text length.
  const width = Math.max(72, Math.min(150, text.length * 5.4 + 14));
  const height = 18;
  return (
    <motion.g
      initial={{ opacity: 0, y: y + 6, scale: 0.85 }}
      animate={{ opacity: 1, y, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: 'easeOut' }}
      filter="url(#lh-soft)"
    >
      {/* White pill background */}
      <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={height / 2} fill="#FFFFFF" />
      {/* Coloured accent stripe on the left edge */}
      <rect x={x - width / 2} y={y - height / 2} width="4" height={height} rx={2} fill={accent} />
      {/* Text */}
      <text
        x={x + 2}
        y={y + 3.2}
        fontSize="8.5"
        fontWeight="700"
        fill="#1A1426"
        textAnchor="middle"
      >
        {text}
      </text>
    </motion.g>
  );
}

/* =========================================================================
 * 4. VISION — mirror with reflection, dress, camera, photo frames
 * ========================================================================= */
function Vision() {
  return (
    <SceneShell from="#FFE5B4" to="#FFE0E9">
      <defs>
        {/* Outfit board paper */}
        <linearGradient id="board-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF1F1" />
        </linearGradient>
        {/* Dress (centre piece) — silky pink with depth */}
        <linearGradient id="dress-silk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFD4E0" />
          <stop offset="55%"  stopColor="#FF7AA2" />
          <stop offset="100%" stopColor="#B23A66" />
        </linearGradient>
        {/* Pastel sneakers */}
        <linearGradient id="sneaker-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFC7D4" />
        </linearGradient>
        {/* Handbag — buttery tan with sheen */}
        <linearGradient id="bag-tan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFE0A8" />
          <stop offset="60%"  stopColor="#D89757" />
          <stop offset="100%" stopColor="#8B5A2B" />
        </linearGradient>
        {/* Gold for jewelry + bag hardware */}
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFE585" />
          <stop offset="50%"  stopColor="#E0B040" />
          <stop offset="100%" stopColor="#9C7020" />
        </linearGradient>
        {/* Sunglass lenses */}
        <linearGradient id="lens" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3FB8FF" />
          <stop offset="100%" stopColor="#142850" />
        </linearGradient>
        {/* Cake photo gradient */}
        <linearGradient id="photo-cake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFD2A6" />
          <stop offset="100%" stopColor="#FF8FAB" />
        </linearGradient>
        {/* Café photo gradient */}
        <linearGradient id="photo-cafe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFE7B5" />
          <stop offset="100%" stopColor="#D89757" />
        </linearGradient>
        {/* Friends photo gradient (group selfie) */}
        <linearGradient id="photo-friends" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFB3C7" />
          <stop offset="100%" stopColor="#A678F2" />
        </linearGradient>
      </defs>

      {/* ============ CENTER OUTFIT BOARD (look book) ============ */}
      <g transform="translate(102 36)" filter="url(#lh-hero)">
        {/* Board */}
        <rect width="116" height="172" rx="10" fill="url(#board-paper)" />
        <rect width="116" height="22" rx="10" fill="#FFB3C7" />
        <rect y="14" width="116" height="8" fill="#FFB3C7" />
        {/* Header text — "BIRTHDAY LOOK" */}
        <text x="58" y="15" textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui" fontSize="8" fontWeight="800"
          fill="#7A2A4A" letterSpacing="1.5">BIRTHDAY LOOK</text>

        {/* DRESS — main piece */}
        <g transform="translate(34 30)">
          {/* hanger */}
          <line x1="24" y1="0" x2="24" y2="6" stroke="#888" strokeWidth="1.2" />
          <circle cx="24" cy="9" r="3" fill="none" stroke="#888" strokeWidth="1.2" />
          {/* dress shape — flared hem with bow at waist */}
          <path d="M8 14 Q24 6 40 14 L46 56 Q24 50 2 56 Z" fill="url(#dress-silk)" />
          {/* waist ribbon */}
          <rect x="6" y="30" width="36" height="3" fill="#B23A66" />
          {/* bow */}
          <path d="M22 31 Q20 28 22 33 Q24 28 26 31 Q24 34 22 31 Z" fill="#FFE066" />
          <circle cx="24" cy="32" r="1.2" fill="#B23A66" />
          {/* folds */}
          <path d="M14 36 L18 54" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.55" />
          <path d="M24 36 L24 56" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.65" />
          <path d="M34 36 L30 54" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.55" />
          {/* shoulder straps */}
          <path d="M14 16 Q24 8 34 16" stroke="#B23A66" strokeWidth="1.2" fill="none" />
        </g>

        {/* SNEAKERS — bottom left */}
        <g transform="translate(10 110)" filter="url(#lh-soft)">
          {/* shoe body */}
          <path d="M0 18 Q0 8 8 8 L24 8 Q30 8 32 14 L34 18 Q34 24 28 24 L4 24 Q0 24 0 20 Z" fill="url(#sneaker-body)" />
          {/* sole */}
          <rect y="22" width="34" height="3" rx="1" fill="#FFFFFF" />
          <rect y="24" width="34" height="2" rx="1" fill="#B23A66" />
          {/* swoosh stripe */}
          <path d="M6 18 Q14 10 28 16" stroke="#FF7AA2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* laces */}
          <line x1="14" y1="12" x2="22" y2="13" stroke="#FFFFFF" strokeWidth="0.6" />
          <line x1="14" y1="14" x2="22" y2="15" stroke="#FFFFFF" strokeWidth="0.6" />
          {/* eyelet */}
          <circle cx="12" cy="13" r="0.8" fill="#B23A66" />
        </g>

        {/* HANDBAG — bottom right */}
        <g transform="translate(70 108)" filter="url(#lh-soft)">
          {/* handle */}
          <path d="M6 6 Q18 -4 30 6" stroke="url(#gold)" strokeWidth="2" fill="none" />
          {/* bag body */}
          <rect x="2" y="6" width="32" height="22" rx="3" fill="url(#bag-tan)" />
          {/* fold flap */}
          <path d="M2 6 L18 18 L34 6 Z" fill="#FFFFFF" opacity="0.25" />
          {/* clasp */}
          <circle cx="18" cy="16" r="2.5" fill="url(#gold)" />
          <circle cx="18" cy="16" r="1.2" fill="#7A4E1C" />
          {/* stitch */}
          <rect x="2" y="9" width="32" height="0.6" fill="#7A4E1C" opacity="0.4" />
        </g>

        {/* SUNGLASSES + NECKLACE — small accessories row */}
        <g transform="translate(8 86)">
          {/* sunglasses */}
          <circle cx="6"  cy="6" r="5" fill="url(#lens)" stroke="#1A1426" strokeWidth="1" />
          <circle cx="18" cy="6" r="5" fill="url(#lens)" stroke="#1A1426" strokeWidth="1" />
          <path d="M11 6 L13 6" stroke="#1A1426" strokeWidth="1" />
          {/* lens shine */}
          <ellipse cx="4" cy="4" rx="1.2" ry="0.8" fill="#FFFFFF" opacity="0.8" />
          <ellipse cx="16" cy="4" rx="1.2" ry="0.8" fill="#FFFFFF" opacity="0.8" />
        </g>
        <g transform="translate(60 84)">
          {/* gold necklace */}
          <path d="M0 0 Q14 14 28 0" stroke="url(#gold)" strokeWidth="1.4" fill="none" />
          <circle cx="14" cy="10" r="2.4" fill="url(#gold)" />
          <path d="M12.5 9 L14 12 L15.5 9 Z" fill="#FFFFFF" opacity="0.7" />
        </g>

        {/* tiny price-less tags */}
        <text x="58" y="166" textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui" fontSize="6" fontWeight="700"
          fill="#7A2A4A" opacity="0.7">CONFIDENT · CUTE · READY</text>
      </g>

      {/* ============ POLAROID 1 — CAFÉ (top left) ============ */}
      <motion.g
        animate={{ y: [12, 6, 12] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <g transform="rotate(-10 30 28)" filter="url(#lh-hero)">
          <rect x="10" y="14" width="46" height="48" fill="#FFFFFF" />
          {/* café photo */}
          <rect x="13" y="17" width="40" height="32" fill="url(#photo-cafe)" />
          {/* awning stripes */}
          <rect x="13" y="17" width="40" height="6" fill="#FF7AA2" />
          <rect x="17" y="17" width="4" height="6" fill="#FFFFFF" opacity="0.5" />
          <rect x="25" y="17" width="4" height="6" fill="#FFFFFF" opacity="0.5" />
          <rect x="33" y="17" width="4" height="6" fill="#FFFFFF" opacity="0.5" />
          <rect x="41" y="17" width="4" height="6" fill="#FFFFFF" opacity="0.5" />
          {/* table + cup */}
          <rect x="18" y="36" width="30" height="2" fill="#7A4E1C" />
          <rect x="26" y="29" width="6" height="7" rx="1" fill="#FFFFFF" />
          <rect x="26" y="29" width="6" height="2" fill="#D89757" />
          {/* heart sticker */}
          <path d="M44 22 Q42 19 40 22 Q40 25 44 28 Q48 25 48 22 Q46 19 44 22 Z" fill="#FF5A7A" />
          {/* caption strip */}
          <text x="33" y="58" textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui" fontSize="5" fontWeight="700"
            fill="#7A2A4A">cute café ✨</text>
        </g>
      </motion.g>

      {/* ============ POLAROID 2 — CAKE / BIRTHDAY (top right) ============ */}
      <motion.g
        animate={{ y: [6, 0, 6] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <g transform="rotate(8 280 28)" filter="url(#lh-hero)">
          <rect x="240" y="8" width="46" height="48" fill="#FFFFFF" />
          {/* cake photo */}
          <rect x="243" y="11" width="40" height="32" fill="url(#photo-cake)" />
          {/* cake */}
          <rect x="252" y="28" width="22" height="10" rx="1" fill="#FFFFFF" />
          <rect x="252" y="26" width="22" height="3" fill="#FF7AA2" />
          {/* drips */}
          <path d="M256 29 Q257 33 258 29" fill="#FF7AA2" />
          <path d="M263 29 Q264 33 265 29" fill="#FF7AA2" />
          <path d="M270 29 Q271 33 272 29" fill="#FF7AA2" />
          {/* candle */}
          <rect x="262" y="20" width="2" height="6" fill="#FFE066" />
          <motion.path
            d="M263 16 Q261 19 263 20 Q265 19 263 16 Z"
            fill="#FF7A2E"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ transformOrigin: '263px 18px' }}
          />
          {/* sprinkles */}
          <circle cx="255" cy="32" r="0.8" fill="#A678F2" />
          <circle cx="260" cy="34" r="0.8" fill="#3FB8FF" />
          <circle cx="266" cy="32" r="0.8" fill="#FFE066" />
          <circle cx="271" cy="34" r="0.8" fill="#FF5A7A" />
          {/* caption */}
          <text x="263" y="52" textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui" fontSize="5" fontWeight="700"
            fill="#7A2A4A">birthday 🎂</text>
        </g>
      </motion.g>

      {/* ============ POLAROID 3 — GROUP SELFIE (bottom right) ============ */}
      <motion.g
        animate={{ y: [144, 138, 144] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
      >
        <g transform="rotate(-6 268 162)" filter="url(#lh-hero)">
          <rect x="244" y="138" width="48" height="50" fill="#FFFFFF" />
          {/* selfie photo */}
          <rect x="247" y="141" width="42" height="34" fill="url(#photo-friends)" />
          {/* three friend heads (peeking) */}
          <circle cx="256" cy="160" r="6" fill="#EDB98A" />
          <path d="M250 158 Q250 152 256 152 Q262 152 262 158 Q262 164 250 164 Z" fill="#2C1B18" />
          <circle cx="268" cy="156" r="6" fill="#F2C49A" />
          <path d="M262 154 Q262 148 268 148 Q274 148 274 154 Q274 160 262 160 Z" fill="#7A2A1A" />
          <circle cx="280" cy="160" r="6" fill="#E8B080" />
          <path d="M274 158 Q274 152 280 152 Q286 152 286 158 Q286 164 274 164 Z" fill="#1A0E0A" />
          {/* smiles */}
          <path d="M254 162 Q256 164 258 162" stroke="#7A2A1A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <path d="M266 158 Q268 160 270 158" stroke="#7A2A1A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <path d="M278 162 Q280 164 282 162" stroke="#7A2A1A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          {/* peace fingers */}
          <text x="268" y="174" textAnchor="middle" fontSize="6">✌️</text>
          {/* caption */}
          <text x="268" y="184" textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui" fontSize="5" fontWeight="700"
            fill="#7A2A4A">squad goals 💖</text>
        </g>
      </motion.g>

      {/* ============ POLAROID 4 — OUTFIT MIRROR (bottom left) ============ */}
      <motion.g
        animate={{ y: [144, 150, 144] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <g transform="rotate(7 46 168)" filter="url(#lh-hero)">
          <rect x="22" y="144" width="46" height="50" fill="#FFFFFF" />
          {/* mirror selfie photo */}
          <rect x="25" y="147" width="40" height="34" fill="#FFE0E9" />
          {/* phone in hand */}
          <rect x="40" y="160" width="6" height="10" rx="1" fill="#1A1426" />
          <rect x="41" y="161" width="4" height="6" fill="#3FB8FF" opacity="0.6" />
          {/* girl in dress */}
          <circle cx="33" cy="158" r="5" fill="#EDB98A" />
          <path d="M28 156 Q28 151 33 151 Q38 151 38 156 Q38 161 28 161 Z" fill="#2C1B18" />
          {/* dress silhouette */}
          <path d="M27 163 Q33 161 39 163 L41 178 L25 178 Z" fill="url(#dress-silk)" />
          {/* caption */}
          <text x="45" y="190" textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui" fontSize="5" fontWeight="700"
            fill="#7A2A4A">outfit ready 💄</text>
        </g>
      </motion.g>

      {/* ============ FLOATING HEARTS + SPARKLES ============ */}
      {[
        { x: 86,  y: 30, delay: 0.2 },
        { x: 232, y: 92, delay: 1.2 },
        { x: 96,  y: 122, delay: 0.7 },
      ].map((h, i) => (
        <motion.path
          key={`h-${i}`}
          d={`M${h.x} ${h.y} q-3 -4 -6 0 q0 5 6 9 q6 -4 6 -9 q-3 -4 -6 0 Z`}
          fill="#FF5A7A"
          animate={{ y: [h.y, h.y - 8, h.y], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: h.delay, ease: 'easeInOut' }}
        />
      ))}

      {[
        { x: 36, y: 70 }, { x: 240, y: 50 },
        { x: 92, y: 200 }, { x: 230, y: 196 }, { x: 168, y: 88 },
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
  /* Generic shopping-feed products that are intentionally DIFFERENT from
   * the items Shanaya is about to purchase (sneakers / socks / hoodie /
   * selfie light). The home feed should feel like a regular browsing
   * session, not a preview of her cart. */
  const UN = (id) => `https://images.unsplash.com/photo-${id}?w=160&h=160&fit=crop&auto=format&q=70`;
  const products = [
    { image: UN('1546868871-7041f2a55e12'), tile: '#E0EAFF', tint: '#7CA4F4', name: 'Smartwatch', price: '₹2,499' },
    { image: UN('1553062407-98eeb64c6a62'), tile: '#FFEFC7', tint: '#FFD27A', name: 'Backpack',   price: '₹999'   },
    { image: UN('1572635196237-14b3f281503f'), tile: '#E0F8F1', tint: '#7CD9C2', name: 'Sunglasses', price: '₹899' },
    { image: UN('1586495777744-4413f21062fa'), tile: '#FFE0E9', tint: '#FF7AA2', name: 'Lipstick',   price: '₹399' },
  ];

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
        {/* Spree brand-mark gradient (same coral → burgundy as the in-app
           SpreeLogo in MockShoppingApp). */}
        <linearGradient id="spree-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FF5A4A" />
          <stop offset="100%" stopColor="#8B1E3F" />
        </linearGradient>
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

          {/* App header — proper Spree logo (gradient bag tile + wordmark)
             matching the SpreeLogo used in the main app. Aligned to the
             left edge of the screen with the cart on the right. */}
          <g transform="translate(14 22)">
            {/* Logo tile */}
            <rect width="18" height="18" rx="5" fill="url(#spree-mark)" />
            {/* Stylised shopping-bag icon inside the tile */}
            <g transform="translate(4 4)" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M1 3 H9 V10 H1 Z" />
              <path d="M3 3 V2 Q5 0.5 7 2 V3" />
            </g>
            {/* Spree wordmark */}
            <text x="24" y="13" fontSize="11.5" fontWeight="800" fill="#1A1426" letterSpacing="-0.2">
              Spree<tspan fill="#FF5A4A">.</tspan>
            </text>
          </g>

          {/* Cart icon on the right of the header */}
          <g transform="translate(132 24)">
            <g stroke="#1A1426" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4 H14 L12.5 12 H3.5 Z" />
              <path d="M5 4 Q5 1 8 1 Q11 1 11 4" />
            </g>
            <motion.circle
              cx="13" cy="2" r="3.2" fill="#FF6B6B"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <text x="13" y="4.4" textAnchor="middle" fontSize="6" fontWeight="800" fill="#FFFFFF">0</text>
          </g>

          {/* Search bar with typing text */}
          <rect x="14" y="48" width="132" height="22" rx="11" fill="#F1F5F9" />
          <text x="22" y="63" fontSize="10" fill="#1A1426" fontWeight="700">
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

          {/* Product grid — four real product photos from the lesson
             catalog so each card looks distinct (was four identical 👟). */}
          {products.map((p, i) => {
            const x = 14 + (i % 2) * 70;
            const y = 78 + Math.floor(i / 2) * 64;
            const clipId = `app-open-img-clip-${i}`;
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.15, duration: 0.4 }}
                filter="url(#lh-soft)"
              >
                {/* Per-card clip so the photo stays inside the rounded
                   image area instead of overflowing the card. */}
                <defs>
                  <clipPath id={clipId}>
                    <rect x={x + 4} y={y + 4} width="52" height="32" rx="4" />
                  </clipPath>
                </defs>
                {/* Card background */}
                <rect x={x} y={y} width="60" height="56" rx="6" fill="#FFFFFF" />
                {/* Tinted fallback under the image (in case it fails) */}
                <rect x={x + 4} y={y + 4} width="52" height="32" rx="4" fill={p.tile} />
                {/* Actual product image — Unsplash photo from the lesson
                   catalog, cropped to fill the 52×32 image area. */}
                {p.image && (
                  <image
                    href={p.image}
                    x={x + 4} y={y + 4}
                    width="52" height="32"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${clipId})`}
                  />
                )}
                {/* Subtle tint dot accent in the top-right of the image */}
                <circle cx={x + 50} cy={y + 10} r="3.2" fill={p.tint} opacity="0.85" />
                {/* Wishlist heart in the top-left */}
                <circle cx={x + 10} cy={y + 10} r="3.2" fill="#FFFFFF" opacity="0.85" />
                <text x={x + 10} y={y + 12} textAnchor="middle" fontSize="4.5">❤</text>
                {/* Product name */}
                <text x={x + 6} y={y + 46} fontSize="6.5" fontWeight="700" fill="#1A1426">{p.name}</text>
                {/* Price */}
                <text x={x + 6} y={y + 53} fontSize="6.5" fontWeight="800" fill="#FF5A4A">{p.price}</text>
              </motion.g>
            );
          })}
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
