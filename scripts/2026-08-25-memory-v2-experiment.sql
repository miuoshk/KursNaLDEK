-- Celowo bez jednej otaczającej transakcji, aby ALTER study_sessions nie
-- trzymał blokady przez definicje raportów. Uruchamiać przez psql z
-- ON_ERROR_STOP; operacje są idempotentne.

CREATE TABLE IF NOT EXISTS public.learning_experiment_configs (
  experiment_key text PRIMARY KEY,
  scheduler_version text NOT NULL,
  rollout_percent integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT false,
  guardrails jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text,
  CONSTRAINT learning_experiment_rollout_chk
    CHECK (rollout_percent BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS public.learning_experiment_assignments (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  experiment_key text NOT NULL
    REFERENCES public.learning_experiment_configs(experiment_key)
    ON DELETE CASCADE,
  bucket integer NOT NULL,
  variant text NOT NULL,
  rollout_percent integer NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, experiment_key),
  CONSTRAINT learning_experiment_bucket_chk
    CHECK (bucket BETWEEN 0 AND 9999),
  CONSTRAINT learning_experiment_variant_chk
    CHECK (variant IN ('control', 'treatment')),
  CONSTRAINT learning_experiment_assignment_rollout_chk
    CHECK (rollout_percent BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS learning_experiment_assignments_eval
  ON public.learning_experiment_assignments (
    experiment_key,
    variant,
    assigned_at DESC
  );

CREATE TABLE IF NOT EXISTS public.learning_experiment_rollouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key text NOT NULL
    REFERENCES public.learning_experiment_configs(experiment_key)
    ON DELETE CASCADE,
  from_percent integer NOT NULL,
  to_percent integer NOT NULL,
  decision text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  applied_at timestamptz NOT NULL DEFAULT now(),
  applied_by text,
  CONSTRAINT learning_experiment_rollout_history_pct_chk
    CHECK (
      from_percent BETWEEN 0 AND 100
      AND to_percent BETWEEN 0 AND 100
    ),
  CONSTRAINT learning_experiment_rollout_decision_chk
    CHECK (decision IN ('pass', 'rollback'))
);

INSERT INTO public.learning_experiment_configs (
  experiment_key,
  scheduler_version,
  rollout_percent,
  active,
  guardrails,
  updated_by
)
VALUES (
  'memory-v2-rollout',
  'memory-v2/ts-fsrs-5.4.1',
  0,
  false,
  jsonb_build_object(
    'max_time_per_question_increase_pct', 10,
    'max_completion_drop_pct_points', 5,
    'max_backlog_increase_pct', 10,
    'max_error_report_increase_pct', 20,
    'max_memory_fallback_pct', 1
  ),
  'migration'
)
ON CONFLICT (experiment_key) DO NOTHING;

INSERT INTO public.learning_experiment_configs (
  experiment_key,
  scheduler_version,
  rollout_percent,
  active,
  guardrails,
  updated_by
)
VALUES
  (
    'adaptive-feedback-v1',
    'not-applicable',
    0,
    false,
    jsonb_build_object(
      'max_time_per_question_increase_pct', 10,
      'max_completion_drop_pct_points', 5,
      'max_error_report_increase_pct', 20
    ),
    'migration'
  ),
  (
    'daily-plan-v1',
    'not-applicable',
    0,
    false,
    jsonb_build_object(
      'max_time_per_question_increase_pct', 10,
      'max_completion_drop_pct_points', 5
    ),
    'migration'
  )
ON CONFLICT (experiment_key) DO NOTHING;

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS experiment_key text,
  ADD COLUMN IF NOT EXISTS experiment_bucket integer,
  ADD COLUMN IF NOT EXISTS experiment_rollout_percent integer,
  ADD COLUMN IF NOT EXISTS feedback_experiment_variant text,
  ADD COLUMN IF NOT EXISTS daily_plan_experiment_variant text,
  ADD COLUMN IF NOT EXISTS memory_fallback boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.study_sessions'::regclass
      AND conname = 'study_sessions_experiment_bucket_chk'
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_experiment_bucket_chk
      CHECK (
        experiment_bucket IS NULL
        OR experiment_bucket BETWEEN 0 AND 9999
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.study_sessions'::regclass
      AND conname = 'study_sessions_experiment_rollout_chk'
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_experiment_rollout_chk
      CHECK (
        experiment_rollout_percent IS NULL
        OR experiment_rollout_percent BETWEEN 0 AND 100
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.study_sessions'::regclass
      AND conname = 'study_sessions_feedback_experiment_variant_chk'
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_feedback_experiment_variant_chk
      CHECK (
        feedback_experiment_variant IS NULL
        OR feedback_experiment_variant IN ('control', 'treatment')
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.study_sessions'::regclass
      AND conname = 'study_sessions_daily_plan_experiment_variant_chk'
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_daily_plan_experiment_variant_chk
      CHECK (
        daily_plan_experiment_variant IS NULL
        OR daily_plan_experiment_variant IN ('control', 'treatment')
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS study_sessions_experiment_eval
  ON public.study_sessions (
    experiment_key,
    engine_variant,
    started_at DESC
  )
  WHERE experiment_key IS NOT NULL;

ALTER TABLE public.learning_experiment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_experiment_rollouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS learning_experiment_configs_select
  ON public.learning_experiment_configs;
CREATE POLICY learning_experiment_configs_select
  ON public.learning_experiment_configs
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS learning_experiment_assignments_select
  ON public.learning_experiment_assignments;
CREATE POLICY learning_experiment_assignments_select
  ON public.learning_experiment_assignments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS learning_experiment_assignments_insert
  ON public.learning_experiment_assignments;
DROP POLICY IF EXISTS learning_experiment_assignments_update
  ON public.learning_experiment_assignments;

CREATE OR REPLACE FUNCTION public.set_learning_experiment_rollout(
  p_experiment_key text,
  p_to_percent integer,
  p_report jsonb,
  p_applied_by text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_from_percent integer;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT rollout_percent
  INTO v_from_percent
  FROM public.learning_experiment_configs
  WHERE experiment_key = p_experiment_key
  FOR UPDATE;

  IF v_from_percent IS NULL THEN
    RAISE EXCEPTION 'Unknown experiment: %', p_experiment_key;
  END IF;
  IF p_to_percent NOT IN (0, 5, 25, 100) THEN
    RAISE EXCEPTION 'Rollout must be one of 0, 5, 25, 100';
  END IF;
  IF p_to_percent <> 0 AND NOT (
    (v_from_percent = 0 AND p_to_percent = 5)
    OR (v_from_percent = 5 AND p_to_percent = 25)
    OR (v_from_percent = 25 AND p_to_percent = 100)
    OR v_from_percent = p_to_percent
  ) THEN
    RAISE EXCEPTION 'Unsafe rollout transition: % -> %',
      v_from_percent, p_to_percent;
  END IF;
  IF p_to_percent > 0 AND (
    COALESCE(p_report->>'experimentKey', '') <> p_experiment_key
    OR COALESCE(p_report->>'decision', '') <> 'pass'
    OR jsonb_typeof(p_report->'violations') <> 'array'
    OR jsonb_array_length(p_report->'violations') <> 0
    OR NULLIF(p_report->>'evaluatedAt', '') IS NULL
    OR (p_report->>'evaluatedAt')::timestamptz < now() - interval '72 hours'
  ) THEN
    RAISE EXCEPTION 'A passing guardrail report is required';
  END IF;
  IF v_from_percent = 0
    AND p_to_percent = 5
    AND COALESCE(p_report->>'stage', '') <> 'preflight'
  THEN
    RAISE EXCEPTION 'The 0 -> 5 transition requires a preflight report';
  END IF;
  IF v_from_percent IN (5, 25)
    AND p_to_percent > v_from_percent
    AND COALESCE(p_report->>'stage', '') <> 'cohort'
  THEN
    RAISE EXCEPTION 'Later rollout stages require a cohort report';
  END IF;
  IF v_from_percent IN (5, 25)
    AND p_to_percent > v_from_percent
    AND COALESCE(p_report->>'rolloutPercent', '') <> v_from_percent::text
  THEN
    RAISE EXCEPTION 'Cohort report does not match current rollout stage';
  END IF;
  IF p_experiment_key = 'memory-v2-rollout'
    AND p_to_percent > 0
    AND NOT EXISTS (
      SELECT 1
      FROM public.fsrs_parameter_sets parameters
      JOIN public.learning_experiment_configs config
        ON config.experiment_key = p_experiment_key
      WHERE parameters.scheduler_version = config.scheduler_version
        AND parameters.active = true
        AND parameters.scope = 'global'
        AND jsonb_typeof(parameters.weights) = 'array'
        AND jsonb_array_length(parameters.weights) = 21
        AND parameters.metadata ->> 'parameterFingerprint'
          = p_report ->> 'parameterFingerprint'
    )
  THEN
    RAISE EXCEPTION 'Memory v2 rollout requires an active 21-weight parameter set';
  END IF;

  UPDATE public.learning_experiment_configs
  SET rollout_percent = p_to_percent,
      active = p_to_percent > 0,
      updated_at = now(),
      updated_by = p_applied_by
  WHERE experiment_key = p_experiment_key;

  INSERT INTO public.learning_experiment_rollouts (
    experiment_key,
    from_percent,
    to_percent,
    decision,
    metrics,
    applied_by
  )
  VALUES (
    p_experiment_key,
    v_from_percent,
    p_to_percent,
    CASE WHEN p_to_percent = 0 THEN 'rollback' ELSE 'pass' END,
    COALESCE(p_report, '{}'::jsonb),
    p_applied_by
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_learning_experiment_rollout(
  text, integer, jsonb, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_learning_experiment_rollout(
  text, integer, jsonb, text
) TO service_role;

DROP FUNCTION IF EXISTS public.learning_experiment_metric_snapshot(
  text, timestamptz
);
CREATE FUNCTION public.learning_experiment_metric_snapshot(
  p_experiment_key text,
  p_since timestamptz
)
RETURNS TABLE (
  variant text,
  users bigint,
  sessions bigint,
  answers bigint,
  delayed_attempts bigint,
  delayed_accuracy real,
  brier_score real,
  log_loss real,
  memory_fallback_rate real,
  average_time_seconds real,
  completion_rate real,
  active_days_per_user real,
  average_due_backlog real,
  protected_cem_attempts bigint,
  protected_cem_correct_per_minute real,
  error_reports_per_1000_answers real
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base_sessions AS (
    SELECT
      s.id,
      s.user_id,
      s.total_questions,
      s.started_at,
      s.mode,
      s.engine_variant,
      s.memory_fallback,
      CASE p_experiment_key
        WHEN 'memory-v2-rollout' THEN
          CASE WHEN COALESCE(s.experiment_bucket, 10000)
              < COALESCE(s.experiment_rollout_percent, 0) * 100
            THEN 'treatment' ELSE 'control' END
        WHEN 'adaptive-feedback-v1' THEN
          COALESCE(s.feedback_experiment_variant, 'control')
        WHEN 'daily-plan-v1' THEN
          COALESCE(s.daily_plan_experiment_variant, 'control')
        ELSE 'control'
      END AS variant
    FROM public.study_sessions s
    WHERE s.started_at >= p_since
      AND s.started_at < now() - interval '1 hour'
      AND s.mode IN ('nauka', 'egzamin')
      AND (
        (p_experiment_key = 'memory-v2-rollout'
          AND s.experiment_key = p_experiment_key)
        OR (p_experiment_key = 'adaptive-feedback-v1'
          AND s.feedback_experiment_variant IS NOT NULL)
        OR (p_experiment_key = 'daily-plan-v1'
          AND s.daily_plan_experiment_variant IS NOT NULL)
      )
  ),
  session_rollup AS (
    SELECT
      b.id,
      b.user_id,
      b.variant,
      b.started_at,
      b.total_questions,
      COUNT(a.id)::integer AS answered,
      COALESCE(
        SUM(
          COALESCE(a.time_spent_seconds, 0) +
          COALESCE(a.feedback_dwell_seconds, 0)
        ),
        0
      )::real AS seconds
    FROM base_sessions b
    LEFT JOIN public.session_answers a ON a.session_id = b.id
    GROUP BY b.id, b.user_id, b.variant, b.started_at, b.total_questions
  ),
  all_attempts AS (
    SELECT
      s.user_id,
      a.session_id,
      a.question_id,
      a.answered_at,
      a.is_correct,
      LAG(a.answered_at) OVER (
        PARTITION BY s.user_id, a.question_id
        ORDER BY a.answered_at
      ) AS prev_answered_at
    FROM public.session_answers a
    JOIN public.study_sessions s ON s.id = a.session_id
    WHERE a.answered_at >= p_since - interval '30 days'
      AND a.answered_at < now() - interval '1 hour'
  ),
  delayed AS (
    SELECT
      b.variant,
      COUNT(*) AS delayed_attempts,
      AVG((attempts.is_correct)::integer)::real AS delayed_accuracy
    FROM all_attempts attempts
    JOIN base_sessions b ON b.id = attempts.session_id
    WHERE attempts.answered_at >= p_since
      AND attempts.prev_answered_at IS NOT NULL
      AND attempts.answered_at - attempts.prev_answered_at
        BETWEEN interval '7 days' AND interval '30 days'
    GROUP BY b.variant
  ),
  prediction_metrics AS (
    SELECT
      b.variant,
      AVG(
        POWER(
          a.retrievability_before - (a.is_correct)::integer,
          2
        )
      )::real AS brier_score,
      AVG(
        -(
          (a.is_correct)::integer
            * LN(LEAST(0.999999, GREATEST(0.000001, a.retrievability_before)))
          + (1 - (a.is_correct)::integer)
            * LN(
              1 - LEAST(
                0.999999,
                GREATEST(0.000001, a.retrievability_before)
              )
            )
        )
      )::real AS log_loss
    FROM base_sessions b
    JOIN public.session_answers a ON a.session_id = b.id
    WHERE a.retrievability_before IS NOT NULL
      AND a.state_before <> 'new'
    GROUP BY b.variant
  ),
  fallback_metrics AS (
    SELECT
      variant,
      AVG((
        memory_fallback
        OR EXISTS (
          SELECT 1
          FROM public.session_answers fallback_answer
          WHERE fallback_answer.session_id = base_sessions.id
            AND fallback_answer.memory_fallback
        )
      )::integer)::real
        AS memory_fallback_rate
    FROM base_sessions
    WHERE p_experiment_key = 'memory-v2-rollout'
      AND variant = 'treatment'
    GROUP BY variant
  ),
  variant_users AS (
    SELECT DISTINCT variant, user_id FROM base_sessions
  ),
  active_days AS (
    SELECT
      variant,
      user_id,
      COUNT(DISTINCT (started_at AT TIME ZONE 'Europe/Warsaw')::date) AS days
    FROM base_sessions
    GROUP BY variant, user_id
  ),
  legacy_due_by_user AS (
    SELECT
      vu.user_id,
      COUNT(uqp.id) FILTER (
        WHERE uqp.state <> 'new' AND uqp.next_review <= now()
      ) AS due_count
    FROM variant_users vu
    LEFT JOIN public.user_question_progress uqp ON uqp.user_id = vu.user_id
    GROUP BY vu.user_id
  ),
  v2_due_by_user AS (
    SELECT
      vu.user_id,
      COUNT(DISTINCT memory.question_id) FILTER (
        WHERE memory.state <> 'new' AND memory.next_review <= now()
      ) AS due_count
    FROM variant_users vu
    LEFT JOIN public.user_question_memory_v2 memory
      ON memory.user_id = vu.user_id
    GROUP BY vu.user_id
  ),
  due_by_user AS (
    SELECT
      vu.variant,
      vu.user_id,
      CASE
        WHEN p_experiment_key = 'memory-v2-rollout'
          AND vu.variant = 'treatment'
          THEN COALESCE(v2.due_count, 0)
        ELSE COALESCE(legacy.due_count, 0)
      END AS due_count
    FROM variant_users vu
    LEFT JOIN legacy_due_by_user legacy ON legacy.user_id = vu.user_id
    LEFT JOIN v2_due_by_user v2 ON v2.user_id = vu.user_id
  ),
  reports AS (
    SELECT
      vu.variant,
      COUNT(er.id)::real AS report_count
    FROM variant_users vu
    LEFT JOIN public.error_reports er
      ON er.user_id = vu.user_id
      AND er.created_at >= p_since
    GROUP BY vu.variant
  ),
  cem AS (
    SELECT
      b.variant,
      COUNT(*)::bigint AS attempts,
      COUNT(*) FILTER (WHERE a.is_correct)::real AS correct,
      COALESCE(
        SUM(
          COALESCE(a.time_spent_seconds, 0) +
          COALESCE(a.feedback_dwell_seconds, 0)
        ),
        0
      )::real AS seconds
    FROM base_sessions b
    JOIN public.session_answers a ON a.session_id = b.id
    JOIN public.questions q ON q.id = a.question_id
    WHERE q.reserve_bucket >= 70
      AND b.mode = 'egzamin'
    GROUP BY b.variant
  ),
  aggregate AS (
    SELECT
      sr.variant,
      COUNT(DISTINCT sr.user_id) AS users,
      COUNT(*) AS sessions,
      SUM(sr.answered) AS answers,
      (
        SUM(sr.seconds) / NULLIF(SUM(sr.answered), 0)
      )::real AS average_time_seconds,
      AVG(
        LEAST(
          1,
          sr.answered::real / NULLIF(sr.total_questions, 0)
        )
      )::real AS completion_rate
    FROM session_rollup sr
    GROUP BY sr.variant
  )
  SELECT
    aggregate.variant,
    aggregate.users,
    aggregate.sessions,
    aggregate.answers,
    COALESCE(delayed.delayed_attempts, 0),
    delayed.delayed_accuracy,
    prediction_metrics.brier_score,
    prediction_metrics.log_loss,
    fallback_metrics.memory_fallback_rate,
    aggregate.average_time_seconds,
    aggregate.completion_rate,
    (
      SELECT AVG(active_days.days)::real
      FROM active_days
      WHERE active_days.variant = aggregate.variant
    ),
    (
      SELECT AVG(due_by_user.due_count)::real
      FROM due_by_user
      WHERE due_by_user.variant = aggregate.variant
    ),
    COALESCE(cem.attempts, 0),
    (
      cem.correct / NULLIF(cem.seconds / 60.0, 0)
    )::real,
    (
      COALESCE(reports.report_count, 0)
      * 1000.0
      / NULLIF(aggregate.answers, 0)
    )::real
  FROM aggregate
  LEFT JOIN delayed ON delayed.variant = aggregate.variant
  LEFT JOIN prediction_metrics
    ON prediction_metrics.variant = aggregate.variant
  LEFT JOIN fallback_metrics
    ON fallback_metrics.variant = aggregate.variant
  LEFT JOIN reports ON reports.variant = aggregate.variant
  LEFT JOIN cem ON cem.variant = aggregate.variant
  ORDER BY aggregate.variant;
$$;

REVOKE ALL ON FUNCTION public.learning_experiment_metric_snapshot(
  text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.learning_experiment_metric_snapshot(
  text, timestamptz
) TO service_role;

DROP FUNCTION IF EXISTS public.memory_v2_shadow_snapshot(timestamptz);
CREATE FUNCTION public.memory_v2_shadow_snapshot(
  p_since timestamptz
)
RETURNS TABLE (
  answers bigint,
  projections bigint,
  scored_answers bigint,
  projection_coverage real,
  control_brier_score real,
  shadow_brier_score real,
  control_log_loss real,
  shadow_log_loss real,
  memory_cards bigint,
  legacy_cards bigint,
  backfilled_cards bigint,
  backfill_coverage real,
  parameter_fingerprint text,
  parameter_activated_at timestamptz
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH active_parameter AS (
    SELECT
      parameter.id,
      parameter.metadata ->> 'parameterFingerprint' AS parameter_fingerprint,
      parameter.optimized_at AS parameter_activated_at
    FROM public.fsrs_parameter_sets parameter
    WHERE parameter.scheduler_version = 'memory-v2/ts-fsrs-5.4.1'
      AND parameter.scope = 'global'
      AND parameter.active
    LIMIT 1
  ),
  eligible AS (
    SELECT
      answer.id,
      answer.is_correct,
      answer.retrievability_before,
      answer.state_before,
      active_parameter.id AS parameter_set_id
    FROM public.session_answers answer
    JOIN public.study_sessions session ON session.id = answer.session_id
    JOIN active_parameter
      ON active_parameter.id = session.memory_parameter_set_id
    WHERE session.experiment_key = 'memory-v2-rollout'
      AND session.started_at >= p_since
      AND session.engine_variant = 'shadow'
      AND answer.fsrs_applied = true
  ),
  scored AS (
    SELECT
      eligible.*,
      projection.retrievability_before AS shadow_retrievability,
      projection.state_before AS shadow_state_before
    FROM eligible
    LEFT JOIN public.session_answer_memory_projections projection
      ON projection.answer_id = eligible.id
      AND projection.scheduler_version = 'memory-v2/ts-fsrs-5.4.1'
      AND projection.parameter_set_id = eligible.parameter_set_id
  ),
  backfill AS (
    SELECT
      COUNT(*)::bigint AS legacy_cards,
      COUNT(memory.question_id)::bigint AS backfilled_cards
    FROM public.user_question_progress progress
    LEFT JOIN public.user_question_memory_v2 memory
      ON memory.user_id = progress.user_id
      AND memory.question_id = progress.question_id
      AND memory.scheduler_version = 'memory-v2/ts-fsrs-5.4.1'
    WHERE progress.last_answered_at IS NOT NULL
  )
  SELECT
    COUNT(*)::bigint,
    COUNT(shadow_retrievability)::bigint,
    COUNT(*) FILTER (
      WHERE retrievability_before IS NOT NULL
        AND state_before <> 'new'
        AND shadow_retrievability IS NOT NULL
        AND shadow_state_before <> 'new'
    )::bigint,
    (
      COUNT(shadow_retrievability)::real / NULLIF(COUNT(*), 0)
    )::real,
    AVG(
      POWER(retrievability_before - (is_correct)::integer, 2)
    ) FILTER (
      WHERE retrievability_before IS NOT NULL
        AND state_before <> 'new'
    )::real,
    AVG(
      POWER(shadow_retrievability - (is_correct)::integer, 2)
    ) FILTER (
      WHERE shadow_retrievability IS NOT NULL
        AND shadow_state_before <> 'new'
    )::real,
    AVG(
      -(
        (is_correct)::integer
          * LN(LEAST(0.999999, GREATEST(0.000001, retrievability_before)))
        + (1 - (is_correct)::integer)
          * LN(
            1 - LEAST(
              0.999999,
              GREATEST(0.000001, retrievability_before)
            )
          )
      )
    ) FILTER (
      WHERE retrievability_before IS NOT NULL
        AND state_before <> 'new'
    )::real,
    AVG(
      -(
        (is_correct)::integer
          * LN(LEAST(0.999999, GREATEST(0.000001, shadow_retrievability)))
        + (1 - (is_correct)::integer)
          * LN(
            1 - LEAST(
              0.999999,
              GREATEST(0.000001, shadow_retrievability)
            )
          )
      )
    ) FILTER (
      WHERE shadow_retrievability IS NOT NULL
        AND shadow_state_before <> 'new'
    )::real,
    (
      SELECT COUNT(*)
      FROM public.user_question_memory_v2
      WHERE scheduler_version = 'memory-v2/ts-fsrs-5.4.1'
    )::bigint,
    (SELECT legacy_cards FROM backfill),
    (SELECT backfilled_cards FROM backfill),
    (
      (SELECT backfilled_cards FROM backfill)::real /
      NULLIF((SELECT legacy_cards FROM backfill), 0)
    )::real,
    (SELECT parameter_fingerprint FROM active_parameter),
    (SELECT parameter_activated_at FROM active_parameter)
  FROM scored;
$$;

REVOKE ALL ON FUNCTION public.memory_v2_shadow_snapshot(timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.memory_v2_shadow_snapshot(timestamptz)
  TO service_role;

