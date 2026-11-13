-- ============================================================================
-- Talk Around: User Activity Logs Table (Listening & Shadowing Tracking)
-- Follows AGENTS.md Supabase Security Rules (GRANT + RLS + authenticated Policy)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname text NOT NULL DEFAULT '익명',
  scenario_id text,
  scenario_name text NOT NULL,
  listening_count integer NOT NULL DEFAULT 0 CHECK (listening_count >= 0),
  shadowing_count integer NOT NULL DEFAULT 0 CHECK (shadowing_count >= 0),
  appropriateness_score integer NOT NULL DEFAULT 0 CHECK (appropriateness_score >= 0 AND appropriateness_score <= 100),
  cefr_level text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast timeline & per-user queries
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_recorded_at
  ON public.user_activity_logs (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id
  ON public.user_activity_logs (user_id);

-- 1. Explicit PostgREST Role Grants (AGENTS.md Rule 1)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_activity_logs TO anon, authenticated;

-- 2. Enable Row Level Security & Policies for authenticated users (AGENTS.md Rule 2)
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select" ON public.user_activity_logs;
CREATE POLICY "Authenticated users can select"
  ON public.user_activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert" ON public.user_activity_logs;
CREATE POLICY "Authenticated users can insert"
  ON public.user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update" ON public.user_activity_logs;
CREATE POLICY "Authenticated users can update"
  ON public.user_activity_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete" ON public.user_activity_logs;
CREATE POLICY "Authenticated users can delete"
  ON public.user_activity_logs
  FOR DELETE
  TO authenticated
  USING (true);
