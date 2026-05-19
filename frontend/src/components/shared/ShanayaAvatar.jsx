import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';

/**
 * Shanaya — explicit teen-girl config on avataaars: long straight hair,
 * brown skin, vibrant top. We drive emotion through eyes / eyebrows / mouth.
 *
 * The 'default' style (vs 'circle') renders the full upper body including the
 * shirt, so "colourful clothes" actually shows.
 */

const BASE = {
  seed: 'Shanaya-LeanHyphen-v6',
  size: 320,
  style: ['default'],                    // upper body, NOT cropped circle
  backgroundColor: ['transparent'],
  skinColor: ['edb98a'],                 // bright light tan (was ae5d29 dark brown)
  hairColor: ['2c1b18'],                 // dark brown / near black
  top: ['straightAndStrand'],            // long straight hair with a strand
  topProbability: 100,
  hatColor: ['ff5a4a'],
  facialHair: ['blank'],
  facialHairProbability: 0,
  accessories: ['blank'],
  accessoriesProbability: 0,
  clothing: ['shirtCrewNeck'],
  clothesColor: ['ff5a4a'],              // coral / vibrant pink top
  clothingGraphic: ['skull'],
  clothingGraphicProbability: 0,
  nose: ['default'],
};

/* avataaars emotion grid — eyes / eyebrows / mouth combos */
const EMOTIONS = {
  neutral:   { eyes: 'default',   eyebrows: 'default',         mouth: 'smile',      aura: 'bg-saffron-400/55',  label: 'calm' },
  curious:   { eyes: 'side',      eyebrows: 'raisedExcited',   mouth: 'serious',    aura: 'bg-coral-400/60',    label: 'curious' },
  tempted:   { eyes: 'squint',    eyebrows: 'raisedExcited',   mouth: 'twinkle',    aura: 'bg-coral-400/65',    label: 'tempted' },
  excited:   { eyes: 'happy',     eyebrows: 'raisedExcitedNatural', mouth: 'smile', aura: 'bg-saffron-500/65',  label: 'excited' },
  happy:     { eyes: 'happy',     eyebrows: 'raisedExcited',   mouth: 'smile',      aura: 'bg-teal-400/55',     label: 'happy' },
  shocked:   { eyes: 'surprised', eyebrows: 'upDown',          mouth: 'screamOpen', aura: 'bg-coral-500/60',    label: 'startled' },
  unsettled: { eyes: 'squint',    eyebrows: 'sadConcerned',    mouth: 'concerned',  aura: 'bg-burgundy-500/55', label: 'unsettled' },
  guilty:    { eyes: 'squint',    eyebrows: 'sadConcerned',    mouth: 'sad',        aura: 'bg-burgundy-500/55', label: 'uneasy' },
  realised:  { eyes: 'surprised', eyebrows: 'raisedExcited',   mouth: 'disbelief',  aura: 'bg-burgundy-500/60', label: 'realising' },
};

function dataUriFor(emotion) {
  const e = EMOTIONS[emotion] || EMOTIONS.neutral;
  return createAvatar(avataaars, {
    ...BASE,
    eyes: [e.eyes],
    eyebrows: [e.eyebrows],
    mouth: [e.mouth],
  }).toDataUri();
}

export default function ShanayaAvatar({ emotion = 'neutral', speaking = false, wordTick = 0, size = 'xl' }) {
  const face = EMOTIONS[emotion] || EMOTIONS.neutral;
  const uri = useMemo(() => dataUriFor(emotion), [emotion]);

  const bob = emotion === 'shocked'
    ? { y: [0, -5, 3, -2, 0] }
    : emotion === 'excited' || emotion === 'happy'
      ? { y: [0, -5, 0], rotate: [-1.2, 1.2, -1.2] }
      : { y: [0, -3, 0] };

  const sizeClass = size === 'xl'
    ? 'h-56 w-56 sm:h-64 sm:w-64 lg:h-72 lg:w-72'
    : 'h-44 w-44 sm:h-52 sm:w-52 lg:h-56 lg:w-56';

  return (
    <div className="relative inline-flex flex-col items-center">
      <motion.div
        aria-hidden
        animate={{ scale: speaking ? [1, 1.1, 1] : [1, 1.05, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: speaking ? 0.7 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-0 -z-10 rounded-full blur-3xl ${face.aura}`}
      />

      <motion.span aria-hidden className="absolute -top-3 -right-3 text-xl" animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.4, repeat: Infinity }}>✨</motion.span>
      <motion.span aria-hidden className="absolute -bottom-1 -left-3 text-base" animate={{ y: [0, 3, 0], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}>💖</motion.span>

      <motion.div
        animate={bob}
        transition={{ duration: emotion === 'shocked' ? 0.6 : 3.8, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative ${sizeClass} overflow-hidden rounded-[2rem] shadow-2xl ring-[4px] ring-white/80`}
      >
        {/* Room scene behind Shanaya. The avataaars character has a
           transparent background, so the wall, window, picture, plant, and
           floor all show through around her — she finally looks like she's
           sitting in her actual room rather than floating in a peach blob. */}
        <RoomScene />
        <AnimatePresence mode="wait">
          <motion.img
            key={emotion}
            src={uri}
            alt={`Shanaya looking ${face.label}`}
            draggable={false}
            initial={{ opacity: 0, scale: 0.94, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full select-none object-cover"
          />
        </AnimatePresence>

        {speaking && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[2rem] ring-[5px] ring-saffron-500/45"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}

        {/*
          Lip-sync overlay. Sits on top of the static SVG mouth and animates
          open/closed. On every word boundary the `key={wordTick}` flip resets
          the animation, so the mouth moves roughly in time with each word.
          The ~60% top offset centres over the avataaars mouth.
        */}
        {speaking && (
          <motion.div
            key={`lip-${wordTick}`}
            aria-hidden
            initial={{ scaleY: 0.3, opacity: 0.85 }}
            animate={{ scaleY: [0.3, 1.25, 0.45, 0.95, 0.5], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 0.42, ease: 'easeInOut' }}
            style={{ top: '60.5%', background: 'rgba(120, 36, 28, 0.9)' }}
            className="pointer-events-none absolute left-1/2 z-10 h-2 w-6 origin-center -translate-x-1/2 rounded-full sm:h-2.5 sm:w-7"
          />
        )}
        {speaking && (
          <motion.div
            key={`lip-halo-${wordTick}`}
            aria-hidden
            initial={{ scale: 0.6, opacity: 0.5 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ top: '60.5%' }}
            className="pointer-events-none absolute left-1/2 z-10 h-3 w-9 -translate-x-1/2 rounded-full bg-coral-500/30 blur-sm sm:h-4 sm:w-10"
          />
        )}
      </motion.div>
    </div>
  );
}

/* =================== Room scene behind the avatar ===================
 * Flat-illustrated bedroom in the same warm peach palette as the rest of
 * Act 1's left card. Stylised, not photorealistic, so it matches the
 * avataaars character's flat-vector look. Includes:
 *   - Soft peach wall + warm wood floor
 *   - Window with sky + curtains (top-left)
 *   - Heart picture-frame on the wall (top-right)
 *   - Potted plant in the corner (right of floor)
 *   - A few sparkles for charm
 *
 * The whole SVG is non-interactive and sits at z-index 0; the avataaars
 * image is on top of it with a transparent background, so the room peeks
 * around Shanaya's silhouette. */
function RoomScene() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="lh-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#FFE0E9" />
          <stop offset="100%" stopColor="#FFD0C0" />
        </linearGradient>
        <linearGradient id="lh-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#E8B98A" />
          <stop offset="100%" stopColor="#C99B6D" />
        </linearGradient>
        <linearGradient id="lh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#CDEEF9" />
          <stop offset="100%" stopColor="#A8D8E8" />
        </linearGradient>
      </defs>

      {/* Wall + floor */}
      <rect width="320" height="240" fill="url(#lh-wall)" />
      <rect y="240" width="320" height="80" fill="url(#lh-floor)" />
      <rect y="237" width="320" height="6" fill="#B8855F" />

      {/* Window — top-left */}
      <rect x="20" y="22"  width="86" height="70" fill="#A07050" rx="4" />
      <rect x="24" y="26"  width="78" height="62" fill="url(#lh-sky)" rx="2" />
      <circle cx="86" cy="40" r="6" fill="#FFF7C8" />
      <rect x="24" y="55"  width="78" height="3" fill="#A07050" />
      <rect x="61" y="26"  width="3"  height="62" fill="#A07050" />
      {/* Curtains */}
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

      {/* Potted plant — floor right */}
      <rect x="252" y="248" width="42" height="48" fill="#A85F3A" rx="3" />
      <rect x="252" y="248" width="42" height="6"  fill="#8E4E2E" />
      <ellipse cx="273" cy="244" rx="28" ry="16" fill="#7BC470" />
      <ellipse cx="265" cy="234" rx="14" ry="11" fill="#9ED88E" />
      <ellipse cx="282" cy="232" rx="12" ry="9"  fill="#9ED88E" />

      {/* Bed corner peek — bottom-left */}
      <rect x="-10" y="260" width="120" height="60" fill="#F7C4D0" rx="6" />
      <rect x="-10" y="260" width="120" height="14" fill="#E89AAE" rx="6" />
      <circle cx="40" cy="282" r="8" fill="#FFFFFF" opacity="0.7" />

      {/* Sparkles for charm */}
      <g fill="#FFD23F" opacity="0.85">
        <circle cx="155" cy="38"  r="2.5" />
        <circle cx="195" cy="68"  r="1.8" />
        <circle cx="135" cy="78"  r="2"   />
        <circle cx="195" cy="180" r="1.6" />
      </g>
    </svg>
  );
}
