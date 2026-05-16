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
        className={`relative ${sizeClass} overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#FFE0E9] via-[#FFD0C0] to-[#FFE5B4] shadow-2xl ring-[4px] ring-white/80`}
      >
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
