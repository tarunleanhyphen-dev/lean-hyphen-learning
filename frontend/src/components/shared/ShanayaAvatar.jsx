import { useEffect, useMemo, useState } from 'react';
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

/* Build an avataaars data-URI for the given emotion + optional mouth
 * override. The 2-state lip-sync (closed + small-open) renders one of
 * these two URIs based on smoothed amplitude. */
function dataUriFor(emotion, mouthOverride = null) {
  const e = EMOTIONS[emotion] || EMOTIONS.neutral;
  return createAvatar(avataaars, {
    ...BASE,
    eyes: [e.eyes],
    eyebrows: [e.eyebrows],
    mouth: [mouthOverride || e.mouth],
  }).toDataUri();
}

/* "Speaking face" — pre-rendered once at module load.
 *
 * Per QA: while Shanaya is speaking her face should look normal /
 * neutral (not happy, not unhappy, not shocked — just a calm talking
 * face). We pre-bake two emotion-independent URIs and swap to them
 * whenever speaking=true:
 *
 *   SPEAKING_FACE_CLOSED  — default eyes + default brows + 'default'
 *                           mouth (small natural closed mouth)
 *   SPEAKING_FACE_PARTED  — default eyes + default brows + 'disbelief'
 *                           mouth (smallest open-lips shape in
 *                           avataaars, ~3 px V)
 *
 * The mouth animates between these two; the rest of the face stays
 * neutral. When she stops speaking, the avatar swaps back to the
 * emotion's full expression. */
const SPEAKING_FACE_CLOSED = createAvatar(avataaars, {
  ...BASE,
  eyes:     ['default'],
  eyebrows: ['default'],
  mouth:    ['default'],
}).toDataUri();
const SPEAKING_FACE_PARTED = createAvatar(avataaars, {
  ...BASE,
  eyes:     ['default'],
  eyebrows: ['default'],
  mouth:    ['disbelief'],
}).toDataUri();

// `wordTick` prop is no longer destructured — the word-tick eyebrow
// pulse was removed (it caused visible face flicker on every syllable).
// Callers passing wordTick={...} are silently ignored.
export default function ShanayaAvatar({ emotion = 'neutral', speaking = false, amplitudeRef, size = 'xl', showPhone = true }) {
  const face = EMOTIONS[emotion] || EMOTIONS.neutral;

  /* ===== Real-time lip-sync (research-driven rewrite v3) =====
   *
   * Previous attempts that didn't work:
   *   v1  Separate SVG mouth overlay on top of the avatar  → "two mouths"
   *   v2  3-state snap (closed/disbelief/screamOpen)        → too dramatic
   *   v3a Continuous opacity blending closed + eating       → "ghost mouth"
   *
   * What actually works (this version): a single open-state, hard-snap
   * mouth swap driven by amplitude, with hysteresis to prevent flicker
   * and a max ~5 swaps/second cap. NO opacity blending — exactly ONE
   * mouth is rendered at any moment. That's how every viseme-based
   * lip-sync system in production works (Snap Lens Studio, Ready Player
   * Me, Apple's Memoji): pick a shape, render it cleanly, switch.
   *
   * Mouth shapes used:
   *   closed → emotion's natural mouth (smile / serious / twinkle / etc.)
   *   open   → 'eating' — subtle M-shape, NOT the dramatic 'screamOpen'.
   *            Chosen because it changes mouth height by only a few px,
   *            so the snap reads as "lips parted" not "mouth flapped open".
   *
   * Hysteresis: amplitude must exceed `OPEN_THRESHOLD` to open, must
   * drop below `CLOSE_THRESHOLD` (lower) to close. With a min hold time
   * of 90ms, the mouth never opens/closes more than ~11×/sec — matches
   * real speech rhythm (4-7 syllables/sec in English).
   *
   * Emotions whose natural mouth is already open (shocked, realised)
   * skip the swap — they're already speaking-shaped. */
  /* Lip-sync v5 — 3-state progressive amplitude lip-sync.
   *
   * Why three states and not two: with just closed/open the mouth only
   * has one "open" pose, which makes loud vs quiet vowels look identical.
   * Three pre-rendered mouth glyphs that progress from closed → slight
   * → medium let the mouth grow with vowel strength, the way real lips
   * do, while never reaching dramatic screamOpen territory.
   *
   *   level 0  closed     — emotion's natural mouth   (silent / consonants)
   *   level 1  slight     — 'disbelief'  (~3 px V)    (soft vowels)
   *   level 2  medium     — 'eating'     (~5 px M)    (strong vowels)
   *
   * `screamOpen` is INTENTIONALLY skipped — its ~15 px O reads as a
   * yell, which is what QA flagged as "over-reacting".
   *
   * Driver: smoothed amplitude with double hysteresis (separate thresholds
   * between each adjacent pair of levels) + minimum 80 ms hold between
   * transitions. Caps switching at ~12/sec, matches relaxed speech.
   *
   * Emotions whose natural mouth is already open or already 'disbelief'
   * skip the swap entirely (shocked / realised). */
  /* Lip-sync v6 — 4-state progressive amplitude lip-sync.
   *
   * Adds a 4th open-wide state ('screamOpen') triggered ONLY by very-
   * loud vowels (amp > 0.55, decays at 0.4). Stays rare — emphasises
   * stressed syllables. Combined with a faster MIN_HOLD_MS (45) the
   * mouth now tracks consonant→vowel rhythm closer to actual speech.
   *
   * Plus a word-tick driven eyebrow micro-pulse: on each TTS word
   * boundary the eyebrows briefly raise (via a 100 ms emotion swap),
   * which reads as the natural prosody pulse you see in real talking
   * faces.
   *
   * Lip-sync v7 — SUBTLE 2-state.
   *
   * Per QA: previous 4-state version stretched the full mouth and the
   * word-tick eyebrow pulse made the face look like it was flickering
   * on every syllable. Removed both. Now exactly two mouth states:
   *
   *   level 0  closed  — emotion's natural mouth
   *   level 1  parted  — 'disbelief'  (~3 px V open, the SMALLEST
   *                       open mouth shape in avataaars)
   *
   * No screamOpen, no eating, no eyebrow pulse — face stays calm.
   * Tighter open threshold (0.22) so the mouth only parts on
   * audible syllables, not every consonant breath. */
  // While silent, the avatar shows the full emotion face. While
  // speaking, it swaps to a pre-baked neutral face (SPEAKING_FACE_*)
  // so the mouth-only animation doesn't drag the brows/eyes around.
  const idleUri = useMemo(() => dataUriFor(emotion), [emotion]);

  // Single 2-state hysteresis. High open threshold + slower swap
  // limit (130 ms) so the mouth doesn't chatter between syllables.
  const OPEN_THRESHOLD  = 0.22;
  const CLOSE_THRESHOLD = 0.12;
  const MIN_HOLD_MS     = 130; // ~7 swaps/sec cap — relaxed speech

  const [mouthOpen, setMouthOpen] = useState(false);
  useEffect(() => {
    if (!speaking) {
      setMouthOpen(false);
      return undefined;
    }
    let raf = 0;
    let smoothed = 0;
    let isOpen = false;
    let lastSwitchAt = 0;
    const tick = (now) => {
      const raw = amplitudeRef?.current ?? 0;
      const boosted = Math.min(1, Math.max(0, (raw - 0.04) * 2.2));
      // Asymmetric smoothing — rise fast, decay slow so the mouth
      // doesn't snap shut between consonants.
      const alpha = boosted > smoothed ? 0.5 : 0.18;
      smoothed = smoothed * (1 - alpha) + boosted * alpha;
      const want = isOpen
        ? smoothed > CLOSE_THRESHOLD
        : smoothed > OPEN_THRESHOLD;
      if (want !== isOpen && now - lastSwitchAt >= MIN_HOLD_MS) {
        isOpen = want;
        lastSwitchAt = now;
        setMouthOpen(want);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, amplitudeRef]);

  /* Pick exactly one URI:
   *   - silent  → emotion's full face (idleUri)
   *   - speaking + amplitude below open threshold → neutral closed mouth
   *   - speaking + amplitude above open threshold → neutral parted mouth
   * The neutral speaking face keeps eyes/brows static so the only
   * thing the viewer sees moving is the lips. */
  const activeUri = !speaking
    ? idleUri
    : (mouthOpen ? SPEAKING_FACE_PARTED : SPEAKING_FACE_CLOSED);

  // Idle blink — every 9–14 s while NOT speaking. Was 4–7 s but QA
  // flagged the eyes as "blinking every time"; slowing the loop +
  // skipping it entirely during speech keeps the face still.
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (speaking) return undefined;
    const next = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    };
    const delay = 9000 + Math.random() * 5000;
    const id = setTimeout(next, delay);
    return () => clearTimeout(id);
  }, [speaking, blink]);

  // Bob amplitudes drastically reduced — QA flagged the previous values
  // (up to 5-8 px y-shift + 1.2° rotate) as "over-reacting". The avatar
  // should still feel alive but not bobble through every scene.
  const bob = emotion === 'shocked'
    ? { y: [0, -2, 1, 0] }
    : emotion === 'excited' || emotion === 'happy'
      ? { y: [0, -1.5, 0], rotate: [-0.35, 0.35, -0.35] }
      : { y: [0, -1, 0] };

  const sizeClass = size === 'xl'
    ? 'h-40 w-40 sm:h-56 sm:w-56 md:h-60 md:w-60 lg:h-72 lg:w-72'
    : 'h-32 w-32 sm:h-44 sm:w-44 md:h-48 md:w-48 lg:h-56 lg:w-56';

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Aura glow — toned WAY down from the previous values. Was
         pulsing scale 1→1.1 at 0.7s while speaking, which read as the
         avatar "throbbing" at the camera. Now a barely-perceptible
         scale 1→1.025 at 1.6s — alive but not distracting. */}
      <motion.div
        aria-hidden
        animate={{ scale: speaking ? [1, 1.025, 1] : [1, 1.02, 1], opacity: [0.4, 0.55, 0.4] }}
        transition={{ duration: speaking ? 1.6 : 5, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-0 -z-10 rounded-full blur-3xl ${face.aura}`}
      />

      {/* Floating ✨ / 💖 — kept but with tiny travel (1.5-2 px instead
         of 3-5 px) and lower max opacity so they don't draw the eye. */}
      <motion.span aria-hidden className="absolute -top-3 -right-3 text-xl" animate={{ y: [0, -2, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3, repeat: Infinity }}>✨</motion.span>
      <motion.span aria-hidden className="absolute -bottom-1 -left-3 text-base" animate={{ y: [0, 1.5, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3.6, repeat: Infinity, delay: 0.6 }}>💖</motion.span>

      <motion.div
        animate={bob}
        // Shocked beat was 0.6s — too quick / jittery. 1.2s reads as
        // surprise without strobing. Calm bob stays slow at 4.5s.
        transition={{ duration: emotion === 'shocked' ? 1.2 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative ${sizeClass} overflow-hidden rounded-[2rem] shadow-2xl ring-[4px] ring-white/80`}
      >
        {/* Room scene behind Shanaya. The avataaars character has a
           transparent background, so the wall, window, picture, plant, and
           floor all show through around her — she finally looks like she's
           sitting in her actual room rather than floating in a peach blob. */}
        <RoomScene />
        <AnimatePresence mode="wait">
          <motion.div
            key={emotion}
            initial={{ opacity: 0, scale: 0.94, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full"
          >
            {/* Single mouth render — exactly one URI is shown at any
               moment (closed when silent / hysteresis says closed, open
               when amplitude has crossed the open threshold). No
               opacity blending = no "ghost mouth" artefact. The img's
               src is swapped directly, and since it's the SAME face SVG
               with only the mouth glyph differing, only the mouth area
               changes between renders. */}
            <img
              src={activeUri}
              alt={`Shanaya looking ${face.label}`}
              draggable={false}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* iPhone overlay — held in Shanaya's hand against the centre of
           her coral t-shirt. Act 1 keeps it visible; Act 2 hides it
           (showPhone={false}) because the lesson has moved past the
           shopping app into reflection. */}
        {showPhone && (
        <motion.div
          aria-hidden
          animate={{ y: [0, -1.5, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 z-10"
          style={{ bottom: '6%', transform: 'translateX(-50%) rotate(-6deg)' }}
        >
          <svg width="38" height="64" viewBox="0 0 28 48" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
            {/* Phone body — dark titanium back */}
            <defs>
              <linearGradient id="ihp-back" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor="#4A4A50" />
                <stop offset="50%"  stopColor="#1F1F24" />
                <stop offset="100%" stopColor="#0A0A0F" />
              </linearGradient>
              <radialGradient id="ihp-lens" cx="35%" cy="35%" r="70%">
                <stop offset="0%"   stopColor="#A6B8D8" />
                <stop offset="60%"  stopColor="#2C3E6A" />
                <stop offset="100%" stopColor="#06091A" />
              </radialGradient>
            </defs>
            <rect width="28" height="48" rx="6" fill="url(#ihp-back)" />
            <rect x="0.6" y="0.6" width="26.8" height="46.8" rx="5.4" fill="none" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="0.6" />
            {/* Vertical sheen on the back */}
            <rect x="2.4" y="3" width="0.9" height="42" rx="0.4" fill="#FFFFFF" opacity="0.08" />
            {/* Camera island — top-left with two lenses + LED flash */}
            <g transform="translate(3 3)">
              <rect width="9" height="9" rx="2.4" fill="#15151A" />
              <circle cx="3" cy="3" r="1.7" fill="url(#ihp-lens)" />
              <circle cx="2.7" cy="2.7" r="0.4" fill="#FFFFFF" opacity="0.85" />
              <circle cx="6" cy="6" r="1.7" fill="url(#ihp-lens)" />
              <circle cx="5.7" cy="5.7" r="0.4" fill="#FFFFFF" opacity="0.85" />
              <circle cx="6" cy="3" r="0.8" fill="#FFE066" />
            </g>
            {/* Apple logo — proper bitten apple silhouette (Bootstrap Icons),
               centred low on the phone back. */}
            <g transform="translate(9.5 19) scale(0.55)">
              <path
                d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 2.005-.484.595.005 1.301.183 1.81.483.391.234 1.187.413 1.741-.04.371-.286 1.453-1.703 2.085-3.146Z"
                fill="#FFFFFF"
              />
            </g>
            {/* Side button */}
            <rect x="28" y="13" width="0.7" height="7" rx="0.35" fill="#0A0A0F" />
          </svg>
        </motion.div>
        )}

        {speaking && (
          <motion.div
            aria-hidden
            // Thinner ring (3px not 5px), lower opacity (25 not 45),
            // slower pulse (1.4s not 0.5s) → reads as "speaking
            // indicator", not "alert siren".
            className="pointer-events-none absolute inset-0 rounded-[2rem] ring-[3px] ring-saffron-500/25"
            animate={{ scale: [1, 1.008, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}

        {/* The separate amplitude-driven lip overlay used to live here —
           a small dark oval + coral highlight rendered ON TOP of the
           DiceBear avatar's static mouth. QA flagged it as showing two
           mouths during speech, so we now rely purely on the avataaars
           mouth shape (driven by the `emotion` prop) plus the speaking
           ring + bob below. The amplitude ref still feeds the speaking
           ring's pulse intensity if we want to wire that back in later. */}

        {/* Idle eye-blink overlay — a thin band of skin colour briefly
           covers the eyes between speech to suggest a natural blink. */}
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
