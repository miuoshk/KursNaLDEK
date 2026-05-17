-- RBAC update: admin + moderator access for admin panel features
-- Safe to run multiple times (drops/recreates named policies).
--
-- IMPORTANT: previous version of this script used inline `EXISTS (... profiles ...)`
-- inside RLS policies. When such a check is placed on a policy *for the `profiles` table itself*,
-- PostgreSQL recurses through the same policy and aborts with infinite recursion (HTTP 500).
-- This file now relies on a SECURITY DEFINER helper (`public.is_admin_or_moderator(uuid)`)
-- so role checks never trip RLS recursion.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- ---------- helper: bypass RLS when checking admin/moderator role ----------
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = uid
      AND role IN ('admin', 'moderator')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_moderator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_moderator(uuid) TO authenticated, anon;

-- ---------- error_reports ----------
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read all reports" ON error_reports;
DROP POLICY IF EXISTS "Admin update reports" ON error_reports;
DROP POLICY IF EXISTS "Admin or moderator read all reports" ON error_reports;
DROP POLICY IF EXISTS "Admin or moderator update reports" ON error_reports;

CREATE POLICY "Admin or moderator read all reports"
  ON error_reports FOR SELECT
  USING (public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Admin or moderator update reports"
  ON error_reports FOR UPDATE
  USING (public.is_admin_or_moderator(auth.uid()))
  WITH CHECK (public.is_admin_or_moderator(auth.uid()));

-- ---------- question_discussions ----------
ALTER TABLE question_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin or moderator delete discussions" ON question_discussions;

CREATE POLICY "Admin or moderator delete discussions"
  ON question_discussions FOR DELETE
  USING (public.is_admin_or_moderator(auth.uid()));

-- ---------- questions ----------
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access questions" ON questions;
DROP POLICY IF EXISTS "Admin or moderator full access questions" ON questions;

CREATE POLICY "Admin or moderator full access questions"
  ON questions FOR ALL
  USING (public.is_admin_or_moderator(auth.uid()))
  WITH CHECK (public.is_admin_or_moderator(auth.uid()));

-- ---------- profiles ----------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin or moderator read all profiles" ON profiles;

CREATE POLICY "Admin or moderator read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin_or_moderator(auth.uid())
  );

-- ---------- study_sessions ----------
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read all sessions" ON study_sessions;
DROP POLICY IF EXISTS "Admin or moderator read all sessions" ON study_sessions;

CREATE POLICY "Admin or moderator read all sessions"
  ON study_sessions FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin_or_moderator(auth.uid())
  );
