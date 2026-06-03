/**
 * Event taxonomy for the analytics pipeline.
 *
 * Every meaningful learner interaction lands in `analytics_events` with a
 * `kind` from this list. Keep the list explicit (no free-form strings) so
 * the LMS reporting queries can rely on a stable enum.
 *
 * When adding a new event kind:
 *   1. Add it to EVENT_KINDS below.
 *   2. Add it (with its expected payload shape) to the frontend tracker.
 *   3. If it should bump a counter on user_scene/act_sessions, update the
 *      projection logic in routes/analytics.js -> projectEvent().
 */

export const EVENT_KINDS = Object.freeze({
  // ── Lifecycle ────────────────────────────────────────────────
  LESSON_STARTED:      'lesson_started',
  LESSON_COMPLETED:    'lesson_completed',
  LESSON_ABANDONED:    'lesson_abandoned',
  ACT_STARTED:         'act_started',
  ACT_COMPLETED:       'act_completed',
  SCENE_ENTERED:       'scene_entered',
  SCENE_COMPLETED:     'scene_completed',
  SCENE_SKIPPED:       'scene_skipped',

  // ── Activity lifecycle ───────────────────────────────────────
  ACTIVITY_STARTED:    'activity_started',
  ACTIVITY_COMPLETED:  'activity_completed',
  ACTIVITY_RETRIED:    'activity_retried',
  ACTIVITY_FAILED:     'activity_failed',
  ACTIVITY_PASSED:     'activity_passed',

  // ── Interaction-level ────────────────────────────────────────
  DRAG_DROP_COMPLETED: 'drag_drop_completed',
  MCQ_ANSWERED:        'mcq_answered',
  OPTION_SELECTED:     'option_selected',
  HINT_OPENED:         'hint_opened',
  REFLECTION_SUBMITTED:'reflection_submitted',
  SCENARIO_DECISION:   'scenario_decision',

  // ── Player controls ──────────────────────────────────────────
  PAUSE_CLICKED:       'pause_clicked',
  RESUME_CLICKED:      'resume_clicked',
  EXIT_CLICKED:        'exit_clicked',
  REPLAY_CLICKED:      'replay_clicked',
});

const VALID_KINDS = new Set(Object.values(EVENT_KINDS));

/**
 * Validate an incoming event payload from the frontend before we write
 * it to the events table. Anything failing validation is dropped (with
 * a warning in dev) — we deliberately don't 4xx the request so a single
 * malformed event can't break the batch.
 */
export function validateEvent(e) {
  if (!e || typeof e !== 'object') return { ok: false, reason: 'not an object' };
  if (!e.clientEventId || typeof e.clientEventId !== 'string') {
    return { ok: false, reason: 'clientEventId required' };
  }
  if (!VALID_KINDS.has(e.kind)) {
    return { ok: false, reason: `unknown kind: ${e.kind}` };
  }
  if (!e.sessionId || typeof e.sessionId !== 'string') {
    return { ok: false, reason: 'sessionId required' };
  }
  if (!e.clientTs || Number.isNaN(Date.parse(e.clientTs))) {
    return { ok: false, reason: 'clientTs (ISO string) required' };
  }
  return { ok: true };
}

/**
 * The set of event kinds that *advance* the learner's progress through
 * the lesson, i.e. the ones we use to compute completion percentage.
 * Engagement events (pause, hint, replay) deliberately don't count.
 */
export const PROGRESS_EVENTS = new Set([
  EVENT_KINDS.LESSON_STARTED,
  EVENT_KINDS.ACT_STARTED,
  EVENT_KINDS.ACT_COMPLETED,
  EVENT_KINDS.SCENE_ENTERED,
  EVENT_KINDS.SCENE_COMPLETED,
  EVENT_KINDS.ACTIVITY_COMPLETED,
  EVENT_KINDS.ACTIVITY_PASSED,
  EVENT_KINDS.LESSON_COMPLETED,
]);
