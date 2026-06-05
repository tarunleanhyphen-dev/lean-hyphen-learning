/**
 * "Where Does My Money Go?" · Act 3 — Test Your Understanding.
 * A 6-question knowledge check, then a score + badge screen with a personalised
 * closing (pulled from the Act 1 simulation) and a downloadable GST invoice.
 */
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Check, X, ArrowRight, RotateCcw, Download, Trophy, Sparkles } from 'lucide-react';
import { catalogue } from '../../../../data/lessons/dreamBedroomMakeover.js';
import '../Act1/makeover.css';
import './act3.css';

const ACCENT = '#10B981', GLOW = '#34d399';

const QUESTIONS = [
  {
    tag: 'Reading a spending pattern',
    q: 'Riya had ₹50,000. She spent ₹30,000 on furniture, ₹10,000 on décor and ₹5,000 on lighting, and saved ₹5,000. Which category was her biggest expense?',
    options: [
      { t: 'Décor' },
      { t: 'Lighting' },
      { t: 'Furniture', correct: true },
      { t: 'Savings' },
    ],
    right: 'Right! ₹30,000 is 60% of her budget — furniture dominates most bedroom budgets.',
    wrong: 'Look at the numbers again — ₹30,000 is the largest single amount.',
  },
  {
    tag: 'Definition',
    q: 'What is the main reason to track your expenses?',
    options: [
      { t: "To show your parents you're responsible" },
      { t: 'To know how much money you have right now' },
      { t: 'To see patterns in your spending so you can make better decisions', correct: true },
      { t: 'To avoid spending on Wants' },
    ],
    right: 'Exactly! Awareness of patterns is the whole point of tracking.',
    wrong: 'Tracking is about understanding where money goes over time — so you can adjust.',
  },
  {
    tag: 'Fixed vs. Variable',
    q: 'Arjun pays ₹8,000 rent every month without fail. His food bill changes depending on what he eats. Which is the fixed expense?',
    options: [
      { t: 'Rent', correct: true },
      { t: 'Food bill' },
      { t: 'Both' },
      { t: 'Neither' },
    ],
    right: 'Correct! Fixed expenses stay the same every month — rent is the classic example.',
    wrong: "Fixed means it doesn't change. Rent is always ₹8,000 — food varies each month.",
  },
  {
    tag: 'The 50/30/20 rule',
    q: 'Priya earns ₹6,000 a month. According to the 50/30/20 rule, how much should she save?',
    options: [
      { t: '₹1,500' },
      { t: '₹1,800' },
      { t: '₹1,200', correct: true },
      { t: '₹3,000' },
    ],
    right: 'Yes! 20% of ₹6,000 = ₹1,200.',
    wrong: "20% of ₹6,000 — divide 6,000 by 5. That's ₹1,200.",
  },
  {
    tag: 'Reserve fund reasoning',
    q: 'Sneha kept ₹2,000 as an emergency reserve. Her wardrobe arrived damaged and cost ₹1,800 to fix. What was smart about her decision?',
    options: [
      { t: 'She had extra money to spend on Wants' },
      { t: 'She could handle the unexpected cost without removing any planned items', correct: true },
      { t: 'She spent less than her friends' },
      { t: 'She followed the 50/30/20 rule exactly' },
    ],
    right: 'Perfect! A reserve fund exists exactly for moments like this.',
    wrong: 'The reserve covered the surprise cost — so her original plan stayed intact.',
  },
  {
    tag: 'Application — Kabir',
    q: "Kabir gets ₹4,000 pocket money and wants to follow the 50/30/20 rule. He's already spent ₹1,800 on Needs and ₹900 on Wants. How much should he save?",
    options: [
      { t: '₹500' },
      { t: '₹700' },
      { t: '₹800', correct: true },
      { t: '₹1,000' },
    ],
    right: 'Correct! 20% of ₹4,000 = ₹800. That should go to savings.',
    wrong: "20% of ₹4,000 is ₹800. That's the savings target regardless of what's left.",
  },
];

const BADGES = [
  { min: 5, name: 'Money Mentor', emoji: '🏆', text: "Outstanding! You didn't just play the simulation — you understood the thinking behind it. You've got the 50/30/20 rule down and you know how to read a spending pattern. Keep this up." },
  { min: 3, name: 'Smart Tracker', emoji: '📊', text: "Solid work! You've got the core ideas and you're thinking like a budgeter. Review the 50/30/20 rule once more and you'll have it locked in." },
  { min: 0, name: 'Budget Rookie', emoji: '🌱', text: "Good start! Budgeting is a skill — and you've just taken the first step. Head back to the concept section, give Kabir's activity another go, and try the quiz again." },
];

/* read the Act 1 simulation (cart + reserve) from localStorage */
function loadAct1() {
  const BUDGET = 50000, RESERVE = 2000;
  const idx = {};
  Object.values(catalogue).forEach((c) => c.items.forEach((it) => { idx[it.id] = it; }));
  try {
    const st = JSON.parse(localStorage.getItem('lh.dbm.act1.v1') || '{}');
    const items = (st.cart || []).map((id) => idx[id]).filter(Boolean);
    const needs = items.filter((it) => it.type === 'need').reduce((a, it) => a + it.price, 0);
    const wants = items.filter((it) => it.type === 'want').reduce((a, it) => a + it.price, 0);
    return { items, needs, wants, reserve: typeof st.reserve === 'number' ? st.reserve : RESERVE, played: items.length > 0 };
  } catch {
    return { items: [], needs: 0, wants: 0, reserve: RESERVE, played: false };
  }
}

function closingLine(a1) {
  if (!a1.played) return null;
  if (a1.reserve <= 0) return "When the second surprise hit, you had no reserve left. That's a powerful lesson — one you'll remember next time.";
  const total = a1.needs + a1.wants;
  const wantPct = total ? a1.wants / total : 0;
  if (a1.reserve >= 2000) return 'You kept your emergency reserve — that\'s real financial wisdom, not just a rule you memorised. If a surprise had hit, you\'d have been ready.';
  if (wantPct >= 0.2 && wantPct <= 0.45) return 'Your spending in the simulation was close to the 50/30/20 split without even knowing the rule. Trust your instincts — and now you have a framework to back them up.';
  return 'You made real trade-offs in the simulation. Now you have a framework — the 50/30/20 rule — to make those calls with confidence.';
}

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

/* ---- spending snapshot shown inline as an invoice card (no GST, no download) ---- */
function Invoice({ a1 }) {
  const items = a1.items.length ? a1.items : [{ name: 'Dream Bedroom Setup', price: 40000 }];
  const total = items.reduce((s, it) => s + it.price, 0);
  const savings = Math.max(0, 50000 - total);
  const inv = useMemo(() => 'LH/' + new Date().getFullYear() + '/' + Math.floor(1000 + (total % 9000)), [total]);
  const today = useMemo(() => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), []);
  return (
    <motion.div className="dbm-inv" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
      <div className="dbm-inv__hd">
        <div className="dbm-inv__brand"><span className="dbm-inv__logo">🛋️</span><div><b>Lean Hyphen Furnishings</b><small>Dream Bedroom Store</small></div></div>
        <div className="dbm-inv__ttl"><b>INVOICE</b><small>{inv}</small></div>
      </div>
      <div className="dbm-inv__meta"><span>Billed to · Student Saver</span><span>{today}</span></div>
      <table className="dbm-inv__table">
        <thead><tr><th>#</th><th>Item</th><th className="r">Qty</th><th className="r">Amount</th></tr></thead>
        <tbody>{items.map((it, i) => (<tr key={i}><td>{i + 1}</td><td>{it.name}</td><td className="r">1</td><td className="r">{inr(it.price)}</td></tr>))}</tbody>
      </table>
      <div className="dbm-inv__totals">
        <div><span>Total spent</span><b>{inr(total)}</b></div>
        <div><span>Saved · reserve</span><b className="dbm-inv__save">{inr(savings)}</b></div>
        <div className="dbm-inv__grand"><span>Budget</span><b>{inr(50000)}</b></div>
      </div>
      <div className="dbm-inv__ft">🧾 Your spending snapshot · Lean Hyphen 💚</div>
    </motion.div>
  );
}

export default function DreamBedroomAct3({ onComplete, onGoHome }) {
  const a1 = useMemo(loadAct1, []);
  const [screen, setScreen] = useState('intro'); // intro | quiz | result
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);

  const q = QUESTIONS[idx];
  const choose = (oi) => {
    if (picked !== null) return;
    setPicked(oi);
    if (q.options[oi].correct) setScore((s) => s + 1);
  };
  const next = () => {
    if (idx + 1 >= QUESTIONS.length) { setScreen('result'); return; }
    setIdx((i) => i + 1); setPicked(null);
  };

  const badge = BADGES.find((b) => score >= b.min);
  const closing = closingLine(a1);

  return (
    <div className="dbm dbm--study dbm-act3" style={{ '--accent': ACCENT, '--glow': GLOW }}>
      <div className="dbm__bg">
        <div className="dbm__bg-blob dbm__bg-blob--1" /><div className="dbm__bg-blob dbm__bg-blob--2" /><div className="dbm__bg-grid" />
        {[{ x: 10, s: 4, d: 13, delay: 0 }, { x: 24, s: 3, d: 16, delay: 2.4 }, { x: 38, s: 5, d: 12, delay: 1.1 },
          { x: 54, s: 3, d: 17, delay: 3.2 }, { x: 68, s: 4, d: 14, delay: 0.7 }, { x: 82, s: 3, d: 18, delay: 2.1 },
          { x: 92, s: 5, d: 15, delay: 3.8 }].map((m, i) => (
          <span key={i} className="dbm__bg-mote dbm-act3__mote" style={{ left: `${m.x}%`, width: m.s, height: m.s, animationDuration: `${m.d}s`, animationDelay: `${m.delay}s` }} />
        ))}
        {/* big rotating ring + floating quiz glyphs for an animated quiz backdrop */}
        <span className="dbm-act3__ring dbm-act3__ring--1" />
        <span className="dbm-act3__ring dbm-act3__ring--2" />
        {['₹', '%', '✓', '50/30/20', '₹', '＝'].map((g, i) => (
          <span key={i} className={`dbm-act3__glyph dbm-act3__glyph--${i}`}>{g}</span>
        ))}
      </div>

      <header className="dbm__topbar">
        <button className="dbm__home" onClick={onGoHome} title="Home"><Home size={16} /></button>
        <div className="dbm__steps">
          {QUESTIONS.map((_, i) => (
            <span key={i} className={`dbm__step ${screen === 'quiz' && i <= idx ? 'is-on' : ''} ${screen === 'result' ? 'is-on' : ''} ${screen === 'quiz' && i === idx ? 'is-now' : ''}`} />
          ))}
        </div>
        <div className="dbm__nowtitle">{screen === 'result' ? 'Your result' : `Act 3 · Knowledge Check`}</div>
        <span style={{ width: 34 }} />
      </header>

      <main className="dbm__main">
        <div className="dbm__screenwrap">
          <AnimatePresence mode="wait">
            {/* ---------- INTRO ---------- */}
            {screen === 'intro' && (
              <motion.div key="intro" className="dbm-screen dbm-q__intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="dbm-eyebrow"><Sparkles size={14} /> Part 3 · Test your understanding</div>
                <div className="dbm-q__introicon">🧠</div>
                <h2 className="dbm-h2">Quick challenge — 6 questions</h2>
                <p className="dbm-q__introsub">Use everything you just learnt in the simulation and the 50/30/20 rule.</p>
                <button className="dbm-cta dbm-cta--big" onClick={() => setScreen('quiz')}>Start the quiz <ArrowRight size={17} /></button>
              </motion.div>
            )}

            {/* ---------- QUIZ ---------- */}
            {screen === 'quiz' && (
              <motion.div key={`q${idx}`} className="dbm-screen dbm-q" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                <div className="dbm-q__top">
                  <span className="dbm-q__num">Question {idx + 1}<span>/{QUESTIONS.length}</span></span>
                  <span className="dbm-q__tag">{q.tag}</span>
                </div>
                <div className="dbm-q__progress"><motion.div animate={{ width: `${(idx / QUESTIONS.length) * 100}%` }} /></div>
                <h2 className="dbm-q__question">{q.q}</h2>
                <div className="dbm-q__options">
                  {q.options.map((o, oi) => {
                    const state = picked === null ? '' : o.correct ? 'is-correct' : oi === picked ? 'is-wrong' : 'is-dim';
                    return (
                      <button key={oi} className={`dbm-q__opt ${state}`} onClick={() => choose(oi)} disabled={picked !== null}>
                        <span className="dbm-q__letter">{String.fromCharCode(65 + oi)}</span>
                        <span className="dbm-q__opttext">{o.t}</span>
                        {picked !== null && o.correct && <Check size={18} className="dbm-q__mark" />}
                        {picked !== null && !o.correct && oi === picked && <X size={18} className="dbm-q__mark" />}
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {picked !== null && (
                    <motion.div className={`dbm-q__fb ${q.options[picked].correct ? 'is-right' : 'is-soft'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="dbm-q__fbinner">
                        <div className="dbm-q__fbhead">
                          <span className="dbm-q__fbicon">{q.options[picked].correct ? <Check size={16} /> : '💡'}</span>
                          <strong>{q.options[picked].correct ? 'Correct!' : `Not quite — the answer is ${String.fromCharCode(65 + q.options.findIndex((o) => o.correct))}. ${q.options.find((o) => o.correct).t}`}</strong>
                        </div>
                        <p>{q.options[picked].correct ? q.right : q.wrong}</p>
                        {!q.options[picked].correct && <p className="dbm-q__fbwhy"><b>Why:</b> {q.right}</p>}
                      </div>
                      <button className="dbm-q__next" onClick={next}>{idx + 1 >= QUESTIONS.length ? 'See result' : 'Next'} <ArrowRight size={15} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ---------- RESULT ---------- */}
            {screen === 'result' && (
              <motion.div key="result" className="dbm-screen dbm-q__result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <Trophy className="dbm-q__trophy" />
                <div className="dbm-q__scorebig">{score}<span>/{QUESTIONS.length}</span></div>
                <div className="dbm-q__badge"><span className="dbm-q__badgeicon">{badge.emoji}</span> {badge.name}</div>
                <p className="dbm-q__badgetext">{badge.text}</p>
                {closing && <div className="dbm-q__closing">{closing}</div>}
                <div className="dbm-q__actions">
                  <button className="dbm-cta" onClick={() => { try { localStorage.removeItem('lh.dbm.act1.v1'); } catch { /* noop */ } window.location.href = '/lesson2/act1'; }}>
                    <RotateCcw size={16} /> Play again — new room style
                  </button>
                  <button className="dbm-q__btn2" onClick={() => setShowInvoice((v) => !v)}><Download size={16} /> {showInvoice ? 'Hide' : 'Show'} my spending snapshot</button>
                  <button className="dbm-q__btn3" onClick={onGoHome}><Home size={15} /> Back to lessons</button>
                </div>
                <AnimatePresence>{showInvoice && <Invoice a1={a1} />}</AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
