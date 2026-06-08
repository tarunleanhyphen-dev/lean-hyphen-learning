/**
 * Report builders.
 *
 * Three shapes:
 *   • lessonReport — the dashboard the learner sees at the end of Act 4.
 *   • actReport    — the smaller card shown at the end of each Act.
 *   • lmsExport    — the canonical JSON shape we hand to external LMS
 *                    platforms. Designed to be stable across schema
 *                    changes; new fields go in `_extras` rather than
 *                    breaking the top-level keys.
 */

import { getScoringConfig, findActMax } from './scoring.js';

/**
 * The big end-of-lesson dashboard. Caller supplies the rolled-up
 * session + nested rows; we just reshape and add derived fields
 * (insights, improvement vs previous attempt, etc.).
 */
export function buildLessonReport(ctx) {
  const { session, acts, scenes, attempts, badges, history } = ctx;
  const config = getScoringConfig(session.lesson_id);
  const lessonId = session.lesson_id;

  const actSummary = Object.keys(config.acts).map((actId) => {
    const a = acts.find((row) => row.act_id === actId);
    const max = findActMax(actId, config);
    return {
      actId,
      title: prettyActTitle(actId, lessonId),
      pointsEarned: a?.points_earned ?? 0,
      pointsMax:    a?.points_max ?? max,
      score:        a?.score ?? 0,
      accuracyPct:  a?.accuracy_pct,
      completionPct:a?.completion_pct ?? 0,
      timeMs:       a?.total_time_ms ?? 0,
      activitiesCompleted: a?.activities_completed ?? 0,
      activitiesSkipped:   a?.activities_skipped ?? 0,
      started:   !!a?.started_at,
      completed: !!a?.completed_at,
    };
  });

  const insights = deriveInsights({ acts: actSummary, attempts });
  const improvement = history ? deriveImprovement(session, history) : null;

  return {
    sessionId: session.session_id,
    lessonId:  session.lesson_id,
    attemptNo: session.attempt_no,
    completed: !!session.completed_at,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    totalScore: session.total_score,
    learningScore:   session.learning_score,
    engagementScore: session.engagement_score,
    completionPct:   Number(session.completion_pct ?? 0),
    totalTimeMs:     session.total_time_ms,
    badges:    badges.map((b) => ({
      badgeId: b.badge_id,
      earnedAt: b.earned_at,
      detail:  b.detail,
    })),
    acts:      actSummary,
    insights,
    improvement,
    scenesCount:    scenes.length,
    attemptsCount:  attempts.length,
  };
}

/**
 * Per-act post-completion card.
 */
export function buildActReport(ctx) {
  const { actSession, scenes, attempts, prevActSession, lessonId } = ctx;
  return {
    actId:        actSession.act_id,
    title:        prettyActTitle(actSession.act_id, lessonId ?? actSession.lesson_id),
    score:        actSession.score,
    pointsEarned: actSession.points_earned,
    pointsMax:    actSession.points_max,
    completionPct:Number(actSession.completion_pct ?? 0),
    accuracyPct:  actSession.accuracy_pct,
    timeMs:       actSession.total_time_ms,
    scenes:       scenes.map((s) => ({
      sceneId:      s.scene_id,
      completed:    s.completed,
      skipped:      s.skipped,
      timeMs:       s.total_time_ms,
      pointsEarned: s.points_earned,
      interactionCount: s.interaction_count,
    })),
    attempts:     attempts.map((a) => ({
      activityId: a.activity_id,
      attemptNo:  a.attempt_no,
      success:    a.success,
      pointsEarned: a.points_earned,
      accuracyPct: a.accuracy_pct,
      timeMs:      a.time_to_complete_ms,
    })),
    improvementVsPrevAttempt: prevActSession
      ? actSession.score - (prevActSession.score ?? 0)
      : null,
  };
}

/**
 * LMS-ready export — the stable schema we promise to third-party LMS
 * integrations. Keep top-level keys backwards-compatible; bury new
 * fields in `_extras` until they're promoted in a versioned release.
 */
export function buildLmsExport(ctx) {
  const r = buildLessonReport(ctx);
  return {
    schemaVersion: '1.0',
    learner: {
      sessionId: r.sessionId,
    },
    lesson: {
      lessonId:    r.lessonId,
      attemptNo:   r.attemptNo,
      completed:   r.completed,
      startedAt:   r.startedAt,
      completedAt: r.completedAt,
    },
    score: {
      total:      r.totalScore,
      learning:   r.learningScore,
      engagement: r.engagementScore,
      completionPct: r.completionPct,
      timeMs:     r.totalTimeMs,
    },
    badges: r.badges,
    acts: r.acts.map((a) => ({
      actId: a.actId,
      title: a.title,
      score: a.score,
      pointsEarned: a.pointsEarned,
      pointsMax: a.pointsMax,
      accuracyPct: a.accuracyPct,
      completionPct: a.completionPct,
      timeMs: a.timeMs,
    })),
    improvement: r.improvement,
    _extras: {
      insights: r.insights,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────

const ACT_TITLES = {
  'think-before-you-spend': {
    act1: 'Act 1 — Temptation',
    act2: 'Act 2 — Understanding Impulse Buying',
    act3: 'Act 3 — Real-life Simulation',
    act4: 'Act 4 — Reflect & Realise',
  },
  'where-does-my-money-go': {
    act1: 'Act 1 — Dream Bedroom Makeover',
    act2: 'Act 2 — The 50/30/20 Rule',
    act3: 'Act 3 — Test Your Understanding',
  },
};

function prettyActTitle(actId, lessonId) {
  return ACT_TITLES[lessonId]?.[actId]
    || ACT_TITLES['think-before-you-spend'][actId]
    || actId;
}

/**
 * Hand-picked insights based on the act summary + attempt history.
 * These are the human-readable headline lines the dashboard surfaces.
 */
function deriveInsights({ acts, attempts }) {
  const out = [];
  const playedActs = acts.filter((a) => a.started);
  if (!playedActs.length) return out;

  const strongest = [...playedActs].sort((a, b) => (b.accuracyPct ?? 0) - (a.accuracyPct ?? 0))[0];
  if (strongest && (strongest.accuracyPct ?? 0) > 0) {
    out.push({
      kind: 'strongest-act',
      message: `Your strongest performance was in ${strongest.title} with ${Math.round(strongest.accuracyPct)}% accuracy.`,
    });
  }

  const weakest = [...playedActs]
    .filter((a) => (a.accuracyPct ?? null) != null)
    .sort((a, b) => (a.accuracyPct ?? 0) - (b.accuracyPct ?? 0))[0];
  if (weakest && (weakest.accuracyPct ?? 0) < 70) {
    out.push({
      kind: 'weakest-act',
      message: `${weakest.title} could use another pass — accuracy was ${Math.round(weakest.accuracyPct)}%.`,
    });
  }

  // (Time-on-task is intentionally NOT framed as engagement — engagement is
  // measured by interaction count + completion, never by how long it took.)

  // Most-retried activity.
  const byActivity = attempts.reduce((acc, a) => {
    (acc[a.activity_id] ||= []).push(a);
    return acc;
  }, {});
  const mostRetried = Object.entries(byActivity)
    .map(([id, rows]) => ({ id, count: rows.length }))
    .sort((a, b) => b.count - a.count)[0];
  if (mostRetried && mostRetried.count > 1) {
    out.push({
      kind: 'most-retries',
      message: `You retried "${mostRetried.id}" ${mostRetried.count} times — persistence counts.`,
    });
  }

  return out;
}

function deriveImprovement(session, history) {
  if (!history.latest_score || history.latest_attempt_no === session.attempt_no) {
    return null;
  }
  const prevScore = history.latest_score;
  const delta = (session.total_score ?? 0) - prevScore;
  return {
    previousScore: prevScore,
    currentScore:  session.total_score ?? 0,
    deltaScore:    delta,
  };
}
