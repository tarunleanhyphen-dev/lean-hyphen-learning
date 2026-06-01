/**
 * Top HUD — replaces the right-side tracker panel.
 *
 * Slim, sticky strip at the top with:
 *   - Animated "₹X remaining" hero counter (springs on every cart change)
 *   - Spent / reserve / total breakdown
 *   - Per-category chips that light up as money lands in each bucket
 *   - A single, satisfying horizontal budget bar
 *
 * Visual language is closer to a fintech dashboard than a learning UI —
 * dense info, big numbers, restrained color.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Lock } from 'lucide-react';
import { catalogue, lesson } from '../../../../data/lessons/whereDoesMyMoneyGo.js';

const CATEGORY_COLORS = {
  furniture: '#F59E0B',
  seating:   '#10B981',
  storage:   '#3B82F6',
  lighting:  '#FACC15',
  decor:     '#8B5CF6',
};

function fmt(n) { return '₹' + Math.round(n || 0).toLocaleString('en-IN'); }

/* Animated number counter — tween to target with rAF. */
function useCount(target, ms = 380) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    fromRef.current = val;
    startRef.current = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - startRef.current) / ms);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(fromRef.current + (target - fromRef.current) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export function TopHUD({ mk, accent = '#10B981' }) {
  const { state, spent, remaining, budget, categoryTotals } = mk;

  const remainingSpring = useCount(remaining);
  const spentSpring     = useCount(spent);

  // Spent + reserve segments of the bar
  const spentPct   = Math.min(100, (spent / budget.total) * 100);
  const reservePct = Math.min(100 - spentPct, (budget.reserve / budget.total) * 100);

  // Band color for the remaining-callout pill
  const bands = lesson.acts.act1.scenes.find((s) => s.id === 'screen-4-shop').budgetBands;
  const band = bands.find((b) => spent <= b.upTo) || bands[bands.length - 1];

  // Step indicator
  const screenIdx = lesson.acts.act1.scenes.findIndex((s) => s.id === state.screen);
  const totalSteps = lesson.acts.act1.scenes.length;

  return (
    <motion.aside
      className="hud"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      style={{ '--accent': accent }}
    >
      <div className="hud__brand">
        <Wallet size={14} />
        <span>Bedroom Budget</span>
      </div>

      <div className="hud__numbers">
        <div className="hud__stat hud__stat--hero">
          <span className="hud__stat-label">Remaining</span>
          <span className="hud__stat-value" style={{ color: band.color }}>{fmt(remainingSpring)}</span>
        </div>
        <div className="hud__divider" />
        <div className="hud__stat">
          <span className="hud__stat-label">Spent</span>
          <span className="hud__stat-value">{fmt(spentSpring)}</span>
        </div>
        <div className="hud__stat">
          <span className="hud__stat-label"><Lock size={10} /> Reserve</span>
          <span className="hud__stat-value">{fmt(budget.reserve)}</span>
        </div>
        <div className="hud__stat hud__stat--total">
          <span className="hud__stat-label">of</span>
          <span className="hud__stat-value">{fmt(budget.total)}</span>
        </div>
      </div>

      <div className="hud__bar">
        <motion.div
          className="hud__bar-spent"
          animate={{ width: `${spentPct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          style={{ background: band.color }}
        />
        <motion.div
          className="hud__bar-reserve"
          animate={{ width: `${reservePct}%`, left: `${spentPct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        />
        <div className="hud__bar-label" style={{ color: band.color }}>{band.label}</div>
      </div>

      <div className="hud__chips">
        {Object.entries(catalogue).map(([catId, cat]) => {
          const val = categoryTotals[catId] || 0;
          const active = val > 0;
          return (
            <div
              key={catId}
              className={`hud__chip ${active ? 'is-active' : ''}`}
              style={{ '--chip-color': CATEGORY_COLORS[catId] }}
            >
              <span className="hud__chip-icon">{cat.icon}</span>
              <span className="hud__chip-val">{active ? fmt(val) : '—'}</span>
            </div>
          );
        })}
      </div>

      <div className="hud__progress">Step {screenIdx + 1} / {totalSteps}</div>
    </motion.aside>
  );
}
