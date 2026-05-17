-- Tech-debt cleanup before go-live.
-- 1. Wszystkie polityki: `auth.uid()` -> `(SELECT auth.uid())` (advisor 0003).
--    `(SELECT auth.uid())` jest wyliczane raz na zapytanie, nie raz na wiersz.
-- 2. Konsolidacja zduplikowanych polityk SELECT (advisor 0006).
-- 3. Indeksy na FK bez pokrycia (advisor 0001).
-- Zero zmian semantyki RLS — to jest pure-perf refactor + dedup.
--
-- Bezpieczne do powtórnego uruchomienia.

-- ============================================================
-- 1. PROFILES
-- "Admin or moderator read all profiles" już obejmuje przypadek
--  `auth.uid() = id`, więc "Users can view own profile" jest redundantny.
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin or moderator read all profiles" ON public.profiles;

CREATE POLICY "Admin or moderator read all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT auth.uid()) = id
    OR public.is_admin_or_moderator((SELECT auth.uid()))
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- ============================================================
-- 2. STUDY_SESSIONS
-- "Admin or moderator read all sessions" już obejmuje `user_id = auth.uid()`,
--  więc "Users own sessions SELECT" jest redundantny.
-- ============================================================
DROP POLICY IF EXISTS "Users own sessions SELECT" ON public.study_sessions;
DROP POLICY IF EXISTS "Users own sessions INSERT" ON public.study_sessions;
DROP POLICY IF EXISTS "Users own sessions UPDATE" ON public.study_sessions;
DROP POLICY IF EXISTS "Admin or moderator read all sessions" ON public.study_sessions;

CREATE POLICY "Admin or moderator read all sessions"
  ON public.study_sessions FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin_or_moderator((SELECT auth.uid()))
  );

CREATE POLICY "Users own sessions INSERT"
  ON public.study_sessions FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own sessions UPDATE"
  ON public.study_sessions FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 3. ERROR_REPORTS
-- Konsolidacja: jedna polityka SELECT zamiast user-own + admin.
-- ============================================================
DROP POLICY IF EXISTS "Users can view own reports" ON public.error_reports;
DROP POLICY IF EXISTS "Admin or moderator read all reports" ON public.error_reports;
DROP POLICY IF EXISTS "Admin or moderator update reports" ON public.error_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.error_reports;

CREATE POLICY "User or admin can read reports"
  ON public.error_reports FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin_or_moderator((SELECT auth.uid()))
  );

CREATE POLICY "Admin or moderator update reports"
  ON public.error_reports FOR UPDATE
  USING (public.is_admin_or_moderator((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY "Users can create reports"
  ON public.error_reports FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 4. QUESTIONS
-- "Authenticated can read questions" już pokrywa SELECT dla wszystkich,
--  więc admin-policy może być zredukowana do INSERT/UPDATE/DELETE.
-- ============================================================
DROP POLICY IF EXISTS "Admin or moderator full access questions" ON public.questions;

CREATE POLICY "Admin or moderator insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (public.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY "Admin or moderator update questions"
  ON public.questions FOR UPDATE
  USING (public.is_admin_or_moderator((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY "Admin or moderator delete questions"
  ON public.questions FOR DELETE
  USING (public.is_admin_or_moderator((SELECT auth.uid())));

-- ============================================================
-- 5. QUESTION_DISCUSSIONS
-- ============================================================
DROP POLICY IF EXISTS "Users can create discussions" ON public.question_discussions;
DROP POLICY IF EXISTS "Users can update own discussions" ON public.question_discussions;
DROP POLICY IF EXISTS "Admin or moderator delete discussions" ON public.question_discussions;

CREATE POLICY "Users can create discussions"
  ON public.question_discussions FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own discussions"
  ON public.question_discussions FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admin or moderator delete discussions"
  ON public.question_discussions FOR DELETE
  USING (public.is_admin_or_moderator((SELECT auth.uid())));

-- ============================================================
-- 6. SAVED_QUESTIONS
-- ============================================================
DROP POLICY IF EXISTS "Users own saved_questions SELECT" ON public.saved_questions;
DROP POLICY IF EXISTS "Users own saved_questions INSERT" ON public.saved_questions;
DROP POLICY IF EXISTS "Users own saved_questions DELETE" ON public.saved_questions;

CREATE POLICY "Users own saved_questions SELECT"
  ON public.saved_questions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own saved_questions INSERT"
  ON public.saved_questions FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own saved_questions DELETE"
  ON public.saved_questions FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 7. SESSION_ANSWERS (podzapytanie po study_sessions)
-- ============================================================
DROP POLICY IF EXISTS "Users own session_answers SELECT" ON public.session_answers;
DROP POLICY IF EXISTS "Users own session_answers INSERT" ON public.session_answers;
DROP POLICY IF EXISTS "Users own session_answers UPDATE" ON public.session_answers;

CREATE POLICY "Users own session_answers SELECT"
  ON public.session_answers FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.study_sessions WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users own session_answers INSERT"
  ON public.session_answers FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.study_sessions WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users own session_answers UPDATE"
  ON public.session_answers FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.study_sessions WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 8. LEARNING_EVENTS
-- ============================================================
DROP POLICY IF EXISTS le_own ON public.learning_events;

CREATE POLICY le_own
  ON public.learning_events FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 9. TOPIC_MASTERY_CACHE
-- ============================================================
DROP POLICY IF EXISTS tmc_select ON public.topic_mastery_cache;
DROP POLICY IF EXISTS tmc_insert ON public.topic_mastery_cache;
DROP POLICY IF EXISTS tmc_update ON public.topic_mastery_cache;

CREATE POLICY tmc_select
  ON public.topic_mastery_cache FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY tmc_insert
  ON public.topic_mastery_cache FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY tmc_update
  ON public.topic_mastery_cache FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 10. USER_QUESTION_PROGRESS
-- ============================================================
DROP POLICY IF EXISTS "Users own progress SELECT" ON public.user_question_progress;
DROP POLICY IF EXISTS "Users own progress INSERT" ON public.user_question_progress;
DROP POLICY IF EXISTS "Users own progress UPDATE" ON public.user_question_progress;

CREATE POLICY "Users own progress SELECT"
  ON public.user_question_progress FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own progress INSERT"
  ON public.user_question_progress FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own progress UPDATE"
  ON public.user_question_progress FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 11. USER_ACHIEVEMENTS
-- ============================================================
DROP POLICY IF EXISTS "Users own achievements SELECT" ON public.user_achievements;
DROP POLICY IF EXISTS "Users own achievements INSERT" ON public.user_achievements;
DROP POLICY IF EXISTS "Users own achievements UPDATE" ON public.user_achievements;

CREATE POLICY "Users own achievements SELECT"
  ON public.user_achievements FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own achievements INSERT"
  ON public.user_achievements FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own achievements UPDATE"
  ON public.user_achievements FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 12. USER_CHALLENGE_PROGRESS
-- ============================================================
DROP POLICY IF EXISTS "Users own challenge_progress SELECT" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users own challenge_progress INSERT" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users own challenge_progress UPDATE" ON public.user_challenge_progress;

CREATE POLICY "Users own challenge_progress SELECT"
  ON public.user_challenge_progress FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own challenge_progress INSERT"
  ON public.user_challenge_progress FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own challenge_progress UPDATE"
  ON public.user_challenge_progress FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 13. USER_YEAR_ENTITLEMENTS
-- ============================================================
DROP POLICY IF EXISTS "Users own entitlements SELECT" ON public.user_year_entitlements;

CREATE POLICY "Users own entitlements SELECT"
  ON public.user_year_entitlements FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 14. OSCE_SIMULATIONS
-- ============================================================
DROP POLICY IF EXISTS "Users own simulations SELECT" ON public.osce_simulations;
DROP POLICY IF EXISTS "Users own simulations INSERT" ON public.osce_simulations;
DROP POLICY IF EXISTS "Users own simulations UPDATE" ON public.osce_simulations;

CREATE POLICY "Users own simulations SELECT"
  ON public.osce_simulations FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own simulations INSERT"
  ON public.osce_simulations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users own simulations UPDATE"
  ON public.osce_simulations FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 15. OSCE_STATION_RESULTS (podzapytanie po osce_simulations)
-- ============================================================
DROP POLICY IF EXISTS "Users own station results SELECT" ON public.osce_station_results;
DROP POLICY IF EXISTS "Users own station results INSERT" ON public.osce_station_results;

CREATE POLICY "Users own station results SELECT"
  ON public.osce_station_results FOR SELECT
  USING (
    simulation_id IN (
      SELECT id FROM public.osce_simulations WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users own station results INSERT"
  ON public.osce_station_results FOR INSERT
  WITH CHECK (
    simulation_id IN (
      SELECT id FROM public.osce_simulations WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 16. INDEKSY na FK bez pokrycia (advisor 0001)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_challenges_subject
  ON public.daily_challenges (subject_id);

CREATE INDEX IF NOT EXISTS idx_error_reports_user
  ON public.error_reports (user_id);

CREATE INDEX IF NOT EXISTS idx_error_reports_question
  ON public.error_reports (question_id);

CREATE INDEX IF NOT EXISTS idx_question_discussions_question
  ON public.question_discussions (question_id);

CREATE INDEX IF NOT EXISTS idx_question_discussions_user
  ON public.question_discussions (user_id);

CREATE INDEX IF NOT EXISTS idx_saved_questions_question
  ON public.saved_questions (question_id);

CREATE INDEX IF NOT EXISTS idx_session_answers_question
  ON public.session_answers (question_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user
  ON public.study_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_subject
  ON public.study_sessions (subject_id);

CREATE INDEX IF NOT EXISTS idx_topic_mastery_cache_topic
  ON public.topic_mastery_cache (topic_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement
  ON public.user_achievements (achievement_id);

CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge
  ON public.user_challenge_progress (challenge_id);

CREATE INDEX IF NOT EXISTS idx_user_question_progress_question
  ON public.user_question_progress (question_id);

CREATE INDEX IF NOT EXISTS idx_osce_station_results_subject
  ON public.osce_station_results (subject_id);

-- ============================================================
-- 17. HARDENING: helper RLS nie jest potrzebny dla anon
-- (anon i tak nie korzysta z polityk admin/moderator).
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.is_admin_or_moderator(uuid) FROM anon;
