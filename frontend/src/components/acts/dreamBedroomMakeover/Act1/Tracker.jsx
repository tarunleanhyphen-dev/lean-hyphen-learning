/**
 * Expense Tracker — the "other half" of the Shop Smart split screen.
 * Live budget maths, zoned budget bar, per-category counting, needs/wants
 * split and an animated donut. Every number tweens on change.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Wallet, TrendingDown } from 'lucide-react';
import { catalogue } from '../../../../data/lessons/dreamBedroomMakeover.js';

export function fmt(n) { return '₹' + Math.round(n || 0).toLocaleString('en-IN'); }

/* rAF number tween */
export function useCount(target, ms = 420) {
  const [val, setVal] = useState(target);
  const from = useRef(target); const t0 = useRef(0); const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    from.current = val; t0.current = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0.current) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(from.current + (target - from.current) * e);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export function Donut({ categoryTotals, spent, size = 132 }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const cats = Object.entries(catalogue);
  let acc = 0;
  const total = spent || 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="dbm-donut">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" />
      {cats.map(([id, cat]) => {
        const val = categoryTotals[id] || 0;
        if (val <= 0) return null;
        const frac = val / total;
        const dash = frac * c;
        const seg = (
          <motion.circle
            key={id}
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={cat.color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-acc}
            initial={false}
            animate={{ strokeDasharray: `${dash} ${c - dash}`, strokeDashoffset: -acc }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        acc += dash;
        return seg;
      })}
      <text x="50%" y="46%" textAnchor="middle" className="dbm-donut__num">{fmt(spent)}</text>
      <text x="50%" y="60%" textAnchor="middle" className="dbm-donut__lbl">spent</text>
    </svg>
  );
}

export function Tracker({ mk, bands, compact = false }) {
  const { spent, remaining, budget, categoryTotals, needsTotal, wantsTotal } = mk;
  const remainingC = useCount(remaining);
  const spentC = useCount(spent);

  const band = bands.find((b) => spent <= b.upTo) || bands[bands.length - 1];
  const spentPct = Math.min(100, (spent / budget.total) * 100);
  const reservePct = Math.min(100 - spentPct, (budget.reserve / budget.total) * 100);

  const nwTotal = needsTotal + wantsTotal || 1;
  const needsPct = Math.round((needsTotal / nwTotal) * 100);

  return (
    <div className={`dbm-tracker ${compact ? 'dbm-tracker--compact' : ''}`}>
      <div className="dbm-tracker__head">
        <Wallet size={15} /> <span>Expense Tracker</span>
      </div>

      {/* Hero remaining */}
      <div className="dbm-tracker__hero" style={{ '--band': band.color }}>
        <div className="dbm-tracker__hero-label">Remaining to spend</div>
        <div className="dbm-tracker__hero-val">{fmt(remainingC)}</div>
        <div className="dbm-tracker__hero-band">{band.label}</div>
      </div>

      {/* Budget bar with zones */}
      <div className="dbm-bar" role="progressbar" aria-valuenow={Math.round(spent)} aria-valuemax={budget.total}>
        <motion.div className="dbm-bar__spent" animate={{ width: `${spentPct}%`, backgroundColor: band.color }} transition={{ type: 'spring', stiffness: 160, damping: 24 }} />
        <motion.div className="dbm-bar__reserve" animate={{ width: `${reservePct}%`, left: `${spentPct}%` }} transition={{ type: 'spring', stiffness: 160, damping: 24 }} />
      </div>
      <div className="dbm-bar__legend">
        <span><i style={{ background: band.color }} /> Spent</span>
        <span><i className="dbm-bar__lockdot" /> Reserve (locked)</span>
        <span className="dbm-bar__free">Free</span>
      </div>

      {/* Number grid */}
      <div className="dbm-grid">
        <Stat label="Total budget" value={fmt(budget.total)} />
        <Stat label={<><Lock size={10} /> Reserve</>} value={fmt(budget.reserve)} muted />
        <Stat label="Spent" value={fmt(spentC)} accentColor={band.color} />
        <Stat label="Available" value={fmt(budget.spendable)} muted />
      </div>

      {!compact && (
        <>
          <div className="dbm-tracker__donutwrap">
            <Donut categoryTotals={categoryTotals} spent={spent} />
            <div className="dbm-cats">
              {Object.entries(catalogue).map(([id, cat]) => {
                const v = categoryTotals[id] || 0;
                const pct = spent ? Math.round((v / spent) * 100) : 0;
                return (
                  <div key={id} className={`dbm-cat ${v > 0 ? 'is-on' : ''}`}>
                    <span className="dbm-cat__dot" style={{ background: cat.color }} />
                    <span className="dbm-cat__lbl">{cat.label}</span>
                    <span className="dbm-cat__val">{v > 0 ? fmt(v) : '—'}</span>
                    <span className="dbm-cat__pct">{v > 0 ? `${pct}%` : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Needs vs Wants split */}
          <div className="dbm-split">
            <div className="dbm-split__head"><TrendingDown size={12} /> Needs vs Wants</div>
            <div className="dbm-split__bar">
              <motion.div className="dbm-split__needs" animate={{ width: `${needsPct}%` }} transition={{ type: 'spring', stiffness: 160, damping: 24 }} />
              <motion.div className="dbm-split__wants" animate={{ width: `${100 - needsPct}%` }} transition={{ type: 'spring', stiffness: 160, damping: 24 }} />
            </div>
            <div className="dbm-split__legend">
              <span className="dbm-split__n">Needs {fmt(needsTotal)}</span>
              <span className="dbm-split__w">Wants {fmt(wantsTotal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, muted, accentColor }) {
  return (
    <div className={`dbm-stat ${muted ? 'is-muted' : ''}`}>
      <span className="dbm-stat__lbl">{label}</span>
      <span className="dbm-stat__val" style={accentColor ? { color: accentColor } : undefined}>{value}</span>
    </div>
  );
}
