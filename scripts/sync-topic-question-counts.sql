-- Uruchom w Supabase SQL Editor: zsynchronizuj question_count w topics z faktyczną liczbą pytań.
UPDATE topics t
SET question_count = (
  SELECT COUNT(*)::int
  FROM questions q
  WHERE q.topic_id = t.id
    AND q.is_active = true
);
