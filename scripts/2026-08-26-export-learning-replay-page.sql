-- Service-role pagination for FSRS replay export (same columns as
-- scripts/2026-08-25-export-learning-replay.sql). PostgREST caps RPC
-- results at db-max-rows (1000); the Node client pages by keyset.
-- DROP after the offline dump — do not leave this on production longer
-- than the export window.

CREATE OR REPLACE FUNCTION public.export_learning_replay_page(
  p_limit integer,
  p_after_user uuid DEFAULT NULL,
  p_after_question text DEFAULT NULL,
  p_after_answered timestamptz DEFAULT NULL,
  p_after_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  product text,
  track text,
  cohort_key text,
  question_id text,
  answered_at timestamptz,
  is_correct boolean,
  confidence text,
  rating_source text,
  session_kind text,
  time_spent_seconds integer,
  answer_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ss.user_id,
    p.current_product,
    p.current_track,
    CONCAT_WS(
      ':',
      COALESCE(p.current_product, 'unknown'),
      COALESCE(p.current_track, 'unknown')
    ),
    sa.question_id,
    sa.answered_at,
    sa.is_correct,
    CASE
      WHEN COALESCE(
        ss.session_kind,
        CASE ss.mode WHEN 'nauka' THEN 'intelligent' ELSE 'classic' END
      ) = 'classic' THEN NULL
      ELSE sa.confidence
    END,
    COALESCE(
      sa.rating_source,
      CASE
        WHEN COALESCE(
          ss.session_kind,
          CASE ss.mode WHEN 'nauka' THEN 'intelligent' ELSE 'classic' END
        ) = 'classic' THEN 'observed'
        ELSE 'explicit'
      END
    ),
    COALESCE(
      ss.session_kind,
      CASE ss.mode WHEN 'nauka' THEN 'intelligent' ELSE 'classic' END
    ),
    COALESCE(sa.time_spent_seconds, 0),
    sa.id
  FROM public.session_answers sa
  JOIN public.study_sessions ss ON ss.id = sa.session_id
  JOIN public.profiles p ON p.id = ss.user_id
  WHERE sa.answered_at IS NOT NULL
    AND (
      p_after_user IS NULL
      OR (ss.user_id, sa.question_id COLLATE "C", sa.answered_at, sa.id)
        > (p_after_user, p_after_question, p_after_answered, p_after_id)
    )
  ORDER BY ss.user_id, sa.question_id COLLATE "C", sa.answered_at, sa.id
  LIMIT GREATEST(1, LEAST(p_limit, 5000));
$$;

REVOKE ALL ON FUNCTION public.export_learning_replay_page(integer, uuid, text, timestamptz, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_learning_replay_page(integer, uuid, text, timestamptz, uuid)
  TO service_role;
