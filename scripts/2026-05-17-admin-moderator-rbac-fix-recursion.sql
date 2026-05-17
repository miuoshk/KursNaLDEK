-- Fix: "infinite recursion detected in policy for relation \"profiles\""
-- Cause: 2026-05-17-admin-moderator-rbac.sql introduced policies whose USING
-- clauses do `EXISTS (SELECT 1 FROM profiles ... role IN ('admin','moderator'))`.
-- Because RLS re-applies on the inner SELECT, the profiles policy recurses on
-- itself. Side effect: any policy on other tables that probes profiles also
-- inherits the recursion and starts failing.
--
-- The canonical Supabase pattern: wrap the role lookup in a SECURITY DEFINER
-- function so the inner read bypasses RLS. Safe to run multiple times.

CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = uid
      AND role IN ('admin', 'moderator')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_moderator(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_moderator(UUID) TO authenticated, anon, service_role;

-- ---------- profiles ----------
DROP POLICY IF EXISTS "Admin or moderator read all profiles" ON profiles;

CREATE POLICY "Admin or moderator read all profiles"
  ON profiles FOR SELECT USING (
    auth.uid() = id OR public.is_admin_or_moderator(auth.uid())
  );

-- ---------- error_reports ----------
DROP POLICY IF EXISTS "Admin or moderator read all reports" ON error_reports;
DROP POLICY IF EXISTS "Admin or moderator update reports" ON error_reports;

CREATE POLICY "Admin or moderator read all reports"
  ON error_reports FOR SELECT USING (public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Admin or moderator update reports"
  ON error_reports FOR UPDATE
  USING (public.is_admin_or_moderator(auth.uid()))
  WITH CHECK (public.is_admin_or_moderator(auth.uid()));

-- ---------- question_discussions ----------
DROP POLICY IF EXISTS "Admin or moderator delete discussions" ON question_discussions;

CREATE POLICY "Admin or moderator delete discussions"
  ON question_discussions FOR DELETE USING (public.is_admin_or_moderator(auth.uid()));

-- ---------- questions ----------
DROP POLICY IF EXISTS "Admin or moderator full access questions" ON questions;

CREATE POLICY "Admin or moderator full access questions"
  ON questions FOR ALL
  USING (public.is_admin_or_moderator(auth.uid()))
  WITH CHECK (public.is_admin_or_moderator(auth.uid()));

-- ---------- study_sessions ----------
DROP POLICY IF EXISTS "Admin or moderator read all sessions" ON study_sessions;

CREATE POLICY "Admin or moderator read all sessions"
  ON study_sessions FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin_or_moderator(auth.uid())
  );
