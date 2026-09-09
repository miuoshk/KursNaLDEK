-- UFO recenzja pkt 6 — first-attempt klikalność dystraktorów.
-- Powtórki po przeczytaniu wyjaśnienia zawyżają pct_of_wrong.
-- n_first_attempt / pct_of_wrong_first: min(answered_at) per user_id, question_id.
--
-- Po APPLY odpal: SELECT public.refresh_distractor_stats_90d();
-- Porównanie: scripts/distractor-stats-first-vs-all.sql
-- DOWN: odtwórz scripts/2026-09-05-ufo-telemetry-views.sql (sam widok).

DROP MATERIALIZED VIEW IF EXISTS public.distractor_stats_90d;

CREATE MATERIALIZED VIEW public.distractor_stats_90d AS
WITH windowed AS (
  SELECT
    ss.user_id,
    sa.question_id,
    sa.selected_option_id,
    sa.is_correct,
    sa.answered_at
  FROM public.session_answers sa
  JOIN public.study_sessions ss ON ss.id = sa.session_id
  WHERE sa.answered_at >= now() - interval '90 days'
    AND sa.selected_option_id IS NOT NULL
),
first_attempts AS (
  SELECT DISTINCT ON (user_id, question_id)
    user_id,
    question_id,
    selected_option_id,
    is_correct
  FROM windowed
  ORDER BY user_id, question_id, answered_at ASC
),
totals AS (
  SELECT
    question_id,
    COUNT(*)::integer AS n_total,
    COUNT(*) FILTER (WHERE NOT is_correct)::integer AS n_wrong
  FROM windowed
  GROUP BY question_id
),
first_totals AS (
  SELECT
    question_id,
    COUNT(*)::integer AS n_first_total,
    COUNT(*) FILTER (WHERE NOT is_correct)::integer AS n_first_wrong
  FROM first_attempts
  GROUP BY question_id
),
options AS (
  SELECT
    q.id AS question_id,
    opt.option_id
  FROM public.questions q
  JOIN totals t ON t.question_id = q.id
  CROSS JOIN LATERAL (
    SELECT e->>'id' AS option_id
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(q.options) = 'array' THEN q.options
        ELSE '[]'::jsonb
      END
    ) e
  ) opt
  WHERE opt.option_id IS NOT NULL AND opt.option_id <> ''
)
SELECT
  o.question_id,
  o.option_id,
  COUNT(w.selected_option_id)::integer AS n_selected,
  t.n_total,
  ROUND(
    100.0 * COUNT(w.selected_option_id) / NULLIF(t.n_total, 0),
    2
  ) AS pct_of_answers,
  ROUND(
    100.0 * COUNT(w.selected_option_id) FILTER (WHERE w.is_correct IS FALSE)
      / NULLIF(t.n_wrong, 0),
    2
  ) AS pct_of_wrong,
  COUNT(f.selected_option_id)::integer AS n_first_attempt,
  ROUND(
    100.0 * COUNT(f.selected_option_id) FILTER (WHERE f.is_correct IS FALSE)
      / NULLIF(ft.n_first_wrong, 0),
    2
  ) AS pct_of_wrong_first
FROM options o
JOIN totals t ON t.question_id = o.question_id
JOIN first_totals ft ON ft.question_id = o.question_id
LEFT JOIN windowed w
  ON w.question_id = o.question_id
 AND w.selected_option_id = o.option_id
LEFT JOIN first_attempts f
  ON f.question_id = o.question_id
 AND f.selected_option_id = o.option_id
GROUP BY o.question_id, o.option_id, t.n_total, t.n_wrong, ft.n_first_wrong;

COMMENT ON MATERIALIZED VIEW public.distractor_stats_90d IS
  'Klikalność opcji, 90 dni. pct_of_wrong = wszystkie próby; n_first_attempt / pct_of_wrong_first = pierwsza odpowiedź user×pytanie.';

CREATE UNIQUE INDEX distractor_stats_90d_pk
  ON public.distractor_stats_90d (question_id, option_id);

REVOKE ALL ON public.distractor_stats_90d FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.distractor_stats_90d TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_distractor_stats_90d()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.distractor_stats_90d;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_distractor_stats_90d() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_distractor_stats_90d() TO service_role;
