/**
 * LMS debug bus.
 *
 * A tiny pub/sub the Banyanpro tracker writes to, and the on-screen
 * <LmsDebugOverlay> reads from. Lets a tester visually confirm — while the
 * course runs inside the LMS iframe — exactly which events are being sent to
 * Banyanpro (and whether we're even embedded, which is the usual culprit).
 *
 * Enable with `?lmsdebug=1` (persists for the session); disable with
 * `?lmsdebug=0`.
 */

const listeners = new Set();
let log = [];

export function lmsDebugEnabled() {
  try {
    if (typeof window === 'undefined') return false;
    const v = new URLSearchParams(window.location.search).get('lmsdebug');
    if (v === '1') { sessionStorage.setItem('lh.lmsdebug', '1'); return true; }
    if (v === '0') { sessionStorage.removeItem('lh.lmsdebug'); return false; }
    return sessionStorage.getItem('lh.lmsdebug') === '1';
  } catch {
    return false;
  }
}

/** Record one outgoing-event entry (called by the tracker). */
export function lmsDebugLog(entry) {
  // Keep the last 50; newest first for display.
  log = [{ ...entry }, ...log].slice(0, 50);
  listeners.forEach((fn) => { try { fn(log); } catch { /* noop */ } });
}

export function subscribeLmsDebug(fn) {
  listeners.add(fn);
  fn(log);
  return () => listeners.delete(fn);
}

export function clearLmsDebug() {
  log = [];
  listeners.forEach((fn) => { try { fn(log); } catch { /* noop */ } });
}
