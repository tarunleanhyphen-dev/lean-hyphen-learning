/**
 * Central state for the Dream Bedroom Makeover (Lesson 3, Act 1).
 *
 * The cart is the source of truth — budget, category totals, needs/wants split
 * and event-driven removals all derive from it. A snapshot is autosaved to
 * localStorage so a refresh mid-simulation doesn't lose progress, but we always
 * re-enter at the intro so the learner re-watches the cinematic open.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogue } from '../../../../data/lessons/dreamBedroomMakeover.js';

const LS_KEY = 'lh.dbm.act1.v1';
const BUDGET_BASE = 50000;
const RESERVE_INIT = 2000;

const INITIAL = {
  screen: 'screen-1-intro',
  vibe: null,
  sortAnswers: {},      // { itemId: 'need' | 'want' }
  cart: [],             // ordered list of item ids
  reserve: RESERVE_INIT,
  savings: 0,
  budgetBonus: 0,
  fixedEventChoice: null,
  randomEvent: null,
  randomEventChoice: null,
  snapshotMcq: null,
  removedByEvent: [],
  sessionId: null,
  startedAt: null,
};

function load() {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function save(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota */ }
}
function buildIndex() {
  const idx = {};
  Object.entries(catalogue).forEach(([categoryId, cat]) => {
    cat.items.forEach((it) => { idx[it.id] = { ...it, categoryId }; });
  });
  return idx;
}
function rid() {
  try { return 'dbm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16); }
  catch { return 'dbm_' + Math.random().toString(36).slice(2, 14); }
}

export function useMakeover() {
  const itemIndex = useMemo(buildIndex, []);

  const [state, setState] = useState(() => {
    // DEV-only: ?dev=<screen> boots straight onto a screen with sample state
    // seeded, so each screen can be screenshotted/tested in isolation.
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      const dev = new URLSearchParams(window.location.search).get('dev');
      if (dev) {
        return {
          ...INITIAL, sessionId: rid(), startedAt: new Date().toISOString(),
          screen: dev, vibe: 'gamer',
          cart: ['bed-premium', 'wardrobe-budget', 'study-desk', 'gaming-chair', 'led-strips', 'desk-lamp', 'posters', 'mirror'],
          randomEvent: dev.includes('events')
            ? { id: 'coupon', title: 'Discount Coupon!', good: true, text: 'You found a ₹1,500 coupon for home furnishings.', options: [{ id: 'spend-it', label: "Spend it on a Want you couldn't afford", consequence: 'Spent it.', effect: { budgetBonus: 1500 } }, { id: 'save-it', label: 'Keep it as extra savings', consequence: 'Saved it.', effect: { savings: 1500 } }] }
            : null,
        };
      }
    }
    const stored = load();
    if (stored) return { ...INITIAL, ...stored, screen: 'screen-1-intro' };
    return { ...INITIAL, sessionId: rid(), startedAt: new Date().toISOString() };
  });

  useEffect(() => { save(state); }, [state]);

  /* ---- derived ---- */
  const cartItems = useMemo(() => state.cart.map((id) => itemIndex[id]).filter(Boolean), [state.cart, itemIndex]);
  const spent = useMemo(() => cartItems.reduce((s, it) => s + it.price, 0), [cartItems]);
  const budgetTotal = BUDGET_BASE + (state.budgetBonus || 0);
  const spendable = budgetTotal - state.reserve;
  const remaining = spendable - spent;

  const categoryTotals = useMemo(() => {
    const totals = Object.fromEntries(Object.keys(catalogue).map((k) => [k, 0]));
    cartItems.forEach((it) => { totals[it.categoryId] = (totals[it.categoryId] || 0) + it.price; });
    return totals;
  }, [cartItems]);

  const needsTotal = useMemo(() => cartItems.filter((it) => it.type === 'need').reduce((s, it) => s + it.price, 0), [cartItems]);
  const wantsTotal = useMemo(() => cartItems.filter((it) => it.type === 'want').reduce((s, it) => s + it.price, 0), [cartItems]);
  const needsCount = useMemo(() => cartItems.filter((it) => it.type === 'need').length, [cartItems]);
  const wantsCount = useMemo(() => cartItems.filter((it) => it.type === 'want').length, [cartItems]);

  /* ---- mutators ---- */
  const setScreen     = useCallback((screen) => setState((s) => ({ ...s, screen })), []);
  const pickVibe      = useCallback((vibe)   => setState((s) => ({ ...s, vibe })),   []);
  const setSortAnswer = useCallback((itemId, choice) =>
    setState((s) => ({ ...s, sortAnswers: { ...s.sortAnswers, [itemId]: choice } })), []);
  const resetSort = useCallback(() => setState((s) => ({ ...s, sortAnswers: {} })), []);

  const addItem = useCallback((itemId) => setState((s) => {
    const it = itemIndex[itemId];
    if (!it || s.cart.includes(itemId)) return s;
    const cart = s.cart.filter((id) => !(it.siblings || []).includes(id));
    return { ...s, cart: [...cart, itemId] };
  }), [itemIndex]);

  const removeItem = useCallback((itemId) =>
    setState((s) => ({ ...s, cart: s.cart.filter((id) => id !== itemId) })), []);

  const toggleItem = useCallback((itemId) => setState((s) => {
    if (s.cart.includes(itemId)) return { ...s, cart: s.cart.filter((id) => id !== itemId) };
    const it = itemIndex[itemId];
    if (!it) return s;
    const cart = s.cart.filter((id) => !(it.siblings || []).includes(id));
    return { ...s, cart: [...cart, itemId] };
  }), [itemIndex]);

  /** Apply a surprise-event effect. The cart genuinely mutates. */
  const applyEventEffect = useCallback((eventKind, choiceId, effect) => {
    setState((s) => {
      const next = { ...s };
      if (eventKind === 'fixed') next.fixedEventChoice = choiceId;
      else                       next.randomEventChoice = choiceId;

      if (effect.reserveSpent != null) next.reserve = Math.max(0, s.reserve - effect.reserveSpent);
      if (effect.reserveBonus)         next.reserve = next.reserve + effect.reserveBonus;
      if (effect.savings)              next.savings = (s.savings || 0) + effect.savings;
      if (effect.budgetBonus)          next.budgetBonus = (s.budgetBonus || 0) + effect.budgetBonus;

      let cart = next.cart || s.cart;
      if (effect.swap) cart = cart.map((id) => (id === effect.swap.from ? effect.swap.to : id));

      const wantsOf = (c) => c.map((id) => itemIndex[id]).filter((it) => it && it.type === 'want');
      const removeIds = (c, ids) => c.filter((id) => !ids.includes(id));
      const removed = [];

      if (effect.requireRemoveSmallWant) {
        const wants = wantsOf(cart).sort((a, b) => a.price - b.price);
        if (wants[0]) { cart = removeIds(cart, [wants[0].id]); removed.push(wants[0].id); }
      }
      if (effect.requireRemoveWantCount) {
        const take = wantsOf(cart).sort((a, b) => a.price - b.price).slice(0, effect.requireRemoveWantCount).map((w) => w.id);
        cart = removeIds(cart, take); removed.push(...take);
      }
      if (effect.requireRemoveWantValue) {
        const wants = wantsOf(cart);
        const pick = wants.filter((w) => w.price >= effect.requireRemoveWantValue).sort((a, b) => a.price - b.price)[0]
          || wants.sort((a, b) => b.price - a.price)[0];
        if (pick) { cart = removeIds(cart, [pick.id]); removed.push(pick.id); }
      }
      if (effect.fallbackRequireRemoveWant && s.reserve <= 0) {
        const wants = wantsOf(cart).sort((a, b) => a.price - b.price);
        if (wants[0]) { cart = removeIds(cart, [wants[0].id]); removed.push(wants[0].id); }
      }

      next.cart = cart;
      next.removedByEvent = [...(s.removedByEvent || []), ...removed];
      return next;
    });
  }, [itemIndex]);

  const setRandomEvent = useCallback((event) => setState((s) => ({ ...s, randomEvent: event })), []);
  const setSnapshotMcq = useCallback((mcq)   => setState((s) => ({ ...s, snapshotMcq: mcq })),   []);
  const reset = useCallback(() => setState({ ...INITIAL, sessionId: rid(), startedAt: new Date().toISOString() }), []);

  return {
    state, itemIndex,
    cartItems, spent, remaining, spendable,
    categoryTotals, needsTotal, wantsTotal, needsCount, wantsCount,
    budget: { total: budgetTotal, base: BUDGET_BASE, reserve: state.reserve, spendable, bonus: state.budgetBonus || 0 },
    setScreen, pickVibe, setSortAnswer, resetSort,
    addItem, removeItem, toggleItem,
    applyEventEffect, setRandomEvent, setSnapshotMcq, reset,
  };
}
