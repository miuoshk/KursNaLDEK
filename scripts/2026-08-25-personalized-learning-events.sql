-- Celowo bez jednej otaczającej transakcji: ALTER na tabelach odpowiedzi
-- musi zwolnić blokadę przed backfillem i definicjami funkcji. Plik jest
-- idempotentny i powinien być uruchamiany przez psql z ON_ERROR_STOP.

-- PostgREST nie ustawia już request.jwt.claim.role; service_role JWT
-- ląduje w request.jwt.claims. Stary warunek wyrzucał Forbidden na produkcji.
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    OR COALESCE(
      NULLIF(current_setting('request.jwt.claims', true), ''),
      '{}'
    )::jsonb ->> 'role' = 'service_role'
    OR auth.role() = 'service_role';
$$;
REVOKE ALL ON FUNCTION public.is_service_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO service_role;

-- Kanoniczne nazwy kolumn topic_mastery_cache. Produkcja używa już nazw
-- *_questions / *_answers; poniższy blok pozwala uruchomić migrację także na
-- środowiskach odtworzonych ze starszego supabase-schema.sql.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_mastery_cache'
      AND column_name = 'seen'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_mastery_cache'
      AND column_name = 'seen_questions'
  ) THEN
    ALTER TABLE public.topic_mastery_cache RENAME COLUMN seen TO seen_questions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_mastery_cache'
      AND column_name = 'coverage'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_mastery_cache'
      AND column_name = 'coverage_ratio'
  ) THEN
    ALTER TABLE public.topic_mastery_cache RENAME COLUMN coverage TO coverage_ratio;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_mastery_cache'
      AND column_name = 'total_answered'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_mastery_cache'
      AND column_name = 'total_answers'
  ) THEN
    ALTER TABLE public.topic_mastery_cache RENAME COLUMN total_answered TO total_answers;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_mastery_cache'
      AND column_name = 'total_correct'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_mastery_cache'
      AND column_name = 'correct_answers'
  ) THEN
    ALTER TABLE public.topic_mastery_cache RENAME COLUMN total_correct TO correct_answers;
  END IF;
END
$$;

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS session_kind text NOT NULL DEFAULT 'intelligent',
  ADD COLUMN IF NOT EXISTS scheduler_version text NOT NULL DEFAULT 'legacy-v1',
  ADD COLUMN IF NOT EXISTS engine_variant text NOT NULL DEFAULT 'control',
  ADD COLUMN IF NOT EXISTS plan_snapshot jsonb;

UPDATE public.study_sessions
SET session_kind = CASE mode
  WHEN 'nauka' THEN 'intelligent'
  WHEN 'egzamin' THEN 'classic'
  WHEN 'osce_topic' THEN 'osce'
  ELSE 'intelligent'
END
WHERE session_kind = 'intelligent';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.study_sessions'::regclass
      AND conname = 'study_sessions_session_kind_chk'
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_session_kind_chk
      CHECK (session_kind IN ('intelligent', 'classic', 'exam', 'catalog', 'osce'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.study_sessions'::regclass
      AND conname = 'study_sessions_engine_variant_chk'
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_engine_variant_chk
      CHECK (engine_variant IN ('control', 'shadow', 'treatment'));
  END IF;
END
$$;

ALTER TABLE public.session_answers
  ADD COLUMN IF NOT EXISTS rating_source text,
  ADD COLUMN IF NOT EXISTS fsrs_applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduler_version text,
  ADD COLUMN IF NOT EXISTS fsrs_rating smallint,
  ADD COLUMN IF NOT EXISTS state_before text,
  ADD COLUMN IF NOT EXISTS state_after text,
  ADD COLUMN IF NOT EXISTS retrievability_before real,
  ADD COLUMN IF NOT EXISTS retrievability_after real,
  ADD COLUMN IF NOT EXISTS stability_before real,
  ADD COLUMN IF NOT EXISTS stability_after real,
  ADD COLUMN IF NOT EXISTS difficulty_before real,
  ADD COLUMN IF NOT EXISTS difficulty_after real,
  ADD COLUMN IF NOT EXISTS fsrs_snapshot_before jsonb,
  ADD COLUMN IF NOT EXISTS fsrs_snapshot_after jsonb,
  ADD COLUMN IF NOT EXISTS processing_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_result jsonb,
  ADD COLUMN IF NOT EXISTS memory_fallback boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS due_before timestamptz,
  ADD COLUMN IF NOT EXISTS due_after timestamptz,
  ADD COLUMN IF NOT EXISTS feedback_variant text,
  ADD COLUMN IF NOT EXISTS feedback_dwell_seconds real;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.session_answers'::regclass
      AND conname = 'session_answers_rating_source_chk'
  ) THEN
    ALTER TABLE public.session_answers
      ADD CONSTRAINT session_answers_rating_source_chk
      CHECK (rating_source IS NULL OR rating_source IN ('explicit', 'observed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.session_answers'::regclass
      AND conname = 'session_answers_fsrs_rating_chk'
  ) THEN
    ALTER TABLE public.session_answers
      ADD CONSTRAINT session_answers_fsrs_rating_chk
      CHECK (fsrs_rating IS NULL OR fsrs_rating BETWEEN 1 AND 4);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.session_answers'::regclass
      AND conname = 'session_answers_feedback_variant_chk'
  ) THEN
    ALTER TABLE public.session_answers
      ADD CONSTRAINT session_answers_feedback_variant_chk
      CHECK (
        feedback_variant IS NULL
        OR feedback_variant IN ('concise', 'standard', 'remedial')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.session_answers'::regclass
      AND conname = 'session_answers_feedback_dwell_chk'
  ) THEN
    ALTER TABLE public.session_answers
      ADD CONSTRAINT session_answers_feedback_dwell_chk
      CHECK (feedback_dwell_seconds IS NULL OR feedback_dwell_seconds >= 0);
  END IF;
END
$$;

ALTER TABLE public.learning_events
  ADD COLUMN IF NOT EXISTS event_schema_version smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS answer_id uuid,
  ADD COLUMN IF NOT EXISTS question_id text,
  ADD COLUMN IF NOT EXISTS subject_id text,
  ADD COLUMN IF NOT EXISTS topic_id text,
  ADD COLUMN IF NOT EXISTS session_kind text,
  ADD COLUMN IF NOT EXISTS is_first_exposure boolean,
  ADD COLUMN IF NOT EXISTS scheduler_version text,
  ADD COLUMN IF NOT EXISTS fsrs_applied boolean,
  ADD COLUMN IF NOT EXISTS fsrs_rating smallint;

-- Dziennik prób i jego projekcje są autorytatywne. Klient może je czytać,
-- ale zapis wykonują wyłącznie zweryfikowane akcje serwerowe przez service role.
DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'study_sessions',
        'session_answers',
        'user_question_progress',
        'learning_events',
        'topic_mastery_cache'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END
$$;

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY study_sessions_own_select
  ON public.study_sessions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY session_answers_own_select
  ON public.session_answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_sessions session
      WHERE session.id = session_answers.session_id
        AND session.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY user_question_progress_own_select
  ON public.user_question_progress
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY learning_events_own_select
  ON public.learning_events
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY topic_mastery_cache_own_select
  ON public.topic_mastery_cache
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.learning_events'::regclass
      AND conname = 'learning_events_session_fk'
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT learning_events_session_fk
      FOREIGN KEY (session_id) REFERENCES public.study_sessions(id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.learning_events'::regclass
      AND conname = 'learning_events_question_fk'
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT learning_events_question_fk
      FOREIGN KEY (question_id) REFERENCES public.questions(id)
      ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.learning_events'::regclass
      AND conname = 'learning_events_answer_fk'
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT learning_events_answer_fk
      FOREIGN KEY (answer_id) REFERENCES public.session_answers(id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.learning_events'::regclass
      AND conname = 'learning_events_subject_fk'
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT learning_events_subject_fk
      FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
      ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.learning_events'::regclass
      AND conname = 'learning_events_topic_fk'
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT learning_events_topic_fk
      FOREIGN KEY (topic_id) REFERENCES public.topics(id)
      ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.learning_events'::regclass
      AND conname = 'learning_events_fsrs_rating_chk'
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT learning_events_fsrs_rating_chk
      CHECK (fsrs_rating IS NULL OR fsrs_rating BETWEEN 1 AND 4);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_topic_mastery_weakness
  ON public.topic_mastery_cache (user_id, weakness_rank)
  WHERE weakness_rank IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_feedback_consumption(
  p_user_id uuid,
  p_session_id uuid,
  p_question_id text,
  p_variant text,
  p_dwell_seconds real
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answer record;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_variant NOT IN ('concise', 'standard', 'remedial')
    OR p_dwell_seconds < 0
    OR p_dwell_seconds > 3600
  THEN
    RAISE EXCEPTION 'Invalid feedback telemetry';
  END IF;

  SELECT
    answer.id,
    answer.feedback_dwell_seconds,
    session.subject_id,
    session.session_kind,
    question.topic_id
  INTO v_answer
  FROM public.session_answers answer
  JOIN public.study_sessions session ON session.id = answer.session_id
  JOIN public.questions question ON question.id = answer.question_id
  WHERE answer.session_id = p_session_id
    AND answer.question_id = p_question_id
    AND session.user_id = p_user_id
  FOR UPDATE OF answer;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Answer does not belong to user and session';
  END IF;
  IF v_answer.feedback_dwell_seconds IS NOT NULL THEN
    RETURN 'already_applied';
  END IF;

  UPDATE public.session_answers
  SET
    feedback_variant = p_variant,
    feedback_dwell_seconds = p_dwell_seconds
  WHERE id = v_answer.id;

  INSERT INTO public.learning_events (
    user_id,
    event_type,
    event_schema_version,
    session_id,
    answer_id,
    question_id,
    subject_id,
    topic_id,
    session_kind,
    payload
  )
  VALUES (
    p_user_id,
    'feedback_consumed',
    2,
    p_session_id,
    v_answer.id,
    p_question_id,
    v_answer.subject_id,
    v_answer.topic_id,
    v_answer.session_kind,
    jsonb_build_object(
      'event_schema_version', 2,
      'feedback_variant', p_variant,
      'feedback_dwell_seconds', p_dwell_seconds
    )
  );

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.record_feedback_consumption(
  uuid, uuid, text, text, real
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_feedback_consumption(
  uuid, uuid, text, text, real
) TO service_role;

COMMENT ON TABLE public.session_answers IS
  'Niezmienny dziennik pierwszej próby odpowiedzi na pytanie w danej sesji.';
COMMENT ON COLUMN public.session_answers.rating_source IS
  'explicit = samoocena użytkownika; observed = konserwatywna ocena z poprawności.';
COMMENT ON COLUMN public.study_sessions.plan_snapshot IS
  'Niezmienny plan wejściowy sesji: budżet czasu i kwoty due/new/remediation.';

-- Reset usuwa telemetrykę także wtedy, gdy historyczny payload nie zawierał
-- subject_id. Najpierw czyścimy zdarzenia po relacji z pytaniem, dopiero potem
-- sesje (nowe zdarzenia z session_id usuną się również przez ON DELETE CASCADE).
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
  IF p_user_id IS NULL
    OR p_subject_id IS NULL
    OR length(trim(p_subject_id)) = 0
  THEN
    RAISE EXCEPTION 'Nieprawidłowe parametry resetu postępu.';
  END IF;

  DELETE FROM public.learning_events le
  USING public.questions q, public.topics t
  WHERE le.user_id = p_user_id
    AND le.question_id = q.id
    AND q.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM public.learning_events le
  WHERE le.user_id = p_user_id
    AND (
      le.subject_id = p_subject_id
      OR le.payload ->> 'subjectId' = p_subject_id
      OR le.payload ->> 'subject_id' = p_subject_id
    );

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
END;
$$;

REVOKE ALL ON FUNCTION public.reset_subject_progress_for_user(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_subject_progress_for_user(uuid, text)
  TO service_role;

