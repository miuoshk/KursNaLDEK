-- UFO KROK 9 — telemetria dystraktorów i licznik pokrycia bloków.
-- UP: widoki + funkcja odświeżania. pg_cron jest opcjonalny (może nie być
-- zainstalowany); skrypt export-distractor-stats.mjs --refresh też odświeża.

-- DOWN:
-- DROP FUNCTION IF EXISTS public.refresh_distractor_stats_90d();
-- DROP MATERIALIZED VIEW IF EXISTS public.distractor_stats_90d;
-- DROP VIEW IF EXISTS public.ufo_coverage;

CREATE OR REPLACE VIEW public.ufo_coverage AS
WITH live AS (
  SELECT sa.question_id
  FROM public.session_answers sa
  WHERE sa.answered_at >= now() - interval '90 days'
  GROUP BY sa.question_id
  HAVING COUNT(*) > 100
)
SELECT
  t.subject_id,
  COUNT(*)::integer AS total,
  COUNT(*) FILTER (WHERE q.blocks_status = 'none')::integer AS none,
  COUNT(*) FILTER (WHERE q.blocks_status = 'draft')::integer AS draft,
  COUNT(*) FILTER (WHERE q.blocks_status = 'reviewed')::integer AS reviewed,
  COUNT(*) FILTER (
    WHERE q.blocks_status = 'none' AND live.question_id IS NOT NULL
  )::integer AS live_without_blocks
FROM public.questions q
JOIN public.topics t ON t.id = q.topic_id
LEFT JOIN live ON live.question_id = q.id
GROUP BY t.subject_id;

COMMENT ON VIEW public.ufo_coverage IS
  'Postęp migracji explanation_blocks per subject: status bloków i żywe pytania bez bloków.';

CREATE MATERIALIZED VIEW IF NOT EXISTS public.distractor_stats_90d AS
WITH windowed AS (
  SELECT
    sa.question_id,
    sa.selected_option_id,
    sa.is_correct
  FROM public.session_answers sa
  WHERE sa.answered_at >= now() - interval '90 days'
    AND sa.selected_option_id IS NOT NULL
),
totals AS (
  SELECT
    question_id,
    COUNT(*)::integer AS n_total,
    COUNT(*) FILTER (WHERE NOT is_correct)::integer AS n_wrong
  FROM windowed
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
  ) AS pct_of_wrong
FROM options o
JOIN totals t ON t.question_id = o.question_id
LEFT JOIN windowed w
  ON w.question_id = o.question_id
 AND w.selected_option_id = o.option_id
GROUP BY o.question_id, o.option_id, t.n_total, t.n_wrong;

COMMENT ON MATERIALIZED VIEW public.distractor_stats_90d IS
  'Klikalność opcji z session_answers.selected_option_id, okno 90 dni. Odświeżać raz dziennie.';

CREATE UNIQUE INDEX IF NOT EXISTS distractor_stats_90d_pk
  ON public.distractor_stats_90d (question_id, option_id);

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

REVOKE ALL ON public.distractor_stats_90d FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.ufo_coverage FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.distractor_stats_90d TO service_role;
GRANT SELECT ON public.ufo_coverage TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'refresh_distractor_stats_90d';
    PERFORM cron.schedule(
      'refresh_distractor_stats_90d',
      '15 3 * * *',
      'SELECT public.refresh_distractor_stats_90d()'
    );
  END IF;
END
$$;
