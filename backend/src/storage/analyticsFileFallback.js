/**
 * File-based fallback for the analytics tables.
 *
 * Mirrors `fileFallback.js` for the existing progress/reflections routes,
 * so when `DATABASE_URL` is unset the analytics pipeline still works
 * end-to-end in dev. The shape of the JSON deliberately mirrors the SQL
 * tables (snake_case keys, BIGSERIAL → incrementing integers) so we can
 * lift the data into Postgres later with a one-shot migrate script.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Vercel's serverless filesystem is read-only EXCEPT for /tmp, which
// is writable but ephemeral (lives ~minutes per warm instance). For
// local dev we keep the durable `backend/data/analytics.json` so the
// file survives backend restarts. On Vercel we transparently fall over
// to /tmp; data lasts as long as the warm instance does. Production-
// grade durable storage is the Postgres backend (migration 004 ships
// with this commit — run `npm run migrate` against Supabase to enable,
// then flip `usingPg()` in routes/analytics.js).
const isServerlessRO = !!(process.env.VERCEL || process.env.VERCEL_ENV);
const DATA_PATH = isServerlessRO
  ? '/tmp/lh-analytics.json'
  : path.resolve(__dirname, '..', '..', 'data', 'analytics.json');

function readStore() {
  if (!fs.existsSync(DATA_PATH)) return blank();
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    // Migrate legacy / partial stores forward.
    return { ...blank(), ...parsed };
  } catch {
    return blank();
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function blank() {
  return {
    counters: {
      events: 0, lessonSessions: 0, actSessions: 0,
      sceneSessions: 0, activityAttempts: 0,
      scores: 0, badges: 0, attemptHistory: 0, learningProgress: 0,
    },
    analytics_events: [],
    user_lesson_sessions: [],
    user_act_sessions: [],
    user_scene_sessions: [],
    user_activity_attempts: [],
    user_scores: [],
    user_badges: [],
    user_attempt_history: [],
    user_learning_progress: [],
  };
}

function nextId(store, counterKey) {
  store.counters[counterKey] = (store.counters[counterKey] ?? 0) + 1;
  return store.counters[counterKey];
}

/**
 * Public surface — mirrors the function names the analytics route uses
 * for both the Postgres and file paths so the route can just check
 * `hasDb()` once and pick a backend.
 */
export const analyticsFileStore = {
  // ── events ──────────────────────────────────────────────────
  insertEventIfNew(event, userAgent) {
    const store = readStore();
    if (store.analytics_events.some((e) => e.client_event_id === event.clientEventId)) {
      return { inserted: false, reason: 'duplicate' };
    }
    const row = {
      id: nextId(store, 'events'),
      client_event_id: event.clientEventId,
      session_id: event.sessionId,
      lesson_id: event.lessonId ?? null,
      act_id: event.actId ?? null,
      scene_id: event.sceneId ?? null,
      activity_id: event.activityId ?? null,
      attempt_no: event.attemptNo ?? 1,
      event_kind: event.kind,
      event_payload: event.payload ?? {},
      client_ts: event.clientTs,
      server_ts: new Date().toISOString(),
      user_agent: userAgent || null,
    };
    store.analytics_events.push(row);
    writeStore(store);
    return { inserted: true, row };
  },

  // ── lookups for projection / reports ─────────────────────────
  getOrCreateLessonSession({ sessionId, lessonId, attemptNo = 1 }) {
    const store = readStore();
    let row = store.user_lesson_sessions.find(
      (r) => r.session_id === sessionId && r.lesson_id === lessonId && r.attempt_no === attemptNo,
    );
    if (row) return row;
    row = {
      id: nextId(store, 'lessonSessions'),
      session_id: sessionId,
      lesson_id: lessonId,
      attempt_no: attemptNo,
      started_at: new Date().toISOString(),
      completed_at: null,
      abandoned_at: null,
      total_time_ms: 0,
      idle_time_ms: 0,
      total_score: 0,
      completion_pct: 0,
      learning_score: 0,
      engagement_score: 0,
      badge_set: [],
    };
    store.user_lesson_sessions.push(row);
    writeStore(store);
    return row;
  },

  updateLessonSession(lessonSessionId, patch) {
    const store = readStore();
    const row = store.user_lesson_sessions.find((r) => r.id === lessonSessionId);
    if (!row) return null;
    Object.assign(row, patch);
    writeStore(store);
    return row;
  },

  getOrCreateActSession({ lessonSessionId, actId }) {
    const store = readStore();
    let row = store.user_act_sessions.find(
      (r) => r.lesson_session_id === lessonSessionId && r.act_id === actId,
    );
    if (row) return row;
    row = {
      id: nextId(store, 'actSessions'),
      lesson_session_id: lessonSessionId,
      act_id: actId,
      started_at: new Date().toISOString(),
      completed_at: null,
      total_time_ms: 0,
      score: 0,
      points_earned: 0,
      points_max: 25,
      completion_pct: 0,
      accuracy_pct: null,
      activities_completed: 0,
      activities_skipped: 0,
    };
    store.user_act_sessions.push(row);
    writeStore(store);
    return row;
  },

  updateActSession(actSessionId, patch) {
    const store = readStore();
    const row = store.user_act_sessions.find((r) => r.id === actSessionId);
    if (!row) return null;
    Object.assign(row, patch);
    writeStore(store);
    return row;
  },

  getOrCreateSceneSession({ actSessionId, sceneId }) {
    const store = readStore();
    let row = store.user_scene_sessions.find(
      (r) => r.act_session_id === actSessionId && r.scene_id === sceneId,
    );
    if (row) return row;
    row = {
      id: nextId(store, 'sceneSessions'),
      act_session_id: actSessionId,
      scene_id: sceneId,
      entered_at: new Date().toISOString(),
      exited_at: null,
      total_time_ms: 0,
      interaction_count: 0,
      click_count: 0,
      retry_count: 0,
      skipped: false,
      completed: false,
      points_earned: 0,
    };
    store.user_scene_sessions.push(row);
    writeStore(store);
    return row;
  },

  updateSceneSession(sceneSessionId, patch) {
    const store = readStore();
    const row = store.user_scene_sessions.find((r) => r.id === sceneSessionId);
    if (!row) return null;
    Object.assign(row, patch);
    writeStore(store);
    return row;
  },

  recordActivityAttempt(row) {
    const store = readStore();
    const persisted = { id: nextId(store, 'activityAttempts'), ...row };
    store.user_activity_attempts.push(persisted);
    writeStore(store);
    return persisted;
  },

  // ── report-time bulk reads ──────────────────────────────────
  readSessionTree({ sessionId, lessonId, attemptNo }) {
    const store = readStore();
    // When no attempt is specified, return the LATEST attempt (highest
    // attempt_no). Previously this returned `.find()`'s first match,
    // which is the EARLIEST attempt — wrong for the default report
    // view where students expect to see their most recent try.
    const matching = store.user_lesson_sessions.filter(
      (r) => r.session_id === sessionId && r.lesson_id === lessonId
            && (attemptNo == null || r.attempt_no === attemptNo),
    );
    if (!matching.length) return null;
    const session = attemptNo == null
      ? matching.reduce((a, b) => (b.attempt_no > a.attempt_no ? b : a))
      : matching[0];
    const acts = store.user_act_sessions.filter((r) => r.lesson_session_id === session.id);
    const sceneIds = new Set(acts.map((a) => a.id));
    const scenes = store.user_scene_sessions.filter((r) => sceneIds.has(r.act_session_id));
    const sceneIdSet = new Set(scenes.map((s) => s.id));
    const attempts = store.user_activity_attempts.filter((r) => sceneIdSet.has(r.scene_session_id));
    const badges = store.user_badges.filter((r) => r.lesson_session_id === session.id);
    const history = store.user_attempt_history.find(
      (r) => r.session_id === sessionId && r.lesson_id === lessonId,
    );
    return { session, acts, scenes, attempts, badges, history };
  },

  /**
   * List EVERY attempt this learner has on this lesson, latest first.
   * Each item is a mini-report (score + completion + time + badges) —
   * not the full report tree (cheaper to compute, smaller payload).
   * Use the `/lesson?attempt=N` endpoint to drill into one.
   */
  listAttempts({ sessionId, lessonId }) {
    const store = readStore();
    const matching = store.user_lesson_sessions
      .filter((r) => r.session_id === sessionId && r.lesson_id === lessonId)
      .sort((a, b) => b.attempt_no - a.attempt_no);
    return matching.map((s) => ({
      attemptNo:       s.attempt_no,
      completed:       !!s.completed_at,
      startedAt:       s.started_at,
      completedAt:     s.completed_at,
      totalScore:      s.total_score,
      learningScore:   s.learning_score,
      engagementScore: s.engagement_score,
      completionPct:   Number(s.completion_pct ?? 0),
      timeMs:          s.total_time_ms,
      badgeCount:      store.user_badges.filter((b) => b.lesson_session_id === s.id).length,
    }));
  },

  upsertScore(lessonSessionId, patch) {
    const store = readStore();
    let row = store.user_scores.find((r) => r.lesson_session_id === lessonSessionId);
    if (!row) {
      row = {
        id: nextId(store, 'scores'),
        lesson_session_id: lessonSessionId,
        total_score: 0, act_scores: {}, learning_score: 0, engagement_score: 0,
        accuracy_pct: null, computed_at: new Date().toISOString(), config_version: null,
      };
      store.user_scores.push(row);
    }
    Object.assign(row, patch, { computed_at: new Date().toISOString() });
    writeStore(store);
    return row;
  },

  upsertBadges(lessonSessionId, badges) {
    const store = readStore();
    const now = new Date().toISOString();
    // The recompute pass produces the *current* full set of badges
    // earned by the session — so we replace the existing set entirely
    // for this lesson session. Without this, score-tier badges from
    // earlier (lower-score) recomputes stack: a learner who lands at
    // 90 would carry every band from `needs-improvement` through
    // `expert-learner`, which is exactly what QA flagged.
    store.user_badges = store.user_badges.filter(
      (r) => r.lesson_session_id !== lessonSessionId,
    );
    const out = [];
    for (const b of badges) {
      const row = {
        id: nextId(store, 'badges'),
        lesson_session_id: lessonSessionId,
        badge_id: b.badgeId,
        earned_at: now,
        detail: b.detail ?? {},
      };
      store.user_badges.push(row);
      out.push(row);
    }
    writeStore(store);
    return out;
  },

  upsertAttemptHistory({ sessionId, lessonId, attemptNo, totalScore, completionPct, totalTimeMs }) {
    const store = readStore();
    let row = store.user_attempt_history.find(
      (r) => r.session_id === sessionId && r.lesson_id === lessonId,
    );
    if (!row) {
      row = {
        id: nextId(store, 'attemptHistory'),
        session_id: sessionId, lesson_id: lessonId,
        attempts_count: 0, best_score: 0, best_attempt_no: null,
        latest_score: 0, latest_attempt_no: 0, avg_score: 0,
        best_completion_pct: 0, total_time_ms: 0,
        updated_at: new Date().toISOString(),
      };
      store.user_attempt_history.push(row);
    }
    row.attempts_count = Math.max(row.attempts_count, attemptNo);
    row.latest_attempt_no = attemptNo;
    row.latest_score = totalScore;
    if (totalScore > row.best_score) {
      row.best_score = totalScore;
      row.best_attempt_no = attemptNo;
    }
    row.best_completion_pct = Math.max(row.best_completion_pct, completionPct ?? 0);
    row.total_time_ms += totalTimeMs ?? 0;
    // Running average of scores across attempts.
    row.avg_score = Number(
      ((row.avg_score * (row.attempts_count - 1) + totalScore) / row.attempts_count).toFixed(2),
    );
    row.updated_at = new Date().toISOString();
    writeStore(store);
    return row;
  },
};
