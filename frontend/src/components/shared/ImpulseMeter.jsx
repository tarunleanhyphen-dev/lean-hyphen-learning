import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

/**
 * Act 4's Impulse Meter — a real speedometer-style gauge.
 *
 * Design (research-informed mash of automotive dashboard gauges +
 * Duolingo's celebration animations + Apple Health rings):
 *   – Semicircular SVG dial with 5 colour-graded segments (red →
 *     amber → green) representing the impulse-to-mindful axis.
 *   – Spring-loaded needle that swings to the chosen zone with real
 *     physics (damped oscillation; settles with a tiny wobble — the
 *     "this is a real instrument" feel).
 *   – Selected segment pulses with a coloured outer glow.
 *   – Emojis float around the arc as zone landmarks.
 *   – Idle pulse on the central hub keeps the dial feeling "alive"
 *     before any selection.
 *   – On selection: a burst of 6 sparkle particles flies out from
 *     the chosen segment, and a big readout card slides in below.
 *
 * Props mirror the previous ImpulseMeter signature so Act4.jsx
 * routes to it without changes.
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

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-500">
          🎯 Impulse Meter · how do you usually decide?
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">
          {data.title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-700 sm:text-[14px]">
          {data.instruction}
        </p>
      </header>

      {/* THE DIAL */}
      <DialMeter
        zones={data.zones}
        selectedIdx={selectedIdx}
        onPick={handleSelect}
      />

      {/* Big readout — the selected zone in a coloured card */}
      <SelectedZoneCard
        zone={selectedZone}
        totalZones={totalZones}
        selectedIdx={selectedIdx}
      />

      {/* Affirmation — appears once a zone is locked in */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            key="affirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-saffron-500/15 via-coral-500/10 to-teal-500/10 p-3 ring-1 ring-saffron-500/30 sm:p-4"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron-500 to-coral-500 text-base text-white shadow">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-saffron-600">
                Locked in
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

/* ===========================================================================
 * The dial itself — pure SVG with framer-motion-animated needle + glow.
 * =========================================================================== */
function DialMeter({ zones, selectedIdx, onPick }) {
  // ----- Geometry constants ----------------------------------------------
  const N = zones.length;
  const cx = 200;
  const cy = 200;       // baseline (arc opens upward from here)
  const outerR = 165;
  const innerR = 105;
  const labelR = 132;   // emoji ring radius
  const needleR = 158;  // needle tip radius
  const spanDeg = 180 / N;

  // Per-segment colours from red (impulsive) to emerald (mindful).
  const segmentTone = [
    { mid: '#fca5a5', edge: '#dc2626', glow: 'rgba(220, 38, 38, 0.9)' },
    { mid: '#fdba74', edge: '#ea580c', glow: 'rgba(234, 88, 12, 0.9)' },
    { mid: '#fde68a', edge: '#ca8a04', glow: 'rgba(202, 138, 4, 0.9)' },
    { mid: '#bef264', edge: '#65a30d', glow: 'rgba(101, 163, 13, 0.9)' },
    { mid: '#86efac', edge: '#059669', glow: 'rgba(5, 150, 105, 0.95)' },
  ];

  // Idle: park needle at leftmost zone centre (zone 0). Once a zone is
  // picked, swing to that zone's centre with a spring.
  const targetMathAngle = selectedIdx != null
    ? 180 - (selectedIdx + 0.5) * spanDeg
    : 180 - 0.5 * spanDeg;
  // SVG rotates clockwise for positive degrees (y-flipped). Needle's natural
  // pose points straight up (math 90°) at rotate=0 — so rotation needed is
  // `90 - mathAngle` (turn the needle from "up" to "math angle").
  const needleRotation = 90 - targetMathAngle;

  // Idle "looking around" wobble of the needle BEFORE any selection — a
  // subtle ±3° drift that signals "I'm waiting for you to pick".
  const idleWobble = selectedIdx == null
    ? { rotate: [needleRotation - 3, needleRotation + 3, needleRotation - 3] }
    : { rotate: needleRotation };

  const idleTransition = selectedIdx == null
    ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
    : { type: 'spring', stiffness: 70, damping: 8, mass: 1.4 };

  // Pre-compute zone geometry once.
  const zoneGeom = useMemo(() => zones.map((zone, i) => {
    const startDeg = 180 - i * spanDeg;
    const endDeg = startDeg - spanDeg;
    const centreDeg = (startDeg + endDeg) / 2;
    const segPath = arcSegmentPath(cx, cy, outerR, innerR, startDeg, endDeg);
    const glowPath = arcSegmentPath(cx, cy, outerR + 6, innerR - 6, startDeg, endDeg);
    const emoji = pt(cx, cy, labelR, centreDeg);
    return { zone, i, startDeg, endDeg, centreDeg, segPath, glowPath, emojiPos: emoji };
  }), [zones, spanDeg]);

  // Sparkle burst — six tiny dots that fly outward from the selected zone's
  // emoji position. Keyed by selectedIdx so it remounts (= replays) on every
  // new selection.
  const sparkleSeeds = useMemo(() => Array.from({ length: 6 }, (_, k) => ({
    id: k,
    angle: (k * 60 + (k * 13) % 30) * (Math.PI / 180),
    dist: 28 + (k * 11) % 18,
    delay: k * 0.04,
  })), []);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <svg viewBox="0 0 400 240" className="w-full" role="img" aria-label="Impulse Meter dial">
        <defs>
          {/* Per-segment radial gradients — saturated at the rim, softer in. */}
          {segmentTone.map((c, i) => (
            <radialGradient key={i} id={`meter-fill-${i}`} cx="50%" cy="100%" r="120%">
              <stop offset="0%" stopColor={c.mid} stopOpacity="0.55" />
              <stop offset="65%" stopColor={c.mid} stopOpacity="0.92" />
              <stop offset="100%" stopColor={c.edge} stopOpacity="0.98" />
            </radialGradient>
          ))}
          {/* Soft blur for selected-segment outer glow. */}
          <filter id="meter-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          {/* Inner-hub gradient (3D ball look). */}
          <radialGradient id="meter-hub" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#3d2858" stopOpacity="1" />
            <stop offset="100%" stopColor="#0c0617" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Soft tinted card behind the dial */}
        <rect x="4" y="14" width="392" height="218" rx="22" fill="#FBF4FF" />
        <rect x="4" y="14" width="392" height="218" rx="22" fill="rgba(244, 236, 254, 0.4)" />

        {/* Outer "bezel" arc — thin dark ring just outside the segments
            for a metallic feel. */}
        <path
          d={arcRingPath(cx, cy, outerR + 5, outerR + 8, 180, 0)}
          fill="#1A1426"
          opacity="0.18"
        />

        {/* Inner "bezel" arc — thin ring just inside the segments. */}
        <path
          d={arcRingPath(cx, cy, innerR - 4, innerR - 1, 180, 0)}
          fill="#1A1426"
          opacity="0.18"
        />

        {/* Pulsing glow behind the selected segment. */}
        <AnimatePresence>
          {selectedIdx != null && (
            <motion.path
              key={`glow-${selectedIdx}`}
              d={zoneGeom[selectedIdx].glowPath}
              fill={segmentTone[selectedIdx].glow}
              filter="url(#meter-glow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.85, 0.4] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        {/* Coloured segments */}
        {zoneGeom.map(({ zone, i, segPath }) => {
          const isSelected = i === selectedIdx;
          const dim = selectedIdx != null && !isSelected;
          return (
            <motion.path
              key={zone.id}
              d={segPath}
              fill={`url(#meter-fill-${i})`}
              initial={false}
              animate={{ opacity: dim ? 0.4 : isSelected ? 1 : 0.92 }}
              transition={{ duration: 0.35 }}
              onClick={() => onPick(i)}
              whileHover={{ opacity: 1, scale: 1.005 }}
              style={{ cursor: 'pointer', transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}

        {/* Zone separator tick marks — thin white lines between segments. */}
        {Array.from({ length: N + 1 }).map((_, i) => {
          const a = 180 - i * spanDeg;
          const a1 = pt(cx, cy, innerR + 2, a);
          const a2 = pt(cx, cy, outerR - 2, a);
          return (
            <line
              key={`tick-${i}`}
              x1={a1.x}
              y1={a1.y}
              x2={a2.x}
              y2={a2.y}
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeOpacity="0.55"
              pointerEvents="none"
            />
          );
        })}

        {/* Zone emojis */}
        {zoneGeom.map(({ zone, i, emojiPos }) => {
          const isSelected = i === selectedIdx;
          return (
            <motion.g
              key={`emo-${zone.id}`}
              style={{ transformOrigin: `${emojiPos.x}px ${emojiPos.y}px`, transformBox: 'fill-box' }}
              animate={isSelected ? { scale: [1, 1.25, 1.12] } : { scale: 1 }}
              transition={isSelected ? { duration: 0.6 } : { duration: 0.3 }}
            >
              <text
                x={emojiPos.x}
                y={emojiPos.y}
                fontSize="26"
                textAnchor="middle"
                dominantBaseline="middle"
                pointerEvents="none"
              >
                {zone.emoji}
              </text>
            </motion.g>
          );
        })}

        {/* Needle (rotates around the hub) */}
        <g transform={`translate(${cx} ${cy})`}>
          <motion.g
            initial={{ rotate: needleRotation - 8 }}
            animate={idleWobble}
            transition={idleTransition}
          >
            {/* Needle shaft — tapered, with a soft drop shadow */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-needleR + 8}
              stroke="#1A1426"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.35"
              transform="translate(1.5 2)"
            />
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-needleR + 8}
              stroke="#1A1426"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Needle tip */}
            <polygon
              points={`-5,${-needleR + 14} 0,${-needleR + 2} 5,${-needleR + 14}`}
              fill="#1A1426"
            />
            <polygon
              points={`-2.5,${-needleR + 13} 0,${-needleR + 4} 2.5,${-needleR + 13}`}
              fill="#FF5A4A"
            />
            {/* Counter-weight on the opposite end */}
            <circle cx={0} cy={28} r="6" fill="#1A1426" />
          </motion.g>
        </g>

        {/* Hub — 3D-style ball with an idle breathing pulse */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={18}
          fill="url(#meter-hub)"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' }}
        />
        <circle cx={cx - 4} cy={cy - 5} r="4" fill="#ffffff" opacity="0.75" />

        {/* Label below the hub */}
        <text
          x={cx}
          y={cy + 30}
          fontSize="10.5"
          fontWeight="800"
          letterSpacing="2.5"
          textAnchor="middle"
          fill="#1A1426"
          opacity="0.55"
        >
          IMPULSE METER
        </text>

        {/* Sparkle particles emitted from the selected zone */}
        <AnimatePresence>
          {selectedIdx != null && (
            <g key={`sparks-${selectedIdx}`}>
              {sparkleSeeds.map((s) => {
                const start = zoneGeom[selectedIdx].emojiPos;
                const end = {
                  x: start.x + Math.cos(s.angle) * s.dist,
                  y: start.y - Math.sin(s.angle) * s.dist,
                };
                return (
                  <motion.circle
                    key={s.id}
                    cx={start.x}
                    cy={start.y}
                    r="2.5"
                    fill={segmentTone[selectedIdx].edge}
                    initial={{ opacity: 0, cx: start.x, cy: start.y, scale: 0.4 }}
                    animate={{
                      opacity: [0, 1, 0],
                      cx: end.x,
                      cy: end.y,
                      scale: [0.4, 1, 0.6],
                    }}
                    transition={{ duration: 0.9, delay: s.delay, ease: 'easeOut' }}
                  />
                );
              })}
            </g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}

/* ===========================================================================
 * Big readout card — shows the selected zone with personality.
 * =========================================================================== */
function SelectedZoneCard({ zone, totalZones, selectedIdx }) {
  return (
    <AnimatePresence mode="wait">
      {zone ? (
        <motion.div
          key={zone.id}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-white to-cream-50 p-3 shadow-md ring-1 ring-ink-300/20 sm:p-4"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron-500 to-coral-500 text-2xl shadow-md ring-1 ring-white/40">
            {zone.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-saffron-600">
              Zone {selectedIdx + 1} of {totalZones} · {zone.short}
            </div>
            <div className="text-[15px] font-extrabold leading-tight text-ink-900 sm:text-[17px]">
              "{zone.label}"
            </div>
          </div>
          {/* Position pip — small dots showing where on the dial they landed */}
          <div className="hidden sm:flex sm:gap-1">
            {Array.from({ length: totalZones }).map((_, i) => (
              <span
                key={i}
                className={[
                  'block h-1.5 w-1.5 rounded-full transition-colors',
                  i === selectedIdx ? 'bg-saffron-500' : 'bg-ink-300/30',
                ].join(' ')}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl bg-ink-300/8 p-3 text-center text-[12.5px] font-semibold text-ink-500 ring-1 ring-ink-300/15 sm:p-4"
        >
          Tap a zone on the dial above to lock in your honest snapshot.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ===========================================================================
 * Geometry helpers
 *
 * `pt`               — polar → SVG (with y-axis flipped so positive y goes up).
 * `arcSegmentPath`   — pie-slice between two angles, outer-radius-to-inner.
 * `arcRingPath`      — thin ring from radius A to radius B between angles.
 * =========================================================================== */
function pt(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(a),
    y: cy - r * Math.sin(a),
  };
}

function arcSegmentPath(cx, cy, outerR, innerR, startDeg, endDeg) {
  // start > end (we draw clockwise visually). The arc is < 180° so
  // large-arc-flag = 0. With SVG y-flipped, visual clockwise = sweep 0.
  const p1 = pt(cx, cy, outerR, startDeg);
  const p2 = pt(cx, cy, outerR, endDeg);
  const p3 = pt(cx, cy, innerR, endDeg);
  const p4 = pt(cx, cy, innerR, startDeg);
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}
          A ${outerR} ${outerR} 0 0 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}
          L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}
          A ${innerR} ${innerR} 0 0 1 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}
          Z`;
}

function arcRingPath(cx, cy, innerR, outerR, startDeg, endDeg) {
  return arcSegmentPath(cx, cy, outerR, innerR, startDeg, endDeg);
}
