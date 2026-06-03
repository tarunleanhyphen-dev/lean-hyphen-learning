/**
 * Act 2 — The 50/30/20 Rule. Four concept-teach screens (C1–C4).
 * Pulls the learner's real Act 1 spend from localStorage for a personalised
 * comparison + verdict. Reuses the Act 1 narrator / TTS / sound infra.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, X, Sparkles, PieChart, Info, Trophy, Wallet } from 'lucide-react';
import { act2, catalogue } from '../../../../data/lessons/dreamBedroomMakeover.js';
import { sounds, isAudioReady } from '../../../../utils/sounds.js';
import { NarratorCard } from '../Act1/NarratorCard.jsx';
import { ItemArt } from '../Act1/ItemArt.jsx';
import { fmt, useCount } from '../Act1/Tracker.jsx';

function sfx(n) { try { if (isAudioReady()) sounds[n]?.(); } catch { /* noop */ } }

/* read Act 1 results → {needs, wants, savings} that always sum to 50,000 */
export function loadAct1Spend() {
  const BUDGET = 50000;
  try {
    const raw = localStorage.getItem('lh.dbm.act1.v1');
    if (raw) {
      const st = JSON.parse(raw);
      const idx = {};
      Object.values(catalogue).forEach((c) => c.items.forEach((it) => { idx[it.id] = it; }));
      const items = (st.cart || []).map((id) => idx[id]).filter(Boolean);
      const needs = items.filter((it) => it.type === 'need').reduce((a, it) => a + it.price, 0);
      const wants = items.filter((it) => it.type === 'want').reduce((a, it) => a + it.price, 0);
      const savings = Math.max(0, BUDGET - needs - wants);
      if (needs + wants > 0) return { needs, wants, savings, played: true };
    }
  } catch { /* ignore */ }
  // sensible default if Act 1 wasn't played
  return { needs: 28500, wants: 11500, savings: 10000, played: false };
}

function useNarr(narration, lines) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDone(false);
    narration.narrate(lines, () => setDone(true));
    return () => narration.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { done, replay: () => narration.replay(lines), skip: () => { sfx('tap'); narration.skip(); setDone(true); } };
}

function CTA({ children, onClick, disabled, accent }) {
  return (
    <motion.button className="dbm-cta dbm-cta--big" style={{ '--accent': accent }} disabled={disabled}
      onClick={() => { if (!disabled) { sfx('click'); onClick?.(); } }}
      whileHover={disabled ? {} : { scale: 1.04 }} whileTap={disabled ? {} : { scale: 0.97 }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {children} <ArrowRight size={18} />
    </motion.button>
  );
}

/* ============ C1 — The Reveal ============ */
export function C1Reveal({ go, narration, accent }) {
  const d = act2.reveal;
  const [unlocked, setUnlocked] = useState([]);
  const allOpen = unlocked.length === d.slices.length;
  const n = useNarr(narration, [d.intro, d.prompt]);

  const click = (slice) => {
    if (unlocked.includes(slice.id)) return;
    sfx('ding');
    setUnlocked((u) => [...u, slice.id]);
    narration.say(slice.text);
  };
  useEffect(() => { if (allOpen) { sfx('reveal'); narration.say(d.outro); } /* eslint-disable-next-line */ }, [allOpen]);

  return (
    <div className="dbm-screen dbm-a2">
      <h2 className="dbm-h2">The 50/30/20 Rule</h2>
      <NarratorCard narration={narration} lines={[d.intro, d.prompt]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />

      <div className="a2-reveal">
        <Pie slices={d.slices} unlocked={unlocked} onSlice={click} />
        <div className="a2-reveal__panel">
          {d.slices.map((s) => {
            const open = unlocked.includes(s.id);
            return (
              <motion.button key={s.id} className={`a2-slicecard ${open ? 'is-open' : ''}`} style={{ '--c': s.color }}
                onClick={() => click(s)} animate={{ opacity: open ? 1 : 0.6 }}>
                <div className="a2-slicecard__pct">{s.pct}%</div>
                <div className="a2-slicecard__body">
                  <div className="a2-slicecard__label">{open ? s.label : 'Tap to reveal'}</div>
                  {open && <p>{s.text.replace(/^\d+% — \w+\. /, '')}</p>}
                </div>
                {open && <Check size={16} className="a2-slicecard__check" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {allOpen && (
          <motion.div className="a2-outro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles size={16} /> {d.outro}
          </motion.div>
        )}
      </AnimatePresence>

      <CTA accent={accent} disabled={!allOpen} onClick={() => go('c2-apply')}>{allOpen ? d.cta : `Unlock all 3 slices (${unlocked.length}/3)`}</CTA>
    </div>
  );
}

function Pie({ slices, unlocked, onSlice }) {
  const size = 230, r = 80, cx = size / 2, cy = size / 2, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="a2-pie">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="44" />
      {slices.map((s) => {
        const frac = s.pct / 100;
        const dash = frac * c;
        const open = unlocked.includes(s.id);
        const el = (
          <circle key={s.id} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="44" strokeOpacity={open ? 1 : 0.28}
            strokeDasharray={`${dash - 2} ${c - dash + 2}`} strokeDashoffset={-acc}
            transform={`rotate(-90 ${cx} ${cy})`} style={{ cursor: 'pointer', transition: 'stroke-opacity .3s' }}
            onClick={() => onSlice(s)} />
        );
        acc += dash;
        return el;
      })}
      {/* labels */}
      {(() => { let a = 0; return slices.map((s) => {
        const mid = (a + s.pct / 2) / 100 * 2 * Math.PI - Math.PI / 2;
        a += s.pct;
        const lr = r;
        const x = cx + Math.cos(mid) * lr, y = cy + Math.sin(mid) * lr;
        const open = unlocked.includes(s.id);
        return <text key={s.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="a2-pie__lbl">{open ? `${s.pct}%` : '?'}</text>;
      }); })()}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="a2-pie__center">50·30·20</text>
    </svg>
  );
}

/* ============ C2 — Apply It ============ */
export function C2Apply({ go, narration, accent, act1 }) {
  const d = act2.apply;
  const n = useNarr(narration, [d.intro]);
  const [showYou, setShowYou] = useState(false);
  const t = d.targets;

  useEffect(() => { const id = setTimeout(() => setShowYou(true), 2200); return () => clearTimeout(id); }, []);

  const fb = [];
  if (act1.needs > t.needs) fb.push(d.feedback.needsOver);
  if (act1.wants > t.wants) fb.push(d.feedback.wantsOver);
  if (act1.savings >= t.savings) fb.push(d.feedback.savingsGood);

  const rows = [
    { key: 'needs',   label: 'Needs',   color: '#10B981', rule: t.needs,   you: act1.needs },
    { key: 'wants',   label: 'Wants',   color: '#A855F7', rule: t.wants,   you: act1.wants },
    { key: 'savings', label: 'Savings', color: '#F59E0B', rule: t.savings, you: act1.savings },
  ];
  const max = 26000;

  return (
    <div className="dbm-screen dbm-a2">
      <h2 className="dbm-h2">Apply it to your ₹50,000</h2>
      <NarratorCard narration={narration} lines={[d.intro]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />

      <div className="a2-apply">
        <div className="a2-apply__head"><span>Bucket</span><span>Rule says</span><span className={showYou ? 'is-on' : ''}>You spent</span></div>
        {rows.map((row, i) => (
          <motion.div key={row.key} className="a2-row" style={{ '--c': row.color }} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
            <span className="a2-row__label">{row.label}</span>
            <div className="a2-row__bars">
              <div className="a2-row__barwrap">
                <motion.div className="a2-row__bar a2-row__bar--rule" animate={{ width: `${(row.rule / max) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                <span className="a2-row__val">{fmt(row.rule)}</span>
              </div>
              <AnimatePresence>
                {showYou && (
                  <motion.div className="a2-row__barwrap" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <motion.div className="a2-row__bar a2-row__bar--you" animate={{ width: `${Math.min(100, (row.you / max) * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                    <span className="a2-row__val a2-row__val--you">{fmt(row.you)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showYou && (
          <motion.div className="a2-fb" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {!act1.played && <div className="a2-fb__note"><Info size={13} /> Play Act 1 first to see your own numbers — showing a sample for now.</div>}
            {fb.map((line, i) => (<div key={i} className="a2-fb__line"><Sparkles size={14} /> {line}</div>))}
            <div className="a2-fb__line a2-fb__line--em">{d.outro}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <CTA accent={accent} disabled={!showYou} onClick={() => go('c3-activity')}>{d.cta}</CTA>
    </div>
  );
}

/* ============ C3 — Sort Kabir's Expenses ============ */
export function C3Activity({ go, narration, accent }) {
  const d = act2.activity;
  const n = useNarr(narration, [d.intro, d.task]);
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState({}); // expenseId -> bucketId chosen
  const [feedback, setFeedback] = useState(null);
  const [saveAns, setSaveAns] = useState(null);

  const exp = d.expenses[idx];
  const finished = idx >= d.expenses.length;

  const totals = useMemo(() => {
    const t = { needs: 0, wants: 0, savings: 0 };
    Object.entries(placed).forEach(([eid, b]) => {
      const e = d.expenses.find((x) => x.id === eid); if (e) t[b] += e.amount;
    });
    return t;
  }, [placed, d.expenses]);

  const choose = (bucket) => {
    if (!exp || feedback) return;
    sfx(bucket === exp.bucket ? 'ding' : 'tap');
    setPlaced((p) => ({ ...p, [exp.id]: exp.bucket })); // always file in the CORRECT bucket so the lesson stays accurate
    narration.say(exp.feedback);
    setFeedback({ exp, chosen: bucket, correct: bucket === exp.bucket, text: exp.feedback, grey: exp.grey });
  };
  const next = () => { sfx('click'); setFeedback(null); setIdx((i) => i + 1); };

  if (finished) {
    return <ActivityResults d={d} totals={totals} saveAns={saveAns} setSaveAns={setSaveAns} narration={narration} accent={accent} go={go} />;
  }

  return (
    <div className="dbm-screen dbm-a2">
      <h2 className="dbm-h2">Sort Kabir's expenses</h2>
      <NarratorCard narration={narration} lines={[d.intro, d.task]} accent={accent} done compact size={92}
        onReplay={() => narration.replay([d.intro, d.task])} onSkip={() => narration.skip()} />

      <div className="a2-buckets">
        {d.buckets.map((b) => (
          <div key={b.id} className="a2-bucket" style={{ '--c': b.color }}>
            <div className="a2-bucket__head"><span>{b.label}</span><small>target {fmt(b.target)}</small></div>
            <div className="a2-bucket__barwrap"><motion.div className="a2-bucket__bar" animate={{ width: `${Math.min(100, (totals[b.id] / (b.target * 1.6)) * 100)}%` }} /></div>
            <div className="a2-bucket__val">{fmt(totals[b.id])}</div>
          </div>
        ))}
      </div>

      <div className="a2-act__progress">Expense {idx + 1} of {d.expenses.length}
        <div className="dbm-sort__progressbar"><motion.div animate={{ width: `${(idx / d.expenses.length) * 100}%` }} /></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={exp.id} className="a2-expcard" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}>
          <div className="a2-expcard__art"><ItemArt art={exp.art} size={56} /></div>
          <div className="a2-expcard__name">{exp.name}</div>
          <div className="a2-expcard__amt">{fmt(exp.amount)}</div>
          {exp.grey && <div className="a2-expcard__grey">🤔 grey area</div>}
        </motion.div>
      </AnimatePresence>

      {!feedback ? (
        <div className="a2-choices">
          {d.buckets.map((b) => (
            <button key={b.id} className="a2-choice" style={{ '--c': b.color }} onClick={() => choose(b.id)}>{b.label}</button>
          ))}
        </div>
      ) : (
        <motion.div className={`dbm-feedback ${feedback.correct ? 'is-right' : 'is-soft'} ${feedback.grey ? 'is-grey' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dbm-feedback__icon">{feedback.grey ? '🤔' : feedback.correct ? <Check size={18} /> : <Info size={18} />}</div>
          <p>{feedback.text}</p>
          <button className="dbm-feedback__next" onClick={next}>Next <ArrowRight size={15} /></button>
        </motion.div>
      )}
    </div>
  );
}

function statusOf(spent, target) {
  const diff = Math.abs(spent - target) / target;
  if (diff <= 0.15) return { label: spent <= target ? 'On track' : 'Close', cls: 'ok' };
  if (diff <= 0.4)  return { label: spent > target ? 'Slightly over' : 'A bit under', cls: 'warn' };
  return { label: spent > target ? 'Over' : 'Under', cls: 'bad' };
}

function ActivityResults({ d, totals, saveAns, setSaveAns, narration, accent, go }) {
  useEffect(() => { sfx('reveal'); }, []);
  const rows = d.buckets.map((b) => ({ ...b, spent: totals[b.id], status: statusOf(totals[b.id], b.target) }));

  const pick = (yes) => { if (saveAns) return; sfx(yes ? 'ding' : 'tap'); setSaveAns(yes ? 'yes' : 'no'); narration.say(yes ? d.saveYes : d.saveNo); };

  return (
    <div className="dbm-screen dbm-a2">
      <h2 className="dbm-h2">Kabir's spending vs the rule</h2>
      <div className="a2-results">
        <div className="a2-results__head"><span>Bucket</span><span>Rule</span><span>Kabir spent</span><span>Status</span></div>
        {rows.map((r) => (
          <motion.div key={r.id} className="a2-results__row" style={{ '--c': r.color }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <span className="a2-results__b"><i style={{ background: r.color }} /> {r.label}</span>
            <span>{fmt(r.target)}</span>
            <span className="a2-results__spent">{fmt(r.spent)}</span>
            <span className={`a2-status a2-status--${r.status.cls}`}>{r.status.label}</span>
          </motion.div>
        ))}
        <div className="a2-results__row a2-results__row--left">
          <span className="a2-results__b">Unspent</span><span>—</span><span className="a2-results__spent">{fmt(d.leftover)}</span><span>—</span>
        </div>
      </div>

      <div className="a2-save">
        <div className="a2-save__q">{d.saveQuestion}</div>
        <div className="a2-save__btns">
          <button className={`a2-save__btn a2-save__btn--yes ${saveAns === 'yes' ? 'is-on' : ''}`} disabled={!!saveAns} onClick={() => pick(true)}>Yes, save it!</button>
          <button className={`a2-save__btn a2-save__btn--no ${saveAns === 'no' ? 'is-on' : ''}`} disabled={!!saveAns} onClick={() => pick(false)}>No, spend it on something fun</button>
        </div>
        <AnimatePresence>
          {saveAns && (
            <motion.div className="a2-save__fb" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {saveAns === 'yes' ? d.saveYes : d.saveNo}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CTA accent={accent} disabled={!saveAns} onClick={() => go('c4-takeaway')}>{d.cta}</CTA>
    </div>
  );
}

/* ============ C4 — Takeaway ============ */
export function C4Takeaway({ narration, accent, act1, onComplete }) {
  const d = act2.takeaway;
  const verdict = useMemo(() => {
    const wShare = act1.wants / 50000, nShare = act1.needs / 50000;
    if (wShare > 0.30) return d.verdicts.wantsHeavy;
    if (nShare > 0.55) return d.verdicts.needsHeavy;
    return d.verdicts.balanced;
  }, [act1, d]);
  const n = useNarr(narration, [d.title, d.sub, verdict]);
  useEffect(() => { sfx('aha'); }, []);

  return (
    <div className="dbm-screen dbm-a2 dbm-a2--takeaway">
      <h2 className="dbm-h2">The takeaway</h2>
      <div className="a2-blocks">
        {[{ p: 50, l: 'Needs', c: '#10B981' }, { p: 30, l: 'Wants', c: '#A855F7' }, { p: 20, l: 'Savings', c: '#F59E0B' }].map((b, i) => (
          <motion.div key={b.l} className="a2-block" style={{ '--c': b.c, flexGrow: b.p }} initial={{ opacity: 0, scaleY: 0.4 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.15 * i, type: 'spring', stiffness: 140 }}>
            <span className="a2-block__pct">{b.p}%</span>
            <span className="a2-block__lbl">{b.l}</span>
          </motion.div>
        ))}
      </div>
      <div className="a2-take__title">{d.title}</div>
      <div className="a2-take__sub">{d.sub}</div>

      <NarratorCard narration={narration} lines={[d.title, d.sub, verdict]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} />

      <div className="a2-verdict"><Trophy size={16} /> {verdict}</div>

      <CTA accent={accent} disabled={!n.done} onClick={() => onComplete?.()}>{d.cta}</CTA>
    </div>
  );
}
