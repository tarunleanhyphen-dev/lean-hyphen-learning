/**
 * Badge engine.
 *
 * Badges are awarded from the rolled-up lesson session shape, NOT from
 * raw events — that way the same logic runs for both real-time
 * award-on-completion and historical re-derivation.
 *
 * Each badge has:
 *   id       — stable identifier (used as PK in user_badges)
 *   title    — human-readable label
 *   tier     — informational only ('score' for score-band badges,
 *              'achievement' for behavioural ones)
 *   detail   — extra context recorded on the row (e.g. score band)
 *   when     — predicate ({ session, acts, attempts }) => boolean
 *
 * When adding a new badge, append to BADGE_RULES. Order matters only
 * for score-band badges (we pick the highest matching band).
 */

const SCORE_BANDS = [
  { id: 'master-strategist',   min: 100, title: 'Master Strategist'  },
  { id: 'expert-learner',      min: 90,  title: 'Expert Learner'     },
  { id: 'advanced-explorer',   min: 80,  title: 'Advanced Explorer'  },
  { id: 'knowledge-builder',   min: 70,  title: 'Knowledge Builder'  },
  { id: 'emerging-learner',    min: 60,  title: 'Emerging Learner'   },
];

/**
 * Behavioural badges — independent of the score band.
 */
const BEHAVIOUR_RULES = [
  {
    id: 'perfect-act',
    title: 'Perfect Act',
    tier: 'achievement',
    when: ({ acts }) => acts.some((a) => a.points_earned >= a.points_max && a.points_max > 0),
    detailFrom: ({ acts }) => {
      const a = acts.find((x) => x.points_earned >= x.points_max && x.points_max > 0);
      return a ? { actId: a.act_id, points: a.points_earned } : {};
    },
  },
  {
    id: 'no-skip-champion',
    title: 'No-Skip Champion',
    tier: 'achievement',
    when: ({ acts }) => acts.every((a) => (a.activities_skipped ?? 0) === 0),
  },
  {
    id: 'fast-finisher',
    // Lesson finished in under ~10 min — generous given the ~12 min advertised.
    title: 'Fast Finisher',
    tier: 'achievement',
    when: ({ session }) =>
      session.completed_at && session.total_time_ms > 0 && session.total_time_ms < 10 * 60 * 1000,
    detailFrom: ({ session }) => ({ totalTimeMs: session.total_time_ms }),
  },
  {
    id: 'persistence-champion',
    // Earned by retrying at least one activity and improving on it.
    title: 'Persistence Champion',
    tier: 'achievement',
    when: ({ attempts }) => {
      // attempts grouped by activity_id with at least one retry that scored higher.
      const byActivity = groupBy(attempts, (a) => a.activity_id);
      return Object.values(byActivity).some((rows) => {
        if (rows.length < 2) return false;
        const sorted = [...rows].sort((a, b) => a.attempt_no - b.attempt_no);
        return sorted[sorted.length - 1].points_earned > sorted[0].points_earned;
      });
    },
  },
  {
    id: 'critical-thinker',
    // Earned for high accuracy across the gradable activities (Act 2 mind-trap, Act 3 pick-3).
    title: 'Critical Thinker',
    tier: 'achievement',
    when: ({ session }) => (session.accuracy_pct ?? 0) >= 90,
    detailFrom: ({ session }) => ({ accuracyPct: session.accuracy_pct }),
  },
  {
    id: 'decision-master',
    // Earned for nailing the Act 3 scenario on the first attempt.
    title: 'Decision Master',
    tier: 'achievement',
    when: ({ attempts }) =>
      attempts.some(
        (a) => a.activity_id === 's1-pick3' && a.attempt_no === 1 && (a.accuracy_pct ?? 0) >= 100,
      ),
  },
  {
    id: 'scenario-specialist',
    // Earned for getting a perfect mind-trap drag + perfect pick-3.
    title: 'Scenario Specialist',
    tier: 'achievement',
    when: ({ attempts }) => {
      const ms = attempts.find((a) => a.activity_id === 'thought-spiral');
      const p3 = attempts.find((a) => a.activity_id === 's1-pick3');
      return ms && p3 && (ms.accuracy_pct ?? 0) >= 100 && (p3.accuracy_pct ?? 0) >= 100;
    },
  },
];

/**
 * Compute the list of badges earned by a (rolled-up) lesson session.
 *
 *   ctx = {
 *     session: user_lesson_sessions row,
 *     acts:    user_act_sessions rows,
 *     attempts: user_activity_attempts rows,
 *   }
 *
 * Returns: Array<{ badgeId, title, tier, detail }>
 */
export function awardBadges(ctx) {
  const out = [];

  // 1. Single best score-band badge.
  const band = SCORE_BANDS.find((b) => (ctx.session.total_score ?? 0) >= b.min);
  if (band) {
    out.push({
      badgeId: band.id,
      title: band.title,
      tier: 'score',
      detail: { scoreBand: band.min, totalScore: ctx.session.total_score },
    });
  } else if ((ctx.session.total_score ?? 0) > 0) {
    out.push({
      badgeId: 'needs-improvement',
      title: 'Needs Improvement',
      tier: 'score',
      detail: { totalScore: ctx.session.total_score },
    });
  }

  // 2. All behavioural badges that fire.
  for (const rule of BEHAVIOUR_RULES) {
    try {
      if (rule.when(ctx)) {
        out.push({
          badgeId: rule.id,
          title: rule.title,
          tier: rule.tier,
          detail: rule.detailFrom ? rule.detailFrom(ctx) : {},
        });
      }
    } catch {
      // A buggy rule shouldn't crash the entire awarding pass.
    }
  }

  return out;
}

function groupBy(arr, keyFn) {
  return arr.reduce((acc, x) => {
    const k = keyFn(x);
    (acc[k] ||= []).push(x);
    return acc;
  }, {});
}
