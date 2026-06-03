/**
 * /api/analytics — event ingest + reporting + LMS export.
 *
 * Endpoints:
 *   POST /api/analytics/events
 *     Batch ingest. Body: { events: [...] }. Each event is validated and
 *     projected (scene/act session counters bumped, scores recomputed
 *     when relevant). Idempotent on clientEventId.
 *
 *   GET  /api/analytics/lesson/:lessonId
 *     Lesson dashboard payload (the end-of-Act-4 screen). Query params:
 *     ?sessionId=… (required), ?attempt=… (optional, defaults to latest).
 *
 *   GET  /api/analytics/act/:lessonId/:actId
 *     Per-act post-completion card. Same query params.
 *
 *   GET  /api/analytics/attempts/:lessonId
 *     Attempt history roll-up for the session (best/latest/avg).
 *
 *   GET  /api/analytics/lms-export/:lessonId
 *     Stable LMS-export payload. Same query params.
 *
 * Storage:
 *   When DATABASE_URL is configured we'll route to Postgres (TODO — the
 *   pg wiring lands once migration 004 has been applied via npm run
 *   migrate). Today we always use the file fallback, so the system
 *   works end-to-end in dev without any Postgres setup.
 */

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasDb } from '../db/index.js';
import { analyticsFileStore as store } from '../storage/analyticsFileFallback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Mirrors the path-pick in storage/analyticsFileFallback.js — Vercel
// is read-only outside /tmp, so we fall over there for the report
// reads as well as the writes. Same caveat: /tmp is per-instance.
const _isServerlessRO = !!(process.env.VERCEL || process.env.VERCEL_ENV);
const ANALYTICS_DATA_PATH = _isServerlessRO
  ? '/tmp/lh-analytics.json'
  : path.resolve(__dirname, '..', '..', 'data', 'analytics.json');
import { validateEvent, EVENT_KINDS } from '../analytics/events.js';
import {
  SCORING_CONFIG,
  computeActivityPoints,
  findActMax,
  findSceneMax,
  rollUpScores,
  engagementScore,
  learningScore,
} from '../analytics/scoring.js';
import { awardBadges } from '../analytics/badges.js';
import { buildLessonReport, buildActReport, buildLmsExport } from '../analytics/reports.js';

const router = Router();

// We deliberately use the file store across the board for now. When
// Postgres lands we'll fork the surface inside each handler with
// `hasDb() ? pgStore.foo(...) : store.foo(...)` — keeping the route
// shape stable so the frontend never has to care which backend is on.
const usingPg = () => false && hasDb();

// ─────────────────────────────────────────────────────────────────────
// POST /api/analytics/events — batch ingest
// ─────────────────────────────────────────────────────────────────────
router.post('/events', async (req, res, next) => {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : null;
    if (!events) {
      const err = new Error('body.events (array) required');
      err.status = 400;
      throw err;
    }
    if (events.length > 200) {
      const err = new Error('max 200 events per batch');
      err.status = 413;
      throw err;
    }
    const userAgent = req.headers['user-agent'];
    const accepted = [];
    const rejected = [];

    for (const e of events) {
      const v = validateEvent(e);
      if (!v.ok) {
        rejected.push({ clientEventId: e?.clientEventId ?? null, reason: v.reason });
        continue;
      }
      const r = store.insertEventIfNew(e, userAgent);
      if (!r.inserted) {
        rejected.push({ clientEventId: e.clientEventId, reason: r.reason });
        continue;
      }
      try {
        projectEvent(e);
      } catch (projErr) {
        // Projection failures shouldn't fail the ingest; we already
        // persisted the raw event so reporting can recover later.
        // eslint-disable-next-line no-console
        console.warn('[analytics] projection error', e.kind, projErr?.message);
      }
      accepted.push({ clientEventId: e.clientEventId });
    }

    res.json({ accepted: accepted.length, rejected, storage: usingPg() ? 'postgres' : 'file' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/analytics/lesson/:lessonId — full report
// ─────────────────────────────────────────────────────────────────────
router.get('/lesson/:lessonId', async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { sessionId } = req.query;
    const attemptNo = req.query.attempt ? Number(req.query.attempt) : null;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const tree = store.readSessionTree({ sessionId, lessonId, attemptNo });
    if (!tree) return res.json({ report: null, storage: usingPg() ? 'postgres' : 'file' });

    const report = buildLessonReport(tree);
    res.json({ report, storage: usingPg() ? 'postgres' : 'file' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/analytics/act/:lessonId/:actId — per-act card
// ─────────────────────────────────────────────────────────────────────
router.get('/act/:lessonId/:actId', async (req, res, next) => {
  try {
    const { lessonId, actId } = req.params;
    const { sessionId } = req.query;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const tree = store.readSessionTree({ sessionId, lessonId });
    if (!tree) return res.json({ report: null });
    const actSession = tree.acts.find((a) => a.act_id === actId);
    if (!actSession) return res.json({ report: null });
    const scenes = tree.scenes.filter((s) => s.act_session_id === actSession.id);
    const sceneIds = new Set(scenes.map((s) => s.id));
    const attempts = tree.attempts.filter((a) => sceneIds.has(a.scene_session_id));
    const report = buildActReport({ actSession, scenes, attempts });
    res.json({ report });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/analytics/attempts/:lessonId — attempt history roll-up
// ─────────────────────────────────────────────────────────────────────
router.get('/attempts/:lessonId', async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { sessionId } = req.query;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const tree = store.readSessionTree({ sessionId, lessonId });
    res.json({ history: tree?.history ?? null });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/analytics/lms-export/:lessonId — stable LMS payload
// ─────────────────────────────────────────────────────────────────────
router.get('/lms-export/:lessonId', async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { sessionId } = req.query;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const tree = store.readSessionTree({ sessionId, lessonId });
    if (!tree) return res.json({ export: null });
    res.json({ export: buildLmsExport(tree) });
  } catch (err) {
    next(err);
  }
});

export default router;

// ─────────────────────────────────────────────────────────────────────
// projection — apply an event to the rolled-up aggregate rows
// ─────────────────────────────────────────────────────────────────────
//
// Keep this function pure-side-effects against the store so we can
// later run it from a worker (consuming `analytics_events` directly)
// without touching the route shape.
function projectEvent(e) {
  const { kind, sessionId, lessonId, actId, sceneId, activityId, attemptNo = 1, clientTs } = e;

  // Top-level lesson session (created lazily on the first lesson-scoped
  // event).
  let lessonSession = null;
  if (lessonId) {
    lessonSession = store.getOrCreateLessonSession({
      sessionId, lessonId, attemptNo: e.lessonAttemptNo ?? 1,
    });
  }

  if (kind === EVENT_KINDS.LESSON_STARTED && lessonSession) {
    store.updateLessonSession(lessonSession.id, { started_at: clientTs });
    return;
  }

  if (kind === EVENT_KINDS.LESSON_COMPLETED && lessonSession) {
    const totalTimeMs = e.payload?.totalTimeMs ?? 0;
    store.updateLessonSession(lessonSession.id, {
      completed_at: clientTs,
      total_time_ms: totalTimeMs || lessonSession.total_time_ms,
    });
    recomputeAndPersistScore(lessonSession.id);
    return;
  }

  if (kind === EVENT_KINDS.LESSON_ABANDONED && lessonSession) {
    store.updateLessonSession(lessonSession.id, { abandoned_at: clientTs });
    return;
  }

  // Act-scoped events.
  let actSession = null;
  if (lessonSession && actId) {
    actSession = store.getOrCreateActSession({ lessonSessionId: lessonSession.id, actId });
    if (kind === EVENT_KINDS.ACT_STARTED) {
      store.updateActSession(actSession.id, { started_at: clientTs, points_max: findActMax(actId) });
    }
    if (kind === EVENT_KINDS.ACT_COMPLETED) {
      store.updateActSession(actSession.id, {
        completed_at: clientTs,
        total_time_ms: e.payload?.timeMs ?? actSession.total_time_ms,
        completion_pct: 100,
      });
      recomputeAndPersistScore(lessonSession.id);
    }
  }

  // Scene-scoped events.
  let sceneSession = null;
  if (actSession && sceneId) {
    sceneSession = store.getOrCreateSceneSession({ actSessionId: actSession.id, sceneId });
    if (kind === EVENT_KINDS.SCENE_ENTERED) {
      store.updateSceneSession(sceneSession.id, { entered_at: clientTs });
    }
    if (kind === EVENT_KINDS.SCENE_COMPLETED) {
      const pts = findSceneMax(sceneId);
      store.updateSceneSession(sceneSession.id, {
        exited_at: clientTs,
        completed: true,
        total_time_ms: e.payload?.timeMs ?? sceneSession.total_time_ms,
        points_earned: pts,
      });
    }
    if (kind === EVENT_KINDS.SCENE_SKIPPED) {
      store.updateSceneSession(sceneSession.id, {
        exited_at: clientTs,
        skipped: true,
        completed: false,
      });
    }
    // Generic interaction counter — anything that isn't a lifecycle
    // event but happened inside a scene bumps the count, so the
    // "interaction density" engagement metric has a value.
    if (
      kind === EVENT_KINDS.MCQ_ANSWERED ||
      kind === EVENT_KINDS.DRAG_DROP_COMPLETED ||
      kind === EVENT_KINDS.OPTION_SELECTED ||
      kind === EVENT_KINDS.SCENARIO_DECISION
    ) {
      store.updateSceneSession(sceneSession.id, {
        interaction_count: (sceneSession.interaction_count ?? 0) + 1,
      });
    }
  }

  // Activity attempts.
  if (sceneSession && activityId) {
    if (kind === EVENT_KINDS.ACTIVITY_STARTED) {
      store.recordActivityAttempt({
        scene_session_id: sceneSession.id,
        activity_id: activityId,
        activity_kind: e.payload?.kind ?? null,
        attempt_no: attemptNo,
        started_at: clientTs,
        completed_at: null,
        time_to_complete_ms: null,
        success: null,
        accuracy_pct: null,
        correct_count: null,
        wrong_count: null,
        points_earned: 0,
        detail: e.payload?.detail ?? {},
      });
    }
    if (kind === EVENT_KINDS.ACTIVITY_COMPLETED ||
        kind === EVENT_KINDS.ACTIVITY_PASSED  ||
        kind === EVENT_KINDS.ACTIVITY_FAILED) {
      const success = kind !== EVENT_KINDS.ACTIVITY_FAILED;
      const detail = e.payload?.detail ?? {};
      const points = computeActivityPoints({ activityId, success, detail });
      const accuracyPct = typeof detail.accuracyPct === 'number'
        ? detail.accuracyPct
        : (detail.correct && detail.total
            ? Math.round((detail.correct / detail.total) * 100)
            : null);
      store.recordActivityAttempt({
        scene_session_id: sceneSession.id,
        activity_id: activityId,
        activity_kind: e.payload?.kind ?? null,
        attempt_no: attemptNo,
        started_at: e.payload?.startedAt ?? clientTs,
        completed_at: clientTs,
        time_to_complete_ms: e.payload?.timeMs ?? null,
        success,
        accuracy_pct: accuracyPct,
        correct_count: detail.correct ?? null,
        wrong_count: detail.wrong ?? null,
        points_earned: points,
        detail,
      });
      // Bump the act-level activities_completed counter.
      if (success && actSession) {
        store.updateActSession(actSession.id, {
          activities_completed: (actSession.activities_completed ?? 0) + 1,
        });
      }
      recomputeAndPersistScore(lessonSession.id);
    }
    if (kind === EVENT_KINDS.ACTIVITY_RETRIED && sceneSession) {
      store.updateSceneSession(sceneSession.id, {
        retry_count: (sceneSession.retry_count ?? 0) + 1,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Re-roll the score, learning/engagement metrics, and badges for a
// single lesson session and write the materialised rows back. Called
// from projection on any event that could move the needle.
// ─────────────────────────────────────────────────────────────────────
function recomputeAndPersistScore(lessonSessionId) {
  // Aggregate tables are keyed by session+lesson everywhere except
  // here — the projection just produced an id, so we fetch the tree
  // by id directly. PG path will swap this for a single SELECT once
  // wired.
  const tree = readTreeById(lessonSessionId);
  if (!tree) return;

  const rolled = rollUpScores(tree, SCORING_CONFIG);
  const accuracyPct = avgAccuracy(tree.attempts);
  const scenarioQualityPct = pick3Accuracy(tree.attempts);
  const completionPct = computeCompletionPct(tree, SCORING_CONFIG);
  const totalActivities = countDefinedActivities(SCORING_CONFIG);
  const participationPct = totalActivities
    ? Math.min(100, (tree.attempts.length / totalActivities) * 100)
    : 0;
  const totalTimeMs = tree.acts.reduce((s, a) => s + (a.total_time_ms || 0), 0);
  const clicksPerMinute = totalTimeMs > 0
    ? (tree.scenes.reduce((s, sc) => s + (sc.interaction_count || 0), 0) /
        (totalTimeMs / 60000))
    : 0;

  const learning = learningScore({ accuracyPct, scenarioQualityPct, completionPct });
  const engagement = engagementScore({
    completionPct, clicksPerMinute, activityParticipationPct: participationPct,
  });

  store.updateLessonSession(lessonSessionId, {
    total_score: rolled.totalScore,
    completion_pct: Number(completionPct.toFixed(2)),
    learning_score: learning,
    engagement_score: engagement,
  });
  store.upsertScore(lessonSessionId, {
    total_score: rolled.totalScore,
    act_scores: rolled.actScores,
    learning_score: learning,
    engagement_score: engagement,
    accuracy_pct: accuracyPct,
    config_version: rolled.configVersion,
  });

  // Per-act score rows.
  for (const act of tree.acts) {
    const earned = rolled.actScores[act.act_id] ?? 0;
    const max = findActMax(act.act_id, SCORING_CONFIG);
    store.updateActSession(act.id, {
      points_earned: earned,
      points_max: max,
      score: earned,
    });
  }

  // Refresh the badge set + history snapshot.
  const badges = awardBadges({
    session: { ...tree.session, total_score: rolled.totalScore, accuracy_pct: accuracyPct },
    acts: tree.acts.map((a) => ({
      ...a,
      points_earned: rolled.actScores[a.act_id] ?? 0,
      points_max: findActMax(a.act_id, SCORING_CONFIG),
    })),
    attempts: tree.attempts,
  });
  store.upsertBadges(lessonSessionId, badges);

  if (tree.session.completed_at) {
    store.upsertAttemptHistory({
      sessionId: tree.session.session_id,
      lessonId:  tree.session.lesson_id,
      attemptNo: tree.session.attempt_no,
      totalScore: rolled.totalScore,
      completionPct,
      totalTimeMs: tree.session.total_time_ms,
    });
  }
}

// Direct id-keyed lookup against the file store. (Postgres will replace
// this with a single SELECT once the pg branch lands.)
function readTreeById(lessonSessionId) {
  if (!fs.existsSync(ANALYTICS_DATA_PATH)) return null;
  let raw;
  try { raw = JSON.parse(fs.readFileSync(ANALYTICS_DATA_PATH, 'utf8')); } catch { return null; }
  const session = raw.user_lesson_sessions?.find((r) => r.id === lessonSessionId);
  if (!session) return null;
  const acts    = raw.user_act_sessions?.filter((r) => r.lesson_session_id === session.id) || [];
  const actIds  = new Set(acts.map((a) => a.id));
  const scenes  = raw.user_scene_sessions?.filter((r) => actIds.has(r.act_session_id)) || [];
  const sceneIds = new Set(scenes.map((s) => s.id));
  const attempts= raw.user_activity_attempts?.filter((r) => sceneIds.has(r.scene_session_id)) || [];
  return { session, acts, scenes, attempts };
}

function avgAccuracy(attempts) {
  const xs = attempts.map((a) => a.accuracy_pct).filter((n) => typeof n === 'number');
  if (!xs.length) return 0;
  return Math.round(xs.reduce((s, n) => s + n, 0) / xs.length);
}

function pick3Accuracy(attempts) {
  const row = attempts.find((a) => a.activity_id === 's1-pick3');
  return row?.accuracy_pct ?? 0;
}

function computeCompletionPct(tree, config) {
  const requiredScenes = Object.values(config.acts).flatMap((a) =>
    Object.keys(a.scenes || {}),
  );
  if (!requiredScenes.length) return 0;
  const done = tree.scenes.filter((s) => s.completed && requiredScenes.includes(s.scene_id)).length;
  return Math.min(100, (done / requiredScenes.length) * 100);
}

function countDefinedActivities(config) {
  return Object.values(config.acts).reduce(
    (n, a) => n + Object.keys(a.activities || {}).length,
    0,
  );
}
