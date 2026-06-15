-- CySec P0.4 + P1.7/8/9
-- P0.4: reset postępu przedmiotu tylko przez service role (server action weryfikuje user.id).
-- P1.7: is_admin_or_moderator w schemacie private — niedostępne przez PostgREST RPC.
-- P1.8: search_path na triggerze profiles.
-- P1.9: blokada gamifikacji na profiles (nick/display_name/avatar bez zmian — public_profiles).
-- Bezpieczne do powtórnego uruchomienia.

-- ============================================================
-- P1.7 — private.is_admin_or_moderator (tylko RLS, nie REST RPC)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated;

CREATE OR REPLACE FUNCTION private.is_admin_or_moderator(uid uuid)
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

REVOKE ALL ON FUNCTION private.is_admin_or_moderator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin_or_moderator(uuid) TO postgres, service_role, authenticated;

-- ---------- profiles ----------
DROP POLICY IF EXISTS "Admin or moderator read all profiles" ON public.profiles;
CREATE POLICY "Admin or moderator read all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT auth.uid()) = id
    OR private.is_admin_or_moderator((SELECT auth.uid()))
  );

-- ---------- study_sessions ----------
DROP POLICY IF EXISTS "Admin or moderator read all sessions" ON public.study_sessions;
CREATE POLICY "Admin or moderator read all sessions"
  ON public.study_sessions FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR private.is_admin_or_moderator((SELECT auth.uid()))
  );

-- ---------- error_reports ----------
DROP POLICY IF EXISTS "User or admin can read reports" ON public.error_reports;
DROP POLICY IF EXISTS "Admin or moderator update reports" ON public.error_reports;

CREATE POLICY "User or admin can read reports"
  ON public.error_reports FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR private.is_admin_or_moderator((SELECT auth.uid()))
  );

CREATE POLICY "Admin or moderator update reports"
  ON public.error_reports FOR UPDATE
  USING (private.is_admin_or_moderator((SELECT auth.uid())))
  WITH CHECK (private.is_admin_or_moderator((SELECT auth.uid())));

-- ---------- questions ----------
DROP POLICY IF EXISTS "Admin or moderator insert questions" ON public.questions;
DROP POLICY IF EXISTS "Admin or moderator update questions" ON public.questions;
DROP POLICY IF EXISTS "Admin or moderator delete questions" ON public.questions;
DROP POLICY IF EXISTS questions_admin_select_all ON public.questions;

CREATE POLICY "Admin or moderator insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (private.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY "Admin or moderator update questions"
  ON public.questions FOR UPDATE
  USING (private.is_admin_or_moderator((SELECT auth.uid())))
  WITH CHECK (private.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY "Admin or moderator delete questions"
  ON public.questions FOR DELETE
  USING (private.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY questions_admin_select_all
  ON public.questions FOR SELECT
  TO authenticated
  USING (private.is_admin_or_moderator((SELECT auth.uid())));

-- ---------- question_discussions ----------
DROP POLICY IF EXISTS "Admin or moderator delete discussions" ON public.question_discussions;
CREATE POLICY "Admin or moderator delete discussions"
  ON public.question_discussions FOR DELETE
  USING (private.is_admin_or_moderator((SELECT auth.uid())));

-- ---------- question_edits ----------
DROP POLICY IF EXISTS "Admin or moderator read question_edits" ON public.question_edits;
DROP POLICY IF EXISTS "Admin or moderator insert own question_edits" ON public.question_edits;

CREATE POLICY "Admin or moderator read question_edits"
  ON public.question_edits FOR SELECT
  USING (private.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY "Admin or moderator insert own question_edits"
  ON public.question_edits FOR INSERT
  WITH CHECK (
    editor_id = (SELECT auth.uid())
    AND private.is_admin_or_moderator((SELECT auth.uid()))
  );

-- ---------- account_bans ----------
DROP POLICY IF EXISTS "Admin or moderator read account bans" ON public.account_bans;
CREATE POLICY "Admin or moderator read account bans"
  ON public.account_bans FOR SELECT
  USING (private.is_admin_or_moderator((SELECT auth.uid())));

-- ---------- consent_log ----------
DROP POLICY IF EXISTS "Admin or moderator read consent" ON public.consent_log;
CREATE POLICY "Admin or moderator read consent"
  ON public.consent_log FOR SELECT
  USING (private.is_admin_or_moderator((SELECT auth.uid())));

-- ---------- stripe_payments ----------
DROP POLICY IF EXISTS "Admin or moderator read stripe_payments" ON public.stripe_payments;
CREATE POLICY "Admin or moderator read stripe_payments"
  ON public.stripe_payments FOR SELECT
  USING (private.is_admin_or_moderator((SELECT auth.uid())));

-- ---------- storage.objects (question-images) ----------
DROP POLICY IF EXISTS "Admin upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update question images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete question images" ON storage.objects;

CREATE POLICY "Admin upload question images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'question-images'
    AND private.is_admin_or_moderator((SELECT auth.uid()))
  );

CREATE POLICY "Admin update question images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'question-images'
    AND private.is_admin_or_moderator((SELECT auth.uid()))
  )
  WITH CHECK (
    bucket_id = 'question-images'
    AND private.is_admin_or_moderator((SELECT auth.uid()))
  );

CREATE POLICY "Admin delete question images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'question-images'
    AND private.is_admin_or_moderator((SELECT auth.uid()))
  );

DROP FUNCTION IF EXISTS public.is_admin_or_moderator(uuid);

-- ============================================================
-- P0.4 — reset postępu tylko service role (+ jawny user_id z serwera)
-- ============================================================
DROP FUNCTION IF EXISTS public.reset_subject_progress(text);

CREATE OR REPLACE FUNCTION public.reset_subject_progress_for_user(
  p_user_id uuid,
  p_subject_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_subject_id IS NULL OR LENGTH(TRIM(p_subject_id)) = 0 THEN
    RAISE EXCEPTION 'Nieprawidłowe parametry resetu postępu.';
  END IF;

  DELETE FROM public.study_sessions
  WHERE user_id = p_user_id
    AND subject_id = p_subject_id;

  DELETE FROM public.user_question_progress uqp
  USING public.questions q, public.topics t
  WHERE uqp.user_id = p_user_id
    AND uqp.question_id = q.id
    AND q.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM public.topic_mastery_cache tmc
  USING public.topics t
  WHERE tmc.user_id = p_user_id
    AND tmc.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM public.learning_events le
  WHERE le.user_id = p_user_id
    AND (
      le.payload ->> 'subjectId' = p_subject_id
      OR le.payload ->> 'subject_id' = p_subject_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reset_subject_progress_for_user(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_subject_progress_for_user(uuid, text) TO service_role;

-- ============================================================
-- P1.8 + P1.9 — trigger profiles (privilegia + gamifikacja)
-- Nick, display_name, avatar_* — bez zmian (dyskusje / ranking).
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jwt_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.access_revoked_at := OLD.access_revoked_at;
  NEW.subscription_status := OLD.subscription_status;
  NEW.stripe_customer_id := OLD.stripe_customer_id;

  NEW.xp := OLD.xp;
  NEW.current_streak := OLD.current_streak;
  NEW.longest_streak := OLD.longest_streak;
  NEW.last_active_date := OLD.last_active_date;
  NEW.exam_readiness_score := OLD.exam_readiness_score;
  NEW.questions_answered_total := OLD.questions_answered_total;
  NEW.readiness_percentile := OLD.readiness_percentile;
  NEW.readiness_cohort_size := OLD.readiness_cohort_size;
  NEW.readiness_user_attempts := OLD.readiness_user_attempts;
  NEW.readiness_computed_at := OLD.readiness_computed_at;
  NEW.avg_session_hour := OLD.avg_session_hour;
  NEW.learning_velocity := OLD.learning_velocity;

  RETURN NEW;
END;
$$;
