import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

/* Deterministic shuffle so the order stays stable across re-renders
 * (otherwise every state update would reshuffle the bubbles and they'd
 * jump around mid-game). Uses a tiny seeded LCG keyed by the first
 * thought's id, so each lesson gets its own scramble but it's locked. */
function shuffleStable(arr, seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Mind Trap Board — Act 2's "Rebuild Shanaya's Thought Spiral" game.
 *
 *   12 floating thought bubbles → 4 colour-coded Mind Trap Zones.
 *   Each zone takes exactly 3 thoughts; correct drops glow + tick the
 *   zone, wrong drops shake the bubble and snap it back. A progress
 *   bar at the top fills 0/12 → 12/12. Once all 12 are placed the
 *   `onComplete` button reveals.
 *
 * Interaction model:
 *   • Desktop — native HTML5 drag-and-drop. The bubble is set as the
 *     drag image; each zone implements onDragOver + onDrop.
 *   • Mobile — taps. Tap a bubble to select (it glows), then tap a
 *     zone to drop it. This sidesteps the lack of HTML5 drag on touch.
 *
 * Props (mirrors DragMatchBoard so Act2.jsx can route to it):
 *   data           — the `mindTrap` block from act2Activities
 *   onCueClick     — chip-tap sound
 *   onCueCorrect   — correct drop sound
 *   onCueWrong     — wrong drop sound
 *   onSpeakPrompt  — pipes the title/instruction to TTS once
 *   speakingDone   — true when no TTS is in flight (gates Continue btn)
 *   onComplete     — called once with `{ activity: 'mind-trap' }`
 */
export default function MindTrapBoard({
  data,
  onCueClick,
  onCueCorrect,
  onCueWrong,
  onSpeakPrompt,
  speakingDone = true,
  onComplete,
}) {
  /* Per-thought placement: undefined = still floating; otherwise the
   * id of the zone it's currently inside (correctly or not). */
  const [placed, setPlaced] = useState(() => ({}));
  /* The id of the bubble the learner has tap-selected (mobile flow). */
  const [selectedId, setSelectedId] = useState(null);
  /* Per-thought attempt status: 'correct' shows a check + glow; 'wrong'
   * triggers the shake-and-return animation. */
  const [attempt, setAttempt] = useState({});
  /* Speak the prompt once on mount so TTS reads the instructions aloud. */
  const [introSpoken, setIntroSpoken] = useState(false);
  if (!introSpoken && onSpeakPrompt) {
    setIntroSpoken(true);
    onSpeakPrompt(`${data.title}. ${data.instruction}`);
  }

  const placedCount = useMemo(
    () => Object.values(placed).filter(Boolean).length,
    [placed],
  );
  const total = data.thoughts.length;
  const done = placedCount === total;

  /* Shuffle once on mount so the floating bubbles aren't lined up in
   * zone-matching order (fomo-1, fomo-2, fomo-3, sug-1…). Keyed by the
   * first id so the order is stable across re-renders. */
  const shuffledThoughts = useMemo(
    () => shuffleStable(data.thoughts, data.thoughts[0]?.id || 'mind-trap'),
    [data.thoughts],
  );

  const handleDrop = (zoneId, thoughtId) => {
    if (placed[thoughtId]) return;
    const thought = data.thoughts.find((t) => t.id === thoughtId);
    if (!thought) return;
    const correct = thought.zone === zoneId;
    if (correct) {
      onCueCorrect?.();
      setPlaced((p) => ({ ...p, [thoughtId]: zoneId }));
      setAttempt((a) => ({ ...a, [thoughtId]: 'correct' }));
    } else {
      onCueWrong?.();
      setAttempt((a) => ({ ...a, [thoughtId]: 'wrong' }));
      // Clear the wrong state after the shake animation so the bubble
      // becomes draggable again without lingering red ring.
      setTimeout(() => {
        setAttempt((a) => {
          const next = { ...a };
          delete next[thoughtId];
          return next;
        });
      }, 700);
    }
    setSelectedId(null);
  };

  const handleSelect = (thoughtId) => {
    if (placed[thoughtId]) return;
    onCueClick?.();
    setSelectedId((cur) => (cur === thoughtId ? null : thoughtId));
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-500">
          🎮 Game · Drag the thoughts
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{data.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-700 sm:text-[14px]">
          {data.instruction}
        </p>
        {data.hint && (
          <p className="mt-1 text-[11.5px] italic text-ink-500">{data.hint}</p>
        )}
      </header>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-ink-500">
          <span>Thoughts placed</span>
          <span>{placedCount} / {total}</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-300/20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(placedCount / total) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-saffron-500 via-coral-500 to-burgundy-500"
          />
        </div>
      </div>

      {/* Four mind-trap zones — moved to the TOP so the learner sees the
         buckets first and reads the floating thoughts knowing where
         each one might land. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.zones.map((zone) => {
          const captured = data.thoughts.filter(
            (t) => placed[t.id] === zone.id && t.zone === zone.id,
          );
          const filled = captured.length;
          const totalForZone = data.thoughts.filter((t) => t.zone === zone.id).length;
          const isFull = filled === totalForZone;
          return (
            <div
              key={zone.id}
              onClick={() => {
                if (selectedId) handleDrop(zone.id, selectedId);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/thought-id');
                if (id) handleDrop(zone.id, id);
              }}
              className={[
                'group relative cursor-pointer overflow-hidden rounded-2xl p-3 transition',
                'ring-1',
                isFull
                  ? `${zone.bg} ring-2 ${zone.ring}`
                  : 'bg-cream-50 ring-ink-300/20 hover:ring-saffron-500/40',
              ].join(' ')}
            >
              {/* Glow when full */}
              {isFull && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${zone.accent} opacity-[0.08]`}
                />
              )}

              <div className="relative flex items-center gap-2">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br ${zone.accent} text-base text-white shadow-sm`}>
                  {zone.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`text-[12px] font-extrabold uppercase tracking-wider ${zone.tone}`}>
                    {zone.shortLabel}
                  </div>
                  <div className="text-[11.5px] font-semibold text-ink-700 truncate">
                    {zone.label}
                  </div>
                </div>
                <span className={`text-[11px] font-bold ${zone.tone}`}>
                  {filled}/{totalForZone}
                </span>
              </div>

              {/* Captured thought chips inside the zone */}
              <AnimatePresence>
                {captured.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative mt-2 flex flex-col gap-1.5"
                  >
                    {captured.map((t) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-start gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-900 ring-1 ${zone.ring} shadow-sm`}
                      >
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${zone.tone}`} strokeWidth={2.8} />
                        <span className="leading-snug">{t.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Floating thoughts pool — bubbles are shuffled to random order
         and absolutely positioned on hand-scattered coordinates so they
         look like they're flying across the whole sky, not lined up by
         zone. Container scales by breakpoint: smaller on phones, taller
         on desktop. Each bubble caps at ~200 px so long texts wrap. */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
          💭 Shanaya's thoughts
        </div>
        <div className="relative mt-2 min-h-[420px] overflow-hidden rounded-2xl bg-gradient-to-b from-cream-50 to-white p-2 ring-1 ring-ink-300/15 sm:min-h-[460px] md:min-h-[500px] lg:min-h-[540px]">
          {/* Light 3D bubbles behind the thought chips — soft pastel
             palette so the chip text on top stays readable. Drifts
             gently like the left panel but with lower opacity. */}
          <LightBubblesBackdrop />
          {shuffledThoughts.map((t, i) => {
            const isPlaced = !!placed[t.id];
            const isSelected = selectedId === t.id;
            const isWrong = attempt[t.id] === 'wrong';
            if (isPlaced) return null;
            // Scattered positions in % — placed by hand so no two
            // bubbles share the same row. The bottom row is pulled up
            // to ~76% so the longest bubbles never overflow the box.
            const positions = [
              { top: 2,  left: 8  },
              { top: 10, left: 54 },
              { top: 20, left: 28 },
              { top: 26, left: 70 },
              { top: 36, left: 4  },
              { top: 44, left: 44 },
              { top: 50, left: 68 },
              { top: 58, left: 18 },
              { top: 64, left: 50 },
              { top: 70, left: 6  },
              { top: 74, left: 36 },
              { top: 78, left: 66 },
            ];
            const pos = positions[i] || positions[0];
            // Each bubble flies on a unique loop — duration + delay + drift
            // amplitudes vary so the pool feels alive instead of synced.
            const dur = 5 + ((i * 7) % 5);          // 5–9 s
            const delay = (i * 0.33) % 4;
            const dy = 10 + (i % 4) * 4;             // 10–22 px vertical sway
            const dx = 8 + ((i + 1) % 3) * 6;        // 8–20 px horizontal sway
            const floatAnim = (isSelected || isWrong)
              ? (isWrong
                  ? { x: [0, -10, 10, -8, 8, -4, 4, 0], y: 0 }
                  : { x: 0, y: 0 })
              : {
                  y: [0, -dy, dy / 2, -dy / 3, 0],
                  x: [0, dx, -dx / 2, dx / 3, 0],
                  rotate: [0, (i % 2 ? 2 : -2), 0, (i % 2 ? -1 : 1), 0],
                };
            const floatTransition = (isSelected || isWrong)
              ? (isWrong ? { duration: 0.5 } : { duration: 0.2 })
              : { duration: dur, repeat: Infinity, ease: 'easeInOut', delay };
            return (
              <motion.button
                key={t.id}
                draggable
                onClick={() => handleSelect(t.id)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/thought-id', t.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setSelectedId(t.id);
                }}
                onDragEnd={() => setSelectedId(null)}
                animate={floatAnim}
                transition={floatTransition}
                style={{ top: `${pos.top}%`, left: `${pos.left}%`, maxWidth: '210px' }}
                className={[
                  'absolute cursor-grab select-none rounded-2xl px-2.5 py-1.5 text-[11.5px] font-semibold leading-snug transition-colors active:cursor-grabbing sm:px-3 sm:py-2 sm:text-[12px]',
                  'ring-1 ring-ink-300/20 shadow-md',
                  isSelected
                    ? 'bg-saffron-500 text-ink-900 ring-2 ring-saffron-500/80 shadow-lg z-10'
                    : isWrong
                      ? 'bg-burgundy-500/15 text-burgundy-500 ring-2 ring-burgundy-500/60 z-10'
                      : 'bg-white text-ink-900 hover:ring-saffron-500/40',
                ].join(' ')}
              >
                💭 {t.text}
              </motion.button>
            );
          })}

          {/* Small, low-contrast Skip link tucked into the bottom-right —
             gives the learner an out without competing for attention. */}
          {!done && onComplete && (
            <button
              type="button"
              onClick={() => speakingDone && onComplete()}
              disabled={!speakingDone}
              className="absolute bottom-1.5 right-2 z-20 text-[10px] font-medium uppercase tracking-wider text-ink-500/60 underline-offset-2 transition hover:text-ink-700 hover:underline disabled:opacity-40"
            >
              skip
            </button>
          )}
        </div>
        {placedCount < total && (
          <p className="mt-2 text-[11px] text-ink-500">
            {selectedId
              ? '👆 Now tap a zone above to drop it.'
              : 'Grab a floating bubble and drag it up to a zone — or tap it, then tap a zone.'}
          </p>
        )}
      </div>

      {/* Continue once all 12 placed */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-stretch gap-2 rounded-2xl bg-gradient-to-br from-saffron-500/15 to-coral-500/10 p-3 ring-1 ring-saffron-500/30 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-600">
                ✨ Spiral mapped
              </div>
              <div className="mt-0.5 text-[13px] font-semibold text-ink-900">
                Every thought lands on one of these four traps. That's how the cart filled up.
              </div>
            </div>
            <button
              type="button"
              onClick={() => speakingDone && onComplete?.()}
              disabled={!speakingDone}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-saffron-500 px-5 py-2.5 text-xs font-bold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Soft pastel 3D bubbles that live BEHIND the 12 thought chips. The
 * radial-gradient + inset shadow combo sells the same "glossy marble"
 * look used in the left panel, but with washed-out pastel tints so the
 * chip text on top stays sharp and legible. Pointer-events:none so the
 * decorative layer never blocks drag-and-drop. */
function LightBubblesBackdrop() {
  const PALETTES = [
    { base: '#FDE7B6', shade: '#E9B656' }, // light saffron
    { base: '#FFCFC5', shade: '#E08577' }, // light coral
    { base: '#E8D0DA', shade: '#B777A0' }, // light burgundy/rose
    { base: '#BFEFE3', shade: '#62B7A0' }, // light teal/mint
    { base: '#F8C6E2', shade: '#D275AE' }, // light pink
    { base: '#D6CCF7', shade: '#9A85E0' }, // light lavender
  ];
  const bubbles = Array.from({ length: 14 }, (_, i) => {
    const palette = PALETTES[i % PALETTES.length];
    const size = 28 + ((i * 17) % 56);                  // 28–84 px
    return {
      palette,
      size,
      top:  3 + ((i * 29 + 11) % 88),                   // 3–91 %
      left: 3 + ((i * 47 + 9)  % 88),                   // 3–91 %
      dur:  8 + ((i * 5) % 6),                          // 8–13 s
      delay: (i * 0.41) % 5,
      dx: 18 + ((i + 1) % 4) * 9,                       // 18–45 px
      dy: 22 + ((i + 2) % 4) * 11,                      // 22–55 px
      baseOpacity: 0.35,
      peakOpacity: 0.55,
    };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: [b.baseOpacity, b.peakOpacity, b.baseOpacity],
            y: [0, -b.dy, b.dy / 2, -b.dy / 3, 0],
            x: [0, b.dx, -b.dx / 2, b.dx / 3, 0],
            scale: [1, 1.12, 0.95, 1.06, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
          style={{
            top: `${b.top}%`,
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92) 0%, ${b.palette.base} 42%, ${b.palette.shade} 100%)`,
            boxShadow: `0 8px 18px -4px ${b.palette.shade}40, inset -3px -4px 8px ${b.palette.shade}55, inset 3px 4px 6px rgba(255,255,255,0.55)`,
          }}
          className="absolute rounded-full"
        >
          {/* Specular highlight dot — top-left, slightly blurred. */}
          <span
            aria-hidden
            className="absolute rounded-full bg-white"
            style={{
              top:    `${Math.max(3, b.size * 0.13)}px`,
              left:   `${Math.max(3, b.size * 0.18)}px`,
              width:  `${Math.max(4, b.size * 0.18)}px`,
              height: `${Math.max(4, b.size * 0.18)}px`,
              opacity: 0.78,
              filter: 'blur(0.6px)',
            }}
          />
        </motion.span>
      ))}
    </div>
  );
}
