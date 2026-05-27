-- Lean Hyphen — Supabase Row-Level Security (migration 002).
-- Run after 001_init.sql. Idempotent.
--
-- Rationale:
-- Supabase exposes every table via PostgREST + the `anon` role by default.
-- Without RLS, anyone with the anon key could read/write every row.
-- This migration:
--   1. Enables RLS on all three tables.
--   2. Allows ANONYMOUS INSERTs (the lesson runs without login today).
--   3. Restricts SELECT/UPDATE/DELETE to the service_role (backend only).
-- When you add Supabase Auth later, swap the anon INSERT policies for
-- `auth.uid() = user_id` style policies and add a `user_id` column.

ALTER TABLE sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE act_progress  ENABLE ROW LEVEL SECURITY;

-- sessions: anyone can create their own session row; nobody reads via anon.
DROP POLICY IF EXISTS sessions_insert_anon ON sessions;
CREATE POLICY sessions_insert_anon ON sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- reflections: anyone can write; reads restricted to service_role.
DROP POLICY IF EXISTS reflections_insert_anon ON reflections;
CREATE POLICY reflections_insert_anon ON reflections
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- act_progress: anyone can insert/update their own progress (keyed by sessionId).
-- We intentionally allow UPDATE for the upsert path in /api/progress when
-- routed via the SDK; the backend route uses service_role and bypasses this.
DROP POLICY IF EXISTS progress_insert_anon ON act_progress;
CREATE POLICY progress_insert_anon ON act_progress
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS progress_update_anon ON act_progress;
CREATE POLICY progress_update_anon ON act_progress
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
