-- Lean Hyphen — Row-Level Security for the analytics tables (migration 006).
-- Run after 004_analytics.sql. Idempotent.
--
-- Rationale:
-- 004_analytics.sql created these tables but never enabled RLS, so Supabase's
-- security advisor flagged them (rls_disabled_in_public / sensitive_columns_
-- exposed): anyone with the PUBLIC anon key could read every student's analytics
-- via PostgREST (e.g. GET /rest/v1/analytics_blob).
--
-- The current pipeline writes ONLY through the backend — the browser posts to
-- /api/analytics/events and the backend persists via the privileged Postgres
-- connection (DATABASE_URL) / service_role, both of which BYPASS RLS. The
-- frontend never queries these tables directly. So enabling RLS with NO policies
-- (default-deny to anon/authenticated) closes the public hole with zero app
-- impact.

ALTER TABLE public.analytics_blob          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_act_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scene_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_attempt_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress  ENABLE ROW LEVEL SECURITY;

-- No policies are defined on purpose: RLS-enabled + no-policy = the anon and
-- authenticated roles see zero rows (default deny). The backend's privileged
-- connection bypasses RLS, so event ingest and reporting are unaffected.
-- (If a future design needs the browser to read/write these via the anon key,
-- add scoped policies here — e.g. keyed on session_id once Supabase Auth lands.)
