-- Dokańcza pokrycie memory v2 kartami, które są w user_question_progress
-- (last_answered_at NOT NULL), ale nie mają żadnego session_answers.
-- Źródło: seed-v1. Nie rusza v1 ani session_answers.
-- Uruchamiać tylko przy memory-v2-rollout = 0%.

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
  p.user_id,
  p.question_id,
  'memory-v2/ts-fsrs-5.4.1',
  '0592e942-4de5-4760-9dfb-3e08f67f1127'::uuid,
  CASE p.state
    WHEN 'new' THEN 'new'
    WHEN 'learning' THEN 'learning'
    WHEN 'review' THEN 'review'
    WHEN 'relearning' THEN 'relearning'
    ELSE 'review'
  END,
  GREATEST(COALESCE(p.stability, 0), 0),
  COALESCE(p.difficulty_rating, 5),
  GREATEST(COALESCE(p.elapsed_days, 0), 0),
  GREATEST(COALESCE(p.scheduled_days, 0), 0),
  GREATEST(COALESCE(p.learning_steps, 0), 0),
  GREATEST(COALESCE(p.reps, 0), 0),
  GREATEST(COALESCE(p.lapses, 0), 0),
  COALESCE(p.next_review, p.last_answered_at),
  p.last_answered_at,
  CASE p.last_rating
    WHEN 'Again' THEN 1
    WHEN 'Hard' THEN 2
    WHEN 'Good' THEN 3
    WHEN 'Easy' THEN 4
    ELSE 3
  END,
  'seed-v1',
  COALESCE(p.last_answered_at, now())
FROM public.user_question_progress p
WHERE p.last_answered_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_question_memory_v2 v
    WHERE v.user_id = p.user_id
      AND v.question_id = p.question_id
      AND v.scheduler_version = 'memory-v2/ts-fsrs-5.4.1'
  )
ON CONFLICT (user_id, question_id, scheduler_version) DO NOTHING;
