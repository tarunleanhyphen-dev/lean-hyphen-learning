-- Migration 004 — Analytics, scoring, gamification.
--
-- DESIGN PRINCIPLES
-- 1. Event-sourced — every learner interaction lands in `analytics_events`
--    as a raw, immutable row. Aggregate views (session summaries, scores,
--    badges) are computed *from* those events, so we never lose source data
--    and can re-derive a report from history at any time.
-- 2. Idempotent ingestion — each event row carries a client-generated UUID
--    plus a (session, lesson, event_kind, client_seq) tuple so retries from
--    a flaky network can't double-count.
-- 3. Anonymous-friendly — every table joins on `session_id` (the same
--    localStorage-backed identifier the existing /api/progress + /api/
--    reflections tables use). When auth lands we add `user_id` and bind it
--    to all of a learner's prior session_ids in a single migration.
-- 4. LMS-ready — the table shapes are deliberately wide and denormalised in
--    the places an LMS will care about (act_id, scene_id, activity_id) so
--    common reporting queries don't need joins.
-- 5. Configurable scoring — point allocations live in code/config, NOT in
--    the schema. The score columns store the *result* (computed at write
--    time from the active config), so tweaking config doesn't require a
--    backfill unless we explicitly want one.

-- ─────────────────────────────────────────────────────────────────────
-- Raw event log
-- ─────────────────────────────────────────────────────────────────────
-- Every meaningful interaction lands here, exactly once. This is the
-- "ledger" — all aggregate tables below can be reconstructed from it.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id                BIGSERIAL PRIMARY KEY,
  client_event_id   UUID NOT NULL,                  -- client-generated, for idempotency
  session_id        TEXT NOT NULL,
  lesson_id         TEXT,                           -- nullable for top-level events (page_view etc.)
  act_id            TEXT,
  scene_id          TEXT,
  activity_id       TEXT,
  attempt_no        INT  DEFAULT 1,                 -- attempt # of the parent activity (1-indexed)
  event_kind        TEXT NOT NULL,                  -- enum-ish, see backend/src/analytics/events.js
  event_payload     JSONB DEFAULT '{}'::jsonb,      -- everything else the event needs
  client_ts         TIMESTAMPTZ NOT NULL,           -- when the event was emitted in the browser
  server_ts         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent        TEXT,
  CONSTRAINT analytics_events_client_event_id_unique UNIQUE (client_event_id)
);

CREATE INDEX IF NOT EXISTS analytics_events_session_idx
  ON analytics_events (session_id, lesson_id, client_ts);
CREATE INDEX IF NOT EXISTS analytics_events_lesson_kind_idx
  ON analytics_events (lesson_id, event_kind, client_ts);
CREATE INDEX IF NOT EXISTS analytics_events_act_kind_idx
  ON analytics_events (lesson_id, act_id, event_kind);
CREATE INDEX IF NOT EXISTS analytics_events_scene_kind_idx
  ON analytics_events (lesson_id, scene_id, event_kind);

-- ─────────────────────────────────────────────────────────────────────
-- Lesson session — one row per (session, lesson, attempt)
-- ─────────────────────────────────────────────────────────────────────
-- A "session" here means a single attempt at a lesson (NOT a browser
-- session). A learner can re-take the lesson and get a new row per
-- attempt; attempt_no is incremented and aggregates are recomputed.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_lesson_sessions (
  id                BIGSERIAL PRIMARY KEY,
  session_id        TEXT NOT NULL,
  lesson_id         TEXT NOT NULL,
  attempt_no        INT  NOT NULL DEFAULT 1,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  abandoned_at      TIMESTAMPTZ,
  total_time_ms     BIGINT NOT NULL DEFAULT 0,     -- active time, idle stripped
  idle_time_ms      BIGINT NOT NULL DEFAULT 0,
  total_score       INT  NOT NULL DEFAULT 0,       -- 0–100, computed from per-act scores
  completion_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  learning_score    INT  NOT NULL DEFAULT 0,       -- 0–100, accuracy + scenario + completion
  engagement_score  INT  NOT NULL DEFAULT 0,       -- 0–100, time + interaction + participation
  badge_set         JSONB NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT user_lesson_sessions_unique UNIQUE (session_id, lesson_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS user_lesson_sessions_session_idx
  ON user_lesson_sessions (session_id, lesson_id);

-- ─────────────────────────────────────────────────────────────────────
-- Act session — one row per (lesson session, act)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_act_sessions (
  id                BIGSERIAL PRIMARY KEY,
  lesson_session_id BIGINT NOT NULL REFERENCES user_lesson_sessions(id) ON DELETE CASCADE,
  act_id            TEXT NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  total_time_ms     BIGINT NOT NULL DEFAULT 0,
  score             INT  NOT NULL DEFAULT 0,        -- 0–25 typically (config-driven)
  points_earned     INT  NOT NULL DEFAULT 0,
  points_max        INT  NOT NULL DEFAULT 25,
  completion_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  accuracy_pct      NUMERIC(5,2),                   -- nullable when no quiz-like activities
  activities_completed INT NOT NULL DEFAULT 0,
  activities_skipped   INT NOT NULL DEFAULT 0,
  CONSTRAINT user_act_sessions_unique UNIQUE (lesson_session_id, act_id)
);

CREATE INDEX IF NOT EXISTS user_act_sessions_lookup
  ON user_act_sessions (lesson_session_id);

-- ─────────────────────────────────────────────────────────────────────
-- Scene session — one row per (act session, scene)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_scene_sessions (
  id                BIGSERIAL PRIMARY KEY,
  act_session_id    BIGINT NOT NULL REFERENCES user_act_sessions(id) ON DELETE CASCADE,
  scene_id          TEXT NOT NULL,
  entered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exited_at         TIMESTAMPTZ,
  total_time_ms     BIGINT NOT NULL DEFAULT 0,
  interaction_count INT  NOT NULL DEFAULT 0,
  click_count       INT  NOT NULL DEFAULT 0,
  retry_count       INT  NOT NULL DEFAULT 0,
  skipped           BOOLEAN NOT NULL DEFAULT FALSE,
  completed         BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned     INT  NOT NULL DEFAULT 0,
  CONSTRAINT user_scene_sessions_unique UNIQUE (act_session_id, scene_id)
);

CREATE INDEX IF NOT EXISTS user_scene_sessions_lookup
  ON user_scene_sessions (act_session_id);

-- ─────────────────────────────────────────────────────────────────────
-- Activity attempt — one row per attempt of an activity
-- ─────────────────────────────────────────────────────────────────────
-- Activities (mind-trap drag, flash cards, simulation pick-3, impulse
-- meter, takeaways grid) can be retried. We log each attempt rather
-- than overwriting the previous one — that's how the "retry rate" and
-- "average attempts" metrics are computed.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity_attempts (
  id                BIGSERIAL PRIMARY KEY,
  scene_session_id  BIGINT NOT NULL REFERENCES user_scene_sessions(id) ON DELETE CASCADE,
  activity_id       TEXT NOT NULL,
  activity_kind     TEXT NOT NULL,                  -- 'mcq' | 'drag-drop' | 'simulation' | 'reflection' | …
  attempt_no        INT  NOT NULL DEFAULT 1,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  time_to_complete_ms BIGINT,
  success           BOOLEAN,                        -- null = in-progress
  accuracy_pct      NUMERIC(5,2),
  correct_count     INT,
  wrong_count       INT,
  points_earned     INT NOT NULL DEFAULT 0,
  detail            JSONB NOT NULL DEFAULT '{}'::jsonb  -- shape varies by activity_kind
);

CREATE INDEX IF NOT EXISTS user_activity_attempts_lookup
  ON user_activity_attempts (scene_session_id, activity_id);

-- ─────────────────────────────────────────────────────────────────────
-- Scoring snapshot — derived but materialised for fast LMS reads
-- ─────────────────────────────────────────────────────────────────────
-- The "current" score per (session, lesson). Recomputed on each
-- relevant event (act_completed, activity_completed, lesson_completed)
-- using the active scoring config. Keeping it materialised means LMS
-- export endpoints don't have to recompute on every request.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_scores (
  id                BIGSERIAL PRIMARY KEY,
  lesson_session_id BIGINT NOT NULL REFERENCES user_lesson_sessions(id) ON DELETE CASCADE,
  total_score       INT  NOT NULL DEFAULT 0,
  act_scores        JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { act1: 22, act2: 18, ... }
  learning_score    INT  NOT NULL DEFAULT 0,
  engagement_score  INT  NOT NULL DEFAULT 0,
  accuracy_pct      NUMERIC(5,2),
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  config_version    TEXT,                            -- which scoring config produced these numbers
  CONSTRAINT user_scores_unique UNIQUE (lesson_session_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- Badges — one row per (lesson session, badge)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id                BIGSERIAL PRIMARY KEY,
  lesson_session_id BIGINT NOT NULL REFERENCES user_lesson_sessions(id) ON DELETE CASCADE,
  badge_id          TEXT NOT NULL,                  -- 'master-strategist' | 'no-skip-champion' | …
  earned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detail            JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT user_badges_unique UNIQUE (lesson_session_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_lookup
  ON user_badges (lesson_session_id);

-- ─────────────────────────────────────────────────────────────────────
-- Attempt history — best/latest/avg roll-up across attempts
-- ─────────────────────────────────────────────────────────────────────
-- For each (session, lesson) we maintain a rolling roll-up so the LMS
-- can fetch "best score ever" or "growth trend" without re-aggregating
-- the events table on every request.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_attempt_history (
  id                BIGSERIAL PRIMARY KEY,
  session_id        TEXT NOT NULL,
  lesson_id         TEXT NOT NULL,
  attempts_count    INT  NOT NULL DEFAULT 0,
  best_score        INT  NOT NULL DEFAULT 0,
  best_attempt_no   INT,
  latest_score      INT  NOT NULL DEFAULT 0,
  latest_attempt_no INT  NOT NULL DEFAULT 0,
  avg_score         NUMERIC(5,2) NOT NULL DEFAULT 0,
  best_completion_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_time_ms     BIGINT NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_attempt_history_unique UNIQUE (session_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS user_attempt_history_session_idx
  ON user_attempt_history (session_id);

-- ─────────────────────────────────────────────────────────────────────
-- Learning progress — cumulative growth metrics across all lessons
-- ─────────────────────────────────────────────────────────────────────
-- Per (session) — but designed to flip to (user_id) when auth lands.
-- The LMS pulls this for the "learner overview" dashboard.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id                BIGSERIAL PRIMARY KEY,
  session_id        TEXT NOT NULL UNIQUE,
  lessons_started   INT  NOT NULL DEFAULT 0,
  lessons_completed INT  NOT NULL DEFAULT 0,
  total_score       INT  NOT NULL DEFAULT 0,        -- summed across all completed lessons
  total_time_ms     BIGINT NOT NULL DEFAULT 0,
  badges_count      INT  NOT NULL DEFAULT 0,
  last_active_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
