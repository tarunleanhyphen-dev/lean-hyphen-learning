-- Migration 004 — Dream Bedroom Makeover run captures.
--
-- One row per completed Act 1 run. Captures every meaningful decision the
-- learner made so we can later show personal recaps, run analytics on which
-- items get picked, and tune the catalogue.

CREATE TABLE IF NOT EXISTS room_makeover_runs (
  id                   BIGSERIAL PRIMARY KEY,
  session_id           TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  lesson_id            TEXT NOT NULL,
  act_id               TEXT NOT NULL,
  vibe                 TEXT,
  cart                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_answers         JSONB,
  spent                INT,
  category_totals      JSONB,
  needs_total          INT,
  wants_total          INT,
  reserve_status       TEXT,
  reserve_remaining    INT,
  savings              INT,
  fixed_event_choice   TEXT,
  random_event_id      TEXT,
  random_event_choice  TEXT,
  snapshot_mcq         TEXT,
  insights             JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_makeover_runs_session ON room_makeover_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_makeover_runs_lesson  ON room_makeover_runs(lesson_id, act_id);

-- RLS: anon may INSERT and SELECT their own session's runs (sessions table
-- already gates by session_id so the join naturally restricts access).
ALTER TABLE room_makeover_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS makeover_insert_public ON room_makeover_runs;
CREATE POLICY makeover_insert_public ON room_makeover_runs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
