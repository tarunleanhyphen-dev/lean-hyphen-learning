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

/* The actual items the learner bought in Act 1, each labelled Need/Want. */
export function loadAct1Items() {
  try {
    const raw = localStorage.getItem('lh.dbm.act1.v1');
    if (!raw) return [];
    const st = JSON.parse(raw);
    const idx = {};
    Object.values(catalogue).forEach((c) => c.items.forEach((it) => { idx[it.id] = it; }));
    return (st.cart || []).map((id) => idx[id]).filter(Boolean)
      .map((it) => ({ name: it.name, price: it.price, type: it.type }));
  } catch { return []; }
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

  // Always reveal strictly in order — 50% → 30% → 20% — no matter which slice
  // is tapped, so Kabir narrates them in the right sequence every time.
  const click = () => {
    const next = d.slices[unlocked.length];
    if (!next) return;
    sfx('ding');
    setUnlocked((u) => [...u, next.id]);
    narration.say(next.text);
  };
  useEffect(() => { if (allOpen) { sfx('reveal'); narration.say(d.outro); } /* eslint-disable-next-line */ }, [allOpen]);

  return (
    <div className="dbm-screen dbm-a2 dbm-a2--reveal">
      <motion.div className="dbm-eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Sparkles size={14} /> Act 2 · The money rule
      </motion.div>
      <h2 className="dbm-h2">The 50 / 30 / 20 Rule</h2>
      <p className="a2-reveal__sub">One simple split that guides every rupee. Tap each slice to unlock it — and watch it play out on the screen.</p>
      <NarratorCard narration={narration} lines={[d.intro, d.prompt]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />

      <div className="a2-reveal2">
        <div className="a2-reveal2__left">
          <Pie slices={d.slices} unlocked={unlocked} onSlice={click} />
          <div className="a2-reveal__panel">
            {d.slices.map((s, i) => {
              const open = unlocked.includes(s.id);
              const isNext = i === unlocked.length; // the only tappable card
              return (
                <motion.button key={s.id} className={`a2-slicecard ${open ? 'is-open' : ''} ${!open && !isNext ? 'is-locked' : ''}`} style={{ '--c': s.color }}
                  onClick={click} disabled={!open && !isNext} whileHover={{ scale: isNext ? 1.02 : 1 }} whileTap={{ scale: isNext ? 0.98 : 1 }}
                  animate={open ? { scale: [1, 1.04, 1] } : { opacity: isNext ? 1 : 0.5 }} transition={{ duration: 0.4 }}>
                  <div className="a2-slicecard__pct">{s.pct}%</div>
                  <div className="a2-slicecard__body">
                    <div className="a2-slicecard__label">{open ? s.label : isNext ? '👆 Tap to reveal' : '🔒 Next up'}</div>
                    {open && <p>{s.text.replace(/^\d+% — \w+\. /, '')}</p>}
                  </div>
                  {open && <Check size={16} className="a2-slicecard__check" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* "Rule TV" — a looping 3D motion explainer on the right */}
        <RuleTV />
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

/* A TV/monitor that loops a ~10-second 3D-motion explainer of the rule.
 * It runs a 4-stage timeline (intro → Needs → Wants → Savings) where the coin
 * spins, a caption narrates each step, and the buckets fill progressively. */
const TV_ROWS = [
  { pct: 50, label: 'Needs', color: '#10B981', icon: '🏠' },
  { pct: 30, label: 'Wants', color: '#A855F7', icon: '🎮' },
  { pct: 20, label: 'Savings', color: '#F59E0B', icon: '🐷' },
];
const TV_STAGES = [
  { key: 'intro',   icon: '💰', title: 'You have ₹50,000', sub: 'Where should it go?' },
  { key: 'needs',   icon: '🏠', title: '50% → Needs',      sub: 'Rent, food, transport' },
  { key: 'wants',   icon: '🎮', title: '30% → Wants',      sub: 'Fun, outings, hobbies' },
  { key: 'savings', icon: '🐷', title: '20% → Savings',    sub: 'Your safety net & goals' },
];
function CoinShower() {
  // a few ₹ coins tumble down each stage for a "money moving" feel
  const coins = [{ x: 24, d: 0 }, { x: 50, d: 0.18 }, { x: 74, d: 0.36 }];
  return (
    <div className="a2-tv__coins" aria-hidden>
      {coins.map((c, i) => (
        <motion.span key={i} className="a2-tv__coin" style={{ left: `${c.x}%` }}
          initial={{ y: -30, opacity: 0, rotateY: 0 }}
          animate={{ y: 96, opacity: [0, 1, 1, 0], rotateY: 540 }}
          transition={{ duration: 1.5, delay: c.d, ease: 'easeIn' }}>₹</motion.span>
      ))}
    </div>
  );
}

const RULE_VIDEO_ID = 'WE5Xxr1jY0g'; // YouTube Short

function RuleTV() {
  const [stage, setStage] = useState(0);
  const [playVideo, setPlayVideo] = useState(false);
  // ~2.5s per stage → ~10s full loop. Pause the loop while the real video plays.
  useEffect(() => {
    if (playVideo) return undefined;
    const id = setInterval(() => setStage((s) => (s + 1) % TV_STAGES.length), 2500);
    return () => clearInterval(id);
  }, [playVideo]);
  const st = TV_STAGES[stage];
  const filledUpTo = stage; // 0 = none, 1 = needs, 2 = +wants, 3 = +savings
  const done = stage === TV_STAGES.length - 1;
  const progress = ((stage + 1) / TV_STAGES.length) * 100;

  const toggleVideo = () => { sfx(playVideo ? 'tap' : 'click'); setPlayVideo((v) => !v); };

  return (
    <div className="a2-tv">
      {/* player chrome */}
      <div className="a2-tv__bar">
        <span className="a2-tv__rec" /> <span className="a2-tv__live">{playVideo ? 'VIDEO' : 'PLAYING'}</span>
        <span className="a2-tv__clock">{playVideo ? '▶ with sound' : `0:0${Math.min(9, stage * 3)} / 0:10`}</span>
      </div>

      <div className="a2-tv__screen">
        {playVideo ? (
          /* real YouTube Short — autoplay WITH sound (user clicked Play) */
          <iframe
            className="a2-tv__yt"
            src={`https://www.youtube.com/embed/${RULE_VIDEO_ID}?autoplay=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${RULE_VIDEO_ID}`}
            title="The 50/30/20 rule — video"
            frameBorder="0"
            allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <div className="a2-tv__scan" />
            <div className="a2-tv__vignette" />

            {/* coins tumble on every money-moving stage */}
            <AnimatePresence>{stage > 0 && <CoinShower key={stage} />}</AnimatePresence>

            {/* changing caption with a 3D-spinning icon */}
            <AnimatePresence mode="wait">
              <motion.div key={st.key} className="a2-tv__cap"
                initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -14, scale: 0.9 }} transition={{ duration: 0.4 }}>
                <motion.div className="a2-tv__bigico" animate={{ rotateY: [0, 360], y: [0, -8, 0] }} transition={{ rotateY: { duration: 2.2, repeat: Infinity, ease: 'linear' }, y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } }}>{st.icon}</motion.div>
                <div className="a2-tv__title">{st.title}</div>
                <div className="a2-tv__sub">{st.sub}</div>
              </motion.div>
            </AnimatePresence>

            {/* progressively-filling buckets */}
            <div className="a2-tv__rows">
              {TV_ROWS.map((r, i) => {
                const active = filledUpTo >= i + 1;
                return (
                  <motion.div className={`a2-tv__row ${active ? 'is-active' : ''}`} key={r.label} animate={{ opacity: active ? 1 : 0.55 }}>
                    <span className="a2-tv__ico">{r.icon}</span>
                    <div className="a2-tv__track">
                      <motion.div className="a2-tv__fill" style={{ background: r.color }}
                        animate={{ width: active ? `${r.pct}%` : '0%' }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} />
                      <span className="a2-tv__pct" style={{ color: active ? r.color : 'rgba(255,255,255,.4)' }}>{r.pct}%</span>
                    </div>
                    <span className="a2-tv__lbl">{r.label}</span>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {done && (
                <motion.div className="a2-tv__badge" initial={{ opacity: 0, scale: 0.5, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
                  ✓ That's the 50/30/20 rule!
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* video scrubber (animation mode only) */}
      {!playVideo && <div className="a2-tv__scrub"><motion.div className="a2-tv__scrubfill" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'linear' }} /></div>}

      <div className="a2-tv__neck" />
      <div className="a2-tv__base" />

      {/* Play / Stop the real video (with sound) */}
      <button className={`a2-tv__playbtn ${playVideo ? 'is-stop' : ''}`} onClick={toggleVideo}>
        {playVideo ? '■ Stop video' : '▶ Play video with sound'}
      </button>
      <div className="a2-tv__caption">📺 {playVideo ? 'Real video · tap Stop to return to the animation' : 'The 50/30/20 rule, explained · on loop'}</div>
    </div>
  );
}

function Pie({ slices, unlocked, onSlice }) {
  const size = 240, r = 82, cx = size / 2, cy = size / 2, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="a2-pie3d">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="a2-pie">
        <defs>
          {slices.map((s) => (
            <linearGradient key={s.id} id={`pg-${s.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="1" />
              <stop offset="1" stopColor={s.color} stopOpacity="0.5" />
            </linearGradient>
          ))}
        </defs>
        {/* depth shadow ring (the "3D" rim) */}
        <circle cx={cx} cy={cy + 6} r={r} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="46" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="46" />
        {slices.map((s) => {
          const frac = s.pct / 100;
          const dash = frac * c;
          const open = unlocked.includes(s.id);
          const el = (
            <motion.circle key={s.id} cx={cx} cy={cy} r={r} fill="none"
              stroke={`url(#pg-${s.id})`} strokeWidth="46" strokeOpacity={open ? 1 : 0.32}
              strokeDasharray={`${dash - 2} ${c - dash + 2}`} strokeDashoffset={-acc}
              transform={`rotate(-90 ${cx} ${cy})`} style={{ cursor: 'pointer' }}
              animate={open ? { strokeWidth: [46, 54, 46] } : { strokeWidth: 46 }} transition={{ duration: 0.5 }}
              onClick={() => onSlice(s)} />
          );
          acc += dash;
          return el;
        })}
        {(() => { let a = 0; return slices.map((s) => {
          const mid = (a + s.pct / 2) / 100 * 2 * Math.PI - Math.PI / 2;
          a += s.pct;
          const x = cx + Math.cos(mid) * r, y = cy + Math.sin(mid) * r;
          const open = unlocked.includes(s.id);
          return <text key={s.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="a2-pie__lbl">{open ? `${s.pct}%` : '?'}</text>;
        }); })()}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="a2-pie__center">50·30·20</text>
      </svg>
    </div>
  );
}

/* ============ C2 — Apply It ============ */
export function C2Apply({ go, narration, accent, act1 }) {
  const d = act2.apply;
  const n = useNarr(narration, [d.intro]);
  const [showYou, setShowYou] = useState(false);
  const t = d.targets;
  const items = useMemo(loadAct1Items, []);

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
        {showYou && items.length > 0 && (
          <motion.div className="a2-apply__detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {[
              { key: 'need', label: 'Needs', emoji: '🧺', color: '#10B981' },
              { key: 'want', label: 'Wants', emoji: '🛍️', color: '#A855F7' },
            ].map((g) => {
              const list = items.filter((it) => it.type === g.key);
              const sum = list.reduce((a, it) => a + it.price, 0);
              return (
                <div className="a2-apply__detailcol" key={g.key} style={{ '--c': g.color }}>
                  <div className="a2-apply__detailhead"><span>{g.emoji} {g.label}</span><b>{fmt(sum)}</b></div>
                  {list.length ? list.map((it, i) => (
                    <div className="a2-apply__item" key={i}>
                      <span className="a2-apply__itemtag">{g.label === 'Needs' ? 'Need' : 'Want'}</span>
                      <span className="a2-apply__itemname">{it.name}</span>
                      <span className="a2-apply__itemamt">{fmt(it.price)}</span>
                    </div>
                  )) : <div className="a2-apply__empty">Nothing here</div>}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

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

/* ============ C3 — Mini Activity: Who's Nailing Their First Salary? ============ */
const FS_SALARY = 60000;
const FS_RULE = { needs: 30000, wants: 18000, savings: 12000 }; // 50/30/20 of ₹60,000
const FS_PEOPLE = [
  {
    id: 'arjun', name: 'Arjun', emoji: '🧑🏽‍💼', color: '#ef4444', vibe: 'Lives for today',
    needs: 20500, wants: 25000, savings: 0,
    fb: "Arjun didn't even spend his full salary — yet saved nothing. All his extra money just quietly disappeared. No savings means no safety net. One medical bill or a broken phone and he's calling home.",
  },
  {
    id: 'priya', name: 'Priya', emoji: '👩🏻‍💼', color: '#f59e0b', vibe: 'Saves it all',
    needs: 19500, wants: 1500, savings: 39000,
    fb: "Priya has money in the bank — but she spent almost nothing on Wants. The rule isn't about saving as much as possible, it's about balance. She hasn't been to a single birthday dinner this year. That's not a budget, that's a punishment.",
  },
  {
    id: 'sneha', name: 'Sneha', emoji: '👩🏽‍🦰', color: '#10b981', vibe: 'Balanced & consistent', correct: true,
    needs: 25000, wants: 8500, savings: 16500,
    fb: "Correct! Sneha's Needs land around ₹25,000, Wants around ₹8,500 and Savings ₹16,500 — not a perfect 50/30/20, but the most balanced of the three. She shows up for her friends, her savings are growing, and she sleeps without worrying about next month. One good habit, started early, is all it takes.",
  },
];
const FS_FIX_OPTIONS = [
  { id: 'A', text: 'Cut Swiggy from ₹6,000 to ₹2,000', good: true },
  { id: 'B', text: 'Move to a cheaper PG — save ₹3,000 on rent' },
  { id: 'C', text: 'Pause the iPhone EMI — buy a budget phone instead', good: true },
  { id: 'D', text: 'Cancel all outings entirely' },
  { id: 'E', text: 'Stop buying clothes for 6 months' },
];
const FS_FIX_RIGHT = "Smart choices. Cutting Swiggy saves ₹4,000. Dropping the iPhone EMI saves ₹8,000. That's ₹12,000 freed up — enough to hit his savings target and still enjoy his weekends. He doesn't have to give up his life. He just has to make smarter trade-offs.";
const FS_FIX_WRONG = "Those cuts would help — but A and C are the highest-impact changes with the least lifestyle sacrifice. Big Wants like EMIs drain a budget quietly, every single month.";
const FS_CLOSING = "Three people, same salary, three completely different financial lives. Arjun is enjoying today at the cost of tomorrow. Priya is protecting tomorrow at the cost of today. Sneha is doing both — not perfectly, but consistently. The 50/30/20 rule isn't about being perfect. It's about being deliberate.";

function PersonBars({ p, max = 39000, reveal = true }) {
  const rows = [
    { k: 'Needs', v: p.needs, c: '#10b981' },
    { k: 'Wants', v: p.wants, c: '#a855f7' },
    { k: 'Savings', v: p.savings, c: '#f59e0b' },
  ];
  return (
    <div className="a2-fs__bars">
      {rows.map((r) => (
        <div className="a2-fs__bar" key={r.k}>
          <span className="a2-fs__barlbl">{r.k}</span>
          <div className="a2-fs__bartrack">
            <motion.div className="a2-fs__barfill" style={{ background: r.c }}
              initial={{ width: 0 }} animate={{ width: reveal ? `${Math.min(100, (r.v / max) * 100)}%` : 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18 }} />
          </div>
          <span className="a2-fs__barval">{fmt(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

export function C3Activity({ go, narration, accent, analytics }) {
  const [phase, setPhase] = useState('intro'); // intro | rule | decide | fix | summary
  const [whoPick, setWhoPick] = useState(null);
  const [fixSel, setFixSel] = useState([]);
  const [fixDone, setFixDone] = useState(false);
  const introLines = [
    'Meet Arjun, Priya and Sneha. They all just got their first job — same city, same salary: ₹60,000 a month. Look at what they spent on, and figure out who is following the 50/30/20 rule.',
  ];
  const n = useNarr(narration, introLines);

  const pickWho = (id) => {
    if (whoPick) return;
    const person = FS_PEOPLE.find((p) => p.id === id);
    sfx(person.correct ? 'ding' : 'tap');
    setWhoPick(id);
    narration.say(person.fb);
  };
  const toggleFix = (id) => {
    if (fixDone) return;
    setFixSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : s));
    sfx('tap');
  };
  const submitFix = () => {
    if (fixSel.length !== 2 || fixDone) return;
    const right = fixSel.includes('A') && fixSel.includes('C');
    sfx(right ? 'ding' : 'tap');
    setFixDone(true);
    narration.say(right ? FS_FIX_RIGHT : FS_FIX_WRONG);
  };
  const goPhase = (p, line) => { sfx('click'); narration.stop(); setPhase(p); if (line) setTimeout(() => narration.say(line), 250); };
  useEffect(() => { window.scrollTo({ top: 0 }); }, [phase]);

  return (
    <div className="dbm-screen dbm-a2 dbm-a2--fs">
      <motion.div className="dbm-eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Sparkles size={14} /> Mini Activity · First Salary
      </motion.div>
      <h2 className="dbm-h2">Who's Nailing Their First Salary?</h2>

      {/* ---------- INTRO ---------- */}
      {phase === 'intro' && (
        <>
          <NarratorCard narration={narration} lines={introLines} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />
          <div className="a2-fs__cast">
            {FS_PEOPLE.map((p, i) => (
              <motion.div key={p.id} className="a2-fs__castcard" style={{ '--c': p.color }}
                initial={{ opacity: 0, y: 30, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.15 * i, type: 'spring', stiffness: 120, damping: 14 }}
                whileHover={{ y: -6, scale: 1.05 }}>
                <motion.div className="a2-fs__avatar" animate={{ y: [0, -8, 0], rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 3 + i * 0.4, ease: 'easeInOut' }}>{p.emoji}</motion.div>
                <div className="a2-fs__name">{p.name}</div>
                <div className="a2-fs__vibe">{p.vibe}</div>
                <div className="a2-fs__salary">₹60,000 / mo</div>
              </motion.div>
            ))}
          </div>
          <CTA accent={accent} onClick={() => goPhase('rule', 'Keep this in mind as you look at each person’s spending.')}>Show me the rule</CTA>
        </>
      )}

      {/* ---------- RULE REMINDER ---------- */}
      {phase === 'rule' && (
        <motion.div className="a2-fs__rule" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="a2-fs__lead">On a ₹60,000 salary, the 50 / 30 / 20 rule means:</p>
          <div className="a2-fs__rulecards">
            {[
              { k: 'Needs', pct: 50, v: FS_RULE.needs, c: '#10b981', icon: '🏠' },
              { k: 'Wants', pct: 30, v: FS_RULE.wants, c: '#a855f7', icon: '🎮' },
              { k: 'Savings', pct: 20, v: FS_RULE.savings, c: '#f59e0b', icon: '🐷' },
            ].map((r, i) => (
              <motion.div key={r.k} className="a2-fs__rulecard" style={{ '--c': r.c }}
                initial={{ opacity: 0, scale: 0.8, rotateX: 20 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ delay: 0.12 * i, type: 'spring', stiffness: 140 }}>
                <motion.span className="a2-fs__ruleicon" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.3 }}>{r.icon}</motion.span>
                <div className="a2-fs__rulepct">{r.pct}%</div>
                <div className="a2-fs__rulek">{r.k}</div>
                <div className="a2-fs__rulev">{fmt(r.v)}</div>
              </motion.div>
            ))}
          </div>
          <CTA accent={accent} onClick={() => goPhase('decide', 'Sort each person’s spending in your head — who is closest to the rule?')}>I’ll keep it in mind</CTA>
        </motion.div>
      )}

      {/* ---------- DECIDE: who's closest ---------- */}
      {phase === 'decide' && (
        <motion.div className="a2-fs__decide" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="a2-fs__lead">Here's where each person's ₹60,000 actually went. <b>Who is closest to 50/30/20?</b></p>
          <div className="a2-fs__people">
            {FS_PEOPLE.map((p) => {
              const picked = whoPick === p.id;
              const dim = whoPick && !picked && !p.correct;
              return (
                <motion.button key={p.id} className={`a2-fs__person ${whoPick ? (p.correct ? 'is-correct' : picked ? 'is-wrong' : 'is-dim') : ''}`}
                  style={{ '--c': p.color }} onClick={() => pickWho(p.id)} disabled={!!whoPick}
                  whileHover={!whoPick ? { y: -5, scale: 1.02 } : {}} animate={{ opacity: dim ? 0.5 : 1 }}>
                  <div className="a2-fs__phead">
                    <motion.span className="a2-fs__pavatar" animate={!whoPick ? { y: [0, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 2.8 }}>{p.emoji}</motion.span>
                    <div><div className="a2-fs__name">{p.name}</div><div className="a2-fs__vibe">{p.vibe}</div></div>
                    {whoPick && p.correct && <Check size={20} className="a2-fs__tick" />}
                    {picked && !p.correct && <X size={20} className="a2-fs__cross" />}
                  </div>
                  <PersonBars p={p} reveal />
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {whoPick && (
              <motion.div className={`dbm-feedback ${FS_PEOPLE.find((p) => p.id === whoPick).correct ? 'is-right' : 'is-soft'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="dbm-feedback__icon">{FS_PEOPLE.find((p) => p.id === whoPick).correct ? <Check size={18} /> : <Info size={18} />}</div>
                <p>{FS_PEOPLE.find((p) => p.id === whoPick).fb}</p>
                <button className="dbm-feedback__next" onClick={() => goPhase('fix', 'Arjun wants to fix his spending next month. He’s willing to cut — but not give up everything he enjoys.')}>Fix Arjun's budget <ArrowRight size={15} /></button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ---------- FIX ARJUN: pick 2 ---------- */}
      {phase === 'fix' && (
        <motion.div className="a2-fs__fix" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="a2-fs__fixhead">
            <motion.span className="a2-fs__pavatar" animate={{ rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 2.5 }}>🧑🏽‍💼</motion.span>
            <p className="a2-fs__lead">Which <b>two</b> changes would bring Arjun closest to 50/30/20? <span className="a2-fs__count">{fixSel.length}/2</span></p>
          </div>
          <div className="a2-fs__opts">
            {FS_FIX_OPTIONS.map((o) => {
              const sel = fixSel.includes(o.id);
              const show = fixDone && o.good;
              const wrongSel = fixDone && sel && !o.good;
              return (
                <button key={o.id} className={`a2-fs__opt ${sel ? 'is-sel' : ''} ${show ? 'is-good' : ''} ${wrongSel ? 'is-bad' : ''}`}
                  onClick={() => toggleFix(o.id)} disabled={fixDone}>
                  <span className="a2-fs__optid">{o.id}</span>
                  <span className="a2-fs__opttext">{o.text}</span>
                  {fixDone && o.good && <Check size={16} />}
                </button>
              );
            })}
          </div>
          {!fixDone ? (
            <CTA accent={accent} disabled={fixSel.length !== 2} onClick={submitFix}>Lock in my 2 changes</CTA>
          ) : (
            <motion.div className={`dbm-feedback ${fixSel.includes('A') && fixSel.includes('C') ? 'is-right' : 'is-soft'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="dbm-feedback__icon">{fixSel.includes('A') && fixSel.includes('C') ? <Check size={18} /> : <Info size={18} />}</div>
              <p>{fixSel.includes('A') && fixSel.includes('C') ? FS_FIX_RIGHT : FS_FIX_WRONG}</p>
              <button className="dbm-feedback__next" onClick={() => { try { analytics?.activityCompleted('a2-firstsalary', { sceneId: 'c3-activity', detail: { correct: (whoPick === 'sneha' ? 1 : 0) + ((fixSel.includes('A') && fixSel.includes('C')) ? 1 : 0), total: 2 } }); } catch { /* noop */ } goPhase('summary', FS_CLOSING); }}>See the results <ArrowRight size={15} /></button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ---------- SUMMARY ---------- */}
      {phase === 'summary' && (
        <motion.div className="a2-fs__summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="a2-fs__lead">Same salary. Three different futures.</p>
          <div className="a2-fs__table">
            <div className="a2-fs__trow a2-fs__trow--head">
              <span></span><span>Arjun</span><span>Priya</span><span>Sneha</span><span>Rule</span>
            </div>
            {[
              { k: 'Needs', vals: [20500, 19500, 25000], rule: FS_RULE.needs },
              { k: 'Wants', vals: [25000, 1500, 8500], rule: FS_RULE.wants },
              { k: 'Savings', vals: [0, 39000, 16500], rule: FS_RULE.savings },
            ].map((row, i) => (
              <motion.div key={row.k} className="a2-fs__trow" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
                <span className="a2-fs__tk">{row.k}</span>
                {row.vals.map((v, j) => (
                  <span key={j} className={`a2-fs__tv ${j === 2 ? 'is-best' : ''}`}>{fmt(v)}</span>
                ))}
                <span className="a2-fs__tv a2-fs__tv--rule">{fmt(row.rule)}</span>
              </motion.div>
            ))}
          </div>
          <div className="a2-fs__close"><Trophy size={16} /> {FS_CLOSING}</div>
          <p className="a2-fs__goal">The goal isn't to be Priya. It isn't to be Arjun. It's to be a version of <b>Sneha</b> — on your first salary, and every salary after.</p>
          <CTA accent={accent} onClick={() => go('c4-takeaway')}>See the takeaway</CTA>
        </motion.div>
      )}
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
