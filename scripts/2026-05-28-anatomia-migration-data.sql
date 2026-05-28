-- Anatomia: migracja danych (FK + cleanup). Treść par: migrate-anatomia-apply.mjs
-- Uruchom PO sync treści (nowsza edycja w question_edits wygrywa).

-- session_answers
DELETE FROM public.session_answers sa_lek
WHERE sa_lek.question_id LIKE 'lek-ana-%'
  AND EXISTS (
    SELECT 1 FROM public.session_answers sa_canon
    WHERE sa_canon.session_id = sa_lek.session_id
      AND sa_canon.question_id = REPLACE(sa_lek.question_id, 'lek-', '')
  );

UPDATE public.session_answers
SET question_id = REPLACE(question_id, 'lek-', '')
WHERE question_id LIKE 'lek-ana-%';

UPDATE public.question_discussions
SET question_id = REPLACE(question_id, 'lek-', '')
WHERE question_id LIKE 'lek-ana-%';

UPDATE public.error_reports
SET question_id = REPLACE(question_id, 'lek-', '')
WHERE question_id LIKE 'lek-ana-%';

UPDATE public.question_edits
SET question_id = REPLACE(question_id, 'lek-', '')
WHERE question_id LIKE 'lek-ana-%';

-- saved_questions
DELETE FROM public.saved_questions sq_lek
WHERE sq_lek.question_id LIKE 'lek-ana-%'
  AND EXISTS (
    SELECT 1 FROM public.saved_questions sq_c
    WHERE sq_c.user_id = sq_lek.user_id
      AND sq_c.question_id = REPLACE(sq_lek.question_id, 'lek-', '')
  );

UPDATE public.saved_questions
SET question_id = REPLACE(question_id, 'lek-', '')
WHERE question_id LIKE 'lek-ana-%';

-- user_question_progress (merge par, potem przepnij)
UPDATE public.user_question_progress AS can
SET
  times_answered = COALESCE(can.times_answered, 0) + COALESCE(lek.times_answered, 0),
  times_correct = COALESCE(can.times_correct, 0) + COALESCE(lek.times_correct, 0),
  reps = GREATEST(COALESCE(can.reps, 0), COALESCE(lek.reps, 0)),
  lapses = COALESCE(can.lapses, 0) + COALESCE(lek.lapses, 0),
  correct_streak = GREATEST(COALESCE(can.correct_streak, 0), COALESCE(lek.correct_streak, 0)),
  wrong_streak = GREATEST(COALESCE(can.wrong_streak, 0), COALESCE(lek.wrong_streak, 0)),
  is_leech = (can.is_leech OR lek.is_leech),
  leech_count = GREATEST(COALESCE(can.leech_count, 0), COALESCE(lek.leech_count, 0)),
  elapsed_days = GREATEST(COALESCE(can.elapsed_days, 0), COALESCE(lek.elapsed_days, 0)),
  scheduled_days = GREATEST(COALESCE(can.scheduled_days, 0), COALESCE(lek.scheduled_days, 0)),
  stability = CASE WHEN COALESCE(lek.reps, 0) > COALESCE(can.reps, 0) THEN lek.stability ELSE can.stability END,
  difficulty_rating = CASE WHEN COALESCE(lek.reps, 0) > COALESCE(can.reps, 0) THEN lek.difficulty_rating ELSE can.difficulty_rating END,
  state = CASE WHEN COALESCE(lek.reps, 0) > COALESCE(can.reps, 0) THEN lek.state ELSE can.state END,
  next_review = CASE WHEN COALESCE(lek.reps, 0) > COALESCE(can.reps, 0) THEN lek.next_review ELSE can.next_review END,
  last_answered_at = CASE WHEN COALESCE(lek.reps, 0) > COALESCE(can.reps, 0) THEN lek.last_answered_at ELSE can.last_answered_at END,
  last_confidence = CASE WHEN COALESCE(lek.reps, 0) > COALESCE(can.reps, 0) THEN lek.last_confidence ELSE can.last_confidence END,
  avg_time_seconds = CASE WHEN COALESCE(lek.reps, 0) > COALESCE(can.reps, 0) THEN lek.avg_time_seconds ELSE can.avg_time_seconds END,
  last_rating = CASE WHEN COALESCE(lek.reps, 0) > COALESCE(can.reps, 0) THEN lek.last_rating ELSE can.last_rating END
FROM public.user_question_progress AS lek
WHERE lek.question_id LIKE 'lek-ana-%'
  AND can.user_id = lek.user_id
  AND can.question_id = REPLACE(lek.question_id, 'lek-', '');

DELETE FROM public.user_question_progress lek
WHERE lek.question_id LIKE 'lek-ana-%'
  AND EXISTS (
    SELECT 1 FROM public.user_question_progress can
    WHERE can.user_id = lek.user_id
      AND can.question_id = REPLACE(lek.question_id, 'lek-', '')
  );

UPDATE public.user_question_progress
SET question_id = REPLACE(question_id, 'lek-', '')
WHERE question_id LIKE 'lek-ana-%';

-- cleanup
UPDATE public.questions q
SET topic_id = REPLACE(q.topic_id, 'LEK-ANA-', 'ANA-')
WHERE q.topic_id LIKE 'LEK-ANA-%';

DELETE FROM public.questions WHERE id LIKE 'lek-ana-%';
DELETE FROM public.topics WHERE id LIKE 'LEK-ANA-%';

UPDATE public.topics t
SET question_count = sub.cnt
FROM (
  SELECT topic_id, COUNT(*)::int AS cnt
  FROM public.questions
  WHERE is_active = true AND topic_id LIKE 'ANA-%'
  GROUP BY topic_id
) sub
WHERE t.id = sub.topic_id;
