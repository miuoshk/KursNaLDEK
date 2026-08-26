-- Agregaty bez danych osobowych do raportu bazowego personalizacji nauki.
-- Zapytanie jest tylko do odczytu.

WITH attempts AS (
  SELECT
    COUNT(*) AS attempts,
    COUNT(*) FILTER (WHERE sa.is_correct) AS correct,
    AVG(sa.time_spent_seconds) FILTER (WHERE sa.time_spent_seconds > 0) AS avg_seconds,
    COUNT(DISTINCT ss.user_id) AS users
  FROM public.session_answers sa
  JOIN public.study_sessions ss ON ss.id = sa.session_id
)
SELECT 'attempts' AS metric, to_jsonb(attempts) AS value
FROM attempts;

WITH by_mode AS (
  SELECT
    COALESCE(
      ss.session_kind,
      CASE ss.mode WHEN 'nauka' THEN 'intelligent' ELSE 'classic' END
    ) AS session_kind,
    COUNT(*) AS attempts,
    AVG(sa.is_correct::int) AS accuracy,
    AVG(sa.time_spent_seconds) FILTER (WHERE sa.time_spent_seconds > 0) AS avg_seconds,
    COUNT(*) FILTER (
      WHERE sa.confidence = 'na_pewno'
        AND ss.mode <> 'nauka'
    ) AS automatic_sure_confidence
  FROM public.session_answers sa
  JOIN public.study_sessions ss ON ss.id = sa.session_id
  GROUP BY 1
)
SELECT 'attempts_by_mode' AS metric, jsonb_agg(to_jsonb(by_mode)) AS value
FROM by_mode;

WITH active_users AS (
  SELECT DISTINCT user_id
  FROM public.study_sessions
  WHERE started_at >= now() - interval '30 days'
),
backlog AS (
  SELECT
    au.user_id,
    COUNT(uqp.*) FILTER (
      WHERE uqp.state <> 'new'
        AND uqp.next_review <= now()
    ) AS due_count
  FROM active_users au
  LEFT JOIN public.user_question_progress uqp ON uqp.user_id = au.user_id
  GROUP BY au.user_id
)
SELECT
  'active_backlog_30d' AS metric,
  jsonb_build_object(
    'users', COUNT(*),
    'median_due', percentile_cont(0.5) WITHIN GROUP (ORDER BY due_count),
    'p90_due', percentile_cont(0.9) WITHIN GROUP (ORDER BY due_count),
    'max_due', MAX(due_count)
  ) AS value
FROM backlog;

WITH per_user AS (
  SELECT user_id, SUM(COALESCE(reps, 0)) AS total_reps
  FROM public.user_question_progress
  GROUP BY user_id
),
depth AS (
  SELECT
    COUNT(*) AS progress_rows,
    COUNT(*) FILTER (WHERE next_review IS NOT NULL) AS scheduled_rows,
    COUNT(*) FILTER (WHERE state = 'new') AS new_rows
  FROM public.user_question_progress
)
SELECT
  'fsrs_depth' AS metric,
  jsonb_build_object(
    'progress_rows', depth.progress_rows,
    'users_1000_plus_reps', (
      SELECT COUNT(*) FROM per_user WHERE total_reps >= 1000
    ),
    'scheduled_rows', depth.scheduled_rows,
    'new_rows', depth.new_rows
  ) AS value
FROM depth;

SELECT
  'metadata_coverage' AS metric,
  jsonb_build_object(
    'active_questions', COUNT(*) FILTER (WHERE is_active),
    'with_explanation', COUNT(*) FILTER (
      WHERE is_active AND length(trim(explanation)) > 0
    ),
    'with_theme', COUNT(*) FILTER (
      WHERE is_active AND NULLIF(trim(theme_label), '') IS NOT NULL
    ),
    'with_subtheme', COUNT(*) FILTER (
      WHERE is_active AND NULLIF(trim(subtheme_label), '') IS NOT NULL
    ),
    'with_learning_outcome', COUNT(*) FILTER (
      WHERE is_active AND NULLIF(trim(learning_outcome), '') IS NOT NULL
    )
  ) AS value
FROM public.questions;
