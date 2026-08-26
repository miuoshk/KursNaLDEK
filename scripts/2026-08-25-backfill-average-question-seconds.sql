-- Jednorazowy cold start planu czasu z istniejących średnich per pytanie.
-- Uruchomić osobno od migracji schematu, aby móc kontrolować czas skanu.

WITH historical AS (
  SELECT
    user_id,
    AVG(LEAST(600, GREATEST(5, avg_time_seconds)))::real AS seconds
  FROM public.user_question_progress
  WHERE avg_time_seconds IS NOT NULL
    AND avg_time_seconds > 0
  GROUP BY user_id
)
UPDATE public.profiles profile
SET average_question_seconds = historical.seconds
FROM historical
WHERE profile.id = historical.user_id
  AND profile.average_question_seconds IS NULL;
