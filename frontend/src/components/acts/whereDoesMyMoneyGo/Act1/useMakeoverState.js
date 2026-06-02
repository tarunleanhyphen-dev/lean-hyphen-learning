/**
 * Central state for the Dream Bedroom Makeover (Act 1).
 *
 * Holds every decision the learner makes — vibe, sort answers, cart, the
 * surprise-event picks, the final MCQ — so any screen can read or mutate it
 * via a single hook. The cart is the source of truth: budget, category
 * totals, want/need split, and Want-removal queues all derive from it.
 *
 * Persistence: a snapshot is autosaved to localStorage so a refresh
 * mid-simulation doesn't lose progress.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogue } from '../../../../data/lessons/whereDoesMyMoneyGo.js';

const LS_KEY = 'lh.makeover.act1.v7';
const BUDGET_BASE = 50000;
const RESERVE_INIT = 2000;

const INITIAL = {
  screen: 'screen-1-intro',
  vibe: null,
  sortAnswers: {},   // { itemId: 'need' | 'want' }
  cart: [],          // ordered list of item ids
  reserve: RESERVE_INIT,
  savings: 0,
  budgetBonus: 0,    // extra budget from events
  fixedEventChoice: null,
  randomEvent: null,
  randomEventChoice: null,
  snapshotMcq: null,
  removedByEvent: [],  // ids removed automatically by a surprise event
  sessionId: null,
  startedAt: null,
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveToStorage(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota — ignore */ }
}

/** Flat lookup: id → item config. */
function buildItemIndex() {
  const idx = {};
  Object.entries(catalogue).forEach(([categoryId, cat]) => {
    cat.items.forEach((it) => { idx[it.id] = { ...it, categoryId }; });
  });
  return idx;
}

export function useMakeoverState() {
  const itemIndex = useMemo(buildItemIndex, []);
  const [state, setState] = useState(() => loadFromStorage() ?? {
    ...INITIAL,
    sessionId: cryptoRandom(),
    startedAt: new Date().toISOString(),
  });

  // Autosave to localStorage on any state change.
  useEffect(() => { saveToStorage(state); }, [state]);

  /* -------- derived state -------- */
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

  /* -------- mutators -------- */
  const setScreen   = useCallback((screen) => setState((s) => ({ ...s, screen })), []);
  const pickVibe    = useCallback((vibe)   => setState((s) => ({ ...s, vibe })),   []);
  const setSortAnswer = useCallback((itemId, choice) =>
    setState((s) => ({ ...s, sortAnswers: { ...s.sortAnswers, [itemId]: choice } })), []);

  const addItem = useCallback((itemId) => {
    setState((s) => {
      const it = itemIndex[itemId];
      if (!it) return s;
      if (s.cart.includes(itemId)) return s;
      // Auto-remove siblings (e.g. bed-budget vs bed-premium)
      const siblings = it.siblings || [];
      const cart = s.cart.filter((id) => !siblings.includes(id));
      return { ...s, cart: [...cart, itemId] };
    });
  }, [itemIndex]);

  const removeItem = useCallback((itemId) =>
    setState((s) => ({ ...s, cart: s.cart.filter((id) => id !== itemId) })), []);

  const toggleItem = useCallback((itemId) => {
    setState((s) => {
      if (s.cart.includes(itemId)) return { ...s, cart: s.cart.filter((id) => id !== itemId) };
      const it = itemIndex[itemId];
      if (!it) return s;
      const siblings = it.siblings || [];
      const cart = s.cart.filter((id) => !siblings.includes(id));
      return { ...s, cart: [...cart, itemId] };
    });
  }, [itemIndex]);

  /**
   * Apply an event effect — fully implemented so the cart actually changes.
   *
   * Effects supported:
   *   reserveSpent / reserveBonus / savings / budgetBonus
   *   swap                          — replace one item with another
   *   requireRemoveWantValue        — auto-remove the smallest Want whose price >= value
   *   requireRemoveWantCount        — auto-remove the N cheapest Wants
   *   requireRemoveSmallWant        — auto-remove the single cheapest Want
   *   fallbackRequireRemoveWant     — if reserve hit ₹0, also remove the cheapest Want
   *   allowExtraWant                — flag (cosmetic) so UI knows the player has headroom
   */
  const applyEventEffect = useCallback((eventKind, choiceId, effect) => {
    setState((s) => {
      const next = { ...s };
      if (eventKind === 'fixed') next.fixedEventChoice = choiceId;
      else                       next.randomEventChoice = choiceId;

      // Money effects
      const reserveAfter = effect.reserveSpent
        ? Math.max(0, s.reserve - effect.reserveSpent)
        : s.reserve;
      if (effect.reserveSpent != null) next.reserve = reserveAfter;
      if (effect.reserveBonus)         next.reserve = s.reserve + effect.reserveBonus;
      if (effect.savings)              next.savings = (s.savings || 0) + effect.savings;
      if (effect.budgetBonus)          next.budgetBonus = (s.budgetBonus || 0) + effect.budgetBonus;

      // Swap an item (e.g. wardrobe-budget → wardrobe-premium)
      let cart = next.cart || s.cart;
      if (effect.swap) {
        cart = cart.map((id) => (id === effect.swap.from ? effect.swap.to : id));
      }

      // Helpers — operate on a Cart array
      const wantsOf = (c) => c
        .map((id) => itemIndex[id])
        .filter((it) => it && it.type === 'want');
      const removeIds = (c, ids) => c.filter((id) => !ids.includes(id));

      const removed = [];

      if (effect.requireRemoveSmallWant) {
        const wants = wantsOf(cart);
        if (wants.length) {
          const cheapest = wants.sort((a, b) => a.price - b.price)[0];
          cart = removeIds(cart, [cheapest.id]);
          removed.push(cheapest.id);
        }
      }
      if (effect.requireRemoveWantCount) {
        const wants = wantsOf(cart).sort((a, b) => a.price - b.price);
        const take = wants.slice(0, effect.requireRemoveWantCount).map((w) => w.id);
        cart = removeIds(cart, take);
        removed.push(...take);
      }
      if (effect.requireRemoveWantValue) {
        const wants = wantsOf(cart);
        // Prefer the smallest Want priced >= required value, otherwise the most expensive Want.
        const eligible = wants.filter((w) => w.price >= effect.requireRemoveWantValue).sort((a, b) => a.price - b.price);
        const pick = eligible[0] || wants.sort((a, b) => b.price - a.price)[0];
        if (pick) {
          cart = removeIds(cart, [pick.id]);
          removed.push(pick.id);
        }
      }
      // Fallback: reserve was already empty, so eat a Want instead.
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

  const reset = useCallback(() => setState({
    ...INITIAL,
    sessionId: cryptoRandom(),
    startedAt: new Date().toISOString(),
  }), []);

  return {
    state, itemIndex,
    cartItems, spent, remaining, spendable,
    categoryTotals, needsTotal, wantsTotal, needsCount, wantsCount,
    budget: { total: budgetTotal, base: BUDGET_BASE, reserve: state.reserve, spendable, bonus: state.budgetBonus || 0 },
    setScreen, pickVibe, setSortAnswer,
    addItem, removeItem, toggleItem,
    applyEventEffect, setRandomEvent, setSnapshotMcq,
    reset,
  };
}

function cryptoRandom() {
  try {
    return 'mk_' + crypto.randomUUID().replace(/-/g, '').slice(0, 18);
  } catch {
    return 'mk_' + Math.random().toString(36).slice(2, 14);
  }
}
