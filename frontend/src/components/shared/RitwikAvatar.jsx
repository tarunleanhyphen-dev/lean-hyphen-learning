import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';

/**
 * Ritwik — 13-year-old boy. Built on the same DiceBear avataaars engine
 * Shanaya uses, but with a short messy hair top, brown skin, casual hoodie
 * top, and emotion configs tuned for the new lesson's moments (curious →
 * confident → shocked → realised → calm in the digital world).
 *
 * The avatar supports both a "home / cozy" mode (peach-warm aura, room
 * backdrop) and a "digital / cyber" mode (electric-teal aura, no room) —
 * the parent Act passes the current scenePhase to flip the look.
 */

const BASE = {
  seed: 'Ritwik-LeanHyphen-v1',
  size: 320,
  style: ['default'],
  backgroundColor: ['transparent'],
  skinColor: ['edb98a'],
  hairColor: ['2c1b18'],
  top: ['shortHairShortFlat'],
  topProbability: 100,
  hatColor: ['65c9ff'],
  facialHair: ['blank'],
  facialHairProbability: 0,
  accessories: ['blank'],
  accessoriesProbability: 0,
  clothing: ['hoodie'],
  clothesColor: ['1e88e5'],
  clothingGraphic: ['blank'],
  clothingGraphicProbability: 0,
  nose: ['default'],
};

const EMOTIONS = {
  neutral:   { eyes: 'default',   eyebrows: 'default',         mouth: 'serious',    aura: 'bg-sky-400/55',    label: 'calm' },
  curious:   { eyes: 'side',      eyebrows: 'raisedExcited',   mouth: 'serious',    aura: 'bg-sky-400/55',    label: 'curious' },
  confident: { eyes: 'happy',     eyebrows: 'default',         mouth: 'smile',      aura: 'bg-teal-400/55',   label: 'confident' },
  bored:     { eyes: 'squint',    eyebrows: 'default',         mouth: 'serious',    aura: 'bg-sky-400/45',    label: 'bored' },
  unsettled: { eyes: 'squint',    eyebrows: 'sadConcerned',    mouth: 'concerned',  aura: 'bg-burgundy-500/55', label: 'unsettled' },
  shocked:   { eyes: 'surprised', eyebrows: 'upDown',          mouth: 'screamOpen', aura: 'bg-coral-500/65',  label: 'startled' },
  realised:  { eyes: 'surprised', eyebrows: 'raisedExcited',   mouth: 'disbelief',  aura: 'bg-violet-500/60', label: 'realising' },
  happy:     { eyes: 'happy',     eyebrows: 'raisedExcited',   mouth: 'smile',      aura: 'bg-teal-400/55',   label: 'happy' },
};

function dataUriFor(emotion, mouthOverride = null) {
  const e = EMOTIONS[emotion] || EMOTIONS.neutral;
  return createAvatar(avataaars, {
    ...BASE,
    eyes: [e.eyes],
    eyebrows: [e.eyebrows],
    mouth: [mouthOverride || e.mouth],
  }).toDataUri();
}

function speakingFace(mouth) {
  return createAvatar(avataaars, {
    ...BASE,
    eyes:     ['default'],
    eyebrows: ['default'],
    mouth:    [mouth],
  }).toDataUri();
}

const SPEAKING_FACE_CLOSED = speakingFace('default');
const SPEAKING_FACE_PARTED = speakingFace('disbelief');
const VISEME_FACES = [SPEAKING_FACE_CLOSED, SPEAKING_FACE_PARTED, speakingFace('eating')];

export default function RitwikAvatar({
  emotion = 'neutral',
  speaking = false,
  amplitudeRef,
  visemeRef,
  size = 'xl',
  mode = 'home',           // 'home' | 'digital' | 'token'
}) {
  const face = EMOTIONS[emotion] || EMOTIONS.neutral;
  const idleUri = useMemo(() => dataUriFor(emotion), [emotion]);

  const OPEN_THRESHOLD = 0.22;
  const CLOSE_THRESHOLD = 0.12;
  const MIN_HOLD_MS = 130;

  const [visemeCode, setVisemeCode] = useState(0);
  useEffect(() => {
    if (!speaking) { setVisemeCode(0); return undefined; }
    let raf = 0;
    let smoothed = 0;
    let isOpen = false;
    let lastSwitchAt = 0;
    let lastCode = -1;
    const MIN_VISEME_HOLD_MS = 110;
    const tick = (now) => {
      const v = visemeRef?.current;
      if (typeof v === 'number') {
        if (v !== lastCode && now - lastSwitchAt >= MIN_VISEME_HOLD_MS) {
          lastCode = v;
          lastSwitchAt = now;
          setVisemeCode(v);
        }
        raf = requestAnimationFrame(tick);
        return;
      }
      const raw = amplitudeRef?.current ?? 0;
      const boosted = Math.min(1, Math.max(0, (raw - 0.04) * 2.2));
      const alpha = boosted > smoothed ? 0.5 : 0.18;
      smoothed = smoothed * (1 - alpha) + boosted * alpha;
      const want = isOpen ? smoothed > CLOSE_THRESHOLD : smoothed > OPEN_THRESHOLD;
      if (want !== isOpen && now - lastSwitchAt >= MIN_HOLD_MS) {
        isOpen = want;
        lastSwitchAt = now;
        const code = want ? 1 : 0;
        if (code !== lastCode) {
          lastCode = code;
          setVisemeCode(code);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, amplitudeRef, visemeRef]);

  const activeUri = !speaking
    ? idleUri
    : VISEME_FACES[Math.max(0, Math.min(VISEME_FACES.length - 1, visemeCode))];

  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (speaking) return undefined;
    const id = setTimeout(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 9000 + Math.random() * 5000);
    return () => clearTimeout(id);
  }, [speaking, blink]);

  const bob = emotion === 'shocked'
    ? { y: [0, -2, 1, 0] }
    : { y: [0, -1, 0] };

  const sizeClass = size === 'xl'
    ? 'h-40 w-40 sm:h-56 sm:w-56 md:h-60 md:w-60 lg:h-72 lg:w-72'
    : 'h-32 w-32 sm:h-44 sm:w-44 md:h-48 md:w-48 lg:h-56 lg:w-56';

  const ringClass = mode === 'digital'
    ? 'ring-cyan-300/70'
    : mode === 'token'
      ? 'ring-amber-300/80'
      : 'ring-white/80';

  return (
    <div className="relative inline-flex flex-col items-center">
      <motion.div
        aria-hidden
        animate={{
          scale: speaking ? [1, 1.025, 1] : [1, 1.02, 1],
          opacity: mode === 'digital' ? [0.55, 0.75, 0.55] : [0.4, 0.55, 0.4],
        }}
        transition={{ duration: speaking ? 1.6 : 5, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-0 -z-10 rounded-full blur-3xl ${mode === 'digital' ? 'bg-cyan-400/60' : face.aura}`}
      />

      {mode === 'home' && (
        <>
          <motion.span aria-hidden className="absolute -top-3 -right-3 text-xl" animate={{ y: [0, -2, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3, repeat: Infinity }}>🎮</motion.span>
          <motion.span aria-hidden className="absolute -bottom-1 -left-3 text-base" animate={{ y: [0, 1.5, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3.6, repeat: Infinity, delay: 0.6 }}>📱</motion.span>
        </>
      )}
      {mode === 'digital' && (
        <>
          <motion.span aria-hidden className="absolute -top-3 -right-3 text-xl" animate={{ y: [0, -2, 0], opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}>✨</motion.span>
          <motion.span aria-hidden className="absolute -bottom-1 -left-3 text-base" animate={{ y: [0, 1.5, 0], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3.6, repeat: Infinity, delay: 0.6 }}>⚡</motion.span>
        </>
      )}

      <motion.div
        animate={bob}
        transition={{ duration: emotion === 'shocked' ? 1.2 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative ${sizeClass} overflow-hidden rounded-[2rem] shadow-2xl ring-[4px] ${ringClass}`}
      >
        {mode === 'home' ? <LivingRoom /> : <CyberBackdrop />}

        <AnimatePresence mode="wait">
          <motion.div
            key={emotion + '-' + mode}
            initial={{ opacity: 0, scale: 0.94, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full"
          >
            <img
              src={activeUri}
              alt={`Ritwik looking ${face.label}`}
              draggable={false}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {speaking && (
          <motion.div
            aria-hidden
            className={`pointer-events-none absolute inset-0 rounded-[2rem] ring-[3px] ${mode === 'digital' ? 'ring-cyan-400/45' : 'ring-saffron-500/25'}`}
            animate={{ scale: [1, 1.008, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}

        <AnimatePresence>
          {blink && !speaking && (
            <motion.div
              key="blink"
              aria-hidden
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                top: '40%',
                background: 'linear-gradient(180deg, rgba(237,185,138,0) 0%, rgba(237,185,138,0.95) 35%, rgba(237,185,138,0.95) 65%, rgba(237,185,138,0) 100%)',
              }}
              className="pointer-events-none absolute left-1/2 z-[5] h-3 w-16 -translate-x-1/2 origin-top rounded-sm sm:w-20"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* Living room — evening scene with a TV, sofa, lamp glow. Warm browns + amber
 * (vs Shanaya's pink room) so visually distinct from Lesson 1. */
function LivingRoom() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="rk-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#3B2D4B" />
          <stop offset="100%" stopColor="#251A36" />
        </linearGradient>
        <linearGradient id="rk-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#7A5A3E" />
          <stop offset="100%" stopColor="#5C422C" />
        </linearGradient>
        <radialGradient id="rk-lamp" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFE08A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFE08A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Wall + floor */}
      <rect width="320" height="240" fill="url(#rk-wall)" />
      <rect y="240" width="320" height="80" fill="url(#rk-floor)" />
      <rect y="237" width="320" height="6" fill="#3B2A1A" />

      {/* Wall art — TV on the back wall */}
      <rect x="60" y="60" width="120" height="74" rx="6" fill="#0F0F12" stroke="#444" strokeWidth="2" />
      <rect x="66" y="66" width="108" height="62" rx="3" fill="#1E3A5F" />
      <rect x="66" y="66" width="108" height="62" rx="3" fill="url(#rk-lamp)" opacity="0.45" />
      {/* TV "scene" — three blobby figures */}
      <circle cx="100" cy="100" r="12" fill="#FFD23F" opacity="0.85" />
      <circle cx="130" cy="105" r="10" fill="#FF6B6B" opacity="0.85" />
      <circle cx="155" cy="98"  r="11" fill="#7DDA58" opacity="0.85" />

      {/* Floor lamp — left */}
      <rect x="20" y="180" width="3" height="80" fill="#7A5A3E" />
      <ellipse cx="22" cy="180" rx="22" ry="14" fill="#8B6B43" />
      <circle cx="22" cy="180" r="38" fill="url(#rk-lamp)" />

      {/* Plant — right corner */}
      <rect x="262" y="246" width="38" height="42" fill="#A85F3A" rx="3" />
      <ellipse cx="281" cy="244" rx="26" ry="14" fill="#5BA34F" />
      <ellipse cx="272" cy="234" rx="12" ry="9" fill="#7BC470" />

      {/* Sofa edge — bottom-left */}
      <rect x="-10" y="260" width="140" height="60" fill="#4A6B82" rx="6" />
      <rect x="-10" y="260" width="140" height="14" fill="#3A5366" rx="6" />
      <circle cx="50" cy="282" r="8" fill="#FFFFFF" opacity="0.18" />

      {/* Floating sparkles */}
      <g fill="#FFD23F" opacity="0.55">
        <circle cx="200" cy="40"  r="2" />
        <circle cx="240" cy="80"  r="1.6" />
        <circle cx="220" cy="160" r="1.8" />
      </g>
    </svg>
  );
}

/* Cyber backdrop — used in scene 3+. Grid + glow + scanlines. */
function CyberBackdrop() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="rk-cy-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#0B1739" />
          <stop offset="100%" stopColor="#1A1240" />
        </linearGradient>
        <radialGradient id="rk-cy-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#22D3EE" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <pattern id="rk-cy-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" fill="none" stroke="#22D3EE" strokeOpacity="0.18" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="320" height="320" fill="url(#rk-cy-bg)" />
      <rect width="320" height="320" fill="url(#rk-cy-grid)" />
      <rect width="320" height="320" fill="url(#rk-cy-glow)" />
      {/* Floating data dots */}
      <g fill="#7DD3FC" opacity="0.85">
        <circle cx="60"  cy="40"  r="2" />
        <circle cx="260" cy="80"  r="1.6" />
        <circle cx="190" cy="220" r="2.4" />
        <circle cx="40"  cy="240" r="1.8" />
        <circle cx="280" cy="180" r="2" />
      </g>
    </svg>
  );
}
