/**
 * Analytics client.
 *
 * Emits learner events to the backend `/api/analytics/events` ingest
 * endpoint. Designed to be fire-and-forget from caller code — every
 * track() call returns immediately; events are queued and flushed in
 * batches.
 *
 * Resilience:
 *   • Each event has a UUID, so retries are idempotent on the server.
 *   • Events queued while offline persist to `localStorage`; on next
 *     load we replay them in order.
 *   • Batches are flushed on:
 *       - a 2-second debounce after the latest enqueue
 *       - reaching MAX_BATCH (40 events)
 *       - `pagehide` / `beforeunload` (sendBeacon when the tab dies)
 *       - explicit flush() — used by post-Act / post-lesson screens
 *         that need to confirm everything's been persisted before
 *         requesting a fresh report.
 *
 * No external dependencies; works in every modern browser.
 */

import { forwardToLms } from '../lib/lmsBridge.js';

const STORAGE_KEY = 'lh.analyticsQueue.v1';
const MAX_BATCH = 40;
const FLUSH_DEBOUNCE_MS = 2000;

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';

let queue = loadQueue();
let flushTimer = null;
let inflight = false;

function loadQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Quota exceeded — drop oldest half. We'd rather lose the tail
    // than poison localStorage with an undeletable blob.
    queue = queue.slice(-Math.floor(MAX_BATCH));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); } catch {}
  }
}

function newId() {
  // Web crypto UUID where available; fallback to a random hex string
  // long enough that collisions are vanishingly unlikely. The backend
  // dedupes on this, so a clash would simply drop the event — not
  // corrupt anything.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const r = (n) => Math.random().toString(16).slice(2, 2 + n);
  return `${r(8)}-${r(4)}-${r(4)}-${r(4)}-${r(12)}`;
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, FLUSH_DEBOUNCE_MS);
}

/**
 * Push an event onto the queue. `sessionId` is required; everything
 * else is optional and depends on the event kind.
 *
 *   track('scene_entered', {
 *     sessionId, lessonId, actId, sceneId,
 *     payload: { ... },
 *   });
 */
export function track(kind, fields = {}) {
  if (!fields.sessionId) return;     // no session, no analytics
  const event = {
    clientEventId: newId(),
    kind,
    sessionId: fields.sessionId,
    lessonId:  fields.lessonId,
    actId:     fields.actId,
    sceneId:   fields.sceneId,
    activityId:fields.activityId,
    attemptNo: fields.attemptNo,
    lessonAttemptNo: fields.lessonAttemptNo,
    payload:   fields.payload ?? {},
    clientTs:  new Date().toISOString(),
  };
  queue.push(event);
  saveQueue();
  // Mirror meaningful events to the Banyanpro LMS (no-op unless embedded).
  forwardToLms(event);
  if (queue.length >= MAX_BATCH) flush();
  else scheduleFlush();
}

/**
 * Force-flush the queue. Returns a promise that resolves when the
 * server has accepted the current batch (or when the batch is empty).
 *
 * Post-Act / post-lesson dashboards await this before fetching the
 * report, so the numbers reflect the just-finished session.
 */
export async function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (inflight || queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  saveQueue();
  inflight = true;
  try {
    const r = await fetch(`${API_BASE}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
    if (!r.ok) throw new Error(`status ${r.status}`);
  } catch (err) {
    // Re-queue at the FRONT so order is preserved on retry.
    queue.unshift(...batch);
    saveQueue();
    // eslint-disable-next-line no-console
    if (import.meta.env?.DEV) console.warn('[analytics] flush failed', err?.message);
  } finally {
    inflight = false;
  }
  if (queue.length > 0) scheduleFlush();
}

/**
 * Best-effort flush at page unload. Modern browsers cancel pending
 * fetch() calls when the tab dies; sendBeacon is the only reliable
 * way to ship the tail of the queue.
 */
function beaconFlush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  saveQueue();
  try {
    const blob = new Blob([JSON.stringify({ events: batch })], {
      type: 'application/json',
    });
    navigator.sendBeacon(`${API_BASE}/api/analytics/events`, blob);
  } catch {
    // sendBeacon unsupported — put the batch back so the next load retries.
    queue.unshift(...batch);
    saveQueue();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', beaconFlush);
  window.addEventListener('beforeunload', beaconFlush);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') beaconFlush();
  });
}

/**
 * Convenience: bind a session/lesson context so callers don't have to
 * repeat the same fields on every track() call.
 *
 *   const a = makeTracker({ sessionId, lessonId });
 *   a.event('scene_entered', { actId: 'act1', sceneId: 'scene-0' });
 */
export function makeTracker(base) {
  return {
    event(kind, fields = {}) {
      return track(kind, { ...base, ...fields, payload: fields.payload });
    },
    flush,
  };
}
