/**
 * Frontend-side mirror of the backend scoring config.
 *
 * The backend is the source of truth for grading — this map is kept on
 * the frontend ONLY so the post-act / post-lesson UI can render score
 * targets ("0 / 25 points") before the server's report arrives. The
 * authoritative numbers always come from /api/analytics/lesson/:id.
 *
 * Keep this file in sync with `backend/src/analytics/scoring.js`. When
 * the CMS lands, both sides will load this map from a single API call.
 */
export const SCORING_CONFIG = {
  lessonId: 'think-before-you-spend',
  lessonMax: 100,
  acts: {
    act1: { max: 25, title: 'Act 1 — Temptation' },
    act2: { max: 25, title: 'Act 2 — Understanding Impulse Buying' },
    act3: { max: 25, title: 'Act 3 — Real-life Simulation' },
    act4: { max: 25, title: 'Act 4 — Reflect & Realise' },
  },
};

/** Stable badge metadata for rendering — backend awards the badge IDs. */
export const BADGES = {
  'master-strategist':   { title: 'Master Strategist',   emoji: '🏆', tier: 'score' },
  'expert-learner':      { title: 'Expert Learner',      emoji: '🎓', tier: 'score' },
  'advanced-explorer':   { title: 'Advanced Explorer',   emoji: '🧭', tier: 'score' },
  'knowledge-builder':   { title: 'Knowledge Builder',   emoji: '📚', tier: 'score' },
  'emerging-learner':    { title: 'Emerging Learner',    emoji: '🌱', tier: 'score' },
  'needs-improvement':   { title: 'Needs Improvement',   emoji: '🔁', tier: 'score' },
  'perfect-act':         { title: 'Perfect Act',         emoji: '💯', tier: 'achievement' },
  'no-skip-champion':    { title: 'No-Skip Champion',    emoji: '🚀', tier: 'achievement' },
  'fast-finisher':       { title: 'Fast Finisher',       emoji: '⚡', tier: 'achievement' },
  'persistence-champion':{ title: 'Persistence Champion',emoji: '🔥', tier: 'achievement' },
  'critical-thinker':    { title: 'Critical Thinker',    emoji: '🧠', tier: 'achievement' },
  'decision-master':     { title: 'Decision Master',     emoji: '🎯', tier: 'achievement' },
  'scenario-specialist': { title: 'Scenario Specialist', emoji: '🎬', tier: 'achievement' },
};
