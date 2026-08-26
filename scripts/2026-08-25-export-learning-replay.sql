-- Uruchom przez psql (nie przez Supabase SQL Editor), np.:
--   psql "$DATABASE_URL" -f scripts/2026-08-25-export-learning-replay.sql
--
-- Wynik jest JSONL posortowany tak, aby replay mógł przetwarzać jedną kartę
-- naraz i nie trzymać całej historii w pamięci.

\copy (
  SELECT row_to_json(export_row)::text
  FROM (
    SELECT
      ss.user_id,
      p.current_product AS product,
      p.current_track AS track,
      CONCAT_WS(
        ':',
        COALESCE(p.current_product, 'unknown'),
        COALESCE(p.current_track, 'unknown')
      ) AS cohort_key,
      sa.question_id,
      sa.answered_at,
      sa.is_correct,
      CASE
        WHEN COALESCE(ss.session_kind, CASE ss.mode WHEN 'nauka' THEN 'intelligent' ELSE 'classic' END) = 'classic'
          THEN NULL
        ELSE sa.confidence
      END AS confidence,
      COALESCE(
        sa.rating_source,
        CASE
          WHEN COALESCE(ss.session_kind, CASE ss.mode WHEN 'nauka' THEN 'intelligent' ELSE 'classic' END) = 'classic'
            THEN 'observed'
          ELSE 'explicit'
        END
      ) AS rating_source,
      COALESCE(
        ss.session_kind,
        CASE ss.mode WHEN 'nauka' THEN 'intelligent' ELSE 'classic' END
      ) AS session_kind,
      COALESCE(sa.time_spent_seconds, 0) AS time_spent_seconds
    FROM public.session_answers sa
    JOIN public.study_sessions ss ON ss.id = sa.session_id
    JOIN public.profiles p ON p.id = ss.user_id
    WHERE sa.answered_at IS NOT NULL
    ORDER BY ss.user_id, sa.question_id, sa.answered_at, sa.id
  ) export_row
) TO 'exports/learning-replay-history.jsonl';
