-- Celowo bez jednej otaczającej transakcji: szybki ALTER questions powinien
-- zwolnić blokadę przed bootstrapem pojęć. Uruchamiać przez psql z
-- ON_ERROR_STOP; wszystkie etapy są idempotentne.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS explanation_blocks jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.questions'::regclass
      AND conname = 'questions_explanation_blocks_chk'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_explanation_blocks_chk
      CHECK (
        explanation_blocks IS NULL
        OR (
          jsonb_typeof(explanation_blocks) = 'object'
          AND (
            NOT (explanation_blocks ? 'takeaway')
            OR jsonb_typeof(explanation_blocks -> 'takeaway') = 'string'
          )
          AND (
            NOT (explanation_blocks ? 'correctReason')
            OR jsonb_typeof(explanation_blocks -> 'correctReason') = 'string'
          )
          AND (
            NOT (explanation_blocks ? 'distractors')
            OR jsonb_typeof(explanation_blocks -> 'distractors') = 'object'
          )
        )
      );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id text REFERENCES public.topics(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.concepts(id) ON DELETE SET NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  source text NOT NULL DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, slug),
  CONSTRAINT concepts_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT concepts_source_chk
    CHECK (source IN ('topic-bootstrap', 'subtheme-bootstrap', 'manual'))
);

CREATE INDEX IF NOT EXISTS concepts_topic
  ON public.concepts (topic_id, is_active);
CREATE INDEX IF NOT EXISTS concepts_parent
  ON public.concepts (parent_id);

CREATE TABLE IF NOT EXISTS public.question_concepts (
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  relation text NOT NULL DEFAULT 'primary',
  weight real NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'manual',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, concept_id),
  CONSTRAINT question_concepts_relation_chk
    CHECK (relation IN ('primary', 'topic', 'prerequisite', 'transfer')),
  CONSTRAINT question_concepts_weight_chk CHECK (weight > 0 AND weight <= 1),
  CONSTRAINT question_concepts_source_chk
    CHECK (source IN ('topic-bootstrap', 'subtheme-bootstrap', 'manual'))
);

CREATE INDEX IF NOT EXISTS question_concepts_concept
  ON public.question_concepts (concept_id, question_id);

CREATE TABLE IF NOT EXISTS public.user_concept_state (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  exposures integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  mastery_score real NOT NULL DEFAULT 0,
  avg_retrievability real NOT NULL DEFAULT 0,
  leech_count integer NOT NULL DEFAULT 0,
  last_seen_at timestamptz,
  next_transfer_due timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, concept_id),
  CONSTRAINT user_concept_mastery_chk CHECK (mastery_score BETWEEN 0 AND 1),
  CONSTRAINT user_concept_retrievability_chk
    CHECK (avg_retrievability BETWEEN 0 AND 1)
);

CREATE INDEX IF NOT EXISTS user_concept_state_weakness
  ON public.user_concept_state (user_id, mastery_score, updated_at DESC);
CREATE INDEX IF NOT EXISTS user_concept_state_transfer
  ON public.user_concept_state (user_id, next_transfer_due)
  WHERE next_transfer_due IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_concept_attempts (
  answer_id uuid NOT NULL REFERENCES public.session_answers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  is_correct boolean NOT NULL,
  retrievability real NOT NULL,
  is_leech boolean NOT NULL,
  attempted_at timestamptz NOT NULL,
  PRIMARY KEY (answer_id, concept_id),
  CONSTRAINT user_concept_attempts_retrievability_chk
    CHECK (retrievability BETWEEN 0 AND 1)
);

CREATE INDEX IF NOT EXISTS user_concept_attempts_user
  ON public.user_concept_attempts (user_id, attempted_at DESC);

ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_concept_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_concept_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS concepts_read ON public.concepts;
CREATE POLICY concepts_read
  ON public.concepts FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS concepts_admin_insert ON public.concepts;
CREATE POLICY concepts_admin_insert
  ON public.concepts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS concepts_admin_update ON public.concepts;
CREATE POLICY concepts_admin_update
  ON public.concepts FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS question_concepts_read ON public.question_concepts;
CREATE POLICY question_concepts_read
  ON public.question_concepts FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS question_concepts_admin_insert
  ON public.question_concepts;
CREATE POLICY question_concepts_admin_insert
  ON public.question_concepts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS question_concepts_admin_delete
  ON public.question_concepts;
CREATE POLICY question_concepts_admin_delete
  ON public.question_concepts FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS user_concept_state_select ON public.user_concept_state;
CREATE POLICY user_concept_state_select
  ON public.user_concept_state FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS user_concept_state_insert ON public.user_concept_state;
DROP POLICY IF EXISTS user_concept_state_update ON public.user_concept_state;

DROP POLICY IF EXISTS user_concept_attempts_select
  ON public.user_concept_attempts;
CREATE POLICY user_concept_attempts_select
  ON public.user_concept_attempts FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Warstwa startowa: każdy temat jest pojęciem nadrzędnym.
INSERT INTO public.concepts (
  subject_id,
  topic_id,
  slug,
  name,
  source
)
SELECT
  t.subject_id,
  t.id,
  'topic:' || t.id,
  t.name,
  'topic-bootstrap'
FROM public.topics t
WHERE COALESCE(t.is_inbox, false) = false
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Istniejące subtheme_label tworzą pojęcia podrzędne; wartości są ograniczone
-- do konkretnego tematu, żeby podobne nazwy z różnych działów się nie sklejały.
INSERT INTO public.concepts (
  subject_id,
  topic_id,
  parent_id,
  slug,
  name,
  source
)
SELECT DISTINCT
  t.subject_id,
  t.id,
  parent.id,
  'subtheme:' || md5(t.id || ':' || lower(trim(q.subtheme_label))),
  trim(q.subtheme_label),
  'subtheme-bootstrap'
FROM public.questions q
JOIN public.topics t ON t.id = q.topic_id
JOIN public.concepts parent
  ON parent.subject_id = t.subject_id
 AND parent.slug = 'topic:' || t.id
WHERE NULLIF(trim(q.subtheme_label), '') IS NOT NULL
  AND COALESCE(t.is_inbox, false) = false
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Relacja topic zapewnia fallback dla każdego pytania.
INSERT INTO public.question_concepts (
  question_id,
  concept_id,
  relation,
  weight,
  source
)
SELECT
  q.id,
  c.id,
  CASE
    WHEN NULLIF(trim(q.subtheme_label), '') IS NULL THEN 'primary'
    ELSE 'topic'
  END,
  CASE
    WHEN NULLIF(trim(q.subtheme_label), '') IS NULL THEN 1
    ELSE 0.35
  END,
  'topic-bootstrap'
FROM public.questions q
JOIN public.topics t ON t.id = q.topic_id
JOIN public.concepts c
  ON c.subject_id = t.subject_id
 AND c.slug = 'topic:' || t.id
ON CONFLICT (question_id, concept_id) DO NOTHING;

INSERT INTO public.question_concepts (
  question_id,
  concept_id,
  relation,
  weight,
  source
)
SELECT
  q.id,
  c.id,
  'primary',
  0.65,
  'subtheme-bootstrap'
FROM public.questions q
JOIN public.topics t ON t.id = q.topic_id
JOIN public.concepts c
  ON c.subject_id = t.subject_id
 AND c.slug = 'subtheme:' || md5(t.id || ':' || lower(trim(q.subtheme_label)))
WHERE NULLIF(trim(q.subtheme_label), '') IS NOT NULL
ON CONFLICT (question_id, concept_id) DO NOTHING;

DROP FUNCTION IF EXISTS public.record_concept_attempt(
  text, boolean, real, boolean, timestamptz
);

CREATE OR REPLACE FUNCTION public.record_concept_attempt(
  p_user_id uuid,
  p_answer_id uuid,
  p_question_id text,
  p_is_correct boolean,
  p_retrievability real,
  p_is_leech boolean,
  p_attempted_at timestamptz
)
RETURNS TABLE (concept_id uuid, mastery_score real, next_transfer_due timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '')
    <> 'service_role'
  THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.session_answers answer
    JOIN public.study_sessions session ON session.id = answer.session_id
    WHERE answer.id = p_answer_id
      AND answer.question_id = p_question_id
      AND session.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Answer does not belong to user and question';
  END IF;

  RETURN QUERY
  WITH inserted_attempts AS (
    INSERT INTO public.user_concept_attempts (
      answer_id,
      user_id,
      concept_id,
      is_correct,
      retrievability,
      is_leech,
      attempted_at
    )
    SELECT
      p_answer_id,
      p_user_id,
      qc.concept_id,
      p_is_correct,
      LEAST(1, GREATEST(0, COALESCE(p_retrievability, 0)))::real,
      p_is_leech,
      p_attempted_at
    FROM public.question_concepts qc
    WHERE qc.question_id = p_question_id
    ON CONFLICT ON CONSTRAINT user_concept_attempts_pkey DO NOTHING
    RETURNING user_concept_attempts.concept_id
  ),
  updated_states AS (
    INSERT INTO public.user_concept_state AS state (
      user_id,
      concept_id,
      exposures,
      correct_answers,
      mastery_score,
      avg_retrievability,
      leech_count,
      last_seen_at,
      next_transfer_due,
      updated_at
    )
    SELECT
      p_user_id,
      attempt.concept_id,
      1,
      CASE WHEN p_is_correct THEN 1 ELSE 0 END,
      (
        (CASE WHEN p_is_correct THEN 0.7 ELSE 0.15 END) * 0.7
        + LEAST(1, GREATEST(0, COALESCE(p_retrievability, 0))) * 0.3
      )::real,
      LEAST(1, GREATEST(0, COALESCE(p_retrievability, 0)))::real,
      CASE WHEN p_is_leech THEN 1 ELSE 0 END,
      p_attempted_at,
      CASE
        WHEN NOT p_is_correct OR p_is_leech
          THEN p_attempted_at + interval '10 minutes'
        ELSE p_attempted_at + interval '7 days'
      END,
      p_attempted_at
    FROM inserted_attempts attempt
    ON CONFLICT ON CONSTRAINT user_concept_state_pkey DO UPDATE
    SET
      exposures = state.exposures + 1,
      correct_answers = state.correct_answers
        + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
      mastery_score = LEAST(
        1,
        GREATEST(
          0,
          state.mastery_score * 0.8
            + (
                (CASE WHEN p_is_correct THEN 0.7 ELSE 0.15 END) * 0.7
                + LEAST(
                    1,
                    GREATEST(0, COALESCE(p_retrievability, 0))
                  ) * 0.3
              ) * 0.2
        )
      )::real,
      avg_retrievability = (
        state.avg_retrievability * 0.8
        + LEAST(1, GREATEST(0, COALESCE(p_retrievability, 0))) * 0.2
      )::real,
      leech_count =
        state.leech_count + CASE WHEN p_is_leech THEN 1 ELSE 0 END,
      last_seen_at = p_attempted_at,
      next_transfer_due = CASE
        WHEN NOT p_is_correct OR p_is_leech
          THEN p_attempted_at + interval '10 minutes'
        ELSE p_attempted_at + interval '7 days'
      END,
      updated_at = p_attempted_at
    RETURNING state.concept_id, state.mastery_score, state.next_transfer_due
  )
  SELECT
    updated_states.concept_id,
    updated_states.mastery_score,
    updated_states.next_transfer_due
  FROM updated_states;
END;
$$;

REVOKE ALL ON FUNCTION public.record_concept_attempt(
  uuid, uuid, text, boolean, real, boolean, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_concept_attempt(
  uuid, uuid, text, boolean, real, boolean, timestamptz
) TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_learning_answer(
  p_user_id uuid,
  p_answer_id uuid,
  p_question_id text,
  p_retrievability real,
  p_scheduler_version text,
  p_event_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answer record;
  v_progress public.user_question_progress%ROWTYPE;
  v_correct_streak integer;
  v_wrong_streak integer;
  v_was_leech boolean;
  v_is_leech boolean;
  v_leech_count integer;
  v_avg_time real;
  v_concept_states jsonb;
  v_result jsonb;
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '')
    <> 'service_role'
  THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT
    answer.is_correct,
    answer.confidence,
    answer.time_spent_seconds,
    answer.answered_at,
    answer.is_first_exposure,
    answer.processing_completed_at,
    answer.processing_result,
    session.id AS session_id,
    session.user_id,
    session.subject_id,
    session.session_kind,
    question.topic_id
  INTO v_answer
  FROM public.session_answers answer
  JOIN public.study_sessions session ON session.id = answer.session_id
  JOIN public.questions question ON question.id = answer.question_id
  WHERE answer.id = p_answer_id
    AND answer.question_id = p_question_id
    AND session.user_id = p_user_id
  FOR UPDATE OF answer;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Answer does not belong to user and question';
  END IF;
  IF v_answer.processing_completed_at IS NOT NULL THEN
    RETURN COALESCE(v_answer.processing_result, '{}'::jsonb);
  END IF;

  SELECT *
  INTO v_progress
  FROM public.user_question_progress progress
  WHERE progress.user_id = p_user_id
    AND progress.question_id = p_question_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Missing progress row for finalized answer';
  END IF;

  v_correct_streak := CASE
    WHEN v_answer.is_correct THEN COALESCE(v_progress.correct_streak, 0) + 1
    ELSE 0
  END;
  v_wrong_streak := CASE
    WHEN v_answer.is_correct THEN 0
    ELSE COALESCE(v_progress.wrong_streak, 0) + 1
  END;
  v_was_leech := COALESCE(v_progress.is_leech, false);
  v_is_leech := CASE
    WHEN NOT v_was_leech AND v_wrong_streak >= 3 THEN true
    WHEN v_was_leech AND v_correct_streak >= 2 THEN false
    ELSE v_was_leech
  END;
  v_leech_count := COALESCE(v_progress.leech_count, 0)
    + CASE WHEN NOT v_was_leech AND v_is_leech THEN 1 ELSE 0 END;
  v_avg_time := CASE
    WHEN v_answer.time_spent_seconds IS NULL THEN v_progress.avg_time_seconds
    WHEN v_progress.avg_time_seconds IS NULL
      THEN v_answer.time_spent_seconds::real
    ELSE (
      v_progress.avg_time_seconds * 0.7
      + v_answer.time_spent_seconds * 0.3
    )::real
  END;

  UPDATE public.user_question_progress
  SET
    correct_streak = v_correct_streak,
    wrong_streak = v_wrong_streak,
    is_leech = v_is_leech,
    leech_count = v_leech_count,
    last_rating = p_event_payload->>'fsrs_rating_label',
    avg_time_seconds = v_avg_time
  WHERE id = v_progress.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'concept_id', state.concept_id,
        'mastery_score', state.mastery_score,
        'next_transfer_due', state.next_transfer_due
      )
    ),
    '[]'::jsonb
  )
  INTO v_concept_states
  FROM public.record_concept_attempt(
    p_user_id,
    p_answer_id,
    p_question_id,
    v_answer.is_correct,
    p_retrievability,
    v_is_leech,
    v_answer.answered_at
  ) state;

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
    is_first_exposure,
    scheduler_version,
    fsrs_applied,
    fsrs_rating,
    payload
  )
  VALUES (
    p_user_id,
    'answer',
    2,
    v_answer.session_id,
    p_answer_id,
    p_question_id,
    v_answer.subject_id,
    v_answer.topic_id,
    v_answer.session_kind,
    v_answer.is_first_exposure,
    p_scheduler_version,
    true,
    (p_event_payload->>'fsrs_rating')::smallint,
    COALESCE(p_event_payload, '{}'::jsonb)
      || jsonb_build_object('concept_states', v_concept_states)
  );

  IF NOT v_was_leech AND v_is_leech THEN
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
      is_first_exposure,
      scheduler_version,
      fsrs_applied,
      fsrs_rating,
      payload
    )
    VALUES (
      p_user_id,
      'leech_hit',
      2,
      v_answer.session_id,
      p_answer_id,
      p_question_id,
      v_answer.subject_id,
      v_answer.topic_id,
      v_answer.session_kind,
      v_answer.is_first_exposure,
      p_scheduler_version,
      true,
      (p_event_payload->>'fsrs_rating')::smallint,
      jsonb_build_object(
        'question_id', p_question_id,
        'session_id', v_answer.session_id,
        'subject_id', v_answer.subject_id,
        'topic_id', v_answer.topic_id,
        'wrong_streak', v_wrong_streak
      )
    );
  END IF;

  v_result := jsonb_build_object(
    'wasLeech', v_was_leech,
    'isLeech', v_is_leech,
    'leechCount', v_leech_count,
    'correctStreak', v_correct_streak,
    'wrongStreak', v_wrong_streak,
    'conceptStates', v_concept_states
  );
  UPDATE public.session_answers
  SET
    processing_completed_at = now(),
    processing_result = v_result
  WHERE id = p_answer_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_learning_answer(
  uuid, uuid, text, real, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_learning_answer(
  uuid, uuid, text, real, text, jsonb
) TO service_role;

-- Rozszerzenie bezpiecznego resetu o obie odbudowywalne projekcje.
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

  DELETE FROM public.user_question_memory_v2 memory
  USING public.questions q, public.topics t
  WHERE memory.user_id = p_user_id
    AND memory.question_id = q.id
    AND q.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM public.topic_mastery_cache tmc
  USING public.topics t
  WHERE tmc.user_id = p_user_id
    AND tmc.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM public.user_concept_state state
  USING public.concepts concept
  WHERE state.user_id = p_user_id
    AND state.concept_id = concept.id
    AND concept.subject_id = p_subject_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_subject_progress_for_user(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_subject_progress_for_user(uuid, text)
  TO service_role;

