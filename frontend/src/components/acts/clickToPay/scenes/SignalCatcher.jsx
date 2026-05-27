import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, AlertTriangle } from 'lucide-react';

/**
 * 5-second reaction event. Falling Wi-Fi / warning icons drift down the
 * screen; the learner taps them to "stabilise" the signal. Designed to
 * be impossible to fully stabilise — the narrative says signals keep
 * falling — so we just count taps and report them back. Always
 * resolves after `seconds` seconds even if the learner does nothing.
 */
export default function SignalCatcher({ seconds = 5, target = 6, onDone }) {
  const [tapped, setTapped] = useState(0);
  const [tick, setTick] = useState(0);
  const [items, setItems] = useState([]);
  const startedAtRef = useRef(Date.now());
  const doneRef = useRef(false);

  // Spawn a new icon every ~600 ms
  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => [
        ...prev.filter((i) => Date.now() - i.spawnedAt < 3000),
        {
          id: Math.random().toString(36).slice(2),
          x: 6 + Math.random() * 84,                 // %
          delay: Math.random() * 0.25,
          kind: Math.random() > 0.45 ? 'wifi' : 'warn',
          spawnedAt: Date.now(),
        },
      ]);
    }, 600);
    return () => clearInterval(id);
  }, []);

  // 100 ms wall-clock tick for the timer ring + remaining label
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.min(seconds * 1000, Date.now() - startedAtRef.current);
  const remaining = Math.max(0, seconds - Math.floor(elapsed / 1000));
  const pct = Math.min(100, (elapsed / (seconds * 1000)) * 100);

  // Resolve when time runs out
  useEffect(() => {
    if (doneRef.current) return;
    if (elapsed >= seconds * 1000) {
      doneRef.current = true;
      onDone?.({ tapped, target });
    }
  }, [elapsed, seconds, onDone, tapped, target]);

  const tap = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTapped((n) => n + 1);
  };

  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a0f3a] to-[#3a0f3a] ring-1 ring-cyan-400/30 sm:h-[300px]">
      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-200">
          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
          Signal instability
        </div>
        <div className="flex items-center gap-2 text-xs text-cyan-100">
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5">Caught {tapped}/{target}</span>
          <span className="font-mono">{remaining}s</span>
        </div>
      </div>
      {/* Progress bar (timer) */}
      <div className="relative mx-4 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 bg-cyan-300"
          style={{ width: `${pct}%`, transition: 'width 0.1s linear' }}
        />
      </div>
      {/* Falling icons */}
      <AnimatePresence>
        {items.map((it) => (
          <motion.button
            key={it.id}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 260, opacity: 1 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 2.4, delay: it.delay, ease: 'easeIn' }}
            onClick={() => tap(it.id)}
            style={{ left: `${it.x}%` }}
            className={`absolute top-12 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full ring-2 transition active:scale-90 ${
              it.kind === 'warn'
                ? 'bg-rose-500/20 text-rose-200 ring-rose-400/50'
                : 'bg-cyan-500/20 text-cyan-200 ring-cyan-400/50'
            }`}
            aria-label="Tap to stabilise"
          >
            {it.kind === 'warn' ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Wifi className="h-5 w-5" />
            )}
          </motion.button>
        ))}
      </AnimatePresence>
      {tick === 0 && null /* keeps lint happy about tick read */}
      {/* CTA hint */}
      <div className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[11px] text-white/70">
        Tap as many falling icons as you can
      </div>
    </div>
  );
}
