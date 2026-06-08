/**
 * Lesson-2 ("Where Does My Money Go?") analytics binding.
 *
 * Wires the standalone Dream-Bedroom act components into the same
 * event-sourced analytics pipeline Lesson 1 uses, so the LMS report
 * endpoints work identically for both lessons.
 *
 *   • Identity = getSessionId() — reads ?learnerId= (LMS launch) or a
 *     persisted anonymous UUID. Same helper Lesson 1 uses, so a student
 *     keeps one identity across both lessons.
 *   • lessonAttemptNo — bumped each time the learner STARTS Act 1 fresh,
 *     so a full replay becomes a new attempt (history accumulates; the
 *     report shows the latest). Acts played in sequence within one run
 *     share the same attempt, so the report fills in act-by-act.
 */
import { useState } from 'react';
import { useAnalytics } from '../../../hooks/useAnalytics.js';
import { getSessionId } from '../../../utils/api.js';

export const L2_LESSON_ID = 'where-does-my-money-go';
const ATTEMPT_KEY = 'lh.l2.attemptNo';

export function getL2AttemptNo() {
  try { return Number(localStorage.getItem(ATTEMPT_KEY)) || 1; } catch { return 1; }
}

/** Increment the attempt counter — call when Act 1 is (re)started. */
export function bumpL2AttemptNo() {
  try {
    const next = getL2AttemptNo() + 1;
    localStorage.setItem(ATTEMPT_KEY, String(next));
    return next;
  } catch { return getL2AttemptNo(); }
}

/**
 * Hook each Dream-Bedroom act uses to get a bound analytics tracker.
 * sessionId + lessonAttemptNo are captured once on mount (useState lazy
 * init) so they stay stable for the act's lifetime.
 *
 * Pass { bumpAttempt: true } from Act 1 — a fresh Act-1 entry starts a new
 * attempt, so a replay becomes a new session and history accumulates.
 */
export function useL2Analytics(actId, { bumpAttempt = false } = {}) {
  const [sessionId] = useState(getSessionId);
  const [lessonAttemptNo] = useState(() => (bumpAttempt ? bumpL2AttemptNo() : getL2AttemptNo()));
  return useAnalytics({ sessionId, lessonId: L2_LESSON_ID, actId, lessonAttemptNo });
}
