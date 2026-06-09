/**
 * Banyanpro LMS bridge.
 *
 * Maps our internal analytics events (the ones already emitted across both
 * lessons) onto Banyanpro's Activity Tracker. This is the ONE place that
 * decides what gets reported to the LMS, so:
 *   • We forward only *meaningful* learning events (lesson/act lifecycle +
 *     graded activities) — not every micro-interaction, per Banyanpro's guide.
 *   • Forwarding happens ONLY when embedded in the LMS iframe; a direct visit
 *     to the lesson site is a silent no-op (the tracker guards on this too).
 *
 * Our own backend analytics pipeline is untouched — this runs alongside it.
 */
import realTracker from './banyanproTracker.js';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';

// Human-readable names shown in the LMS teacher/student reports.
const LESSONS = {
  'think-before-you-spend': {
    name: 'Think Before You Spend',
    acts: {
      act1: 'Act 1 — Temptation',
      act2: 'Act 2 — Understanding Impulse Buying',
      act3: 'Act 3 — Real-life Simulation',
      act4: 'Act 4 — Reflect & Realise',
    },
  },
  'where-does-my-money-go': {
    name: 'Where Does My Money Go?',
    acts: {
      act1: 'Act 1 — Dream Bedroom Makeover',
      act2: 'Act 2 — The 50/30/20 Rule',
      act3: 'Act 3 — Test Your Understanding',
    },
  },
};

const ACTIVITY_NAMES = {
  // Lesson 2
  'a1-sort': 'Needs vs Wants Sort',
  'a1-snapshot-mcq': 'Spending Snapshot Question',
  'a2-firstsalary': "Who's Nailing Their First Salary?",
  'a3-quiz': 'Understanding Quiz',
  // Lesson 1
  'thought-spiral': 'Mind Trap (drag game)',
  'impulse-cards': 'Impulse Flash Cards',
  's1-pick3': 'Pick-3 Challenge',
  meter: 'Impulse Meter',
  takeaways: 'Key Takeaways',
};

const lessonName = (id) => LESSONS[id]?.name || id;
const actName = (lessonId, actId) => LESSONS[lessonId]?.acts?.[actId] || actId;
const activityName = (id) => ACTIVITY_NAMES[id] || (/^add-/.test(id) ? `Add to cart (${id.replace('add-', '')})` : id);

// Stable object IDs (unique within the course, consistent across students).
const objIdLesson = (e) => `${e.lessonId}`;
const objIdAct = (e) => `${e.lessonId}:${e.actId}`;
const objIdActivity = (e) => `${e.lessonId}:${e.actId || '?'}:${e.activityId}`;

const secs = (ms) => (typeof ms === 'number' ? Math.round(ms / 1000) : undefined);
// a3-quiz reads as a QUIZ; everything else graded is an ACTIVITY.
const activityObjectType = (id) => (/quiz/i.test(id) ? 'QUIZ' : 'ACTIVITY');

/** Translate our activity `detail` into Banyanpro's result shape. */
export function buildResult(detail = {}, kind, timeMs) {
  const r = {};
  const d = secs(timeMs);
  if (d != null) r.duration = d;

  const { correct, total, accuracyPct, seen, revealed, zoneId, productId } = detail;
  let score;
  let max;
  if (typeof correct === 'number' && typeof total === 'number') { score = correct; max = total; }
  else if (typeof seen === 'number' && typeof total === 'number') { score = seen; max = total; }
  else if (typeof revealed === 'number' && typeof total === 'number') { score = revealed; max = total; }

  if (score != null && max != null) {
    r.score = score;
    r.maxScore = max;
    r.percentage = typeof accuracyPct === 'number' ? accuracyPct : (max ? Math.round((score / max) * 100) : 0);
    r.passed = kind !== 'activity_failed' && r.percentage >= 50;
  } else if (typeof accuracyPct === 'number') {
    r.percentage = accuracyPct;
    r.passed = kind !== 'activity_failed' && accuracyPct >= 50;
  }
  if (zoneId) r.response = String(zoneId);
  else if (productId) r.response = String(productId);

  return Object.keys(r).length ? r : null;
}

/**
 * Forward one internal analytics event to the LMS. `tracker`/`fetcher` are
 * injectable for testing; in the app they default to the real singleton + fetch.
 */
export function forwardToLms(e, { tracker = realTracker, fetcher = (typeof fetch !== 'undefined' ? fetch : null) } = {}) {
  try {
    if (!e || !e.lessonId) return;
    if (!tracker.isEmbedded || !tracker.isEmbedded()) return; // only inside the LMS iframe

    switch (e.kind) {
      case 'lesson_started':
        tracker.track('STARTED', 'LESSON', objIdLesson(e), lessonName(e.lessonId));
        break;

      case 'act_started':
        if (e.actId) tracker.track('STARTED', 'ACTIVITY', objIdAct(e), actName(e.lessonId, e.actId));
        break;

      case 'act_completed':
        if (e.actId) {
          tracker.track('COMPLETED', 'ACTIVITY', objIdAct(e), actName(e.lessonId, e.actId), {
            duration: secs(e.payload?.timeMs),
          });
        }
        break;

      case 'activity_completed':
      case 'activity_passed':
      case 'activity_failed': {
        if (!e.activityId) break;
        const result = buildResult(e.payload?.detail || {}, e.kind, e.payload?.timeMs);
        const isAdd = /^add-/.test(e.activityId);
        const verb = isAdd ? 'INTERACTED' : (e.kind === 'activity_failed' ? 'FAILED' : 'COMPLETED');
        tracker.track(verb, activityObjectType(e.activityId), objIdActivity(e), activityName(e.activityId), result, {
          attemptNumber: e.attemptNo || 1,
        });
        break;
      }

      case 'lesson_completed':
        // Pull the rolled-up total score from our own report (single source of
        // truth) and report a COMPLETED LESSON with the final score.
        emitLessonComplete(e, tracker, fetcher);
        break;

      default:
        break; // ignore micro events: scene_entered/completed, mcq_answered, option_selected, …
    }
  } catch {
    /* the LMS bridge must never break our analytics or the lesson */
  }
}

async function emitLessonComplete(e, tracker, fetcher) {
  let result = null;
  try {
    if (fetcher) {
      const res = await fetcher(`${API_BASE}/api/analytics/lms-export/${encodeURIComponent(e.lessonId)}?sessionId=${encodeURIComponent(e.sessionId)}`);
      const j = await res.json();
      const total = j?.export?.score?.total;
      if (typeof total === 'number') {
        result = { score: total, maxScore: 100, percentage: total, passed: total >= 50 };
      }
    }
  } catch {
    /* fall through and still report completion, just without a score */
  }
  tracker.track('COMPLETED', 'LESSON', objIdLesson(e), lessonName(e.lessonId), result);
}
