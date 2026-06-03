/**
 * Dream Bedroom Makeover — all six screens.
 *
 * Each narration screen speaks its lines on mount and only unlocks its CTA
 * once Kabir has finished reading (or the learner taps Skip). Interactive
 * screens (Sort, Shop, Events) wait for the learner instead.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Check, X, Lock, Sparkles, Mail, RotateCw, PartyPopper,
  AlertTriangle, ShoppingBag, Trophy, Info,
} from 'lucide-react';
import { lesson, sortItems, catalogue, surpriseEvents } from '../../../../data/lessons/dreamBedroomMakeover.js';
import { sounds, isAudioReady } from '../../../../utils/sounds.js';
import { Room3D } from './Room3D.jsx';
import { IsoRoom2D } from './IsoRoom2D.jsx';
import { ItemArt } from './ItemArt.jsx';
import { Tracker, Donut, fmt, useCount } from './Tracker.jsx';
import { NarratorCard } from './NarratorCard.jsx';

/* ---------------- helpers ---------------- */
function sfx(name) { try { if (isAudioReady()) sounds[name]?.(); } catch { /* noop */ } }
function scene(id) { return lesson.scenes.find((s) => s.id === id); }
const BANDS = scene('screen-4-shop').budgetBands;

/** Speak a screen's lines on mount; expose done + replay/skip. */
function useScreenNarration(narration, lines) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDone(false);
    narration.narrate(lines, () => setDone(true));
    return () => narration.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    done,
    replay: () => narration.replay(lines),
    skip: () => { sfx('tap'); narration.skip(); setDone(true); },
  };
}

function CTA({ children, onClick, disabled, accent = '#A855F7', big }) {
  return (
    <motion.button
      className={`dbm-cta ${big ? 'dbm-cta--big' : ''}`}
      style={{ '--accent': accent }}
      onClick={() => { if (!disabled) { sfx('click'); onClick?.(); } }}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children} <ArrowRight size={18} />
    </motion.button>
  );
}

function Toast({ show, children, tone = 'bad' }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`dbm-toast dbm-toast--${tone}`}
          initial={{ opacity: 0, y: 24, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 24, x: '-50%' }}
        >
          <AlertTriangle size={16} /> {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ======================================================================
 * SCREEN 1 — Intro & Hook
 * ====================================================================== */
export function Screen1Intro({ mk, narration, accent }) {
  const s = scene('screen-1-intro');
  const n = useScreenNarration(narration, s.narration);

  return (
    <div className="dbm-screen dbm-screen--intro">
      <div className="dbm-intro__grid">
        <div className="dbm-intro__left">
          <motion.div className="dbm-eyebrow" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles size={14} /> Where Does My Money Go? · Act 1
          </motion.div>
          <motion.h1 className="dbm-intro__title" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            Dream Bedroom <span style={{ color: accent }}>Makeover</span>
          </motion.h1>
          <NarratorCard narration={narration} lines={s.narration} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} />
          <div className="dbm-intro__cta">
            <CTA accent={accent} disabled={!n.done} onClick={() => mk.setScreen('screen-2-vibe')} big>
              {n.done ? s.cta : 'Listen first…'}
            </CTA>
          </div>
        </div>

        <div className="dbm-intro__right">
          <BudgetHero accent={accent} />
        </div>
      </div>
    </div>
  );
}

function BudgetHero({ accent }) {
  const val = useCount(50000, 1400);
  return (
    <motion.div className="dbm-budgethero" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
      <div className="dbm-budgethero__glow" style={{ background: accent }} />
      <div className="dbm-budgethero__room">
        <IsoRoom2D vibe={lesson.vibes[0]} cart={['bed-budget', 'study-desk', 'wardrobe-budget', 'desk-lamp', 'posters']} />
      </div>
      <div className="dbm-budgethero__chip">
        <span>Your budget</span>
        <strong style={{ color: accent }}>{fmt(val)}</strong>
        <small>one time · no top-ups</small>
      </div>
    </motion.div>
  );
}

/* ======================================================================
 * SCREEN 2 — Pick Your Vibe
 * ====================================================================== */
export function Screen2Vibe({ mk, narration, accent }) {
  const s = scene('screen-2-vibe');
  const n = useScreenNarration(narration, [s.intro, s.hint]);
  const [picked, setPicked] = useState(mk.state.vibe);

  const pick = (id) => { sfx('add'); setPicked(id); mk.pickVibe(id); };

  return (
    <div className="dbm-screen dbm-screen--vibe">
      <h2 className="dbm-h2">Pick your style</h2>
      <NarratorCard narration={narration} lines={[s.intro, s.hint]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} mood="happy" compact />

      <div className="dbm-vibes">
        {lesson.vibes.map((v, i) => (
          <motion.button
            key={v.id}
            className={`dbm-vibe ${picked === v.id ? 'is-picked' : ''}`}
            style={{ '--accent': v.accent, '--wall': v.wall, '--floor': v.floor, '--glow': v.glow }}
            onClick={() => pick(v.id)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            whileHover={{ y: -6 }}
          >
            <div className="dbm-vibe__preview">
              <IsoRoom2D vibe={v} cart={v.id === 'gamer' ? ['bed-budget', 'gaming-chair', 'led-strips', 'study-desk'] : v.id === 'study' ? ['study-desk', 'basic-chair', 'bookshelf', 'desk-lamp'] : v.id === 'minimal' ? ['bed-budget', 'study-desk'] : ['bed-budget', 'wardrobe-budget', 'posters', 'desk-lamp']} />
            </div>
            <div className="dbm-vibe__body">
              <span className="dbm-vibe__emoji">{v.emoji}</span>
              <div>
                <div className="dbm-vibe__label">{v.label}</div>
                <div className="dbm-vibe__tag">{v.tagline}</div>
              </div>
              {picked === v.id && <div className="dbm-vibe__check"><Check size={16} /></div>}
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {picked && (
          <motion.div className="dbm-confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {s.confirmation}
          </motion.div>
        )}
      </AnimatePresence>

      <CTA accent={accent} disabled={!picked} onClick={() => mk.setScreen('screen-2-rules')}>{s.cta}</CTA>
    </div>
  );
}

/* ======================================================================
 * SCREEN 2b — Ground Rules
 * ====================================================================== */
export function Screen2Rules({ mk, narration, accent }) {
  const s = scene('screen-2-rules');
  const n = useScreenNarration(narration, [s.intro, s.outro]);

  return (
    <div className="dbm-screen dbm-screen--rules">
      <h2 className="dbm-h2">Ground rules</h2>
      <NarratorCard narration={narration} lines={[s.intro, s.outro]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />

      <div className="dbm-rules">
        {s.rules.map((r, i) => (
          <motion.div key={i} className="dbm-rule" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 * i }}>
            <div className="dbm-rule__icon">{r.icon}</div>
            <div className="dbm-rule__title">{r.title}</div>
            <div className="dbm-rule__text">{r.text}</div>
          </motion.div>
        ))}
      </div>

      <div className="dbm-rules__hint"><Info size={14} /> The tracker stays on screen the whole time you shop — watch every rupee land in its bucket.</div>

      <CTA accent={accent} disabled={!n.done} onClick={() => mk.setScreen('screen-3-sort')}>{s.cta}</CTA>
    </div>
  );
}

/* ======================================================================
 * SCREEN 3 — Sort It Out (Needs vs Wants)
 * ====================================================================== */
export function Screen3Sort({ mk, narration, accent }) {
  const s = scene('screen-3-sort');
  useScreenNarration(narration, [s.intro]);

  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // { item, choice, text, grey }
  const [drop, setDrop] = useState(null); // 'need' | 'want' burst

  const item = sortItems[idx];
  const finished = idx >= sortItems.length;

  const choose = (choice) => {
    if (!item || feedback) return;
    sfx(choice === item.correct ? 'ding' : 'tap');
    mk.setSortAnswer(item.id, choice);
    setDrop(choice);
    setTimeout(() => setDrop(null), 600);
    const text = item.feedback[choice];
    narration.say(text);
    setFeedback({ item, choice, text, grey: item.isGreyArea });
  };

  const next = () => {
    sfx('click');
    setFeedback(null);
    setIdx((i) => i + 1);
  };

  if (finished) {
    return <SortSummary mk={mk} accent={accent} narration={narration} />;
  }

  return (
    <div className="dbm-screen dbm-screen--sort">
      <h2 className="dbm-h2">Need it or want it?</h2>
      <NarratorCard narration={narration} lines={[s.intro]} accent={accent} done compact size={92}
        onReplay={() => narration.replay([s.intro])} onSkip={() => narration.skip()} />

      <div className="dbm-sort__progress">
        Item {idx + 1} of {sortItems.length}
        <div className="dbm-sort__progressbar"><motion.div animate={{ width: `${(idx / sortItems.length) * 100}%` }} /></div>
      </div>

      <div className="dbm-sort__arena">
        <Bucket kind="need" accent="#10B981" burst={drop === 'need'} label="NEED" sub="can't go without" />

        <div className="dbm-sort__cardzone">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              className="dbm-sortcard"
              initial={{ opacity: 0, y: -24, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="dbm-sortcard__art"><ItemArt art={item.art} size={88} /></div>
              <div className="dbm-sortcard__name">{item.name}</div>
              <div className="dbm-sortcard__price">{fmt(item.price)}</div>
              {item.isGreyArea && <div className="dbm-sortcard__grey">🤔 grey area</div>}
            </motion.div>
          </AnimatePresence>
        </div>

        <Bucket kind="want" accent="#A855F7" burst={drop === 'want'} label="WANT" sub="nice to have" />
      </div>

      {!feedback ? (
        <div className="dbm-sort__buttons">
          <button className="dbm-sortbtn dbm-sortbtn--need" onClick={() => choose('need')}>It's a Need</button>
          <button className="dbm-sortbtn dbm-sortbtn--want" onClick={() => choose('want')}>It's a Want</button>
        </div>
      ) : (
        <motion.div className={`dbm-feedback ${feedback.choice === feedback.item.correct ? 'is-right' : 'is-soft'} ${feedback.grey ? 'is-grey' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dbm-feedback__icon">{feedback.grey ? '🤔' : feedback.choice === feedback.item.correct ? <Check size={18} /> : <Info size={18} />}</div>
          <p>{feedback.text}</p>
          <button className="dbm-feedback__next" onClick={next}>Next <ArrowRight size={15} /></button>
        </motion.div>
      )}
    </div>
  );
}

function Bucket({ kind, accent, burst, label, sub }) {
  return (
    <motion.div className={`dbm-bucket dbm-bucket--${kind}`} style={{ '--accent': accent }} animate={burst ? { scale: [1, 1.12, 1] } : {}}>
      <div className="dbm-bucket__mouth" />
      <div className="dbm-bucket__label">{label}</div>
      <div className="dbm-bucket__sub">{sub}</div>
      <AnimatePresence>
        {burst && (
          <motion.div className="dbm-bucket__burst" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 2.2, opacity: 0 }} exit={{ opacity: 0 }} style={{ borderColor: accent }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SortSummary({ mk, accent, narration }) {
  const s = scene('screen-3-sort');
  const answers = mk.state.sortAnswers;
  const needsVal = sortItems.filter((it) => answers[it.id] === 'need').reduce((a, it) => a + it.price, 0);
  const wantsVal = sortItems.filter((it) => answers[it.id] === 'want').reduce((a, it) => a + it.price, 0);
  const n = useScreenNarration(narration, [s.summaryHeading, s.summaryOutro]);
  useEffect(() => { sfx('reveal'); }, []);
  const total = needsVal + wantsVal || 1;

  return (
    <div className="dbm-screen dbm-screen--sortsum">
      <PartyPopper className="dbm-sortsum__pop" />
      <h2 className="dbm-h2">{s.summaryHeading}</h2>
      <div className="dbm-sortsum__grid">
        <SummaryCard label="You marked as Needs" value={needsVal} color="#10B981" pct={Math.round((needsVal / total) * 100)} />
        <div className="dbm-sortsum__donut">
          <Donut categoryTotals={{}} spent={0} size={150} />
          <DonutTwo needs={needsVal} wants={wantsVal} />
        </div>
        <SummaryCard label="You marked as Wants" value={wantsVal} color="#A855F7" pct={Math.round((wantsVal / total) * 100)} />
      </div>
      <NarratorCard narration={narration} lines={[s.summaryHeading, s.summaryOutro]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />
      <CTA accent={accent} disabled={!n.done} onClick={() => mk.setScreen('screen-4-shop')}><ShoppingBag size={17} /> {s.cta}</CTA>
    </div>
  );
}

function SummaryCard({ label, value, color, pct }) {
  const v = useCount(value, 900);
  return (
    <motion.div className="dbm-sumcard" style={{ '--c': color }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="dbm-sumcard__label">{label}</div>
      <div className="dbm-sumcard__val">{fmt(v)}</div>
      <div className="dbm-sumcard__pct">{pct}% of total</div>
    </motion.div>
  );
}

function DonutTwo({ needs, wants }) {
  const total = needs + wants || 1;
  const r = 63, c = 2 * Math.PI * r, size = 150;
  const nDash = (needs / total) * c;
  return (
    <svg className="dbm-donut2" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#A855F7" strokeWidth="14" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#10B981" strokeWidth="14"
        strokeDasharray={`${nDash} ${c - nDash}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
      <text x="50%" y="54%" textAnchor="middle" className="dbm-donut2__txt">{Math.round((needs / total) * 100)}%<tspan x="50%" dy="16" className="dbm-donut2__sub">Needs</tspan></text>
    </svg>
  );
}

/* ======================================================================
 * SCREEN 4 — Shop Smart (the centerpiece)
 * ====================================================================== */
export function Screen4Shop({ mk, narration, vibe, accent }) {
  const s = scene('screen-4-shop');
  useScreenNarration(narration, [s.intro, s.sub, s.tip]);

  const [toast, setToast] = useState(null);
  const [shake, setShake] = useState(false);
  const [oppo, setOppo] = useState(null); // { oc, itemId }
  const toastTimer = useRef(null);

  const { spent, spendable, needsCount, cartItems } = mk;
  const inCart = (id) => mk.state.cart.includes(id);
  const valid = needsCount >= s.gates.minNeeds && spent <= spendable;

  const flashToast = (msg, tone = 'bad') => {
    sfx('alert');
    setToast({ msg, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const priceOfSiblingInCart = (item) => {
    const sib = (item.siblings || []).find((id) => inCart(id));
    return sib ? mk.itemIndex[sib].price : 0;
  };

  const handleClick = (item) => {
    if (inCart(item.id)) { sfx('tap'); mk.removeItem(item.id); return; }
    const projected = spent - priceOfSiblingInCart(item) + item.price;
    if (projected > spendable) {
      flashToast(s.gates.overBudgetMessage);
      setShake(true); setTimeout(() => setShake(false), 500);
      return;
    }
    // opportunity-cost teaching moment (premium upgrades)
    const oc = s.opportunityCosts.find((o) => o.when.added === item.id && inCart(o.when.removed));
    if (oc) { sfx('freeze'); setOppo({ oc, itemId: item.id }); return; }
    sfx('add'); mk.addItem(item.id);
  };

  const confirmOppo = () => {
    if (oppo) { sfx('add'); mk.addItem(oppo.itemId); }
    setOppo(null);
  };

  const tryProceed = () => {
    if (needsCount < s.gates.minNeeds) { flashToast(s.gates.insufficientNeedsMessage); return; }
    if (spent > spendable) { flashToast(s.gates.overBudgetMessage); return; }
    sfx('ding'); mk.setScreen('screen-5-events');
  };

  return (
    <div className="dbm-screen dbm-screen--shop">
      <div className="dbm-shop">
        {/* LEFT — live simulation + counting */}
        <div className={`dbm-shop__left ${shake ? 'is-shake' : ''}`}>
          <div className="dbm-shop__roomwrap">
            <Room3D vibe={vibe} cart={mk.state.cart} className="dbm-shop__room" />
            <div className="dbm-shop__roomtag">Live 3D preview · {cartItems.length} items</div>
          </div>
          <Tracker mk={mk} bands={BANDS} />
        </div>

        {/* RIGHT — catalogue */}
        <div className="dbm-shop__right">
          <div className="dbm-shop__header">
            <h2 className="dbm-h2">Shop smart</h2>
            <p className="dbm-shop__intro">{s.intro}</p>
            <p className="dbm-shop__sub"><Lock size={12} /> {s.sub}</p>
            <p className="dbm-shop__tip"><Sparkles size={12} /> {s.tip}</p>
          </div>

          {Object.entries(catalogue).map(([catId, cat]) => (
            <div key={catId} className="dbm-catgroup">
              <div className="dbm-catgroup__head" style={{ '--c': cat.color }}>
                <span className="dbm-catgroup__icon">{cat.icon}</span> {cat.label}
              </div>
              <div className="dbm-catgroup__items">
                {cat.items.map((item) => {
                  const selected = inCart(item.id);
                  const projected = spent - priceOfSiblingInCart(item) + item.price;
                  const wouldOver = !selected && projected > spendable;
                  return (
                    <ShopCard key={item.id} item={item} selected={selected} wouldOver={wouldOver} color={cat.color} onClick={() => handleClick(item)} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* sticky action bar */}
      <div className="dbm-shop__action">
        <div className="dbm-shop__needs">
          <span className={needsCount >= s.gates.minNeeds ? 'is-ok' : ''}>
            {needsCount >= s.gates.minNeeds ? <Check size={14} /> : null}
            {needsCount}/{s.gates.minNeeds} Needs
          </span>
          <span className="dbm-shop__remain">{fmt(mk.remaining)} left</span>
        </div>
        <motion.button
          className="dbm-cta dbm-shop__go"
          style={{ '--accent': accent }}
          onClick={tryProceed}
          animate={valid ? { scale: [1, 1.05, 1] } : {}}
          transition={valid ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.4 } : {}}
          data-valid={valid}
        >
          {s.cta} <ArrowRight size={17} />
        </motion.button>
      </div>

      <Toast show={!!toast} tone={toast?.tone}>{toast?.msg}</Toast>

      <AnimatePresence>
        {oppo && <OpportunityModal oc={oppo.oc} mk={mk} accent={accent} onConfirm={confirmOppo} onCancel={() => { sfx('tap'); setOppo(null); }} />}
      </AnimatePresence>
    </div>
  );
}

function ShopCard({ item, selected, wouldOver, color, onClick }) {
  return (
    <motion.button
      className={`dbm-shopcard ${selected ? 'is-selected' : ''} ${wouldOver ? 'is-over' : ''}`}
      style={{ '--c': color }}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      layout
    >
      <div className="dbm-shopcard__badge" data-type={item.type}>{item.type === 'need' ? 'Need' : 'Want'}</div>
      {item.tierLabel && <div className={`dbm-shopcard__tier dbm-shopcard__tier--${item.tier}`}>{item.tierLabel}</div>}
      <div className="dbm-shopcard__art"><ItemArt art={item.art} size={62} /></div>
      <div className="dbm-shopcard__name">{item.name}</div>
      <div className="dbm-shopcard__price">{fmt(item.price)}</div>
      <div className="dbm-shopcard__add">
        {selected ? <><Check size={14} /> Added</> : wouldOver ? 'Over budget' : <>+ Add</>}
      </div>
    </motion.button>
  );
}

function OpportunityModal({ oc, mk, accent, onConfirm, onCancel }) {
  const tradeItems = (oc.tradeFor || []).map((id) => mk.itemIndex[id]).filter(Boolean);
  return (
    <motion.div className="dbm-modal__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="dbm-modal" style={{ '--accent': accent }} initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}>
        <div className="dbm-modal__icon">⚖️</div>
        <h3>{oc.title}</h3>
        <p>{oc.message}</p>
        <div className="dbm-modal__trade">
          <span>That money could buy:</span>
          <div className="dbm-modal__tradeitems">
            {tradeItems.map((it) => (
              <div key={it.id} className="dbm-modal__tradeitem">
                <ItemArt art={it.art} size={40} />
                <small>{it.name}</small>
                <b>{fmt(it.price)}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="dbm-modal__actions">
          <button className="dbm-modal__no" onClick={onCancel}>Keep my pick</button>
          <button className="dbm-modal__yes" onClick={onConfirm}>Upgrade anyway</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ======================================================================
 * SCREEN 5 — Surprise Events
 * ====================================================================== */
export function Screen5Events({ mk, narration, vibe, accent }) {
  const s = scene('screen-5-events');
  const [phase, setPhase] = useState('intro'); // intro | fixed | spin | random | done
  const [cons, setCons] = useState(null);
  const n = useScreenNarration(narration, [s.intro]);

  const fixed = surpriseEvents.fixedEvent;
  const randomEv = mk.state.randomEvent;

  const pickFixed = (opt) => {
    sfx(fixed.bad ? 'alert' : 'ding');
    mk.applyEventEffect('fixed', opt.id, opt.effect);
    setCons({ text: opt.consequence, next: () => setPhase('spin') });
    narration.say(opt.consequence);
  };

  const spin = () => {
    sfx('reveal');
    const ev = surpriseEvents.randomEvents[Math.floor(Math.random() * surpriseEvents.randomEvents.length)];
    mk.setRandomEvent(ev);
    setTimeout(() => setPhase('random'), 1500);
  };

  const pickRandom = (opt) => {
    sfx(randomEv.good ? 'ding' : 'alert');
    mk.applyEventEffect('random', opt.id, opt.effect);
    setCons({ text: opt.consequence, next: () => mk.setScreen('screen-6-snapshot') });
    narration.say(opt.consequence);
  };

  return (
    <div className="dbm-screen dbm-screen--events">
      <div className="dbm-events__grid">
        <div className="dbm-events__stage">
          {phase === 'intro' && (
            <motion.div className="dbm-envelope" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <h2 className="dbm-h2">Plot twists</h2>
              <NarratorCard narration={narration} lines={[s.intro]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />
              <motion.div className="dbm-envelope__icon" animate={{ rotate: [0, -4, 4, 0], y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.6 }}>
                <Mail size={64} />
              </motion.div>
              <p className="dbm-envelope__line">{s.envelopeLine}</p>
              <CTA accent={accent} disabled={!n.done} onClick={() => { sfx('reveal'); setPhase('fixed'); }}>{s.envelopeCta}</CTA>
            </motion.div>
          )}

          {phase === 'fixed' && (
            <EventCard event={fixed} accent={accent} onPick={pickFixed} />
          )}

          {phase === 'spin' && (
            <motion.div className="dbm-spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="dbm-h2">One more twist…</h2>
              <p className="dbm-envelope__line">{s.spinLine}</p>
              <motion.div className="dbm-wheel" animate={randomEv ? { rotate: 1080 } : {}} transition={{ duration: 1.4, ease: 'easeOut' }}>
                <RotateCw size={72} />
              </motion.div>
              <CTA accent={accent} disabled={!!randomEv} onClick={spin}>{s.spinCta}</CTA>
            </motion.div>
          )}

          {phase === 'random' && randomEv && (
            <EventCard event={randomEv} accent={accent} onPick={pickRandom} />
          )}
        </div>

        <div className="dbm-events__side">
          <div className="dbm-events__roomwrap">
            <Room3D vibe={vibe} cart={mk.state.cart} className="dbm-events__room" />
          </div>
          <Tracker mk={mk} bands={BANDS} compact />
        </div>
      </div>

      <AnimatePresence>
        {cons && <ConsequenceModal text={cons.text} accent={accent} onClose={() => { const nx = cons.next; setCons(null); nx?.(); }} />}
      </AnimatePresence>
    </div>
  );
}

function EventCard({ event, accent, onPick }) {
  const bad = event.bad;
  return (
    <motion.div className={`dbm-eventcard ${bad ? 'is-bad' : 'is-good'}`} initial={{ opacity: 0, y: 24, rotateX: 12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}>
      <div className="dbm-eventcard__tag">{bad ? '⚠️ Surprise' : '🎁 Good news'}</div>
      <h3 className="dbm-eventcard__title">{event.title}</h3>
      <p className="dbm-eventcard__text">{event.text}</p>
      <div className="dbm-eventcard__options">
        {event.options.map((opt) => (
          <button key={opt.id} className="dbm-eventopt" style={{ '--accent': accent }} onClick={() => onPick(opt)}>
            {opt.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ConsequenceModal({ text, accent, onClose }) {
  return (
    <motion.div className="dbm-modal__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="dbm-modal" style={{ '--accent': accent }} initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}>
        <div className="dbm-modal__icon">💡</div>
        <p className="dbm-modal__cons">{text}</p>
        <div className="dbm-modal__actions">
          <button className="dbm-modal__yes" onClick={onClose}>Got it</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ======================================================================
 * SCREEN 6 — Spending Snapshot
 * ====================================================================== */
export function Screen6Snapshot({ mk, narration, accent, onComplete }) {
  const s = scene('screen-6-snapshot');
  const n = useScreenNarration(narration, [s.intro]);
  useEffect(() => { sfx('reveal'); }, []);

  const { spent, categoryTotals, needsTotal, wantsTotal, budget } = mk;
  const reserveStatus = mk.state.reserve >= 2000 ? 'intact' : 'used';
  const saved = (budget.total) - spent - mk.state.reserve + (mk.state.savings || 0);

  const insights = useMemo(() => buildInsights(s.insightTemplates, { categoryTotals, spent, wantsTotal, reserveStatus }), [categoryTotals, spent, wantsTotal, reserveStatus, s.insightTemplates]);

  const catRows = Object.entries(catalogue).map(([id, cat]) => ({ id, label: cat.label, color: cat.color, val: categoryTotals[id] || 0 }));
  const biggest = catRows.reduce((a, b) => (b.val > a.val ? b : a), catRows[0]);

  const [mcq, setMcq] = useState(mk.state.snapshotMcq);
  const answerMcq = (id) => {
    if (mcq) return;
    sfx(id === biggest.id ? 'ding' : 'tap');
    setMcq(id); mk.setSnapshotMcq(id);
  };

  return (
    <div className="dbm-screen dbm-screen--snapshot">
      <h2 className="dbm-h2">Spending snapshot</h2>
      <NarratorCard narration={narration} lines={[s.intro]} accent={accent} done={n.done} onReplay={n.replay} onSkip={n.skip} compact />

      <div className="dbm-snap__grid">
        <div className="dbm-snap__donut">
          <Donut categoryTotals={categoryTotals} spent={spent} size={180} />
        </div>

        <div className="dbm-snap__stats">
          <SnapStat label="Spent" value={spent} color={accent} />
          <SnapStat label="Saved / left" value={Math.max(0, saved)} color="#10B981" />
          <SnapStat label="Needs" value={needsTotal} color="#10B981" />
          <SnapStat label="Wants" value={wantsTotal} color="#A855F7" />
          <div className={`dbm-snap__reserve ${reserveStatus}`}>
            <Lock size={14} /> Reserve {reserveStatus === 'intact' ? 'kept safe' : 'used'} · {fmt(mk.state.reserve)}
          </div>
        </div>

        <div className="dbm-snap__cats">
          {catRows.map((c) => (
            <div key={c.id} className="dbm-snap__catrow">
              <span className="dbm-snap__catdot" style={{ background: c.color }} />
              <span className="dbm-snap__catlbl">{c.label}</span>
              <div className="dbm-snap__catbar"><motion.div animate={{ width: `${spent ? (c.val / spent) * 100 : 0}%` }} style={{ background: c.color }} /></div>
              <span className="dbm-snap__catval">{fmt(c.val)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dbm-snap__insights">
        {insights.map((t, i) => (
          <motion.div key={i} className="dbm-insight" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }}>
            <Sparkles size={15} /> {t}
          </motion.div>
        ))}
      </div>

      {/* MCQ */}
      <div className="dbm-mcq">
        <div className="dbm-mcq__q">{s.mcq.question}</div>
        <div className="dbm-mcq__opts">
          {catRows.map((c) => {
            const chosen = mcq === c.id;
            const correct = c.id === biggest.id;
            return (
              <button key={c.id} className={`dbm-mcq__opt ${mcq ? (correct ? 'is-correct' : chosen ? 'is-wrong' : 'is-dim') : ''}`} onClick={() => answerMcq(c.id)} disabled={!!mcq}>
                {c.label}
                {mcq && correct && <Check size={15} />}
                {mcq && chosen && !correct && <X size={15} />}
              </button>
            );
          })}
        </div>
        {mcq && (
          <motion.div className="dbm-mcq__fb" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {mcq === biggest.id ? `Correct! ${biggest.label} took the biggest chunk — ${fmt(biggest.val)}.` : `Actually, ${biggest.label} took the most — ${fmt(biggest.val)}. Check your tracker!`}
          </motion.div>
        )}
      </div>

      <div className="dbm-snap__transition">
        <Trophy size={20} />
        <strong>{s.transitionTitle}</strong>
        <span>{s.transitionSub}</span>
      </div>

      <CTA accent={accent} disabled={!n.done || !mcq} onClick={() => onComplete?.()} big>{s.cta}</CTA>
    </div>
  );
}

function SnapStat({ label, value, color }) {
  const v = useCount(value, 800);
  return (
    <div className="dbm-snapstat" style={{ '--c': color }}>
      <span className="dbm-snapstat__lbl">{label}</span>
      <span className="dbm-snapstat__val">{fmt(v)}</span>
    </div>
  );
}

function buildInsights(templates, ctx) {
  const out = [];
  const { categoryTotals, spent, wantsTotal, reserveStatus } = ctx;
  const total = spent || 1;
  templates.forEach((t) => {
    const m = t.match;
    if (m.categoryShareGte) {
      const [cat, gte] = Object.entries(m.categoryShareGte)[0];
      if ((categoryTotals[cat] || 0) / total >= gte) out.push(t.template.replace('{furniturePct}', Math.round((categoryTotals[cat] || 0) / total * 100)));
    } else if (m.wantsShareGte != null) {
      if (wantsTotal / total >= m.wantsShareGte) out.push(t.template.replace('{wantsPct}', Math.round(wantsTotal / total * 100)));
    } else if (m.reserveStatus) {
      if (m.reserveStatus === reserveStatus) out.push(t.template);
    }
  });
  if (!out.length) out.push('Nicely balanced! You spread your budget across needs and a few wants.');
  return out;
}
