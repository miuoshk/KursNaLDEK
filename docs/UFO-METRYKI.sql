-- UFO — metryki eksperymentu adaptive-feedback-v1
-- Ręczne. Nic nie wdraża. Treatment vs control, podział na feedback_variant
-- i has_blocks (explanation_blocks IS NOT NULL).
-- Okno: ostatnie 30 dni (zmień v_from w razie potrzeby).

-- (a) Trafność przy NASTĘPNEJ powtórce tego samego pytania
WITH attempts AS (
  SELECT
    sess.feedback_experiment_variant AS arm,
    sa.feedback_variant,
    (q.explanation_blocks IS NOT NULL) AS has_blocks,
    sa.is_correct,
    LEAD(sa.is_correct) OVER (
      PARTITION BY sess.user_id, sa.question_id
      ORDER BY sa.answered_at
    ) AS next_is_correct
  FROM public.session_answers sa
  JOIN public.study_sessions sess ON sess.id = sa.session_id
  JOIN public.questions q ON q.id = sa.question_id
  WHERE sa.answered_at >= now() - interval '30 days'
    AND sess.feedback_experiment_variant IN ('control', 'treatment')
)
SELECT
  'a_next_accuracy' AS metric,
  arm,
  feedback_variant,
  has_blocks,
  COUNT(*) FILTER (WHERE next_is_correct IS NOT NULL) AS n_with_next,
  ROUND(
    100.0 * AVG(next_is_correct::int) FILTER (WHERE next_is_correct IS NOT NULL),
    2
  ) AS next_accuracy_pct
FROM attempts
GROUP BY arm, feedback_variant, has_blocks
ORDER BY arm, feedback_variant, has_blocks;

-- (b) Delta stability_after - stability_before
SELECT
  'b_stability_delta' AS metric,
  sess.feedback_experiment_variant AS arm,
  sa.feedback_variant,
  (q.explanation_blocks IS NOT NULL) AS has_blocks,
  COUNT(*) AS n,
  ROUND(AVG(sa.stability_after - sa.stability_before)::numeric, 4) AS mean_delta,
  ROUND(
    (percentile_cont(0.5) WITHIN GROUP (
      ORDER BY sa.stability_after - sa.stability_before
    ))::numeric,
    4
  ) AS median_delta
FROM public.session_answers sa
JOIN public.study_sessions sess ON sess.id = sa.session_id
JOIN public.questions q ON q.id = sa.question_id
WHERE sa.answered_at >= now() - interval '30 days'
  AND sess.feedback_experiment_variant IN ('control', 'treatment')
  AND sa.stability_before IS NOT NULL
  AND sa.stability_after IS NOT NULL
GROUP BY sess.feedback_experiment_variant, sa.feedback_variant, has_blocks
ORDER BY arm, sa.feedback_variant, has_blocks;

-- (c) Ponowny wybór tego samego dystraktora przy następnej próbie
--     (tylko pierwsze błędne; next musi istnieć)
WITH attempts AS (
  SELECT
    sess.feedback_experiment_variant AS arm,
    sa.feedback_variant,
    (q.explanation_blocks IS NOT NULL) AS has_blocks,
    sa.is_correct,
    sa.selected_option_id,
    LEAD(sa.selected_option_id) OVER (
      PARTITION BY sess.user_id, sa.question_id
      ORDER BY sa.answered_at
    ) AS next_option_id,
    LEAD(sa.is_correct) OVER (
      PARTITION BY sess.user_id, sa.question_id
      ORDER BY sa.answered_at
    ) AS next_is_correct
  FROM public.session_answers sa
  JOIN public.study_sessions sess ON sess.id = sa.session_id
  JOIN public.questions q ON q.id = sa.question_id
  WHERE sa.answered_at >= now() - interval '30 days'
    AND sess.feedback_experiment_variant IN ('control', 'treatment')
)
SELECT
  'c_same_distractor' AS metric,
  arm,
  feedback_variant,
  has_blocks,
  COUNT(*) AS n_wrong_with_next,
  ROUND(
    100.0 * AVG(
      CASE WHEN next_option_id = selected_option_id THEN 1 ELSE 0 END
    ),
    2
  ) AS same_distractor_pct
FROM attempts
WHERE is_correct IS FALSE
  AND next_option_id IS NOT NULL
GROUP BY arm, feedback_variant, has_blocks
ORDER BY arm, feedback_variant, has_blocks;

-- (d) feedback_expand rate per wariant (wymaga eventów z KROKU 9)
WITH shown AS (
  SELECT
    sess.feedback_experiment_variant AS arm,
    (le.payload->>'variant') AS feedback_variant,
    (le.payload->>'hasBlocks')::boolean AS has_blocks,
    le.session_id,
    le.question_id
  FROM public.learning_events le
  JOIN public.study_sessions sess ON sess.id = le.session_id
  WHERE le.event_type = 'feedback_shown'
    AND le.created_at >= now() - interval '30 days'
    AND sess.feedback_experiment_variant IN ('control', 'treatment')
),
expanded AS (
  SELECT DISTINCT session_id, question_id
  FROM public.learning_events
  WHERE event_type = 'feedback_expand'
    AND created_at >= now() - interval '30 days'
)
SELECT
  'd_expand_rate' AS metric,
  shown.arm,
  shown.feedback_variant,
  shown.has_blocks,
  COUNT(*) AS n_shown,
  COUNT(expanded.question_id) AS n_expanded,
  ROUND(
    100.0 * COUNT(expanded.question_id) / NULLIF(COUNT(*), 0),
    2
  ) AS expand_rate_pct
FROM shown
LEFT JOIN expanded
  ON expanded.session_id = shown.session_id
 AND expanded.question_id = shown.question_id
GROUP BY shown.arm, shown.feedback_variant, shown.has_blocks
ORDER BY shown.arm, shown.feedback_variant, shown.has_blocks;

-- (e) Mediana dwell per wariant
SELECT
  'e_median_dwell' AS metric,
  sess.feedback_experiment_variant AS arm,
  sa.feedback_variant,
  (q.explanation_blocks IS NOT NULL) AS has_blocks,
  COUNT(*) AS n,
  ROUND(
    (percentile_cont(0.5) WITHIN GROUP (
      ORDER BY sa.feedback_dwell_seconds
    ))::numeric,
    2
  ) AS median_dwell_seconds
FROM public.session_answers sa
JOIN public.study_sessions sess ON sess.id = sa.session_id
JOIN public.questions q ON q.id = sa.question_id
WHERE sa.answered_at >= now() - interval '30 days'
  AND sess.feedback_experiment_variant IN ('control', 'treatment')
  AND sa.feedback_dwell_seconds IS NOT NULL
GROUP BY sess.feedback_experiment_variant, sa.feedback_variant, has_blocks
ORDER BY arm, sa.feedback_variant, has_blocks;
