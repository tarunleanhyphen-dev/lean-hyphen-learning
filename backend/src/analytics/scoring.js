/**
 * Scoring engine.
 *
 * The total lesson score is 100, split evenly across Acts (25 each by
 * default), then distributed inside each Act across scenes + activities
 * via the SCORING_CONFIG map below. Everything is configurable per-lesson
 * so a future CMS can edit point values without touching code.
 *
 * Components of the final number:
 *   • totalScore (0–100)   — Σ per-act scores, capped at lesson max
 *   • learningScore (0–100) — accuracy + scenario quality + completion
 *   • engagementScore (0–100) — time-on-task + interaction density +
 *                               activity participation
 *
 * The score is recomputed from the materialised aggregates each time an
 * `act_completed` / `activity_completed` / `lesson_completed` event is
 * ingested. See routes/analytics.js -> recomputeScore().
 */

/**
 * Default scoring config for the "Think Before You Spend" lesson. In the
 * Postgres world this would live in a `lesson_scoring_configs` table that
 * the CMS edits; for now keeping it in code is fine because there's only
 * one lesson with content.
 */
export const SCORING_CONFIG = {
  configVersion: 'tbs-v1',
  lessonId: 'think-before-you-spend',
  lessonMax: 100,
  acts: {
    act1: {
      max: 25,
      // Each scene/activity entry contributes when the matching key
      // appears as `scene_id` / `activity_id` on a completion event.
      scenes: {
        'scene-0': 3,       // intro montage — passive
        'scene-1': 5,       // plan + first add-to-cart
        'scene-2': 8,       // three suggestion waves
        'scene-3': 4,       // checkout + realisation
      },
      activities: {
        'add-shoes':       2,
        'add-socks':       1,
        'add-hoodie':      1,
        'add-selfie-light':1,
        'reflection-act1': 0,   // reflection counts toward engagement, not score
      },
    },
    act2: {
      max: 25,
      scenes: {
        'scene-6':  4,        // mission briefing
        'scene-7':  5,        // definition
        'scene-8':  4,        // flashcards intro
      },
      activities: {
        'thought-spiral': 8,  // mind-trap drag game
        'impulse-cards':  4,  // 3 flash cards
      },
    },
    act3: {
      max: 25,
      scenes: {
        // Single scenario unfolds across multiple beats; we award on the
        // insight reveal because that's when the learner has earned it.
        'scene-s1': 5,
      },
      activities: {
        // Pick-3 challenge — partial credit handled in computeActivityPoints.
        's1-pick3': 20,
      },
    },
    act4: {
      max: 25,
      scenes: {
        'scene-act4': 5,
      },
      activities: {
        meter:      8,         // impulse-meter self-snapshot (any pick is fine)
        takeaways: 12,         // 5 reveal cards — full marks when all five flipped
      },
    },
  },
};

/**
 * Per-activity rule for converting a raw attempt result into points.
 * The handler returns an integer in [0, max].
 */
/**
 * Scoring config for "Where Does My Money Go?" (Lesson 2). Weighted toward
 * ANSWERS — the Act 3 quiz carries the most marks — while still rewarding
 * engagement (completing each scene). Lesson max stays 100 so the LMS can
 * compare lessons on the same scale.
 *
 *   Act 1 (Dream Bedroom sim)  → 30   Act 2 (50/30/20)  → 30   Act 3 (Quiz) → 40
 */
export const SCORING_CONFIG_WDMMG = {
  configVersion: 'wdmmg-v1',
  lessonId: 'where-does-my-money-go',
  lessonMax: 100,
  acts: {
    act1: {
      max: 30,
      scenes: {
        'screen-1-intro': 2, 'screen-2-vibe': 3, 'screen-2-rules': 2, 'screen-3-sort': 3,
        'screen-4-shop': 5, 'screen-5-events': 3, 'screen-6-snapshot': 2,
      },
      activities: { 'a1-sort': 6, 'a1-snapshot-mcq': 4 },
    },
    act2: {
      max: 30,
      scenes: { 'c1-reveal': 4, 'c2-apply': 4, 'c3-activity': 4, 'c4-takeaway': 3 },
      activities: { 'a2-firstsalary': 15 },
    },
    act3: {
      max: 40,
      scenes: { quiz: 4 },
      activities: { 'a3-quiz': 36 },
    },
  },
};

/** Registry of every lesson's scoring config, keyed by lessonId. */
export const SCORING_CONFIGS = {
  'think-before-you-spend': SCORING_CONFIG,
  'where-does-my-money-go': SCORING_CONFIG_WDMMG,
};

export function getScoringConfig(lessonId) {
  return SCORING_CONFIGS[lessonId] || SCORING_CONFIG;
}

/** Accuracy-based points: full marks at 100% correct, proportional otherwise. */
function accuracyPoints(max, detail = {}) {
  const { correct = 0, total = 0, accuracyPct } = detail;
  const pct = typeof accuracyPct === 'number'
    ? accuracyPct / 100
    : (total ? Math.min(correct, total) / total : 0);
  return Math.round(Math.max(0, Math.min(1, pct)) * max);
}

const ACTIVITY_POINT_RULES = {
  // ── Lesson 2 (Where Does My Money Go?) — answer-graded activities ──
  'a1-sort':         (max, d) => accuracyPoints(max, d),
  'a1-snapshot-mcq': (max, d) => accuracyPoints(max, d),
  'a2-firstsalary':  (max, d) => accuracyPoints(max, d),
  'a3-quiz':         (max, d) => accuracyPoints(max, d),

  // Mind-trap drag game (Act 2). The detail object carries
  // { correct, total } — full marks when all 12 thoughts placed
  // correctly; proportional otherwise.
  'thought-spiral': (max, detail = {}) => {
    const { correct = 0, total = 12 } = detail;
    if (!total) return 0;
    return Math.round((Math.min(correct, total) / total) * max);
  },

  // Flash-card deck — full marks once all 3 cards have been seen
  // (it's a comprehension exposure, not a quiz).
  'impulse-cards': (max, detail = {}) => {
    const { seen = 0, total = 3 } = detail;
    return seen >= total ? max : 0;
  },

  // Pick-3 challenge in Act 3. Full marks when the learner picks
  // exactly the 3 correct options on the first try; proportional credit
  // otherwise (and a small re-try penalty).
  's1-pick3': (max, detail = {}) => {
    const { correct = 0, total = 3, attempts = 1 } = detail;
    const base = (Math.min(correct, total) / total) * max;
    // 10% penalty per extra attempt, floor at 30% of max.
    const penalty = Math.max(0.30, 1 - (attempts - 1) * 0.10);
    return Math.round(base * penalty);
  },

  // Impulse meter — engagement-only, no right answer. Any zone selected = full marks.
  meter: (max, detail = {}) => (detail.zoneId ? max : 0),

  // 5 reveal cards in Act 4 — full marks when all five flipped.
  takeaways: (max, detail = {}) => {
    const { revealed = 0, total = 5 } = detail;
    return revealed >= total ? max : Math.round((revealed / total) * max);
  },
};

/**
 * Convert one activity attempt's `detail` JSON into a point value.
 * Falls back to "full marks on success, zero otherwise" for activities
 * without a specific rule.
 */
export function computeActivityPoints({ activityId, success, detail = {} }, config = SCORING_CONFIG) {
  const max = findActivityMax(activityId, config);
  if (!max) return 0;
  const rule = ACTIVITY_POINT_RULES[activityId];
  if (rule) return clamp(rule(max, detail), 0, max);
  return success ? max : 0;
}

/**
 * Project the active scoring config to find the max points an activity
 * can yield. We deliberately scan all acts rather than indexing by
 * actId so the frontend can emit completion events without re-stating
 * which act they belong to.
 */
function findActivityMax(activityId, config) {
  for (const a of Object.values(config.acts)) {
    if (a.activities && activityId in a.activities) return a.activities[activityId];
  }
  return 0;
}

export function findSceneMax(sceneId, config = SCORING_CONFIG) {
  for (const a of Object.values(config.acts)) {
    if (a.scenes && sceneId in a.scenes) return a.scenes[sceneId];
  }
  return 0;
}

export function findActMax(actId, config = SCORING_CONFIG) {
  return config.acts?.[actId]?.max ?? 0;
}

/**
 * Recompute the total + per-act scores from a list of completed
 * scene / activity rows. Used by the report endpoint and by the
 * post-event projector.
 */
export function rollUpScores({ scenes = [], activities, attempts }, config = SCORING_CONFIG) {
  // Accept either `activities` (canonical name) or `attempts` (what the
  // file store calls it) — readTreeById returns the latter.
  // eslint-disable-next-line no-param-reassign
  activities = activities ?? attempts ?? [];
  const actScores = {};
  for (const actId of Object.keys(config.acts)) actScores[actId] = 0;

  for (const s of scenes) {
    if (!s.completed) continue;
    // Find which act this scene belongs to so we attribute its points.
    for (const [actId, a] of Object.entries(config.acts)) {
      if (a.scenes && s.scene_id in a.scenes) {
        actScores[actId] += s.points_earned ?? 0;
        break;
      }
    }
  }

  for (const at of activities) {
    if (!at.success && at.success !== null) continue;
    for (const [actId, a] of Object.entries(config.acts)) {
      if (a.activities && at.activity_id in a.activities) {
        actScores[actId] += at.points_earned ?? 0;
        break;
      }
    }
  }

  // Cap each act at its max so over-allocation in config can't blow past 100.
  for (const actId of Object.keys(actScores)) {
    actScores[actId] = clamp(actScores[actId], 0, findActMax(actId, config));
  }
  const totalScore = clamp(
    Object.values(actScores).reduce((s, v) => s + v, 0),
    0,
    config.lessonMax,
  );
  return { totalScore, actScores, configVersion: config.configVersion };
}

/**
 * Engagement score (0–100). Heuristic, intentionally simple — replace
 * with a tuned model once we have enough real session data to fit one.
 *
 *   60 pts — completion% (full credit at 100%)
 *   25 pts — interaction density (mapped from clicks-per-minute)
 *   15 pts — activity participation (% of activities attempted)
 */
export function engagementScore({
  completionPct = 0,
  clicksPerMinute = 0,
  activityParticipationPct = 0,
}) {
  const completion = (completionPct / 100) * 60;
  const interactions = clamp(clicksPerMinute / 8, 0, 1) * 25;
  const participation = (activityParticipationPct / 100) * 15;
  return clamp(Math.round(completion + interactions + participation), 0, 100);
}

/**
 * Learning score (0–100) — quality of the answers (not just whether they
 * showed up).
 *
 *   60 pts — accuracy% across all gradable activities
 *   25 pts — scenario decision quality (Act 3 + activity-level rules)
 *   15 pts — completion% (so a 100%-completion 0%-accuracy learner still
 *            gets some credit for showing up)
 */
export function learningScore({ accuracyPct = 0, scenarioQualityPct = 0, completionPct = 0 }) {
  const acc = (accuracyPct / 100) * 60;
  const scn = (scenarioQualityPct / 100) * 25;
  const cmp = (completionPct / 100) * 15;
  return clamp(Math.round(acc + scn + cmp), 0, 100);
}

function clamp(n, lo, hi) {
  if (Number.isNaN(n) || n == null) return lo;
  return Math.max(lo, Math.min(hi, n));
}
