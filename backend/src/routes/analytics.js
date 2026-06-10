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
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasDb } from '../db/index.js';
import { analyticsStore as store } from '../storage/analyticsStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { validateEvent, EVENT_KINDS } from '../analytics/events.js';
import {
  SCORING_CONFIG,
  getScoringConfig,
  computeActivityPoints,
  findActMax,
  findSceneMax,
  rollUpScores,
  engagementScore,
  learningScore,
} from '../analytics/scoring.js';
import { awardBadges } from '../analytics/badges.js';
import { buildLessonReport, buildActReport, buildLmsExport } from '../analytics/reports.js';
import { reportTokenFor, requireReportAuth } from '../analytics/auth.js';

const router = Router();

// Public, non-credentialed analytics: events + reports are keyed by sessionId
// (no cookies/auth), and the lessons are embedded in arbitrary LMS / frontend
// origins. Allow cross-origin reads + writes from any origin so the report page
// and the LMS dashboard can fetch directly. (Mirrors the open CORS on /api/tts.)
router.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// We deliberately use the file store across the board for now. When
// Postgres lands we'll fork the surface inside each handler with
// `hasDb() ? pgStore.foo(...) : store.foo(...)` — keeping the route
// shape stable so the frontend never has to care which backend is on.
const usingPg = () => hasDb();

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
      const r = await store.insertEventIfNew(e, userAgent);
      if (!r.inserted) {
        rejected.push({ clientEventId: e.clientEventId, reason: r.reason });
        continue;
      }
      try {
        await projectEvent(e);
      } catch (projErr) {
        // Projection failures shouldn't fail the ingest; we already
        // persisted the raw event so reporting can recover later.
        // eslint-disable-next-line no-console
        console.warn('[analytics] projection error', e.kind, projErr?.message);
      }
      accepted.push({ clientEventId: e.clientEventId });
    }

    // Mint a per-session report token for each learner in this batch, so the
    // browser that just played can authorize its report reads.
    const reportTokens = {};
    for (const sid of new Set(events.map((e) => e?.sessionId).filter(Boolean))) {
      const t = reportTokenFor(sid);
      if (t) reportTokens[sid] = t;
    }

    res.json({
      accepted: accepted.length,
      rejected,
      storage: usingPg() ? 'postgres' : 'file',
      reportTokens,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/analytics/lesson/:lessonId — full report
// ─────────────────────────────────────────────────────────────────────
router.get('/lesson/:lessonId', requireReportAuth, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { sessionId } = req.query;
    const attemptNo = req.query.attempt ? Number(req.query.attempt) : null;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const tree = await store.readSessionTree({ sessionId, lessonId, attemptNo });
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
router.get('/act/:lessonId/:actId', requireReportAuth, async (req, res, next) => {
  try {
    const { lessonId, actId } = req.params;
    const { sessionId } = req.query;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const tree = await store.readSessionTree({ sessionId, lessonId });
    if (!tree) return res.json({ report: null });
    const actSession = tree.acts.find((a) => a.act_id === actId);
    if (!actSession) return res.json({ report: null });
    const scenes = tree.scenes.filter((s) => s.act_session_id === actSession.id);
    const sceneIds = new Set(scenes.map((s) => s.id));
    const attempts = tree.attempts.filter((a) => sceneIds.has(a.scene_session_id));
    const report = buildActReport({ actSession, scenes, attempts, lessonId });
    res.json({ report });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/analytics/sessions/:lessonId — list of attempts (latest first)
//
// Returns every attempt this learner has on this lesson as a mini-
// report: attemptNo, score, completion, time, badge count, start +
// end timestamps. Use for an "Attempt history" / "Your sessions"
// strip in the report UI, or for an LMS leaderboard / growth-over-
// time chart.
//
// To drill into one specific attempt, pair this with:
//   GET /api/analytics/lesson/:lessonId?sessionId=X&attempt=N
// (which returns the full report tree for that attempt).
// ─────────────────────────────────────────────────────────────────────
router.get('/sessions/:lessonId', requireReportAuth, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { sessionId } = req.query;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const sessions = await store.listAttempts({ sessionId, lessonId });
    res.json({ sessions, storage: usingPg() ? 'postgres' : 'file' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/analytics/attempts/:lessonId — attempt history roll-up
// ─────────────────────────────────────────────────────────────────────
router.get('/attempts/:lessonId', requireReportAuth, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { sessionId } = req.query;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const tree = await store.readSessionTree({ sessionId, lessonId });
    res.json({ history: tree?.history ?? null });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/analytics/lms-export/:lessonId — stable LMS payload
// ─────────────────────────────────────────────────────────────────────
router.get('/lms-export/:lessonId', requireReportAuth, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { sessionId } = req.query;
    if (!sessionId) {
      const err = new Error('sessionId query param required');
      err.status = 400;
      throw err;
    }
    const tree = await store.readSessionTree({ sessionId, lessonId });
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
async function projectEvent(e) {
  const { kind, sessionId, lessonId, actId, sceneId, activityId, attemptNo = 1, clientTs } = e;
  const config = getScoringConfig(lessonId); // per-lesson scoring map

  // Top-level lesson session (created lazily on the first lesson-scoped
  // event).
  let lessonSession = null;
  if (lessonId) {
    lessonSession = await store.getOrCreateLessonSession({
      sessionId, lessonId, attemptNo: e.lessonAttemptNo ?? 1,
    });
  }

  if (kind === EVENT_KINDS.LESSON_STARTED && lessonSession) {
    await store.updateLessonSession(lessonSession.id, { started_at: clientTs });
    return;
  }

  if (kind === EVENT_KINDS.LESSON_COMPLETED && lessonSession) {
    const totalTimeMs = e.payload?.totalTimeMs ?? 0;
    await store.updateLessonSession(lessonSession.id, {
      completed_at: clientTs,
      total_time_ms: totalTimeMs || lessonSession.total_time_ms,
    });
    await recomputeAndPersistScore(lessonSession.id);
    return;
  }

  if (kind === EVENT_KINDS.LESSON_ABANDONED && lessonSession) {
    await store.updateLessonSession(lessonSession.id, { abandoned_at: clientTs });
    return;
  }

  // Act-scoped events.
  let actSession = null;
  if (lessonSession && actId) {
    actSession = await store.getOrCreateActSession({ lessonSessionId: lessonSession.id, actId });
    if (kind === EVENT_KINDS.ACT_STARTED) {
      await store.updateActSession(actSession.id, { started_at: clientTs, points_max: findActMax(actId, config) });
    }
    if (kind === EVENT_KINDS.ACT_COMPLETED) {
      await store.updateActSession(actSession.id, {
        completed_at: clientTs,
        total_time_ms: e.payload?.timeMs ?? actSession.total_time_ms,
        completion_pct: 100,
      });
      await recomputeAndPersistScore(lessonSession.id);
    }
  }

  // Scene-scoped events.
  let sceneSession = null;
  if (actSession && sceneId) {
    sceneSession = await store.getOrCreateSceneSession({ actSessionId: actSession.id, sceneId });
    if (kind === EVENT_KINDS.SCENE_ENTERED) {
      await store.updateSceneSession(sceneSession.id, { entered_at: clientTs });
    }
    if (kind === EVENT_KINDS.SCENE_COMPLETED) {
      const pts = findSceneMax(sceneId, config);
      await store.updateSceneSession(sceneSession.id, {
        exited_at: clientTs,
        completed: true,
        total_time_ms: e.payload?.timeMs ?? sceneSession.total_time_ms,
        points_earned: pts,
      });
    }
    if (kind === EVENT_KINDS.SCENE_SKIPPED) {
      await store.updateSceneSession(sceneSession.id, {
        exited_at: clientTs,
        skipped: true,
        completed: false,
      });
    }
    // Generic interaction counter — anything that isn't a lifecycle
    // event but happened inside a scene bumps the count, so the
    // "interaction density" engagement metric has a value.
    if (
      kind === EVENT_KINDS.SCENE_ENTERED ||
      kind === EVENT_KINDS.MCQ_ANSWERED ||
      kind === EVENT_KINDS.DRAG_DROP_COMPLETED ||
      kind === EVENT_KINDS.OPTION_SELECTED ||
      kind === EVENT_KINDS.SCENARIO_DECISION
    ) {
      await store.updateSceneSession(sceneSession.id, {
        interaction_count: (sceneSession.interaction_count ?? 0) + 1,
      });
    }
  }

  // Activity attempts.
  if (sceneSession && activityId) {
    if (kind === EVENT_KINDS.ACTIVITY_STARTED) {
      await store.recordActivityAttempt({
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
      const points = computeActivityPoints({ activityId, success, detail }, config);
      const accuracyPct = typeof detail.accuracyPct === 'number'
        ? detail.accuracyPct
        : (detail.correct && detail.total
            ? Math.round((detail.correct / detail.total) * 100)
            : null);
      await store.recordActivityAttempt({
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
        await store.updateActSession(actSession.id, {
          activities_completed: (actSession.activities_completed ?? 0) + 1,
        });
      }
      await recomputeAndPersistScore(lessonSession.id);
    }
    if (kind === EVENT_KINDS.ACTIVITY_RETRIED && sceneSession) {
      await store.updateSceneSession(sceneSession.id, {
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
async function recomputeAndPersistScore(lessonSessionId) {
  // Aggregate tables are keyed by session+lesson everywhere except
  // here — the projection just produced an id, so we fetch the tree
  // by id directly. PG path will swap this for a single SELECT once
  // wired.
  const tree = await store.readTreeById(lessonSessionId);
  if (!tree) return;

  const config = getScoringConfig(tree.session?.lesson_id); // per-lesson scoring
  const rolled = rollUpScores(tree, config);
  const accuracyPct = avgAccuracy(tree.attempts);
  const scenarioQualityPct = pick3Accuracy(tree.attempts);
  const completionPct = computeCompletionPct(tree, config);
  const totalActivities = countDefinedActivities(config);
  const participationPct = totalActivities
    ? Math.min(100, (tree.attempts.length / totalActivities) * 100)
    : 0;
  // Engagement is count-based, NOT time-based — sum of every interaction the
  // learner made (clicking through scenes, answering, selecting options).
  const interactionCount = tree.scenes.reduce((s, sc) => s + (sc.interaction_count || 0), 0);

  const learning = learningScore({ accuracyPct, scenarioQualityPct, completionPct });
  const engagement = engagementScore({
    completionPct, interactionCount, activityParticipationPct: participationPct,
  });

  await store.updateLessonSession(lessonSessionId, {
    total_score: rolled.totalScore,
    completion_pct: Number(completionPct.toFixed(2)),
    learning_score: learning,
    engagement_score: engagement,
  });
  await store.upsertScore(lessonSessionId, {
    total_score: rolled.totalScore,
    act_scores: rolled.actScores,
    learning_score: learning,
    engagement_score: engagement,
    accuracy_pct: accuracyPct,
    config_version: rolled.configVersion,
  });

  // Per-act score rows (+ per-act accuracy, averaged over that act's graded
  // attempts, so the report can show accuracy alongside the score).
  for (const act of tree.acts) {
    const earned = rolled.actScores[act.act_id] ?? 0;
    const max = findActMax(act.act_id, config);
    const actSceneIds = new Set(
      tree.scenes.filter((s) => s.act_session_id === act.id).map((s) => s.id),
    );
    const actAccuracy = avgAccuracy(
      tree.attempts.filter((a) => actSceneIds.has(a.scene_session_id)),
    );
    await store.updateActSession(act.id, {
      points_earned: earned,
      points_max: max,
      score: earned,
      accuracy_pct: actAccuracy || null,
    });
  }

  // Refresh the badge set + history snapshot.
  const badges = awardBadges({
    session: { ...tree.session, total_score: rolled.totalScore, accuracy_pct: accuracyPct },
    acts: tree.acts.map((a) => ({
      ...a,
      points_earned: rolled.actScores[a.act_id] ?? 0,
      points_max: findActMax(a.act_id, config),
    })),
    attempts: tree.attempts,
  });
  await store.upsertBadges(lessonSessionId, badges);

  if (tree.session.completed_at) {
    await store.upsertAttemptHistory({
      sessionId: tree.session.session_id,
      lessonId:  tree.session.lesson_id,
      attemptNo: tree.session.attempt_no,
      totalScore: rolled.totalScore,
      completionPct,
      totalTimeMs: tree.session.total_time_ms,
    });
  }
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
