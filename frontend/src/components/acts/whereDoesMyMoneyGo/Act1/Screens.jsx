/**
 * Six screens of Act 1 — rebuilt for top-tier UX.
 *
 * Design language:
 *   - The StyleCoach (top-left) carries all narration. Each screen passes
 *     its own narration lines + an onDone that advances the flow.
 *   - The interactive surface sits center-bottom with generous whitespace,
 *     big bold typography, and springy micro-interactions.
 *   - The 3D room is always in the background; we never leave it.
 *   - No wall-of-text panels. Narration is conversational; UI is decisive.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronRight, Check, Sparkles, AlertTriangle, Gift, Zap, Hammer } from 'lucide-react';
import {
  lesson, sortItems, catalogue, surpriseEvents,
} from '../../../../data/lessons/whereDoesMyMoneyGo.js';
import { StyleCoach } from './StyleCoach.jsx';
import { VIBES } from './Room3D.jsx';
import { sounds } from '../../../../utils/sounds.js';

/* Tiny safe-call wrapper so a missing/muted audio context never throws. */
function sfx(name) { try { sounds[name]?.(); } catch { /* noop */ } }

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function scene(id) { return lesson.acts.act1.scenes.find((s) => s.id === id); }

/* ============================================================
 * SCREEN 1 — Intro + Vibe Picker
 * StyleCoach narrates. Once narration ends, vibe wheel appears.
 * ============================================================ */
export function Screen1Intro({ mk }) {
  const s = scene('screen-1-intro');
  const [revealVibes, setRevealVibes] = useState(false);

  return (
    <>
      <StyleCoach
        lines={s.narration}
        name="Maya"
        vibeId="default"
        onDone={() => setRevealVibes(true)}
      />

      {/* Cinematic hero title — fades out once vibe picker appears. */}
      <AnimatePresence>
        {!revealVibes && (
          <motion.div
            className="herotitle"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="herotitle__eyebrow"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Lesson 2 · Act 1
            </motion.div>
            <motion.h1
              className="herotitle__main"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.45, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Dream Bedroom Makeover
            </motion.h1>
            <motion.div
              className="herotitle__sub"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              ₹50,000 · One room · Every rupee counts
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealVibes && (
          <motion.div
            className="stage stage--bottom"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          >
            <div className="stage__eyebrow">Step 1 of 6</div>
            <h1 className="stage__title">{s.vibePrompt}</h1>
            <div className="vibewheel">
              {s.vibes.map((v, i) => (
                <motion.button
                  key={v.id}
                  className="vibecard"
                  style={{ '--vibe-accent': v.accent }}
                  initial={{ opacity: 0, y: 24, rotateY: -8 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 220, damping: 18 }}
                  whileHover={{ y: -8, rotateY: 6, scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    sfx('ding');
                    mk.pickVibe(v.id);
                    setTimeout(() => mk.setScreen('screen-2-rules'), 700);
                  }}
                >
                  <div className="vibecard__halo" />
                  <div className="vibecard__emoji">{v.emoji}</div>
                  <div className="vibecard__label">{v.label}</div>
                  <div className="vibecard__sub">{v.sub}</div>
                </motion.button>
              ))}
            </div>
            {mk.state.vibe && (
              <motion.div
                className="vibe-confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Check size={14} /> Style locked in. Setting your room up…
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
 * SCREEN 2 — Rules
 * Stagger rule cards; CTA appears after the last one lands.
 * ============================================================ */
export function Screen2Rules({ mk }) {
  const s = scene('screen-2-rules');
  return (
    <>
      <StyleCoach
        lines={[s.intro, s.outro]}
        name="Maya"
        vibeId={mk.state.vibe}
      />
      <motion.div
        className="stage stage--bottom"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <div className="stage__eyebrow">Step 2 of 6 · Ground rules</div>
        <div className="rules">
          {s.rules.map((r, i) => (
            <motion.div
              key={i}
              className="rule"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <div className="rule__icon">{r.icon}</div>
              <div className="rule__text">{r.text}</div>
            </motion.div>
          ))}
        </div>
        <motion.button
          className="cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => { sfx('click'); mk.setScreen('screen-3-sort'); }}
        >
          {s.cta} <ChevronRight size={16} />
        </motion.button>
      </motion.div>
    </>
  );
}

/* ============================================================
 * SCREEN 3 — Sort: drag into NEED / WANT bucket
 * ============================================================ */
export function Screen3Sort({ mk }) {
  const s = scene('screen-3-sort');
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [throwDir, setThrowDir] = useState(null); // 'need' | 'want' | null
  const item = sortItems[idx];
  const isDone = idx >= sortItems.length;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-14, 14]);
  const needHi = useTransform(x, [-260, -60, 0], [1, 0.4, 0]);
  const wantHi = useTransform(x, [0, 60, 260], [0, 0.4, 1]);

  function commit(choice) {
    if (feedback) return;
    sfx(choice === item.correct ? 'ding' : 'tap');
    mk.setSortAnswer(item.id, choice);
    setThrowDir(choice);
    setFeedback({ choice, text: item.feedback[choice], isGrey: item.isGreyArea });
    setTimeout(() => {
      setFeedback(null);
      setThrowDir(null);
      x.set(0);
      setIdx((i) => i + 1);
    }, 2000);
  }

  function handleDragEnd(_, info) {
    const dx = info.offset.x + info.velocity.x * 0.2;
    if (dx < -120) return commit('need');
    if (dx >  120) return commit('want');
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
  }

  if (isDone) {
    const answers = mk.state.sortAnswers;
    const needsValue = sortItems.reduce((s, it) => s + (answers[it.id] === 'need' ? it.price : 0), 0);
    const wantsValue = sortItems.reduce((s, it) => s + (answers[it.id] === 'want' ? it.price : 0), 0);
    return (
      <>
        <StyleCoach
          lines={[s.summaryHeading, s.summaryOutro]}
          name="Maya"
          vibeId={mk.state.vibe}
        />
        <motion.div className="stage stage--bottom" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stage__eyebrow">Sort complete</div>
          <div className="sort-summary">
            <SortSummaryRow label="Needs"  value={needsValue} color="#10B981" />
            <SortSummaryRow label="Wants"  value={wantsValue} color="#8B5CF6" />
          </div>
          <button className="cta" onClick={() => { sfx('aha'); mk.setScreen('screen-4-shop'); }}>
            {s.cta} <ChevronRight size={16} />
          </button>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <StyleCoach
        lines={[s.intro]}
        name="Maya"
        vibeId={mk.state.vibe}
        autoAdvance
      />
      <div className="sort-arena">
        <div className="sort-arena__buckets">
          <motion.div className="bucket bucket--need" style={{ opacity: useTransform(needHi, [0, 1], [0.6, 1]) }}>
            <div className="bucket__chip">⬅️ NEED</div>
            <div className="bucket__hint">drag left for Need</div>
          </motion.div>
          <motion.div className="bucket bucket--want" style={{ opacity: useTransform(wantHi, [0, 1], [0.6, 1]) }}>
            <div className="bucket__chip">WANT ➡️</div>
            <div className="bucket__hint">drag right for Want</div>
          </motion.div>
        </div>

        <div className="sort-arena__center">
          <div className="sort-counter">{idx + 1} / {sortItems.length}</div>
          {/* Draggable card holds only visual content — buttons sit below
              as siblings so framer-motion drag never swallows their clicks. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              className="sortcard"
              drag={feedback ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              style={{ x, rotate }}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={throwDir
                ? { x: throwDir === 'need' ? -700 : 700, opacity: 0, rotate: throwDir === 'need' ? -25 : 25, transition: { duration: 0.5 } }
                : { opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <div className="sortcard__emoji">{item.icon}</div>
              <div className="sortcard__name">{item.name}</div>
              <div className="sortcard__price">{fmt(item.price)}</div>
              {item.isGreyArea && <div className="sortcard__grey">grey area · choose your reasoning</div>}
              <div className="sortcard__hint">drag left / right · or use the buttons below</div>
            </motion.div>
          </AnimatePresence>
          <div className="sortcard__tap">
            <button
              type="button"
              className="tapbtn tapbtn--need"
              onClick={() => commit('need')}
              disabled={!!feedback}
            >
              <Check size={16} /> NEED
            </button>
            <button
              type="button"
              className="tapbtn tapbtn--want"
              onClick={() => commit('want')}
              disabled={!!feedback}
            >
              <Sparkles size={16} /> WANT
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            className={`toast ${feedback.isGrey ? 'toast--grey' : feedback.choice === item?.correct ? 'toast--good' : 'toast--info'}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SortSummaryRow({ label, value, color }) {
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => fmt(n));
  useEffect(() => {
    const c = animate(v, value, { duration: 0.8, ease: 'easeOut' });
    return () => c.stop();
  }, [value]);
  return (
    <div className="sort-summary__row">
      <span className="sort-summary__chip" style={{ background: color }}>{label}</span>
      <motion.strong>{text}</motion.strong>
    </div>
  );
}

/* ============================================================
 * SCREEN 4 — Shop
 * ============================================================ */
export function Screen4Shop({ mk }) {
  const s = scene('screen-4-shop');
  const [oppCost, setOppCost] = useState(null);
  const { state, spent, budget, needsCount, toggleItem, cartItems } = mk;

  const overBudget  = spent > budget.spendable;
  const enoughNeeds = needsCount >= s.gates.minNeeds;
  const canCheckout = !overBudget && enoughNeeds && cartItems.length > 0;

  function handleAdd(item) {
    const matchedOC = s.opportunityCosts.find((oc) => oc.when.added === item.id);
    if (matchedOC && !state.cart.includes(item.id)) {
      sfx('alert');
      setOppCost({ message: matchedOC.message, itemId: item.id });
      return;
    }
    sfx(state.cart.includes(item.id) ? 'tap' : 'add');
    toggleItem(item.id);
  }

  return (
    <>
      <StyleCoach
        lines={[s.intro, s.tip]}
        name="Maya"
        vibeId={mk.state.vibe}
      />

      <motion.div
        className="stage stage--shop"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <div className="stage__eyebrow">Catalogue · {Object.values(catalogue).reduce((c, cat) => c + cat.items.length, 0)} items</div>

        <div className="catalog">
          {Object.entries(catalogue).map(([catId, cat]) => (
            <section key={catId} className="catalog__cat">
              <h4 className="catalog__cat-title">{cat.icon} {cat.label}</h4>
              <div className="catalog__grid">
                {cat.items.map((it) => {
                  const inCart = state.cart.includes(it.id);
                  return (
                    <motion.button
                      key={it.id}
                      className={`shopcard ${inCart ? 'shopcard--in' : ''} shopcard--${it.type}`}
                      onClick={() => handleAdd(it)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      layout
                    >
                      <div className="shopcard__top">
                        <span className={`shopcard__type shopcard__type--${it.type}`}>{it.type}</span>
                        {it.tier && <span className="shopcard__tier">{it.tier}</span>}
                      </div>
                      <div className="shopcard__name">{it.name}</div>
                      <div className="shopcard__price">{fmt(it.price)}</div>
                      <div className="shopcard__action">
                        {inCart ? <><Check size={12}/> In room</> : '+ Add to room'}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="stage__footer">
          {!enoughNeeds && (
            <div className="gate">
              <AlertTriangle size={14}/> {s.gates.insufficientNeedsMessage}
            </div>
          )}
          {overBudget && (
            <div className="gate gate--over">
              <AlertTriangle size={14}/> {s.gates.overBudgetMessage}
            </div>
          )}
          <button
            className="cta"
            disabled={!canCheckout}
            onClick={() => { sfx('reveal'); mk.setScreen('screen-5-events'); }}
          >
            {s.cta} <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {oppCost && (
          <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal"
              initial={{ scale: 0.86, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.86, opacity: 0 }}
            >
              <div className="modal__icon">⚖️</div>
              <h3>Opportunity cost</h3>
              <p>{oppCost.message}</p>
              <div className="modal__actions">
                <button className="btn btn--ghost" onClick={() => setOppCost(null)}>Stick with budget</button>
                <button className="btn btn--primary" onClick={() => { mk.toggleItem(oppCost.itemId); setOppCost(null); }}>
                  Upgrade anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
 * SCREEN 5 — Events
 * ============================================================ */
export function Screen5Events({ mk }) {
  const s = scene('screen-5-events');
  const [stage, setStage] = useState('intro');
  const [showConsequence, setShowConsequence] = useState(null);
  const { state, setRandomEvent, applyEventEffect } = mk;

  useEffect(() => {
    if (!state.randomEvent && stage === 'spin') {
      const pick = surpriseEvents.randomEvents[Math.floor(((state.cart.length * 7) + (Date.now() % 17)) % surpriseEvents.randomEvents.length)];
      setTimeout(() => setRandomEvent(pick), 2400);
    }
  }, [stage, state.randomEvent, state.cart.length, setRandomEvent]);

  function handlePick(eventKind, choice) {
    sfx('aha');
    applyEventEffect(eventKind, choice.id, choice.effect);
    setShowConsequence({ text: choice.consequence, next: eventKind === 'fixed' ? 'afterFixed' : 'done' });
  }

  function dismissConsequence() {
    const next = showConsequence.next;
    setShowConsequence(null);
    if (next === 'afterFixed') setStage('spin');
    if (next === 'done') mk.setScreen('screen-6-snapshot');
  }

  if (stage === 'intro') {
    return (
      <>
        <StyleCoach
          lines={[s.intro, s.envelopeLine]}
          name="Maya"
          vibeId={mk.state.vibe}
          onDone={() => { /* user opens the envelope themselves */ }}
        />
        <motion.div
          className="stage stage--bottom"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="stage__eyebrow">Plot twist incoming</div>
          <motion.button
            className="envelope"
            onClick={() => { sfx('reveal'); setStage('fixed'); }}
            whileHover={{ scale: 1.05, rotate: -3 }}
            whileTap={{ scale: 0.96 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
          >
            <div className="envelope__icon">✉️</div>
            <span>{s.envelopeCta}</span>
          </motion.button>
        </motion.div>
      </>
    );
  }

  if (stage === 'fixed') {
    const ev = surpriseEvents.fixedEvent;
    return (
      <>
        <StyleCoach lines={[ev.text]} name="Maya" vibeId={mk.state.vibe} autoAdvance />
        <EventStage event={ev} kind="bad" onPick={(c) => handlePick('fixed', c)} />
        <ConsequenceModal cons={showConsequence} onClose={dismissConsequence} />
      </>
    );
  }

  if (stage === 'spin') {
    return (
      <>
        <StyleCoach lines={['Another twist is on the way…']} name="Maya" vibeId={mk.state.vibe} autoAdvance />
        {!state.randomEvent ? (
          <motion.div className="wheel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div
              className="wheel__disc"
              animate={{ rotate: 1080 }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            >🎡</motion.div>
            <div className="wheel__hint">Spinning…</div>
          </motion.div>
        ) : (
          <>
            <EventStage event={state.randomEvent} kind={state.randomEvent.good ? 'good' : 'bad'} onPick={(c) => handlePick('random', c)} />
            <ConsequenceModal cons={showConsequence} onClose={dismissConsequence} />
          </>
        )}
      </>
    );
  }

  return null;
}

function EventStage({ event, kind, onPick }) {
  const Icon = kind === 'good' ? Gift : kind === 'bad' ? Zap : AlertTriangle;
  return (
    <motion.div
      className={`stage stage--bottom event-stage event-stage--${kind}`}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <div className="event-stage__head">
        <Icon size={18} />
        <h3>{event.title}</h3>
      </div>
      <p className="event-stage__text">{event.text}</p>
      <div className="event-stage__options">
        {event.options.map((opt) => (
          <motion.button
            key={opt.id}
            className="event-option"
            onClick={() => onPick(opt)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ConsequenceModal({ cons, onClose }) {
  return (
    <AnimatePresence>
      {cons && (
        <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="modal"
            initial={{ scale: 0.86, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.86, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <div className="modal__icon">{cons.next === 'done' ? '✨' : '💭'}</div>
            <h3>Here's what happened</h3>
            <p>{cons.text}</p>
            <button className="btn btn--primary" onClick={onClose}>
              Continue <ChevronRight size={14} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
 * SCREEN 6 — Snapshot
 * Hero number reveal + animated bar chart + MCQ
 * ============================================================ */
export function Screen6Snapshot({ mk, onComplete }) {
  const s = scene('screen-6-snapshot');
  const { state, spent, budget, categoryTotals, needsTotal, wantsTotal, cartItems } = mk;

  // Celebratory chord when the snapshot lands.
  useEffect(() => {
    const a = setTimeout(() => sfx('ding'), 400);
    const b = setTimeout(() => sfx('aha'),  900);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const reserveStatus = state.reserve >= 2000 ? 'intact' : 'used';
  const totalForPct = Math.max(1, spent);
  const furniturePct = Math.round((categoryTotals.furniture / totalForPct) * 100);
  const wantsPct = Math.round((wantsTotal / totalForPct) * 100);
  const saved = budget.total - spent - state.reserve + (state.savings || 0);

  const insights = useMemo(() => {
    const out = [];
    s.insightTemplates.forEach((tpl) => {
      const m = tpl.match;
      if (m.categoryShareGte) {
        const [catId, threshold] = Object.entries(m.categoryShareGte)[0];
        if ((categoryTotals[catId] || 0) / totalForPct >= threshold) {
          out.push(tpl.template.replaceAll('{furniturePct}', String(furniturePct)));
        }
      }
      if (m.wantsShareGte && (wantsTotal / totalForPct) >= m.wantsShareGte) {
        out.push(tpl.template.replaceAll('{wantsPct}', String(wantsPct)));
      }
      if (m.reserveStatus && m.reserveStatus === reserveStatus) out.push(tpl.template);
    });
    return out;
  }, [s, categoryTotals, totalForPct, wantsTotal, reserveStatus, furniturePct, wantsPct]);

  const categoryRows = Object.entries(catalogue).map(([catId, cat]) => ({
    id: catId, label: cat.label, icon: cat.icon, value: categoryTotals[catId] || 0,
  }));

  return (
    <>
      <StyleCoach lines={[s.intro]} name="Maya" vibeId={mk.state.vibe} autoAdvance />
      <ConfettiBurst accent={VIBES[mk.state.vibe]?.accent || '#10B981'} />
      <motion.div
        className="stage stage--bottom snapshot"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <div className="stage__eyebrow">Your snapshot</div>
        <div className="snapshot__hero">
          <div className="snapshot__hero-label">Total spent on your room</div>
          <HeroCount value={spent} />
          <div className="snapshot__hero-meta">
            of {fmt(budget.total)} · {Math.max(0, saved) > 0 ? `${fmt(Math.max(0, saved))} saved` : 'fully invested'} · reserve {reserveStatus}
          </div>
        </div>

        <div className="snapshot__bars">
          {categoryRows.map((row, i) => {
            const pct = Math.round((row.value / totalForPct) * 100);
            return (
              <motion.div
                key={row.id}
                className="snapshot__bar"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <div className="snapshot__bar-head">
                  <span>{row.icon} {row.label}</span>
                  <span><strong>{fmt(row.value)}</strong> <em>{pct}%</em></span>
                </div>
                <div className="snapshot__bar-track">
                  <motion.div
                    className="snapshot__bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="snapshot__needwant">
          <div><span className="tag tag--need">NEEDS</span> {fmt(needsTotal)} · {Math.round((needsTotal / totalForPct) * 100)}%</div>
          <div><span className="tag tag--want">WANTS</span> {fmt(wantsTotal)} · {Math.round((wantsTotal / totalForPct) * 100)}%</div>
        </div>

        {insights.length > 0 && (
          <div className="snapshot__insights">
            {insights.map((line, i) => (
              <motion.div
                key={i}
                className="snapshot__insight"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.12 }}
              >
                <Sparkles size={13} /> {line}
              </motion.div>
            ))}
          </div>
        )}

        <Mcq mk={mk} s={s} categoryRows={categoryRows} />

        <div className="snapshot__transition">
          <h3>{s.transitionTitle}</h3>
          <p>{s.transitionSub}</p>
          <button
            className="cta"
            onClick={() => {
              sfx('reveal');
              onComplete?.({
                spent, categoryTotals, needsTotal, wantsTotal,
                reserveStatus, insights, cartItems: cartItems.map((it) => it.id),
              });
            }}
          >
            <Hammer size={14} /> {s.cta} <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* Confetti — short, joyful burst at the top of the snapshot screen. */
function ConfettiBurst({ accent }) {
  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#FACC15', accent || '#10B981'].filter(Boolean);
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      x: 50 + (Math.random() - 0.5) * 14,    // start near top-center (%)
      angle: (Math.random() - 0.5) * 200,    // spread (px)
      drop: 60 + Math.random() * 38,         // fall distance (vh)
      delay: Math.random() * 0.2,
      duration: 1.6 + Math.random() * 1.4,
      size: 6 + Math.random() * 6,
      rot: (Math.random() - 0.5) * 540,
    })), []
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="confetti__piece"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: `${p.drop}vh`,
            x: p.angle,
            rotate: p.rot,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.85, 1],
          }}
        />
      ))}
    </div>
  );
}

function HeroCount({ value }) {
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => '₹' + Math.round(n).toLocaleString('en-IN'));
  useEffect(() => {
    const c = animate(v, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [value]);
  return <motion.div className="snapshot__hero-num">{text}</motion.div>;
}

function Mcq({ mk, s, categoryRows }) {
  const top = [...categoryRows].sort((a, b) => b.value - a.value)[0];
  const opts = categoryRows.map((r) => ({ id: r.id, label: `${r.icon} ${r.label}` }));
  const [picked, setPicked] = useState(mk.state.snapshotMcq);
  return (
    <div className="snap-mcq">
      <h4>{s.mcq.question}</h4>
      <div className="snap-mcq__opts">
        {opts.map((o) => {
          const correct = picked && o.id === top.id;
          const wrong   = picked === o.id && o.id !== top.id;
          return (
            <button
              key={o.id}
              className={`snap-mcq__opt ${correct ? 'is-correct' : ''} ${wrong ? 'is-wrong' : ''}`}
              disabled={!!picked}
              onClick={() => {
              setPicked(o.id);
              mk.setSnapshotMcq(o.id);
              sfx(o.id === top.id ? 'ding' : 'tap');
            }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {picked && (
        <motion.p className="snap-mcq__fb" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {picked === top.id
            ? `Spot on — ${top.label} was your biggest spend.`
            : `Actually ${top.label} took the biggest chunk. Reading your tracker pays off.`}
        </motion.p>
      )}
    </div>
  );
}
