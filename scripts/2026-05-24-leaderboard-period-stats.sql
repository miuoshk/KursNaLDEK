-- Agregacja rankingu po okresie (omija limit 1000 wierszy w PostgREST).

CREATE OR REPLACE FUNCTION public.leaderboard_period_stats(p_since timestamptz DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  period_xp bigint,
  period_correct bigint,
  period_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ss.user_id,
    COALESCE(SUM(ss.xp_earned), 0)::bigint AS period_xp,
    COALESCE(SUM(ss.correct_answers), 0)::bigint AS period_correct,
    COALESCE(SUM(ss.total_questions), 0)::bigint AS period_total
  FROM study_sessions ss
  WHERE ss.is_completed = true
    AND (p_since IS NULL OR ss.completed_at >= p_since)
  GROUP BY ss.user_id
  HAVING COALESCE(SUM(ss.total_questions), 0) > 0;
$$;

REVOKE ALL ON FUNCTION public.leaderboard_period_stats(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leaderboard_period_stats(timestamptz) TO service_role;
