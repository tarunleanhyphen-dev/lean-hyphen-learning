/**
 * Durable analytics store.
 *
 * Persists the whole analytics dataset as a single JSONB blob in Postgres
 * (table `analytics_blob`, row id='main') so it survives across serverless
 * instances — the LMS-grade durability the per-instance /tmp file store
 * couldn't give. Falls back to the local/tmp JSON file when DATABASE_URL is
 * unset (dev) or Postgres is unreachable, so the pipeline never hard-fails.
 *
 * The in-memory shape mirrors the SQL tables (snake_case) exactly like the
 * old file store, so the report builders / projector are unchanged — only
 * the persistence layer moved, and the methods are now async.
 *
 * Concurrency: like the previous file store, each write rewrites the blob
 * (last-write-wins). Writes for a single learner are effectively sequential
 * (one browser, batched events), so this is safe for launch. A per-row
 * schema is the future hardening if write contention ever shows up.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, hasDb } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isServerlessRO = !!(process.env.VERCEL || process.env.VERCEL_ENV);
const DATA_PATH = isServerlessRO
  ? '/tmp/lh-analytics.json'
  : path.resolve(__dirname, '..', '..', 'data', 'analytics.json');

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await query(`CREATE TABLE IF NOT EXISTS analytics_blob (
    id text PRIMARY KEY,
    data jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
  )`);
  tableReady = true;
}

function blank() {
  return {
    counters: { events: 0, lessonSessions: 0, actSessions: 0, sceneSessions: 0,
      activityAttempts: 0, scores: 0, badges: 0, attemptHistory: 0, learningProgress: 0 },
    analytics_events: [], user_lesson_sessions: [], user_act_sessions: [],
    user_scene_sessions: [], user_activity_attempts: [], user_scores: [],
    user_badges: [], user_attempt_history: [], user_learning_progress: [],
  };
}
function nextId(store, k) { store.counters[k] = (store.counters[k] ?? 0) + 1; return store.counters[k]; }

async function load() {
  if (hasDb()) {
    try {
      await ensureTable();
      const r = await query(`SELECT data FROM analytics_blob WHERE id = 'main'`);
      return r.rows[0]?.data ? { ...blank(), ...r.rows[0].data } : blank();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[analyticsStore] pg load failed, using file:', e?.message);
    }
  }
  try { return { ...blank(), ...JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) }; }
  catch { return blank(); }
}

async function save(store) {
  if (hasDb()) {
    try {
      await ensureTable();
      await query(
        `INSERT INTO analytics_blob (id, data, updated_at) VALUES ('main', $1::jsonb, now())
         ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = now()`,
        [JSON.stringify(store)],
      );
      return;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[analyticsStore] pg save failed, using file:', e?.message);
    }
  }
  try { fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true }); fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf8'); }
  catch { /* read-only fs without DB — data is best-effort */ }
}

export const analyticsStore = {
  async insertEventIfNew(event, userAgent) {
    const store = await load();
    if (store.analytics_events.some((e) => e.client_event_id === event.clientEventId)) {
      return { inserted: false, reason: 'duplicate' };
    }
    const row = {
      id: nextId(store, 'events'), client_event_id: event.clientEventId, session_id: event.sessionId,
      lesson_id: event.lessonId ?? null, act_id: event.actId ?? null, scene_id: event.sceneId ?? null,
      activity_id: event.activityId ?? null, attempt_no: event.attemptNo ?? 1, event_kind: event.kind,
      event_payload: event.payload ?? {}, client_ts: event.clientTs, server_ts: new Date().toISOString(),
      user_agent: userAgent || null,
    };
    store.analytics_events.push(row);
    await save(store);
    return { inserted: true, row };
  },

  async getOrCreateLessonSession({ sessionId, lessonId, attemptNo = 1 }) {
    const store = await load();
    let row = store.user_lesson_sessions.find(
      (r) => r.session_id === sessionId && r.lesson_id === lessonId && r.attempt_no === attemptNo);
    if (row) return row;
    row = { id: nextId(store, 'lessonSessions'), session_id: sessionId, lesson_id: lessonId, attempt_no: attemptNo,
      started_at: new Date().toISOString(), completed_at: null, abandoned_at: null, total_time_ms: 0, idle_time_ms: 0,
      total_score: 0, completion_pct: 0, learning_score: 0, engagement_score: 0, badge_set: [] };
    store.user_lesson_sessions.push(row);
    await save(store);
    return row;
  },

  async updateLessonSession(id, patch) {
    const store = await load();
    const row = store.user_lesson_sessions.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch); await save(store); return row;
  },

  async getOrCreateActSession({ lessonSessionId, actId }) {
    const store = await load();
    let row = store.user_act_sessions.find((r) => r.lesson_session_id === lessonSessionId && r.act_id === actId);
    if (row) return row;
    row = { id: nextId(store, 'actSessions'), lesson_session_id: lessonSessionId, act_id: actId,
      started_at: new Date().toISOString(), completed_at: null, total_time_ms: 0, score: 0, points_earned: 0,
      points_max: 25, completion_pct: 0, accuracy_pct: null, activities_completed: 0, activities_skipped: 0 };
    store.user_act_sessions.push(row);
    await save(store);
    return row;
  },

  async updateActSession(id, patch) {
    const store = await load();
    const row = store.user_act_sessions.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch); await save(store); return row;
  },

  async getOrCreateSceneSession({ actSessionId, sceneId }) {
    const store = await load();
    let row = store.user_scene_sessions.find((r) => r.act_session_id === actSessionId && r.scene_id === sceneId);
    if (row) return row;
    row = { id: nextId(store, 'sceneSessions'), act_session_id: actSessionId, scene_id: sceneId,
      entered_at: new Date().toISOString(), exited_at: null, total_time_ms: 0, interaction_count: 0,
      click_count: 0, retry_count: 0, skipped: false, completed: false, points_earned: 0 };
    store.user_scene_sessions.push(row);
    await save(store);
    return row;
  },

  async updateSceneSession(id, patch) {
    const store = await load();
    const row = store.user_scene_sessions.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch); await save(store); return row;
  },

  async recordActivityAttempt(row) {
    const store = await load();
    const persisted = { id: nextId(store, 'activityAttempts'), ...row };
    store.user_activity_attempts.push(persisted);
    await save(store);
    return persisted;
  },

  async readSessionTree({ sessionId, lessonId, attemptNo }) {
    const store = await load();
    const matching = store.user_lesson_sessions.filter(
      (r) => r.session_id === sessionId && r.lesson_id === lessonId && (attemptNo == null || r.attempt_no === attemptNo));
    if (!matching.length) return null;
    const session = attemptNo == null ? matching.reduce((a, b) => (b.attempt_no > a.attempt_no ? b : a)) : matching[0];
    const acts = store.user_act_sessions.filter((r) => r.lesson_session_id === session.id);
    const actIds = new Set(acts.map((a) => a.id));
    const scenes = store.user_scene_sessions.filter((r) => actIds.has(r.act_session_id));
    const sceneIds = new Set(scenes.map((s) => s.id));
    const attempts = store.user_activity_attempts.filter((r) => sceneIds.has(r.scene_session_id));
    const badges = store.user_badges.filter((r) => r.lesson_session_id === session.id);
    const history = store.user_attempt_history.find((r) => r.session_id === sessionId && r.lesson_id === lessonId);
    return { session, acts, scenes, attempts, badges, history };
  },

  // Tree by internal lesson-session id (used by the recompute projector).
  async readTreeById(lessonSessionId) {
    const store = await load();
    const session = store.user_lesson_sessions.find((r) => r.id === lessonSessionId);
    if (!session) return null;
    const acts = store.user_act_sessions.filter((r) => r.lesson_session_id === session.id);
    const actIds = new Set(acts.map((a) => a.id));
    const scenes = store.user_scene_sessions.filter((r) => actIds.has(r.act_session_id));
    const sceneIds = new Set(scenes.map((s) => s.id));
    const attempts = store.user_activity_attempts.filter((r) => sceneIds.has(r.scene_session_id));
    return { session, acts, scenes, attempts };
  },

  async listAttempts({ sessionId, lessonId }) {
    const store = await load();
    return store.user_lesson_sessions
      .filter((r) => r.session_id === sessionId && r.lesson_id === lessonId)
      .sort((a, b) => b.attempt_no - a.attempt_no)
      .map((s) => ({
        attemptNo: s.attempt_no, completed: !!s.completed_at, startedAt: s.started_at, completedAt: s.completed_at,
        totalScore: s.total_score, learningScore: s.learning_score, engagementScore: s.engagement_score,
        completionPct: Number(s.completion_pct ?? 0), timeMs: s.total_time_ms,
        badgeCount: store.user_badges.filter((b) => b.lesson_session_id === s.id).length,
      }));
  },

  async upsertScore(lessonSessionId, patch) {
    const store = await load();
    let row = store.user_scores.find((r) => r.lesson_session_id === lessonSessionId);
    if (!row) {
      row = { id: nextId(store, 'scores'), lesson_session_id: lessonSessionId, total_score: 0, act_scores: {},
        learning_score: 0, engagement_score: 0, accuracy_pct: null, computed_at: new Date().toISOString(), config_version: null };
      store.user_scores.push(row);
    }
    Object.assign(row, patch, { computed_at: new Date().toISOString() });
    await save(store);
    return row;
  },

  async upsertBadges(lessonSessionId, badges) {
    const store = await load();
    const now = new Date().toISOString();
    store.user_badges = store.user_badges.filter((r) => r.lesson_session_id !== lessonSessionId);
    const out = [];
    for (const b of badges) {
      const row = { id: nextId(store, 'badges'), lesson_session_id: lessonSessionId, badge_id: b.badgeId, earned_at: now, detail: b.detail ?? {} };
      store.user_badges.push(row); out.push(row);
    }
    await save(store);
    return out;
  },

  async upsertAttemptHistory({ sessionId, lessonId, attemptNo, totalScore, completionPct, totalTimeMs }) {
    const store = await load();
    let row = store.user_attempt_history.find((r) => r.session_id === sessionId && r.lesson_id === lessonId);
    if (!row) {
      row = { id: nextId(store, 'attemptHistory'), session_id: sessionId, lesson_id: lessonId, attempts_count: 0,
        best_score: 0, best_attempt_no: null, latest_score: 0, latest_attempt_no: 0, avg_score: 0,
        best_completion_pct: 0, total_time_ms: 0, updated_at: new Date().toISOString() };
      store.user_attempt_history.push(row);
    }
    row.attempts_count = Math.max(row.attempts_count, attemptNo);
    row.latest_attempt_no = attemptNo;
    row.latest_score = totalScore;
    if (totalScore > row.best_score) { row.best_score = totalScore; row.best_attempt_no = attemptNo; }
    row.best_completion_pct = Math.max(row.best_completion_pct, completionPct ?? 0);
    row.total_time_ms += totalTimeMs ?? 0;
    row.avg_score = Number(((row.avg_score * (row.attempts_count - 1) + totalScore) / row.attempts_count).toFixed(2));
    row.updated_at = new Date().toISOString();
    await save(store);
    return row;
  },
};
