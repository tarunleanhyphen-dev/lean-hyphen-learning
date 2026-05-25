import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ArrowDown, Zap, Flame, Lightbulb, Shield, Target } from 'lucide-react';

/* Resolve `icon` string from lesson data to a lucide component. */
const ZONE_ICON = { Zap, Flame, Lightbulb, Shield, Target };

/**
 * Act 4's Impulse Meter — v3 "Card Strip + Morphing Personality"
 *
 * Modern edtech design language (Brilliant / Duolingo / Headspace):
 *   – 5 zone cards laid out in a horizontal strip. Each card has its
 *     own colour gradient + emoji + short label. Tapping picks it.
 *   – Selected card lifts, gradient saturates, ✓ stamp appears. Other
 *     cards recede (scale 0.96, opacity 0.55) — clear focus.
 *   – A continuous gradient progress bar below the strip animates an
 *     indicator marker to the selected position with spring physics.
 *     The bar's tint shifts to match the selected zone's accent.
 *   – Below the strip, a big "personality" card morphs between five
 *     vibes — emoji + label + a short personality line per zone.
 *     Cross-fades + slides on selection change (AnimatePresence).
 *   – Sparkle burst on selection. Soft floating "pick a zone" hint
 *     before any selection.
 *
 * Props unchanged from previous Impulse Meter so Act4.jsx routes to
 * it without changes.
 */
export default function ImpulseMeter({
  data,
  onCueClick,
  onSpeakPrompt,
  speakingDone = true,
  onComplete,
}) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [introSpoken, setIntroSpoken] = useState(false);
  if (!introSpoken && onSpeakPrompt) {
    setIntroSpoken(true);
    onSpeakPrompt(`${data.title}. ${data.instruction}`);
  }

  const totalZones = data.zones.length;
  const selectedZone = selectedIdx != null ? data.zones[selectedIdx] : null;

  const handleSelect = (i) => {
    if (selectedIdx === i) return;
    onCueClick?.();
    setSelectedIdx(i);
  };

  // Marker position 0..1 along the gradient bar — centre of the
  // selected zone. Pre-selection it parks just inside the leftmost
  // zone so the bar isn't empty.
  const markerPct = selectedIdx != null
    ? ((selectedIdx + 0.5) / totalZones) * 100
    : 10;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-500">
          🎯 Impulse Meter · self snapshot
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">
          {data.title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-700 sm:text-[14px]">
          {data.instruction}
        </p>
      </header>

      {/* ZONE CARD STRIP — 5 zone cards in a row */}
      <ZoneCardStrip
        zones={data.zones}
        selectedIdx={selectedIdx}
        onPick={handleSelect}
      />

      {/* GRADIENT METER BAR — visual continuum with animated marker */}
      <MeterBar
        markerPct={markerPct}
        selectedZone={selectedZone}
        totalZones={totalZones}
      />

      {/* PERSONALITY CARD — morphs per selection */}
      <PersonalityCard zone={selectedZone} selectedIdx={selectedIdx} totalZones={totalZones} />

      {/* AFFIRMATION */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            key="affirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-saffron-500/12 via-coral-500/10 to-teal-500/10 p-3 ring-1 ring-saffron-500/30 sm:p-4"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-saffron-500 to-coral-500 text-white shadow">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <p className="text-[12.5px] leading-relaxed text-ink-700 sm:text-[13.5px]">
                {data.affirmation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTINUE */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => speakingDone && selectedZone && onComplete?.({ activity: 'impulse-meter', zoneId: selectedZone.id })}
          disabled={!speakingDone || !selectedZone}
          className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500 px-5 py-2 text-[12px] font-bold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Continue
        </button>
      </div>
    </div>
  );
}

/* ===========================================================================
 * Zone card strip — five zone cards in a row.
 * =========================================================================== */
function ZoneCardStrip({ zones, selectedIdx, onPick }) {
  const hasSelection = selectedIdx != null;
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {zones.map((zone, i) => {
        const isSelected = i === selectedIdx;
        const isDimmed = hasSelection && !isSelected;
        const Icon = ZONE_ICON[zone.icon];
        return (
          <motion.button
            key={zone.id}
            type="button"
            onClick={() => onPick(i)}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: isDimmed ? 0.5 : 1,
              y: 0,
              scale: isSelected ? 1.04 : isDimmed ? 0.96 : 1,
            }}
            transition={{
              delay: 0.05 + i * 0.06,
              type: 'spring',
              stiffness: 280,
              damping: 22,
            }}
            whileHover={!isSelected ? { y: -3, scale: 1.02 } : {}}
            whileTap={{ scale: 0.97 }}
            className={[
              'group relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl p-2 text-center transition-all sm:p-3',
              'ring-1 shadow-md',
              isSelected
                ? `bg-gradient-to-br ${zone.gradient} text-white ring-2 ${zone.ring} shadow-xl`
                : 'bg-white text-ink-900 ring-ink-300/20 hover:ring-ink-300/40',
            ].join(' ')}
          >
            {/* Soft shimmer when selected */}
            {isSelected && (
              <motion.span
                aria-hidden
                initial={{ x: '-120%' }}
                animate={{ x: '120%' }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            )}

            {/* Large illustrative lucide icon as a watermark behind the
               emoji. Soft opacity so the emoji stays the focal point
               but the card reads as designed, not just emoji + label. */}
            {Icon && (
              <motion.span
                aria-hidden
                animate={isSelected ? { rotate: [0, -4, 4, 0], scale: 1 } : { rotate: 0, scale: 1 }}
                transition={isSelected ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}
                className={[
                  'pointer-events-none absolute -right-2 -top-2 sm:-right-3 sm:-top-3',
                  isSelected ? 'text-white/30' : `${zone.accent} opacity-25`,
                ].join(' ')}
              >
                <Icon className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2} />
              </motion.span>
            )}

            {/* Sparkle burst on selection */}
            <AnimatePresence>
              {isSelected && (
                <SparkleBurst key={`spark-${zone.id}`} />
              )}
            </AnimatePresence>

            <motion.span
              className="relative text-2xl sm:text-3xl"
              animate={isSelected ? { scale: [1, 1.25, 1.1], rotate: [0, -4, 4, 0] } : { scale: 1 }}
              transition={isSelected ? { duration: 0.6 } : { duration: 0.3 }}
            >
              {zone.emoji}
            </motion.span>
            <span className={[
              'relative text-[10px] font-bold leading-tight sm:text-[11px]',
              isSelected ? 'text-white/95' : 'text-ink-900',
            ].join(' ')}>
              {zone.short}
            </span>

            {/* Selected check stamp */}
            {isSelected && (
              <motion.span
                aria-hidden
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-ink-900 shadow"
              >
                <Check className="h-3 w-3" strokeWidth={3.2} />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ===========================================================================
 * Meter bar — continuous gradient with a moving marker pip.
 * =========================================================================== */
function MeterBar({ markerPct, selectedZone, totalZones }) {
  return (
    <div className="relative pt-2">
      {/* Bar — softly gradient from rose to teal */}
      <div className="relative h-2 overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-500 to-teal-500 ring-1 ring-ink-300/15 sm:h-2.5">
        {/* Optional white fill that grows up to the marker pos for "progress" feel */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-white/20 mix-blend-overlay"
          animate={{ width: `${markerPct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        />
        {/* Zone tick marks */}
        {Array.from({ length: totalZones - 1 }).map((_, i) => (
          <span
            key={`tick-${i}`}
            aria-hidden
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-white/45 sm:h-4"
            style={{ left: `${((i + 1) / totalZones) * 100}%` }}
          />
        ))}
      </div>

      {/* Marker pip — slides to the selected zone's centre with spring */}
      <motion.div
        className="absolute top-0 -translate-x-1/2"
        animate={{ left: `${markerPct}%` }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <motion.div
          animate={selectedZone ? { scale: [1, 1.15, 1] } : { scale: [1, 1.05, 1] }}
          transition={selectedZone ? { duration: 0.4 } : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className={[
            'mt-[-3px] grid h-5 w-5 place-items-center rounded-full text-[9px] font-extrabold text-white shadow-lg ring-2 ring-white sm:h-6 sm:w-6 sm:mt-[-5px]',
            selectedZone ? `bg-gradient-to-br ${selectedZone.gradient}` : 'bg-gradient-to-br from-ink-500 to-ink-900',
          ].join(' ')}
        >
          {selectedZone ? '✓' : ''}
        </motion.div>
      </motion.div>

      {/* Floating "Pick a zone" hint before any selection */}
      <AnimatePresence>
        {!selectedZone && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-ink-500"
          >
            <motion.span
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </motion.span>
            Pick a zone above to lock it in
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===========================================================================
 * Personality card — morphs per selection.
 * =========================================================================== */
function PersonalityCard({ zone, selectedIdx, totalZones }) {
  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {zone ? (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${zone.gradient} p-4 text-white shadow-xl ring-1 ring-white/20 sm:p-5`}
          >
            {/* Soft shimmer sweep */}
            <motion.span
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/22 to-transparent"
            />
            <div className="relative flex items-start gap-3 sm:gap-4">
              <motion.span
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl ring-1 ring-white/30 backdrop-blur-sm sm:h-16 sm:w-16 sm:text-4xl"
              >
                {zone.emoji}
              </motion.span>
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] opacity-90">
                  Zone {selectedIdx + 1} of {totalZones}
                </div>
                <div className="mt-0.5 text-[16px] font-extrabold leading-tight sm:text-[18px]">
                  "{zone.label}"
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed opacity-95 sm:text-[13.5px]">
                  {zone.vibe}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-gradient-to-br from-ink-300/15 to-ink-300/5 p-4 text-center text-[12.5px] font-semibold text-ink-500 ring-1 ring-ink-300/20 sm:p-5"
          >
            Your zone will appear here with a little reflection — tap any card above to pick.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===========================================================================
 * SparkleBurst — six tiny dots fly outward from the card centre on select.
 * Used inside the absolutely-positioned zone card.
 * =========================================================================== */
function SparkleBurst() {
  const seeds = Array.from({ length: 6 }, (_, k) => ({
    id: k,
    dx: Math.cos((k * 60) * Math.PI / 180) * 28,
    dy: Math.sin((k * 60) * Math.PI / 180) * 28,
    delay: 0.02 + k * 0.04,
  }));
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {seeds.map((s) => (
        <motion.span
          key={s.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
          animate={{ opacity: [0, 1, 0], x: s.dx, y: s.dy, scale: [0.3, 1, 0.6] }}
          transition={{ duration: 0.7, delay: s.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-white"
        />
      ))}
    </span>
  );
}
