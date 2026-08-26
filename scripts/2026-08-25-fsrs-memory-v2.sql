BEGIN;

CREATE TABLE IF NOT EXISTS public.fsrs_parameter_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduler_version text NOT NULL,
  scope text NOT NULL,
  product text,
  track text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  weights jsonb NOT NULL,
  request_retention real NOT NULL DEFAULT 0.9,
  maximum_interval integer NOT NULL DEFAULT 3650,
  sample_size integer NOT NULL DEFAULT 0,
  log_loss real,
  rmse_bins real,
  optimized_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fsrs_parameter_sets_scope_chk
    CHECK (scope IN ('global', 'cohort', 'user')),
  CONSTRAINT fsrs_parameter_sets_weights_chk
    CHECK (jsonb_typeof(weights) = 'array' AND jsonb_array_length(weights) = 21),
  CONSTRAINT fsrs_parameter_sets_retention_chk
    CHECK (request_retention BETWEEN 0.7 AND 0.99),
  CONSTRAINT fsrs_parameter_sets_interval_chk
    CHECK (maximum_interval BETWEEN 1 AND 36500),
  CONSTRAINT fsrs_parameter_sets_scope_shape_chk
    CHECK (
      (scope = 'global' AND product IS NULL AND track IS NULL AND user_id IS NULL)
      OR (scope = 'cohort' AND product IS NOT NULL AND user_id IS NULL)
      OR (scope = 'user' AND user_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS fsrs_params_one_active_global
  ON public.fsrs_parameter_sets (scheduler_version)
  WHERE active AND scope = 'global';
CREATE UNIQUE INDEX IF NOT EXISTS fsrs_params_one_active_cohort
  ON public.fsrs_parameter_sets (
    scheduler_version,
    product,
    COALESCE(track, '')
  )
  WHERE active AND scope = 'cohort';
CREATE UNIQUE INDEX IF NOT EXISTS fsrs_params_one_active_user
  ON public.fsrs_parameter_sets (scheduler_version, user_id)
  WHERE active AND scope = 'user';
CREATE INDEX IF NOT EXISTS fsrs_params_lookup
  ON public.fsrs_parameter_sets (
    scheduler_version,
    scope,
    active,
    product,
    track,
    user_id
  );

ALTER TABLE public.user_question_progress
  ADD COLUMN IF NOT EXISTS learning_steps integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.user_question_memory_v2 (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  scheduler_version text NOT NULL,
  parameter_set_id uuid REFERENCES public.fsrs_parameter_sets(id) ON DELETE SET NULL,
  state text NOT NULL DEFAULT 'new',
  stability real NOT NULL DEFAULT 0,
  difficulty real NOT NULL DEFAULT 0.3,
  elapsed_days integer NOT NULL DEFAULT 0,
  scheduled_days integer NOT NULL DEFAULT 0,
  learning_steps integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  next_review timestamptz,
  last_answered_at timestamptz,
  last_rating smallint,
  source text NOT NULL DEFAULT 'live',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id, scheduler_version),
  CONSTRAINT user_question_memory_v2_state_chk
    CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  CONSTRAINT user_question_memory_v2_rating_chk
    CHECK (last_rating IS NULL OR last_rating BETWEEN 1 AND 4),
  CONSTRAINT user_question_memory_v2_source_chk
    CHECK (source IN ('live', 'replay', 'seed-v1'))
);

CREATE INDEX IF NOT EXISTS user_question_memory_v2_due
  ON public.user_question_memory_v2 (user_id, scheduler_version, next_review)
  WHERE state <> 'new';
CREATE INDEX IF NOT EXISTS user_question_memory_v2_question
  ON public.user_question_memory_v2 (question_id);

CREATE TABLE IF NOT EXISTS public.session_answer_memory_projections (
  answer_id uuid NOT NULL REFERENCES public.session_answers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  scheduler_version text NOT NULL,
  parameter_set_id uuid REFERENCES public.fsrs_parameter_sets(id) ON DELETE SET NULL,
  model_role text NOT NULL DEFAULT 'shadow',
  fsrs_rating smallint NOT NULL,
  state_before text NOT NULL,
  state_after text NOT NULL,
  retrievability_before real NOT NULL,
  retrievability_after real NOT NULL,
  stability_before real NOT NULL,
  stability_after real NOT NULL,
  difficulty_before real NOT NULL,
  difficulty_after real NOT NULL,
  learning_steps_before integer NOT NULL DEFAULT 0,
  learning_steps_after integer NOT NULL DEFAULT 0,
  snapshot_before jsonb,
  snapshot_after jsonb,
  due_before timestamptz,
  due_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (answer_id, scheduler_version),
  CONSTRAINT session_answer_memory_role_chk
    CHECK (model_role IN ('control', 'shadow', 'treatment')),
  CONSTRAINT session_answer_memory_rating_chk
    CHECK (fsrs_rating BETWEEN 1 AND 4),
  CONSTRAINT session_answer_memory_retrievability_chk
    CHECK (
      retrievability_before BETWEEN 0 AND 1
      AND retrievability_after BETWEEN 0 AND 1
    )
);

ALTER TABLE public.session_answer_memory_projections
  ADD COLUMN IF NOT EXISTS snapshot_before jsonb,
  ADD COLUMN IF NOT EXISTS snapshot_after jsonb;

CREATE INDEX IF NOT EXISTS session_answer_memory_eval
  ON public.session_answer_memory_projections (
    scheduler_version,
    model_role,
    created_at DESC
  );
CREATE INDEX IF NOT EXISTS session_answer_memory_user
  ON public.session_answer_memory_projections (user_id, created_at DESC);

ALTER TABLE public.fsrs_parameter_sets
  DROP CONSTRAINT IF EXISTS fsrs_parameter_sets_weights_chk,
  ADD CONSTRAINT fsrs_parameter_sets_weights_chk
    CHECK (
      jsonb_typeof(weights) = 'array'
      AND jsonb_array_length(weights) = 21
    );
ALTER TABLE public.user_question_progress
  DROP CONSTRAINT IF EXISTS user_question_progress_learning_steps_chk,
  ADD CONSTRAINT user_question_progress_learning_steps_chk
    CHECK (learning_steps >= 0);
ALTER TABLE public.user_question_memory_v2
  DROP CONSTRAINT IF EXISTS user_question_memory_v2_learning_steps_chk,
  ADD CONSTRAINT user_question_memory_v2_learning_steps_chk
    CHECK (learning_steps >= 0);
ALTER TABLE public.user_question_memory_v2
  DROP CONSTRAINT IF EXISTS user_question_memory_v2_numeric_state_chk,
  ADD CONSTRAINT user_question_memory_v2_numeric_state_chk
    CHECK (
      stability >= 0
      AND difficulty BETWEEN 0 AND 10
      AND elapsed_days >= 0
      AND scheduled_days >= 0
      AND reps >= 0
      AND lapses >= 0
    );

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS memory_parameter_set_id uuid
    REFERENCES public.fsrs_parameter_sets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_retention real,
  ADD COLUMN IF NOT EXISTS maximum_interval integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.study_sessions'::regclass
      AND conname = 'study_sessions_target_retention_chk'
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_target_retention_chk
      CHECK (target_retention IS NULL OR target_retention BETWEEN 0.7 AND 0.99);
  END IF;
END
$$;

ALTER TABLE public.fsrs_parameter_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_memory_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answer_memory_projections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fsrs_parameter_sets_select ON public.fsrs_parameter_sets;
CREATE POLICY fsrs_parameter_sets_select
  ON public.fsrs_parameter_sets FOR SELECT TO authenticated
  USING (
    scope <> 'user' OR user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS user_question_memory_v2_select
  ON public.user_question_memory_v2;
CREATE POLICY user_question_memory_v2_select
  ON public.user_question_memory_v2 FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS user_question_memory_v2_insert
  ON public.user_question_memory_v2;
DROP POLICY IF EXISTS user_question_memory_v2_update
  ON public.user_question_memory_v2;

DROP POLICY IF EXISTS session_answer_memory_select
  ON public.session_answer_memory_projections;
CREATE POLICY session_answer_memory_select
  ON public.session_answer_memory_projections FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS session_answer_memory_insert
  ON public.session_answer_memory_projections;

CREATE OR REPLACE FUNCTION public.due_review_count_v2(
  p_user_id uuid,
  p_topic_ids text[],
  p_track text
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_question_memory_v2 memory
  JOIN public.questions question ON question.id = memory.question_id
  WHERE memory.user_id = p_user_id
    AND memory.scheduler_version = 'memory-v2/ts-fsrs-5.4.1'
    AND memory.state <> 'new'
    AND memory.next_review <= now()
    AND question.topic_id = ANY(p_topic_ids)
    AND question.is_active = true
    AND (question.tracks IS NULL OR question.tracks @> ARRAY[p_track]);
$$;

CREATE OR REPLACE FUNCTION public.topic_memory_v2_due(
  p_user_id uuid,
  p_topic_ids text[],
  p_track text
)
RETURNS TABLE(topic_id text, due integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    question.topic_id,
    COUNT(*)::integer AS due
  FROM public.user_question_memory_v2 memory
  JOIN public.questions question ON question.id = memory.question_id
  WHERE memory.user_id = p_user_id
    AND memory.scheduler_version = 'memory-v2/ts-fsrs-5.4.1'
    AND memory.state <> 'new'
    AND memory.next_review <= now()
    AND question.topic_id = ANY(p_topic_ids)
    AND question.is_active = true
    AND (question.tracks IS NULL OR question.tracks @> ARRAY[p_track])
  GROUP BY question.topic_id;
$$;

REVOKE ALL ON FUNCTION public.due_review_count_v2(uuid, text[], text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.due_review_count_v2(uuid, text[], text)
  TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.topic_memory_v2_due(uuid, text[], text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.topic_memory_v2_due(uuid, text[], text)
  TO authenticated, service_role;

COMMENT ON TABLE public.user_question_memory_v2 IS
  'Wersjonowana projekcja karty FSRS. Odbudowywalna z session_answers.';
COMMENT ON TABLE public.session_answer_memory_projections IS
  'Predykcje modeli control/shadow/treatment dla jednej niezmiennej próby.';

CREATE OR REPLACE FUNCTION public.activate_fsrs_parameter_set(
  p_scheduler_version text,
  p_scope text,
  p_product text,
  p_track text,
  p_user_id uuid,
  p_weights jsonb,
  p_request_retention real,
  p_maximum_interval integer,
  p_sample_size integer,
  p_log_loss real,
  p_rmse_bins real,
  p_optimized_at timestamptz,
  p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_scheduler_version <> 'memory-v2/ts-fsrs-5.4.1'
    OR jsonb_typeof(p_weights) <> 'array'
    OR jsonb_array_length(p_weights) <> 21
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_weights) weight
      WHERE jsonb_typeof(weight) <> 'number'
    )
  THEN
    RAISE EXCEPTION 'Invalid memory v2 parameter set';
  END IF;
  IF (p_scope = 'global' AND p_sample_size < 10000)
    OR (p_scope = 'cohort' AND p_sample_size < 5000)
    OR (p_scope = 'user' AND p_sample_size < 300)
  THEN
    RAISE EXCEPTION 'Insufficient parameter sample size';
  END IF;
  IF to_regclass('public.learning_experiment_configs') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.learning_experiment_configs
      WHERE experiment_key = 'memory-v2-rollout'
        AND rollout_percent > 0
    )
  THEN
    RAISE EXCEPTION 'Rollback memory-v2 to 0%% before activating parameters';
  END IF;

  UPDATE public.fsrs_parameter_sets
  SET active = false
  WHERE scheduler_version = p_scheduler_version
    AND scope = p_scope
    AND product IS NOT DISTINCT FROM p_product
    AND track IS NOT DISTINCT FROM p_track
    AND user_id IS NOT DISTINCT FROM p_user_id
    AND active = true;

  INSERT INTO public.fsrs_parameter_sets (
    scheduler_version,
    scope,
    product,
    track,
    user_id,
    weights,
    request_retention,
    maximum_interval,
    sample_size,
    log_loss,
    rmse_bins,
    optimized_at,
    active,
    metadata
  )
  VALUES (
    p_scheduler_version,
    p_scope,
    p_product,
    p_track,
    p_user_id,
    p_weights,
    p_request_retention,
    p_maximum_interval,
    p_sample_size,
    p_log_loss,
    p_rmse_bins,
    p_optimized_at,
    true,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_fsrs_parameter_set(
  text, text, text, text, uuid, jsonb, real, integer, integer, real, real,
  timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_fsrs_parameter_set(
  text, text, text, text, uuid, jsonb, real, integer, integer, real, real,
  timestamptz, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_memory_v2_review(
  p_answer_id uuid,
  p_user_id uuid,
  p_question_id text,
  p_scheduler_version text,
  p_parameter_set_id uuid,
  p_model_role text,
  p_expected_exists boolean,
  p_expected_last_answered_at timestamptz,
  p_expected_reps integer,
  p_progress jsonb,
  p_projection jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_memory public.user_question_memory_v2%ROWTYPE;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_scheduler_version <> 'memory-v2/ts-fsrs-5.4.1'
    OR p_model_role NOT IN ('shadow', 'treatment')
  THEN
    RAISE EXCEPTION 'Invalid memory v2 model';
  END IF;

  PERFORM 1
  FROM public.session_answers answer
  JOIN public.study_sessions session ON session.id = answer.session_id
  WHERE answer.id = p_answer_id
    AND answer.question_id = p_question_id
    AND session.user_id = p_user_id
  FOR UPDATE OF answer;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Answer does not belong to user and question';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.session_answer_memory_projections projection
    WHERE projection.answer_id = p_answer_id
      AND projection.scheduler_version = p_scheduler_version
  ) THEN
    RETURN 'already_applied';
  END IF;

  SELECT *
  INTO v_memory
  FROM public.user_question_memory_v2 memory
  WHERE memory.user_id = p_user_id
    AND memory.question_id = p_question_id
    AND memory.scheduler_version = p_scheduler_version
  FOR UPDATE;

  IF p_expected_exists THEN
    IF NOT FOUND
      OR v_memory.last_answered_at IS DISTINCT FROM p_expected_last_answered_at
      OR v_memory.reps <> p_expected_reps
    THEN
      RETURN 'conflict';
    END IF;

    UPDATE public.user_question_memory_v2
    SET
      parameter_set_id = p_parameter_set_id,
      state = p_progress->>'state',
      stability = (p_progress->>'stability')::real,
      difficulty = (p_progress->>'difficulty')::real,
      elapsed_days = (p_progress->>'elapsed_days')::integer,
      scheduled_days = (p_progress->>'scheduled_days')::integer,
      learning_steps = (p_progress->>'learning_steps')::integer,
      reps = (p_progress->>'reps')::integer,
      lapses = (p_progress->>'lapses')::integer,
      next_review = (p_progress->>'next_review')::timestamptz,
      last_answered_at = (p_progress->>'last_answered_at')::timestamptz,
      last_rating = (p_projection->>'fsrs_rating')::smallint,
      source = p_progress->>'source',
      updated_at = (p_progress->>'updated_at')::timestamptz
    WHERE user_id = p_user_id
      AND question_id = p_question_id
      AND scheduler_version = p_scheduler_version;
  ELSE
    IF FOUND THEN
      RETURN 'conflict';
    END IF;

    BEGIN
      INSERT INTO public.user_question_memory_v2 (
        user_id,
        question_id,
        scheduler_version,
        parameter_set_id,
        state,
        stability,
        difficulty,
        elapsed_days,
        scheduled_days,
        learning_steps,
        reps,
        lapses,
        next_review,
        last_answered_at,
        last_rating,
        source,
        updated_at
      )
      VALUES (
        p_user_id,
        p_question_id,
        p_scheduler_version,
        p_parameter_set_id,
        p_progress->>'state',
        (p_progress->>'stability')::real,
        (p_progress->>'difficulty')::real,
        (p_progress->>'elapsed_days')::integer,
        (p_progress->>'scheduled_days')::integer,
        (p_progress->>'learning_steps')::integer,
        (p_progress->>'reps')::integer,
        (p_progress->>'lapses')::integer,
        (p_progress->>'next_review')::timestamptz,
        (p_progress->>'last_answered_at')::timestamptz,
        (p_projection->>'fsrs_rating')::smallint,
        p_progress->>'source',
        (p_progress->>'updated_at')::timestamptz
      );
    EXCEPTION WHEN unique_violation THEN
      RETURN 'conflict';
    END;
  END IF;

  INSERT INTO public.session_answer_memory_projections (
    answer_id,
    user_id,
    question_id,
    scheduler_version,
    parameter_set_id,
    model_role,
    fsrs_rating,
    state_before,
    state_after,
    retrievability_before,
    retrievability_after,
    stability_before,
    stability_after,
    difficulty_before,
    difficulty_after,
    learning_steps_before,
    learning_steps_after,
    snapshot_before,
    snapshot_after,
    due_before,
    due_after
  )
  VALUES (
    p_answer_id,
    p_user_id,
    p_question_id,
    p_scheduler_version,
    p_parameter_set_id,
    p_model_role,
    (p_projection->>'fsrs_rating')::smallint,
    p_projection->>'state_before',
    p_projection->>'state_after',
    (p_projection->>'retrievability_before')::real,
    (p_projection->>'retrievability_after')::real,
    (p_projection->>'stability_before')::real,
    (p_projection->>'stability_after')::real,
    (p_projection->>'difficulty_before')::real,
    (p_projection->>'difficulty_after')::real,
    (p_projection->>'learning_steps_before')::integer,
    (p_projection->>'learning_steps_after')::integer,
    p_projection->'snapshot_before',
    p_projection->'snapshot_after',
    NULLIF(p_projection->>'due_before', '')::timestamptz,
    NULLIF(p_projection->>'due_after', '')::timestamptz
  );

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.apply_memory_v2_review(
  uuid, uuid, text, text, uuid, text, boolean, timestamptz, integer, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_memory_v2_review(
  uuid, uuid, text, text, uuid, text, boolean, timestamptz, integer, jsonb, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION public.import_fsrs_memory_v2(p_rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows must be an array';
  END IF;
  IF to_regclass('public.learning_experiment_configs') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.learning_experiment_configs
      WHERE experiment_key = 'memory-v2-rollout'
        AND rollout_percent > 0
    )
  THEN
    RAISE EXCEPTION 'Rollback memory-v2 to 0%% before importing memory state';
  END IF;

  WITH imported AS (
    INSERT INTO public.user_question_memory_v2 (
      user_id,
      question_id,
      scheduler_version,
      parameter_set_id,
      state,
      stability,
      difficulty,
      elapsed_days,
      scheduled_days,
      learning_steps,
      reps,
      lapses,
      next_review,
      last_answered_at,
      last_rating,
      source,
      updated_at
    )
    SELECT
      incoming.user_id,
      incoming.question_id,
      incoming.scheduler_version,
      incoming.parameter_set_id,
      incoming.state,
      incoming.stability,
      incoming.difficulty,
      incoming.elapsed_days,
      incoming.scheduled_days,
      COALESCE(incoming.learning_steps, 0),
      incoming.reps,
      incoming.lapses,
      incoming.next_review,
      incoming.last_answered_at,
      incoming.last_rating,
      incoming.source,
      incoming.updated_at
    FROM jsonb_to_recordset(p_rows) AS incoming (
      user_id uuid,
      question_id text,
      scheduler_version text,
      parameter_set_id uuid,
      state text,
      stability real,
      difficulty real,
      elapsed_days integer,
      scheduled_days integer,
      learning_steps integer,
      reps integer,
      lapses integer,
      next_review timestamptz,
      last_answered_at timestamptz,
      last_rating smallint,
      source text,
      updated_at timestamptz
    )
    ON CONFLICT (user_id, question_id, scheduler_version)
    DO UPDATE SET
      parameter_set_id = EXCLUDED.parameter_set_id,
      state = EXCLUDED.state,
      stability = EXCLUDED.stability,
      difficulty = EXCLUDED.difficulty,
      elapsed_days = EXCLUDED.elapsed_days,
      scheduled_days = EXCLUDED.scheduled_days,
      learning_steps = EXCLUDED.learning_steps,
      reps = EXCLUDED.reps,
      lapses = EXCLUDED.lapses,
      next_review = EXCLUDED.next_review,
      last_answered_at = EXCLUDED.last_answered_at,
      last_rating = EXCLUDED.last_rating,
      source = EXCLUDED.source,
      updated_at = EXCLUDED.updated_at
    WHERE (
      COALESCE(EXCLUDED.last_answered_at, '-infinity'::timestamptz)
        > COALESCE(
          public.user_question_memory_v2.last_answered_at,
          '-infinity'::timestamptz
        )
      OR (
        EXCLUDED.last_answered_at IS NOT DISTINCT FROM
          public.user_question_memory_v2.last_answered_at
        AND EXCLUDED.reps >= public.user_question_memory_v2.reps
      )
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM imported;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_fsrs_memory_v2(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_fsrs_memory_v2(jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.apply_user_question_review(
  p_answer_id uuid,
  p_user_id uuid,
  p_question_id text,
  p_expected_exists boolean,
  p_expected_last_answered_at timestamptz,
  p_expected_reps integer,
  p_is_correct boolean,
  p_confidence text,
  p_progress jsonb,
  p_telemetry jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress public.user_question_progress%ROWTYPE;
  v_answer_applied boolean;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT answer.fsrs_applied
  INTO v_answer_applied
  FROM public.session_answers answer
  JOIN public.study_sessions session ON session.id = answer.session_id
  WHERE answer.id = p_answer_id
    AND answer.question_id = p_question_id
    AND session.user_id = p_user_id
  FOR UPDATE OF answer;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Answer does not belong to user and question';
  END IF;
  IF v_answer_applied THEN
    RETURN 'already_applied';
  END IF;

  SELECT *
  INTO v_progress
  FROM public.user_question_progress progress
  WHERE progress.user_id = p_user_id
    AND progress.question_id = p_question_id
  FOR UPDATE;

  IF p_expected_exists THEN
    IF NOT FOUND
      OR v_progress.last_answered_at IS DISTINCT FROM p_expected_last_answered_at
      OR COALESCE(v_progress.reps, 0) <> p_expected_reps
    THEN
      RETURN 'conflict';
    END IF;

    UPDATE public.user_question_progress
    SET
      times_answered = COALESCE(times_answered, 0) + 1,
      times_correct = COALESCE(times_correct, 0) + p_is_correct::integer,
      last_answered_at = (p_progress->>'last_answered_at')::timestamptz,
      last_confidence = p_confidence,
      stability = (p_progress->>'stability')::real,
      difficulty_rating = (p_progress->>'difficulty_rating')::real,
      elapsed_days = (p_progress->>'elapsed_days')::integer,
      scheduled_days = (p_progress->>'scheduled_days')::integer,
      learning_steps = (p_progress->>'learning_steps')::integer,
      reps = (p_progress->>'reps')::integer,
      lapses = (p_progress->>'lapses')::integer,
      state = p_progress->>'state',
      next_review = (p_progress->>'next_review')::timestamptz
    WHERE id = v_progress.id;
  ELSE
    IF FOUND THEN
      RETURN 'conflict';
    END IF;

    BEGIN
      INSERT INTO public.user_question_progress (
        user_id,
        question_id,
        times_answered,
        times_correct,
        last_answered_at,
        last_confidence,
        stability,
        difficulty_rating,
        elapsed_days,
        scheduled_days,
        learning_steps,
        reps,
        lapses,
        state,
        next_review
      )
      VALUES (
        p_user_id,
        p_question_id,
        1,
        p_is_correct::integer,
        (p_progress->>'last_answered_at')::timestamptz,
        p_confidence,
        (p_progress->>'stability')::real,
        (p_progress->>'difficulty_rating')::real,
        (p_progress->>'elapsed_days')::integer,
        (p_progress->>'scheduled_days')::integer,
        (p_progress->>'learning_steps')::integer,
        (p_progress->>'reps')::integer,
        (p_progress->>'lapses')::integer,
        p_progress->>'state',
        (p_progress->>'next_review')::timestamptz
      );
    EXCEPTION WHEN unique_violation THEN
      RETURN 'conflict';
    END;
  END IF;

  UPDATE public.session_answers
  SET
    fsrs_applied = true,
    fsrs_rating = (p_telemetry->>'fsrs_rating')::smallint,
    rating_source = p_telemetry->>'rating_source',
    state_before = p_telemetry->>'state_before',
    state_after = p_telemetry->>'state_after',
    retrievability_before =
      (p_telemetry->>'retrievability_before')::real,
    retrievability_after =
      (p_telemetry->>'retrievability_after')::real,
    stability_before = (p_telemetry->>'stability_before')::real,
    stability_after = (p_telemetry->>'stability_after')::real,
    difficulty_before = (p_telemetry->>'difficulty_before')::real,
    difficulty_after = (p_telemetry->>'difficulty_after')::real,
    fsrs_snapshot_before = p_telemetry->'snapshot_before',
    fsrs_snapshot_after = p_telemetry->'snapshot_after',
    due_before = NULLIF(p_telemetry->>'due_before', '')::timestamptz,
    due_after = NULLIF(p_telemetry->>'due_after', '')::timestamptz
  WHERE id = p_answer_id;

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.apply_user_question_review(
  uuid, uuid, text, boolean, timestamptz, integer, boolean, text, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_user_question_review(
  uuid, uuid, text, boolean, timestamptz, integer, boolean, text, jsonb, jsonb
) TO service_role;

COMMIT;
