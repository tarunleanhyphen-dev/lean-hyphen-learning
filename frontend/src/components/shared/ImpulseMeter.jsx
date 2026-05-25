import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

/**
 * Act 4's Impulse Meter — a 5-zone self-snapshot slider.
 *
 * The student picks where they usually land right before tapping
 * "Buy" on a continuum from "I go with the moment" → "I pause and
 * choose". No right answer; the act is reflective, not assessment-
 * driven. After picking a zone:
 *   – the meter's coloured marker animates to that zone
 *   – an affirmation card slides in ("…and that's okay. Awareness…")
 *   – the Continue button enables
 *
 * Props mirror the other activity components so Act4.jsx routes to
 * it uniformly:
 *   data         — the `meter` block from act4Activities
 *   onCueClick   — light tap cue when a zone is picked
 *   onSpeakPrompt— pipes the meter's title/instruction to TTS (called
 *                  once on mount)
 *   speakingDone — true when no TTS in flight (gates Continue)
 *   onComplete   — called with { activity: 'impulse-meter', zoneId }
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

  const total = data.zones.length;
  const selectedZone = selectedIdx != null ? data.zones[selectedIdx] : null;
  // Marker position as a 0-100 % along the bar, centred on its zone.
  const markerPct = selectedIdx != null
    ? ((selectedIdx + 0.5) / total) * 100
    : null;

  const handleSelect = (i) => {
    if (selectedIdx === i) return;
    onCueClick?.();
    setSelectedIdx(i);
  };

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

      {/* The gradient meter bar — red→amber→green from impulse to
         mindful. The marker moves with framer-motion's spring; idle
         markers (the dots above each zone) glow on hover. */}
      <div className="relative mt-2 pb-2 pt-8 sm:pt-10">
        {/* The bar itself */}
        <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-burgundy-500 via-coral-500 via-saffron-500 to-emerald-500 shadow-inner ring-1 ring-ink-300/20 sm:h-3.5">
          {/* Zone tick marks behind the marker */}
          {data.zones.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/40"
              style={{ left: `${((i + 0.5) / total) * 100}%` }}
            />
          ))}
        </div>

        {/* Sliding marker */}
        <AnimatePresence>
          {markerPct !== null && (
            <motion.div
              key="marker"
              initial={{ opacity: 0, scale: 0.6, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0, left: `${markerPct}%` }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${markerPct}%` }}
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-base shadow-lg ring-2 ring-saffron-500 sm:h-10 sm:w-10 sm:text-lg">
                {selectedZone.emoji}
              </div>
              {/* Small downward tick connecting marker to bar */}
              <span
                aria-hidden
                className="absolute left-1/2 top-full h-2 w-0.5 -translate-x-1/2 bg-saffron-500"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5 zone buttons — single-row on tablet+, scroll-snap on phone */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {data.zones.map((zone, i) => {
          const isSelected = i === selectedIdx;
          return (
            <motion.button
              key={zone.id}
              type="button"
              onClick={() => handleSelect(i)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.06, duration: 0.35 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={[
                'group relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl p-2 text-center transition-all sm:p-2.5',
                'ring-1 shadow-sm',
                isSelected
                  ? 'bg-gradient-to-br from-saffron-500/15 to-coral-500/15 ring-2 ring-saffron-500 shadow-saffron-500/30'
                  : 'bg-white ring-ink-300/20 hover:ring-saffron-500/40',
              ].join(' ')}
            >
              {/* Faint gradient corner glow when selected */}
              {isSelected && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-saffron-500/10 to-coral-500/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <span className="relative text-2xl sm:text-3xl">{zone.emoji}</span>
              <span className="relative text-[10px] font-bold leading-tight text-ink-900 sm:text-[11px]">
                {zone.short}
              </span>
              {/* Pip dot showing selection */}
              <span
                aria-hidden
                className={[
                  'mt-0.5 h-1.5 w-1.5 rounded-full transition-colors',
                  isSelected ? 'bg-saffron-500' : 'bg-ink-300/40',
                ].join(' ')}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Affirmation card — appears once a zone is picked */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            key={`affirm-${selectedZone.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-saffron-500/15 via-coral-500/10 to-teal-500/10 p-4 ring-1 ring-saffron-500/30"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron-500 to-coral-500 text-base text-white shadow">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-saffron-600">
                  You placed yourself here
                </div>
                <div className="text-[14px] font-extrabold leading-tight text-ink-900 sm:text-[15px]">
                  {selectedZone.label}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700 sm:text-[13.5px]">
              {data.affirmation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue */}
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
