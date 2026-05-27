-- Lean Hyphen — lessons content table (migration 003).
-- Mirrors the JS lesson files at frontend/src/data/lessons/*.js into the DB
-- so we can: (a) join progress/reflections with lesson titles for analytics,
-- (b) ship lessons without a redeploy, (c) later build a content editor.
--
-- The lesson body is stored as JSONB to preserve fidelity with the React-side
-- schema (scenes/phases reference component-specific keys like `scenePhase`,
-- `reaction`, `paymentStep` that don't normalize cleanly).

CREATE TABLE IF NOT EXISTS lessons (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  module          TEXT NOT NULL,
  title           TEXT NOT NULL,
  total_minutes   INT,
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  hero            JSONB,
  acts            JSONB NOT NULL,
  extras          JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_featured ON lessons(featured) WHERE featured = TRUE;

-- RLS: lessons are public reads, writes only via service_role.
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lessons_read_public ON lessons;
CREATE POLICY lessons_read_public ON lessons
  FOR SELECT TO anon, authenticated
  USING (true);
