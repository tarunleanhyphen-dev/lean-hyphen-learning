/**
 * useAnalytics — high-level helpers for the Act/Scene/Activity tracking
 * pattern. Built on top of utils/analytics.js so the low-level batching
 * + offline queue is shared.
 *
 *   const a = useAnalytics({ sessionId, lessonId, actId: 'act1' });
 *
 *   // Lifecycle
 *   useEffect(() => { a.actStarted(); return () => a.actCompleted(); }, []);
 *
 *   // Per-scene auto-timed tracker
 *   useSceneAnalytics(a, sceneId);
 *
 *   // Activity attempts
 *   a.activityCompleted('thought-spiral', { detail: { correct: 12, total: 12 }});
 */

import { useEffect, useRef } from 'react';
import { track, flush } from '../utils/analytics.js';

/**
 * Pin a session + lesson + act context onto a thin object whose methods
 * all map to a single event kind.
 */
export function useAnalytics({ sessionId, lessonId, actId, lessonAttemptNo = 1 } = {}) {
  const ctx = { sessionId, lessonId, actId, lessonAttemptNo };

  // Stable ref so consumers can stash it inside other effects without
  // running them every time the parent re-renders.
  const ref = useRef(null);
  ref.current = ctx;

  return {
    lessonStarted: () => track('lesson_started',   ctx),
    lessonCompleted: (payload = {}) => track('lesson_completed', { ...ctx, payload }),
    lessonAbandoned: () => track('lesson_abandoned', ctx),
    actStarted:    () => track('act_started',      ctx),
    actCompleted:  (payload = {}) => track('act_completed',    { ...ctx, payload }),
    sceneEntered:  (sceneId, payload = {}) => track('scene_entered',
      { ...ctx, sceneId, payload }),
    sceneCompleted:(sceneId, payload = {}) => track('scene_completed',
      { ...ctx, sceneId, payload }),
    sceneSkipped:  (sceneId, payload = {}) => track('scene_skipped',
      { ...ctx, sceneId, payload }),
    activityStarted:  (activityId, payload = {}) =>
      track('activity_started',  { ...ctx, sceneId: payload.sceneId, activityId,
        attemptNo: payload.attemptNo ?? 1, payload }),
    activityCompleted:(activityId, payload = {}) =>
      track('activity_completed',{ ...ctx, sceneId: payload.sceneId, activityId,
        attemptNo: payload.attemptNo ?? 1, payload }),
    activityRetried:  (activityId, payload = {}) =>
      track('activity_retried',  { ...ctx, sceneId: payload.sceneId, activityId, payload }),
    activityPassed:   (activityId, payload = {}) =>
      track('activity_passed',   { ...ctx, sceneId: payload.sceneId, activityId, payload }),
    activityFailed:   (activityId, payload = {}) =>
      track('activity_failed',   { ...ctx, sceneId: payload.sceneId, activityId, payload }),
    interaction:      (kind, fields = {}) =>
      track(kind, { ...ctx, ...fields, payload: fields.payload ?? {} }),
    flush,
  };
}

/**
 * Auto-fire scene_entered on mount + scene_completed on unmount, with
 * the dwell-time computed for you. Drop this inside any scene wrapper
 * once you've got an `analytics` from useAnalytics().
 */
export function useSceneAnalytics(analytics, sceneId) {
  const enteredAtRef = useRef(0);
  useEffect(() => {
    if (!analytics || !sceneId) return undefined;
    enteredAtRef.current = Date.now();
    analytics.sceneEntered(sceneId);
    return () => {
      const timeMs = Date.now() - enteredAtRef.current;
      analytics.sceneCompleted(sceneId, { payload: { timeMs } });
    };
    // sceneId intentionally drives the effect — entering a new scene
    // should fire enter/exit again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);
}
