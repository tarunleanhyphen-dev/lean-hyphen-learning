/**
 * Banyanpro LMS Activity Tracker.
 *
 * This is the tracker class from Banyanpro's "Activity Tracker Integration
 * Guide" (v1.0), adapted to a singleton. When our course runs inside the
 * Banyanpro LMS iframe, calling these methods posts an activity event to the
 * parent LMS window via `postMessage` — the LMS attributes it to the logged-in
 * student and course automatically.
 *
 * Safe outside the LMS: every send checks `window.parent !== window`, so during
 * local dev or a direct (non-embedded) visit the calls are silent no-ops.
 *
 * We don't call these methods directly from components — `lmsBridge.js` maps our
 * existing analytics events onto them, so there's a single place that decides
 * what gets reported to the LMS.
 */

class BanyanproTracker {
  constructor() {
    this._sessionId = this._id();
    this._attempts = {};
  }

  /** True only when embedded in a parent window (i.e. the LMS iframe). */
  isEmbedded() {
    return typeof window !== 'undefined' && window.parent && window.parent !== window;
  }

  // ── Send one event to the LMS ────────────────────────────────────────
  track(verb, objectType, objectId, objectName, result, context) {
    const event = {
      eventId: this._id(),
      verb,
      objectType,
      objectId,
      objectName: objectName || null,
      result: result || null,
      context: { sessionId: this._sessionId, ...(context || {}) },
      timestamp: new Date().toISOString(),
    };

    if (this.isEmbedded()) {
      try {
        window.parent.postMessage({ type: 'LMS_TRACK_EVENT', payload: event }, '*');
      } catch {
        /* postMessage can throw in exotic sandboxes — never break the lesson */
      }
    }
    return event;
  }

  // ── Send several events in one message (≤ 50) ────────────────────────
  trackBatch(events) {
    if (!Array.isArray(events) || !events.length) return;
    if (this.isEmbedded()) {
      try {
        window.parent.postMessage({ type: 'LMS_TRACK_EVENTS_BATCH', payload: events.slice(0, 50) }, '*');
      } catch { /* noop */ }
    }
  }

  // ── Convenience methods (per Banyanpro's guide) ──────────────────────
  quizStarted(id, name) {
    return this.track('STARTED', 'QUIZ', id, name);
  }

  quizCompleted(id, name, result) {
    this._attempts[id] = (this._attempts[id] || 0) + 1;
    return this.track('COMPLETED', 'QUIZ', id, name, result, { attemptNumber: this._attempts[id] });
  }

  questionAnswered(id, name, result) {
    return this.track('ANSWERED', 'QUESTION', id, name, result);
  }

  activityStarted(id, name) {
    return this.track('STARTED', 'ACTIVITY', id, name);
  }

  activityCompleted(id, name, result) {
    return this.track('COMPLETED', 'ACTIVITY', id, name, result);
  }

  lessonProgressed(id, name, percentage) {
    return this.track('PROGRESSED', 'LESSON', id, name, { percentage });
  }

  videoWatched(id, name, result) {
    return this.track('COMPLETED', 'VIDEO', id, name, result);
  }

  // ── Internal ─────────────────────────────────────────────────────────
  _id() {
    // Avoids Date.now()/Math.random() purity concerns elsewhere; here in the
    // browser it's exactly what Banyanpro's guide specifies.
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
  }
}

const tracker = new BanyanproTracker();
export default tracker;
