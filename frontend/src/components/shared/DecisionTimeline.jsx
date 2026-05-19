import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, Users, Timer, Truck } from 'lucide-react';
import { products } from '../../data/lessons/thinkBeforeYouSpend.js';

const TRIGGER_META = {
  plan:        { label: 'Your plan',         tone: 'good',  Icon: Check },
  'cross-sell': { label: 'Cross-sell',       tone: 'amber', Icon: Sparkles },
  'social-proof': { label: 'Social proof',   tone: 'amber', Icon: Users },
  urgency:     { label: 'Urgency timer',     tone: 'red',   Icon: Timer },
  threshold:   { label: 'Free-delivery trap', tone: 'red',  Icon: Truck },
};

const TONE = {
  good:  { dot: 'bg-teal-500',    chip: 'bg-teal-500/15 text-teal-500 ring-teal-500/20' },
  amber: { dot: 'bg-saffron-500', chip: 'bg-saffron-500/15 text-saffron-400 ring-saffron-500/30' },
  red:   { dot: 'bg-coral-500',   chip: 'bg-coral-500/15 text-coral-400 ring-coral-500/30' },
};

/**
 * Stacked, growing journey of items Shanaya has added — with the trigger
 * that drove each addition. This is the educational backbone of Act 1.
 */
export default function DecisionTimeline({ entries = [] }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-ink-300/15 backdrop-blur sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
          Decision trail
        </div>
        <div className="text-[10px] text-ink-500/80">{entries.length} {entries.length === 1 ? 'item' : 'items'}</div>
      </div>

      <ol className="relative space-y-2 pl-5">
        {/* Trail bar — soft vertical gradient that warms up as more items
           pile on, hinting that each new add tints the journey toward
           "this got out of hand". */}
        <span
          aria-hidden
          className="absolute left-[7px] top-1.5 bottom-1.5 w-[2px] rounded-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(20,184,166,0.6) 0%, rgba(255,159,28,0.7) 50%, rgba(255,107,107,0.8) 100%)',
          }}
        />
        <AnimatePresence initial={false}>
          {entries.map((e, i) => {
            const p = products[e.id];
            if (!p) return null;
            const meta = TRIGGER_META[e.trigger] || TRIGGER_META.plan;
            const tone = TONE[meta.tone];
            const Icon = meta.Icon;
            const isLatest = i === entries.length - 1;
            return (
              <motion.li
                key={e.id + '-' + i}
                initial={{ opacity: 0, x: -12, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22, mass: 0.7 }}
                className="relative flex items-center gap-2"
              >
                {/* Dot + halo. The newest entry briefly pulses to draw the
                   eye to "this just happened". */}
                <span
                  className={`absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full ${tone.dot} ring-2 ring-white`}
                />
                {isLatest && (
                  <motion.span
                    aria-hidden
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    className={`absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full ${tone.dot}`}
                  />
                )}
                <span className="text-base leading-none">{p.emoji}</span>
                <span className="text-[12px] font-semibold text-ink-900">{p.name}</span>
                <span className="text-[11px] font-bold text-ink-500">₹{p.price.toLocaleString('en-IN')}</span>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${tone.chip}`}>
                  <Icon className="h-3 w-3" /> {meta.label}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}
