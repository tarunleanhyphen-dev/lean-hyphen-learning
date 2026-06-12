/**
 * Lesson-3 ("Scam Smart") analytics binding.
 *
 * Wires the standalone Scam-Smart act components into the SAME event-sourced
 * analytics pipeline Lessons 1 & 2 use — identical event kinds, payload
 * shapes and LMS bridge — so the LMS reporting endpoints work identically
 * across all three lessons and the LMS team needs no changes.
 *
 *   • Identity = getSessionId() — reads ?learnerId= (LMS launch) or a
 *     persisted anonymous UUID. Same helper L1/L2 use, so a student keeps
 *     one identity across every lesson.
 *   • lessonAttemptNo — bumped each time the learner STARTS Act 1 fresh, so
 *     a full replay becomes a new attempt (history accumulates; the report
 *     shows the latest). Acts played in sequence share the same attempt.
 */
import { useState } from 'react';
import { useAnalytics } from '../../../hooks/useAnalytics.js';
import { getSessionId } from '../../../utils/api.js';

export const L3_LESSON_ID = 'scam-smart';
const ATTEMPT_KEY = 'lh.l3.attemptNo';

export function getL3AttemptNo() {
  try { return Number(localStorage.getItem(ATTEMPT_KEY)) || 1; } catch { return 1; }
}

/** Increment the attempt counter — call when Act 1 is (re)started. */
export function bumpL3AttemptNo() {
  try {
    const next = getL3AttemptNo() + 1;
    localStorage.setItem(ATTEMPT_KEY, String(next));
    return next;
  } catch { return getL3AttemptNo(); }
}

/**
 * Hook each Scam-Smart act uses to get a bound analytics tracker.
 * sessionId + lessonAttemptNo are captured once on mount (lazy init) so
 * they stay stable for the act's lifetime.
 *
 * Pass { bumpAttempt: true } from Act 1 — a fresh Act-1 entry starts a new
 * attempt, so a replay becomes a new session and history accumulates.
 */
export function useL3Analytics(actId, { bumpAttempt = false } = {}) {
  const [sessionId] = useState(getSessionId);
  const [lessonAttemptNo] = useState(() => (bumpAttempt ? bumpL3AttemptNo() : getL3AttemptNo()));
  return useAnalytics({ sessionId, lessonId: L3_LESSON_ID, actId, lessonAttemptNo });
}
