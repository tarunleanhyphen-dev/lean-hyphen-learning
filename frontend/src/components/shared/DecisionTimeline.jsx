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
        <span aria-hidden className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-ink-300/40" />
        <AnimatePresence initial={false}>
          {entries.map((e, i) => {
            const p = products[e.id];
            if (!p) return null;
            const meta = TRIGGER_META[e.trigger] || TRIGGER_META.plan;
            const tone = TONE[meta.tone];
            const Icon = meta.Icon;
            return (
              <motion.li
                key={e.id + '-' + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative flex items-center gap-2"
              >
                <span className={`absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full ${tone.dot} ring-2 ring-white`} />
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
