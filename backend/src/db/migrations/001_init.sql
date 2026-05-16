-- Lean Hyphen — initial schema (migration 001).
-- Idempotent: every statement uses IF NOT EXISTS so it can be re-run safely.
-- Extend by adding new numbered migration files; do not modify this one.

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent    TEXT
);

CREATE TABLE IF NOT EXISTS reflections (
  id            BIGSERIAL PRIMARY KEY,
  session_id    TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  lesson_id     TEXT NOT NULL,
  act_id        TEXT NOT NULL,
  prompt        TEXT,
  response      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflections_session ON reflections(session_id);
CREATE INDEX IF NOT EXISTS idx_reflections_lesson  ON reflections(lesson_id, act_id);

CREATE TABLE IF NOT EXISTS act_progress (
  session_id    TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  lesson_id     TEXT NOT NULL,
  act_id        TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('started','completed','skipped')),
  payload       JSONB,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, lesson_id, act_id)
);

-- For analytics queries (completion rate, drop-off per act).
CREATE INDEX IF NOT EXISTS idx_progress_lesson_status ON act_progress(lesson_id, status);
